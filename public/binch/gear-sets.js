/* La Binch — Multi-role gear locker; purely local saved setups. No live gear switching. */
(()=>{'use strict';
const KEY='binch.gear.sets.v1.',$=id=>document.getElementById(id);
const ROLES=[['bear','Ours · tank/offtank'],['cat','Félin · DPS'],['heal','Soigneur'],['custom','Personnalisé']];
const SLOTS={1:'Tête',2:'Cou',3:'Épaules',4:'Chemise',5:'Torse',6:'Taille',7:'Jambes',8:'Pieds',9:'Poignets',10:'Mains',11:'Anneau 1',12:'Anneau 2',13:'Bijou 1',14:'Bijou 2',15:'Dos',16:'Main droite',17:'Main gauche',18:'Distance',19:'Tabard'};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const read=(k,f)=>{try{return JSON.parse(localStorage.getItem(k))??f}catch{return f}};
const key=p=>KEY+encodeURIComponent(String(p.data?.pseudo||'').trim().toLocaleLowerCase('fr'))+'-'+encodeURIComponent(String(p.race||''))+'-'+encodeURIComponent(String(p.classe||''));
function character(){const p=read('grimoire.hub.v3',{}),last=read('grimoire.bridge.last',{});const name=String(p.data?.pseudo||'').trim(),same=!!name&&String(last.name||'').trim().toLocaleLowerCase('fr')===name.toLocaleLowerCase('fr');return {p,last,same,name,equip:same&&Array.isArray(last.equipment)?last.equipment:[]}}
function sets(){return read(key(character().p),[])}
function persist(list){try{localStorage.setItem(key(character().p),JSON.stringify(list.slice(0,12)))}catch{};render()}
const get=()=>String($('#binch-gear-set-selected')?.value||'');
function compare(saved,equip){
 const actual=new Map(equip.map(x=>[Number(x.slot),Number(x.id)]));
 const differences=saved.items.filter(x=>actual.has(x.slot)&&actual.get(x.slot)!==x.id);
 const notAvailable=saved.items.filter(x=>!actual.has(x.slot));
 return {differences,notAvailable,total:saved.items.length};
}
function render(){
 const host=$('binch-gear-sets');if(!host||!host.isConnected)return;
 const c=character(),entries=sets(),select=$('binch-gear-set-selected'),choice=get();
 host.querySelector('#binch-gear-set-status').textContent=c.same?'Équipement observé chez '+c.name+' · '+c.equip.length+' emplacements importés · '+(c.last.updated?new Date(c.last.updated).toLocaleString('fr-FR'):'date inconnue'):'Aucun équipement fiable pour le personnage sélectionné. Les ensembles sauvegardés restent visibles.';
 select.replaceChildren(new Option('Choisir un ensemble',''),...entries.map(x=>new Option(x.name+' · '+(ROLES.find(r=>r[0]===x.role)?.[1]||x.role),x.id)));
 select.value=entries.some(x=>x.id===choice)?choice:'';
 const set=entries.find(x=>x.id===select.value);
 if(!set){$('#binch-gear-set-preview').innerHTML='<p>Crée un ensemble depuis ton équipement importé, ou sélectionne un ensemble existant.</p>';return}
 const diff=c.same?compare(set,c.equip):null;
 $('#binch-gear-set-preview').innerHTML='<h4>'+esc(set.name)+'</h4><p>'+esc(ROLES.find(r=>r[0]===set.role)?.[1]||'Rôle libre')+' · '+set.items.length+' emplacements sauvegardés · '+esc(set.createdAt?new Date(set.createdAt).toLocaleString('fr-FR'):'Date inconnue')+'</p>'+(diff?'<p>'+diff.differences.length+' équipement(s) différent(s) du dernier import · '+diff.notAvailable.length+' emplacement(s) non remonté(s) : comparaison impossible.</p>':'<p>Connecte le personnage correspondant pour comparer cet ensemble.</p>')+
 '<div class="binch-gear-set-list">'+set.items.map(x=>{
  const current=c.equip.find(v=>Number(v.slot)===x.slot),differs=current&&Number(current.id)!==x.id;
  return '<article><small>'+esc(SLOTS[x.slot]||('Emplacement '+x.slot))+'</small><strong>'+esc(x.name||('Objet #'+x.id))+'</strong><span>'+(differs?'Actuellement : '+esc(current.name||('Objet #'+current.id)):'')+'</span></article>';
 }).join('')+'</div>';
}
function mount(){
 const page=$('page-equipment'),host=page?.querySelector('.binch-equipment');if(!host||$('binch-gear-sets'))return;
 const box=document.createElement('section');box.id='binch-gear-sets';box.className='binch-gear-sets';
 box.innerHTML='<header><div><div class="eyebrow">ARSENAL / SPÉCIALISATIONS</div><h3>Mes ensembles d’équipement</h3><p>Enregistre et compare des équipements de tank, félin ou soins. Ces ensembles sont des repères locaux : aucun changement d’armure dans WoW.</p></div></header><form id="binch-gear-set-form"><input name="name" maxlength="50" required placeholder="Nom du set" aria-label="Nom de l’ensemble"><select name="role" aria-label="Rôle de l’ensemble">'+ROLES.map(r=>'<option value="'+r[0]+'">'+r[1]+'</option>').join('')+'</select><button type="submit">Sauver l’équipement actuel</button></form><p id="binch-gear-set-status"></p><div class="binch-gear-set-controls"><select id="binch-gear-set-selected" aria-label="Ensemble sauvegardé"></select><button id="binch-gear-set-delete" type="button">Supprimer l’ensemble</button><button id="binch-gear-set-copy" type="button">Copier pour Discord</button></div><div id="binch-gear-set-preview"></div>';
 host.querySelector('.binch-equipment-layout')?.before(box);
 $('#binch-gear-set-form').onsubmit=e=>{
  e.preventDefault();const f=e.target,c=character(),name=String(new FormData(f).get('name')||'').trim().slice(0,50),role=String(new FormData(f).get('role')||'custom');
  if(!c.same||!c.equip.length){alert('Importe d’abord un équipement réel pour ce personnage.');return}
  if(!name||!ROLES.some(r=>r[0]===role))return;
  const current=sets();if(current.length>=12){alert('Maximum de 12 ensembles pour ce personnage.');return}
  current.push({id:crypto?.randomUUID?.()||Date.now().toString(36),name,role,createdAt:new Date().toISOString(),items:c.equip.filter(x=>Number.isInteger(Number(x.slot))&&Number(x.slot)>0&&Number(x.id)>0).map(x=>({slot:Number(x.slot),id:Number(x.id),name:String(x.name||'').slice(0,110)})).slice(0,25)});
  persist(current);f.reset();
 };
 $('#binch-gear-set-selected').onchange=render;
 $('#binch-gear-set-delete').onclick=()=>{const chosen=get();if(!chosen||!confirm('Supprimer cet ensemble enregistré ?'))return;persist(sets().filter(x=>x.id!==chosen))};
 $('#binch-gear-set-copy').onclick=()=>{const x=sets().find(x=>x.id===get());if(!x)return;const text=['LA BINCH · SET '+x.name,'Rôle : '+(ROLES.find(r=>r[0]===x.role)?.[1]||x.role),...x.items.map(i=>(SLOTS[i.slot]||i.slot)+' : '+i.name+' (#'+i.id+')')].join('\n');if(navigator.clipboard?.writeText){navigator.clipboard.writeText(text).catch(()=>prompt('Copier',text))}else prompt('Copier',text)};
 page.addEventListener('click',e=>{if(e.target.closest('#binch-equipment-sync'))render()});
 document.querySelector('#app nav.nav [data-page="equipment"]')?.addEventListener('click',render);
 document.addEventListener('grimoire:sync',render);
 document.addEventListener('binch:gear-sets-updated',render);
 window.addEventListener('storage',e=>{if(e.key?.startsWith(KEY)||e.key==='grimoire.bridge.last')render()});
 render();
}
const start=()=>setTimeout(mount,0);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
/* La Binch — progression par zone, indépendante de GrimoireSync. */
(()=>{'use strict';
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const PREFIX='binch.zone.plan.v1.',MAX_TASKS=100;
const allies=['Humain','Nain','Elfe','Gnome'],hordes=['Orc','Tauren','Troll','MortVivant'];
const read=(k,f)=>{try{return JSON.parse(localStorage.getItem(k))??f}catch{return f}};
let storageKey='',state={zone:'',done:{},tasks:[]},filter='recommended';
function profile(){const p=read('grimoire.hub.v3',{});return {name:String(p.data?.pseudo||'Aventurier').trim(),race:String(p.race||''),cls:String(p.classe||''),level:Math.max(1,Math.min(60,Number(p.data?.level)||1))}}
function faction(p){return allies.includes(p.race)?'Alliance':hordes.includes(p.race)?'Horde':'Neutre'}
function key(p){return PREFIX+[p.name,p.race,p.cls].map(x=>encodeURIComponent(x.toLocaleLowerCase('fr'))).join('.')}
function zones(){return Array.isArray(window.GRIMOIRE_ZONES)?window.GRIMOIRE_ZONES.filter(z=>z&&typeof z.id==='string'&&typeof z.name==='string'&&Array.isArray(z.levels)&&Number.isFinite(Number(z.levels[0]))&&Number.isFinite(Number(z.levels[1]))):[]}
function load(p){const k=key(p);if(storageKey===k)return;storageKey=k;const d=read(k,{});state={zone:typeof d.zone==='string'?d.zone:'',done:d.done&&typeof d.done==='object'&&!Array.isArray(d.done)?d.done:{},tasks:Array.isArray(d.tasks)?d.tasks.slice(0,MAX_TASKS).filter(t=>t&&typeof t.id==='string'&&typeof t.zone==='string'&&typeof t.title==='string'&&t.title.trim()&&t.title.length<=120&&typeof t.done==='boolean').map(t=>({id:t.id.slice(0,50),zone:t.zone.slice(0,100),title:t.title.trim(),done:t.done})):[]}}
function save(){localStorage.setItem(storageKey,JSON.stringify(state));document.dispatchEvent(new CustomEvent('binch:zone-change',{detail:{zone:state.zone}}))}
function suit(z,p){
 const own=faction(p);
 const fac=z.faction||'Neutre';
 if(fac!=='Neutre'&&fac!=='Mixte'&&own!=='Neutre'&&fac!==own)return -999;
 const lo=Number(z.levels[0]),hi=Number(z.levels[1]),lv=p.level;
 let score=(lv>=lo&&lv<=hi)?100:(lv<lo?Math.max(0,75-(lo-lv)*14):Math.max(0,65-(lv-hi)*18));
 if(fac===own)score+=9;
 if(lo<=lv+2&&hi>=lv)score+=10;
 return score;
}
function options(p){return zones().map(z=>({...z,score:suit(z,p)})).filter(z=>filter!=='recommended'||z.score>=60).sort((a,b)=>b.score-a.score||a.levels[0]-b.levels[0]||a.name.localeCompare(b.name,'fr'))}
function init(){
 const page=$('page-progression');if(!page||$('binch-zone-planner'))return;
 const box=document.createElement('section');box.id='binch-zone-planner';box.className='panel section';
 box.innerHTML='<div class="eyebrow">CARNET DE VOYAGE / LEVELING</div><h2>Organiser mon parcours par zone</h2>'+
 '<p class="muted">Le classement est indicatif : niveau et faction du profil manuel. Il ne prétend pas connaître les quêtes actives ou les parcours exacts sur Forever.</p>'+
 '<div class="binch-zone-planner-head"><label>Liste des zones<select id="binch-zone-filter"><option value="recommended">Adaptées au personnage</option><option value="all">Toutes les zones</option></select></label><label>Zone à préparer<select id="binch-zone-choice"></select></label></div>'+
 '<div id="binch-zone-summary" role="status" aria-live="polite"></div><div class="binch-zone-roadmap"><h3>Parcours conseillé</h3><p class="muted">Suggestions indicatives selon ton niveau et ta faction. Choisir une zone ne valide aucune quête.</p><div id="binch-zone-recommendations"></div></div>'+
 '<div class="binch-zone-planner-actions"><button type="button" id="binch-zone-open-map">Ouvrir dans l’Atlas</button><button type="button" id="binch-zone-copy">Copier mon itinéraire</button></div>'+
 '<form id="binch-zone-task-form"><label>Ajouter une étape manuelle dans cette zone<input name="title" required maxlength="120" placeholder="Ex. : Rendre les quêtes au camp"></label><button type="submit">Ajouter l’étape</button></form>'+
 '<div id="binch-zone-tasks"></div><div id="binch-zone-progress"></div>'+
 '<small class="muted">Les objectifs ajoutés ici sont stockés uniquement dans ton navigateur, séparément pour chaque personnage.</small>';
 const atlas=$('zone-browser');if(atlas)page.insertBefore(box,atlas);else page.append(box);
 $('binch-zone-filter').onchange=e=>{filter=e.target.value;render()};
 $('binch-zone-recommendations').addEventListener('click',e=>{
  const button=e.target.closest('[data-zone-recommend]');if(!button)return;
  const id=button.dataset.zoneRecommend;
  if(!zones().some(z=>z.id===id))return;
  state.zone=id;save();render();
  $('binch-zone-summary').scrollIntoView({behavior:'smooth',block:'nearest'});
 });
 $('binch-zone-choice').onchange=e=>{state.zone=e.target.value;save();render()};
 $('binch-zone-task-form').onsubmit=e=>{
  e.preventDefault();const p=profile();load(p);
  const title=String(new FormData(e.currentTarget).get('title')||'').trim();
  if(!title||title.length>120||!state.zone||state.tasks.length>=MAX_TASKS)return;
  state.tasks.push({id:Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,10),zone:state.zone,title,done:false});
  e.currentTarget.reset();save();render();
 };
 $('binch-zone-tasks').addEventListener('click',e=>{
  const b=e.target.closest('[data-zone-task]');if(!b)return;
  const row=state.tasks.find(x=>x.id===b.dataset.zoneTask);if(!row)return;
  if(b.dataset.action==='remove'){
   if(!confirm('Retirer cette étape du carnet ?'))return;
   state.tasks=state.tasks.filter(x=>x!==row);
  }else row.done=!row.done;
  save();render();
 });
 $('binch-zone-copy').onclick=async()=>{
  const p=profile();load(p);
  const z=zones().find(z=>z.id===state.zone);if(!z)return;
  const steps=state.tasks.filter(t=>t.zone===z.id);
  const lines=['LA BINCH — ITINÉRAIRE PERSONNEL',p.name+' · niveau '+p.level,z.name+' ('+z.levels.join('–')+')',z.continent||'',...steps.map(t=>(t.done?'[x] ':'[ ] ')+t.title)];
  const text=lines.join('\n');
  try{await navigator.clipboard.writeText(text);$('binch-zone-copy').textContent='Itinéraire copié ✓'}catch{window.prompt('Copier l’itinéraire',text)}
 };
 $('binch-zone-open-map').onclick=()=>{
  const z=zones().find(z=>z.id===state.zone);if(!z)return;
  const input=$('zone-search'),region=$('zone-browser');
  if(input){input.value=z.name;input.dispatchEvent(new Event('input',{bubbles:true}))}
  if(region)region.scrollIntoView({behavior:'smooth',block:'start'});
 };
 document.addEventListener('grimoire:sync',render);document.addEventListener('binch:profile-changed',render);
 window.addEventListener('storage',render);render();
}
function render(){
 if(!$('binch-zone-choice'))return;
 const p=profile();load(p);
 const all=zones();if(!all.length){$('binch-zone-summary').textContent='Catalogue de zones indisponible.';return}
 const list=options(p);
 const previously=state.zone;
 if(!all.some(z=>z.id===state.zone)){state.zone=list[0]?.id||all[0].id;save()}
 const chosen=all.find(z=>z.id===state.zone);
 const display=[...list];if(chosen&&!display.some(z=>z.id===chosen.id))display.unshift({...chosen,score:suit(chosen,p)});
 $('binch-zone-filter').value=filter;
 const select=$('binch-zone-choice');
 select.innerHTML=display.map(z=>'<option value="'+esc(z.id)+'"'+(z.id===state.zone?' selected':'')+'>'+esc(z.name)+' (nv. '+z.levels.join('–')+')</option>').join('');
 const score=suit(chosen,p);
 const proposals=all.map(z=>({...z,score:suit(z,p)})).filter(z=>z.score>=0).sort((a,b)=>b.score-a.score||a.levels[0]-b.levels[0]).slice(0,7);
 $('binch-zone-recommendations').innerHTML=proposals.length?proposals.map((z,i)=>{
  const tasks=state.tasks.filter(t=>t.zone===z.id),completed=tasks.filter(t=>t.done).length;
  const progress=tasks.length?completed+' / '+tasks.length+' étapes manuelles': 'Aucune étape renseignée';
  const label=z.score>=95?'Adaptée':z.score>=60?'À préparer':'Plus tard';
  return '<button type="button" class="binch-zone-roadmap-card'+(z.id===state.zone?' active':'')+'" data-zone-recommend="'+esc(z.id)+'" aria-pressed="'+(z.id===state.zone)+'"><span class="binch-zone-roadmap-index">'+(i+1)+'</span><span class="binch-zone-roadmap-main"><strong>'+esc(z.name)+'</strong><small>Niv. '+z.levels.join('–')+' · '+esc(z.continent||'')+'</small><em>'+progress+'</em></span><span class="binch-zone-roadmap-status">'+label+'</span></button>';
 }).join(''):'<p class="muted">Aucune recommandation compatible avec la faction de ton profil pour ce niveau.</p>';
 $('binch-zone-summary').innerHTML='<strong>'+esc(chosen.name)+'</strong><p>'+esc(chosen.continent||'')+' · Niveaux '+chosen.levels.join('–')+' · '+esc(chosen.faction||'Neutre')+'</p><p>'+(score>=95?'Niveaux cohérents avec ton profil.':score>=60?'Zone proche de ton niveau, préparation conseillée.':'Zone moins adaptée au profil actuel — décision manuelle.')+'</p>';
 const tasks=state.tasks.filter(t=>t.zone===state.zone),done=tasks.filter(t=>t.done).length;
 $('binch-zone-progress').textContent=done+' / '+tasks.length+' étapes terminées dans cette zone.';
 $('binch-zone-tasks').innerHTML=tasks.length?tasks.map(t=>'<div class="binch-zone-task'+(t.done?' done':'')+'"><button type="button" data-zone-task="'+esc(t.id)+'" data-action="toggle" aria-pressed="'+t.done+'">'+(t.done?'✓':'○')+'</button><span>'+esc(t.title)+'</span><button type="button" data-zone-task="'+esc(t.id)+'" data-action="remove" aria-label="Supprimer '+esc(t.title)+'">×</button></div>').join(''):'<p class="muted">Aucune étape personnelle enregistrée pour cette zone.</p>';
 if(previously!==state.zone)document.dispatchEvent(new CustomEvent('binch:zone-change',{detail:{zone:state.zone}}));
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
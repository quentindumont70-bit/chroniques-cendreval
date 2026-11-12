/* La Binch — encyclopedia of the nine real WoW Forever talent trees.
 * Reads build-time sanitized CC BY 4.0 snapshots; remote fallback per class.
 * No fictitious rank allocations for classes without sourced builds.
 */
(()=>{'use strict';
const $=id=>document.getElementById(id);
const map={Guerrier:'warrior',Paladin:'paladin',Chasseur:'hunter',Voleur:'rogue',Prêtre:'priest',Chaman:'shaman',Mage:'mage',Démoniste:'warlock',Druide:'druid'};
const names=Object.keys(map),cache=new Map(),errors=new Map();
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const icon=s=>/^[a-z0-9_]+$/i.test(String(s||''))?'https://wow.zamimg.com/images/wow/icons/large/'+s+'.jpg':'';
const safeName=s=>names.includes(s)?s:'Druide';
const valid=data=>Array.isArray(data?.talents?.trees)&&data.talents.trees.length===3&&data.talents.trees.every(t=>Array.isArray(t.talents)&&t.talents.length>=9&&t.talents.every(x=>Number.isInteger(Number(x.row))&&Number(x.row)>=1&&Number(x.row)<=7&&Number.isInteger(Number(x.col))&&Number(x.col)>=1&&Number(x.col)<=4&&Number.isInteger(Number(x.max))&&Number(x.max)>0));
let chosen='Guerrier',token=0;
async function load(cls){
 const id=map[cls];if(cache.has(id))return cache.get(id);
 const urls=['./forever-talents-'+id+'.json','https://talentsforever.com/export/'+id+'.json'];
 for(const url of urls){try{const ctrl=new AbortController(),tid=setTimeout(()=>ctrl.abort(),6500);let res;try{res=await fetch(url,{signal:ctrl.signal})}finally{clearTimeout(tid)}
  if(!res.ok)continue;const data=await res.json();
  if(!valid(data)||String(data.class||'').toLowerCase()!==id)continue;
  cache.set(id,data);return data;
 }catch{}}
 errors.set(id,'Données du client non accessibles dans cette session.');return null;
}
function render(data){
 const host=$('binch-specs-nine-display');if(!host)return;
 const cls=safeName(chosen),slug=map[cls],base='https://armorywowforever.com/fr/talents/'+slug;
 if(!data){host.innerHTML='<p>Les données des arbres '+esc(cls)+' ne sont pas disponibles pour cette session. Aucun talent de remplacement n’est inventé.</p><p><a href="'+base+'" target="_blank" rel="noopener noreferrer">Ouvrir le calculateur WoW Forever</a></p>';return}
 const sections=data.talents.trees.map(tree=>{
  const cells=tree.talents.map(t=>{
   const img=icon(t.icon),row=Number(t.row),col=Number(t.col),name=esc(t.name);
   return '<button class="binch-tree-node binch-nine-node" type="button" style="--tree-row:'+row+';--tree-col:'+col+'" data-name="'+name+'" data-desc="'+esc(t.desc?.[0]||'Description indisponible')+'" data-max="'+Number(t.max)+'" aria-label="'+name+', '+Number(t.max)+' rangs"><img loading="lazy" decoding="async" src="'+img+'" alt=""><span>0/'+Number(t.max)+'</span></button>';
  }).join('');
  return '<section class="binch-tree-panel"><header><h4>'+esc(tree.name)+'</h4><strong>'+tree.talents.length+' talents</strong></header><div class="binch-tree-cells">'+cells+'</div></section>';
 }).join('');
 host.innerHTML='<p>Arbres réels du client WoW Forever, sans points préattribués. Clique un talent pour consulter son effet. Les recommandations de builds restent distinctes de ces données brutes.</p><div class="binch-tree-grid">'+sections+'</div><div id="binch-nine-tooltip" class="binch-tree-description" role="status">Choisis un talent pour afficher ses détails.</div><p class="binch-tree-license">Données : <a target="_blank" rel="noopener noreferrer" href="https://talentsforever.com/export/'+slug+'.json">Talents Forever</a> · licence CC BY 4.0 · export '+esc(data.generated||'date non fournie')+'. Icônes © Blizzard. <a target="_blank" rel="noopener noreferrer" href="'+base+'">Calculateur Forever</a> pour répartir les points.</p>';
 host.addEventListener('click',e=>{const btn=e.target.closest('[data-name]');if(!btn)return;const label=btn.dataset.name+' — '+btn.dataset.max+' rang(s) : '+btn.dataset.desc;const target=$('binch-nine-tooltip');if(target)target.textContent=label},{once:true});
 // Delegation must remain active after every user click.
 host.onclick=e=>{const b=e.target.closest('[data-name]');if(b){const d=$('binch-nine-tooltip');if(d)d.textContent=b.dataset.name+' — '+b.dataset.max+' rang(s) : '+b.dataset.desc}};
}
async function display(){
 const holder=$('binch-specs-nine-display');if(!holder)return;
 const t=++token;holder.innerHTML='<p>Chargement des arbres sourcés '+esc(chosen)+'…</p>';
 const data=await load(chosen);if(t!==token)return;render(data);
}
function mount(){
 const page=$('page-specs'),anchor=$('binch-specs-summary');if(!page||!anchor||$('binch-specs-nine'))return false;
 const section=document.createElement('section');section.id='binch-specs-nine';section.className='binch-specs-nine';
 section.innerHTML='<header><div><span class="eyebrow">L’ATLAS DES ARBRES FOREVER</span><h3>Les neuf classes · talents réels</h3><p>Explore les trois arbres de chaque classe, dans leur disposition du client, avec leurs icônes et descriptions officielles. Aucun build inventé.</p></div></header><div class="binch-nine-class-picker" id="binch-nine-class-picker">'+names.map(name=>'<button type="button" data-nine-class="'+esc(name)+'">'+esc(name)+'</button>').join('')+'</div><div id="binch-specs-nine-display"></div>';
 anchor.after(section);
 $('binch-nine-class-picker').onclick=e=>{const btn=e.target.closest('[data-nine-class]');if(!btn)return;chosen=safeName(btn.dataset.nineClass);$('binch-nine-class-picker').querySelectorAll('button').forEach(x=>x.classList.toggle('active',x===btn));display()};
 const selected=$('binch-nine-class-picker').querySelector('[data-nine-class="Druide"]');chosen='Druide';selected?.classList.add('active');
 const specs=$('binch-specs-class');
 specs?.addEventListener('change',e=>{if(map[e.target.value]){chosen=e.target.value;$('binch-nine-class-picker').querySelectorAll('button').forEach(x=>x.classList.toggle('active',x.dataset.nineClass===chosen));display()}});
 document.querySelector('#app nav.nav [data-page="specs"]')?.addEventListener('click',()=>{if(!cache.has(map[chosen]))display()});
 display();return true;
}
function init(){if(mount())return;const main=document.querySelector('#app main');if(!main)return;const observer=new MutationObserver(()=>{if(mount())observer.disconnect()});observer.observe(main,{childList:true});setTimeout(()=>observer.disconnect(),12000)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
/* La Binch — Conseiller d'outillage des métiers.
   Informations générales de WoW Forever sourcées, jamais des inventaires simulés.
   L'inventaire de GrimoireSync est une photographie locale et peut être obsolète.
*/
(()=>{'use strict';
 const $=s=>document.querySelector(s),STORE='grimoire.hub.v3',BRIDGE='grimoire.bridge.last';
 const clean=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase();
 function state(k){try{return JSON.parse(localStorage.getItem(k))||{}}catch{return {}}}
 function activeProfile(){const p=state(STORE),b=state(BRIDGE),name=String(p?.data?.pseudo||p.name||'').trim();
  return{p,b,matched:!!name&&clean(name)===clean(b.name),name};
 }
 function jobs(){
  const {p,b,matched}=activeProfile();
  const chosen=Array.isArray(p.jobs)?p.jobs.map(clean):[];
  if(matched){
   const craft=state('grimoire.craft.v1'),id=String(p?.data?.pseudo||p.name||'').trim().toLowerCase()+'-'+p.race+'-'+p.classe;
   const skills=craft.imports?.[id]?.skills||{};
   for(const job of Object.keys(skills))chosen.push(clean(job));
  }
  return[...new Set(chosen)];
 }
 const need=(all,names)=>names.some(n=>all.includes(clean(n)));
 function presentItems(b,matched){
  if(!matched||!Array.isArray(b.inventory))return new Set();
  return new Set(b.inventory.filter(x=>Number(x.count)>0).map(x=>clean(x.name)));
 }
 const TOOLS=[
  {id:'pick',name:'Pioche de mineur',aliases:['Mining Pick','Pioche de mineur','Pioche'],tags:['Minage'],note:'Outil de récolte. Garde-la dans les sacs pour les filons qui exigent une pioche.'},
  {id:'hammer',name:'Marteau de forgeron',aliases:['Blacksmith Hammer','Marteau de forgeron'],tags:['Ingénierie','Forge'],note:'INDISPENSABLE pour de nombreuses recettes d’Ingénierie, même sans être forgeron. Aucun besoin de l’équiper : garde-le dans les sacs.'},
  {id:'spanner',name:'Clé plate',aliases:['Arclight Spanner','Clé plate','Cle plate'],tags:['Ingénierie'],note:'Outil d’Ingénierie, fabriqué une fois puis réutilisé. Utile à partir des premières fabrications intermédiaires.'},
  {id:'adjustor',name:'Micro-ajusteur gyromatique',aliases:['Gyromatic Micro-Adjustor','Micro-ajusteur gyromatique','Micro ajusteur gyromatique'],tags:['Ingénierie'],note:'Outil supplémentaire pour les recettes avancées. À fabriquer quand la compétence le demande.'}
 ];
 function render(){
  const page=$('#page-metiers');if(!page)return;
  let panel=$('#binch-trade-toolkit');
  if(!panel){panel=document.createElement('section');panel.id='binch-trade-toolkit';panel.className='panel section binch-trade-toolkit';const first=page.firstElementChild;first?first.before(panel):page.append(panel)}
  const {p,b,matched}=activeProfile(),list=jobs(),mining=need(list,['Minage','Mining']),engineering=need(list,['Ingénierie','Engineering']),smithing=need(list,['Forge','Blacksmithing']);
  let requested=TOOLS.filter(t=>t.tags.some(tag=>tag==='Minage'?mining:tag==='Ingénierie'?engineering:smithing));
  const inventory=presentItems(b,matched);
  const date=b.updated?new Date(b.updated):null;
  const fresh=date&&Number.isFinite(+date)?date.toLocaleString('fr-FR'):'date inconnue';
  const confidence=matched&&Array.isArray(b.inventory)?'Lecture d’un inventaire importé ('+fresh+'). La présence dans les sacs peut avoir changé depuis le dernier /reload.':'Aucun inventaire correspondant à ce personnage : outils à contrôler en jeu.';
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  if(!requested.length){panel.hidden=true;return}panel.hidden=false;
  panel.innerHTML='<header><div class="eyebrow">TRousse d’artisan · WoW Forever</div><h2>Les outils à garder dans tes sacs</h2><p>Les professions détectées : '+esc(list.join(' · ')||'non connues')+'. Les outils ne sont pas consommés à chaque fabrication.</p></header>'+
   '<div class="binch-toolkit-grid">'+requested.map(t=>{
    const found=t.aliases.some(a=>inventory.has(clean(a)));
    const check=matched&&Array.isArray(b.inventory)?found?'Présent au dernier import':'Non repéré au dernier import':'À confirmer en jeu';
    return '<article class="binch-toolkit-card" data-tool="'+t.id+'" data-presence="'+(found?'yes':'unknown')+'"><span class="binch-toolkit-sigil">'+({pick:'⛏',hammer:'⚒',spanner:'⚙',adjustor:'✧'}[t.id])+'</span><div><strong>'+esc(t.name)+'</strong><span class="binch-toolkit-state">'+esc(check)+'</span><p>'+esc(t.note)+'</p></div></article>'
   }).join('')+'</div>'+
   '<p class="binch-toolkit-confidence">'+esc(confidence)+' Sources : <a href="https://www.wowhead.com/classic/fr/guide/engineering-leveling-1-300-wow-classic" target="_blank" rel="noopener noreferrer">Wowhead (outils d’Ingénierie)</a> et <a href="https://www.warcrafttavern.com/forever/guides/engineering" target="_blank" rel="noopener noreferrer">Warcraft Tavern (Forever)</a>.</p>';
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',render);else render();
 document.addEventListener('grimoire:sync',render);
 window.addEventListener('storage',event=>{if(!event.key||[STORE,BRIDGE].includes(event.key))render()});
 document.addEventListener('click',event=>{if(event.target.closest('#app nav.nav [data-page="metiers"]'))setTimeout(render,0)});
})();

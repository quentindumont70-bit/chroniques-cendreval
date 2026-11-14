/* La Binch Ultimate — unified player briefing; works without an API key or login.
   Deliberately read-only for WoW data, and only marks manual suggestions dismissed. */
(()=>{'use strict';
const $=id=>document.getElementById(id);
const read=(key,f)=>{try{return JSON.parse(localStorage.getItem(key))??f}catch{return f}};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const MODES=[['balanced','Équilibré'],['solo','Quêtes & exploration'],['dungeon','Donjons & groupe'],['profession','Métiers & artisanat']];
const MAX=32;let mode='balanced',dismissed=[],lastPlan=null,currentId='';
function identity(p){return [p.data?.pseudo||'aventurier',p.race||'',p.classe||''].map(x=>encodeURIComponent(String(x).trim().toLocaleLowerCase('fr'))).join('.')}
function settingKey(id){return 'binch.ultimate.briefing.v1.'+id}
function loadSettings(id){
 if(id===currentId)return;
 currentId=id;const saved=read(settingKey(id),{});
 mode=MODES.some(x=>x[0]===saved.mode)?saved.mode:'balanced';
 dismissed=Array.isArray(saved.dismissed)?saved.dismissed.filter(x=>typeof x==='string').slice(0,MAX):[];
}
function save(){try{localStorage.setItem(settingKey(currentId),JSON.stringify({mode,dismissed}))}catch{}}
function syncState(profile){
 const imp=read('grimoire.bridge.last',{}),name=String(profile.data?.pseudo||'').trim().toLocaleLowerCase('fr'),match=!!name&&String(imp.name||'').trim().toLocaleLowerCase('fr')===name;
 return {match,level:match&&Number.isInteger(Number(imp.level))?Number(imp.level):Number(profile.data?.level)||1,updated:match?imp.updated||imp.at||imp.date:null,zone:match?String(imp.zone||''):''};
}
function customObjectives(id){
 const key='binch.custom.objectives.v1.'+id;const items=read(key,[]);
 return Array.isArray(items)?items.slice(0,60):[];
}
function plan(){
 const p=read('grimoire.hub.v3',{}),id=identity(p);loadSettings(id);
 const sync=syncState(p),d=window.BinchDiscoveries?.recommendations?.()||[];
 const profileJobs=Array.isArray(p.jobs)?p.jobs:Array.isArray(p.metiers)?p.metiers:[];
 const input={className:p.classe||'',race:p.race||'',level:sync.level,imported:sync.match,mode,discoveries:d,professions:profileJobs,objectives:customObjectives(id),completed:dismissed};
 const result=window.BinchJourneyEngine?.generate(input);
 return result?{...result,sync,identity:id}:null;
}
function go(page){
 if(page==='hub'){document.querySelector('#app nav.nav [data-page="hub"]')?.click();$('binch-personal-objectives')?.scrollIntoView({behavior:'smooth',block:'start'});return}
 const tab=document.querySelector('#app nav.nav [data-page="'+page+'"]');if(tab)tab.click();
 else if(page==='metiers')document.querySelector('#app nav.nav [data-page="crafting"]')?.click();
}
function render(){
 const root=$('binch-ultimate-briefing');if(!root)return;
 lastPlan=plan();if(!lastPlan){root.textContent='Le moteur de planification est indisponible. Les autres modules restent accessibles.';return}
 const {profile,actions,next,sync}=lastPlan;
 $('binch-ultimate-level').textContent='Niveau '+profile.level+(sync.zone?' · '+sync.zone:'')+(sync.match?' · dernier import connu':' · niveau du profil manuel');
 const control=$('binch-ultimate-mode');control.value=mode;
 $('binch-ultimate-next').innerHTML=next?'<span class="binch-ultimate-category">'+esc(next.category)+'</span><h3>'+esc(next.title)+'</h3><p>'+esc(next.description)+'</p><small>Source : '+esc(next.origin||'profil local')+' · '+(next.verified?'référence ou action documentée':'vérification recommandée')+'</small>':'<p>Aucun objectif disponible. Consulter ton carnet de route.</p>';
 $('binch-ultimate-next-button').disabled=!next;
 $('binch-ultimate-actions').innerHTML=actions.slice(0,6).map((x,i)=>'<article class="binch-ultimate-task"><span class="binch-ultimate-order">'+(i+1)+'</span><div><strong>'+esc(x.title)+'</strong><small>'+esc(x.category)+' · '+(x.when==='soon'?'Accessible dès le niveau '+x.level:'Accessible selon le profil')+' · '+esc(x.origin)+'</small></div><button type="button" data-ultimate-open="'+esc(x.page)+'" data-ultimate-id="'+esc(x.id)+'" aria-label="Ouvrir '+esc(x.title)+'">Voir</button><button type="button" data-ultimate-dismiss="'+esc(x.id)+'" aria-label="Masquer cette suggestion">×</button></article>').join('');
 window.BinchUltimate={getPlan:()=>lastPlan?{profile:{...lastPlan.profile},actions:lastPlan.actions.map(x=>({...x})),next:lastPlan.next?{...lastPlan.next}:null}:null,open:go,refresh:render};
 document.dispatchEvent(new Event('binch:ultimate-updated'));
 $('binch-ultimate-status').textContent='Conseils calculés localement à partir du profil, du carnet des découvertes et de l’import lorsqu’il correspond au personnage. Aucune action effectuée dans WoW.';
 document.dispatchEvent(new CustomEvent('binch:journey-updated',{detail:{next:next?{id:next.id,title:next.title,page:next.page}:null,level:profile.level,imported:profile.imported}}));
}
function exportPlan(){
 if(!lastPlan)return;
 const json=JSON.stringify({format:'binch-ultimate-briefing-v1',generatedAt:new Date().toISOString(),profile:lastPlan.profile,actions:lastPlan.actions,notice:lastPlan.notice},null,2);
 const url=URL.createObjectURL(new Blob([json],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='la-binch-plan-d-aventure.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1500);
}
function mount(){
 const home=$('page-hub');if(!home||$('binch-ultimate-briefing'))return false;
 const section=document.createElement('section');section.id='binch-ultimate-briefing';section.className='binch-ultimate-briefing panel section';
 section.innerHTML='<header class="binch-ultimate-head"><div><span class="eyebrow">LA BINCH ULTIMATE · STRATÉGIE PERSONNELLE</span><h2>Ton prochain meilleur mouvement</h2><p id="binch-ultimate-level">Données du personnage</p></div><label>Mode d’aventure<select id="binch-ultimate-mode">'+MODES.map(x=>'<option value="'+x[0]+'">'+x[1]+'</option>').join('')+'</select></label></header><div class="binch-ultimate-recommendation"><div id="binch-ultimate-next"></div><button id="binch-ultimate-next-button" type="button">Ouvrir cet objectif</button></div><div class="binch-ultimate-top"><h3>Mon ordre de mission</h3><button id="binch-ultimate-export" type="button">Exporter mon plan</button></div><div id="binch-ultimate-actions" class="binch-ultimate-actions"></div><p id="binch-ultimate-status" role="status"></p>';
 const after=$('binch-remember-bag')||$('binch-front');
 if(after)after.after(section);else home.prepend(section);
 $('binch-ultimate-mode').onchange=e=>{mode=e.target.value;dismissed=[];save();render()};
 $('binch-ultimate-next-button').onclick=()=>{if(lastPlan?.next)go(lastPlan.next.page)};
 $('binch-ultimate-export').onclick=exportPlan;
 $('binch-ultimate-actions').onclick=e=>{
  const open=e.target.closest('[data-ultimate-open]');if(open){go(open.dataset.ultimateOpen);return}
  const dismiss=e.target.closest('[data-ultimate-dismiss]');if(dismiss){dismissed=[...new Set([...dismissed,dismiss.dataset.ultimateDismiss])].slice(-MAX);save();render()}
 };
 for(const event of ['grimoire:sync','binch:route-complete','binch:external-complete','binch:objectives-change'])document.addEventListener(event,render);
 window.addEventListener('storage',e=>{if(!e.key||e.key.includes('grimoire')||e.key.includes('binch.custom')||e.key.startsWith('binch.ultimate.')){if(e.key?.startsWith('binch.ultimate.'))currentId='';render()}});
 $('binch-command-refresh')?.addEventListener('click',render);
 setTimeout(render,0);return true;
}
function start(){if(mount())return;const app=$('app');if(!app)return;const mo=new MutationObserver(()=>{if(mount())mo.disconnect()});mo.observe(app,{childList:true,subtree:true});setTimeout(()=>mo.disconnect(),10000)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
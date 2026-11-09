/* La Binch — tableau des priorités du personnage, sans données prétendues synchronisées. */
(()=>{'use strict';
const $=id=>document.getElementById(id);
const get=(k,f)=>{try{return JSON.parse(localStorage.getItem(k))??f}catch{return f}};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const classSteps={Druide:[[10,'Forme d’ours'],[16,'Forme aquatique'],[20,'Forme de félin']],Chaman:[[4,'Totem de Terre'],[10,'Totem de Feu'],[30,'Totem d’Air']],Chasseur:[[10,'Familier et apprivoisement']],Guerrier:[[10,'Posture défensive']],Démoniste:[[10,'Marcheur du Vide']],Voleur:[[20,'Poisons']],Paladin:[[12,'Rédemption']]};
function profile(){
 const p=get('grimoire.hub.v3',{}),name=String(p.data?.pseudo||'Aventurier').trim();
 return {name,race:String(p.race||''),cls:String(p.classe||''),level:Math.max(1,Math.min(60,Number(p.data?.level)||1))};
}
function keys(p){
 const orig=[p.name,p.race,p.cls],encoded=orig.map(v=>encodeURIComponent(v.toLocaleLowerCase('fr'))).join('.'),custom=[p.name.toLocaleLowerCase('fr'),p.race,p.cls].map(encodeURIComponent).join('.');
 return {zone:'binch.zone.plan.v1.'+encoded,objectives:'binch.custom.objectives.v1.'+custom,session:'binch.session.plan.v1.'+encoded};
}
function compute(p){
 const k=keys(p),zone=get(k.zone,{}),goals=get(k.objectives,[]),session=get(k.session,{});
 const z=(window.GRIMOIRE_ZONES||[]).find(z=>z&&z.id===zone.zone);
 const tasks=Array.isArray(zone.tasks)?zone.tasks.filter(t=>t&&t.zone===zone.zone):[];
 const completed=tasks.filter(t=>t.done).length;
 const personal=Array.isArray(goals)?goals.filter(g=>g&&typeof g.title==='string'&&!g.done&&Number(g.level)<=p.level+5):[];
 const urgent=personal.filter(g=>g.priority==='Essentiel');
 const next=(classSteps[p.cls]||[]).find(([n])=>n>=p.level&&n<=p.level+10);
 const clock=Number(session.duration);
 return {zoneName:z?.name||'Aucune zone choisie',zoneCount:tasks.length,zoneDone:completed,urgent:urgent.length,goals:personal.length,next,minutes:[30,60,90,120].includes(clock)?clock:null};
}
function init(){
 const hub=$('page-hub'),home=$('binch-adventure-home');if(!hub||!home||$('binch-progression-pulse'))return;
 const box=document.createElement('section');box.id='binch-progression-pulse';box.className='panel section';
 box.innerHTML='<div class="eyebrow">CAP DE PROGRESSION / DONNÉES MANUELLES</div><h2>En un coup d’œil</h2>'+
 '<div id="binch-pulse-cards" class="binch-pulse-cards"></div>'+
 '<p class="binch-pulse-help">Ce tableau utilise ton profil et tes checklists locales. Il n’affirme pas connaître les quêtes ou l’XP exactes de WoW.</p>';
 home.insertAdjacentElement('afterend',box);
 box.addEventListener('click',event=>{
  const button=event.target.closest('[data-pulse-action]');if(!button)return;
  const action=button.dataset.pulseAction;
  const destinations={zone:'binch-zone-planner',goals:'binch-personal-objectives',session:'binch-session-planner',journal:'binch-leveling-journal'};
  const target=$(destinations[action]);if(!target)return;
  if(action==='zone'){
   const nav=document.querySelector('#app nav.nav [data-page="progression"]');
   if(nav)nav.click();
   else{const page=$('page-progression');if(page){document.querySelectorAll('#app .page').forEach(e=>e.classList.toggle('active',e===page));}}
  }
  const hidden=target.closest('details.binch-tool-accordion');if(hidden)hidden.open=true;
  target.scrollIntoView({behavior:'smooth',block:'start'});
 });
 document.addEventListener('binch:zone-change',render);
 document.addEventListener('grimoire:sync',render);
 document.addEventListener('binch:profile-changed',render);
 document.addEventListener('binch:objectives-change',render);
 document.addEventListener('binch:session-change',render);
 window.addEventListener('storage',render);
 render();
}
function render(){
 const root=$('binch-pulse-cards');if(!root)return;
 const p=profile(),x=compute(p);
 const stage=x.next?'Niveau '+x.next[0]+' : '+x.next[1]:'Aucun jalon de classe proche répertorié';
 const goals=x.urgent?x.urgent+' essentiel(s) parmi '+x.goals+' à faire':x.goals+' objectif(s) à faire';
 root.innerHTML='<article><span>Zone du moment</span><strong>'+esc(x.zoneName)+'</strong><small>'+x.zoneDone+'/'+x.zoneCount+' étapes manuelles terminées</small><button data-pulse-action="zone" type="button">Ouvrir le parcours</button></article>'+
 '<article><span>Objectifs prioritaires</span><strong>'+goals+'</strong><small>'+esc(stage)+'</small><button data-pulse-action="goals" type="button">Mes objectifs</button></article>'+
 '<article><span>Prochaine session</span><strong>'+(x.minutes?x.minutes+' minutes':'À préparer')+'</strong><small>Plan local ajustable selon tes disponibilités</small><button data-pulse-action="session" type="button">Préparer ma session</button></article>';
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
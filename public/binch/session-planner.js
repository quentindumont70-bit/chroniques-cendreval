/* La Binch — préparation de session et cap de progression hors synchronisation. */
(()=>{'use strict';
const $=id=>document.getElementById(id);
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const read=(k,f)=>{try{return JSON.parse(localStorage.getItem(k))??f}catch{return f}};
const PREFIX='binch.session.plan.v1.';
const DURATIONS=[30,60,90,120],FOCUS=['Mixte','Quêtes','Métiers','Exploration','Donjons'];
const classMilestones={Druide:[[10,'Forme d’ours'],[16,'Forme aquatique'],[20,'Forme de félin']],Chaman:[[4,'Totem de Terre'],[10,'Totem de Feu'],[30,'Totem d’Air']],Chasseur:[[10,'Familier : préparer les quêtes d’apprivoisement']],Guerrier:[[10,'Posture défensive']],Démoniste:[[10,'Marcheur du Vide']],Voleur:[[20,'Poisons']],Paladin:[[12,'Rédemption']]};
let currentKey='',plan=null;
function profile(){
 const p=read('grimoire.hub.v3',{}),name=String(p.data?.pseudo||'Aventurier').trim();
 return {name,cls:p.classe||'',race:p.race||'',level:Math.max(1,Math.min(60,Number(p.data?.level)||1)),jobs:Array.isArray(p.jobs)?p.jobs:[]};
}
function key(p){return PREFIX+[p.name,p.race,p.cls].map(x=>encodeURIComponent(String(x).toLocaleLowerCase('fr'))).join('.')}
function restore(p){
 const k=key(p);if(k===currentKey)return;
 currentKey=k;const x=read(k,{});
 plan={duration:DURATIONS.includes(x.duration)?x.duration:60,focus:FOCUS.includes(x.focus)?x.focus:'Mixte',done:x.done&&typeof x.done==='object'&&!Array.isArray(x.done)?x.done:{},notes:typeof x.notes==='string'?x.notes.slice(0,350):'',updated:Number(x.updated)||0};
}
function save(){plan.updated=Date.now();localStorage.setItem(currentKey,JSON.stringify(plan))}
function objectives(p){
 const key='binch.custom.objectives.v1.'+[p.name.toLocaleLowerCase('fr'),p.race,p.cls].map(x=>encodeURIComponent(String(x))).join('.');
 const entries=read(key,[]);
 return Array.isArray(entries)?entries.filter(x=>x&&typeof x.title==='string'&&!x.done&&Number(x.level)<=p.level+5).slice(0,80):[];
}
function suggestions(p){
 const jobs=p.jobs.slice(0,3).map(j=>({id:'job:'+j,label:'Faire progresser '+j,group:'Métiers',level:p.level,score:72,detail:'Vérifier les recettes et composants auprès du maître de métier'}));
 const nextClass=(classMilestones[p.cls]||[]).filter(([lvl])=>lvl>=p.level&&lvl<=p.level+8).map(([lvl,label])=>({id:'class:'+lvl,label,group:'Quêtes',level:lvl,score:110-(lvl-p.level)*3,detail:'Jalon de classe indicatif : confirmer les conditions sur WoW Forever'}));
 const personal=objectives(p).map(x=>({id:'custom:'+x.id,label:x.title,group:x.type||'Quêtes',level:Number(x.level)||p.level,score:x.priority==='Essentiel'?120:x.priority==='Normal'?96:65,detail:'Objectif personnel saisi dans La Binch'}));
 const zone=(window.GRIMOIRE_ZONES||[]).filter(z=>z&&Array.isArray(z.levels)&&z.levels[0]<=p.level+3&&z.levels[1]>=p.level).sort((a,b)=>Math.abs(a.levels[0]-p.level)-Math.abs(b.levels[0]-p.level))[0];
 const exploration=zone?[{id:'zone:'+zone.id,label:'Explorer '+zone.name,group:'Exploration',level:p.level,score:76,detail:'Zone adaptée au niveau indiqué par notre atlas, à vérifier en jeu'}]:[];
 const dungeon=(window.GRIMOIRE_DUNGEONS||[]).filter(d=>d&&Array.isArray(d.levels)&&d.levels[0]<=p.level+4&&d.levels[1]>=p.level).sort((a,b)=>Math.abs(a.levels[0]-p.level)-Math.abs(b.levels[0]-p.level))[0];
 const dungeons=dungeon?[{id:'dungeon:'+dungeon.id,label:'Préparer '+dungeon.name,group:'Donjons',level:dungeon.levels[0],score:60,detail:'Préparer les quêtes, le groupe et les consommables — accès à confirmer'}]:[];
 const basics=[{id:'baseline:training',label:'Vérifier les compétences et l’équipement',group:'Quêtes',level:p.level,score:64,detail:'Un contrôle rapide avant le départ'},{id:'baseline:route',label:'Préparer un trajet et ses quêtes regroupées',group:'Quêtes',level:p.level,score:69,detail:'Limiter les allers-retours inutiles'}];
 return [...personal,...nextClass,...exploration,...jobs,...dungeons,...basics].filter(x=>!plan.done[x.id]).map(x=>({...x,score:x.score+(plan.focus==='Mixte'?0:x.group===plan.focus?35:-15)})).sort((a,b)=>b.score-a.score||a.level-b.level);
}
function schedule(p){
 const mins=plan.duration;const budget=Math.max(10,mins-10),list=suggestions(p),selected=[],types=new Set();
 let spent=0;
 for(const item of list){
  const duration=item.group==='Donjons'?Math.min(45,budget):item.group==='Métiers'?20:item.group==='Exploration'?20:15;
  if(spent+duration>budget||selected.length>=5)continue;
  if(plan.focus==='Mixte'&&types.has(item.group)&&selected.length<2&&list.some(x=>!types.has(x.group)))continue;
  selected.push({...item,minutes:duration});types.add(item.group);spent+=duration;
 }
 if(!selected.length&&list.length)selected.push({...list[0],minutes:Math.min(budget,20)});
 return selected;
}
function init(){
 const host=$('page-hub');if(!host||$('binch-session-planner'))return;
 const box=document.createElement('section');box.id='binch-session-planner';box.className='panel section';
 box.innerHTML='<div class="eyebrow">LA BINCH / MON TEMPS DE JEU</div><h2>Préparer ma prochaine session</h2><p class="muted">Un plan indicatif selon ton niveau, ta classe, tes métiers et tes objectifs personnels. Les durées sont des budgets suggérés, pas des durées réelles garanties.</p>'+
 '<div class="binch-session-settings"><label>Temps disponible<select id="binch-session-duration">'+DURATIONS.map(x=>'<option value="'+x+'">'+x+' minutes</option>').join('')+'</select></label><label>Priorité<select id="binch-session-focus">'+FOCUS.map(x=>'<option>'+x+'</option>').join('')+'</select></label><button type="button" id="binch-session-refresh">Recomposer</button></div>'+
 '<p id="binch-session-summary" role="status" aria-live="polite"></p><div id="binch-session-route"></div>'+
 '<label class="binch-session-notes">Note personnelle<textarea id="binch-session-note" maxlength="350" rows="2" placeholder="Ce que je veux absolument faire…"></textarea></label>'+
 '<div class="binch-session-actions"><button type="button" id="binch-session-copy">Copier mon plan</button><button type="button" id="binch-session-reset">Réinitialiser les étapes cochées</button></div>';
 const adventure=$('binch-adventure-home');
 if(adventure)adventure.insertAdjacentElement('afterend',box);else host.prepend(box);
 $('binch-session-duration').onchange=e=>{restore(profile());plan.duration=Number(e.target.value);save();render()};
 $('binch-session-focus').onchange=e=>{restore(profile());plan.focus=e.target.value;save();render()};
 $('binch-session-refresh').onclick=render;
 $('binch-session-note').oninput=e=>{restore(profile());plan.notes=e.target.value.slice(0,350);save()};
 $('binch-session-route').addEventListener('click',e=>{
  const b=e.target.closest('[data-session-complete]');if(!b)return;restore(profile());plan.done[b.dataset.sessionComplete]=true;save();render();
 });
 $('binch-session-copy').onclick=async()=>{
  const p=profile();restore(p);const steps=schedule(p);
  const text=['LA BINCH — SESSION '+plan.duration+' MIN','Personnage : '+p.name+' · niveau '+p.level,'Priorité : '+plan.focus,'',...steps.map((x,i)=>(i+1)+'. '+x.label+' (~'+x.minutes+' min)')];
  if(plan.notes.trim())text.push('','Note : '+plan.notes.trim());
  try{await navigator.clipboard.writeText(text.join('\n'));$('binch-session-copy').textContent='Plan copié ✓'}catch{window.prompt('Copier le plan',text.join('\n'))}
 };
 $('binch-session-reset').onclick=()=>{
  restore(profile());if(!Object.keys(plan.done).length)return;
  if(confirm('Rendre de nouveau disponibles les étapes cochées de ce personnage ?')){plan.done={};save();render();}
 };
 document.addEventListener('grimoire:sync',render);document.addEventListener('binch:profile-changed',render);
 window.addEventListener('storage',render);
 render();
}
function render(){
 if(!$('binch-session-route'))return;
 const p=profile();restore(p);
 $('binch-session-duration').value=String(plan.duration);
 $('binch-session-focus').value=plan.focus;
 $('binch-session-note').value=plan.notes;
 const route=schedule(p),time=route.reduce((n,x)=>n+x.minutes,0);
 $('binch-session-summary').textContent=route.length+' étape(s) proposées · environ '+time+' minutes d’activités + '+(plan.duration-time)+' minutes de marge.';
 $('binch-session-route').innerHTML=route.length?route.map(x=>'<article class="binch-session-step"><div><small>'+esc(x.group)+' · niveau indicatif '+x.level+' · ~'+x.minutes+' min</small><strong>'+esc(x.label)+'</strong><p>'+esc(x.detail)+'</p></div><button type="button" data-session-complete="'+esc(x.id)+'">Fait ✓</button></article>').join(''):'<p class="muted">Plus d’étapes disponibles pour cette sélection. Réinitialise les étapes cochées pour recommencer.</p>';
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();

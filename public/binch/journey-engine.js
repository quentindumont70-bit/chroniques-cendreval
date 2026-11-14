/* La Binch Ultimate — pure, auditable prioritization engine.
   No live WoW access, inferred quest completions or fabricated AH prices.
   Inputs are snapshots/explicit user state; output is a suggested plan, never an in-game command. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;root.BinchJourneyEngine=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){'use strict';
const MAX=40;
const num=(n,fallback=0)=>Number.isFinite(Number(n))?Number(n):fallback;
const clipped=(s,n=120)=>String(s??'').trim().slice(0,n);
const rank={urgent:0,now:1,soon:2,later:3};
function generate(input={}){
 const level=Math.min(60,Math.max(1,Math.floor(num(input.level,1))));
 const clazz=clipped(input.className,45),race=clipped(input.race,45);
 const imported=input.imported===true;
 const mode=['balanced','solo','dungeon','profession'].includes(input.mode)?input.mode:'balanced';
 const done=new Set(Array.isArray(input.completed)?input.completed.map(x=>clipped(x,100)):[]);
 const discoveries=Array.isArray(input.discoveries)?input.discoveries.slice(0,MAX):[];
 const professions=Array.isArray(input.professions)?input.professions.map(x=>clipped(x,60)):[];
 const rows=[];
 const add=x=>{
  const id=clipped(x.id,100),title=clipped(x.title,120);
  if(!id||!title||done.has(id))return;
  rows.push({id,title,description:clipped(x.description,260),level:Math.max(1,Math.floor(num(x.level,1))),zone:clipped(x.zone,70),source:clipped(x.source,400),origin:clipped(x.origin,80),category:clipped(x.category,50),page:clipped(x.page,40),verified:x.verified===true,available:x.available!==false,priority:Math.max(0,Math.min(110,num(x.priority,0))),confidence:clipped(x.confidence||'guidance',40)});
 };
 for(const d of discoveries){
  if(!d||typeof d!=='object'||!d.id||!d.title)continue;
  const min=Math.max(1,num(d.level,1));
  add({id:'discovery:'+clipped(d.id),title:d.title,description:d.summary||d.reward,level:min,priority:d.priority,source:d.source,origin:d.sourceName||'Catalogue La Binch',category:d.category||'Quête',page:'discoveries',verified:d.verified,available:d.available!==false,confidence:'catalogue sourcé'});
 }
 // These explicit local actions never assert an in-game quest is done.
 if(imported){
  add({id:'action:refresh',title:'Dernier import GrimoireSync disponible',description:'Les informations affichées correspondent à une sauvegarde, pas à la progression en direct.',level,priority:35,category:'Synchronisation',page:'sync',verified:true,origin:'GrimoireSync',confidence:'sauvegarde locale'});
 }else{
  add({id:'action:import',title:'Actualiser mon personnage',description:'Importer GrimoireSync.lua pour utiliser le véritable niveau, la zone et le journal de quêtes.',level,priority:83,category:'Synchronisation',page:'sync',verified:true,origin:'Import volontaire',confidence:'absence de données'});
 }
 if(clazz.toLocaleLowerCase('fr').includes('druide')){
  add({id:'action:talents',title:'Consulter mon prochain talent Farouche',description:'Arbre authentique et parcours de leveling théorique point par point. Vérifier les talents réellement attribués en jeu.',level,priority:level>=10?76:22,category:'Talents',page:'specs',verified:true,origin:'Talents Forever / Icy Veins',confidence:'guide documenté'});
 }
 if(professions.some(x=>/cuir|d[ée]pe[çc]/i.test(x))){
  add({id:'action:leather',title:'Dépeçage et Travail du cuir : préparer les recettes utiles',description:'Consulter les patrons, les réactifs et les prochaines améliorations de sac dans l’atelier.',level,priority:mode==='profession'?97:53,category:'Métier',page:'metiers',verified:true,origin:'Métier choisi dans le profil',confidence:'profil local'});
 }
 const custom=Array.isArray(input.objectives)?input.objectives.slice(0,60):[];
 for(const o of custom){
  if(!o||o.done!==false||typeof o.title!=='string'||!o.title.trim())continue;
  add({id:'objective:'+clipped(o.id||o.title),title:o.title,description:'Objectif créé et suivi manuellement sur cet appareil.',level:num(o.level,1),priority:o.priority==='Essentiel'?99:o.priority==='Plus tard'?36:65,category:o.type||'Objectif',page:'hub',origin:'Carnet personnel',confidence:'choix utilisateur',verified:true});
 }
 const score=x=>{
  let n=x.priority;
  const delta=x.level-level;
  if(delta>8)n-=65;
  else if(delta>3)n-=30;
  else if(delta>0)n-=9;
  else n+=12;
  if(x.category==='Donjon')n+=mode==='dungeon'?24:mode==='solo'?-15:0;
  if(x.category==='Métier')n+=mode==='profession'?18:0;
  if(x.category==='Quête'||x.category==='Secret majeur'||x.category==='Sac gratuit')n+=mode==='solo'?10:0;
  if(!x.verified)n-=25;
  if(!x.available)n-=10;
  return Math.round(n);
 };
 const deduped=[...new Map(rows.map(x=>[x.id,x])).values()];
 deduped.forEach(x=>{x.score=score(x);x.when=x.level>level?'soon':'now'});
 deduped.sort((a,b)=>b.score-a.score||a.level-b.level||a.title.localeCompare(b.title,'fr'));
 const selected=deduped.slice(0,12);
 const next=selected.find(x=>x.when==='now')||selected[0]||null;
 return {profile:{level,className:clazz,race,mode,imported},next,actions:selected,sourceCount:discoveries.length,generatedAt:null,notice:'Ordre suggéré à partir du profil et des données disponibles. Pas de synchronisation WoW en direct ni de quêtes déclarées accomplies automatiquement.'};
}
return {generate};
});

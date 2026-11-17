/* Faith — plan renderer shared with the Ultimate briefing. Pure, offline, no WoW actions. */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 root.BinchFaithGuide=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){'use strict';
 const clean=(v,n=150)=>String(v??'').trim().slice(0,n);
 function priorities(plan,state={}){
  if(!plan||!plan.next)return {text:'Aucune action prioritaire ne ressort du carnet local. Vérifie ton profil et le dernier import GrimoireSync avant de planifier la suite.',page:null};
  const unique=[],seen=new Set();
  for(const a of [plan.next,...(Array.isArray(plan.actions)?plan.actions:[])]){
   if(!a||!a.title)continue;
   const key=clean(a.id||a.title,120);
   if(seen.has(key))continue;
   seen.add(key);unique.push(a);
   if(unique.length===3)break;
  }
  const steps=unique.map((a,i)=>(i+1)+'. '+clean(a.title,110)+(a.when==='soon'?' (à anticiper niveau '+clean(a.level,3)+')':'')+' — '+clean(a.description,170)+' [rubrique '+clean(a.page,30)+' ; origine '+clean(a.origin||'profil local',65)+']').join('\n');
  const notice=state.same?'Personnage correspondant au dernier import GrimoireSync : ce n’est pas l’état du jeu en direct.':'Profil manuel ou import non correspondant : revalider niveau, zone et quêtes.';
  return {text:'Ordre de mission du tableau de bord :\n'+steps+'\n'+notice+' Aucune action n’a été effectuée dans WoW.',page:/^[a-z-]{2,30}$/.test(String(unique[0]?.page||''))?unique[0].page:null};
 }
 function profile(c,now=Date.now()){
  const name=clean(c?.name||'Aventurier',40),clazz=clean(c?.className||'classe non renseignée',40),spec=clean(c?.spec||'spécialisation non renseignée',55);
  const level=Number.isInteger(c?.level)&&c.level>=1&&c.level<=60?'niveau '+c.level:'niveau inconnu';
  const zone=clean(c?.zone||'zone inconnue',75);
  if(!c?.same)return name+' · '+clazz+' · '+spec+' · '+level+' · '+zone+'. Source : profil manuel sur cet appareil ; aucun import GrimoireSync correspondant. Je ne peux pas confirmer ta position ni ton niveau en jeu.';
  let stamp=typeof c.date==='number'?(c.date<1e11?c.date*1000:c.date):Date.parse(String(c.date||''));
  const age=Number.isFinite(stamp)&&Number.isFinite(now)?Math.max(0,Math.floor((now-stamp)/3600000)):null;
  const time=age===null?'date de sauvegarde inconnue':age<1?'sauvegarde de moins d’une heure':age+' h depuis la sauvegarde';
  return name+' · '+clazz+' · '+spec+' · '+level+' · '+zone+'. Source : import GrimoireSync correspondant ('+time+'). Ce n’est pas une position en temps réel.';
 }
 return {priorities,profile};
});

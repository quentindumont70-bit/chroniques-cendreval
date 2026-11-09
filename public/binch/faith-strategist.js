/* Faith / décisions locales : aucune IA distante, aucune donnée de jeu inventée. */
(()=>{'use strict';
const $=id=>document.getElementById(id),KEY='binch.faith.goal.v1';
const read=k=>{try{return JSON.parse(localStorage.getItem(k))||{}}catch{return {};}};
const fmt=n=>Number(n).toLocaleString('fr-FR');
function snapshot(){
 const p=read('grimoire.hub.v3'),d=p.data||{},last=read('grimoire.bridge.last');
 const name=String(d.pseudo||last.name||'Aventurier'),race=p.race||'',cls=p.classe||'',same=!!last.name&&last.name.trim().toLocaleLowerCase('fr')===name.trim().toLocaleLowerCase('fr');
 const inv=same&&Array.isArray(last.inventory)?last.inventory:[],cnt=id=>inv.filter(x=>Number(x.id)===id).reduce((n,x)=>n+(Number(x.count)||1),0);
 const xp=same&&last.xp!=null&&last.xp!==''?Number(last.xp):null,xpMax=same&&last.xpMax!=null&&last.xpMax!==''?Number(last.xpMax):null;
 const jobsKey=name.trim().toLowerCase()+'-'+race+'-'+cls,skills=read('grimoire.craft.v1').imports?.[jobsKey]?.skills||{};
 const pinKey='binch.route.pins.v1.'+(name+'-'+race+'-'+cls).toLowerCase().replace(/[^a-z0-9]+/g,'-');
 return {name,race,cls,level:Math.max(1,Math.min(60,Number(d.level)||Number(same?last.level:1)||1)),zone:(same?last.zone:null)||d.zone||'Zone non renseignée',same,updated:same?last.updated:null,xp,xpMax,copper:cnt(2770),stones:cnt(2835),jobs:Object.entries(skills).filter(([k,v])=>k&&Number.isFinite(Number(v))),pins:Object.values(read(pinKey)).filter(i=>i&&i.t).slice(0,5),questLog:same&&Array.isArray(last.questLog)?last.questLog.filter(q=>q&&Number(q.id)>0&&typeof q.title==='string'):[],questLogAPI:same?(last.questLogAPI||'unavailable'):'unavailable',faction:['Tauren','Orc','Troll','MortVivant'].includes(race)?'Horde':['Humain','Nain','Elfe','Gnome'].includes(race)?'Alliance':'Neutre'};
}
const classMilestones={Druide:[[10,'Forme d’ours'],[16,'Forme aquatique'],[20,'Forme de félin']],Chaman:[[4,'Totem de terre'],[10,'Totem de feu'],[30,'Totem d’air']],Guerrier:[[10,'Posture défensive']],Chasseur:[[10,'Apprivoiser un familier']],Démoniste:[[10,'Marcheur du Vide']],Voleur:[[20,'Poisons']],Paladin:[[12,'Rédemption']]};
function nearbyZones(p){
 const zs=Array.isArray(window.GRIMOIRE_ZONES)?window.GRIMOIRE_ZONES:[];
 return zs.filter(z=>z&&Array.isArray(z.levels)&&z.name&&(z.faction==='Mixte'||z.faction==='Neutre'||p.faction==='Neutre'||z.faction===p.faction)&&Number(z.levels[0])<=p.level+5&&Number(z.levels[1])>=p.level-2).sort((a,b)=>Number(String(b.name).toLowerCase()===p.zone.toLowerCase())-Number(String(a.name).toLowerCase()===p.zone.toLowerCase())||Math.abs(Number(a.levels[0])-p.level)-Math.abs(Number(b.levels[0])-p.level)).slice(0,3);
}
function nearbyDungeons(p){
 const ds=Array.isArray(window.GRIMOIRE_DUNGEONS)?window.GRIMOIRE_DUNGEONS:[];
 return ds.filter(d=>d&&Array.isArray(d.levels)&&d.name&&Number(d.levels[0])<=p.level+7&&Number(d.levels[1])>=p.level-2).sort((a,b)=>Math.abs(Number(a.levels[0])-p.level)-Math.abs(Number(b.levels[0])-p.level)).slice(0,2);
}
function recommendations(p,goal){
 const suggestions=[];
 function add(priority,title,reason,source,page){if(!suggestions.some(x=>x.title===title))suggestions.push({priority,title,reason,source,page})}
 if(!p.same)add(120,'Importer ton personnage','Sans import de ce personnage, Faith ne peut pas confirmer tes sacs, ton XP ni ta zone actuelle.','Synchronisation non confirmée','sync');
 if(p.questLogAPI!=='unavailable'&&p.questLog.length&&(goal==='balanced'||goal==='quick'||goal==='class')){
  const completed=p.questLog.filter(q=>q.complete===true);
  for(const quest of completed.slice(0,2)){
   add(117,'Rendre : '+quest.title.slice(0,85),'Cette quête figure comme terminée dans le dernier journal sauvegardé. Vérifie le PNJ de remise dans WoW.','Journal GrimoireSync · statut exporté','command');
  }
  const pending=p.questLog.filter(q=>q.complete!==true);
  for(const quest of pending.slice(0,2)){
   add(goal==='quick'?107:102,'Poursuivre : '+quest.title.slice(0,85),'Quête présente dans le journal exporté. Les objectifs et la position exacte ne sont pas disponibles.','Journal GrimoireSync · présence confirmée','command');
  }
 }
 const next=(classMilestones[p.cls]||[]).find(([lv])=>lv>=p.level);
 if(next&&next[0]-p.level<=5&&(goal==='class'||goal==='balanced'||goal==='quick'))
  add(goal==='class'?105:90,'Préparer '+next[1],'Jalon de '+p.cls+' autour du niveau '+next[0]+'. Consulte la route et confirme les conditions spécifiques à Forever.','Catalogue indicatif des classes','progression');
 if(p.pins.length&&goal!=='craft'){
  const pin=p.pins[0];add(goal==='balanced'?110:85,'Objectif épinglé : '+String(pin.t).slice(0,90),String(pin.d||'Objectif choisi par toi dans le carnet de route.').slice(0,220),'Ton objectif personnel','progression');
 }
 if((goal==='balanced'||goal==='quick')&&p.xp!==null&&p.xpMax>0&&Number.isFinite(p.xp)&&p.xp/p.xpMax>=.8)
  add(95,'Préparer le niveau suivant','Tu es à '+Math.round(p.xp/p.xpMax*100)+' % du niveau : pense au maître de classe et au prochain parcours.','XP de la dernière sauvegarde','progression');
 // Repères du vrai catalogue La Binch, déjà filtrés par classe/race et progression manuelle.
 // Ce sont des opportunités connues, jamais une détection du journal de quêtes WoW.
 if(goal==='balanced'||goal==='quick'||goal==='class'){
  const discoveries=window.BinchDiscoveries?.recommendations?.()||[];
  const suitable=discoveries.filter(q=>q.verified&&q.level<=p.level+3&&q.distance>=-6);
  for(const q of suitable.slice(0,2)){
   const levelNote=q.available?'accessible selon le niveau':'à anticiper au niveau '+q.level;
   const reward=q.reward?' Récompense : '+String(q.reward).slice(0,100)+'.':'';
   add(goal==='quick'?Math.min(114,78+Math.round(q.priority/5)):goal==='class'?96:Math.min(112,80+Math.round(q.priority/5)),
    q.title,'Découverte '+levelNote+' (recommandée niv. '+q.rec+'). '+String(q.summary).slice(0,135)+'.'+reward,
    'Catalogue de découvertes · '+(q.sourceName||'source référencée')+' · quête non confirmée', 'discoveries');
  }
 }
 if(goal!=='craft'){
  const zs=nearbyZones(p);
  if(zs.length){const z=zs[0];add(goal==='quick'?110:goal==='dungeon'?40:80,'Explorer '+z.name,'Zone répertoriée pour les niveaux '+z.levels.join('–')+'. Points d’intérêt : '+String(z.places||'à consulter dans la carte').slice(0,150)+'. Le journal des quêtes peut être incomplet selon l’API Forever.','Atlas des zones La Binch (indicatif)','progression')}
  else add(60,'Préparer ta prochaine zone','Aucune zone fiable correspondante trouvée dans notre catalogue local pour ce personnage.','Couverture du catalogue incomplète','progression');
 }
 if(goal==='dungeon'){
  const ds=nearbyDungeons(p);
  for(const d of ds)add(115,'Préparer '+d.name,'Donjon de niveau indicatif '+d.levels.join('–')+' ('+String(d.zone||'zone à confirmer')+'). Réunir groupe et quêtes préalables.','Atlas des donjons La Binch (indicatif)','progression');
 }
 if(goal==='craft'||goal==='balanced'){
  if(p.jobs.length)add(goal==='craft'?112:70,'Faire progresser '+p.jobs[0][0],'Compétence '+p.jobs[0][1]+' au dernier import. Consulte les recettes compatibles et leurs matériaux.','Métiers du dernier import','metiers');
  if(p.copper>0||p.stones>0)add(goal==='craft'?100:65,'Exploiter tes ressources',fmt(p.copper)+' minerais de cuivre et '+fmt(p.stones)+' pierres brutes au dernier import : compare avec tes recettes avant de vendre.','Inventaire de la dernière sauvegarde','metiers');
  if(goal==='craft'&&!p.jobs.length)add(90,'Choisir un métier à développer','Aucun niveau de métier confirmé : consulte les maîtres et recettes sans supposer ta compétence.','Compétences non renseignées','metiers');
 }
 add(20,'Définir ta prochaine priorité','Épingle une mission depuis le carnet de route pour que Faith la prenne en compte dans ses décisions.','Préférences locales','progression');
 add(10,'Mettre à jour les données','Après un /reload, le fichier de sauvegarde peut être réimporté pour actualiser les conseils.','GrimoireSync · import volontaire','sync');
 return suggestions.sort((a,b)=>b.priority-a.priority).slice(0,3);
}
function jump(page){document.querySelector('#app nav.nav [data-page="'+page+'"]')?.click();window.scrollTo({top:0,behavior:'auto'})}
function paint(){
 const target=$('binch-faith-advice');if(!target)return;const p=snapshot(),goal=localStorage.getItem(KEY)||'balanced',adv=recommendations(p,goal);
 if(goal==='balanced'&&window.BinchDiscoveries?.getCount){const c=window.BinchDiscoveries.getCount();const status=$('binch-faith-catalog-count');if(status)status.textContent=c+' découvertes indexées dans le catalogue local.';}
 target.textContent='';const intro=$('binch-faith-title');if(intro)intro.textContent='Trois prochaines actions · '+p.name;
 for(let i=0;i<adv.length;i++){const a=adv[i],article=document.createElement('article');article.className='binch-faith-action';
 const num=document.createElement('span');num.textContent=String(i+1).padStart(2,'0');num.className='binch-faith-num';
 const content=document.createElement('div');const title=document.createElement('strong');title.textContent=a.title;const detail=document.createElement('p');detail.textContent=a.reason;const provenance=document.createElement('small');provenance.textContent='Source : '+a.source;
 content.append(title,detail,provenance);
 const actions=document.createElement('div');actions.className='binch-faith-buttons';
 const pin=document.createElement('button');pin.type='button';pin.className='binch-faith-pin';pin.textContent='☆ Épingler';pin.title='Ajouter cet objectif à mon carnet de route';
 pin.addEventListener('click',()=>{
  const item={id:'faith:'+goal+':'+a.title.slice(0,70),n:p.level,c:'Faith',t:a.title,d:a.reason,s:'next',source:a.source};
  if(window.BinchPinned&&typeof window.BinchPinned.set==='function'){
   window.BinchPinned.set(item);
   pin.textContent='✓ Épingle mise à jour';pin.disabled=true;
  }else{pin.textContent='Épinglage indisponible';pin.disabled=true}
 });
 actions.append(pin);content.append(actions);
 const btn=document.createElement('button');btn.type='button';btn.textContent='↗';btn.title='Ouvrir '+a.page;btn.setAttribute('aria-label','Ouvrir '+a.title);btn.onclick=()=>jump(a.page);article.append(num,content,btn);target.append(article)}
 const status=$('binch-faith-integrity');if(status){
 const date=p.updated?new Date(p.updated):null,ok=date&&!isNaN(+date);
 const age=ok?Math.round((Date.now()-+date)/60000):null;
 status.textContent='Faith V4 · '+(ok?'Dernier import '+date.toLocaleString('fr-FR')+(age>30?' (données anciennes)':''):'Pas d’import confirmé')+(p.questLogAPI==='unavailable'?' · Journal inconnu':' · Journal exporté : '+p.questLog.length+' quête(s)')+' · Conseils locaux, aucune IA distante.';
 }
}
function mount(){
 const card=$('page-command')?.querySelector('.binch-command-brog');if(!card||$('binch-faith-advisor'))return;
 const box=document.createElement('div');box.id='binch-faith-advisor';
 box.innerHTML='<div class="binch-faith-advisor-head"><h4 id="binch-faith-title">Trois prochaines actions</h4><label>Priorité<select id="binch-faith-goal"><option value="balanced">Progression équilibrée</option><option value="quick">XP rapide</option><option value="craft">Métiers et ressources</option><option value="class">Classe et compétences</option><option value="dungeon">Préparation donjon</option></select></label></div><small id="binch-faith-catalog-count"></small><div id="binch-faith-advice"></div><p id="binch-faith-integrity"></p>';
 card.append(box);
 const select=$('binch-faith-goal');select.value=localStorage.getItem(KEY)||'balanced';select.addEventListener('change',()=>{localStorage.setItem(KEY,select.value);paint()});
 $('binch-command-refresh')?.addEventListener('click',paint);
 document.addEventListener('grimoire:sync',paint);window.addEventListener('storage',e=>{if(e.key==='grimoire.bridge.last'||e.key==='grimoire.hub.v3'||e.key===KEY)paint()});paint();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
})();
/* Faith / décisions locales : aucune IA distante, aucune donnée de jeu inventée. */
(()=>{'use strict';
const $=id=>document.getElementById(id),KEY='binch.faith.goal.v1';
const read=k=>{try{return JSON.parse(localStorage.getItem(k))||{}}catch{return {};}};
const fmt=n=>Number(n).toLocaleString('fr-FR');
function snapshot(){const p=read('grimoire.hub.v3'),d=p.data||{},last=read('grimoire.bridge.last'),name=String(d.pseudo||last.name||'Aventurier'),same=!!last.name&&last.name.toLowerCase()===name.toLowerCase();
 const inv=same&&Array.isArray(last.inventory)?last.inventory:[],cnt=id=>inv.filter(x=>Number(x.id)===id).reduce((n,x)=>n+(Number(x.count)||1),0);
 return {name,level:Math.max(1,Number(d.level)||Number(last.level)||1),cls:p.classe||'',zone:(same?last.zone:null)||d.zone||'Zone non renseignée',same,updated:same?last.updated:null,xp:same?Number(last.xp):null,xpMax:same?Number(last.xpMax):null,copper:cnt(2770),stones:cnt(2835),pick:cnt(2901)>0,questStatus:'inconnu',jobs:p.jobs||[]};}
function recommendations(p,goal){
 const result=[];const add=(title,reason,source,page)=>result.push({title,reason,source,page});
 if(!p.same)add('Actualiser GrimoireSync','Aucune sauvegarde correspondant à ce personnage : les décisions restent indicatives.','Profil non confirmé','sync');
 if(goal==='craft'){
  if(p.copper>0||p.stones>0)add('Évaluer tes matériaux',fmt(p.copper)+' minerais de cuivre et '+fmt(p.stones)+' pierres brutes recensés au dernier import. Compare tes recettes avant de vendre.','Inventaire exporté','metiers');
  if(!p.pick)add('Contrôler tes outils','Aucune pioche reconnue dans les sacs importés ; elle peut être équipée ou absente du fichier.','Inventaire incomplet possible','metiers');
  add('Préparer une recette utile','Ouvre l’atelier pour choisir une fabrication correspondant au niveau réel de ton métier.','Catalogue à confirmer','metiers');
 }
 if(goal==='class'||p.cls==='Druide'&&p.level>=8&&p.level<11){
  if(p.cls==='Druide'&&p.level<=10)add('Anticiper la Forme d’ours','Quête de classe autour du niveau 10 : vérifier les conditions exactes sur WoW Forever.','Jalon de classe indicatif','progression');
  else add('Passage chez ton maître de classe','Vérifier tes nouveaux sorts et leurs coûts avant un long trajet.','Conseil général','progression');
 }
 if(goal==='quick'||goal==='balanced'){
  add('Faire un circuit de quêtes regroupées','Commence par les objectifs accessibles autour de '+p.zone+' ; le journal de quêtes actif n’est pas transmis actuellement.','Zone importée, quêtes inconnues','progression');
  if(Number.isFinite(p.xp)&&p.xpMax>0&&p.xp/p.xpMax>=.8)add('Préparer ton niveau suivant','Tu es à '+Math.round(100*p.xp/p.xpMax)+' % du niveau : organise l’étape suivante.','XP importée','progression');
 }
 if(goal==='balanced'&&p.copper>0)add('Conserver les ressources utiles',fmt(p.copper)+' minerais de cuivre dans le dernier inventaire : vérifie les recettes avant de vendre.','Objets exportés','metiers');
 if(goal==='dungeon')add('Préparer ton prochain donjon','Consulte les instances correspondant à ton niveau et confirme les quêtes préalables.','Catalogue indicatif','progression');
 if(result.length<3)add('Épingler tes trois priorités','Choisis les objectifs qui comptent dans le carnet de route pour les afficher ici.','Choix manuel','progression');
 if(result.length<3)add('Rafraîchir ta progression','Un /reload puis un nouvel import permet de comparer tes gains depuis la précédente sauvegarde.','Synchronisation volontaire','sync');
 return result.slice(0,3);
}
function jump(page){document.querySelector('#app nav.nav [data-page="'+page+'"]')?.click();window.scrollTo({top:0,behavior:'auto'})}
function paint(){
 const target=$('binch-faith-advice');if(!target)return;const p=snapshot(),goal=localStorage.getItem(KEY)||'balanced',adv=recommendations(p,goal);
 target.textContent='';const intro=$('binch-faith-title');if(intro)intro.textContent='Trois prochaines actions · '+p.name;
 for(let i=0;i<adv.length;i++){const a=adv[i],article=document.createElement('article');article.className='binch-faith-action';
 const num=document.createElement('span');num.textContent=String(i+1).padStart(2,'0');num.className='binch-faith-num';
 const content=document.createElement('div');const title=document.createElement('strong');title.textContent=a.title;const detail=document.createElement('p');detail.textContent=a.reason;const provenance=document.createElement('small');provenance.textContent='Source : '+a.source;
 content.append(title,detail,provenance);const btn=document.createElement('button');btn.type='button';btn.textContent='↗';btn.title='Ouvrir '+a.page;btn.setAttribute('aria-label','Ouvrir '+a.title);btn.onclick=()=>jump(a.page);article.append(num,content,btn);target.append(article)}
 const status=$('binch-faith-integrity');if(status)status.textContent='Faith utilise uniquement les informations disponibles. Journal des quêtes : non fiable. Réponses locales, sans IA ni accès direct au jeu.';
}
function mount(){
 const card=$('page-command')?.querySelector('.binch-command-brog');if(!card||$('binch-faith-advisor'))return;
 const box=document.createElement('div');box.id='binch-faith-advisor';
 box.innerHTML='<div class="binch-faith-advisor-head"><h4 id="binch-faith-title">Trois prochaines actions</h4><label>Priorité<select id="binch-faith-goal"><option value="balanced">Progression équilibrée</option><option value="quick">XP rapide</option><option value="craft">Métiers et ressources</option><option value="class">Classe et compétences</option><option value="dungeon">Préparation donjon</option></select></label></div><div id="binch-faith-advice"></div><p id="binch-faith-integrity"></p>';
 card.append(box);
 const select=$('binch-faith-goal');select.value=localStorage.getItem(KEY)||'balanced';select.addEventListener('change',()=>{localStorage.setItem(KEY,select.value);paint()});
 $('binch-command-refresh')?.addEventListener('click',paint);
 document.addEventListener('grimoire:sync',paint);window.addEventListener('storage',e=>{if(e.key==='grimoire.bridge.last'||e.key==='grimoire.hub.v3'||e.key===KEY)paint()});paint();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
})();
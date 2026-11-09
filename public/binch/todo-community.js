/* La Binch · To Do & Idées · édition publique. Les idées réelles passent par GitHub Issues. */
(()=>{'use strict';
const REPO='quentindumont70-bit/chroniques-cendreval',MASTER='https://github.com/quentindumont70-bit/WoW-Forever-Grimoire/blob/main/TO-DO-LIST-LA-BINCH.md';
const ITEMS=[
['SYNC-01','P0','En test','Connexion GrimoireSync 0.8.3','Validation dans WoW, puis import après /reload sans erreur Lua.','Synchronisation'],
['SYNC-02','P0','En cours','Suivi automatique Opera','Vérifier permissions de lecture, rafraîchissement sans ressaisie et reprise après redémarrage.','Synchronisation'],
['SYNC-03','P0','À faire','Journal de quêtes réel','Corriger questAPI unavailable, contrôler APIs du client Forever et distinguer actives/terminées.','Synchronisation'],
['SYNC-04','P0','À faire','Données fiables et multi-personnages','XP, zone, inventaire, équipement et sources horodatées sans mélange entre personnages.','Synchronisation'],
['PLAY-01','P0','Publié · test requis','Poste de commandement deuxième écran','Interface publiée : XP, personnage, cartes, Brog, ressources, chroniques et carnet de terrain ; QA Opera à réaliser.','Compagnon'],
['PLAY-02','P0','À faire','Cockpit modulable','Widgets déplaçables/redimensionnables, disposition persistante, vue compacte, modes leveling/donjon/raid.','Compagnon'],
['PLAY-03','P0','À faire','Conseils réellement actionnables','Trois prochains objectifs pertinents basés sur le personnage, les quêtes et les ressources vérifiées.','Compagnon'],
['PERF-01','P0','À faire','Performance Opera et navigation','Mesurer mémoire/CPU en longue session, éviter animations et boucles hors écran, corriger le défilement.','Qualité'],
['QA-01','P0','À faire','Tests Wow, PC et mobile','Valider profils, import, quêtes, raccourcis, filtres, UI, mobile et accessibilité avec captures.','Qualité'],
['IDEAS-01','P0','Publié · test requis','To Do & Idées communautaires','File publique dans La Binch et lien GitHub Issues pour proposer une idée vérifiable.','Communauté'],
['START-01','P0','À faire','Démarrage guilde en une minute','Installation, première synchro, lien d’invitation, guide de panne et onboarding sans jargon.','Communauté'],
['AI-01','P1','À faire','Base de connaissances Forever','Objets, quêtes, métiers, donjons, cartes, talents et sources/version de chaque information.','Faith'],
['AI-02','P1','À faire','Moteur de décision léger','Règles/calculateurs déterministes, classement par temps et objectifs, incertitude explicite.','Faith'],
['AI-03','P1','À faire','Petit modèle IA facultatif','Compréhension du langage et arbitrage via recherche locale, sans imposer compte ou clé API.','Faith'],
['AI-04','P1','À faire','Faithkeeper : visage authentique','Recherche de références du troll chaman Illidan / Résurrection / Sulfuras, sans homonyme inventé.','Faith'],
['AI-05','P1','À faire','Faith animé HD et voix','3D ou pixel art HD, expressions, dialogue écrit, voix opt-in et respect des performances.','Faith'],
['TOOLS-01','P1','À faire','La Binch Companion Windows','Installation/mise à jour volontaire des addons, sauvegardes et lecture locale autorisée.','Compagnon'],
['TOOLS-02','P1','À faire','Overlay WoW configurable','Fenêtres transparentes, positions, profils et raccourcis ; conformité technique/serveur à confirmer.','Compagnon'],
['LEVEL-01','P1','À faire','Levelling Forever sourcé','Routes par niveau/race/classe, secrets, quêtes de classe, trajets et récompenses vérifiés.','Contenus'],
['CRAFT-01','P1','En cours','Métiers et économie','Recettes, composants, outils, sacs, acquisition, banque de guilde et analyse garder/vendre.','Contenus'],
['DUN-01','P1','En cours','Donjons, boss et loots','Codex, stratégies, cartes, préparation, tables de loot, taux confirmés uniquement.','Contenus'],
['MACRO-01','P1','En cours','Macros par classe et raid lead','Tester compatibilité Forever et enrichir le catalogue de modèles.','Contenus'],
['GUILD-01','P1','À faire','Backend authentifié de guilde','Comptes, rôles, RLS, permissions, sécurité et modération réelle.','Guilde'],
['GUILD-02','P1','En cours','LFG réellement partagé','Annonces/réactions/organisation interjoueurs après activation sécurisée du backend.','Guilde'],
['GUILD-03','P1','En cours','Guild Planner et coffre collaboratif','Ressources promises, annuaire mains/alts, calendrier, inscriptions et outils GM.','Guilde'],
['IDEAS-02','P1','À faire','Idées sans compte GitHub','Proposition/vote/modération directement sur le site, après authentification sécurisée.','Communauté'],
['ART-01','P2','À faire','Refonte visuelle légendaire','Compositions différentes par page, artwork original AAA, lisibilité et contraste.','Direction artistique'],
['ART-02','P2','À faire','Faithkeeper 3D/pixel art HD','Modèle animé fidèle et optimisé, fallback pour machines modestes.','Direction artistique'],
['ART-03','P2','En cours','Trésors et Choc nébulaire','80 procs cosmétiques, mini-scènes, sprites HD, animations rejouables ; aucun gain en jeu.','Direction artistique'],
['LORE-01','P2','À faire','Encyclopédie Warcraft Forever','Lore canon/époque vérifiés, PNJ, faune, objets, sorts et scènes originales.','Contenus'],
['QA-02','P3','À faire','Changelog, publication et sauvegardes','Version visible, backup/restauration, CI, documentation, domaine stable indépendant de ChatGPT.','Qualité']
];
const $=id=>document.getElementById(id),safe=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let status='Tous',category='Tous',query='',issues=[];
function goto(name){const b=document.querySelector('#app nav.nav [data-page="'+name+'"]');if(b){b.click();window.scrollTo({top:0,behavior:'auto'});}}
function render(){
 const list=$('binch-todo-list');if(!list)return;
 const rows=ITEMS.filter(x=>(status==='Tous'||x[2]===status)&&(category==='Tous'||x[5]===category)&&(!query||x.join(' ').toLowerCase().includes(query.toLowerCase())));
 $('binch-todo-count').textContent=rows.length+' chantiers affichés / '+ITEMS.length+' répertoriés';
 list.innerHTML=rows.length?rows.map(x=>'<article class="binch-todo-card"><div class="binch-todo-card-top"><span>'+safe(x[0])+' · '+safe(x[5])+'</span><span class="binch-todo-priority '+x[1].toLowerCase()+'">'+safe(x[1])+'</span></div><h3>'+safe(x[3])+'</h3><p>'+safe(x[4])+'</p><div class="binch-todo-card-bottom"><span class="binch-todo-status">'+safe(x[2])+'</span></div></article>').join(''):'<p class="binch-todo-empty">Aucun chantier pour ces filtres.</p>';
}
function renderIssues(){
 const box=$('binch-ideas-list');if(!box)return;
 if(!issues.length){box.innerHTML='<p class="binch-todo-muted">Aucune proposition publique récupérée. Tu peux en créer une avec le bouton ci-dessous.</p>';return}
 box.innerHTML=issues.slice(0,12).map(i=>'<article class="binch-todo-idea"><div><a href="'+safe(i.html_url)+'" target="_blank" rel="noopener noreferrer">'+safe(i.title)+'</a><small>Proposition #'+i.number+' · '+safe(i.state==='open'?'Ouverte':'Fermée')+' · '+new Date(i.created_at).toLocaleDateString('fr-FR')+'</small></div><span>↗</span></article>').join('');
}
async function loadIdeas(){
 const statusEl=$('binch-ideas-status');if(!statusEl)return;statusEl.textContent='Chargement des propositions publiques…';
 try{
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),9000);
  let response;try{response=await fetch('https://api.github.com/repos/'+REPO+'/issues?state=open&per_page=50',{headers:{Accept:'application/vnd.github+json'},signal:controller.signal,cache:'no-store'})}finally{clearTimeout(timer)}
  if(!response.ok)throw Error('GitHub API : '+response.status);
  const json=await response.json();
  issues=json.filter(i=>!i.pull_request&&Array.isArray(i.labels)&&(i.labels.some(l=>/idée|idee|suggestion|feature|enhancement/i.test(l.name))||i.title.startsWith('[Idée La Binch]')));
  statusEl.textContent=issues.length+' proposition(s) communautaire(s) trouvée(s) parmi les Issues publiques. Les nouvelles propositions nécessitent un compte GitHub.';
  renderIssues();
 }catch(e){statusEl.textContent='Lecture publique temporairement indisponible ('+String(e.message||e)+'). Tu peux toujours proposer une idée sur GitHub.';renderIssues()}
}
function createIssue(){
 const title=$('binch-idea-title').value.trim(),description=$('binch-idea-description').value.trim();
 if(title.length<6||description.length<15){$('binch-idea-feedback').textContent='Indique un titre (6 caractères minimum) et explique ton idée (15 caractères minimum).';return}
 const issueTitle='[Idée La Binch] '+title.slice(0,100);
 const body='## Proposition de la communauté La Binch\n\n'+description.slice(0,4000)+'\n\n---\n*Idée soumise volontairement depuis La Binch. Ceci n’est pas une validation ou un engagement de réalisation.*';
 const url='https://github.com/'+REPO+'/issues/new?'+new URLSearchParams({title:issueTitle,body}).toString();
 $('binch-idea-feedback').textContent='Un formulaire GitHub s’ouvre : connecte-toi puis clique sur Submit new issue pour publier réellement ta proposition. Rien n’a encore été envoyé.';
 window.open(url,'_blank','noopener,noreferrer');
}
function mount(){
 const app=$('app'),nav=app?.querySelector('nav.nav'),main=app?.querySelector('main');if(!nav||!main||$('page-todo'))return;
 const tab=document.createElement('button');tab.dataset.page='todo';tab.type='button';tab.className='binch-todo-tab';tab.textContent='To Do & Idées';
 const gm=nav.querySelector('[data-page="gm"]');if(gm)nav.insertBefore(tab,gm);else nav.append(tab);
 const section=document.createElement('section');section.id='page-todo';section.className='page';
 section.innerHTML='<div class="binch-todo"><header class="binch-todo-hero"><div class="binch-todo-overline">LA BINCH / FEUILLE DE ROUTE COMMUNAUTAIRE</div><h1>La forge <em>des idées</em></h1><p>Ce qui est construit, ce qui arrive et ce que la guilde aimerait voir naître. Les statuts distinguent le code publié des fonctions réellement testées.</p><div class="binch-todo-hero-actions"><a href="'+MASTER+'" target="_blank" rel="noopener noreferrer">Consulter la To Do List intégrale ↗</a><a href="https://github.com/'+REPO+'/issues" target="_blank" rel="noopener noreferrer">Toutes les propositions GitHub ↗</a></div></header><div class="binch-todo-kpis"><div><b>'+ITEMS.length+'</b><span>Chantiers répertoriés</span></div><div><b>'+ITEMS.filter(x=>x[1]==='P0').length+'</b><span>Priorités immédiates</span></div><div><b>'+ITEMS.filter(x=>x[2].includes('Publié')).length+'</b><span>Publiés, encore à tester</span></div><div><b>9 nov.</b><span>Dernière consolidation</span></div></div><div class="binch-todo-intro"><h2>La file de développement</h2><p id="binch-todo-count"></p></div><div class="binch-todo-filters"><label>Priorité / état<select id="binch-todo-status"><option>Tous</option><option>À faire</option><option>En cours</option><option>En test</option><option>Publié · test requis</option></select></label><label>Domaine<select id="binch-todo-category"><option>Tous</option>'+[...new Set(ITEMS.map(x=>x[5]))].sort().map(s=>'<option>'+safe(s)+'</option>').join('')+'</select></label><label class="binch-todo-search">Rechercher<input id="binch-todo-query" type="search" placeholder="Quêtes, Faith, addon, guilde…"></label></div><div id="binch-todo-list" class="binch-todo-list"></div><div class="binch-todo-public"><div class="binch-todo-intro"><h2>Les idées <em>de la guilde</em></h2><p>Vraies propositions publiques, hébergées sur GitHub et consultables par tous.</p></div><p class="binch-todo-muted" id="binch-ideas-status">Lecture des propositions publiques…</p><div id="binch-ideas-list"></div><button type="button" id="binch-ideas-refresh">↻ Actualiser les propositions</button><div class="binch-todo-form"><h3>Proposer une idée</h3><p>Le formulaire prépare une proposition sur GitHub ; sa publication exige que tu sois connecté et que tu confirmes l’envoi. Aucun faux vote ni partage automatique.</p><label>Titre de l’idée<input id="binch-idea-title" maxlength="100" placeholder="Ex. Mode healer pour le Poste de commandement"></label><label>À quoi servirait-elle ?<textarea id="binch-idea-description" maxlength="4000" rows="4" placeholder="Décris le problème, ton idée et ce qu’elle changerait pour les joueurs."></textarea></label><button type="button" id="binch-idea-send">Préparer ma proposition sur GitHub ↗</button><p id="binch-idea-feedback" role="status"></p></div></div><footer>Cette file est une synthèse éditoriale du 9 novembre 2026, pas un tableau GitHub synchronisé automatiquement. Les détails complets restent dans la To Do List maître.</footer></div>';
 main.append(section);
 tab.addEventListener('click',()=>{nav.querySelectorAll('button').forEach(b=>b.classList.toggle('active',b===tab));main.querySelectorAll('.page').forEach(p=>p.classList.toggle('active',p===section));window.scrollTo({top:0,behavior:'auto'})});
 $('binch-todo-status').addEventListener('change',e=>{status=e.target.value;render()});
 $('binch-todo-category').addEventListener('change',e=>{category=e.target.value;render()});
 $('binch-todo-query').addEventListener('input',e=>{query=e.target.value.trim();render()});
 $('binch-ideas-refresh').addEventListener('click',loadIdeas);
 $('binch-idea-send').addEventListener('click',createIssue);
 render();loadIdeas();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
})();
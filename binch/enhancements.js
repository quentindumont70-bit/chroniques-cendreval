(()=>{
  'use strict';
  const $=id=>document.getElementById(id);
  const KNOWLEDGE=[
    {id:'route-now',kind:'Progression',title:'Ta prochaine étape',text:'Ouvre la carte d’expédition : l’étape lumineuse correspond à ton niveau actuel.',tags:['progression','niveau','carte'],action:'progression'},
    {id:'group-ready',kind:'Donjon',title:'Avant de rejoindre un groupe',text:'Répare, libère tes sacs, vérifie tes accès et annonce clairement ton rôle.',tags:['donjon','groupe','tank','soigneur','dps'],action:'progression'},
    {id:'warrior',kind:'Classe',title:'Guerrier : rythme et menace',text:'Garde une arme à jour, évite de vider toute ta rage et prépare un équipement défensif si tu peux tanker.',tags:['Guerrier','tank','dps']},
    {id:'paladin',kind:'Classe',title:'Paladin : polyvalence organisée',text:'Sépare tes ensembles par rôle et garde tes bénédictions visibles dans ta préparation.',tags:['Paladin','tank','soigneur']},
    {id:'hunter',kind:'Classe',title:'Chasseur : compagnon sous contrôle',text:'Surveille la menace du familier, ses compétences et tes réserves avant de partir loin.',tags:['Chasseur','dps']},
    {id:'rogue',kind:'Classe',title:'Voleur : contrôle avant dégâts',text:'Interruptions, poisons et contrôle de cible ont souvent plus de valeur qu’un chiffre brut.',tags:['Voleur','dps']},
    {id:'priest',kind:'Classe',title:'Prêtre : préserver sa mana',text:'Anticipe les dégâts, distingue soins urgents et efficaces, et garde tes dispels disponibles.',tags:['Prêtre','soigneur','dps']},
    {id:'shaman',kind:'Classe',title:'Chaman : les bons totems',text:'Prépare un petit ensemble de totems par situation plutôt que de tout poser machinalement.',tags:['Chaman','soigneur','dps']},
    {id:'mage',kind:'Classe',title:'Mage : contrôler le combat',text:'Tes contrôles, ton eau et ton placement font partie de ta contribution au groupe.',tags:['Mage','dps']},
    {id:'warlock',kind:'Classe',title:'Démoniste : préparer ses ressources',text:'Pierres, fragments et familier doivent être prêts avant le départ du groupe.',tags:['Démoniste','dps']},
    {id:'druid',kind:'Classe',title:'Druide : plusieurs formes, plusieurs sacs',text:'Organise tes ensembles par rôle et choisis à l’avance la forme utile au groupe.',tags:['Druide','tank','soigneur','dps']},
    {id:'mining',kind:'Métier',title:'Minage : récolter sans casser le rythme',text:'Choisis une route qui suit ta progression et conserve minerais et pierres utiles.',tags:['Minage','métier']},
    {id:'engineering',kind:'Métier',title:'Ingénierie : préparer ses gadgets',text:'Classe les composants par objectif et vérifie les recettes réellement disponibles sur Forever.',tags:['Ingénierie','métier']},
    {id:'herbalism',kind:'Métier',title:'Herboristerie : une route rentable',text:'Récolte en chemin plutôt que de multiplier les détours qui ralentissent ta progression.',tags:['Herboristerie','métier']},
    {id:'alchemy',kind:'Métier',title:'Alchimie : stocks utiles à la guilde',text:'Priorise potions de soin, mana et consommables réellement demandés par ton groupe.',tags:['Alchimie','métier']},
    {id:'gm-brief',kind:'Guilde',title:'Briefing en trois minutes',text:'Objectif, composition, rôle manquant, plan B : le reste peut être délégué.',tags:['gm','guilde','raid'],action:'gm'}
  ];
  const FAVKEY='grimoire.knowledge.favorites.v1';
  let favorites=[];try{favorites=JSON.parse(localStorage.getItem(FAVKEY))||[]}catch{}
  let filter='Adapté';
  function currentProfile(){
    let s={};try{s=JSON.parse(localStorage.getItem('grimoire.hub.v3'))||{}}catch{}
    return {race:s.race||'',classe:s.classe||'',jobs:s.jobs||[],role:s.data?.role||'',level:+s.data?.level||1};
  }
  function openWizard(){
    let profile={};try{profile=JSON.parse(localStorage.getItem('grimoire.hub.v3'))||{}}catch{}
    profile.step=0;profile.onboarded=false;
    localStorage.setItem('grimoire.hub.v3',JSON.stringify(profile));
    location.reload();
  }
  function addSwitch(){
    const head=document.querySelector('.app-head'),identity=head?.querySelector('.identity');if(!head||document.querySelector('.profile-switch'))return;
    const tools=document.createElement('div');tools.className='app-tools';
    const b=document.createElement('button');b.className='profile-switch';b.innerHTML='<span class="spark">✦</span><span class="label">Changer de personnage</span>';b.onclick=openWizard;
    if(identity)tools.append(identity);tools.append(b);head.append(tools);
  }
  function fixPriority(){
    const cards=$('hub-cards');if(!cards)return;
    const priority=[...cards.querySelectorAll('.tile')].find(x=>x.textContent.includes('Priorité'));
    if(priority&&!priority.querySelector('.fun-priority')){
      const label=priority.querySelector('.muted');
      (label||priority).insertAdjacentHTML(label?'afterend':'afterbegin','<div class="fun-priority">S’amuser</div>');
    }
  }
  function buildKnowledge(){
    const main=document.querySelector('main');if(!main||$('page-bibliotheque'))return;
    const nav=document.querySelector('.nav');const navBtn=document.createElement('button');navBtn.dataset.page='bibliotheque';navBtn.textContent='Bibliothèque';nav.insertBefore(navBtn,nav.querySelector('[data-page="gm"]'));
    const page=document.createElement('section');page.id='page-bibliotheque';page.className='page';page.innerHTML='<section class="panel section"><div class="eyebrow">Base d’informations · première pierre</div><h2>Que veux-tu savoir ?</h2><p class="muted">Les conseils adaptés à ton profil remontent en premier. Les données spécifiques à Forever restent signalées lorsqu’elles doivent être confirmées.</p><div class="knowledge-search"><input id="knowledge-query" placeholder="Rechercher une classe, un métier, une activité…"></div><div class="knowledge-tabs"><button class="active">Adapté</button><button>Tout</button><button>Favoris</button></div><div id="knowledge-results" class="grid"></div></section>';main.append(page);
    navBtn.onclick=()=>showPage('bibliotheque');
    $('knowledge-query').oninput=renderKnowledge;
    page.querySelectorAll('.knowledge-tabs button').forEach(b=>b.onclick=()=>{filter=b.textContent;page.querySelectorAll('.knowledge-tabs button').forEach(x=>x.classList.toggle('active',x===b));renderKnowledge()});
  }
  function showPage(name){
    document.querySelectorAll('.nav button').forEach(x=>x.classList.toggle('active',x.dataset.page===name));
    document.querySelectorAll('.page').forEach(x=>x.classList.toggle('active',x.id==='page-'+name));
    scrollTo({top:0,behavior:'smooth'});
  }
  function score(item,p){
    const tags=item.tags.map(x=>x.toLowerCase());
    return [p.classe,p.role,...p.jobs].filter(Boolean).reduce((n,x)=>n+(tags.includes(x.toLowerCase())?2:0),item.kind==='Progression'?1:0);
  }
  function renderKnowledge(){
    const root=$('knowledge-results');if(!root)return;const p=currentProfile(),q=($('knowledge-query')?.value||'').trim().toLowerCase();
    let items=KNOWLEDGE.map(x=>({...x,score:score(x,p)}));
    if(filter==='Adapté')items=items.filter(x=>x.score>0).sort((a,b)=>b.score-a.score);
    if(filter==='Favoris')items=items.filter(x=>favorites.includes(x.id));
    if(q)items=items.filter(x=>(x.title+' '+x.text+' '+x.tags.join(' ')).toLowerCase().includes(q));
    root.innerHTML=items.length?items.map(x=>'<article class="tile knowledge-card"><button class="favorite '+(favorites.includes(x.id)?'active':'')+'" data-favorite="'+x.id+'" aria-label="Favori">★</button><span class="kind">'+x.kind+'</span><h3>'+x.title+'</h3><p>'+x.text+'</p>'+(x.score?'<span class="match">Adapté à ton profil</span>':'')+(x.action?'<p><button class="btn" data-open="'+x.action+'">Ouvrir</button></p>':'')+'</article>').join(''):'<div class="empty-state">Aucun résultat pour cette recherche.</div>';
    root.querySelectorAll('[data-favorite]').forEach(b=>b.onclick=()=>{const id=b.dataset.favorite,i=favorites.indexOf(id);if(i>=0)favorites.splice(i,1);else favorites.push(id);localStorage.setItem(FAVKEY,JSON.stringify(favorites));renderKnowledge()});
    root.querySelectorAll('[data-open]').forEach(b=>b.onclick=()=>showPage(b.dataset.open));
  }
  function quickActions(){
    const hero=document.querySelector('#page-hub .hero');if(!hero||document.querySelector('.quick-strip'))return;
    hero.insertAdjacentHTML('afterend','<div class="quick-strip"><button class="quick-action" data-quick="progression"><b>Carte</b>Voir ma prochaine étape</button><button class="quick-action" data-quick="bibliotheque"><b>Bibliothèque</b>Conseils adaptés</button><button class="quick-action" data-quick="gm"><b>Guilde</b>Préparer une soirée</button></div>');
    document.querySelectorAll('[data-quick]').forEach(b=>b.onclick=()=>showPage(b.dataset.quick));
  }
  const ATLAS={
    Alliance:[
      ['Zone de départ',[42,58,18,22],[[25,64],[34,55]],[['✦','Auberge',25,65,'service'],['⚒','Maître de métier',30,57,'metier']]],
      ['Marche de l’Ouest · Loch Modan · Sombrivage',[38,45,28,35],[[22,54],[30,46],[40,39]],[['✈','Maître de vol',31,45,'transport'],['⌂','Auberge',38,40,'service'],['⚔','Donjon proche',19,35,'donjon']]],
      ['Carmines · Bois de la Pénombre',[44,40,22,28],[[34,51],[41,57],[48,50]],[['!','Quête clé',41,57,'quete'],['⚔','Donjon',47,49,'donjon']]],
      ['Terres disputées',[44,30,22,30],[[47,48],[53,38],[61,34]],[['✈','Maître de vol',54,39,'transport'],['⚔','Donjon',61,33,'donjon']]],
      ['Zones avancées',[40,18,28,30],[[58,39],[66,28],[75,21]],[['!','Accès important',66,27,'quete'],['⚒','Ressources',73,22,'metier']]],
      ['Préparation haut niveau',[42,5,26,30],[[72,30],[80,22],[87,16]],[['⚔','Instance',82,20,'donjon'],['✦','Rassemblement',87,16,'service']]]
    ],
    Horde:[
      ['Zone de départ',[42,55,18,22],[[74,62],[68,55]],[['✦','Auberge',75,63,'service'],['⚒','Maître de métier',69,56,'metier']]],
      ['Tarides et alternatives',[39,42,28,38],[[70,58],[63,53],[58,45]],[['✈','Maître de vol',64,52,'transport'],['⌂','Auberge',58,45,'service'],['⚔','Donjon proche',79,48,'donjon']]],
      ['Serres-Rocheuses · Orneval · Mille pointes',[40,35,26,35],[[62,50],[57,42],[51,34]],[['!','Quête clé',56,42,'quete'],['⚔','Donjon',51,34,'donjon']]],
      ['Terres disputées',[41,27,24,34],[[51,43],[45,36],[39,29]],[['✈','Maître de vol',46,36,'transport'],['⚔','Donjon',39,29,'donjon']]],
      ['Zones avancées',[40,17,27,32],[[42,31],[34,24],[26,18]],[['!','Accès important',34,24,'quete'],['⚒','Ressources',27,18,'metier']]],
      ['Préparation haut niveau',[41,5,25,30],[[30,26],[21,20],[13,14]],[['⚔','Instance',20,19,'donjon'],['✦','Rassemblement',13,14,'service']]]
    ]
  };
  let atlasStage=0,atlasFilter='tout';
  function faction(){return ['Humain','Nain','Elfe','Gnome'].includes(currentProfile().race)?'Alliance':'Horde'}
  function defaultContinent(){return ['Elfe','Orc','Tauren','Troll'].includes(currentProfile().race)?'kalimdor':'est'}
  function upgradeAtlas(){
    const map=$('map');if(!map||map.dataset.atlasReady)return;map.dataset.atlasReady='1';map.classList.add('atlas-upgraded');
    map.dataset.continent=defaultContinent();
    map.insertAdjacentHTML('afterbegin','<div class="atlas-toolbar"><button class="active" data-atlas-filter="tout">Tout</button><button data-atlas-filter="transport">Vols</button><button data-atlas-filter="service">Auberges</button><button data-atlas-filter="donjon">Donjons</button><button data-atlas-filter="metier">Métiers</button><button data-atlas-filter="quete">Quêtes clés</button></div><div class="continent-tabs"><button data-continent="kalimdor">Kalimdor</button><button data-continent="est">Royaumes de l’Est</button><button data-continent="zephras">Zéphrass</button></div><div id="atlas-overlay"></div><div class="atlas-disclaimer">Cartes du client Forever · tracés et points à valider en jeu</div>');
    map.querySelectorAll('[data-atlas-filter]').forEach(b=>b.onclick=()=>{atlasFilter=b.dataset.atlasFilter;map.querySelectorAll('[data-atlas-filter]').forEach(x=>x.classList.toggle('active',x===b));renderAtlas()});
    map.querySelectorAll('[data-continent]').forEach(b=>{b.classList.toggle('active',b.dataset.continent===map.dataset.continent);b.onclick=()=>{map.dataset.continent=b.dataset.continent;map.querySelectorAll('[data-continent]').forEach(x=>x.classList.toggle('active',x===b));renderAtlas()}});
    new MutationObserver(bindStages).observe($('map-nodes'),{childList:true});setTimeout(()=>{bindStages();renderAtlas()});
  }
  function bindStages(){document.querySelectorAll('.map-node').forEach((n,i)=>n.onclick=()=>{atlasStage=i;setTimeout(renderAtlas)})}
  function renderAtlas(){
    const root=$('atlas-overlay');if(!root)return;const d=ATLAS[faction()][atlasStage]||ATLAS[faction()][0],b=d[1];
    let h='<div class="atlas-zone" data-label="'+d[0]+'" style="left:'+b[0]+'%;top:'+b[1]+'%;width:'+b[2]+'%;height:'+b[3]+'%"></div>';
    d[2].slice(0,-1).forEach((p,i)=>{const q=d[2][i+1],dx=q[0]-p[0],dy=q[1]-p[1],l=Math.hypot(dx,dy),a=Math.atan2(dy,dx)*180/Math.PI;h+='<i class="atlas-path" style="left:'+p[0]+'%;top:'+p[1]+'%;width:'+l+'%;transform:rotate('+a+'deg)"></i>'});
    d[3].forEach(p=>{const hidden=atlasFilter!=='tout'&&atlasFilter!==p[4]?' hidden':'';h+='<button class="atlas-poi"'+hidden+' data-name="'+p[1]+'" style="left:'+p[2]+'%;top:'+p[3]+'%">'+p[0]+'</button>'});root.innerHTML=h;
  }
  function boot(){addSwitch();fixPriority();buildKnowledge();quickActions();upgradeAtlas();renderKnowledge();new MutationObserver(()=>{addSwitch();fixPriority();upgradeAtlas()}).observe(document.body,{subtree:true,childList:true})}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();


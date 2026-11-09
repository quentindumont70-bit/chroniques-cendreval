/* La Binch — tests fonctionnels opt-in : ?binch-test=1 (aucune donnée modifiée). */
(()=>{'use strict';
const query=new URLSearchParams(location.search);
if(query.get('binch-test')!=='1')return;
const $=sel=>document.querySelector(sel);
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const failures=[],results=[];
const runtimeErrors=[];
let started=false;
window.addEventListener('error',e=>{if(runtimeErrors.length<30)runtimeErrors.push({type:'Erreur JavaScript',message:String(e.message||e.target?.src||'Ressource non chargée').slice(0,300)})},true);
window.addEventListener('unhandledrejection',e=>{if(runtimeErrors.length<30)runtimeErrors.push({type:'Promesse rejetée',message:String(e.reason?.message||e.reason||'Raison inconnue').slice(0,300)})});
function test(name,check){
 try{const info=check();const okay=info===true;results.push({name,pass:okay,note:okay?'':String(info||'Échec sans détail')});if(!okay)failures.push(name)}
 catch(e){results.push({name,pass:false,note:String(e&&e.message||e)});failures.push(name)}
}
function sectionCheck(id,description){test(description,()=>document.getElementById(id)?true:'Élément #'+id+' absent')}
function run(){
 if(started)return;started=true;
 const diagnostic=document.createElement('aside');diagnostic.id='binch-site-diagnostics';
 diagnostic.setAttribute('role','region');diagnostic.setAttribute('aria-label','Tests du portail La Binch');
 diagnostic.innerHTML='<header><strong>Diagnostic de La Binch</strong><button type="button" id="binch-diag-close" aria-label="Fermer le diagnostic">×</button></header><p>Tests sans envoi de formulaire ni import de données. Les essais de navigation peuvent faire défiler la page et déclencher les sauvegardes habituelles des modules.</p><div id="binch-diag-overview"></div><ul id="binch-diag-results"></ul><div class="binch-diag-actions"><button type="button" id="binch-diag-copy">Copier le rapport</button><button type="button" id="binch-diag-rerun">Relancer les tests</button></div>';
 document.body.append(diagnostic);
 const app=$('#app'),onboarding=Boolean(app&&app.classList.contains('hidden'));
 failures.length=0;results.length=0;
 sectionCheck('app','Application principale');
 sectionCheck('page-hub','Carnet de route');
 sectionCheck('page-progression','Carte / progression');
 sectionCheck('page-gm','Mode GM');
 sectionCheck('page-sync','Page de synchronisation');
 sectionCheck('page-bibliotheque','Bibliothèque');
 sectionCheck('binch-gm-hub','Centre de commandement GM');
 sectionCheck('binch-guild-roster','Composition des groupes');
 sectionCheck('binch-guild-calendar','Calendrier des sorties');
 sectionCheck('binch-guild-weekly','Vue hebdomadaire');
 sectionCheck('binch-dungeon-prep','Préparation des donjons');
 sectionCheck('binch-gm-workspace','Ateliers GM repliables');
 sectionCheck('binch-zone-planner','Parcours par zone');
 sectionCheck('binch-mobile-navigation','Navigation mobile');
 if(onboarding)sectionCheck('binch-first-visit','Guide de première visite');
 // These are created only when the character dashboard is mounted.
 if(!onboarding){
  sectionCheck('binch-adventure-home','Accueil du personnage');
  sectionCheck('binch-adventure-tools','Ateliers du personnage');
  sectionCheck('binch-progression-pulse','Priorités de leveling');
  sectionCheck('binch-session-planner','Planificateur de session');
  sectionCheck('binch-personal-objectives','Objectifs personnalisés');
  sectionCheck('binch-leveling-journal','Journal de progression');
  sectionCheck('binch-local-backup','Sauvegarde locale');
 }else{
  test('Onboarding actif (modules du personnage non testables)',()=>true);
 }
 test('Toutes les destinations du menu pointent vers une page',()=>{
  const nav=$('#app nav.nav');if(!nav)return 'Navigation absente';
  const broken=[...nav.querySelectorAll('[data-page]')].filter(b=>{
   const slug=b.dataset.page;
   return !slug||!document.getElementById('page-'+slug);
  });
  return broken.length?'Pages inexistantes : '+broken.map(b=>b.dataset.page||'?').join(', '):true;
 });
 test('Boutons sans destination dans le centre GM',()=>{
  const commands=[...document.querySelectorAll('#binch-gm-hub [data-gm-destination]')];
  const destinations={event:'#page-gm .binch-gm-details',roster:'#binch-guild-roster',calendar:'#binch-guild-calendar',dungeon:'#binch-dungeon-prep',coffre:'#page-coffre',macros:'#page-macros',planner:'#binch-guild-planner',bibliotheque:'#page-bibliotheque'};
  const missing=commands.filter(b=>{const selector=destinations[b.dataset.gmDestination];if(b.dataset.gmDestination==='planner'&&!$(selector)&&document.querySelector('script[src*="guild-planner.js"]'))return false;return !selector||!$(selector)});
  return missing.length?('Commandes sans cible : '+missing.map(b=>b.dataset.gmDestination).join(', ')):true;
 });
 test('Guide de démarrage non bloquant',()=>{
  if(!onboarding)return true;
  const guide=$('#binch-first-visit');
  return guide&&$('#next')&&$('#race-choices')&&$('#class-choices')?true:'La première visite ou les contrôles du profil sont absents';
 });
 test('Navigation principale fonctionnelle',()=>{
  const nav=$('#app nav.nav');
  if(!nav)return 'Barre de navigation absente';
  for(const id of ['hub','progression','gm','sync','bibliotheque']){
   if(!nav.querySelector('[data-page="'+id+'"]'))return 'Lien manquant : '+id;
  }
  return true;
 });
 test('Partage de la bêta sans confusion',()=>{
  const share=$('#binch-share-kit');if(!share)return 'Panneau de partage absent';
  return share.querySelector('#binch-share-copy')&&share.querySelector('#binch-share-invite')?true:'Boutons de partage incomplets';
 });
 test('Navigation mobile câblée',()=>{
  const panel=$('#binch-mobile-navigation');
  return panel&&panel.querySelectorAll('[data-mobile-page]').length>=4&&$('#binch-mobile-more')?true:'Contrôles mobiles absents';
 });
 test('Formulaire GM et copie Discord',()=>{
  return $('#binch-roster-form')&&$('#binch-roster-copy')&&$('#binch-calendar-form')&&$('#binch-weekly-copy')&&$('#binch-dungeon-copy')?true:'Un des contrôles GM manque';
 });
 test('Suggestions de zones cohérentes avec la faction',()=>{
  if(onboarding)return true;
  let profile;try{profile=JSON.parse(localStorage.getItem('grimoire.hub.v3'))||{}}catch{profile={}}
  const race=profile.race;
  const faction=['Humain','Nain','Elfe','Gnome'].includes(race)?'Alliance':['Orc','Tauren','Troll','MortVivant'].includes(race)?'Horde':'Neutre';
  if(faction==='Neutre')return true;
  const zones=Array.isArray(window.GRIMOIRE_ZONES)?window.GRIMOIRE_ZONES:[];
  const row=$('#binch-route-list [data-category="Zone"] strong');
  if(!row)return 'Aucune zone affichée dans le Carnet';
  const chosen=zones.find(z=>row.textContent==='Explorer '+z.name);
  if(!chosen)return 'Zone de l’itinéraire absente du catalogue';
  return ['Neutre','Mixte',faction].includes(chosen.faction||'Neutre')?true:'Zone adverse proposée : '+chosen.name;
 });
 test('Raccourcis des objectifs vers les outils',()=>{
  if(onboarding)return true;
  const rows=[...document.querySelectorAll('#binch-route-list [data-category="Zone"], #binch-route-list [data-category="Donjon"]')];
  return rows.every(row=>row.querySelector('[data-route-open]'))?true:'Un raccourci de zone/donjon est manquant';
 });
 test('Formulaires et notes du joueur',()=>{
  if(onboarding)return true;
  return $('#binch-objective-form')&&$('#binch-session-copy')&&$('#binch-level-log-form')&&$('#binch-backup-export')?true:'Un des contrôles du joueur manque';
 });
 test('Bibliothèque : onglets et recherche',()=>$('#page-bibliotheque #knowledge-query')&&$('#page-bibliotheque .knowledge-tabs')?true:'Recherche ou onglets absents');
 test('Widgets GM : outils effectivement regroupés',()=>{
  const wrapper=$('#binch-gm-workspace');if(!wrapper)return 'Atelier GM absent';
  const needed=['binch-guild-weekly','binch-guild-calendar','binch-guild-roster','binch-dungeon-prep'];
  return needed.every(id=>$('#'+id)?.closest('.binch-gm-workspace-group')===wrapper.querySelector('[data-gm-panel="'+id+'"]'))?true:'Certains outils ne sont pas dans le bon panneau';
 });
 if(!onboarding)test('Widgets joueur : outils regroupés',()=>{
  const wrapper=$('#binch-adventure-tools');if(!wrapper)return 'Ateliers du joueur absents';
  return ['binch-session-planner','binch-personal-objectives','binch-leveling-journal'].every(id=>$('#'+id)?.closest('details.binch-tool-accordion')?.dataset.tool===id)?true:'Un panneau est mal positionné';
 });
 // Exercise every available tab without changing the user's saved progress.
 if(!onboarding){
  test('Clic de tous les onglets de navigation',()=>{
   const nav=$('#app nav.nav');if(!nav)return 'Menu principal absent';
   const before=nav.querySelector('button.active[data-page]')?.dataset.page||'hub';
   const broken=[];
   const buttons=[...nav.querySelectorAll('button[data-page]')];
   try{
    for(const button of buttons){
     const slug=button.dataset.page;
     if(!slug||!$('#page-'+slug))continue;
     button.click();
     const current=$('#page-'+slug);
     if(!current?.classList.contains('active'))broken.push(slug);
    }
   }finally{
    const initial=nav.querySelector('button[data-page="'+before+'"]')||nav.querySelector('button[data-page="hub"]');
    if(initial)initial.click();
   }
   return broken.length?'Onglets inactifs : '+broken.join(', '):true;
  });
 }
 // Execute real click navigation on established buttons; restore state immediately.
 if(!onboarding){
  test('Clic de navigation vers la progression',()=>{
   const nav=$('#app nav.nav [data-page="progression"]'),before=$('#app .page.active')?.id;
   if(!nav)return 'Bouton progression absent';
   try{nav.click();return $('#page-progression')?.classList.contains('active')?true:'La page ne devient pas active'}
   finally{const original=document.querySelector('#app nav.nav [data-page="'+String(before||'page-hub').replace(/^page-/,'')+'"]');if(original)original.click();}
  });
  test('Clic de navigation vers la bibliothèque',()=>{
   const nav=$('#app nav.nav [data-page="bibliotheque"]'),before=$('#app .page.active')?.id;
   if(!nav)return 'Bouton bibliothèque absent';
   try{nav.click();return $('#page-bibliotheque')?.classList.contains('active')?true:'La bibliothèque ne devient pas active'}
   finally{const original=document.querySelector('#app nav.nav [data-page="'+String(before||'page-hub').replace(/^page-/,'')+'"]');if(original)original.click();}
  });
 }
 test('Identifiants HTML sans doublons',()=>{
  const ids=new Set(),duplicates=new Set();
  document.querySelectorAll('[id]').forEach(node=>{if(ids.has(node.id))duplicates.add(node.id);else ids.add(node.id)});
  return duplicates.size?('Identifiants répétés : '+[...duplicates].slice(0,6).join(', ')):true;
 });
 test('Pas de débordement horizontal de la page',()=>{
  const overflow=document.documentElement.scrollWidth-window.innerWidth;
  return overflow<=5?true:('Débordement horizontal de '+Math.ceil(overflow)+' px');
 });
 if(!onboarding&&window.matchMedia('(max-width:750px)').matches){
  test('Zones tactiles du menu mobile',()=>{
   const controls=[...document.querySelectorAll('#binch-mobile-navigation button')];
   const narrow=controls.filter(b=>{const rect=b.getBoundingClientRect();return rect.width<40||rect.height<44});
   return narrow.length?('Boutons trop petits : '+narrow.map(b=>b.getAttribute('aria-label')||b.textContent.trim()).join(', ')):true;
  });
 }
 test('Erreurs JavaScript observées depuis l’ouverture du diagnostic',()=>runtimeErrors.length?runtimeErrors.map(e=>e.type+' : '+e.message).join(' ; '):true);
 const pass=results.filter(x=>x.pass).length;
 $('#binch-diag-overview').textContent=pass+' / '+results.length+' vérifications réussies'+(failures.length?' · '+failures.length+' échec(s)':'')+(onboarding?' · personnage non configuré':'');
 $('#binch-diag-overview').dataset.status=failures.length?'fail':'pass';
 $('#binch-diag-results').innerHTML=results.map(x=>'<li class="'+(x.pass?'passed':'failed')+'"><span>'+(x.pass?'✓':'×')+'</span><div><strong>'+esc(x.name)+'</strong>'+(x.note?'<small>'+esc(x.note)+'</small>':'')+'</div></li>').join('');
 $('#binch-diag-close').onclick=()=>diagnostic.remove();
 $('#binch-diag-rerun').onclick=()=>{diagnostic.remove();started=false;run()};
 $('#binch-diag-copy').onclick=()=>{
  const report=['La Binch — diagnostic local','Total : '+pass+'/'+results.length,'Appareil : '+(window.innerWidth<751?'mobile':'ordinateur'),'Date : '+new Date().toISOString(),'URL : '+location.origin+location.pathname,'',''].concat(results.map(x=>(x.pass?'OK':'ÉCHEC')+' — '+x.name+(x.note?' : '+x.note:''))).join('\n');
  if(navigator.clipboard?.writeText)navigator.clipboard.writeText(report).then(()=>{$('#binch-diag-copy').textContent='Rapport copié ✓'}).catch(()=>prompt('Copier le rapport',report));
  else prompt('Copier le rapport',report);
 };
}
function scheduleFirstRun(){
 // Dynamic modules (e.g. Guild Planner, Bibliothèque) can mount after DOMContentLoaded.
 // Prefer a complete DOM rather than a misleading list of temporary missing elements.
 const ready=()=>{
  const app=$('#app'),onboarding=app?.classList.contains('hidden');
  return Boolean($('#page-bibliotheque')&&$('#binch-gm-workspace')&&$('#binch-mobile-navigation')&&$('#binch-share-kit')&&(onboarding||($('#binch-adventure-home')&&$('#binch-adventure-tools'))));
 };
 if(ready()){setTimeout(run,100);return;}
 const observer=new MutationObserver(()=>{
  if(ready()){observer.disconnect();clearTimeout(expiry);setTimeout(run,100);}
 });
 observer.observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
 const expiry=setTimeout(()=>{observer.disconnect();run()},6500);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',scheduleFirstRun);else scheduleFirstRun();
})();
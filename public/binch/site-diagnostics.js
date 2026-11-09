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
 diagnostic.innerHTML='<header><strong>Diagnostic de La Binch</strong><button type="button" id="binch-diag-close" aria-label="Fermer le diagnostic">×</button></header><p>Tests non destructifs des pages et des contrôles, sans écriture dans les données du joueur. Les deux tests de navigation peuvent faire défiler la page.</p><div id="binch-diag-overview"></div><ul id="binch-diag-results"></ul><div class="binch-diag-actions"><button type="button" id="binch-diag-copy">Copier le rapport</button><button type="button" id="binch-diag-rerun">Relancer les tests</button></div>';
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
 test('Navigation principale fonctionnelle',()=>{
  const nav=$('#app nav.nav');
  if(!nav)return 'Barre de navigation absente';
  for(const id of ['hub','progression','gm','sync','bibliotheque']){
   if(!nav.querySelector('[data-page="'+id+'"]'))return 'Lien manquant : '+id;
  }
  return true;
 });
 test('Navigation mobile câblée',()=>{
  const panel=$('#binch-mobile-navigation');
  return panel&&panel.querySelectorAll('[data-mobile-page]').length>=4&&$('#binch-mobile-more')?true:'Contrôles mobiles absents';
 });
 test('Formulaire GM et copie Discord',()=>{
  return $('#binch-roster-form')&&$('#binch-roster-copy')&&$('#binch-calendar-form')&&$('#binch-weekly-copy')&&$('#binch-dungeon-copy')?true:'Un des contrôles GM manque';
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
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(run,150));else setTimeout(run,150);
})();
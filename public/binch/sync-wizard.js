/* La Binch — aide à la première synchronisation. Entièrement locale, aucun accès au disque. */
(()=>{'use strict';
const KEY='binch.sync.onboarding.v1';
const $=s=>document.querySelector(s);
const steps=[
['Installer une fois','Télécharge l’installateur et sélectionne ton dossier World of Warcraft. Ne lance jamais le script si sa provenance te semble suspecte.'],
['Activer dans WoW','Relance le jeu, vérifie que GrimoireSync est coché dans AddOns, puis connecte-toi sur ton personnage.'],
['Sauvegarder les données','Fais /reload (ou déconnecte-toi). Cela crée / met à jour le fichier local de l’addon.'],
['Relier le fichier','Dans le panneau « Ton personnage, sans ressaisie », sélectionne le fichier GrimoireSync.lua, puis autorise sa lecture.'],
['Contrôler le profil','Confirme le nom, la classe, le niveau et la zone. Ne partage jamais ton dossier WTF complet.']
];
function getState(){try{const d=JSON.parse(localStorage.getItem(KEY));return Array.isArray(d)&&d.length===steps.length?d:Array(steps.length).fill(false)}catch{return Array(steps.length).fill(false)}}
function setState(v){try{localStorage.setItem(KEY,JSON.stringify(v))}catch{}}
function mount(){const target=$('#page-sync .binch-sync-guide');if(!target||$('#binch-sync-wizard'))return;
const wizard=document.createElement('section');wizard.id='binch-sync-wizard';wizard.setAttribute('aria-label','Assistant de première synchronisation');
wizard.innerHTML='<div class="binch-wizard-top"><div><span class="binch-wizard-overline">CONFIGURATION GUIDÉE · SANS PYTHON</span><h3>Connexion WoW en 5 missions</h3><p>Quelques minutes une seule fois. Ensuite, un simple <code>/reload</code> et le suivi peut actualiser ton profil si tu l’as autorisé.</p></div><div class="binch-wizard-count"><span id="binch-wizard-count">0 / 5</span><small>missions</small></div></div><div class="binch-wizard-track"><span id="binch-wizard-progress"></span></div><div id="binch-wizard-tasks" class="binch-wizard-tasks"></div><div class="binch-wizard-actions"><a href="./Installer-La-Binch.cmd" download>↓ Télécharger l’installateur</a><button type="button" id="binch-wizard-go">✦ Choisir mon fichier WoW (.lua)</button><button type="button" id="binch-wizard-reset">Réinitialiser les étapes</button></div><details class="binch-wizard-details"><summary>Je suis bloqué : quel fichier choisir et où le trouver ?</summary><p>Le fichier attendu s’appelle <code>GrimoireSync.lua</code> et se trouve habituellement dans <code>World of Warcraft/_forever_/WTF/Account/&lt;compte&gt;/SavedVariables/</code>. Le fichier <code>Core.lua</code> situé dans <code>Interface/AddOns</code> n’est pas une sauvegarde.</p><p>Si le fichier n’existe pas : vérifie que l’addon apparaît comme compatible et activé dans WoW, puis utilise <code>/grimoire</code> et <code>/reload</code>. Si le fichier existe mais est refusé, assure-toi que WoW a fini de sauvegarder, puis recommence l’import.</p><p>Opera, Chrome et Edge peuvent mémoriser l’accès choisi. Selon les autorisations et la version du navigateur, une confirmation sera parfois redemandée ; sur les autres navigateurs, utilise l’import manuel.</p></details><p class="binch-wizard-disclaimer">L’addon n’envoie rien sur Internet. Les étapes cochées sont stockées dans ce navigateur. Aucun compte Battle.net, mot de passe ou clé API n’est demandé.</p>';
target.insertBefore(wizard,target.querySelector('.binch-sync-steps'));
const legacy=target.querySelector('.binch-sync-steps');
if(legacy){
 const details=document.createElement('details');details.className='binch-wizard-legacy';
 const summary=document.createElement('summary');summary.textContent='Mode d’emploi détaillé (installation manuelle, Mac/Linux, dépannage)';
 details.append(summary,legacy);wizard.insertAdjacentElement('afterend',details);
}

const list=$('#binch-wizard-tasks');const saved=getState();
steps.forEach(([heading,detail],i)=>{
const label=document.createElement('label');label.className='binch-wizard-task';
const input=document.createElement('input');input.type='checkbox';input.checked=!!saved[i];input.dataset.step=String(i);
const text=document.createElement('span'),title=document.createElement('strong'),explain=document.createElement('small');
title.textContent=(i+1)+'. '+heading;explain.textContent=detail;text.append(title,explain);label.append(input,text);list.append(label);
input.addEventListener('change',()=>{const all=getState();all[i]=input.checked;setState(all);render()});
});
function render(){const all=getState();const n=all.filter(Boolean).length;$('#binch-wizard-count').textContent=n+' / '+steps.length;$('#binch-wizard-progress').style.width=(100*n/steps.length)+'%';list.querySelectorAll('input').forEach((x,i)=>x.checked=!!all[i]);wizard.dataset.complete=n===steps.length?'true':'false'}
$('#binch-wizard-reset').addEventListener('click',()=>{setState(Array(steps.length).fill(false));render()});
$('#binch-wizard-go').addEventListener('click',()=>{
 // La sélection du fichier doit être déclenchée directement par le geste utilisateur :
 // un simple scrollIntoView peut échouer et ne déclenche jamais l'import.
 const automatic=$('#binch-easy-action');
 const manual=$('#grimoire-bridge-file')||$('#grimoire-bridge input[type="file"]');
 const destination=automatic||manual;
 if(destination){
  const section=destination.closest('#binch-easy-sync,#grimoire-bridge');
  if(section){section.scrollIntoView({block:'center',behavior:'instant'});section.classList.add('binch-import-target');setTimeout(()=>section.classList.remove('binch-import-target'),2200)}
  destination.click();
 }else{
  const status=$('#binch-wizard-feedback')||document.createElement('p');
  status.id='binch-wizard-feedback';status.setAttribute('role','alert');
  status.textContent='Le module d’import n’est pas prêt. Recharge La Binch puis réessaie.';
  wizard.querySelector('.binch-wizard-actions').after(status);
 }
});
render();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
})();
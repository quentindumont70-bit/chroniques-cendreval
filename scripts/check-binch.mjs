// Vérification légère de La Binch avant publication GitHub Pages.
// Ne demande aucune dépendance ni navigateur. Ne remplace pas les tests UX.
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';

const root=path.resolve('public/binch'), errors=[], warnings=[];
const read=(file)=>fs.readFileSync(path.join(root,file),'utf8');
const present=(p)=>fs.existsSync(path.join(root,p));
const fail=(msg)=>errors.push(msg);

if(!present('index.html'))fail('index.html est absent');
else {
 const html=read('index.html');
 const scripts=[...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)];
 for(let n=0;n<scripts.length;n++){
  const [_,attrs,code]=scripts[n];
  if(!/\bsrc\s*=/.test(attrs) && code.trim()){
   try{new vm.Script(code,{filename:'index.html:script-'+n})}
   catch(e){fail('Erreur de syntaxe inline script '+n+': '+e.message)}
  }
 }
 for(const id of ['page-hub','page-gm','page-sync']){
  if(!html.includes('id="'+id+'"'))fail('Point d’ancrage manquant : '+id);
 }
 const refs=[...html.matchAll(/\b(?:src|href)\s*=\s*["']\.\/([^"']+)["']/gi)].map(x=>x[1]);
 for(const ref of refs) {
  const localFile=ref.split(/[?#]/,1)[0];
  if(!present(localFile))fail('Fichier HTML référencé mais absent : '+localFile);
 }
}
const scripts=fs.readdirSync(root).filter(x=>x.endsWith('.js')).sort();
for(const file of scripts){
 const source=read(file);
 try{new vm.Script(source,{filename:file})}
 catch(e){fail('JavaScript invalide '+file+': '+e.message)}
 const refs=[...source.matchAll(/(?:\.src|\.href)\s*=\s*["']\.\/([^"']+\.(?:js|css)(?:\?[^"']*)?)["']/g)].map(x=>x[1]);
 for(const ref of refs){const localFile=ref.split(/[?#]/,1)[0];if(!present(localFile))fail(file+' charge un fichier absent : '+localFile)}
}

// Regressions connues : le sélecteur doit exister dans le HTML, même sans JS.
const portal=read('index.html'),importer=read('import-drop.js');
for(const id of ['binch-direct-import','binch-direct-drop','binch-direct-file','binch-direct-run','binch-direct-import-status']){
 if(!portal.includes('id="'+id+'"'))fail('Import Opera : contrôle HTML manquant : '+id);
}
if(!portal.includes('import-drop.js?v=')||!portal.includes('import-direct.css?v='))
 fail('Import Opera : ressources de synchronisation non reliées au portail.');
if(!importer.includes('window.BinchSync.parsePayload')||!importer.includes('window.BinchSync.importCharacter'))
 fail('Import Opera : parseur ou import réel non relié.');
const validLuaPattern='^GrimoireSync'+String.fromCharCode(92)+'.lua$';
if(!importer.includes('/'+validLuaPattern+'/i'))fail('Import Opera : expression régulière du nom GrimoireSync.lua incorrecte.');
if(!new RegExp(validLuaPattern,'i').test('GrimoireSync.lua'))fail('Import Opera : nom de fichier refusé.');
if(portal.includes('chatgpt.site'))fail('La Binch : dépendance à chatgpt.site encore présente dans la page.');
if(!present('binch-backdrop.svg'))fail('La Binch : fond local manquant.');


// Console deuxième écran : toute la chaîne doit survivre à la compilation et rester autonome.
for(const file of ['command-center.js','command-center.css','command-notes.js','command-notes.css','command-session.js','command-session.css','play-now.js']){
 if(!present(file))fail('Poste de commandement : ressource absente : '+file);
 if(!portal.includes('./'+file+'?v='))fail('Poste de commandement : ressource non chargée : '+file);
}
if(present('command-center.js')){
 const command=read('command-center.js');
 for(const id of ['page-command','binch-command-name','binch-command-level','binch-command-xp-fill','binch-command-stats']){
  if(!command.includes(id))fail('Poste de commandement : point d’ancrage manquant : '+id);
 }
 if(!command.includes("grimoire.bridge.last")||!command.includes("data-command-link")&&!command.includes("data-command-link"))
  warnings.push('Poste de commandement : vérifier la source locale et les liens de navigation.');
}

// Editeur façon WoW : aimantation grille + panneaux, persistance par page.
for(const file of ['ui-editor.js','ui-editor.css']){
 if(!present(file))fail('Mode Modifier l’interface : ressource absente : '+file);
 if(!portal.includes('./'+file+'?v='))fail('Mode Modifier l’interface : ressource non liée : '+file);
}
if(present('ui-editor.js')){
 const editor=read('ui-editor.js');
 for(const token of ['binch-editor-toggle','binch-edit-toolbar','binch.ui.editor.v1','binch.ui.magnet.v1','magnetic(','resize','binch-edit-guide-x','binch-edit-guide-y']){
  if(!editor.includes(token))fail('Editeur WoW : fonctionnalité manquante '+token);
 }
}

// Cockpit deuxième écran : disposition persistante, contrôles vrais et absence de télémétrie.
for(const file of ['command-layout.js','command-layout.css']){
 if(!present(file))fail('Cockpit personnalisable : ressource absente : '+file);
 if(!portal.includes('./'+file+'?v='))fail('Cockpit personnalisable : ressource non liée : '+file);
}
if(present('command-layout.js')){
 const layout=read('command-layout.js');
 for(const token of ['binch.command.layout.v1','binch-command-widget-list','binch-command-deck','commandColumns','leveling','minimal','gathering']){
  // The grid property is represented by dataset.commandColumns on the page element.
  if(!layout.includes(token))fail('Cockpit personnalisable : contrat manquant : '+token);
 }
 if(layout.includes('MutationObserver('))fail('Cockpit personnalisable : observateur global interdit en continu.');
}

// Faith V3 : le radar et les suggestions exploitent exactement le catalogue affiché.
for(const file of ['command-discoveries.js','command-discoveries.css']){
 if(!present(file))fail('Radar de découvertes : ressource absente : '+file);
 if(!portal.includes('./'+file+'?v='))fail('Radar de découvertes : ressource non chargée : '+file);
}
if(!portal.includes('window.BinchDiscoveries'))fail('Faith : accès au catalogue de découvertes manquant dans le portail.');
if(present('command-discoveries.js')){
 const radar=read('command-discoveries.js');
 if(!radar.includes('BinchDiscoveries')||!radar.includes('BinchPinned'))fail('Radar : source ou action épingler non fonctionnelle.');
}

// Interface publique des chantiers et premières décisions locales de Faith.
for(const file of ['todo-community.js','todo-community.css','faith-strategist.js','faith-strategist.css']){
 if(!present(file))fail('Communauté/Faith : ressource absente : '+file);
 if(!portal.includes('./'+file+'?v='))fail('Communauté/Faith : ressource non chargée : '+file);
}
if(present('todo-community.js')){
 const todo=read('todo-community.js');
 if(!todo.includes('page-todo')||!todo.includes('issues/new')||!todo.includes('Submit new issue'))
  fail('Onglet To Do : navigation ou publication explicite des idées manquante.');
}
if(present('faith-strategist.js')){
 const strategist=read('faith-strategist.js');
 if(!strategist.includes('BinchDiscoveries')||!strategist.includes('BinchPinned'))fail('Faith V3 : liaison des découvertes et épingles absente.');
 if(!portal.includes('window.BinchDiscoveries'))fail('Faith V3 : catalogue de découvertes non exposé depuis le site.');
 if(!strategist.includes('grimoire.bridge.last')||!strategist.includes('binch-faith-advice'))
  fail('Faith stratège : recommandations ou source de données manquantes.');
}


 // Phase 1 — tests statiques des limites de ressources et de l'éditeur V3.
for(const file of ['companion-local.js','companion-local.css','Compagnon-La-Binch.ps1','Lancer-Compagnon-La-Binch.cmd']) {
 if(!present(file))fail('Compagnon Windows : ressource absente : '+file);
}
if(present('companion-local.js')) {
 const companion=read('companion-local.js');
 for(const term of ['127.0.0.1:18764','X-Binch-Token','visibilitychange','If-None-Match','binch-companion-stop']) {
  if(!companion.includes(term))fail('Compagnon : contrat absent '+term);
 }
 if(!portal.includes('companion-local.js?v='))fail('Compagnon : script non relié à la page.');
}
if(present('Compagnon-La-Binch.ps1')) {
 const ps=read('Compagnon-La-Binch.ps1');
 for(const term of ['IPAddress]::Loopback','RandomNumberGenerator','SavedVariables','If-None-Match','Access-Control-Allow-Origin']) {
  if(!ps.includes(term)&&!ps.toLowerCase().includes(term.toLowerCase()))fail('Compagnon PowerShell : garde-fou manquant '+term);
 }
}
if(present('ui-editor.js')){
 const editor=read('ui-editor.js');
 for(const term of ['undoStack','redoStack','exportLayout','importLayout','constrainMove','record.height','saveProfile']){
  if(!editor.includes(term))fail('Editeur V3 : contrat absent '+term);
 }
}
if(present('sync-easy.js')){
 const sync=read('sync-easy.js');
 if(sync.includes('setInterval('))fail('Performance Opera : synchronisation encore sur un intervalle permanent.');
 if(!sync.includes('visibilitychange')||!sync.includes('30000'))fail('Performance Opera : pause ou cadence manquante.');
}

const index=read('index.html'),treasures=read('treasures.js');
if(!index.includes('Bêta de guilde 0.21')||!index.includes('0.21-guild'))fail('Titre ou metadata de version non synchronisé avec 0.21');
if(!index.includes('window.BinchRewards')||!index.includes('draw:(canvas,id)')||!treasures.includes('API.draw?.'))fail('Contrat sprite Trésors incomplet');
const faith=read('faith-avatar.js'),intendant=read('intendant.js');
if(!faith.includes('window.BinchFaithAvatar')||!faith.includes('requestAnimationFrame')||!faith.includes('reducedMotion()')||!faith.includes("visibilitychange"))fail('Contrat Faith : animation vocale performante ou gestion de visibilité manquante.');
if(!intendant.includes('binch-faith-canvas')||!intendant.includes("window.BinchFaithAvatar?.speak(answer.text)"))fail('Faith n’est plus relié aux réponses de l’intendant.');
const planner=read('guild-planner.js');
if(planner.includes('form.elements.item.value'))fail('Le formulaire Guild Planner utilise une propriété native ambiguë');
const rareScenes=read('true-procs.js');
if(!rareScenes.includes('binch-real-procs-jump'))fail('Lien depuis Choc nébulaire vers les procs WoW absent.');
const trueProcs=read('wow-procs.js');
if(!trueProcs.includes('Choc nébulaire')||!trueProcs.includes('Non confirmée')||!trueProcs.includes('wowhead.com/forever'))fail('Vrais procs : manque séparation des cosmétiques, sources ou signalement des taux inconnus.');
const toolkit=read('trade-toolkit.js');
if(!toolkit.includes('Marteau de forgeron')||!toolkit.includes('Ingénierie')||!toolkit.includes('inventory'))fail('Conseiller métiers et dépendance au marteau de forgeron manquants.');
const player=read('player-home.js'),playerStyle=read('player-home.css');
if(!player.includes("updateLevelRing(last,p)")||!player.includes("rawXP!==null")||!playerStyle.includes(".binch-level-ring"))fail('Anneau XP : liaison ou garde-fou anti-valeurs absentes manquant.');
// Real quest-log plumbing must be present end-to-end, not a decorative widget.
for(const file of ['command-questlog.js','command-questlog.css']){
 if(!present(file))fail('Journal de quêtes : ressource absente : '+file);
 if(!portal.includes('./'+file+'?v='))fail('Journal de quêtes : non chargé dans le portail : '+file);
}
if(!portal.includes('questLogAPI')||!portal.includes('questLog:snap.questLog'))
 fail('Journal de quêtes : métadonnées GF6 non importées dans le profil');
if(present('command-questlog.js')){
 const questView=read('command-questlog.js');
 if(!questView.includes('last.questLog')||!questView.includes('BinchPinned'))
  fail('Journal de quêtes : liste exportée et épinglage non reliés.');
}
const addonCore=read('addon/GrimoireSync/Core.lua'),addonToc=read('addon/GrimoireSync/GrimoireSync.toc'),installer=read('Installer-La-Binch.ps1');
if(!addonCore.includes('PLAYER_XP_UPDATE')||!addonCore.includes('UnitXP')||!addonCore.includes('captureXP()')||!addonCore.includes('GrimoireSyncDB.xpStatus'))fail('Addon GrimoireSync : suivi XP ou diagnostic manquant.');
if(!addonCore.includes('GetAllCompletedQuestIDs')||!addonCore.includes('captureQuestLog()')||!addonCore.includes('questLogAPI'))fail('Addon GrimoireSync : collecte du journal de quêtes incomplète.');
const addonVersion=addonToc.match(/^## Version:\s*([0-9]+(?:\.[0-9]+)+)\s*$/m)?.[1];
if(!addonVersion)fail('Version GrimoireSync absente du TOC.');
else {
 const installerVersion=installer.match(/installation locale GrimoireSync v([0-9]+(?:\.[0-9]+)+)/)?.[1];
 if(installerVersion!==addonVersion)fail('La version installateur ('+installerVersion+') diffère du TOC ('+addonVersion+').');
 const escapedVersion=addonVersion.replace(/\./g,'\\.');
 if(!installer.includes('Version: '+escapedVersion))fail('La validation de version dans l’installateur ne correspond pas au TOC.');
}
if(!installer.includes("Minimap.lua\\\\s*")&&!installer.includes("Minimap.lua\\s*"))fail('Validation des fichiers de l’installateur non reconnue.');

for(const token of ['Get-LastFolder','Save-LastFolder','Show-InstallResult','if ($sameFiles)','Get-FileHash','wowProcesses']){
 if(!installer.includes(token))fail('Installateur un clic : composant manquant '+token);
}
if(!portal.includes('Installer ou mettre à jour GrimoireSync'))fail('Portail : instructions de mise à jour simplifiée absentes.');

const lfg=read('lfg.js'),config=JSON.parse(read('lfg-cloud-config.json'));
if(!lfg.includes('Mode local uniquement')||!lfg.includes('online'))fail('Le LFG ne distingue plus clairement les modes local et partagé');
if(!config.supabaseUrl||!config.supabasePublishableKey)warnings.push('Le LFG collectif n’est PAS encore connecté (configuration Supabase vide).');
if(!planner.includes('Prototype local non partagé'))warnings.push('Le Guild Planner doit être annoncé comme local.');
// Régressions connues du 10 novembre : pas de sélecteur CSS passé au helper getElementById.
// Et l'atelier AH doit pouvoir se monter même si market-board.js possède déjà la page.
if(present('gear-sets.js')) {
 const gear=read('gear-sets.js');
 if(!gear.includes('document.getElementById(id)'))fail('Ensembles équipement : helper DOM inattendu.');
 if(/\$\(\s*['"`]#binch-gear-set-/.test(gear))
  fail('Ensembles équipement : ID préfixé par # avec getElementById.');
 for(const id of ['binch-gear-set-form','binch-gear-set-selected','binch-gear-set-delete','binch-gear-set-copy']) {
  if(!gear.includes("$('"+id+"')"))fail('Ensembles équipement : liaison DOM manquante '+id);
 }
}
if(present('ah-craft.js')) {
 const craft=read('ah-craft.js');
 if(!craft.includes("else page.append(section)"))
  fail('Atelier AH : montage de repli absent lorsque market-board.js possède la page.');
 if(!craft.includes("$('binch-ah-craft-form').onsubmit"))
  fail('Atelier AH : formulaire non connecté.');
}
if(present('market-board.js')) {
 const board=read('market-board.js');
 if(!board.includes("KEY='binch.market.v1'"))
  fail('Bourse AH : clé canonique de relevés manuels modifiée.');
 if(!board.includes('relevés manuels'))
  fail('Bourse AH : l’origine manuelle des relevés n’est plus indiquée.');
}

// Le bandeau Specs doit changer lorsqu'une spécialisation sans itinéraire certifié est choisie.
if(present('specs-guide.js')) {
 const specs=read('specs-guide.js');
 const branch=specs.match(/if\(g\.id!=='druid-feral'\)\{([\s\S]*?)\n \}/)?.[1]||'';
 if(!branch.includes('renderPinned();return;'))
  fail('Specs : le bandeau épinglé reste périmé pour les autres classes.');
 if(!specs.includes("const first=guides.find(g=>g.cls===state.filter)") ||
    !specs.includes("if(first)state.id=first.id"))
  fail('Specs : filtre de classe non synchronisé avec le profil affiché.');
 if(!branch.includes("'binch-specs-pin-state'"))
  fail('Specs : statut d’épinglage non rafraîchi hors farouche.');
 if(!portal.includes('./specs-guide.js?v=005'))
  fail('Specs : cache non invalidé pour le correctif du bandeau.');
}
for(const warning of warnings)console.warn('AVERTISSEMENT : '+warning);
for(const error of errors)console.error('ERREUR : '+error);
console.log('La Binch : '+scripts.length+' scripts analysés, '+errors.length+' erreur(s), '+warnings.length+' avertissement(s).');
if(errors.length)process.exitCode=1;

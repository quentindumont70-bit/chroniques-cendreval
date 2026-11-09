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
const addonCore=read('addon/GrimoireSync/Core.lua'),addonToc=read('addon/GrimoireSync/GrimoireSync.toc'),installer=read('Installer-La-Binch.ps1');
if(!addonCore.includes('PLAYER_XP_UPDATE')||!addonCore.includes('UnitXP')||!addonCore.includes('captureXP()')||!addonCore.includes('GrimoireSyncDB.xpStatus'))fail('Addon GrimoireSync : suivi XP ou diagnostic manquant.');
const addonVersion=addonToc.match(/^## Version:\s*([0-9]+(?:\.[0-9]+)+)\s*$/m)?.[1];
if(!addonVersion)fail('Version GrimoireSync absente du TOC.');
else {
 const installerVersion=installer.match(/installation locale GrimoireSync v([0-9]+(?:\.[0-9]+)+)/)?.[1];
 if(installerVersion!==addonVersion)fail('La version installateur ('+installerVersion+') diffère du TOC ('+addonVersion+').');
 const escapedVersion=addonVersion.replace(/\./g,'\\.');
 if(!installer.includes('Version: '+escapedVersion))fail('La validation de version dans l’installateur ne correspond pas au TOC.');
}
if(!installer.includes("Minimap.lua\\\\s*")&&!installer.includes("Minimap.lua\\s*"))fail('Validation des fichiers de l’installateur non reconnue.');
const lfg=read('lfg.js'),config=JSON.parse(read('lfg-cloud-config.json'));
if(!lfg.includes('Mode local uniquement')||!lfg.includes('online'))fail('Le LFG ne distingue plus clairement les modes local et partagé');
if(!config.supabaseUrl||!config.supabasePublishableKey)warnings.push('Le LFG collectif n’est PAS encore connecté (configuration Supabase vide).');
if(!planner.includes('Prototype local non partagé'))warnings.push('Le Guild Planner doit être annoncé comme local.');
for(const warning of warnings)console.warn('AVERTISSEMENT : '+warning);
for(const error of errors)console.error('ERREUR : '+error);
console.log('La Binch : '+scripts.length+' scripts analysés, '+errors.length+' erreur(s), '+warnings.length+' avertissement(s).');
if(errors.length)process.exitCode=1;

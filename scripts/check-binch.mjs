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
const index=read('index.html'),treasures=read('treasures.js');
if(!index.includes('Bêta de guilde 0.20')||!index.includes('0.20-guild'))fail('Titre ou metadata de version non synchronisé avec 0.20');
if(!index.includes('window.BinchRewards')||!index.includes('draw:(canvas,id)')||!treasures.includes('API.draw?.'))fail('Contrat sprite Trésors incomplet');
const faith=read('faith-avatar.js'),intendant=read('intendant.js');
if(!faith.includes('window.BinchFaithAvatar')||!faith.includes('requestAnimationFrame')||!faith.includes('reducedMotion()')||!faith.includes("visibilitychange"))fail('Contrat Faith : animation vocale performante ou gestion de visibilité manquante.');
if(!intendant.includes('binch-faith-canvas')||!intendant.includes("window.BinchFaithAvatar?.speak(answer.text)"))fail('Faith n’est plus relié aux réponses de l’intendant.');
const planner=read('guild-planner.js');
if(planner.includes('form.elements.item.value'))fail('Le formulaire Guild Planner utilise une propriété native ambiguë');
const trueProcs=read('wow-procs.js');
if(!trueProcs.includes('Choc nébulaire')||!trueProcs.includes('Non confirmée')||!trueProcs.includes('wowhead.com/forever'))fail('Vrais procs : manque séparation des cosmétiques, sources ou signalement des taux inconnus.');
const toolkit=read('trade-toolkit.js');
if(!toolkit.includes('Marteau de forgeron')||!toolkit.includes('Ingénierie')||!toolkit.includes('inventory'))fail('Conseiller métiers et dépendance au marteau de forgeron manquants.');
const player=read('player-home.js'),playerStyle=read('player-home.css');
if(!player.includes("updateLevelRing(last,p)")||!player.includes("rawXP!==null")||!playerStyle.includes(".binch-level-ring"))fail('Anneau XP : liaison ou garde-fou anti-valeurs absentes manquant.');
const addonCore=read('addon/GrimoireSync/Core.lua'),addonToc=read('addon/GrimoireSync/GrimoireSync.toc'),installer=read('Installer-La-Binch.ps1');
if(!addonCore.includes('PLAYER_XP_UPDATE')||!addonCore.includes('UNIT_XP')||!addonCore.includes('captureXP()')||!addonCore.includes('GrimoireSyncDB.xpStatus'))fail('Addon GrimoireSync : suivi XP ou diagnostic manquant.');
if(!addonToc.includes('## Version: 0.8.1')||!installer.includes('Version: 0\\.8\\.1'))fail('Version 0.8.1 non alignée entre TOC et installateur.');
if(!installer.includes("Minimap.lua\\\\s*")&&!installer.includes("Minimap.lua\\s*"))fail('Validation des fichiers de l’installateur non reconnue.');
const lfg=read('lfg.js'),config=JSON.parse(read('lfg-cloud-config.json'));
if(!lfg.includes('Mode local uniquement')||!lfg.includes('online'))fail('Le LFG ne distingue plus clairement les modes local et partagé');
if(!config.supabaseUrl||!config.supabasePublishableKey)warnings.push('Le LFG collectif n’est PAS encore connecté (configuration Supabase vide).');
if(!planner.includes('Prototype local non partagé'))warnings.push('Le Guild Planner doit être annoncé comme local.');
for(const warning of warnings)console.warn('AVERTISSEMENT : '+warning);
for(const error of errors)console.error('ERREUR : '+error);
console.log('La Binch : '+scripts.length+' scripts analysés, '+errors.length+' erreur(s), '+warnings.length+' avertissement(s).');
if(errors.length)process.exitCode=1;

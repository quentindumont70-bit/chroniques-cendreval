/* La Binch — import local explicite : glisser-déposer, choix natif, confirmation. */
(()=>{'use strict';
const $=id=>document.getElementById(id),MAX=20*1024*1024;
let selected=null,busy=false;
function report(msg,error=false){const el=$('binch-direct-import-status');if(el){el.textContent=msg;el.dataset.state=error?'error':'ok'}const old=$('grimoire-bridge-status');if(old)old.textContent=msg}
let selectionId=0;
async function setFile(file){
 const sequence=++selectionId;
 selected=null;
 const field=$('binch-direct-path'),runButton=$('binch-direct-run');
 if(field)field.value=file?.name||'';
 runButton.disabled=true;
 if(!file){report('Aucun fichier sélectionné.',true);return}
 if(!/^GrimoireSync\\.lua$/i.test(file.name)){report('Fichier incorrect : sélectionne GrimoireSync.lua depuis SavedVariables, pas Core.lua.',true);return}
 if(file.size>MAX){report('Fichier trop volumineux (20 Mo maximum).',true);return}
 if(!window.BinchSync){report('Module de synchronisation non disponible. Recharge la page.',true);return}
 report('Lecture et validation locale du fichier…');
 try{
  const raw=typeof file.text==='function'?await file.text():await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result||''));reader.onerror=()=>reject(reader.error);reader.readAsText(file)});
  if(sequence!==selectionId)return;
  const snap=window.BinchSync.parsePayload(raw);
  selected=file;
  report('Fichier valide : '+snap.name+' · niveau '+snap.level+' · '+snap.zone+'. Clique sur « Importer le personnage » pour confirmer.');
  runButton.disabled=busy;
 }catch(error){
  if(sequence!==selectionId)return;
  report('Ce fichier ne contient pas une sauvegarde GrimoireSync reconnue : '+(error?.message||String(error)),true);
 }
}
async function run(){
 if(busy||!selected){report('Dépose ou sélectionne GrimoireSync.lua avant de lancer l’import.',true);return}
 if(!window.BinchSync){report('Le module de synchronisation n’est pas disponible : recharge La Binch.',true);return}
 busy=true;$('binch-direct-run').disabled=true;
 try{
  const snapshot=window.BinchSync.parsePayload(await selected.text());
  report('Fichier reconnu : '+snapshot.name+' · niveau '+snapshot.level+' · import en cours…');
  const result=window.BinchSync.importCharacter(snapshot);
  if(result===false)report('Import annulé : ton ancien profil est conservé.',true);
  else report('Import confirmé : '+snapshot.name+' · niveau '+snapshot.level+'. Le profil va être actualisé.');
 }catch(e){report('Échec de l’import : '+(e?.message||String(e)),true)}
 finally{busy=false;$('binch-direct-run').disabled=!selected}
}
function mount(){
 const page=$('page-sync');if(!page||$('binch-direct-import'))return;
 const guide=page.querySelector('.binch-sync-guide');
 const box=document.createElement('section');box.id='binch-direct-import';box.className='panel section';
 box.innerHTML=`<div class="eyebrow">SYNCHRONISATION LOCALE · GRIMOIRESYNC</div>
 <h2>Importer mon druide depuis WoW</h2>
 <p>Après <code>/reload</code> dans WoW, dépose <strong>GrimoireSync.lua</strong> ici ou sélectionne-le avec Windows.</p>
 <label id="binch-direct-drop" for="binch-direct-file" tabindex="0"><strong>↓ Glisse et dépose GrimoireSync.lua ici</strong><span>ou clique dans ce cadre pour ouvrir les fichiers Windows</span></label>
 <div class="binch-direct-controls"><label for="binch-direct-file" class="binch-direct-select">Parcourir les fichiers…</label><input id="binch-direct-file" type="file" accept=".lua,.txt" aria-label="Sélectionner le fichier GrimoireSync.lua">
 <label class="binch-direct-path-label" for="binch-direct-path">Fichier sélectionné<input id="binch-direct-path" type="text" readonly placeholder="Aucun fichier sélectionné"></label>
 <button id="binch-direct-run" type="button" disabled>Importer le personnage</button></div>
 <p id="binch-direct-import-status" role="status" aria-live="polite">En attente du fichier GrimoireSync.lua.</p>
 <details><summary>Où est mon fichier ? Et peut-on importer automatiquement ?</summary>
 <p>Chemin courant : <code>World of Warcraft\\_forever_\\WTF\\Account\\TON_COMPTE\\SavedVariables\\GrimoireSync.lua</code>. Tu peux aussi glisser le fichier depuis l’Explorateur Windows. Un site web ne peut pas lire un chemin saisi sans sélection ou permission du navigateur.</p>
 <p>Pour un import automatique après chaque <code>/reload</code>, utilise « Suivre automatiquement les prochains /reload » plus bas, dans un navigateur compatible. Ce dépôt ne fait aucun envoi sur Internet.</p></details>`;
 (guide||page.firstElementChild)?.before(box);
 const input=$('binch-direct-file'),drop=$('binch-direct-drop');
 input.addEventListener('change',()=>setFile(input.files?.[0]));
 drop.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();input.click()}});
 $('binch-direct-run').addEventListener('click',run);
 for(const el of [drop,box]){
  el.addEventListener('dragover',e=>{if(e.dataTransfer?.types?.includes('Files')){e.preventDefault();drop.classList.add('binch-drag-active')}});
  el.addEventListener('dragleave',e=>{if(!el.contains(e.relatedTarget))drop.classList.remove('binch-drag-active')});
  el.addEventListener('drop',e=>{if(!e.dataTransfer?.files?.length)return;e.preventDefault();e.stopPropagation();drop.classList.remove('binch-drag-active');setFile(e.dataTransfer.files[0])});
 }
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
})();

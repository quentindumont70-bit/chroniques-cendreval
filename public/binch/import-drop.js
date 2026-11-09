/* La Binch — import local explicite : glisser-déposer, choix natif, confirmation. */
(()=>{'use strict';
const $=id=>document.getElementById(id),MAX=20*1024*1024;
let selected=null,busy=false;
function report(msg,error=false){const el=$('binch-direct-import-status');if(el){el.textContent=msg;el.dataset.state=error?'error':'ok'}const old=$('grimoire-bridge-status');if(old)old.textContent=msg}
function setFile(file){
 if(!file)return;
 if(!/^GrimoireSync\.lua$/i.test(file.name)){selected=null;report('Fichier incorrect : sélectionne exactement GrimoireSync.lua (SavedVariables), pas Core.lua.',true)}
 else if(file.size>MAX){selected=null;report('Fichier trop volumineux (20 Mo maximum).',true)}
 else {selected=file;report('Prêt à importer : '+file.name+' ('+Math.ceil(file.size/1024)+' Ko). Clique sur « Importer le personnage ».')}
 const field=$('binch-direct-path');if(field)field.value=selected?selected.name:'';
 $('binch-direct-run').disabled=!selected||busy;
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

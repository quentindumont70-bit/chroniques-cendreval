/* La Binch — import explicite, bouton fiable et glisser-deposer local. */
(()=>{'use strict';
const $=id=>document.getElementById(id);
const MAX_SIZE=20*1024*1024;
let pending=false;
function report(message,error=false){
 const node=$('binch-direct-import-status');
 if(node){node.textContent=message;node.style.color=error?'#ffac9d':'#bfe7c1';}
 const original=$('grimoire-bridge-status');
 if(original){original.textContent=message;original.style.color=error?'#ffac9d':'var(--gold)';}
}
async function importFile(file){
 if(pending)return;
 if(!file){report('Aucun fichier selectionne.',true);return;}
 if(!/\.lua$|\.txt$/i.test(file.name)){report('Selectionne GrimoireSync.lua, pas Core.lua ni un autre fichier.',true);return;}
 if(file.size>MAX_SIZE){report('Fichier trop volumineux (20 Mo maximum).',true);return;}
 if(!window.BinchSync){report('Module de synchronisation indisponible : recharge la page avec Ctrl+F5.',true);return;}
 pending=true;
 try{
  const text=await file.text();
  const snapshot=window.BinchSync.parsePayload(text);
  const result=window.BinchSync.importCharacter(snapshot);
  if(result===false){report('Import annule. Ton ancien profil a ete conserve.',true);return;}
  report('Fichier lu : '+snapshot.name+' · niveau '+snapshot.level+' · '+(snapshot.xpMax>0?snapshot.xp+'/'+snapshot.xpMax+' XP':'XP indisponible')+'. Actualisation du profil...');
 }catch(error){report('Import impossible : '+(error&&error.message?error.message:String(error)),true)}
 finally{pending=false;}
}
function mount(){
 const page=$('page-sync');
 if(!page||$('binch-direct-import'))return;
 const guide=page.querySelector('.binch-sync-guide');
 const box=document.createElement('section');
 box.id='binch-direct-import';
 box.className='panel section';
 box.style.cssText='margin:12px 0;border:2px dashed #a8b58b;background:#111e19;';
 box.innerHTML='<div class="eyebrow">Synchronisation rapide · GrimoireSync</div>'+
 '<h2>Importer mon personnage WoW</h2>'+
 '<p>Après <code>/reload</code> dans WoW, clique ci-dessous ou glisse le fichier <code>GrimoireSync.lua</code> directement dans cette zone.</p>'+
 '<button id="binch-direct-pick" type="button" class="btn primary">Choisir GrimoireSync.lua</button>'+
 '<input id="binch-direct-file" type="file" accept=".lua,.txt" style="display:none" />'+
 '<p id="binch-direct-import-status" role="status" aria-live="polite">Aucun fichier charge pour cette session. Les anciennes donnees restent affichees tant qu’un nouvel import n’a pas reussi.</p>'+
 '<small class="muted">Chemin habituel : World of Warcraft / _forever_ / WTF / Account / NOM_COMPTE / SavedVariables / GrimoireSync.lua. Lecture locale uniquement.</small>';
 if(guide)page.insertBefore(box,guide);else page.prepend(box);
 const picker=$('binch-direct-file');
 $('binch-direct-pick').addEventListener('click',()=>picker.click());
 picker.addEventListener('change',()=>{const f=picker.files&&picker.files[0];importFile(f);picker.value='';});
 for(const el of [box,page]){
  el.addEventListener('dragover',e=>{if(!e.dataTransfer||!Array.from(e.dataTransfer.types).includes('Files'))return;e.preventDefault();if(el===box)box.style.borderColor='#ffe6a5';});
  el.addEventListener('dragleave',()=>{box.style.borderColor='#a8b58b';});
  el.addEventListener('drop',e=>{
   if(!e.dataTransfer||!e.dataTransfer.files.length)return;
   e.preventDefault();e.stopPropagation();box.style.borderColor='#a8b58b';
   importFile(e.dataTransfer.files[0]);
  });
 }
 // Catch older wizard buttons even when their previous click handler was broken.
 page.addEventListener('click',e=>{
   const button=e.target&&e.target.closest?e.target.closest('button'):null;
   if(!button||button.id==='binch-direct-pick')return;
   const label=(button.textContent||'').trim().toLowerCase();
   if(/acc[eé]der [aà] l.import|aller au bouton d.import/.test(label)){
     e.preventDefault();e.stopImmediatePropagation();picker.click();
   }
 },true);
 const jump=$('binch-sync-jump');
 if(jump)jump.onclick=()=>picker.click();
 const topLabel=page.querySelector('label[for="grimoire-bridge-file"].btn');
 if(topLabel){topLabel.setAttribute('for','binch-direct-file');}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
})();

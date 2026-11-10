/* La Binch · Gear locker portability. Local-only, explicit JSON export/import. */
(()=>{'use strict';
const PREFIX='binch.gear.sets.v1.',FORMAT='binch-gear-sets-v1',MAX_BYTES=160000;
const $=id=>document.getElementById(id);
const safe=s=>String(s??'').trim().slice(0,110);
function characterKey(){
 let p={};try{p=JSON.parse(localStorage.getItem('grimoire.hub.v3'))||{}}catch{}
 return PREFIX+encodeURIComponent(String(p.data?.pseudo||'').trim().toLocaleLowerCase('fr'))+'-'+encodeURIComponent(String(p.race||''))+'-'+encodeURIComponent(String(p.classe||''));
}
function validSet(raw){
 if(!raw||typeof raw!=='object'||Array.isArray(raw))return null;
 const name=safe(raw.name).slice(0,50),role=String(raw.role||'');
 if(!name||!['bear','cat','heal','custom'].includes(role)||!Array.isArray(raw.items)||raw.items.length>25)return null;
 const slots=new Set(),items=[];
 for(const it of raw.items){
  const slot=Number(it?.slot),id=Number(it?.id);
  if(!Number.isInteger(slot)||slot<1||slot>25||!Number.isSafeInteger(id)||id<=0||slots.has(slot))return null;
  slots.add(slot);items.push({slot,id,name:safe(it.name)});
 }
 if(!items.length)return null;
 const createdAt=Number.isFinite(Date.parse(raw.createdAt))?new Date(raw.createdAt).toISOString():new Date().toISOString();
 return {id:String(raw.id||'').slice(0,80),name,role,createdAt,items};
}
function read(){try{const x=JSON.parse(localStorage.getItem(characterKey()));return Array.isArray(x)?x:[]}catch{return []}}
function report(text,error=false){const el=$('binch-gear-portability-status');if(el){el.textContent=text;el.setAttribute('role',error?'alert':'status')}}
function exportSets(){
 const sets=read().map(validSet).filter(Boolean);
 if(!sets.length){report('Aucun ensemble à exporter pour ce personnage.',true);return}
 const payload={format:FORMAT,characterKey:characterKey().slice(PREFIX.length),exportedAt:new Date().toISOString(),sets};
 const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});
 const url=URL.createObjectURL(blob),a=document.createElement('a');
 a.download='la-binch-ensembles-'+new Date().toISOString().slice(0,10)+'.json';a.href=url;a.click();
 setTimeout(()=>URL.revokeObjectURL(url),1000);
 report(sets.length+' ensemble(s) exporté(s). Aucun fichier envoyé à un serveur.');
}
async function importSets(file){
 if(!file||file.size===0||file.size>MAX_BYTES){report('Fichier absent ou trop volumineux (160 Ko maximum).',true);return}
 let payload;try{payload=JSON.parse(await file.text())}catch{report('JSON invalide.',true);return}
 if(payload?.format!==FORMAT||!Array.isArray(payload.sets)||payload.sets.length>12||!payload.sets.length){
  report('Format incompatible ou nombre d’ensembles incorrect (1 à 12).',true);return;
 }
 if(payload.characterKey!==characterKey().slice(PREFIX.length)){
  report('Ce fichier appartient à un autre profil. Sélectionne le bon personnage avant import.',true);return;
 }
 const incoming=payload.sets.map(validSet);
 if(incoming.some(x=>!x)){report('Un ensemble contient des emplacements ou des objets invalides. Import annulé.',true);return}
 const current=read(),known=new Set(current.map(x=>String(x.name).toLocaleLowerCase('fr')+'|'+x.role));
 let added=0,skipped=0;
 for(const set of incoming){
  const signature=set.name.toLocaleLowerCase('fr')+'|'+set.role;
  if(known.has(signature)||current.length>=12){skipped++;continue}
  set.id=window.crypto?.randomUUID?.()||Date.now().toString(36)+'-'+added;
  current.push(set);known.add(signature);added++;
 }
 if(!added){report('Aucun nouveau set : doublons ou limite de 12 atteinte.');return}
 try{localStorage.setItem(characterKey(),JSON.stringify(current))}
 catch{report('Stockage local saturé : aucun ensemble importé.',true);return}
 // Fire a same-tab signal for the main gear locker; storage events do not fire in this tab.
 document.dispatchEvent(new Event('binch:gear-sets-updated'));
 report(added+' ensemble(s) importé(s) · '+skipped+' doublon(s) ou dépassement ignoré(s). Recharge la page Équipement si nécessaire.');
}
function mount(){
 const host=$('binch-gear-sets');if(!host||$('binch-gear-portability'))return;
 const panel=document.createElement('div');panel.id='binch-gear-portability';panel.className='binch-gear-portability';
 panel.innerHTML='<div><strong>Sauvegarde et transfert</strong><p>Exporter ou restaurer tes ensembles sur un autre appareil. Le fichier reste sur ton ordinateur ; aucun objet n’est équipé dans WoW.</p></div><div class="binch-gear-portability-actions"><button type="button" id="binch-gear-export">Exporter JSON</button><button type="button" id="binch-gear-import-button">Importer JSON</button><input type="file" id="binch-gear-import-file" accept=".json,application/json" hidden aria-label="Fichier d’ensembles JSON"></div><p id="binch-gear-portability-status" role="status" aria-live="polite"></p>';
 host.append(panel);
 $('binch-gear-export').addEventListener('click',exportSets);
 $('binch-gear-import-button').addEventListener('click',()=>$('binch-gear-import-file').click());
 $('binch-gear-import-file').addEventListener('change',async e=>{const f=e.target.files?.[0];if(f)await importSets(f);e.target.value=''});
}
function start(){mount();if($('binch-gear-sets'))return;
 const observer=new MutationObserver(()=>{if($('binch-gear-sets')){observer.disconnect();mount()}});
 const root=$('page-equipment');if(root){observer.observe(root,{childList:true,subtree:true});setTimeout(()=>observer.disconnect(),15000)}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
/* La Binch — export/import privé des plannings locaux, sans serveur tiers. */
(()=>{'use strict';
const $=id=>document.getElementById(id);
const PREFIXES=['binch.guild.','binch.custom.objectives.v1.','binch.leveling.log.v1.','binch.session.plan.v1.','binch.zone.plan.v1.','binch.route.done.v1.','binch.route.pins.v1.','binch.gear.sets.v1.'];
const EXACT=['grimoire.hub.v3','binch.lfg.local.v1','binch.ah.market.v1','binch.ah.scope.v1','binch.ah.craft.v1'];
const MAX_KEYS=300,MAX_FILE=2*1024*1024;
function eligible(k){return EXACT.includes(k)||PREFIXES.some(prefix=>k.startsWith(prefix));}
function collect(){
 const result={};let count=0;for(let i=0;i<localStorage.length&&count<MAX_KEYS;i++){const k=localStorage.key(i);
  if(!k||!eligible(k))continue;const v=localStorage.getItem(k);if(typeof v==='string'&&v.length<=200000){result[k]=v;count++;}
 }
 return result;
}
function announce(msg,error=false){const e=$('binch-backup-status');if(e){e.textContent=msg;e.dataset.error=error?'true':'false';}}
function init(){
 const page=$('page-hub');if(!page||$('binch-local-backup'))return;
 const details=document.createElement('details');details.id='binch-local-backup';details.className='panel section';
 details.innerHTML='<summary>Mes sauvegardes locales <small>Exporter ou restaurer les données locales de La Binch</small></summary>'+
 '<p>Conserve une copie des objectifs, plans de zones, préparations de guilde, LFG, Bourse d’Azeroth et ensembles d’équipement enregistrés localement. Les données restent sur cet appareil sauf si tu choisis toi-même un fichier à conserver ou transférer.</p>'+
 '<p class="muted"><strong>Important :</strong> cette sauvegarde n’inclut pas les fichiers WoW SavedVariables, ni les permissions de synchronisation, ni une sauvegarde cloud. Le fichier exporté peut contenir ton nom de personnage.</p>'+
 '<div class="binch-backup-actions"><button type="button" id="binch-backup-export">Exporter mes données locales</button><label class="binch-backup-upload">Restaurer depuis JSON<input id="binch-backup-import" type="file" accept=".json,application/json" hidden></label></div>'+
 '<p id="binch-backup-status" role="status" aria-live="polite">Aucun transfert effectué.</p>';
 page.append(details);
 $('binch-backup-export').onclick=()=>{
  const rows=collect(),keys=Object.keys(rows);
  if(!keys.length){announce('Aucune donnée locale à exporter.',true);return;}
  const payload={format:'binch-local-planning-backup-v1',createdAt:new Date().toISOString(),entries:rows};
  const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});
  if(blob.size>MAX_FILE){announce('Données locales trop volumineuses pour cet export.',true);return;}
  const href=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=href;a.download='la-binch-sauvegarde-locale.json';a.click();setTimeout(()=>URL.revokeObjectURL(href),2000);
  announce(keys.length+' rubrique(s) sauvegardée(s) dans le fichier téléchargé.');
 };
 $('binch-backup-import').onchange=async e=>{
  const file=e.target.files?.[0];e.target.value='';if(!file)return;
  if(file.size>MAX_FILE){announce('Fichier trop volumineux (2 Mo maximum).',true);return;}
  try{
   const data=JSON.parse(await file.text());
   if(!data||data.format!=='binch-local-planning-backup-v1'||!data.entries||typeof data.entries!=='object'||Array.isArray(data.entries))throw Error('Format de sauvegarde non reconnu.');
   const entries=Object.entries(data.entries);
   if(!entries.length||entries.length>MAX_KEYS)throw Error('Nombre de rubriques invalide.');
   for(const [k,v] of entries){
    if(!eligible(k)||typeof v!=='string'||v.length>200000)throw Error('Rubrique non autorisée : '+k);
    if(k==='__proto__'||k==='constructor'||k==='prototype')throw Error('Nom de rubrique dangereux.');
    try{JSON.parse(v)}catch{throw Error('Données JSON invalides pour '+k)}
   }
   const present=entries.filter(([k])=>localStorage.getItem(k)!==null).length;
   if(!confirm('Restaurer '+entries.length+' rubrique(s), dont '+present+' existe(nt) déjà ? Les rubriques existantes du même nom seront remplacées. Aucune donnée ne sera envoyée à un serveur.'))return;
   const previous=new Map(entries.map(([k])=>[k,localStorage.getItem(k)]));
   try{
    for(const [k,v] of entries)localStorage.setItem(k,v);
   }catch(error){
    for(const [k,v] of previous){try{if(v===null)localStorage.removeItem(k);else localStorage.setItem(k,v)}catch{}}
    throw new Error('Stockage local saturé ou indisponible : restauration annulée.');
   }
   announce('Restauration effectuée pour '+entries.length+' rubrique(s). Recharge La Binch pour afficher les données restaurées.');
   const b=document.createElement('button');b.type='button';b.textContent='Recharger les données restaurées';b.onclick=()=>location.reload();
   $('binch-backup-status').append(' ',b);
  }catch(error){announce('Import refusé : '+error.message,true)}
 };
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
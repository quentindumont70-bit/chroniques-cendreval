/* V231–V237: local-only encrypted reminders. No Amelipro automation or patient-data network calls. */
(()=>{
'use strict';
const C=window.BIG_CTHU_IDEL,$=id=>document.getElementById(id);
let items=[],key=null,envelope=null,notified=false,busy=false;
function say(message,target='status'){$(target).textContent=message}
function element(tag,text,cls){
 const x=document.createElement(tag);if(text!==undefined)x.textContent=text;if(cls)x.className=cls;return x;
}
function stored(){
 const raw=localStorage.getItem(C.KEY);
 if(raw===null)return null;
 const obj=JSON.parse(raw);
 if(!C.validEnvelope(obj))throw Error('Coffre chiffré illisible : conserve une sauvegarde, ne réinitialise rien');
 return obj;
}
function refreshLock(){
 try{
  const existing=stored();
  $('unlock').hidden=!existing;
  $('createVault').hidden=!!existing;
  $('lockHint').textContent=existing?'Saisis ta phrase secrète pour voir les alertes. Rien n’est envoyé en ligne.':'Crée une phrase secrète d’au moins 12 caractères. Elle ne sera pas stockée.';
 }catch(e){$('unlock').hidden=false;$('createVault').hidden=true;say(e.message,'lockStatus')}
}
function lock(){
 key=null;envelope=null;items=[];notified=false;
 $('app').hidden=true;$('locked').hidden=false;$('lockedImport').hidden=false;
 $('passphrase').value='';$('list').replaceChildren();
 refreshLock();say('Coffre verrouillé : les références ne sont plus affichées.');
}
function download(text,filename,type){
 const blob=new Blob([text],{type}),url=URL.createObjectURL(blob),a=element('a','');
 a.href=url;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),1500);
}
async function persist(next){
 if(!key||!envelope||!C.validItems(next))throw Error('Coffre verrouillé ou données invalides');
 const nextEnvelope=await C.seal(next,key,envelope.salt,window.crypto);
 const raw=JSON.stringify(nextEnvelope),previous=localStorage.getItem(C.KEY);
 try{
  localStorage.setItem(C.KEY,raw);
  if(localStorage.getItem(C.KEY)!==raw)throw Error('Vérification de l’enregistrement impossible');
 }catch(err){
  let recovered=false;
  try{if(previous!==null){localStorage.setItem(C.KEY,previous);recovered=localStorage.getItem(C.KEY)===previous}}catch(e){}
  if(!recovered)throw Error('Sauvegarde non confirmée et retour arrière incertain. Exporte ton coffre immédiatement et ne ferme pas la page.');
  throw Error('Enregistrement refusé. Coffre précédent restauré ; rien n’a été changé dans la liste.');
 }
 items=next;envelope=nextEnvelope;render();
}
function format(date){return new Intl.DateTimeFormat('fr-FR',{dateStyle:'medium'}).format(new Date(date+'T12:00:00'))}
function upcoming(){return items.map(item=>({item,...C.assess(item)})).sort((a,b)=>a.days-b.days||a.item.ref.localeCompare(b.item.ref))}
function notifications(){
 if(notified||!key||!('Notification' in window)||Notification.permission!=='granted')return;
 const count=upcoming().filter(x=>x.alert!=='later').length;
 if(count){new Notification('Échéances IDEL à vérifier',{body:count+' échéance(s) à contrôler dans le coffre chiffré Big Cthu.',tag:'big-cthu-idel'});notified=true}
}
function render(){
 if(!key)return;
 const result=upcoming();
 $('expiredCount').textContent=result.filter(x=>x.overdue).length;
 $('soonCount').textContent=result.filter(x=>x.alert==='soon').length;
 $('totalCount').textContent=result.length;
 const host=$('list');host.replaceChildren();
 if(!result.length){host.append(element('p','Aucune échéance enregistrée. Ajoute tes premières dates de suivi.','muted'));return}
 for(const row of result){
  const item=row.item,card=element('article',undefined,'card '+row.alert),head=element('h3',item.ref+' · '+(item.kind==='bsi'?'BSI annuel':'Ordonnance'));
  card.append(head,element('p','Fin de validité : '+format(item.due)+' · '+row.label));
  if(item.kind==='bsi'){
   const bsi=row.days<=30?'BSI à refaire dans amelipro':'BSI annuel programmé';
   card.append(element('p',bsi));
   if(!item.requested&&row.days<=45)card.append(element('p','À faire : demander une nouvelle prescription médicale.','notice'));
  }else if(row.days<=30)card.append(element('p','À faire : demander le renouvellement de l’ordonnance.','notice'));
  const controls=element('div',undefined,'row');
  const ask=element('button',item.requested?'Annuler « demande faite »':'Ordonnance demandée','ghost');
  ask.type='button';ask.onclick=async()=>{try{await persist(items.map(x=>x.id===item.id?{...x,requested:!x.requested}:x));say('État de demande mis à jour.')}catch(e){say(e.message)}};controls.append(ask);
  const date=element('input');date.type='date';date.setAttribute('aria-label','Nouvelle fin de validité pour '+item.ref);
  const confirm=element('button',item.kind==='bsi'?'BSI refait + nouvelle prescription':'Ordonnance renouvelée');
  confirm.type='button';confirm.onclick=async()=>{
   if(!C.dateOK(date.value)){say('Saisis la nouvelle date de fin de validité pour '+item.ref);date.focus();return}
   if(!window.confirm(item.kind==='bsi'?'Confirmer BSI annuel refait dans amelipro et nouvelle prescription reçue pour '+item.ref+' ?':'Confirmer le renouvellement effectif de l’ordonnance pour '+item.ref+' ?'))return;
   try{await persist(items.map(x=>x.id===item.id?{...x,due:date.value,requested:false}:x));say('Nouvelle échéance enregistrée pour '+item.ref)}catch(e){say(e.message)}
  };
  controls.append(date,confirm);
  const remove=element('button','Retirer du suivi','ghost danger');remove.type='button';
  remove.onclick=async()=>{if(!window.confirm('Retirer '+item.ref+' du suivi des échéances ?'))return;try{await persist(items.filter(x=>x.id!==item.id));say('Référence retirée du suivi.')}catch(e){say(e.message)}};
  controls.append(remove);card.append(controls);host.append(card);
 }
 notifications();
}
async function enter(createNew){
 if(busy)return;busy=true;
 $('unlock').disabled=true;$('createVault').disabled=true;
 try{
  const pass=$('passphrase').value;
  if(pass.length<12)throw Error('Phrase secrète : 12 caractères minimum');
  if(createNew){
   if(localStorage.getItem(C.KEY)!==null)throw Error('Un coffre existe déjà, impossible de l’écraser');
   const next=await C.create(pass,window.crypto),raw=JSON.stringify(next.envelope);
   localStorage.setItem(C.KEY,raw);
   if(localStorage.getItem(C.KEY)!==raw)throw Error('Création du coffre non confirmée');
   key=next.key;envelope=next.envelope;items=next.items;
  }else{
   const current=stored();
   if(!current)throw Error('Aucun coffre existant');
   const opened=await C.unlock(pass,current,window.crypto);
   key=opened.key;envelope=current;items=opened.items;
  }
  $('passphrase').value='';
  $('locked').hidden=true;$('lockedImport').hidden=true;$('app').hidden=false;
  say('Coffre déverrouillé localement. Pense à exporter régulièrement une sauvegarde chiffrée.');render();
 }catch(e){say(e.message,'lockStatus');key=null;envelope=null}
 finally{busy=false;$('unlock').disabled=false;$('createVault').disabled=false}
}
async function add(ev){
 ev.preventDefault();
 if(busy||!key)return;
 const kind=$('kind').value,ref=$('reference').value.trim(),due=$('due').value;
 const id=window.crypto.randomUUID?window.crypto.randomUUID():Array.from(window.crypto.getRandomValues(new Uint8Array(16)),b=>b.toString(16).padStart(2,'0')).join('');
 const item={id,ref,kind,due,requested:false};
 if(!C.validEntry(item)){say('Code interne ou date invalide. Utilise un code court non identifiant, sans nom ni NIR.');return}
 if(items.length>=C.MAX){say('Limite de 400 échéances atteinte.');return}
 busy=true;
 try{await persist([...items,item]);$('entryForm').reset();onKind();say('Échéance chiffrée ajoutée.')}
 catch(e){say(e.message)}
 finally{busy=false}
}
function onKind(){
 const bsi=$('kind').value==='bsi';
 $('lastBsi').disabled=!bsi;$('calculateBsi').disabled=!bsi;
 if(!bsi)$('lastBsi').value='';
}
function onCalc(){
 const date=$('lastBsi').value;
 if(!C.dateOK(date)){say('Indique la date du dernier BSI annuel, pas celle d’un BSI intermédiaire.');return}
 $('due').value=C.addYear(date);
 say('Date BSI proposée : '+format($('due').value)+'. Vérifie-la avant enregistrement.');
}
function onCalendar(){
 if(!key)return;
 try{download(C.ics(items),'rappels-idel-sans-donnees-patients.ics','text/calendar;charset=utf-8');say('Fichier Calendrier créé : import à effectuer volontairement dans ton application Calendrier. Aucun code patient exporté.')}
 catch(e){say(e.message)}
}
function onBackup(){
 if(!key||!envelope)return;
 try{download(JSON.stringify(envelope,null,2),'big-cthu-idel-coffre-chiffre-'+C.today()+'.json','application/json');say('Sauvegarde chiffrée exportée. Conserve-la avec ta phrase secrète dans un endroit sûr.')}
 catch(e){say(e.message)}
}
async function onImport(event){
 const file=event.target.files&&event.target.files[0];event.target.value='';
 if(!file)return;
 try{
  if(file.size>500000)throw Error('Fichier trop volumineux (500 Ko maximum)');
  const incoming=JSON.parse(await file.text());
  if(!C.validEnvelope(incoming))throw Error('Ce fichier n’est pas une sauvegarde IDEL chiffrée compatible');
  if(!window.confirm('Remplacer complètement le coffre IDEL de cet appareil par ce fichier chiffré ? Vérifie que tu disposes de sa phrase secrète.'))return;
  const raw=JSON.stringify(incoming),previous=localStorage.getItem(C.KEY);
  try{localStorage.setItem(C.KEY,raw);if(localStorage.getItem(C.KEY)!==raw)throw Error('Écriture non confirmée')}
  catch(e){
   try{if(previous===null)localStorage.removeItem(C.KEY);else localStorage.setItem(C.KEY,previous)}catch(rollback){}
   throw Error('Import non confirmé ; vérifie ton coffre actuel avant toute nouvelle tentative');
  }
  lock();say('Coffre chiffré importé. Déverrouille-le avec la phrase secrète du fichier.');
 }catch(e){say(e.message)}
}
function onNotify(){
 if(!key)return;
 if(!('Notification' in window)){say('Notifications navigateur non disponibles : utilise l’export Calendrier pour des alertes ultérieures.');return}
 Notification.requestPermission().then(permission=>{say(permission==='granted'?'Notifications activées à l’ouverture du coffre.':'Permission non accordée ; alertes visibles dans le coffre.');if(permission==='granted'){notified=false;notifications()}}).catch(e=>say('Notifications indisponibles : '+e.message));
}
$('createVault').addEventListener('click',()=>enter(true));
$('unlock').addEventListener('click',()=>enter(false));
$('passphrase').addEventListener('keydown',e=>{if(e.key==='Enter')enter($('unlock').hidden)});
$('lock').addEventListener('click',lock);
$('kind').addEventListener('change',onKind);
$('calculateBsi').addEventListener('click',onCalc);
$('entryForm').addEventListener('submit',add);
$('notify').addEventListener('click',onNotify);
$('exportCalendar').addEventListener('click',onCalendar);
$('backup').addEventListener('click',onBackup);
$('import').addEventListener('click',()=>$('importFile').click());
$('importLocked').addEventListener('click',()=>$('importFile').click());
$('importFile').addEventListener('change',onImport);
window.addEventListener('pagehide',()=>{key=null;items=[];envelope=null});
onKind();refreshLock();
})();

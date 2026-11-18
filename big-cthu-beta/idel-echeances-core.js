/* Big Cthu V231–V237 — private IDEL deadlines. No clinical data or patient identifiers leave the device. */
(function(root){
'use strict';
const KEY='big-cthu-idel-echeances-v1',VERSION=1,MAX=400,ITERATIONS=250000;
const toHex=bytes=>Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');
function fromHex(value){
 if(typeof value!=='string'||value.length%2!==0||!/^[0-9a-f]*$/i.test(value))throw Error('Coffre corrompu');
 return Uint8Array.from(value.match(/.{2}/g)||[],x=>parseInt(x,16));
}
function dateOK(d){
 if(typeof d!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(d))return false;
 const x=new Date(d+'T12:00:00Z');
 return Number.isFinite(x.valueOf())&&x.toISOString().slice(0,10)===d;
}
function dayNumber(day){return Date.parse(day+'T12:00:00Z')/86400000;}
function daysUntil(day,today){
 if(!dateOK(day)||!dateOK(today))throw Error('Date invalide');
 return Math.round(dayNumber(day)-dayNumber(today));
}
function addYear(day){
 if(!dateOK(day))throw Error('Date BSI invalide');
 const x=new Date(day+'T12:00:00Z'),month=x.getUTCMonth();
 x.setUTCFullYear(x.getUTCFullYear()+1);
 if(x.getUTCMonth()!==month)x.setUTCDate(0);
 return x.toISOString().slice(0,10);
}
const today=()=>{const now=new Date();return [now.getFullYear(),String(now.getMonth()+1).padStart(2,'0'),String(now.getDate()).padStart(2,'0')].join('-');};
function validEntry(x){
 return x&&typeof x==='object'&&typeof x.id==='string'&&/^[0-9a-z_-]{8,60}$/i.test(x.id)&&
 typeof x.ref==='string'&&/^[a-z0-9_-]{1,30}$/i.test(x.ref)&&!/\d{11,}/.test(x.ref)&&
 ['ordonnance','bsi'].includes(x.kind)&&dateOK(x.due)&&typeof x.requested==='boolean';
}
function validItems(items){
 return Array.isArray(items)&&items.length<=MAX&&items.every(validEntry)&&new Set(items.map(x=>x.id)).size===items.length;
}
function validEnvelope(e){
 return e&&e.app==='big-cthu-idel-vault'&&e.version===VERSION&&
 typeof e.salt==='string'&&/^[a-f0-9]{32}$/i.test(e.salt)&&
 typeof e.iv==='string'&&/^[a-f0-9]{24}$/i.test(e.iv)&&
 typeof e.data==='string'&&e.data.length>=32&&e.data.length<=500000&&/^[a-f0-9]+$/i.test(e.data)&&e.data.length%2===0;
}
function assess(entry,day=today()){
 const days=daysUntil(entry.due,day),isBsi=entry.kind==='bsi';
 return {days,overdue:days<=0,needsPrescription:!entry.requested&&days<=(isBsi?45:30),
  needsBsi:isBsi&&days<=30,
  alert:days<=0?'expired':days<=(isBsi?45:30)?'soon':'later',
  label:days<0?'Échéance dépassée de '+(-days)+' j':days===0?'Échéance aujourd’hui':days+' j avant échéance'};
}
async function derive(secret,salt,c){
 if(typeof secret!=='string'||secret.length<12)throw Error('Phrase secrète : 12 caractères minimum');
 if(!c||!c.subtle||typeof c.getRandomValues!=='function')throw Error('Chiffrement WebCrypto indisponible sur cet appareil');
 const bytes=new TextEncoder().encode(secret);
 const base=await c.subtle.importKey('raw',bytes,'PBKDF2',false,['deriveKey']);
 return c.subtle.deriveKey({name:'PBKDF2',salt:fromHex(salt),iterations:ITERATIONS,hash:'SHA-256'},base,{name:'AES-GCM',length:256},false,['encrypt','decrypt']);
}
async function seal(items,key,salt,c){
 if(!validItems(items))throw Error('Références ou dates invalides');
 const iv=c.getRandomValues(new Uint8Array(12)),data=new TextEncoder().encode(JSON.stringify(items));
 const encrypted=await c.subtle.encrypt({name:'AES-GCM',iv},key,data);
 return {app:'big-cthu-idel-vault',version:VERSION,salt,iv:toHex(iv),data:toHex(new Uint8Array(encrypted))};
}
async function create(secret,c){
 if(!c||!c.subtle)throw Error('WebCrypto indisponible');
 const salt=toHex(c.getRandomValues(new Uint8Array(16)));
 const key=await derive(secret,salt,c);
 const envelope=await seal([],key,salt,c);
 return {key,envelope,items:[]};
}
async function unlock(secret,envelope,c){
 if(!validEnvelope(envelope))throw Error('Fichier chiffré inconnu ou endommagé');
 const key=await derive(secret,envelope.salt,c);
 let plain;
 try{plain=await c.subtle.decrypt({name:'AES-GCM',iv:fromHex(envelope.iv)},key,fromHex(envelope.data))}
 catch(e){throw Error('Phrase secrète incorrecte ou coffre endommagé')}
 let items;
 try{items=JSON.parse(new TextDecoder().decode(plain))}catch(e){throw Error('Contenu chiffré illisible')}
 if(!validItems(items))throw Error('Données du coffre incompatibles');
 return {key,items};
}
function ics(items){
 if(!validItems(items))throw Error('Échéances invalides');
 const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Big Cthu//Rappels IDEL locaux//FR','CALSCALE:GREGORIAN','METHOD:PUBLISH'];
 for(const item of items){
  lines.push('BEGIN:VEVENT','UID:'+item.id+'@bigcthu.local','DTSTAMP:'+today().replace(/-/g,'')+'T120000Z',
   'DTSTART;VALUE=DATE:'+item.due.replace(/-/g,''),
   'DTEND;VALUE=DATE:'+nextDay(item.due).replace(/-/g,''),
   'SUMMARY:Vérifier une échéance professionnelle dans Big Cthu',
   'DESCRIPTION:Ouvrir le coffre Échéances IDEL. Aucune donnée patient dans cet événement.');
  for(const offset of (item.kind==='bsi'?[45,30,14,7]:[30,14,7])){
   lines.push('BEGIN:VALARM','ACTION:DISPLAY','DESCRIPTION:Vérifier les échéances IDEL dans Big Cthu','TRIGGER:-P'+offset+'D','END:VALARM');
  }
  lines.push('END:VEVENT');
 }
 lines.push('END:VCALENDAR');
 return lines.join('\r\n')+'\r\n';
}
function nextDay(day){const x=new Date(day+'T12:00:00Z');x.setUTCDate(x.getUTCDate()+1);return x.toISOString().slice(0,10);}
const API={KEY,MAX,ITERATIONS,dateOK,addYear,today,daysUntil,validEntry,validItems,validEnvelope,assess,create,unlock,seal,ics};
if(typeof module!=='undefined'&&module.exports)module.exports=API;
if(root)root.BIG_CTHU_IDEL=API;
})(typeof window!=='undefined'?window:null);

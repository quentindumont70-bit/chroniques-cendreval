import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';
import {webcrypto} from 'node:crypto';

const read=()=>readFile(new URL('../big-cthu-beta/tournee-complete.html',import.meta.url),'utf8');
const makeData=()=>({tidel_Pl:JSON.stringify([{id:'imaginaire-1',n:'PATIENT TOTALEMENT FICTIF',a:'Adresse inventée'}]),tidel_absences_journal_v1:'[]'});
function as64(a){return Buffer.from(a).toString('base64')}
function from64(s){return Uint8Array.from(Buffer.from(s,'base64'))}
async function setup({corrupt=false,wrongSalt=false,remember=true}={}){
 const html=await read();
 const salt=webcrypto.getRandomValues(new Uint8Array(16)),iv=webcrypto.getRandomValues(new Uint8Array(12));
 const password='synthetic-key-phrase-never-used';
 const base=await webcrypto.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveKey']);
 const key=await webcrypto.subtle.deriveKey({name:'PBKDF2',salt,iterations:180000,hash:'SHA-256'},base,{name:'AES-GCM',length:256},false,['encrypt','decrypt']);
 assert.equal(key.extractable,false,'the remembered key must be non-extractable');
 const state=makeData();
 const cipher=new Uint8Array(await webcrypto.subtle.encrypt({name:'AES-GCM',iv},key,new TextEncoder().encode(JSON.stringify(state))));
 if(corrupt)cipher[0]^=1;
 const record=JSON.stringify({v:1,salt:as64(salt),iv:as64(iv),cipher:as64(cipher)});
 const store=new Map();
 const status={removed:0};
 let launches=0,reads=0,writes=0;
 const ctx={
  crypto:webcrypto,JSON,Object,Uint8Array,TextDecoder,
  SECURE_KEY:'synthetic-vault',localStorage:{getItem:k=>k==='synthetic-vault'?record:null},
  document:{body:{classList:{remove(name){if(name==='tournee-checking')status.removed++}}}},
  to64:as64,from64,dec:new TextDecoder(),secureState:null,secureKey:null,secureSalt:null,
  isEncryptedVaultRecord:x=>x&&x.v===1&&typeof x.salt==='string'&&typeof x.cipher==='string',
  deviceKeyRecord:async(mode,name,value)=>{
   if(mode==='readwrite'){writes++;store.set(name,value);return name}
   reads++;return store.get(name)
  },
  launch:()=>{launches++}
 };
 const start=html.indexOf('function rememberDeviceKey(key,salt){'),end=html.indexOf('function fillFromBackup(d){',start);
 assert.ok(start>0&&end>start);
 runInNewContext(html.slice(start,end)+'\nthis.remember=rememberDeviceKey;this.autoOpen=autoOpenTournee;this.recall=recalledDeviceKey;this.vaultState=()=>secureState;',ctx,{timeout:1000});
 if(remember)await ctx.remember(key,wrongSalt?new Uint8Array(16):salt);
 return {html,ctx,key,record,state,launches:()=>launches,reads:()=>reads,writes:()=>writes,status};
}

test('V92: après un seul déverrouillage, une clé de chiffrement non extractible permet l ouverture sans phrase secrète',async()=>{
 const f=await setup();
 assert.equal(f.writes(),1);
 assert.equal(await f.ctx.autoOpen(),true);
 assert.equal(f.launches(),1);
 assert.equal(f.reads(),1);
 assert.equal(f.status.removed,1);
 assert.equal(f.ctx.vaultState().tidel_Pl,f.state.tidel_Pl);
 assert.equal(f.ctx.vaultState().tidel_absences_journal_v1,f.state.tidel_absences_journal_v1);
 assert.doesNotMatch(f.record,/PATIENT TOTALEMENT FICTIF|Adresse inventée/);
 assert.match(f.html,/autoOpenTournee\(\);/);
 assert.match(f.html,/function deviceKeyDb\(\)/);
 assert.match(f.html,/indexedDB\.open\(DEVICE_DB,1\)/);
 assert.doesNotMatch(f.html,/extractKey\(|exportKey\(/);
});

test('V92: navigateur non mémorisé montre la configuration initiale sans toucher au coffre',async()=>{
 const f=await setup({remember:false});
 assert.equal(await f.ctx.autoOpen(),false);
 assert.equal(f.launches(),0);
 assert.equal(f.status.removed,1);
 assert.equal(f.ctx.vaultState(),null);
 assert.equal(f.writes(),0);
});

test('V92: clé d un autre coffre refusée sans tentative de destruction',async()=>{
 const f=await setup({wrongSalt:true});
 assert.equal(await f.ctx.autoOpen(),false);
 assert.equal(f.launches(),0);
 assert.equal(f.status.removed,1);
 assert.equal(f.ctx.vaultState(),null);
});

test('V92: coffre altéré ne se déverrouille pas, et l accès initial peut toujours demander la phrase',async()=>{
 const f=await setup({corrupt:true});
 assert.equal(await f.ctx.autoOpen(),false);
 assert.equal(f.launches(),0);
 assert.match(f.html,/type="password" autocomplete="current-password"/);
 assert.match(f.html,/Coffre chiffré/);
 assert.match(f.html,/id="tour-file"/);
});

test('V92: une mise en veille prolongee ne recharge pas la page ni n impose un nouveau verrouillage',async()=>{
 const html=await read();
 assert.match(html,/if\(elapsed>=IDLE_LOCK_MS\)\{if\(secureKey&&secureGen!==secureSavedGen\)flush\(\)\.catch\(saveFailure\);return\}/);
 const saving=html.slice(html.indexOf('async function lockTourSafely(){'),html.indexOf('function checkTourIdle(){'));
 assert.doesNotMatch(saving,/location\.reload\(\)/);
 assert.match(html,/id="tour-lock">Sauvegarder<\/button>/);
 assert.match(html,/Sauvegarde en cours…/);
 assert.match(html,/body\.tournee-checking #tour-security-gate\{visibility:hidden\}/);
});

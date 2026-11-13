import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';
import {webcrypto} from 'node:crypto';

const phrase='phrase-fictive-tres-longue-2026';
const fakeState={
 tidel_Pl:JSON.stringify([{id:'fictif-42',n:'PERSONNE INVENTÉE',a:'ADRESSE INVENTÉE'}]),
 tidel_absences_journal_v1:JSON.stringify([{id:'signal-1',patientId:'fictif-42',day:'2026-11-13',reason:'Patient absent',sync:'À rapprocher',note:'TEST UNIQUEMENT',cancelled:false,history:[{at:'2026-11-13T10:00:00Z',action:'Signalement fictif'}]}]),
 tidel_done_2026_11_13:'[]'
};

async function browserFixture(storage,secret=phrase){
 const html=await readFile(new URL('../big-cthu-beta/tournee-complete.html',import.meta.url),'utf8');
 const cryptStart=html.indexOf('const SECURE_KEY=');
 const cryptStop=html.indexOf('function fillFromBackup(d){',cryptStart);
 const loginStart=html.indexOf('async function login(fileMode){',cryptStop);
 const loginStop=html.indexOf("document.getElementById('tour-open').addEventListener",loginStart);
 assert.ok(cryptStart>0&&cryptStop>cryptStart&&loginStart>cryptStop&&loginStop>loginStart);
 let launches=0;
 const errors=[];
 const input={value:secret};
 let selected={files:[]};
 const ctx={
  crypto:webcrypto,TextEncoder,TextDecoder,Uint8Array,btoa,atob,
  document:{getElementById:id=>id==='tour-pass'?input:id==='tour-file'?selected:null},
  localStorage:{getItem(key){return storage.get(key)??null},setItem(key,value){storage.set(key,value)}},
  fillFromBackup:()=>{throw Error('Import classique inattendu dans ce scénario')},
  flush:async()=>{throw Error('Aucune réécriture prévue pendant import chiffré')},
  launch:()=>{launches++},
  report:message=>errors.push(message)
 };
 const helpers=[
  'this.makeSyntheticVault=async (state,password)=>{',
  ' const salt=crypto.getRandomValues(new Uint8Array(16));',
  ' const iv=crypto.getRandomValues(new Uint8Array(12));',
  ' const key=await keyFor(password,salt);',
  ' const payload=await crypto.subtle.encrypt({name:"AES-GCM",iv},key,enc.encode(JSON.stringify(state)));',
  ' return JSON.stringify({v:1,salt:to64(salt),iv:to64(iv),cipher:to64(new Uint8Array(payload))});',
  '};',
  'this.loginFixture=login;',
  'this.currentVaultState=()=>secureState;'
 ].join('\n');
 runInNewContext(html.slice(cryptStart,cryptStop)+html.slice(loginStart,loginStop)+helpers,ctx,{timeout:1000});
 return {
  ctx,
  setFile(record){selected={files:[{size:record.length,async text(){return record}}]}},
  login:(mode)=>ctx.loginFixture(mode),
  make:(state,password)=>ctx.makeSyntheticVault(state,password),
  state:()=>ctx.currentVaultState(),
  count:()=>launches,
  errors
 };
}

test('V88: coffre AES-GCM fictif passe réellement de appareil A à appareil B sans réécriture ni perte de journal',async()=>{
 const deviceA=new Map();
 const a=await browserFixture(deviceA);
 const encrypted=await a.make(fakeState,phrase);
 deviceA.set('bigcthu_tournee_full_encrypted_v1',encrypted);
 assert.doesNotMatch(encrypted,/PERSONNE INVENTÉE|TEST UNIQUEMENT|fictif-42|Patient absent/);
 const deviceB=new Map(),b=await browserFixture(deviceB);
 b.setFile(encrypted);
 await b.login(true);
 assert.equal(b.count(),1);
 assert.equal(deviceB.get('bigcthu_tournee_full_encrypted_v1'),encrypted,'import de bytes chiffrés inchangés');
 assert.equal(b.state().tidel_Pl,fakeState.tidel_Pl);
 assert.equal(b.state().tidel_absences_journal_v1,fakeState.tidel_absences_journal_v1);
 const reloaded=await browserFixture(deviceB);
 await reloaded.login(false);
 assert.equal(reloaded.count(),1);
 assert.deepEqual(JSON.parse(reloaded.state().tidel_absences_journal_v1),JSON.parse(fakeState.tidel_absences_journal_v1));
});

test('V88: mauvais secret ne dépose rien sur un second appareil vide',async()=>{
 const a=await browserFixture(new Map());
 const encrypted=await a.make(fakeState,phrase);
 const deviceB=new Map(),b=await browserFixture(deviceB,'secret-invalide-au-moins-12');
 b.setFile(encrypted);
 await b.login(true);
 assert.equal(b.count(),0);
 assert.equal(deviceB.size,0);
 assert.match(b.errors.at(-1),/Ouverture impossible/);
});

test('V88: coffre authentifié mais corrompu est refusé sans effacer le fichier source',async()=>{
 const a=await browserFixture(new Map());
 const encrypted=JSON.parse(await a.make(fakeState,phrase));
 encrypted.cipher='AAAA'+encrypted.cipher.slice(4);
 const serialized=JSON.stringify(encrypted);
 const deviceB=new Map(),b=await browserFixture(deviceB);
 b.setFile(serialized);
 await b.login(true);
 assert.equal(b.count(),0);
 assert.equal(deviceB.size,0);
 assert.match(b.errors.at(-1),/Ouverture impossible/);
 assert.equal(serialized,JSON.stringify(encrypted));
});

test('V88: coffre déjà présent prime sur import et empêche tout écrasement',async()=>{
 const a=await browserFixture(new Map());
 const encrypted=await a.make(fakeState,phrase);
 const store=new Map([['bigcthu_tournee_full_encrypted_v1','coffre préexistant à conserver']]);
 const b=await browserFixture(store);
 b.setFile(encrypted);
 await b.login(true);
 assert.equal(b.count(),0);
 assert.equal(store.get('bigcthu_tournee_full_encrypted_v1'),'coffre préexistant à conserver');
 assert.match(b.errors.at(-1),/existe déjà/);
});

import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';

const source=()=>readFile(new URL('../big-cthu-beta/tournee-complete.html',import.meta.url),'utf8');
async function fixture({blocked=false,failWrite=false}={}){
 const html=await source();
 const begin=html.indexOf('function saveStatus(state,message){');
 const end=html.indexOf('async function exportEncryptedVault(){',begin);
 assert.ok(begin>=0&&end>begin,'real encrypted save pipeline is present');
 const state={dataset:{},hidden:false,textContent:''},label={textContent:''},retry={hidden:true,addEventListener(){}};
 const saved=new Map(),writes=[];
 let release;
 const barrier=new Promise(resolve=>{release=resolve});
 let encryptCalls=0,fail=failWrite,blockedOnce=blocked;
 const crypto={
  getRandomValues(arr){return arr.fill(1)},
  subtle:{async encrypt(_algorithm,_key,bytes){
   encryptCalls++;
   if(blockedOnce){blockedOnce=false;await barrier}
   return bytes;
  }}
 };
 const ctx={
  document:{getElementById(id){return id==='tour-save-strip'?state:id==='tour-save-text'?label:retry}},
  localStorage:{setItem(k,v){if(fail)throw Error('QuotaExceeded');saved.set(k,v);writes.push(v)},getItem(k){return saved.get(k)??null}},
  crypto,TextEncoder,Uint8Array,JSON,
  setTimeout(){return 1},clearTimeout(){},
  SECURE_KEY:'fiction-only',secureKey:{},secureSalt:new Uint8Array(16),
  secureGen:1,secureSavedGen:0,secureActive:null,secureTimer:0,
  secureState:{tidel_Pl:'[{"id":"fiction-1"}]'},
  enc:new TextEncoder(),
  to64:bytes=>Buffer.from(bytes).toString('base64')
 };
 runInNewContext(html.slice(begin,end)+'\nthis.flushReal=flush;this.saveReal=ensureVaultSaved;this.markDirty=dirty;',ctx,{timeout:1000});
 return {ctx,state,label,retry,saved,writes,release,encryptCalls:()=>encryptCalls,setFail:x=>{fail=x},flush:()=>ctx.flushReal(),ensure:()=>ctx.saveReal()};
}

test('V104: une modification pendant le chiffrement déclenche une deuxième écriture, jamais une validation obsolète',async()=>{
 const f=await fixture({blocked:true});
 const pending=f.flush();
 f.ctx.secureState.tidel_Pl='[{"id":"fiction-2"}]';
 f.ctx.markDirty();
 f.release();
 await pending;
 assert.equal(f.writes.length,2);
 assert.equal(f.ctx.secureSavedGen,f.ctx.secureGen);
 assert.equal(f.state.dataset.state,'saved');
 const final=JSON.parse(f.saved.get('fiction-only'));
 assert.match(Buffer.from(final.cipher,'base64').toString(),/fiction-2/);
 assert.equal(f.encryptCalls(),2);
});

test('V104: deux sauvegardes parallèles réutilisent une seule opération et ne multiplient pas les écritures',async()=>{
 const f=await fixture({blocked:true});
 const one=f.flush(),two=f.flush(),three=f.ensure();
 f.release();
 await Promise.all([one,two,three]);
 assert.equal(f.writes.length,1);
 assert.equal(f.ctx.secureSavedGen,1);
 assert.equal(f.state.dataset.state,'saved');
});

test('V104: échec de quota suivi de libération de place : ancien coffre préservé, nouvelle tentative validée',async()=>{
 const f=await fixture();
 await f.flush();
 const original=f.saved.get('fiction-only');
 f.ctx.secureState.tidel_Pl='[{"id":"fiction-3"}]';
 f.ctx.markDirty();
 f.setFail(true);
 await assert.rejects(f.flush(),/QuotaExceeded/);
 assert.equal(f.saved.get('fiction-only'),original);
 assert.equal(f.ctx.secureSavedGen,1);
 assert.equal(f.state.dataset.state,'error');
 f.setFail(false);
 await f.ensure();
 assert.equal(f.ctx.secureSavedGen,2);
 assert.match(Buffer.from(JSON.parse(f.saved.get('fiction-only')).cipher,'base64').toString(),/fiction-3/);
 assert.equal(f.state.dataset.state,'saved');
});

test('V104: chiffrement local et relecture restent sans requête réseau ni verrouillage à la reprise',async()=>{
 const html=await source();
 const start=html.indexOf('function saveStatus(state,message){');
 const end=html.indexOf('async function exportEncryptedVault(){',start);
 const pipeline=html.slice(start,end);
 assert.doesNotMatch(pipeline,/fetch\(|XMLHttpRequest|WebSocket|location\.reload/);
 assert.match(html,/id="tour-security-gate" hidden/);
 assert.match(html,/window\.addEventListener\('pageshow',resumeTournee\)/);
});

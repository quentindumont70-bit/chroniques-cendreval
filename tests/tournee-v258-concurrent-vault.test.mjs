import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';

async function fixture(shared,{previous=null,locks=null,denyLocks=false,withWindow=true}={}){
 const html=await readFile(new URL('../big-cthu-beta/tournee-complete.html',import.meta.url),'utf8');
 const start=html.indexOf('var secureLastWrittenRecord=null;');
 const end=html.indexOf('async function exportEncryptedVault(){',start);
 assert.ok(start>0&&end>start,'pipeline de chiffrement original présent');
 const events=new Map(),bar={dataset:{},hidden:false},message={textContent:''},retry={hidden:true,addEventListener(){}};
 let writes=0;
 const localStorage={
  getItem:key=>shared.get(key)??null,
  setItem(key,value){writes++;shared.set(key,value)}
 };
 const window=withWindow?{addEventListener:(name,callback)=>events.set(name,callback)}:undefined;
 const ctx={
  window,navigator:locks?{locks}:denyLocks?{locks:{request:()=>Promise.reject(Error('Permissions refusées'))}}:undefined,
  document:{getElementById:id=>id==='tour-save-strip'?bar:id==='tour-save-text'?message:retry},
  localStorage,crypto:{getRandomValues:arr=>arr.fill(1),subtle:{encrypt:async(_alg,_key,value)=>value}},
  SECURE_KEY:'fiction-only',secureState:{tidel_Pl:'[{"id":"PERSONNE-FICTIVE"}]'},
  secureKey:{},secureSalt:new Uint8Array(16),secureGen:1,secureSavedGen:0,secureActive:null,secureTimer:0,
  TextEncoder,JSON,Uint8Array,setTimeout:()=>1,clearTimeout:()=>{},
  to64:bytes=>Buffer.from(bytes).toString('base64'),enc:new TextEncoder()
 };
 runInNewContext(html.slice(start,end)+'\nthis.v258={flush,dirty,ensureVaultSaved,writeEncryptedVaultRecord};',ctx,{timeout:1000});
 ctx.secureLastWrittenRecord=previous;
 return {ctx,bar,message,events,flush:()=>ctx.v258.flush(),writes:()=>writes};
}
function lockManager(){
 let last=Promise.resolve(),requests=0,active=0,maxActive=0;
 return {
  get requests(){return requests},
  get maxActive(){return maxActive},
  request(name,options,callback){
   requests++;
   assert.equal(name,'bigcthu-tournee-vault:fiction-only');
   assert.equal(options.mode,'exclusive');
   const work=last.then(async()=>{
    active++;maxActive=Math.max(active,maxActive);
    try{return await callback()}finally{active--}
   });
   last=work.catch(()=>{});
   return work;
  }
 };
}
test('V258 : deux fenêtres concurrentes utilisent un verrou exclusif; une seule confirme son coffre',async()=>{
 const shared=new Map(),locks=lockManager();
 const a=await fixture(shared,{locks}),b=await fixture(shared,{locks});
 const settled=await Promise.allSettled([a.flush(),b.flush()]);
 assert.equal(settled.filter(v=>v.status==='fulfilled').length,1);
 assert.equal(settled.filter(v=>v.status==='rejected').length,1);
 assert.match(String(settled.find(v=>v.status==='rejected').reason),/Conflit de sauvegarde/);
 assert.equal(locks.requests,2);
 assert.equal(locks.maxActive,1);
 assert.equal(a.writes()+b.writes(),1);
 assert.ok(shared.get('fiction-only'));
 assert.equal(a.bar.dataset.state==='saved'||b.bar.dataset.state==='saved',true);
});
test('V258 : onglet périmé mais sans modification locale ne prétend plus être sauvegardé',async()=>{
 const shared=new Map(),locks=lockManager();
 const a=await fixture(shared,{locks});
 await a.flush();
 const initial=shared.get('fiction-only');
 const b=await fixture(shared,{locks,previous:initial});
 b.ctx.secureState.tidel_Pl='[{"id":"PERSONNE-FICTIVE-MODIFIEE"}]';
 await b.flush();
 a.ctx.secureSavedGen=a.ctx.secureGen;
 await assert.rejects(a.ctx.v258.ensureVaultSaved(),/Conflit de sauvegarde/);
 assert.equal(a.bar.dataset.state,'error');
 assert.match(a.message.textContent,/autre onglet/);
 assert.equal(a.writes(),1,'aucune écriture après détection');
});
test('V258 : événement storage d une autre fenêtre signale immédiatement le conflit',async()=>{
 const shared=new Map(),f=await fixture(shared,{previous:'snapshot-avant'});
 const callback=f.events.get('storage');
 assert.equal(typeof callback,'function');
 callback({key:'cle-sans-rapport',newValue:'différent'});
 assert.equal(f.bar.dataset.state,undefined);
 callback({key:'fiction-only',newValue:'snapshot-avant'});
 assert.equal(f.bar.dataset.state,undefined);
 callback({key:'fiction-only',newValue:'snapshot-après'});
 assert.equal(f.bar.dataset.state,'error');
 assert.match(f.message.textContent,/autre onglet/);
 assert.equal(f.writes(),0);
});
test('V258 : Web Locks refusé = échec prudent, sans écriture ni succès artificiel',async()=>{
 const shared=new Map(),f=await fixture(shared,{denyLocks:true});
 await assert.rejects(f.flush(),/Permissions refusées/);
 assert.equal(f.writes(),0);
 assert.equal(f.bar.dataset.state,'error');
 assert.equal(shared.size,0);
});
test('V258 : navigateur sans Web Locks conserve le garde-fou historique du coffre',async()=>{
 const shared=new Map();
 const a=await fixture(shared,{withWindow:false}),b=await fixture(shared,{withWindow:false});
 await a.flush();
 await assert.rejects(b.flush(),/Conflit de sauvegarde/);
 assert.equal(a.writes()+b.writes(),1);
});
test('V258 : pas de transmission réseau ni deuxième base, cache actualisé et suite CI incluse',async()=>{
 const [html,sw,packageJson,control]=await Promise.all([
  readFile(new URL('../big-cthu-beta/tournee-complete.html',import.meta.url),'utf8'),
  readFile(new URL('../big-cthu-beta/sw.js',import.meta.url),'utf8'),
  readFile(new URL('../package.json',import.meta.url),'utf8'),
  readFile(new URL('../big-cthu-beta/tournee-controle-iphone.html',import.meta.url),'utf8')
 ]);
 const code=html.slice(html.indexOf('var secureLastWrittenRecord=null;'),html.indexOf('async function exportEncryptedVault(){'));
 assert.doesNotMatch(code,/fetch\s*\(|XMLHttpRequest|sendBeacon|indexedDB\.open|location\.reload/);
 assert.match(code,/navigator\.locks\.request\('bigcthu-tournee-vault:'\+SECURE_KEY/);
 assert.match(code,/window\.addEventListener\('storage'/);
 assert.match(sw,/big-cthu-public-v2-v265/);
 assert.match(control,/big-cthu-public-v2-v265/);
 assert.match(packageJson,/tests\/tournee-v258-concurrent-vault\.test\.mjs/);
});

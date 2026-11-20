import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';
const load=()=>readFile(new URL('../big-cthu-beta/tournee-complete.html',import.meta.url),'utf8');
async function fixture({blocked=false,failWrite=false}={}){
 const html=await load(),start=html.indexOf('var secureLastWrittenRecord=null;'),end=html.indexOf('async function exportEncryptedVault(){',start);
 assert.ok(start>0&&end>start);
 const stored=new Map(),events=new Map(),bar={dataset:{}},message={textContent:''},retry={hidden:true,addEventListener(){}};
 let release,writeCount=0,timers=0;
 const wait=new Promise(resolve=>{release=resolve});
 const ctx={
  window:{addEventListener:(name,cb)=>events.set(name,cb)},
  document:{getElementById:id=>id==='tour-save-strip'?bar:id==='tour-save-text'?message:retry},
  localStorage:{getItem:key=>stored.get(key)??null,setItem(key,value){if(failWrite)throw Error('QuotaExceeded');writeCount++;stored.set(key,value)}},
  crypto:{getRandomValues:arr=>arr.fill(7),subtle:{async encrypt(_a,_k,bytes){if(blocked)await wait;return bytes}}},
  SECURE_KEY:'fiction-vault',secureState:{tidel_Pl:'[{"id":"PATIENT-FICTIF"}]'},secureKey:{},secureSalt:new Uint8Array(16),
  secureGen:1,secureSavedGen:0,secureActive:null,secureTimer:0,
  enc:new TextEncoder(),TextEncoder,Uint8Array,JSON,
  to64:bytes=>Buffer.from(bytes).toString('base64'),setTimeout:()=>{timers++;return 1},clearTimeout:()=>{}
 };
 runInNewContext(html.slice(start,end)+'\nthis.testApi={flush,dirty,ensureVaultSaved,saveFailure,saveStatus,writeEncryptedVaultRecord};',ctx,{timeout:1000});
 return {ctx,stored,events,bar,message,retry,release,api:ctx.testApi,writes:()=>writeCount,timers:()=>timers};
}
test('V259: conflit reçu bloque nouvelles écritures et les relances automatiques',async()=>{
 const f=await fixture();
 f.events.get('storage')({key:'fiction-vault',newValue:'externe'});
 assert.equal(f.bar.dataset.state,'error');
 assert.equal(f.retry.hidden,true,'réessai inutile masqué');
 f.ctx.secureState.tidel_Pl='[{"id":"FICTION-MODIFIEE"}]';
 f.api.dirty();
 assert.equal(f.timers(),0,'pas de nouveau timer d écriture dans la fenêtre périmée');
 assert.equal(f.bar.dataset.state,'error');
 assert.match(f.message.textContent,/ne peut plus enregistrer/);
 await assert.rejects(f.api.flush(),/Conflit de sauvegarde/);
 assert.equal(f.writes(),0);
});
test('V259: aucun succès artificiel après conflit, même via status ou export préparé',async()=>{
 const f=await fixture();
 f.api.saveFailure(Error('Conflit de sauvegarde : session périmée'));
 f.api.saveStatus('saved','Données chiffrées enregistrées sur cet appareil.');
 assert.equal(f.bar.dataset.state,'error');
 assert.equal(f.retry.hidden,true);
 assert.match(f.message.textContent,/Ce blocage ne supprime aucun patient/);
 await assert.rejects(f.api.ensureVaultSaved(),/Conflit de sauvegarde/);
});
test('V259: conflit pendant un chiffrement lent rejette sans modifier le coffre',async()=>{
 const f=await fixture({blocked:true});
 const pending=f.api.flush();
 f.events.get('storage')({key:'fiction-vault',newValue:'écriture-autre-onglet'});
 f.release();
 await assert.rejects(pending,/Conflit de sauvegarde/);
 assert.equal(f.writes(),0);
 assert.equal(f.bar.dataset.state,'error');
});
test('V259: erreur de stockage non conflictuelle conserve le bouton Réessayer',async()=>{
 const f=await fixture({failWrite:true});
 await assert.rejects(f.api.flush(),/QuotaExceeded/);
 assert.equal(f.bar.dataset.state,'error');
 assert.equal(f.retry.hidden,false);
 assert.equal(f.ctx.secureConflictDetected,false);
 assert.equal(f.writes(),0);
});
test('V259: édition normale fonctionne toujours, sans seconde base ni réseau',async()=>{
 const f=await fixture();
 await f.api.flush();
 assert.equal(f.writes(),1);
 assert.equal(f.bar.dataset.state,'saved');
 f.ctx.secureState.tidel_Pl='[{"id":"FICTION-2"}]';
 f.api.dirty();
 await f.api.flush();
 assert.equal(f.writes(),2);
 assert.equal(f.bar.dataset.state,'saved');
 const source=await load(),pipe=source.slice(source.indexOf('var secureLastWrittenRecord=null;'),source.indexOf('async function exportEncryptedVault(){'));
 assert.doesNotMatch(pipe,/fetch\s*\(|XMLHttpRequest|indexedDB\.open|WebSocket|sendBeacon/);
});
test('V259: cache, commande et risques documentés',async()=>{
 const sw=await readFile(new URL('../big-cthu-beta/sw.js',import.meta.url),'utf8');
 const pkg=await readFile(new URL('../package.json',import.meta.url),'utf8');
 const plan=await readFile(new URL('../docs/tournee-pro/PLAN-DE-LANCEMENT.md',import.meta.url),'utf8');
 assert.match(sw,/big-cthu-public-v2-v262/);
 assert.match(pkg,/tournee-v259-conflict-freeze\.test\.mjs/);
 assert.match(plan,/Golipette V259/);
});

import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';

async function fixture(shared,initial=null){
 const html=await readFile(new URL('../big-cthu-beta/tournee-complete.html',import.meta.url),'utf8');
 const start=html.indexOf('function saveStatus(state,message){');
 const prelude=html.lastIndexOf('var secureLastWrittenRecord=null;',start);
 const end=html.indexOf('async function exportEncryptedVault(){',start);
 assert.ok(prelude>=0&&end>start);
 const bar={dataset:{},hidden:false},message={textContent:''},retry={hidden:true,addEventListener(){}};
 let writes=0;
 const ctx={
  document:{getElementById:id=>id==='tour-save-strip'?bar:id==='tour-save-text'?message:retry},
  localStorage:{
   getItem:key=>shared.get(key)??null,
   setItem(key,value){writes++;shared.set(key,value)}
  },
  crypto:{getRandomValues:arr=>arr.fill(1),subtle:{encrypt:async (_alg,_key,input)=>input}},
  SECURE_KEY:'fiction-only',secureState:{tidel_Pl:'[{"id":"fiction"}]'},
  secureKey:{},secureSalt:new Uint8Array(16),secureGen:1,secureSavedGen:0,secureActive:null,secureTimer:0,
  to64:bytes=>Buffer.from(bytes).toString('base64'),enc:new TextEncoder(),
  TextEncoder,JSON,Uint8Array,setTimeout:()=>1,clearTimeout:()=>{}
 };
 runInNewContext(html.slice(prelude,end)+'\nthis.flushVault=flush;this.markDirty=dirty;',ctx,{timeout:1000});
 ctx.secureLastWrittenRecord=initial;
 return {ctx,bar,message,retry,flush:()=>ctx.flushVault(),writes:()=>writes};
}

test('V105: deux onglets fictifs — le second refuse d écraser un coffre actualisé dans le premier',async()=>{
 const shared=new Map();
 const creator=await fixture(shared);
 await creator.flush();
 const original=shared.get('fiction-only');
 const a=await fixture(shared,original);
 const b=await fixture(shared,original);
 a.ctx.secureState.tidel_Pl='[{"id":"fiction-A"}]';
 await a.flush();
 const latest=shared.get('fiction-only');
 assert.notEqual(latest,original);
 b.ctx.secureState.tidel_Pl='[{"id":"fiction-B"}]';
 await assert.rejects(b.flush(),/Conflit de sauvegarde/);
 assert.equal(shared.get('fiction-only'),latest,'the newer tab remains untouched');
 assert.equal(b.ctx.secureSavedGen,0,'stale tab never acknowledges a save');
 assert.equal(b.writes(),0,'stale tab never writes');
 assert.equal(b.bar.dataset.state,'error');
 assert.match(b.message.textContent,/autre onglet/);
});

test('V105: un seul onglet peut continuer ses mises à jour successives',async()=>{
 const shared=new Map(),a=await fixture(shared);
 await a.flush();
 const first=shared.get('fiction-only');
 a.ctx.secureState.tidel_Pl='[{"id":"fiction-2"}]';
 a.ctx.markDirty();
 await a.flush();
 assert.notEqual(shared.get('fiction-only'),first);
 assert.equal(a.ctx.secureSavedGen,a.ctx.secureGen);
 assert.equal(a.bar.dataset.state,'saved');
 assert.equal(a.writes(),2);
});

test('V105: deux ouvertures initiales sans coffre : une seule écrit, sans suppression de données',async()=>{
 const shared=new Map(),a=await fixture(shared),b=await fixture(shared);
 await a.flush();
 const result=shared.get('fiction-only');
 await assert.rejects(b.flush(),/Conflit de sauvegarde/);
 assert.equal(shared.get('fiction-only'),result);
 assert.equal(b.writes(),0);
});

test('V105: la reprise sans code conserve le snapshot confirmé et ne contacte jamais Topaze',async()=>{
 const html=await readFile(new URL('../big-cthu-beta/tournee-complete.html',import.meta.url),'utf8');
 assert.match(html,/secureLastWrittenRecord=saved;/);
 assert.match(html,/secureLastWrittenRecord=record;/);
 assert.match(html,/if\(localStorage\.getItem\(SECURE_KEY\)!==secureLastWrittenRecord\)/);
 assert.match(html,/id="tour-security-gate" hidden/);
 const section=html.slice(html.indexOf('var secureLastWrittenRecord=null;'),html.indexOf('async function exportEncryptedVault(){'));
 assert.doesNotMatch(section,/fetch\(|XMLHttpRequest|Topaze\./);
});

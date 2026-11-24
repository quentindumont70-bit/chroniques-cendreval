import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';

const read=name=>readFile(new URL('../big-cthu-beta/'+name,import.meta.url),'utf8');
async function fixture({cachePresent=true,complete=true,controlled=true,offline=false,denied=false}={}){
 const html=await read('tournee-controle-iphone.html');
 const script=html.match(/<script id="diagnostic-script">([\s\S]*?)<\/script>/)?.[1];
 assert.ok(script,'test du script réel du contrôle');
 const nodes=new Map(),callbacks=new Map();
 const get=id=>{
  if(!nodes.has(id))nodes.set(id,{textContent:'',dataset:{},addEventListener:(name,callback)=>callbacks.set(id+':'+name,callback)});
  return nodes.get(id);
 };
 const paths=['tournee-complete.html','tournee-demarrage.html','tournee-controle-iphone.html'];
 const caches={
  keys:async()=>{if(denied)throw Error('not allowed');return cachePresent?['big-cthu-public-v2-v267']:[]},
  open:async()=>({match:async url=>{
   const found=paths.find(path=>url.endsWith(path));
   return found&&(!(!complete&&found==='tournee-demarrage.html'))?{ok:true}:undefined;
  }})
 };
 const window={},ctx={
  window,document:{getElementById:get},caches,navigator:{serviceWorker:{controller:controlled?{}:null},onLine:!offline},
  URL,location:{href:'https://example.test/chroniques-cendreval/big-cthu-beta/tournee-controle-iphone.html'},
  matchMedia:()=>({matches:false})
 };
 runInNewContext(script,ctx,{timeout:1000});
 const state=await window.tourneeOfflineCheck();
 return {state,get,html,callbacks};
}
test('V257 : cache complet et service actif = pages publiques prêtes pour essai réel',async()=>{
 const f=await fixture({offline:true});
 assert.equal(f.state.ready,true);
 assert.equal(f.state.reason,'public-shell');
 assert.equal(f.get('result').dataset.state,'ready');
 assert.match(f.get('network').textContent,/hors ligne/);
 assert.match(f.get('result').textContent,/essai réel/);
 assert.ok(f.callbacks.has('check-now:click'));
});
test('V257 : cache absent, partiel ou SW sans contrôleur = jamais prêt',async()=>{
 for(const [options,reason] of [
  [{cachePresent:false},'missing-cache'],
  [{complete:false},'incomplete-cache'],
  [{controlled:false},'not-controlled']
 ]){
  const f=await fixture(options);
  assert.equal(f.state.ready,false);
  assert.equal(f.state.reason,reason);
  assert.equal(f.get('result').dataset.state,'attention');
 }
});
test('V257 : accès CacheStorage refusé donne un état prudent sans erreur trompeuse',async()=>{
 const f=await fixture({denied:true});
 assert.equal(f.state.ready,false);
 assert.equal(f.state.reason,'unavailable');
 assert.equal(f.get('result').dataset.state,'error');
 assert.match(f.get('result').textContent,/ne signifie pas que tes dossiers ont disparu/);
});
test('V257 : aucun accès aux données de santé, aucun réseau et intégration guide + cache',async()=>{
 const [html,guide,sw,packageJson]=await Promise.all([
  read('tournee-controle-iphone.html'),read('tournee-demarrage.html'),read('sw.js'),
  readFile(new URL('../package.json',import.meta.url),'utf8')
 ]);
 assert.doesNotMatch(html,/localStorage|sessionStorage|indexedDB|document\.cookie|XMLHttpRequest|fetch\s*\(|sendBeacon/);
 assert.doesNotMatch(html,/tidel_Pl|tidel_absences_journal_v1|Topaze\.fr/);
 assert.match(html,/CacheStorage/);
 assert.match(guide,/tournee-controle-iphone\.html/);
 assert.match(sw,/'\.\/tournee-controle-iphone\.html'/);
 assert.match(sw,/big-cthu-public-v2-v267/);
 assert.match(packageJson,/tests\/tournee-v257-offline-readiness\.test\.mjs/);
});

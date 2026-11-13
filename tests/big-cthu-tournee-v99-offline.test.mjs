import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';

const source=()=>readFile(new URL('../big-cthu-beta/tournee-complete.html',import.meta.url),'utf8');
async function fixture(initialOnline=true){
 const html=await source();
 const begin=html.indexOf('function updateTourNetworkStatus(){');
 const end=html.indexOf('function saveIfPending(){',begin);
 assert.ok(begin>=0&&end>begin);
 const listeners=new Map(),badge={dataset:{},textContent:''};
 const ctx={
  navigator:{onLine:initialOnline},
  document:{getElementById(id){assert.equal(id,'tour-network-state');return badge}},
  window:{addEventListener(type,fn){listeners.set(type,fn)}},
 };
 runInNewContext(html.slice(begin,end),ctx,{timeout:1000});
 return {ctx,badge,listeners,html};
}
test('V99: internet coupé ne bloque pas Tournée et indique le stockage local',async()=>{
 const f=await fixture(false);
 assert.equal(f.badge.dataset.online,'false');
 assert.match(f.badge.textContent,/Hors ligne · stockage local/);
 f.ctx.navigator.onLine=true;
 f.listeners.get('online')();
 assert.equal(f.badge.dataset.online,'true');
 assert.match(f.badge.textContent,/Réseau disponible · stockage local/);
 f.ctx.navigator.onLine=false;
 f.listeners.get('offline')();
 assert.equal(f.badge.dataset.online,'false');
});

test('V99: chargement direct de Tournée enregistre le cache public via mobile-boot',async()=>{
 const [html,boot,worker]=await Promise.all([
 source(),
 readFile(new URL('../big-cthu-beta/mobile-boot.js',import.meta.url),'utf8'),
 readFile(new URL('../big-cthu-beta/sw.js',import.meta.url),'utf8')
 ]);
 assert.match(html,/<script src="\.\/mobile-boot\.js" defer><\/script>/);
 assert.match(boot,/worker\.register\('\.\/sw\.js'\)/);
 assert.match(worker,/'\.\/tournee-complete\.html'/);
 assert.match(worker,/caches\.match\(r,\{ignoreSearch:true\}\)/);
 assert.match(worker,/const CACHE='big-cthu-public-v2-v\d+'/);
 assert.match(html,/id="tour-network-state"/);
});

test('V99: aucun secret ni journal patient envoyé pour afficher l état réseau',async()=>{
 const html=await source();
 const code=html.slice(html.indexOf('function updateTourNetworkStatus(){'),html.indexOf('function saveIfPending(){'));
 assert.doesNotMatch(code,/fetch\(|XMLHttpRequest|WebSocket|localStorage|TOUR_STORE|secureState|crypto/);
 assert.match(html,/id="tour-security-gate" hidden/);
});

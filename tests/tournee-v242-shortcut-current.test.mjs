import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const read=name=>readFile(new URL('../big-cthu-beta/'+name,import.meta.url),'utf8');
test('V242: raccourci iPhone charge le document le plus récent en ligne sans changer son adresse',async()=>{
 const sw=await read('sw.js');
 assert.match(sw,/const CACHE='big-cthu-public-v2-v243'/);
 assert.match(sw,/if\(r\.mode==='navigate'\)/);
 assert.match(sw,/fetch\(r,\{cache:'no-store'\}\)/);
 assert.match(sw,/caches\.match\(r,\{ignoreSearch:true\}\)/);
 assert.match(sw,/if\(r\.method!=='GET'\)return/);
 assert.match(sw,/if\(url\.origin!==self\.location\.origin\)return/);
 assert.match(sw,/'\.\/tournee-complete\.html'/);
 assert.match(sw,/'\.\/tournee-quick-core\.js'/);
});

test('V242: mise à jour proposée sans recharger un formulaire clinique en cours',async()=>{
 const js=await read('mobile-boot.js');
 assert.doesNotThrow(()=>new Function(js));
 assert.match(js,/worker\.register\('\.\/sw\.js',\{updateViaCache:'none'\}\)/);
 assert.match(js,/addEventListener\('pageshow',update\)/);
 assert.match(js,/addEventListener\('visibilitychange'/);
 assert.match(js,/addEventListener\('online',update\)/);
 assert.match(js,/addEventListener\('controllerchange'/);
 assert.match(js,/if\(window\.confirm\('Actualiser Tournée maintenant \?/);
 assert.match(js,/id='tour-refresh-latest'/);
 assert.doesNotMatch(js,/localStorage\.removeItem|caches\.delete|secureState|TOUR_STORE/);
});

test('V242: un seul assistant visible en page d’accueil et post-it maintenu',async()=>{
 const html=await read('tournee-complete.html');
 const start=html.indexOf('function viewTour(){');
 const end=html.indexOf('function ',start+21);
 assert.ok(start>0&&end>start);
 const view=html.slice(start,end);
 assert.equal((view.match(/h\+=tqChatBlock\(\)/g)||[]).length,1);
 assert.equal((view.match(/h\+=tqWeekBlock\(\)/g)||[]).length,1);
 assert.equal((view.match(/h\+=tqPostitBlock\(\)/g)||[]).length,1);
 assert.match(html,/id="tq-header-chat"/);
 assert.match(html,/id="tour-save-menu" aria-expanded="false"/);
 assert.match(html,/role="status" aria-live="polite"/);
});

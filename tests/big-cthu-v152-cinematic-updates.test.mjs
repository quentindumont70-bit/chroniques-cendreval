import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const read=name=>readFile(new URL('../big-cthu-beta/'+name,import.meta.url),'utf8');

test('V152: mise à jour PWA visible dans la scène et sans doublon',async()=>{
 const html=await read('index.html');
 const i=html.indexOf('id="refreshUpdate"');
 const hero=html.indexOf('<section class="hero"');
 const end=html.indexOf('</section>',hero);
 assert.ok(i>hero&&i<end,'la notification est en haut du cockpit');
 assert.equal((html.match(/id="refreshUpdate"/g)||[]).length,1);
 assert.match(html,/<button class="cinema-update" id="refreshUpdate" type="button" hidden aria-live="polite">/);
 assert.match(html,/\.cinema-update\[hidden\]\{display:none!important\}/);
 assert.match(html,/\.cinema-update\{width:100%;min-height:52px\}/);
 assert.match(html,/\$\('#refreshUpdate'\)\.addEventListener\('click',\(\)=>location\.reload\(\)\)/);
 assert.match(html,/if\(reg\.waiting\)showUpdate\(\)/);
 assert.match(html,/navigator\.serviceWorker\.addEventListener\('controllerchange'/);
});

test('V152: cache renouvelé et Tournée strictement isolée',async()=>{
 const [sw,main,tour]=await Promise.all(['sw.js','index.html','tournee-complete.html'].map(read));
 assert.match(sw,/big-cthu-public-v2-v152/);
 assert.match(main,/class="page"/);
 assert.match(main,/class="cinema-live-pulse"/);
 assert.match(main,/id="cthuThemeToggle"/);
 assert.doesNotMatch(tour,/cinema-update|V152/);
});

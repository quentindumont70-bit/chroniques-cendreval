import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const read=p=>readFile(new URL('../big-cthu-beta/'+p,import.meta.url),'utf8');
test('V126 Medical Ops has authentic tech scenery and unique non-organic instrument layout',async()=>{
 const [ops,premium,organic]=await Promise.all(['medical-ops-cinema.html','premium-cinema.html','organic-cinema.html'].map(read));
 assert.match(ops,/FUTURIST MEDICAL OPS/);
 assert.match(ops,/photo-1648565726114-cfb73eb46340/);
 assert.match(ops,/Alex Pavor sur Unsplash/);
 assert.match(ops,/\.ops:before\{[^}]*position:fixed/);
 assert.match(ops,/\.scanner\{/);
 assert.match(ops,/\.scan-core\{/);
 assert.match(ops,/\.panel\{[^}]*clip-path:polygon/);
 assert.match(ops,/\.gridmesh\{[^}]*linear-gradient/);
 assert.notEqual(ops,premium);
 assert.notEqual(ops,organic);
});
test('V126 iPhone has dedicated HUD, access links and non-motion alternative',async()=>{
 const ops=await read('medical-ops-cinema.html');
 assert.match(ops,/class="dock" aria-label="Navigation mobile"/);
 assert.match(ops,/@media\(max-width:760px\)/);
 assert.match(ops,/@media\(max-width:365px\)/);
 assert.match(ops,/prefers-reduced-motion:reduce/);
 assert.match(ops,/prefers-reduced-transparency:reduce/);
 for(const file of ['tournee-complete.html','maison.html','budget.html','agenda.html','escalade.html','passions.html','index.html','organic-cinema.html','premium-cinema.html']){
  assert.ok(ops.includes('./'+file),'missing navigation to '+file);
 }
 assert.doesNotMatch(ops,/3 priorités|82%|93%|76%|68%/);
});
test('V126 gallery has all three previews and patient data is isolated',async()=>{
 const [ops,organic,premium,tour,sw]=await Promise.all(['medical-ops-cinema.html','organic-cinema.html','premium-cinema.html','tournee-complete.html','sw.js'].map(read));
 assert.ok(premium.includes('./medical-ops-cinema.html'));
 assert.ok(organic.includes('./medical-ops-cinema.html'));
 assert.ok(ops.includes('./organic-cinema.html'));
 assert.ok(ops.includes('./premium-cinema.html'));
 assert.doesNotMatch(ops,/<script\b|localStorage|indexedDB|tidel_|Topaze|crypto\.subtle/i);
 assert.doesNotMatch(tour,/medical-ops-cinema\.html/);
 assert.match(sw,/'\.\/medical-ops-cinema\.html'/);
 assert.match(sw,/big-cthu-public-v2-v126/);
 const list=sw.slice(sw.indexOf('const ASSETS=['),sw.indexOf('];',sw.indexOf('const ASSETS=['))+2);
 assert.doesNotMatch(list,/images\.unsplash\.com/);
});

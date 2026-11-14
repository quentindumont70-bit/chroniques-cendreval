import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const read=p=>readFile(new URL('../big-cthu-beta/'+p,import.meta.url),'utf8');
test('V124 luxury architecture adds visible glass architecture without masking alpine scene',async()=>{
 const html=await read('premium-cinema.html');
 assert.match(html,/V124 — architecture de verrière/);
 assert.match(html,/class="scene-stamp"/);
 assert.match(html,/CRYSTAL<br>VISTA/);
 assert.match(html,/\.topinner:after\{[^}]*linear-gradient/);
 assert.match(html,/\.topbar:after\{[^}]*linear-gradient/);
 assert.match(html,/\.hero-content:after\{[^}]*border:1px solid/);
 assert.match(html,/\.hero:before\{[^}]*linear-gradient/);
 assert.match(html,/\.page:before\{[^}]*position:fixed/);
 assert.match(html,/@media\(max-width:760px\)/);
 assert.match(html,/@media\(max-width:370px\)/);
});
test('V124 remains design-only and isolated from Tournée',async()=>{
 const [html,tour,sw]=await Promise.all(['premium-cinema.html','tournee-complete.html','sw.js'].map(read));
 assert.doesNotMatch(html,/<script\b|indexedDB|localStorage|tidel_/i);
 assert.doesNotMatch(tour,/premium-cinema\.html/);
 assert.match(sw,/big-cthu-public-v2-v\d+/);
});

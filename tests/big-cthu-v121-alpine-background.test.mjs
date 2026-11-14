import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const read=name=>readFile(new URL('../big-cthu-beta/'+name,import.meta.url),'utf8');

test('V121: one real photographic landscape remains fixed behind the entire cockpit',async()=>{
 const html=await read('premium-cinema.html');
 const css=html.slice(html.indexOf('<style>'),html.indexOf('</style>'));
 const fixed=css.match(/\.page:before\{([^}]+)\}/);
 assert.ok(fixed,'global mountain scene');
 assert.match(fixed[1],/position:fixed/);
 assert.match(fixed[1],/inset:0/);
 assert.match(fixed[1],/images\.unsplash\.com\/photo-/);
 assert.match(fixed[1],/cover no-repeat/);
 assert.match(css,/\.page\{[^}]*isolation:isolate/);
 assert.match(css,/\.page:after\{[^}]*position:fixed/);
 assert.doesNotMatch(html,/<img class="hero-photo"/,'no repeated mountain within hero');
 assert.match(css,/\.hero\{[^}]*background:linear-gradient\(125deg,rgba\(5,19,35,\.37\)/);
});

test('V121: iPhone photo remains anchored, with mobile crop and safe readable overlays',async()=>{
 const html=await read('premium-cinema.html');
 const mobile=html.slice(html.indexOf('@media(max-width:760px)'),html.indexOf('@media(max-width:370px)'));
 assert.match(mobile,/\.page:before\{[^}]*w=960/);
 assert.match(mobile,/background-position:58% 44%/);
 assert.match(mobile,/\.page:after\{[^}]*linear-gradient/);
 assert.match(mobile,/\.hero:before\{[^}]*rgba\(3,13,27,\.73\)/);
 assert.match(html,/backdrop-filter:blur\(20px\)/);
 assert.match(html,/backdrop-filter:blur\(15px\)/);
 assert.match(html,/prefers-reduced-motion:reduce/);
});

test('V121: proof remains separate, no clinical data, real modules keep their links',async()=>{
 const [html,sw,tour]=await Promise.all(['premium-cinema.html','sw.js','tournee-complete.html'].map(read));
 assert.doesNotMatch(html,/<script\b|localStorage|indexedDB|tidel_/);
 assert.doesNotMatch(tour,/premium-cinema/);
 for(const file of ['tournee-complete.html','maison.html','budget.html','agenda.html','passions.html']){
  assert.ok(html.includes('./'+file),file);
 }
 assert.match(sw,/'\.\/premium-cinema\.html'/);
 assert.doesNotMatch(sw,/images\.unsplash\.com/);
 assert.match(sw,/big-cthu-public-v2-v121/);
});

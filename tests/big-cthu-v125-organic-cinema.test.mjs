import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const read=p=>readFile(new URL('../big-cthu-beta/'+p,import.meta.url),'utf8');

test('V125: genuinely distinct organic cinematic art uses real tentacle photography',async()=>{
 const [html,premium]=await Promise.all(['organic-cinema.html','premium-cinema.html'].map(read));
 assert.match(html,/DARK ORGANIC LUXURY/);
 assert.match(html,/Le cerveau<br>du <em>Cthu/);
 assert.match(html,/photo-1523486230352-65ff5222cea4/);
 assert.match(html,/Masaaki Komori sur Unsplash/);
 assert.match(html,/\.stage:before\{[^}]*position:fixed/);
 assert.match(html,/\.organic-scene:before\{[^}]*url\("https:\/\/images\.unsplash\.com/);
 assert.match(html,/\.sigil-ring\.r1\{/);
 assert.match(html,/\.organic-tile:nth-child\(2n\)/);
 assert.match(html,/border-radius:77px 20px 89px 19px/);
 assert.notEqual(html,premium,'organic is a different layout, not recolored Premium');
});

test('V125: mobile organic layout, navigation and reduced motion',async()=>{
 const html=await read('organic-cinema.html');
 assert.match(html,/class="dock" aria-label="Navigation iPhone"/);
 assert.match(html,/@media\(max-width:760px\)/);
 assert.match(html,/@media\(max-width:365px\)/);
 assert.match(html,/prefers-reduced-motion:reduce/);
 assert.match(html,/prefers-reduced-transparency:reduce/);
 assert.match(html,/\.organic-scene\{grid-template-columns:1fr/);
 for(const path of ['tournee-complete.html','maison.html','budget.html','agenda.html','discobinch.html','passions.html','index.html','premium-cinema.html']){
  assert.ok(html.includes('./'+path),'missing real module link '+path);
 }
});

test('V125: reciprocal gallery access is explicit without replacing official cockpit',async()=>{
 const [organic,premium,tour,sw]=await Promise.all(['organic-cinema.html','premium-cinema.html','tournee-complete.html','sw.js'].map(read));
 assert.ok(premium.includes('./organic-cinema.html'));
 assert.ok(organic.includes('./premium-cinema.html'));
 assert.doesNotMatch(organic,/<script\b|indexedDB|localStorage|tidel_/i);
 assert.doesNotMatch(tour,/organic-cinema\.html/);
 assert.match(sw,/'\.\/organic-cinema\.html'/);
 assert.match(sw,/big-cthu-public-v2-v126/);
 const list=sw.slice(sw.indexOf('const ASSETS=['),sw.indexOf('];',sw.indexOf('const ASSETS=['))+2);
 assert.doesNotMatch(list,/images\.unsplash\.com/);
});

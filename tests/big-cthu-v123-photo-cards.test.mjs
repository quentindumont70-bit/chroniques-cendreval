import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const read=name=>readFile(new URL('../big-cthu-beta/'+name,import.meta.url),'utf8');

test('V123: real photography replaces flat theme gradients for five distinct cards',async()=>{
 const html=await read('premium-cinema.html');
 const section=html.slice(html.indexOf('/* V123 — portes photographiques'));
 assert.ok(section.length>1000,'dedicated cinematic module rules exist');
 const photoSources=['maison','budget','agenda','creation','passions'];
 const ids=new Set();
 for(const module of photoSources){
  const rule=section.match(new RegExp('\\.module\\.'+module+'\\{([^}]+)\\}'));
  assert.ok(rule, 'missing photographic card '+module);
  assert.match(rule[1],/https:\/\/images\.unsplash\.com\/photo-/);
  const photo=rule[1].match(/photo-[0-9a-f-]+/);
  assert.ok(photo);
  ids.add(photo[0]);
 }
 assert.equal(ids.size,5,'cards should have five different photographic compositions');
 assert.match(section,/\.module\.tournee\{[^}]*radial-gradient/,'clinical link uses safe abstract styling instead of photos of actual patients');
});

test('V123: interactive luxury glass keeps titles readable at every screen width',async()=>{
 const html=await read('premium-cinema.html');
 const css=html.slice(html.indexOf('/* V123 — portes photographiques'));
 assert.match(css,/\.module:before\{[^}]*rgba\(1,10,23,\.96\)/);
 assert.match(css,/\.module p\{[^}]*text-shadow:/);
 assert.match(css,/\.module:after\{[^}]*linear-gradient/);
 assert.match(css,/\.module:hover:before,\.module:focus-visible:before/);
 assert.match(css,/@media\(max-width:760px\)/);
 assert.match(css,/@media\(max-width:370px\)/);
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
 assert.match(css,/\.module:hover:before,\.module:focus-visible:before\{transform:none!important\}/);
});

test('V123: photographic preview never reads patient data and official Tournée is untouched',async()=>{
 const [html,tour,sw]=await Promise.all(['premium-cinema.html','tournee-complete.html','sw.js'].map(read));
 assert.doesNotMatch(html,/<script\b|localStorage|indexedDB|tidel_|crypto\.subtle/);
 assert.doesNotMatch(tour,/premium-cinema\.html/);
 assert.match(sw,/'\.\/premium-cinema\.html'/);
 assert.doesNotMatch(sw.slice(sw.indexOf('const ASSETS=['),sw.indexOf('];',sw.indexOf('const ASSETS=['))+2),/images\.unsplash\.com/);
 assert.match(sw,/big-cthu-public-v2-v126/);
});

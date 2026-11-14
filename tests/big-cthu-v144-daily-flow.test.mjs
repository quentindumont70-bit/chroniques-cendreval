import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const read=name=>readFile(new URL('../big-cthu-beta/'+name,import.meta.url),'utf8');

test('V144: trois pages utiles permettent le parcours direct sans perdre le cockpit',async()=>{
 for(const [file,current] of [['capture.html','capture.html'],['agenda.html','agenda.html'],['sauvegardes.html','sauvegardes.html']]){
  const html=await read(file);
  const i=html.indexOf('<nav class="cthu-daily-flow"');
  assert.ok(i>0,file);
  const nav=html.slice(i,html.indexOf('</nav>',i));
  for(const href of ['./capture.html','./agenda.html','./index.html#radar','./sauvegardes.html'])
   assert.ok(nav.includes('href="'+href+'"'),file+': '+href);
  assert.equal((nav.match(/<a href=/g)||[]).length,4);
  assert.ok(nav.includes('href="./'+current+'" aria-current="page"'));
  assert.doesNotMatch(nav,/https?:|javascript:|onclick|localStorage|fetch\(/);
 }
});

test('V144: liens tactiles thème-aware, service worker mis à jour et Tournée isolée',async()=>{
 const [css,sw,main,tour]=await Promise.all(['cockpit-themes.css','sw.js','index.html','tournee-complete.html'].map(read));
 assert.match(css,/\.cthu-daily-flow a\[aria-current="page"\]/);
 assert.match(css,/\.cthu-daily-flow a:focus-visible/);
 assert.match(css,/min-height:52px/);
 assert.match(main,/id="radar"/);
 assert.match(sw,/big-cthu-public-v2-v144/);
 for(const file of ['capture.html','agenda.html','sauvegardes.html'])assert.ok(sw.includes("'./"+file+"'"));
 assert.doesNotMatch(tour,/cthu-daily-flow/);
});

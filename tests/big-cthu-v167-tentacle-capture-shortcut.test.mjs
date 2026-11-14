import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const read=name=>readFile(new URL('../big-cthu-beta/'+name,import.meta.url),'utf8');
test('V167: daily tentacles provide direct keyboard-friendly Capture access',async()=>{
 for(const page of ['maison.html','musique.html','nutrition.html']){
  const html=await read(page);
  const start=html.indexOf('<header>');
  const end=html.indexOf('</header>',start);
  assert.ok(start>=0&&end>start,page);
  const header=html.slice(start,end);
  assert.equal((header.match(/class="cthu-fast-capture"/g)||[]).length,1,page);
  assert.match(header,/href="\.\/capture\.html"/,page);
  assert.match(header,/aria-label="Capturer une idée rapidement"/,page);
  assert.ok(html.includes('href="./index.html"'),page);
 }
});
test('V167: shared CSS preserves themes, cache and clinical isolation',async()=>{
 const [css,sw,tour]=await Promise.all(['cockpit-themes.css','sw.js','tournee-complete.html'].map(read));
 assert.match(css,/body\[data-cthu-area\] header \.cthu-fast-capture/);
 assert.match(css,/\.cthu-fast-capture:focus-visible/);
 assert.match(css,/@media\(max-width:650px\)/);
 assert.match(sw,/big-cthu-public-v2-v167/);
 assert.doesNotMatch(tour,/cthu-fast-capture|V167/);
});

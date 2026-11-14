import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const read=name=>readFile(new URL('../big-cthu-beta/'+name,import.meta.url),'utf8');

test('V156: three differentiated cinematic art directions with shared working cockpit',async()=>{
 const [css,home,js,sw]=await Promise.all(['cinema-upgrade.css','index.html','cockpit-themes.js','sw.js'].map(read));
 for(const theme of ['premium','organic','medical']){
  assert.match(css,new RegExp('html\\[data-cthu-theme="'+theme+'"\\]'));
  assert.match(home,new RegExp('data-cthu-choice="'+theme+'"'));
  assert.ok(js.includes(theme+":'"));
 }
 assert.match(css,/html\[data-cthu-theme="organic"\] \.module:nth-child\(3n/);
 assert.match(css,/html\[data-cthu-theme="medical"\] \.module/);
 assert.match(css,/clip-path:polygon\(/);
 assert.match(css,/html\[data-cthu-theme="premium"\] \.module\.special/);
 assert.match(css,/@media\(max-width:760px\)/);
 assert.match(css,/@media\(prefers-reduced-transparency:reduce\)/);
 assert.match(sw,/big-cthu-public-v2-v156/);
});

test('V156: design only and Tournée safely outside scope',async()=>{
 const [css,tour]=await Promise.all(['cinema-upgrade.css','tournee-complete.html'].map(read));
 assert.doesNotMatch(css,/localStorage|fetch\(|indexedDB|XMLHttpRequest|@import|<script/i);
 assert.doesNotMatch(tour,/V156|cinema-upgrade\.css/);
});

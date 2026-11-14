import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const read=name=>readFile(new URL('../big-cthu-beta/'+name,import.meta.url),'utf8');
test('V157: Maison receives panoramic cinema stylesheet with three themes',async()=>{
 const [html,css,sw]=await Promise.all(['maison.html','cinema-maison.css','sw.js'].map(read));
 assert.match(html,/data-cthu-area="maison"/);
 assert.match(html,/data-cthu-theme-tentacle="yes"/);
 assert.match(html,/href="\.\/cinema-maison\.css"/);
 assert.ok(html.indexOf('href="./cinema-maison.css"')>html.indexOf('href="./cockpit-themes.css"'));
 for(const name of ['premium','organic','medical'])assert.ok(css.includes('data-cthu-theme="'+name+'"'));
 for(const zone of ['.lead','.metrics','.metric','.panel','.job','.maison-pulse-item','.maison-add-options'])assert.ok(css.includes(zone));
 assert.match(css,/@media\(max-width:760px\)/);
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
 assert.match(css,/@media\(prefers-reduced-transparency:reduce\)/);
 assert.match(sw,/big-cthu-public-v2-v157/);
 assert.match(sw,/'\.\/cinema-maison\.css'/);
});
test('V157: forms, exports and patient-free Tournee isolation unchanged',async()=>{
 const [html,css,tour]=await Promise.all(['maison.html','cinema-maison.css','tournee-complete.html'].map(read));
 for(const id of ['form','name','maisonAddOptions','total','progress','budget','maisonPulse','export','import'])assert.ok(html.includes('id="'+id+'"'),id);
 assert.match(html,/big-cthu-v2-maison-v1/);
 assert.doesNotMatch(css,/localStorage|fetch\(|indexedDB|XMLHttpRequest|@import|<script/i);
 assert.doesNotMatch(tour,/cinema-maison\.css|V157/);
});

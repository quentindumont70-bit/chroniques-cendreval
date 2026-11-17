import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const read=name=>readFile(new URL('../big-cthu-beta/'+name,import.meta.url),'utf8');
test('V183: Maison defaults to open work and keeps a visible completed-archives option',async()=>{
 const [html,sw,tour]=await Promise.all(['maison.html','sw.js','tournee-complete.html'].map(read));
 assert.match(html,/<option value="open" selected>À suivre \(ouverts\)<\/option>/);
 assert.match(html,/<option value="all">Tous \(archives comprises\)<\/option>/);
 assert.match(html,/<option value="done">Terminés<\/option>/);
 assert.match(html,/active==='open'&&j\.status!=='done'/);
 assert.match(html,/\$\('total'\)\.textContent=jobs\.length/);
 for(const id of ['jobs','export','import','filter','search','form'])assert.ok(html.includes('id="'+id+'"'),id);
 assert.match(html,/big-cthu-v2-maison-v1/);
 assert.match(sw,/big-cthu-public-v2-v\d+/);
 assert.doesNotMatch(tour,/V183|value="open"/);
});

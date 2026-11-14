import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const read=name=>readFile(new URL('../big-cthu-beta/'+name,import.meta.url),'utf8');

test('V165: explicit destination sends new tasks and dated Agenda captures in one step',async()=>{
 const html=await read('capture.html');
 assert.match(html,/if\(save\(\[obj,\.\.\.items\]\)\)\{/);
 assert.match(html,/obj\.target==='task'\|\|\(obj\.target==='agenda'&&obj\.due\)/);
 assert.match(html,/&&destination\(obj\)/);
 assert.match(html,/items\.map\(v=>v\.id===obj\.id\?\{\.\.\.v,status:'sent'\}:v\)/);
 assert.match(html,/un nouvel essai ne créera pas de doublon/);
 assert.match(html,/Sans date, complète-la depuis/);
});
test('V165: neutral capture stays local, idempotent transfers and user history preserved',async()=>{
 const [html,sw,tour]=await Promise.all(['capture.html','sw.js','tournee-complete.html'].map(read));
 assert.match(html,/target:\$\('target'\)\.value/);
 assert.match(html,/<option value="inbox">Boîte d'entrée<\/option>/);
 assert.match(html,/const found=a\.some\(v=>v&&v\.captureId===x\.id\)/);
 assert.match(html,/KEY='big-cthu-v2-inbox-v1'/);
 assert.match(html,/<option value="all">Toutes les captures \(avec archives\)<\/option>/);
 assert.match(sw,/big-cthu-public-v2-v165/);
 assert.doesNotMatch(tour,/V165|capture-send-date/);
});

import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const read=name=>readFile(new URL('../big-cthu-beta/'+name,import.meta.url),'utf8');

test('V163: an undated Agenda capture gets an inline required date and one send action',async()=>{
 const html=await read('capture.html');
 assert.match(html,/if\(x\.target==='agenda'&&!x\.due\)/);
 assert.match(html,/dueInput=element\('input'\)/);
 assert.match(html,/dueInput\.type='date';dueInput\.required=true/);
 assert.match(html,/const selected=dueInput\?\{\.\.\.x,due:date\}:x/);
 assert.match(html,/if\(x\.target==='agenda'&&\(!\/\^\\d\{4\}-\\d\{2\}-\\d\{2\}\$\/\.test\(date\|\|''\)\)\)/);
 assert.match(html,/dueInput\.reportValidity\(\)/);
 assert.match(html,/if\(destination\(selected\)\)/);
 assert.match(html,/status:'sent'/);
 assert.match(html,/\.capture-send-date input:focus-visible/);
});

test('V163: existing capture IDs, limits, deduplication and external separation preserved',async()=>{
 const [html,sw,tour]=await Promise.all(['capture.html','sw.js','tournee-complete.html'].map(read));
 for(const id of ['form','title','notes','target','due','captureMore','list','filter'])
  assert.ok(html.includes('id="'+id+'"'),id);
 assert.match(html,/KEY='big-cthu-v2-inbox-v1'/);
 assert.match(html,/const found=a\.some\(v=>v&&v\.captureId===x\.id\)/);
 assert.match(html,/if\(x\.target==='agenda'&&!x\.due\)return false/);
 assert.match(html,/x\.target==='task'\?500:1000/);
 assert.match(sw,/big-cthu-public-v2-v163/);
 assert.doesNotMatch(tour,/capture-send-date|V163/);
});

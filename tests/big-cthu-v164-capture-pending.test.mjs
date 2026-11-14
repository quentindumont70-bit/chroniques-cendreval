import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const read=name=>readFile(new URL('../big-cthu-beta/'+name,import.meta.url),'utf8');

test('V164: À traiter selects every pending destination, regardless of category',async()=>{
 const html=await read('capture.html');
 assert.match(html,/<option value="inbox" selected>À traiter<\/option>/);
 assert.match(html,/<option value="all">Toutes les captures \(avec archives\)<\/option>/);
 assert.match(html,/const selected=items\.filter\(i=>filter==='inbox'\?i\.status==='new':filter==='all'\|\|i\.target===filter\)/);
 const sample=[
  {status:'new',target:'maison'},{status:'new',target:'agenda'},{status:'new',target:'inbox'},
  {status:'sent',target:'agenda'},{status:'done',target:'inbox'}
 ];
 const pending=sample.filter(i=>'inbox'==='inbox'?i.status==='new':false);
 assert.equal(pending.length,3);
 assert.deepEqual(pending.map(x=>x.target),['maison','agenda','inbox']);
});
test('V164: archive remains retrievable and no data source is migrated',async()=>{
 const [html,sw,tour]=await Promise.all(['capture.html','sw.js','tournee-complete.html'].map(read));
 assert.match(html,/KEY='big-cthu-v2-inbox-v1'/);
 assert.match(html,/filter==='all'\|\|i\.target===filter/);
 assert.match(html,/if\(x\.status!=='done'\)/);
 assert.match(sw,/big-cthu-public-v2-v164/);
 assert.doesNotMatch(tour,/v164|pending Capture/i);
});

import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const read=x=>readFile(new URL('../big-cthu-beta/'+x,import.meta.url),'utf8');

test('V178: Maison sorting shows ongoing jobs before planned ones, then finished archives',async()=>{
 const [home,pulse]=await Promise.all(['maison.html','active-pulse.js'].map(read));
 assert.match(home,/filtered\.sort\(\(a,b\)=>\(\{doing:0,todo:1,done:2\}\[a\.status\]/);
 assert.match(pulse,/kind:'Maison',url:'\.\/maison\.html#jobs'/);
 assert.match(home,/id="jobs"/);
 const jobs=[
  {name:'Done',status:'done',priority:'haute'},
  {name:'Plan',status:'todo',priority:'haute'},
  {name:'Active low',status:'doing',priority:'basse'},
  {name:'Active high',status:'doing',priority:'haute'}
 ];
 jobs.sort((a,b)=>({doing:0,todo:1,done:2}[a.status]??2)-({doing:0,todo:1,done:2}[b.status]??2)||({haute:0,normale:1,basse:2}[a.priority]??1)-({haute:0,normale:1,basse:2}[b.priority]??1));
 assert.deepEqual(jobs.map(x=>x.name),['Active high','Active low','Plan','Done']);
});
test('V178: existing controls, backups and clinical isolation preserved',async()=>{
 const [home,sw,tour]=await Promise.all(['maison.html','sw.js','tournee-complete.html'].map(read));
 for(const id of ['form','filter','search','jobs','export','import','file','maisonPulse'])assert.ok(home.includes('id="'+id+'"'),id);
 assert.match(home,/big-cthu-v2-maison-v1/);
 assert.match(sw,/big-cthu-public-v2-v178/);
 assert.doesNotMatch(tour,/V178|maison-active-first/);
});

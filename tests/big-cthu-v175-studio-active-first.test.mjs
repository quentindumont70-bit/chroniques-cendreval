import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const read=name=>readFile(new URL('../big-cthu-beta/'+name,import.meta.url),'utf8');

test('V175: Studio puts active work before planned ideas, with recent work first within each status',async()=>{
 const js=await read('musique-studio.js');
 assert.match(js,/\.sort\(\(a,b\)=>\(a\.status==='active'\?0:1\)-\(b\.status==='active'\?0:1\)\|\|b\.date\.localeCompare\(a\.date\)\)/);
 const sample=[
  {title:'Idée récente',status:'planned',date:'2026-11-14'},
  {title:'Mix actif ancien',status:'active',date:'2026-11-10'},
  {title:'Mix actif récent',status:'active',date:'2026-11-13'},
  {title:'Idée ancienne',status:'planned',date:'2026-11-05'}
 ];
 const ordered=sample.sort((a,b)=>(a.status==='active'?0:1)-(b.status==='active'?0:1)||b.date.localeCompare(a.date));
 assert.deepEqual(ordered.map(x=>x.title),['Mix actif récent','Mix actif ancien','Idée récente','Idée ancienne']);
 assert.match(js,/active\+' en cours · '\+\(current\.length-active\)\+' à démarrer'/);
});
test('V175: original Studio project IDs, inline edit, and patient boundary remain unchanged',async()=>{
 const [js,sw,tour]=await Promise.all(['musique-studio.js','sw.js','tournee-complete.html'].map(read));
 assert.match(js,/KEY='big-cthu-v2-passions-v1'/);
 assert.match(js,/const edit=element\('button','','Modifier la prochaine action'\)/);
 assert.match(js,/if\(persist\(next\)\)render\(\)/);
 assert.match(sw,/big-cthu-public-v2-v175/);
 assert.doesNotMatch(tour,/V175|studio-active-first/);
});

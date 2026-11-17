import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';
const read=name=>readFile(new URL('../big-cthu-beta/'+name,import.meta.url),'utf8');

test('V182: expired DDM older than two weeks stays in pantry but not the recurring alert',async()=>{
 const code=await read('nutrition-hub.js');
 const today=(()=>{const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-')})();
 const day=delta=>{const d=new Date(today+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+delta);return d.toISOString().slice(0,10)};
 const pantry=[
  {id:'stale',name:'Ancienne DDM',kind:'DDM',date:day(-28)},
  {id:'recent',name:'DDM récente',kind:'DDM',date:day(-7)},
  {id:'urgent',name:'DLC dépassée',kind:'DLC',date:day(-30)},
  {id:'future',name:'DDM prochaine',kind:'DDM',date:day(4)}
 ];
 const store=new Map([['big-cthu-v2-pantry-v1',JSON.stringify(pantry)]]);
 let writes=0;
 const ctx={localStorage:{getItem:key=>store.get(key)??null,setItem(){writes++}},document:{readyState:'loading',addEventListener(){}},window:{addEventListener(){}},Date,JSON,Object};
 runInNewContext(code.replace('})();','globalThis.testSnapshot=snapshot;})();'),ctx,{timeout:1200});
 const data=ctx.testSnapshot(today);
 assert.equal(data.stock,4);
 assert.deepEqual(Array.from(data.attention,x=>x.name),['DLC dépassée','DDM récente','DDM prochaine']);
 assert.equal(data.warnings,0);
 assert.equal(writes,0);
 assert.equal(JSON.parse(store.get('big-cthu-v2-pantry-v1')).length,4);
});

test('V182: user can find all DDM in pantry; no clinical code change',async()=>{
 const [html,js,pulse,sw,tour]=await Promise.all(['nutrition.html','nutrition-hub.js','active-pulse.js','sw.js','tournee-complete.html'].map(read));
 assert.match(html,/DDM dépassées depuis plus de 14 jours restent consultables/);
 assert.match(html,/href="\.\/garde-manger\.html"/);
 assert.match(js,/oldDDM\.setUTCDate\(oldDDM\.getUTCDate\(\)-14\)/);
 assert.match(pulse,/pastDDM\.setDate\(pastDDM\.getDate\(\)-14\)/);
 assert.doesNotMatch(js,/localStorage\.setItem|fetch\(|indexedDB/);
 assert.match(sw,/big-cthu-public-v2-v182/);
 assert.doesNotMatch(tour,/V182|oldestDDM/);
});

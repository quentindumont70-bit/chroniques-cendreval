import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';
const read=name=>readFile(new URL('../big-cthu-beta/'+name,import.meta.url),'utf8');

test('V173: Nutrition prioritizes DLC and distinguishes safety dates from quality dates',async()=>{
 const code=await read('nutrition-hub.js');
 const store=new Map();
 const today=(()=>{const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-')})();
 const day=delta=>{const d=new Date(today+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+delta);return d.toISOString().slice(0,10)};
 store.set('big-cthu-v2-pantry-v1',JSON.stringify([
  {name:'Conserve fictive',kind:'DDM',date:day(-8)},
  {name:'Lait fictif',kind:'DLC',date:day(1)},
  {name:'Pâtes fictives',kind:'DDM',date:day(5)}
 ]));
 const ctx={localStorage:{getItem:key=>store.get(key)??null},document:{readyState:'loading',addEventListener(){}},window:{addEventListener(){}},Date,JSON,Object};
 runInNewContext(code.replace('})();','globalThis.testSnapshot=snapshot;})();'),ctx,{timeout:1200});
 const s=ctx.testSnapshot(today);
 assert.deepEqual(Array.from(s.attention,x=>x.name),['Lait fictif','Conserve fictive','Pâtes fictives']);
 assert.match(code,/durabilité minimale dépassée, qualité à vérifier/);
 assert.match(code,/limite de consommation dépassée/);
 assert.equal(s.warnings,0);
});

test('V173: keep all pantry data and food guidance, no clinic writes',async()=>{
 const [js,pulse,html,sw,tour]=await Promise.all(['nutrition-hub.js','active-pulse.js','nutrition.html','sw.js','tournee-complete.html'].map(read));
 assert.match(pulse,/DDM dépassée, qualité à vérifier/);
 assert.match(js,/['"]big-cthu-v2-pantry-v1['"]/);
 assert.doesNotMatch(js,/localStorage\.setItem|fetch\(|indexedDB/);
 assert.match(html,/Pour une DLC dépassée, ne consomme pas le produit/);
 assert.match(sw,/big-cthu-public-v2-v173/);
 assert.doesNotMatch(tour,/durabilité minimale dépassée|V173/);
});

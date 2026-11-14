import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';
const read=name=>readFile(new URL('../big-cthu-beta/'+name,import.meta.url),'utf8');

test('V174: nutrition dates are real calendar days, not normalized February 31',async()=>{
 const code=await read('nutrition-hub.js');
 const ctx={document:{readyState:'loading',addEventListener(){}},window:{addEventListener(){}},localStorage:{getItem(){return null}},Date,JSON,Object};
 runInNewContext(code.replace('})();','globalThis.testDateOK=dateOK;})();'),ctx,{timeout:1200});
 for(const valid of ['2024-02-29','2026-12-31','2026-11-14'])assert.equal(ctx.testDateOK(valid),true,valid);
 for(const invalid of ['2026-02-29','2026-02-31','2026-04-31','2026-13-01','foo'])assert.equal(ctx.testDateOK(invalid),false,invalid);
 const s=ctx.testDateOK('2026-02-31');
 assert.equal(s,false);
});
test('V174: source storage, warnings, cache and clinical boundary unchanged',async()=>{
 const [nutrition,pulse,sw,tour]=await Promise.all(['nutrition-hub.js','active-pulse.js','sw.js','tournee-complete.html'].map(read));
 assert.match(pulse,/function validDate\(day\)/);
 assert.match(nutrition,/function dateOK\(day\)/);
 assert.match(nutrition,/durabilité minimale dépassée, qualité à vérifier/);
 assert.doesNotMatch(nutrition,/localStorage\.setItem|fetch\(|indexedDB/);
 assert.match(sw,/big-cthu-public-v2-v174/);
 assert.doesNotMatch(tour,/V174|testDateOK/);
});

import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';
const source=await readFile(new URL('../big-cthu-beta/voyages-core.js',import.meta.url),'utf8');
const sandbox={module:{exports:{}}};
runInNewContext(source,sandbox,{filename:'voyages-core.js'});
const C=sandbox.module.exports;
test('Voyages: répartit les centimes sans créer ni perdre un centime',()=>{
 const shares=C.splitEqual(100,['Alice','Bob','Chloé']);
 assert.deepEqual(Object.values(shares),[34,33,33]);
 assert.equal(Object.values(shares).reduce((a,b)=>a+b,0),100);
 assert.equal(C.cents('12,50'),1250);
 assert.throws(()=>C.cents('12.555'));
});
test('Voyages: soldes équilibrés et règlements proposés',()=>{
 const trip={people:['Alice','Bob','Chloé'],expenses:[
   {cents:1000,payer:'Alice',shares:C.splitEqual(1000,['Alice','Bob','Chloé'])},
   {cents:600,payer:'Bob',shares:C.splitEqual(600,['Alice','Bob'])},
 ]};
 const balances=C.balances(trip);
 assert.equal(Object.values(balances).reduce((a,b)=>a+b,0),0);
 const flows=C.transfers(balances);
 const expected=Object.fromEntries(Object.entries(balances));
 for(const t of flows){expected[t.from]+=t.cents;expected[t.to]-=t.cents}
 assert.deepEqual(Object.values(expected),[0,0,0]);
});
test('Voyages: refuse répartitions incohérentes',()=>{
 assert.throws(()=>C.balances({people:['A','B'],expenses:[{cents:120,payer:'A',shares:{A:60,B:50}}]}));
 assert.throws(()=>C.balances({people:['A','B'],expenses:[{cents:120,payer:'C',shares:{A:60,B:60}}]}));
 assert.throws(()=>C.splitEqual(100,['A','A']));
});
test('Voyages: ne transforme pas les voyages lointains en fausses prévisions',()=>{
 const distant=C.windowForTrip('2027-07-01','2027-07-10','2026-11-13');
 assert.equal(distant.available,false);
 const near=C.windowForTrip('2026-11-14','2026-11-17','2026-11-13');
 assert.equal(near.available,true);assert.equal(near.complete,true);
 const partial=C.windowForTrip('2026-11-24','2026-12-02','2026-11-13');
 assert.equal(partial.available,true);assert.equal(partial.complete,false);assert.equal(partial.to,'2026-11-28');
});
test('Voyages: suggestions de valise dédupliquées et influencées par la météo réelle',()=>{
 const list=C.packing('randonnee',[{rain:80,min:2,max:17}]);
 assert.ok(list.includes('Chaussures de marche'));
 assert.ok(list.includes('Imperméable ou parapluie'));
 assert.ok(list.includes('Veste chaude'));
 assert.equal(new Set(list).size,list.length);
});
test('Voyages: tous les fichiers déclarés dans le cache public existent et sont référencés',async()=>{
 const [index,sw,page]=await Promise.all(['index.html','sw.js','voyages.html'].map(p=>readFile(new URL('../big-cthu-beta/'+p,import.meta.url),'utf8')));
 assert.match(index,/voyages\.html/);
 assert.match(sw,/voyages\.html/);
 assert.match(sw,/voyages-core\.js/);
 assert.match(page,/voyages-core\.js/);
 assert.match(page,/geocoding-api\.open-meteo\.com/);
 assert.match(page,/forecast_days:'16'/);
});

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

test('Voyages: parts en euros exactes et refus des erreurs de saisie',()=>{
 assert.deepEqual({...C.splitAmounts(1550,{Alice:'10,00',Bob:'5.50'})},{Alice:1000,Bob:550});
 assert.throws(()=>C.splitAmounts(1550,{Alice:'10',Bob:'5.49'}),/égal/);
 assert.throws(()=>C.splitAmounts(1550,{Alice:'10.999',Bob:'4.501'}));
 assert.throws(()=>C.splitAmounts(1550,{Alice:'10',Bob:'-5'}));
});
test('Voyages: pourcentages précis avec centimes arrondis sans perte',()=>{
 assert.deepEqual({...C.splitPercentages(100,{Alice:'33.33',Bob:'33.33',Chloe:'33.34'})},{Alice:33,Bob:33,Chloe:34});
 assert.deepEqual({...C.splitPercentages(1,{Alice:'50',Bob:'50'})},{Alice:1,Bob:0});
 assert.throws(()=>C.splitPercentages(100,{Alice:'49.99',Bob:'50'}),/100 %/);
 assert.throws(()=>C.splitPercentages(100,{Alice:'50',Bob:'55'}),/100 %/);
});
test('Voyages: remboursements partiels ne modifient pas les dépenses du séjour',()=>{
 const trip={people:['Alice','Bob'],expenses:[{cents:3000,payer:'Alice',shares:{Alice:1500,Bob:1500}}],reimbursements:[{id:'r1',from:'Bob',to:'Alice',cents:600}]};
 assert.deepEqual({...C.balances(trip)},{Alice:900,Bob:-900});
 assert.deepEqual(JSON.parse(JSON.stringify(C.transfers(C.balances(trip)))),[{from:'Bob',to:'Alice',cents:900}]);
 assert.equal(trip.expenses.length,1);
 assert.equal(C.balances({...trip,reimbursements:[]}).Alice,1500);
 assert.throws(()=>C.balances({...trip,reimbursements:[{from:'Chloe',to:'Alice',cents:600}]}),/Remboursement/);
});
test('Voyages: nouvelle interface étapes et paiements reste liée au coffre',async()=>{
 const root=new URL('../big-cthu-beta/',import.meta.url);
 const [page,backup,sw]=await Promise.all(['voyages.html','sauvegardes.html','sw.js'].map(f=>readFile(new URL(f,root),'utf8')));
 for(const id of ['splitMode','beneficiaries','reimbursements','stepForm','steps']){
   assert.match(page,new RegExp('id="'+id+'"'));
 }
 assert.match(backup,/Schéma V25/);
 assert.match(backup,/if\(t\.steps!==undefined/);
 assert.match(backup,/if\(t\.reimbursements!==undefined/);
 assert.match(sw,/voyages-core\.js/);
});

test('Voyages: plusieurs activités alimentent une valise commune sans doublons',()=>{
 const result=C.packing(['ville','montagne','ville','plage'],[{min:3,max:17,rain:60}],3);
 assert.ok(result.includes('Chaussures de ville confortables'));
 assert.ok(result.includes('Couches chaudes'));
 assert.ok(result.includes('Maillot de bain'));
 assert.ok(result.includes('Imperméable ou parapluie'));
 assert.ok(result.some(x=>x.includes('3 changes')));
 assert.equal(new Set(result).size,result.length);
});
test('Voyages: les séjours longs suggèrent la lessive sans inventer la météo',()=>{
 const result=C.packing(['randonnee'],[],12);
 assert.ok(result.some(x=>x.includes('lessive')));
 assert.equal(result.includes('Veste chaude'),false);
 assert.equal(result.includes('Imperméable ou parapluie'),false); // La randonnée elle-même contient un vêtement de pluie générique, pas ce libellé météo
});
test('Voyages: valises personnalisées et migration Coffre présentes dans la bêta',async()=>{
 const root=new URL('../big-cthu-beta/',import.meta.url);
 const [page,backup,sw]=await Promise.all(['voyages.html','sauvegardes.html','sw.js'].map(f=>readFile(new URL(f,root),'utf8')));
 assert.match(page,/id="packOwner"/);
 assert.match(page,/id="packActivities"/);
 assert.match(page,/packedByPerson/);
 assert.match(backup,/t\.packedByPerson!==undefined/);
 assert.match(backup,/t\.activities!==undefined/);
 assert.match(backup,/Schéma V25/);
 assert.match(sw,/const CACHE='big-cthu-public-v2-v\d+'/);
});

test('Voyages: export CSV traite les montants, remboursements et soldes',()=>{
 const trip={people:['Alice','Bob'],expenses:[{id:'e1',date:'2026-11-13',title:'Train',payer:'Alice',cents:1000,shares:{Alice:500,Bob:500}}],reimbursements:[{id:'r1',date:'2026-11-14',from:'Bob',to:'Alice',cents:200}]};
 const csv=C.exportTripCsv(trip);
 assert.match(csv,/"dépense";"2026-11-13";"Train";"Alice"/);
 assert.match(csv,/"remboursement";"2026-11-14";"Remboursement";"Bob";"Alice";"2.00"/);
 assert.match(csv,/"solde";"";"Après remboursements";"Alice";"net à recevoir/);
 assert.match(csv,/"3.00"/);
 assert.match(csv,/"-3.00"/); // Les débits restent numériques et exploitables dans le tableur
 assert.doesNotMatch(csv,/"'-3.00"/);
});
test('Voyages: export CSV échappe les champs et neutralise les formules dangereuses',()=>{
 const trip={people:['Alice','Bob'],expenses:[{date:'',title:'=HYPERLINK("danger")',payer:'Alice',cents:100,shares:{Alice:50,Bob:50}}],reimbursements:[]};
 const csv=C.exportTripCsv(trip);
 assert.ok(csv.includes("\"'=HYPERLINK(\"\"danger\"\")\""));
 assert.match(csv,/\r\n/);
});
test('Voyages: la page conserve les dates facultatives et un export CSV local',async()=>{
 const root=new URL('../big-cthu-beta/',import.meta.url);
 const [page,backup]=await Promise.all(['voyages.html','sauvegardes.html'].map(f=>readFile(new URL(f,root),'utf8')));
 assert.match(page,/id="expenseDate"/);
 assert.match(page,/id="exportTrip"/);
 assert.match(page,/String\.fromCharCode\(0xFEFF\)/);
 assert.match(backup,/Schéma V25/);
 assert.match(backup,/p\.date===undefined\|\|travelDate\(p\.date\)/);
});

test('Voyages: budget propre au séjour et progression sans compter deux fois les remboursements',()=>{
 const trip={people:['Alice','Bob'],budgetCents:10000,expenses:[{id:'test',cents:12500,payer:'Alice',shares:{Alice:6250,Bob:6250}}],reimbursements:[{id:'rep',from:'Bob',to:'Alice',cents:2000}]};
 assert.deepEqual({...C.budgetProgress(trip)},{budget:10000,spent:12500,remaining:-2500,percent:125});
 assert.deepEqual({...C.budgetProgress({...trip,budgetCents:0})},{budget:0,spent:12500,remaining:-12500,percent:null});
 assert.deepEqual({...C.budgetProgress({...trip,expenses:[]})},{budget:10000,spent:0,remaining:10000,percent:0});
 assert.throws(()=>C.budgetProgress({...trip,budgetCents:-1}),/Budget/);
});
test('Voyages: formulaire du budget et Coffre V24 compatibles avec les anciens séjours',async()=>{
 const base=new URL('../big-cthu-beta/',import.meta.url);
 const [page,backup]=await Promise.all(['voyages.html','sauvegardes.html'].map(x=>readFile(new URL(x,base),'utf8')));
 assert.match(page,/id="tripBudgetForm"/);
 assert.match(page,/id="tripBudgetStatus"/);
 assert.match(page,/budgetCents:0/);
 assert.match(backup,/Schéma V25/);
 assert.match(backup,/t\.budgetCents!==undefined/);
 assert.match(backup,/20,21,22,23,24/);
});

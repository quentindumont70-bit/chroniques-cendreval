import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';

const read=name=>readFile(new URL('../big-cthu-beta/'+name,import.meta.url),'utf8');
const keys={
 work:'big-cthu-v2-maison-v1',
 maintenance:'big-cthu-v2-maintenance-v1',
 equipment:'big-cthu-v2-equipments-v1'
};
async function fixture(seeded={}){
 const code=await read('maison-pulse.js');
 const store=new Map(Object.entries(seeded));
 let writes=0,network=0;
 const nodes=new Map();
 const newNode=()=>({children:[],textContent:'',className:'',href:'',classList:{add(){}},append(...items){this.children.push(...items)},replaceChildren(...items){this.children=items}});
 for(const id of ['maisonPulseList','maisonPulseCount','maisonPulseStatus'])nodes.set(id,newNode());
 const document={readyState:'loading',getElementById:id=>nodes.get(id),createElement:newNode,addEventListener(){}};
 const ctx={document,Date,String,JSON,Array,Number,Set,localStorage:{
  getItem:k=>store.get(k)??null,
  setItem(){writes++}
 },window:{addEventListener(){}},fetch(){network++}};
 assert.ok(code.endsWith('})();'),'real script closure intact');
 runInNewContext(code.slice(0,code.lastIndexOf('})();'))+'this.testAccess={collect,render};})();',ctx,{timeout:1200});
 return {ctx,store,nodes,writes:()=>writes,network:()=>network,read:day=>JSON.parse(JSON.stringify(ctx.testAccess.collect(day)))};
}

test('V128: chantiers, entretiens et équipements sont regroupés sans recréer une base',async()=>{
 const f=await fixture({
  [keys.work]:JSON.stringify([{id:'w1',name:'Sous-sol de démonstration',due:'2026-11-15',status:'doing'},{id:'w2',name:'Terminé',due:'2026-11-16',status:'done'}]),
  [keys.maintenance]:JSON.stringify([{id:'m1',title:'Contrôle fictif',next:'2026-11-13'}]),
  [keys.equipment]:JSON.stringify([{id:'e1',name:'Filtre fictif',maintenance:'2026-11-28'}])
 });
 const result=f.read('2026-11-14');
 assert.equal(result.total,3);
 assert.deepEqual(result.entries.map(x=>x.name),['Contrôle fictif','Sous-sol de démonstration','Filtre fictif']);
 assert.equal(result.entries[0].late,true);
 assert.equal(result.entries[2].url,'./equipements.html');
 assert.equal(f.writes(),0);
 assert.equal(f.network(),0);
});

test('V128: échéances hors 30 jours, terminées et dates invalides écartées',async()=>{
 const f=await fixture({
  [keys.work]:JSON.stringify([{name:'Demain',due:'2026-11-15',status:'todo'},{name:'Plus tard',due:'2027-03-01',status:'doing'},{name:'Invalide',due:'invalide',status:'todo'}]),
  [keys.maintenance]:JSON.stringify([{title:'Dans 30 jours',next:'2026-12-14'},{title:'Dans 31 jours',next:'2026-12-15'}])
 });
 const items=f.read('2026-11-14').entries;
 assert.deepEqual(items.map(x=>x.name),['Demain','Dans 30 jours']);
});

test('V128: données illisibles laissées intactes, module toujours consultable',async()=>{
 const broken='{illisible',f=await fixture({[keys.work]:broken,[keys.maintenance]:'[]'});
 const result=f.read('2026-11-14');
 assert.equal(result.warnings,1);
 assert.equal(result.entries.length,0);
 f.ctx.testAccess.render();
 assert.equal(f.store.get(keys.work),broken);
 assert.match(f.nodes.get('maisonPulseStatus').textContent,/illisibles/);
 assert.equal(f.writes(),0);
});

test('V128: liens vers les vrais modules et aucun texte HTML injecté depuis des noms',async()=>{
 const f=await fixture({[keys.work]:JSON.stringify([{name:'<script>alert(1)</script>',due:'2026-11-14',status:'todo'}])});
 f.ctx.testAccess.render();
 const item=f.nodes.get('maisonPulseList').children[0];
 assert.equal(item.href,'./maison.html');
 assert.equal(item.children[0].textContent,'<script>alert(1)</script>');
 assert.equal(f.writes(),0);
});

test('V128: intégré sur Maison avec style mobile et cache public, Tournée inchangée',async()=>{
 const [home,js,sw,tournee]=await Promise.all(['maison.html','maison-pulse.js','sw.js','tournee-complete.html'].map(read));
 assert.match(home,/id="maisonPulse"/);
 assert.match(home,/id="maisonPulseList"/);
 assert.match(home,/src="\.\/maison-pulse\.js"/);
 assert.match(home,/data-cthu-theme-tentacle="yes"/);
 assert.match(sw,/'\.\/maison-pulse\.js'/);
 assert.doesNotMatch(js,/fetch\(|XMLHttpRequest|WebSocket|localStorage\.setItem/);
 assert.doesNotMatch(tournee,/maison-pulse\.js/);
});

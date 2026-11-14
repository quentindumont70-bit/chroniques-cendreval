import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';

const read=name=>readFile(new URL('../big-cthu-beta/'+name,import.meta.url),'utf8');
const K={pantry:'big-cthu-v2-pantry-v1',recipes:'big-cthu-v2-recipes-v1',meals:'big-cthu-v2-meals-v1'};
async function fixture(seed={}){
 const code=await read('nutrition-hub.js');
 const store=new Map(Object.entries(seed));
 let writes=0,network=0;
 function node(){
  return {textContent:'',children:[],href:'',className:'',classList:{add(name){this.last=name}},
   append(...children){this.children.push(...children)},
   replaceChildren(...children){this.children=[...children]}};
 }
 const nodes=new Map(['nh-stock-count','nh-recipes-count','nh-meals-count','nh-attention-list','nh-status'].map(id=>[id,node()]));
 const document={readyState:'loading',getElementById:id=>nodes.get(id),createElement:node,addEventListener(){}};
 const ctx={document,window:{addEventListener(){}},localStorage:{
  getItem:key=>store.get(key)??null,
  setItem(){writes++}
 },Date,JSON,Object,Array,String,Number,Set,fetch(){network++}};
 assert.ok(code.endsWith('})();'));
 runInNewContext(code.slice(0,code.lastIndexOf('})();'))+'globalThis.testAccess={snapshot,render};})();',ctx,{timeout:1200});
 return {ctx,nodes,store,writes:()=>writes,network:()=>network,snapshot:day=>JSON.parse(JSON.stringify(ctx.testAccess.snapshot(day)))};
}

test('V129: un seul écran rassemble le garde-manger, les recettes et les repas prévus',async()=>{
 const f=await fixture({
  [K.pantry]:JSON.stringify([{name:'Œufs fictifs',kind:'DLC',date:'2026-11-16'},{name:'Riz fictif',kind:'DDM',date:'2026-12-31'}]),
  [K.recipes]:JSON.stringify([{title:'Recette fictive'}]),
  [K.meals]:JSON.stringify([{recipe:'Repas fictif',date:'2026-11-17',status:'Prévu'},{recipe:'Ancien repas',date:'2026-11-01',status:'Prévu'}])
 });
 const result=f.snapshot('2026-11-14');
 assert.equal(result.stock,2);
 assert.equal(result.recipes,1);
 assert.equal(result.meals,1);
 assert.deepEqual(result.attention.map(x=>x.name),['Œufs fictifs']);
 assert.equal(f.writes(),0);
});

test('V129: distingue les dates dépassées sans déduire la sécurité alimentaire',async()=>{
 const f=await fixture({[K.pantry]:JSON.stringify([{name:'Produit A',kind:'DLC',date:'2026-11-10'},{name:'Produit B',kind:'DDM',date:'2026-11-18'},{name:'Produit C',kind:'inconnue',date:'2026-11-19'}])});
 const x=f.snapshot('2026-11-14');
 assert.equal(x.attention.length,2);
 assert.equal(x.attention[0].name,'Produit A');
 const page=await read('nutrition.html');
 assert.match(page,/Pour une DLC dépassée, ne consomme pas le produit/);
 assert.match(page,/une DDM/i);
});

test('V129: une donnée locale corrompue reste intacte et ne bloque pas les autres modules',async()=>{
 const invalid='{broken';
 const f=await fixture({[K.recipes]:invalid,[K.pantry]:'[]',[K.meals]:'[]'});
 const x=f.snapshot('2026-11-14');
 assert.equal(x.warnings,1);
 f.ctx.testAccess.render();
 assert.equal(f.store.get(K.recipes),invalid);
 assert.match(f.nodes.get('nh-status').textContent,/illisibles/);
 assert.equal(f.writes(),0);
});

test('V129: rendu local sûr avec noms fictifs, sans HTML dynamique depuis les données',async()=>{
 const f=await fixture({[K.pantry]:JSON.stringify([{name:'<img src=x onerror=alert(1)>',kind:'DLC',date:'2026-11-01'}])});
 f.ctx.testAccess.render();
 const item=f.nodes.get('nh-attention-list').children[0];
 assert.equal(item.href,'./garde-manger.html');
 assert.equal(item.children[0].textContent,'<img src=x onerror=alert(1)>');
 assert.equal(f.network(),0);
});

test('V129: routes réelles, thème partagé, cache iPhone et Tournée isolée',async()=>{
 const [page,home,passions,sw,js,tournee]=await Promise.all(['nutrition.html','index.html','passions.html','sw.js','nutrition-hub.js','tournee-complete.html'].map(read));
 for(const link of ['garde-manger.html','recettes.html','repas.html','sauvegardes.html'])assert.ok(page.includes('href="./'+link+'"'));
 assert.match(page,/data-cthu-theme-tentacle="yes"/);
 assert.match(home,/location\.href='\.\/nutrition\.html'/);
 assert.match(passions,/href="\.\/nutrition\.html"/);
 assert.match(sw,/'\.\/nutrition\.html'/);
 assert.match(sw,/'\.\/nutrition-hub\.js'/);
 assert.doesNotMatch(js,/localStorage\.setItem|fetch\(|XMLHttpRequest|WebSocket|tidel_|Topaze/);
 assert.doesNotMatch(tournee,/nutrition-hub\.js/);
});

import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';

const read=name=>readFile(new URL('../big-cthu-beta/'+name,import.meta.url),'utf8');
test('V141: chaque échéance ouvre son module existant sans stockage supplémentaire',async()=>{
 const html=await read('index.html');
 const start=html.indexOf('function renderRadar()');
 const end=html.indexOf('function renderNetwork()',start);
 assert.ok(start>0&&end>start);
 const date=new Date();
 const iso=[date.getFullYear(),String(date.getMonth()+1).padStart(2,'0'),String(date.getDate()).padStart(2,'0')].join('-');
 const values={
  'big-cthu-v2-agenda-v1':[{title:'Rendez-vous fictif',date:iso}],
  'big-cthu-v2-maison-v1':[{name:'Travaux fictifs',due:iso,status:'todo'}],
  'big-cthu-v2-equipments-v1':[{name:'Équipement fictif',maintenance:iso}],
  'big-cthu-v2-maintenance-v1':[{title:'Entretien fictif',next:iso}]
 };
 let writes=0;
 const nodes=[];
 const el=tag=>({tag,href:'',textContent:'',className:'',children:[],append(...args){this.children.push(...args)}});
 runInNewContext(html.slice(start,end)+'renderRadar()',{
  Date,$:()=>({replaceChildren(){nodes.length=0},append(x){nodes.push(x)}}),
  document:{createElement:el},
  localStorage:{
   getItem:key=>JSON.stringify(values[key]||[]),
   setItem(){writes++}
  }
 },{timeout:1200});
 assert.equal(nodes.length,4);
 assert.ok(nodes.every(x=>x.tag==='a'));
 const targets=nodes.map(x=>x.href);
 assert.deepEqual(new Set(targets),new Set(['./agenda.html','./maison.html','./equipements.html','./entretiens.html']));
 assert.equal(writes,0);
});

test('V141: liens lisibles sur iPhone, destinations locales et Tournée isolée',async()=>{
 const [html,css,sw,tour]=await Promise.all(['index.html','cockpit-themes.css','sw.js','tournee-complete.html'].map(read));
 assert.match(html,/className='task cthu-radar-link'/);
 assert.match(css,/#radar \.cthu-radar-link/);
 assert.match(css,/min-height:48px/);
 assert.match(css,/#radar \.cthu-radar-link:focus-visible/);
 assert.match(sw,/big-cthu-public-v2-v141/);
 assert.doesNotMatch(tour,/cthu-radar-link/);
});

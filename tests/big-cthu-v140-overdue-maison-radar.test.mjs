import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';

const read=name=>readFile(new URL('../big-cthu-beta/'+name,import.meta.url),'utf8');
const iso=offset=>{const d=new Date();d.setHours(12,0,0,0);d.setDate(d.getDate()+offset);return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-')};

test('V140: radar inclut Maison en retard, exclut tâches finies et anciens rendez-vous',async()=>{
 const html=await read('index.html');
 const start=html.indexOf('function renderRadar()');
 const end=html.indexOf('function renderNetwork()',start);
 assert.ok(start>0&&end>start);
 const code=html.slice(start,end);
 const old=iso(-3),future=iso(2);
 const data={
  'big-cthu-v2-agenda-v1':[{title:'Rendez-vous ancien',date:old},{title:'Rendez-vous futur',date:future}],
  'big-cthu-v2-maison-v1':[{name:'Réparer volet',due:old,status:'todo'},{name:'Travail terminé',due:old,status:'done'}],
  'big-cthu-v2-equipments-v1':[{name:'Chaudière',maintenance:old}],
  'big-cthu-v2-maintenance-v1':[{title:'Contrôle détecteur',next:old}]
 };
 const root={children:[],replaceChildren(){this.children=[]},append(v){this.children.push(v)}};
 const node=tag=>({tag,textContent:'',className:'',children:[],append(...values){this.children.push(...values)}});
 let writes=0,requests=0;
 const context={
  document:{createElement:node},
  localStorage:{getItem:key=>JSON.stringify(data[key]||[]),setItem(){writes++}},
  fetch(){requests++},
  $:selector=>selector==='#radar'?root:null, Date
 };
 runInNewContext(code+'renderRadar()',context,{timeout:1000});
 const visible=root.children.flatMap(row=>row.children.map(child=>child.textContent)).join(' ');
 assert.match(visible,/Réparer volet/);
 assert.match(visible,/Chaudière/);
 assert.match(visible,/Contrôle détecteur/);
 assert.match(visible,/Rendez-vous futur/);
 assert.match(visible,/En retard depuis le/);
 assert.doesNotMatch(visible,/Rendez-vous ancien|Travail terminé/);
 assert.equal(writes,0);assert.equal(requests,0);
});

test('V140: aucune mutation de Tournée, dates Maison lisibles et état vide explicite',async()=>{
 const [html,sw,tour]=await Promise.all(['index.html','sw.js','tournee-complete.html'].map(read));
 assert.match(html,/Échéances Maison en retard et événements des sept prochains jours/);
 assert.match(html,/Aucune échéance Maison en retard ni événement prévu/);
 assert.match(html,/En retard depuis le/);
 assert.match(sw,/big-cthu-public-v2-v140/);
 assert.doesNotMatch(tour,/En retard depuis le/);
});

test('V140: au maximum huit lignes, sans masquer toutes les échéances futures derrière les retards',async()=>{
 const html=await read('index.html');
 const start=html.indexOf('function renderRadar()');
 const end=html.indexOf('function renderNetwork()',start);
 const old=Array.from({length:7},(_,i)=>({name:'Retard '+i,due:iso(-15+i),status:'todo'}));
 const events=Array.from({length:6},(_,i)=>({title:'Futur '+i,date:iso(i+1)}));
 const nodes=[];
 const root={replaceChildren(){nodes.length=0},append(x){nodes.push(x)}};
 const createElement=tag=>({tag,textContent:'',className:'',children:[],append(...items){this.children.push(...items)}});
 runInNewContext(html.slice(start,end)+'renderRadar()',{
  $:()=>root,document:{createElement},Date,
  localStorage:{getItem:key=>JSON.stringify(key==='big-cthu-v2-maison-v1'?old:key==='big-cthu-v2-agenda-v1'?events:[])}
 },{timeout:1000});
 const displayed=nodes.filter(n=>n.tag==='a').flatMap(n=>n.children.map(x=>x.textContent)).join(' ');
 assert.match(displayed,/Retard 6/);
 assert.match(displayed,/Futur 0/);
 assert.ok(nodes.filter(n=>n.tag==='a').length<=8);
 assert.match(nodes.at(-1).textContent,/autres échéances/);
});

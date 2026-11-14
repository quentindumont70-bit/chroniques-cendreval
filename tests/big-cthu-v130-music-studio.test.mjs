import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';

const read=name=>readFile(new URL('../big-cthu-beta/'+name,import.meta.url),'utf8');
const KEY='big-cthu-v2-passions-v1';
function fake({seed,failWrites=false,confirm=true}={}){
 const data=new Map(seed===undefined?[]:[[KEY,seed]]),nodes=new Map();
 const create=()=>({value:'',textContent:'',children:[],dataset:{},listeners:{},href:'',className:'',attrs:{},
  append(...items){this.children.push(...items)},
  replaceChildren(...items){this.children=[...items]},
  addEventListener(key,cb){this.listeners[key]=cb},
  setAttribute(key,value){this.attrs[key]=value},
  focus(){this.focused=true}});
 for(const id of ['studio-form','studio-title','studio-next','studio-list','studio-count','studio-status'])nodes.set(id,create());
 const document={readyState:'complete',getElementById:id=>nodes.get(id),createElement:create,addEventListener(){}};
 let writes=0;
 const localStorage={
  getItem:key=>data.get(key)??null,
  setItem(key,value){writes++;if(failWrites)throw Error('quota');data.set(key,value)}
 };
 return {data,nodes,document,localStorage,writes:()=>writes,confirm:()=>confirm,
  submit(){nodes.get('studio-form').listeners.submit({preventDefault(){}})},
  list:()=>nodes.get('studio-list').children,
  rows:()=>JSON.parse(data.get(KEY)||'[]')};
}
async function setup(opts){
 const env=fake(opts),js=await read('musique-studio.js');
 runInNewContext(js,{document:env.document,localStorage:env.localStorage,window:{addEventListener(){}},confirm:env.confirm,JSON,Math,Date,Set,Object},{timeout:1200});
 return env;
}
const legacy={id:'old-song',mode:'musique',title:'Mix original fictif',date:'2026-11-13',metric:'174 BPM',note:'Revoir le drop',status:'planned'};
const workout={id:'training',mode:'muscu',title:'Tractions fictives',date:'2026-11-13',metric:'5',note:'',status:'done'};

test('V130: retrouver une ancienne piste et conserver les entrées non musicales',async()=>{
 const env=await setup({seed:JSON.stringify([workout,legacy])});
 assert.equal(env.list().length,1);
 assert.equal(env.list()[0].children[0].textContent,'Mix original fictif');
 assert.equal(env.list()[0].children[2].textContent,'Revoir le drop');
 assert.equal(env.writes(),0);
 assert.equal(env.rows()[0].mode,'muscu');
});

test('V130: créer une piste et prochaine action sans saisir la date ni dupliquer une base',async()=>{
 const env=await setup({seed:JSON.stringify([workout])});
 env.nodes.get('studio-title').value='Brouillon DnB fictif';
 env.nodes.get('studio-next').value='Rééquilibrer les basses';
 env.submit();
 const rows=env.rows();
 assert.equal(rows.length,2);
 assert.deepEqual(rows[0],workout);
 assert.equal(rows[1].mode,'musique');
 assert.equal(rows[1].note,'Rééquilibrer les basses');
 assert.equal(rows[1].status,'active');
 assert.match(rows[1].date,/^\d{4}-\d{2}-\d{2}$/);
 assert.equal(env.nodes.get('studio-title').value,'');
});

test('V130: terminer un projet confirmé sans toucher aux autres passions',async()=>{
 const env=await setup({seed:JSON.stringify([legacy,workout])});
 const actions=env.list()[0].children.at(-1);
 actions.children[0].listeners.click();
 assert.equal(env.rows()[0].status,'done');
 assert.deepEqual(env.rows()[1],workout);
 assert.equal(env.list()[0].textContent,'Aucun projet en cours : une idée suffit pour commencer.');
});

test('V130: annulation de confirmation et stockage indisponible ne changent rien',async()=>{
 const seed=JSON.stringify([legacy]);
 const canceled=await setup({seed,confirm:false});
 canceled.list()[0].children.at(-1).children[0].listeners.click();
 assert.equal(canceled.data.get(KEY),seed);
 const full=await setup({seed,failWrites:true});
 full.nodes.get('studio-title').value='Autre projet';
 full.nodes.get('studio-next').value='Prochaine action';
 full.submit();
 assert.equal(full.data.get(KEY),seed);
 assert.match(full.nodes.get('studio-status').textContent,/Sauvegarde indisponible/);
});

test('V130: stockage corrompu protégé, aucune écriture destructrice',async()=>{
 const env=await setup({seed:'{corrompu'});
 env.nodes.get('studio-title').value='Nouvelle piste';
 env.nodes.get('studio-next').value='Action';
 env.submit();
 assert.equal(env.data.get(KEY),'{corrompu');
 assert.equal(env.writes(),0);
 assert.match(env.nodes.get('studio-status').textContent,/bloquée/);
});

test('V130: route, thèmes, sauvegarde et cache sur les vraies pages existantes',async()=>{
 const [page,home,passions,sw,backup,js,tour]=await Promise.all(['musique.html','index.html','passions.html','sw.js','sauvegardes.html','musique-studio.js','tournee-complete.html'].map(read));
 assert.match(page,/data-cthu-theme-tentacle="yes"/);
 assert.match(page,/id="studio-form"/);
 assert.doesNotMatch(page,/type="date"|datetime-local/);
 assert.match(home,/location.href='\.\/musique.html'/);
 assert.match(passions,/href="\.\/musique.html"/);
 assert.match(sw,/'\.\/musique.html'/);
 assert.match(sw,/'\.\/musique-studio.js'/);
 assert.match(backup,/big-cthu-v2-passions-v1/);
 assert.doesNotMatch(js,/fetch\(|XMLHttpRequest|WebSocket|tidel_|Topaze/);
 assert.doesNotMatch(tour,/musique-studio\.js/);
});

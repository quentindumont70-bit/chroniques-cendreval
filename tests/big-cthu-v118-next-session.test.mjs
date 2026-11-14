import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';

const base=new URL('../big-cthu-beta/',import.meta.url);
const read=name=>readFile(new URL(name,base),'utf8');
const KEY='big-cthu-v2-next-session-v1';

function fixture(source,{initial,full=false,confirm=true}={}){
 const memory=new Map(initial===undefined?[]:[[KEY,initial]]);
 const nodes=new Map();
 const make=tag=>({
  tagName:tag,className:'',value:'',textContent:'',dataset:{},attrs:{},children:[],listeners:{},
  append(...children){this.children.push(...children)},
  replaceChildren(...children){this.children=children},
  setAttribute(k,v){this.attrs[k]=v},
  addEventListener(k,cb){this.listeners[k]=cb},
  focus(){this.focused=true},
  fire(k){return this.listeners[k]?.({preventDefault(){},target:this})}
 });
 for(const id of ['ns-form','ns-game','ns-text','ns-list','ns-count','ns-status'])nodes.set(id,make('input'));
 nodes.get('ns-game').value='WoW';
 const document={
  readyState:'complete',
  getElementById:id=>nodes.get(id)||null,
  createElement:make,
  addEventListener(){}
 };
 const localStorage={
  getItem:key=>memory.has(key)?memory.get(key):null,
  setItem(key,val){if(full)throw Error('quota');memory.set(key,String(val))}
 };
 runInNewContext(source,{document,localStorage,window:{addEventListener(){}},confirm:()=>confirm,Date,Math,JSON,Set,Object},{timeout:1000});
 return {memory,nodes,form:nodes.get('ns-form'),setGame:value=>nodes.get('ns-game').value=value,setNote:value=>nodes.get('ns-text').value=value,rows:()=>JSON.parse(memory.get(KEY)||'[]')};
}

test('V118: la prochaine session ne demande ni date, ni calendrier gaming',async()=>{
 const [home,source]=await Promise.all([read('index.html'),read('next-session.js')]);
 assert.match(home,/id="nextSession"/);
 assert.match(home,/id="ns-form"/);
 assert.match(home,/À ma prochaine session/);
 const section=home.slice(home.indexOf('id="nextSession"'),home.indexOf('id="ns-list"'));
 assert.doesNotMatch(section,/type="date"|datetime-local|notification|rendez-vous/i);
 assert.match(home,/'Prochaine session','Reprendre sans rien planifier','gaming'/);
 assert.match(home,/if\(i\[3\]==='gaming'\)/);
 assert.doesNotMatch(source,/fetch\(|XMLHttpRequest|WebSocket|Topaze|tidel_/);
});

test('V118: rappel WoW conservé pour la prochaine ouverture',async()=>{
 const js=await read('next-session.js'),one=fixture(js);
 one.setGame('WoW');one.setNote('Récupérer la récompense de quête');
 one.form.fire('submit');
 assert.equal(one.rows().length,1);
 assert.equal(one.rows()[0].game,'WoW');
 assert.equal(one.rows()[0].text,'Récupérer la récompense de quête');
 assert.equal(one.rows()[0].done,false);
 const again=fixture(js,{initial:one.memory.get(KEY)});
 assert.equal(again.rows()[0].text,'Récupérer la récompense de quête');
 assert.equal(again.nodes.get('ns-list').children.length,1);
 assert.equal(again.nodes.get('ns-count').textContent,'1 à retrouver');
});

test('V118: cocher Fait, reprendre puis supprimer avec confirmation',async()=>{
 const f=fixture(await read('next-session.js'));
 f.setNote('Construire objet de quête fictif');f.form.fire('submit');
 let entry=f.nodes.get('ns-list').children[0];
 entry.children[1].children[0].fire('click');
 assert.equal(f.rows()[0].done,true);
 entry=f.nodes.get('ns-list').children[0];
 entry.children[1].children[0].fire('click');
 assert.equal(f.rows()[0].done,false);
 entry=f.nodes.get('ns-list').children[0];
 entry.children[1].children[1].fire('click');
 assert.equal(f.rows().length,0);
 const never=fixture(await read('next-session.js'),{initial:JSON.stringify([{id:'fiction-1',game:'WoW',text:'À reprendre',done:false}]),confirm:false});
 never.nodes.get('ns-list').children[0].children[1].children[1].fire('click');
 assert.equal(never.rows().length,1);
});

test('V118: quota plein ou données illisibles n entraînent aucune perte de données',async()=>{
 const js=await read('next-session.js');
 const full=fixture(js,{full:true});
 full.setNote('Note de démonstration');full.form.fire('submit');
 assert.equal(full.rows().length,0);
 assert.match(full.nodes.get('ns-status').textContent,/Impossible d’enregistrer/);
 const corrupted=fixture(js,{initial:'{corrompu'});
 corrupted.setNote('Ne pas effacer');corrupted.form.fire('submit');
 assert.equal(corrupted.memory.get(KEY),'{corrompu');
 assert.match(corrupted.nodes.get('ns-status').textContent,/Aucune note n’a été remplacée/);
});

test('V118: rappel inclus dans la sauvegarde globale sans calendrier ou données sensibles',async()=>{
 const [backup,sw,home,js]=await Promise.all(['sauvegardes.html','sw.js','index.html','next-session.js'].map(read));
 assert.match(backup,/key:'big-cthu-v2-next-session-v1',field:'nextSession',max:100/);
 assert.match(sw,/'\.\/next-session\.js'/);
 assert.match(home,/src="\.\/next-session\.js"/);
 assert.doesNotMatch(js,/tidel_|Topaze|patient|fetch\(|XMLHttpRequest/);
});

import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';

const read=()=>readFile(new URL('../big-cthu-beta/index.html',import.meta.url),'utf8');

async function fixture(){
 const html=await read();
 const first=html.indexOf('const items=[');
 const last=html.indexOf('const $=s=>document.querySelector(s);',first);
 const start=html.indexOf('function renderProfile(){',last);
 const end=html.indexOf('function renderTasks(){',start);
 assert.ok(first>0&&last>first&&start>last&&end>start);
 const nodes=new Map();
 function node(tag='div'){
  return {tag,textContent:'',value:'',attrs:{},children:[],className:'',dataset:{},
   append(...items){this.children.push(...items)},
   replaceChildren(...items){this.children=[...items]},
   setAttribute(key,value){this.attrs[key]=value},
   addEventListener(){},
  };
 }
 for(const id of ['#profileWarning','#profile','#welcome','#tentacleSearch','#tiles','#tentacleCount','#cthuCatalogToggle'])nodes.set(id,node());
 const document={body:{dataset:{}},querySelector:id=>nodes.get(id),createElement:node,getElementById:()=>null};
 const context={document,location:{href:''},Set,Object,Array,profile:'bobinch',$:id=>nodes.get(id)};
 runInNewContext(html.slice(first,last)+html.slice(start,end)+'\nthis.show=renderProfile;this.toggleCatalog=()=>{catalogExpanded=!catalogExpanded};this.setProfile=p=>{profile=p};',context,{timeout:1500});
 return {context,nodes,html,show:()=>context.show(),search:value=>{nodes.get('#tentacleSearch').value=value;context.show()},toggle:()=>{context.toggleCatalog();context.show()},setProfile:p=>{context.setProfile(p);context.show()}};
}

test('V127: vue Bobinch 6 modules utiles seulement, mais boutons existants conservés',async()=>{
 const f=await fixture();
 f.show();
 const titles=f.nodes.get('#tiles').children.map(x=>x.children[1].textContent);
 assert.deepEqual(titles,['Tournée','Maison','Prochaine session','Agenda','Capture','Budget']);
 assert.equal(f.nodes.get('#cthuCatalogToggle').attrs['aria-expanded'],'false');
 assert.match(f.nodes.get('#tentacleCount').textContent,/6 essentiels/);
});

test('V127: Tout afficher redonne accès aux 18 tentacules du profil, sans suppression',async()=>{
 const f=await fixture();f.show();f.toggle();
 const titles=f.nodes.get('#tiles').children.map(x=>x.children[1].textContent);
 assert.equal(titles.length,18);
 assert.ok(titles.includes('Sanctuaire RPG'));
 assert.ok(titles.includes('Cerveau Cthu'));
 assert.equal(f.nodes.get('#cthuCatalogToggle').attrs['aria-expanded'],'true');
 f.toggle();
 assert.equal(f.nodes.get('#tiles').children.length,6);
});

test('V127: la recherche trouve tous les modules même lorsque le catalogue est replié',async()=>{
 const f=await fixture();
 f.show();f.search('sanctuaire');
 assert.equal(f.nodes.get('#tiles').children.length,1);
 assert.equal(f.nodes.get('#tiles').children[0].children[1].textContent,'Sanctuaire RPG');
 f.search('');
 assert.equal(f.nodes.get('#tiles').children.length,6);
});

test('V127: Steph voit ses modules du quotidien sans Tournée et peut ouvrir son catalogue',async()=>{
 const f=await fixture();f.setProfile('steph');
 const names=f.nodes.get('#tiles').children.map(x=>x.children[1].textContent);
 assert.deepEqual(names,['Maison','Agenda','Capture','UGAP','Budget','Voyages']);
 f.toggle();
 assert.ok(f.nodes.get('#tiles').children.every(x=>x.children[1].textContent!=='Tournée'));
 assert.equal(f.nodes.get('#tiles').children.length,18);
});

test('V127: l affichage ne fait aucune requête réseau, ni écriture de données métier',async()=>{
 const html=await read();
 assert.match(html,/id="cthuCatalogToggle"[^>]*aria-expanded="false"/);
 assert.match(html,/const dailyCockpit=/);
 assert.match(html,/query\|\|catalogExpanded\|\|dailyCockpit\[profile\]/);
 const section=html.slice(html.indexOf('function renderProfile(){'),html.indexOf('function renderTasks(){'));
 assert.doesNotMatch(section,/localStorage\.setItem|fetch\(|XMLHttpRequest|indexedDB/);
 assert.match(html,/id="nextSession"/);
 assert.match(html,/href="\.\/tournee-complete\.html"/);
});

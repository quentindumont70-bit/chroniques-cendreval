import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';

const read=name=>readFile(new URL('../big-cthu-beta/'+name,import.meta.url),'utf8');
const K={pantry:'big-cthu-v2-pantry-v1',agenda:'big-cthu-v2-agenda-v1',captures:'big-cthu-v2-inbox-v1',tasks:'big-cthu-v2-demo-tasks',maison:'big-cthu-v2-maison-v1',musique:'big-cthu-v2-passions-v1',gaming:'big-cthu-v2-next-session-v1'};
async function fixture(seed={}){
 const code=await read('active-pulse.js');
 const stored=new Map(Object.entries(seed)),queried=[];
 let writes=0,network=0;
 const el=()=>({children:[],textContent:'',className:'',href:'',
  append(...items){this.children.push(...items)},
  replaceChildren(...items){this.children=[...items]}});
 const nodes=new Map(['activePulseList','activePulseCount','activePulseStatus','cinemaPulseCount'].map(key=>[key,el()]));
 const document={readyState:'loading',getElementById:key=>nodes.get(key),createElement:el,addEventListener(){}};
 const ctx={document,window:{addEventListener(){}},localStorage:{
  getItem(key){queried.push(key);return stored.get(key)??null},
  setItem(){writes++}
 },JSON,Array,Object,Set,Date,fetch(){network++}};
 assert.ok(code.endsWith('})();'));
 runInNewContext(code.slice(0,code.lastIndexOf('})();'))+'globalThis.testCollect=collect;globalThis.testRender=render;})();',ctx,{timeout:1200});
 return {ctx,nodes,queried,stored,writes:()=>writes,network:()=>network,collect:()=>JSON.parse(JSON.stringify(ctx.testCollect()))};
}

test('V131: retrouve les vraies priorités Maison, musique et prochaine session sans nouvelle base',async()=>{
 const f=await fixture({
  [K.tasks]:JSON.stringify([{id:'t',text:'Répondre à un devis fictif',done:false},{id:'done',text:'Déjà fini',done:true}]),
  [K.maison]:JSON.stringify([{id:'a',name:'Sous-sol fictif',status:'doing',notes:'Rappeler artisan'},{id:'b',name:'Peinture fictive',status:'done'}]),
  [K.musique]:JSON.stringify([{id:'s',mode:'musique',title:'Mix DnB fictif',note:'Régler les basses',date:'2026-11-14',status:'active'},{id:'x',mode:'muscu',title:'Donnée de sport',status:'active'}]),
  [K.gaming]:JSON.stringify([{id:'g',game:'WoW',text:'Faire la quête fictive',done:false}])
 });
 const d=f.collect();
 assert.deepEqual(d.items.map(x=>x.kind),['Priorités','Maison','Musique','Jeux']);
 assert.deepEqual(d.items.map(x=>x.url),['#priorities','./maison.html','./musique.html','#nextSession']);
 assert.equal(d.warnings,0);
 assert.equal(f.writes(),0);
 assert.equal(f.network(),0);
 assert.deepEqual(new Set(f.queried),new Set(Object.values(K)));
});

test('V131: ne remonte jamais les tâches terminées, les soins ou les entrées de sport',async()=>{
 const f=await fixture({
  [K.tasks]:JSON.stringify([{id:'1',text:'Terminé',done:true}]),
  [K.musique]:JSON.stringify([{mode:'muscu',title:'Sport',status:'active'},{mode:'musique',title:'Piste finie',status:'done'}])
 });
 assert.equal(f.collect().items.length,0);
 assert.equal(f.queried.some(x=>/tidel_|topaze|patient/i.test(x)),false);
});

test('V131: stockage illisible affiché sans effacer et sans fuite vers le réseau',async()=>{
 const raw='{broken';
 const f=await fixture({[K.maison]:raw,[K.gaming]:JSON.stringify([{game:'Elden Ring',text:'Boss fictif',done:false}])});
 const d=f.collect();
 assert.equal(d.warnings,1);
 assert.equal(d.items.length,1);
 f.ctx.testRender();
 assert.match(f.nodes.get('activePulseStatus').textContent,/illisibles/);
 assert.equal(f.stored.get(K.maison),raw);
 assert.equal(f.writes(),0);
});

test('V131: titres non injectés et seulement les vrais liens de navigation',async()=>{
 const f=await fixture({[K.tasks]:JSON.stringify([{text:'<img src=x onerror=alert(1)>',done:false}])});
 f.ctx.testRender();
 const card=f.nodes.get('activePulseList').children[0];
 assert.equal(card.href,'#priorities');
 assert.equal(card.children[1].textContent,'<img src=x onerror=alert(1)>');
});

test('V131: intégré au vrai cockpit, thèmes, mode hors ligne, Tournée isolée',async()=>{
 const [html,sw,code,tournee,styles]=await Promise.all(['index.html','sw.js','active-pulse.js','tournee-complete.html','cockpit-themes.css'].map(read));
 assert.match(html,/id="activePulse"/);
 assert.match(html,/id="activePulseList"/);
 assert.match(html,/src="\.\/active-pulse\.js"/);
 assert.match(html,/bigcthu:changes/);
 assert.match(styles,/\.active-pulse-list/);
 assert.match(sw,/'\.\/active-pulse\.js'/);
 assert.match(sw,/big-cthu-public-v2-v\d+/);
 assert.doesNotMatch(code,/fetch\(|XMLHttpRequest|WebSocket|localStorage\.setItem|tidel_|Topaze/);
 assert.doesNotMatch(tournee,/active-pulse\.js/);
});

test('V145: les captures à traiter apparaissent sans écriture ni copie',async()=>{
 const f=await fixture({
  [K.captures]:JSON.stringify([
   {id:'one',title:'Rappeler le plombier fictif',target:'inbox',status:'new'},
   {id:'two',title:'RDV personnel fictif',target:'agenda',status:'new'},
   {id:'three',title:'Déjà archivée',target:'inbox',status:'done'},
   {id:'four',title:'Déjà envoyée',target:'task',status:'sent'}
  ])
 });
 const items=f.collect().items;
 assert.equal(items.length,2);
 assert.deepEqual(items.map(x=>x.kind),['Captures','Captures']);
 assert.deepEqual(items.map(x=>x.url),['./capture.html','./capture.html']);
 assert.deepEqual(items.map(x=>x.next),['À traiter dans Capture','À envoyer vers Agenda']);
 assert.equal(f.writes(),0);
 assert.equal(f.network(),0);
 f.ctx.testRender();
 const link=f.nodes.get('activePulseList').children[0];
 assert.equal(link.href,'./capture.html');
 assert.equal(link.children[1].textContent,'Rappeler le plombier fictif');
});

test('V145: captures invalides ou archives non affichées, aucun contenu injecté',async()=>{
 const f=await fixture({
  [K.captures]:JSON.stringify([
   {id:'bad',title:'<img src=x onerror=alert(1)>',target:'inbox',status:'done'},
   {id:'ok',title:'<img src=x onerror=alert(1)>',target:'inbox',status:'new'},
   {id:'unknown',title:'A'.repeat(200),target:'inbox',status:'new'}
  ])
 });
 f.ctx.testRender();
 assert.equal(f.collect().items.length,1);
 const card=f.nodes.get('activePulseList').children[0];
 assert.equal(card.children[1].textContent,'<img src=x onerror=alert(1)>');
 assert.equal(f.writes(),0);
});

test('V147: alertes de stock DLC/DDM à échéance proche sans duplication de données',async()=>{
 const today=new Date();today.setHours(12,0,0,0);
 const iso=d=>[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
 const days=n=>{const d=new Date(today);d.setDate(d.getDate()+n);return iso(d)};
 const f=await fixture({
  [K.pantry]:JSON.stringify([
   {id:'a',name:'Yaourt fictif',kind:'DLC',date:days(-1)},
   {id:'b',name:'Conserve fictive',kind:'DDM',date:days(3)},
   {id:'c',name:'Riz fictif',kind:'DDM',date:days(25)},
   {id:'d',name:'Fruit fictif',kind:'inconnue',date:days(1)}
  ])
 });
 const d=f.collect();
 assert.equal(d.items.length,2);
 assert.deepEqual(d.items.map(x=>x.kind),['Stock','Stock']);
 assert.deepEqual(d.items.map(x=>x.url),['./garde-manger.html','./garde-manger.html']);
 assert.match(d.items[0].next,/DLC · Date dépassée/);
 assert.match(d.items[1].next,/DDM · Échéance/);
 assert.equal(f.writes(),0);
 assert.equal(f.network(),0);
 f.ctx.testRender();
 assert.equal(f.nodes.get('activePulseList').children[0].href,'./garde-manger.html');
});

test('V147: aucune alerte si dates éloignées, texte invalide ou stockage absent',async()=>{
 const f=await fixture({
  [K.pantry]:JSON.stringify([
   {name:'DLC loin',kind:'DLC',date:'2999-12-31'},
   {name:'Inconnu',kind:'inconnue',date:'2001-01-01'},
   {name:'X'.repeat(100),kind:'DLC',date:'2001-01-01'}
  ])
 });
 assert.equal(f.collect().items.length,0);
 assert.equal(f.writes(),0);
});

test('V151: la scène cinématographique affiche le nombre réel sans autre stockage',async()=>{
 const empty=await fixture();
 empty.ctx.testRender();
 assert.equal(empty.nodes.get('cinemaPulseCount').textContent,'Aucune action en attente');
 const active=await fixture({[K.tasks]:JSON.stringify([{id:'t',text:'Action fictive',done:false}])});
 active.ctx.testRender();
 assert.equal(active.nodes.get('cinemaPulseCount').textContent,'1 action à reprendre');
 assert.equal(active.writes(),0);
 assert.equal(active.network(),0);
 const html=await read('index.html');
 assert.match(html,/id="cinemaPulseCount" aria-live="polite"/);
 assert.match(html,/class="cinema-live-pulse" href="#activePulse"/);
 assert.match(html,/class="mini" href="\.\/musique\.html"/);
});

test('V169: le cockpit reprend deux vrais événements Agenda proches, et aucun événement ancien',async()=>{
 const iso=delta=>{const d=new Date();d.setDate(d.getDate()+delta);return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-')};
 const f=await fixture({[K.agenda]:JSON.stringify([
  {id:'later',title:'Échéance fictive',date:iso(3),time:'14:30',category:'perso'},
  {id:'today',title:'Rendez-vous fictif',date:iso(0),category:'perso'},
  {id:'past',title:'Date passée',date:iso(-1),category:'perso'},
  {id:'far',title:'Date lointaine',date:iso(20),category:'perso'},
  {id:'bad',title:'Titre invalide',date:'non-date',category:'perso'}
 ])});
 const data=f.collect();
 assert.deepEqual(data.items.map(x=>x.title),['Rendez-vous fictif','Échéance fictive']);
 assert.ok(data.items.every(x=>x.kind==='Agenda'&&x.url==='./agenda.html'));
 assert.match(data.items[1].next,/14:30/);
 assert.equal(f.writes(),0);
 assert.equal(f.network(),0);
});

test('V169: erreur Agenda signalée sans toucher aux autres modules',async()=>{
 const f=await fixture({[K.agenda]:'{cassé',[K.tasks]:JSON.stringify([{id:'t',text:'Priorité préservée',done:false}])});
 const d=f.collect();
 assert.equal(d.warnings,1);
 assert.deepEqual(d.items.map(x=>x.title),['Priorité préservée']);
 assert.equal(f.writes(),0);
});

test('V172: nombre total vrai même quand les cartes sont limitées par rubrique',async()=>{
 const f=await fixture({[K.tasks]:JSON.stringify([
  {id:'a',text:'A',done:false},{id:'b',text:'B',done:false},
  {id:'c',text:'C',done:false},{id:'d',text:'D',done:false}
 ])});
 assert.equal(f.collect().total,4);
 assert.equal(f.collect().items.length,2);
 f.ctx.testRender();
 assert.equal(f.nodes.get('cinemaPulseCount').textContent,'4 actions à reprendre');
 assert.equal(f.nodes.get('activePulseCount').textContent,'4 actions · 2 affichées');
 assert.equal(f.writes(),0);
 assert.equal(f.network(),0);
});

test('V172: aucune fausse sérénité si une source locale est illisible',async()=>{
 const f=await fixture({[K.agenda]:'{données illisibles'});
 f.ctx.testRender();
 assert.equal(f.collect().total,0);
 assert.equal(f.nodes.get('cinemaPulseCount').textContent,'Certaines actions indisponibles');
 assert.match(f.nodes.get('activePulseList').children[0].textContent,/impossible de garantir/);
 assert.match(f.nodes.get('activePulseStatus').textContent,/illisibles/);
 assert.equal(f.writes(),0);
});

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
 assert.deepEqual(d.items.map(x=>x.url),['#priority-t','./maison.html#job=a','./musique.html#studio=s','#session=g']);
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
 assert.deepEqual(items.map(x=>x.url),['./capture.html#capture=one','./capture.html#capture=two']);
 assert.deepEqual(items.map(x=>x.next),['À traiter dans Capture','À envoyer vers Agenda']);
 assert.equal(f.writes(),0);
 assert.equal(f.network(),0);
 f.ctx.testRender();
 const link=f.nodes.get('activePulseList').children[0];
 assert.equal(link.href,'./capture.html#capture=one');
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
 assert.deepEqual(d.items.map(x=>x.url),['./garde-manger.html#food=a','./garde-manger.html#food=b']);
 assert.match(d.items[0].next,/DLC · Date limite dépassée/);
 assert.match(d.items[1].next,/DDM · Échéance/);
 assert.equal(f.writes(),0);
 assert.equal(f.network(),0);
 f.ctx.testRender();
 assert.equal(f.nodes.get('activePulseList').children[0].href,'./garde-manger.html#food=a');
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
 assert.deepEqual(data.items.map(x=>x.url),['./agenda.html#event=today','./agenda.html#event=later']);
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

test('V173: une DLC proche est plus importante qu’une ancienne DDM, sans double base',async()=>{
 const iso=delta=>{const d=new Date();d.setDate(d.getDate()+delta);return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-')};
 const f=await fixture({[K.pantry]:JSON.stringify([
  {id:'ddm',name:'Pâtes fictives',kind:'DDM',date:iso(-6)},
  {id:'dlc',name:'Yaourt fictif',kind:'DLC',date:iso(1)}
 ])});
 const entries=f.collect().items;
 assert.equal(entries[0].title,'Yaourt fictif');
 assert.equal(entries[1].title,'Pâtes fictives');
 assert.match(entries[1].next,/DDM dépassée, qualité à vérifier/);
 assert.equal(f.writes(),0);
 assert.equal(f.network(),0);
});

test('V174: dates calendaires impossibles exclues des rappels sans effacement',async()=>{
 const iso=delta=>{const d=new Date();d.setDate(d.getDate()+delta);return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-')};
 const f=await fixture({
  [K.agenda]:JSON.stringify([
   {id:'a',title:'Faux 31 février',date:'2026-02-31',category:'perso'},
   {id:'b',title:'Vrai événement',date:iso(2),category:'perso'}
  ]),
  [K.pantry]:JSON.stringify([
   {id:'f',name:'Fausse DDM',kind:'DDM',date:'2026-02-31'},
   {id:'v',name:'Vraie DLC',kind:'DLC',date:iso(1)}
  ])
 });
 const titles=f.collect().items.map(x=>x.title);
 assert.deepEqual(titles,['Vraie DLC','Vrai événement']);
 assert.equal(f.writes(),0);
 assert.equal(f.network(),0);
});

test('V178: real Maison work is visible first; high priority breaks ties and link opens jobs',async()=>{
 const f=await fixture({[K.maison]:JSON.stringify([
  {id:'todo-high',name:'Projet planifié urgent',status:'todo',priority:'haute'},
  {id:'doing-low',name:'Projet en cours peu urgent',status:'doing',priority:'basse'},
  {id:'doing-high',name:'Projet en cours urgent',status:'doing',priority:'haute'},
  {id:'done',name:'Projet terminé',status:'done',priority:'haute'}
 ])});
 const items=f.collect().items;
 assert.deepEqual(items.map(x=>x.title),['Projet en cours urgent','Projet planifié urgent']);
 assert.deepEqual(items.map(x=>x.url),['./maison.html#job=doing-high','./maison.html#job=todo-high']);
 assert.equal(f.collect().total,3);
 assert.equal(f.writes(),0);
 assert.equal(f.network(),0);
});

test('V181: les vraies urgences passent devant les DDM et les loisirs sans doublon',async()=>{
 const iso=n=>{const d=new Date();d.setDate(d.getDate()+n);return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-')};
 const f=await fixture({
  [K.pantry]:JSON.stringify([
   {id:'ddm',name:'Conserve fictive',kind:'DDM',date:iso(-5)},
   {id:'dlc',name:'Produit DLC fictif',kind:'DLC',date:iso(-1)}
  ]),
  [K.agenda]:JSON.stringify([{id:'rdv',title:'Rendez-vous ce jour',date:iso(0),category:'perso'}]),
  [K.tasks]:JSON.stringify([{id:'t',text:'Rappeler un artisan',done:false}]),
  [K.maison]:JSON.stringify([{id:'h',name:'Chantier en cours',status:'doing',priority:'haute'}]),
  [K.musique]:JSON.stringify([{id:'m',mode:'musique',title:'Idée de mix',status:'planned',date:iso(0)}])
 });
 const result=f.collect();
 assert.deepEqual(result.items.map(x=>x.title),[
  'Produit DLC fictif','Rendez-vous ce jour','Rappeler un artisan',
  'Chantier en cours','Idée de mix','Conserve fictive'
 ]);
 assert.equal(result.total,6);
 assert.equal(new Set(result.items.map(x=>x.title)).size,6);
 f.ctx.testRender();
 assert.match(f.nodes.get('activePulseList').children[0].className,/is-urgent/);
 assert.equal(f.nodes.get('activePulseCount').textContent,'6 actions retrouvées');
 assert.equal(f.writes(),0);
 assert.equal(f.network(),0);
});

test('V181: CSS, accessibilité et stockage existant sont préservés',async()=>{
 const [html,css,js,sw,tour]=await Promise.all(['index.html','cinema-upgrade.css','active-pulse.js','sw.js','tournee-complete.html'].map(read));
 assert.match(css,/\.active-pulse-item\.is-urgent:focus-visible/);
 assert.match(html,/D’abord les échéances urgentes/);
 assert.match(js,/results\.sort\(\(a,b\)=>a\.rank-b\.rank\)/);
 assert.doesNotMatch(js,/localStorage\.setItem|fetch\(|XMLHttpRequest|WebSocket/);
 assert.match(sw,/big-cthu-public-v2-v\d+/);
 assert.doesNotMatch(tour,/V181|is-urgent/);
});

test('V182: une DDM dépassée depuis longtemps reste dans la source sans saturer le cockpit',async()=>{
 const iso=n=>{const d=new Date();d.setDate(d.getDate()+n);return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-')};
 const pantry=[
  {id:'old',name:'DDM 30 jours',kind:'DDM',date:iso(-30)},
  {id:'recent',name:'DDM 5 jours',kind:'DDM',date:iso(-5)},
  {id:'dlc',name:'DLC dépassée',kind:'DLC',date:iso(-31)}
 ];
 const raw=JSON.stringify(pantry);
 const f=await fixture({[K.pantry]:raw});
 assert.deepEqual(f.collect().items.map(x=>x.title),['DLC dépassée','DDM 5 jours']);
 assert.equal(f.collect().total,2);
 assert.equal(f.stored.get(K.pantry),raw);
 assert.equal(f.writes(),0);
 assert.equal(f.network(),0);
});


test('V185: les échéances Maison réellement urgentes sont parmi les deux cartes visibles',async()=>{
 const iso=n=>{const d=new Date();d.setDate(d.getDate()+n);return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-')};
 const f=await fixture({[K.maison]:JSON.stringify([
  {id:'routine',name:'Rangement tranquille',status:'doing',priority:'basse',due:iso(20)},
  {id:'fuite & eau',name:'Fuite à réparer',status:'todo',priority:'haute',due:iso(-1)},
  {id:'devis',name:'Devis à traiter',status:'doing',priority:'haute',due:iso(0)}
 ])});
 const d=f.collect();
 assert.deepEqual(d.items.map(x=>x.title),['Fuite à réparer','Devis à traiter']);
 assert.deepEqual(d.items.map(x=>x.url),['./maison.html#job=fuite%20%26%20eau','./maison.html#job=devis']);
 assert.equal(d.total,3);
 assert.equal(f.writes(),0);
 assert.equal(f.network(),0);
});

test('V185: un ancien chantier sans identifiant reste navigable et la priorité haute dépasse le travail secondaire',async()=>{
 const f=await fixture({[K.maison]:JSON.stringify([
  {name:'Ancien chantier',status:'doing',priority:'basse'},
  {id:'urgent',name:'Urgence prévue',status:'todo',priority:'haute'}
 ])});
 const d=f.collect();
 assert.deepEqual(d.items.map(x=>x.title),['Urgence prévue','Ancien chantier']);
 assert.deepEqual(d.items.map(x=>x.url),['./maison.html#job=urgent','./maison.html#jobs']);
 assert.equal(f.writes(),0);
});

test('V185: la fiche Maison se cible par fragment local sans donnée copiée ni lien externe',async()=>{
 const [html,sw,js]=await Promise.all(['maison.html','sw.js','active-pulse.js'].map(read));
 assert.match(html,/new URLSearchParams\(window\.location\.hash\.slice\(1\)\)\.get\('job'\)/);
 assert.match(html,/\.job\.is-focused\{/);
 assert.match(html,/scrollIntoView\(\{block:'center'\}\)/);
 assert.match(js,/encodeURIComponent\(item\.id\)/);
 assert.doesNotMatch(js,/localStorage\.setItem|fetch\(|XMLHttpRequest|WebSocket/);
 assert.match(sw,/big-cthu-public-v2-v\d+/);
});


test('V186: ouvrir directement un événement depuis À reprendre sans changer le calendrier',async()=>{
 const today=(()=>{const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-')})();
 const f=await fixture({[K.agenda]:JSON.stringify([
  {id:'rdv & maison',title:'Rendez-vous artisan',date:today,category:'maison'},
  {id:'future',title:'Autre rendez-vous',date:today,category:'perso'},
  {title:'Ancienne fiche sans identifiant',date:today,category:'perso'}
 ])});
 const d=f.collect();
 assert.equal(d.total,3);
 assert.deepEqual(d.items.map(x=>x.url),['./agenda.html#event=rdv%20%26%20maison','./agenda.html#event=future']);
 assert.equal(f.writes(),0);
 assert.equal(f.network(),0);
});

test('V186: rendez-vous sans identifiant lisible conservent le lien Agenda traditionnel',async()=>{
 const today=(()=>{const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-')})();
 const f=await fixture({[K.agenda]:JSON.stringify([{title:'Ancien rendez-vous',date:today,category:'perso'}])});
 assert.deepEqual(f.collect().items.map(x=>x.url),['./agenda.html#events']);
 assert.equal(f.writes(),0);
});

test('V186: Agenda peut cibler son événement sans migration, accès réseau ni traitement de patient',async()=>{
 const [html,sw,js,tour]=await Promise.all(['agenda.html','sw.js','active-pulse.js','tournee-complete.html'].map(read));
 assert.match(html,/new URLSearchParams\(window\.location\.hash\.slice\(1\)\)\.get\('event'\)/);
 assert.match(html,/\.event\.is-focused\{/);
 assert.match(html,/scrollIntoView\(\{block:'center'\}\)/);
 assert.match(js,/\.\/agenda\.html#event=/);
 assert.match(sw,/big-cthu-public-v2-v\d+/);
 assert.doesNotMatch(js,/localStorage\.setItem|fetch\(|XMLHttpRequest|WebSocket/);
 assert.doesNotMatch(tour,/V186|\.event\.is-focused/);
});


test('V187: une note Capture ouverte se retrouve directement sans copie ni transfert implicite',async()=>{
 const f=await fixture({[K.captures]:JSON.stringify([
  {id:'appel & plombier',title:'Contacter le plombier',target:'inbox',status:'new'},
  {id:'prochaine',title:'Autre capture',target:'task',status:'new'},
  {id:'archive',title:'Capture faite',target:'inbox',status:'done'}
 ])});
 const d=f.collect();
 assert.deepEqual(d.items.map(x=>x.title),['Contacter le plombier','Autre capture']);
 assert.deepEqual(d.items.map(x=>x.url),['./capture.html#capture=appel%20%26%20plombier','./capture.html#capture=prochaine']);
 assert.equal(d.total,2);
 assert.equal(f.writes(),0);
 assert.equal(f.network(),0);
});

test('V187: une capture ancienne sans identifiant conserve la navigation générale',async()=>{
 const f=await fixture({[K.captures]:JSON.stringify([{title:'Fiche historique',target:'inbox',status:'new'}])});
 assert.deepEqual(f.collect().items.map(x=>x.url),['./capture.html#list']);
 assert.equal(f.writes(),0);
});

test('V187: Capture cible un élément sans modifier les mécanismes de transmission protégés',async()=>{
 const [html,sw,js,tour]=await Promise.all(['capture.html','sw.js','active-pulse.js','tournee-complete.html'].map(read));
 assert.match(html,/new URLSearchParams\(window\.location\.hash\.slice\(1\)\)\.get\('capture'\)/);
 assert.match(html,/\.item\.is-focused\{/);
 assert.match(html,/scrollIntoView\(\{block:'center'\}\)/);
 assert.match(js,/\.\/capture\.html#capture=/);
 assert.match(sw,/big-cthu-public-v2-v\d+/);
 assert.doesNotMatch(js,/localStorage\.setItem|fetch\(|XMLHttpRequest|WebSocket/);
 assert.doesNotMatch(tour,/V187|\.item\.is-focused/);
});

test('V192: affiche davantage d’actions uniquement sur demande sans écriture',async()=>{
 const f=await fixture({[K.tasks]:JSON.stringify([
  {id:'a',text:'Première',done:false},
  {id:'b',text:'Deuxième',done:false},
  {id:'c',text:'Troisième',done:false}
 ])});
 assert.equal(f.collect().items.length,2);
 assert.equal(f.ctx.testCollect(true).items.length,3);
 assert.equal(f.collect().compactVisible,2);
 assert.equal(f.writes(),0);
 assert.equal(f.network(),0);
 const html=await read('index.html');
 assert.match(html,/id="activePulseToggle"/);
});

test('V194–V197: cockpit mobile compact, ancres accessibles et cache public renouvelé',async()=>{
 const [css,sw,html]=await Promise.all(['cockpit-themes.css','sw.js','index.html'].map(read));
 assert.match(css,/#activePulse > p\.muted:not\(#activePulseStatus\)/);
 assert.match(css,/#activePulse,#nextSession,#priorities\{scroll-margin-top/);
 assert.match(css,/#activePulseToggle\{min-height:44px/);
 assert.match(sw,/const CACHE='big-cthu-public-v2-v196'/);
 assert.match(sw,/'\.\/active-pulse\.js'/);
 assert.match(sw,/'\.\/next-session\.js'/);
 assert.match(html,/id="activePulseToggle"/);
 assert.doesNotMatch(sw,/tidel_|Topaze|localStorage|indexedDB/);
});

// V198–V200: filtering is read-only and the returned count remains exact.
test('V198–V200: counts par catégorie, filtre accessible et aucune écriture',async()=>{
 const f=await fixture({[K.tasks]:JSON.stringify([
 {id:'p1',text:'Priorité 1',done:false},{id:'p2',text:'Priorité 2',done:false},{id:'p3',text:'Priorité 3',done:false}]),
 [K.gaming]:JSON.stringify([{id:'g1',game:'WoW',text:'Pex',done:false}])});
 const d=f.collect();
 assert.equal(d.counts['Priorités'],3);
 assert.equal(d.counts['Jeux'],1);
 assert.equal(d.items.length,3);
 const extended=JSON.parse(JSON.stringify(f.ctx.testCollect(true)));
 assert.equal(extended.items.length,4);
 const html=await read('index.html');
 assert.match(html,/id="activePulseCategory"/);
 assert.match(html,/id="activePulseToggle"[^>]*aria-expanded="false"/);
 assert.equal(f.writes(),0);
 assert.equal(f.network(),0);
});

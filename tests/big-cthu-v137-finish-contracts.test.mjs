import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';

const read=name=>readFile(new URL('../big-cthu-beta/'+name,import.meta.url),'utf8');

test('V137: le cockpit affiche un vrai état vide sans création ni transmission de données',async()=>{
 const code=await read('active-pulse.js');
 const nodes=new Map();
 const createElement=tag=>({
  tag,textContent:'',className:'',children:[],
  append(...items){this.children.push(...items)},
  replaceChildren(...items){this.children=[...items]}
 });
 for(const id of ['activePulseList','activePulseCount','activePulseStatus'])nodes.set(id,createElement('div'));
 let writes=0,requests=0;
 const document={
  readyState:'loading',getElementById:id=>nodes.get(id),
  createElement,addEventListener(){}
 };
 const context={document,window:{addEventListener(){}},localStorage:{
  getItem(){return null},setItem(){writes++}
 },fetch(){requests++}};
 assert.ok(code.includes('globalThis')===false);
 assert.ok(code.endsWith('})();'));
 runInNewContext(code.slice(0,code.lastIndexOf('})();'))+'globalThis.testRender=render;})();',context,{timeout:1200});
 context.testRender();
 const root=nodes.get('activePulseList');
 assert.equal(root.children.length,1);
 assert.equal(root.children[0].tag,'p');
 assert.equal(root.children[0].className,'muted');
 assert.match(root.children[0].textContent,/Aucune action en attente/);
 assert.equal(root.children[0].textContent,'Aucune action en attente dans tes modules locaux. Tu peux simplement continuer ta journée.');
 assert.equal(nodes.get('activePulseCount').textContent,'0 actions retrouvées');
 assert.equal(writes,0);
 assert.equal(requests,0);
});

test('V137: les trois univers restent commutables avec un état actif lisible et une navigation au pouce',async()=>{
 const [html,css,js,sw,tour]=await Promise.all(
  ['index.html','cockpit-themes.css','cockpit-themes.js','sw.js','tournee-complete.html'].map(read));
 for(const mode of ['premium','organic','medical']){
  assert.match(html,new RegExp('data-cthu-choice="'+mode+'"'));
  assert.ok(css.includes('html[data-cthu-theme="'+mode+'"]'));
  assert.ok(js.includes(mode+":'") || js.includes(mode+':"'));
 }
 assert.match(css,/\.cthu-theme-choice\[aria-pressed="true"\]/);
 assert.match(css,/\.cthu-theme-choice:focus-visible/);
 assert.match(css,/\.cthu-theme-choice\{min-height:64px/);
 assert.match(css,/\.ns-actions button\{min-height:48px/);
 assert.match(css,/\.cthu-mobile-dock a\{touch-action:manipulation\}/);
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
 const start=html.indexOf('<nav class="cthu-mobile-dock"');
 assert.ok(start>0);
 const end=html.indexOf('</nav>',start);
 const dock=html.slice(start,end);
 assert.equal((dock.match(/<a href=/g)||[]).length,4);
 for(const href of ['#activePulse','./tournee-complete.html','./maison.html','./sauvegardes.html'])
  assert.ok(dock.includes('href="'+href+'"'));
 assert.match(sw,/big-cthu-public-v2-v136/);
 assert.doesNotMatch(tour,/cthu-mobile-dock|active-pulse\.js/);
});

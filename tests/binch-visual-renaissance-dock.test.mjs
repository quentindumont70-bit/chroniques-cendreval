import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

function sandbox(){
 const source=readFileSync(new URL('../public/binch/visual-renaissance-dock.js',import.meta.url),'utf8');
 const callbacks=[],tabs=[],appChildren=[];
 class Node{
  constructor(tag){this.tag=tag;this.children=[];this.dataset={};this.attributes={};this.disabled=false;this.hidden=false;this.className='';this.textContent=''}
  append(...a){this.children.push(...a)}
  setAttribute(key,value){this.attributes[key]=value}
  addEventListener(key,callback){this['on'+key]=callback}
  querySelectorAll(selector){return selector==='button[data-to]'?this.children.filter(a=>a.dataset?.to):[]}
 }
 const app={append(node){appChildren.push(node)}};
 const nav={querySelectorAll(selector){return selector==='button[data-page]'?tabs:[]}};
 const document={
  readyState:'loading',createElement:tag=>new Node(tag),addEventListener(){},
  getElementById(id){if(id==='app')return app;if(id==='binch-renaissance-dock')return appChildren.find(n=>n.id===id);return null},
  querySelector(q){return q==='#app nav.nav'?nav:null}
 };
 const marker="document.addEventListener('binch:adventure-ready',refresh);";
 assert.ok(source.includes(marker));
 const code=source.replace(marker,'globalThis.__dockProbe={create,refresh,source,start};\n'+marker);
 const vm={document};runInNewContext(code,vm,{filename:'visual-renaissance-dock.js'});
 function addTab(id,title,active){
  const tab={dataset:{page:id},textContent:title,disabled:false,classList:{contains:k=>k==='active'&&active},click(){callbacks.push(id)}};
  tabs.push(tab);return tab;
 }
 return {probe:vm.__dockProbe,appChildren,callbacks,tabs,addTab};
}

test('HUD mobile: navigation réelle, aucune route fictive ni duplication de la barre',()=>{
 const x=sandbox();
 x.addTab('hub','Quartier général',true);
 x.addTab('progression','Carte d’expédition',false);
 x.addTab('gm','Mode GM',false);
 assert.equal(x.probe.refresh(),true);
 assert.equal(x.probe.refresh(),true);
 assert.equal(x.appChildren.length,1);
 const dock=x.appChildren[0],buttons=dock.children;
 assert.equal(buttons.length,4);
 assert.equal(buttons[0].attributes['aria-current'],'page');
 assert.equal(buttons[2].disabled,true,'Specs not yet created');
 assert.equal(buttons[2].hidden,true,'unavailable route hidden');
 buttons[1].onclick();assert.deepEqual(x.callbacks,['progression']);
 buttons[2].onclick();assert.deepEqual(x.callbacks,['progression'],'disabled target does not invent navigation');
 x.addTab('specs','Talents Druide',false);
 assert.equal(x.probe.refresh(),true);
 assert.equal(buttons[2].hidden,false);
 buttons[2].onclick();assert.deepEqual(x.callbacks,['progression','specs']);
 assert.equal(dock.attributes['aria-label'],'Navigation rapide de l’aventurier');
 assert.ok(buttons.every(b=>b.attributes['aria-label'].startsWith('Aller à ')));
});

test('HUD mobile : aucune mutation de progression, protection iPhone, onglets complets toujours disponibles',()=>{
 const js=readFileSync(new URL('../public/binch/visual-renaissance-dock.js',import.meta.url),'utf8');
 const css=readFileSync(new URL('../public/binch/visual-renaissance-dock.css',import.meta.url),'utf8');
 const html=readFileSync(new URL('../public/binch/index.html',import.meta.url),'utf8');
 assert.ok(!js.includes('localStorage'),'navigation does not change WoW or user preferences');
 assert.ok(!js.includes('fetch('),'no remote calls');
 assert.ok(js.includes("tab.click()"),'uses existing navigation');
 assert.ok(js.includes("attributeFilter:['class','disabled']"),'tab state reacts to source');
 assert.ok(css.includes('env(safe-area-inset-bottom'),'safe area');
 assert.ok(css.includes('max-width:720px'),'only compact layouts');
 assert.ok(css.includes('min-height:540px'),'no cramped landscape HUD');
 assert.ok(css.includes('#binch-specs-pinned'),'do not cover the talent tracker');
 assert.ok(css.includes('prefers-reduced-motion:reduce'));
 assert.ok(css.includes('forced-colors:active'));
 assert.ok(html.includes('./visual-renaissance-dock.js?v=001'));
 assert.ok(html.includes('./visual-renaissance-dock.css?v=001'));
 assert.ok(html.includes('class="nav binch-nav-multiline"'),'full navigation remains in page');
});

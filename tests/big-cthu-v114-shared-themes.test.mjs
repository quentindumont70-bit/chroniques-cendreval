import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';

const base=new URL('../big-cthu-beta/',import.meta.url);
const read=name=>readFile(new URL(name,base),'utf8');

test('V114: Maison, Budget, Passions adoptent les trois thèmes sans toucher aux autres pages',async()=>{
 const css=await read('cockpit-themes.css');
 const js=await read('cockpit-themes.js');
 for(const page of ['maison.html','budget.html','passions.html']){
  const html=await read(page);
  assert.match(html,/data-cthu-theme-tentacle="yes"/,page);
  assert.match(html,/href="\.\/cockpit-themes\.css"/,page);
  assert.match(html,/src="\.\/cockpit-themes\.js"/,page);
  assert.ok(html.indexOf('src="./cockpit-themes.js"')<html.indexOf('<body'),'skin loaded before page');
 }
 const tour=await read('tournee-complete.html');
 assert.doesNotMatch(tour,/data-cthu-theme-tentacle/,'Tournée not opt-in');
 assert.doesNotMatch(tour,/cockpit-themes\.css/,'Tournée CSS unchanged');
 assert.match(css,/body\[data-cthu-theme-tentacle="yes"\]/);
 assert.match(js,/document\.body\.dataset\.cthuThemeTentacle==='yes'/);
});

test('V114: le sélecteur est monté sur une tentacule et partage la préférence du cockpit',async()=>{
 const js=await read('cockpit-themes.js');
 const key='big-cthu-cockpit-theme-v1';
 const persisted=new Map([[key,'premium']]),elements=new Map();
 let added=0;
 const choices=['premium','organic','medical'].map(name=>({
  dataset:{cthuChoice:name},attrs:{},
  addEventListener(event,handler){this.listeners??={};this.listeners[event]=handler},
  setAttribute(name,value){this.attrs[name]=value}
 }));
 const toggle={attrs:{},listeners:{},addEventListener(name,handler){this.listeners[name]=handler},
  setAttribute(name,value){this.attrs[name]=value},contains(){return false},focus(){}};
 const menu={hidden:true,querySelectorAll:()=>choices,contains(){return false}};
 const host={tagName:'HEADER',append(element){added++;assert.match(element.innerHTML,/data-cthu-choice="medical"/);elements.set('cthuThemeToggle',toggle);elements.set('cthuThemeMenu',menu)}};
 const doc={
  readyState:'complete',documentElement:{dataset:{}},body:{dataset:{cthuThemeTentacle:'yes'}},
  getElementById:id=>elements.get(id)||null,
  querySelector:selector=>selector==='header'?host:null,
  querySelectorAll:()=>choices,
  createElement:()=>({className:'',innerHTML:''}),
  addEventListener(){}
 };
 runInNewContext(js,{document:doc,localStorage:{getItem:k=>persisted.get(k)||null,setItem:(k,v)=>persisted.set(k,v)},Object},{timeout:1000});
 assert.equal(added,1);
 assert.equal(doc.documentElement.dataset.cthuTheme,'premium');
 assert.equal(toggle.attrs['aria-expanded'],'false');
 choices[2].listeners.click();
 assert.equal(doc.documentElement.dataset.cthuTheme,'medical');
 assert.equal(persisted.get(key),'medical');
 assert.equal(persisted.size,1);
});

test('V114: le service worker publie bien les ressources communes et garde le chiffrement Tournée isolé',async()=>{
 const sw=await read('sw.js');
 assert.match(sw,/'\.\/cockpit-themes\.css'/);
 assert.match(sw,/'\.\/cockpit-themes\.js'/);
 assert.match(sw,/'\.\/tournee-complete\.html'/);
 const code=await read('cockpit-themes.js');
 assert.doesNotMatch(code,/tidel_|fetch\(|XMLHttpRequest|indexedDB/);
});

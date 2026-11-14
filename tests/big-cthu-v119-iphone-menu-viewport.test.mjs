import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';

const read=name=>readFile(new URL('../big-cthu-beta/'+name,import.meta.url),'utf8');
function fixture(width,left,right){
 const listeners={},wListeners={};
 const root={dataset:{}},storage=new Map();
 const choice={dataset:{cthuChoice:'organic'},setAttribute(){},addEventListener(){}};
 const toggle={attrs:{},style:{},
  addEventListener(k,fn){listeners[k]=fn},
  setAttribute(k,v){this.attrs[k]=v},
  getBoundingClientRect(){return {left,right}},
  contains:()=>false,focus(){}};
 const menu={hidden:true,style:{},querySelectorAll:()=>[choice],contains:()=>false};
 const doc={documentElement:root,readyState:'complete',
  getElementById:id=>({cthuThemeToggle:toggle,cthuThemeMenu:menu})[id]||null,
  querySelectorAll:()=>[choice],addEventListener(){}};
 const win={innerWidth:width,visualViewport:{width},addEventListener(k,fn){wListeners[k]=fn}};
 return {doc,win,toggle,menu,listeners,wListeners};
}
async function boot(width,left,right){
 const source=await read('cockpit-themes.js'),dom=fixture(width,left,right);
 runInNewContext(source,{document:dom.doc,window:dom.win,localStorage:{getItem:k=>null,setItem(){}},Object},{timeout:1000});
 return dom;
}

test('V119: iPhone compact 353px, popup conserve 12px de chaque côté et aucune pastille ne sort',async()=>{
 const d=await boot(353,155,242);
 d.listeners.click();
 const x=155+parseFloat(d.menu.style.left);
 const width=parseFloat(d.menu.style.width);
 assert.equal(d.menu.hidden,false);
 assert.equal(width,329);
 assert.equal(x,12);
 assert.ok(x+width<=353-12);
 assert.equal(d.menu.style.right,'auto');
});

test('V119: viewport plus large garde le menu proche du bouton, dans l écran',async()=>{
 const d=await boot(700,350,500);
 d.listeners.click();
 const x=350+parseFloat(d.menu.style.left);
 assert.ok(x>=12);
 assert.ok(x+parseFloat(d.menu.style.width)<=700-12);
 assert.equal(x,160);
});

test('V119: rotation iPhone recalcule la position et revient en placement desktop sans forcer le choix',async()=>{
 const d=await boot(353,155,242);
 d.listeners.click();
 d.win.innerWidth=900;d.win.visualViewport.width=900;
 d.wListeners.resize();
 assert.equal(d.menu.style.left,'');
 assert.equal(d.menu.style.right,'');
 assert.equal(d.menu.style.width,'');
});

test('V119: pas de changement métier, hors ligne, menutoggle et scroll tactile toujours actifs',async()=>{
 const [source,css,tour]=await Promise.all(['cockpit-themes.js','cockpit-themes.css','tournee-complete.html'].map(read));
 assert.match(source,/Math\.min\(rect\.right-width,viewport-width-margin\)/);
 assert.match(css,/overflow-y:auto/);
 assert.match(css,/overscroll-behavior:contain/);
 assert.doesNotMatch(source,/fetch\(|XMLHttpRequest|tidel_|Topaze/);
 assert.doesNotMatch(tour,/cockpit-themes\.js/);
});

import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';

const base=new URL('../big-cthu-beta/',import.meta.url);
const read=name=>readFile(new URL(name,base),'utf8');
function fixture(js,{initial=null,failStorage=false}={}){
 const store=new Map(initial?[['big-cthu-cockpit-theme-v1',initial]]:[]);
 const listeners=new Map();
 let focusCount=0;
 const make=(extra={})=>({
  ...extra,attrs:{},
  addEventListener(type,cb){this.handlers??={};this.handlers[type]=cb},
  setAttribute(name,value){this.attrs[name]=value},
  contains(target){return target===this},
  focus(){focusCount++}
 });
 const choices=['premium','organic','medical'].map(name=>make({dataset:{cthuChoice:name}}));
 const toggle=make(),status=make({textContent:''}),label=make({textContent:''});
 const menu=make({hidden:true,querySelectorAll:()=>choices});
 const elements={cthuThemeToggle:toggle,cthuThemeMenu:menu,cthuThemeStatus:status,cthuThemeCurrent:label};
 const document={
  documentElement:{dataset:{}},
  readyState:'complete',
  getElementById:id=>elements[id],
  querySelectorAll:()=>choices,
  addEventListener:(name,cb)=>listeners.set(name,cb)
 };
 const localStorage={
  getItem:key=>{if(failStorage)throw Error('Storage unavailable');return store.get(key)||null},
  setItem(key,value){if(failStorage)throw Error('Storage unavailable');store.set(key,value)}
 };
 runInNewContext(js,{document,localStorage,Object},{timeout:1000});
 return {document,store,choices,toggle,menu,label,status,listeners,focus:()=>focusCount};
}

test('V113: trois thèmes disponibles, accessibles, sans changer les modules du cockpit',async()=>{
 const [home,css,js,sw]=await Promise.all(['index.html','cockpit-themes.css','cockpit-themes.js','sw.js'].map(read));
 assert.match(home,/id="cthuThemeToggle"/);
 assert.match(home,/aria-controls="cthuThemeMenu"/);
 for(const id of ['premium','organic','medical']){
  assert.match(home,new RegExp('data-cthu-choice="'+id+'"'));
  assert.match(css,new RegExp('data-cthu-theme="'+id+'"'));
 }
 assert.match(home,/\.\/cockpit-themes\.css/);
 assert.match(home,/\.\/cockpit-themes\.js/);
 assert.match(sw,/'\.\/cockpit-themes\.css'/);
 assert.match(sw,/'\.\/cockpit-themes\.js'/);
 assert.doesNotMatch(js,/fetch\(|XMLHttpRequest|indexedDB|Topaze|tidel_/i);
 assert.match(home,/id="openTourneeSecure"/);
 assert.match(home,/id="tentacleSearch"/);
});

test('V113: défaut Organic, changement Premium instantané et choix conservé sur cet appareil',async()=>{
 const js=await read('cockpit-themes.js');
 const f=fixture(js);
 assert.equal(f.document.documentElement.dataset.cthuTheme,'organic');
 f.toggle.handlers.click();
 assert.equal(f.menu.hidden,false);
 assert.equal(f.toggle.attrs['aria-expanded'],'true');
 f.choices[0].handlers.click();
 assert.equal(f.document.documentElement.dataset.cthuTheme,'premium');
 assert.equal(f.store.get('big-cthu-cockpit-theme-v1'),'premium');
 assert.equal(f.menu.hidden,true);
 assert.equal(f.toggle.attrs['aria-expanded'],'false');
 assert.equal(f.choices[0].attrs['aria-pressed'],'true');
 assert.equal(f.choices[1].attrs['aria-pressed'],'false');
 assert.equal(f.focus(),1);
 const reopened=fixture(js,{initial:f.store.get('big-cthu-cockpit-theme-v1')});
 assert.equal(reopened.document.documentElement.dataset.cthuTheme,'premium');
 assert.equal(reopened.store.size,1);
});

test('V113: mode Medical et menu fermable via Escape ou clic extérieur',async()=>{
 const f=fixture(await read('cockpit-themes.js'),{initial:'medical'});
 assert.equal(f.document.documentElement.dataset.cthuTheme,'medical');
 f.toggle.handlers.click();
 f.listeners.get('keydown')({key:'Escape'});
 assert.equal(f.menu.hidden,true);
 f.toggle.handlers.click();
 f.listeners.get('click')({target:{}});
 assert.equal(f.menu.hidden,true);
});

test('V113: stockage bloqué ou valeur inattendue : aucune erreur et thème utilisable pour la session',async()=>{
 const js=await read('cockpit-themes.js');
 const f=fixture(js,{failStorage:true});
 assert.equal(f.document.documentElement.dataset.cthuTheme,'organic');
 f.choices[2].handlers.click();
 assert.equal(f.document.documentElement.dataset.cthuTheme,'medical');
 assert.match(f.status.textContent,/stockage indisponible/);
 assert.equal(fixture(js,{initial:'../../unsafe'}).document.documentElement.dataset.cthuTheme,'organic');
});

test('V113: préchargement sans scintillement et styles respectueux du mouvement réduit',async()=>{
 const [home,css,sw]=await Promise.all(['index.html','cockpit-themes.css','sw.js'].map(read));
 assert.ok(home.indexOf("localStorage.getItem('big-cthu-cockpit-theme-v1')")<home.indexOf('href="./cockpit-themes.css"'));
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
 assert.match(css,/#cthuThemeMenu\[hidden\]/);
 assert.match(css,/--cthu-accent/);
 assert.match(sw,/const CACHE='big-cthu-public-v2-v\d+'/);
});

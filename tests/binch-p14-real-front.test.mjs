import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const read=(name)=>readFileSync(new URL('../public/binch/'+name,import.meta.url),'utf8');
const html=read('index.html');
const css=read('premium-front-p14.css');
const mobileCSS=read('premium-mobile-sections-p14.css');
const mobileJS=read('premium-mobile-sections-p14.js');
const compositor=read('visual-identity-compositor.js');

test('P14: real homepage is player-home; duplicate legacy front is hidden',()=>{
 const playerCSS=read('player-home.css');
 const playerJS=read('player-home.js');
 assert.match(playerCSS,/#page-hub\.binch-adventure-ready>#binch-front\{display:none!important\}/);
 assert.match(playerJS,/root\.id='binch-adventure-home'/);
 assert.match(playerJS,/class="binch-character-card"/);
 assert.match(playerJS,/id="binch-home-name"/);
 assert.match(playerJS,/id="binch-home-level"/);
 assert.match(playerJS,/id="binch-priority-guard"/);
 assert.match(playerJS,/class="binch-route"/);
 for(const part of [
  '#page-hub.binch-adventure-ready #binch-adventure-home',
  '.binch-character-card',
  '.binch-priority-guard',
  '.binch-route',
  '.binch-route-step',
  '.binch-guard-list',
  '.binch-edit-profile'
 ])assert.ok(css.includes(part),'P14 must style visible working interface: '+part);
 assert.ok(!css.includes('#page-hub.binch-front-ready'),'P14 must not waste styling on hidden front');
});

test('P14: real current profile keeps both original hero images and data-driven modules',()=>{
 const shaaby=read('shaaby-premium-live.css'),forsaken=read('forsaken-warlock-premium-live.css');
 assert.ok(shaaby.includes('url("./shaaby-mulgore.webp")'));
 assert.ok(forsaken.includes('url("./forsaken-warlock-premium.webp")'));
 assert.ok(css.includes('data-binch-shaaby="true"'));
 assert.ok(css.includes('data-binch-forsaken="true"'));
 assert.ok(css.includes('var(--p14-ornament)'));
 assert.ok(css.includes('#page-metiers #jobs-content .tile'));
 assert.ok(css.includes('#page-progression .panel.section'));
 assert.ok(css.includes('#page-gm .panel.section'));
 assert.ok(css.includes('#page-specs #binch-specs'));
 assert.ok(html.includes('./premium-front-p14.css?v=002'));
 assert.ok(!css.includes('https://'),'no new external image requests');
 assert.ok(!css.includes('@import'),'no blocking external fonts');
});

test('P14: iPhone navigation is collapsible but original tabs and fixed shortcuts stay available',()=>{
 assert.ok(html.includes('./premium-mobile-sections-p14.css?v=003'));
 assert.ok(html.includes('./premium-mobile-sections-p14.js?v=001'));
 for(const id of ['binch-p14-sections','p14-nav-managed','p14-nav-open']){
  assert.ok(mobileJS.includes(id));
  assert.ok(mobileCSS.includes(id));
 }
 assert.ok(mobileJS.includes("aria-controls"));
 assert.ok(mobileJS.includes("aria-expanded"));
 assert.ok(mobileJS.includes("aria-hidden"));
 assert.ok(mobileJS.includes("key==='Escape'"));
 assert.ok(mobileJS.includes("nav.classList.toggle('p14-nav-open',opening)"));
 assert.ok(mobileCSS.includes('display:none!important'));
 assert.ok(mobileCSS.includes('display:grid!important'));
 assert.ok(mobileCSS.includes('max-width:760px'));
 assert.ok(mobileCSS.includes('max-width:390px'));
 assert.ok(mobileCSS.includes('binch-renaissance-dock'));
 assert.ok(mobileCSS.includes('prefers-reduced-motion:reduce'));
 assert.ok(mobileCSS.includes('forced-colors:active'));
 for(const page of ['hub','progression','metiers','gm','sync']){
  assert.ok(html.includes('data-page="'+page+'"'),'keep original working route '+page);
 }
 // Never mark the original nav inert: the existing fixed dock performs .click() on it.
 assert.ok(!mobileJS.includes('nav.inert='));
});

test('P14: actual toggle opens, closes and restores access on desktop without new navigation',()=>{
 let mobile=true,created;
 const navAttributes=new Map();
 const classes=new Set();
 const listeners={};
 const nav={
  id:'',classList:{
   add(x){classes.add(x)},remove(x){classes.delete(x)},contains(x){return classes.has(x)},
   toggle(x,force){if(force)classes.add(x);else classes.delete(x)}
  },
  parentNode:{insertBefore(node,target){assert.equal(target,nav);created=node}},
  setAttribute(key,value){navAttributes.set(key,value)},
  removeAttribute(key){navAttributes.delete(key)},
  querySelectorAll(query){assert.equal(query,'button[data-page]');return Array.from({length:18},()=>({}))},
  addEventListener(type,fn){listeners['nav-'+type]=fn}
 };
 const buttonAttributes=new Map(),buttonListeners={};
 const button={
  type:'',id:'',hidden:false,textContent:'',
  setAttribute(k,v){buttonAttributes.set(k,v)},
  getAttribute(k){return buttonAttributes.get(k)},
  addEventListener(k,fn){buttonListeners[k]=fn},
  scrollIntoView(){},
  focus(){this.focused=true}
 };
 const app={},docListeners={},winListeners={};
 const document={
  readyState:'complete',
  querySelector(selector){
   return {'#app':app,'#app nav.nav':nav,'#binch-p14-sections':created}[selector]??null;
  },
  createElement(name){assert.equal(name,'button');return button},
  addEventListener(type,fn){docListeners[type]=fn}
 };
 const window={
  matchMedia(q){assert.equal(q,'(max-width:760px)');return {matches:mobile}},
  addEventListener(type,fn){winListeners[type]=fn}
 };
 runInNewContext(mobileJS,{window,document});
 assert.equal(created,button);
 assert.equal(buttonAttributes.get('aria-expanded'),'false');
 assert.equal(navAttributes.get('aria-hidden'),'true');
 assert.equal(button.hidden,false);
 assert.ok(classes.has('p14-nav-managed'));
 buttonListeners.click();
 assert.ok(classes.has('p14-nav-open'));
 assert.equal(buttonAttributes.get('aria-expanded'),'true');
 assert.equal(navAttributes.has('aria-hidden'),false);
 listeners['nav-click']({target:{closest(){return {dataset:{page:'gm'}}}}});
 assert.ok(!classes.has('p14-nav-open'));
 assert.equal(buttonAttributes.get('aria-expanded'),'false');
 buttonListeners.click();
 docListeners.keydown({key:'Escape',preventDefault(){}});
 assert.ok(!classes.has('p14-nav-open'));
 assert.ok(button.focused);
 mobile=false;winListeners.resize();
 assert.equal(button.hidden,true);
 assert.equal(navAttributes.has('aria-hidden'),false);
});

test('P14: actual cinematic mobile hero is one full-width column with readable names and XP intact',()=>{
 const hero=read('premium-front-p14.css');
 assert.ok(hero.includes('display:flex!important;'));
 assert.ok(hero.includes('flex-direction:column!important;'));
 assert.ok(hero.includes('min-height:clamp(590px,150vw,710px)!important;'));
 assert.ok(hero.includes('.binch-portrait + div'));
 assert.ok(hero.includes('overflow-wrap:normal!important'));
 assert.ok(hero.includes('word-break:normal!important'));
 assert.ok(hero.includes('.binch-level strong'));
 assert.ok(hero.includes('width:103px!important;height:103px!important'));
 assert.ok(!hero.includes('.binch-level{display:none'));
 assert.ok(hero.includes('max-width:390px'));
});

test('P14: reforge materials track unsaved draft instead of stored identity',()=>{
 for(const x of ['shaaby','forsaken','other']){
  assert.ok(css.includes('data-binch-preview="'+x+'"'),'missing reforge visual state '+x);
 }
 assert.ok(compositor.includes("dialog.dataset.binchPreview=c.profile.race==='Tauren'&&c.profile.classe==='Druide'?'shaaby'"));
 const root={dataset:{},style:{setProperty(){}}};
 const document={readyState:'loading',documentElement:root,addEventListener(){},getElementById(){return null}};
 const window={location:{reload(){}},addEventListener(){}};
 const localStorage={getItem(){return JSON.stringify({onboarded:true,race:'Tauren',classe:'Druide',jobs:['Minage'],data:{pseudo:'Shaaby',level:42}})},setItem(){throw Error('Preview cannot save')}};
 runInNewContext(compositor,{window,document,localStorage,encodeURIComponent});
 const c=window.BinchVisualIdentity.compose({race:'MortVivant',classe:'Démoniste',jobs:['Ingénierie','Enchantement']});
 assert.equal(c.signature,'Mort-vivant · Démoniste · Ingénierie / Enchantement');
 assert.equal(root.dataset.binchShaaby,undefined);
});

test('P14: captures show actual working player home with synthetic-only profiles',()=>{
 const fixture=readFileSync(new URL('./helpers/binch-p14-screenshot-fixtures.mjs',import.meta.url),'utf8');
 assert.ok(fixture.includes("readFileSync(resolve(dir,'index.html')"));
 assert.ok(fixture.includes("localStorage.setItem('grimoire.hub.v3'"));
 assert.ok(fixture.includes("'.p14-preview-'+name+'.html'"));
 assert.ok(fixture.includes('synthetic CI profile'));
 assert.ok(fixture.includes("race:'Tauren',classe:'Druide'"));
 assert.ok(fixture.includes("race:'MortVivant',classe:'Démoniste'"));
 assert.ok(!html.includes('p14FixtureStorage'),'synthetic screenshot fixture stays out of real app');
});

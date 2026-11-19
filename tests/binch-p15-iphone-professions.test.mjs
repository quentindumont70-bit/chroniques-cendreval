import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,statSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const path=(name)=>new URL('../public/binch/'+name,import.meta.url);
const read=(name)=>readFileSync(path(name),'utf8');
const html=read('index.html');
const iphone=read('premium-iphone-p15.css');
const professions=read('premium-professions-p15.css');
const mobile=read('premium-mobile-sections-p14.js');

test('P15: responsive header keeps the full LA BINCH wordmark visible at 320/390/430',()=>{
 assert.ok(html.includes('class="binch-wordmark"'));
 assert.ok(iphone.includes('#app .app-head .binch-wordmark > b'));
 assert.ok(iphone.includes('white-space:nowrap!important'));
 assert.ok(iphone.includes('word-break:normal!important'));
 assert.ok(iphone.includes('#app .app-head > #binch-profile-trigger'));
 for(const width of ['760','390','350'])assert.ok(iphone.includes('max-width:'+width+'px'));
 assert.ok(iphone.includes('grid-template-columns:minmax(115px,1fr) minmax(118px,1fr)'));
 assert.ok(html.includes('./premium-iphone-p15.css?v=001'));
});

test('P15: editor is reparented into existing mobile menu, never removed or duplicated',()=>{
 assert.ok(mobile.includes("const editor=$('#binch-editor-toggle')"));
 assert.ok(mobile.includes('nav.prepend(editor)'));
 assert.ok(mobile.includes("editor.classList.add('p15-nav-editor')"));
 assert.ok(mobile.includes('editorParent.insertBefore(editor'));
 assert.ok(iphone.includes('#app nav.nav.p14-nav-managed #binch-editor-toggle.p15-nav-editor'));
 assert.ok(iphone.includes('position:static!important'));
 assert.ok(mobile.includes("document.addEventListener('keydown'"));
 assert.ok(mobile.includes("if(!compact())nav.classList.remove('p14-nav-open')"));
 assert.ok(read('ui-editor.js').includes("button.id='binch-editor-toggle'"));
 assert.ok(!iphone.includes('pointer-events:none!important'));
});

test('P15: 4 new craft engravings are local, original, light assets',()=>{
 const files=[
  'profession-herbalism-p15.svg','profession-alchemy-p15.svg',
  'profession-engineering-p15.svg','profession-enchanting-p15.svg'
 ];
 for(const name of files){
  const data=read(name);
  const size=statSync(path(name)).size;
  assert.ok(size<10000,'asset too large '+name);
  assert.match(data,/^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
  assert.match(data,/<title>[^<]+<\/title>/);
  assert.match(data,/<\/svg>$/);
  assert.ok(professions.includes('url("./'+name+'")'),'craft card must reference '+name);
 }
 assert.equal(new Set(files.map(name=>read(name))).size,4,'engraving art must not be copy/paste');
 assert.ok(html.includes('./premium-professions-p15.css?v=003'));
});

test('P15: real selected jobs receive specific visuals, with no fabricated craft data',()=>{
 for(const profession of [
  'Herboristerie','Alchimie','Ingénierie','Enchantement',
  'Minage','Forge','Couture','Dépeçage','Travail du cuir'
 ])assert.ok(professions.includes('data-job="'+profession+'"'),'missing actual profession card '+profession);
 assert.ok(professions.includes('#page-metiers #jobs-content .tile[data-job]'));
 assert.ok(professions.includes('data-br-jobs~="leaves"'));
 assert.ok(professions.includes('data-br-jobs~="clock"'));
 assert.ok(professions.includes('data-br-jobs~="runes"'));
 assert.ok(professions.includes('p15-leaf-appears 17s'));
 assert.ok(professions.includes('prefers-reduced-motion:reduce'));
 assert.ok(professions.includes('data-binch-detail="lite"'));
 assert.ok(professions.includes('forced-colors:active'));
 assert.ok(!professions.includes('https://'));
 assert.ok(html.includes('id="jobs-content"'));
});

test('P15: six existing portals have different motifs while keeping real working navigation',()=>{
 const portals=read('premium-portals-p15.css');
 const real=read('visual-renaissance.js');
 assert.ok(html.includes('./premium-portals-p15.css?v=001'));
 const ids=['progression','specs','metiers','gm','command','tresors'];
 for(const id of ids){
  assert.ok(portals.includes('data-to="'+id+'"'),'no original visual for portal '+id);
  assert.ok(real.includes("['"+id+"'"),'source navigation port must exist: '+id);
 }
 assert.ok(portals.includes('--p15-portal-material'));
 assert.ok(portals.includes('repeating-radial-gradient'));
 assert.ok(portals.includes('repeating-linear-gradient'));
 assert.ok(portals.includes('conic-gradient'));
 assert.ok(portals.includes('focus-visible'));
 assert.ok(portals.includes('prefers-reduced-motion:reduce'));
 assert.ok(portals.includes('data-binch-detail="lite"'));
 assert.ok(!portals.includes('localStorage'));
});

test('P15: early image preload downloads exactly one saved flagship, without writes',()=>{
 const m=html.match(/<script>(\/\* P15: preload[\s\S]*?)<\/script>/);
 assert.ok(m,'missing early profile-aware preload');
 const script=m[1];
 function run(profile){
  const links=[],storage={
   getItem(k){assert.equal(k,'grimoire.hub.v3');return profile==null?null:JSON.stringify(profile)},
   setItem(){throw Error('P15 preload must be read-only')}
  };
  const document={
   head:{append(link){links.push(link)}},
   createElement(k){assert.equal(k,'link');return {}}
  };
  runInNewContext(script,{document,localStorage:storage});
  return links.map(x=>({href:x.href,rel:x.rel,as:x.as,type:x.type,priority:x.fetchPriority}));
 }
 assert.deepEqual(run({onboarded:true,race:'Tauren',classe:'Druide'}),[
  {href:'./shaaby-mulgore.webp',rel:'preload',as:'image',type:'image/webp',priority:'high'}
 ]);
 assert.deepEqual(run({onboarded:true,race:'MortVivant',classe:'Démoniste'}),[
  {href:'./forsaken-warlock-premium.webp',rel:'preload',as:'image',type:'image/webp',priority:'high'}
 ]);
 assert.deepEqual(run({onboarded:false,race:'Tauren',classe:'Druide'}),[]);
 assert.deepEqual(run({onboarded:true,race:'Orc',classe:'Guerrier'}),[]);
 assert.deepEqual(run(null),[]);
 assert.ok(statSync(path('shaaby-mulgore.webp')).size<350000);
 assert.ok(statSync(path('forsaken-warlock-premium.webp')).size<250000);
});

test('P15: synthetic CI screenshots can select real métiers and full navigation',()=>{
 const s=readFileSync(new URL('./helpers/binch-p14-screenshot-fixtures.mjs',import.meta.url),'utf8');
 assert.ok(s.includes("location.search.includes('page=metiers')"));
 assert.ok(s.includes("button[data-page=metiers]"));
 assert.ok(s.includes("location.search.includes('menu=open')"));
 assert.ok(!html.includes("p14-preview-tauren.html"),'fixture paths must not enter production HTML');
});

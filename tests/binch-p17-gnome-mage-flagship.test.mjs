import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,statSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const file=name=>new URL('../public/binch/'+name,import.meta.url);
const read=name=>readFileSync(file(name),'utf8');
const html=read('index.html');
const css=read('gnome-mage-library-p17.css');
const compositor=read('visual-identity-compositor.js');
const gallery=read('premium-sanctuaries-review.html');
const base={onboarded:true,race:'Gnome',classe:'Mage',jobs:['Alchimie','Ingénierie'],
 data:{pseudo:'Archimède',level:37,objective:'Pex'},checks:[true,false],
 guild:{rank:'Membre'},unknownField:'preserve'};
function harness(){
 const variables={},writes=[];
 const root={dataset:{},style:{setProperty(k,v){variables[k]=v}}};
 const document={readyState:'loading',documentElement:root,
  addEventListener(){},getElementById(){return null}};
 const window={addEventListener(){},location:{reload(){}}};
 const localStorage={getItem(k){return k==='grimoire.hub.v3'?JSON.stringify(base):null},
  setItem(k,v){writes.push([k,v])}};
 runInNewContext(compositor,{window,document,localStorage,encodeURIComponent});
 return {api:window.BinchVisualIdentity,root,variables,writes};
}
test('P17 Gnome Mage: fourth visual is distinct original 1672px art, not inlined or recolored',()=>{
 const buf=readFileSync(file('gnome-mage-library-p17.webp'));
 assert.equal(buf.toString('ascii',0,4),'RIFF');
 assert.equal(buf.toString('ascii',8,12),'WEBP');
 assert.ok(buf.length>180000&&buf.length<340000,'original optimized high detail art');
 assert.notDeepEqual(buf,readFileSync(file('shaaby-mulgore.webp')));
 assert.notDeepEqual(buf,readFileSync(file('tauren-shaman-storm-p16.webp')));
 assert.notDeepEqual(buf,readFileSync(file('forsaken-warlock-premium.webp')));
 const svg=read('gnome-mage-astrolabe-p17.svg');
 assert.match(svg,/^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
 assert.ok(svg.includes('<title>Grand astrolabe'));
 assert.ok(svg.includes('<\/svg>')&&!svg.includes('<image '));
 assert.ok(statSync(file('gnome-mage-astrolabe-p17.svg')).size<8000);
 assert.ok(!html.includes('data:image/webp;base64,'));
});

test('P17 Gnome Mage: exact saved race/class flag only, and no storage writes',()=>{
 const h=harness();
 h.api.apply(base);
 assert.equal(h.root.dataset.binchMageLibrary,'true');
 assert.equal(h.root.dataset.brRace,'gnome');
 assert.equal(h.root.dataset.brClass,'mage');
 for(const k of ['binchShaaby','binchForsaken','binchStorm'])assert.equal(h.root.dataset[k],'false');
 for(const p of [
  {...base,race:'Humain'},
  {...base,classe:'Voleur'},
  {...base,onboarded:false},
  {...base,race:'Tauren',classe:'Druide'},
  {...base,race:'MortVivant',classe:'Démoniste'},
  {...base,race:'Tauren',classe:'Chaman'},
  {}
 ]){
  h.api.apply(p);assert.equal(h.root.dataset.binchMageLibrary,'false',JSON.stringify(p));
 }
 h.api.apply({...base,race:'Tauren',classe:'Chaman'});
 assert.equal(h.root.dataset.binchStorm,'true');
 h.api.apply(base);
 assert.equal(h.writes.length,0,'pure visual compositor must never save');
 assert.equal(base.data.level,37);
 assert.deepEqual(base.checks,[true,false]);
 assert.equal(base.guild.rank,'Membre');
 assert.equal(base.unknownField,'preserve');
});
test('P17 Gnome Mage: real character card, active actions, onboarding and preview carry the art',()=>{
 assert.ok(html.includes('./gnome-mage-library-p17.css?v=003'));
 assert.ok(html.includes('./visual-identity-compositor.js?v=009'));
 for(const phrase of [
  '#page-hub.binch-adventure-ready #binch-adventure-home .binch-character-card',
  'data-binch-mage-library="true"',
  'data-br-race="gnome"',
  'data-br-class="mage"',
  'url("./gnome-mage-library-p17.webp")',
  'url("./gnome-mage-astrolabe-p17.svg")',
  'data-binch-mage-library-preview="true"',
  'data-binch-preview="mage-library"',
  '#onboarding:has(#race-choices [data-race="Gnome"].selected):has(#class-choices [data-classe="Mage"].selected)',
  'binch-priority-guard',
  'binch-route',
  'binch-guard-list',
  '#app nav.nav'
 ])assert.ok(css.includes(phrase),'missing true UI integration: '+phrase);
 assert.ok(compositor.includes("root.dataset.binchMageLibrary=String(Boolean(input?.onboarded&&c.profile.race==='Gnome'&&c.profile.classe==='Mage'))"));
 assert.ok(compositor.includes("preview.dataset.binchMageLibraryPreview=String(c.profile.race==='Gnome'&&c.profile.classe==='Mage')"));
 assert.ok(compositor.includes("?'mage-library'"));
 const h=harness();
 const c=h.api.compose({race:'Gnome',classe:'Mage',jobs:['Alchimie','Ingénierie']});
 assert.equal(c.signature,'Gnome · Mage · Alchimie / Ingénierie');
 assert.equal(h.writes.length,0,'unsaved preview may not persist');
 assert.ok(css.includes('content:var(--br-job-glyph)'));
 assert.ok(css.includes('content:var(--br-second-glyph)'));
 assert.ok(!css.includes('https://')&&!css.includes('@import'));
});
test('P17: new home is mobile readable, accessible, without permanent CPU animation',()=>{
 assert.ok(css.includes('max-width:760px'));
 assert.ok(css.includes('max-width:390px'));
 assert.ok(css.includes('min-height:clamp(590px'));
 assert.ok(css.includes('flex-direction:column!important'));
 assert.ok(css.includes('focus-visible')||css.includes('outline'));
 assert.ok(css.includes('prefers-reduced-motion:reduce'));
 assert.ok(css.includes('data-binch-detail="lite"'));
 assert.ok(css.includes('forced-colors:active'));
 assert.ok(css.includes('binch-mage-aurora 26s'));
 assert.ok(css.includes('.binch-level strong'),'real visible level remains');
 assert.ok(css.includes('min-height:44px'),'minimum input tap target');
});
test('P17 desktop: full navigation remains operable in one horizontal ribbon above first hero',()=>{
 assert.ok(css.includes('@media(min-width:761px)'));
 assert.ok(css.includes('display:flex!important'));
 assert.ok(css.includes('flex-flow:row nowrap!important'));
 assert.ok(css.includes('overflow-x:auto!important'));
 assert.ok(css.includes('scroll-snap-type:x proximity'));
 assert.ok(css.includes('max-height:76px!important'));
 assert.ok(css.includes('focus-visible'));
 assert.ok(!css.includes('nav.nav button{display:none'));
});

test('P17: four galleries compare independent worlds read-only on phone',()=>{
 assert.match(gallery,/<title>La Binch Renaissance — Quatre sanctuaires premium<\/title>/);
 for(const key of ['tauren','forsaken','storm','mage'])assert.ok(gallery.includes('data-pick="'+key+'"'));
 assert.ok(gallery.includes('url("./gnome-mage-library-p17.webp")'));
 assert.ok(gallery.includes("mage:{mark:'Observatoire"));
 assert.ok(gallery.includes("tags:['Gnome','Mage','Alchimie','Ingénierie']"));
 assert.ok(gallery.includes("select(chosen==='mage'?'mage'"));
 assert.ok(gallery.includes('./index.html'));
 assert.ok(!gallery.includes('localStorage')&&!gallery.includes('fetch('));
});
test('P17: exactly one saved featured painting preloads; no writes in demo or others',()=>{
 const m=html.match(/<script>(\/\* P15: preload[\s\S]*?)<\/script>/);
 assert.ok(m,'original early load script still used');
 function loaded(profile){
  const links=[];
  const localStorage={getItem(k){assert.equal(k,'grimoire.hub.v3');return profile?JSON.stringify(profile):null},
   setItem(){throw Error('no writes allowed')}};
  const document={createElement(tag){assert.equal(tag,'link');return {}},head:{append(l){links.push(l)}}};
  runInNewContext(m[1],{localStorage,document});
  return links.map(l=>l.href);
 }
 assert.deepEqual(loaded(base),['./gnome-mage-library-p17.webp']);
 assert.deepEqual(loaded({...base,classe:'Guerrier'}),[]);
 assert.deepEqual(loaded({...base,race:'Tauren',classe:'Chaman'}),['./tauren-shaman-storm-p16.webp']);
 assert.deepEqual(loaded({...base,race:'Tauren',classe:'Druide'}),['./shaaby-mulgore.webp']);
 assert.deepEqual(loaded({...base,race:'MortVivant',classe:'Démoniste'}),['./forsaken-warlock-premium.webp']);
 assert.deepEqual(loaded({...base,onboarded:false}),[]);
 assert.deepEqual(loaded(null),[]);
});
test('P17: CI creates only an ephemeral real-game gnome fixture, not an uploaded account',()=>{
 const fixtures=readFileSync(new URL('./helpers/binch-p14-screenshot-fixtures.mjs',import.meta.url),'utf8');
 assert.ok(fixtures.includes("race:'Gnome',classe:'Mage',jobs:['Alchimie','Ingénierie']"));
 assert.ok(fixtures.includes("'.p14-preview-'+name+'.html'"));
 assert.ok(!html.includes('.p14-preview-mage.html'),'CI-only fixture never published');
});

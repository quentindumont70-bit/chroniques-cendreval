import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,statSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const dir=name=>new URL('../public/binch/'+name,import.meta.url);
const read=name=>readFileSync(dir(name),'utf8');
const html=read('index.html');
const css=read('tauren-shaman-storm-p16.css');
const js=read('visual-identity-compositor.js');
const gallery=read('premium-sanctuaries-review.html');
const original={onboarded:true,race:'Tauren',classe:'Chaman',jobs:['Minage','Forge'],
  data:{pseudo:'Corne-de-Tonnerre',level:46,objective:'Progresser'},checks:[true,false],
  guild:{rank:'Raider'},notes:'Do not edit'};
function harness(){
 let writes=0;const root={dataset:{},style:{setProperty(){}}};
 const document={readyState:'loading',documentElement:root,addEventListener(){},getElementById(){return null}};
 const window={addEventListener(){},location:{reload(){}}};
 const localStorage={getItem(){return JSON.stringify(original)},setItem(){writes++}};
 runInNewContext(js,{document,window,localStorage,encodeURIComponent});
 return {api:window.BinchVisualIdentity,root,get writes(){return writes}};
}
test('P16: new cinematic shaman art is a real independent compressed WebP and carved totem',()=>{
 const size=statSync(dir('tauren-shaman-storm-p16.webp')).size;
 assert.ok(size>180000&&size<380000,'mobile hero must preserve art detail but stay light');
 const art=readFileSync(dir('tauren-shaman-storm-p16.webp'));
 assert.equal(art.toString('ascii',0,4),'RIFF');
 assert.equal(art.toString('ascii',8,12),'WEBP');
 assert.notDeepEqual(art,readFileSync(dir('shaaby-mulgore.webp')));
 assert.notDeepEqual(art,readFileSync(dir('forsaken-warlock-premium.webp')));
 const sigil=read('tauren-shaman-storm-totem-p16.svg');
 assert.match(sigil,/<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
 assert.ok(sigil.includes('<title>Totem de l'));
 assert.ok(sigil.includes('</svg>'));
 assert.ok(!sigil.includes('<image '),'totem is a local original vector');
});
test('P16: activation is exactly saved onboarded Tauren Chaman; other races/classes untouched',()=>{
 const h=harness();
 h.api.apply(original);
 assert.equal(h.root.dataset.binchStorm,'true');
 assert.equal(h.root.dataset.binchShaaby,'false');
 assert.equal(h.root.dataset.binchForsaken,'false');
 assert.equal(h.root.dataset.brClass,'shaman');
 assert.equal(h.root.dataset.brRace,'tauren');
 for(const p of [
  {...original,classe:'Druide'}, {...original,race:'Orc'}, {...original,onboarded:false},
  {...original,race:'MortVivant',classe:'Démoniste'}, {...original,race:'Troll',classe:'Chaman'}, {}
 ]){
  h.api.apply(p);
  assert.equal(h.root.dataset.binchStorm,'false',JSON.stringify(p));
 }
 h.api.apply({...original,classe:'Druide'});
 assert.equal(h.root.dataset.binchShaaby,'true');
 h.api.apply({...original,race:'MortVivant',classe:'Démoniste'});
 assert.equal(h.root.dataset.binchForsaken,'true');
 assert.equal(h.writes,0,'no profile writes during art switches');
 assert.equal(original.data.level,46);
 assert.equal(original.guild.rank,'Raider');
 assert.equal(original.notes,'Do not edit');
});
test('P16: authentic character card, wizard and unsaved reforge all use unique storm artwork',()=>{
 assert.ok(html.includes('./tauren-shaman-storm-p16.css?v=001'));
 assert.ok(html.includes('./visual-identity-compositor.js?v=009'));
 for(const x of [
  '#page-hub.binch-adventure-ready #binch-adventure-home .binch-character-card',
  'data-binch-storm="true"', 'data-br-class="shaman"',
  'url("./tauren-shaman-storm-p16.webp")',
  'url("./tauren-shaman-storm-totem-p16.svg")',
  'data-binch-storm-preview="true"',
  'data-binch-preview="storm"',
  '#onboarding:has(#race-choices [data-race="Tauren"].selected):has(#class-choices [data-classe="Chaman"].selected)'
 ])assert.ok(css.includes(x),'real flagship missing '+x);
 assert.ok(js.includes("root.dataset.binchStorm=String(Boolean(input?.onboarded&&c.profile.race==='Tauren'&&c.profile.classe==='Chaman'))"));
 assert.ok(js.includes("preview.dataset.binchStormPreview=String(c.profile.race==='Tauren'&&c.profile.classe==='Chaman')"));
 assert.ok(js.includes("?'storm'"));
 assert.ok(css.includes('content:var(--br-job-glyph)'),'first job ornament must derive from actual selection');
 assert.ok(css.includes('content:var(--br-second-glyph)'),'second job ornament must derive from actual selection');
 assert.ok(!css.includes('https://')&&!css.includes('@import'),'no external art');
});
test('P16: mobile readability + rare accessible motion + low-graphics mode',()=>{
 assert.ok(css.includes('max-width:760px'));
 assert.ok(css.includes('max-width:390px'));
 assert.ok(css.includes('min-height:clamp(610px'));
 assert.ok(css.includes('display:flex!important;flex-direction:column!important'));
 assert.ok(css.includes('prefers-reduced-motion:reduce'));
 assert.ok(css.includes('data-binch-detail="lite"'));
 assert.ok(css.includes('forced-colors:active'));
 assert.ok(css.includes('binch-storm-glimmer 25s'));
 assert.ok(css.includes('outline:3px solid'));
});
test('P16: the gallery compares three premiums read-only and deep-link reveals storm',()=>{
 assert.match(gallery,/<title>La Binch Renaissance — Quatre sanctuaires premium<\/title>/);
 for(const key of ['tauren','forsaken','storm'])assert.ok(gallery.includes('data-pick="'+key+'"'));
 assert.ok(gallery.includes('url("./tauren-shaman-storm-p16.webp")'));
 assert.ok(gallery.includes("select(chosen==='mage'?'mage':chosen==='storm'?'storm'"));
 assert.ok(gallery.includes("art:'./tauren-shaman-storm-p16.webp'"));
 assert.ok(gallery.includes("tags:['Tauren','Chaman','Minage','Forge']"));
 assert.ok(gallery.includes('./index.html'));
 assert.ok(!gallery.includes('localStorage')&&!gallery.includes('fetch('));
});
test('P16: image preload is exclusive and never touches saved data',()=>{
 const m=html.match(/<script>(\/\* P15: preload[\s\S]*?)<\/script>/);
 assert.ok(m,'missing original conditional preload');
 const script=m[1];
 function loaded(profile){
  let writes=0,links=[];
  const localStorage={getItem(k){assert.equal(k,'grimoire.hub.v3');return profile===null?null:JSON.stringify(profile)},
    setItem(){writes++}};
  const document={head:{append(l){links.push(l)}},createElement(name){assert.equal(name,'link');return {}}};
  runInNewContext(script,{localStorage,document});
  assert.equal(writes,0);return links.map(l=>l.href);
 }
 assert.deepEqual(loaded(original),['./tauren-shaman-storm-p16.webp']);
 assert.deepEqual(loaded({...original,classe:'Druide'}),['./shaaby-mulgore.webp']);
 assert.deepEqual(loaded({...original,race:'MortVivant',classe:'Démoniste'}),['./forsaken-warlock-premium.webp']);
 assert.deepEqual(loaded({...original,onboarded:false}),[]);
 assert.deepEqual(loaded({...original,race:'Orc'}),[]);
 assert.deepEqual(loaded(null),[]);
});
test('P16: real dashboard CI fixture adds only a synthetic shaman profile',()=>{
 const fixtures=readFileSync(new URL('./helpers/binch-p14-screenshot-fixtures.mjs',import.meta.url),'utf8');
 assert.ok(fixtures.includes("race:'Tauren',classe:'Chaman'"));
 assert.ok(fixtures.includes("'.p14-preview-'+name+'.html'"));
 assert.ok(!html.includes('p14-preview-storm.html'));
});

test('P16 first-fold correction keeps original commands reachable with less overhead',()=>{
 const css=read('premium-firstfold-p16.css');
 const nav=read('premium-mobile-sections-p14.js');
 const ost=read('soundscape.js');
 const quick=read('ultimate-quicknav.js');
 assert.ok(html.includes('./premium-firstfold-p16.css?v=002'));
 assert.ok(html.includes('./premium-mobile-sections-p14.js?v=005'));
 assert.ok(css.includes('#app .app-head > .app-tools'),'real header wrapper targeted');
 assert.ok(css.includes('grid-template-columns:minmax(108px,.94fr) minmax(0,1.4fr)'));
 assert.ok(css.includes('#app .app-head .app-tools #mini-name'));
 assert.ok(css.includes('padding-top:clamp(230px,63vw,295px)'),'name should appear on first viewport');
 assert.ok(css.includes('max-width:390px'));
 assert.ok(css.includes('#binch-quicknav-launch.p16-nav-search'));
 assert.ok(css.includes('#binch-ost.p16-nav-ost'));
 assert.ok(css.includes('.binch-ost-body'),'OST settings accessible within menu');
 assert.ok(nav.includes("placeUtility($('#binch-quicknav-launch'),'p16-nav-search','first')"));
 assert.ok(nav.includes("placeUtility($('#binch-ost'),'p16-nav-ost','last')"));
 assert.ok(nav.includes("placeUtility($('#app .profile-switch'),'p16-nav-switch','last')"));
 assert.ok(nav.includes("placeUtility($('#binch-display-comfort'),'p16-nav-comfort','last')"));
 assert.ok(read('tauren-shaman-storm-p16.css').includes('binch-storm-glimmer 25s'));
 assert.ok(css.includes('#binch-display-comfort.p16-nav-comfort'));
 assert.ok(nav.includes('parent.insertBefore(node,original.next?.parentElement===parent?original.next:null)'));
 assert.ok(ost.includes("shell.id='binch-ost'"));
 assert.ok(quick.includes("launch.id='binch-quicknav-launch'"));
 assert.ok(!css.includes('display:none!important}#binch-profile-trigger'),'do not hide profile button');
});

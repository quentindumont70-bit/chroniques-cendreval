import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const source=name=>readFileSync(new URL('../public/binch/'+name,import.meta.url),'utf8');
function harness(initial='dusk'){
 const data=new Map([['binch.visual.ambience.v1',initial]]);
 const nodes={},portalButtons=[],ambienceButtons=[],clicked=[];
 class Element{
  constructor(tag){this.tag=tag;this.dataset={};this.children=[];this.attributes={};this.textContent='';this.disabled=false}
  append(...items){this.children.push(...items);if(this.id==='binch-renaissance-ambiences')ambienceButtons.push(...items.filter(x=>x.dataset?.ambience));if(this.id==='binch-renaissance-portals')portalButtons.push(...items.filter(x=>x.dataset?.to));}
  prepend(...items){this.children.unshift(...items)}
  after(item){nodes.passages=item}
  setAttribute(k,v){this.attributes[k]=v}
  addEventListener(k,fn){this['on'+k]=fn}
  querySelector(k){return k==='strong'?this.children.flatMap(x=>x.children||[]).find(x=>x.tag==='strong'):null}
 }
 const copy=new Element('div');
 const hero=new Element('section');hero.querySelector=s=>s==='.binch-kicker'?{parentElement:copy}:null;
 const home={querySelector:s=>s==='.binch-character-card'?hero:null};
 const tab=id=>({dataset:{page:id},click(){clicked.push(id)}});
 const tabs=['progression','specs','metiers','gm','command','tresors'].map(tab);
 const nav={querySelectorAll:()=>tabs};
 const root={dataset:{}};
 const document={
  readyState:'loading',documentElement:root,createElement:tag=>new Element(tag),addEventListener(){},
  getElementById:id=>id==='binch-adventure-home'?home:id==='binch-renaissance-ambiences'?hero.children.find(x=>x.id===id):null,
  querySelector:s=>s==='#app nav.nav'?nav:null,
  querySelectorAll:s=>s.includes('button[data-ambience]')?ambienceButtons:s.includes('.binch-renaissance-portal')?portalButtons:[]
 };
 const sandbox={document,window:{scrollTo(){},addEventListener(){}},localStorage:{getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)}};
 const marker="document.addEventListener('binch:adventure-ready',mount);";
 assert.ok(source('visual-renaissance.js').includes(marker));
 runInNewContext(source('visual-renaissance.js').replace(marker,"globalThis.__probe={mount,readAmbience,selectAmbience,applyAmbience,navigation,navigate,refreshPortals};\n"+marker),sandbox);
 return {p:sandbox.__probe,root,nodes,hero,portalButtons,ambienceButtons,clicked,data};
}
test('Renaissance : ambiance persistante et sélection sans mutation WoW',()=>{
 const x=harness('moon');x.p.applyAmbience();assert.equal(x.root.dataset.binchAmbience,'moon');
 assert.equal(x.p.selectAmbience('embers'),true);assert.equal(x.data.get('binch.visual.ambience.v1'),'embers');
 assert.equal(x.p.selectAmbience('hacked'),false);assert.equal(x.root.dataset.binchAmbience,'embers');
 assert.equal(x.p.readAmbience(),'embers');
});
test('Renaissance : portails naviguent vers les vraies rubriques, montage idempotent',()=>{
 const x=harness();assert.equal(x.p.mount(),true);assert.equal(x.p.mount(),true);
 assert.equal(x.nodes.passages.children.length,6);
 assert.equal(x.hero.children.filter(node=>node.id==='binch-renaissance-ambiences').length,1);
 assert.equal(x.ambienceButtons.length,3);
 assert.ok(x.portalButtons.every(b=>b.disabled===false));
 assert.equal(x.portalButtons.filter(b=>b.disabled).length,0);
 assert.equal(x.p.navigate('specs'),true);assert.deepEqual(x.clicked,['specs']);
 assert.equal(x.p.navigate('module-qui-n-existe-pas'),false);
 assert.equal(x.p.navigate('tresors'),true);assert.deepEqual(x.clicked,['specs','tresors']);
 x.ambienceButtons[1].onclick();assert.equal(x.root.dataset.binchAmbience,'moon');
 assert.equal(x.ambienceButtons[1].attributes['aria-pressed'],'true');
});
test('Renaissance : image originale, accessibilité mobile et animation réduite',()=>{
 const svg=source('renaissance-citadel.svg'),css=source('visual-renaissance.css'),html=source('index.html');
 assert.match(svg,/<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
 assert.match(svg,/<\/svg>/);assert.match(svg,/<title|aria-label=/);
 assert.match(css,/renaissance-citadel\.svg/);
 assert.match(css,/@media\(max-width:720px\)/);
 assert.match(css,/@media\(max-width:420px\)/);
 assert.match(css, /prefers-reduced-motion:reduce/);
 assert.match(css,/:focus-visible/);
 assert.match(css, /html\[data-binch-ambience=moon\]/);
 assert.match(css, /html\[data-binch-ambience=embers\]/);
 for(const cls of ['druid','warrior','mage','priest','paladin','rogue','hunter','shaman','warlock'])assert.ok(css.includes('html[data-binch-identity='+cls+']'),'auras: '+cls);
 for(const ancestry of ['tauren','orc','troll','undead','human','elf','dwarf','gnome'])assert.ok(css.includes('html[data-binch-ancestry='+ancestry+']'),'runes: '+ancestry);
 const worlds=source('visual-renaissance-worlds.css');
 assert.match(worlds,/#onboarding/);
 assert.match(worlds,/#page-progression/);
 assert.match(worlds,/#page-metiers/);
 assert.match(worlds,/#page-gm/);
 assert.match(worlds,/#page-specs/);
 assert.match(worlds,/prefers-reduced-motion:reduce/);
 assert.ok(html.includes('./visual-renaissance-worlds.css?v=001'));

 assert.ok(html.indexOf('./visual-renaissance.css?v=001')>html.indexOf('./ultimate-identities.css?v=001'),'design loaded after class theme');
 assert.ok(html.indexOf('./visual-renaissance.js?v=001')>html.indexOf('./player-home.js'),'home mounted before visual enhancement');
 assert.equal(html.match(/\.\/visual-renaissance\.js\?v=001/g)?.length,1);
});
test('Renaissance P2 : neuf vrais paysages originaux distincts branchés aux neuf classes',()=>{
 const css=source('visual-renaissance.css');
 const classes=['druid','warrior','mage','priest','paladin','rogue','hunter','shaman','warlock'];
 const bodies=[];
 for(const cls of classes){
  const filename='renaissance-world-'+cls+'.svg';
  const artwork=source(filename);
  assert.ok(artwork.includes('viewBox="0 0 1600 760"'),filename+' ratio cinématique');
  assert.ok(artwork.includes('aria-label='),filename+' accessible');
  assert.ok(artwork.length>2000,filename+' must be a substantive original vector');
  assert.ok(!/https?:\/\//.test(artwork.replace('http://www.w3.org/2000/svg','')),filename+' no external media');
  assert.ok(css.includes('html[data-binch-identity='+cls+']{--br-world-art:url("./'+filename+'")}'),cls+' must use its own art');
  bodies.push(artwork);
 }
 assert.equal(new Set(bodies).size,9,'each class has its own scene rather than a recolor');
 assert.match(css, /var\(--br-class-aura\),var\(--br-scene-glow\),var\(--br-world-art\)/);
 assert.ok(css.includes(':root{--br-world-art:url("./renaissance-citadel.svg")}'),'unknown classes have a safe fallback');
});

test('Renaissance P2 : trésors, Faith et GM empruntent des scènes sans modifier les données',()=>{
 const css=source('visual-renaissance-chambers.css'),html=source('index.html');
 for(const selector of [
  '#page-gm #binch-gm-watch',
  '#page-gm #binch-gm-workspace',
  '#page-command #binch-faith-advisor',
  '#page-command .binch-faith-action',
  '#page-tresors .binch-treasure-card',
  '#page-hub #binch-profile-exhibit'
 ]) assert.ok(css.includes(selector),'missing visual treatment for '+selector);
 assert.ok(css.includes('renaissance-world-warrior.svg'));
 assert.ok(css.includes('renaissance-world-mage.svg'));
 assert.ok(css.includes('renaissance-world-warlock.svg'));
 assert.ok(css.includes('prefers-reduced-motion:reduce'));
 assert.ok(css.includes('forced-colors:active'));
 assert.ok(html.includes('./visual-renaissance-chambers.css?v=001'));
 assert.ok(html.indexOf('./visual-renaissance-chambers.css?v=001')>html.indexOf('./ultimate-identities.css?v=001'));
 const js=source('visual-renaissance.js');
 assert.ok(!js.includes('fetch('),'artwork must not trigger remote services');
 assert.ok(!js.includes('BinchRewards.'),'ornaments must not award treasure');
});

test('Atelier visuel : neuf paysages disponibles dans une galerie sans données WoW',()=>{
 const gallery=source('renaissance-atelier.html');
 assert.ok(gallery.includes('<!doctype html>'));
 assert.ok(gallery.includes('name="viewport"'));
 for(const id of ['druid','warrior','mage','priest','paladin','rogue','hunter','shaman','warlock']){
  assert.ok(gallery.includes('data-class="'+id+'"'),'class button '+id);
  assert.ok(gallery.includes('src="./renaissance-world-'+id+'.svg"'),'image '+id);
 }
 assert.ok(gallery.includes('aria-pressed='));
 assert.ok(gallery.includes("getElementById('scenes').addEventListener('click'"));
 assert.ok(gallery.includes('Les données, les profils et la Bourse AH ne sont pas modifiés'));
 assert.ok(!gallery.includes('fetch('),'preview is self-contained, no remote fetch');
 assert.ok(gallery.includes('prefers-reduced-motion:reduce'));
});

test('Emblèmes de classe et métiers: originaux et connectés aux interfaces',()=>{
 const css=source('visual-renaissance-details.css'),html=source('index.html');
 for(const cls of ['druid','warrior','mage','priest','paladin','rogue','hunter','shaman','warlock']){
  const file='renaissance-sigil-'+cls+'.svg';
  assert.ok(source(file).includes('aria-label='));
  assert.ok(css.includes('renaissance-sigil-'+cls+'.svg'));
 }
 for(const job of ['mining','engineering']){
  assert.ok(source('renaissance-profession-'+job+'.svg').includes('viewBox="0 0 256 256"'));
  assert.ok(css.includes('renaissance-profession-'+job+'.svg'));
 }
 assert.ok(html.includes('data-job="${esc(j)}"'));
 assert.ok(html.includes('visual-renaissance-details.css?v=001'));
 assert.ok(css.includes('prefers-reduced-motion:reduce'));
 assert.ok(css.includes('forced-colors:active'));
});

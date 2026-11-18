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
 const tabs=['progression','specs','metiers','gm'].map(tab);
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
 assert.equal(x.nodes.passages.children.length,4);
 assert.equal(x.hero.children.filter(node=>node.id==='binch-renaissance-ambiences').length,1);
 assert.equal(x.ambienceButtons.length,3);
 assert.ok(x.portalButtons.every(b=>b.disabled===false));
 assert.equal(x.p.navigate('specs'),true);assert.deepEqual(x.clicked,['specs']);
 assert.equal(x.p.navigate('module-qui-n-existe-pas'),false);
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
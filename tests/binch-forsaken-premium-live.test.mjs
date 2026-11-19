import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,statSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const path=(name)=>new URL('../public/binch/'+name,import.meta.url);
const read=(name)=>readFileSync(path(name),'utf8');
const js=read('visual-identity-compositor.js');
function harness(){
 const original={onboarded:true,race:'MortVivant',classe:'Démoniste',jobs:['Ingénierie','Enchantement'],
  data:{pseudo:'Nécromancien',level:48},checks:[true,false],guild:{rank:'GM'}};
 let writes=0;const document={readyState:'loading',documentElement:{dataset:{},style:{setProperty(){}}},getElementById(){return null},addEventListener(){}};
 const window={addEventListener(){},location:{reload(){}}};
 const localStorage={getItem(){return JSON.stringify(original)},setItem(){writes++}};
 runInNewContext(js,{document,window,localStorage,encodeURIComponent});
 return {api:window.BinchVisualIdentity,root:document.documentElement,original,get writes(){return writes}};
}

test('P13: actual optimized original artwork and mechanical ornament are bundled',()=>{
 const size=statSync(path('forsaken-warlock-premium.webp')).size;
 assert.ok(size>=100000&&size<=500000,'cinematic original should be small enough for mobile');
 const content=readFileSync(path('forsaken-warlock-premium.webp'));
 assert.equal(content.toString('ascii',0,4),'RIFF');
 assert.equal(content.toString('ascii',8,12),'WEBP');
 assert.notDeepEqual(content,readFileSync(path('shaaby-mulgore.webp')),'not a recolor of Shaaby');
 const motif=read('forsaken-occult-gear.svg');
 assert.match(motif,/<svg xmlns="http:\/\/www.w3.org\/2000\/svg"/);
 assert.match(motif,/<title>Sceau d'ingénierie occulte<\/title>/);
 assert.match(motif,/<\/svg>/);
});

test('P13: engine activates Forsaken only for saved exact race and class',()=>{
 const h=harness(),root=h.root;
 h.api.apply(h.original);
 assert.equal(root.dataset.binchForsaken,'true');
 assert.equal(root.dataset.binchShaaby,'false');
 const permutations=[
  {...h.original,race:'Tauren'},
  {...h.original,classe:'Druide'},
  {...h.original,onboarded:false},
  {...h.original,race:'Humain',classe:'Mage'},
  {}
 ];
 for(const p of permutations){
  h.api.apply(p);assert.equal(root.dataset.binchForsaken,'false',JSON.stringify(p));
 }
 h.api.apply({...h.original,race:'Tauren',classe:'Druide'});
 assert.equal(root.dataset.binchShaaby,'true');
 assert.equal(root.dataset.binchForsaken,'false');
 assert.equal(h.writes,0,'no persistent writes to live profile');
 assert.equal(h.original.data.level,48);
 assert.equal(h.original.guild.rank,'GM');
});

test('P13: visual layers are real app, mobile, professions and reforge draft preview',()=>{
 const css=read('forsaken-warlock-premium-live.css');
 const html=read('index.html');
 assert.ok(html.includes('./forsaken-warlock-premium-live.css?v=001'));
 assert.ok(html.includes('./visual-identity-compositor.js?v=005'));
 assert.ok(css.includes('url("./forsaken-warlock-premium.webp")'));
 assert.ok(css.includes('url("./forsaken-occult-gear.svg")'));
 assert.ok(css.includes('#page-hub .binch-character-card'));
 assert.ok(css.includes('#app nav.nav'));
 assert.ok(css.includes('#binch-profile-trigger.identity'));
 assert.ok(css.includes('content:var(--br-job-glyph)'));
 assert.ok(css.includes('content:var(--br-second-glyph)'));
 assert.ok(css.includes('prefers-reduced-motion:reduce'));
 assert.ok(css.includes('data-binch-detail="lite"'));
 assert.ok(css.includes('max-width:760px'));
 assert.ok(css.includes('max-width:390px'));
 assert.ok(css.includes('data-binch-forsaken-preview="true"'));
 assert.ok(js.includes("preview.dataset.binchForsakenPreview=String(c.profile.race==='MortVivant'&&c.profile.classe==='Démoniste')"));
 assert.ok(css.includes('#onboarding:has(#race-choices [data-race="MortVivant"].selected):has(#class-choices [data-classe="Démoniste"].selected)'));
 assert.ok(!css.includes('@import'));
 assert.ok(!css.includes('https://'));
 assert.ok(!css.includes('data:image/webp;base64,'));
});

test('P13: previews are read-only and identity engine keeps existing game data unchanged',()=>{
 const h=harness();
 const c=h.api.compose(h.original);
 assert.equal(c.signature,'Mort-vivant · Démoniste · Ingénierie / Enchantement');
 assert.equal(h.writes,0);
 assert.deepEqual(h.original.checks,[true,false]);
 assert.equal(h.original.data.pseudo,'Nécromancien');
 assert.equal(h.original.guild.rank,'GM');
});

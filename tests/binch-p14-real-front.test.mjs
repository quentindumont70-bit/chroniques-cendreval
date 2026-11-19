import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const read=(name)=>readFileSync(new URL('../public/binch/'+name,import.meta.url),'utf8');
const html=read('index.html');
const css=read('premium-front-p14.css');
const compositor=read('visual-identity-compositor.js');

test('P14: the real app uses binch-front and the legacy card is hidden',()=>{
 assert.match(html,/root\.id='binch-front'/);
 assert.match(html,/#page-hub\.binch-front-ready>\.hero,#page-hub\.binch-front-ready>#hub-cards\{display:none\}/);
 assert.match(html,/class=\\"binch-front-hero\\"/);
 assert.match(html,/id=\\"binch-front-name\\"/);
 assert.match(html,/id=\\"binch-front-level\\"/);
 assert.match(html,/id=\\"binch-front-tasks\\"/);
 assert.match(html,/id=\\"binch-front-craft\\"/);
 assert.match(html,/id=\\"binch-front-guild\\"/);
 assert.ok(html.includes('./premium-front-p14.css?v=001'),'new live style must be linked');
});

test('P14: class artwork is applied to the real visible front, not only gallery or hidden hero',()=>{
 for(const token of [
  '#page-hub.binch-front-ready #binch-front .binch-front-hero',
  'data-binch-shaaby="true"',
  'data-binch-forsaken="true"',
  'url("./shaaby-mulgore.webp")',
  'url("./forsaken-warlock-premium.webp")',
  'var(--p14-hero-art)',
  'var(--p14-ornament)',
  'min-height:clamp(540px',
  '.binch-front-person',
  '.binch-front-stat',
  '#binch-front-name'
 ]){
  assert.ok(css.includes(token),'P14 real home missing '+token);
 }
 assert.ok(css.includes('var(--br-class-world)'),'other classes keep their P10 art');
 assert.ok(!css.includes('@import'),'no extra blocking CSS fetch');
 assert.ok(!css.includes('https://'),'no remote requests');
});

test('P14: actionable dashboard remains functional; no duplicate page, fake data or routes',()=>{
 for(const target of ['progression','sync','crafting','gm','discoveries']){
  assert.ok(html.includes('data-binch-target=\\"'+target+'\\"'),'real action retained: '+target);
 }
 for(const selector of ['.binch-front-task','.binch-front-widget','#page-metiers','#page-progression','#page-gm']){
  assert.ok(css.includes(selector),'real module intentionally themed: '+selector);
 }
 assert.ok(css.includes('#binch-front .binch-front-task:hover'));
 assert.ok(css.includes('focus-visible'));
 assert.ok(!css.includes('display:none!important}#binch-front'),'must not hide real data');
});

test('P14: visual targets adapt mobile, low-motion, lite mode and forced contrast',()=>{
 assert.ok(css.includes('@media(max-width:1050px)'));
 assert.ok(css.includes('@media(max-width:760px)'));
 assert.ok(css.includes('@media(max-width:390px)'));
 assert.ok(css.includes('@media(prefers-reduced-motion:reduce)'));
 assert.ok(css.includes('data-binch-detail="lite"'));
 assert.ok(css.includes('@media(forced-colors:active)'));
 assert.ok(css.includes('background-position:center,80% 34%'),'warlock mobile focus preserved');
 assert.ok(css.includes('background-position:center,77% 36%'),'druid mobile focus preserved');
 assert.ok(css.includes('grid-template-columns:75px 1fr'),'small mobile stat layout');
});

test('P14: reforge materials follow uncommitted preview; persisted identity is unchanged',()=>{
 assert.ok(compositor.includes("dialog.dataset.binchPreview=c.profile.race==='Tauren'&&c.profile.classe==='Druide'?'shaaby'"));
 for(const preview of ['shaaby','forsaken','other']){
  assert.ok(css.includes('data-binch-preview="'+preview+'"'),'missing preview design '+preview);
 }
 assert.ok(css.includes('var(--p14-preview-ornament)'));
 const localStorage={getItem(){return JSON.stringify({onboarded:true,race:'Tauren',classe:'Druide',jobs:['Minage'],data:{pseudo:'Shaaby',level:42}})},setItem(){throw Error('Preview must never write')}};
 const root={dataset:{},style:{setProperty(){}}};
 const document={readyState:'loading',documentElement:root,addEventListener(){},getElementById(){return null}};
 const window={location:{reload(){}},addEventListener(){}};
 runInNewContext(compositor,{window,document,localStorage,encodeURIComponent});
 const c=window.BinchVisualIdentity.compose({race:'MortVivant',classe:'Démoniste',jobs:['Ingénierie','Enchantement']});
 assert.equal(c.signature,'Mort-vivant · Démoniste · Ingénierie / Enchantement');
 assert.equal(root.dataset.binchShaaby,undefined);
});

test('P14: CI captures seed actual real hub using ephemeral synthetic fixtures only',()=>{
 const script=readFileSync(new URL('./helpers/binch-p14-screenshot-fixtures.mjs',import.meta.url),'utf8');
 assert.ok(script.includes("original=readFileSync(resolve(dir,'index.html')"));
 assert.ok(script.includes("localStorage.setItem('grimoire.hub.v3'"));
 assert.ok(script.includes("'.p14-preview-'+name+'.html'"));
 assert.ok(script.includes("profile synthetic")||script.includes("synthetic CI profile"));
 assert.ok(script.includes("race:'Tauren',classe:'Druide'"));
 assert.ok(script.includes("race:'MortVivant',classe:'Démoniste'"));
 assert.ok(!html.includes('p14FixtureStorage'),'temporary fixture not in published app');
});

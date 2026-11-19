import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,statSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const path=name=>new URL('../public/binch/'+name,import.meta.url);
const read=name=>readFileSync(path(name),'utf8');
const source=read('visual-identity-compositor.js');

function instance(){
 const bag={onboarded:true,race:'Tauren',classe:'Druide',jobs:['Herboristerie','Alchimie'],
  data:{pseudo:'Shaaby',level:42},checks:[true,false],map:2,customInfo:'preserve'};
 const writes=[],variables={};
 const root={dataset:{},style:{setProperty(k,v){variables[k]=v}}};
 const document={
  readyState:'loading',
  documentElement:root,
  addEventListener(){},
  getElementById(){return null}
 };
 const win={addEventListener(){},location:{reload(){}}};
 const localStorage={getItem(key){return key==='grimoire.hub.v3'?JSON.stringify(bag):null},
  setItem(key,value){writes.push([key,value])}};
 runInNewContext(source,{window:win,document,localStorage,encodeURIComponent});
 return {api:win.BinchVisualIdentity,root,writes,variables,bag};
}

test('P12: authentic saved Tauren + Druide gets premium flag; all other profiles keep original art',()=>{
 const {api,root,writes,variables}=instance();
 const original={onboarded:true,race:'Tauren',classe:'Druide',jobs:['Herboristerie','Alchimie']};
 api.apply(original);
 assert.equal(root.dataset.binchShaaby,'true');
 assert.equal(root.dataset.brRace,'tauren');
 assert.equal(root.dataset.brClass,'druid');
 assert.match(variables['--br-class-world'],/renaissance-p9-hero-druid\.svg/);
 for(const profile of [
  {...original,race:'MortVivant'},
  {...original,classe:'Démoniste'},
  {...original,onboarded:false},
  {...original,race:'Humain',classe:'Démoniste'},
  {}
 ]){
  api.apply(profile);
  assert.equal(root.dataset.binchShaaby,'false',JSON.stringify(profile));
 }
 assert.equal(writes.length,0,'visual changes must not persist character state');
});

test('P12: flagship is a real optimized image—not a 400KB inline demo—and is reused by companion',()=>{
 const png=statSync(path('shaaby-mulgore.webp'));
 assert.ok(png.size>130000&&png.size<450000,'WebP image should be suitably compressed');
 const css=read('shaaby-premium-live.css'),html=read('index.html');
 assert.ok(css.includes('url("./shaaby-mulgore.webp")'));
 assert.ok(css.includes('url("./shaaby-ivy-ornament.svg")'));
 assert.ok(css.includes('#page-hub .binch-character-card'));
 assert.ok(css.includes('#app nav.nav'));
 assert.ok(css.includes('.binch-reforge-preview[data-binch-shaaby-preview="true"]'));
 assert.ok(css.includes('data-binch-detail="lite"'));
 assert.ok(css.includes('prefers-reduced-motion:reduce'));
 assert.ok(css.includes('max-width:760px'));
 assert.ok(html.includes('./shaaby-premium-live.css?v=002'));
 assert.ok(html.includes('./visual-identity-compositor.js?v=004'));
 assert.ok(!html.includes('data:image/webp;base64'),'do not inline entire artwork into live app');
});

test('P12: premium art requires exact double identity in initial selection and preview is transactional',()=>{
 const css=read('shaaby-premium-live.css');
 assert.ok(css.includes('#onboarding:has(#race-choices [data-race="Tauren"].selected):has(#class-choices [data-classe="Druide"].selected)'));
 assert.ok(css.includes('#onboarding:has(#race-choices [data-race="Tauren"].selected) #class-choices [data-classe="Druide"]'));
 assert.ok(source.includes("preview.dataset.binchShaabyPreview=String(c.profile.race==='Tauren'&&c.profile.classe==='Druide')"));
 assert.ok(source.includes("root.dataset.binchShaaby=String(Boolean(input?.onboarded&&c.profile.race==='Tauren'&&c.profile.classe==='Druide'))"));
 const {api,bag,writes}=instance();
 const c=api.compose({race:'Tauren',classe:'Druide',jobs:['Herboristerie','Alchimie']});
 assert.equal(c.signature,'Tauren · Druide · Herboristerie / Alchimie');
 assert.equal(writes.length,0);
 assert.equal(bag.data.pseudo,'Shaaby');
 assert.deepEqual(bag.checks,[true,false]);
 assert.equal(bag.map,2);
 assert.equal(bag.customInfo,'preserve');
});

test('P12: release remains opt-in, no remote requests or scripted user state writes',()=>{
 const css=read('shaaby-premium-live.css');
 assert.ok(!css.includes('@import'),'no remote CSS/fonts');
 assert.ok(!css.includes('https://'),'only local assets');
 assert.ok(!css.includes('url(data:image/webp;base64'),'no huge CSS payload');
 const svg=read('shaaby-ivy-ornament.svg');
 assert.match(svg,/<svg xmlns="http:\/\/www.w3.org\/2000\/svg"/);
 assert.ok(svg.includes('</svg>'));
 assert.ok(!svg.includes('<image '),'ornaments are local original vectors');
 assert.ok(!css.includes('display:none!important}#app'),'actual app sections remain present');
});

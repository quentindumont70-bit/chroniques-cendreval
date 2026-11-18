import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const read=name=>readFileSync(new URL('../public/binch/'+name,import.meta.url),'utf8');
function harness(initial={}){
 const state=new Map([['grimoire.hub.v3',JSON.stringify(initial)]]);
 const writes=[];
 const localStorage={
  getItem(key){return state.has(key)?state.get(key):null},
  setItem(key,value){writes.push([key,value]);state.set(key,value)}
 };
 const window={addEventListener(){},location:{reload(){}}};
 const document={readyState:'loading',addEventListener(){}};
 const context={window,document,localStorage,encodeURIComponent};
 runInNewContext(read('visual-identity-compositor.js'),context,{filename:'visual-identity-compositor.js'});
 return {api:window.BinchVisualIdentity,state,writes};
}

test('P9: 8 architectures raciales × 9 scènes/classes × 9 signatures de métiers',()=>{
 const {api}=harness();
 const races=['Humain','Nain','Elfe','Gnome','Orc','MortVivant','Tauren','Troll'];
 const classes=['Guerrier','Paladin','Chasseur','Voleur','Prêtre','Chaman','Mage','Démoniste','Druide'];
 const jobs=['Minage','Ingénierie','Herboristerie','Alchimie','Dépeçage','Travail du cuir','Forge','Enchantement','Couture'];
 const raceArt=new Set(),classArt=new Set();
 for(const race of races){
  const c=api.compose({race,classe:'Druide',jobs:['Herboristerie']});
  assert.ok(c.vars['--br-race-art'].startsWith('url("data:image/svg+xml,'));
  raceArt.add(c.vars['--br-race-art']);
 }
 for(const classe of classes){
  const c=api.compose({race:'Tauren',classe});
  classArt.add(c.vars['--br-class-world']);
 }
 for(const job of jobs)assert.equal(api.compose({jobs:[job]}).jobs[0].name,job);
 assert.equal(raceArt.size,8,'each race has genuinely different architectural SVG path');
 assert.equal(classArt.size,9,'each class uses a distinct vector landscape');
});

test('P9: two pilot cinematic artworks are bundled and selected by class',()=>{
 const {api}=harness();
 const druid=api.compose({race:'Tauren',classe:'Druide'});
 const warlock=api.compose({race:'MortVivant',classe:'Démoniste'});
 assert.match(druid.vars['--br-class-world'],/renaissance-p9-hero-druid\.svg/);
 assert.match(warlock.vars['--br-class-world'],/renaissance-p9-hero-warlock\.svg/);
 for(const file of ['renaissance-p9-hero-druid.svg','renaissance-p9-hero-warlock.svg']){
  const svg=read(file);
  assert.ok(svg.startsWith('<svg xmlns="http://www.w3.org/2000/svg"'));
  assert.ok(svg.includes('width="1920" height="1080"'));
  assert.ok(svg.includes('</svg>'));
  assert.ok(!svg.includes('<image '),'no external media');
 }
});

test('P10: nine premium storyboards have different original scenery, all linked to the application and creator',()=>{
 const {api}=harness();
 const world={Guerrier:'warrior',Paladin:'paladin',Chasseur:'hunter',Voleur:'rogue','Prêtre':'priest',Chaman:'shaman',Mage:'mage',Druide:'druid','Démoniste':'warlock'};
 const css=read('visual-renaissance-onboarding.css');
 const scenes=new Set();
 for(const [classe,id] of Object.entries(world)){
  const c=api.compose({race:'Tauren',classe});
  const asset='renaissance-'+(id==='druid'||id==='warlock'?'p9':'p10')+'-hero-'+id+'.svg';
  assert.ok(c.vars['--br-class-world'].includes(asset),'compositor scene: '+classe);
  assert.ok(css.includes('url("./'+asset+'")'),'live wizard scene: '+classe);
  const svg=read(asset);
  assert.ok(svg.includes('<title>')&&svg.includes('<desc>'),'accessible original art: '+classe);
  assert.ok(svg.includes('width="1920" height="1080"'),'full-resolution vector art: '+classe);
  assert.ok(svg.includes('</svg>'),'complete XML art: '+classe);
  assert.ok(!svg.includes('<image '),'no third-party raster dependency: '+classe);
  scenes.add(c.vars['--br-class-world']);
 }
 assert.equal(scenes.size,9);
});

test('P9: composite identity differs structurally, not merely via colour',()=>{
 const {api}=harness();
 const a=api.compose({race:'Tauren',classe:'Druide',jobs:['Herboristerie','Alchimie']});
 const b=api.compose({race:'MortVivant',classe:'Démoniste',jobs:['Ingénierie','Enchantement']});
 assert.notEqual(a.vars['--br-race-art'],b.vars['--br-race-art']);
 assert.notEqual(a.vars['--br-class-world'],b.vars['--br-class-world']);
 assert.notEqual(a.race.architecture,b.race.architecture);
 assert.notEqual(a.classe.id,b.classe.id);
 assert.notEqual(a.jobs[0].effect,b.jobs[0].effect);
 assert.match(a.signature,/Tauren · Druide · Herboristerie \/ Alchimie/);
 assert.match(b.signature,/Mort-vivant · Démoniste · Ingénierie \/ Enchantement/);
});

test('P9: preview and cancel are read-only; explicit commit keeps level, checklists and guild data',()=>{
 const original={
  onboarded:true,step:2,race:'Tauren',classe:'Druide',
  jobs:['Minage','Ingénierie'],data:{pseudo:'Aventurier',level:36,notes:'Rendez-vous de guilde'},
  checks:[true,false,true],map:4,customSetting:{keep:true}
 };
 const {api,state,writes}=harness(original);
 const preview=api.compose({race:'MortVivant',classe:'Démoniste',jobs:['Enchantement','Couture']});
 assert.equal(preview.profile.race,'MortVivant');
 assert.equal(writes.length,0,'preview cannot save');
 assert.deepEqual(JSON.parse(state.get('grimoire.hub.v3')),original,'cancel needs no rollback');
 assert.equal(api.commit(preview.profile),true);
 assert.equal(writes.length,1);
 const saved=JSON.parse(state.get('grimoire.hub.v3'));
 assert.equal(saved.race,'MortVivant');
 assert.equal(saved.classe,'Démoniste');
 assert.deepEqual(saved.jobs,['Enchantement','Couture']);
 assert.deepEqual(saved.data,original.data,'character + guild info preserved');
 assert.deepEqual(saved.checks,original.checks);
 assert.equal(saved.map,4);
 assert.deepEqual(saved.customSetting,{keep:true});
});

test('P9: no third job, duplicate, unknown key or arbitrary CSS/HTML input may enter profile',()=>{
 const {api}=harness();
 const draft=api.clean({
  race:'<img onerror=alert(1)>',classe:'Démoniste',
  jobs:['Minage','Minage','Enchantement','Unknown','Herboristerie']
 });
 assert.equal(draft.race,'Humain');
 assert.deepEqual(Array.from(draft.jobs),['Minage','Enchantement']);
 const c=api.compose(draft);
 assert.ok(!c.vars['--br-race-art'].includes('<img'));
});

test('P9: header and profile reset point to same forge; accessibility, FX opt-out and mobile rules exist',()=>{
 const html=read('index.html'),css=read('visual-identity-compositor.css'),js=read('visual-identity-compositor.js');
 assert.match(html,/id="binch-profile-trigger" type="button"/);
 assert.match(html,/visual-identity-compositor\.css\?v=001/);
 assert.match(html,/visual-identity-compositor\.js\?v=001/);
 assert.match(js,/rebuild\.onclick=event=>/);
 assert.match(js,/modal\.showModal\(\)/);
 assert.match(js,/aria-pressed/);
 assert.match(js,/aria-labelledby/);
 assert.match(js,/window\.location\.reload\(\)/);
 assert.ok(!js.includes('fetch('),'no surprise requests or pricing');
 assert.match(css,/data-br-race=tauren/);
 assert.match(css,/data-br-race=forsaken/);
 assert.match(css,/data-br-class=druid/);
 assert.match(css,/data-br-class=warlock/);
 assert.match(css,/data-br-jobs~="leaves"/);
 assert.match(css,/prefers-reduced-motion:reduce/);
 assert.match(css,/data-binch-detail=lite/);
 assert.match(css,/max-width:720px/);
 assert.match(css,/forced-colors:active/);
 assert.match(css,/env\(|max-height:94dvh/);
});

test('P10: interactive studio has two review presets and safe local-only identity composition',()=>{
 const preview=read('renaissance-p10-showcase.html');
 for(const identifier of ['id="stage-root"','id="race"','id="classe"','id="druid-preset"','id="warlock-preset"','id="lite"','id="scene-title"','id="jobs-count"']){
  assert.ok(preview.includes(identifier),'missing review control '+identifier);
 }
 assert.ok(preview.includes('./visual-identity-compositor.js?v=002'));
 assert.ok(preview.includes('const query=new URLSearchParams(location.search)'));
 assert.ok(preview.includes('buttons.some(b=>b.dataset.job===j)'),'only whitelisted deep-link jobs');
 assert.ok(preview.includes('[...r.options].some(o=>o.value===rq)'),'only whitelisted races');
 assert.ok(preview.includes('[...c.options].some(o=>o.value===cq)'),'only whitelisted classes');
 assert.ok(!preview.includes('localStorage.setItem('),'standalone studio does not commit profile');
 assert.ok(!preview.includes('fetch('),'no external preview backend');
 assert.ok(preview.includes('prefers-reduced-motion:reduce'));
 assert.ok(preview.includes('max-width:760px'));
 const engine=read('visual-identity-compositor.js');
 assert.ok(engine.includes("link.href='./renaissance-p10-showcase.html'"),'real app links to interactive studio');
 const css=read('visual-identity-compositor.css');
 assert.ok(css.includes('binch-character-card:has(.binch-identity-composition)::before'),'legacy duplicate class landscape is disabled once loaded');
});

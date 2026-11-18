import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext, Script} from 'node:vm';

const html=await readFile(new URL('../big-cthu-beta/tournee-complete.html',import.meta.url),'utf8');
const source=html.split('<script type="text/plain" id="tour-source-js">')[1]?.split('</script>')[0];
assert.ok(source,'Le programme de Tournée reste présent');
const from=source.indexOf('let tqProToolsOpen=false;'),to=source.indexOf('\nconst FL=',from);
assert.ok(from>=0&&to>from,'Le cockpit Pro est bien dans la vue principale');
const code=source.slice(from,to);
const view=code.slice(code.indexOf('function viewTour(){'));
const quick=code.slice(0,code.indexOf('function viewTour(){'));

function fixture(opts={}){
 const D=opts.done||[],day='2026-11-19',L=opts.patients||[],notes=opts.notes||[];
 const jc=['D','L','M','M','J','V','S'];
 const ctx={
  day,TODAY:day,JC:jc,DT:s=>new Date(s+'T12:00:00'),
  ROUT:()=>false,list:()=>L,doneSet:()=>D,nxT:()=>null,
  CHR:()=>[day],remOf:()=>false,rel:()=> 'Jeudi',short:d=>d,
  tqStickyText:()=>notes.join('\n'),tqStickyItems:()=>notes,
  esc:s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;'),
  st:{get:(key,fallback)=>key==='swhint'?3:fallback,set(){}},
  remBanner:()=>'',tqPostitBlock:()=>'<section class="tq-sticky">Post-it du jeudi</section>',
  ordoChip:()=>'',bkChip:()=>'',suspBlock:()=>'',absBanner:()=>'',bdayBanner:()=>'',veilleBanner:()=>'',tqWeekWarning:()=>'',vigilBlock:()=>'',endBlock:()=>'',tasksBlock:()=>'',memoBlock:()=>'',absDayList:()=>'',bilanCard:()=>'',chBlock:()=>'',tqChatBlock:()=>'<section class="tq-chat">Assistant</section>',tqWeekBlock:()=>'<section class="tq-week">Semaines</section>',dayBand:()=>'<div class="band">Météo</div>',
  greet:()=> 'Bonjour',who:()=>'',greetName:()=>'',dateFor:()=>new Date(),
  IC:{nav:'',chk:'✓'},fn(){},P:[],nxT:()=>null,
  routeUrl:()=>'',qaForm(){},tqFocusSticky(){},tqOpenAssistant(){},
  pct:0,Math,Date,JSON,Object,Array
 };
 runInNewContext(code+'\nthis.dashboard=tqProOverview;this.tour=viewTour;',ctx,{timeout:1000});
 return {ctx,render:ctx.tour,overview:ctx.dashboard};
}

test('V253 : le script central reste valide, aucun second coffre ni requête réseau ajoutés au cockpit',()=>{
 assert.doesNotThrow(()=>new Script(source));
 assert.doesNotMatch(code,/fetch\s*\(|XMLHttpRequest|localStorage\.setItem|localStorage\.clear|window\.open|crypto\.subtle/);
 assert.match(html,/id="tour-backup-title">Mes sauvegardes/);
});

test('V253 : la journée utile apparaît AVANT les réglages, avec post-it visible',()=>{
 const f=fixture();
 const screen=f.render();
 const at=sel=>screen.indexOf(sel);
 for(const text of ['class="tq-pro-overview"','class="hero"','class="tq-sticky"','class="tq-pro-signals"','class="tq-pro-extras"'])assert.ok(at(text)>=0,text);
 assert.ok(at('class="tq-pro-overview"')<at('class="hero"'));
 assert.ok(at('class="hero"')<at('class="tq-sticky"'));
 assert.ok(at('class="tq-sticky"')<at('class="tq-pro-extras"'));
 assert.match(screen,/Aucun passage/);
 assert.match(screen,/Réglages et outils complémentaires/);
 assert.match(screen,/Assistant · semaines · bilan/);
});

test('V253 : statistiques et rappels sont propres au jour choisi',()=>{
 const f=fixture({patients:[{id:'fictif1'},{id:'fictif2'},{id:'fictif3'}],done:['fictif1'],notes:['Test laboratoire','Prendre les clés']});
 const dashboard=f.overview([{id:'fictif1'},{id:'fictif2'},{id:'fictif3'}],1);
 assert.match(dashboard,/3<\/strong> passages/);
 assert.match(dashboard,/2<\/strong> restants/);
 assert.match(dashboard,/2<\/strong> rappels ce jour/);
 assert.match(dashboard,/Commencer \/ reprendre/);
 assert.match(dashboard,/Ajouter un passage/);
 assert.match(dashboard,/Assistant/);
 assert.doesNotMatch(dashboard,/fictif1|Test laboratoire|Prendre les clés/);
});

test('V253 : l assistant dans les outils repliés reste accessible depuis l en-tête',()=>{
 const a=source.indexOf('function tqOpenAssistant(){'),b=source.indexOf('let tqProToolsOpen=false;',a);
 assert.ok(a>=0&&b>a);
 const src=source.slice(a,b);
 assert.match(src,/document\.getElementById\("tq-pro-extras"\)/);
 assert.match(src,/extra\.open=true;tqProToolsOpen=true/);
 assert.match(src,/querySelector\("\.tq-chat"\)/);
});

test('V253 : les fonctions métier préexistantes ne sont pas supprimées de la vue',()=>{
 for(const fn of ['tqChatBlock','tqWeekBlock','tqPostitBlock','ordoChip','bkChip','suspBlock','absBanner','bdayBanner','veilleBanner','tqWeekWarning','vigilBlock','endBlock','tasksBlock','memoBlock','bilanCard','chBlock','absDayList','shareDay','qaForm','focusMode']){
  assert.ok(view.includes(fn+'('), 'Toujours accessible : '+fn);
 }
 assert.equal((view.match(/heroR\(L,nx\)/g)||[]).length,1);
 assert.equal((view.match(/tqPostitBlock\(\)/g)||[]).length,1);
 assert.match(view,/ontoggle="tqProToolsOpen=this\.open"/);
});

test('V253 : tailles tactiles 48px et mise en page réactive définies pour l accueil',()=>{
 assert.match(html,/\.tq-pro-overview-actions button\{min-height:48px/);
 assert.match(html,/@media\(min-width:720px\)\{\.tq-pro-overview-actions\{grid-template-columns:repeat\(4/);
 assert.match(html,/\.tq-pro-extras>summary\{[^}]*min-height:56px/);
});

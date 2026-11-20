import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext,Script} from 'node:vm';

const read=name=>readFile(new URL('../big-cthu-beta/'+name,import.meta.url),'utf8');
async function source(){
 const html=await read('tournee-complete.html');
 const js=html.split('<script type="text/plain" id="tour-source-js">')[1]?.split('</script>')[0];
 assert.ok(js,'source de Tournée présente');
 const a=js.indexOf('function tqWeekEditorFromFile('),b=js.indexOf('function tqCyclePhaseBlock(',a);
 assert.ok(a>0&&b>a,'raccourci autonome');
 return {html,js,method:js.slice(a,b)};
}
async function fixture({withPatient=true,cycle=true,corrupt=false,openSheet=true,missingEditor=false}={}){
 const {method}=await source();
 const activity=[],nav=[{dataset:{t:'pat'},classList:{toggle(name,value){activity.push(['nav-pat',name,value])}}},{dataset:{t:'tour'},classList:{toggle(name,value){activity.push(['nav-tour',name,value])}}}];
 const classState=new Set(openSheet?['on']:[]);
 const sheet={classList:{contains(name){return classState.has(name)},remove(...names){for(const name of names)classState.delete(name)}}};
 const parent={open:false},details={open:false,scrollIntoView(opts){activity.push(['scroll',opts.block])}};
 const select={value:''},week0={focus(opts){activity.push(['focus',0,opts.preventScroll])}},week1={focus(opts){activity.push(['focus',1,opts.preventScroll])}};
 const status={textContent:''};
 const nodes={'sheet':sheet,'tq-pro-extras':parent,'tq-week-details':details,'tq-week-patient':select,'tq-mode-0':week0,'tq-mode-1':week1,'tq-week-status':status};
 const p={id:'FICTIF-264',n:'Personne fictive',cyc:cycle?{a:'2026-11-02',ch:[1,4],gr:[2,5]}:null};
 const ctx={
  P:withPatient?[p]:[],TQ:{validDay:s=>/^\d{4}-\d{2}-\d{2}$/.test(s)},
  TODAY:'2026-11-20',tqWeeks(strict){activity.push(['check-exceptions',strict]);if(corrupt)throw Error('invalide');return []},
  document:{getElementById:id=>missingEditor&&id==='tq-week-details'?null:nodes[id]||null,querySelectorAll:()=>nav},
  render(){activity.push(['render']);},
  tqWeekFill(){activity.push(['fill',select.value]);},
  toast(msg){activity.push(['toast',msg])},
 };
 runInNewContext('let tab="pat",tqProToolsOpen=false;\n'+method+
 '\nthis.open=tqWeekEditorFromFile;this.getState=()=>({tab,tqProToolsOpen});',ctx,{timeout:1000});
 return {ctx,activity,nodes,p,nav,getState:ctx.getState,open:ctx.open,classState};
}
test('V264 : la fiche propose les deux raccourcis tactiles et conserve Inverser',async()=>{
 const {js}=await source(),start=js.indexOf('function tqCyclePhaseBlock('),end=js.indexOf('async function tqCyclePhaseSwitchById(',start);
 assert.ok(start>0&&end>start);
 const block=js.slice(start,end);
 assert.match(block,/✎ Ajuster cette semaine/);
 assert.match(block,/✎ Ajuster la semaine prochaine/);
 assert.match(block,/tqWeekEditorFromFile\('\+esc\(JSON\.stringify\(p\.id\)\)\+',0\)/);
 assert.match(block,/tqWeekEditorFromFile\('\+esc\(JSON\.stringify\(p\.id\)\)\+',1\)/);
 assert.match(block,/⇄ Inverser Granocytes \/ chimio/);
 assert.match(block,/Exception manuelle prioritaire/);
});
test('V264 : depuis fiche, bon patient et bonne semaine présélectionnés dans éditeur existant',async()=>{
 const f=await fixture();
 assert.equal(f.open('FICTIF-264',1),true);
 assert.equal(f.getState().tab,'tour');
 assert.equal(f.getState().tqProToolsOpen,true);
 assert.equal(f.classState.has('on'),false,'la fiche se ferme pour éviter les IDs dupliqués');
 assert.equal(f.nodes['tq-week-patient'].value,'FICTIF-264');
 assert.equal(f.nodes['tq-pro-extras'].open,true);
 assert.equal(f.nodes['tq-week-details'].open,true);
 assert.ok(f.activity.some(x=>x[0]==='fill'&&x[1]==='FICTIF-264'));
 assert.ok(f.activity.some(x=>x[0]==='focus'&&x[1]===1&&x[2]===true));
 assert.ok(f.activity.some(x=>x[0]==='nav-tour'&&x[2]===true));
 assert.match(f.nodes['tq-week-status'].textContent,/semaine prochaine/);
 assert.equal(f.activity.filter(x=>x[0]==='render').length,1);
});
test('V264 : première semaine préselectionnée sans modifier les patients',async()=>{
 const f=await fixture(),before=JSON.stringify(f.ctx.P);
 assert.equal(f.open('FICTIF-264',0),true);
 assert.ok(f.activity.some(x=>x[0]==='focus'&&x[1]===0));
 assert.match(f.nodes['tq-week-status'].textContent,/cette semaine/);
 assert.equal(JSON.stringify(f.ctx.P),before);
});
test('V264 : patient manquant, cycle absent, semaine invalide => aucune transition',async()=>{
 for(const opt of [{withPatient:false},{cycle:false}]){
  const f=await fixture(opt);
  assert.equal(f.open('FICTIF-264',0),false);
  assert.equal(f.getState().tab,'pat');
  assert.equal(f.activity.filter(x=>x[0]==='render').length,0);
 }
 const f=await fixture();
 assert.equal(f.open('FICTIF-264',3),false);
 assert.equal(f.getState().tab,'pat');
});
test('V264 : exceptions illisibles => aucune navigation ni modification et message prudent',async()=>{
 const f=await fixture({corrupt:true});
 assert.equal(f.open('FICTIF-264',1),false);
 assert.equal(f.getState().tab,'pat');
 assert.equal(f.classState.has('on'),true);
 assert.ok(f.activity.some(x=>x[0]==='toast'&&/aucune donnée modifiée/.test(x[1])));
 assert.equal(f.activity.filter(x=>x[0]==='render').length,0);
});
test('V264 : pas de navigation intempestive si la fiche n est plus ouverte',async()=>{
 const f=await fixture({openSheet:false});
 assert.equal(f.open('FICTIF-264',0),false);
 assert.equal(f.activity.filter(x=>x[0]==='render').length,0);
});
test('V264 : éditeur absent => message explicite, aucune sauvegarde fictive',async()=>{
 const f=await fixture({missingEditor:true});
 assert.equal(f.open('FICTIF-264',0),false);
 assert.ok(f.activity.some(x=>x[0]==='toast'&&/Aucune modification/.test(x[1])));
 assert.equal(f.activity.some(x=>x[0]==='fill'),false);
});
test('V264 : passage par le véritable éditeur, sauvegarde toujours confirmée',async()=>{
 const {js,html}=await source();
 assert.match(js,/function tqWeekBlock\(\)/);
 assert.match(js,/function tqWeekFill\(\)/);
 assert.match(js,/function tqWeekPlanned\(\)/);
 assert.match(js,/async function tqSaveWeekDecisions\(plan\)/);
 assert.match(js,/await tqCommitVaultKey\(TQ_WEEK_KEY,JSON\.stringify\(next\)/);
 assert.match(js,/tqWeekEditorFromFile\(pid,weekIndex\)/);
 assert.match(html,/id="tour-save-strip"/);
 assert.doesNotThrow(()=>new Script(js));
});
test('V264 : CSS compact sur iPhone, sans transmission, et cache public à jour',async()=>{
 const [css,sw,plan,pkg]=await Promise.all([
  read('tournee-v263-calendar.css'),read('sw.js'),
  readFile(new URL('../docs/tournee-pro/PLAN-DE-LANCEMENT.md',import.meta.url),'utf8'),
  readFile(new URL('../package.json',import.meta.url),'utf8')
 ]);
 assert.match(css,/\.tq-cycle-edit-actions\{/);
 assert.match(css,/min-height:48px/);
 assert.match(css,/@media\(max-width:350px\)/);
 assert.match(css,/focus-visible/);
 assert.doesNotMatch(css,/@import|url\(|https?:\/\//);
 assert.match(sw,/big-cthu-public-v2-v265/);
 assert.match(sw,/'\.\/tournee-v263-calendar\.css'/);
 assert.match(plan,/Golipette V264/);
 assert.match(pkg,/tests\/tournee-v264-direct-week-editor\.test\.mjs/);
 const {method}=await source();
 assert.doesNotMatch(method,/fetch\s*\(|XMLHttpRequest|indexedDB|localStorage|TOUR_STORE\.(?:set|remove)Item/);
});

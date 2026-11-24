import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext,Script} from 'node:vm';

const read=name=>readFile(new URL('../big-cthu-beta/'+name,import.meta.url),'utf8');
const WEEK0='2026-11-16',WEEK1='2026-11-23';
async function source(){
 const html=await read('tournee-complete.html');
 const js=html.split('<script type="text/plain" id="tour-source-js">')[1]?.split('</script>')[0];
 assert.ok(js);
 const start=js.lastIndexOf('function tqWeekDate('),end=js.indexOf('/* ===== Local text commands',start);
 assert.ok(start>0&&end>start,'éditeur réel des semaines, version actuellement active');
 return {html,js,part:js.slice(start,end)};
}
async function fixture({target=0,records=[],confirmation=true,hasCycle=true,saveError=false}={}){
 const {part}=await source(),events=[];
 const p={id:'FICTIF-V265',n:'Personne fictive',cyc:hasCycle?{a:'2026-11-02',ch:[1,4],gr:[2,5]}:null};
 const rows=[
  [0,1,2,3,4,5,6].map(day=>({dataset:{day:String(day)},checked:[1,4].includes(day),disabled:false})),
  [0,1,2,3,4,5,6].map(day=>({dataset:{day:String(day)},checked:[2,5].includes(day),disabled:false}))
 ];
 const nodes={
  'tq-week-patient':{value:p.id},
  'tq-mode-0':{value:'ch'},
  'tq-mode-1':{value:'gr'},
  'tq-week-status':{textContent:''}
 };
 let lastWrite=null;
 const ctx={
  P:[p],TODAY:'2026-11-20',tqWeekTargetIndex:target,JC:['Dim','Lun','Mar','Mer','Jeu','Ven','Sam'],
  TQ:{
   monday:()=>WEEK0,
   add:(s,n)=>{const d=new Date(s+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10)},
   validDays:days=>Array.isArray(days)&&days.length>0&&days.every(day=>Number.isInteger(day)&&day>=0&&day<=6),
   cycleDays:(c,m)=>c&&c[m],
   validateList:items=>Array.isArray(items),
   weekMode:(_,week)=>week===WEEK0?'ch':'gr'
  },
  document:{
   getElementById:id=>nodes[id]||null,
   querySelectorAll:selector=>{const match=selector.match(/^#tq-days-(\d) input\[data-day\]$/);return match?rows[Number(match[1])]:[]}
  },
  esc:v=>String(v).replace(/[&<>"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch])),
  short:date=>date,
  tqOverride:(_patient,week)=>records.find(x=>x.pid===p.id&&x.week===week)||null,
  tqWeeks:()=>records.slice(),
  tqMakeWeek:(patient,week,mode,days)=>({pid:patient.id,week,mode,days}),
  tqDescribeWeek:entry=>entry.week+' · '+entry.mode,
  TOUR_STORE:{getItem:()=> 'ancien-coffre'},
  TQ_WEEK_KEY:'fictive-key',
  tqCommitVaultKey:async(key,value,old)=>{events.push(['save',key,old]);if(saveError)throw Error('écriture refusée');lastWrite=JSON.parse(value)},
  confirm:message=>{events.push(['confirm',message]);return confirmation},
  render:()=>events.push(['render']),toast:msg=>events.push(['toast',msg])
 };
 runInNewContext(part+'\nthis.api={tqWeekRow,tqWeekBlock,tqWeekFill,tqWeekPlanned,tqSaveWeekDecisions,tqWeekApply,tqWeekInvert};',ctx,{timeout:1000});
 return {ctx,p,nodes,rows,events,api:ctx.api,written:()=>lastWrite};
}
test('V265 : depuis une fiche, éditer cette semaine prépare une seule décision',async()=>{
 const f=await fixture({target:0});
 const planned=f.api.tqWeekPlanned();
 assert.equal(planned.p.id,f.p.id);
 assert.equal(planned.decisions.length,1);
 assert.equal(planned.decisions[0].week,WEEK0);
 assert.equal(planned.decisions[0].mode,'ch');
 assert.deepEqual(Array.from(planned.decisions[0].days),[1,4]);
});
test('V265 : la semaine suivante est la seule sélectionnée quand le raccourci pointe sur elle',async()=>{
 const f=await fixture({target:1});
 const result=f.api.tqWeekPlanned();
 assert.equal(result.decisions.length,1);
 assert.equal(result.decisions[0].week,WEEK1);
 assert.deepEqual(Array.from(result.decisions[0].days),[2,5]);
});
test('V265 : depuis l éditeur normal, la modification des deux semaines reste disponible',async()=>{
 const f=await fixture({target:null});
 const plan=f.api.tqWeekPlanned();
 assert.equal(plan.decisions.length,2);
 assert.deepEqual(Array.from(plan.decisions.map(x=>x.week)),[WEEK0,WEEK1]);
 const panel=f.api.tqWeekBlock();
 assert.match(panel,/Enregistrer les deux semaines/);
 assert.match(panel,/onclick="tqWeekInvert\(\)"/);
 assert.doesNotMatch(panel,/seule cette semaine sera enregistrée/);
});
test('V265 : panneau ciblé masque les contrôles de l autre semaine et son inversion groupée',async()=>{
 const f=await fixture({target:0});
 const html=f.api.tqWeekBlock();
 assert.match(html,/Enregistrer cette semaine/);
 assert.match(html,/class="tq-week tq-week-targeted"/);
 assert.match(html,/seule cette semaine sera enregistrée/);
 assert.doesNotMatch(html,/onclick="tqWeekInvert\(\)"/);
 assert.match(html,/data-week="2026-11-16" >/);
 assert.match(html,/data-week="2026-11-23" hidden>/);
 const next=await fixture({target:1});
 assert.match(next.api.tqWeekBlock(),/data-week="2026-11-16" hidden>/);
 assert.match(next.api.tqWeekBlock(),/data-week="2026-11-23" >/);
});
test('V265 : enregistrer la prochaine semaine préserve toutes les exceptions non visées',async()=>{
 const original=[
  {pid:'FICTIF-V265',week:WEEK0,mode:'ch',days:[1,4]},
  {pid:'FICTIF-V265',week:WEEK1,mode:'gr',days:[2,5]},
  {pid:'AUTRE-FICTIF',week:WEEK0,mode:'gr',days:[1]}
 ];
 const f=await fixture({target:1,records:original});
 f.api.tqWeekFill();
 f.nodes['tq-mode-1'].value='ch';
 f.rows[1].forEach(c=>{c.checked=[1,4].includes(Number(c.dataset.day))});
 const applied=await f.api.tqSaveWeekDecisions(f.api.tqWeekPlanned());
 assert.equal(applied,true);
 const updated=f.written();
 assert.equal(updated.length,3);
 assert.deepEqual(updated.find(x=>x.pid==='FICTIF-V265'&&x.week===WEEK0),original[0]);
 assert.deepEqual(updated.find(x=>x.pid==='AUTRE-FICTIF'),original[2]);
 assert.deepEqual(updated.find(x=>x.pid==='FICTIF-V265'&&x.week===WEEK1),{pid:'FICTIF-V265',week:WEEK1,mode:'ch',days:[1,4]});
 assert.match(f.events.find(x=>x[0]==='confirm')[1],/2026-11-23/);
 assert.doesNotMatch(f.events.find(x=>x[0]==='confirm')[1],/2026-11-16/);
});
test('V265 : sélectionner cycle habituel supprime seulement exception de la semaine ciblée',async()=>{
 const existing=[
  {pid:'FICTIF-V265',week:WEEK0,mode:'ch',days:[1,4]},
  {pid:'FICTIF-V265',week:WEEK1,mode:'gr',days:[2,5]}
 ];
 const f=await fixture({target:0,records:existing});
 f.nodes['tq-mode-0'].value='auto';
 const plan=f.api.tqWeekPlanned();
 assert.equal(plan.decisions[0].mode,'auto');
 assert.equal(await f.api.tqSaveWeekDecisions(plan),true);
 assert.deepEqual(f.written(),[existing[1]]);
});
test('V265 : annuler confirmation ou subir une panne ne réécrit aucune exception',async()=>{
 const cancelled=await fixture({target:0,confirmation:false});
 assert.equal(await cancelled.api.tqSaveWeekDecisions(cancelled.api.tqWeekPlanned()),false);
 assert.equal(cancelled.written(),null);
 const failed=await fixture({target:1,saveError:true});
 await assert.rejects(failed.api.tqSaveWeekDecisions(failed.api.tqWeekPlanned()),/écriture refusée/);
 assert.equal(failed.written(),null);
});
test('V265 : aucune inversion groupée n est effectuée en mode semaine ciblée',async()=>{
 const f=await fixture({target:0});
 const before=f.nodes['tq-mode-0'].value;
 f.api.tqWeekInvert();
 assert.equal(f.nodes['tq-mode-0'].value,before);
 assert.match(f.nodes['tq-week-status'].textContent,/seule semaine|une seule semaine/);
 assert.equal(f.written(),null);
});
test('V265 : contrôles des jours incohérents refusés avant une validation métier',async()=>{
 const f=await fixture({target:1});
 f.rows[1].forEach(row=>row.checked=false);
 assert.throws(()=>f.api.tqWeekPlanned(),/Sélectionne au moins un jour/);
 const noCycle=await fixture({target:0,hasCycle:false});
 assert.throws(()=>noCycle.api.tqWeekPlanned(),/cycle est configuré/);
});
test('V265 : raccourci de fiche active la cible avant rendu, sans écrire des données',async()=>{
 const {js}=await source();
 const start=js.indexOf('function tqWeekEditorFromFile('),end=js.indexOf('function tqCyclePhaseBlock(',start);
 const method=js.slice(start,end);
 assert.match(method,/tqWeekTargetIndex=weekIndex/);
 assert.ok(method.indexOf('tqWeekTargetIndex=weekIndex')<method.indexOf('render()'));
 assert.match(method,/tqWeekFill\(\)/);
 assert.match(method,/Seule cette semaine sera enregistrée/);
 assert.doesNotMatch(method,/TOUR_STORE\.(?:set|remove)Item|fetch\s*\(|indexedDB|XMLHttpRequest/);
 assert.match(js,/function render\(\)\{if\(tab!=="tour"\)tqWeekTargetIndex=null/);
 assert.doesNotThrow(()=>new Script(js));
});
test('V265 : CSS, cache offline et feuille de route sont actualisés',async()=>{
 const [css,sw,control,pkg,plan]=await Promise.all([
  read('tournee-v263-calendar.css'),read('sw.js'),read('tournee-controle-iphone.html'),
  readFile(new URL('../package.json',import.meta.url),'utf8'),
  readFile(new URL('../docs/tournee-pro/PLAN-DE-LANCEMENT.md',import.meta.url),'utf8')
 ]);
 assert.match(css,/\.tq-week-slot\[hidden\]\{display:none!important\}/);
 assert.match(css,/\.tq-week \.tq-actions button\{min-height:48px\}/);
 assert.match(sw,/big-cthu-public-v2-v266/);
 assert.match(control,/big-cthu-public-v2-v266/);
 assert.match(sw,/'\.\/tournee-v263-calendar\.css'/);
 assert.match(pkg,/tests\/tournee-v265-single-week-edit\.test\.mjs/);
 assert.match(plan,/Golipette V265/);
});

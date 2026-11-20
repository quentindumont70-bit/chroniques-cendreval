import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext,Script} from 'node:vm';
const read=name=>readFile(new URL('../big-cthu-beta/'+name,import.meta.url),'utf8');
const weekA='2026-11-16',weekB='2026-11-23',weekPast='2026-11-09';
async function core(){
 const src=await read('tournee-quick-core.js'),module={exports:{}};
 runInNewContext(src,{module,Date,JSON,Map,Set,Number,String,Object},{timeout:1000});
 return module.exports;
}
const cycle=()=>({a:'2026-11-02',from:'2026-01-01',ch:[1,4],gr:[2,5]});
async function appPart(){
 const html=await read('tournee-complete.html');
 const source=html.split('<script type="text/plain" id="tour-source-js">')[1]?.split('</script>')[0];
 assert.ok(source);
 const begin=source.indexOf('/* V262 — accessible from an existing patient');
 const stop=source.indexOf('function sx(p)',begin);
 assert.ok(begin>0&&stop>begin);
 return {html,source,part:source.slice(begin,stop)};
}
async function phaseFixture({saveWorks=true,vaultWorks=true,exception=false,confirmResult=true}={}){
 const TQ=await core(),p={id:'patient-fictif',n:'Patient Fictif',cyc:cycle()};
 const saved=[],events=[],ctx={
  P:[p],TQ,TODAY:'2026-11-20',tqWeeks:()=>exception?[{pid:p.id,week:weekA,mode:'ch',days:[1,4]}]:[],
  esc:v=>String(v).replace(/["'<>&]/g,'&amp;'),toast:x=>events.push(x),
  render:()=>events.push('render'),fiche:(id)=>events.push('fiche:'+id),
  confirm:msg=>{events.push('confirm:'+msg);return confirmResult},
  cfgSave:async()=>{saved.push(JSON.parse(JSON.stringify(ctx.P)));return saveWorks},
  ensureVaultSaved:async()=>{if(!vaultWorks)throw Error('coffre indisponible')},
  saveFailure:error=>events.push('saveFailure:'+error.message),
  document:{getElementById:()=>null}
 };
 // V263 : les anciens tests de V262 émulent désormais le calendrier effectif fictif.
 ctx.DT=date=>new Date(date+'T12:00:00');
 ctx.JC=['Dim','Lun','Mar','Mer','Jeu','Ven','Sam'];
 ctx.cyk=(patient,date)=>{
  const ov=TQ.overrideFor(ctx.tqWeeks(),patient.id,date);
  const k=ov?ov.mode:TQ.weekMode(patient.cyc,date);
  return (ov?ov.days:patient.cyc[k]).includes(ctx.DT(date).getDay())?k:'';
 };
 ctx.onDate=(patient,date)=>!!ctx.cyk(patient,date);
 const part=(await appPart()).part;
 runInNewContext(part+'\nthis.api={block:tqCyclePhaseBlock,switch:tqCyclePhaseSwitchById};',ctx,{timeout:1000});
 return {ctx,TQ,events,saved,api:ctx.api,p};
}
test('V262 : inversion de phase limitée aux semaines à venir, sans toucher aux semaines déjà passées',async()=>{
 const TQ=await core(),c=cycle(),originalOld=TQ.weekMode(c,weekPast);
 const originalNow=TQ.weekMode(c,weekA),originalNext=TQ.weekMode(c,weekB);
 assert.equal(originalNow,'ch');assert.equal(originalNext,'gr');
 const flip=TQ.togglePhase(c,'2026-11-20');
 assert.equal(TQ.weekMode(flip,weekPast),originalOld);
 assert.equal(TQ.weekMode(flip,weekA),'gr');
 assert.equal(TQ.weekMode(flip,weekB),'ch');
 assert.equal(JSON.stringify(c),JSON.stringify(cycle()),'l original est intact');
 assert.deepEqual(Array.from(flip.ch),[1,4]);assert.deepEqual(Array.from(flip.gr),[2,5]);
 assert.deepEqual(Array.from(flip.phaseFlips),[weekA]);
 const restored=TQ.togglePhase(flip,weekA);
 assert.equal(TQ.weekMode(restored,weekA),originalNow);
 assert.equal(TQ.weekMode(restored,weekB),originalNext);
 assert.equal(Object.hasOwn(restored,'phaseFlips'),false,'le deuxième appui restaure le cycle initial');
});
test('V262 : changements de phase successifs ne réécrivent pas les semaines historiques',async()=>{
 const TQ=await core();
 const a=TQ.togglePhase(cycle(),weekA);
 const b=TQ.togglePhase(a,'2026-12-04');
 assert.equal(TQ.weekMode(b,weekPast),TQ.weekMode(cycle(),weekPast));
 assert.equal(TQ.weekMode(b,weekA),'gr');
 assert.equal(TQ.weekMode(b,'2026-12-07'),TQ.weekMode(cycle(),'2026-12-07'));
 assert.deepEqual(Array.from(b.phaseFlips),[weekA,'2026-11-30']);
});
test('V262 : valeur mal formée ou historique trop long refusé, aucun remplacement silencieux',async()=>{
 const TQ=await core();
 for(const bad of [[weekB,weekA],['2026-11-20'],Array(53).fill(weekA)]){
  const c={...cycle(),phaseFlips:bad};
  assert.equal(TQ.weekMode(c,weekA),'');
  assert.throws(()=>TQ.togglePhase(c,weekA),/Cycle invalide/);
 }
});
test('V262 : bouton affiché depuis une fiche à cycle, absent des autres fiches',async()=>{
 const f=await phaseFixture(),h=f.api.block(f.p);
 assert.match(h,/Inverser Granocytes \/ chimio/);
 assert.match(h,/Cette semaine/);assert.match(h,/Semaine suivante/);
 assert.match(h,/tqCyclePhaseSwitchById/);
 assert.match(h,/Les semaines antérieures/);
 assert.equal(f.api.block({id:'autre',n:'Sans cycle'}),'');
 const app=(await appPart()).source;
 assert.match(app,/\$\{tqCyclePhaseBlock\(p\)\}/);
 assert.doesNotMatch(app,/p\.n\s*===\s*['"]Bernard/);
});
test('V262 : un clic confirmé sauvegarde le patient par le circuit existant',async()=>{
 const f=await phaseFixture();
 const res=await f.api.switch('patient-fictif');
 assert.equal(res,true);assert.equal(f.saved.length,1);
 assert.equal(f.TQ.weekMode(f.ctx.P[0].cyc,weekA),'gr');
 assert.equal(f.TQ.weekMode(f.p.cyc,weekA),'ch');
 assert.equal(f.ctx.P[0].id,'patient-fictif');
 assert.ok(f.events.includes('fiche:patient-fictif'));
 assert.match(f.events.find(x=>x.startsWith('confirm:')),/Cette semaine : Chimio → Granocytes/);
});
test('V262 : clic annulé et échec de sauvegarde ne valident aucun changement',async()=>{
 const cancel=await phaseFixture({confirmResult:false});
 assert.equal(await cancel.api.switch('patient-fictif'),false);
 assert.equal(cancel.saved.length,0);
 assert.equal(cancel.TQ.weekMode(cancel.ctx.P[0].cyc,weekA),'ch');
 const failed=await phaseFixture({saveWorks:false});
 assert.equal(await failed.api.switch('patient-fictif'),false);
 assert.equal(failed.TQ.weekMode(failed.ctx.P[0].cyc,weekA),'ch');
 assert.equal(failed.events.some(x=>x==='render'),false);
});
test('V262 : exceptions manuelles préexistantes sont signalées et préservées',async()=>{
 const f=await phaseFixture({exception:true});
 const html=f.api.block(f.p);
 assert.match(html,/exceptions manuelles/);
 assert.equal(await f.api.switch('patient-fictif'),true);
 assert.match(f.events.find(x=>x.startsWith('confirm:')),/restent prioritaires/);
 const current=f.TQ.overrideFor(f.ctx.tqWeeks(),f.p.id,weekA);
 assert.equal(current.mode,'ch','l exception garde son mode');
});
test('V262 : coffre incertain n annonce pas de succès, sans déclencher d autre écriture',async()=>{
 const f=await phaseFixture({vaultWorks:false});
 assert.equal(await f.api.switch('patient-fictif'),false);
 assert.equal(f.saved.length,1);
 assert.equal(f.events.some(x=>x==='render'),false);
 assert.match(f.events.join('|'),/non confirmée/);
 assert.match(f.events.join('|'),/saveFailure:/);
});
test('V262 : bandeau compact mais erreur consultable intégralement au toucher',async()=>{
 const {html}=await appPart(),css=await read('tournee-v262-mobile.css');
 assert.match(html,/id="tour-save-details"/);
 assert.match(html,/aria-expanded="false"/);
 assert.match(html,/function tourSaveDetailsToggle\(\)/);
 assert.match(css,/#tour-save-summary\{[^}]*flex-wrap:nowrap/);
 assert.match(css,/#tour-save-text\{[^}]*white-space:nowrap/);
 assert.match(css,/#tour-recovery-direct\{display:none\}/);
 assert.match(css,/#tour-save-strip\[data-state="error"\] #tour-save-details/);
 assert.match(css,/#tour-save-strip\[data-state="error"\]\[data-expanded="true"\] #tour-save-text/);
 assert.match(css,/max-height:none;overflow:visible/);
 assert.match(css,/position:relative;z-index:2/);
 assert.match(css,/min-height:44px/);
});
test('V262 : panneau de détails fonctionne sans toucher à la sauvegarde',async()=>{
 const s=(await read('tournee-complete.html'));
 const begin=s.indexOf('function tourSaveDetailsToggle(){'),end=s.indexOf('function tourSaveMenuToggle(){',begin);
 assert.ok(begin>0&&end>begin);
 const bar={dataset:{state:'error'}},attributes={},button={textContent:'Détails',setAttribute:(name,value)=>attributes[name]=value};
 const ctx={document:{getElementById:id=>id==='tour-save-strip'?bar:button}};
 runInNewContext(s.slice(begin,end)+'\nthis.toggle=tourSaveDetailsToggle;',ctx,{timeout:1000});
 ctx.toggle();assert.equal(bar.dataset.expanded,'true');assert.equal(button.textContent,'Réduire');
 assert.equal(attributes['aria-expanded'],'true');
 ctx.toggle();assert.equal(bar.dataset.expanded,'false');assert.equal(button.textContent,'Détails');
 bar.dataset.state='saved';ctx.toggle();assert.equal(bar.dataset.expanded,'false');
});
test('V262 : cache offline, tests complets et documentation; aucun réseau dans le correctif',async()=>{
 const [sw,pkg,plan,css,coreSource]=await Promise.all([
  read('sw.js'),readFile(new URL('../package.json',import.meta.url),'utf8'),
  readFile(new URL('../docs/tournee-pro/PLAN-DE-LANCEMENT.md',import.meta.url),'utf8'),
  read('tournee-v262-mobile.css'),read('tournee-quick-core.js')
 ]);
 assert.match(sw,/big-cthu-public-v2-v264/);
 assert.match(sw,/'\.\/tournee-v262-mobile\.css'/);
 assert.match(pkg,/tests\/tournee-v262-cycle-switch-banner\.test\.mjs/);
 assert.match(plan,/Golipette V262/);
 assert.doesNotMatch(css,/fetch\s*\(|url\(|@import|tidel_Pl|indexedDB|WebSocket/);
 assert.doesNotMatch(coreSource,/fetch\s*\(|XMLHttpRequest|localStorage|indexedDB|WebSocket/);
 const script=(await appPart()).source;
 assert.doesNotThrow(()=>new Script(script));
});

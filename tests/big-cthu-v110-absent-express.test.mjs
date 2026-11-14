import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';

const read=()=>readFile(new URL('../big-cthu-beta/tournee-complete.html',import.meta.url),'utf8');
const fictional={id:'test-person',n:'PATIENT FICTIF',a:'RUE FICTIVE'};
async function searchFixture(){
 const source=await read(),begin=source.indexOf('function qaFilter(){'),end=source.indexOf('async function qaSave(',begin);
 assert.ok(begin>0&&end>begin);
 const input={value:''},box={innerHTML:''};
 const ctx={document:{getElementById:id=>id==='qas'?input:box},P:[
  {...fictional},...Array.from({length:35},(_,i)=>({id:'f-'+i,n:'PATIENT FICTIF '+i,a:'Adresse imaginaire'}))
 ],day:'2026-11-14',onDate:()=>false,initials:()=> 'PF',esc:t=>t};
 runInNewContext(source.slice(begin,end)+'\nthis.filter=qaFilter;',ctx,{timeout:1000});
 return {input,box,ctx};
}

test('V110: l ajout ne montre aucune liste avant deux caractères',async()=>{
 const f=await searchFixture();
 f.ctx.filter();assert.match(f.box.innerHTML,/au moins 2 caractères/);
 assert.doesNotMatch(f.box.innerHTML,/onclick="qaPick/);
 f.input.value='p';f.ctx.filter();assert.doesNotMatch(f.box.innerHTML,/onclick="qaPick/);
});

test('V110: recherche du patient existant limitée à huit résultats et menu tactile',async()=>{
 const f=await searchFixture();
 f.input.value='patient';f.ctx.filter();
 assert.equal((f.box.innerHTML.match(/onclick="qaPick/g)||[]).length,8);
 const html=await read();
 assert.match(html,/#qal\{max-height:min\(34vh,280px\);overflow-y:auto/);
 assert.match(html,/Nouveau patient \(jamais vu\)/);
});

async function absentFixture({legacy=false,limit=0}={}){
 const source=await read(),begin=source.indexOf('// V110 : une seule action terrain'),end=source.indexOf('async function absenceUpdate(',begin);
 assert.ok(begin>=0&&end>begin);
 const storage=new Map();const initial=Array.from({length:limit},(_,i)=>({id:'old-'+i,patientId:'other',day:'2026-11-13',reason:'Autre',sync:'Sans suite',history:[]}));
 storage.set('tidel_absences_journal_v1',JSON.stringify(initial));
 const flags=new Set(legacy?['test-person']:[]);
 const actions=[],toasts=[];let confirmations=0,writes=0,allows=true;
 const ctx={
  P:[fictional],day:'2026-11-14',Date,Math,
  onDate:()=>true,
  absSet:()=>[...flags],
  setAbs(id,on){if(on)flags.add(id);else flags.delete(id);actions.push(on)},
  TOUR_STORE:{setItem(k,v){assert.equal(k,'tidel_absences_journal_v1');storage.set(k,v)}},
  ABSENCE_KEY:'tidel_absences_journal_v1',
  absenceRead:()=>JSON.parse(storage.get('tidel_absences_journal_v1')),
  absenceCancelRecord:(event,at)=>({...event,cancelled:true,sync:'Sans suite',history:[...event.history,{at,action:'Signalement annulé'}]}),
  confirm:()=>{confirmations++;return allows},
  flush:async()=>{writes++},
  toast:text=>toasts.push(text),
  saveFailure:()=>{},
  ap:()=>({hidden:true,value:''}),absenceFiltersChanged:()=>{}
 };
 runInNewContext(source.slice(begin,end)+'\nthis.toggle=tourAbsenceChange;',ctx,{timeout:1000});
 return {ctx,flags,actions,toasts,confirmations:()=>confirmations,writes:()=>writes,rows:()=>JSON.parse(storage.get('tidel_absences_journal_v1')),allow:v=>{allows=v}};
}

test('V110: confirmer Absent crée un événement auditée, statut et sauvegarde unique',async()=>{
 const f=await absentFixture();
 await f.ctx.toggle('test-person','2026-11-14');
 assert.equal(f.confirmations(),1);
 assert.deepEqual(f.actions,[true]);
 assert.equal(f.writes(),1);
 assert.equal(f.rows().length,1);
 assert.equal(f.rows()[0].reason,'Patient absent');
 assert.equal(f.rows()[0].sync,'À rapprocher');
 assert.equal(f.rows()[0].history.length,1);
});

test('V110: annuler absence après confirmation conserve l historique et restaure le statut',async()=>{
 const f=await absentFixture();
 await f.ctx.toggle('test-person','2026-11-14');
 await f.ctx.toggle('test-person','2026-11-14');
 assert.deepEqual(f.actions,[true,false]);
 assert.equal(f.writes(),2);
 assert.equal(f.rows().length,1);
 assert.equal(f.rows()[0].cancelled,true);
 assert.equal(f.rows()[0].sync,'Sans suite');
 assert.equal(f.rows()[0].history.length,2);
});

test('V110: refus de confirmation et journal saturé ne modifient aucune donnée',async()=>{
 const f=await absentFixture();
 f.allow(false);
 await f.ctx.toggle('test-person','2026-11-14');
 assert.equal(f.rows().length,0);assert.equal(f.writes(),0);assert.equal(f.actions.length,0);
 const full=await absentFixture({limit:500});
 await full.ctx.toggle('test-person','2026-11-14');
 assert.equal(full.rows().length,500);assert.equal(full.writes(),0);
});

test('V110: la liste du jour et son journal utilisent le statut existant, sans copie clinique externe',async()=>{
 const source=await read();
 assert.match(source,/function absDayList\(\)/);
 assert.match(source,/Absences du jour \(/);
 assert.match(source,/tourAbsenceJournalToday\(\)/);
 assert.match(source,/function absTog\(id\).*tourAbsenceChange\(id,day\)/);
 assert.doesNotMatch(source.slice(source.indexOf('// V110 : une seule action terrain'),source.indexOf('async function absenceUpdate(')),/fetch\(|XMLHttpRequest|WebSocket/);
});

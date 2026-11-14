import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';

const read=()=>readFile(new URL('../big-cthu-beta/tournee-complete.html',import.meta.url),'utf8');
async function fixture(){
 const html=await read();
 const start=html.indexOf('// V111 : bloque un double appui');
 const end=html.indexOf('async function absenceUpdate(',start);
 assert.ok(start>0&&end>start);
 let releaseSave,flushes=0,confirmations=0,errors=0;
 const blocked=new Promise(resolve=>{releaseSave=resolve});
 const vault=new Map(),absences=new Set(),notices=[];
 const ctx={
  P:[{id:'patient-fictif',n:'PATIENT INVENTÉ'}],
  day:'2026-11-14',
  onDate:()=>true,Date,Math,JSON,
  absSet:()=>[...absences],
  setAbs:(id,on)=>on?absences.add(id):absences.delete(id),
  TOUR_STORE:{setItem(key,value){vault.set(key,value)}},
  ABSENCE_KEY:'tidel_absences_journal_v1',
  absenceRead:()=>JSON.parse(vault.get('tidel_absences_journal_v1')||'[]'),
  absenceCancelRecord:(x,at)=>({...x,cancelled:true,sync:'Sans suite',history:[...x.history,{at,action:'Annulation de démonstration'}]}),
  confirm:()=>{confirmations++;return true},
  flush:async()=>{flushes++;await blocked},
  toast:msg=>notices.push(msg),
  saveFailure:()=>{errors++},
  ap:()=>({hidden:false,value:''}),absenceFiltersChanged:()=>{}
 };
 runInNewContext(html.slice(start,end)+'\nthis.change=tourAbsenceChange;',ctx,{timeout:1000});
 return {ctx,vault,absences,notices,releaseSave,confirmations:()=>confirmations,flushes:()=>flushes,errors:()=>errors};
}

test('V111: deux taps Absent avant persistance ne créent ni annulation involontaire ni double événement',async()=>{
 const f=await fixture();
 const first=f.ctx.change('patient-fictif','2026-11-14');
 const second=f.ctx.change('patient-fictif','2026-11-14');
 await second;
 assert.equal(f.confirmations(),1);
 assert.equal(f.flushes(),1);
 assert.equal(JSON.parse(f.vault.get('tidel_absences_journal_v1')).length,1);
 assert.equal(f.absences.has('patient-fictif'),true);
 f.releaseSave();
 await first;
 await f.ctx.change('patient-inexistant','2026-11-14');
 assert.equal(f.flushes(),1);
});

test('V111: après la fin de la sauvegarde, annulation confirmée reste non destructive',async()=>{
 const f=await fixture();
 const initial=f.ctx.change('patient-fictif','2026-11-14');
 f.releaseSave();await initial;
 await f.ctx.change('patient-fictif','2026-11-14');
 const rows=JSON.parse(f.vault.get('tidel_absences_journal_v1'));
 assert.equal(rows.length,1);
 assert.equal(rows[0].cancelled,true);
 assert.equal(rows[0].history.length,2);
 assert.equal(f.absences.has('patient-fictif'),false);
 assert.equal(f.confirmations(),2);
});

test('V111: le journal des absences et le statut de tournée utilisent exclusivement le coffre local',async()=>{
 const html=await read();
 const start=html.indexOf('// V111 : bloque un double appui');
 const end=html.indexOf('async function absenceUpdate(',start);
 const js=html.slice(start,end);
 assert.match(js,/TOUR_STORE\.setItem\(ABSENCE_KEY,JSON\.stringify\(updated\)\)/);
 assert.match(js,/await flush\(\)/);
 assert.match(js,/finally\{tourAbsenceBusy=false\}/);
 assert.doesNotMatch(js,/fetch\(|XMLHttpRequest|WebSocket/);
 assert.match(html,/id="tour-security-gate" hidden/);
});

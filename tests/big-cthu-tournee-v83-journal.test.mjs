import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';
const source=()=>readFile(new URL('../big-cthu-beta/tournee-complete.html',import.meta.url),'utf8');
function fixture(html,{fail=false,initial=null}={}){
 const start=html.indexOf("const ABSENCE_KEY='tidel_absences_journal_v1'");
 const end=html.indexOf("ap('tour-absence-open').addEventListener",start);
 assert.ok(start>=0&&end>start,'journal functions present');
 const state={tidel_Pl:JSON.stringify([{id:'synthetic-1',n:'EXEMPLE FICTIF',a:'Adresse fictive'}])};
 if(initial)state.tidel_absences_journal_v1=JSON.stringify(initial);
 let saves=0,shouldFail=fail;
 const elements=Object.fromEntries(['ap-status','ap-from','ap-to','ap-filter-reason','ap-filter-state','ap-patient','ap-summary','ap-events'].map(id=>[id,{value:'',textContent:'',replaceChildren(){},append(){}}]));
 const context={
  document:{getElementById:id=>elements[id]},
  TOUR_STORE:{getItem:key=>state[key]??null,setItem(key,val){assert.match(key,/^tidel_/);state[key]=val}},
  flush:async()=>{saves++;if(shouldFail)throw Error('Disk full')},
  Date,JSON,Map,Array,
 };
 runInNewContext(html.slice(start,end)+
  '\nthis.readJournal=absenceRead;this.dateOK=absenceDateOK;this.saveJournal=absenceSave;this.listPatients=absencePatients;this.amendRecord=absenceAmendRecord;this.cancelRecord=absenceCancelRecord;this.summarizeJournal=absenceSummary;this.hasDuplicate=absenceDuplicate;this.searchSort=absenceSearchAndSort;',
  context,{timeout:1000});
 return {context,state,elements,saves:()=>saves,setFail:v=>{shouldFail=v}};
}
const event=(id='event-1')=>({id,patientId:'synthetic-1',day:'2026-11-13',reason:'Patient absent',note:'Exemple fictif',sync:'À rapprocher',history:[{at:'2026-11-13T18:30:00.000Z',action:'Signalement ajouté'}]});

test('V83: journal commence vide et lit uniquement la base de patients déjà déverrouillée',async()=>{
 const f=fixture(await source());
 assert.equal(f.context.readJournal().length,0);
 assert.equal(f.context.listPatients()[0].id,'synthetic-1');
 assert.equal(f.context.dateOK('2026-11-13'),true);
 assert.equal(f.context.dateOK('2026/11/13'),false);
 assert.equal(f.state.tidel_absences_journal_v1,undefined);
});

test('V83: journal écrit dans le coffre Tournée existant, sans stockage parallèle',async()=>{
 const f=fixture(await source());
 assert.equal(await f.context.saveJournal([event()],[]),true);
 assert.equal(f.saves(),1);
 assert.deepEqual(JSON.parse(f.state.tidel_absences_journal_v1),[event()]);
 assert.equal(f.elements['ap-status'].textContent,'Journal chiffré enregistré sur cet appareil.');
});

test('V83: échec de sauvegarde reste visible et la reprise conserve le journal en mémoire',async()=>{
 const f=fixture(await source(),{fail:true});
 assert.equal(await f.context.saveJournal([event()],[]),false);
 assert.match(f.elements['ap-status'].textContent,/non garanties/);
 assert.equal(f.context.readJournal().length,1);
 f.setFail(false);
 assert.equal(await f.context.saveJournal([event()],[]),true);
});

test('V83: un journal invalide ne doit jamais être remplacé silencieusement',async()=>{
 const f=fixture(await source(),{initial:[{id:'bad-format'}]});
 assert.equal(f.context.readJournal(),null);
 assert.match(f.elements['ap-status'].textContent,/Aucun élément n’a été écrasé/);
 assert.deepEqual(JSON.parse(f.state.tidel_absences_journal_v1),[{id:'bad-format'}]);
});

test('V83: formulaires et historique isolés, aucun appel réseau ou écriture Topaze',async()=>{
 const html=await source();
 assert.match(html,/id="tour-absence-panel" hidden/);
 assert.match(html,/id="tour-absence-open"/);
 assert.match(html,/id="ap-patient"/);
 assert.match(html,/id="ap-filter-reason"/);
 assert.match(html,/id="ap-filter-state"/);
 assert.match(html,/const ABSENCE_KEY='tidel_absences_journal_v1'/);
 assert.match(html,/TOUR_STORE\.setItem\(ABSENCE_KEY,JSON\.stringify\(rows\)\)/);
 assert.match(html,/await flush\(\)/);
 assert.match(html,/un seul coffre/i);
 assert.doesNotMatch(html.slice(html.indexOf('// V83 :'),html.indexOf('const IDLE_LOCK_MS=')),/fetch\(|XMLHttpRequest|WebSocket|localStorage\.(?:setItem|removeItem)|topaze\.fr/i);
});

test('V85: correction auditée préserve le signalement et l ancien motif/observation',async()=>{
 const f=fixture(await source());
 const original=event();
 const revised=f.context.amendRecord(original,{day:'2026-11-12',reason:'Soin non réalisé',note:'Correction fictive'},'2026-11-13T19:00:00.000Z');
 assert.equal(revised.day,'2026-11-12');
 assert.equal(revised.reason,'Soin non réalisé');
 assert.equal(revised.note,'Correction fictive');
 assert.equal(revised.history.length,2);
 assert.equal(revised.history[1].before.reason,'Patient absent');
 assert.equal(revised.history[1].before.note,'Exemple fictif');
 assert.equal(original.history.length,1);
 assert.equal(original.reason,'Patient absent');
 assert.equal(await f.context.saveJournal([revised],[original]),true);
 assert.equal(f.context.readJournal().length,1);
});

test('V85: annulation non destructive et impossibilité de corriger un signalement annulé',async()=>{
 const f=fixture(await source());
 const original=event();
 const cancelled=f.context.cancelRecord(original,'2026-11-13T19:10:00.000Z');
 assert.equal(cancelled.cancelled,true);
 assert.equal(cancelled.sync,'Sans suite');
 assert.equal(cancelled.history.length,2);
 assert.equal(cancelled.id,original.id);
 assert.equal(f.context.cancelRecord(cancelled,'2026-11-13T19:11:00.000Z'),cancelled);
 assert.throws(()=>f.context.amendRecord(cancelled,{day:'2026-11-13',reason:'Autre',note:''},'now'),/annulé/);
 assert.equal(await f.context.saveJournal([cancelled],[original]),true);
 assert.equal(f.context.readJournal()[0].cancelled,true);
});

test('V85: refuse une correction invalide et conserve la trace sans effacement',async()=>{
 const f=fixture(await source());
 const original=event();
 assert.throws(()=>f.context.amendRecord(original,{day:'mauvaise-date',reason:'Autre',note:''},'now'),/invalide/);
 assert.throws(()=>f.context.amendRecord(original,{day:'2026-11-13',reason:'Autre',note:'x'.repeat(201)},'now'),/invalide/);
 assert.equal(f.context.amendRecord(original,{day:original.day,reason:original.reason,note:original.note},'now'),original);
 const html=await source();
 assert.match(html,/Corriger ou annuler ce signalement/);
 assert.match(html,/Annuler ce signalement \(historique conservé\)/);
 assert.doesNotMatch(html.slice(html.indexOf('// V83 :'),html.indexOf('const IDLE_LOCK_MS=')),/TOUR_STORE\.removeItem\(ABSENCE_KEY\)/);
});


test('V87: récapitulatif exclut les signalements annulés du rapprochement',async()=>{
 const f=fixture(await source());
 const base=event('a');
 const cancelled=f.context.cancelRecord({...event('b'),reason:'Soin non réalisé',sync:'À rapprocher'},'2026-11-13T19:00:00.000Z');
 const verified={...event('c'),reason:'Horaire modifié',sync:'Vérifié localement'};
 const stats=f.context.summarizeJournal([base,cancelled,verified]);
 assert.equal(stats.total,3);
 assert.equal(stats.active,2);
 assert.equal(stats.cancelled,1);
 assert.equal(stats.toReview,1);
 assert.equal(stats.reasons['Patient absent'],1);
 assert.equal(stats.reasons['Soin non réalisé'],0);
 assert.equal(stats.reasons['Horaire modifié'],1);
});

test('V87: signalement répété est détecté, sans confondre deux motifs et sans bloquer un événement annulé',async()=>{
 const f=fixture(await source());
 const base=event('a'),cancelled=f.context.cancelRecord(event('b'),'2026-11-13T19:00:00.000Z');
 assert.equal(f.context.hasDuplicate([base],{patientId:'synthetic-1',day:'2026-11-13',reason:'Patient absent'}),true);
 assert.equal(f.context.hasDuplicate([base],{patientId:'synthetic-1',day:'2026-11-13',reason:'Soin non réalisé'}),false);
 assert.equal(f.context.hasDuplicate([cancelled],{patientId:'synthetic-1',day:'2026-11-13',reason:'Patient absent'}),false);
 assert.equal(f.context.hasDuplicate([base],{patientId:'synthetic-1',day:'2026-11-14',reason:'Patient absent'}),false);
});

test('V87: filtres par période et annulation accessibles et aucun changement aux actes ni à Topaze',async()=>{
 const html=await source();
 assert.match(html,/id="ap-filter-cancelled"/);
 assert.match(html,/id="ap-breakdown"/);
 assert.match(html,/filters\.cancelled==='all'/);
 assert.match(html,/signalements annulés sont exclus des totaux actifs/);
 assert.match(html,/absenceDuplicate\(rows,\{patientId,day,reason\}\)/);
 const journalCode=html.slice(html.indexOf('// V83 :'),html.indexOf('const IDLE_LOCK_MS='));
 assert.doesNotMatch(journalCode,/fetch\(|XMLHttpRequest|WebSocket|localStorage\.(?:setItem|removeItem)|topaze\.fr/i);
});

test('V96: recherche sans accent dans patient, motif et observation et tri stable',async()=>{
 const f=fixture(await source());
 const rows=[
  {...event('b'),patientId:'synthetic-1',day:'2026-11-12',reason:'Soin non réalisé',note:'fièvre imaginaire'},
  {...event('c'),patientId:'synthetic-2',day:'2026-11-13',reason:'Patient absent',note:'test synthétique'},
  {...event('a'),patientId:'synthetic-1',day:'2026-11-13',reason:'Patient absent',note:'suivi fictif'}
 ];
 const names=new Map([['synthetic-1','Élodie Fictive'],['synthetic-2','Zéphyr Imaginaire']]);
 const search=(opts)=>f.context.searchSort(rows,opts,names).map(x=>x.id).join(',');
 assert.equal(search({search:'elodie',sort:'newest'}),'a,b');
 assert.equal(search({search:'FIEVRE',sort:'newest'}),'b');
 assert.equal(search({search:'absent',sort:'oldest'}),'c,a');
 assert.equal(search({search:'',sort:'newest'}),'c,a,b');
 assert.equal(search({search:'',sort:'oldest'}),'b,c,a');
 assert.equal(search({search:'',sort:'patient'}),'b,a,c');
 assert.equal(search({search:'inexistant'}),'');
 assert.equal(rows[0].id,'b','no mutation of encrypted journal order');
});
test('V96: recherche reste locale et ne se retrouve pas dans export manuel',async()=>{
 const html=await source();
 assert.match(html,/id="ap-search" type="search"/);
 assert.match(html,/id="ap-sort"/);
 assert.match(html,/ap\('ap-search'\)\.addEventListener\('input',absenceRender\)/);
 assert.match(html,/const filtered=absenceSearchAndSort\(stateFiltered/);
 const code=html.slice(html.indexOf('function absenceFold('),html.indexOf('function absencePeriodReport('));
 assert.doesNotMatch(code,/TOUR_STORE|localStorage|fetch\(|XMLHttpRequest|WebSocket/);
 const topaze=html.slice(html.indexOf('function absenceTopazeText('),html.indexOf('function absenceRender('));
 assert.doesNotMatch(topaze,/ap-search|patientNames|\.note\b|patientId/);
});

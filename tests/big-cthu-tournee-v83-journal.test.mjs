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
  '\nthis.readJournal=absenceRead;this.dateOK=absenceDateOK;this.saveJournal=absenceSave;this.listPatients=absencePatients;',
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

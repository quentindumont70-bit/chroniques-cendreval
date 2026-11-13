import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';

const read=()=>readFile(new URL('../big-cthu-beta/tournee-complete.html',import.meta.url),'utf8');
const patients=[{id:'fiction-01',n:'PERSONNE INVENTÉE',a:'Adresse imaginaire'}];
const events=[
 {id:'demo-a',patientId:'fiction-01',day:'2026-11-13',reason:'Patient absent',note:'Exemple fictif',sync:'À rapprocher',history:[{at:'2026-11-13T08:00:00Z',action:'Signalement fictif'}]},
 {id:'demo-b',patientId:'fiction-01',day:'2026-11-12',reason:'Soin non réalisé',note:'Exemple corrigé',sync:'Sans suite',cancelled:true,history:[{at:'2026-11-12T08:00:00Z',action:'Signalement fictif'},{at:'2026-11-12T09:00:00Z',action:'Signalement annulé'}]}
];
const state={
 tidel_Pl:JSON.stringify(patients),
 tidel_absences_journal_v1:JSON.stringify(events),
 tidel_done_2026_11_13:'["fiction-01"]',
 tidel_demo_note_v1:'Texte de démonstration sans patient réel'
};

async function fixture(startState={tidel_Pl:'[]'},opts={}){
 const html=await read();
 const begin=html.indexOf("const PORTABLE_FORMAT='bigcthu-tournee-complete-portable-v1'");
 const end=html.indexOf('function fillFromBackup(d){',begin);
 assert.ok(begin>=0&&end>begin,'portable export and restore code exists');
 let source='',commitCount=0,reloads=0;
 const errors=[];
 const fields={
  'tour-pass':{value:''},
  'tour-file':{files:[{size:200,async text(){return source}}]},
  'tour-security-gate':{hidden:true}
 };
 const ctx={
  Date,JSON,Object,Array,Uint8Array,
  secureState:Object.assign(Object.create(null),startState),secureGen:0,
  ORIGINAL_KEY:'old-fictitious-vault',PREVIOUS_KEY:'prev-fictitious-vault',SECURE_KEY:'current-fictitious-vault',
  document:{getElementById:id=>fields[id]},
  localStorage:{getItem:()=>null},
  validVaultState:x=>{try{return !!x&&typeof x==='object'&&Array.isArray(JSON.parse(x.tidel_Pl||'null'))}catch{return false}},
  isEncryptedVaultRecord:x=>!!(x&&x.cipher),
  fillFromBackup:()=>{throw Error('Unexpected legacy format in portable test')},
  ensureVaultSaved:async()=>{commitCount++;if(opts.diskFull)throw Error('QuotaExceededError');opts.persisted=JSON.stringify(ctx.secureState)},
  saveFailure:()=>{},saveStatus:()=>{},
  report:message=>errors.push(message),
  location:{reload(){reloads++}}
 };
 runInNewContext(html.slice(begin,end)+'\nthis.make=serializePortableVault;this.restore=recoverOldVault;this.readPortable=readPortableVault;this.current=()=>secureState;',ctx,{timeout:1000});
 return {ctx,fields,setFile:record=>{source=record},errors,commits:()=>commitCount,reloads:()=>reloads,persisted:()=>opts.persisted};
}

test('V97: transfert complet fictif A vers B sans saisie de mot de passe puis réouverture sur B',async()=>{
 const deviceA=await fixture(state);
 const backup=deviceA.ctx.make(deviceA.ctx.current());
 const parsed=JSON.parse(backup);
 assert.equal(parsed.format,'bigcthu-tournee-complete-portable-v1');
 assert.equal(parsed.data.tidel_absences_journal_v1,state.tidel_absences_journal_v1);
 assert.equal(parsed.data.tidel_done_2026_11_13,state.tidel_done_2026_11_13);

 const deviceB=await fixture();
 deviceB.setFile(backup);
 await deviceB.ctx.restore(true);
 assert.equal(deviceB.commits(),1);
 assert.equal(deviceB.reloads(),1);
 assert.equal(deviceB.errors.length,0);
 const restored=deviceB.persisted();
 assert.ok(restored,'full state written before simulated reload');
 assert.deepEqual(JSON.parse(restored),state);
 const newLaunch=JSON.parse(restored);
 assert.deepEqual(JSON.parse(newLaunch.tidel_absences_journal_v1),events);
 assert.deepEqual(JSON.parse(newLaunch.tidel_Pl),patients);
 assert.equal(JSON.parse(newLaunch.tidel_absences_journal_v1)[1].history.length,2);
});

test('V97: sur le navigateur B non vide, refuse un second import sans écraser le journal',async()=>{
 const f=await fixture(state);
 const backup=f.ctx.make(state);
 f.setFile(backup);
 await f.ctx.restore(true);
 assert.equal(f.commits(),0);
 assert.equal(f.reloads(),0);
 assert.deepEqual(JSON.parse(JSON.stringify(f.ctx.current())),state);
 assert.match(f.errors.at(-1),/ne rien écraser/);
});

test('V97: import altéré, clés non reconnues ou liste patients invalide ne passent jamais',async()=>{
 const f=await fixture();
 const base=JSON.parse(f.ctx.make(state));
 for(const candidate of [
  {...base,format:'inconnu'},
  {...base,data:{...base.data,tidel_Pl:'not-json'}},
  {...base,data:{...base.data,authToken:'inattendu'}},
  {...base,data:{...base.data,tidel_Pl:JSON.stringify({notPatients:true})}}
 ]){
  f.setFile(JSON.stringify(candidate));
  await f.ctx.restore(true);
  assert.equal(f.commits(),0);
  assert.equal(f.reloads(),0);
 }
 assert.equal(f.ctx.current().tidel_Pl,'[]');
 assert.equal(f.errors.length,4);
});

test('V97: panne simulée pendant la sauvegarde d import ne valide pas la restauration',async()=>{
 const backup=(await fixture(state)).ctx.make(state);
 const f=await fixture({tidel_Pl:'[]'},{diskFull:true});
 f.setFile(backup);
 await f.ctx.restore(true);
 assert.equal(f.commits(),1);
 assert.equal(f.reloads(),0);
 assert.equal(f.ctx.current().tidel_Pl,'[]');
 assert.match(f.errors.at(-1),/Enregistrement de la restauration impossible/);
});

test('V97: transfert n impose aucun écran bloquant, aucun code et aucun appel Topaze',async()=>{
 const html=await read();
 assert.match(html,/id="tour-security-gate" hidden/);
 assert.match(html,/id="tour-portable-export"/);
 assert.match(html,/id="tour-recovery-launch">Récupérer mes anciennes données/);
 const exportCode=html.slice(html.indexOf('async function exportPortableVault(){'),html.indexOf("document.getElementById('tour-portable-export').addEventListener"));
 assert.match(exportCode,/await ensureVaultSaved\(\)/);
 assert.match(exportCode,/serializePortableVault\(secureState\)/);
 assert.doesNotMatch(exportCode,/fetch\(|XMLHttpRequest|topaze\.fr|window\.open|crypto\.subtle\.decrypt/);
});

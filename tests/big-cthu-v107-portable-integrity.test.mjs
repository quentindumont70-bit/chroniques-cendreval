import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';

async function fixture(){
 const html=await readFile(new URL('../big-cthu-beta/tournee-complete.html',import.meta.url),'utf8');
 const start=html.indexOf("const PORTABLE_FORMAT='bigcthu-tournee-complete-portable-v1'");
 const end=html.indexOf('function recoverySpaceEmpty(',start);
 assert.ok(start>0&&end>start,'real portable serialization and validation');
 const ctx={Date,JSON,Object,Array,Math,validVaultState:state=>{
  try{return !!state&&typeof state==='object'&&Array.isArray(JSON.parse(state.tidel_Pl||'null'))}catch{return false}
 }};
 runInNewContext(html.slice(start,end)+'\nthis.exportVault=serializePortableVault;this.importVault=readPortableVault;this.hash=portableChecksum;',ctx,{timeout:1000});
 const state={
  tidel_Pl:'[{"id":"fiction-1","n":"PATIENT IMAGINAIRE"}]',
  tidel_absences_journal_v1:JSON.stringify([
   {id:'fiction-e1',patientId:'fiction-1',day:'2026-11-13',reason:'Patient absent',sync:'À rapprocher',note:'Fictif',history:[{at:'2026-11-13T09:00:00Z',action:'Ajout fictif'}]},
   {id:'fiction-e2',patientId:'fiction-1',day:'2026-11-12',reason:'Soin non réalisé',sync:'Sans suite',cancelled:true,history:[{at:'2026-11-12T09:00:00Z',action:'Annulation fictive'}]}
  ]),
  tidel_done_2026_11_13:'["fiction-1"]'
 };
 return {ctx,state};
}

test('V107: export complet conserve toutes les données inventées et une empreinte vérifiable',async()=>{
 const {ctx,state}=await fixture();
 const exported=JSON.parse(ctx.exportVault(state));
 assert.equal(exported.checksumType,'fnv1a32');
 assert.match(exported.checksum,/^[a-f0-9]{8}$/);
 assert.equal(exported.checksum,ctx.hash(state));
 assert.deepEqual(JSON.parse(JSON.stringify(ctx.importVault(exported))),state);
 assert.equal(JSON.parse(exported.data.tidel_absences_journal_v1)[1].cancelled,true);
});

test('V107: une modification ou suppression accidentelle du journal dans le fichier est détectée avant import',async()=>{
 const {ctx,state}=await fixture();
 const exported=JSON.parse(ctx.exportVault(state));
 const edits=[
  {...exported,data:{...exported.data,tidel_absences_journal_v1:JSON.stringify([JSON.parse(state.tidel_absences_journal_v1)[0]])}},
  {...exported,data:{...exported.data,tidel_done_2026_11_13:'[]'}},
  {...exported,data:{...exported.data,tidel_extra_note:'MODIFICATION ACCIDENTELLE'}}
 ];
 for(const file of edits)assert.throws(()=>ctx.importVault(file),/modifiée ou corrompue/);
});

test('V107: un journal Absences invalide ne peut plus être importé silencieusement même avec une empreinte recalculée',async()=>{
 const {ctx,state}=await fixture();
 for(const invalid of ['texte non JSON','[{"id":"incomplet"}]',JSON.stringify(Array.from({length:501},(_,i)=>({id:String(i)})))]) {
  const changed={...state,tidel_absences_journal_v1:invalid};
  assert.throws(()=>ctx.exportVault(changed),/données locales invalides/);
  const file={format:'bigcthu-tournee-complete-portable-v1',v:1,data:changed,checksumType:'fnv1a32',checksum:ctx.hash(changed)};
  assert.throws(()=>ctx.importVault(file),/incompatible/);
 }
});

test('V107: anciens exports V95 sans empreinte restent restaurables sur navigateur fictif vierge',async()=>{
 const {ctx,state}=await fixture();
 const legacy={format:'bigcthu-tournee-complete-portable-v1',v:1,data:state,exportedAt:'2026-11-10T08:00:00.000Z'};
 assert.deepEqual(JSON.parse(JSON.stringify(ctx.importVault(legacy))),state);
 assert.throws(()=>ctx.importVault({...legacy,checksum:'invalid'}),/modifiée ou corrompue/);
});

test('V107: l empreinte sert à détecter une corruption, pas à chiffrer ou transmettre des données',async()=>{
 const html=await readFile(new URL('../big-cthu-beta/tournee-complete.html',import.meta.url),'utf8');
 const section=html.slice(html.indexOf("const PORTABLE_FORMAT='"),html.indexOf('function recoverySpaceEmpty('));
 assert.doesNotMatch(section,/fetch\(|XMLHttpRequest|WebSocket|topaze\.fr/);
 assert.match(html,/id="tour-security-gate" hidden/);
 assert.match(html,/PORTABLE-LISIBLE/);
});

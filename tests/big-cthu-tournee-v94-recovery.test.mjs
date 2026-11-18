import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';

const html=()=>readFile(new URL('../big-cthu-beta/tournee-complete.html',import.meta.url),'utf8');
const empty={tidel_Pl:'[]'};
const filled={tidel_Pl:JSON.stringify([{id:'fictif-1',n:'EXEMPLE FICTIF',a:'Rue inventée'}]),tidel_absences_journal_v1:'[]'};
async function fixture({initial=empty,encrypted=false,portable=false,password='',fail=false,old=false}={}){
 const page=await html();
 const start=page.indexOf('const PORTABLE_FORMAT=');
 const end=page.indexOf('function fillFromBackup(d){',start);
 assert.ok(start>0&&end>start,'restoration must be isolated and explicit');
 let reloaded=0,decrypts=0,flushes=0;
 const errors=[],statuses=[],local=new Map(old?[['original-vault','ancien coffre ne pas modifier']]:[]);
 const elements={
  'tour-pass':{value:password},
  'tour-file':{files:[{size:100,async text(){return JSON.stringify(portable?{format:'bigcthu-tournee-complete-portable-v1',v:1,data:filled}:encrypted?{v:1,cipher:'test',salt:'test',iv:'test'}:{v:1,P:[],kv:{}})}}]},
  'tour-security-gate':{hidden:false}
 };
 const ctx={
  JSON,Object,Array,
  secureState:{...initial},secureGen:0,SECURE_KEY:'current-vault',ORIGINAL_KEY:'original-vault',PREVIOUS_KEY:'previous-vault',
  document:{getElementById:id=>elements[id]},localStorage:{getItem:key=>local.get(key)??null},
  isEncryptedVaultRecord:x=>!!x.cipher,
  decryptRecord:async()=>{decrypts++;return filled},
  fillFromBackup:()=>filled,validVaultState:x=>{try{return !!x&&Array.isArray(JSON.parse(x.tidel_Pl||'null'))}catch(e){return false}},
  ensureVaultSaved:async()=>{flushes++;if(fail)throw Error('Storage full')},
  saveFailure:()=>statuses.push('error'),saveStatus:(type,message)=>statuses.push(type+':'+message),
  report:message=>errors.push(message),
  location:{reload(){reloaded++}}
 };
 runInNewContext(page.slice(start,end)+
 '\nthis.recover=recoverOldVault;this.isEmpty=recoverySpaceEmpty;this.current=()=>secureState;this.serializePortable=serializePortableVault;this.readPortable=readPortableVault;',
 ctx,{timeout:1000});
 return {ctx,errors,statuses,elements,local,reloaded:()=>reloaded,decrypts:()=>decrypts,flushes:()=>flushes};
}

test('V94: récupération JSON classique depuis nouvel iPhone ne demande aucun code',async()=>{
 const f=await fixture();
 assert.equal(f.ctx.isEmpty(empty),true);
 await f.ctx.recover(true);
 assert.equal(f.errors.length,0);
 assert.equal(f.decrypts(),0);
 assert.equal(f.flushes(),1);
 assert.equal(f.reloaded(),1);
 assert.equal(JSON.parse(f.ctx.current().tidel_Pl)[0].id,'fictif-1');
});

test('V248: un ancien coffre sans clé locale ne déclenche aucune demande de code',async()=>{
 for(const oldValue of ['', 'historique-inutile']){
  const f=await fixture({encrypted:true,password:oldValue});
  await f.ctx.recover(true);
  assert.equal(f.decrypts(),0);
  assert.equal(f.flushes(),0);
  assert.equal(f.reloaded(),0);
  assert.match(f.errors[0],/ancien coffre/);
 }
});

test('V94: une liste patient déjà présente bloque la restauration',async()=>{
 const f=await fixture({initial:filled});
 await f.ctx.recover(true);
 assert.equal(f.flushes(),0);
 assert.equal(f.reloaded(),0);
 assert.equal(JSON.stringify(f.ctx.current()),JSON.stringify(filled));
 assert.match(f.errors[0],/ne rien écraser/);
});

test('V247: si la liste est vide, les notes et journaux existants survivent au retour des patients',async()=>{
 for(const initial of [
  {tidel_Pl:'[]',tidel_done_2026_11_13:'["fictif-1"]'},
  {tidel_Pl:'[]',tidel_absences_journal_v1:'[{"id":"signal-fictif"}]'}
 ]){
  const f=await fixture({initial});
  await f.ctx.recover(true);
  assert.equal(f.errors.length,0);
  assert.equal(f.flushes(),1);
  assert.equal(f.reloaded(),1);
  assert.equal(f.ctx.current().tidel_Pl,filled.tidel_Pl);
  for(const [key,value] of Object.entries(initial)){
   if(key!=='tidel_Pl')assert.equal(f.ctx.current()[key],value);
  }
 }
});

test('V94: une erreur d écriture ne valide pas la restauration et laisse les données initiales en mémoire',async()=>{
 const f=await fixture({fail:true,old:true});
 await f.ctx.recover(true);
 assert.equal(f.reloaded(),0);
 assert.equal(f.ctx.current().tidel_Pl,'[]');
 assert.equal(f.local.get('original-vault'),'ancien coffre ne pas modifier');
 assert.match(f.errors[0],/Enregistrement de la restauration impossible/);
});

test('V248: import JSON visible directement sur la PWA sans champ de code',async()=>{
 const page=await html();
 assert.match(page,/id="tour-security-gate" hidden/);
 assert.match(page,/id="tour-recovery-launch">Importer mes patients \(JSON\)/);
 assert.match(page,/id="tour-recovery-direct">Importer mon JSON/);
 assert.match(page,/id="tour-file" accept="\.json,application\/json"/);
 assert.match(page,/id="tour-import" type="button">2 · Importer le JSON dans cette application/);
 assert.match(page,/location\.hash==='#import-json'/);
 assert.match(page,/function recoverySpaceEmpty\(/);
 assert.match(page,/async function autoOpenTournee\(\)/);
 assert.doesNotMatch(page,/id="tour-pass"|phrase secrète|phrase de sauvegarde/i);
});

test('V95: sauvegarde JSON complète sans code conserve journal et suivi fictifs',async()=>{
 const f=await fixture();
 const state={tidel_Pl:JSON.stringify([{id:'fictif-1',n:'EXEMPLE FICTIF',a:'Rue imaginaire'}]),tidel_absences_journal_v1:JSON.stringify([{id:'evt-fictif',patientId:'fictif-1',day:'2026-11-13',reason:'Patient absent',sync:'À rapprocher',history:[{at:'2026-11-13T09:00:00Z',action:'Signalement fictif'}]}]),tidel_done_2026_11_13:'["fictif-1"]'};
 const file=f.ctx.serializePortable(state);
 assert.match(file,/bigcthu-tournee-complete-portable-v1/);
 assert.match(file,/evt-fictif/,'portable export is deliberately readable, warn the user');
 const saved=JSON.parse(file);
 assert.deepEqual(JSON.parse(JSON.stringify(f.ctx.readPortable(saved))),state);
 const bad={...saved,data:{...state,tidel_Pl:'INVALID JSON'}};
 assert.throws(()=>f.ctx.readPortable(bad),/incompatible/);
 assert.throws(()=>f.ctx.serializePortable({...state,untrustedField:'bad'}),/invalides/);
});

test('V95: import du fichier complet portable depuis un appareil vierge sans mot de passe',async()=>{
 const f=await fixture({portable:true});
 await f.ctx.recover(true);
 assert.equal(f.reloaded(),1);
 assert.equal(f.decrypts(),0);
 assert.equal(f.flushes(),1);
 assert.equal(f.ctx.current().tidel_Pl,filled.tidel_Pl);
 assert.equal(f.ctx.current().tidel_absences_journal_v1,filled.tidel_absences_journal_v1);
});

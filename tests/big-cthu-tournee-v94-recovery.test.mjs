import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';

const html=()=>readFile(new URL('../big-cthu-beta/tournee-complete.html',import.meta.url),'utf8');
const empty={tidel_Pl:'[]'};
const filled={tidel_Pl:JSON.stringify([{id:'fictif-1',n:'EXEMPLE FICTIF',a:'Rue inventée'}]),tidel_absences_journal_v1:'[]'};
async function fixture({initial=empty,encrypted=false,password='',fail=false,old=false}={}){
 const page=await html();
 const start=page.indexOf('const PORTABLE_FORMAT=');
 const end=page.indexOf('function fillFromBackup(d){',start);
 assert.ok(start>0&&end>start,'restoration must be isolated and explicit');
 let reloaded=0,decrypts=0,flushes=0;
 const errors=[],statuses=[],local=new Map(old?[['original-vault','ancien coffre ne pas modifier']]:[]);
 const elements={
  'tour-pass':{value:password},
  'tour-file':{files:[{size:100,async text(){return JSON.stringify(encrypted?{v:1,cipher:'test',salt:'test',iv:'test'}:{v:1,P:[],kv:{}})}}]},
  'tour-security-gate':{hidden:false}
 };
 const ctx={
  JSON,Object,Array,
  secureState:{...initial},secureGen:0,SECURE_KEY:'current-vault',ORIGINAL_KEY:'original-vault',PREVIOUS_KEY:'previous-vault',
  document:{getElementById:id=>elements[id]},localStorage:{getItem:key=>local.get(key)??null},
  isEncryptedVaultRecord:x=>!!x.cipher,
  decryptRecord:async()=>{decrypts++;return filled},
  fillFromBackup:()=>filled,validVaultState:x=>!!x&&Array.isArray(JSON.parse(x.tidel_Pl||'null')),
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

test('V94: une ancienne sauvegarde chiffrée ne se déchiffre que sur action explicite et avec son ancien secret',async()=>{
 const f=await fixture({encrypted:true});
 await f.ctx.recover(true);
 assert.equal(f.decrypts(),0);
 assert.equal(f.flushes(),0);
 assert.equal(f.reloaded(),0);
 assert.match(f.errors[0],/ancien secret/);
 const g=await fixture({encrypted:true,password:'phrase-historique-de-test'});
 await g.ctx.recover(true);
 assert.equal(g.decrypts(),1);
 assert.equal(g.reloaded(),1);
});

test('V94: ni patient ni historique déjà présent ne sont écrasés',async()=>{
 for(const initial of [filled,{tidel_Pl:'[]',tidel_done_2026_11_13:'["fictif-1"]'},{tidel_Pl:'[]',tidel_absences_journal_v1:'[{"id":"signal-fictif"}]'}]){
  const f=await fixture({initial});
  await f.ctx.recover(true);
  assert.equal(f.flushes(),0);
  assert.equal(f.reloaded(),0);
  assert.equal(JSON.stringify(f.ctx.current()),JSON.stringify(initial));
  assert.match(f.errors[0],/ne rien écraser/);
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

test('V94: accès direct et récupération volontaire accessibles sans écran de verrouillage',async()=>{
 const page=await html();
 assert.match(page,/id="tour-security-gate" hidden/);
 assert.match(page,/id="tour-recovery-launch">Récupérer mes anciennes données/);
 assert.match(page,/function recoverySpaceEmpty\(/);
 assert.match(page,/async function autoOpenTournee\(\)/);
 assert.match(page,/Récupération bloquée pour ne rien écraser/);
 assert.doesNotMatch(page.slice(page.indexOf('async function autoOpenTournee(){'),page.indexOf('function recoverySpaceEmpty(')),/document\.getElementById\('tour-pass'\)/);
});

test('V95: sauvegarde JSON complète sans code conserve journal et suivi fictifs',async()=>{
 const f=await fixture();
 const state={tidel_Pl:JSON.stringify([{id:'fictif-1',n:'EXEMPLE FICTIF',a:'Rue imaginaire'}]),tidel_absences_journal_v1:JSON.stringify([{id:'evt-fictif',reason:'Patient absent'}]),tidel_done_2026_11_13:'["fictif-1"]'};
 const file=f.ctx.serializePortable(state);
 assert.match(file,/bigcthu-tournee-complete-portable-v1/);
 assert.match(file,/evt-fictif/,'portable export is deliberately readable, warn the user');
 const saved=JSON.parse(file);
 assert.deepEqual(JSON.parse(JSON.stringify(f.ctx.readPortable(saved))),state);
 const bad={...saved,data:{...state,tidel_Pl:'INVALID JSON'}};
 assert.throws(()=>f.ctx.readPortable(bad),/incompatible/);
 assert.throws(()=>f.ctx.serializePortable({...state,untrustedField:'bad'}),/invalides/);
});

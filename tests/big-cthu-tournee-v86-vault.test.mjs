import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';

const read=()=>readFile(new URL('../big-cthu-beta/tournee-complete.html',import.meta.url),'utf8');
const encrypted={v:1,salt:'AQID',iv:'AQID',cipher:'AQID'};
function importer(html,{existing=false,wrong=false,format='encrypted'}={}){
 const begin=html.lastIndexOf('async function login(fileMode){');
 const end=html.indexOf("document.getElementById('tour-open').addEventListener",begin);
 const helperStart=html.lastIndexOf('function isEncryptedVaultRecord(');
 const helperEnd=html.indexOf('async function decryptRecord(',helperStart);
 assert.ok(helperStart>=0&&helperEnd>helperStart&&begin>=0&&end>begin);
 const storage=new Map(existing?[['full','ancien coffre']]:[]);
 const reports=[];let launched=0,decrypts=0,flushes=0;
 const payload=format==='encrypted'?encrypted:{v:1,P:[],kv:{}};
 const context={
  SECURE_KEY:'full',PREVIOUS_KEY:'prev',JSON,Object,Uint8Array,
  crypto:{subtle:{},getRandomValues:arr=>arr.fill(1)},
  document:{getElementById:id=>id==='tour-pass'?{value:'phrase-secrete-synthetique-2026'}:{files:[{size:100,async text(){return JSON.stringify(payload)}}]}},
  localStorage:{getItem:key=>storage.get(key)??null,setItem(key,value){storage.set(key,value)}},
  decryptRecord:async()=>{decrypts++;if(wrong)throw Error('Mauvaise phrase');return {tidel_Pl:'[]',tidel_absences_journal_v1:'[{"id":"demo"}]'}},
  fillFromBackup:()=>({tidel_Pl:'[]'}),from64:()=>new Uint8Array(16),keyFor:async()=>({key:'synthetic'}),
  flush:async()=>{flushes++},launch(){launched++},report:v=>reports.push(v),
  secureState:null,secureSalt:null,secureKey:null,secureGen:0
 };
 runInNewContext(html.slice(helperStart,helperEnd)+html.slice(begin,end)+'\nthis.loginTest=login;',context,{timeout:1000});
 return {context,storage,reports,launched:()=>launched,decrypts:()=>decrypts,flushes:()=>flushes};
}
test('V86: importe un coffre déjà chiffré sans effacer ni exposer le journal fictif',async()=>{
 const f=importer(await read());
 await f.context.loginTest(true);
 assert.equal(f.launched(),1);
 assert.equal(f.decrypts(),1);
 assert.equal(f.flushes(),0,'no forced re-encryption on verified import');
 assert.deepEqual(JSON.parse(f.storage.get('full')),encrypted);
 assert.equal(f.context.secureState.tidel_absences_journal_v1,'[{"id":"demo"}]');
});

test('V86: refuse de remplacer un coffre existant',async()=>{
 const f=importer(await read(),{existing:true});
 await f.context.loginTest(true);
 assert.equal(f.launched(),0);
 assert.equal(f.storage.get('full'),'ancien coffre');
 assert.equal(f.decrypts(),0);
 assert.match(f.reports.at(-1),/existe déjà/);
});

test('V86: une phrase incorrecte ne produit aucune écriture ni lancement',async()=>{
 const f=importer(await read(),{wrong:true});
 await f.context.loginTest(true);
 assert.equal(f.launched(),0);
 assert.equal(f.storage.has('full'),false);
 assert.match(f.reports.at(-1),/Mauvaise phrase/);
});

test('V86: compatibilité conservée pour un ancien JSON fictif',async()=>{
 const f=importer(await read(),{format:'legacy'});
 await f.context.loginTest(true);
 assert.equal(f.launched(),1);
 assert.equal(f.flushes(),1);
 assert.equal(f.decrypts(),0);
});

test('V86: export télécharge uniquement le coffre chiffré et pas un dump en clair',async()=>{
 const html=await read();
 const start=html.indexOf('async function exportEncryptedVault(){');
 const stop=html.indexOf("document.getElementById('tour-vault-export').addEventListener",start);
 const code=html.slice(start,stop);
 assert.match(html,/id="tour-vault-export"/);
 assert.match(html,/id="tour-file"/);
 assert.match(code,/await ensureVaultSaved\(\)/);
 assert.match(code,/localStorage\.getItem\(SECURE_KEY\)/);
 assert.match(code,/new Blob\(\[stored\]/);
 assert.match(code,/tournee-coffre-chiffre-/);
 assert.doesNotMatch(code,/JSON\.stringify\(secureState\)|tidel_Pl|patient\.n/);
 assert.match(html,/ancien export JSON classique ne l'inclut pas/);
});

test('V86: export et verrouillage attendent toutes les écritures en cours',async()=>{
 const html=await read();
 const a=html.indexOf('async function ensureVaultSaved(){');
 const b=html.indexOf("document.getElementById('tour-save-retry')",a);
 assert.ok(a>=0&&b>a);
 let attempts=0;
 const ctx={secureGen:2,secureSavedGen:1,flush:async()=>{attempts++;if(attempts===2)ctx.secureSavedGen=2}};
 runInNewContext(html.slice(a,b)+'\nthis.ensure=ensureVaultSaved;',ctx,{timeout:1000});
 await ctx.ensure();
 assert.equal(attempts,2);
 assert.match(html,/await ensureVaultSaved\(\);location\.reload\(\)/);
});

import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';
import {webcrypto} from 'node:crypto';

const html=()=>readFile(new URL('../big-cthu-beta/tournee-complete.html',import.meta.url),'utf8');
const fictionalPeople=[{id:'fiction-iphone-1',n:'PERSONNE INVENTÉE',a:'RUE IMAGINAIRE'}];
const fictionalAbsences=[
 {id:'absence-fiction-1',patientId:'fiction-iphone-1',day:'2026-11-13',reason:'Patient absent',note:'Visite de démonstration',sync:'À rapprocher',history:[{at:'2026-11-13T09:00:00.000Z',action:'Signalement fictif'}]},
 {id:'absence-fiction-2',patientId:'fiction-iphone-1',day:'2026-11-12',reason:'Soin non réalisé',note:'Annulation fictive',sync:'Sans suite',cancelled:true,history:[{at:'2026-11-12T09:00:00.000Z',action:'Signalement fictif'},{at:'2026-11-12T10:00:00.000Z',action:'Annulation fictive'}]}
];
const expected={
 tidel_Pl:JSON.stringify(fictionalPeople),
 tidel_absences_journal_v1:JSON.stringify(fictionalAbsences),
 tidel_done_2026_11_13:'["fiction-iphone-1"]'
};

async function sourceSections(){
 const source=await html();
 const headStart=source.indexOf("const ORIGINAL_KEY='bigcthu_tournee_full_encrypted_v1'");
 const headEnd=source.indexOf("const DEVICE_DB='bigcthu_tournee_device_key_v1'",headStart);
 const decryptStart=source.indexOf('async function decryptWithDeviceKey(',headEnd);
 const decryptEnd=source.indexOf('function showLegacyRecovery(){',decryptStart);
 const saveStart=source.indexOf('var secureLastWrittenRecord=null;',decryptEnd);
 const saveEnd=source.indexOf('async function exportEncryptedVault(){',saveStart);
 assert.ok(headStart>0&&headEnd>headStart&&decryptStart>headEnd&&decryptEnd>decryptStart&&saveStart>decryptEnd&&saveEnd>saveStart);
 return [source.slice(headStart,headEnd),source.slice(decryptStart,decryptEnd),source.slice(saveStart,saveEnd)].join('\n');
}

async function openFictionalSafari(store){
 const code=await sourceSections();
 const bar={dataset:{},hidden:false},status={textContent:''},retry={hidden:true,addEventListener(){}};
 const gate={hidden:true};
 let launches=0,fetches=0,writeCount=0;
 const context={
  crypto:webcrypto,TextEncoder,TextDecoder,Uint8Array,JSON,Object,Array,
  btoa:text=>Buffer.from(text,'binary').toString('base64'),
  atob:text=>Buffer.from(text,'base64').toString('binary'),
  localStorage:{
   getItem:key=>store.coffre.get(key)??null,
   setItem(key,value){writeCount++;store.coffre.set(key,value)}
  },
  rememberDeviceKey:async(key,salt)=>{store.device={v:1,key,salt:Buffer.from(salt).toString('base64')}},
  recalledDeviceKey:async()=>store.device,
  launch:()=>{launches++},
  showLegacyRecovery:()=>{},
  document:{
   body:{classList:{remove(){}}},
   getElementById:id=>({'tour-save-strip':bar,'tour-save-text':status,'tour-save-retry':retry,'tour-security-gate':gate})[id]
  },
  setTimeout:()=>1,clearTimeout:()=>{},
  fetch(){fetches++;throw Error('Offline network access prohibited')}
 };
 runInNewContext(code+'\nthis.open=autoOpenTournee;this.flushReal=flush;this.change=(data)=>{Object.assign(secureState,data);dirty()};this.readState=()=>JSON.parse(JSON.stringify(secureState));this.lastSnapshot=()=>secureLastWrittenRecord;',context,{timeout:1000});
 return {context,bar,status,gate,launches:()=>launches,fetches:()=>fetches,writes:()=>writeCount};
}

test('V106: mode avion, fermeture totale et réouverture iPhone conservent tournée, absences et historique fictifs',async()=>{
 const store={coffre:new Map(),device:null};
 const first=await openFictionalSafari(store);
 assert.equal(await first.context.open(),true);
 assert.equal(first.launches(),1);
 first.context.change(expected);
 await first.context.flushReal();
 assert.equal(first.bar.dataset.state,'saved');
 const stored=store.coffre.get('bigcthu_tournee_full_encrypted_v1');
 assert.ok(stored);
 assert.ok(!stored.includes('PERSONNE INVENTÉE'),'le coffre local reste chiffré');

 // Simulate Safari process killed: no access to the first tab's JavaScript state.
 const reopened=await openFictionalSafari(store);
 assert.equal(await reopened.context.open(),true);
 assert.equal(reopened.launches(),1);
 assert.deepEqual(reopened.context.readState(),expected);
 assert.equal(JSON.parse(reopened.context.readState().tidel_absences_journal_v1)[1].history.length,2);
 assert.equal(reopened.context.lastSnapshot(),stored);
 assert.equal(reopened.writes(),0,'reopening a confirmed vault must not rewrite it');
 assert.equal(first.fetches()+reopened.fetches(),0);
 assert.equal(reopened.gate.hidden,true,'no code or lock at opening');
});

test('V106: une modification après réouverture offline reste chiffrée puis survit à un second redémarrage',async()=>{
 const store={coffre:new Map(),device:null};
 const original=await openFictionalSafari(store);
 assert.equal(await original.context.open(),true);
 original.context.change(expected);
 await original.context.flushReal();
 const restarted=await openFictionalSafari(store);
 assert.equal(await restarted.context.open(),true);
 const changed={...expected,tidel_done_2026_11_14:'["fiction-iphone-1"]'};
 restarted.context.change({tidel_done_2026_11_14:changed.tidel_done_2026_11_14});
 await restarted.context.flushReal();
 assert.equal(restarted.bar.dataset.state,'saved');
 const last=await openFictionalSafari(store);
 assert.equal(await last.context.open(),true);
 assert.deepEqual(last.context.readState(),changed);
 assert.equal(original.fetches()+restarted.fetches()+last.fetches(),0);
});

test('V106: coffre chiffré corrompu au redémarrage : aucune suppression ni ouverture trompeuse',async()=>{
 const store={coffre:new Map(),device:null};
 const first=await openFictionalSafari(store);
 assert.equal(await first.context.open(),true);
 const originalKey='bigcthu_tournee_full_encrypted_v1';
 const key='bigcthu_tournee_auto_encrypted_v1';
 const invalid=JSON.parse(store.coffre.get(originalKey));
 invalid.cipher='AAAA';
 const corrupted=JSON.stringify(invalid);
 store.coffre.delete(originalKey);
 store.coffre.set(key,corrupted);
 // Refuse de remplacer un coffre automatique illisible lors du redémarrage.
 const last=await openFictionalSafari(store);
 const result=await last.context.open();
 assert.equal(result,false);
 assert.equal(last.launches(),0);
 assert.equal(store.coffre.get(key),corrupted);
 assert.equal(last.bar.dataset.state,'error');
 assert.equal(last.fetches(),0);
});

test('V106: aucun réseau, pas de phrase secrète au lancement, code de reprise et cache public présents',async()=>{
 const source=await html();
 const code=await sourceSections();
 assert.doesNotMatch(code,/fetch\(|XMLHttpRequest|WebSocket|Topaze\.fr/);
 assert.match(source,/id="tour-security-gate" hidden/);
 assert.match(source,/window\.addEventListener\('pageshow',resumeTournee\)/);
 const sw=await readFile(new URL('../big-cthu-beta/sw.js',import.meta.url),'utf8');
 assert.match(sw,/\.\/tournee-complete\.html/);
 assert.doesNotMatch(sw,/tidel_Pl|tidel_absences_journal_v1|indexedDB|localStorage/);
});

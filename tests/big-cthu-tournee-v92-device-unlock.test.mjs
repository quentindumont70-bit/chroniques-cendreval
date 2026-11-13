import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';
import {webcrypto} from 'node:crypto';

const read=()=>readFile(new URL('../big-cthu-beta/tournee-complete.html',import.meta.url),'utf8');
const makeData=()=>({tidel_Pl:JSON.stringify([{id:'imaginaire-1',n:'PATIENT FICTIF',a:'Adresse inventée'}]),tidel_absences_journal_v1:'[]'});
const as64=a=>Buffer.from(a).toString('base64');
const from64=s=>Uint8Array.from(Buffer.from(s,'base64'));
async function setup({corrupt=false,wrongSalt=false,remember=true,original=true}={}){
 const html=await read();
 const salt=webcrypto.getRandomValues(new Uint8Array(16)),iv=webcrypto.getRandomValues(new Uint8Array(12));
 const base=await webcrypto.subtle.importKey('raw',new TextEncoder().encode('phrase fictive jamais utilisée'),'PBKDF2',false,['deriveKey']);
 const key=await webcrypto.subtle.deriveKey({name:'PBKDF2',salt,iterations:180000,hash:'SHA-256'},base,{name:'AES-GCM',length:256},false,['encrypt','decrypt']);
 assert.equal(key.extractable,false);
 const state=makeData();
 const cipher=new Uint8Array(await webcrypto.subtle.encrypt({name:'AES-GCM',iv},key,new TextEncoder().encode(JSON.stringify(state))));
 if(corrupt)cipher[0]^=1;
 const record=JSON.stringify({v:1,salt:as64(salt),iv:as64(iv),cipher:as64(cipher)});
 const vaultStore=new Map(original?[['synthetic-vault',record]]:[]);
 const keyStore=new Map();
 const status={removed:0,recovery:false,message:''};
 let launches=0,reads=0,writes=0,flushes=0;
 const elements={'tour-security-gate':{hidden:false},'tour-save-strip':{hidden:false},'tour-recovery-launch':{hidden:true}};
 const ctx={
  crypto:webcrypto,JSON,Object,Uint8Array,TextDecoder,
  ORIGINAL_KEY:'synthetic-vault',ALTERNATE_KEY:'synthetic-alternate',PREVIOUS_KEY:'synthetic-previous',
  SECURE_KEY:'synthetic-vault',secureState:null,secureKey:null,secureSalt:null,secureGen:0,
  localStorage:{getItem:key=>vaultStore.get(key)??null,setItem:(key,value)=>vaultStore.set(key,value)},
  document:{getElementById:id=>elements[id],body:{classList:{remove(name){if(name==='tournee-checking')status.removed++}}}},
  to64:as64,from64,dec:new TextDecoder(),
  isEncryptedVaultRecord:x=>x&&x.v===1&&typeof x.salt==='string'&&typeof x.cipher==='string',
  saveStatus:(type,message)=>{status.message=message},
  flush:async()=>{flushes++;vaultStore.set(ctx.SECURE_KEY,'chiffre fictif généré sans mot de passe')},
  deviceKeyRecord:async(mode,name,value)=>{
   if(mode==='readwrite'){writes++;keyStore.set(name,value);return name}
   reads++;return keyStore.get(name)
  },
  launch:()=>{launches++}
 };
 const start=html.indexOf('function rememberDeviceKey(key,salt){'),end=html.indexOf('function fillFromBackup(d){',start);
 assert.ok(start>=0&&end>start);
 runInNewContext(html.slice(start,end)+'\nthis.remember=rememberDeviceKey;this.autoOpen=autoOpenTournee;this.vaultState=()=>secureState;this.getActiveKey=()=>SECURE_KEY;',ctx,{timeout:1000});
 if(remember)await ctx.remember(key,wrongSalt?new Uint8Array(16):salt);
 return {html,ctx,key,record,state,vaultStore,launches:()=>launches,reads:()=>reads,writes:()=>writes,flushes:()=>flushes,status,elements};
}

test('V93: coffre déjà associé à l appareil : ouverture directe sans aucune saisie',async()=>{
 const f=await setup();
 assert.equal(await f.ctx.autoOpen(),true);
 assert.equal(f.launches(),1);
 assert.equal(f.reads(),1);
 assert.equal(f.status.removed,1);
 assert.equal(f.ctx.vaultState().tidel_Pl,f.state.tidel_Pl);
 assert.equal(f.ctx.vaultState().tidel_absences_journal_v1,f.state.tidel_absences_journal_v1);
 assert.equal(f.elements['tour-recovery-launch'].hidden,true);
 assert.doesNotMatch(f.record,/PATIENT FICTIF|Adresse inventée/);
 assert.doesNotMatch(f.html,/exportKey\(|extractKey\(/);
});

test('V93: première visite vierge ouvre immédiatement Tournée sans créer de phrase secrète',async()=>{
 const f=await setup({original:false,remember:false});
 assert.equal(await f.ctx.autoOpen(),true);
 assert.equal(f.launches(),1);
 assert.equal(f.flushes(),1);
 assert.equal(f.ctx.vaultState().tidel_Pl,'[]');
 assert.equal(f.ctx.getActiveKey(),'synthetic-vault');
 assert.equal(f.elements['tour-security-gate'].hidden,true);
 assert.equal(f.writes(),1,'generated crypto key remembered without password');
});

test('V93: ancien coffre non associé à l appareil reste intact et ne bloque pas l ouverture',async()=>{
 const f=await setup({remember:false});
 assert.equal(await f.ctx.autoOpen(),true);
 assert.equal(f.launches(),1);
 assert.equal(f.ctx.vaultState().tidel_Pl,'[]');
 assert.equal(f.ctx.getActiveKey(),'synthetic-alternate');
 assert.equal(f.vaultStore.get('synthetic-vault'),f.record);
 assert.equal(f.elements['tour-recovery-launch'].hidden,false);
 assert.match(f.status.message,/récupération facultative/);
});

test('V93: ancienne clé incompatible ou coffre ancien altéré ne sont pas effacés',async()=>{
 for(const opts of [{wrongSalt:true},{corrupt:true}]){
  const f=await setup(opts);
  assert.equal(await f.ctx.autoOpen(),true);
  assert.equal(f.launches(),1);
  assert.equal(f.ctx.getActiveKey(),'synthetic-alternate');
  assert.equal(f.vaultStore.get('synthetic-vault'),f.record);
 }
});

test('V93: aucune session ne se reverrouille après inactivité',async()=>{
 const html=await read();
 assert.match(html,/if\(elapsed>=IDLE_LOCK_MS\)\{if\(secureKey&&secureGen!==secureSavedGen\)flush\(\)\.catch\(saveFailure\);return\}/);
 const saving=html.slice(html.indexOf('async function lockTourSafely(){'),html.indexOf('function checkTourIdle(){'));
 assert.doesNotMatch(saving,/location\.reload\(\)/);
 assert.match(html,/id="tour-lock">Sauvegarder<\/button>/);
 assert.match(html,/id="tour-security-gate" hidden/);
 assert.match(html,/Récupérer mes anciennes données/);
 assert.match(html,/autoOpenTournee\(\);/);
});

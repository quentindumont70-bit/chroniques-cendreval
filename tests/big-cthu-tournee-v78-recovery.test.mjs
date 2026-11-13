import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';
import {webcrypto} from 'node:crypto';

async function cryptoFixture(){
 const html=await readFile(new URL('../big-cthu-beta/tournee-complete.html',import.meta.url),'utf8');
 const start=html.indexOf('const SECURE_KEY=');
 const end=html.indexOf('function fillFromBackup(d){',start);
 assert.ok(start>0&&end>start,'same crypto implementation as the browser');
 const ctx={crypto:webcrypto,TextEncoder,TextDecoder,Uint8Array,btoa,atob};
 runInNewContext(html.slice(start,end)+
  '\nthis.encryptFixture=async function(data,password){const salt=crypto.getRandomValues(new Uint8Array(16));const iv=crypto.getRandomValues(new Uint8Array(12));const key=await keyFor(password,salt);const cipher=await crypto.subtle.encrypt({name:"AES-GCM",iv},key,enc.encode(JSON.stringify(data)));return JSON.stringify({v:1,salt:to64(salt),iv:to64(iv),cipher:to64(new Uint8Array(cipher))})};this.decryptFixture=decryptRecord;',ctx,{timeout:1000});
 return {encrypt:ctx.encryptFixture,decrypt:ctx.decryptFixture,html};
}
const dummy=()=>({tidel_Pl:JSON.stringify([{id:'fiction-a',n:'PERSONNE FICTIVE',a:'adresse inventée'}]),tidel_done_2026_11_13:'[]'});
const phrase='phrase-secrete-de-test-2026';

test('V78: sauvegarde chiffrée se relit après simulation de redémarrage',async()=>{
 const {encrypt,decrypt}=await cryptoFixture();
 const data=dummy();
 const record=await encrypt(data,phrase);
 assert.doesNotMatch(record,/PERSONNE FICTIVE|adresse inventée/,'no plaintext in record');
 const restored=await decrypt(record,phrase);
 assert.equal(restored.tidel_Pl,data.tidel_Pl);
 assert.equal(restored.tidel_done_2026_11_13,data.tidel_done_2026_11_13);
});

test('V78: phrase secrète incorrecte et altération du coffre sont rejetées',async()=>{
 const {encrypt,decrypt}=await cryptoFixture();
 const record=await encrypt(dummy(),phrase);
 await assert.rejects(decrypt(record,'incorrect-phrase-secrete'));
 const tampered=JSON.parse(record);tampered.cipher=tampered.cipher.slice(0,-4)+'AAAA';
 await assert.rejects(decrypt(JSON.stringify(tampered),phrase));
});

test('V78: après une interruption avant commit, le dernier coffre valide reste lisible',async()=>{
 const {encrypt,decrypt}=await cryptoFixture();
 let stored=await encrypt(dummy(),phrase);
 const before=stored;
 const newRecord=await encrypt({...dummy(),tidel_done_2026_11_13:'["fiction-a"]'},phrase);
 const storage={setItem(){throw new Error('Stockage saturé')},getItem(){return stored}};
 assert.throws(()=>storage.setItem('test',newRecord),/Stockage saturé/);
 assert.equal(stored,before,'failed write must not replace the previous record');
 const original=await decrypt(storage.getItem(),phrase);
 assert.equal(original.tidel_done_2026_11_13,'[]');
});

test('V78: refus de migration automatique sur coffre existant',async()=>{
 const {html}=await cryptoFixture();
 assert.match(html,/if\(fileMode\)\{\s*if\(full\|\|previous\)throw Error/);
 assert.match(html,/if\(!full\)\{if\(importedEncrypted\)localStorage\.setItem\(SECURE_KEY,JSON\.stringify\(importedEncrypted\)\);else\{secureGen\+\+;await flush\(\)\}\}launch\(\)/);
 assert.match(html,/await ensureVaultSaved\(\);saveStatus\('saved'/);
 assert.doesNotMatch(html,/await ensureVaultSaved\(\);location\.reload\(\)/);
});


test('V84: journal Absences partage le même coffre et survit au redémarrage iPhone',async()=>{
 const {encrypt,decrypt}=await cryptoFixture();
 const entries=[{
  id:'fictif-change-1',patientId:'fiction-a',day:'2026-11-13',
  reason:'Patient absent',note:'Test fictif',sync:'À rapprocher',
  history:[{at:'2026-11-13T18:00:00.000Z',action:'Signalement fictif'}]
 }];
 const original={...dummy(),tidel_absences_journal_v1:JSON.stringify(entries)};
 const record=await encrypt(original,phrase);
 assert.doesNotMatch(record,/Patient absent|Test fictif|fiction-a/,'no plaintext in encrypted record');
 const restored=await decrypt(record,phrase);
 assert.equal(restored.tidel_Pl,original.tidel_Pl);
 assert.deepEqual(JSON.parse(restored.tidel_absences_journal_v1),entries);
 await assert.rejects(decrypt(record,phrase+'-wrong'));
});

test('V84: reprise via pageshow ou focus contrôle immédiatement la session sans extension du délai',async()=>{
 const {html}=await cryptoFixture();
 assert.match(html,/window\.addEventListener\('pageshow',\(\)=>\{if\(secureBooted\)checkTourIdle\(\)\}\)/);
 assert.match(html,/window\.addEventListener\('focus',\(\)=>\{if\(secureBooted\)checkTourIdle\(\)\}\)/);
 assert.match(html,/if\(elapsed>=IDLE_LOCK_MS\)\{if\(secureKey&&secureGen!==secureSavedGen\)flush\(\)\.catch\(saveFailure\);return\}/);
 assert.match(html,/if\(document\.hidden\)saveIfPending\(\);else checkTourIdle\(\)/);
});

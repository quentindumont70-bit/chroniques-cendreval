import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';

const read=name=>readFile(new URL('../big-cthu-beta/'+name,import.meta.url),'utf8');
const src=await read('tournee-diagnostic-local.js');
const ctx={module:{exports:{}}};
runInNewContext(src,ctx,{timeout:1200});
const {probe,summarize}=ctx.module.exports;
const fake=object=>({
 get length(){return Object.keys(object).length},
 key(i){return Object.keys(object)[i]??null},
 getItem(k){return Object.hasOwn(object,k)?object[k]:null},
 setItem(){throw Error('Never write patient storage')},
 removeItem(){throw Error('Never delete patient storage')},
 clear(){throw Error('Never clear patient storage')}
});
test('V243: finds a populated legacy list without disclosing names or contact details',()=>{
 const storage=fake({'tidel_Pl':JSON.stringify([{n:'PATIENT SECRET',a:'EXAMPLE STREET'},{n:'PATIENT 2',a:'EXAMPLE 2'}]),'tidel_memo_2026-11-18':'patient-private'});
 const report=probe(storage);
 assert.equal(report.legacy.status,'present');
 assert.equal(report.legacy.count,2);
 assert.equal(report.otherKeys,2);
 const safe=summarize(report);
 assert.match(safe,/Ancienne liste locale : 2/);
 assert.doesNotMatch(safe,/PATIENT SECRET|EXAMPLE STREET|patient-private/);
});
test('V243: distinguishes an empty original list from encrypted vault presence (which is not proof of patients)',()=>{
 const report=probe(fake({'tidel_Pl':'[]','bigcthu_tournee_full_encrypted_v1':'ciphertext','bigcthu_tournee_auto_encrypted_v1':'ciphertext'}));
 assert.equal(report.legacy.status,'present');
 assert.equal(report.legacy.count,0);
 assert.equal(report.vaults.original,'present-contenu-inconnu');
 assert.equal(report.vaults.appareil,'present-contenu-inconnu');
 assert.doesNotMatch(summarize(report),/ciphertext/);
});
test('V243: handles corrupted or inaccessible localStorage without replacing it',()=>{
 const bad=probe(fake({'tidel_Pl':'not JSON','bigcthu_tournee_encrypted_v1':'not parsed'}));
 assert.equal(bad.legacy.status,'illisible');
 assert.equal(bad.vaults.precedent,'present-contenu-inconnu');
 const blocked=probe({get length(){throw Error('Storage denied')}});
 assert.equal(blocked.localStorage,'inaccessible');
 assert.equal(blocked.legacy.status,'inconnu');
});
test('V243: mobile rescue page is intentionally read only, private and cached',async()=>{
 const [page,worker]=await Promise.all(['tournee-diagnostic.html','sw.js'].map(read));
 assert.match(page,/Ne réinitialise pas Tournée/);
 assert.match(page,/Safari/);
 assert.match(page,/Chrome/);
 assert.match(page,/navigator\.clipboard\.writeText\(report\)/);
 assert.match(page,/\.\/tournee-diagnostic-local\.js/);
 assert.doesNotMatch(page,/localStorage\.setItem|localStorage\.removeItem|indexedDB\.deleteDatabase|fetch\s*\(|sendBeacon\s*\(/);
 assert.doesNotMatch(src,/localStorage\.setItem|localStorage\.removeItem|fetch\s*\(|sendBeacon\s*\(/);
 assert.match(worker,/const CACHE='big-cthu-public-v2-v243'/);
 assert.match(worker,/'\.\/tournee-diagnostic\.html'/);
 assert.match(worker,/'\.\/tournee-diagnostic-local\.js'/);
});
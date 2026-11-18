import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {webcrypto} from 'node:crypto';
import {runInNewContext} from 'node:vm';
import {TextEncoder,TextDecoder} from 'node:util';

const read=name=>readFile(new URL('../big-cthu-beta/'+name,import.meta.url),'utf8');
const sandbox={module:{exports:{}},TextEncoder,TextDecoder,Date,Set,JSON,Uint8Array,Error};
runInNewContext(await read('idel-echeances-core.js'),sandbox,{timeout:1500});
const C=sandbox.module.exports;
const entry=(kind,due,ref='REF-001')=>({id:'uuid-ref-10001',ref,kind,due,requested:false});

test('V231: aucun nom ou NIR demandé dans le modèle de suivi',()=>{
 assert.equal(C.validEntry(entry('ordonnance','2026-12-22')),true);
 assert.equal(C.validEntry(entry('ordonnance','2026-12-22','Patient Dupont')),false);
 assert.equal(C.validEntry(entry('bsi','2026-12-22','188012345678901')),false);
 assert.equal(C.validEntry(entry('bsi','2026-12-22','REF_2')),true);
 assert.equal(C.validEntry(entry('soin','2026-12-22')),false);
 assert.equal(C.validItems([entry('bsi','2026-12-22'),entry('bsi','2026-12-23')]),false);
});

test('V233: l’ordonnance utilise une échéance explicite et des alertes à J-30',()=>{
 const patient=entry('ordonnance','2027-01-20');
 assert.equal(C.assess(patient,'2026-12-20').alert,'later');
 assert.equal(C.assess(patient,'2026-12-21').needsPrescription,true);
 assert.equal(C.assess(patient,'2027-01-20').overdue,true);
 assert.equal(C.assess({...patient,requested:true},'2027-01-18').needsPrescription,false);
});

test('V234: BSI annuel : nouvelle prescription à J-45, BSI à J-30, intermédiaire ne décale pas',()=>{
 const bsi=entry('bsi','2027-01-18');
 assert.equal(C.assess(bsi,'2026-12-03').needsPrescription,false);
 assert.equal(C.assess(bsi,'2026-12-04').needsPrescription,true);
 assert.equal(C.assess(bsi,'2026-12-18').needsBsi,false);
 assert.equal(C.assess(bsi,'2026-12-19').needsBsi,true);
 assert.equal(C.addYear('2026-11-18'),'2027-11-18');
 assert.equal(C.addYear('2024-02-29'),'2025-02-28');
 assert.equal(C.dateOK('2026-02-29'),false);
});

test('V232: AES-GCM PBKDF2 chiffre le coffre, refus de la phrase secrète erronée',async()=>{
 const phrase='PhraseSecreteLongue-2026!';
 const opened=await C.create(phrase,webcrypto);
 assert.equal(C.validEnvelope(opened.envelope),true);
 assert.equal(opened.envelope.data.includes('REF-001'),false);
 const bsi=entry('bsi','2027-01-18');
 const encrypted=await C.seal([bsi],opened.key,opened.envelope.salt,webcrypto);
 assert.equal(encrypted.data.includes('REF-001'),false);
 const recovered=await C.unlock(phrase,encrypted,webcrypto);
 assert.equal(recovered.items[0].ref,'REF-001');
 assert.deepEqual(JSON.parse(JSON.stringify(recovered.items)),[bsi]);
 await assert.rejects(C.unlock('PhraseIncorrecte-2026',encrypted,webcrypto),/incorrecte|endommagé/);
 assert.equal(C.validEnvelope({...encrypted,data:'<data patient>'}),false);
 await assert.rejects(C.create('short',webcrypto),/12 caractères/);
});

test('V235–V236: calendrier sans identifiant et alarmes 45/30/14/7 jours',()=>{
 const file=C.ics([entry('bsi','2027-01-18','SECRET_REF'),{...entry('ordonnance','2027-01-25'),id:'uuid-ref-10002',ref:'RX_2'}]);
 assert.match(file,/BEGIN:VCALENDAR/);
 assert.match(file,/TRIGGER:-P45D/);
 assert.match(file,/TRIGGER:-P30D/);
 assert.match(file,/TRIGGER:-P14D/);
 assert.match(file,/TRIGGER:-P7D/);
 assert.doesNotMatch(file,/SECRET_REF|RX_2|NIR|Patient Dupont/);
 assert.match(file,/SUMMARY:Vérifier une échéance professionnelle dans Big Cthu/);
});

test('V237: séparé de Tournée et Topaze, accès amelipro officiel, hors ligne',async()=>{
 const [html,js,core,sw,cockpit]=await Promise.all(['idel-echeances.html','idel-echeances.js','idel-echeances-core.js','sw.js','index.html'].map(read));
 assert.match(html,/https:\/\/espacepro\.ameli\.fr\//);
 assert.match(html,/id="passphrase" type="password"/);
 assert.match(html,/id="exportCalendar"/);
 assert.match(js,/window\.addEventListener\('pagehide',lock\)/);
 assert.match(js,/C\.seal\(next,key,envelope\.salt,window\.crypto\)/);
 assert.match(core,/PBKDF2/);
 assert.match(core,/AES-GCM/);
 assert.match(sw,/'\.\/idel-echeances\.html'/);
 assert.match(sw,/'\.\/idel-echeances-core\.js'/);
 assert.match(sw,/'\.\/idel-echeances\.js'/);
 assert.match(sw,/big-cthu-public-v2-v237/);
 assert.match(cockpit,/id="openIdelDeadlines"/);
 assert.doesNotMatch(js,/fetch\(|XMLHttpRequest|WebSocket|sendBeacon|tidel_|Topaze/);
 assert.doesNotMatch(core,/fetch\(|XMLHttpRequest|WebSocket|sendBeacon|tidel_|Topaze/);
});

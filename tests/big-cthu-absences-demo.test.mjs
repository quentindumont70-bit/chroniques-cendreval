import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {SAMPLE_CHANGES,REASONS,SYNC_STATES,filterChanges,summary} from '../big-cthu-beta/absences-demo-core.js';

const file=name=>readFile(new URL('../big-cthu-beta/'+name,import.meta.url),'utf8');
test('V81 : exemples strictement fictifs et états filtrables sans connexion Topaze',()=>{
 assert.equal(SAMPLE_CHANGES.length,4);
 assert.ok(SAMPLE_CHANGES.every(r=>r.id.startsWith('demo-')&&r.alias.startsWith('Exemple ')));
 assert.equal(filterChanges(SAMPLE_CHANGES,{from:'2026-11-11',to:'2026-11-12'}).length,2);
 assert.equal(filterChanges(SAMPLE_CHANGES,{from:'2026-11-13',to:'2026-11-10'}).length,0);
 assert.equal(filterChanges(SAMPLE_CHANGES,{reason:'Patient absent'}).length,1);
 assert.equal(filterChanges(SAMPLE_CHANGES,{sync:'À rapprocher'}).length,2);
 assert.equal(filterChanges(SAMPLE_CHANGES,{reason:'Inexistant'}).length,0);
 assert.ok(REASONS.includes('Soin non réalisé'));
 assert.ok(SYNC_STATES.includes('Vérifié localement'));
});
test('V81 : récapitulatif des soins fictifs respecte filtres et historique',()=>{
 assert.deepEqual(summary(SAMPLE_CHANGES),{total:4,absences:1,soins:1,horaires:1,aRapprocher:2});
 assert.equal(summary(filterChanges(SAMPLE_CHANGES,{reason:'Patient absent'})).absences,1);
 assert.ok(SAMPLE_CHANGES.every(r=>Array.isArray(r.history)&&r.history.length>0));
});
test('V81 : page indépendante sans lecture, import, écriture ou réseau sur de vrais patients',async()=>{
 const [html,core,cockpit]=await Promise.all([file('absences-demo.html'),file('absences-demo-core.js'),file('index.html')]);
 assert.match(html,/BAC À SABLE — DONNÉES 100 % FICTIVES/);
 assert.match(html,/id="from"/);
 assert.match(html,/id="to"/);
 assert.match(html,/id="reason"/);
 assert.match(html,/id="sync"/);
 assert.match(html,/id="events"/);
 assert.match(html,/absences-demo-core\.js/);
 assert.match(cockpit,/id="openAbsencesFictives"/);
 assert.doesNotMatch(html+core,/localStorage|sessionStorage|indexedDB|fetch\s*\(|XMLHttpRequest|WebSocket|tidel_Pl|importAll|topaze\.fr/i);
});

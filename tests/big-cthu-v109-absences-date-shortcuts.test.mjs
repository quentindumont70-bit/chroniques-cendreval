import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';

const read=()=>readFile(new URL('../big-cthu-beta/tournee-complete.html',import.meta.url),'utf8');
async function fixture(){
 const html=await read();
 const start=html.indexOf('function absenceWeekStart(');
 const end=html.indexOf('function absencePeriodRows(',start);
 assert.ok(start>0&&end>start);
 const ctx={Date,absenceDateOK:day=>/^\d{4}-\d{2}-\d{2}$/.test(day)&&!Number.isNaN(Date.parse(day+'T12:00:00Z'))};
 runInNewContext(html.slice(start,end)+'\nthis.quick=absenceQuickRange;',ctx,{timeout:1000});
 return {html,quick:(today,mode)=>ctx.quick(today,mode)};
}

test('V109: 7 derniers jours inclut aujourd hui et traverse correctement les mois',async()=>{
 const f=await fixture();
 assert.deepEqual(JSON.parse(JSON.stringify(f.quick('2026-11-13','7days'))),{from:'2026-11-07',to:'2026-11-13'});
 assert.deepEqual(JSON.parse(JSON.stringify(f.quick('2026-03-02','7days'))),{from:'2026-02-24',to:'2026-03-02'});
});

test('V109: 30 derniers jours inclut aujourd hui, change d année et respecte février bissextile',async()=>{
 const f=await fixture();
 assert.deepEqual(JSON.parse(JSON.stringify(f.quick('2026-01-03','30days'))),{from:'2025-12-05',to:'2026-01-03'});
 assert.deepEqual(JSON.parse(JSON.stringify(f.quick('2024-03-01','30days'))),{from:'2024-02-01',to:'2024-03-01'});
});

test('V109: aujourd hui, semaine et réinitialisation conservent leur comportement',async()=>{
 const f=await fixture();
 assert.deepEqual(JSON.parse(JSON.stringify(f.quick('2026-11-13','today'))),{from:'2026-11-13',to:'2026-11-13'});
 assert.deepEqual(JSON.parse(JSON.stringify(f.quick('2026-11-13','week'))),{from:'2026-11-09',to:'2026-11-15'});
 assert.deepEqual(JSON.parse(JSON.stringify(f.quick('2026-11-13','clear'))),{from:'',to:''});
 assert.deepEqual(JSON.parse(JSON.stringify(f.quick('invalide','7days'))),{from:'',to:''});
});

test('V109: boutons tactile 7/30 jours et filtres locaux sans données transmises',async()=>{
 const {html}=await fixture();
 assert.match(html,/id="ap-7days">7 derniers jours/);
 assert.match(html,/id="ap-30days">30 derniers jours/);
 assert.match(html,/\['ap-7days','7days'\],\['ap-30days','30days'\]/);
 const from=html.indexOf('function absenceWeekStart('),to=html.indexOf('function absencePeriodRows(',from);
 assert.doesNotMatch(html.slice(from,to),/fetch\(|XMLHttpRequest|localStorage|TOUR_STORE|topaze\.fr/);
 assert.match(html,/id="tour-security-gate" hidden/);
});

import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';

const source=()=>readFile(new URL('../big-cthu-beta/tournee-complete.html',import.meta.url),'utf8');
async function fixture(){
 const html=await source();
 const start=html.indexOf("const ABSENCE_REASONS=['Patient absent'");
 const end=html.indexOf('function absenceRender(){',start);
 assert.ok(start>0&&end>start,'journal summary helpers present');
 const context={Date,Map,Object,Array,JSON};
 runInNewContext(html.slice(start,end)+
 '\nthis.report=absencePeriodReport;this.filter=absencePeriodRows;this.topaze=absenceTopazeText;this.week=absenceWeekStart;this.quick=absenceQuickRange;',context,{timeout:1000});
 return {context,html};
}
const item=(id,day,reason='Patient absent',sync='À rapprocher',cancelled=false)=>({
 id,day,patientId:'fictif-1',patientName:'PERSONNE FICTIVE IDENTIFIABLE',
 note:'OBSERVATION FICTIVE CONFIDENTIELLE',reason,sync,cancelled,
 history:[{at:'2026-11-13T12:00:00Z',action:'Signalement fictif'}]
});
const rows=[
 item('a','2026-11-09','Patient absent'), // dimanche : semaine précédente
 item('b','2026-11-10','Patient absent'),
 item('c','2026-11-10','Soin non réalisé','Vérifié localement'),
 item('d','2026-11-11','Horaire modifié','À rapprocher',true),
 item('e','2026-11-17','Autre','À rapprocher')
];

test('V90: regroupement journalier et semaines commençant le lundi en UTC',async()=>{
 const {context}=await fixture();
 assert.equal(context.week('2026-11-09'),'2026-11-09');
 assert.equal(context.week('2026-11-10'),'2026-11-09');
 assert.equal(context.week('2026-11-15'),'2026-11-09');
 assert.equal(context.week('2026-11-16'),'2026-11-16');
 assert.equal(context.week('mauvais'), '');
 const grouped=context.report(rows);
 assert.deepEqual(JSON.parse(JSON.stringify(grouped.daily.map(([date,value])=>[date,value.total]))),[['2026-11-09',1],['2026-11-10',2],['2026-11-17',1]]);
 assert.deepEqual(JSON.parse(JSON.stringify(grouped.weekly.map(([date,value])=>[date,value.total]))),[['2026-11-09',3],['2026-11-16',1]]);
 assert.equal(grouped.weekly[0][1].toReview,2);
 assert.equal(grouped.daily[1][1].reasons['Soin non réalisé'],1);
});

test('V90: périodes, statuts et motifs restent indépendants des signalements annulés',async()=>{
 const {context}=await fixture();
 const selected=context.filter(rows,{from:'2026-11-10',to:'2026-11-11'});
 assert.equal(selected.length,3);
 assert.equal(context.report(selected).daily.length,1);
 assert.equal(context.report(selected).weekly[0][1].total,2);
 assert.equal(context.filter(rows,{from:'2026-11-12',to:'2026-11-09'}).length,0);
 assert.equal(context.filter(rows,{reason:'Soin non réalisé'}).length,1);
 assert.equal(context.filter(rows,{sync:'Vérifié localement'}).length,1);
});

test('V90: note Topaze sans identifiants ni observations, aucune facturation automatique',async()=>{
 const {context,html}=await fixture();
 const note=context.topaze(rows,{from:'2026-11-10',to:'2026-11-17'});
 assert.match(note,/BILAN MANUEL/);
 assert.match(note,/PAR JOUR/);
 assert.match(note,/PAR SEMAINE/);
 assert.match(note,/A rapprocher : 2/);
 assert.match(note,/Soin non réalisé : 1/);
 assert.doesNotMatch(note,/PERSONNE FICTIVE IDENTIFIABLE|fictif-1|OBSERVATION FICTIVE CONFIDENTIELLE/);
 assert.match(note,/chaque acte et facture restent geres dans Topaze/);
 assert.match(html,/id="ap-copy-summary"/);
 assert.match(html,/navigator\.clipboard\.writeText\(text\)/);
 const journal=html.slice(html.indexOf('// V83 :'),html.indexOf('const IDLE_LOCK_MS='));
 assert.doesNotMatch(journal,/fetch\(|XMLHttpRequest|WebSocket|topaze\.fr|localStorage\.setItem\(/i);
});

test('V90: commande iPhone et éléments de synthèse disposent de grandes zones tactiles',async()=>{
 const {html}=await fixture();
 assert.match(html,/\.ap-closebar\{position:sticky/);
 assert.match(html,/#tour-absence-panel button\{min-height:44px/);
 assert.match(html,/#tour-absence-panel #ap-period-report\{display:grid/);
 assert.match(html,/@media\(max-width:600px\)\{#tour-absence-panel \.ap-grid,#tour-absence-panel #ap-period-report\{grid-template-columns:1fr/);
 assert.match(html,/id="ap-topaze-note"/);
 assert.match(html,/id="ap-period-report"/);
});

test('V91: raccourcis jour et semaine utilisent la date locale sans décalage UTC',async()=>{
 const {context}=await fixture();
 assert.deepEqual(JSON.parse(JSON.stringify(context.quick('2026-11-13','today'))),{from:'2026-11-13',to:'2026-11-13'});
 assert.deepEqual(JSON.parse(JSON.stringify(context.quick('2026-11-13','week'))),{from:'2026-11-09',to:'2026-11-15'});
 assert.deepEqual(JSON.parse(JSON.stringify(context.quick('2026-11-15','week'))),{from:'2026-11-09',to:'2026-11-15'});
 assert.deepEqual(JSON.parse(JSON.stringify(context.quick('2026-11-16','week'))),{from:'2026-11-16',to:'2026-11-22'});
 assert.deepEqual(JSON.parse(JSON.stringify(context.quick('mauvais','week'))),{from:'',to:''});
 assert.deepEqual(JSON.parse(JSON.stringify(context.quick('2026-11-13','clear'))),{from:'',to:''});
});

test('V91: raccourcis tactile ne modifient ni dossiers ni stockage lors du filtrage',async()=>{
 const html=await source();
 for(const id of ['ap-today','ap-week','ap-clear'])assert.match(html,new RegExp('id="'+id+'"'));
 assert.match(html,/function absenceSetQuickRange\(mode\)/);
 assert.match(html,/ap\('ap-from'\)\.value=dates\.from;ap\('ap-to'\)\.value=dates\.to/);
 assert.match(html,/absenceRender\(\);noteTourActivity\(\)/);
 assert.match(html,/\.ap-shortcuts\{display:flex/);
 const filters=html.slice(html.indexOf('function absenceTodayLocal(){'),html.indexOf("ap('ap-copy-summary').addEventListener"));
 assert.doesNotMatch(filters,/localStorage|TOUR_STORE|fetch\(|XMLHttpRequest|topaze\.fr/i);
});

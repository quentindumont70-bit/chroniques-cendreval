import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext,Script} from 'node:vm';

const read=name=>readFile(new URL('../big-cthu-beta/'+name,import.meta.url),'utf8');
// Les fonctions rendues par vm appartiennent à un autre realm JavaScript.
const assertSame=(actual,expected)=>assert.deepEqual(JSON.parse(JSON.stringify(actual)),expected);
const c0=()=>({a:'2026-11-02',from:'2026-11-01',ch:[1,4],gr:[2,5]});
async function core(){
 const s=await read('tournee-quick-core.js'),module={exports:{}};
 runInNewContext(s,{module,Date,JSON,Map,Set,Number,String,Object},{timeout:1000});
 return module.exports;
}
async function fixture({override=[],patient=null,corrupt=false,today='2026-11-20'}={}){
 const html=await read('tournee-complete.html');
 const script=html.split('<script type="text/plain" id="tour-source-js">')[1]?.split('</script>')[0];
 assert.ok(script,'source chiffrée isolable');
 const start=script.indexOf('/* V262 — accessible from an existing patient');
 const end=script.indexOf('function sx(p)',start);
 assert.ok(start>0&&end>start);
 const TQ=await core(),p=patient||{id:'FICTIF-123',n:'TEST Calendrier',cyc:c0()};
 const records=override,notices=[];
 const DT=s=>new Date(s+'T12:00:00');
 const ctx={
  P:[p],TQ,TODAY:today,DT,
  JC:['Dim','Lun','Mar','Mer','Jeu','Ven','Sam'],
  tqWeeks:strict=>{if(corrupt&&strict)throw Error('Exceptions illisibles');return records;},
  esc:value=>String(value).replace(/[&<>"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch])),
  toast:value=>notices.push(value),confirm:()=>false,
  cfgSave:async()=>true,ensureVaultSaved:async()=>{},render(){},fiche(){},
  document:{getElementById:()=>null}
 };
 ctx.cyk=(patient,date)=>{
  const ov=TQ.overrideFor(records,patient.id,date),mode=ov?ov.mode:TQ.weekMode(patient.cyc,date);
  if(patient.cyc.from&&date<patient.cyc.from)return '';
  const weekdays=ov?ov.days:patient.cyc[mode];
  return weekdays&&weekdays.includes(DT(date).getDay())?mode:'';
 };
 ctx.onDate=(patient,date)=>{
  if(patient.deb&&date<patient.deb||patient.fin&&date>patient.fin)return false;
  if(patient.suspDates?.includes(date))return false;
  if(patient.only)return patient.only.includes(date);
  if(patient.rm?.includes(date))return false;
  if(patient.add?.includes(date))return true;
  return !!ctx.cyk(patient,date);
 };
 runInNewContext(script.slice(start,end)+'\nthis.api={fortnight:tqCycleFortnight,block:tqCyclePhaseBlock,switch:tqCyclePhaseSwitchById};',ctx,{timeout:1000});
 return {ctx,p,TQ,api:ctx.api,notices};
}
test('V263 : calendrier de 14 jours (lundi à dimanche), labels basés sur le vrai cycle',async()=>{
 const f=await fixture(),weeks=Array.from(f.api.fortnight(f.p,'2026-11-20'));
 assertSame(weeks.map(x=>x.week),['2026-11-16','2026-11-23']);
 assertSame(weeks.map(x=>x.effective),['ch','gr']);
 assert.equal(weeks[0].days.length,7);assert.equal(weeks[1].days.length,7);
 assertSame(weeks[0].days.map(x=>x.date),['2026-11-16','2026-11-17','2026-11-18','2026-11-19','2026-11-20','2026-11-21','2026-11-22']);
 assertSame(weeks[0].days.filter(x=>x.active).map(x=>x.date),['2026-11-16','2026-11-19']);
 assertSame(weeks[1].days.filter(x=>x.active).map(x=>x.date),['2026-11-24','2026-11-27']);
 const html=f.api.block(f.p);
 assert.match(html,/Aperçu du planning enregistré/);
 assert.match(html,/Passages prévus de la semaine du 2026-11-16/);
 assert.match(html,/Passages prévus de la semaine du 2026-11-23/);
 assert.match(html,/aria-label="Mar 2026-11-17 : pas de passage"/);
 assert.match(html,/aria-label="Jeu 2026-11-19 : passage prévu"/);
});
test('V263 : l inversion des semaines est visible dans le calendrier de la fiche',async()=>{
 const f=await fixture();
 const after=f.TQ.togglePhase(f.p.cyc,'2026-11-20');
 const updated={...f.p,cyc:after};
 const weeks=Array.from(f.api.fortnight(updated,'2026-11-20'));
 assertSame(weeks.map(x=>x.effective),['gr','ch']);
 assertSame(weeks[0].days.filter(x=>x.active).map(x=>x.date),['2026-11-17','2026-11-20']);
 assertSame(weeks[1].days.filter(x=>x.active).map(x=>x.date),['2026-11-23','2026-11-26']);
 assert.match(f.api.block(updated),/Semaine prochaine/);
 assert.match(f.api.block(updated),/Granocytes/);
 assert.equal(f.TQ.weekMode(after,'2026-11-09'),f.TQ.weekMode(f.p.cyc,'2026-11-09'));
});
test('V263 : une exception de semaine affiche le traitement EFFECTIF, pas seulement le cycle de fond',async()=>{
 const f=await fixture({override:[{pid:'FICTIF-123',week:'2026-11-16',mode:'gr',days:[1,3]}]});
 const w=f.api.fortnight(f.p,'2026-11-20');
 assert.equal(w[0].base,'ch');
 assert.equal(w[0].effective,'gr');
 assert.equal(w[0].override.mode,'gr');
 assertSame(w[0].days.filter(x=>x.active).map(x=>x.date),['2026-11-16','2026-11-18']);
 const html=f.api.block(f.p);
 assert.match(html,/Exception manuelle prioritaire · cycle de fond : Chimio/);
 assert.match(html,/le type de semaine affiché peut donc ne pas changer/);
 assert.match(html,/Inverser Granocytes \/ chimio/);
});
test('V263 : ajout ponctuel hors cycle et suppression d une date visibles sans acte inventé',async()=>{
 const patient={id:'FICTIF-123',n:'TEST Calendrier',cyc:c0(),add:['2026-11-18'],rm:['2026-11-19']};
 const f=await fixture({patient}),w=f.api.fortnight(patient,'2026-11-20')[0];
 assert.equal(w.days[2].active,true);
 assert.equal(w.days[2].extra,true);
 assert.equal(w.days[3].active,false);
 const html=f.api.block(patient);
 assert.match(html,/Mer 2026-11-18 : passage ponctuel/);
 assert.match(html,/Jeu 2026-11-19 : pas de passage/);
 assert.match(html,/signe \+ indique un passage hors cycle/);
});
test('V263 : date exclusive et suspension modifient les jours prévus affichés',async()=>{
 const patient={id:'FICTIF-123',n:'TEST Calendrier',cyc:c0(),only:['2026-11-18','2026-11-19'],suspDates:['2026-11-19']};
 const f=await fixture({patient}),w=f.api.fortnight(patient,'2026-11-20')[0];
 assertSame(w.days.filter(x=>x.active).map(x=>x.date),['2026-11-18']);
 assert.equal(w.days[2].extra,true);
 assert.equal(w.days[3].active,false);
 assert.match(f.api.block(patient),/2026-11-18 : passage ponctuel/);
});
test('V263 : exceptions corrompues => avertissement et aucun bouton d inversion',async()=>{
 const f=await fixture({corrupt:true});
 const html=f.api.block(f.p);
 assert.match(html,/Cycle ou exceptions de semaines illisibles/);
 assert.doesNotMatch(html,/onclick="tqCyclePhaseSwitchById/);
 assert.equal(f.notices.length,0);
});
test('V263 : absence de cycle ne crée pas un calendrier et données de fiche échappées',async()=>{
 const f=await fixture({patient:{id:'FICTIF-1',n:'Sans cycle'}});
 assert.equal(f.api.block(f.p),'');
 const withCycle={id:'FICTIF-123',n:'<script>TEST</script>',cyc:c0()};
 const f2=await fixture({patient:withCycle});
 assert.doesNotMatch(f2.api.block(withCycle),/<script>/);
});
test('V263 : responsive CSS iPhone sans dépendance distante et label accessible',async()=>{
 const css=await read('tournee-v263-calendar.css');
 assert.match(css,/\.tq-cycle-weekdays\{[^}]*repeat\(7,minmax\(0,1fr\)\)/);
 assert.match(css,/\.tq-cycle-day\{[^}]*min-height:70px/);
 assert.match(css,/@media\(max-width:390px\)/);
 assert.match(css,/@media\(max-width:340px\)/);
 assert.match(css,/prefers-reduced-motion:reduce/);
 assert.doesNotMatch(css,/@import|url\(|https?:\/\//);
 const page=await read('tournee-complete.html');
 assert.match(page,/<link rel="stylesheet" href="\.\/tournee-v263-calendar\.css">/);
 assert.match(page,/role="listitem"/);
});
test('V263 : cache offline public et non-régression de l ancien écran',async()=>{
 const [sw,control,pkg,plan]=await Promise.all([
  read('sw.js'),read('tournee-controle-iphone.html'),
  readFile(new URL('../package.json',import.meta.url),'utf8'),
  readFile(new URL('../docs/tournee-pro/PLAN-DE-LANCEMENT.md',import.meta.url),'utf8')
 ]);
 assert.match(sw,/big-cthu-public-v2-v265/);
 assert.match(sw,/'\.\/tournee-v263-calendar\.css'/);
 assert.match(control,/big-cthu-public-v2-v265/);
 assert.match(pkg,/tests\/tournee-v263-effective-calendar\.test\.mjs/);
 assert.match(plan,/Golipette V263/);
 const app=await read('tournee-complete.html');
 assert.match(app,/function tqCyclePhaseSwitchById\(pid\)/);
 assert.match(app,/await cfgSave\('Alternance modifiée'\)/);
 assert.match(app,/await ensureVaultSaved\(\)/);
 assert.match(app,/function writeEncryptedVaultRecord\(record\)/);
 const script=app.split('<script type="text/plain" id="tour-source-js">')[1]?.split('</script>')[0];
 assert.doesNotThrow(()=>new Script(script));
});

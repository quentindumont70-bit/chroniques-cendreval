import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

function load(file,bindings,entries={}){
 const source=readFileSync(new URL('../public/binch/'+file,import.meta.url),'utf8');
 const marker="if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',";
 assert.ok(source.includes(marker),'expected initialization guard: '+file);
 const values=new Map(Object.entries(entries));
 const sandbox={
  document:{readyState:'loading',addEventListener(){}},
  window:{addEventListener(){}},
  localStorage:{getItem:k=>values.get(k)??null}
 };
 runInNewContext(source.replace(marker,'globalThis.__test={'+bindings+'};\n'+marker),sandbox,{filename:file});
 return sandbox.__test;
}
const day=(d)=>[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');

test('GM hebdomadaire: créneaux réellement futurs, dates invalides et horizon de 7 jours',()=>{
 const base=new Date(2026,10,18,12,0,0),date=day(base),tomorrow=new Date(base);tomorrow.setDate(base.getDate()+1);
 const far=new Date(base);far.setDate(base.getDate()+9);
 const e=(id,d,time,kind='Donjon')=>({id,title:id,kind,date:d,time,size:5,done:false,attendees:[]});
 const entries={ 'binch.guild.events.v1':JSON.stringify([
  e('passe',date,'08:00'),e('soir',date,'20:00'),e('demain',day(tomorrow),'19:00'),
  e('trop-loin',day(far),'19:00'),e('fausse-date','2026-02-30','20:00'),
  e('fausse-heure',date,'99:99'),e('sans-titre',date,'20:00')
 ])};
 const gm=load('guild-weekly.js','currentEvents,metrics,validEvent',entries);
 const selected=gm.currentEvents(+base).map(x=>x.id);
 assert.deepEqual(Array.from(selected),['soir','sans-titre','demain']);
 assert.equal(gm.validEvent(e('f','2026-02-30','19:00')),false);
 assert.equal(gm.validEvent(e('f',date,'25:00')),false);
});

test('GM hebdomadaire: une même personne ne remplit jamais deux places',()=>{
 const gm=load('guild-weekly.js','metrics');
 const e={kind:'Donjon',size:5,attendees:[
  {name:'Bobinch',status:'Confirmé',role:'Tank'},
  {name:' bobinch ',status:'Confirmé',role:'DPS'},
  {name:'Steph',status:'Confirmé',role:'Soigneur'},
  {name:'Eli',status:'Incertain',role:'DPS'},
  {name:'SansRole',status:'Confirmé',role:'Mystère'}
 ]};
 const m=gm.metrics(e);
 assert.equal(m.count,2);assert.equal(m.tanks,1);assert.equal(m.healers,1);
 assert.equal(m.duplicates,1);assert.equal(m.uncertain,1);
 assert.ok(m.flags.some(x=>x.includes('en double')));
 assert.ok(m.flags.some(x=>x.includes('3 place')));
 const quests=gm.metrics({...e,kind:'Quêtes',attendees:[{name:'A',status:'Confirmé',role:'DPS'}]});
 assert.ok(!quests.flags.some(x=>x.includes('Tank')));
 assert.ok(!quests.flags.some(x=>x.includes('Soigneur')));
});

test('Tableau GM: participants uniques, surcapacités et échéances malformées',()=>{
 const now=new Date(),future=new Date(now.getTime()+86400000);
 const date=day(future);
 const members=[
  {name:'Bob',role:'Tank',status:'Confirmé'},
  {name:'bob',role:'DPS',status:'Confirmé'},
  {name:'Steph',role:'Soigneur',status:'Confirmé'},
  {name:'Joe',role:'DPS',status:'Confirmé'}
 ];
 const request={id:'r1',title:'Potions',quantity:10,priority:'urgent',closed:false,deadline:'date incorrecte',
  contributions:[
   {id:'1',character:'Bob',status:'confirmed',quantity:5},
   {id:'2',character:' bob ',status:'confirmed',quantity:5},
   {id:'3',character:'Steph',status:'deposited',quantity:9},
   {id:'4',character:'Eli',status:'confirmed',quantity:2}
  ]};
 const events=[{id:'e1',title:'Donjon',kind:'Donjon',size:3,date,time:'20:00',attendees:members,done:false},
  {id:'e2',title:'Faussé',kind:'Donjon',size:5,date:'2026-02-30',time:'20:00',attendees:[],done:false}];
 const gm=load('gm-watchboard.js','stamp,snapshot,roleCounts,missing,summary,actionPlan',{
  'binch.guild.events.v1':JSON.stringify(events),
  'binch.guild.planner.v1':JSON.stringify({requests:[request]}),
  'binch.guild.delegations.v1':'[{"title":"Préparer les potions","status":"blocked"}]'
 });
 const s=gm.snapshot();
 assert.equal(s.upcoming.length,1,'date erronée exclue');
 assert.equal(s.fulfillment[0].received,7,'dépôt en double non compté');
 assert.equal(s.tasks.length,1);
 const counts=gm.roleCounts(events[0]);assert.equal(counts.total,3);assert.equal(counts.duplicates,1);
 const m=gm.missing(events[0]);assert.equal(m.excess,0);
 const overflow=gm.missing({...events[0],size:2});
 assert.equal(overflow.excess,1);
 const summary=gm.summary(s);
 assert.ok(summary.includes('doublon(s) à vérifier'));
 const actions=gm.actionPlan(s);
 assert.ok(actions.some(x=>x.label.includes('Dédoublonner')));
 assert.ok(actions.some(x=>x.label.includes('Approvisionnement')&&x.detail.includes('3 unité(s)')));
 assert.ok(actions.some(x=>x.label.includes('Débloquer')));
 assert.ok(!summary.includes('Invalid Date'));
});

test('Checklist GM : besoins de groupes explicites sans statut WoW inventé',()=>{
 const gm=load('gm-watchboard.js','actionPlan');
 const event={kind:'Donjon',title:'Mortemines',size:5,attendees:[
  {name:'DPS-1',status:'Confirmé',role:'DPS'},
  {name:'DPS-2',status:'Confirmé',role:'DPS'}
 ]};
 const fake={upcoming:[event],requests:[],fulfillment:[],tasks:[]};
 const tasks=gm.actionPlan(fake);
 assert.ok(tasks.some(t=>t.label.includes('Inscrits à confirmer')&&t.detail.includes('3 place')));
 assert.ok(tasks.some(t=>t.label.includes('Tank à confirmer')));
 assert.ok(tasks.some(t=>t.label.includes('Soigneur à confirmer')));
 assert.ok(tasks.every(t=>!t.detail.includes('synchronisé dans WoW')));
});

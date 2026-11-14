import test from 'node:test';
import assert from 'node:assert/strict';
import '../public/binch/journey-engine.js';
const generate=globalThis.BinchJourneyEngine?.generate;
test('Ultimate: class-specific druid talent advice without inventing player talents',()=>{
 const p=generate({className:'Druide',race:'Tauren',level:14,imported:false,discoveries:[{id:'bag-quest',title:'Sac 12 places Horde',level:14,rec:16,priority:110,verified:true,available:true,category:'Secret majeur',source:'https://example.org',sourceName:'Guide sourcé'}]});
 assert.equal(p.profile.level,14);
 assert.ok(p.actions.some(x=>x.id==='discovery:bag-quest'));
 assert.ok(p.actions.some(x=>x.id==='action:talents'));
 assert.ok(p.actions.some(x=>x.id==='action:import'));
 assert.ok(p.next);
 assert.match(p.notice,/Pas de synchronisation WoW en direct/);
});
test('Ultimate: completed/hidden suggestions are not recommended again',()=>{
 const data=[{id:'quest-one',title:'Sac',priority:100,level:10,category:'Sac gratuit',verified:true,available:true}];
 const p=generate({level:18,discoveries:data,completed:['discovery:quest-one']});
 assert.equal(p.actions.some(x=>x.id==='discovery:quest-one'),false);
});
test('Ultimate: professions and modes affect ranking, no fictional economy data',()=>{
 const a=generate({className:'Druide',level:25,professions:['Dépeçage','Travail du cuir'],mode:'profession'});
 const b=generate({className:'Druide',level:25,professions:['Dépeçage','Travail du cuir'],mode:'solo'});
 const crafting=x=>x.actions.find(z=>z.id==='action:leather');
 assert.ok(crafting(a).score>crafting(b).score);
 assert.equal(JSON.stringify(a).includes('prix en cuivre'),false);
});
test('Ultimate: respect manual objective state and bound input',()=>{
 const p=generate({level:11,objectives:[{title:'Fabriquer une tente',id:'tent',level:12,done:false,priority:'Essentiel',type:'Métier'},{title:'Déjà fait',id:'done',done:true}]});
 assert.ok(p.actions.some(x=>x.id==='objective:tent'));
 assert.ok(!p.actions.some(x=>x.id==='objective:done'));
 assert.equal(p.actions.length<=12,true);
});

test('Ultimate: real local guild duties are ranked but never marked as Discord-confirmed',()=>{
 const p=generate({level:21,mode:'dungeon',guildTasks:[{id:'boss',title:'Préparer le groupe de donjon',priority:'urgent',status:'todo'},{id:'finished',title:'Raid terminé',priority:'urgent',status:'done'}]});
 const task=p.actions.find(x=>x.id==='guild:boss');
 assert.ok(task);
 assert.equal(task.page,'gm');
 assert.match(task.description,/pas une confirmation Discord/);
 assert.equal(p.actions.some(x=>x.id==='guild:finished'),false);
});

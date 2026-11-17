/* Executer depuis la racine : node scripts/test-faith-guide.cjs */
const assert=require('node:assert/strict');
const guide=require('../public/binch/faith-guide.js');
const plan={
 next:{id:'custom',title:'Ma quête personnelle',description:'Objectif explicite',page:'hub',origin:'Carnet',when:'now'},
 actions:[
  {id:'custom',title:'Doublon',page:'hub'},
  {id:'dungeon',title:'Préparer le donjon',description:'Préparer le groupe',page:'progression',origin:'Guide'},
  {id:'future',title:'Anticiper le talent',description:'Planifier',page:'specs',level:20,when:'soon'},
  {id:'extra',title:'Ne doit pas apparaître',page:'gm'}
 ]
};
const result=guide.priorities(plan,{same:true});
assert.equal(result.page,'hub');
assert.match(result.text,/Ma quête personnelle/);
assert.match(result.text,/Préparer le donjon/);
assert.match(result.text,/Anticiper le talent/);
assert.doesNotMatch(result.text,/Doublon|Ne doit pas apparaître/);
assert.match(result.text,/dernier import GrimoireSync/);
assert.equal(guide.priorities(null).page,null);
assert.equal(guide.priorities({next:{title:'Tâche',page:'javascript:alert(1)'}}).page,null);
assert.match(guide.profile({name:'Test',className:'Druide',level:16,same:true,date:'2026-11-17T09:00:00Z'},Date.parse('2026-11-17T11:00:00Z')),/2 h depuis la sauvegarde/);
assert.match(guide.profile({name:'Test',same:false}),/profil manuel/);
assert.doesNotMatch(guide.profile({name:'Test',same:false}),/Source : import GrimoireSync correspondant/);
console.log('Faith Guide : 9 contrôles validés');

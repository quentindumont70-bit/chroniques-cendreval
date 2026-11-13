import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';
const code=await readFile(new URL('../big-cthu-beta/cantine-core.js',import.meta.url),'utf8');
const sandbox={module:{exports:{}}};
runInNewContext(code,sandbox,{filename:'cantine-core.js'});
const {analyse,ideas,parseMenuLines}=sandbox.module.exports;
test('Cantine: identifie des groupes textuels sans prétendre évaluer des portions',()=>{
 const groups=analyse({entree:'Salade de tomates',plat:'Poulet rôti',side:'Riz',dairy:'Yaourt',dessert:'Pomme'});
 assert.equal(groups.vegetables,true);
 assert.equal(groups.meat,true);
 assert.equal(groups.starch,true);
 assert.equal(groups.dairy,true);
 assert.equal(groups.fruit,true);
});
test('Cantine: propose des idées de diversité même si le menu est incomplet',()=>{
 const suggestions=ideas({entree:'',plat:'',side:'',dairy:'',dessert:''});
 assert.equal(suggestions.length,3);
 assert.ok(suggestions.every(x=>typeof x.title==='string'&&typeof x.ingredients==='string'));
 assert.equal(new Set(suggestions.map(x=>x.title)).size,3);
});
test('Cantine: recettes sélectionnées ne répètent pas automatiquement les mêmes familles',()=>{
 const suggestions=ideas({entree:'Salade',plat:'Steak de boeuf',side:'Pâtes',dairy:'Fromage',dessert:'Banane'});
 assert.equal(suggestions.length,3);
 assert.ok(suggestions.some(x=>x.tags.includes('legumes')||x.tags.includes('fish')||x.tags.includes('egg')));
});
test('Cantine: UI liée au planificateur et préchargée dans la PWA',async()=>{
 const root=new URL('../big-cthu-beta/',import.meta.url);
 const [page,meals,passions,sw]=await Promise.all(['cantine.html','repas.html','passions.html','sw.js'].map(f=>readFile(new URL(f,root),'utf8')));
 assert.match(page,/big-cthu-v2-canteen-v1/);
 assert.match(page,/big-cthu-v2-meals-v1/);
 assert.match(page,/Aucun nom d'enfant ou d'école n'est nécessaire/);
 assert.match(meals,/cantine\.html/);
 assert.match(passions,/cantine\.html/);
 assert.match(sw,/cantine\.html/);
 assert.match(sw,/cantine-core\.js/);
});

test('Cantine: copier-coller plusieurs jours avec séparateurs et en-tête',()=>{
 const lines='Date;Entrée;Plat;Accompagnement;Laitier;Dessert\n2026-11-16;Salade;Poulet;Riz;Fromage;Pomme\n2026-11-17\tCarottes\tOmelette\tLégumes\tYaourt\tPoire';
 const parsed=parseMenuLines(lines);
 assert.equal(parsed.length,2);
 assert.equal(parsed[0].date,'2026-11-16');
 assert.equal(parsed[1].plat,'Omelette');
 assert.equal(parsed[0].consumed,'inconnu');
});
test('Cantine: import invalide refuse un jour en double, une date inventée ou une ligne vide',()=>{
 assert.throws(()=>parseMenuLines('2026-11-16;A;B\n2026-11-16;C;D'),/double/);
 assert.throws(()=>parseMenuLines('2026-11-31;A;B'),/Ligne/);
 assert.throws(()=>parseMenuLines('2026-11-16;;;'),/vide/);
 assert.throws(()=>parseMenuLines('Date;Entrée;Plat'),/Aucun jour/);
});
test('Cantine: les préférences végétariennes excluent les propositions viande et poisson',()=>{
 const menu={entree:'Salade',plat:'Poulet',side:'Riz',dairy:'Yaourt',dessert:'Pomme'};
 assert.ok(ideas(menu,{vegetarian:true}).every(x=>!x.tags.includes('meat')&&!x.tags.includes('fish')));
 assert.ok(ideas(menu,{noFish:true}).every(x=>!x.tags.includes('fish')));
});
test('Cantine: interface d import et modification reliée au carnet local',async()=>{
 const html=await readFile(new URL('../big-cthu-beta/cantine.html',import.meta.url),'utf8');
 for(const id of ['pasteMenus','previewPaste','importPaste','pastePreview','cancelEdit','formSubmit','foodStyle'])assert.match(html,new RegExp('id="'+id+'"'));
 assert.match(html,/menus\.some\(x=>x.date===m.date&&x.id!==m.id\)/);
});

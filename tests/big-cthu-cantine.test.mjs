import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';
const code=await readFile(new URL('../big-cthu-beta/cantine-core.js',import.meta.url),'utf8');
const sandbox={module:{exports:{}}};
runInNewContext(code,sandbox,{filename:'cantine-core.js'});
const {analyse,ideas}=sandbox.module.exports;
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

import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
const src=readFileSync(new URL('../app/inventory.ts',import.meta.url),'utf8');
const loot=readFileSync(new URL('../app/loot.ts',import.meta.url),'utf8');
const transpile=(code)=>ts.transpileModule(code,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const cache={};
function load(code){const module={exports:{}};new Function('require','module','exports',transpile(code))((id)=>{if(id==='./loot')return cache.loot;throw Error(id)},module,module.exports);return module.exports}
cache.loot=load(loot);const inv=load(src);
test('drops accumulate without mutating old inventory',()=>{const a=inv.emptyInventory();const b=inv.addDrops(a,[cache.loot.ITEMS.ash,cache.loot.ITEMS.ash]);assert.equal(b.items.ash,2);assert.deepEqual(a.items,{})});
test('equipment requires owned compatible item',()=>{const a=inv.addDrops(inv.emptyInventory(),[cache.loot.ITEMS.fang]);assert.equal(inv.equipItem(a,cache.loot.ITEMS.fang).equipped.weapon,'fang');assert.throws(()=>inv.equipItem(a,cache.loot.ITEMS.crown));assert.throws(()=>inv.equipItem(a,cache.loot.ITEMS.ash))});
test('enemy kill yields deterministic drops',()=>{const result=inv.collectEnemyLoot(inv.emptyInventory(),{boss:true,name:'Roi de cendre'},()=>0);assert.equal(result.kind,'ashKing');assert.equal(result.inventory.items.crown,1)});
test('malformed saves cannot inject unknown or mismatched gear',()=>{const state=inv.parseInventory({items:{fang:1,unknown:9,ash:-4},equipped:{armor:'fang',weapon:'fang'}},Object.values(cache.loot.ITEMS));assert.deepEqual(state.items,{fang:1});assert.equal(state.equipped.weapon,'fang');assert.equal(state.equipped.armor,undefined)});

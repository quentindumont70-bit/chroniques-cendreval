import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
const transpile=code=>ts.transpileModule(code,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const modules={};
function load(path){if(modules[path])return modules[path];const source=readFileSync(new URL('../app/'+path+'.ts',import.meta.url),'utf8');const module={exports:{}};new Function('require','module','exports',transpile(source))(id=>load(id.replace('./','')),module,module.exports);return modules[path]=module.exports;}
const loot=load('loot'),inv=load('inventory'),fx=load('equipment-effects');
test('empty inventory has no combat bonuses',()=>{const state=inv.emptyInventory();assert.equal(fx.equipmentAttackBonus(state,'melee'),0);assert.equal(fx.equipmentDamageReduction(state),0)});
test('equipped weapon boosts attacks; trinket stacks',()=>{let s=inv.addDrops(inv.emptyInventory(),[loot.ITEMS.fang,loot.ITEMS.vigil]);s=inv.equipItem(s,loot.ITEMS.fang);s=inv.equipItem(s,loot.ITEMS.vigil);assert.equal(fx.equipmentAttackBonus(s,'melee'),10);assert.equal(fx.equipmentAttackBonus(s,'bow'),7);assert.equal(fx.equipmentAttackBonus(s,'magic'),5)});
test('armor reduces damage, forged state cannot equip unknown items',()=>{let s=inv.addDrops(inv.emptyInventory(),[loot.ITEMS.iron]);s=inv.equipItem(s,loot.ITEMS.iron);assert.equal(fx.equipmentDamageReduction(s),1);const forged={...s,equipped:{weapon:'eclipse'}};assert.equal(fx.equipmentAttackBonus(forged,'melee'),0)});

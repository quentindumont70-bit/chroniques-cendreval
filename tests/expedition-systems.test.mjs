import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
const transpile=code=>ts.transpileModule(code,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const modules={};
function load(path){if(modules[path])return modules[path];const source=readFileSync(new URL('../app/'+path+'.ts',import.meta.url),'utf8');const module={exports:{}};new Function('require','module','exports',transpile(source))(id=>load(id.replace('./','')),module,module.exports);return modules[path]=module.exports;}
const {craft,salvage}=load('forge'),{masteryStats}=load('class-mastery'),{playerStats}=load('rpg'),{DISCOVERIES,discoveryCount}=load('discoveries');
test('forge consumes exact resources, never fabricates prestige loot and preserves equipped last copy',()=>{const s={version:1,items:{ash:24,fang:1},equipped:{weapon:'fang'}};const made=craft(s,'fang');assert.equal(made.items.ash,0);assert.equal(made.items.fang,2);assert.equal(s.items.ash,24);assert.equal(craft(s,'eclipse'),s);assert.equal(craft({...s,items:{ash:7}},'iron').items.ash,7);assert.equal(salvage(s,'fang'),s);const recycled=salvage(made,'fang');assert.equal(recycled.items.fang,1);assert.equal(recycled.items.ash,4);assert.equal(recycled.equipped.weapon,'fang')});
test('class thresholds change stats without mutating the base',()=>{for(const id of ['blade','bow','arcane','hex','cantor','reaver']){const b=playerStats(id);const changed=masteryStats(b,id,30, id==='arcane'?80:20,90);assert.notDeepEqual(changed,b);assert.deepEqual(b,playerStats(id));assert.deepEqual(masteryStats(b,id,100,50,50),b)}});
test('expanded exploration keeps old masks and counts each reward site once',()=>{assert.equal(DISCOVERIES.length,6);assert.equal(discoveryCount(7),3);assert.equal(discoveryCount(63),6);assert.equal(new Set(DISCOVERIES.map(d=>d.id)).size,6)});

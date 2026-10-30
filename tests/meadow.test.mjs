import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
const transpile=code=>ts.transpileModule(code,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const modules={};
function load(path){if(modules[path])return modules[path];const source=readFileSync(new URL('../app/'+path+'.ts',import.meta.url),'utf8');const module={exports:{}};new Function('require','module','exports',transpile(source))(id=>load(id.replace('./','')),module,module.exports);return modules[path]=module.exports;}
const {meadowSurface,MEADOW_SIZE}=load('meadow-surface'),{UNDERSTORY,visibleUnderstory}=load('valley-understory'),{routeDistance}=load('world-art'),{canOccupy}=load('world-rules'),{PLAINS_MAP}=load('world-map');
test('terrain pigments are cached, finite and varied',()=>{const a=meadowSurface();assert.equal(a,meadowSurface());assert.equal(a.length,MEADOW_SIZE*MEADOW_SIZE*3);assert(new Set(a).size>50);assert(a.every(Number.isFinite))});
test('understory preserves travel lanes and the duel arena',()=>{assert(UNDERSTORY.length>30);for(const p of UNDERSTORY){assert(routeDistance(p.x,p.y)>=.7);assert(canOccupy(PLAINS_MAP,p.x,p.y));assert(Math.hypot(p.x-10.5,p.y-8.5)>=2.2);assert(p.parts.length<=7)}});
test('ground cover stays within the mobile draw budget from every bearing',()=>{for(let a=0;a<Math.PI*2;a+=.2){const found=visibleUnderstory(10,12,a,Math.PI/3,1);assert(found.length<=16);assert(found.every(p=>p.d<5.5&&p.forward>0))}});

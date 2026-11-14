'use strict';
// Run from repository root: node public/binch/test-specs-route.cjs
// Source-level behavior test of the shipped OpenCode route; no browser or player data.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'specs-guide.js'),'utf8');
const suffix=/\}\)\(\);\s*$/;
assert.match(source,suffix,'Expected module wrapper');
const testSource=source.replace(suffix,'window.__specsTest={SEQ,T,stepsAt,nextPoint,points,state};})();');
const window={};const document={readyState:'loading',addEventListener(){}};
const localStorage={getItem:()=>null};
vm.runInNewContext(testSource,{window,document,localStorage,Map,Set,Math,Number,JSON,String,Array,Object},{filename:'specs-guide.js'});
const t=window.__specsTest;
let count=0;function check(condition,message){assert.ok(condition,message);count++;}
check(t.SEQ.length===51,'one point per level 10 to 60');
check(t.points(10)===1&&t.points(60)===51,'boundary points');
check(t.nextPoint(10).level===11,'next level at 10');
check(t.nextPoint(60)===null,'complete at level 60');
check(t.stepsAt(34).reduce((n,v)=>n+v.owned,0)===25,'25 points at 34');
check(t.stepsAt(60).reduce((n,v)=>n+v.owned,0)===51,'51 points at 60');
check(t.stepsAt(34).every(x=>x.owned<=x.max),'ranks never exceed max');
check(t.stepsAt(60).some(x=>x.label.includes('29')&&x.label.includes('33')),'noncontiguous predator strikes remain visible');
check(t.SEQ.every(key=>Boolean(t.T[key])),'all route talents defined');
check(t.SEQ.filter(key=>key==='prestrikes').length===3,'predator strikes have three ranks');
const restoredWindow={};
vm.runInNewContext(testSource,{
 window:restoredWindow,
 document:{readyState:'loading',addEventListener(){}},
 localStorage:{getItem:()=>JSON.stringify({id:'druid-feral',filter:'Mage'})},
 Map,Set,Math,Number,JSON,String,Array,Object
},{filename:'specs-guide.js'});
check(restoredWindow.__specsTest.state.id==='mage-frost','restored class filter selects an available spec');
const invalidWindow={};
vm.runInNewContext(testSource,{
 window:invalidWindow,
 document:{readyState:'loading',addEventListener(){}},
 localStorage:{getItem:()=>JSON.stringify({id:'druid-feral',filter:'Invalid class'})},
 Map,Set,Math,Number,JSON,String,Array,Object
},{filename:'specs-guide.js'});
check(invalidWindow.__specsTest.state.filter==='all','invalid saved filter safely resets');
console.log('Specs route: '+count+' assertions passed');

import {test} from 'node:test';
import assert from 'node:assert/strict';
import {selectScenery} from '../app/scenery-visibility.ts';

const camera={x:0,y:0,yaw:0,fov:Math.PI/2};
test('mobile selection reserves trees despite a dense carpet of close flowers',()=>{
 const plants=Array.from({length:80},(_,i)=>({x:1.5+(i%10)*.1,y:(i%9-4)*.09,height:.3}));
 const trees=Array.from({length:15},(_,i)=>({x:4+(i%5)*.3,y:(i%5-2)*.15,height:3}));
 const props=[...plants,...trees];
 const choices=selectScenery(props,camera,1);
 assert.equal(choices.length,18);
 assert(choices.filter(c=>c.i>=plants.length).length>=9,'trees must survive mobile detail pressure');
 assert.equal(new Set(choices.map(c=>c.i)).size,choices.length);
 assert(choices.every(c=>Number.isFinite(c.d)&&c.d>0));
});
test('scenery selection is deterministic and excludes objects behind the camera',()=>{
 const props=[{x:-3,y:0,height:4},{x:2,y:0,height:3},{x:4,y:0,height:.5},{x:3,y:15,height:3}];
 const a=selectScenery(props,camera,1);
 assert.deepEqual(a,selectScenery(props,camera,1));
 assert(a.some(c=>c.i===1));
 assert(a.every(c=>c.i!==0&&c.i!==3));
});
test('distance budgets grow with desktop detail without exceeding their limits',()=>{
 const props=Array.from({length:120},(_,i)=>({x:2+i%20*.25,y:(i%9-4)*.1,height:i%2?3:.5}));
 for(const [detail,limit] of [[1,18],[2,34],[3,54]]){
  const selected=selectScenery(props,camera,detail);
  assert(selected.length<=limit);
  assert(selected.every(c=>c.d<=(detail>=2?24:14)));
 }
});

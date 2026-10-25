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

test('unused flower slots are filled with extra tree silhouettes',()=>{
 const trees=Array.from({length:30},(_,i)=>({x:2+i*.2,y:(i%3-1)*.12,height:2.8}));
 const selected=selectScenery(trees,camera,1);
 assert.equal(selected.length,18);
 assert(selected.every(c=>trees[c.i].height>1.65));
});
test('unused tree slots are filled with close ground details',()=>{
 const flowers=Array.from({length:30},(_,i)=>({x:2+i*.2,y:(i%3-1)*.12,height:.4}));
 const selected=selectScenery(flowers,camera,1);
 assert.equal(selected.length,18);
 assert(selected.every(c=>flowers[c.i].height<1.65));
});

test('large canopies remain visible at the camera edge but remote props do not',()=>{
 const props=[
  {x:5,y:13.2,height:5},
  {x:5,y:19,height:5},
  {x:-5,y:0,height:5},
  {x:5,y:13.2,height:.2},
 ];
 const selected=selectScenery(props,camera,2).map(c=>c.i);
 assert(selected.includes(0),'large canopy near the edge must survive culling');
 assert(!selected.includes(1),'far outside frustum');
 assert(!selected.includes(2),'behind player');
 assert(!selected.includes(3),'tiny ground cover outside frustum');
});

test('selection is depth ordered and stable with equidistant props',()=>{
 const props=[{x:5,y:0,height:3},{x:2,y:0,height:.3},{x:5,y:0,height:.4},{x:3,y:0,height:3}];
 const result=selectScenery(props,camera,1);
 assert.deepEqual(result.map(p=>p.i),[1,3,0,2]);
});
test('rotating the camera reverses the visible world without changing props',()=>{
 const props=[{x:4,y:0,height:3},{x:-4,y:0,height:3}];
 assert.deepEqual(selectScenery(props,camera,1).map(p=>p.i),[0]);
 assert.deepEqual(selectScenery(props,{...camera,yaw:Math.PI},1).map(p=>p.i),[1]);
});

test('mobile first-person view favors tree silhouettes over decorative ground cover',()=>{
 const plants=Array.from({length:80},(_,i)=>({x:2+i*.05,y:(i%7-3)*.1,height:.25}));
 const trees=Array.from({length:30},(_,i)=>({x:4+i*.12,y:(i%7-3)*.13,height:3}));
 const props=[...plants,...trees];
 const visible=selectScenery(props,camera,1);
 assert.equal(visible.length,18);
 assert(visible.filter(p=>p.i>=plants.length).length>=12,'woodland must dominate the limited mobile prop budget');
});

test('nearby tree crowns do not cover the entire first-person sky',()=>{
 const props=[{x:.8,y:0,height:3.5},{x:1.4,y:0,height:3},{x:2.4,y:0,height:3},{x:.8,y:.3,height:.3}];
 const selected=selectScenery(props,camera,1).map(v=>v.i);
 assert(!selected.includes(0),'a tree inside the camera should be culled');
 assert(!selected.includes(1),'large near-field crown should not swallow the skyline');
 assert(selected.includes(2),'a readable tree further away must remain');
 assert(selected.includes(3),'nearby low vegetation must still render');
});

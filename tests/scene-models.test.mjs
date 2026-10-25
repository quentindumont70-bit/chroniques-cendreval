import {test} from 'node:test';
import assert from 'node:assert/strict';
import {sceneryModel,valleyLife} from '../app/scene-models.ts';
import {VALLEY_PROPS,LIVING_PROPS} from '../app/world-art.ts';

const validVoxel=v=>Number.isFinite(v.x)&&Number.isFinite(v.y)&&Number.isFinite(v.z)&&v.sx>0&&v.sy>0&&v.sz>0&&/^#[0-9a-f]{6}$/i.test(v.color);

test('every scenery archetype has a valid silhouette on mobile and desktop',()=>{
 for(const living of [false,true])for(let frame=0;frame<8;frame++)for(const detailed of [false,true]){
  const voxels=sceneryModel(frame,living,2.5,detailed);
  assert(voxels.length>0,`empty frame ${frame} living=${living} detailed=${detailed}`);
  assert(voxels.every(validVoxel),`invalid geometry for frame ${frame}`);
 }
});

test('birch, oak and pine retain visible canopies at low detail',()=>{
 for(const [frame,living] of [[0,false],[1,false],[1,true]]){
  const voxels=sceneryModel(frame,living,3,false);
  assert(voxels.some(v=>v.z>1.4&&v.sx>.3&&v.sy>.3),`missing distant canopy: ${frame}/${living}`);
 }
});

test('decorative world props stay inside the map and keep positive scales',()=>{
 for(const p of [...VALLEY_PROPS,...LIVING_PROPS]){
  assert(p.x>=0&&p.x<=20&&p.y>=0&&p.y<=20,`prop outside map at ${p.x},${p.y}`);
  assert(p.height>0&&p.frame>=0&&p.frame<8);
 }
});

test('wildlife is deterministic and remains near the player',()=>{
 const a=valleyLife(12500,7,13,2,false),b=valleyLife(12500,7,13,2,false);
 assert.deepEqual(a,b);
 assert(a.length>0&&a.every(validVoxel));
 assert(valleyLife(12500,-500,-500,2,false).length===0);
 assert(valleyLife(12500,7,13,1,true).length<valleyLife(12500,7,13,2,false).length);
});

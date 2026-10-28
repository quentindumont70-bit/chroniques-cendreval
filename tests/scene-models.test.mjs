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

test('new woodland islands add tree silhouettes without escaping the valley',()=>{
 const trees=VALLEY_PROPS.filter(p=>(p.frame===0||p.frame===1)&&p.height>=2.6);
 assert(trees.length>=40,'woodland should have enough substantial tree silhouettes');
 assert(trees.some(p=>p.x<4)&&trees.some(p=>p.x>16),'trees must frame both sides of the route');
});
test('mobile deciduous canopies have layered crowns and exposed limbs',()=>{
 for(const living of [false,true]){
  const tree=sceneryModel(1,living,3,false);
  assert(tree.filter(v=>v.z>1.5&&v.sx>.35).length>=3,'layered crown should remain visible on mobile');
  assert(tree.some(v=>v.z>.6&&v.z<1.7&&v.sx>.3&&v.sy<.2),'forked branch should break trunk silhouette');
 }
});

test('mobile tree crowns have independently animated outer leaf clusters',()=>{
 for(const [frame,living] of [[1,false],[1,true]]){
  const tree=sceneryModel(frame,living,3,false);
  const animated=tree.filter(v=>v.motion==='leaf');
  assert(animated.length>=12,'canopy should have a layered outer silhouette');
  assert(new Set(animated.map(v=>v.x.toFixed(2))).size>=5,'outer clusters must not collapse to one column');
 }
});

test('low-detail trunks include root geometry and contrasting bark',()=>{
 for(const [frame,living] of [[0,false],[1,false],[1,true]]){
  const tree=sceneryModel(frame,living,3,false);
  assert(tree.filter(v=>v.z<.3&&v.sx>.15).length>=4,'tree base should have visible roots');
  assert(new Set(tree.filter(v=>v.z<1.4).map(v=>v.color)).size>=3,'tree trunk should not be a plain column');
 }
});

test('forest trees carry low ground cover on both detail tiers',()=>{
 for(const detailed of [false,true])for(const [frame,living] of [[0,false],[1,false],[1,true]]){
  const model=sceneryModel(frame,living,3,detailed);
  const ferns=model.filter(v=>v.z<.2&&v.motion==='leaf');
  assert(ferns.length>=4,'forest floor should be grounded by fern fronds');
  assert(new Set(ferns.map(v=>v.color)).size>=3,'ferns should not be monochrome');
 }
});
test('low-detail deciduous treetops break the skyline into distinct crownlets',()=>{
 for(const living of [false,true]){
  const model=sceneryModel(1,living,3,false);
  const high=model.filter(v=>v.motion==='leaf'&&v.z>2.1);
  assert(high.length>=5,'treetop should retain small irregular crownlets');
  assert(new Set(high.map(v=>v.y.toFixed(2))).size>=3,'crownlets must have spatial depth');
 }
});

test('mobile meadow flowers are visible without desktop detail',()=>{
 const meadow=sceneryModel(6,false,.4,false);
 assert(meadow.length>=9,'grass should form a layered patch');
 assert(meadow.some(v=>v.color==='#c7b4d2'||v.color==='#ead59c'),'flower petals must remain visible on mobile');
});

test('roadside compositions populate both edges of the playable valley',()=>{
 const cover=VALLEY_PROPS.filter(p=>p.frame===6&&p.height>=.25);
 assert(cover.length>=130,'ground cover should be substantial');
 assert(cover.some(p=>p.x<4)&&cover.some(p=>p.x>16),'ground cover must frame both sides');
});
test('mobile boulders have moss caps instead of bare uniform stone',()=>{
 const rock=sceneryModel(2,false,.5,false);
 assert(rock.some(v=>v.color==='#61784c'),'moss must be visible at mobile detail');
 assert(rock.some(v=>v.color==='#8a9a68'),'rock needs contrasting moss highlights');
});

test('mobile crowns use compact angled foliage rather than oversized flat slabs',()=>{
 for(const living of [false,true]){
  const model=sceneryModel(1,living,3,false);
  const crowns=model.filter(v=>v.motion==='leaf'&&v.z>1.5);
  assert(crowns.length>=20,'deciduous canopy should have separated foliage clusters');
  assert(crowns.some(v=>Math.abs(v.yaw??0)>.25),'foliage should be angled');
  assert(crowns.filter(v=>v.sx>1.5).length===0,'avoid oversized mobile foliage plates');
 }
});

test('tree variants stay deterministic and bounded on mobile',()=>{for(const frame of [0,1]){const variants=Array.from({length:6},(_,i)=>sceneryModel(frame,false,3,false,i));assert(new Set(variants.map(v=>JSON.stringify(v))).size>=4);for(const v of variants){assert(v.length<65);assert(v.every(validVoxel))}assert.deepEqual(variants[2],sceneryModel(frame,false,3,false,2))}});

test('pine boughs climb a spiral instead of collapsing into horizontal shelves',()=>{
 for(let variant=0;variant<6;variant++){
  const leaves=sceneryModel(0,false,1,false,variant).filter(v=>v.motion==='leaf'&&v.z>.2);
  assert(leaves.length>=17);
  assert(new Set(leaves.map(v=>v.z.toFixed(3))).size>=17);
  assert(leaves.every(v=>v.sy<.18),'narrow boughs preserve gaps between branch tips');
 }
});

test('tree crowns expose sloped volumes on every quality tier',()=>{for(const detailed of [false,true])for(const [frame,living] of [[0,false],[1,false],[1,true]]){const model=sceneryModel(frame,living,3,detailed);assert(model.some(v=>v.shape==='crown'));assert(model.some(v=>v.shape==='faceted'&&v.taper<1));}});

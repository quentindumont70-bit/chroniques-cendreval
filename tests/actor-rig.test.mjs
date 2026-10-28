import {test} from 'node:test';
import assert from 'node:assert/strict';
import {actorRig} from '../app/actor-rig.ts';
import {facetedMesh} from '../app/faceted-mesh.ts';
test('rigs are volumetric, finite and bounded in every combat pose',()=>{
 for(const boss of [false,true])for(const kind of ['melee','ranged','brute'])for(const phase of [1,2])for(const pose of [{},{telegraph:.3,telegraphMax:.8},{strike:.2},{hit:.4},{death:.2}]){
 const parts=actorRig({boss,kind,phase,...pose},1234,1);assert(parts.length<96);
 for(const p of parts){assert(p.shape==='faceted');assert(p.sx>0&&p.sy>0&&p.sz>0);const mesh=facetedMesh(p);assert.equal(mesh.vertices.length,16);assert(mesh.vertices.flat().every(Number.isFinite));}
 }
});
test('walking and strikes articulate models rather than translating a rigid silhouette',()=>{
 const a={boss:true,kind:'brute'};assert.notDeepEqual(actorRig(a,200,1),actorRig(a,400,1));assert.notDeepEqual(actorRig(a,200),actorRig({...a,strike:.2},200));assert.deepEqual(actorRig(a,200),actorRig(a,200));
});

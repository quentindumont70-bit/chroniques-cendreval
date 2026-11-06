import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
/** Bake static scenery only. Gameplay markers, gates, birds and conditional village props retain identity. */
export function batchScenery(root:T.Group,exclude:T.Object3D[],shared:Set<T.Material>){
 root.updateMatrixWorld(true);const inverse=root.matrixWorld.clone().invert(),buckets=new Map<string,{material:T.MeshStandardMaterial;meshes:T.Mesh[]}>(),excluded=new Set(exclude);
 const visit=(o:T.Object3D)=>{if(excluded.has(o))return;if(o instanceof T.Mesh&&!(o instanceof T.InstancedMesh)&&o.material instanceof T.MeshStandardMaterial&&!o.material.map&&!o.material.transparent){const m=o.material,key=[m.color.getHex(),m.emissive.getHex(),m.emissiveIntensity,m.roughness,m.metalness,m.flatShading,m.vertexColors,m.side,o.castShadow,o.receiveShadow].join(':');let b=buckets.get(key);if(!b){b={material:m,meshes:[]};buckets.set(key,b)}b.meshes.push(o)}for(const child of o.children)visit(child)};visit(root);
 const discarded=new Set<T.Material>(),kept=new Set<T.Material>();let removed=0;
 for(const b of buckets.values()){kept.add(b.material);if(b.meshes.length<2)continue;const geometries=b.meshes.map(m=>{const g=m.geometry.index?m.geometry.toNonIndexed():m.geometry.clone();g.deleteAttribute('uv');g.deleteAttribute('uv1');g.deleteAttribute('tangent');g.clearGroups();g.applyMatrix4(inverse.clone().multiply(m.matrixWorld));return g});const merged=mergeGeometries(geometries);geometries.forEach(g=>g.dispose());if(!merged)continue;const mesh=new T.Mesh(merged,b.material);mesh.name='batched-scenery';mesh.castShadow=b.meshes[0].castShadow;mesh.receiveShadow=b.meshes[0].receiveShadow;root.add(mesh);for(const old of b.meshes){old.removeFromParent();old.geometry.dispose();discarded.add(old.material as T.Material)}removed+=b.meshes.length-1}
 for(const m of discarded)if(!shared.has(m)&&!kept.has(m))m.dispose();root.userData.batchedCallsSaved=removed;return removed;
}

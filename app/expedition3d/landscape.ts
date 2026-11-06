import * as T from 'three';
import {ground,type Zone,places,solids} from './world.ts';
/** A single palette and smooth world-space patches replace per-vertex random noise. */
export function terrainColor(zone:Zone,x:number,z:number){if(zone==='crypt')return new T.Color('#404a50').multiplyScalar(.94+Math.sin(x*.18+z*.12)*.06);if(zone==='cistern')return new T.Color(z< -14&&z> -21?'#28444a':'#52676a');const path=Math.exp(-Math.pow(x/3.2,2)),north=Math.max(0,Math.min(1,(-z-5)/45));const grass=new T.Color('#788a59').lerp(new T.Color('#49685c'),north);grass.lerp(new T.Color('#b5a381'),path*.85);if(Math.abs(z-4)<3)grass.lerp(new T.Color('#526a58'),.5);return grass.multiplyScalar(.97+Math.sin(x*.21)*Math.cos(z*.16)*.045)}
function rng(){let v=9241;return()=>{v=(v*1664525+1013904223)>>>0;return v/4294967296}}
export function landscape(root:T.Group,zone:Zone){const r=rng(),group=new T.Group();group.name='landscape';root.add(group);const mat=(color:string)=>new T.MeshStandardMaterial({color,roughness:.94,flatShading:true});const stone=mat('#969e89'),wood=mat('#74644b'),gold=mat('#c9bb87');
 const add=(g:T.BufferGeometry,m:T.Material,x:number,y:number,z:number)=>{const mesh=new T.Mesh(g,m);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh);return mesh};
 if(zone==='valley'){
  // Meadow, reed banks and pale flowers are batched: only three draw calls.
  const grass=new T.InstancedMesh(new T.ConeGeometry(.11,.48,3),mat('#82946b'),1200),flowers=new T.InstancedMesh(new T.IcosahedronGeometry(.075,0),mat('#e2cdaa'),240),reeds=new T.InstancedMesh(new T.CylinderGeometry(.025,.04,1.2,4),mat('#9c9b6c'),140),d=new T.Object3D();let gi=0,fi=0;
  for(let i=0;i<2000&&gi<1200;i++){const x=(r()-.5)*64,z=r()*85-50;if(Math.abs(x)<4||Math.abs(z-4)<3||solids(zone,true).some(b=>Math.abs(x-b.x)<b.w/2+1&&Math.abs(z-b.z)<b.d/2+1)||places.valley.some(p=>Math.hypot(x-p.x,z-p.z)<1.3))continue;d.position.set(x,ground(zone,x,z)+.2,z);d.rotation.set(0,r()*6.28,(r()-.5)*.3);const s=.7+r()*.7;d.scale.set(s,s,s);d.updateMatrix();grass.setMatrixAt(gi++,d.matrix);if(fi<240&&z>8){d.position.y+=.2;d.updateMatrix();flowers.setMatrixAt(fi++,d.matrix)}}grass.count=gi;flowers.count=fi;grass.receiveShadow=true;group.add(grass,flowers);
  for(let i=0;i<140;i++){const x=(i%2?-1:1)*(5+r()*27),z=4+(i%3?-1:1)*(2.5+r()*.7);d.position.set(x,ground(zone,x,z)+.5,z);d.scale.setScalar(.7+r()*.5);d.rotation.set(0,0,(r()-.5)*.15);d.updateMatrix();reeds.setMatrixAt(i,d.matrix)}group.add(reeds);
  // The pilgrims' avenue frames the castle without filling the playable path.
  for(const z of [-10,-22,-34])for(const side of [-1,1]){const x=side*5,y=ground(zone,x,z);add(new T.CylinderGeometry(.4,.65,.45,8),stone,x,y+.22,z);add(new T.CylinderGeometry(.13,.22,1.8,8),stone,x,y+1.3,z);add(new T.OctahedronGeometry(.27),gold,x,y+2.35,z)}
  // Broken aqueduct in the eastern skyline; no collision decoration on routes.
  for(let i=0;i<5;i++){const x=39,z=-5-i*8,y=ground(zone,x,z);add(new T.BoxGeometry(1.3,7,1.4),stone,x,y+3.5,z);const arch=add(new T.TorusGeometry(3.3,.45,5,18,Math.PI),stone,x,y+5,z-4);arch.rotation.y=Math.PI/2}
  // Signs are pictograms: castle crest, blue water drop, warm village roof.
  for(const [x,z,water] of [[4,12,0],[15,-10,1],[-4,-32,0]]){const y=ground(zone,x,z);add(new T.CylinderGeometry(.06,.09,2.4,6),wood,x,y+1.2,z);add(new T.BoxGeometry(1.3,.5,.12),wood,x+.4,y+2,z);add(water?new T.OctahedronGeometry(.2):new T.ConeGeometry(.25,.3,4),water?mat('#87cbd0'):gold,x+.4,y+2,z+.1)}
  // Shutters, beams and masonry bands give houses a consistent local construction.
  for(const b of solids(zone,true).filter(b=>b.kind==='house')){for(const x of [-1,1])add(new T.BoxGeometry(.15,b.h,.2),wood,b.x+x*(b.w/2-.15),b.y+b.h/2,b.z+b.d/2+.1);for(const y of [1.6,3.3])add(new T.BoxGeometry(b.w,.12,.2),wood,b.x,b.y+y,b.z+b.d/2+.1);add(new T.BoxGeometry(1,2,1),stone,b.x+1,b.y+b.h+2,b.z-1)}
 }else{
  const count=zone==='crypt'?90:64,pavers=new T.InstancedMesh(new T.BoxGeometry(1.6,.06,1.5),stone,count),d=new T.Object3D();for(let i=0;i<count;i++){const x=(i%3-1)*1.9,z=5-Math.floor(i/3)*1.65;d.position.set(x,ground(zone,x,z)+.035,z);d.rotation.y=Math.sin(i)*.025;d.updateMatrix();pavers.setMatrixAt(i,d.matrix)}pavers.receiveShadow=true;group.add(pavers);
  if(zone==='crypt'){for(const side of [-1,1])for(const z of [-32,-38,-46]){add(new T.CylinderGeometry(.5,.7,.45,8),stone,side*15,.22,z);add(new T.ConeGeometry(.45,2.2,7),stone,side*15,1.5,z);add(new T.IcosahedronGeometry(.24,1),gold,side*15,2.8,z)}}
 }
 return group;
}

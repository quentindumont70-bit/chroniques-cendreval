import {batchScenery} from './batching.ts';
import {terrainColor,landscape} from './landscape.ts';
import {actorDetail,worldDetails} from './art.ts';
import * as T from 'three';
import {ground,places,solids,BRIDGE,type Zone,type EnemyKind} from './world.ts';
const materials=new Map<string,T.MeshStandardMaterial>();
export function material(color:string,glow=false){const key=color+glow;let m=materials.get(key);if(!m){m=new T.MeshStandardMaterial({color,roughness:.88,flatShading:true,emissive:glow?color:'#000000',emissiveIntensity:glow?1.5:0});materials.set(key,m)}return m}
function mesh(g:T.BufferGeometry,c:string,parent:T.Object3D,x=0,y=0,z=0,glow=false){const m=new T.Mesh(g,material(c,glow));m.position.set(x,y,z);m.castShadow=!glow;m.receiveShadow=true;parent.add(m);return m}
export function box(p:T.Object3D,x:number,y:number,z:number,w:number,h:number,d:number,c:string){return mesh(new T.BoxGeometry(w,h,d),c,p,x,y,z)}
function cylinder(p:T.Object3D,x:number,y:number,z:number,r:number,h:number,c:string,top=r,n=8){return mesh(new T.CylinderGeometry(top,r,h,n),c,p,x,y,z)}
function orb(p:T.Object3D,x:number,y:number,z:number,r:number,c:string,glow=false){return mesh(new T.IcosahedronGeometry(r,1),c,p,x,y,z,glow)}
function seed(n:number){let s=n;return()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296}}
export type Actor={root:T.Group;arms:T.Group[];legs:T.Group[];head:T.Object3D;weapon:T.Group;second:T.Group;kind:EnemyKind};
export function makeWeapon(kind:string){const p=new T.Group();
 if(kind==='bow'){const curve=new T.CatmullRomCurve3([new T.Vector3(0,-.6,0),new T.Vector3(.22,0,0),new T.Vector3(0,.6,0)]);mesh(new T.TubeGeometry(curve,12,.035,5,false),'#876040',p);box(p,0,0,0,.015,1.2,.015,'#d6caae')}
 else if(['arcane','hex','cantor'].includes(kind)){cylinder(p,0,0,0,.04,1.2,'#6c4a3a');orb(p,0,.7,0,.14,kind==='hex'?'#ba80fa':kind==='cantor'?'#66e6bd':'#73c9f1',true);const ring=mesh(new T.TorusGeometry(.21,.025,5,12),'#ccaa67',p,0,.65);ring.rotation.y=.4}
 else if(kind==='spear'){cylinder(p,0,0,0,.035,2.1,'#795d40');const blade=mesh(new T.ConeGeometry(.14,.5,4),'#c2ceca',p,0,1.25,0);blade.scale.z=.3;cylinder(p,0,.98,0,.06,.15,'#c7ad76')}
 else if(kind==='hammer'){cylinder(p,0,0,0,.05,1.6,'#5b3830');box(p,0,.7,0,.9,.45,.4,'#664438');orb(p,0,.7,.24,.17,'#ff963d',true)}
 else{box(p,0,.3,0,.12,1.05,.045,kind==='thunder'?'#9cf5f1':'#c6d0ce');box(p,0,-.22,0,.42,.055,.08,'#c4a36e');cylinder(p,0,-.38,0,.055,.26,'#47362c');if(kind==='thunder')orb(p,0,.7,0,.07,'#61e6ed',true)}
 return p;
}
export function actor(kind:EnemyKind){
 const root=new T.Group(),arms:T.Group[]=[],legs:T.Group[]=[];const steel=kind==='boss'?'#494e57':kind==='archer'?'#64726a':'#68797b';
 const weapon=makeWeapon(kind==='boss'?'hammer':kind==='archer'?'bow':'blade'),second=makeWeapon('thunder');
 let head:T.Object3D;
 if(kind==='hound'){
  const body=orb(root,0,.65,0,.45,'#494d45');body.scale.set(.8,.8,1.6);head=orb(root,0,.8,-.53,.3,'#5b6158');head.scale.set(1,.8,1.4);
  for(const x of [-.25,.25])for(const z of [-.35,.35]){const leg=new T.Group();leg.position.set(x,.5,z);cylinder(leg,0,-.2,0,.08,.5,'#353d38',.12);root.add(leg);legs.push(leg)}
  for(const x of [-.13,.13])orb(root,x,.87,-.8,.035,'#f7be68',true);
 }else{
  const torso=mesh(new T.CapsuleGeometry(.3,.45,3,7),steel,root,0,1.1,0);torso.scale.x=1.2;
  const cape=mesh(new T.ConeGeometry(.43,1.2,6,1,true),'#573b3c',root,0,.8,.1);cape.scale.z=.5;
  head=orb(root,0,1.78,0,.23,kind==='archer'?'#7d6b50':'#8e9996');head.scale.set(.85,1.15,.9);
  box(root,0,1.79,-.2,.26,.055,.045,'#1b282d');
  for(const side of [-1,1]){
   const arm=new T.Group();arm.position.set(side*.42,1.38,0);orb(arm,0,0,0,.2,steel);cylinder(arm,0,-.26,0,.11,.5,steel,.13);orb(arm,0,-.53,0,.1,'#8c7564');root.add(arm);arms.push(arm);
   const leg=new T.Group();leg.position.set(side*.18,.7,0);cylinder(leg,0,-.25,0,.12,.6,'#3c4549',.14);box(leg,0,-.58,-.06,.25,.2,.37,'#363c40');root.add(leg);legs.push(leg);
  }
  weapon.position.set(0,-.5,-.25);weapon.rotation.x=-.7;arms[1].add(weapon);second.position.copy(weapon.position);second.rotation.copy(weapon.rotation);arms[0].add(second);second.visible=false;
  if(kind==='boss'){root.scale.setScalar(1.65);for(const x of [-.2,0,.2])mesh(new T.ConeGeometry(.07,.35,5),'#cda264',root,x,2.05,0);orb(root,0,1.15,-.3,.13,'#e87b40',true)}
 }
 const cue=new T.Mesh(new T.RingGeometry(kind==='hound'?.65:.85,kind==='hound'?.72:.94,32),new T.MeshBasicMaterial({color:'#f4c277',transparent:true,opacity:.7,depthWrite:false,side:T.DoubleSide}));cue.rotation.x=-Math.PI/2;cue.position.y=.06;cue.visible=false;root.add(cue);root.userData.attackCue=cue;
 actorDetail(root,kind);
 return {root,arms,legs,head,weapon,second,kind} satisfies Actor;
}
export function pose(a:Actor,time:number,moving:boolean,windup:number,attack:number,phase:number){
 const cue=a.root.userData.attackCue as T.Mesh|undefined;if(cue){cue.visible=windup>0;cue.scale.setScalar(.7+Math.min(1,windup)*.4);(cue.material as T.MeshBasicMaterial).color.set(phase===2?'#8ae7f3':windup<.24?'#fff5c3':'#e9a96c')}
 const stride=a.kind==='hound'?11:a.kind==='boss'?5:7;a.legs.forEach((l,i)=>l.rotation.x=moving?Math.sin(time*stride+(a.kind==='hound'?(i===0||i===3?0:Math.PI):i*Math.PI))*(a.kind==='boss'?.32:.5):Math.sin(time*1.5)*.015);
 a.arms.forEach((l,i)=>{l.rotation.x=windup>0?-1.9:attack>0?.9:Math.sin(time*5+i*Math.PI)*(moving?.2:.025);l.rotation.z=windup>0?(i?-.25:.25):0});
 if(a.kind==='archer'&&windup>0){a.arms[0].rotation.set(-1.4,0,.5);a.arms[1].rotation.set(-1.2,-.6,-.3)}if(a.kind==='boss'&&phase===2){a.arms[0].rotation.x*=.65;a.arms[0].rotation.z+=attack>0?.6:0}if(a.kind==='hound')a.head.rotation.x=windup>0?-.25:attack>0?.3:0;
 a.head.rotation.z=Math.sin(time*1.1)*.025;const cloak=a.root.userData.cloak as T.Object3D|undefined;if(cloak)cloak.rotation.x=Math.sin(time*3)*.04+(moving?.12:0);
 if(a.kind==='boss'&&phase===2){a.second.visible=true;a.weapon.visible=true}
}
export type WorldView={root:T.Group;gates:T.Object3D[];markers:Map<string,T.Group>;water:T.Mesh|null;birds:T.Group[];village:T.Group};
export function buildWorld(scene:T.Scene,zone:Zone){
 const root=new T.Group();scene.add(root);const random=seed(781),markers=new Map<string,T.Group>(),birds:T.Group[]=[];let gates:T.Object3D[]=[],water:T.Mesh|null=null;
 scene.background=new T.Color(zone==='valley'?'#a4b8b0':'#151c23');scene.fog=new T.FogExp2(zone==='valley'?'#a4b8b0':'#151c23',zone==='valley'?.014:.035);
 root.add(new T.HemisphereLight(zone==='valley'?0xd9e9e3:0x9eaccc,zone==='valley'?0x526047:0x33313d,zone==='valley'?2.1:1.4));
 const sun=new T.DirectionalLight(zone==='valley'?0xffe2ae:0xcad9ff,zone==='valley'?2.8:1.4);sun.position.set(-24,38,16);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-45,right:45,top:45,bottom:-45,near:1,far:100});sun.shadow.bias=-.001;root.add(sun);
 const size=zone==='valley'?130:70,segments=zone==='valley'?110:60;
 const geo=new T.PlaneGeometry(size,size,segments,segments);geo.rotateX(-Math.PI/2);geo.translate(0,0,-16);
 const colors=[];const pos=geo.attributes.position;
 for(let i=0;i<pos.count;i++){
  const x=pos.getX(i),z=pos.getZ(i);pos.setY(i,ground(zone,x,z));
  const c=terrainColor(zone,x,z);colors.push(c.r,c.g,c.b);
 }
 geo.setAttribute('color',new T.Float32BufferAttribute(colors,3));geo.computeVertexNormals();const terrain=new T.Mesh(geo,new T.MeshStandardMaterial({vertexColors:true,roughness:1,flatShading:true}));terrain.receiveShadow=true;root.add(terrain);
 for(const b of solids(zone,false)){
  const obj=box(root,b.x,b.y+b.h/2,b.z,b.w,b.h,b.d,b.kind==='gate'?'#554c3d':zone==='crypt'?'#49515a':'#7b8077');
  if(b.kind==='gate'){gates.push(obj);if(b.w>2)for(let x=-3;x<=3;x++)box(obj,x,0,0,.09,b.h+.3,1,'#af9667')}
  if(b.kind==='house'){
   const roof=mesh(new T.ConeGeometry(Math.max(b.w,b.d)*.78,3,4),'#626971',root,b.x,b.y+b.h+1.4,b.z);roof.rotation.y=Math.PI/4;
   box(root,b.x,b.y+1.2,b.z+b.d/2+.05,1.1,2.4,.13,'#403b32');for(const x of [-2,2])box(root,b.x+x,b.y+2.7,b.z+b.d/2+.08,.7,.9,.15,'#f1c173');
  }
  if(b.kind==='wall'&&zone==='valley'&&b.h>3)for(let x=-b.w/2+.5;x<b.w/2;x+=1.8)box(root,b.x+x,b.y+b.h+.4,b.z,1,.8,b.d,'#83857b');
 }
 if(zone==='valley'){
  const wg=new T.PlaneGeometry(130,4.8);wg.rotateX(-Math.PI/2);water=new T.Mesh(wg,new T.MeshStandardMaterial({color:'#487f86',metalness:.35,roughness:.3,transparent:true,opacity:.84}));water.position.set(0,-.55,4);root.add(water);
  box(root,0,BRIDGE.y-.225,4,6,.45,12,'#a49d83');
  for(const z of [-2,10])for(const x of [-2.5,2.5])cylinder(root,x,.4,z,.38,2.8,'#777e70');
  for(const x of [-3.1,3.1])box(root,x,2.3,4,.22,.9,12,'#8d917e');
  // Sloping approaches match the collision height field.
  for(const front of [true,false]){const g=new T.PlaneGeometry(6,6,1,12);g.rotateX(-Math.PI/2);const a=g.attributes.position;for(let i=0;i<a.count;i++){const z=(front?13:-5)+a.getZ(i);a.setZ(i,z);a.setY(i,front?1.8*(16-z)/6:1.8*(z+8)/6)}g.computeVertexNormals();const ramp=new T.Mesh(g,material('#a49d83'));ramp.receiveShadow=true;root.add(ramp)}
  const count=110,trunks=new T.InstancedMesh(new T.CylinderGeometry(.12,.28,3.4,6),material('#655c49'),count),crowns=new T.InstancedMesh(new T.IcosahedronGeometry(1,1),material('#526f4e'),count*3),dummy=new T.Object3D();
  for(let i=0;i<count;i++){
   let x=(random()-.5)*105,z=random()*108-68;if(Math.abs(x)<7)x+=x<0?-9:9;if(Math.abs(z-4)<5)z-=9;
   if(Math.abs(z-24)<12&&Math.abs(x)<18)x+=x<0?-15:15;
   const y=ground(zone,x,z),s=.8+random()*.9;dummy.position.set(x,y+1.7*s,z);dummy.scale.set(s,s,s);dummy.rotation.set(0,random()*6,0);dummy.updateMatrix();trunks.setMatrixAt(i,dummy.matrix);
   for(let j=0;j<3;j++){dummy.position.set(x+(random()-.5)*2*s,y+(3.4+j*.65)*s,z+(random()-.5)*s);dummy.scale.set((1.7-j*.25)*s,(1.2+j*.2)*s,(1.5-j*.15)*s);dummy.updateMatrix();crowns.setMatrixAt(i*3+j,dummy.matrix)}
  }
  trunks.castShadow=true;crowns.castShadow=true;crowns.receiveShadow=true;root.add(trunks,crowns);
  for(let i=0;i<35;i++){const x=(random()-.5)*100,z=random()*110-70;if(Math.abs(x)<8)continue;const r=1+random()*3,o=orb(root,x,ground(zone,x,z)+r*.3,z,r,'#858b7d');o.scale.set(1,.65,1.2)}
  for(const x of [-13,13]){cylinder(root,x,11,-46,3.8,15,'#747d76',3.3,10);cylinder(root,x,18.5,-46,4.1,1,'#969a88',4.1,10);mesh(new T.ConeGeometry(4.5,6,10),'#4b5e61',root,x,22,-46);}
  box(root,0,13,-47,8,3,4,'#7f887d');
  for(let i=0;i<10;i++){const x=(random()-.5)*150;const m=mesh(new T.ConeGeometry(18+random()*12,20+random()*20,6),'#7d9691',root,x,8,-85-random()*30);m.scale.z=.65}
  for(let i=0;i<5;i++){const b=new T.Group();box(b,-.2,0,0,.45,.025,.12,'#354947').rotation.z=.2;box(b,.2,0,0,.45,.025,.12,'#354947').rotation.z=-.2;root.add(b);birds.push(b)}
 }else if(zone==='crypt'){
  // Vault ribs, cross beams and lights establish readable interior depth.
  for(const z of [-4,-16,-25,-34,-44]){
   box(root,0,8.2,z,39,.45,.65,'#626a71');
   for(const x of [-18,18]){cylinder(root,x,3,z,.4,6,'#667077');orb(root,x,2.5,z,.16,'#ffb76c',true);const light=new T.PointLight(0xffaa66,7,12,2);light.position.set(x,3,z);root.add(light)}
  }
  box(root,0,9,-20,40,.5,58,'#2b323c');
  for(let i=0;i<9;i++){box(root,-14,.35,-12-i*1.8,3,.7,1.1,'#656b70')}
  const ring=mesh(new T.TorusGeometry(5,.1,6,40),'#be9562',root,0,.04,-40);ring.rotation.x=Math.PI/2;
 }
 for(const p of places[zone]){
  const group=new T.Group();group.position.set(p.x,p.y??ground(zone,p.x,p.z),p.z);root.add(group);markers.set(p.id,group);
  if(p.kind==='rest'){
   for(let i=0;i<7;i++){const a=i/7*Math.PI*2;orb(group,Math.cos(a)*.55,.12,Math.sin(a)*.55,.22,'#62635b')}
   mesh(new T.ConeGeometry(.28,.9,7),'#ffb756',group,0,.5,0,true);const light=new T.PointLight(0xffaa55,9,8,2);light.position.y=1;group.add(light);
  }else if(p.kind==='herb'){
   for(let i=0;i<4;i++){cylinder(group,(i%2)*.18,.25,Math.floor(i/2)*.15,.025,.5,'#68814e');orb(group,(i%2)*.18,.5,Math.floor(i/2)*.15,.1,['#d8a292','#dcbd6c','#a5b5db'][p.index!%3])}
  }else if(p.kind==='village'||p.kind==='npc'){
   const npc=actor(p.id==='rune'?'sentinel':'archer');npc.weapon.visible=false;npc.root.scale.setScalar(p.id==='vey'?.94:p.id==='rune'?1.06:1);group.add(npc.root);group.userData.npc=npc;orb(group,0,2.3,0,.08,'#f6dd9b',true);
  }else if(p.kind==='portal'||p.kind==='shortcut'){
   for(const x of [-1.8,1.8])box(group,x,1.7,0,.5,3.4,.7,'#a0a793');box(group,0,3.3,0,4,.6,.7,'#a0a793');orb(group,0,3.4,-.4,.12,'#b5e7d6',true);
  }else if(p.kind==='flight'){cylinder(group,0,.6,0,.5,1.2,'#748d89');const wings=mesh(new T.TorusGeometry(.55,.06,6,16),'#8ce4e6',group,0,1.5,0,true);wings.rotation.x=.3;orb(group,0,1.5,0,.15,'#d5f4ee',true);
  }else if(p.kind==='lever'){
   cylinder(group,0,.5,0,.5,1,'#686e70');const lever=box(group,0,1.2,0,.12,.9,.12,'#d7b877');lever.rotation.z=.45;orb(group,0,1.7,0,.14,'#8fe6e1',true);
  }else if(p.kind==='challenge'){const ring=mesh(new T.TorusGeometry(.75,.08,6,24),'#d3ad79',group,0,.06,0);ring.rotation.x=Math.PI/2;cylinder(group,0,.45,0,.28,.9,'#727c77',.2);const mark=orb(group,0,1.2,0,.15,'#e9c17b',true);group.userData.trial=true;
  }else if(p.kind==='bell'){
   for(const x of [-.55,.55])box(group,x,1.1,0,.12,2.2,.12,'#8a8b76');box(group,0,2.2,0,1.3,.15,.2,'#9a8d6c');cylinder(group,0,1.65,0,.35,.5,['#70b9bc','#b5b7d5','#d6b576'][p.index!],.17,12);orb(group,0,1.35,0,.075,'#dccb99');const glyph=mesh(p.index===1?new T.TorusGeometry(.15,.035,5,12):p.index===0?new T.OctahedronGeometry(.16):new T.SphereGeometry(.15,8,5),'#e2d3a4',group,0,2.55,0,true);
  }else if(p.kind==='memory'||p.kind==='inscription'){
   const stone=box(group,0,.8,0,.6,1.6,.3,'#a1aaa0');stone.rotation.z=.1;orb(group,0,1.2,.2,.09,'#8de1dc',true);
  }else{box(group,0,.3,0,.9,.6,.6,'#6d5140');box(group,0,.63,0,1,.12,.7,'#c6a46b');orb(group,0,.85,0,.06,'#ffdc7f',true)}
 }
 const village=worldDetails(root,zone);landscape(root,zone);
 batchScenery(root,[...markers.values(),...birds,...gates,village,...['forge-fire','village-ward','project-garden','project-lanterns','project-memorial'].map(n=>root.getObjectByName(n)).filter((v):v is T.Object3D=>!!v)],new Set(materials.values()));
 return {root,gates,markers,water,birds,village} satisfies WorldView;
}
export function disposeWorld(root:T.Object3D){const shared=new Set(materials.values());root.traverse(o=>{if(o instanceof T.Mesh){o.geometry.dispose();for(const m of Array.isArray(o.material)?o.material:[o.material])if(!shared.has(m))m.dispose();if(o instanceof T.InstancedMesh)o.dispose()}if(o instanceof T.DirectionalLight||o instanceof T.PointLight||o instanceof T.SpotLight)o.shadow.dispose()});root.removeFromParent()}
export function disposeMaterials(){materials.forEach(m=>m.dispose());materials.clear()}

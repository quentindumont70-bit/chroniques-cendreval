import * as T from 'three';
import {ground,platforms,type Zone} from './world.ts';
function part(root:T.Object3D,g:T.BufferGeometry,color:string,x:number,y:number,z:number){const m=new T.Mesh(g,new T.MeshStandardMaterial({color,roughness:.86,flatShading:true}));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;root.add(m);return m}
const cub=(r:T.Object3D,x:number,y:number,z:number,w:number,h:number,d:number,c:string)=>part(r,new T.BoxGeometry(w,h,d),c,x,y,z);
const cyl=(r:T.Object3D,x:number,y:number,z:number,a:number,b:number,h:number,c:string)=>part(r,new T.CylinderGeometry(a,b,h,8),c,x,y,z);
function arch(r:T.Object3D,x:number,y:number,z:number,width:number,color:string){part(r,new T.TorusGeometry(width,.13,5,16,Math.PI),color,x,y,z);cub(r,x-width,y-.7,z,.23,1.4,.3,color);cub(r,x+width,y-.7,z,.23,1.4,.3,color)}
export function actorDetail(root:T.Group,kind:string){
 if(kind==='hound'){
  for(const side of [-1,1]){const ear=part(root,new T.ConeGeometry(.12,.34,4),'#3d5148',side*.18,1.1,-.5);ear.rotation.z=side*.3;for(let i=0;i<3;i++)part(root,new T.ConeGeometry(.035,.13,4),'#d5c8a2',side*.12,.68,-.75+i*.08).rotation.z=Math.PI;}
  for(let i=0;i<5;i++)part(root,new T.ConeGeometry(.09,.23,4),'#9a9c7c',0,1.08,-.2+i*.17);
  const tail=part(root,new T.ConeGeometry(.09,.7,6),'#424f47',0,.73,.85);tail.rotation.x=.85;return;
 }
 const boss=kind==='boss',archer=kind==='archer',trim=boss?'#c8aa6a':'#b3a181';
 cyl(root,0,.88,0,.34,.32,.1,'#4b352a');cub(root,0,.88,-.32,.12,.13,.04,trim);
 for(const x of [-.19,.19]){cub(root,x,1.19,-.295,.13,.46,.05,trim);cub(root,x,.42,-.12,.2,.27,.07,'#87938e')}
 if(archer){const hood=part(root,new T.SphereGeometry(.27,8,5,0,Math.PI*2,0,Math.PI*.7),'#40584d',0,1.81,.035);hood.scale.set(1,1.2,1);cyl(root,.25,1.15,.31,.12,.11,.7,'#785f43').rotation.z=-.25;for(let i=0;i<4;i++)cub(root,.2+i*.035,1.65,.3,.015,.45,.015,'#c2bca5')}
 else{cub(root,0,1.85,-.22,.03,.4,.04,trim);for(const x of [-.12,.12])cub(root,x,1.76,-.22,.09,.025,.025,'#bce9d4');const crest=part(root,new T.ConeGeometry(.16,boss?.65:.42,5),boss?'#9c493e':'#677a80',0,2.08,0);crest.scale.z=.3;}
 const cloak=part(root,new T.CylinderGeometry(.32,.46,.85,7,1,true,0,Math.PI),boss?'#742f35':archer?'#3c584d':'#424c68',0,.98,.14);cloak.rotation.y=Math.PI;root.userData.cloak=cloak;
 if(boss){for(const side of [-1,1])for(let i=0;i<3;i++){const spike=part(root,new T.ConeGeometry(.07,.3,5),trim,side*(.36+i*.07),1.64-i*.025,0);spike.rotation.z=side*-.5}}
}
export function hands(root:T.Group,color:string){for(const side of [-1,1]){const sleeve=part(root,new T.CapsuleGeometry(.08,.3,3,6),color,side*.2,-.45,.1);sleeve.rotation.z=side*.4;part(root,new T.SphereGeometry(.085,6,4),'#ae8871',side*.13,-.22,.05);cub(root,side*.18,-.3,.03,.17,.1,.16,'#b3a88c')}}
export function worldDetails(root:T.Group,zone:Zone){
 const village=new T.Group();village.name='village-renewal';root.add(village);
 for(const b of platforms[zone]){cub(root,b.x,b.y-b.h/2,b.z,b.w,b.h,b.d,'#a0a58c');for(const x of [-1,1])cyl(root,b.x+x*b.w*.45,b.y-1.5,b.z,.17,.27,3,'#71817a')}
 if(zone==='valley'){
  // Permanent village projects keep their own roots, outside static batching.
  for(const id of ['garden','lanterns','memorial']){const project=new T.Group();project.name='project-'+id;root.add(project);if(id==='garden'){for(let i=0;i<18;i++){const x=7+(i%6)*.3,z=21+Math.floor(i/6)*.4;part(project,new T.ConeGeometry(.13,.5,5),i%2?'#a3b67c':'#d1b582',x,ground(zone,x,z)+.25,z)}}else if(id==='lanterns'){for(const x of [-3,3]){const y=ground(zone,x,18);cyl(project,x,y+1.4,18,.045,.065,2.8,'#6f6550');const glow=part(project,new T.OctahedronGeometry(.2),'#ffd69b',x,y+2.5,18);(glow.material as T.MeshStandardMaterial).emissive.set('#dda469');const light=new T.PointLight(0xffc386,2,7,2);light.position.set(x,y+2.5,18);project.add(light)}}else{const x=3,z=32,y=ground(zone,x,z);cub(project,x,y+.8,z,.8,1.6,.3,'#a3aaa0');part(project,new T.TorusGeometry(.3,.05,5,12),'#dccb9e',x,y+1.2,z+.18)}}
  // Market, well, wagon and workshop: grouped landmarks rather than scattered props.
  const well=new T.Group();well.position.set(4,ground(zone,4,21),21);root.add(well);part(well,new T.TorusGeometry(.7,.22,6,12),'#939b87',0,.45,0).rotation.x=Math.PI/2;for(const x of [-.9,.9])cub(well,x,1.15,0,.14,2.3,.14,'#685641');cub(well,0,2.3,0,2,.14,.2,'#685641');cyl(well,0,1,0,.025,.025,2,'#d1bb89');
  const ward=new T.Group();ward.name='village-ward';root.add(ward);for(const x of [-4,4]){const guard=new T.Group();guard.position.set(x,ground(zone,x,16),16);ward.add(guard);cyl(guard,0,1,0,.27,.3,.65,'#8a9594');part(guard,new T.IcosahedronGeometry(.22,1),'#a4ada1',0,1.65,0);for(const leg of [-.14,.14])cyl(guard,leg,.4,0,.1,.12,.65,'#4f6060');cub(guard,0,1.65,-.2,.24,.035,.025,'#263c3b');cyl(guard,.4,1.1,0,.025,.025,2.2,'#89785a');part(guard,new T.ConeGeometry(.09,.35,4),'#b6c5c0',.4,2.35,0);cub(guard,-.3,1,-.2,.45,.7,.08,'#617e75')}
  const market=new T.Group();market.position.set(5,ground(zone,5,26),26);root.add(market);cub(market,0,.8,0,2.4,.1,1.2,'#856c4c');for(const x of [-1.1,1.1])cub(market,x,1.2,0,.09,2.4,.09,'#725c43');const awning=cub(market,0,2.3,0,2.7,.08,1.8,'#b6a17b');awning.rotation.x=.13;for(let i=0;i<7;i++)part(market,new T.SphereGeometry(.13,6,4),i%2?'#b7834e':'#788d55',-.8+i*.25,1,0);
  const forge=new T.Group();forge.name='forge-fire';forge.position.set(-6,ground(zone,-6,18),18);root.add(forge);const glow=new T.PointLight(0xf4a456,4,6,2);glow.position.set(1,1,0);forge.add(glow);cub(forge,0,.5,0,1.6,1,1.2,'#5b6570');cub(forge,0,1.05,0,1.1,.17,.7,'#adb3ad');part(forge,new T.ConeGeometry(.25,.7,6),'#e3a469',1,.5,0);
  const wagon=new T.Group();wagon.position.set(15,ground(zone,15,18),18);root.add(wagon);cub(wagon,0,.7,0,2.7,.16,1.5,'#7c6748');for(const side of [-1,1]){cub(wagon,0,1,side*.8,2.8,.55,.08,'#887957');for(const x of [-.9,.9]){const wheel=part(wagon,new T.TorusGeometry(.45,.08,5,10),'#534d3b',x,.45,side*.9);for(let i=0;i<4;i++){const spoke=cub(wheel,0,0,0,.035,.85,.025,'#9a8a62');spoke.rotation.z=i*Math.PI/4}}}
  for(const x of [-13,13]){for(const z of [-49.85])for(const h of [7,11,15]){arch(root,x,h,z,.65,'#bbc0a6');cub(root,x,h-.45,z+.05,.95,1.4,.09,'#3a5e61')}
   for(let i=0;i<3;i++){const buttress=cub(root,x+(x<0?-1:1)*3,7,-48+i*2,1,6,1.1,'#8b9486');buttress.rotation.z=x<0?-.1:.1}}
  const rose=part(root,new T.TorusGeometry(1.3,.16,6,16),'#bfc2a2',0,13,-44.85);for(let i=0;i<8;i++){const a=i*Math.PI/4;const glass=part(rose,new T.CircleGeometry(.4,3),i%2?'#8a9c85':'#b29477',Math.cos(a)*.7,Math.sin(a)*.7,.03);glass.rotation.z=a}
  for(let i=0;i<24;i++){const x=(i%2?-1:1)*(10+(i*7%24)),z=-38+(i*11%70),y=ground(zone,x,z);if(Math.abs(z-4)<6)continue;cyl(root,x,y+2,z,.1,.3,4,'#686653');for(let j=0;j<3;j++)part(root,new T.ConeGeometry(1.8-j*.4,2.6,7),'#3e6259',x,y+2.7+j*.9,z);}
  for(const [x,z]of [[-7,28],[7,17],[-4,16]]){const post=new T.Group();post.position.set(x,ground(zone,x,z),z);root.add(post);cyl(post,0,1.4,0,.05,.09,2.8,'#6c6752');const banner=cub(post,.4,2.1,0,.75,1,.035,'#936756');banner.rotation.z=.06;part(post,new T.OctahedronGeometry(.15),'#d1bc83',.4,2.1,-.06)}
  for(let i=0;i<24;i++){const x=7+(i%6)*.28,z=23+Math.floor(i/6)*.28;part(village,new T.ConeGeometry(.11,.35,5),'#bc9d6a',x,ground(zone,x,z)+.2,z)}
 }else{
  for(const z of zone==='crypt'?[-4,-17,-34,-44]:[-5,-27,-37]){
   const span=zone==='crypt'?7:17;for(const side of [-1,1]){const rib=part(root,new T.TorusGeometry(span,.16,5,20,Math.PI/2),'#899292',side*span,5,z);rib.rotation.z=side<0?0:Math.PI/2}
   for(const x of zone==='crypt'?[-18,18]:[-20,20]){arch(root,x,3,z,.9,'#8d9591');const tomb=cub(root,x,.6,z,1.5,1.2,2.8,'#65746d');tomb.rotation.y=Math.PI/2;}
  }
  if(zone==='cistern'){
   const water=part(root,new T.PlaneGeometry(44,7),'#326a73',0,-7,-17.5);water.rotation.x=-Math.PI/2;
   for(const z of [-13.7,-21.3])for(let x=-21;x<=21;x+=3){cub(root,x,.06,z,2.6,.12,.5,'#b1b098')}
   for(let i=0;i<7;i++){const x=-18+i*6;const chain=cyl(root,x,2.8,-17,.035,.035,7,'#8f9a8b');chain.rotation.z=.08*Math.sin(i);}
  }
 }
 return village;
}

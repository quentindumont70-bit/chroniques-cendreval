import {materialLight} from "./material-light.ts";
import {actorRig} from "./actor-rig";
import {facetedMesh} from "./faceted-mesh";
import {clipNear} from "./near-clip";
import {LIVING_PROPS,VALLEY_PROPS,visibleSpans} from "./world-art";
import {sceneryModel,valleyLife} from "./scene-models";
import {selectScenery} from "./scenery-visibility";

export type Voxel={shape?:"faceted"|"crown";pitch?:number;taper?:number;x:number;y:number;z:number;sx:number;sy:number;sz:number;color:string;yaw?:number;glow?:boolean;material?:"metal"|"cloth"|"wood";motion?:"leaf"|"flame"|"banner"};
type Camera={x:number;y:number;yaw:number;width:number;height:number;fov:number;eye?:number};
type Point={x:number;y:number;d:number};
type Face={opacity?:number;points:Point[];depth:number;color:string;glow:boolean;cool:boolean};

const FACES=[
  {ids:[4,5,6,7],normal:[0,0,1],light:1.08},
  {ids:[0,4,7,3],normal:[-1,0,0],light:.77},
  {ids:[1,2,6,5],normal:[1,0,0],light:.88},
  {ids:[0,1,5,4],normal:[0,-1,0],light:.8},
  {ids:[3,7,6,2],normal:[0,1,0],light:.94},
] as const;

const palette=new Map<string,readonly[number,number,number]>();
function rgb(hex:string):readonly[number,number,number]{let value=palette.get(hex);if(!value){const raw=hex.replace("#","");value=[parseInt(raw.slice(0,2),16),parseInt(raw.slice(2,4),16),parseInt(raw.slice(4,6),16)];palette.set(hex,value)}return value}
function shade(hex:string,light:number,fog:number){const [r,g,b]=rgb(hex),mist=[157,163,147];return `rgb(${Math.round(r*light*(1-fog)+mist[0]*fog)},${Math.round(g*light*(1-fog)+mist[1]*fog)},${Math.round(b*(light>.95?light*.94:light)*(1-fog)+mist[2]*fog)})`}
function project(camera:Camera,x:number,y:number,z:number):Point|null{const dx=x-camera.x,dy=y-camera.y,c=Math.cos(camera.yaw),s=Math.sin(camera.yaw),d=dx*c+dy*s;if(d<=.08)return null;const side=-dx*s+dy*c,focal=camera.width/(2*Math.tan(camera.fov/2));return{x:camera.width/2+side*focal/d,y:camera.height/2-((z-(camera.eye??.16))*focal/d),d}}

/** Returns the screen position of a world point. Kept public so interaction markers use the same lens. */
export function projectVoxelPoint(camera:Camera,x:number,y:number,z:number){return project(camera,x,y,z)}

function projectWithLens(camera:Camera,x:number,y:number,z:number,c:number,s:number,focal:number):Point|null{
 const dx=x-camera.x,dy=y-camera.y,d=dx*c+dy*s;
 if(d<=.08)return null;
 return{x:camera.width/2+(-dx*s+dy*c)*focal/d,y:camera.height/2-((z-(camera.eye??.16))*focal/d),d};
}
function facesForVoxel(camera:Camera,v:Voxel,out:Face[],cameraCos:number,cameraSin:number,focal:number,frustumSlope:number){
  // Coarse camera-space rejection before projecting five faces per tiny leaf.
  const dx=v.x-camera.x,dy=v.y-camera.y,forward=dx*cameraCos+dy*cameraSin;
  const radius=(v.sx+v.sy)*.72+(v.shape?Math.abs(Math.sin(v.pitch??0))*v.sz:0);
  if(forward+radius<=.08)return;
  const lateral=-dx*cameraSin+dy*cameraCos;
  if(Math.abs(lateral)>Math.max(.12,forward)*frustumSlope+radius)return;
  if(v.shape){
    const mesh=facetedMesh(v,forward>7?4:v.shape==='crown'?6:8);
    for(const ids of mesh.faces){const a=mesh.vertices[ids[0]],b=mesh.vertices[ids[1]],c=mesh.vertices[ids[2]],u=b.map((n,i)=>n-a[i]),w=c.map((n,i)=>n-a[i]),nx=u[1]*w[2]-u[2]*w[1],ny=u[2]*w[0]-u[0]*w[2],nz=u[0]*w[1]-u[1]*w[0],length=Math.hypot(nx,ny,nz)||1;
      if(nx*(camera.x-a[0])+ny*(camera.y-a[1])+nz*((camera.eye??.16)-a[2])<=0)continue;
      const polygon=clipNear(ids.map(i=>{const [x,y,z]=mesh.vertices[i],dx=x-camera.x,dy=y-camera.y;return{side:-dx*cameraSin+dy*cameraCos,depth:dx*cameraCos+dy*cameraSin,z}}));if(polygon.length<3)continue;
      const points=polygon.map(p=>({x:camera.width/2+p.side*focal/p.depth,y:camera.height/2-(p.z-(camera.eye??.16))*focal/p.depth,d:p.depth})),depth=points.reduce((n,p)=>n+p.d,0)/points.length;
      out.push({points,depth,color:shade(v.color,materialLight(v.material,nx/length,ny/length,nz/length),Math.min(.67,Math.max(0,(depth-5)/24))),glow:Boolean(v.glow),cool:false});
    }return;
  }
  const yaw=v.yaw??0,c=Math.cos(yaw),s=Math.sin(yaw),hx=v.sx/2,hy=v.sy/2;
  const corners:[[number,number,number],[number,number,number],[number,number,number],[number,number,number],[number,number,number],[number,number,number],[number,number,number],[number,number,number]]=[[-hx,-hy,0],[hx,-hy,0],[hx,hy,0],[-hx,hy,0],[-hx,-hy,v.sz],[hx,-hy,v.sz],[hx,hy,v.sz],[-hx,hy,v.sz]];
  const world=corners.map(([lx,ly,lz])=>[v.x+lx*c-ly*s,v.y+lx*s+ly*c,v.z+lz] as [number,number,number]);
  const [red,,blue]=rgb(v.color),cool=blue>red*1.15;
  for(const face of FACES){const normalX=face.normal[0]*c-face.normal[1]*s,normalY=face.normal[0]*s+face.normal[1]*c;if(face.normal[2]===0&&normalX*(camera.x-v.x)+normalY*(camera.y-v.y)<=0)continue;const polygon=clipNear(face.ids.map(index=>{const [x,y,z]=world[index],dx=x-camera.x,dy=y-camera.y;return {side:-dx*cameraSin+dy*cameraCos,depth:dx*cameraCos+dy*cameraSin,z}}));if(polygon.length<3)continue;const visible:Point[]=polygon.map(p=>({x:camera.width/2+p.side*focal/p.depth,y:camera.height/2-(p.z-(camera.eye??.16))*focal/p.depth,d:p.depth}));const depth=visible.reduce((sum,p)=>sum+p.d,0)/visible.length,fog=Math.min(.67,Math.max(0,(depth-5)/24));out.push({points:visible,depth,color:shade(v.color,face.light,fog),glow:Boolean(v.glow),cool})}
}

let sceneFaces:Face[]|null=null;
/** One depth order for every actor, prop and landmark, never one order per object. */
export function drawVoxelScene(ctx:CanvasRenderingContext2D,camera:Camera,zbuf:Float32Array,collect:()=>void){
 sceneFaces=[];try{collect();const pending=sceneFaces;sceneFaces=null;paintFaces(ctx,camera,zbuf,pending);}finally{sceneFaces=null;}
}
function drawFaces(ctx:CanvasRenderingContext2D,camera:Camera,voxels:Voxel[],zbuf:Float32Array,alpha=1){
 const faces:Face[]=[],cameraCos=Math.cos(camera.yaw),cameraSin=Math.sin(camera.yaw),focal=camera.width/(2*Math.tan(camera.fov/2)),frustumSlope=Math.tan(camera.fov*.6);for(const voxel of voxels)facesForVoxel(camera,voxel,faces,cameraCos,cameraSin,focal,frustumSlope);if(sceneFaces){for(const face of faces)face.opacity=alpha;sceneFaces.push(...faces);return}for(const face of faces)face.opacity=alpha;paintFaces(ctx,camera,zbuf,faces);
}
function paintFaces(ctx:CanvasRenderingContext2D,camera:Camera,zbuf:Float32Array,faces:Face[]){
 if(!faces.length)return;faces.sort((a,b)=>b.depth-a.depth);ctx.save();ctx.lineJoin="round";
 for(const face of faces){const alpha=face.opacity??1;ctx.globalAlpha=alpha;let minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity;for(const p of face.points){if(p.x<minX)minX=p.x;if(p.x>maxX)maxX=p.x;if(p.y<minY)minY=p.y;if(p.y>maxY)maxY=p.y}const left=Math.floor(minX),right=Math.ceil(maxX),top=Math.floor(minY),bottom=Math.ceil(maxY);if(right<0||left>=camera.width||bottom< -48||top>=camera.height+48)continue;
 const spans=visibleSpans(left,right-left,face.depth,zbuf);if(!spans.length)continue;ctx.save();if(spans.length>1||spans[0][0]>Math.max(0,left)||spans[0][1]<Math.min(camera.width,right)){ctx.beginPath();for(const [from,to]of spans)ctx.rect(from,-48,to-from,camera.height+96);ctx.clip()}
 ctx.beginPath();ctx.moveTo(face.points[0].x,face.points[0].y);for(let i=1;i<face.points.length;i++)ctx.lineTo(face.points[i].x,face.points[i].y);ctx.closePath();ctx.fillStyle=face.color;ctx.fill();ctx.strokeStyle=face.glow?(face.cool?"rgba(151,235,255,.86)":"rgba(255,226,151,.8)"):"rgba(15,28,26,.11)";ctx.lineWidth=face.glow?.7:.35;ctx.stroke();
 if(face.points.length===4&&right-left>12&&bottom-top>12){ctx.clip();ctx.globalAlpha=alpha*.065;ctx.fillStyle="#e6ddbd";const [a,b,c,d]=face.points;for(let fleck=0;fleck<2;fleck++){const u=.17+fleck*.19,v=.2+((fleck*3)%4)*.17,fx=(a.x*(1-u)+b.x*u)*(1-v)+(d.x*(1-u)+c.x*u)*v,fy=(a.y*(1-u)+b.y*u)*(1-v)+(d.y*(1-u)+c.y*u)*v;ctx.fillRect(Math.round(fx),Math.round(fy),1+(fleck%2),1)}}ctx.restore()
 }ctx.restore()
}

const box=(x:number,y:number,z:number,sx:number,sy:number,sz:number,color:string,yaw=0,glow=false):Voxel=>({x,y,z,sx,sy,sz,color,yaw,glow});

function translated(model:Voxel[],x:number,y:number,yaw:number){const c=Math.cos(yaw),s=Math.sin(yaw);return model.map(v=>({...v,x:x+v.x*c-v.y*s,y:y+v.x*s+v.y*c,yaw:(v.yaw??0)+yaw}))}
function scaled(model:Voxel[],factor:number){return model.map(v=>({...v,x:v.x*factor,y:v.y*factor,z:v.z*factor,sx:v.sx*factor,sy:v.sy*factor,sz:v.sz*factor}))}

const SCENE_PROPS=[...VALLEY_PROPS,...LIVING_PROPS];
const MODEL_TIERS=[false,true].map(detailed=>SCENE_PROPS.map((p,i)=>translated(scaled(sceneryModel(p.frame,Boolean(p.living),p.height,detailed,i%6),.34),p.x,p.y,(i*.83)%Math.PI)));
/** Voxel scenery has real side and top faces: walking around an object changes its silhouette. */
export function drawVoxelWorld(ctx:CanvasRenderingContext2D,camera:Camera,zbuf:Float32Array,time:number,detail=1,combat=false){const voxels:Voxel[]=[];
 // Avoid allocating and sorting every world prop on each animation frame.
 // Only nearby props inside the camera frustum enter the small distance-sorted shortlist.
 const selected=selectScenery(SCENE_PROPS,camera,detail);
 let mobileHeroTrees=0;
 for(const item of selected){const prop=SCENE_PROPS[item.i];const heroTree=detail<2&&mobileHeroTrees<2&&item.d>=2&&item.d<4.5&&prop.height>=2.4&&((!prop.living&&(prop.frame===0||prop.frame===1))||(prop.living&&prop.frame===1));if(heroTree)mobileHeroTrees++;
 const source=MODEL_TIERS[detail>=2&&item.d<7||heroTree?1:0][item.i];const gust=Math.sin(time*.00034+item.i*.73)*.5+.5;const phase=time*.0015+item.i*.71;for(const voxel of source){if(voxel.motion==='flame'){const pulse=.82+Math.sin(time*.009+item.i+voxel.x*7)*.18;voxels.push({...voxel,sz:voxel.sz*pulse})}else if(voxel.motion==='leaf'||voxel.motion==='banner'){
 const wave=Math.sin(phase+voxel.z*3)*(.003+gust*.011);
 voxels.push({...voxel,x:voxel.x+wave,y:voxel.y+wave*.4})}else voxels.push(voxel)}}
 voxels.push(...valleyLife(time,camera.x,camera.y,detail,combat));drawFaces(ctx,camera,voxels,zbuf)}

export function drawVoxelShrines(ctx:CanvasRenderingContext2D,camera:Camera,zbuf:Float32Array,shrines:readonly{x:number;y:number}[],mask:number,time:number){const voxels:Voxel[]=[];shrines.forEach((p,index)=>{const dx=p.x-camera.x,dy=p.y-camera.y,d=Math.hypot(dx,dy),angle=Math.atan2(Math.sin(Math.atan2(dy,dx)-camera.yaw),Math.cos(Math.atan2(dy,dx)-camera.yaw));if(d<.72||d>22||Math.abs(angle)>camera.fov*.72)return;const active=Boolean(mask&(1<<index)),pulse=.96+Math.sin(time*.004+index)*.05,stone=active?"#778879":"#56645e";const model=[box(0,0,0,.68,.58,.14,"#384b43"),box(0,0,.14,.5,.42,.16,stone),box(0,0,.3,.34,.3,.72,stone),box(0,0,1.02,.48,.4,.16,"#8c8e79"),box(0,-.19,.62,.12,.05,.16,active?"#bce6ad":"#78a9bc",0,true),box(0,-.19,.62*1.01,.05,.03,.34,active?"#e5efb8":"#b3dce0",0,true)];model.push(box(.15,.08,.02,.19,.14,.07,"#6a7765",.4),box(-.15,-.08,.01,.16,.18,.04,"#586b4c",-.35),box(0,-.155,.38,.35,.025,.035,"#a5aa8b"),box(0,-.155,.83,.35,.025,.035,"#89977e"));model[4].sx*=pulse;model[5].sz*=pulse;voxels.push(...translated(scaled(model,.22),p.x,p.y,index*.7))});drawFaces(ctx,camera,voxels,zbuf)}

type Actor={x:number;y:number;boss:boolean;kind:"melee"|"ranged"|"brute";phase?:1|2;hit?:number;telegraph?:number;strike?:number;intent?:string;death?:number};
/** Segment-built combatants. Armor, limbs and weapons all expose independent 3D faces. */
const actorMotion=new WeakMap<object,{x:number;y:number;t:number;moving:number}>(),bossMotionKey={};
export function drawVoxelActor(ctx:CanvasRenderingContext2D,camera:Camera,zbuf:Float32Array,actor:Actor,time:number){
 const d=Math.hypot(actor.x-camera.x,actor.y-camera.y);if(d<.34||d>24)return;
 const angle=Math.atan2(Math.sin(Math.atan2(actor.y-camera.y,actor.x-camera.x)-camera.yaw),Math.cos(Math.atan2(actor.y-camera.y,actor.x-camera.x)-camera.yaw));if(Math.abs(angle)>camera.fov*.7)return;
 const key=actor.boss?bossMotionKey:actor,old=actorMotion.get(key),dt=old?Math.max(0,time-old.t):0,speed=old&&dt>0&&dt<250?Math.min(1,Math.hypot(actor.x-old.x,actor.y-old.y)/(dt*.001)):0,moving=dt===0?(old?.moving??0):(old?.moving??0)+(speed-(old?.moving??0))*Math.min(1,dt/120);
 actorMotion.set(key,{x:actor.x,y:actor.y,t:time,moving});
 // A broad, low-opacity contact shadow anchors the feet without lights or blur passes.
 const shadow:Voxel={x:actor.x,y:actor.y,z:.001,sx:.24,sy:.19,sz:.002,color:'#273b32',shape:'faceted'};
 drawFaces(ctx,camera,[shadow],zbuf,.28);
 const model=actorRig(actor,time,moving),yaw=Math.atan2(camera.y-actor.y,camera.x-actor.x),fade=actor.death?Math.min(1,actor.death/.62):1;
 drawFaces(ctx,camera,translated(scaled(model,.3),actor.x,actor.y,yaw),zbuf,fade);
}

type LandmarkOptions={lore:readonly{x:number;y:number}[];loreMask:number;rest?:{x:number;y:number}|null;gate?:{x:number;y:number}|null;dungeon?:boolean};
/** Interactive landmarks share wall occlusion and retain their volume from every viewing angle. */
export function drawVoxelLandmarks(ctx:CanvasRenderingContext2D,camera:Camera,zbuf:Float32Array,options:LandmarkOptions,time:number){const voxels:Voxel[]=[];
 options.lore.forEach((p,index)=>{const read=Boolean(options.loreMask&(1<<index)),stone=read?"#526764":"#674f5e",rune=read?"#b7dec9":"#efb16e";voxels.push(...translated([box(0,0,0,.2,.16,.38,"#34443f"),box(0,0,.34,.3,.18,.2,stone),box(.1,0,.39,.035,.19,.09,rune,0,true),box(0,0,.53,.22,.17,.06,"#829087")],p.x,p.y,index*.8))});
 if(options.rest){const p=options.rest,pulse=.9+Math.sin(time*.009)*.12,flame=options.dungeon?"#e6514c":"#ee9555";voxels.push(...translated([box(0,0,0,.42,.34,.08,"#28222b"),box(-.14,0,.06,.09,.3,.12,"#5c4032",.6),box(.14,0,.06,.09,.3,.12,"#5c4032",-.6),box(0,0,.13,.17,.14,.2,flame,0,true),box(0,0,.28,.08,.07,.15,"#ffd184",0,true)].map((v,i)=>i>2?{...v,sx:v.sx*pulse,sz:v.sz*pulse}:v),p.x,p.y,.35))}
 if(options.gate){const p=options.gate,metal="#75656d",bars="#b38a51",model=[box(-.34,0,0,.18,.3,.78,metal),box(.34,0,0,.18,.3,.78,metal),box(0,0,.7,.86,.32,.18,"#87767c"),box(0,0,.08,.58,.12,.08,"#2a2029")];for(let i=-2;i<=2;i++)model.push(box(i*.11,0,.12,.035,.1,.55,bars));model.push(box(0,0,.38,.58,.09,.04,bars));voxels.push(...translated(model,p.x,p.y,0))}
 drawFaces(ctx,camera,voxels,zbuf)}

export function voxelSceneStats(){return{props:SCENE_PROPS.length,minimumVoxels:VALLEY_PROPS.length*3+LIVING_PROPS.length*3}}

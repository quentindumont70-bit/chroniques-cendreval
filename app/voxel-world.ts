import {LIVING_PROPS,VALLEY_PROPS,visibleSpans} from "./world-art";
import {sceneryModel,valleyLife} from "./scene-models";

export type Voxel={x:number;y:number;z:number;sx:number;sy:number;sz:number;color:string;yaw?:number;glow?:boolean;motion?:"leaf"|"flame"|"banner"};
type Camera={x:number;y:number;yaw:number;width:number;height:number;fov:number;eye?:number};
type Point={x:number;y:number;d:number};
type Face={points:Point[];depth:number;color:string;glow:boolean;cool:boolean};

const FACES=[
  {ids:[4,5,6,7],normal:[0,0,1],light:1.14},
  {ids:[0,4,7,3],normal:[-1,0,0],light:.72},
  {ids:[1,2,6,5],normal:[1,0,0],light:.88},
  {ids:[0,1,5,4],normal:[0,-1,0],light:.8},
  {ids:[3,7,6,2],normal:[0,1,0],light:.94},
] as const;

const palette=new Map<string,readonly[number,number,number]>();
function rgb(hex:string):readonly[number,number,number]{let value=palette.get(hex);if(!value){const raw=hex.replace("#","");value=[parseInt(raw.slice(0,2),16),parseInt(raw.slice(2,4),16),parseInt(raw.slice(4,6),16)];palette.set(hex,value)}return value}
function shade(hex:string,light:number,fog:number){const [r,g,b]=rgb(hex),mist=[143,153,139];return `rgb(${Math.round(r*light*(1-fog)+mist[0]*fog)},${Math.round(g*light*(1-fog)+mist[1]*fog)},${Math.round(b*light*(1-fog)+mist[2]*fog)})`}
function project(camera:Camera,x:number,y:number,z:number):Point|null{const dx=x-camera.x,dy=y-camera.y,c=Math.cos(camera.yaw),s=Math.sin(camera.yaw),d=dx*c+dy*s;if(d<=.08)return null;const side=-dx*s+dy*c,focal=camera.width/(2*Math.tan(camera.fov/2));return{x:camera.width/2+side*focal/d,y:camera.height/2-((z-(camera.eye??.16))*focal/d),d}}

/** Returns the screen position of a world point. Kept public so interaction markers use the same lens. */
export function projectVoxelPoint(camera:Camera,x:number,y:number,z:number){return project(camera,x,y,z)}

function facesForVoxel(camera:Camera,v:Voxel,out:Face[]){
  const yaw=v.yaw??0,c=Math.cos(yaw),s=Math.sin(yaw),hx=v.sx/2,hy=v.sy/2;
  const corners:[[number,number,number],[number,number,number],[number,number,number],[number,number,number],[number,number,number],[number,number,number],[number,number,number],[number,number,number]]=[[-hx,-hy,0],[hx,-hy,0],[hx,hy,0],[-hx,hy,0],[-hx,-hy,v.sz],[hx,-hy,v.sz],[hx,hy,v.sz],[-hx,hy,v.sz]];
  const world=corners.map(([lx,ly,lz])=>[v.x+lx*c-ly*s,v.y+lx*s+ly*c,v.z+lz] as [number,number,number]);
  const [red,,blue]=rgb(v.color),cool=blue>red*1.15;
  for(const face of FACES){const normalX=face.normal[0]*c-face.normal[1]*s,normalY=face.normal[0]*s+face.normal[1]*c;if(face.normal[2]===0&&normalX*(camera.x-v.x)+normalY*(camera.y-v.y)<=0)continue;const points=face.ids.map(i=>project(camera,...world[i]));if(points.some(p=>!p))continue;const visible=points as Point[],depth=visible.reduce((sum,p)=>sum+p.d,0)/visible.length,fog=Math.min(.67,Math.max(0,(depth-5)/24));out.push({points:visible,depth,color:shade(v.color,face.light,fog),glow:Boolean(v.glow),cool})}
}

function drawFaces(ctx:CanvasRenderingContext2D,camera:Camera,voxels:Voxel[],zbuf:Float32Array,alpha=1){
 const faces:Face[]=[];for(const voxel of voxels)facesForVoxel(camera,voxel,faces);faces.sort((a,b)=>b.depth-a.depth);ctx.save();ctx.globalAlpha=alpha;ctx.lineJoin="round";
 for(const face of faces){const xs=face.points.map(p=>p.x),ys=face.points.map(p=>p.y),left=Math.floor(Math.min(...xs)),right=Math.ceil(Math.max(...xs)),top=Math.min(...ys),bottom=Math.max(...ys);if(right<0||left>=camera.width||bottom< -48||top>=camera.height+48)continue;
 const spans=visibleSpans(left,right-left,face.depth,zbuf);if(!spans.length)continue;ctx.save();if(spans.length>1||spans[0][0]>Math.max(0,left)||spans[0][1]<Math.min(camera.width,right)){ctx.beginPath();for(const [from,to]of spans)ctx.rect(from,-48,to-from,camera.height+96);ctx.clip()}
 ctx.beginPath();ctx.moveTo(face.points[0].x,face.points[0].y);for(let i=1;i<face.points.length;i++)ctx.lineTo(face.points[i].x,face.points[i].y);ctx.closePath();ctx.fillStyle=face.color;ctx.fill();ctx.strokeStyle=face.glow?(face.cool?"rgba(151,235,255,.86)":"rgba(255,226,151,.8)"):"rgba(15,28,26,.18)";ctx.lineWidth=face.glow?.7:.35;ctx.stroke();
 if(right-left>12&&bottom-top>12){ctx.clip();ctx.globalAlpha=alpha*.12;ctx.fillStyle="#e6ddbd";const [a,b,c,d]=face.points;for(let fleck=0;fleck<4;fleck++){const u=.17+fleck*.19,v=.2+((fleck*3)%4)*.17,fx=(a.x*(1-u)+b.x*u)*(1-v)+(d.x*(1-u)+c.x*u)*v,fy=(a.y*(1-u)+b.y*u)*(1-v)+(d.y*(1-u)+c.y*u)*v;ctx.fillRect(Math.round(fx),Math.round(fy),1+(fleck%2),1)}}ctx.restore()
 }ctx.restore()
}

const box=(x:number,y:number,z:number,sx:number,sy:number,sz:number,color:string,yaw=0,glow=false):Voxel=>({x,y,z,sx,sy,sz,color,yaw,glow});

function translated(model:Voxel[],x:number,y:number,yaw:number){const c=Math.cos(yaw),s=Math.sin(yaw);return model.map(v=>({...v,x:x+v.x*c-v.y*s,y:y+v.x*s+v.y*c,yaw:(v.yaw??0)+yaw}))}
function scaled(model:Voxel[],factor:number){return model.map(v=>({...v,x:v.x*factor,y:v.y*factor,z:v.z*factor,sx:v.sx*factor,sy:v.sy*factor,sz:v.sz*factor}))}

const SCENE_PROPS=[...VALLEY_PROPS,...LIVING_PROPS];
const MODEL_TIERS=[false,true].map(detailed=>SCENE_PROPS.map((p,i)=>translated(scaled(sceneryModel(p.frame,Boolean(p.living),p.height,detailed),.34),p.x,p.y,(i*.83)%Math.PI)));
/** Voxel scenery has real side and top faces: walking around an object changes its silhouette. */
export function drawVoxelWorld(ctx:CanvasRenderingContext2D,camera:Camera,zbuf:Float32Array,time:number,detail=1,combat=false){const voxels:Voxel[]=[],limit=detail>=3?54:detail>=2?34:18,maxDistance=detail>=2?24:14;
 // Avoid allocating and sorting every world prop on each animation frame.
 // Only nearby props inside the camera frustum enter the small distance-sorted shortlist.
 const visible:{i:number;d:number}[]=[];
 const tall:{i:number;d:number}[]=[];
 const forwardX=Math.cos(camera.yaw),forwardY=Math.sin(camera.yaw),cosLimit=Math.cos(camera.fov*.76);
 for(let i=0;i<SCENE_PROPS.length;i++){
  const p=SCENE_PROPS[i],dx=p.x-camera.x,dy=p.y-camera.y,d2=dx*dx+dy*dy;
  if(d2<=.3025||d2>=maxDistance*maxDistance)continue;
  const forward=dx*forwardX+dy*forwardY;
  if(forward<=0||forward*forward<=d2*cosLimit*cosLimit)continue;
  const d=Math.sqrt(d2),target=p.height>=1.65?tall:visible;
  // Reserve a fixed portion of the mobile budget for trees and landmarks.
  // Dense ground cover must not crowd out the silhouettes that give the valley depth.
  const quota=target===tall?Math.max(6,Math.floor(limit*.55)):limit;
  let position=target.length;
  while(position>0&&target[position-1].d>d)position--;
  if(position>=quota)continue;
  target.splice(position,0,{i,d});
  if(target.length>quota)target.pop();
 }
 const selected=[...tall,...visible].sort((a,b)=>a.d-b.d).slice(0,limit);
 for(const item of selected){const source=MODEL_TIERS[detail>=2&&item.d<7?1:0][item.i];for(const voxel of source){if(voxel.motion==='flame'){const pulse=.82+Math.sin(time*.009+item.i+voxel.x*7)*.18;voxels.push({...voxel,sz:voxel.sz*pulse})}else if(voxel.motion==='leaf'||voxel.motion==='banner'){const wave=Math.sin(time*.0015+item.i+voxel.z*3)*.008;voxels.push({...voxel,x:voxel.x+wave,y:voxel.y+wave*.4})}else voxels.push(voxel)}}
 voxels.push(...valleyLife(time,camera.x,camera.y,detail,combat));drawFaces(ctx,camera,voxels,zbuf)}

export function drawVoxelShrines(ctx:CanvasRenderingContext2D,camera:Camera,zbuf:Float32Array,shrines:readonly{x:number;y:number}[],mask:number,time:number){const voxels:Voxel[]=[];shrines.forEach((p,index)=>{const dx=p.x-camera.x,dy=p.y-camera.y,d=Math.hypot(dx,dy),angle=Math.atan2(Math.sin(Math.atan2(dy,dx)-camera.yaw),Math.cos(Math.atan2(dy,dx)-camera.yaw));if(d<.72||d>22||Math.abs(angle)>camera.fov*.72)return;const active=Boolean(mask&(1<<index)),pulse=.96+Math.sin(time*.004+index)*.05,stone=active?"#778879":"#56645e";const model=[box(0,0,0,.68,.58,.14,"#384b43"),box(0,0,.14,.5,.42,.16,stone),box(0,0,.3,.34,.3,.72,stone),box(0,0,1.02,.48,.4,.16,"#8c8e79"),box(0,-.19,.62,.12,.05,.16,active?"#bce6ad":"#78a9bc",0,true),box(0,-.19,.62*1.01,.05,.03,.34,active?"#e5efb8":"#b3dce0",0,true)];model[4].sx*=pulse;model[5].sz*=pulse;voxels.push(...translated(scaled(model,.22),p.x,p.y,index*.7))});drawFaces(ctx,camera,voxels,zbuf)}

type Actor={x:number;y:number;boss:boolean;kind:"melee"|"ranged"|"brute";phase?:1|2;hit?:number;telegraph?:number;strike?:number;intent?:string;death?:number};
/** Segment-built combatants. Armor, limbs and weapons all expose independent 3D faces. */
export function drawVoxelActor(ctx:CanvasRenderingContext2D,camera:Camera,zbuf:Float32Array,actor:Actor,time:number){const dx=actor.x-camera.x,dy=actor.y-camera.y,d=Math.hypot(dx,dy);if(d<.34||d>24)return;const angle=Math.atan2(Math.sin(Math.atan2(dy,dx)-camera.yaw),Math.cos(Math.atan2(dy,dx)-camera.yaw));if(Math.abs(angle)>camera.fov*.7)return;const yaw=Math.atan2(camera.y-actor.y,camera.x-actor.x),boss=actor.boss,scale=boss?1.32:actor.kind==="brute"?1.06:.88,bob=Math.sin(time*.004+actor.x)*.025,charge=actor.telegraph?Math.min(1,1-actor.telegraph/.8):0,swing=actor.strike?Math.sin(Math.min(1,1-actor.strike/.4)*Math.PI):0,armor=actor.hit?"#c8b48e":boss?"#473849":actor.kind==="ranged"?"#4f493e":"#302b39",cloth=boss?"#682e36":actor.kind==="ranged"?"#756442":"#49334f",skin="#9a7860";const v:Voxel[]=[box(0,0,.14+bob,.28*scale,.32*scale,.48*scale,cloth),box(0,0,.57*scale+bob,.34*scale,.48*scale,.55*scale,armor),box(0,0,1.08*scale+bob,.28*scale,.32*scale,.3*scale,skin),box(0,0,1.28*scale+bob,.34*scale,.42*scale,.16*scale,boss?"#282331":"#38343d"),box(0,-.17*scale,0,.2*scale,.18*scale,.48*scale,"#27242b"),box(0,.17*scale,0,.2*scale,.18*scale,.48*scale,"#27242b")];
 if(boss){
  v.push(box(.02*scale,-.34*scale,.78*scale,.42*scale,.28*scale,.22*scale,"#665064"),box(.02*scale,.34*scale,.78*scale,.42*scale,.28*scale,.22*scale,"#665064"));
  v.push(box(.18*scale,0,.7*scale,.08*scale,.3*scale,.28*scale,"#b38551"),box(.18*scale,0,.48*scale,.08*scale,.42*scale,.08*scale,"#2b2029"));
  v.push(box(.17*scale,-.09*scale,1.14*scale,.05*scale,.06*scale,.045*scale,actor.phase===2?"#bceeff":"#f3a059",0,true),box(.17*scale,.09*scale,1.14*scale,.05*scale,.06*scale,.045*scale,actor.phase===2?"#bceeff":"#f3a059",0,true));
  v.push(box(0,-.2*scale,1.35*scale,.12*scale,.08*scale,.28*scale,"#302536",-.42),box(0,.2*scale,1.35*scale,.12*scale,.08*scale,.28*scale,"#302536",.42));
 }
 const armZ=.65*scale+bob-charge*.1+swing*.18,reach=.34*scale+charge*.12+swing*.2;v.push(box(0,-reach,armZ,.18*scale,.16*scale,.55*scale,armor),box(0,reach,armZ,.18*scale,.16*scale,.55*scale,armor));
 if(actor.kind==="ranged"&&!boss){v.push(box(0,.52*scale,.76*scale,.6*scale,.06*scale,.85*scale,"#9d7d48"),box(0,.5*scale,.78*scale,.72*scale,.03*scale,.03*scale,"#dfd3a5",0,Boolean(actor.telegraph)));}
 else if(boss&&actor.phase===2){for(const side of [-1,1]){v.push(box(0,side*.53*scale,.64*scale,.1*scale,.08*scale,.76*scale,"#88b9c4",side*(.18+swing*.65),true),box(0,side*.53*scale,1.28*scale,.16*scale,.28*scale,.12*scale,"#d6e7df",side*(.18+swing*.65),true))}}
 else {v.push(box(0,.48*scale,.52*scale,.12*scale,.1*scale,.92*scale,boss?"#815437":"#6b5841",.2+swing*.75),box(0,.48*scale,1.3*scale,.28*scale,.5*scale,.28*scale,boss?"#d07a3d":"#79736a",.2+swing*.75,boss));}
 const death=actor.death??0,fade=death>0?Math.min(1,death/.62):1,collapse=death>0?.22+.78*fade:1;if(death>0)for(const part of v){part.z*=collapse;part.sz*=collapse;part.color=part.glow?part.color:"#594752"}
 drawFaces(ctx,camera,translated(scaled(v,.3*Math.min(1,d/1.35)),actor.x,actor.y,yaw),zbuf,fade)}

type LandmarkOptions={lore:readonly{x:number;y:number}[];loreMask:number;rest?:{x:number;y:number}|null;gate?:{x:number;y:number}|null;dungeon?:boolean};
/** Interactive landmarks share wall occlusion and retain their volume from every viewing angle. */
export function drawVoxelLandmarks(ctx:CanvasRenderingContext2D,camera:Camera,zbuf:Float32Array,options:LandmarkOptions,time:number){const voxels:Voxel[]=[];
 options.lore.forEach((p,index)=>{const read=Boolean(options.loreMask&(1<<index)),stone=read?"#526764":"#674f5e",rune=read?"#b7dec9":"#efb16e";voxels.push(...translated([box(0,0,0,.2,.16,.38,"#34443f"),box(0,0,.34,.3,.18,.2,stone),box(.1,0,.39,.035,.19,.09,rune,0,true),box(0,0,.53,.22,.17,.06,"#829087")],p.x,p.y,index*.8))});
 if(options.rest){const p=options.rest,pulse=.9+Math.sin(time*.009)*.12,flame=options.dungeon?"#e6514c":"#ee9555";voxels.push(...translated([box(0,0,0,.42,.34,.08,"#28222b"),box(-.14,0,.06,.09,.3,.12,"#5c4032",.6),box(.14,0,.06,.09,.3,.12,"#5c4032",-.6),box(0,0,.13,.17,.14,.2,flame,0,true),box(0,0,.28,.08,.07,.15,"#ffd184",0,true)].map((v,i)=>i>2?{...v,sx:v.sx*pulse,sz:v.sz*pulse}:v),p.x,p.y,.35))}
 if(options.gate){const p=options.gate,metal="#75656d",bars="#b38a51",model=[box(-.34,0,0,.18,.3,.78,metal),box(.34,0,0,.18,.3,.78,metal),box(0,0,.7,.86,.32,.18,"#87767c"),box(0,0,.08,.58,.12,.08,"#2a2029")];for(let i=-2;i<=2;i++)model.push(box(i*.11,0,.12,.035,.1,.55,bars));model.push(box(0,0,.38,.58,.09,.04,bars));voxels.push(...translated(model,p.x,p.y,0))}
 drawFaces(ctx,camera,voxels,zbuf)}

export function voxelSceneStats(){return{props:SCENE_PROPS.length,minimumVoxels:VALLEY_PROPS.length*3+LIVING_PROPS.length*3}}

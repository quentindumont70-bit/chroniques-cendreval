import {LIVING_PROPS,VALLEY_PROPS} from "./world-art";

export type Voxel={x:number;y:number;z:number;sx:number;sy:number;sz:number;color:string;yaw?:number;glow?:boolean};
type Camera={x:number;y:number;yaw:number;width:number;height:number;fov:number;eye?:number};
type Point={x:number;y:number;d:number};
type Face={points:Point[];depth:number;color:string;glow:boolean};

const FACES=[
  {ids:[4,5,6,7],normal:[0,0,1],light:1.14},
  {ids:[0,4,7,3],normal:[-1,0,0],light:.72},
  {ids:[1,2,6,5],normal:[1,0,0],light:.88},
  {ids:[0,1,5,4],normal:[0,-1,0],light:.8},
  {ids:[3,7,6,2],normal:[0,1,0],light:.94},
] as const;

function rgb(hex:string){const raw=hex.replace("#","");return [parseInt(raw.slice(0,2),16),parseInt(raw.slice(2,4),16),parseInt(raw.slice(4,6),16)]}
function shade(hex:string,light:number,fog:number){const [r,g,b]=rgb(hex),mist=[143,153,139];return `rgb(${Math.round(r*light*(1-fog)+mist[0]*fog)},${Math.round(g*light*(1-fog)+mist[1]*fog)},${Math.round(b*light*(1-fog)+mist[2]*fog)})`}
function project(camera:Camera,x:number,y:number,z:number):Point|null{const dx=x-camera.x,dy=y-camera.y,c=Math.cos(camera.yaw),s=Math.sin(camera.yaw),d=dx*c+dy*s;if(d<=.08)return null;const side=-dx*s+dy*c,focal=camera.width/(2*Math.tan(camera.fov/2));return{x:camera.width/2+side*focal/d,y:camera.height/2-((z-(camera.eye??.16))*focal/d),d}}

/** Returns the screen position of a world point. Kept public so interaction markers use the same lens. */
export function projectVoxelPoint(camera:Camera,x:number,y:number,z:number){return project(camera,x,y,z)}

function facesForVoxel(camera:Camera,v:Voxel,out:Face[]){
  const yaw=v.yaw??0,c=Math.cos(yaw),s=Math.sin(yaw),hx=v.sx/2,hy=v.sy/2;
  const corners:[[number,number,number],[number,number,number],[number,number,number],[number,number,number],[number,number,number],[number,number,number],[number,number,number],[number,number,number]]=[[-hx,-hy,0],[hx,-hy,0],[hx,hy,0],[-hx,hy,0],[-hx,-hy,v.sz],[hx,-hy,v.sz],[hx,hy,v.sz],[-hx,hy,v.sz]];
  const world=corners.map(([lx,ly,lz])=>[v.x+lx*c-ly*s,v.y+lx*s+ly*c,v.z+lz] as [number,number,number]);
  for(const face of FACES){const normalX=face.normal[0]*c-face.normal[1]*s,normalY=face.normal[0]*s+face.normal[1]*c;if(face.normal[2]===0&&normalX*(camera.x-v.x)+normalY*(camera.y-v.y)<=0)continue;const points=face.ids.map(i=>project(camera,...world[i]));if(points.some(p=>!p))continue;const visible=points as Point[],depth=visible.reduce((sum,p)=>sum+p.d,0)/visible.length,fog=Math.min(.67,Math.max(0,(depth-5)/24));out.push({points:visible,depth,color:shade(v.color,face.light,fog),glow:Boolean(v.glow)})}
}

function drawFaces(ctx:CanvasRenderingContext2D,camera:Camera,voxels:Voxel[],zbuf:Float32Array){const faces:Face[]=[];for(const voxel of voxels)facesForVoxel(camera,voxel,faces);faces.sort((a,b)=>b.depth-a.depth);ctx.save();ctx.lineJoin="round";for(const face of faces){const minX=Math.max(0,Math.floor(Math.min(...face.points.map(p=>p.x)))),maxX=Math.min(camera.width-1,Math.ceil(Math.max(...face.points.map(p=>p.x)))),minY=Math.floor(Math.min(...face.points.map(p=>p.y))),maxY=Math.ceil(Math.max(...face.points.map(p=>p.y))),center=Math.max(0,Math.min(zbuf.length-1,Math.floor((minX+maxX)/2)));if(maxX<0||minX>=camera.width||maxY<0||minY>=camera.height||face.depth>zbuf[center]+.16)continue;ctx.beginPath();ctx.moveTo(face.points[0].x,face.points[0].y);for(let i=1;i<face.points.length;i++)ctx.lineTo(face.points[i].x,face.points[i].y);ctx.closePath();ctx.fillStyle=face.color;ctx.fill();ctx.strokeStyle=face.glow?(rgb(face.color)[2]>rgb(face.color)[0]*1.15?"rgba(151,235,255,.86)":"rgba(255,226,151,.8)"):"rgba(15,28,26,.3)";ctx.lineWidth=face.glow?1.15:.5;ctx.stroke();if(maxX-minX>8&&maxY-minY>8){ctx.save();ctx.clip();ctx.globalAlpha=.12;ctx.fillStyle="#e6ddbd";const seed=Math.floor(face.depth*37+minX*11+minY*7);for(let fleck=0;fleck<3;fleck++){const fx=minX+((seed+fleck*17)%Math.max(1,maxX-minX)),fy=minY+((seed*3+fleck*13)%Math.max(1,maxY-minY));ctx.fillRect(Math.floor(fx),Math.floor(fy),1+(fleck%2),1)}ctx.restore()}}ctx.restore()}

const box=(x:number,y:number,z:number,sx:number,sy:number,sz:number,color:string,yaw=0,glow=false):Voxel=>({x,y,z,sx,sy,sz,color,yaw,glow});
function propModel(frame:number,living:boolean,height:number,time:number){const v:Voxel[]=[],h=height,wind=Math.sin(time*.0017+height*4)*.05;
  if((!living&&(frame===0||frame===1))||(living&&(frame===0||frame===1))){const birch=frame===1,wood=birch?"#a9aa8e":"#4d382b",leaf=birch?"#6d7c4d":"#36553b";v.push(box(0,0,0,.18,.2,h*.62,wood));for(let i=0;i<5;i++){const a=i*1.87+wind,z=h*(.5+(i%3)*.12),r=h*(.12+(i%2)*.05);v.push(box(Math.cos(a)*r*.8,Math.sin(a)*r*.8,z,h*.35,h*.3,h*.2,leaf,a*.4))}v.push(box(0,0,h*.75,h*.42,h*.36,h*.18,leaf,wind));}
  else if(!living&&frame===2){v.push(box(-h*.15,0,0,h*.48,h*.36,h*.48,"#59635a",.3),box(h*.2,.05,0,h*.34,h*.42,h*.32,"#738071",-.2),box(0,-h*.18,0,h*.28,h*.25,h*.22,"#414d47",.7));}
  else if(!living&&frame===3){const stone="#6e7468";v.push(box(-h*.32,0,0,h*.22,h*.28,h,stone),box(h*.32,0,0,h*.22,h*.28,h,stone),box(0,0,h*.77,h*.86,h*.3,h*.22,"#7f826f"));for(const x of [-.32,.32])v.push(box(x*h,-h*.17,0,h*.34,h*.18,h*.16,"#3f5141"));}
  else if(!living&&frame===4){v.push(box(0,0,h*.2,h*.85,h*.5,h*.34,"#62402b",.1),box(0,0,h*.55,h*.65,h*.42,h*.14,"#8a6540",.1));for(const x of [-.34,.34])for(const y of [-.25,.25])v.push(box(x*h,y*h,0,h*.13,h*.13,h*.32,"#2c2726"));}
  else if((!living&&frame===5)||(living&&(frame===2||frame===3))){v.push(box(0,0,0,h*.13,h*.13,h*.8,"#44362c"),box(0,0,h*.78,h*.28,h*.22,h*.22,"#b47a35",0,true),box(0,0,h*.84,h*.12,h*.1,h*.1,"#f0cc71",0,true));}
  else if(frame===6){v.push(box(0,0,0,h*.42,h*.22,h*.22,living?"#6a6258":"#33583c",.4),box(-h*.2,0,h*.15,h*.12,h*.15,h*.5,living?"#854d47":"#46704a",-.25),box(h*.18,0,h*.12,h*.13,h*.15,h*.42,"#486b43",.35));}
  else if(frame===7){v.push(box(0,0,0,h*.52,h*.22,h*.76,"#697268"),box(0,0,h*.72,h*.42,h*.25,h*.18,"#889081"),box(0,-h*.13,h*.35,h*.1,h*.03,h*.24,"#b59c65",0,true));}
  else {for(let i=0;i<4;i++){const a=i*Math.PI/2;v.push(box(Math.cos(a)*h*.16,Math.sin(a)*h*.16,0,h*.12,h*.12,h*(.2+i*.04),i%2?"#6d724d":"#485d3b",a))}}
  return v;
}

function translated(model:Voxel[],x:number,y:number,yaw:number){const c=Math.cos(yaw),s=Math.sin(yaw);return model.map(v=>({...v,x:x+v.x*c-v.y*s,y:y+v.x*s+v.y*c,yaw:(v.yaw??0)+yaw}))}
function scaled(model:Voxel[],factor:number){return model.map(v=>({...v,x:v.x*factor,y:v.y*factor,z:v.z*factor,sx:v.sx*factor,sy:v.sy*factor,sz:v.sz*factor}))}

const SCENE_PROPS=[...VALLEY_PROPS,...LIVING_PROPS];
const STATIC_MODELS=SCENE_PROPS.map((p,i)=>translated(scaled(propModel(p.frame,Boolean(p.living),p.height,0),.34),p.x,p.y,(i*.83)%Math.PI));
/** Voxel scenery has real side and top faces: walking around an object changes its silhouette. */
export function drawVoxelWorld(ctx:CanvasRenderingContext2D,camera:Camera,zbuf:Float32Array,time:number,detail=1){const voxels:Voxel[]=[],limit=detail>=3?48:detail>=2?30:18,maxDistance=detail>=2?24:14;const visible=SCENE_PROPS.map((p,i)=>{const dx=p.x-camera.x,dy=p.y-camera.y,d=Math.hypot(dx,dy),angle=Math.atan2(Math.sin(Math.atan2(dy,dx)-camera.yaw),Math.cos(Math.atan2(dy,dx)-camera.yaw));return{p,i,d,angle}}).filter(item=>item.d>.7&&item.d<maxDistance&&Math.abs(item.angle)<camera.fov*.76).sort((a,b)=>a.d-b.d).slice(0,limit);for(const item of visible){const source=STATIC_MODELS[item.i],count=detail<2&&item.d>8?Math.ceil(source.length*.55):source.length;for(let j=0;j<count;j++){const voxel=source[j];if(voxel.glow){const pulse=.94+Math.sin(time*.006+item.i)*.06;voxels.push({...voxel,sz:voxel.sz*pulse})}else voxels.push(voxel)}}drawFaces(ctx,camera,voxels,zbuf)}

export function drawVoxelShrines(ctx:CanvasRenderingContext2D,camera:Camera,zbuf:Float32Array,shrines:readonly{x:number;y:number}[],mask:number,time:number){const voxels:Voxel[]=[];shrines.forEach((p,index)=>{const dx=p.x-camera.x,dy=p.y-camera.y,d=Math.hypot(dx,dy),angle=Math.atan2(Math.sin(Math.atan2(dy,dx)-camera.yaw),Math.cos(Math.atan2(dy,dx)-camera.yaw));if(d<.72||d>22||Math.abs(angle)>camera.fov*.72)return;const active=Boolean(mask&(1<<index)),pulse=.96+Math.sin(time*.004+index)*.05,stone=active?"#778879":"#56645e";const model=[box(0,0,0,.68,.58,.14,"#384b43"),box(0,0,.14,.5,.42,.16,stone),box(0,0,.3,.34,.3,.72,stone),box(0,0,1.02,.48,.4,.16,"#8c8e79"),box(0,-.19,.62,.12,.05,.16,active?"#bce6ad":"#78a9bc",0,true),box(0,-.19,.62*1.01,.05,.03,.34,active?"#e5efb8":"#b3dce0",0,true)];model[4].sx*=pulse;model[5].sz*=pulse;voxels.push(...translated(scaled(model,.22),p.x,p.y,index*.7))});drawFaces(ctx,camera,voxels,zbuf)}

type Actor={x:number;y:number;boss:boolean;kind:"melee"|"ranged"|"brute";phase?:1|2;hit?:number;telegraph?:number;strike?:number;intent?:string};
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
 drawFaces(ctx,camera,translated(scaled(v,.3*Math.min(1,d/1.35)),actor.x,actor.y,yaw),zbuf)}

export function voxelSceneStats(){return{props:SCENE_PROPS.length,minimumVoxels:VALLEY_PROPS.length*3+LIVING_PROPS.length*3}}

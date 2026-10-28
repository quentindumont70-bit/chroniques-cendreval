import {clipNear} from "./near-clip";
import {LIVING_PROPS,VALLEY_PROPS,visibleSpans} from "./world-art";
import {sceneryModel,valleyLife} from "./scene-models";
import {selectScenery} from "./scenery-visibility";

export type Voxel={x:number;y:number;z:number;sx:number;sy:number;sz:number;color:string;yaw?:number;glow?:boolean;motion?:"leaf"|"flame"|"banner"};
type Camera={x:number;y:number;yaw:number;width:number;height:number;fov:number;eye?:number};
type Point={x:number;y:number;d:number};
type Face={points:Point[];depth:number;color:string;glow:boolean;cool:boolean};

const FACES=[
  {ids:[4,5,6,7],normal:[0,0,1],light:1.08},
  {ids:[0,4,7,3],normal:[-1,0,0],light:.77},
  {ids:[1,2,6,5],normal:[1,0,0],light:.88},
  {ids:[0,1,5,4],normal:[0,-1,0],light:.8},
  {ids:[3,7,6,2],normal:[0,1,0],light:.94},
] as const;

const palette=new Map<string,readonly[number,number,number]>();
function rgb(hex:string):readonly[number,number,number]{let value=palette.get(hex);if(!value){const raw=hex.replace("#","");value=[parseInt(raw.slice(0,2),16),parseInt(raw.slice(2,4),16),parseInt(raw.slice(4,6),16)];palette.set(hex,value)}return value}
function shade(hex:string,light:number,fog:number){const [r,g,b]=rgb(hex),mist=[149,157,142];return `rgb(${Math.round(r*light*(1-fog)+mist[0]*fog)},${Math.round(g*light*(1-fog)+mist[1]*fog)},${Math.round(b*light*(1-fog)+mist[2]*fog)})`}
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
  const radius=(v.sx+v.sy)*.72;
  if(forward+radius<=.08)return;
  const lateral=-dx*cameraSin+dy*cameraCos;
  if(Math.abs(lateral)>Math.max(.12,forward)*frustumSlope+radius)return;
  const yaw=v.yaw??0,c=Math.cos(yaw),s=Math.sin(yaw),hx=v.sx/2,hy=v.sy/2;
  const corners:[[number,number,number],[number,number,number],[number,number,number],[number,number,number],[number,number,number],[number,number,number],[number,number,number],[number,number,number]]=[[-hx,-hy,0],[hx,-hy,0],[hx,hy,0],[-hx,hy,0],[-hx,-hy,v.sz],[hx,-hy,v.sz],[hx,hy,v.sz],[-hx,hy,v.sz]];
  const world=corners.map(([lx,ly,lz])=>[v.x+lx*c-ly*s,v.y+lx*s+ly*c,v.z+lz] as [number,number,number]);
  const [red,,blue]=rgb(v.color),cool=blue>red*1.15;
  for(const face of FACES){const normalX=face.normal[0]*c-face.normal[1]*s,normalY=face.normal[0]*s+face.normal[1]*c;if(face.normal[2]===0&&normalX*(camera.x-v.x)+normalY*(camera.y-v.y)<=0)continue;const polygon=clipNear(face.ids.map(index=>{const [x,y,z]=world[index],dx=x-camera.x,dy=y-camera.y;return {side:-dx*cameraSin+dy*cameraCos,depth:dx*cameraCos+dy*cameraSin,z}}));if(polygon.length<3)continue;const visible:Point[]=polygon.map(p=>({x:camera.width/2+p.side*focal/p.depth,y:camera.height/2-(p.z-(camera.eye??.16))*focal/p.depth,d:p.depth}));const depth=visible.reduce((sum,p)=>sum+p.d,0)/visible.length,fog=Math.min(.67,Math.max(0,(depth-5)/24));out.push({points:visible,depth,color:shade(v.color,face.light,fog),glow:Boolean(v.glow),cool})}
}

function drawFaces(ctx:CanvasRenderingContext2D,camera:Camera,voxels:Voxel[],zbuf:Float32Array,alpha=1){
 const faces:Face[]=[],cameraCos=Math.cos(camera.yaw),cameraSin=Math.sin(camera.yaw),focal=camera.width/(2*Math.tan(camera.fov/2)),frustumSlope=Math.tan(camera.fov*.6);for(const voxel of voxels)facesForVoxel(camera,voxel,faces,cameraCos,cameraSin,focal,frustumSlope);if(faces.length===0)return;faces.sort((a,b)=>b.depth-a.depth);ctx.save();ctx.globalAlpha=alpha;ctx.lineJoin="round";
 for(const face of faces){let minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity;for(const p of face.points){if(p.x<minX)minX=p.x;if(p.x>maxX)maxX=p.x;if(p.y<minY)minY=p.y;if(p.y>maxY)maxY=p.y}const left=Math.floor(minX),right=Math.ceil(maxX),top=Math.floor(minY),bottom=Math.ceil(maxY);if(right<0||left>=camera.width||bottom< -48||top>=camera.height+48)continue;
 const spans=visibleSpans(left,right-left,face.depth,zbuf);if(!spans.length)continue;ctx.save();if(spans.length>1||spans[0][0]>Math.max(0,left)||spans[0][1]<Math.min(camera.width,right)){ctx.beginPath();for(const [from,to]of spans)ctx.rect(from,-48,to-from,camera.height+96);ctx.clip()}
 ctx.beginPath();ctx.moveTo(face.points[0].x,face.points[0].y);for(let i=1;i<face.points.length;i++)ctx.lineTo(face.points[i].x,face.points[i].y);ctx.closePath();ctx.fillStyle=face.color;ctx.fill();ctx.strokeStyle=face.glow?(face.cool?"rgba(151,235,255,.86)":"rgba(255,226,151,.8)"):"rgba(15,28,26,.18)";ctx.lineWidth=face.glow?.7:.35;ctx.stroke();
 if(face.points.length===4&&right-left>12&&bottom-top>12){ctx.clip();ctx.globalAlpha=alpha*.12;ctx.fillStyle="#e6ddbd";const [a,b,c,d]=face.points;for(let fleck=0;fleck<4;fleck++){const u=.17+fleck*.19,v=.2+((fleck*3)%4)*.17,fx=(a.x*(1-u)+b.x*u)*(1-v)+(d.x*(1-u)+c.x*u)*v,fy=(a.y*(1-u)+b.y*u)*(1-v)+(d.y*(1-u)+c.y*u)*v;ctx.fillRect(Math.round(fx),Math.round(fy),1+(fleck%2),1)}}ctx.restore()
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
 // Layered armor, a closed visor and a split tabard give the guardian a distinct silhouette.
 if(boss){const trim="#a78962",steel="#716879",dark="#24232e",ember=actor.phase===2?"#abe3e8":"#efb16c";
 const part=(x:number,y:number,z:number,sx:number,sy:number,sz:number,color:string,glow=false)=>v.push(box(x*scale,y*scale,z*scale,sx*scale,sy*scale,sz*scale,color,0,glow));
 part(.17,0,1.11,.07,.35,.22,dark);part(.215,0,1.2,.025,.37,.035,trim);part(.215,0,1.08,.025,.29,.035,steel);part(.23,0,1.11,.025,.035,.1,trim);
 for(const side of [-1,1]){part(.02,side*.34,.91,.32,.26,.06,trim);part(.06,side*.39,1,.17,.13,.12,steel);part(.13,side*.17,.28,.12,.19,.15,steel);part(.19,side*.17,.32,.03,.11,.05,trim);part(.08,side*.17,.025,.28,.21,.1,dark);part(.18,side*.105,.08,.05,.14,.3,"#542b38");part(.21,side*.14,.48,.04,.12,.09,trim)}
 for(let band=0;band<3;band++)part(.19,0,.63+band*.1,.05,.35-band*.04,.055,band===2?trim:steel);
 part(.225,0,.79,.035,.075,.09,ember,true);part(-.22,0,.24,.06,.48,.62,"#382533");part(-.24,0,.81,.07,.42,.12,trim);
 }
 if(!boss){const detail=(x:number,y:number,z:number,sx:number,sy:number,sz:number,color:string)=>v.push(box(x*scale,y*scale,z*scale,sx*scale,sy*scale,sz*scale,color));
 // Segmented armour separates the shoulder, waist and greaves.
 for(const side of [-1,1]){detail(.03,side*.27,.91,.28,.18,.13,'#58635e');detail(.13,side*.17,.26,.12,.15,.17,'#626d65');detail(.07,side*.17,.02,.27,.19,.1,'#333c3b')}
 detail(.19,0,.73,.045,.33,.22,'#68736a');detail(.215,0,.78,.02,.045,.15,'#b09b70');detail(.04,0,.53,.37,.37,.06,'#292b30');detail(.23,0,.54,.03,.09,.055,'#b49b68');
 // ARCHER_DETAIL
 }
 const armZ=.65*scale+bob-charge*.1+swing*.18,reach=.34*scale+charge*.12+swing*.2;v.push(box(0,-reach,armZ,.18*scale,.16*scale,.55*scale,armor),box(0,reach,armZ,.18*scale,.16*scale,.55*scale,armor));
 if(actor.kind==="ranged"&&!boss){v.push(box(0,.52*scale,.76*scale,.6*scale,.06*scale,.85*scale,"#9d7d48"),box(0,.5*scale,.78*scale,.72*scale,.03*scale,.03*scale,"#dfd3a5",0,Boolean(actor.telegraph)));}
 else if(boss&&actor.phase===2){for(const side of [-1,1]){v.push(box(0,side*.53*scale,.64*scale,.1*scale,.08*scale,.76*scale,"#88b9c4",side*(.18+swing*.65),true),box(0,side*.53*scale,1.28*scale,.16*scale,.28*scale,.12*scale,"#d6e7df",side*(.18+swing*.65),true))}}
 else {v.push(box(0,.48*scale,.52*scale,.12*scale,.1*scale,.92*scale,boss?"#815437":"#6b5841",.2+swing*.75),box(0,.48*scale,1.3*scale,.28*scale,.5*scale,.28*scale,boss?"#d07a3d":"#79736a",.2+swing*.75,boss));}
 if(boss){const cold=actor.phase===2,glow=cold?"#c4f2f4":"#ffd38a",metal=cold?"#718e9d":"#936546";
 for(const side of (cold?[-1,1]:[1])){const y=side*(cold?.53:.48)*scale;
 v.push(box(.02,y,.58*scale,.15*scale,.15*scale,.13*scale,"#262735"),box(.02,y,.7*scale,.18*scale,.18*scale,.08*scale,metal));
 if(cold){v.push(box(0,y,1.01*scale,.14*scale,.38*scale,.055*scale,metal),box(.01,y,1.08*scale,.055*scale,.06*scale,.35*scale,glow,0,true));for(const wing of [-1,1])v.push(box(0,y+wing*.15*scale,1.05*scale,.1*scale,.07*scale,.18*scale,metal,wing*.3))}
 else{for(const edge of [-1,1]){v.push(box(0,y+edge*.22*scale,1.31*scale,.34*scale,.075*scale,.28*scale,metal),box(.015,y+edge*.28*scale,1.39*scale,.14*scale,.09*scale,.13*scale,"#c99b5d"))}v.push(box(.16*scale,y,1.39*scale,.035*scale,.17*scale,.13*scale,glow,0,true),box(0,y,1.57*scale,.15*scale,.15*scale,.12*scale,metal))}
 }
 // Anticipation compresses the stance; the strike drives the chest forward.
 for(const part of v){if(part.z>.5*scale){part.x+=(-charge*.065+swing*.1)*scale;part.z-=charge*.025*scale}if(Math.abs(part.y)>.42*scale){part.x+=swing*.15*scale;part.z+=charge*.06*scale}}
 }
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

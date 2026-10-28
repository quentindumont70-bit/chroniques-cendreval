import type {Voxel} from './voxel-world';
export type RigActor={boss:boolean;kind:'melee'|'ranged'|'brute';phase?:1|2;telegraph?:number;telegraphMax?:number;strike?:number;hit?:number;death?:number;intent?:string};
type Joint=[number,number,number];
export function actorRig(actor:RigActor,time:number,moving=0):Voxel[]{
 const parts:Voxel[]=[],boss=actor.boss,heavy=boss||actor.kind==='brute',size=boss?1.32:heavy?1.06:.88;
 const steel=boss?'#47454c':heavy?'#5b5854':'#53605c',trim=boss?'#9c784b':'#9d9b80',cloth=actor.kind==='ranged'?'#394d41':'#3e303a';
 const body=(x:number,y:number,z:number,sx:number,sy:number,sz:number,color:string,taper=1,pitch=0,yaw=0)=>{const v:Voxel={x,y,z,sx,sy,sz,color,taper,pitch,yaw,shape:'faceted'};parts.push(v);return v};
 const bone=(a:Joint,b:Joint,width:number,color:string,taper=.75)=>{const dx=b[0]-a[0],dy=b[1]-a[1],dz=b[2]-a[2];return body(...a,width,width,Math.hypot(dx,dy,dz),color,taper,Math.atan2(Math.hypot(dx,dy),dz),Math.atan2(dy,dx))};
 const charge=actor.telegraph?Math.max(0,1-actor.telegraph/(actor.telegraphMax??.8)):0,strike=actor.strike?Math.sin(Math.min(1,1-actor.strike/.4)*Math.PI):0;
 const breath=Math.sin(time*.0022)*.008,lean=-charge*.08+strike*.17;
 // TORSO
 body(lean,0,.58,.31,heavy?.54:.39,.37,steel,1.22);body(lean,0,.94,.32,heavy?.58:.44,.15,steel,.64);
 body(0,0,.48,.29,.35,.13,cloth,1.08);body(.02,0,.54,.33,.39,.045,trim);
 body(lean+.17,0,.75,.045,.12,.17,trim,.6);body(lean+.19,0,.82,.04,.06,.07,boss?'#c68a42':'#a9b5a2',.5);
 body(lean,0,1.08,.14,.16,.1,cloth);body(lean,0,1.16,.25,.28,.22,steel,.82);body(lean,0,1.38,.22,.25,.12,steel,.1);
 body(lean+.125,0,1.22,.035,.22,.045,'#171e23');for(const side of [-1,1]){const eye=body(lean+.15,side*.055,1.23,.025,.045,.025,boss?(actor.phase===2?'#a4e6eb':'#ec9a43'):'#b5b69a');eye.glow=boss;}
 for(let bar=-1;bar<=1;bar++)body(lean+.14,bar*.05,1.13,.025,.017,.1,trim,.8);
 if(boss)for(const side of [-1,1]){bone([lean,side*.11,1.36],[lean-.03,side*.24,1.51],.095,trim,.68);bone([lean-.03,side*.24,1.51],[lean+.01,side*.21,1.72],.065,trim,.05);}
// HEAD
 // LEGS
 // ARMS
 // CAPE
 // FINISH
 return parts.map(v=>({...v,x:v.x*size,y:v.y*size,z:(v.z+breath)*size,sx:v.sx*size,sy:v.sy*size,sz:v.sz*size}));
}

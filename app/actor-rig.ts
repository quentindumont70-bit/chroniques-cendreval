import {actorPose} from "./actor-pose.ts";
import type {Voxel} from './voxel-world';
export type RigActor={boss:boolean;kind:'melee'|'ranged'|'brute';phase?:1|2;telegraph?:number;telegraphMax?:number;strike?:number;hit?:number;death?:number;intent?:string};
type Joint=[number,number,number];
export function actorRig(actor:RigActor,time:number,moving=0):Voxel[]{
 const parts:Voxel[]=[],boss=actor.boss,heavy=boss||actor.kind==='brute',size=boss?1.32:heavy?1.06:.88;
 const steel=boss?'#47454c':heavy?'#5b5854':'#53605c',trim=boss?'#9c784b':'#9d9b80',cloth=actor.kind==='ranged'?'#394d41':'#3e303a';
 const body=(x:number,y:number,z:number,sx:number,sy:number,sz:number,color:string,taper=1,pitch=0,yaw=0)=>{const v:Voxel={x,y,z,sx,sy,sz,color,taper,pitch,yaw,shape:'faceted'};parts.push(v);return v};
 const bone=(a:Joint,b:Joint,width:number,color:string,taper=.75)=>{const dx=b[0]-a[0],dy=b[1]-a[1],dz=b[2]-a[2];return body(...a,width,width,Math.hypot(dx,dy,dz),color,taper,Math.atan2(Math.hypot(dx,dy),dz),Math.atan2(dy,dx))};
 const charge=actor.telegraph?Math.max(0,1-actor.telegraph/(actor.telegraphMax??.8)):0,strike=actor.strike?Math.sin(Math.min(1,1-actor.strike/.4)*Math.PI):0;
 const pose=actorPose(actor,time,moving),breath=Math.sin(time*.0022)*.008,lean=pose.lean;
 // TORSO
 body(lean,0,.58,.31,heavy?.54:.39,.37,steel,1.22);body(lean,0,.94,.32,heavy?.58:.44,.15,steel,.64);
 body(0,0,.48,.29,.35,.13,cloth,1.08);body(.02,0,.54,.33,.39,.045,trim);
 body(lean+.17,0,.75,.045,.12,.17,trim,.6);body(lean+.19,0,.82,.04,.06,.07,boss?'#c68a42':'#a9b5a2',.5);
 body(lean,0,1.08,.14,.16,.1,cloth);body(lean,0,1.16,.25,.28,.22,steel,.82);body(lean,0,1.38,.22,.25,.12,steel,.1);
 body(lean+.125,0,1.22,.035,.22,.045,'#171e23');for(const side of [-1,1]){const eye=body(lean+.15,side*.055,1.23,.025,.045,.025,boss?(actor.phase===2?'#a4e6eb':'#ec9a43'):'#b5b69a');eye.glow=boss;}
 for(let bar=-1;bar<=1;bar++)body(lean+.14,bar*.05,1.13,.025,.017,.1,trim,.8);
 if(boss)for(const side of [-1,1]){bone([lean,side*.11,1.36],[lean-.03,side*.24,1.51],.095,trim,.68);bone([lean-.03,side*.24,1.51],[lean+.01,side*.21,1.72],.065,trim,.05);}
// HEAD
 const stride=Math.sin(time*.009)*Math.min(1,moving)*.19;
 for(const side of [-1,1]){const hip:Joint=[0,side*.12,.55],knee:Joint=[side*stride*.65+.035,side*.14,.29],foot:Joint=pose.feet[side===-1?0:1];
 bone(hip,knee,.18,cloth,.9);bone(knee,foot,.155,steel,.65);body(knee[0]+.04,knee[1],knee[2]-.04,.18,.18,.12,trim,.65);body(foot[0]+.055,foot[1],foot[2]-.04,.28,.17,.075,steel,.7);}

// LEGS
 const hands:Joint[]=[];
 for(const side of [-1,1]){const shoulder:Joint=[lean,side*(heavy?.29:.23),.99],elbow:Joint=[lean-.06-charge*.12+strike*.22,side*.34,.77+charge*.17],hand:Joint=pose.hands[side===-1?0:1];
 bone(shoulder,elbow,.19,steel,.8);bone(elbow,hand,.15,steel,.7);body(...hand,.14,.14,.12,trim,.75);hands.push(hand);
 body(lean-.02,shoulder[1],.97,.31,heavy?.3:.22,.16,steel,.55);body(lean-.02,shoulder[1],.95,.33,heavy?.32:.24,.035,trim,.9);}

// ARMS
 for(let panel=0;panel<5;panel++){const y=(panel-2)*.105,sway=Math.sin(time*.003+panel*.55)*(.018+moving*.02);bone([lean-.16,y,1.03],[-.24+sway,y*1.35,.23+(panel%2)*.09],.14,cloth,.66)}
 if(actor.kind==='ranged'&&!boss){body(lean-.025,0,1.17,.31,.34,.3,'#354d40',.3);body(lean+.14,0,1.21,.045,.2,.13,'#1e2928');bone([-.18,.18,.6],[-.23,.2,1.06],.14,'#70573c');for(let i=0;i<3;i++)bone([-.23,.16+i*.035,.9],[-.24,.16+i*.035,1.22],.018,'#c6b691');}

// CAPE
 // Overlapping faulds, collar folds and asymmetric shoulder plates give mass.
 for(const side of [-1,1]){body(.08,side*.14,.4,.24,.19,.14,steel,.7,-.16);body(lean-.025,side*(heavy?.32:.25),1.075,.23,.23,.09,trim,.25);body(lean-.08,side*.16,1.055,.22,.19,.08,cloth,.5);}
 if(boss){for(let rib=0;rib<3;rib++)body(lean+.16,0,.64+rib*.085,.035,.36-rib*.04,.028,trim,.85);for(const side of [-1,1])bone([lean-.04,side*.32,1.1],[lean-.09,side*.4,1.23],.07,steel,.05);}
 const hand=hands[1];
 if(actor.kind==='ranged'&&!boss){for(const side of [-1,1]){bone(hand,[hand[0]+.12,hand[1],hand[2]+side*.25],.045,'#a98b58');bone([hand[0]+.12,hand[1],hand[2]+side*.25],[hand[0]-.02,hand[1],hand[2]+side*.4],.035,'#806845');}bone([hand[0]-.02,hand[1],hand[2]-.4],[hand[0]-.02,hand[1],hand[2]+.4],.009,'#d7cfb6');}
 else if(!boss&&actor.kind==='melee'){const tip:Joint=[hand[0]+.25+strike*.38,hand[1]-.08,hand[2]+.65-charge*.2];bone(hand,tip,.07,'#aabac0',.03);bone([hand[0],hand[1]-.12,hand[2]+.07],[hand[0],hand[1]+.12,hand[2]+.07],.035,trim);const off=hands[0];body(off[0]+.07,off[1],off[2]-.1,.065,.29,.4,'#4c5e62',.35);body(off[0]+.11,off[1],off[2]+.03,.03,.09,.12,trim,.6);}
 else if(!boss||actor.phase!==2){const tip:Joint=[hand[0]-.15+strike*.45,hand[1],hand[2]+.82];bone([hand[0]+.08,hand[1],hand[2]-.17],tip,.055,'#765237');body(...tip,boss?.34:.2,boss?.44:.29,boss?.26:.18,steel,.72);if(boss){body(tip[0]+.17,tip[1],tip[2]+.07,.04,.19,.13,'#ecaa53',.55).glow=true;for(const side of [-1,1])bone([tip[0],tip[1]+side*.2,tip[2]+.13],[tip[0],tip[1]+side*.31,tip[2]+.17],.085,trim,.1);}}

if(boss&&actor.phase===2)for(const grip of hands){const tip:Joint=[grip[0]+strike*.3,grip[1],grip[2]+.83];bone(grip,tip,.095,'#a9d5dc',.05).glow=true;bone([grip[0],grip[1]-.19,grip[2]+.12],[grip[0],grip[1]+.19,grip[2]+.12],.055,trim);for(const side of [-1,1])bone([grip[0],grip[1]+side*.13,grip[2]+.12],[grip[0],grip[1]+side*.19,grip[2]+.27],.05,'#81b7c9',.15);}

const hit=Math.min(.12,(actor.hit??0)*.18),death=actor.death??0;
 for(const part of parts){if(part.z>.5){part.x-=hit;part.pitch=(part.pitch??0)-hit*.5;}if(death>0){const life=Math.min(1,death/.62);part.z*=.2+.8*life;part.sz*=.2+.8*life;part.x+=(1-life)*.25;}}

// FINISH
 return parts.map(v=>({...v,x:v.x*size,y:v.y*size,z:(v.z+(v.z>.5?breath:0))*size,sx:v.sx*size,sy:v.sy*size,sz:v.sz*size}));
}

import {HERBS} from '../alchemy.ts';
export type Zone='valley'|'crypt'|'cistern';
export type Box={x:number;z:number;y:number;w:number;d:number;h:number;kind?:'gate'|'house'|'wall'|'pillar'|'rock'};
export type Place={id:string;name:string;x:number;z:number;y?:number;kind:'rest'|'portal'|'lever'|'secret'|'memory'|'village'|'herb'|'chest'|'npc'|'flight'|'shortcut'|'bell'|'inscription';index?:number;requiresFlight?:boolean};
export const clamp=(v:number,a:number,b:number)=>Math.max(a,Math.min(b,v));
export function ground(zone:Zone,x:number,z:number){
 if(zone==='cistern')return z< -14&&z> -21?-10:0;
 if(zone==='crypt'){
  if(x>8&&x<17&&z< -10&&z> -22)return clamp((-z-10)/12,0,1)*3;
  if(x>8&&x<17&&z<=-22&&z> -28)return 3;
  return 0;
 }
 const path=Math.exp(-Math.pow(x/8,2));
 const hill=clamp((-z-8)/38,0,1)*4;
 const wild=(Math.sin(x*.16)*Math.cos(z*.12)*1.7+Math.sin(x*.34+z*.12)*.5)*(1-path);
 const channel=Math.exp(-Math.pow((z-4)/2.6,2));
 return hill+wild-channel*1.5;
}
export const BRIDGE:Box={x:0,z:4,y:1.8,w:6,d:12,h:.45};
export const valleyBoxes:Box[]=[
 {x:-3.1,z:4,y:1.8,w:.22,d:12,h:.9,kind:'wall'},{x:3.1,z:4,y:1.8,w:.22,d:12,h:.9,kind:'wall'},
 {x:-10,z:24,y:0,w:7,d:8,h:5,kind:'house'}, {x:11,z:27,y:0,w:8,d:7,h:5,kind:'house'},
 {x:-13,z:13,y:0,w:5,d:6,h:4,kind:'house'},
 {x:-9,z:-46,y:4,w:10,d:9,h:12,kind:'wall'},{x:9,z:-46,y:4,w:10,d:9,h:12,kind:'wall'},
 {x:0,z:-54,y:4,w:28,d:4,h:12,kind:'wall'},
 {x:-14,z:-20,y:1,w:1,d:9,h:4,kind:'wall'}, {x:-20,z:-20,y:1,w:1,d:9,h:4,kind:'wall'},
 {x:-17,z:-24,y:1,w:7,d:1,h:3,kind:'wall'}
];
export const cryptBoxes:Box[]=[
 {x:-20,z:-20,y:0,w:1,d:58,h:7,kind:'wall'},{x:20,z:-20,y:0,w:1,d:58,h:7,kind:'wall'},
 {x:0,z:8,y:0,w:40,d:1,h:7,kind:'wall'},{x:0,z:-49,y:0,w:40,d:1,h:7,kind:'wall'},
 {x:-18,z:-9,y:0,w:4,d:1,h:6,kind:'wall'},{x:-8,z:-9,y:0,w:8,d:1,h:6,kind:'wall'},
 {x:7,z:-9,y:0,w:6,d:1,h:6,kind:'wall'},{x:17,z:-9,y:0,w:6,d:1,h:6,kind:'wall'},
 {x:-8,z:-14,y:0,w:1,d:9,h:6,kind:'wall'},{x:-8,z:-26.5,y:0,w:1,d:4,h:6,kind:'wall'},
 {x:-8,z:-21.5,y:0,w:1,d:6,h:6,kind:'gate'},
 {x:8,z:-14.75,y:0,w:1,d:10.5,h:6,kind:'wall'},{x:8,z:-26.75,y:0,w:1,d:3.5,h:6,kind:'wall'},{x:8,z:-22.5,y:0,w:1,d:5,h:3,kind:'wall'},
 {x:-12,z:-29,y:0,w:16,d:1,h:6,kind:'wall'},{x:12,z:-29,y:0,w:16,d:1,h:6,kind:'wall'},
 {x:0,z:-29,y:0,w:8,d:.7,h:5,kind:'gate'},
 ...[-10,10].flatMap(x=>[-35,-44].map(z=>({x,z,y:0,w:1.5,d:1.5,h:6,kind:'pillar' as const})))
];
export const cisternBoxes:Box[]=[{x:-23,z:-14,y:-10,w:1,d:55,h:18,kind:'wall'},{x:23,z:-14,y:-10,w:1,d:55,h:18,kind:'wall'},{x:0,z:12,y:0,w:46,d:1,h:8,kind:'wall'},{x:0,z:-41,y:0,w:46,d:1,h:8,kind:'wall'},...[-15,15].flatMap(x=>[-7,-30].map(z=>({x,z,y:0,w:2,d:2,h:8,kind:'pillar' as const})))];
export const platforms:Record<Zone,Box[]>={valley:[{x:25,z:-7,y:ground('valley',25,-7)+2.5,w:6,d:5,h:.5}],crypt:[{x:3,z:-24,y:5.4,w:5,d:5,h:.5}],cistern:[]};
export const places:Record<Zone,Place[]>={valley:[
 {id:'tovin-home',name:'Tovin · de retour à Valbrume',x:7,z:22,kind:'npc'},
 {id:'mara',name:'Mara · la lumière sous la pierre',x:6,z:24,kind:'npc'},
 {id:'rune',name:'Rune · rallumer la forge',x:-5,z:19,kind:'npc'},
 {id:'vey',name:'Sœur Vey · les noms oubliés',x:4,z:30,kind:'npc'},
 {id:'cistern',name:'Descendre dans la citerne',x:27,z:-12,kind:'portal'},
 {id:'skycache',name:'Balcon des passeurs',x:25,z:-7,y:ground('valley',25,-7)+2.5,kind:'chest',requiresFlight:true},
 {id:'village',name:'Elenn · le serment des Veilleurs',x:0,z:26,kind:'village'},
 {id:'hearth',name:'Feu de Valbrume',x:-4,z:23,kind:'rest'},
 {id:'ruin',name:'Mémoire du pont brisé',x:-17,z:-20,kind:'memory'},
 {id:'lookout',name:'Belvédère des disparus',x:24,z:-29,kind:'memory'},
 {id:'hollow',name:'Cache sous le pont',x:0,z:4,y:-1.4,kind:'secret'},
 {id:'memory-shrine',name:'Rassembler les trois mémoires',x:-3,z:-34,kind:'inscription'},
 {id:'shrine',name:'Sanctuaire du seuil',x:0,z:-35,kind:'rest'},
 {id:'entrance',name:'Entrer dans le donjon',x:0,z:-47,kind:'portal'},
 ...[[-5,17],[5,20],[-7,-8],[10,-12],[-23,-17],[21,-26],[-8,-31],[8,-37],[-20,5],[16,10],[-10,31],[26,-9]].map(([x,z],index)=>({id:`herb${index}`,name:HERBS[index].name,x,z,kind:'herb' as const,index}))
],cistern:[
 {id:'tide-inscription',name:'Lire la stèle des marées',x:0,z:-6,kind:'inscription'},
 {id:'bell-source',name:'Faire sonner la Source',x:-7,z:-25,kind:'bell',index:0},
 {id:'bell-moon',name:'Faire sonner la Lune',x:0,z:-26,kind:'bell',index:1},
 {id:'bell-sun',name:'Faire sonner le Soleil',x:7,z:-25,kind:'bell',index:2},
 {id:'cistern-exit',name:'Remonter à la vallée',x:0,z:8,kind:'portal'},
 {id:'cisternfire',name:'Feu des passeurs',x:-4,z:5,kind:'rest'},
 {id:'wings',name:'Le souffle des passeurs',x:8,z:-10,kind:'flight'},
 {id:'tovin',name:'Tovin · le passeur égaré',x:-8,z:-29,kind:'npc'},
 {id:'orecache',name:'Coffre de la carrière',x:10,z:-29,kind:'chest'},
 {id:'cistern-shortcut',name:'Ouvrir le passage du château',x:0,z:-36,kind:'shortcut'},
 ],crypt:[
 {id:'crypt-cistern',name:'Passage vers la citerne',x:-15,z:-26,kind:'portal'},
 {id:'highrelic',name:'Autel de la foudre',x:3,z:-24,y:5.4,kind:'chest',requiresFlight:true},
 {id:'exit',name:'Retour à la vallée',x:0,z:5,kind:'portal'},
 {id:'cryptfire',name:'Braise du vestibule',x:-4,z:2,kind:'rest'},
 {id:'seal',name:'Lever le sceau de la crypte',x:12,z:-25,y:3,kind:'lever'},
 {id:'tomb',name:'Reliquaire oublié',x:-14,z:-23,kind:'chest'},
 {id:'memory',name:'Mémoire du gardien',x:-14,z:-13,kind:'memory'},
 {id:'reward',name:'Cœur de Sulfuras',x:0,z:-43,kind:'chest'}
]};
export function solids(zone:Zone,gate:boolean){return(zone==='valley'?valleyBoxes:zone==='cistern'?cisternBoxes:cryptBoxes).filter(b=>b.kind!=='gate'||!gate)}
export function floorAt(zone:Zone,x:number,z:number,feet:number){
 let y=ground(zone,x,z);
 for(const b of platforms[zone])if(Math.abs(x-b.x)<b.w/2&&Math.abs(z-b.z)<b.d/2&&feet>=b.y-.46)y=Math.max(y,b.y);
 if(zone==='valley'&&Math.abs(x)<3){
  if(z>=10&&z<16)y=Math.max(y,1.8*(16-z)/6);
  if(z<=-2&&z>-8)y=Math.max(y,1.8*(z+8)/6);
  if(z>=-2&&z<=10&&feet>=1.8-.5)y=Math.max(y,1.8);
 }
 return y;
}
export function canStand(zone:Zone,x:number,y:number,z:number,gate:boolean,r=.32){
 if(zone==='valley'&&(Math.abs(x)>34||z>36||z< -53))return false;
 if(zone==='cistern'&&(Math.abs(x)>22||z>11||z< -40))return false;
 for(const b of platforms[zone])if(Math.abs(x-b.x)<b.w/2+r&&Math.abs(z-b.z)<b.d/2+r&&y<b.y-.46&&y+1.65>b.y-b.h)return false;
 if(zone==='crypt'&&(Math.abs(x)>19||z>7||z< -48))return false;
 if(zone==='valley'&&Math.abs(x)<3+r&&z> -2-r&&z<10+r&&y<1.8-.46&&y+1.65>1.35)return false;
 return !solids(zone,gate).some(b=>Math.abs(x-b.x)<b.w/2+r&&Math.abs(z-b.z)<b.d/2+r&&y<b.y+b.h&&y+1.65>b.y);
}
export function moveBody(zone:Zone,p:{x:number;y:number;z:number},dx:number,dz:number,gate:boolean){
 const n=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.12));
 for(let i=0;i<n;i++)for(const axis of ['x','z'] as const){
  const next={...p,[axis]:p[axis]+(axis==='x'?dx:dz)/n};
  const f=floorAt(zone,next.x,next.z,p.y);
  if(f-p.y<=.46&&canStand(zone,next.x,Math.max(p.y,f),next.z,gate)){p[axis]=next[axis];if(f>p.y)p.y=f}
 }
 return p;
}
export function sight(zone:Zone,a:{x:number;y:number;z:number},b:{x:number;y:number;z:number},gate:boolean){
 const steps=Math.ceil(Math.hypot(a.x-b.x,a.z-b.z)*4);
 for(let i=1;i<steps;i++){
  const t=i/steps,x=a.x+(b.x-a.x)*t,z=a.z+(b.z-a.z)*t,y=a.y+(b.y-a.y)*t;
  if(solids(zone,gate).some(o=>Math.abs(x-o.x)<o.w/2&&Math.abs(z-o.z)<o.d/2&&y>o.y&&y<o.y+o.h))return false;
  if(ground(zone,x,z)>y)return false;
  if(platforms[zone].some(o=>Math.abs(x-o.x)<o.w/2&&Math.abs(z-o.z)<o.d/2&&y>o.y-o.h&&y<o.y))return false;
  if(zone==='valley'&&Math.abs(x)<3&&z> -2&&z<10&&y>1.35&&y<1.8)return false;
 }
 return true;
}
export type EnemyKind='sentinel'|'archer'|'hound'|'boss';
export const spawns:Record<Zone,{id:string;kind:EnemyKind;x:number;z:number}[]>={valley:[
 {id:'v1',kind:'hound',x:4,z:-11},{id:'v2',kind:'sentinel',x:-14,z:-18},{id:'v3',kind:'archer',x:19,z:-25},
 {id:'v4',kind:'sentinel',x:3,z:-28},{id:'v5',kind:'hound',x:-7,z:-32},{id:'v6',kind:'archer',x:7,z:-40}
],cistern:[{id:'s1',kind:'sentinel',x:7,z:-7},{id:'s2',kind:'hound',x:-6,z:-9},{id:'s3',kind:'archer',x:9,z:-27},{id:'s4',kind:'sentinel',x:-5,z:-32}],crypt:[{id:'c1',kind:'sentinel',x:0,z:-14},{id:'c2',kind:'archer',x:12,z:-20},{id:'c3',kind:'hound',x:-14,z:-18},{id:'boss',kind:'boss',x:0,z:-40}]};

export function ceilingAt(zone:Zone,x:number,z:number,feet:number){
 let ceiling=zone==='crypt'?8.75:Infinity;
 if(zone==='valley'&&Math.abs(x)<3&&z>-2&&z<10&&feet+1.65<=1.35+.01)ceiling=Math.min(ceiling,1.35);
 for(const b of platforms[zone])if(Math.abs(x-b.x)<b.w/2&&Math.abs(z-b.z)<b.d/2&&feet+1.65<=b.y-b.h+.01)ceiling=Math.min(ceiling,b.y-b.h);
 return ceiling;
}

import {canOccupy} from './world-rules';
type Actor={attackBeat?:number;commanderPhase?:number;name:string;x:number;y:number;hp:number;alive:boolean;cooldown:number;telegraph:number;hit:number};
/** Resume health and positions, but give the player a readable new windup. */
export function captureEncounter(quest:number,actors:readonly Actor[],cooldowns:readonly number[]){return JSON.stringify({version:1,quest,actors:actors.map(a=>({name:a.name,x:a.x,y:a.y,hp:a.hp,alive:a.alive,attackBeat:a.attackBeat??0,commanderPhase:a.commanderPhase??1})),cooldowns:cooldowns.map(n=>Math.max(0,Math.min(120,n)))})}
export function restoreEncounter<T extends Actor>(raw:string,quest:number,actors:readonly T[],map:readonly string[]):{actors:T[];cooldowns:number[]}|null{
 if(!raw||raw.length>32000)return null;try{const data=JSON.parse(raw);if(data.version!==1||data.quest!==quest||!Array.isArray(data.actors)||data.actors.length!==actors.length||!Array.isArray(data.cooldowns)||data.cooldowns.length!==3)return null;
 if(!data.cooldowns.every((n:unknown)=>typeof n==='number'&&Number.isFinite(n)&&n>=0&&n<=120))return null;
 const restored=actors.map((actor,i)=>{const a=data.actors[i];if(!a||a.name!==actor.name||typeof a.alive!=='boolean'||![a.x,a.y,a.hp].every(n=>typeof n==='number'&&Number.isFinite(n))||a.hp<0||a.hp>400||a.alive!==(a.hp>0)||(a.alive&&!canOccupy(map,a.x,a.y)))throw Error('Invalid encounter');return {...actor,x:a.x,y:a.y,hp:a.hp,alive:a.alive,attackBeat:Number.isSafeInteger(a.attackBeat)&&a.attackBeat>=0?Math.min(a.attackBeat,100000):0,commanderPhase:a.commanderPhase===2?2:1,telegraph:0,hit:0,cooldown:1,strike:0,impactDone:true}});
 return {actors:restored,cooldowns:data.cooldowns};}catch{return null}
}

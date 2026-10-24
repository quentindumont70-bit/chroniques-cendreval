export function canOccupy(map:readonly string[],x:number,y:number,radius=.17){
 for(const dx of [-radius,radius])for(const dy of [-radius,radius])if(map[Math.floor(y+dy)]?.[Math.floor(x+dx)]!=='0')return false;
 return true;
}
export function slideMove(map:readonly string[],x:number,y:number,dx:number,dy:number,radius=.17){
 const steps=Math.max(1,Math.ceil(Math.hypot(dx,dy)/.08));
 for(let i=0;i<steps;i++){if(canOccupy(map,x+dx/steps,y,radius))x+=dx/steps;if(canOccupy(map,x,y+dy/steps,radius))y+=dy/steps}
 return {x,y};
}
export function clearSight(map:readonly string[],x:number,y:number,tx:number,ty:number){const steps=Math.max(1,Math.ceil(Math.hypot(tx-x,ty-y)/.06));for(let i=1;i<steps;i++)if(map[Math.floor(y+(ty-y)*i/steps)]?.[Math.floor(x+(tx-x)*i/steps)]!=='0')return false;return true}
export function nearestWalkable(map:readonly string[],x:number,y:number){if(canOccupy(map,x,y))return{x,y};let best={x:3.5,y:16.5},distance=Infinity;for(let row=0;row<map.length;row++)for(let col=0;col<map[row].length;col++)if(map[row][col]==='0'){const d=Math.hypot(col+.5-x,row+.5-y);if(d<distance){distance=d;best={x:col+.5,y:row+.5}}}return best}

export function decodeProgress<T extends Record<string,unknown>>(raw:string,defaults:T,mapForQuest:(q:number)=>readonly string[]):T{
 const input=JSON.parse(raw);if(!input||typeof input!=='object'||Array.isArray(input))throw Error('Invalid save');
 const result={...defaults} as Record<string,unknown>;
 for(const key of Object.keys(defaults)){const value=input[key],base=defaults[key];if(typeof base==='number'&&typeof value==='number'&&Number.isFinite(value))result[key]=value;else if(typeof base==='boolean'&&typeof value==='boolean')result[key]=value;else if(typeof base==='string'&&typeof value==='string')result[key]=value}
 const clamp=(key:string,min:number,max:number,integer=false)=>{const v=Math.max(min,Math.min(max,Number(result[key])));result[key]=integer?Math.floor(v):v};
 for(const key of ['hp','mana','stamina'])clamp(key,0,100);
 for(const [key,max] of [['shadeMask',3],['quest',16],['shrines',7],['lore',7],['checkpoint',3],['enemyHp',400],['potions',99],['arrows',30],['level',99],['gold',999999],['talent',99],['xp',9999],['echoTier',5],['echoBest',5]] as const)clamp(key,0,max,true);
 if(!['blade','bow','arcane'].includes(String(result.spec)))result.spec=defaults.spec;
 if(!['none','iron','oak','ember'].includes(String(result.relic)))result.relic='none';
 if(!['none','ward','fury','focus'].includes(String(result.courtBoon)))result.courtBoon='none';
 if(!input.wardenVersion&&result.quest===0)result.enemyHp=Math.round(Number(result.enemyHp)*220/70);
 result.level=Math.max(1,Number(result.level));result.wardenVersion=2;const position=nearestWalkable(mapForQuest(Number(result.quest)),Number(result.x),Number(result.y));Object.assign(result,position);result.a=Math.atan2(Math.sin(Number(result.a)),Math.cos(Number(result.a)));
 return result as T;
}

/** A short grid route is used only when a wall blocks the direct pursuit. */
export function pursuitPoint(map:readonly string[],x:number,y:number,tx:number,ty:number){
 if(clearSight(map,x,y,tx,ty))return{x:tx,y:ty};
 const from=[Math.floor(x),Math.floor(y)],goal=[Math.floor(tx),Math.floor(ty)],key=(a:number[])=>a.join(','),queue=[from],previous=new Map<string,number[]|null>([[key(from),null]]);let head=0;
 while(head<queue.length){const a=queue[head++];if(a[0]===goal[0]&&a[1]===goal[1])break;for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){const b=[a[0]+dx,a[1]+dy],k=key(b);if(map[b[1]]?.[b[0]]==='0'&&!previous.has(k)){previous.set(k,a);queue.push(b)}}}
 if(!previous.has(key(goal)))return{x,y};let next=goal;while(previous.get(key(next))&&key(previous.get(key(next))!)!==key(from))next=previous.get(key(next))!;return{x:next[0]+.5,y:next[1]+.5};
}

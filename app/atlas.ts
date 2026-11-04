import {DISCOVERIES} from './discoveries.ts';
import {mapForQuest} from './world-map.ts';
import {canOccupy} from './world-rules.ts';
export type MapPoint={x:number;y:number};
export type AtlasProfile=MapPoint&{a:number;quest:number;shrines:number;discoveryMask:number;lore:number;harvestMask?:number};
export type AtlasMarker=MapPoint&{id:string;label:string;symbol:string;done:boolean};
export function atlasMarkers(p:AtlasProfile):AtlasMarker[]{
 if(p.quest>=7)return [{id:'rest',x:10.5,y:8.8,label:'Ancrage du château',symbol:'✦',done:true}];
 return [
  ...[{x:7.5,y:14.5,name:'Borne du chemin'},{x:15.5,y:10.5,name:'Borne des pins'},{x:8.5,y:5.5,name:'Borne des ruines'}].map((s,i)=>({...s,id:`shrine-${i}`,label:s.name,symbol:'✦',done:Boolean(p.shrines&(1<<i))})),
  ...DISCOVERIES.map((s,i)=>({...s,id:s.id,label:p.discoveryMask&(1<<i)?s.name:s.hint,symbol:p.discoveryMask&(1<<i)?'◇':'?',done:Boolean(p.discoveryMask&(1<<i))})),
  {id:'gate',x:16.5,y:3.5,label:'Porte noire',symbol:'♜',done:p.quest>=6},
  {id:'home',x:3.5,y:16.5,label:'Chemin de Valbrume',symbol:'⌂',done:true}
 ];
}
/** Four-neighbour BFS uses cell centres so routes never cut through wall corners. */
export function atlasRoute(map:readonly string[],from:MapPoint,to:MapPoint):MapPoint[]{
 if(!canOccupy(map,to.x,to.y))return [];
 const start=[Math.floor(from.x),Math.floor(from.y)],goal=[Math.floor(to.x),Math.floor(to.y)],key=(p:number[])=>p.join(',');
 const queue=[start],parents=new Map<string,number[]|null>([[key(start),null]]);let head=0;
 while(head<queue.length){const p=queue[head++];if(key(p)===key(goal))break;for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){const next=[p[0]+dx,p[1]+dy],k=key(next);if(!parents.has(k)&&canOccupy(map,next[0]+.5,next[1]+.5)){parents.set(k,p);queue.push(next)}}}
 if(!parents.has(key(goal)))return [];
 const route:MapPoint[]=[{...to}];let p:number[]|null=goal;
 while(p){route.push({x:p[0]+.5,y:p[1]+.5});p=parents.get(key(p))??null}
 route.push({...from});return route.reverse();
}
export function routeFor(p:AtlasProfile,to:MapPoint|null){return to?atlasRoute(mapForQuest(p.quest),p,to):[]}

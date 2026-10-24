export const DISCOVERIES=[
 {id:'camp',x:3,y:17.6,name:'Le feu du dernier pèlerin',verb:'FOUILLER LE CAMP',icon:'♧',hint:'Un abri oublié près du départ.',text:'Une tasse attend encore près des braises. Son propriétaire avait laissé un remède pour celui qui viendrait après lui.',reward:'Une potion carmin · 4 or · 6 expérience',gold:4,potions:1,mana:0,xp:6},
 {id:'well',x:13.4,y:14.4,name:'Le puits aux lucioles',verb:'EXAMINER LE PUITS',icon:'◌',hint:'À l’est du chemin, une vieille corde descend sous les pierres.',text:'Dans le reflet de l’eau, le château semble intact. Une braise bleue remonte le long de la corde, puis se dissout dans votre paume.',reward:'+35 mana · 4 or · 6 expérience',gold:4,potions:0,mana:35,xp:6},
 {id:'memorial',x:13.4,y:7.4,name:'La bannière sans nom',verb:'HONORER LE MÉMORIAL',icon:'⚑',hint:'Une bannière rouge veille au bord des ruines.',text:'Le nom a été effacé, mais les mains d’acier tiennent toujours la garde. Quelqu’un a gravé : « Le serment survit à celui qui le porte. »',reward:'8 or · 10 expérience',gold:8,potions:0,mana:0,xp:10}
] as const;
export function nearestDiscovery(x:number,y:number){let index=-1,best=1.35;DISCOVERIES.forEach((d,i)=>{const distance=Math.hypot(d.x-x,d.y-y);if(distance<best){index=i;best=distance}});return index}
export function discoveryCount(mask:number){return (mask&1)+(mask>>1&1)+(mask>>2&1)}
export function compassBearing(angle:number){const index=((Math.round(angle/(Math.PI/4))%8)+8)%8;return ['E','SE','S','SO','O','NO','N','NE'][index]}

export const VALLEY_CAMPS=[
 {site:3,id:0,name:'Les pillards du verger',reward:6,foes:[{name:'pillards du verger · lame',x:3.5,y:9.1,hp:42,kind:'melee'},{name:'pillards du verger · archer',x:4.5,y:10.5,hp:32,kind:'ranged'}]},
 {site:4,id:1,name:'La veille des cendres',reward:8,foes:[{name:'veille des cendres · brute',x:16.5,y:5.5,hp:58,kind:'brute'},{name:'veille des cendres · archer',x:17.5,y:6.5,hp:36,kind:'ranged'}]},
 {site:5,id:2,name:'Le serment des exilés',reward:10,foes:[{name:'serment des exilés · lame',x:4.5,y:4.5,hp:44,kind:'melee'},{name:'serment des exilés · brute',x:5.5,y:6.5,hp:62,kind:'brute'},{name:'serment des exilés · archer',x:6.5,y:4.5,hp:32,kind:'ranged'}]}
] as const;
export function campForSite(site:number,mask:number){return VALLEY_CAMPS.find(c=>c.site===site&&!(mask&(1<<c.id)))}
export function campActors(id:number){return (VALLEY_CAMPS.find(c=>c.id===id)?.foes??[]).map(f=>({...f,alive:true,boss:false,hit:0,cooldown:1.5,telegraph:0}))}
export function campCleared(id:number,actors:readonly {name:string;alive:boolean}[]){const c=VALLEY_CAMPS.find(c=>c.id===id);return Boolean(c&&c.foes.every(f=>actors.some(a=>a.name===f.name&&!a.alive)))}

import type {Voxel} from './voxel-world';
import {routeDistance} from './world-art';
import {canOccupy} from './world-rules';
import {PLAINS_MAP} from './world-map';
export type UnderstoryPatch={x:number;y:number;parts:Voxel[]};
/** Small authored-style clusters, seeded once; paths and the guardian's arena stay clear. */
export const UNDERSTORY:UnderstoryPatch[]=[];
for(let i=0;i<240;i++){
 const x=1.2+(i*2.7182818)%17.6,y=1.2+(i*4.2360679)%17.6,d=routeDistance(x,y);
 if(d<.7||d>2.9||!canOccupy(PLAINS_MAP,x,y)||Math.hypot(x-10.5,y-8.5)<2.2)continue;
 const parts:Voxel[]=[],rock=i%5===0;
 for(let j=0;j<(rock?3:5);j++){
  const a=j*2.399+i,r=.035+j*.018,px=x+Math.cos(a)*r,py=y+Math.sin(a)*r;
  if(rock)parts.push({x:px,y:py,z:.002,sx:.1+j*.026,sy:.085+j*.021,sz:.035+j*.015,color:['#6b7767','#879080','#596b55'][j],shape:'faceted',taper:.5,yaw:a});
  else{parts.push({x:px,y:py,z:.006,sx:.075,sy:.018,sz:.025+(j%3)*.009,color:['#667d49','#87915b','#506a43','#9a995f','#718650'][j],shape:'crown',pitch:.35,yaw:a});if(i%7===0&&j<2)parts.push({x:px,y:py,z:.045,sx:.018,sy:.018,sz:.012,color:i%2?'#c7b9be':'#d5c78a',shape:'crown'})}
 }
 UNDERSTORY.push({x,y,parts});
}
export function visibleUnderstory(x:number,y:number,yaw:number,fov:number,detail:number){const limit=detail>=2?28:16,cos=Math.cos(yaw),sin=Math.sin(yaw),tan=Math.tan(fov*.6);return UNDERSTORY.map((p,i)=>({i,d:Math.hypot(p.x-x,p.y-y),forward:(p.x-x)*cos+(p.y-y)*sin,side:Math.abs(-(p.x-x)*sin+(p.y-y)*cos)})).filter(p=>p.d>.28&&p.d<5.5&&p.forward>0&&p.side<p.forward*tan+.15).sort((a,b)=>a.d-b.d).slice(0,limit)}

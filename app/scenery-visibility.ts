/** Deterministic, allocation-bounded scenery selection shared by mobile and desktop. */
export type SceneryProp={x:number;y:number;height:number};
export type SceneryCamera={x:number;y:number;yaw:number;fov:number};
export type SceneryChoice={i:number;d:number};
export function selectScenery(props:readonly SceneryProp[],camera:SceneryCamera,detail:number):SceneryChoice[]{
 const limit=detail>=3?54:detail>=2?34:18,maxDistance=detail>=2?24:14;
 const tall:SceneryChoice[]=[],small:SceneryChoice[]=[];
 const tallQuota=Math.max(6,Math.floor(limit*.67));
 const fx=Math.cos(camera.yaw),fy=Math.sin(camera.yaw);
 const halfFov=camera.fov*.76,tanLimit=Math.tan(halfFov);
 const maxSquared=maxDistance*maxDistance;
 const nearSquared=.3025;
 for(let i=0;i<props.length;i++){
  const p=props[i],dx=p.x-camera.x,dy=p.y-camera.y,d2=dx*dx+dy*dy;
  if(d2<=nearSquared||d2>=maxSquared)continue;
  const forward=dx*fx+dy*fy;
  // Large crowns remain visible even when the trunk is just beyond the screen edge.
  const radius=p.height>=1.65?Math.min(1.5,p.height*.19):Math.min(.35,p.height*.15);
  if(forward+radius<=0)continue;
  const lateral=Math.abs(-dx*fy+dy*fx);
  if(lateral>Math.max(0,forward)*tanLimit+radius)continue;
  const d=Math.sqrt(d2),group=p.height>=1.65?tall:small;
  const quota=limit;
  let index=group.length;
  while(index>0&&group[index-1].d>d)index--;
  if(index>=quota)continue;
  group.splice(index,0,{i,d});
  if(group.length>quota)group.pop();
 }
 // Give the first-person valley a strong woodland silhouette before filling gaps with ground cover.
 const reserved=Math.min(tall.length,tallQuota);
 const flowers=small.slice(0,limit-reserved);
 const remaining=limit-reserved-flowers.length;
 const selected=[...tall.slice(0,reserved),...flowers,...tall.slice(reserved,reserved+remaining)];
 // Keep painter-friendly nearest-first order for consistent animation and debugging.
 selected.sort((a,b)=>a.d-b.d||a.i-b.i);
 return selected;
}

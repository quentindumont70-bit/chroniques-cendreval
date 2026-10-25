/** Deterministic, allocation-bounded scenery selection shared by mobile and desktop. */
export type SceneryProp={x:number;y:number;height:number};
export type SceneryCamera={x:number;y:number;yaw:number;fov:number};
export type SceneryChoice={i:number;d:number};
export function selectScenery(props:readonly SceneryProp[],camera:SceneryCamera,detail:number):SceneryChoice[]{
 const limit=detail>=3?54:detail>=2?34:18,maxDistance=detail>=2?24:14;
 const tall:SceneryChoice[]=[],small:SceneryChoice[]=[];
 const tallQuota=Math.max(6,Math.floor(limit*.55));
 const fx=Math.cos(camera.yaw),fy=Math.sin(camera.yaw);
 const cosLimit=Math.cos(camera.fov*.76),cosSquared=cosLimit*cosLimit;
 const maxSquared=maxDistance*maxDistance;
 for(let i=0;i<props.length;i++){
  const p=props[i],dx=p.x-camera.x,dy=p.y-camera.y,d2=dx*dx+dy*dy;
  if(d2<=.3025||d2>=maxSquared)continue;
  const forward=dx*fx+dy*fy;
  if(forward<=0||forward*forward<=d2*cosSquared)continue;
  const d=Math.sqrt(d2),group=p.height>=1.65?tall:small;
  const quota=group===tall?tallQuota:limit;
  let index=group.length;
  while(index>0&&group[index-1].d>d)index--;
  if(index>=quota)continue;
  group.splice(index,0,{i,d});
  if(group.length>quota)group.pop();
 }
 const reserved=Math.min(tall.length,tallQuota);
 return [...tall.slice(0,reserved),...small.slice(0,limit-reserved)];
}

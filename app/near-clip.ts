export type CameraPoint={side:number;depth:number;z:number};
/** Clip a face to the camera near plane rather than dropping the whole face. */
export function clipNear(points:CameraPoint[],near=.081):CameraPoint[]{
 const result:CameraPoint[]=[];
 for(let i=0;i<points.length;i++){
  const a=points[i],b=points[(i+1)%points.length],insideA=a.depth>=near,insideB=b.depth>=near;
  if(insideA)result.push(a);
  if(insideA!==insideB){const t=(near-a.depth)/(b.depth-a.depth);result.push({depth:near,side:a.side+(b.side-a.side)*t,z:a.z+(b.z-a.z)*t})}
 }
 return result;
}

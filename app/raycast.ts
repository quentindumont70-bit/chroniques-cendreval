/** Grid traversal: exact wall intersections without hundreds of tiny steps per ray. */
export function castRay(map:readonly string[],x:number,y:number,angle:number,maxDistance=32){
 const dx=Math.cos(angle),dy=Math.sin(angle);let cx=Math.floor(x),cy=Math.floor(y);
 const stepX=dx<0?-1:1,stepY=dy<0?-1:1,deltaX=Math.abs(1/dx),deltaY=Math.abs(1/dy);
 let sideX=(dx<0?x-cx:cx+1-x)*deltaX,sideY=(dy<0?y-cy:cy+1-y)*deltaY,dist=0,side=0;
 for(let i=0;i<128;i++){
  if(sideX<sideY){dist=sideX;sideX+=deltaX;cx+=stepX;side=0}else{dist=sideY;sideY+=deltaY;cy+=stepY;side=1}
  if(dist>maxDistance)return {distance:maxDistance,hit:0,side};
  const hit=Number(map[cy]?.[cx]??1);if(hit)return {distance:Math.max(.02,dist),hit,side};
 }
 return {distance:maxDistance,hit:0,side};
}

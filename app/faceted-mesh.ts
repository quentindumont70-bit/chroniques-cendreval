export type MeshPart={x:number;y:number;z:number;sx:number;sy:number;sz:number;yaw?:number;pitch?:number;taper?:number;shape?:string};
/** Eight-sided, tapered sections. Rotated about their base for joint articulation. */
export function facetedMesh(p:MeshPart,segments=8){
 const crown=p.shape==='crown',rings=crown?3:2;
 const yaw=p.yaw??0,pitch=p.pitch??0,c=Math.cos(yaw),s=Math.sin(yaw),cp=Math.cos(pitch),sp=Math.sin(pitch);
 const vertices:Array<[number,number,number]>=[];
 for(let ring=0;ring<rings;ring++)for(let i=0;i<segments;i++){const a=(i+.5)*Math.PI*2/segments,k=crown?[.65,1,.22][ring]:ring?(p.taper??1):1,x=Math.cos(a)*p.sx*.5*k,y=Math.sin(a)*p.sy*.5*k,z=ring*p.sz/(rings-1),rx=x*cp+z*sp,rz=z*cp-x*sp;vertices.push([p.x+rx*c-y*s,p.y+rx*s+y*c,p.z+rz])}
 const faces:number[][]=[Array.from({length:segments},(_,i)=>(rings-1)*segments+i),Array.from({length:segments},(_,i)=>segments-1-i)];
 for(let ring=0;ring<rings-1;ring++)for(let i=0;i<segments;i++){const a=ring*segments;faces.push([a+i,a+(i+1)%segments,a+(i+1)%segments+segments,a+i+segments])}
 return {vertices,faces};
}

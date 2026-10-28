/** Fixed directional material response: no lights, textures or per-face allocations. */
export function materialLight(material:string|undefined,nx:number,ny:number,nz:number){
 const diffuse=Math.max(0,nz*.74-nx*.48+ny*.31);
 if(material==='metal')return .58+diffuse*.46+Math.pow(diffuse,12)*.2;
 if(material==='cloth')return .72+diffuse*.18;
 if(material==='wood')return .65+diffuse*.26;
 return .68+diffuse*.32;
}

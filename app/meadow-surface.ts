import {routeDistance,VALLEY_PROPS,LIVING_PROPS} from './world-art';
/** Static world-space pigments; no trigonometry, path search or noise generation in the frame loop. */
export const MEADOW_SIZE=512,MEADOW_ORIGIN=-2,MEADOW_SCALE=MEADOW_SIZE/24;
let surface:Uint8ClampedArray|undefined;
const smooth=(x:number)=>{const t=Math.max(0,Math.min(1,x));return t*t*(3-2*t)};
export function meadowSurface(){
 if(surface)return surface;
 const colors=new Uint8ClampedArray(MEADOW_SIZE*MEADOW_SIZE*3);
 const trees=[...VALLEY_PROPS,...LIVING_PROPS].filter(p=>p.height>=2.4);
 const shadows=new Float32Array(MEADOW_SIZE*MEADOW_SIZE);
 for(const tree of trees){const cx=(tree.x+.18-MEADOW_ORIGIN)*MEADOW_SCALE,cy=(tree.y+.12-MEADOW_ORIGIN)*MEADOW_SCALE,r=MEADOW_SCALE*.55;for(let iy=Math.max(0,Math.floor(cy-r));iy<Math.min(MEADOW_SIZE,cy+r);iy++)for(let ix=Math.max(0,Math.floor(cx-r));ix<Math.min(MEADOW_SIZE,cx+r);ix++){const d=Math.hypot(ix-cx,iy-cy)/r;if(d<1)shadows[iy*MEADOW_SIZE+ix]=Math.max(shadows[iy*MEADOW_SIZE+ix],(1-d)*.22)}}
 for(let iy=0;iy<MEADOW_SIZE;iy++)for(let ix=0;ix<MEADOW_SIZE;ix++){
  const x=ix/MEADOW_SCALE+MEADOW_ORIGIN,y=iy/MEADOW_SCALE+MEADOW_ORIGIN,d=routeDistance(x,y);
  const noise=((Math.imul(ix,374761393)^Math.imul(iy,668265263))>>>0)%31;
  const meadow=Math.sin(x*.71+y*.27)*Math.cos(y*.63-x*.19),dry=smooth((meadow+.12)*1.2);
  const edge=Math.sin(x*3.2+y*2.1)*Math.cos(y*3.7)*.07;
  const road=1-smooth((d-.32-edge)/.32),verge=1-smooth((d-.57-edge)/.44);
  const rut=1-smooth(Math.abs(d-.22)/.065),wear=Math.sin(x*1.3+y*.7)*3;
  const grit=(noise-15)*.45;
  let r=48+dry*26+grit,g=69+dry*17+grit,b=47+dry*5+grit*.5;
  r+=verge*9;g+=verge*5;b-=verge*3;
  r=r*(1-road)+(123+wear-rut*13+grit)*road;g=g*(1-road)+(108+wear-rut*12+grit)*road;b=b*(1-road)+(79+wear-rut*8+grit)*road;
  // Pale worn stones interrupt the soil close to the old sanctuary.
  const ruins=Math.hypot(x-10.5,y-8.5)<2.6&&d<.48;
  if(ruins){const joint=(x*5%1)<.09||(y*5+(Math.floor(x*5)%2)*.5)%1<.1;const mix=joint?.1:.48;r=r*(1-mix)+114*mix;g=g*(1-mix)+119*mix;b=b*(1-mix)+99*mix}
  const light=(.91+meadow*.07)*(1-shadows[iy*MEADOW_SIZE+ix]),k=(iy*MEADOW_SIZE+ix)*3;
  colors[k]=r*light;colors[k+1]=g*light;colors[k+2]=b*light;
 }
 surface=colors;return colors;
}

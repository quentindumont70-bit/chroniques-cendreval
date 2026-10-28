export type Joint=[number,number,number];
export type PoseInput={intent?:string;telegraph?:number;telegraphMax?:number;strike?:number;kind:string;boss:boolean};
/** Authored attack poses in model space. Timings remain owned by combat simulation. */
export function actorPose(a:PoseInput,time:number,moving:number){
 const wind=a.telegraph?Math.max(0,Math.min(1,1-a.telegraph/(a.telegraphMax??.8))):0;
 const cut=a.strike?Math.sin(Math.min(1,Math.max(0,1-a.strike/.4))*Math.PI):0;
 const heavy=a.intent==='crush'||a.intent==='slam',thrust=a.intent==='lunge',bow=a.kind==='ranged'&&!a.boss;
 const lean=heavy?-wind*.06+cut*.14:thrust?-wind*.1+cut*.28:-wind*.04+cut*.1;
 const hands:Joint[]=([-1,1] as const).map(side=>{
 if(bow)return side===1?[.38,.26,.98]:[.12-wind*.3+cut*.16,-.12,.98];
 if(heavy)return [.1-wind*.18+cut*.42,side*.2,.66+wind*.68-cut*.21];
 if(thrust)return [.12-wind*.2+cut*.6,side*.22,.79];
 return [.12+cut*.25,side*(.3+wind*.18)-cut*.4,.63+wind*.25];
 });
 const stride=Math.sin(time*.008)*(1-wind)*Math.min(1,moving)*.18;
 const feet:Joint[]=([-1,1] as const).map(side=>[-side*stride,side*.16,.045+Math.max(0,Math.cos(time*.008)*side)*moving*.065]);
 return {hands,feet,lean,wind,cut};
}

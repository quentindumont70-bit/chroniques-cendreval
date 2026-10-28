export type Joint=[number,number,number];
export type PoseInput={intent?:string;telegraph?:number;telegraphMax?:number;strike?:number;kind:string;boss:boolean};
/** Authored attack poses in model space. Timings remain owned by combat simulation. */
export function actorPose(a:PoseInput,time:number,moving:number){
 const wind=a.telegraph?Math.max(0,Math.min(1,1-a.telegraph/(a.telegraphMax??.8))):0;
 const duration=a.intent==='slam'?.38:a.intent==='crush'?.32:a.intent==='lunge'?.27:a.intent==='shot'?.24:.22;
 const phase=a.strike?Math.max(0,Math.min(1,1-a.strike/duration)):0;
 // Accelerate into contact, then deliberately return to guard.
 const cut=phase<.42?Math.sin(phase/.42*Math.PI*.5):Math.cos((phase-.42)/.58*Math.PI*.5);
 const active=a.strike?cut:0;
 const heavy=a.intent==='crush'||a.intent==='slam',thrust=a.intent==='lunge',bow=a.kind==='ranged'&&!a.boss;
 const lean=heavy?-wind*.06+active*.14:thrust?-wind*.1+active*.28:-wind*.04+active*.1;
 const hands:Joint[]=([-1,1] as const).map(side=>{
 if(bow)return side===1?[.38,.26,.98]:[.12-wind*.3+active*.16,-.12,.98];
 if(heavy)return [.1-wind*.18+active*.42,side*.2,.66+wind*.68-active*.21];
 if(thrust)return [.12-wind*.2+active*.6,side*.22,.79];
 return [.12+active*.25,side*(.3+wind*.18)-active*.4,.63+wind*.25];
 });
 const stride=Math.sin(time*.008)*(1-wind)*Math.min(1,moving)*.18;
 const feet:Joint[]=([-1,1] as const).map(side=>[-side*stride,side*.16,.045+Math.max(0,Math.cos(time*.008)*side)*moving*.065]);
 return {hands,feet,lean,wind,cut:active};
}

export type AttackTiming={telegraph:number;telegraphMax?:number;strike?:number;impactDone?:boolean;intent?:string};
export function impactDelay(intent?:string){return intent==='slam'?.23:intent==='crush'?.19:intent==='lunge'?.17:intent==='shot'?.16:.13}
export function remainingToImpact(foe:AttackTiming){if(foe.impactDone)return Infinity;if(foe.telegraph>0)return foe.telegraph+impactDelay(foe.intent);const threshold=foe.intent==='slam'?.15:foe.intent==='crush'?.13:foe.intent==='lunge'?.1:foe.intent==='shot'?.08:.09;return (foe.strike??0)>0?Math.max(0,(foe.strike??0)-threshold):Infinity}
export function drawParryCue(ctx:CanvasRenderingContext2D,foe:AttackTiming,x:number,y:number,touch:boolean){
 const remaining=remainingToImpact(foe);if(!Number.isFinite(remaining)||remaining>.85)return;
 // Start the gesture on the amber closure; its hold threshold is included in the lead.
 const lead=touch?.23:.09,ready=remaining<=lead+.04&&remaining>Math.max(0,lead-.11),dodgeOnly=foe.intent==='slam';
 const progress=Math.max(0,1-remaining/.85),radius=18+(1-progress)*17;
 ctx.save();ctx.translate(Math.round(x),Math.round(y));ctx.strokeStyle='rgba(12,22,25,.85)';ctx.lineWidth=4;ctx.beginPath();ctx.arc(0,0,18,0,Math.PI*2);ctx.stroke();ctx.lineWidth=1;ctx.strokeStyle=dodgeOnly?'#dc826e':ready?'#f3d89b':'#9eafa6';ctx.globalAlpha=ready?.95:.65;
 ctx.beginPath();ctx.arc(0,0,18,-Math.PI/2,-Math.PI/2+Math.PI*2*progress);ctx.stroke();ctx.beginPath();ctx.arc(0,0,radius,Math.PI*.12,Math.PI*.88);ctx.stroke();ctx.beginPath();ctx.arc(0,0,radius,Math.PI*1.12,Math.PI*1.88);ctx.stroke();
 if(ready){ctx.fillStyle=dodgeOnly?'#dc826e':'#f3d89b';for(const sign of [-1,1]){ctx.beginPath();ctx.moveTo(sign*23,-3);ctx.lineTo(sign*19,0);ctx.lineTo(sign*23,3);ctx.fill()}}
 if(dodgeOnly){ctx.beginPath();ctx.moveTo(-4,-4);ctx.lineTo(4,4);ctx.moveTo(4,-4);ctx.lineTo(-4,4);ctx.stroke()}
 ctx.restore();
}

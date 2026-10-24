export type RenderQuality='auto'|'classic'|'hd'|'ultra';
export type RenderSize={width:number;height:number;detail:number};
export function resolveRenderSize(quality:RenderQuality,cssWidth:number,pixelRatio:number):RenderSize{
 if(quality==='ultra')return{width:3840,height:2160,detail:3};
 if(quality==='hd')return{width:1920,height:1080,detail:2};
 if(quality==='classic')return{width:426,height:240,detail:1};
 const scale=Math.max(2,Math.min(4,Math.round(cssWidth*Math.min(2,Math.max(1,pixelRatio))/426)));
 return{width:426*scale,height:240*scale,detail:scale>=3?2:1};
}
export function lighterRenderSize(current:RenderSize):RenderSize{const scale=Math.max(1,Math.round(current.width/426)-1);return{width:426*scale,height:240*scale,detail:scale>=3?2:1}}

export function missesFrameBudget(meanMs:number,target:number){return meanMs>1000/Math.max(30,Math.min(240,target))*1.18}
export function measuredFps(frames:number,elapsedMs:number){return elapsedMs>0?Math.max(0,Math.round(frames*1000/elapsedMs)):0}

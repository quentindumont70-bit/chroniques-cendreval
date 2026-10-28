export type RenderQuality='auto'|'classic'|'hd'|'ultra';
export type RenderSize={width:number;height:number;detail:number};
export function resolveRenderSize(quality:RenderQuality,cssWidth:number,pixelRatio:number):RenderSize{
 if(quality==='ultra')return{width:3840,height:2160,detail:2};
 if(quality==='hd')return{width:1920,height:1080,detail:2};
 if(quality==='classic')return{width:426,height:240,detail:1};
 const scale=Math.max(2,Math.min(4,Math.round(cssWidth*Math.min(1.5,Math.max(1,pixelRatio))/426)));
 return{width:426*scale,height:240*scale,detail:scale>=3?2:1};
}
export function lighterRenderSize(current:RenderSize):RenderSize{
 const widths=[1920,1704,1278,852,426],width=widths.find(w=>w<current.width)??426;
 return{width,height:Math.round(width*9/16),detail:width>=1278?2:1};
}

export function missesFrameBudget(meanMs:number,target:number){return meanMs>1000/Math.max(30,Math.min(240,target))*1.18}
export function measuredFps(frames:number,elapsedMs:number){return elapsedMs>0?Math.max(0,Math.round(frames*1000/elapsedMs)):0}

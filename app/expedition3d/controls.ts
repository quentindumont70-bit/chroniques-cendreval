/** Pointer ownership is per finger; losing one contact must never cancel the other. */
export type Contact={side:'move'|'look';x:number;y:number;lastX:number;lastY:number;time:number;travel:number};
export function touchSide(x:number,left:number,width:number){return x-left<width*.45?'move':'look'}
export function isGameSurface(target:EventTarget|null){return !(target instanceof Element&&target.closest('button,a,input,select,textarea,[role="dialog"],.expedition-title'))}
export type Preferences={sensitivity:number;invertY:boolean;gestures:boolean;motion:boolean;autoQuality:boolean;quality:string};
export const DEFAULT_PREFERENCES:Preferences={sensitivity:1,invertY:false,gestures:true,motion:true,autoQuality:true,quality:'Équilibré'};
export const SETTINGS_KEY='outbinched-controls-v1';
export function decodePreferences(raw:string|null):Preferences{try{const v=JSON.parse(raw||'{}');return{...DEFAULT_PREFERENCES,sensitivity:typeof v.sensitivity==='number'&&Number.isFinite(v.sensitivity)?Math.max(.35,Math.min(2.5,v.sensitivity)):1,...Object.fromEntries(['invertY','gestures','motion','autoQuality'].filter(k=>typeof v[k]==='boolean').map(k=>[k,v[k]])),quality:['Fluide','Équilibré','Détaillé'].includes(v.quality)?v.quality:'Équilibré'}}catch{return{...DEFAULT_PREFERENCES}}}
export function pixelRatio(width:number,height:number,dpr:number,scale:number){return Math.min(Math.min(dpr,1.5)*scale,Math.sqrt(2073600/Math.max(1,width*height)))}
export function cancelContact(contacts:Map<number,Contact>,id:number){const contact=contacts.get(id);contacts.delete(id);return contact?.side}

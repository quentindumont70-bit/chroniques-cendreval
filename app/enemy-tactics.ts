export function tacticalMotion(kind:string,x:number,y:number,px:number,py:number,visible:boolean,ready:boolean,dt:number){const dx=px-x,dy=py-y,d=Math.hypot(dx,dy);if(!ready||!visible||d<.01||d>6)return{x:0,y:0};const side=Math.sin(x*17+y*7)>=0?1:-1;
 if(kind==='ranged'&&d<2.6)return{x:-dx/d*dt*.75,y:-dy/d*dt*.75};
 if(kind==='ranged'&&d>=2.6&&d<4.5)return{x:-dy/d*side*dt*.25,y:dx/d*side*dt*.25};
 if(kind==='melee'&&d>1.2&&d<3)return{x:-dy/d*side*dt*.22,y:dx/d*side*dt*.22};return{x:0,y:0}}
export function shotMisses(aimX:number|undefined,aimY:number|undefined,x:number,y:number){return aimX!==undefined&&aimY!==undefined&&Math.hypot(x-aimX,y-aimY)>.65}
export function attackSlotAvailable(active:number,boss:boolean){return boss||active<2}

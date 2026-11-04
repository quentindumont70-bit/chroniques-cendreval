import {clearSight} from './world-rules.ts';
export type EffectKind='blade'|'arrow'|'arcane'|'hex'|'cantor'|'reaver';
type Point={x:number;y:number};
export type CombatEffect={from:Point;to:Point;kind:EffectKind;hit:boolean;age:number;life:number;value:number;critical:boolean};
export const EFFECT_COLORS:Record<EffectKind,string>={blade:'#ffe3a3',arrow:'#bce7a2',arcane:'#ffac61',hex:'#ce93ff',cantor:'#92edeb',reaver:'#ff7185'};
/** Cosmetic only: damage remains synchronous with the existing combat rules. */
export function emitEffect(pool:CombatEffect[],from:Point,to:Point,kind:EffectKind,hit:boolean,value=0,critical=false){
 pool.push({from:{...from},to:{...to},kind,hit,age:0,life:hit?.62:.3,value,critical});
 if(pool.length>32)pool.splice(0,pool.length-32);
}
export function tickEffects(pool:CombatEffect[],dt:number){for(let i=pool.length-1;i>=0;i--){pool[i].age+=dt;if(pool[i].age>=pool[i].life)pool.splice(i,1)}}
export function projectEffect(p:Point,camera:Point&{a:number},width:number,height:number){
 const dx=p.x-camera.x,dy=p.y-camera.y,depth=dx*Math.cos(camera.a)+dy*Math.sin(camera.a);
 if(depth<.15)return null;
 return {x:width/2+(-dx*Math.sin(camera.a)+dy*Math.cos(camera.a))*width/(2*Math.tan(Math.PI/6))/depth,y:height/2+height*.035/depth,depth};
}
export function drawCombatEffects(ctx:CanvasRenderingContext2D,pool:CombatEffect[],camera:Point&{a:number},map:readonly string[],width:number,height:number){
 for(const fx of pool){
  const p=projectEffect(fx.to,camera,width,height);if(!p||p.x<0||p.x>width||!clearSight(map,camera.x,camera.y,fx.to.x,fx.to.y))continue;
  const progress=fx.age/fx.life,scale=Math.min(1.5,2.5/p.depth),color=EFFECT_COLORS[fx.kind];
  ctx.save();ctx.strokeStyle=color;ctx.fillStyle=color;ctx.globalAlpha=Math.min(1,(1-progress)*2);ctx.lineWidth=fx.critical?2:1.3;
  if(fx.age<.14&&fx.kind!=='blade'&&fx.kind!=='reaver'){
   // A short tracer links the view weapon to its actual world impact, including off-centre locks.
   const k=Math.min(1,fx.age/.14),sx=width*.68,sy=height*.78;
   ctx.beginPath();ctx.moveTo(sx+(p.x-sx)*Math.max(0,k-.25),sy+(p.y-sy)*Math.max(0,k-.25));ctx.lineTo(sx+(p.x-sx)*k,sy+(p.y-sy)*k);ctx.stroke();
  }
  if(fx.hit){
   const radius=(5+progress*22)*scale;
   ctx.beginPath();if(fx.kind==='blade'||fx.kind==='reaver'){ctx.moveTo(p.x-radius,p.y+radius*.6);ctx.lineTo(p.x+radius,p.y-radius*.6)}else ctx.arc(p.x,p.y,radius,0,Math.PI*2);ctx.stroke();
   const count=fx.critical?12:7;
   for(let i=0;i<count;i++){const angle=i*Math.PI*2/count+progress,spread=radius*(.5+i%3*.3);ctx.fillRect(p.x+Math.cos(angle)*spread,p.y+Math.sin(angle)*spread,scale*1.7,scale*1.7)}
   if(fx.value>0){ctx.font=`bold ${fx.critical?10:8}px sans-serif`;ctx.textAlign='center';ctx.fillStyle='#100e15';ctx.fillText(String(fx.value),p.x+1,p.y-13-progress*20+1);ctx.fillStyle=fx.critical?'#fff0ae':color;ctx.fillText(String(fx.value),p.x,p.y-13-progress*20)}
  }
  ctx.restore();
 }
}

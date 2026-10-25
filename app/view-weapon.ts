import type {ClassId} from './rpg';

type WeaponOptions={id:ClassId;spec:'blade'|'bow'|'arcane';time:number;attackPhase:number;swing:number;guarding:boolean;x:number;y:number;shake:number;bob:number;sway:number;color:string};
function tint(hex:string,factor:number){const raw=hex.replace('#',''),r=parseInt(raw.slice(0,2),16),g=parseInt(raw.slice(2,4),16),b=parseInt(raw.slice(4,6),16);return `rgb(${Math.min(255,Math.round(r*factor))},${Math.min(255,Math.round(g*factor))},${Math.min(255,Math.round(b*factor))})`}
/** A camera-space cuboid: front, top and side are all independently lit. */
function prism(ctx:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,depth:number,color:string,angle=0,glow=false){ctx.save();ctx.translate(x,y);ctx.rotate(angle);const d=Math.max(1,depth);ctx.fillStyle=tint(color,.62);ctx.beginPath();ctx.moveTo(w/2,-h/2);ctx.lineTo(w/2+d,-h/2-d);ctx.lineTo(w/2+d,h/2-d);ctx.lineTo(w/2,h/2);ctx.closePath();ctx.fill();ctx.fillStyle=tint(color,1.18);ctx.beginPath();ctx.moveTo(-w/2,-h/2);ctx.lineTo(-w/2+d,-h/2-d);ctx.lineTo(w/2+d,-h/2-d);ctx.lineTo(w/2,-h/2);ctx.closePath();ctx.fill();ctx.fillStyle=color;if(glow){ctx.shadowColor=color;ctx.shadowBlur=8}ctx.fillRect(-w/2,-h/2,w,h);ctx.strokeStyle=glow?tint(color,1.35):'rgba(15,20,24,.5)';ctx.lineWidth=1;ctx.strokeRect(-w/2,-h/2,w,h);ctx.restore()}
function blade(ctx:CanvasRenderingContext2D,id:ClassId,color:string){prism(ctx,-6,7,31,11,4,'#43312c');prism(ctx,11,7,20,5,3,'#b18b51');prism(ctx,22,7,8,28,4,id==='reaver'?'#743341':'#665346');prism(ctx,58,7,73,10,5,id==='reaver'?'#a95162':'#728996',0,id==='reaver');ctx.fillStyle=id==='reaver'?'#ed8c9a':'#d9e4df';ctx.beginPath();ctx.moveTo(94,0);ctx.lineTo(111,7);ctx.lineTo(94,14);ctx.lineTo(94,10);ctx.lineTo(54,10);ctx.lineTo(54,6);ctx.lineTo(94,4);ctx.closePath();ctx.fill();ctx.fillStyle='rgba(255,255,230,.55)';ctx.fillRect(30,3,66,2)}
function bow(ctx:CanvasRenderingContext2D,color:string){for(let i=-2;i<=2;i++){const a=i*.28,px=18+Math.abs(i)*8,py=i*18;prism(ctx,px,py,8,31,3,i===0?'#775033':'#93653d',a)}ctx.strokeStyle='#e2d6ac';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(38,-47);ctx.lineTo(59,0);ctx.lineTo(38,47);ctx.stroke();prism(ctx,63,0,78,3,2,color,0,true);ctx.fillStyle=tint(color,1.3);ctx.beginPath();ctx.moveTo(104,-5);ctx.lineTo(116,0);ctx.lineTo(104,5);ctx.fill()}
function focus(ctx:CanvasRenderingContext2D,id:ClassId,color:string,time:number){prism(ctx,11,5,72,9,5,id==='reaver'?'#51333a':'#3c3544');prism(ctx,46,5,16,16,5,'#736174');ctx.save();ctx.translate(91,5);ctx.rotate(time*.0006);if(id==='cantor'){for(const side of [-1,1])prism(ctx,side*8,0,5,35,3,color,side*.08,true);prism(ctx,0,15,20,5,3,color,0,true)}else if(id==='hex'){for(let i=0;i<5;i++){const a=i*Math.PI*2/5;prism(ctx,Math.cos(a)*13,Math.sin(a)*13,7,7,3,color,a,true)}}else{for(let i=0;i<3;i++)prism(ctx,0,(i-1)*8,14-i*3,12,4,i===1?'#fff0fa':color,i*.35,true)}ctx.restore()}

export function drawViewWeapon(ctx:CanvasRenderingContext2D,options:WeaponOptions){const o=options;ctx.save();ctx.translate(o.x+o.swing+o.shake+o.sway,o.y-o.swing*.6+o.shake*.35+o.bob);if(o.spec==='bow'){ctx.rotate(-.18+o.swing*.004);bow(ctx,o.color)}else if(o.spec==='arcane'){ctx.rotate(-.42+o.swing*.005);focus(ctx,o.id,o.color,o.time)}else{ctx.rotate(o.guarding?-1.22+o.swing*.008:-.62+o.swing*.012);blade(ctx,o.id,o.color)}// A readable three-beat slash: anticipation, cutting arc, then follow-through.
 // The slash is drawn in camera space so it remains visible on small screens.
 if(o.spec==='blade'&&!o.guarding&&Math.abs(o.swing)>2){
   const energy=Math.min(1,Math.abs(o.swing)/65);
   const direction=o.swing>=0?1:-1;
   ctx.save();
   ctx.globalCompositeOperation='screen';
   ctx.translate(o.x+o.swing*.24,o.y-30+o.bob);
   ctx.scale(direction,1);
   ctx.strokeStyle=`rgba(255,242,194,${(.18+energy*.62).toFixed(3)})`;
   ctx.lineWidth=2+energy*8;
   ctx.lineCap='round';
   ctx.beginPath();ctx.arc(0,0,65+energy*23,-1.18,.36);ctx.stroke();
   ctx.strokeStyle=`rgba(154,210,241,${(.12+energy*.4).toFixed(3)})`;
   ctx.lineWidth=1+energy*3;
   ctx.beginPath();ctx.arc(0,0,77+energy*23,-1.12,.22);ctx.stroke();
   ctx.restore();
 }
 ctx.restore()}

export function drawViewGuard(ctx:CanvasRenderingContext2D,progress:number,perfect:boolean,impact:number){ctx.save();ctx.translate(426*(.28+.08*progress)-impact*9,240*(.86-.26*progress)+impact*5);ctx.rotate(.18-.34*progress);const color=perfect?'#8b7439':'#344457',edge=perfect?'#ffe69b':'#a7c3df';prism(ctx,0,0,55,70,9,color,-.04,perfect);prism(ctx,0,0,8,65,5,edge,0,perfect);prism(ctx,0,0,49,6,4,edge,0,perfect);for(const x of [-21,21])prism(ctx,x,0,5,54,3,tint(color,.72));ctx.restore()}

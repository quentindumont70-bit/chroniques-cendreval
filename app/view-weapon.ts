import type {ClassId} from './rpg';

type WeaponOptions={id:ClassId;spec:'blade'|'bow'|'arcane';time:number;attackPhase:number;swing:number;guarding:boolean;x:number;y:number;shake:number;bob:number;sway:number;color:string};
function tint(hex:string,factor:number){const raw=hex.replace('#',''),r=parseInt(raw.slice(0,2),16),g=parseInt(raw.slice(2,4),16),b=parseInt(raw.slice(4,6),16);return `rgb(${Math.min(255,Math.round(r*factor))},${Math.min(255,Math.round(g*factor))},${Math.min(255,Math.round(b*factor))})`}
/** A camera-space cuboid: front, top and side are all independently lit. */
function prism(ctx:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,depth:number,color:string,angle=0,glow=false){ctx.save();ctx.translate(x,y);ctx.rotate(angle);const d=Math.max(1,depth);ctx.fillStyle=tint(color,.62);ctx.beginPath();ctx.moveTo(w/2,-h/2);ctx.lineTo(w/2+d,-h/2-d);ctx.lineTo(w/2+d,h/2-d);ctx.lineTo(w/2,h/2);ctx.closePath();ctx.fill();ctx.fillStyle=tint(color,1.18);ctx.beginPath();ctx.moveTo(-w/2,-h/2);ctx.lineTo(-w/2+d,-h/2-d);ctx.lineTo(w/2+d,-h/2-d);ctx.lineTo(w/2,-h/2);ctx.closePath();ctx.fill();ctx.fillStyle=color;if(glow){ctx.shadowColor=color;ctx.shadowBlur=8}ctx.fillRect(-w/2,-h/2,w,h);ctx.strokeStyle=glow?tint(color,1.35):'rgba(15,20,24,.5)';ctx.lineWidth=1;ctx.strokeRect(-w/2,-h/2,w,h);ctx.restore()}
function polygon(ctx:CanvasRenderingContext2D,points:number[][],color:string){ctx.fillStyle=color;ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fill()}
function blade(ctx:CanvasRenderingContext2D,id:ClassId,color:string){
 const blood=id==='reaver',dark=blood?'#6f3545':'#4c626e',light=blood?'#d58a98':'#d4dfda';
 // A forged silhouette with a central ridge, fuller and tapered point.
 polygon(ctx,[[21,1],[86,-1],[113,7],[87,15],[21,13]],dark);
 polygon(ctx,[[22,1],[86,-1],[113,7],[26,7]],light);
 polygon(ctx,[[26,7],[113,7],[87,15],[22,13]],blood?'#9e5063':'#819799');
 polygon(ctx,[[31,6],[86,4],[99,7],[85,9],[31,9]],blood?'#633445':'#526b73');
 ctx.strokeStyle='#f0e8c8';ctx.lineWidth=.8;ctx.beginPath();ctx.moveTo(28,2);ctx.lineTo(86,1);ctx.lineTo(111,7);ctx.stroke();
 polygon(ctx,[[15,-3],[23,-7],[28,-3],[24,5],[26,17],[22,22],[17,18],[19,9]],'#aa8a59');
 prism(ctx,0,7,32,8,3,'#453a32');for(let band=0;band<6;band++){ctx.strokeStyle=band%2?'#8b7352':'#2c2927';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-14+band*5,3);ctx.lineTo(-11+band*5,11);ctx.stroke()}
 polygon(ctx,[[-18,1],[-24,4],[-24,10],[-18,14],[-13,10],[-13,4]],'#a38b65');
 // Visible gauntlet wraps the grip rather than a floating weapon.
 polygon(ctx,[[-8,9],[4,10],[10,17],[6,24],[-6,25],[-14,18]],'#59646b');
 for(let finger=0;finger<3;finger++)prism(ctx,-6+finger*5,14+finger,4,9,2,'#89938d',-.2);
}
function bow(ctx:CanvasRenderingContext2D,color:string,phase=0){ctx.save();const draw=44+Math.sin(Math.max(0,Math.min(1,phase))*Math.PI)*14;
 // Recurved laminated limbs, carved grip, taut bowstring and feathered arrow.
 const limb=(side:number)=>{ctx.save();ctx.scale(1,side);ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();ctx.moveTo(25,0);ctx.bezierCurveTo(4,12,6,28,19,43);ctx.bezierCurveTo(27,53,23,62,15,68);ctx.strokeStyle='#35271f';ctx.lineWidth=13;ctx.stroke();ctx.strokeStyle='#a87a4a';ctx.lineWidth=8;ctx.stroke();ctx.strokeStyle='#d6a46b';ctx.lineWidth=2;ctx.stroke();ctx.strokeStyle='#514539';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(16,62);ctx.lineTo(13,70);ctx.stroke();ctx.restore()};limb(-1);limb(1);
 prism(ctx,24,0,16,26,5,'#6c4630',-.1);for(let y=-9;y<=9;y+=6)prism(ctx,24,y,17,2,1,'#c3a16a',-.1);
 ctx.strokeStyle='#f4e2bb';ctx.lineWidth=1.6;ctx.beginPath();ctx.moveTo(13,-70);ctx.lineTo(draw,0);ctx.lineTo(13,70);ctx.stroke();
 ctx.strokeStyle='#fff0ca';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(44,-5);ctx.lineTo(44,5);ctx.stroke();
 // The projectile is nocked against the string and catches light.
 prism(ctx,64,0,83,3,2,'#b6a17a');ctx.strokeStyle=color;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(34,0);ctx.lineTo(107,0);ctx.stroke();
 ctx.fillStyle='#e8e3d0';ctx.beginPath();ctx.moveTo(102,-5);ctx.lineTo(116,0);ctx.lineTo(102,5);ctx.closePath();ctx.fill();
 for(const side of [-1,1]){ctx.fillStyle=side===1?'#88a6a1':'#e7d5aa';ctx.beginPath();ctx.moveTo(36,0);ctx.lineTo(25,side*7);ctx.lineTo(42,side*3);ctx.closePath();ctx.fill()}ctx.restore()}
function focus(ctx:CanvasRenderingContext2D,id:ClassId,color:string,time:number){prism(ctx,11,5,72,9,5,id==='reaver'?'#51333a':'#3c3544');for(let band=0;band<5;band++)prism(ctx,-12+band*9,5,3,11,2,band%2?'#b79862':'#66513c');prism(ctx,46,5,16,16,5,'#736174');prism(ctx,54,5,5,20,3,'#baa270');for(const side of [-1,1]){prism(ctx,68,5+side*10,25,4,3,'#8b795c',side*.42);prism(ctx,79,5+side*16,12,3,2,'#c8b789',-side*.5)}ctx.save();ctx.translate(91,5);ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(0,-19);ctx.lineTo(8,0);ctx.lineTo(0,20);ctx.lineTo(-7,0);ctx.closePath();ctx.fill();ctx.fillStyle='#e7ede3';ctx.beginPath();ctx.moveTo(0,-19);ctx.lineTo(2,0);ctx.lineTo(0,20);ctx.lineTo(-4,0);ctx.closePath();ctx.fill();ctx.restore();ctx.save();ctx.translate(91,5);ctx.rotate(Math.sin(time*.001)*.18);if(id==='cantor'){for(const side of [-1,1])prism(ctx,side*8,0,5,35,3,color,side*.08,true);prism(ctx,0,15,20,5,3,color,0,true)}else if(id==='hex'){for(let i=0;i<5;i++){const a=i*Math.PI*2/5;prism(ctx,Math.cos(a)*13,Math.sin(a)*13,7,7,3,color,a,true)}}else{polygon(ctx,[[0,-20],[9,-5],[6,12],[0,21],[-7,9],[-9,-7]],color);polygon(ctx,[[0,-20],[2,-3],[0,21],[-5,4]],'#e8e7e4');ctx.strokeStyle=color;ctx.lineWidth=1;for(let i=0;i<3;i++){const a=time*.0007+i*Math.PI*2/3;ctx.beginPath();ctx.arc(0,0,23,a,a+.35);ctx.stroke()}}ctx.restore()}

export function drawViewWeapon(ctx:CanvasRenderingContext2D,options:WeaponOptions){const o=options;ctx.save();ctx.translate(o.x+o.swing+o.shake+o.sway,o.y-o.swing*.6+o.shake*.35+o.bob);if(o.spec==='bow'){ctx.rotate(-.18+o.swing*.004);bow(ctx,o.color,o.attackPhase)}else if(o.spec==='arcane'){ctx.rotate(-.42+o.swing*.005);focus(ctx,o.id,o.color,o.time)}else{ctx.rotate(o.guarding?-1.22+o.swing*.008:-.62+o.swing*.012);blade(ctx,o.id,o.color)}ctx.restore();// A readable three-beat slash: anticipation, cutting arc, then follow-through.
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
 }

export function drawViewGuard(ctx:CanvasRenderingContext2D,progress:number,perfect:boolean,impact:number){
 ctx.save();ctx.translate(426*(.28+.08*progress)-impact*9,240*(.86-.26*progress)+impact*5);ctx.rotate(.18-.34*progress);
 const rim=perfect?'#ddc989':'#9eafa9';
 polygon(ctx,[[-26,-35],[0,-41],[26,-35],[24,12],[0,43],[-24,12]],rim);
 polygon(ctx,[[-22,-31],[0,-36],[22,-31],[20,10],[0,36],[-20,10]],'#304651');
 polygon(ctx,[[0,-35],[20,-30],[18,9],[0,34]],'#213440');
 polygon(ctx,[[-3,-29],[3,-29],[4,25],[0,31],[-4,25]],rim);
 polygon(ctx,[[-17,-8],[17,-8],[16,-3],[-16,-3]],rim);
 for(const x of [-17,17])for(const y of [-25,1]){ctx.fillStyle='#d5c49a';ctx.beginPath();ctx.arc(x,y,1.6,0,Math.PI*2);ctx.fill()}
 if(impact>0){ctx.globalAlpha=Math.min(.75,impact);ctx.strokeStyle=perfect?'#fff0b5':'#accddd';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,-7,10+impact*14,0,Math.PI*2);ctx.stroke()}
 ctx.restore();
}

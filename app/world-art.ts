type Prop={x:number;y:number;frame:number;height:number;living?:boolean};
// Authored landmarks: pilgrim approach, birch grove, old graves and the Warden's court.
export const VALLEY_PROPS:Prop[]=[
 {x:2.1,y:17.8,frame:0,height:3.2},{x:5.8,y:18.3,frame:1,height:3.0},
 {x:2.0,y:14.1,frame:0,height:3.0},{x:3.0,y:12.0,frame:0,height:2.8},
 {x:5.2,y:15.3,frame:4,height:.9},{x:4.5,y:14.7,frame:5,height:1.4},
 {x:6.5,y:13.3,frame:1,height:2.6},{x:8.8,y:15.6,frame:2,height:.8},
 {x:7.0,y:15.6,frame:6,height:.4},{x:6.6,y:14.7,frame:7,height:.85},
 {x:8.6,y:13.1,frame:3,height:2.5},{x:7.7,y:12.4,frame:5,height:1.3},
 {x:9.0,y:11.9,frame:7,height:.85},{x:12.1,y:11.7,frame:7,height:.75},
 {x:12.5,y:14.6,frame:1,height:3.1},{x:13.5,y:16.5,frame:1,height:3.2},
 {x:15.1,y:17.2,frame:0,height:3.3},{x:17.5,y:15.0,frame:0,height:3.4},
 {x:17.7,y:12.8,frame:0,height:2.8},{x:14.0,y:12.0,frame:2,height:.9},
 {x:16.4,y:11.5,frame:5,height:1.5},{x:16.9,y:9.8,frame:0,height:3.0},
 {x:14.1,y:9.3,frame:1,height:3.0},{x:13.8,y:7.5,frame:2,height:1.1},
 {x:5.3,y:9.7,frame:3,height:2.4},{x:4.0,y:8.1,frame:1,height:3.0},
 {x:5.0,y:6.8,frame:0,height:3.5},{x:6.7,y:4.7,frame:0,height:3.2},
 {x:7.3,y:6.1,frame:7,height:1.0},{x:9.3,y:4.4,frame:5,height:1.3},
 {x:11.3,y:4.1,frame:2,height:.8},{x:12.7,y:3.3,frame:0,height:3.1},
 {x:14.5,y:5.0,frame:3,height:2.7},{x:17.3,y:5.4,frame:5,height:1.6},
 ...Array.from({length:22},(_,i)=>({x:2.4+(i*3.71)%15,y:3.5+(i*2.29)%14,frame:6,height:.25+(i%3)*.08})),
];
// Scenery sits beside the route; decorative objects never alter collision or objectives.
export const LIVING_PROPS:Prop[]=[
{x:3.0,y:17.6,frame:3,height:1.6,living:true},{x:5.8,y:15.8,frame:2,height:1.65,living:true},
{x:6.4,y:16.7,frame:1,height:3.6,living:true},{x:4.5,y:12.5,frame:0,height:2.8,living:true},
{x:8.7,y:14.4,frame:5,height:.5,living:true},{x:6.4,y:13.8,frame:4,height:.45,living:true},
{x:13.4,y:14.4,frame:7,height:1.7,living:true},{x:14.2,y:10.8,frame:2,height:1.55,living:true},
{x:16.8,y:9.5,frame:1,height:3.4,living:true},{x:13.4,y:7.4,frame:6,height:2.2,living:true},
{x:7.4,y:6.7,frame:0,height:2.6,living:true},{x:9.5,y:4.6,frame:2,height:1.6,living:true},
{x:11.8,y:5.6,frame:6,height:2.3,living:true},{x:16.1,y:4.6,frame:0,height:3,living:true},
...Array.from({length:16},(_,i)=>({x:3.1+(i*3.13)%13.6,y:4.1+(i*2.17)%12.4,frame:i%3===0?5:4,height:i%3===0?.42:.35,living:true}))];
/** Merge adjacent visible columns: one draw call per exposed span rather than per two pixels. */
export function visibleSpans(left:number,width:number,depth:number,z:Float32Array){const spans:[number,number][]=[];let start=-1;const end=Math.min(z.length,Math.ceil(left+width));for(let x=Math.max(0,Math.floor(left));x<end;x++){const visible=depth<=z[x]+.12;if(visible&&start<0)start=x;if(!visible&&start>=0){spans.push([start,x]);start=-1}}if(start>=0)spans.push([start,end]);return spans}
export const ROUTE=[[3.5,16.5],[7.5,14.5],[10.5,12.8],[15.5,10.5],[12.8,7],[8.5,5.5],[10.5,8.5],[14.5,5],[16.5,3.5]];
export function routeDistance(x:number,y:number){let best=100;for(let i=1;i<ROUTE.length;i++){const a=ROUTE[i-1],b=ROUTE[i],dx=b[0]-a[0],dy=b[1]-a[1],t=Math.max(0,Math.min(1,((x-a[0])*dx+(y-a[1])*dy)/(dx*dx+dy*dy)));best=Math.min(best,Math.hypot(x-a[0]-t*dx,y-a[1]-t*dy))}return best}
export function drawAtlas(ctx:CanvasRenderingContext2D,atlas:HTMLImageElement,frame:number,x:number,y:number,w:number,h:number){const matrix=ctx.getTransform(),scale=Math.max(1,Math.hypot(matrix.a,matrix.b)),snap=(v:number)=>Math.round(v*scale)/scale;const sw=atlas.naturalWidth/4,sh=atlas.naturalHeight/2;ctx.drawImage(atlas,(frame%4)*sw,Math.floor(frame/4)*sh,sw,sh,snap(x),snap(y),snap(w),snap(h))}
export function drawWorldProps(ctx:CanvasRenderingContext2D,atlas:HTMLImageElement|null,x:number,y:number,yaw:number,z:Float32Array,time:number,livingAtlas:HTMLImageElement|null=null){
 if(!atlas)return;
 const ordered=[...VALLEY_PROPS,...(livingAtlas?LIVING_PROPS:[])].map(p=>({...p,d:Math.hypot(p.x-x,p.y-y)})).sort((a,b)=>b.d-a.d);
 for(const p of ordered){if(p.d<.45)continue;const a=Math.atan2(Math.sin(Math.atan2(p.y-y,p.x-x)-yaw),Math.cos(Math.atan2(p.y-y,p.x-x)-yaw));if(Math.abs(a)>Math.PI/3)continue;
  const size=Math.min(270,120*p.height/p.d),cx=(.5+a/(Math.PI/3))*426,foot=120+60/p.d,left=cx-size/2,top=foot-size*.94;
  const source=p.living?livingAtlas!:atlas;const sw=source.naturalWidth/4,sh=source.naturalHeight/2,sourceX=(p.frame%4)*sw,sourceY=Math.floor(p.frame/4)*sh;
  ctx.save();ctx.globalAlpha=Math.min(1,.64+3/p.d);
  // Slice sprites against walls, so a tree cannot show through a ruin.
  for(const [from,to]of visibleSpans(left,size,p.d*Math.cos(a),z)){const sx=Math.max(left,from),ex=Math.min(left+size,to),u=(sx-left)/size;ctx.drawImage(source,sourceX+u*sw,sourceY,(ex-sx)/size*sw,sh,sx,top,ex-sx,size)}

  ctx.restore();
  if(p.living&&p.d<8&&p.d*Math.cos(a)<z[Math.max(0,Math.min(425,Math.floor(cx)))]){
   if(p.frame===3){const ex=cx-size*.16,ey=foot-size*.15;ctx.fillStyle=`rgba(237,177,91,${.55+Math.sin(time*.012)*.12})`;ctx.fillRect(ex,ey,Math.max(.6,size*.025),Math.max(.7,size*.035));for(let i=0;i<4;i++){const life=((time*.00018+i*.27)%1);ctx.fillStyle=`rgba(190,183,162,${(1-life)*.13})`;ctx.fillRect(ex+Math.sin(time*.001+i)*size*.02-life*size*.04,ey-life*size*.25,size*(.02+life*.04),size*(.02+life*.04))}}
   if(p.frame===1||p.frame===2){const light=.7+Math.sin(time*.006+p.x)*.1;ctx.fillStyle=`rgba(244,193,109,${light})`;ctx.fillRect(cx+(p.frame===1?size*.16:0),top+size*(p.frame===1?.53:.43),Math.max(.6,size*.012),Math.max(.7,size*.022))}
   if(p.frame===5){ctx.fillStyle='rgba(240,211,130,.7)';for(let i=0;i<3;i++){const phase=time*.0006+i*2.1+p.x;ctx.fillRect(cx+Math.sin(phase)*size*.3,foot-size*.3-Math.cos(phase*.7)*size*.12,Math.max(.5,size*.012),Math.max(.5,size*.012))}}
   if(p.frame===6){const flutter=Math.sin(time*.004+p.x)*size*.035;ctx.strokeStyle='rgba(179,91,84,.65)';ctx.lineWidth=Math.max(.5,size*.015);ctx.beginPath();ctx.moveTo(cx+size*.12,top+size*.28);ctx.lineTo(cx+size*.25+flutter,top+size*.4);ctx.lineTo(cx+size*.22,top+size*.56);ctx.stroke()}
  }
  if(!p.living&&p.frame===5&&p.d<9&&p.d<z[Math.max(0,Math.min(425,Math.floor(cx)))]){const flicker=.65+.1*Math.sin(time*.006+p.x);ctx.fillStyle=`rgba(255,191,94,${flicker})`;ctx.fillRect(Math.round(cx+size*.08),Math.round(top+size*.39),Math.max(1,size*.025),Math.max(1,size*.04))}
 }
}

let shrineStone:HTMLCanvasElement|undefined;
export function drawShrine(ctx:CanvasRenderingContext2D,cx:number,foot:number,size:number,active:boolean,time:number){
 if(!shrineStone){shrineStone=document.createElement('canvas');shrineStone.width=48;shrineStone.height=64;const p=shrineStone.getContext('2d')!;
  p.fillStyle='#253632';p.beginPath();p.moveTo(8,62);p.lineTo(12,49);p.lineTo(15,45);p.lineTo(15,19);p.lineTo(10,14);p.lineTo(17,6);p.lineTo(31,6);p.lineTo(38,14);p.lineTo(33,19);p.lineTo(33,45);p.lineTo(36,49);p.lineTo(40,62);p.closePath();p.fill();
  p.fillStyle='#64746a';p.fillRect(16,20,15,27);p.fillRect(12,49,23,5);p.fillRect(9,56,29,5);p.fillStyle='#92a18b';p.fillRect(16,20,3,26);p.fillRect(12,49,23,1);p.fillRect(9,56,29,1);p.fillRect(17,7,13,2);
  p.fillStyle='#364b44';p.fillRect(28,20,4,27);p.fillRect(15,35,14,1);p.fillRect(21,20,1,8);p.fillRect(25,36,1,10);p.fillStyle='#426648';p.fillRect(10,56,7,3);p.fillRect(14,51,5,2);p.fillRect(29,44,4,6);
  p.strokeStyle='#b1b490';p.lineWidth=1;p.beginPath();p.moveTo(23,26);p.lineTo(20,30);p.lineTo(24,34);p.lineTo(27,30);p.closePath();p.stroke();p.fillStyle='#b49d6a';p.fillRect(12,14,24,3);p.fillStyle='#172d2c';p.fillRect(18,9,12,10);
 }
 const scale=size/64,left=cx-24*scale,top=foot-size;ctx.drawImage(shrineStone,Math.round(left),Math.round(top),Math.round(48*scale),Math.round(size));
 const gx=cx,gy=top+13*scale,pulse=.5+.5*Math.sin(time*.002);
 ctx.save();ctx.translate(gx,gy);const glow=ctx.createRadialGradient(0,0,1,0,0,Math.max(2,13*scale));glow.addColorStop(0,active?'rgba(170,227,185,.35)':'rgba(133,186,214,.2)');glow.addColorStop(1,'transparent');ctx.fillStyle=glow;ctx.fillRect(-14*scale,-14*scale,28*scale,28*scale);
 ctx.fillStyle=active?'#a6dcb0':'#7cabc4';ctx.beginPath();ctx.moveTo(0,-7*scale);ctx.lineTo(5*scale,-1*scale);ctx.lineTo(0,6*scale);ctx.lineTo(-5*scale,-1*scale);ctx.closePath();ctx.fill();ctx.fillStyle=active?'#e6ecc0':'#bfd8d6';ctx.beginPath();ctx.moveTo(0,-7*scale);ctx.lineTo(0,6*scale);ctx.lineTo(-5*scale,-1*scale);ctx.fill();
 if(active){ctx.fillStyle=`rgba(219,235,187,${.35+pulse*.35})`;for(let i=0;i<3;i++){const a=time*.0005+i*2.1;ctx.fillRect(Math.round(Math.cos(a)*9*scale),Math.round(Math.sin(a)*3*scale-10*scale),Math.max(1,scale),Math.max(1,scale))}}ctx.restore();
}
export function drawSword(ctx:CanvasRenderingContext2D){
 // Local coordinates point along the blade; silhouettes stay crisp at native resolution.
 ctx.fillStyle='#1b242b';ctx.beginPath();ctx.moveTo(-16,8);ctx.lineTo(-13,-7);ctx.lineTo(-3,-10);ctx.lineTo(7,-5);ctx.lineTo(7,9);ctx.lineTo(-2,15);ctx.closePath();ctx.fill();
 ctx.fillStyle='#596975';ctx.fillRect(-12,-5,14,12);ctx.fillStyle='#a0abb0';ctx.fillRect(-11,-5,9,2);ctx.fillStyle='#293a45';for(let i=0;i<3;i++)ctx.fillRect(-11+i*4,-2,2,9);
 ctx.fillStyle='#46302d';ctx.fillRect(-7,-2,22,6);ctx.fillStyle='#ac8950';for(let i=0;i<4;i++)ctx.fillRect(i*4-5,-2,1,6);
 ctx.fillStyle='#332a24';ctx.beginPath();ctx.moveTo(10,-9);ctx.lineTo(17,-7);ctx.lineTo(20,-3);ctx.lineTo(20,4);ctx.lineTo(16,9);ctx.lineTo(10,11);ctx.lineTo(12,3);ctx.lineTo(12,-2);ctx.closePath();ctx.fill();ctx.strokeStyle='#c3a16a';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(11,-9);ctx.lineTo(17,-6);ctx.lineTo(18,5);ctx.lineTo(11,10);ctx.stroke();
 ctx.fillStyle='#617883';ctx.beginPath();ctx.moveTo(19,-3);ctx.lineTo(95,-3);ctx.lineTo(108,0);ctx.lineTo(95,5);ctx.lineTo(19,5);ctx.closePath();ctx.fill();ctx.fillStyle='#d0d7c8';ctx.beginPath();ctx.moveTo(19,-3);ctx.lineTo(95,-3);ctx.lineTo(108,0);ctx.lineTo(20,0);ctx.closePath();ctx.fill();ctx.fillStyle='#f2dfaf';ctx.fillRect(20,-3,74,1);ctx.fillStyle='#435d6a';ctx.fillRect(23,1,67,1);ctx.fillStyle='#9fbdc3';ctx.fillRect(24,3,66,1);
}

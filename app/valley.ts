// Low resolution world-space scenery: no network assets or per-frame allocations.
const wrap = (a:number) => Math.atan2(Math.sin(a), Math.cos(a));
let ground: HTMLCanvasElement | undefined;
let pixels: ImageData | undefined;
let panorama: HTMLCanvasElement | undefined;
export function drawValley(ctx:CanvasRenderingContext2D, x:number, y:number, yaw:number, time:number, art:HTMLImageElement|null) {
  const w=426, h=240, horizon=120, fov=Math.PI/3;
  const sky=ctx.createLinearGradient(0,0,0,horizon);
  sky.addColorStop(0,"#263749"); sky.addColorStop(.58,"#8b9294"); sky.addColorStop(1,"#dbc7a0");
  ctx.fillStyle=sky;ctx.fillRect(0,0,w,horizon);
  const sunAngle=wrap(-1.85-yaw), sunX=w/2+sunAngle/fov*w;
  if(Math.abs(sunAngle)<fov){
    const glow=ctx.createRadialGradient(sunX,38,2,sunX,38,70);
    glow.addColorStop(0,"#f4dfad99");glow.addColorStop(1,"#f4dfad00");
    ctx.fillStyle=glow;ctx.fillRect(sunX-70,0,140,horizon);
    ctx.fillStyle="#f4dfad";ctx.fillRect(Math.floor(sunX)-6,32,12,12);
  }
  for(let layer=0;layer<4;layer++){
    ctx.fillStyle=["#a3a6a0","#858f8b","#687b77","#435f59"][layer];
    ctx.beginPath();ctx.moveTo(0,horizon+2);
    for(let sx=0;sx<=w+2;sx+=2){
      const a=yaw+(sx/w-.5)*fov;
      const ridge=Math.sin(a*3+layer*1.8)*14+Math.sin(a*7-layer)*7+Math.sin(a*13+layer)*3;
      const height=67+layer*12+ridge*(1-layer*.14);
      ctx.lineTo(sx,Math.floor(height+Math.sin(a)*x*(layer*.18)+Math.cos(a)*y*(layer*.12)));
    }
    ctx.lineTo(w,horizon+2);ctx.fill();
  }
  // The castle shares its bearing with the actual gate instead of following the camera.
  const dx=16.5-x,dy=3.5-y,dist=Math.hypot(dx,dy),angle=wrap(Math.atan2(dy,dx)-yaw);
  if(!art&&Math.abs(angle)<fov){
    const cx=w/2+angle/fov*w,size=Math.min(1.5,Math.max(.55,11/Math.max(3,dist)));
    ctx.save();ctx.translate(Math.floor(cx),111);ctx.scale(size,size);
    ctx.fillStyle="#344b49";
    ctx.beginPath();ctx.moveTo(-66,10);ctx.lineTo(-38,-5);ctx.lineTo(-22,-9);ctx.lineTo(25,-7);ctx.lineTo(62,10);ctx.fill();
    ctx.fillStyle="#283c3f";ctx.fillRect(-37,-26,74,25);
    for(const [tx,top,width] of [[-41,-49,13],[-15,-65,19],[27,-43,14]]){
      ctx.fillRect(tx,top,width,-top);
      ctx.fillStyle="#1d3036";ctx.beginPath();ctx.moveTo(tx-3,top);ctx.lineTo(tx+width/2,top-13);ctx.lineTo(tx+width+3,top);ctx.fill();
      ctx.fillStyle="#283c3f";
      for(let merlon=0;merlon<width;merlon+=5)ctx.fillRect(tx+merlon,top-3,3,4);
      ctx.fillStyle="#c7ab6a";ctx.fillRect(tx+width/2-1,top+12,2,4);ctx.fillStyle="#283c3f";
    }
    ctx.fillStyle="#182c31";ctx.fillRect(-5,-16,10,16);
    ctx.fillStyle="#a98757";ctx.fillRect(-6,-67,1,15);
    ctx.fillStyle="#8f4a40";ctx.beginPath();ctx.moveTo(-5,-67);ctx.lineTo(8,-64+Math.sin(time*.002)*2);ctx.lineTo(-5,-61);ctx.fill();
    ctx.restore();
  }
  if(art){
    if(!panorama){
      panorama=document.createElement("canvas");panorama.width=640;panorama.height=126;
      const paint=panorama.getContext("2d")!;paint.imageSmoothingEnabled=false;
      paint.drawImage(art,0,0,art.naturalWidth,art.naturalHeight*.57,0,0,640,126);
      paint.globalCompositeOperation="destination-in";
      const edge=paint.createLinearGradient(0,0,640,0);edge.addColorStop(0,"#0000");edge.addColorStop(.08,"#000");edge.addColorStop(.92,"#000");edge.addColorStop(1,"#0000");paint.fillStyle=edge;paint.fillRect(0,0,640,126);
      const base=paint.createLinearGradient(0,0,0,126);base.addColorStop(0,"#000");base.addColorStop(.8,"#000");base.addColorStop(1,"#0000");paint.fillStyle=base;paint.fillRect(0,0,640,126);
    }
    // Keep the painted castle at the gate bearing; close scenery still moves independently.
    ctx.drawImage(panorama,Math.floor(w/2+angle/fov*w-640*.575),0);
  }
  const mist=ctx.createLinearGradient(0,96,0,125);mist.addColorStop(0,"#bdc5b000");mist.addColorStop(.7,"#bdc5b055");mist.addColorStop(1,"#bdc5b000");ctx.fillStyle=mist;ctx.fillRect(0,96,w,29);
}
export function drawValleyGround(ctx:CanvasRenderingContext2D,x:number,y:number,yaw:number){
  if(!ground){ground=document.createElement("canvas");ground.width=213;ground.height=60;pixels=ground.getContext("2d")!.createImageData(213,60)}
  const data=pixels!.data,cos=Math.cos(yaw),sin=Math.sin(yaw),plane=Math.tan(Math.PI/6);
  for(let row=0;row<60;row++){
    const depth=60/(row*2+1),fog=Math.min(.87,depth/24);
    for(let col=0;col<213;col++){
      const side=(col/213*2-1)*plane;
      const wx=x+depth*(cos-sin*side),wy=y+depth*(sin+cos*side);
      const hx=Math.floor(wx*22),hy=Math.floor(wy*22),hash=((Math.imul(hx,374761393)^Math.imul(hy,668265263))>>>0)%23;
      const progress=Math.max(0,Math.min(1,(16.5-wy)/13)),pathX=3.5+13*progress+Math.sin(progress*6)*.65;
      const path=Math.abs(wx-pathX)<.36;
      const stone=hash>19,shade=hash*.85;
      const base=path?[109+shade,100+shade,73+shade]:stone?[69+shade,78+shade,64+shade]:[39+shade,62+shade,45+shade];
      const i=(row*213+col)*4;
      data[i]=base[0]*(1-fog)+145*fog;data[i+1]=base[1]*(1-fog)+157*fog;data[i+2]=base[2]*(1-fog)+137*fog;data[i+3]=255;
    }
  }
  ground.getContext("2d")!.putImageData(pixels!,0,0);ctx.drawImage(ground,0,120,426,120);
}

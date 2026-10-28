function meadowPatch(x:number,y:number){return Math.sin(x*.43+y*.17)*Math.cos(y*.37-x*.13)}
import {routeDistance} from "./world-art";
// Low resolution world-space scenery with cached terrain and atmospheric perspective.
const wrap = (a:number) => Math.atan2(Math.sin(a), Math.cos(a));
let ground: HTMLCanvasElement | undefined;
let pixels: ImageData | undefined;
let panorama: HTMLCanvasElement | undefined;
let pathGrid:Float32Array|undefined;
const GROUND_SIDE_CACHE=new Map<number,Float32Array>();
let terrainLayer:HTMLCanvasElement|undefined;
let terrainPose:{x:number;y:number;yaw:number}|undefined;
let groundPose:{x:number;y:number;yaw:number;cols:number}|undefined;
// Terrain stays outside the walkable basin; combat positions retain a level footing.
const TERRAIN_SIZE=256, TERRAIN_STEP=.5, TERRAIN_ORIGIN=-54;
let terrainHeight:Float32Array|undefined;
let terrainLight:Float32Array|undefined;
function elevation(x:number,y:number){
  const outside=Math.max(0,Math.max(-x,x-20,-y,y-20));
  const rise=1-Math.exp(-outside*.14);
  return rise*(4.8+3.2*Math.sin(x*.13+y*.09)**2+5.4*Math.sin(x*.21-y*.16)**2);
}
function prepareTerrain(){
  if(terrainHeight)return;
  terrainHeight=new Float32Array(TERRAIN_SIZE*TERRAIN_SIZE);
  terrainLight=new Float32Array(terrainHeight.length);
  for(let iy=0;iy<TERRAIN_SIZE;iy++)for(let ix=0;ix<TERRAIN_SIZE;ix++){
    const x=TERRAIN_ORIGIN+ix*TERRAIN_STEP,y=TERRAIN_ORIGIN+iy*TERRAIN_STEP,i=iy*TERRAIN_SIZE+ix;
    terrainHeight[i]=elevation(x,y);
    terrainLight[i]=Math.max(.42,Math.min(1.18,.8+(elevation(x+.5,y)-elevation(x-.5,y))*.32-(elevation(x,y+.5)-elevation(x,y-.5))*.28));
  }
}
function paintTerrain(ctx:CanvasRenderingContext2D,x:number,y:number,yaw:number){
  prepareTerrain();
  // Far-to-near columns give overlapping slopes real perspective and movement parallax.
  for(let col=0;col<213;col++){
    const ray=yaw+(col/213-.5)*Math.PI/3,cos=Math.cos(ray),sin=Math.sin(ray),correct=Math.cos(ray-yaw);
    let bottom=123;
    for(let d=65;d>2;d-=Math.max(.35,d*.035)){
      const wx=x+cos*d,wy=y+sin*d;
      const ix=Math.floor((wx-TERRAIN_ORIGIN)/TERRAIN_STEP),iy=Math.floor((wy-TERRAIN_ORIGIN)/TERRAIN_STEP);
      if(ix<0||ix>=TERRAIN_SIZE||iy<0||iy>=TERRAIN_SIZE)continue;
      const i=iy*TERRAIN_SIZE+ix,tx=(wx-TERRAIN_ORIGIN)/TERRAIN_STEP-ix,ty=(wy-TERRAIN_ORIGIN)/TERRAIN_STEP-iy;
      const right=Math.min(ix+1,TERRAIN_SIZE-1),down=Math.min(iy+1,TERRAIN_SIZE-1);
      const sample=(grid:Float32Array)=>(grid[i]*(1-tx)+grid[iy*TERRAIN_SIZE+right]*tx)*(1-ty)+(grid[down*TERRAIN_SIZE+ix]*(1-tx)+grid[down*TERRAIN_SIZE+right]*tx)*ty;
      const h=sample(terrainHeight!);
      if(h<.08)continue;
      const top=Math.floor(120+(.5-h)*100/(d*correct)),fog=Math.min(.86,d/78),light=sample(terrainLight!);
      const rock=h>4.2,red=(rock?97:52)*light,green=(rock?100:79)*light,blue=(rock?92:66)*light;
      ctx.fillStyle=`rgb(${Math.round(red*(1-fog)+157*fog)},${Math.round(green*(1-fog)+169*fog)},${Math.round(blue*(1-fog)+157*fog)})`;
      ctx.fillRect(col*2,top,2,Math.max(1,bottom-top));bottom=Math.max(bottom,top+1);
    }
  }
}
function drawTerrain(ctx:CanvasRenderingContext2D,x:number,y:number,yaw:number){if(!terrainLayer){terrainLayer=document.createElement("canvas");terrainLayer.width=426;terrainLayer.height=150}const paint=terrainLayer.getContext("2d")!;if(!terrainPose||terrainPose.x!==x||terrainPose.y!==y||terrainPose.yaw!==yaw){paint.clearRect(0,0,426,150);paintTerrain(paint,x,y,yaw);terrainPose={x,y,yaw}}ctx.drawImage(terrainLayer,0,0,426,150)}
export function drawValley(ctx:CanvasRenderingContext2D, x:number, y:number, yaw:number, time:number, art:HTMLImageElement|null) {
  const w=426, h=240, horizon=120, fov=Math.PI/3;
  const sky=ctx.createLinearGradient(0,0,0,horizon);
  sky.addColorStop(0,"#263749"); sky.addColorStop(.58,"#8b9294"); sky.addColorStop(1,"#dbc7a0");
  ctx.fillStyle=sky;ctx.fillRect(0,-64,w,horizon+64);
  const sunAngle=wrap(-1.85-yaw), sunX=w/2+sunAngle/fov*w;
  if(!art&&Math.abs(sunAngle)<fov){
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
      panorama=document.createElement("canvas");panorama.width=1920;panorama.height=378;
      const paint=panorama.getContext("2d")!;paint.imageSmoothingEnabled=false;
      paint.drawImage(art,0,0,art.naturalWidth,art.naturalHeight*.57,0,0,1920,378);
      paint.globalCompositeOperation="destination-in";
      const edge=paint.createLinearGradient(0,0,1920,0);edge.addColorStop(0,"#0000");edge.addColorStop(.08,"#000");edge.addColorStop(.92,"#000");edge.addColorStop(1,"#0000");paint.fillStyle=edge;paint.fillRect(0,0,1920,378);
      const base=paint.createLinearGradient(0,0,0,378);base.addColorStop(0,"#000");base.addColorStop(.8,"#000");base.addColorStop(1,"#0000");paint.fillStyle=base;paint.fillRect(0,0,1920,378);
    }
    // Keep the painted castle at the gate bearing; close scenery still moves independently.
    ctx.drawImage(panorama,0,0,panorama.width,1,w/2+angle/fov*w-640*.575,-64,640,64);
    const zenith=ctx.createLinearGradient(0,-64,0,0);zenith.addColorStop(0,"#263749");zenith.addColorStop(.45,"#263749ed");zenith.addColorStop(1,"#26374900");ctx.fillStyle=zenith;ctx.fillRect(0,-64,w,64);
    ctx.drawImage(panorama,w/2+angle/fov*w-640*.575,0,640,126);
  }
  // Distant flock: time-based wingbeats remain consistent at any refresh rate.
  ctx.strokeStyle='rgba(47,61,65,.55)';ctx.lineWidth=.7;
  for(let i=0;i<5;i++){const bearing=wrap(-1.1+time*.000014+i*.025-yaw);if(Math.abs(bearing)>fov*.6)continue;const bx=w/2+bearing/fov*w,by=39+i%3*3+Math.sin(time*.0004+i)*2,wing=Math.sin(time*.006+i)*1.6;ctx.beginPath();ctx.moveTo(bx-2,by-wing);ctx.lineTo(bx,by);ctx.lineTo(bx+2,by-wing);ctx.stroke()}
  drawTerrain(ctx,x,y,yaw);
  const mist=ctx.createLinearGradient(0,96,0,125);mist.addColorStop(0,"#bdc5b000");mist.addColorStop(.7,"#bdc5b055");mist.addColorStop(1,"#bdc5b000");ctx.fillStyle=mist;ctx.fillRect(0,96,w,29);
}
export function drawValleyGround(ctx:CanvasRenderingContext2D,x:number,y:number,yaw:number,detail=1){
  const cols=detail>=3?852:detail>=2?426:213,rows=detail>=3?368:detail>=2?184:92,step=184/rows;
  if(ground&&groundPose&&groundPose.x===x&&groundPose.y===y&&groundPose.yaw===yaw&&groundPose.cols===cols){ctx.drawImage(ground,0,120,426,184);return}
  groundPose={x,y,yaw,cols};
  if(!pathGrid){pathGrid=new Float32Array(160*160);for(let gy=0;gy<160;gy++)for(let gx=0;gx<160;gx++)pathGrid[gy*160+gx]=routeDistance(gx/8,gy/8)}
  if(!ground||ground.width!==cols){ground=document.createElement("canvas");ground.width=cols;ground.height=rows;pixels=ground.getContext("2d")!.createImageData(cols,rows)}
  const data=pixels!.data,cos=Math.cos(yaw),sin=Math.sin(yaw);
  let columnSide=GROUND_SIDE_CACHE.get(cols);
  if(!columnSide){columnSide=new Float32Array(cols);const plane=Math.tan(Math.PI/6);for(let col=0;col<cols;col++)columnSide[col]=((col+.5)/cols*2-1)*plane;GROUND_SIDE_CACHE.set(cols,columnSide)}
  for(let row=0;row<rows;row++){
    const depth=60/(row*step+step*.5),fog=Math.min(.87,Math.max(0,(depth-1.2)/25));
    for(let col=0;col<cols;col++){
      const side=columnSide[col];
      const wx=x+depth*(cos-sin*side),wy=y+depth*(sin+cos*side);
      const hx=Math.floor(wx*22),hy=Math.floor(wy*22),hash=((Math.imul(hx,374761393)^Math.imul(hy,668265263))>>>0)%23;
      const gridX=wx*8,gridY=wy*8,gx=Math.floor(gridX),gy=Math.floor(gridY);
      // Bilinear sampling prevents the path edge from becoming a staircase at oblique angles.
      let pathDistance=10;
      if(gx>=0&&gy>=0&&gx<159&&gy<159){
        const tx=gridX-gx,ty=gridY-gy,k=gy*160+gx;
        const a=pathGrid[k]!*(1-tx)+pathGrid[k+1]!*tx;
        const b=pathGrid[k+160]!*(1-tx)+pathGrid[k+161]!*tx;
        pathDistance=a*(1-ty)+b*ty;
      }
      const bankNoise=Math.sin(wx*5.1+wy*2.7)*Math.cos(wy*4.3-wx*1.6)*.055;
      const path=pathDistance<.43+bankNoise;
      const borderBlend=Math.max(0,Math.min(1,(pathDistance-.35-bankNoise)/.52));
      const rolling=Math.sin(wx*.72+wy*.23)*Math.cos(wy*.61)*.5+.5;
      const broad=Math.sin(wx*.21+wy*.31)*Math.cos(wy*.27-wx*.17);
      const micro=Math.sin(wx*1.1+wy*.6)*Math.sin(wy*.9-wx*.7);
      const light=.72+rolling*.25+broad*.075+micro*.035;
      const edge=pathDistance<.58+bankNoise;
      const shoulder=pathDistance>=.43+bankNoise&&pathDistance<.9+bankNoise;
      const pathWear=Math.sin(wx*.9+wy*.3)*Math.sin(wy*.7-wx*.2);
      // Foot-worn twin ruts follow the pilgrimage route, giving the road a traveled texture.
      const rut=path&&depth<15&&Math.abs(pathDistance-(.235+Math.sin(wx*.8+wy*.6)*.018))<.045;
      const roadCracks=path&&pathDistance>.28&&depth<6&&Math.sin(wx*7.1+wy*3.7)*Math.cos(wy*5.9-wx*2.2)>.84;
      const fineX=Math.floor(wx*140),fineY=Math.floor(wy*140),fine=((Math.imul(fineX,374761393)^Math.imul(fineY,668265263))>>>0)%23,near=Math.max(0,Math.min(1,(4-depth)/3));
      const stone=(near>.4?fine:hash)>21&&meadowPatch(wx,wy)>.65,shade=hash*.18+near*(fine*.1-1);
      const gravel=path&&fine>18&&pathDistance<.2,grassTuft=!path&&fine>21&&depth<8&&meadowPatch(wx,wy)<-.2;
      const pebbles=path&&depth<5&&depth>1&&hash===3;
      const mossPatch=!path&&depth<7&&hash===7;
      const meadow=Math.sin(wx*.38-wy*.53)+Math.cos(wx*.57+wy*.32),dry=meadow>.85,deep=meadow<-.75;
      // Broad woodland shadows create depth beneath the distant treeline without extra draw calls.
      const canopyShadow=Math.max(0,Math.sin(wx*.49+wy*.18)*Math.cos(wy*.43-wx*.11));
      const shadow=!path&&pathDistance>1.2?1-canopyShadow*(depth<8?.2:.12):1;
      const woodlandEdge=!path&&pathDistance>1.4&&Math.sin(wx*.3+wy*.44)>.6;
      const ridge=Math.sin(wx*.17+wy*.27)*Math.cos(wy*.19-wx*.12);
      const slopeLight=1+ridge*.095;
      const damp=!path&&deep&&Math.sin(wx*1.4+wy*.8)>.2;
      const flowerScatter=!path&&depth<9&&fine===11&&hash>15&&meadowPatch(wx,wy)<-.55;
      const sunlitSeeds=!path&&depth<10&&fine===17&&dry;
      const fallenLeaves=!path&&depth<8&&hash===12&&fine>17;
      const drySoil=!path&&pathDistance>.8&&meadowPatch(wx,wy)>.55;
      const grassyBank=!path&&pathDistance>.43&&pathDistance<1.15&&fine>19&&meadowPatch(wx,wy)<.35;
      const clayBank=!path&&pathDistance>.48&&pathDistance<.85&&dry&&hash>17;
      const roadDust=path&&depth<9&&fine===6;
      const packedEarth=path&&pathDistance<.16&&Math.sin(wx*2.7+wy*.7)>.45;
      const amberGrass=!path&&dry&&depth<12&&fine>17;
      // Scalar channels avoid allocating a fresh RGB array for every ground pixel.
      let red=path?119+pathWear*7:edge?78:shoulder?59:stone?68:dry?67:deep?34:40;
      let green=path?108+pathWear*6:edge?83:shoulder?76:stone?78:dry?83:deep?61:65;
      let blue=path?80+pathWear*5:edge?54:shoulder?49:stone?63:dry?49:deep?47:45;
      // Blend the biome pigments continuously, avoiding abrupt dark meadow islands.
      if(!path&&!edge&&!shoulder&&!stone){const dryMix=Math.max(0,Math.min(1,(meadow-.2)/1.5)),wetMix=Math.max(0,Math.min(1,(-meadow-.2)/1.5));red=40+27*dryMix-6*wetMix;green=65+18*dryMix-4*wetMix;blue=45+4*dryMix+2*wetMix}
      red+=shade;green+=shade;blue+=shade;
      // Mix road shoulders into meadow pigments instead of leaving hard flat bands.
      if(!path&&borderBlend<1){const blend=borderBlend*borderBlend*(3-2*borderBlend);red=red*(.68+.32*blend)+14*(1-blend);green=green*(.78+.22*blend)+8*(1-blend);blue=blue*(.8+.2*blend)+3*(1-blend)}
      const i=(row*cols+col)*4;
      if(rut){red-=9;green-=8;blue-=6}
      if(roadCracks){red-=17;green-=16;blue-=12}
      if(gravel){red+=12;green+=10;blue+=8}
      if(grassTuft){red+=7;green+=17;blue+=5}
      if(woodlandEdge){red-=7;green-=4;blue-=2}
      if(damp){red-=5;green-=4;blue+=5}
      if(pebbles){red+=24;green+=24;blue+=20}
      if(mossPatch){red-=4;green+=13;blue-=3}
      if(flowerScatter){red+=45;green+=22;blue+=49}
      if(sunlitSeeds){red+=14;green+=13;blue+=5}
      if(fallenLeaves){red+=14;green+=7;blue-=2}
      if(drySoil){red+=12;green+=5;blue-=2}
      if(grassyBank){red+=5;green+=20;blue+=2}
      if(clayBank){red+=19;green+=9;blue-=4}
      if(roadDust){red+=16;green+=13;blue+=9}
      if(packedEarth){red-=8;green-=7;blue-=5}
      if(amberGrass){red+=10;green+=7;blue-=2}
      data[i]=red*light*shadow*slopeLight*(1-fog)+145*fog;data[i+1]=green*light*shadow*slopeLight*(1-fog)+157*fog;data[i+2]=blue*light*shadow*slopeLight*(1-fog)+137*fog;data[i+3]=255;
    }
  }
  ground.getContext("2d")!.putImageData(pixels!,0,0);ctx.drawImage(ground,0,120,426,184);
}

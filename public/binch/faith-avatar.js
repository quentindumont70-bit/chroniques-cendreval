/* La Binch — Faith : portrait pixel art animé, oeuvre originale.
   Troll chaman spectral, crête rouge, marteau volcanique Sulfuras dans le dos.
   Web Canvas natif, aucune image externe, aucun asset Blizzard.
   Le dessin ne s'anime QUE lorsque Faith répond. Économie CPU : ~12 fps, < 5s.
*/
(()=>{'use strict';
const SIZE=144;
const $=s=>document.querySelector(s);
const col={
 ink:'#0b1522',shade:'#16293b',steel:'#546c7b',ice:'#bcf5f0',
 skin:'#4b9d9d',skinLight:'#81d2bf',skinShadow:'#24546f',
 deep:'#192d49',robe:'#342a51',robeLight:'#555075',purple:'#ad9bd7',
 hair:'#b92339',hairLight:'#f34c46',hairDark:'#691c34',
 bone:'#f0e0ba',boneShade:'#9b997f',
 bronze:'#8e5639',gold:'#e9a85f',lava:'#ff7538',heart:'#ffd78d',magma:'#702333',
 aura:'#63d8d2',night:'#142339'
};
let canvas,ctx,raf=0,until=0,lastFrame=0,begin=0,reduced=false,speaking=false;
const rect=(x,y,w,h,color)=>{ctx.fillStyle=color;ctx.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h))};
function poly(points,color){ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(Math.round(points[0][0]),Math.round(points[0][1]));for(let i=1;i<points.length;i++)ctx.lineTo(Math.round(points[i][0]),Math.round(points[i][1]));ctx.closePath();ctx.fill()}
function stroke(points,color,width=2){ctx.beginPath();ctx.moveTo(points[0][0],points[0][1]);for(let i=1;i<points.length;i++)ctx.lineTo(points[i][0],points[i][1]);ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineCap='square';ctx.lineJoin='miter';ctx.stroke()}
function diamond(x,y,w,h,color){poly([[x+w/2,y],[x+w,y+h/2],[x+w/2,y+h],[x,y+h/2]],color)}
function fleck(x,y,color){rect(x,y,2,2,color)}
function hammer(talking,elapsed){
 // Sulfuras: head/handle behind the body, still recognisable in a small portrait.
 stroke([[119,125],[108,82],[100,54]],col.ink,13);
 stroke([[119,125],[108,82],[100,54]],col.bronze,9);
 stroke([[118,123],[107,79],[100,53]],col.gold,2);
 [[115,109],[112,99],[109,88],[106,77],[103,66]].forEach(([x,y],i)=>stroke([[x-3,y+2],[x+4,y]],i%2?col.ink:col.boneShade,2));
 poly([[78,32],[87,27],[122,26],[130,33],[129,51],[119,58],[87,55],[77,47]],col.ink);
 poly([[80,36],[89,31],[120,31],[125,36],[125,48],[118,53],[88,50],[81,45]],col.bronze);
 poly([[85,37],[91,33],[116,34],[121,40],[116,48],[92,47]],col.magma);
 poly([[88,40],[96,35],[116,38],[112,45],[93,44]],col.lava);
 poly([[97,37],[104,36],[109,39],[103,43],[98,41]],col.heart);
 // Spikes and brutal forged crown.
 poly([[83,32],[78,21],[91,29]],col.ink);poly([[83,30],[81,23],[88,30]],col.gold);
 poly([[106,29],[109,15],[116,30]],col.ink);poly([[108,28],[110,20],[113,28]],col.gold);
 poly([[124,37],[137,31],[129,46]],col.ink);poly([[125,38],[133,34],[129,42]],col.gold);
 poly([[89,51],[85,64],[99,54]],col.ink);poly([[90,52],[87,59],[95,52]],col.bronze);
 poly([[117,51],[123,64],[124,47]],col.ink);poly([[118,51],[122,59],[123,49]],col.bronze);
 // Crackling lava, never a perpetual animation; one shimmer while speaking.
 if(talking&&Math.floor(elapsed/240)%2===0){
  rect(92,41,2,4,col.heart);rect(113,39,3,3,col.heart);rect(105,44,2,3,col.heart);
 }
}
function aura(talk,elapsed){
 ctx.save();
 const halo=ctx.createRadialGradient(73,80,12,73,80,72);
 halo.addColorStop(0,talk?'#64d7d066':'#64d7d032');
 halo.addColorStop(.67,'#5f80c222');halo.addColorStop(1,'#111d3000');
 ctx.fillStyle=halo;ctx.fillRect(0,0,SIZE,SIZE);
 // Ghostly broken runic rings, blocky instead of smooth.
 [[23,31],[31,17],[112,17],[130,66],[9,89],[27,121],[105,128],[121,111]].forEach(([x,y],i)=>{
  const on=!talk||(Math.floor(elapsed/320)+i)%3!==0;
  if(on){rect(x,y,2,8,i%2?col.aura:col.purple);rect(x-2,y+4,6,2,col.deep)}
 });
 ctx.restore();
}
function armor(){
 // Hem/robe
 poly([[36,95],[49,83],[98,84],[110,100],[124,139],[20,139]],col.ink);
 poly([[39,96],[50,89],[96,90],[106,101],[114,137],[28,137]],col.robe);
 poly([[59,92],[80,91],[93,100],[83,137],[54,137],[48,109]],col.deep);
 poly([[68,107],[76,105],[78,138],[62,138]],col.robeLight);
 rect(69,119,4,14,col.purple);
 // Half-mask ceremonial chest plate.
 poly([[53,93],[70,104],[82,93],[93,102],[85,120],[60,120]],col.ink);
 poly([[57,96],[69,106],[81,96],[88,102],[82,115],[61,115]],col.steel);
 poly([[61,98],[69,107],[80,100],[79,113],[65,113]],col.skinShadow);
 diamond(69,107,10,12,col.aura);rect(73,111,2,4,col.ice);
 // Thick shoulders: tribal iron and bone with glowing talismans.
 poly([[28,91],[35,76],[51,78],[62,91],[57,106],[37,108],[26,99]],col.ink);
 poly([[31,92],[37,80],[49,82],[58,92],[54,101],[39,104],[30,97]],col.bronze);
 poly([[32,91],[36,82],[40,81],[41,96],[35,100]],col.boneShade);
 poly([[38,82],[46,84],[50,90],[45,91]],col.gold);
 poly([[33,80],[29,71],[42,82]],col.ink);poly([[34,79],[31,75],[39,81]],col.bone);
 poly([[49,80],[52,71],[55,87]],col.ink);poly([[50,79],[52,75],[53,84]],col.bone);
 poly([[89,92],[101,77],[114,78],[123,93],[119,108],[99,107]],col.ink);
 poly([[93,92],[103,81],[113,83],[118,95],[115,103],[101,103]],col.steel);
 poly([[103,83],[113,85],[118,94],[115,95]],col.skinShadow);
 stroke([[96,95],[106,90],[119,94]],col.gold,2);
 diamond(107,88,8,10,col.aura);
 // Neck chains and prayer beads.
 stroke([[53,86],[65,99],[75,100],[89,90]],col.ink,5);
 stroke([[53,86],[65,99],[75,100],[89,90]],col.gold,2);
 [59,66,73,80].forEach((x,i)=>fleck(x,92+(i%2)*6,col.bone));
}
function hair(){
 // Crête rouge haute, triangulaire et ragged, with bright slashes.
 poly([[56,48],[58,36],[56,29],[62,30],[60,20],[67,26],[66,8],[74,17],[80,5],[83,19],[91,13],[89,27],[95,25],[89,47]],col.ink);
 poly([[60,42],[62,33],[61,25],[66,31],[68,16],[73,23],[79,11],[82,25],[88,20],[85,32],[90,31],[86,44]],col.hairDark);
 poly([[64,39],[65,29],[69,32],[71,18],[75,28],[81,14],[81,32],[87,28],[84,42]],col.hair);
 poly([[71,35],[73,24],[76,30],[81,19],[80,39]],col.hairLight);
 rect(64,40,5,3,col.ink);rect(81,39,7,3,col.ink);
}
function face(speakingNow,elapsed){
 const bob=speakingNow&&Math.floor(elapsed/175)%2===0?1:0;
 ctx.save();ctx.translate(0,bob);
 // Ears: pointed lateral trolls.
 poly([[50,58],[31,51],[30,65],[45,75],[54,70]],col.ink);
 poly([[48,61],[34,56],[35,65],[47,71]],col.skinShadow);
 poly([[40,62],[45,63],[47,68],[43,67]],col.skinLight);
 poly([[93,58],[111,51],[111,65],[99,75],[91,68]],col.ink);
 poly([[94,61],[108,56],[108,65],[98,70]],col.skinShadow);
 poly([[103,61],[98,63],[98,68],[103,66]],col.skinLight);
 // Chin/head silhouette
 poly([[48,44],[57,35],[87,35],[97,47],[98,72],[91,90],[80,99],[61,98],[48,88],[43,70]],col.ink);
 poly([[50,46],[59,39],[84,39],[93,48],[94,70],[88,86],[79,94],[63,93],[52,85],[47,71]],col.skinShadow);
 poly([[53,48],[63,41],[81,41],[90,49],[91,68],[84,82],[78,86],[59,85],[50,74]],col.skin);
 poly([[57,48],[65,44],[82,44],[87,48],[83,56],[57,56]],col.skinLight);
 rect(52,59,7,12,col.skinLight);rect(85,59,5,14,col.skinShadow);
 // Raised nose and fierce brows.
 poly([[65,59],[77,59],[81,74],[72,79],[63,73]],col.skinShadow);
 poly([[66,61],[73,59],[75,72],[68,72]],col.skinLight);
 rect(62,74,7,2,col.ink);rect(77,74,6,2,col.ink);
 stroke([[54,60],[61,55],[70,56]],col.ink,4);
 stroke([[76,56],[86,55],[90,60]],col.ink,4);
 if(!speakingNow||Math.floor(elapsed/310)%8!==7){
  rect(59,62,10,3,col.ink);rect(78,62,9,3,col.ink);
  rect(64,62,3,2,col.ice);rect(80,62,3,2,col.ice);
 }else{stroke([[59,63],[68,64]],col.ink,2);stroke([[78,64],[87,63]],col.ink,2)}
 // Jaw moves ONLY while speaking.
 const mouthOpen=speakingNow?Math.floor(elapsed/130)%3===0?8:Math.floor(elapsed/130)%3===1?5:2:2;
 rect(64,82,18,mouthOpen+2,col.ink);
 if(mouthOpen>3){rect(67,84,12,2,col.magma);rect(68,87,9,1,col.hairLight)}
 else rect(66,83,12,1,col.boneShade);
 // Side tusks climb toward cheekbones.
 poly([[48,80],[44,74],[44,97],[52,91],[54,69]],col.ink);
 poly([[48,83],[46,78],[47,92],[50,90],[52,75]],col.bone);
 poly([[91,80],[96,74],[97,97],[90,91],[87,69]],col.ink);
 poly([[91,83],[94,78],[94,92],[91,90],[89,75]],col.bone);
 rect(49,85,2,6,col.ice);rect(91,85,2,6,col.boneShade);
 // Tribal cheek paint & face markings.
 stroke([[54,74],[60,77],[62,80]],col.purple,2);
 stroke([[82,79],[87,76],[90,74]],col.purple,2);
 rect(70,48,3,6,col.hairDark);
 ctx.restore();
}
function ambientParticles(elapsed){
 const pos=[[21,38],[16,82],[30,109],[123,16],[133,70],[116,116],[53,19],[104,123]];
 pos.forEach(([x,y],i)=>{
  if(Math.floor(elapsed/250+i*2)%3===0){rect(x,y,2,2,i%3===0?col.gold:col.aura);if(i%2)rect(x+1,y-3,1,2,col.ice)}
 });
}
function paint(elapsed=0,talk=false){
 if(!ctx)return;
 ctx.clearRect(0,0,SIZE,SIZE);
 ctx.imageSmoothingEnabled=false;
 // Isolated sprite canvas: dark, dense miniature stage.
 rect(0,0,SIZE,SIZE,col.night);
 poly([[0,105],[17,93],[29,107],[39,102],[49,115],[78,112],[113,95],[144,109],[144,144],[0,144]],'#182d3d');
 aura(talk,elapsed);
 hammer(talk,elapsed);
 armor();
 face(talk,elapsed);
 hair();
 if(talk)ambientParticles(elapsed);
 // subtle ground shadow and foreground fog
 rect(22,137,100,3,'#88d7d326');rect(30,140,84,2,'#a496e21c');
}
function reducedMotion(){
 return window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches===true||document.hidden;
}
function tick(now){
 if(!speaking||!canvas?.isConnected||document.hidden||now>=until||reducedMotion()){
  stop();return;
 }
 if(now-lastFrame>=80){
  paint(now-begin,true);
  lastFrame=now;
 }
 raf=requestAnimationFrame(tick);
}
function stop(){
 speaking=false;
 if(raf)cancelAnimationFrame(raf);
 raf=0;lastFrame=0;
 const container=$('#binch-faith-art');
 container?.classList.remove('is-speaking');
 paint();
}
function speak(text=''){
 if(!canvas)return;
 if(reducedMotion()){stop();return}
 const length=String(text).length;
 const duration=Math.min(4400,Math.max(1700,850+length*12));
 if(raf)cancelAnimationFrame(raf);
 const container=$('#binch-faith-art');
 container?.classList.add('is-speaking');
 speaking=true;begin=performance.now();lastFrame=0;until=begin+duration;
 raf=requestAnimationFrame(tick);
}
function mount(){
 const found=$('#binch-faith-canvas');
 if(!found)return false;
 if(canvas===found)return true;
 if(raf)cancelAnimationFrame(raf);
 canvas=found;ctx=canvas.getContext('2d',{alpha:false});
 if(!ctx)return false;
 canvas.width=SIZE;canvas.height=SIZE;
 paint();
 return true;
}
window.BinchFaithAvatar={mount,speak,stop,paint};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
document.addEventListener('visibilitychange',()=>{if(document.hidden)stop()});
document.addEventListener('binch:faith-speak',event=>{if(mount())speak(event.detail?.text)});
document.dispatchEvent(new Event('binch:faith-avatar-ready'));
})();

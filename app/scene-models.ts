import type {Voxel} from './voxel-world';
const wood='#69513c',stone='#77857b',moss='#657c49',iron='#414953',gold='#c7a66a';
function b(x:number,y:number,z:number,sx:number,sy:number,sz:number,color:string,yaw=0,glow=false):Voxel{return{x,y,z,sx,sy,sz,color,yaw,glow}}
/** Authored silhouettes with complete low-detail versions, rather than truncated models. */
export function sceneryModel(frame:number,living:boolean,h:number,detailed:boolean):Voxel[]{const v:Voxel[]=[];const add=(...parts:Voxel[])=>v.push(...parts);const ornament=(...parts:Voxel[])=>{if(detailed)add(...parts)};
 const arch=()=>{for(const side of [-1,1]){add(b(side*.31,0,0,.23,.3,.11,stone),b(side*.31,0,.11,.14,.2,.64,stone),b(side*.26,0,.73,.2,.23,.14,'#8c9681'),b(side*.15,0,.85,.22,.24,.12,stone));ornament(b(side*.31,-.115,.16,.025,.025,.48,gold),b(side*.37,.04,.03,.1,.17,.07,moss),b(side*.31,0,.67,.2,.27,.055,'#b2b19a'))}add(b(0,0,.94,.18,.25,.14,'#a5a58b'));ornament(b(0,-.14,.95,.055,.025,.09,gold))};
 const lantern=(x:number,y:number,z:number)=>{add(b(x,y,z,.09,.09,.12,'#d0a45a',0,true),b(x,y,z+.12,.14,.14,.025,iron),b(x,y,z-.02,.13,.13,.025,iron));ornament(b(x-.046,y-.046,z,.012,.012,.12,iron),b(x+.046,y-.046,z,.012,.012,.12,iron))};
 const tree=(kind:'pine'|'birch'|'oak')=>{const birch=kind==='birch',oak=kind==='oak';add(b(0,0,0,oak?.105:.06,oak?.1:.07,.71,birch?'#bfc2a6':wood));
 // Tapered trunk segments and exposed roots replace the monolithic pillar silhouette.
 if(detailed){for(let root=0;root<5;root++){const a=root*Math.PI*2/5;add(b(Math.cos(a)*.065,Math.sin(a)*.065,.005,.18,.055,.055,birch?'#9ea596':'#56432e',a))}
 for(let section=0;section<5;section++){const z=.08+section*.115;add(b(Math.sin(section*1.6)*.015,Math.cos(section*1.3)*.012,z,(oak?.12:.085)*(1-section*.09),(.1-section*.009),.12,birch?(section%2?'#d8d5b9':'#b4baa5'):(section%2?'#75583d':'#60482f'),section*.19))}}
for(let k=0;k<3;k++){const a=k*2.1;ornament(b(Math.cos(a)*.055,Math.sin(a)*.055,0,.16,.035,.04,wood,a))}for(let j=0;j<(detailed?6:2);j++)ornament(b(.002,-.039,.1+j*.08,.067,.009,.012,birch?'#5d665c':'#a1855d'));
  // Forked lower limbs interrupt the straight pole silhouette on every quality tier.
  for(let limb=0;limb<(detailed?5:3);limb++){
   const a=limb*2.399+.4,z=.3+(limb%3)*.11,reach=oak?.28:.2;
   add(b(Math.cos(a)*reach*.42,Math.sin(a)*reach*.42,z,reach,.045,.043,birch?'#aeb4a1':'#5b4733',a));
  }
  if(kind==='pine'){
  // Layered radial boughs replace the flat stacked-plate silhouette.
  // Keep the distant version lightweight while breaking the square outline.
  for(let tier=0;tier<(detailed?5:3);tier++){
   const radius=.37-tier*.053,z=.35+tier*.14;
   for(let side=0;side<(detailed?7:4);side++){
    const angle=side*Math.PI*2/(detailed?7:4)+tier*.39;
    const r=radius*.53,needle=b(Math.cos(angle)*r,Math.sin(angle)*r,z-.045,radius*.73,radius*.32,.085,
      ['#294b3e','#41684c','#65845a','#799166'][((tier+side)%4)],angle);
    needle.motion='leaf';add(needle);
   }
  }
  if(detailed){for(let needle=0;needle<18;needle++){const a=needle*2.399,level=needle%5,r=.17+(4-level)*.043,z=.29+level*.135;const tuft=b(Math.cos(a)*r,Math.sin(a)*r,z,.14,.11,.055,needle%3===0?'#7b9566':needle%3===1?'#3d624c':'#547957',a);tuft.motion='leaf';add(tuft)}}for(let level=0;level<5;level++){const width=.46-level*.07,z=.32+level*.135;add(b(0,0,z,width,width*.78,.105,['#314f42','#3b614b','#537957','#67865a','#8b9d67'][level],level*.51));if(detailed)for(let side=0;side<3;side++){const a=side*2.1+level*.7;const part=b(Math.cos(a)*width*.32,Math.sin(a)*width*.32,z-.035,width*.45,width*.35,.085,side===0?'#77915b':'#456b4c',a);part.motion='leaf';add(part)}}add(b(0,0,.94,.065,.065,.08,'#98a36a'))}
  else{
  // Full distant canopy for birches and oaks: low detail must never mean a bare trunk.
  // Broad overlapping crowns preserve the species silhouette without close-range voxel cost.
  if(!detailed){
   const radius=oak?.31:.23;
   const colors=birch?['#77966a','#a6b487','#547c60','#8caa77']:['#405f43','#648454','#81985c','#50734a'];
   for(let layer=0;layer<3;layer++){
    const z=.58+layer*.135,spread=radius*(layer===1?1.18:layer===2?.72:1);
    const crown=b((layer-1)*.045,layer%2*.035,z,spread*2,spread*1.65,.17,colors[layer]);
    crown.motion='leaf';add(crown);
   }
   for(let twig=0;twig<4;twig++){
    const a=twig*Math.PI/2+.35,r=radius*.75;
    add(b(Math.cos(a)*r,Math.sin(a)*r,.67+(twig%2)*.13,.17,.16,.14,colors[twig],a));
   }
  }
  if(detailed){ // Layered branch forks and clustered canopy give a legible silhouette at close range.
   for(let branch=0;branch<7;branch++){const a=branch*2.399,reach=(oak?.24:.17)*(1+branch%3*.16),height=.38+(branch%4)*.115;add(b(Math.cos(a)*reach*.42,Math.sin(a)*reach*.42,height,reach*.9,.035,.034,birch?'#a6ac97':'#69513c',a));for(let leaf=0;leaf<4;leaf++){const theta=a+leaf*1.57,r=reach*(.7+leaf*.09),tip=b(Math.cos(a)*reach+Math.cos(theta)*r*.35,Math.sin(a)*reach+Math.sin(theta)*r*.35,height+.07+(leaf%2)*.06,.12,.11,.085,['#405f43','#688957','#96a66b','#54734c'][leaf]);tip.motion='leaf';add(tip)}}}
   const count=detailed?25:7;for(let i=0;i<count;i++){const a=i*2.399,r=(i%4)*.054,z=.6+(i%3)*.11,spread=oak?.21:.15;const part=b(Math.cos(a)*r,Math.sin(a)*r,z,spread*(1+(i%2)*.24),spread,.105+((i*7)%3)*.025,['#54734b','#7d9259','#a3ae73','#658551'][i%4],a*.14);part.motion='leaf';add(part)}if(oak){add(b(.11,0,.45,.2,.035,.045,wood,.2),b(.22,0,.38,.015,.015,.15,iron));lantern(.22,0,.28)}}};
 if(living){switch(frame){
 case 0:arch();break;
 case 1:tree('oak');break;
 case 2:add(b(0,0,0,.3,.25,.07,stone),b(0,0,.07,.19,.18,.47,stone),b(0,0,.54,.29,.24,.07,'#a3a58d'));lantern(0,-.015,.61);ornament(b(-.08,-.1,.14,.025,.018,.3,gold),b(.08,-.1,.14,.025,.018,.3,gold));break;
 case 3:for(let i=0;i<7;i++){const a=i*Math.PI*2/7;add(b(Math.cos(a)*.19,Math.sin(a)*.19,0,.1,.08,.075,stone,a))}add(b(0,0,.04,.3,.055,.055,wood,.7),b(0,0,.05,.3,.055,.055,wood,-.7));for(let i=0;i<3;i++){const flame=b((i-1)*.045,0,.08,.06,.06,.13+(i%2)*.08,i===1?'#ffda8a':'#d27c41',0,true);flame.motion='flame';add(flame)}ornament(b(.32,.1,0,.18,.14,.13,'#79715b'),b(.32,.1,.13,.18,.14,.025,'#b79c75'),b(-.31,.1,.03,.05,.33,.08,wood));break;
 case 4:for(let i=0;i<(detailed?9:5);i++){const a=i*2.4,r=.1+(i%3)*.09,z=.2+(i%3)*.05;add(b(Math.cos(a)*r,Math.sin(a)*r,0,.025,.025,z,'#5a7b4e'));const petal=b(Math.cos(a)*r,Math.sin(a)*r,z,.095,.075,.045,['#c4be95','#aa90ad','#cbaf75'][i%3],a);petal.motion='leaf';add(petal)}break;
 case 5:add(b(0,0,0,.7,.2,.16,'#58483b'),b(.35,0,.01,.025,.19,.14,'#b19a73'));for(let i=0;i<4;i++){const x=-.23+i*.13;add(b(x,-.065,.12,.025,.025,.1,'#c5b894'),b(x,-.065,.2,.11,.1,.035,i%2?'#c48e6b':'#b19ab5'));ornament(b(x,-.065,.235,.03,.03,.012,'#eee0b6'))}break;
 case 6:add(b(0,0,0,.29,.24,.08,stone),b(0,0,.08,.15,.13,.3,iron),b(0,0,.37,.21,.14,.2,'#66717a'),b(0,0,.58,.11,.12,.13,'#8c9694'),b(.24,0,0,.025,.025,.93,wood));for(let i=0;i<4;i++){const flag=b(.24+i*.055,0,.61+(i%2)*.015,.055,.024,.25-i*.025,i%2?'#8b4d53':'#a96961');flag.motion='banner';add(flag)}ornament(b(.08,-.08,.4,.04,.025,.12,gold),b(-.08,-.08,.4,.04,.025,.12,gold));break;
 case 7:for(let i=0;i<8;i++){const a=i*Math.PI/4;add(b(Math.cos(a)*.24,Math.sin(a)*.24,0,.2,.12,.23,i%2?'#68776b':'#8d9682',a+Math.PI/2))}add(b(0,0,.035,.35,.35,.015,'#3f7984'),b(-.3,0,.2,.045,.06,.53,wood),b(.3,0,.2,.045,.06,.53,wood),b(0,0,.73,.72,.09,.07,wood));ornament(b(.08,0,.45,.01,.01,.28,'#c6b785'),b(.08,0,.39,.1,.1,.09,wood));break;
 }}else{switch(frame){case 0:tree('pine');break;case 1:tree('birch');break;case 2:add(b(-.1,0,0,.42,.34,.28,'#6b7a74',.24),b(.18,.06,0,.28,.25,.2,'#8f9782',-.32));ornament(b(-.1,0,.28,.22,.23,.035,moss,.24),b(.19,0,.2,.12,.13,.02,'#a5aa83'));break;case 3:arch();break;
 case 4:add(b(0,0,.15,.66,.36,.11,wood),b(0,-.18,.24,.67,.04,.24,'#a17c50'),b(0,.18,.24,.67,.04,.24,'#806344'),b(-.32,0,.24,.04,.36,.24,wood));for(const x of [-.22,.22])for(const y of [-.24,.24]){add(b(x,y,.04,.17,.055,.22,'#3e3d39'));ornament(b(x,y-.031,.09,.13,.015,.04,'#b89969'),b(x,y-.032,.05,.035,.015,.18,'#9f835a'))}ornament(b(.38,0,.17,.46,.035,.035,wood),b(-.1,0,.28,.2,.24,.19,'#8e8d70'),b(-.1,-.13,.28,.025,.02,.2,'#c0b491'));break;
 case 5:add(b(0,0,0,.04,.05,.7,wood),b(0,0,0,.13,.14,.04,stone));lantern(0,0,.68);break;
 case 6:for(let i=0;i<(detailed?11:5);i++){const a=i*2.399,r=.09+(i%4)*.045;add(b(Math.cos(a)*r,Math.sin(a)*r,.015,.19,.035,.045,['#456a49','#78965b','#4f8051'][i%3],a));if(detailed){add(b(Math.cos(a)*r,Math.sin(a)*r,.045,.065,.035,.055,'#8ba56a',a));if(i%3===0)add(b(Math.cos(a)*r,Math.sin(a)*r,.075,.036,.036,.026,i%2?'#c7b4d2':'#ead59c',a))}}break;
 case 7:add(b(0,0,0,.4,.25,.09,stone),b(0,0,.09,.25,.15,.6,'#7b8c7f'),b(0,0,.69,.21,.17,.07,'#a2aa95'));ornament(b(0,-.086,.3,.035,.025,.24,gold),b(0,-.086,.43,.14,.025,.035,gold));break;}}
 return v.map(part=>({...part,x:part.x*h,y:part.y*h,z:part.z*h,sx:part.sx*h,sy:part.sy*h,sz:part.sz*h}));
}

/** Small world-space fauna and embers; animation uses simulation time and pauses with gameplay. */
export function valleyLife(time:number,playerX:number,playerY:number,detail:number,combat:boolean):Voxel[]{const v:Voxel[]=[],t=time*.001;const spots=[[5.6,16.1],[8.6,14.1],[13.2,14.2],[7.3,6.8]];for(let i=0;i<spots.length;i++){const [x,y]=spots[i];if(Math.hypot(playerX-x,playerY-y)>8)continue;const count=detail>=2?3:1;for(let j=0;j<count;j++){const phase=t*.55+i*2+j*2.1,bx=x+Math.cos(phase)*.3,by=y+Math.sin(phase*.8)*.24,z=.1+Math.sin(phase*.7)*.025,fold=.005+Math.abs(Math.sin(t*11+j))* .028;v.push(b(bx,by,z,.008,.025,.01,'#8b794f'),b(bx-fold,by,z,.025,.022,.008,'#d9b785',Math.sin(t*11)*.8),b(bx+fold,by,z,.025,.022,.008,i%2?'#93bbbd':'#d8ca95',-Math.sin(t*11)*.8))}}
 if(!combat){for(let i=0;i<2;i++){const x=6.8+i*7,y=15-i*3;if(Math.hypot(playerX-x,playerY-y)>9)continue;const a=t*.19+i*2,bx=x+Math.cos(a)*.65,by=y+Math.sin(a)*.65,z=.9+Math.sin(a*2)*.08,wing=Math.sin(t*7+i)*.03;v.push(b(bx,by,z,.035,.08,.025,'#384945',a),b(bx-.04,by,z+wing,.09,.025,.013,'#66766a',a),b(bx+.04,by,z-wing,.09,.025,.013,'#66766a',a))}}
 // Migrating flocks: birds cross the player's valley rather than circling a fixed perch.
 // Their positions are deterministic in simulation time; no React state or timers.
 if(!combat){const flockCount=detail>=2?5:2;for(let i=0;i<flockCount;i++){const cycle=(t*.055+i*.213)%1,route=i%3,originX=route===0?1.5:route===1?17:4,originY=route===0?12:route===1?7:18;const bx=originX+(route===1?-1:1)*cycle*15,by=originY+Math.sin(cycle*5+i)*1.5+(route===2?-cycle*9:0);if(Math.hypot(playerX-bx,playerY-by)>13)continue;const altitude=1.55+(i%3)*.36+Math.sin(t*.8+i)*.1,flap=Math.sin(t*10+i*2.4),wing=.11+flap*.055,heading=route===1?Math.PI:route===2?-.55:.1;v.push(b(bx,by,altitude,.09,.12,.055,i%2?'#596a70':'#3e504d',heading),b(bx-.1,by,altitude+flap*.045,.19,.045,.025,i%2?'#87918c':'#788a78',heading-wing),b(bx+.1,by,altitude-flap*.045,.19,.045,.025,i%2?'#87918c':'#788a78',heading+wing),b(bx,by-.09,altitude,.045,.11,.018,'#b7aa86',heading))}}
 // Ground fauna: grazing rabbits and startled fireflies, animated without allocations outside view.
 if(!combat){for(let i=0;i<4;i++){const nestX=3.5+i*4.1,nestY=4.8+(i%2)*8.3;const dx=playerX-nestX,dy=playerY-nestY;if(Math.hypot(dx,dy)>8)continue;const stride=t*.23+i*1.9,hop=Math.pow(Math.max(0,Math.sin(t*2.3+i)),5)*.055;const rx=nestX+Math.sin(stride)*.65,ry=nestY+Math.cos(stride*.77)*.44;v.push(b(rx,ry,.035+hop,.13,.085,.09,'#887a67'),b(rx+.09,ry,.065+hop,.065,.065,.067,'#b0a18a'),b(rx+.105,ry-.035,.125+hop,.024,.024,.12,'#a9977e'),b(rx+.13,ry+.028,.125+hop,.024,.024,.115,'#a9977e'),b(rx-.08,ry,.07+hop,.05,.055,.06,'#d4c7ae'))}
 for(let i=0;i<(detail>=2?18:7);i++){const cluster=i%3,px=3.8+cluster*5.5,py=5.6+(cluster%2)*8.2;if(Math.hypot(playerX-px,playerY-py)>7)continue;const phase=t*.43+i*2.399,fx=px+Math.cos(phase)*(.3+(i%4)*.15),fy=py+Math.sin(phase*.8)*(.4+(i%3)*.18),fz=.16+.1*Math.sin(t*1.3+i);const spark=b(fx,fy,fz,.012,.012,.012,i%3===0?'#b8e2bb':'#f0d18a',0,true);spark.motion='flame';v.push(spark)}}
 if(Math.hypot(playerX-3,playerY-17.6)<7)for(let i=0;i<(detail>=2?5:2);i++){const phase=(t*.34+i*.23)%1;v.push(b(3+Math.sin(t+i)*.035,17.6+Math.cos(i)*.025,.09+phase*.2,.009,.009,.009*(1-phase),'#dfb477',0,true))}return v;
}

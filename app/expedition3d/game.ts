import * as T from 'three';
import {CLASSES,playerStats,resolveDamage,skillCooldown,type ClassId} from '../rpg.ts';
import {harvest,brew,usePreparation,tickAlchemy,type Preparation} from '../alchemy.ts';
import {applyAffliction,consumeAffliction,tickAffliction,type Affliction} from '../afflictions.ts';
import {acceptContract,claimContract} from '../contracts.ts';
import {canLearnTalent,type TalentKey} from '../talents.ts';
import {buildWorld,actor,pose,makeWeapon,material,disposeWorld,disposeMaterials,type Actor,type WorldView} from './scene.ts';
import {ground,floorAt,moveBody,sight,canStand,places,spawns,clamp,type Zone,type Place,type EnemyKind} from './world.ts';
import {fresh,decode,SAVE_KEY,GEAR,gainXp,objective,rewardBoss,finish,type Progress} from './progress.ts';
export type Enemy={id:string;kind:EnemyKind;x:number;y:number;z:number;hp:number;max:number;wind:number;recover:number;flash:number;phase:number;model:Actor;affliction?:Affliction;expose:number;home:{x:number;z:number}};
export type Snapshot={p:Progress;objective:string;hint:string;notice:string;target:{name:string;hp:number;max:number;wind:boolean}|null;cooldowns:number[];fps:number;calls:number;paused:boolean;guard:boolean;locked:boolean;sound:boolean;quality:string;saveError:string};
type Bolt={mesh:T.Mesh;vx:number;vz:number;vy:number;life:number;damage:number;hostile:boolean;magic:boolean;mark:boolean};
type Fx={mesh:T.Mesh;life:number;max:number;vy:number};
const NAMES:Record<EnemyKind,string>={sentinel:'Veilleur déchu',archer:'Arbalétrier des brumes',hound:'Traqueur creux',boss:'Le gardien · Sulfuras'};
export class Expedition{
 renderer:T.WebGLRenderer;scene=new T.Scene();camera=new T.PerspectiveCamera(72,1,.06,180);world!:WorldView;weapon:T.Group;enemies:Enemy[]=[];bolts:Bolt[]=[];fx:Fx[]=[];
 p:Progress;paused=true;mouseFallback=false;keys=new Set<string>();cooldowns=[0,0,0];attackCd=0;swing=0;guardTime=0;guarding=false;dodgeTime=0;dodgeBurst=0;vy=0;pitch=0;locked:string|null=null;
 notice='Bienvenue à Valbrume.';noticeTime=6;hint='';nearest:Place|null=null;fps=60;quality='Équilibré';sound=false;saveError='';audio:AudioContext|null=null;audioGain:GainNode|null=null;musicTimer=0;
 elapsed=0;last=0;uiTime=0;saveTime=0;raf=0;disposed=false;frames=0;frameTime=0;scale=1;look={x:0,y:0};stick={x:0,y:0};touches=new Map<number,{side:'move'|'look';x:number;y:number;lastX:number;lastY:number;time:number;travel:number}>();
 cleanups:(()=>void)[]=[];onSnapshot:(s:Snapshot)=>void;onPause:()=>void;
 canvas:HTMLCanvasElement;
 constructor(canvas:HTMLCanvasElement,p:Progress,onSnapshot:(s:Snapshot)=>void,onPause:()=>void){
  this.canvas=canvas;this.p=p;this.onSnapshot=onSnapshot;this.onPause=onPause;
  this.renderer=new T.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});this.renderer.outputColorSpace=T.SRGBColorSpace;this.renderer.toneMapping=T.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.1;this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=T.PCFSoftShadowMap;
  this.camera.rotation.order='YXZ';this.scene.add(this.camera);this.weapon=makeWeapon(p.classId);this.camera.add(this.weapon);this.weapon.position.set(.38,-.45,-.65);this.weapon.scale.setScalar(.55);
  this.loadZone(p.zone,false);this.resize();this.bind();this.frame(0);
 }
 listen(target:EventTarget,name:string,fn:EventListener,options?:AddEventListenerOptions){target.addEventListener(name,fn,options);this.cleanups.push(()=>target.removeEventListener(name,fn,options))}
 bind(){
  this.listen(window,'resize',()=>this.resize());
  this.listen(document,'visibilitychange',()=>{if(document.hidden)this.pause()});
  this.listen(window,'blur',()=>this.pause());this.listen(window,'pagehide',()=>this.save());
  this.listen(this.canvas,'webglcontextlost',((e:Event)=>{e.preventDefault();this.say('Le rendu a été interrompu. Rechargez la page pour reprendre.');this.pause()}) as EventListener);
  this.listen(document,'pointerlockchange',()=>{if(document.pointerLockElement!==this.canvas&&!this.paused)this.pause()});
  this.listen(window,'keydown',((ev:KeyboardEvent)=>{
   if(!this.paused&&['Space','Tab','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(ev.code))ev.preventDefault();
   if(ev.code==='Escape'||ev.code==='Tab'){this.pause();return}if(this.paused||ev.repeat)return;
   this.keys.add(ev.code);
   if(ev.code==='Space')this.jump();if(ev.code==='ShiftLeft'||ev.code==='ShiftRight')this.dodge();
   if(ev.code==='KeyE')this.interact();if(ev.code==='KeyF')this.toggleLock();if(ev.code==='KeyH')this.heal();if(ev.code==='KeyX')this.prepare();
   if(['Digit1','Digit2','Digit3'].includes(ev.code))this.skill(Number(ev.code.slice(-1))-1);
  }) as EventListener);
  this.listen(window,'keyup',((e:KeyboardEvent)=>{this.keys.delete(e.code)}) as EventListener);
  this.listen(this.canvas,'contextmenu',(e=>e.preventDefault()));
  this.listen(this.canvas,'auxclick',((e:MouseEvent)=>{if(e.button>=3)e.preventDefault()}) as EventListener);
  this.listen(this.canvas,'pointerdown',((e:PointerEvent)=>{
   if(this.paused)return;this.canvas.setPointerCapture(e.pointerId);
   if(e.pointerType==='mouse'){
    if(e.button>=3){e.preventDefault();return}if(document.pointerLockElement!==this.canvas&&!this.mouseFallback){this.capture();return}
    if(e.button===0)this.attack();if(e.button===2){this.guarding=true;this.guardTime=0}if(e.button===1)this.toggleLock();return;
   }
   const side=e.clientX<innerWidth*.45?'move':'look';
   if([...this.touches.values()].some(t=>t.side===side))return;
   this.touches.set(e.pointerId,{side,x:e.clientX,y:e.clientY,lastX:e.clientX,lastY:e.clientY,time:this.elapsed,travel:0});
  }) as EventListener);
  this.listen(this.canvas,'pointermove',((e:PointerEvent)=>{
   if(this.paused)return;
   if(e.pointerType==='mouse'&&(document.pointerLockElement===this.canvas||this.mouseFallback&&(e.buttons&1))){this.turn(e.movementX,e.movementY);return}
   const t=this.touches.get(e.pointerId);if(!t)return;const dx=e.clientX-t.lastX,dy=e.clientY-t.lastY;t.travel+=Math.hypot(dx,dy);
   if(t.side==='move'){this.stick.x=clamp((e.clientX-t.x)/55,-1,1);this.stick.y=clamp((e.clientY-t.y)/55,-1,1)}else this.turn(dx*1.5,dy*1.5);
   t.lastX=e.clientX;t.lastY=e.clientY;
  }) as EventListener);
  const up=((e:PointerEvent)=>{
   if(e.pointerType==='mouse'){if(e.button===2)this.guarding=false;return}
   const t=this.touches.get(e.pointerId);if(!t)return;this.touches.delete(e.pointerId);
   if(t.side==='move'){this.stick={x:0,y:0};if(this.elapsed-t.time<.22&&t.travel<14)this.jump()}
   else{const duration=this.elapsed-t.time,dx=e.clientX-t.x,dy=e.clientY-t.y;
    if(duration<.32&&Math.hypot(dx,dy)>65){if(dy>Math.abs(dx))this.dodge();else if(-dy>Math.abs(dx))this.skill(0);else this.skill(dx<0?1:2)}
    else if(duration<.28&&t.travel<18)this.attack();this.guarding=false;
   }
  }) as EventListener;
  this.listen(this.canvas,'pointerup',up);this.listen(this.canvas,'pointercancel',((e:PointerEvent)=>{this.touches.delete(e.pointerId);this.stick={x:0,y:0};this.guarding=false}) as EventListener);
  this.listen(window,'mouseup',((e:MouseEvent)=>{if(e.button===2)this.guarding=false}) as EventListener);
 }
 turn(dx:number,dy:number){if(!this.locked)this.p.yaw-=dx*.0025;this.pitch=clamp(this.pitch-dy*.0025,-1.25,1.25)}
 resize(){const w=this.canvas.clientWidth||innerWidth,h=this.canvas.clientHeight||innerHeight;this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.5)*this.scale);this.renderer.setSize(w,h,false);this.camera.aspect=w/h;this.camera.updateProjectionMatrix()}
 capture(){if(!matchMedia('(pointer:fine)').matches)return;if(!this.canvas.requestPointerLock){this.mouseFallback=true;return}try{const request=this.canvas.requestPointerLock();request?.catch(()=>{this.mouseFallback=true;this.say('Capture indisponible : maintenez le clic gauche pour orienter la vue.')})}catch{this.mouseFallback=true}}
 resume(){if(this.p.hp<=0)return;this.paused=false;this.last=performance.now();this.capture();this.audio?.resume();this.emit()}
 pause(){if(this.disposed)return;this.paused=true;this.keys.clear();this.touches.clear();this.stick={x:0,y:0};this.guarding=false;this.save();if(document.pointerLockElement===this.canvas)document.exitPointerLock();this.audio?.suspend();this.emit();this.onPause()}
 save(){try{localStorage.setItem(SAVE_KEY,JSON.stringify(this.p));this.saveError=''}catch{this.saveError='Sauvegarde indisponible : le navigateur refuse le stockage.'}}
 say(s:string){this.notice=s;this.noticeTime=5}
 newGame(id:ClassId){this.p=fresh(id);this.camera.remove(this.weapon);disposeWorld(this.weapon);this.weapon=makeWeapon(id);this.camera.add(this.weapon);this.weapon.scale.setScalar(.55);this.cooldowns=[0,0,0];this.loadZone('valley',false);this.save();this.resume()}
 loadZone(zone:Zone,arrival=true){
  this.clearTransient();if(this.world)disposeWorld(this.world.root);this.enemies.forEach(e=>disposeWorld(e.model.root));this.enemies=[];this.p.zone=zone;this.world=buildWorld(this.scene,zone);
  if(arrival){this.p.x=0;this.p.z=zone==='crypt'?3:-44;this.p.y=ground(zone,this.p.x,this.p.z);this.p.yaw=zone==='crypt'?0:Math.PI}
  this.vy=0;this.pitch=0;this.locked=null;
  for(const s of spawns[zone])if(!this.p.dead.includes(s.id)){
   const model=actor(s.kind);model.root.position.set(s.x,ground(zone,s.x,s.z),s.z);this.scene.add(model.root);const max=s.kind==='boss'?400:s.kind==='sentinel'?90:s.kind==='archer'?65:55;
   this.enemies.push({...s,y:ground(zone,s.x,s.z),hp:max,max,wind:0,recover:1,flash:0,phase:1,model,expose:0,home:{x:s.x,z:s.z}});
  }
  this.updateMarkers();this.save();
 }
 updateMarkers(){
  for(const gate of this.world.gates)gate.visible=!this.p.gate;
  for(const p of places[this.p.zone]){const m=this.world.markers.get(p.id)!;m.visible=p.kind==='herb'?!(this.p.harvestMask&(1<<p.index!)):p.id==='reward'?this.p.dead.includes('boss')&&!this.p.bossLoot:!this.p.found.includes(p.id)||['rest','portal','village','lever'].includes(p.kind)}
 }
 clearTransient(){for(const b of this.bolts){b.mesh.removeFromParent();b.mesh.geometry.dispose()}for(const f of this.fx){f.mesh.removeFromParent();f.mesh.geometry.dispose()}this.bolts=[];this.fx=[]}
 stats(){const s=playerStats(this.p.classId,this.p.level,this.p),g=GEAR.find(g=>g.id===this.p.equipped)!;return {...s,power:s.power+g.power,armor:s.armor+g.armor}}
 forward(){return {x:-Math.sin(this.p.yaw),z:-Math.cos(this.p.yaw)}}
 target(range=15,cone=.65){const dir=this.forward();return this.enemies.filter(e=>e.hp>0).filter(e=>{const dx=e.x-this.p.x,dz=e.z-this.p.z,d=Math.hypot(dx,dz);return d<range&&(dx*dir.x+dz*dir.z)/Math.max(.01,d)>cone&&Math.abs(e.y-this.p.y)<3&&this.visible(e)}).sort((a,b)=>Math.hypot(a.x-this.p.x,a.z-this.p.z)-Math.hypot(b.x-this.p.x,b.z-this.p.z))[0]}
 visible(e:Enemy){return sight(this.p.zone,{...this.p,y:this.p.y+1.1},{...e,y:e.y+1.1},this.p.gate)}
 toggleLock(){if(this.locked){this.locked=null;return}const e=this.target(18,.35);if(e)this.locked=e.id;else this.say('Aucune cible visible à verrouiller.')}
 jump(){if(this.paused)return;if(this.p.y<=floorAt(this.p.zone,this.p.x,this.p.z,this.p.y)+.08){this.vy=6;this.tone(180,.1)}}
 dodge(){if(this.paused||this.p.stamina<24||this.dodgeTime>0)return;this.p.stamina-=24;this.dodgeTime=.28;this.dodgeBurst=.22;this.tone(100,.1)}
 attack(){
  if(this.paused||this.attackCd>0||this.p.stamina<10)return;this.p.stamina-=10;this.attackCd=.42;this.swing=.32;this.tone(180,.08);
  const ranged=CLASSES[this.p.classId].spec!=='blade';
  if(ranged)this.shoot(false,18+(this.p.oilTime>0?5:0),this.p.classId!=='bow',false);
  else{const e=this.target(2.8,.25);if(e)this.hit(e,22+(this.p.oilTime>0?5:0),false,false);}
 }
 skill(index:number){
  if(this.paused)return;const sk=CLASSES[this.p.classId].skills[index];if(!sk||this.cooldowns[index]>0)return;if(this.p.mana<sk.cost){this.say('Mana insuffisant.');return}
  this.p.mana-=sk.cost;this.cooldowns[index]=skillCooldown(sk,this.stats());this.swing=.45;
  if(sk.heal)this.p.hp=Math.min(100,this.p.hp+sk.heal);if(sk.heal||sk.guard)this.p.stamina=Math.min(100,this.p.stamina+35);
  if(sk.guard){this.dodgeTime=Math.max(this.dodgeTime,sk.guard);this.spark(this.p.x,this.p.y+1,this.p.z,'#a4e2e1',8)}
  if(sk.damage>0){if(sk.range>6)this.shoot(false,sk.damage,sk.magic,true);else for(const e of this.enemies)if(e.hp>0&&Math.hypot(e.x-this.p.x,e.z-this.p.z)<sk.range&&this.visible(e))this.hit(e,sk.damage,sk.magic,true)}
  this.say(sk.name);this.tone(420+index*90,.2);
 }
 hit(e:Enemy,base:number,magic:boolean,mark:boolean){
  if(e.hp<=0)return;const consumed=mark?{bonus:0,heal:0,mana:0,label:''}:consumeAffliction(e.affliction,this.p.classId);
  const damage=resolveDamage(base+consumed.bonus,this.stats(),{armor:e.kind==='boss'?20:10,magicResist:e.kind==='archer'?20:8},magic,Math.random(),e.expose>0);
  const dealt=Math.min(e.hp,damage.amount);e.hp-=damage.amount;e.flash=.18;this.p.hp=Math.min(100,this.p.hp+consumed.heal+dealt*this.stats().lifeSteal);this.p.mana=Math.min(100,this.p.mana+consumed.mana);
  if(mark){e.affliction=applyAffliction(this.p.classId);e.expose=5;if(this.p.classId==='cantor'){e.wind=0;e.recover=1}}
  this.spark(e.x,e.y+1,e.z,damage.critical?'#ffeec0':magic?'#9ae4ec':'#ffba77',7);this.say(`${damage.critical?'Critique · ':''}${damage.amount} dégâts${consumed.label?' · '+consumed.label:''}`);this.tone(e.hp<=0?120:280,.07);
  if(e.hp<=0)this.kill(e);
 }
 kill(e:Enemy){if(this.p.dead.includes(e.id))return;this.p.dead.push(e.id);this.p.foesDefeated++;this.p.gold+=e.kind==='boss'?40:8;gainXp(this.p,e.kind==='boss'?100:22);this.p.mana=Math.min(100,this.p.mana+8);this.p.potions=Math.min(9,this.p.potions+(this.p.foesDefeated%3===0?1:0));this.locked=null;
  if(this.p.foesDefeated===2&&!this.p.gear.includes('watch')){this.p.gear.push('watch');this.say('Butin : Lame du veilleur · équipez-la dans le sac.')}
  if(e.kind==='boss'){this.p.quest=8;this.say('Le gardien est tombé. Recueillez son cœur.');this.updateMarkers()}
  this.p.campMask=this.p.dead.filter(s=>s[0]==='v').length>=6?3:this.p.dead.filter(s=>s[0]==='v').length>=3?1:0;this.save();
 }
 shoot(hostile:boolean,damage:number,magic:boolean,mark:boolean,enemy?:Enemy){
  if(this.bolts.length>=32)return;const dir=this.forward();let x=this.p.x,y=this.p.y+1.35,z=this.p.z,dx=dir.x,dz=dir.z,dy=Math.sin(this.pitch);
  if(enemy){x=enemy.x;y=enemy.y+1.4;z=enemy.z;const dist=Math.hypot(this.p.x-x,this.p.z-z);dx=(this.p.x-x)/dist;dz=(this.p.z-z)/dist;dy=(this.p.y+1.1-y)/dist}
  else{dx*=Math.cos(this.pitch);dz*=Math.cos(this.pitch)}
  const m=new T.Mesh(new T.IcosahedronGeometry(magic?.1:.055,0),material(hostile?'#ff9366':magic?'#99eaff':'#e3d2aa',true));m.position.set(x+dx*.5,y,z+dz*.5);this.scene.add(m);const speed=hostile?10:22;
  this.bolts.push({mesh:m,vx:dx*speed,vz:dz*speed,vy:dy*speed,life:2.5,damage,hostile,magic,mark});
 }
 hurt(amount:number,source:Enemy|null){
  if(this.p.hp<=0)return;if(this.dodgeTime>0){this.p.perfectDefenses++;this.say('Esquive parfaite');return}
  let d=amount;const front=source?this.forward().x*(source.x-this.p.x)+this.forward().z*(source.z-this.p.z)>0:true;
  if(this.guarding&&front&&this.p.stamina>=12){this.p.stamina-=12;if(this.guardTime<.24){this.p.perfectDefenses++;this.p.mana=Math.min(100,this.p.mana+10);if(source){source.recover=1.6;source.wind=0}this.say('Parade parfaite · +10 mana');this.tone(720,.15);return}d*=.3;this.say('Coup bloqué')}
  d=Math.max(1,Math.round(d*100/(100+this.stats().armor))-(this.p.wardTime>0?3:0));this.p.hp=Math.max(0,this.p.hp-d);this.tone(65,.15);if(this.p.hp===0){this.say('Le serment attend votre retour.');this.pause()}
 }
 heal(){if(this.paused||this.p.potions<1||this.p.hp>=100)return;this.p.potions--;this.p.hp=Math.min(100,this.p.hp+45);this.say('Potion · +45 vie');this.save()}
 prepare(){if(this.paused)return;const next=usePreparation(this.p);if(next!==this.p){this.p=next;this.say('Préparation utilisée');this.save()}}
 craft(id:Preparation){this.p=brew(this.p,id);this.save();this.emit()}
 equip(id:string){if(this.p.gear.includes(id)){this.p.equipped=id;this.save();this.emit()}}
 learn(key:TalentKey){if(canLearnTalent(this.p,key,this.p.talent,this.p.level)){this.p[key]=(this.p[key]||0)+1;this.p.talent--;this.save();this.emit()}}
 contract(id:number,claim=false){if(claim){const r=claimContract(this.p,id);if(r){this.p=r.profile;gainXp(this.p,r.ashes);this.say('Contrat accompli')}}else this.p=acceptContract(this.p,id);this.save();this.emit()}
 interact(){
  if(this.paused||!this.nearest)return;const t=this.nearest,p=this.p;
  if(t.kind==='portal'){this.loadZone(p.zone==='valley'?'crypt':'valley');return}
  if(t.kind==='rest'){p.checkpoint=t.id;p.hp=100;p.mana=100;p.stamina=100;p.potions=Math.max(3,p.potions);this.say('Repos · vie, mana et trois potions restaurés.');this.save();return}
  if(t.kind==='village'){if(finish(p)){this.say('Serment accompli · 100 or et 2 points de talent.')}else this.say(p.finished?'Elenn : « La vallée se souviendra de vous. »':'Elenn : « Le gardien retient nos morts. Rapportez son cœur. »');this.save();return}
  if(t.kind==='lever'){p.gate=true;this.say('Le sceau cède. La grille du gardien se lève.');this.updateMarkers();this.save();return}
  if(t.kind==='herb'){this.p=harvest(p,t.index!);this.say('Récolte ajoutée à l’alchimie.');this.updateMarkers();this.save();return}
  if(p.found.includes(t.id))return;
  if(t.id==='reward'){if(!rewardBoss(p))return;this.say('Sulfuras acquise · retournez auprès d’Elenn.');}
  else if(t.id==='tomb'){p.gear.push('tomb');p.gold+=20;this.say('Reliquaire : Sceau du tombeau et 20 or.');}
  else if(t.kind==='secret'){p.gold+=25;p.potions+=2;this.say('Secret découvert : la cache des passeurs. +25 or, 2 potions.');}
  else{this.say(t.id==='ruin'?'« Sous les pierres, les passeurs cachèrent leur dernier salaire. »':t.id==='lookout'?'« La galerie orientale dominait autrefois les tombeaux. »':'« Lorsque son marteau tombe, ses deux lames se réveillent. »');p.lore|=t.id==='ruin'?1:t.id==='lookout'?2:4;gainXp(p,15)}
  p.found.push(t.id);p.discoveryMask=(1<<Math.min(6,p.found.length))-1;this.updateMarkers();this.save();
 }
 respawn(){const cp=this.p.checkpoint;this.p.hp=100;this.p.mana=100;this.p.stamina=100;this.p.gold=Math.floor(this.p.gold*.9);this.cooldowns=[0,0,0];this.loadZone(cp==='cryptfire'?'crypt':'valley',false);const spot=places[this.p.zone].find(t=>t.id===cp)!;this.p.x=spot.x+1;this.p.z=spot.z+1;this.p.y=ground(this.p.zone,this.p.x,this.p.z);this.save();this.resume()}
 tick(dt:number){
  const p=this.p;this.elapsed+=dt;this.attackCd=Math.max(0,this.attackCd-dt);this.swing=Math.max(0,this.swing-dt);this.dodgeTime=Math.max(0,this.dodgeTime-dt);this.dodgeBurst=Math.max(0,this.dodgeBurst-dt);this.cooldowns=this.cooldowns.map(c=>Math.max(0,c-dt));this.noticeTime-=dt;tickAlchemy(p,dt);
  p.mana=Math.min(100,p.mana+this.stats().manaRegen*dt);p.stamina=Math.min(100,p.stamina+(this.guarding?2:18)*dt);
  for(const t of this.touches.values())if(t.side==='look'&&t.travel<18&&this.elapsed-t.time>.3&&!this.guarding){this.guarding=true;this.guardTime=0}
  if(this.guarding)this.guardTime+=dt;
  let f=(this.keys.has('KeyW')||this.keys.has('KeyZ')||this.keys.has('ArrowUp')?1:0)-(this.keys.has('KeyS')||this.keys.has('ArrowDown')?1:0)-this.stick.y;
  let side=(this.keys.has('KeyD')||this.keys.has('ArrowRight')?1:0)-(this.keys.has('KeyA')||this.keys.has('KeyQ')||this.keys.has('ArrowLeft')?1:0)+this.stick.x;
  const norm=Math.max(1,Math.hypot(f,side));f/=norm;side/=norm;const dir=this.forward();
  if(this.dodgeBurst>0&&f===0&&side===0)f=-1;
  const speed=this.dodgeBurst>0?11:this.guarding?2:4.6;
  moveBody(p.zone,p,(dir.x*f-dir.z*side)*speed*dt,(dir.z*f+dir.x*side)*speed*dt,p.gate);
  this.vy-=16*dt;p.y+=this.vy*dt;const floor=floorAt(p.zone,p.x,p.z,p.y-this.vy*dt);if(p.y<floor){p.y=floor;this.vy=0}
  if(p.zone==='valley'&&Math.abs(p.x)<3&&p.z>-2&&p.z<10&&this.vy>0&&p.y<1.35&&p.y+1.65>1.35){p.y=1.35-1.65;this.vy=0}
  if(p.y<-8){this.p.hp=0;this.pause()}
  const locked=this.enemies.find(e=>e.id===this.locked&&e.hp>0);if(locked&&this.visible(locked)&&Math.hypot(locked.x-p.x,locked.z-p.z)<22){p.yaw=Math.atan2(p.x-locked.x,p.z-locked.z);this.pitch=Math.atan2(locked.y+1.1-(p.y+1.6),Math.hypot(locked.x-p.x,locked.z-p.z))}else this.locked=null;
  for(const e of this.enemies){
   if(e.hp<=0){e.model.root.rotation.z=Math.min(Math.PI/2,e.model.root.rotation.z+dt*2);e.model.root.position.y=e.y-.2;continue}
   e.expose=Math.max(0,e.expose-dt);e.flash=Math.max(0,e.flash-dt);const dot=tickAffliction(e.affliction,dt);if(dot>0){e.hp-=dot;if(e.hp<=0){this.kill(e);continue}}
   if(e.kind==='boss'&&e.hp<=e.max*.5&&e.phase===1){e.phase=2;e.wind=0;e.recover=2;disposeWorld(e.model.weapon);e.model.weapon=makeWeapon('thunder');e.model.weapon.position.set(0,-.5,-.25);e.model.weapon.rotation.x=-.7;e.model.arms[1].add(e.model.weapon);this.say('Le gardien brise son serment · les deux Thunderfury !');this.spark(e.x,e.y+2,e.z,'#75e6ff',24)}
   const dx=p.x-e.x,dz=p.z-e.z,dist=Math.hypot(dx,dz),sees=this.visible(e)&&Math.abs(p.y-e.y)<4;
   e.recover=Math.max(0,e.recover-dt);let moving=false;
   if(e.wind>0){e.wind-=dt;if(e.wind<=0){e.recover=e.kind==='boss'?(e.phase===2?.65:1.3):e.kind==='hound'?.9:1.5;e.flash=.3;
    if(e.kind==='archer')this.shoot(true,18,false,false,e);
    else if(dist<(e.kind==='boss'?3.7:2.25)&&sees)this.hurt(e.kind==='boss'?e.phase===2?27:38:e.kind==='hound'?16:24,e);
    this.spark(e.x,e.y+.2,e.z,e.phase===2?'#73cddd':'#df9863',e.kind==='boss'?14:3);
   }}else if(sees&&dist<(e.kind==='boss'?14:13)){
    const range=e.kind==='archer'?9:e.kind==='boss'?3.1:1.65;
    if(dist>range){let velocity=e.kind==='hound'?3.5:e.kind==='boss'?e.phase===2?2.6:1.6:1.8;if(e.affliction?.kind==='bow'&&e.affliction.remaining>0)velocity*=.75;
     moveBody(p.zone,e,dx/dist*velocity*dt,dz/dist*velocity*dt,p.gate);e.y=ground(p.zone,e.x,e.z);moving=true;
    }else if(e.recover===0){e.wind=e.kind==='boss'?(e.phase===2?.65:1.2):e.kind==='hound'?.5:1;}
   }
   e.model.root.position.set(e.x,e.y,e.z);e.model.root.rotation.y=Math.atan2(-dx,-dz);pose(e.model,this.elapsed,moving,e.wind,e.flash,e.phase);
  }
  for(let i=this.bolts.length-1;i>=0;i--){const b=this.bolts[i],old=b.mesh.position.clone();b.mesh.position.addScaledVector(new T.Vector3(b.vx,b.vy,b.vz),dt);b.life-=dt;const v=b.mesh.position;
   if(!sight(p.zone,old,v,p.gate)||v.y<ground(p.zone,v.x,v.z))b.life=0;
   if(b.life>0&&b.hostile&&Math.hypot(v.x-p.x,v.z-p.z)<.5&&Math.abs(v.y-(p.y+1))<.9){this.hurt(b.damage,null);b.life=0}
   if(b.life>0&&!b.hostile)for(const e of this.enemies)if(e.hp>0&&Math.hypot(v.x-e.x,v.z-e.z)<(e.kind==='boss'?1:.55)&&Math.abs(v.y-(e.y+1))<(e.kind==='boss'?2:1)){this.hit(e,b.damage,b.magic,b.mark);b.life=0;break}
   if(b.life<=0){b.mesh.removeFromParent();b.mesh.geometry.dispose();this.bolts.splice(i,1)}
  }
  for(let i=this.fx.length-1;i>=0;i--){const f=this.fx[i];f.life-=dt;f.mesh.position.y+=f.vy*dt;f.mesh.scale.setScalar(Math.max(.01,f.life/f.max));if(f.life<=0){f.mesh.removeFromParent();f.mesh.geometry.dispose();this.fx.splice(i,1)}}
  this.nearest=places[p.zone].filter(t=>this.world.markers.get(t.id)?.visible).filter(t=>Math.hypot(t.x-p.x,t.z-p.z)<2.5&&Math.abs((t.y??ground(p.zone,t.x,t.z))-p.y)<1.8).sort((a,b)=>Math.hypot(a.x-p.x,a.z-p.z)-Math.hypot(b.x-p.x,b.z-p.z))[0]||null;
  this.hint=this.nearest?this.nearest.name:'';this.saveTime+=dt;if(this.saveTime>6){this.save();this.saveTime=0}
  if(this.sound){this.musicTimer-=dt;if(this.musicTimer<=0){const notes=p.zone==='valley'?[146.83,174.61,220,261.63,293.66]:[110,130.81,164.81,196];this.tone(notes[Math.floor(this.elapsed/3)%notes.length],2.6,.025);this.musicTimer=2.8}}
 }
 spark(x:number,y:number,z:number,color:string,n:number){for(let i=0;i<n&&this.fx.length<48;i++){const m=new T.Mesh(new T.IcosahedronGeometry(.045+Math.random()*.06,0),material(color,true));m.position.set(x+(Math.random()-.5)*.7,y+Math.random()*.5,z+(Math.random()-.5)*.7);this.scene.add(m);this.fx.push({mesh:m,life:.5,max:.5,vy:.5+Math.random()})}}
 tone(freq:number,duration:number,volume=.055){if(!this.sound||!this.audio||!this.audioGain)return;const a=this.audio,o=a.createOscillator(),g=a.createGain();o.type='sine';o.frequency.value=freq;g.gain.setValueAtTime(0,a.currentTime);g.gain.linearRampToValueAtTime(volume,a.currentTime+.02);g.gain.exponentialRampToValueAtTime(.0001,a.currentTime+duration);o.connect(g);g.connect(this.audioGain);o.start();o.stop(a.currentTime+duration+.02);o.onended=()=>{o.disconnect();g.disconnect()}}
 toggleSound(){this.sound=!this.sound;if(this.sound&&!this.audio){this.audio=new AudioContext();this.audioGain=this.audio.createGain();this.audioGain.gain.value=.65;this.audioGain.connect(this.audio.destination)}if(this.sound)this.audio?.resume();else this.audio?.suspend();this.emit()}
 setQuality(q:string){this.quality=q;this.scale=q==='Fluide'?.7:q==='Détaillé'?1.25:1;this.renderer.shadowMap.enabled=q!=='Fluide';this.resize();this.emit()}
 advance(dt:number){if(this.paused)return;let remaining=Math.min(.05,Math.max(0,dt));while(remaining>0){const step=Math.min(1/60,remaining);this.tick(step);remaining-=step;if(this.paused)break}}
 frame=(now:number)=>{
  if(this.disposed)return;this.raf=requestAnimationFrame(this.frame);const realDt=Math.max(0,(now-this.last)/1000),dt=Math.min(.05,realDt);this.last=now;
  this.advance(dt);
  const p=this.p;this.camera.position.set(p.x,p.y+1.62+(!this.paused?Math.sin(this.elapsed*8)*Math.hypot(this.stick.x,this.stick.y)*.025:0),p.z);this.camera.rotation.set(this.pitch,p.yaw,0,'YXZ');
  this.weapon.position.set(.38,-.43-Math.sin(this.swing*10)*.12,-.64);this.weapon.rotation.set(-.2+Math.sin(this.swing*10)*1.3,0,this.guarding?-.8:-.15);
  for(let i=0;i<this.world.birds.length;i++){const b=this.world.birds[i],t=this.elapsed*.12+i*1.3;b.position.set(Math.cos(t)*18,12+i*.4,Math.sin(t)*12-13);b.rotation.y=-t;b.rotation.z=Math.sin(this.elapsed*2+i)*.1}
  this.renderer.render(this.scene,this.camera);this.frames++;this.frameTime+=realDt;if(this.frameTime>1){this.fps=Math.round(this.frames/this.frameTime);this.frames=0;this.frameTime=0}
  this.uiTime+=dt;if(this.uiTime>.12){this.emit();this.uiTime=0}
 };
 emit(){const e=this.enemies.find(e=>e.id===this.locked&&e.hp>0)||this.target(16,.85);this.onSnapshot({p:{...this.p},objective:objective(this.p),hint:this.hint,notice:this.noticeTime>0?this.notice:'',target:e?{name:e.kind==='boss'&&e.phase===2?'Le gardien · Thunderfury':NAMES[e.kind],hp:e.hp,max:e.max,wind:e.wind>0}:null,cooldowns:[...this.cooldowns],fps:this.fps,calls:this.renderer.info.render.calls,paused:this.paused,guard:this.guarding,locked:!!this.locked,sound:this.sound,quality:this.quality,saveError:this.saveError})}
 dispose(){this.save();this.disposed=true;cancelAnimationFrame(this.raf);this.cleanups.forEach(f=>f());this.clearTransient();disposeWorld(this.world.root);this.enemies.forEach(e=>disposeWorld(e.model.root));disposeWorld(this.weapon);disposeMaterials();this.renderer.dispose();this.audio?.close();if(document.pointerLockElement===this.canvas)document.exitPointerLock()}
}
export function loadProgress(){try{const raw=localStorage.getItem(SAVE_KEY);return raw?decode(raw):fresh()}catch{return fresh()}}

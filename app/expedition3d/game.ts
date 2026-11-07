import {ExpeditionAudio,DEFAULT_AUDIO,AUDIO_KEY,decodeAudio,moodFor,type AudioSettings,type SoundEvent} from './audio.ts';
import {combatMessage,advanceMessages,type CombatEntry} from './combat-feed.ts';
import {TRIALS,startTrial,trialSpawns,advanceTrial,trialForEnemy,type TrialId} from './encounters.ts';
import {PROJECTS,buildProject,villageRest,npcPosition,hearRumor,type ProjectId} from './village.ts';
import {discoverPlaces,findPlace,walkingRoute,type RoutePoint} from './navigation.ts';
import {masteryStats,learnMastery} from './mastery.ts';
import {BOSS_MOVES,nextBossMove,bossMoveHits,weaponPose,type BossMove} from './combat.ts';
import {enemyLoot,relicStats,RELICS,salvage,type RelicId} from './relics.ts';
import {discoverChapter,ringBell,memoryReward} from './chapter.ts';
import {touchSide,isGameSurface,cancelContact,decodePreferences,DEFAULT_PREFERENCES,SETTINGS_KEY,pixelRatio,type Preferences} from './controls.ts';
import {WEAPONS,ARMORS,attackProfile,buildStats,forge,train,respecialize,type WeaponId,type ArmorId} from './arsenal.ts';
import {choose,type NpcId} from './story.ts';
import {hands} from './art.ts';
import * as T from 'three';
import {CLASSES,playerStats,resolveDamage,skillCooldown,type ClassId} from '../rpg.ts';
import {harvest,brew,usePreparation,tickAlchemy,type Preparation} from '../alchemy.ts';
import {applyAffliction,consumeAffliction,tickAffliction,type Affliction} from '../afflictions.ts';
import {acceptContract,claimContract} from '../contracts.ts';
import {canLearnTalent,type TalentKey} from '../talents.ts';
import {buildWorld,actor,pose,makeWeapon,material,disposeWorld,disposeMaterials,type Actor,type WorldView} from './scene.ts';
import {ground,floorAt,ceilingAt,moveBody,sight,canStand,places,spawns,clamp,type Zone,type Place,type EnemyKind} from './world.ts';
import {fresh,decode,SAVE_KEY,GEAR,gainXp,objective,rewardBoss,finish,type Progress} from './progress.ts';
export type Enemy={id:string;kind:EnemyKind;x:number;y:number;z:number;hp:number;max:number;wind:number;recover:number;flash:number;phase:number;model:Actor;affliction?:Affliction;expose:number;home:{x:number;z:number};poise?:number;stun?:number;alert?:number;move?:BossMove;sequence?:number;attackYaw?:number};
export type Snapshot={p:Progress;objective:string;hint:string;notice:string;target:{name:string;hp:number;max:number;wind:boolean;poise:number;move:string}|null;cooldowns:number[];fps:number;calls:number;paused:boolean;guard:boolean;locked:boolean;sound:boolean;quality:string;saveError:string;charge:number;dialogue:NpcId|null;riposte:boolean;preferences:Preferences;frameMs:number;feedback:number;feedbackKind:string;route:RoutePoint[];navigationHint:string;audioSettings:AudioSettings;audioError:string;combatFeed:CombatEntry[]};
type Bolt={mesh:T.Mesh;vx:number;vz:number;vy:number;life:number;damage:number;hostile:boolean;magic:boolean;mark:boolean;poise:number;charged:boolean};
type Hazard={x:number;z:number;y:number;delay:number;radius:number;mesh:T.Mesh};
type Fx={mesh:T.Mesh;life:number;max:number;vy:number};
const NAMES:Record<EnemyKind,string>={sentinel:'Veilleur déchu',archer:'Arbalétrier des brumes',hound:'Traqueur creux',boss:'Le gardien · Sulfuras'};
export class Expedition{
 renderer:T.WebGLRenderer;scene=new T.Scene();camera=new T.PerspectiveCamera(72,1,.06,180);world!:WorldView;weapon:T.Group;enemies:Enemy[]=[];bolts:Bolt[]=[];fx:Fx[]=[];hazards:Hazard[]=[];feedback=0;feedbackKind='hit';swingDuration=.46;
 mixer:ExpeditionAudio|null=null;audioSettings:AudioSettings={...DEFAULT_AUDIO};audioError='';combatFeed:CombatEntry[]=[];combatSerial=0;stepDistance=0;
 navigationRoute:RoutePoint[]=[];navigationHint='';explorationTimer=0;
 preferences:Preferences={...DEFAULT_PREFERENCES};slowFrames=0;frameMs=16.7;
 dialogue:NpcId|null=null;charging=false;charge=0;riposte=0;airUsed=false;airBurst=0;dodgeBonus=0;
 p:Progress;paused=true;mouseFallback=false;keys=new Set<string>();cooldowns=[0,0,0];attackCd=0;swing=0;guardTime=0;guarding=false;dodgeTime=0;dodgeBurst=0;vy=0;pitch=0;locked:string|null=null;
 notice='Bienvenue à Valbrume.';noticeTime=6;hint='';nearest:Place|null=null;fps=60;quality='Équilibré';sound=false;saveError='';
 elapsed=0;last=0;uiTime=0;saveTime=0;raf=0;disposed=false;frames=0;frameTime=0;scale=1;look={x:0,y:0};stick={x:0,y:0};touches=new Map<number,{side:'move'|'look';x:number;y:number;lastX:number;lastY:number;time:number;travel:number}>();
 cleanups:(()=>void)[]=[];onSnapshot:(s:Snapshot)=>void;onPause:()=>void;
 canvas:HTMLCanvasElement;
 constructor(canvas:HTMLCanvasElement,p:Progress,onSnapshot:(s:Snapshot)=>void,onPause:()=>void){
  this.canvas=canvas;try{this.audioSettings=decodeAudio(localStorage.getItem(AUDIO_KEY))}catch{}this.sound=this.audioSettings.enabled;try{this.preferences=decodePreferences(localStorage.getItem(SETTINGS_KEY))}catch{}this.quality=this.preferences.quality;this.scale=this.quality==='Fluide'?.7:this.quality==='Détaillé'?1.25:1;this.p=p;this.onSnapshot=onSnapshot;this.onPause=onPause;
  this.renderer=new T.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});this.renderer.outputColorSpace=T.SRGBColorSpace;this.renderer.toneMapping=T.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.1;this.renderer.shadowMap.enabled=this.quality!=='Fluide';this.renderer.shadowMap.type=T.PCFSoftShadowMap;
  this.camera.rotation.order='YXZ';this.scene.add(this.camera);this.weapon=makeWeapon(WEAPONS[p.weapon].model);hands(this.weapon,ARMORS[p.armor].color);this.camera.add(this.weapon);this.weapon.position.set(.38,-.45,-.65);this.weapon.scale.setScalar(.55);
  this.loadZone(p.zone,false);this.resize();this.bind();this.frame(0);
 }
 listen(target:EventTarget,name:string,fn:EventListener,options?:AddEventListenerOptions){target.addEventListener(name,fn,options);this.cleanups.push(()=>target.removeEventListener(name,fn,options))}
 bind(){
  const surface=this.canvas.parentElement||this.canvas;
  this.listen(window,'resize',()=>this.resize());
  this.listen(document,'visibilitychange',()=>{if(document.hidden)this.pause()});
  this.listen(window,'blur',()=>this.pause());this.listen(window,'pagehide',()=>this.save());
  this.listen(this.canvas,'webglcontextlost',((e:Event)=>{e.preventDefault();this.say('Le rendu a été interrompu. Rechargez la page pour reprendre.');this.pause()}) as EventListener);
  this.listen(document,'pointerlockchange',()=>{if(document.pointerLockElement!==this.canvas&&!this.paused)this.pause()});
  this.listen(window,'keydown',((ev:KeyboardEvent)=>{
   if(!this.paused&&['Space','Tab','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(ev.code))ev.preventDefault();
   if(!this.paused&&(ev.code==='Escape'||ev.code==='Tab')){this.pause();return}if(this.paused||ev.repeat)return;
   this.keys.add(ev.code);
   if(ev.code==='KeyR')this.startCharge();
   if(ev.code==='Space')this.jump();if(ev.code==='ShiftLeft'||ev.code==='ShiftRight')this.dodge();
   if(ev.code==='KeyE')this.interact();if(ev.code==='KeyF')this.toggleLock();if(ev.code==='KeyH')this.heal();if(ev.code==='KeyX')this.prepare();
   if(['Digit1','Digit2','Digit3'].includes(ev.code))this.skill(Number(ev.code.slice(-1))-1);
  }) as EventListener);
  this.listen(window,'keyup',((e:KeyboardEvent)=>{this.keys.delete(e.code);if(e.code==='KeyR')this.releaseCharge()}) as EventListener);
  this.listen(this.canvas,'contextmenu',(e=>e.preventDefault()));
  this.listen(this.canvas,'auxclick',((e:MouseEvent)=>{if(e.button>=3)e.preventDefault()}) as EventListener);
  this.listen(surface,'pointerdown',((e:PointerEvent)=>{
   if(this.paused||!isGameSurface(e.target))return;e.preventDefault();try{this.canvas.setPointerCapture(e.pointerId)}catch{}
   if(e.pointerType==='mouse'){
    if(e.button>=3){e.preventDefault();return}if(document.pointerLockElement!==this.canvas&&!this.mouseFallback){this.capture();return}
    if(e.button===0)this.startCharge();if(e.button===2){this.guarding=true;this.guardTime=0}if(e.button===1)this.toggleLock();return;
   }
   const rect=this.canvas.getBoundingClientRect(),side=touchSide(e.clientX,rect.left,rect.width);
   if([...this.touches.values()].some(t=>t.side===side))return;
   this.touches.set(e.pointerId,{side,x:e.clientX,y:e.clientY,lastX:e.clientX,lastY:e.clientY,time:this.elapsed,travel:0});
  }) as EventListener);
  this.listen(surface,'pointermove',((e:PointerEvent)=>{
   if(this.paused)return;
   if(e.pointerType==='mouse'&&(document.pointerLockElement===this.canvas||this.mouseFallback&&(e.buttons&1))){this.turn(e.movementX,e.movementY);return}
   const t=this.touches.get(e.pointerId);if(!t)return;const dx=e.clientX-t.lastX,dy=e.clientY-t.lastY;t.travel+=Math.hypot(dx,dy);
   if(t.side==='move'){this.stick.x=clamp((e.clientX-t.x)/55,-1,1);this.stick.y=clamp((e.clientY-t.y)/55,-1,1)}else{this.turn(dx*1.5,dy*1.5);if(t.travel>18)this.guarding=false;}
   t.lastX=e.clientX;t.lastY=e.clientY;
  }) as EventListener);
  const up=((e:PointerEvent)=>{
   if(e.pointerType==='mouse'){if(e.button===0)this.releaseCharge();if(e.button===2)this.guarding=false;return}
   const t=this.touches.get(e.pointerId);if(!t)return;this.touches.delete(e.pointerId);
   if(t.side==='move'){this.stick={x:0,y:0};if(this.elapsed-t.time<.22&&t.travel<14)this.jump()}
   else{const duration=this.elapsed-t.time,dx=e.clientX-t.x,dy=e.clientY-t.y;
    if(this.preferences.gestures&&duration<.32&&Math.hypot(dx,dy)>65){if(dy>Math.abs(dx))this.dodge();else if(-dy>Math.abs(dx))this.skill(0);else this.skill(dx<0?1:2)}
    else if(duration<.28&&t.travel<18)this.attack();this.guarding=false;
   }
  }) as EventListener;
  this.listen(surface,'pointerup',up);const cancel=((e:PointerEvent)=>{const side=cancelContact(this.touches,e.pointerId);if(side==='move')this.stick={x:0,y:0};if(side==='look')this.guarding=false;}) as EventListener;this.listen(surface,'pointercancel',cancel);this.listen(surface,'lostpointercapture',cancel);
  this.listen(window,'mouseup',((e:MouseEvent)=>{if(e.button===0)this.releaseCharge();if(e.button===2)this.guarding=false}) as EventListener);
 }
 turn(dx:number,dy:number){const prefs=this.preferences||DEFAULT_PREFERENCES;if(!this.locked)this.p.yaw-=dx*.0025*prefs.sensitivity;this.pitch=clamp(this.pitch-dy*.0025*prefs.sensitivity*(prefs.invertY?-1:1),-1.25,1.25)}
 resize(){const w=this.canvas.clientWidth||innerWidth,h=this.canvas.clientHeight||innerHeight;this.renderer.setPixelRatio(pixelRatio(w,h,devicePixelRatio,this.scale));this.renderer.setSize(w,h,false);this.camera.aspect=w/h;this.camera.updateProjectionMatrix()}
 capture(){if(!matchMedia('(pointer:fine)').matches)return;if(!this.canvas.requestPointerLock){this.mouseFallback=true;return}try{const request=this.canvas.requestPointerLock();request?.catch(()=>{this.mouseFallback=true;this.say('Capture indisponible : maintenez le clic gauche pour orienter la vue.')})}catch{this.mouseFallback=true}}
 resume(){if(this.p.hp<=0)return;this.touches.clear();this.stick={x:0,y:0};this.keys.clear();this.guarding=false;this.charging=false;this.paused=false;this.last=performance.now();this.capture();this.startAudio();this.emit()}
 pause(){if(this.disposed)return;this.paused=true;this.keys.clear();this.touches.clear();this.stick={x:0,y:0};this.guarding=false;this.charging=false;this.charge=0;this.save();if(document.pointerLockElement===this.canvas)document.exitPointerLock();this.mixer?.pause();this.emit();this.onPause()}
 save(){try{const previous=localStorage.getItem(SAVE_KEY);if(previous){try{decode(previous);localStorage.setItem(SAVE_KEY+'-backup',previous)}catch{}}localStorage.setItem(SAVE_KEY,JSON.stringify(this.p));this.saveError=''}catch{this.saveError='Sauvegarde indisponible : le navigateur refuse le stockage.'}}
 say(s:string){this.notice=s;this.noticeTime=5}
 combat(text:string,kind:CombatEntry['kind']){this.combatFeed=combatMessage(this.combatFeed||[],text,kind,this.combatSerial=(this.combatSerial||0)+1)}
 sfx(event:SoundEvent){this.mixer?.effect(event)}
 newGame(id:ClassId){this.dialogue=null;this.charging=false;this.charge=0;this.riposte=0;this.p=fresh(id);this.camera.remove(this.weapon);disposeWorld(this.weapon);this.weapon=makeWeapon(WEAPONS[this.p.weapon].model);hands(this.weapon,ARMORS[this.p.armor].color);this.camera.add(this.weapon);this.weapon.scale.setScalar(.55);this.cooldowns=[0,0,0];this.loadZone('valley',false);this.save();this.resume()}
 loadZone(zone:Zone,arrival=true,spawn?:{x:number;z:number;yaw?:number}){
  this.clearTransient();if(this.world)disposeWorld(this.world.root);this.enemies.forEach(e=>disposeWorld(e.model.root));this.enemies=[];this.p.zone=zone;this.world=buildWorld(this.scene,zone);
  if(arrival){this.p.x=0;this.p.z=zone==='crypt'?3:zone==='cistern'?7:-44;this.p.y=ground(zone,this.p.x,this.p.z);this.p.yaw=zone==='crypt'?0:Math.PI}
  if(spawn){this.p.x=spawn.x;this.p.z=spawn.z;this.p.y=ground(zone,spawn.x,spawn.z);this.p.yaw=spawn.yaw??0}
  this.vy=0;this.airUsed=false;this.airBurst=0;this.pitch=0;this.locked=null;
  for(const s of [...spawns[zone],...(Object.keys(TRIALS) as TrialId[]).filter(id=>TRIALS[id].zone===zone).flatMap(id=>trialSpawns(this.p,id))])if(!this.p.dead.includes(s.id)){
   const model=actor(s.kind);model.root.position.set(s.x,ground(zone,s.x,s.z),s.z);this.scene.add(model.root);const max=s.id.startsWith('trial-')?(s.kind==='sentinel'?120:s.kind==='archer'?80:65):s.kind==='boss'?500:s.id==='s4'?160:s.kind==='sentinel'?90:s.kind==='archer'?65:55;
   this.enemies.push({...s,y:ground(zone,s.x,s.z),hp:max,max,wind:0,recover:1,flash:0,phase:1,model,expose:0,poise:0,stun:0,alert:0,home:{x:s.x,z:s.z}});
  }
  this.updateMarkers();if(this.p.trackedPlace)this.trackPlace(this.p.trackedPlace,false);this.save();
 }
 updateMarkers(){
  for(const gate of this.world.gates)gate.visible=!this.p.gate;
  if(this.world.village)this.world.village.visible=this.p.heartChoice==='restore';const fire=this.world.root?.getObjectByName('forge-fire');if(fire)fire.visible=this.p.forgeOpen;const ward=this.world.root?.getObjectByName('village-ward');if(ward)ward.visible=this.p.heartChoice==='ward';
  for(const id of Object.keys(PROJECTS)){const obj=this.world.root?.getObjectByName('project-'+id);if(obj)obj.visible=this.p.villageProjects.includes(id)}
  for(const p of places[this.p.zone]){const m=this.world.markers.get(p.id)!;m.visible=p.id==='tovin-home'?this.p.rescue>=2:p.kind==='flight'?!this.p.flight:p.id==='tovin'&&this.p.rescue>=2?false:p.kind==='herb'?!(this.p.harvestMask&(1<<p.index!)):p.id==='reward'?this.p.dead.includes('boss')&&!this.p.bossLoot:!this.p.found.includes(p.id)||['rest','portal','village','lever','npc','shortcut','bell','inscription','challenge'].includes(p.kind)}
 }
 clearTransient(){this.combatFeed=[];this.stepDistance=0;for(const h of this.hazards||[]){h.mesh.removeFromParent();h.mesh.geometry.dispose()}this.hazards=[];for(const b of this.bolts){b.mesh.removeFromParent();b.mesh.geometry.dispose()}for(const f of this.fx){f.mesh.removeFromParent();f.mesh.geometry.dispose()}this.bolts=[];this.fx=[]}
 stats(){const s=playerStats(this.p.classId,this.p.level,this.p),g=GEAR.find(g=>g.id===this.p.equipped)!;return masteryStats(this.p,relicStats(this.p,buildStats(this.p,{...s,power:s.power+g.power,armor:s.armor+g.armor+(this.p.heartChoice==='ward'?10:0),manaRegen:s.manaRegen+(this.p.heartChoice==='restore'?1:0)})))}
 forward(){return {x:-Math.sin(this.p.yaw),z:-Math.cos(this.p.yaw)}}
 target(range=15,cone=.65){const dir=this.forward();return this.enemies.filter(e=>e.hp>0).filter(e=>{const dx=e.x-this.p.x,dz=e.z-this.p.z,d=Math.hypot(dx,dz);return d<range&&(dx*dir.x+dz*dir.z)/Math.max(.01,d)>cone&&Math.abs(e.y-this.p.y)<3&&this.visible(e)}).sort((a,b)=>Math.hypot(a.x-this.p.x,a.z-this.p.z)-Math.hypot(b.x-this.p.x,b.z-this.p.z))[0]}
 visible(e:Enemy){return sight(this.p.zone,{...this.p,y:this.p.y+1.1},{...e,y:e.y+1.1},this.p.gate)}
 toggleLock(){if(this.locked){this.locked=null;return}const e=this.target(18,.35);if(e)this.locked=e.id;else this.say('Aucune cible visible à verrouiller.')}
 jump(){if(this.paused)return;if(this.p.y<=floorAt(this.p.zone,this.p.x,this.p.z,this.p.y)+.08){this.vy=6;this.airUsed=false;this.tone(180,.1)}else if(this.p.flight&&!this.airUsed){this.airUsed=true;if(this.p.relic==='tide')this.p.stamina=Math.min(100,this.p.stamina+15);this.vy=7.6;this.airBurst=.45;this.spark(this.p.x,this.p.y+.1,this.p.z,'#99e6e1',12);this.say('Souffle des passeurs');this.tone(520,.25)}}
 dodge(){const cost=(this.p.discipline==='strider'&&this.p.disciplineRank>=1?18:24)-(this.p.mastery==='feather'?8:0);if(this.paused||this.p.stamina<cost||this.dodgeTime>0)return;this.p.stamina-=cost;this.dodgeTime=.28;this.dodgeBurst=.22;this.dodgeBonus=this.p.discipline==='strider'&&this.p.disciplineRank>=3||this.p.relic==='fang'?3:0;this.tone(100,.1)}
 startCharge(){if(this.paused||this.attackCd>0)return;this.charging=true;this.charge=0}
 releaseCharge(){if(!this.charging)return;const charge=this.charge;this.charging=false;this.charge=0;this.attack(charge)}
 attack(charge=0){
  const p=this.p,profile=attackProfile(p,charge,(this.riposte||0)>0);
  if(p.mastery==='tempo'&&!profile.full)profile.recovery*=.8;if(p.mastery==='patient'&&profile.full){profile.damage*=1.25;profile.recovery*=1.2}if(p.mastery==='risk'&&p.hp<40)profile.damage*=1.35;
  if(this.paused||this.attackCd>0||p.stamina<profile.stamina)return;p.stamina-=profile.stamina;this.attackCd=profile.recovery;this.swing=profile.recovery;this.swingDuration=profile.recovery;this.sfx(p.weapon==='hammer'||p.weapon==='ember'?'heavy':p.weapon==='bow'?'bow':p.weapon==='catalyst'||p.weapon==='thunder'?'magic':'blade');
  let damage=profile.damage+(p.oilTime>0?5:0);if(p.relic==='fang'&&this.dodgeBonus>0)damage*=1.2;if(this.dodgeBonus>0){if(p.discipline==='strider'&&p.disciplineRank>=3)damage*=1.5;this.dodgeBonus=0}
  if(profile.full&&p.discipline==='butcher'&&p.disciplineRank>=3&&p.hp<50)damage*=1.4;
  if(this.riposte>0&&p.discipline==='bloodguard'&&p.disciplineRank>=3)damage*=1.75;
  if(this.riposte>0&&p.discipline==='duelist'&&p.disciplineRank>=3)p.stamina=Math.min(100,p.stamina+20);this.riposte=0;
  if(profile.ranged)this.shoot(false,damage,profile.magic,profile.full&&p.weapon==='catalyst',undefined,profile.poise,profile.full);
  else{
   const target=this.target(profile.reach,profile.cone);let hits=target?[target]:[];
   if(profile.full&&['hammer','ember'].includes(p.weapon))hits=this.enemies.filter(e=>e.hp>0&&Math.hypot(e.x-p.x,e.z-p.z)<profile.reach+.7&&this.visible(e));
   for(const e of hits)this.hit(e,damage,profile.magic,p.weapon==='ember'&&profile.full,profile.poise,profile.full);
   if(p.weapon==='thunder'&&profile.full&&target){const chain=this.enemies.find(e=>e!==target&&e.hp>0&&Math.hypot(e.x-target.x,e.z-target.z)<5&&this.visible(e));if(chain)this.hit(chain,damage*.55,true,false,20)}
  }
 }
 skill(index:number){
  if(this.paused)return;const sk=CLASSES[this.p.classId].skills[index];if(!sk||this.cooldowns[index]>0)return;const manaCost=sk.cost*(this.p.mastery==='well'?.9:1);if(this.p.mana<manaCost){this.say('Mana insuffisant.');return}
  this.swingDuration=.45;this.p.mana-=manaCost;if(sk.heal&&this.p.mastery==='mercy')this.p.mana=Math.min(100,this.p.mana+15);this.cooldowns[index]=skillCooldown(sk,this.stats());this.swing=.45;
  if(sk.heal)this.p.hp=Math.min(100,this.p.hp+sk.heal*(this.p.discipline==='hymn'&&this.p.disciplineRank>=3?1.5:1));if(sk.cost>0&&this.p.discipline==='prism'&&this.p.disciplineRank>=3)this.p.hp=Math.min(100,this.p.hp+5);if(sk.heal||sk.guard)this.p.stamina=Math.min(100,this.p.stamina+35);
  if(sk.guard){this.dodgeTime=Math.max(this.dodgeTime,sk.guard);this.spark(this.p.x,this.p.y+1,this.p.z,'#a4e2e1',8)}
  if(sk.damage>0){if(this.p.relic==='ember')this.p.hp=Math.min(100,this.p.hp+3);if(sk.range>6)this.shoot(false,sk.damage,sk.magic,true);else for(const e of this.enemies)if(e.hp>0&&Math.hypot(e.x-this.p.x,e.z-this.p.z)<sk.range&&this.visible(e))this.hit(e,sk.damage,sk.magic,true)}
  this.combat(sk.name,'skill');this.sfx(sk.heal?'heal':'magic');
 }
 hit(e:Enemy,base:number,magic:boolean,mark:boolean,poise=0,charged=false){
  if(e.hp<=0)return;if(mark&&this.p.mastery==='resonance')poise+=20;const wasMarked=(e.affliction?.remaining||0)>0;const consumed=mark?{bonus:0,heal:0,mana:0,label:''}:consumeAffliction(e.affliction,this.p.classId);
  const stats=this.stats();if(charged&&(this.p.weapon==='spear'||this.p.discipline==='marksman'&&this.p.disciplineRank>=3))stats.armorPen+=20;if(this.p.discipline==='doom'&&this.p.disciplineRank>=3&&wasMarked)base*=1.3;const protectedByAlly=this.enemies.some(a=>a!==e&&a.hp>0&&a.kind==='sentinel'&&Math.hypot(a.x-e.x,a.z-e.z)<4);
  const damage=resolveDamage(base+consumed.bonus,stats,{armor:(e.kind==='boss'?20:10)+(protectedByAlly?10:0),magicResist:e.kind==='archer'?20:8},magic,Math.random(),e.expose>0);
  this.feedback=.18;this.feedbackKind=damage.critical?'critical':'hit';const dealt=Math.min(e.hp,damage.amount);e.hp-=damage.amount;e.flash=.18;this.p.hp=Math.min(100,this.p.hp+consumed.heal+dealt*this.stats().lifeSteal);this.p.mana=Math.min(100,this.p.mana+consumed.mana);
  if(consumed.label&&this.p.mastery==='echo')this.riposte=Math.max(this.riposte||0,2);
  if(consumed.label&&this.p.relic==='lantern')this.p.mana=Math.min(100,this.p.mana+8);
  if(this.p.affix==='siphon')this.p.mana=Math.min(100,this.p.mana+4);
  if(consumed.label&&this.p.discipline==='soul'&&this.p.disciplineRank>=2)this.p.hp=Math.min(100,this.p.hp+8);
  if(consumed.label&&this.p.discipline==='pyre'&&this.p.disciplineRank>=3)for(const other of this.enemies)if(other!==e&&other.hp>0&&Math.hypot(other.x-e.x,other.z-e.z)<3&&this.visible(other)){other.hp-=12;this.spark(other.x,other.y+1,other.z,'#f6ad6b',4);if(other.hp<=0)this.kill(other)}
  e.poise=(e.poise||0)+poise+(mark&&this.p.discipline==='discord'&&this.p.disciplineRank>=2?25:0);if(e.poise>=(e.kind==='boss'?120:60)){e.poise=0;e.stun=e.kind==='boss'?.9:1.8;e.wind=0;e.recover=e.stun;this.riposte=2;if(this.p.discipline==='discord'&&this.p.disciplineRank>=3)this.p.mana=Math.min(100,this.p.mana+15);this.combat('Posture brisée · riposte !','parry')}
  if(mark){e.affliction=applyAffliction(this.p.classId);e.expose=5;if(['pyre','doom'].includes(this.p.discipline)&&this.p.disciplineRank>=2)e.affliction.remaining+=2;if(this.p.classId==='cantor'){e.wind=0;e.recover=1}}
  this.spark(e.x,e.y+1,e.z,damage.critical?'#ffeec0':magic?'#9ae4ec':'#ffba77',7);this.combat(`${damage.critical?'Critique · ':''}${damage.amount} dégâts${consumed.label?' · '+consumed.label:''}`,damage.critical?'critical':'hit');this.sfx(damage.critical?'critical':'hit');
  if(e.hp<=0)this.kill(e);
 }
 kill(e:Enemy){if(this.p.dead.includes(e.id))return;this.p.dead.push(e.id);this.p.foesDefeated++;if(this.p.mastery==='harvest'){this.p.stamina=Math.min(100,this.p.stamina+20);this.p.hp=Math.min(100,this.p.hp+5)}if(this.p.discipline==='butcher'&&this.p.disciplineRank>=2)this.p.hp=Math.min(100,this.p.hp+10);if(this.p.discipline==='soul'&&this.p.disciplineRank>=3)this.p.mana=Math.min(100,this.p.mana+15);gainXp(this.p,enemyLoot(this.p,e.id,e.kind));this.p.mana=Math.min(100,this.p.mana+8);this.p.potions=Math.min(9,this.p.potions+(this.p.foesDefeated%3===0?1:0));this.locked=null;
  const trial=trialForEnemy(e.id);if(trial&&advanceTrial(this.p,trial)){if(this.p.trials[trial]===3){this.say('Épreuve accomplie · +1 talent, or et minerais');this.updateMarkers()}else{this.spawnTrialWave(trial);this.say('Seconde vague · '+TRIALS[trial].name)}}
  const drop=e.id==='v2'?'spear':e.id==='v3'?'bow':e.id==='c2'?'catalyst':null;if(drop&&!this.p.weapons.includes(drop)){this.p.weapons.push(drop);this.say('Arme trouvée : '+WEAPONS[drop].name)}
  if(this.p.foesDefeated===2&&!this.p.gear.includes('watch')){this.p.gear.push('watch');this.say('Butin : Lame du veilleur · équipez-la dans le sac.')}
  if(e.kind==='boss'){this.p.quest=8;this.say('Le gardien est tombé. Recueillez son cœur.');this.updateMarkers()}
  this.p.campMask=this.p.dead.filter(s=>s[0]==='v').length>=6?3:this.p.dead.filter(s=>s[0]==='v').length>=3?1:0;this.save();
 }
 shoot(hostile:boolean,damage:number,magic:boolean,mark:boolean,enemy?:Enemy,poise=0,charged=false){
  if(this.bolts.length>=32)return;const dir=this.forward();let x=this.p.x,y=this.p.y+1.35,z=this.p.z,dx=dir.x,dz=dir.z,dy=Math.sin(this.pitch);
  if(enemy){x=enemy.x;y=enemy.y+1.4;z=enemy.z;const dist=Math.hypot(this.p.x-x,this.p.z-z);dx=(this.p.x-x)/dist;dz=(this.p.z-z)/dist;dy=(this.p.y+1.1-y)/dist}
  else{dx*=Math.cos(this.pitch);dz*=Math.cos(this.pitch)}
  const m=new T.Mesh(new T.IcosahedronGeometry(magic?.1:.055,0),material(hostile?'#ff9366':magic?'#99eaff':'#e3d2aa',true));m.position.set(x+dx*.5,y,z+dz*.5);this.scene.add(m);const speed=hostile?10:22;
  this.bolts.push({mesh:m,vx:dx*speed,vz:dz*speed,vy:dy*speed,life:2.5,damage,hostile,magic,mark,poise,charged});
 }
 hurt(amount:number,source:Enemy|null,magic=false,origin?:{x:number;z:number}){
  if(this.p.hp<=0)return;if(this.dodgeTime>0){this.p.perfectDefenses++;this.combat('Esquive parfaite','parry');return}
  let d=amount;const from=origin||source;const front=from?this.forward().x*(from.x-this.p.x)+this.forward().z*(from.z-this.p.z)>0:true;
  const guardCost=this.p.mastery==='bulwark'?6:12;if(this.guarding&&front&&this.p.stamina>=guardCost){this.p.stamina-=guardCost;if(this.guardTime<.24){this.p.perfectDefenses++;this.p.mana=Math.min(100,this.p.mana+10);this.riposte=2.5;if(this.p.relic==='bell')this.p.stamina=Math.min(100,this.p.stamina+25);let heal=this.p.affix==='ward'?6:0;if(this.p.discipline==='bastion'&&this.p.disciplineRank>=3)heal+=12;if(this.p.discipline==='hymn'&&this.p.disciplineRank>=2)heal+=10;this.p.hp=Math.min(100,this.p.hp+heal);if(source){source.recover=1.6;source.stun=1.6;source.wind=0}this.feedback=.35;this.feedbackKind='parry';this.combat('Parade parfaite · +10 mana','parry');this.sfx('parry');return}d*=this.p.discipline==='bastion'&&this.p.disciplineRank>=2?.15:.3;this.combat('Coup bloqué','block');this.sfx('block')}
  d=Math.max(1,Math.round(d*100/(100+(magic?this.stats().magicResist:this.stats().armor)))-(this.p.wardTime>0?3:0));this.feedback=.35;this.feedbackKind='hurt';this.p.hp=Math.max(0,this.p.hp-d);if(this.p.discipline==='bloodguard'&&this.p.disciplineRank>=2)this.p.mana=Math.min(100,this.p.mana+8);this.charging=false;this.charge=0;this.combat('−'+d+' vie','hurt');this.sfx('hurt');if(this.p.hp===0){this.say('Le serment attend votre retour.');this.pause()}
 }
 heal(){if(this.paused||this.p.potions<1||this.p.hp>=100)return;this.p.potions--;this.p.hp=Math.min(100,this.p.hp+45);this.combat('Potion · +45 vie','skill');this.sfx('heal');this.save()}
 prepare(){if(this.paused)return;const next=usePreparation(this.p);if(next!==this.p){this.p=next;this.say('Préparation utilisée');this.save()}}
 refreshWeapon(){if(!this.camera)return;disposeWorld(this.weapon);this.weapon=makeWeapon(WEAPONS[this.p.weapon].model);hands(this.weapon,ARMORS[this.p.armor].color);this.camera.add(this.weapon);this.weapon.scale.setScalar(.55)}
 spawnTrialWave(id:TrialId){for(const spawn of trialSpawns(this.p,id)){if(this.enemies.some(e=>e.id===spawn.id&&e.hp>0))continue;const model=actor(spawn.kind),y=ground(this.p.zone,spawn.x,spawn.z),max=spawn.kind==='sentinel'?120:spawn.kind==='archer'?80:65;model.root.position.set(spawn.x,y,spawn.z);this.scene.add(model.root);this.enemies.push({...spawn,y,hp:max,max,wind:0,recover:1.5,flash:0,phase:1,model,expose:0,poise:0,stun:0,alert:6,home:{x:spawn.x,z:spawn.z}})}}
 buildVillage(id:ProjectId){if(buildProject(this.p,id)){this.updateMarkers();this.say(PROJECTS[id].name+' achevé.');this.save();this.emit()}}
 hearRumor(id:string){const r=hearRumor(this.p,id);if(r){this.say(r.text);this.save();this.emit()}}
 trackPlace(id:string,persist=true){if(!id){this.p.trackedPlace='';this.navigationRoute=[];this.navigationHint='';if(persist){this.save();this.emit()}return}const found=findPlace(id);if(!found)return;this.p.trackedPlace=id;let target=found.place;if(found.zone!==this.p.zone){const gateway=this.p.zone==='valley'?(found.zone==='crypt'?'entrance':'cistern'):this.p.zone==='crypt'?(found.zone==='cistern'&&this.p.shortcut?'crypt-cistern':'exit'):found.zone==='crypt'?'cistern-shortcut':'cistern-exit';target=places[this.p.zone].find(t=>t.id===gateway)!}this.navigationRoute=walkingRoute(this.p,target);this.navigationHint=found.place.name+(found.zone!==this.p.zone?' · rejoindre '+target.name:this.navigationRoute.length?' · chemin pédestre':' · accès vertical ou chemin non trouvé');if(persist){this.save();this.emit()}}
 equipRelic(id:RelicId){if(!this.p.relics.includes(id))return;this.p.relic=id;this.save();this.emit()}
 salvageItem(kind:'weapon'|'armor',id:string){if(salvage(this.p,kind,id)){this.say('Équipement recyclé.');this.save();this.emit()}}
 equipWeapon(id:WeaponId){if(!this.p.weapons.includes(id))return;this.p.weapon=id;this.charging=false;this.charge=0;this.refreshWeapon();this.save();this.emit()}
 equipArmor(id:ArmorId){if(!this.p.armors.includes(id))return;this.p.armor=id;this.refreshWeapon();this.save();this.emit()}
 forgeItem(action:'weapon'|'armor'|'upgrade'|'affix',id:string){if(forge(this.p,action,id)){this.refreshWeapon();this.say('Travail de forge terminé.');this.save();this.emit()}}
 trainDiscipline(id:string){if(train(this.p,id)){this.save();this.emit()}}
 learnMastery(id:string){if(learnMastery(this.p,id)){this.save();this.emit()}}
 respec(){if(respecialize(this.p)){if(this.p.mastery){this.p.mastery='';this.p.talent+=2}this.save();this.emit()}}
 chooseDialogue(id:string){if(!this.dialogue)return;if(id.startsWith('rumor-')){this.hearRumor(id.slice(6));return;}if(id==='forge'&&this.p.forgeOpen){this.emit();return}const message=choose(this.p,id);if(message){this.say(message);this.updateMarkers();this.save();this.emit()}}
 craft(id:Preparation){this.p=brew(this.p,id);this.save();this.emit()}
 equip(id:string){if(this.p.gear.includes(id)){this.p.equipped=id;this.save();this.emit()}}
 learn(key:TalentKey){if(canLearnTalent(this.p,key,this.p.talent,this.p.level)){this.p[key]=(this.p[key]||0)+1;this.p.talent--;this.save();this.emit()}}
 contract(id:number,claim=false){if(claim){const r=claimContract(this.p,id);if(r){this.p=r.profile;gainXp(this.p,r.ashes);this.say('Contrat accompli')}}else this.p=acceptContract(this.p,id);this.save();this.emit()}
 interact(){
  if(this.paused||!this.nearest)return;const t=this.nearest,p=this.p;
  if(t.requiresFlight&&!p.flight){this.say('Le souffle des passeurs est nécessaire.');return}
  if(t.kind==='portal'){
   if(t.id==='cistern'){this.loadZone('cistern',true);return}
   if(t.id==='cistern-exit'){this.loadZone('valley',true,{x:26,z:-10,yaw:Math.PI});return}
   if(t.id==='crypt-cistern'){if(!p.shortcut){this.say('Ce passage s’ouvre depuis la citerne.');return}this.loadZone('cistern',true,{x:0,z:-34,yaw:Math.PI});return}
   this.loadZone(p.zone==='valley'?'crypt':'valley');return;
  }
  if(t.kind==='shortcut'){p.shortcut=true;this.loadZone('crypt',true,{x:-14,z:-25,yaw:Math.PI});return}
  if(t.kind==='flight'){p.flight=true;this.say('Souffle acquis : sautez une seconde fois en l’air pour franchir les gouffres.');gainXp(p,35);this.updateMarkers();this.save();return}
  if(t.kind==='npc'||t.kind==='village'){this.dialogue=t.id==='tovin-home'?'tovin':t.id as NpcId;this.pause();return}
  if(t.kind==='challenge'){const id=t.id.slice(6) as TrialId;if(startTrial(p,id)){this.spawnTrialWave(id);this.say('Épreuve commencée · '+TRIALS[id].name);this.save()}else this.say(p.trials[id]===3?'Cette épreuve est accomplie.':'Terminez d’abord l’épreuve en cours.');return}
  if(t.kind==='bell'){this.say(ringBell(p,t.index!));this.tone([196,261.63,329.63][t.index!],.8);this.save();return}
  if(t.kind==='inscription'){this.say(t.id==='memory-shrine'?(memoryReward(p)?'Les trois mémoires deviennent une braise qui ne meurt pas.':(p.lore&7)===7?'La braise vous accompagne.':'Trois voix : le pont brisé, le belvédère, puis le gardien.'): 'Quand la Lune rejoint la Source, le Soleil revient. Trois cloches veillent sur la rive profonde.');this.save();return}
  if(t.kind==='rest'){p.checkpoint=t.id;p.hp=100;p.mana=100;p.stamina=100;p.potions=Math.max(3,p.potions);villageRest(p);this.say('Repos · vie, mana et trois potions restaurés.');this.save();return}
  if(t.kind==='lever'){p.gate=true;this.say('Le sceau cède. La grille du gardien se lève.');this.updateMarkers();this.save();return}
  if(t.kind==='herb'){this.p=harvest(p,t.index!);this.say('Récolte ajoutée à l’alchimie.');this.updateMarkers();this.save();return}
  if(p.found.includes(t.id))return;
  if(t.id==='reward'){if(!rewardBoss(p))return;this.say('Sulfuras acquise · retournez auprès d’Elenn.');}
  else if(t.id==='highrelic'){if(!p.weapons.includes('thunder'))p.weapons.push('thunder');p.ore+=3;this.say('Éclat de Thunderfury : une charge propage la foudre.');}
  else if(t.id==='skycache'){if(!p.armors.includes('vestment'))p.armors.push('vestment');p.gold+=35;this.say('Chasuble des astres et 35 or.');}
  else if(t.id==='orecache'){p.ore+=5;p.gold+=20;this.say('Caisse de minerai · +5 minerais, +20 or.');}
  else if(t.id==='tomb'){p.gear.push('tomb');p.gold+=20;this.say('Reliquaire : Sceau du tombeau et 20 or.');}
  else if(t.kind==='secret'){p.gold+=25;p.potions+=2;this.say('Secret découvert : la cache des passeurs. +25 or, 2 potions.');}
  else{this.say(t.id==='ruin'?'« Sous les pierres, les passeurs cachèrent leur dernier salaire. »':t.id==='lookout'?'« La galerie orientale dominait autrefois les tombeaux. »':'« Lorsque son marteau tombe, ses deux lames se réveillent. »');p.lore|=t.id==='ruin'?1:t.id==='lookout'?2:4;gainXp(p,15)}
  this.sfx('discovery');p.found.push(t.id);p.discoveryMask=(1<<Math.min(6,p.found.length))-1;this.updateMarkers();this.save();
 }
 respawn(){const cp=this.p.checkpoint;this.p.hp=100;this.p.mana=100;this.p.stamina=100;this.p.gold=Math.floor(this.p.gold*.9);this.cooldowns=[0,0,0];this.loadZone(cp==='cryptfire'?'crypt':cp==='cisternfire'?'cistern':'valley',false);const spot=places[this.p.zone].find(t=>t.id===cp)!;this.p.x=spot.x+1;this.p.z=spot.z+1;this.p.y=ground(this.p.zone,this.p.x,this.p.z);this.save();this.resume()}
 tick(dt:number){
  const p=this.p;this.combatFeed=advanceMessages(this.combatFeed||[],dt);const oldX=p.x,oldZ=p.z;this.explorationTimer=(this.explorationTimer||0)+dt;if(this.explorationTimer>1){discoverPlaces(p);this.explorationTimer=0}this.feedback=Math.max(0,(this.feedback||0)-dt);const chapter=discoverChapter(p);if(chapter)this.say(chapter.title+' · '+chapter.text);this.elapsed+=dt;this.riposte=Math.max(0,(this.riposte||0)-dt);this.airBurst=Math.max(0,(this.airBurst||0)-dt);this.dodgeBonus=Math.max(0,(this.dodgeBonus||0)-dt);if(this.charging)this.charge=Math.min(1.2,(this.charge||0)+dt);this.attackCd=Math.max(0,this.attackCd-dt);this.swing=Math.max(0,this.swing-dt);this.dodgeTime=Math.max(0,this.dodgeTime-dt);this.dodgeBurst=Math.max(0,this.dodgeBurst-dt);this.cooldowns=this.cooldowns.map(c=>Math.max(0,c-dt));this.noticeTime-=dt;tickAlchemy(p,dt);
  p.mana=Math.min(100,p.mana+this.stats().manaRegen*dt);p.stamina=Math.min(100,p.stamina+(this.guarding?2:18)*dt);
  for(const t of this.touches.values())if(t.side==='look'&&t.travel<18&&this.elapsed-t.time>.3&&!this.guarding){this.guarding=true;this.guardTime=0}
  if(this.guarding)this.guardTime+=dt;
  let f=(this.keys.has('KeyW')||this.keys.has('KeyZ')||this.keys.has('ArrowUp')?1:0)-(this.keys.has('KeyS')||this.keys.has('ArrowDown')?1:0)-this.stick.y;
  let side=(this.keys.has('KeyD')||this.keys.has('ArrowRight')?1:0)-(this.keys.has('KeyA')||this.keys.has('KeyQ')||this.keys.has('ArrowLeft')?1:0)+this.stick.x;
  const norm=Math.max(1,Math.hypot(f,side));f/=norm;side/=norm;const dir=this.forward();
  if(this.dodgeBurst>0&&f===0&&side===0)f=-1;
  const speed=(this.airBurst>0?12:this.dodgeBurst>0?11:this.guarding||this.charging?2:4.6)*ARMORS[p.armor].speed*(p.discipline==='strider'&&p.disciplineRank>=2?1.1:1);if(this.airBurst>0)f=1;
  moveBody(p.zone,p,(dir.x*f-dir.z*side)*speed*dt,(dir.z*f+dir.x*side)*speed*dt,p.gate);
  const ceiling=ceilingAt(p.zone,p.x,p.z,p.y);this.vy-=16*dt;p.y+=this.vy*dt;if(this.vy>0&&p.y+1.65>ceiling){p.y=ceiling-1.65;this.vy=0}const floor=floorAt(p.zone,p.x,p.z,p.y-this.vy*dt);if(p.y<floor){p.y=floor;this.vy=0;this.airUsed=false}
  if(p.zone==='valley'&&Math.abs(p.x)<3&&p.z>-2&&p.z<10&&this.vy>0&&p.y<1.35&&p.y+1.65>1.35){p.y=1.35-1.65;this.vy=0}
  if(p.y<-8){this.p.hp=0;this.pause()}
  const locked=this.enemies.find(e=>e.id===this.locked&&e.hp>0);if(locked&&this.visible(locked)&&Math.hypot(locked.x-p.x,locked.z-p.z)<22){p.yaw=Math.atan2(p.x-locked.x,p.z-locked.z);this.pitch=Math.atan2(locked.y+1.1-(p.y+1.6),Math.hypot(locked.x-p.x,locked.z-p.z))}else this.locked=null;
  for(const e of this.enemies){
   if(e.hp<=0){e.model.root.rotation.z=Math.min(Math.PI/2,e.model.root.rotation.z+dt*2);e.model.root.position.y=e.y-.2;continue}
   e.poise=Math.max(0,(e.poise||0)-dt*6);e.stun=Math.max(0,(e.stun||0)-dt);e.alert=Math.max(0,(e.alert||0)-dt);
   e.expose=Math.max(0,e.expose-dt);e.flash=Math.max(0,e.flash-dt);const dot=tickAffliction(e.affliction,dt);if(dot>0){e.hp-=dot;if(e.hp<=0){this.kill(e);continue}}
   if(e.kind==='boss'&&e.hp<=e.max*.5&&e.phase===1){e.phase=2;e.wind=0;e.move=undefined;e.sequence=0;e.recover=2;disposeWorld(e.model.weapon);e.model.weapon=makeWeapon('thunder');e.model.weapon.position.set(0,-.5,-.25);e.model.weapon.rotation.x=-.7;e.model.arms[1].add(e.model.weapon);this.say('Le gardien brise son serment · les deux Thunderfury !');this.spark(e.x,e.y+2,e.z,'#75e6ff',24)}
   const dx=p.x-e.x,dz=p.z-e.z,dist=Math.hypot(dx,dz),leashed=Math.hypot(e.x-e.home.x,e.z-e.home.z)>18||p.zone==='valley'&&p.z>14&&e.home.z<14,sees=!leashed&&this.visible(e)&&Math.abs(p.y-e.y)<4;
   if(leashed){e.alert=0;e.wind=0;const hx=e.home.x-e.x,hz=e.home.z-e.z,hd=Math.max(.1,Math.hypot(hx,hz));moveBody(p.zone,e,hx/hd*dt*2,hz/hd*dt*2,p.gate);e.y=floorAt(p.zone,e.x,e.z,e.y);e.model.root.position.set(e.x,e.y,e.z);pose(e.model,this.elapsed,true,0,0,e.phase);continue}
   if(sees&&dist<14){if(!p.seenFoes.includes(e.kind))p.seenFoes.push(e.kind);e.alert=4;for(const ally of this.enemies)if(ally!==e&&ally.hp>0&&Math.hypot(ally.x-e.x,ally.z-e.z)<6)ally.alert=Math.max(ally.alert||0,3)}
   e.recover=Math.max(0,e.recover-dt);let moving=false;if((e.stun||0)>0){pose(e.model,this.elapsed,false,0,0,e.phase);e.model.root.rotation.x=.15;continue}else e.model.root.rotation.x=0;
   if(e.wind>0){e.wind-=dt;if(e.wind<=0){e.recover=e.kind==='boss'&&e.move?BOSS_MOVES[e.move].recover:e.kind==='hound'?.9:1.5;e.flash=.3;
    if(e.kind==='boss'&&e.move){const move=BOSS_MOVES[e.move],facing=-(Math.sin(e.attackYaw||0)*dx+Math.cos(e.attackYaw||0)*dz)/Math.max(.01,dist);if(e.move==='storm'){for(let i=-1;i<=1;i++)this.addHazard(p.x+i*2.4,p.z+i*.7,.75+Math.abs(i)*.2)}else{if(sees&&bossMoveHits(e.move,dist,p.y-e.y,facing))this.hurt(move.damage,e,move.magic);if(e.move==='slam')this.spark(e.x,e.y+.05,e.z,'#ffbb65',20)}}
    else if(e.kind==='archer')this.shoot(true,18,e.id==='s3',false,e);
    else if(dist<2.25&&sees)this.hurt(e.kind==='hound'?16:24,e);
    this.spark(e.x,e.y+.2,e.z,e.phase===2?'#73cddd':'#df9863',e.kind==='boss'?14:3);
   }}else if((sees||e.alert!>0)&&dist<(e.kind==='boss'?14:16)){
    const range=e.kind==='archer'?9:e.kind==='boss'&&e.phase===2&&(e.sequence||0)%3===0?12:e.kind==='boss'?3.1:1.65;
    if(e.kind==='archer'&&dist<5&&dist>.1){moveBody(p.zone,e,-dx/dist*dt*2,-dz/dist*dt*2,p.gate);e.y=floorAt(p.zone,e.x,e.z,e.y);moving=true}
    if(dist>range){let velocity=e.kind==='hound'?3.5:e.kind==='boss'?e.phase===2?2.6:1.6:1.8;if(e.affliction?.kind==='bow'&&e.affliction.remaining>0)velocity*=.75;
     const flank=e.kind==='hound'?Math.sin(this.elapsed+e.home.x)*.65:0;moveBody(p.zone,e,(dx/dist-dz/dist*flank)*velocity*dt,(dz/dist+dx/dist*flank)*velocity*dt,p.gate);e.y=floorAt(p.zone,e.x,e.z,e.y);moving=true;
    }else if(e.recover===0&&sees){if(e.kind==='boss'){e.move=nextBossMove(e.phase,e.sequence||0);e.sequence=(e.sequence||0)+1;e.attackYaw=Math.atan2(-dx,-dz);e.wind=BOSS_MOVES[e.move].wind;this.tone(e.move==='storm'?440:140,.25)}else e.wind=e.kind==='hound'?.5:1;}
   }
   e.model.root.position.set(e.x,e.y,e.z);e.model.root.rotation.y=e.kind==='boss'&&e.wind>0?(e.attackYaw||0):Math.atan2(-dx,-dz);pose(e.model,this.elapsed,moving,e.wind,e.flash,e.phase);
  }
  for(let i=(this.hazards||[]).length-1;i>=0;i--){const h=this.hazards[i];h.delay-=dt;h.mesh.rotation.z+=dt;h.mesh.scale.setScalar(1+Math.sin(this.elapsed*14)*.06);if(h.delay<=0){if(Math.hypot(p.x-h.x,p.z-h.z)<h.radius&&Math.abs(p.y-h.y)<2&&sight(p.zone,{x:h.x,y:h.y+1,z:h.z},{...p,y:p.y+1},p.gate))this.hurt(24,null,true,{x:h.x,z:h.z});this.spark(h.x,h.y+.2,h.z,'#8be9ff',12);h.mesh.removeFromParent();h.mesh.geometry.dispose();this.hazards.splice(i,1)}}
  for(let i=this.bolts.length-1;i>=0;i--){const b=this.bolts[i],old=b.mesh.position.clone();b.mesh.position.addScaledVector(new T.Vector3(b.vx,b.vy,b.vz),dt);b.life-=dt;const v=b.mesh.position;
   if(!sight(p.zone,old,v,p.gate)||v.y<ground(p.zone,v.x,v.z))b.life=0;
   if(b.life>0&&b.hostile&&Math.hypot(v.x-p.x,v.z-p.z)<.5&&Math.abs(v.y-(p.y+1))<.9){this.hurt(b.damage,null,b.magic,{x:p.x-b.vx,z:p.z-b.vz});b.life=0}
   if(b.life>0&&!b.hostile)for(const e of this.enemies)if(e.hp>0&&Math.hypot(v.x-e.x,v.z-e.z)<(e.kind==='boss'?1:.55)&&Math.abs(v.y-(e.y+1))<(e.kind==='boss'?2:1)){this.hit(e,b.damage,b.magic,b.mark,b.poise,b.charged);b.life=0;break}
   if(b.life<=0){b.mesh.removeFromParent();b.mesh.geometry.dispose();this.bolts.splice(i,1)}
  }
  for(let i=this.fx.length-1;i>=0;i--){const f=this.fx[i];f.life-=dt;f.mesh.position.y+=f.vy*dt;f.mesh.scale.setScalar(Math.max(.01,f.life/f.max));if(f.life<=0){f.mesh.removeFromParent();f.mesh.geometry.dispose();this.fx.splice(i,1)}}
  this.nearest=places[p.zone].map(t=>{const m=this.world.markers.get(t.id);return m&&t.kind==='npc'?{...t,x:m.position.x,z:m.position.z}:t}).filter(t=>this.world.markers.get(t.id)?.visible).filter(t=>Math.hypot(t.x-p.x,t.z-p.z)<2.5&&Math.abs((t.y??ground(p.zone,t.x,t.z))-p.y)<1.8).sort((a,b)=>Math.hypot(a.x-p.x,a.z-p.z)-Math.hypot(b.x-p.x,b.z-p.z))[0]||null;
  this.hint=this.nearest?this.nearest.name:'';this.saveTime+=dt;if(this.saveTime>6){this.save();this.saveTime=0}
  if(this.mixer){const battle=this.enemies.some(e=>e.hp>0&&(e.alert||0)>0),boss=this.enemies.some(e=>e.kind==='boss'&&e.hp>0&&(e.alert||0)>0);this.mixer.update(moodFor(p.zone,p.z,battle,boss));if(this.vy===0){this.stepDistance=(this.stepDistance||0)+Math.hypot(p.x-oldX,p.z-oldZ);if(this.stepDistance>1.6){this.stepDistance=0;this.sfx(p.zone!=='valley'?'stone':Math.abs(p.z-4)<3&&p.y<0?'water':'step')}}}
 }
 addHazard(x:number,z:number,delay:number){if(!this.hazards)this.hazards=[];if(this.hazards.length>=9)return;const y=floorAt(this.p.zone,x,z,this.p.y),mesh=new T.Mesh(new T.RingGeometry(1.3,1.5,32),material('#80dfff',true));mesh.rotation.x=-Math.PI/2;mesh.position.set(x,y+.06,z);this.scene.add(mesh);this.hazards.push({x,z,y,delay,radius:1.5,mesh})}
 spark(x:number,y:number,z:number,color:string,n:number){for(let i=0;i<n&&this.fx.length<48;i++){const m=new T.Mesh(new T.IcosahedronGeometry(.045+Math.random()*.06,0),material(color,true));m.position.set(x+(Math.random()-.5)*.7,y+Math.random()*.5,z+(Math.random()-.5)*.7);this.scene.add(m);this.fx.push({mesh:m,life:.5,max:.5,vy:.5+Math.random()})}}
 tone(freq:number,duration:number,volume=.055){this.mixer?.notes([{hz:freq,duration,gain:volume}])}
 startAudio(preview=false){if(!this.audioSettings?.enabled)return;try{if(!this.mixer)this.mixer=new ExpeditionAudio(new AudioContext(),this.audioSettings);void this.mixer.resume().then(()=>{if(this.disposed)return;this.audioError='';if(preview)this.mixer?.effect('parry');this.emit()}).catch(()=>{this.audioError='Audio suspendu : réactivez le son dans Pause.';this.emit()})}catch{this.audioError='Audio indisponible sur ce navigateur.'}}
 setAudio<K extends keyof AudioSettings>(key:K,value:AudioSettings[K]){this.audioSettings=decodeAudio(JSON.stringify({...this.audioSettings,[key]:value}));this.sound=this.audioSettings.enabled;try{localStorage.setItem(AUDIO_KEY,JSON.stringify(this.audioSettings))}catch{}this.mixer?.configure(this.audioSettings);if(!this.sound)this.mixer?.pause();else if(!this.paused)this.startAudio();this.emit()}
 previewAudio(){this.startAudio(true)}
 toggleSound(){this.setAudio('enabled',!this.audioSettings.enabled)}
 setPreference<K extends keyof Preferences>(key:K,value:Preferences[K]){this.preferences=decodePreferences(JSON.stringify({...this.preferences,[key]:value}));try{localStorage.setItem(SETTINGS_KEY,JSON.stringify(this.preferences))}catch{}this.emit()}
 setQuality(q:string,automatic=false){if(!['Fluide','Équilibré','Détaillé'].includes(q))return;this.preferences.quality=q;if(!automatic)this.preferences.autoQuality=false;try{localStorage.setItem(SETTINGS_KEY,JSON.stringify(this.preferences))}catch{}this.quality=q;this.scale=q==='Fluide'?.7:q==='Détaillé'?1.25:1;this.renderer.shadowMap.enabled=q!=='Fluide';this.resize();this.emit()}
 advance(dt:number){if(this.paused)return;let remaining=Math.min(.05,Math.max(0,dt));while(remaining>0){const step=Math.min(1/60,remaining);this.tick(step);remaining-=step;if(this.paused)break}}
 frame=(now:number)=>{
  if(this.disposed)return;this.raf=requestAnimationFrame(this.frame);const realDt=Math.max(0,(now-this.last)/1000),dt=Math.min(.05,realDt);this.last=now;
  this.advance(dt);
  const p=this.p;this.camera.position.set(p.x,p.y+1.62+(!this.paused&&this.preferences.motion?Math.sin(this.elapsed*8)*Math.hypot(this.stick.x,this.stick.y)*.025:0),p.z);this.camera.rotation.set(this.pitch,p.yaw,0,'YXZ');
  const wp=weaponPose(p.weapon,this.swing,this.swingDuration||WEAPONS[p.weapon].recovery,this.charge||0,this.guarding,this.preferences.motion);this.weapon.position.set(wp.x,wp.y,wp.z);this.weapon.rotation.set(wp.rx,wp.ry,wp.rz);
  for(const t of places[p.zone]){const m=this.world.markers.get(t.id);if(m?.userData.npc){const spot=npcPosition(t.id,t.x,t.z,this.elapsed,p),near=Math.hypot(m.position.x-p.x,m.position.z-p.z)<3;pose(m.userData.npc,this.elapsed*.5,!near&&spot.moving,0,0,1);if(near)m.rotation.y=Math.atan2(m.position.x-p.x,m.position.z-p.z);else{m.position.set(spot.x,ground(p.zone,spot.x,spot.z),spot.z);m.rotation.y=Math.sin(this.elapsed*.16)*.4}}}
  for(let i=0;i<this.world.birds.length;i++){const b=this.world.birds[i],t=this.elapsed*.12+i*1.3;b.position.set(Math.cos(t)*18,12+i*.4,Math.sin(t)*12-13);b.rotation.y=-t;b.rotation.z=Math.sin(this.elapsed*2+i)*.1}
  this.renderer.render(this.scene,this.camera);this.frames++;this.frameTime+=realDt;if(this.frameTime>1){this.fps=Math.round(this.frames/this.frameTime);this.frameMs=Math.round(this.frameTime/this.frames*10000)/10;this.slowFrames=!this.paused&&this.fps<42?this.slowFrames+1:0;if(this.preferences.autoQuality&&this.slowFrames>=4&&this.quality!=='Fluide'){this.setQuality(this.quality==='Détaillé'?'Équilibré':'Fluide',true);this.slowFrames=0;this.say('Qualité ajustée pour préserver la fluidité.')}this.frames=0;this.frameTime=0}
  this.uiTime+=dt;if(this.uiTime>.12){this.emit();this.uiTime=0}
 };
 emit(){const e=this.enemies.find(e=>e.id===this.locked&&e.hp>0)||this.target(16,.85);this.onSnapshot({p:{...this.p},objective:objective(this.p),hint:this.hint,notice:this.noticeTime>0?this.notice:'',target:e?{name:e.kind==='boss'&&e.phase===2?'Le gardien · Thunderfury':NAMES[e.kind],hp:e.hp,max:e.max,wind:e.wind>0,poise:e.poise||0,move:e.kind==='boss'&&e.move?BOSS_MOVES[e.move].name:''}:null,cooldowns:[...this.cooldowns],fps:this.fps,calls:this.renderer.info.render.calls,paused:this.paused,guard:this.guarding,locked:!!this.locked,sound:this.sound,quality:this.quality,saveError:this.saveError,charge:this.charge||0,dialogue:this.dialogue,riposte:(this.riposte||0)>0,preferences:{...this.preferences},frameMs:this.frameMs,feedback:this.feedback,feedbackKind:this.feedbackKind,route:[...(this.navigationRoute||[])],navigationHint:this.navigationHint||'',audioSettings:{...this.audioSettings},audioError:this.audioError||'',combatFeed:[...(this.combatFeed||[])]})}
 dispose(){this.save();this.disposed=true;cancelAnimationFrame(this.raf);this.cleanups.forEach(f=>f());this.clearTransient();disposeWorld(this.world.root);this.enemies.forEach(e=>disposeWorld(e.model.root));disposeWorld(this.weapon);disposeMaterials();this.renderer.dispose();this.mixer?.dispose();if(document.pointerLockElement===this.canvas)document.exitPointerLock()}
}
export function loadProgress(){for(const key of [SAVE_KEY,SAVE_KEY+'-backup'])try{const raw=localStorage.getItem(key);if(raw)return decode(raw)}catch{}return fresh()}

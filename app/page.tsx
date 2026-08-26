"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// The canvas raycaster keeps its world data local so the static server bundle stays self-contained.
const PLAINS_MAP = [
  "11111111111111111111",
  "12222200000000022221",
  "12000000000000000021",
  "12000000000000000001",
  "12000000000000000001",
  "10000000000000000001",
  "10000000000000000001",
  "10000000003330000001",
  "10000000003030000001",
  "10000000003330000001",
  "10000000000000000001",
  "10000000000000000001",
  "10000000000000000001",
  "10000000000000000001",
  "10000000000000000001",
  "10000000000000000001",
  "10000000000000000001",
  "10000000000000000021",
  "12222200000000022221",
  "11111111111111111111",
];
const COURT_MAP = [
  "11111111111111111111","10000000000000000001","10000000000000000001","10000000000000000001",
  "10000110000001100001","10000110000001100001","10000000000000000001","10000000000000000001",
  "10000000000000000001","10000000111100000001","10000000100100000001","10000000100100000001",
  "10000000111100000001","10000000000000000001","10000000000000000001","10000000000000000001",
  "10000110000001100001","10000110000001100001","10000000000000000001","11111111111111111111",
];
const HALLS_MAP = [
  "11111111111111111111","10000000000000000001","10000011111111000001","10000010000001000001",
  "10000010000001000001","10000000000000000001","10000111100111100001","10000000000000000001",
  "10000000000000000001","10000000111100000001","10000000100100000001","10000000100100000001",
  "10000000111100000001","10000000000000000001","10000111100111100001","10000000000000000001",
  "10000010000001000001","10000010000001000001","10000000000000000001","11111111111111111111",
];
const DUNGEON_MAP = [
  "11111111111111111111","10000000000000000001","10000111111111100001","10000110000001100001",
  "10000110000001100001","10000000000000000001","10000011100111000001","10000000000000000001",
  "10000010000001000001","10000000000000000001","10000000000000000001","10000000000000000001",
  "10000011100111000001","10000010000001000001","10000010000001000001","10000000000000000001",
  "10000110000001100001","10000110000001100001","10000000000000000001","11111111111111111111",
];
const THRONE_MAP = [
  "11111111111111111111","10000000000000000001","10000011111111000001","10000010000001000001",
  "10000010000000000001","10000010000000000001","10000010000000000001","10000010000000000001",
  "10000010000000000001","10000010000000000001","10000010000000000001","10000010000000000001",
  "10000010000000000001","10000010000000000001","10000010000000000001","10000010000000000001",
  "10000010000001000001","10000011111111000001","10000000000000000001","11111111111111111111",
];
let activeMap = PLAINS_MAP;
function mapForQuest(quest:number){return quest>=14?THRONE_MAP:quest>=12?DUNGEON_MAP:quest>=10?HALLS_MAP:quest>=7?COURT_MAP:PLAINS_MAP}

type Relic = "none"|"iron"|"oak"|"ember";
type CourtBoon = "none"|"ward"|"fury"|"focus";
type Save = { x:number; y:number; a:number; hp:number; mana:number; stamina:number; gold:number; potions:number; arrows:number; spec:"blade"|"bow"|"arcane"; xp:number; talent:number; perkBlade:boolean; perkBow:boolean; perkArcane:boolean; enemyHp:number; quest:number; level:number; reward:number; shrines:number; checkpoint:number; lore:number; relic:Relic; expedition:number; courtBoon:CourtBoon; echoTier:number; echoBest:number };
type Foe = {x:number;y:number;hp:number;alive:boolean;hit:number;cooldown:number;telegraph:number;boss:boolean;name:string;kind:"melee"|"ranged"|"brute";intent?:"sweep"|"crush"|"lunge"|"slam"|"shot";death?:number;strike?:number;impactDone?:boolean;followup?:boolean;guardBroken?:number};
const START: Save = { x:3.5, y:16.5, a:-Math.PI/2, hp:100, mana:80, stamina:100, gold:12, potions:2, arrows:14, spec:"blade", xp:0, talent:0, perkBlade:false, perkBow:false,perkArcane:false,enemyHp:70,quest:0,level:1,reward:0,shrines:0,checkpoint:0,lore:0,relic:"none",expedition:0,courtBoon:"none",echoTier:0,echoBest:0 };
const W = 426, H = 240, FOV = Math.PI / 3;
const SCENERY = [
  {x:4.7,y:13.5,kind:"tree"},{x:6.1,y:15.1,kind:"tree"},{x:8.1,y:16.9,kind:"stone"},
  {x:11.2,y:13.8,kind:"tree"},{x:13.6,y:15.8,kind:"tree"},{x:16.1,y:11.4,kind:"tree"},
  {x:5.4,y:8.3,kind:"tree"},{x:8.1,y:5.1,kind:"stone"},{x:13.6,y:5.7,kind:"tree"},
  {x:15.4,y:7.8,kind:"stone"},{x:10.1,y:12.8,kind:"sign"}
];
const SHRINES = [{x:7.5,y:14.5,name:"Borne du chemin"},{x:15.5,y:10.5,name:"Borne des pins"},{x:8.5,y:5.5,name:"Borne des ruines"}];
const LORE_STONES = [{x:10.1,y:12.8,text:"Ici, les anciens Veilleurs déposaient leurs lames avant de regarder le château noir. Aucun n’est jamais revenu indemne."},{x:5.5,y:8.4,text:"La brume ne cache pas le chemin : elle teste ceux qui veulent l’emprunter. Une garde levée au bon instant vaut cent coups aveugles."},{x:13.7,y:5.7,text:"Quand les trois bornes brûleront d’un même feu, le Gardien se souviendra de son serment. Alors seulement, la route parlera."}];
const CASTLE_GATE = {x:16.5,y:3.5};
const CASTLE_REST = {x:10.5,y:8.8};
type Action = "forward"|"back"|"left"|"right"|"turnLeft"|"turnRight"|"attack"|"spell"|"bow"|"parry"|"dodge"|"potion"|"ability"|"lockOn"|"interact"|"inventory"|"journal"|"save";
type Bindings = Record<Action,string>;
type CombatSound = "ready"|"guard"|"dodge"|"warning"|"heavy"|"sweep"|"lunge"|"slam"|"impact"|"perfect"|"phase"|"victory";
const DEFAULT_BINDINGS: Bindings = {forward:"KeyZ",back:"KeyS",left:"KeyQ",right:"KeyD",turnLeft:"ArrowLeft",turnRight:"ArrowRight",attack:"Mouse0",spell:"Mouse2",bow:"KeyR",parry:"Mouse1",dodge:"ShiftLeft",potion:"Digit1",ability:"KeyF",lockOn:"KeyT",interact:"KeyE",inventory:"KeyI",journal:"KeyJ",save:"KeyP"};
const ACTION_LABELS: Record<Action,string> = {forward:"Avancer",back:"Reculer",left:"Pas à gauche",right:"Pas à droite",turnLeft:"Tourner à gauche",turnRight:"Tourner à droite",attack:"Attaquer",spell:"Lancer la flamme",bow:"Tirer à l’arc",parry:"Parer",dodge:"Esquiver",potion:"Boire une potion",ability:"Pouvoir de voie",lockOn:"Verrouiller la cible",interact:"Interagir",inventory:"Ouvrir le sac",journal:"Ouvrir le journal",save:"Sauvegarder"};
function bindingLabel(value:string){return value.replace("Key","Touche ").replace("Digit","Touche ").replace("Arrow","Flèche ").replace("Mouse0","Clic gauche").replace("Mouse1","Clic molette").replace("Mouse2","Clic droit").replace("Mouse3","Souris 3").replace("Mouse4","Souris 4")}
function shrineCount(mask:number){return [0,1,2].filter(index=>mask&(1<<index)).length}
function allShrinesAwake(mask:number){return (mask&7)===7}
function targetScore(foe:Foe,s:Save){const angle=Math.atan2(foe.y-s.y,foe.x-s.x),diff=Math.abs(Math.atan2(Math.sin(angle-s.a),Math.cos(angle-s.a)));return diff*12+Math.hypot(foe.x-s.x,foe.y-s.y)}
function attackDuration(intent:Foe["intent"]){return intent==="slam"?1.02:intent==="crush"?.82:intent==="lunge"?.34:intent==="shot"?.72:.64}

function wallAt(x:number, y:number) {
  const row = activeMap[Math.floor(y)];
  return !row ? 1 : Number(row[Math.floor(x)] ?? 1);
}

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const horizonRef = useRef<HTMLImageElement|null>(null);
  const guardianRef = useRef<HTMLCanvasElement|null>(null);
  const shadowRef = useRef<HTMLImageElement|null>(null);
  const state = useRef<Save>({...START});
  const keys = useRef<Record<string,boolean>>({});
  const inputPulse = useRef<Record<string,number>>({});
  const cameraPitch = useRef(0);
  const audioRef = useRef<AudioContext|null>(null);
  const audioVolumeRef = useRef(.8);
  const shakeScaleRef = useRef(1);
  const suppressCapturedClick = useRef(false);
  const enemy = useRef<Foe>({x:10.5,y:8.5,hp:70,alive:true,hit:0,cooldown:0,telegraph:0,boss:true,name:"gardien",kind:"brute"});
  const minions = useRef<Foe[]>([
    {x:6.5,y:5.5,hp:34,alive:true,hit:0,cooldown:0,telegraph:0,boss:false,name:"ombre",kind:"melee"},
    {x:14.5,y:13.5,hp:34,alive:true,hit:0,cooldown:0,telegraph:0,boss:false,name:"ombre",kind:"melee"},
  ]);
  const lockedTarget = useRef<Foe|null>(null);
  const reinforcements = useRef(false);
  const attackFx = useRef(0);
  const spellFx = useRef(0);
  const hurtFx = useRef(0);
  const parryFx = useRef(0);
  const perfectFx = useRef(0);
  const perfectImpactFx = useRef(0);
  const perfectDodgeFx = useRef(0);
  const dodgeFx = useRef(0);
  const abilityFx = useRef(0);
  const impactFx = useRef(0);
  const shakeFx = useRef(0);
  const hitStop = useRef(0);
  const staminaDelay = useRef(0);
  const potionFx = useRef(0);
  const pendingPotion = useRef(false);
  const potionStartHp = useRef(100);
  const abilityCd = useRef(0);
  const abilityReadyRef = useRef(true);
  const worldTime = useRef(.24);
  const movement = useRef({forward:0,strafe:0});
  const queuedAttack = useRef<null|boolean>(null);
  const bladeChain = useRef(0);
  const bladeChainTimer = useRef(0);
  const duelRecord = useRef<{perfectParries:number;perfectDodges:number;ripostes:number;executions?:number;bestFocus?:number;hitsTaken:number}>({ perfectParries:0, perfectDodges:0, ripostes:0, executions:0, bestFocus:0, hitsTaken:0 });
  const duelFocus = useRef(0);
  const damagePop = useRef<{value:number;kind:"damage"|"execution"|"hurt";time:number}>({value:0,kind:"damage",time:0});
  const duelTimer = useRef(0);
  const duelFinalTime = useRef(0);
  const defenseRewarded = useRef({ parry:false, dodge:false });
  const defenseTap = useRef<{progress:number;time:number;kind:"parry"|"dodge"}>({progress:0,time:0,kind:"parry"});
  const guardianPosture = useRef(100);
  const guardianBeat = useRef(0);
  const guardianPhase = useRef(1);
  const phaseFx = useRef(0);
  const duelIntroFx = useRef(0);
  const duelIntroShown = useRef(false);
  const staggerFx = useRef(0);
  const pendingCombatSummary = useRef(false);
  const last = useRef(0);
  const hudRefresh = useRef(0);
  const [started,setStarted] = useState(false);
  const [testMode,setTestMode] = useState(false);
  const [guideOpen,setGuideOpen] = useState(true);
  const [combatSummary,setCombatSummary] = useState(false);
  const [endingSeen,setEndingSeen] = useState(false);
  const [panel,setPanel] = useState<"inventory"|"journal"|"controls"|"combat"|"talents"|"pause"|null>(null);
  const [village,setVillage] = useState(false);
  const [choosingSpec,setChoosingSpec] = useState(false);
  const [bindings,setBindings] = useState<Bindings>(DEFAULT_BINDINGS);
  const bindingsRef = useRef<Bindings>(DEFAULT_BINDINGS);
  const [capture,setCapture] = useState<Action|null>(null);
  const [mouseLook,setMouseLook] = useState(false);
  const [locked,setLocked] = useState(false);
  const [sensitivity,setSensitivity] = useState(1);
  const [audioVolume,setAudioVolume] = useState(.8);
  const [shakeScale,setShakeScale] = useState(1);
  const [mistakeCoach,setMistakeCoach] = useState<string|null>(null);
  const [abilityReady,setAbilityReady] = useState(true);
  const sensitivityRef = useRef(1);
  const [hud,setHud] = useState({...START});
  const playCombatSound = useCallback((kind:CombatSound)=>{
    if(typeof window==="undefined"||!window.AudioContext)return;
    const audio=audioRef.current??new window.AudioContext();audioRef.current=audio;
    if(audio.state==="suspended")void audio.resume();
    const now=audio.currentTime,osc=audio.createOscillator(),gain=audio.createGain();
    const profile:Record<CombatSound,[number,OscillatorType,number,number]>={ready:[420,"sine",.06,.025],guard:[185,"triangle",.13,.08],dodge:[360,"sine",.11,.055],warning:[155,"sawtooth",.16,.045],heavy:[78,"sawtooth",.28,.075],sweep:[210,"triangle",.2,.05],lunge:[340,"sawtooth",.13,.055],slam:[62,"square",.38,.08],impact:[96,"square",.1,.08],perfect:[690,"triangle",.25,.1],phase:[58,"sawtooth",.62,.08],victory:[520,"triangle",.72,.09]};
    const [frequency,wave,duration,volume]=profile[kind];osc.type=wave;osc.frequency.setValueAtTime(frequency,now);osc.frequency.exponentialRampToValueAtTime(Math.max(42,frequency*(kind==="victory"?1.65:.72)),now+duration);gain.gain.setValueAtTime(.0001,now);gain.gain.exponentialRampToValueAtTime(Math.max(.0001,volume*audioVolumeRef.current),now+.012);gain.gain.exponentialRampToValueAtTime(.0001,now+duration);osc.connect(gain);gain.connect(audio.destination);osc.start(now);osc.stop(now+duration+.02);
  },[]);
  const lockCursor = useCallback(()=>{
    const canvas=canvasRef.current;
    if(!canvas)return;
    playCombatSound("ready");
    canvas.focus();
    setMouseLook(false);
    const failed=()=>{setMouseLook(false);setMessage("CAPTURE REFUSÉE — cliquez à nouveau dans le jeu pour verrouiller la souris.")};
    if(!canvas.requestPointerLock){failed();return}
    try{const request=canvas.requestPointerLock();if(request instanceof Promise)request.catch(failed)}catch{failed()}
  },[playCombatSound]);
  const [message,setMessage] = useState("Les ruines murmurent votre nom…");

  const sync = useCallback(() => {activeMap=mapForQuest(state.current.quest);setHud({...state.current,shrines:shrineCount(state.current.shrines)})}, []);
  const gainXp = useCallback((amount:number)=>{const s=state.current;s.xp+=amount;while(s.xp>=s.level*40){s.xp-=s.level*40;s.level++;s.talent++;s.hp=100;s.mana=100;s.stamina=100;setMessage(`Niveau ${s.level} atteint — un point de talent disponible !`)}sync()},[sync]);
  useEffect(()=>{lockedTarget.current=null;setLocked(false)},[hud.quest]);
  const applyBindings = useCallback((next:Bindings)=>{bindingsRef.current=next;setBindings(next);localStorage.setItem("cendreval-bindings",JSON.stringify(next))},[]);
  const clearInput = useCallback(()=>{keys.current={};inputPulse.current={};movement.current={forward:0,strafe:0};queuedAttack.current=null},[]);
  const captureMouse = useCallback(()=>{if(started&&!panel&&!village&&!choosingSpec)lockCursor()},[choosingSpec,lockCursor,panel,started,village]);
  const save = useCallback(() => {
    localStorage.setItem("cendreval-save", JSON.stringify(state.current));
    setMessage("Partie sauvegardée");
  }, []);
  const load = useCallback(() => {
    const raw=localStorage.getItem("cendreval-save");
    if(raw){const saved={...START,...JSON.parse(raw)};state.current=saved;if(saved.quest===3){enemy.current={x:10.5,y:8.5,hp:0,alive:false,hit:0,cooldown:0,telegraph:0,boss:true,name:"gardien",kind:"brute"};minions.current=[{x:7.3,y:13.1,hp:42,alive:true,hit:0,cooldown:.7,telegraph:0,boss:false,name:"veilleur archer",kind:"ranged"},{x:13.2,y:10.4,hp:46,alive:true,hit:0,cooldown:1.1,telegraph:0,boss:false,name:"veilleur",kind:"melee"},{x:9.4,y:6.7,hp:52,alive:true,hit:0,cooldown:1.5,telegraph:0,boss:false,name:"veilleur lourd",kind:"brute"}]}else if(saved.quest===5){enemy.current={x:14.4,y:4.7,hp:100,alive:true,hit:0,cooldown:1,telegraph:0,boss:false,name:"sentinelle noire",kind:"brute"};minions.current=[]}else if(saved.quest===7){enemy.current={x:10.5,y:6.8,hp:130,alive:true,hit:0,cooldown:1.2,telegraph:0,boss:false,name:"capitaine noir",kind:"brute"};minions.current=[{x:12.7,y:5.6,hp:48,alive:true,hit:0,cooldown:.5,telegraph:0,boss:false,name:"archer de cour",kind:"ranged"},{x:8.5,y:7.1,hp:54,alive:true,hit:0,cooldown:1,telegraph:0,boss:false,name:"garde noir",kind:"melee"}]}else if(saved.quest===10){enemy.current={x:10.5,y:5.8,hp:150,alive:true,hit:0,cooldown:1.1,telegraph:0,boss:false,name:"maître d’armes",kind:"brute"};minions.current=[{x:6.7,y:7.2,hp:55,alive:true,hit:0,cooldown:.5,telegraph:0,boss:false,name:"tireur de braise",kind:"ranged"},{x:14.2,y:7.1,hp:60,alive:true,hit:0,cooldown:.8,telegraph:0,boss:false,name:"lame noire",kind:"melee"},{x:10.4,y:10.4,hp:60,alive:true,hit:0,cooldown:1.3,telegraph:0,boss:false,name:"lame noire",kind:"melee"}]}else if(saved.quest===12){enemy.current={x:10.5,y:5.2,hp:180,alive:true,hit:0,cooldown:1,telegraph:0,boss:false,name:"maréchal de cendre",kind:"brute"};minions.current=[{x:6.4,y:7.3,hp:64,alive:true,hit:0,cooldown:.5,telegraph:0,boss:false,name:"arbalétrier noir",kind:"ranged"},{x:14.5,y:7.4,hp:64,alive:true,hit:0,cooldown:.7,telegraph:0,boss:false,name:"arbalétrier noir",kind:"ranged"},{x:10.5,y:10.2,hp:72,alive:true,hit:0,cooldown:1.1,telegraph:0,boss:false,name:"gardien de braise",kind:"brute"}]}else if(saved.quest===14){enemy.current={x:10.5,y:4.7,hp:240,alive:true,hit:0,cooldown:.8,telegraph:0,boss:false,name:"roi de cendre",kind:"brute"};minions.current=[{x:7.1,y:8.2,hp:72,alive:true,hit:0,cooldown:.4,telegraph:0,boss:false,name:"héraut du trône",kind:"ranged"},{x:13.9,y:8.2,hp:72,alive:true,hit:0,cooldown:.7,telegraph:0,boss:false,name:"héraut du trône",kind:"ranged"},{x:10.5,y:9.9,hp:84,alive:true,hit:0,cooldown:1.1,telegraph:0,boss:false,name:"garde du trône",kind:"brute"}]}else if(saved.quest>=6){enemy.current={x:10.5,y:8.5,hp:0,alive:false,hit:0,cooldown:0,telegraph:0,boss:true,name:"gardien",kind:"brute"};minions.current=[]}else{enemy.current.hp=saved.enemyHp;enemy.current.alive=saved.enemyHp>0}sync();setMessage("Sauvegarde chargée");}lockCursor();
    setStarted(true);
  },[lockCursor,sync]);

  useEffect(()=>{if(!started||state.current.quest!==16||enemy.current.alive)return;const s=state.current,tier=Math.max(1,s.echoTier);enemy.current={x:10.5,y:4.7,hp:96+tier*28,alive:true,hit:0,cooldown:.7,telegraph:0,boss:false,name:`écho royal ${tier}`,kind:"brute"};minions.current=[{x:7.1,y:8.2,hp:42+tier*10,alive:true,hit:0,cooldown:.4,telegraph:0,boss:false,name:"écho archer",kind:"ranged"},{x:13.9,y:8.2,hp:42+tier*10,alive:true,hit:0,cooldown:.7,telegraph:0,boss:false,name:"écho archer",kind:"ranged"},{x:10.5,y:9.9,hp:52+tier*11,alive:true,hit:0,cooldown:1.1,telegraph:0,boss:false,name:"écho lourd",kind:"brute"}];sync();setMessage(`ÉCHO DE CENDRE · PALIER ${tier} — reprise de l’affrontement.`)},[started,sync]);

  const strike = useCallback((spell=false) => {
    if(panel||potionFx.current>0||staggerFx.current>0) return;
    if(!spell&&attackFx.current>.09){queuedAttack.current=false;return}
    const s=state.current;
    if(!spell&&s.stamina<10){setMessage("TROP ÉPUISÉ — reprenez votre souffle avant de frapper.");return}
    if(spell && s.mana<15){setMessage("Pas assez de mana");return;}
    if(spell){s.mana-=15;spellFx.current=.35}else{s.stamina-=10;staminaDelay.current=.62;attackFx.current=.28}
    const candidates=[enemy.current,...minions.current].filter(e=>e.alive).sort((a,b)=>targetScore(a,s)-targetScore(b,s));
    const e=lockedTarget.current?.alive?lockedTarget.current:candidates[0]; if(!e){setMessage("La crypte est silencieuse.");sync();return}
    if(e.boss&&s.shrines!==7){setMessage("Le sceau des trois bornes protège encore le gardien.");sync();return}
    const d=Math.hypot(e.x-s.x,e.y-s.y);
    const target=Math.atan2(e.y-s.y,e.x-s.x);
    const diff=Math.abs(Math.atan2(Math.sin(target-s.a),Math.cos(target-s.a)));
    if(e.alive && d<(spell?7:1.65) && diff<.32){
      const boon=s.courtBoon==="fury"?4:0;const opening=e.hit>.42,execution=Boolean(e.boss&&e.guardBroken),riposte=!spell&&opening,arcaneBurst=spell&&opening,focusStrike=duelFocus.current>=3;let guardBroken=false;if(!spell){bladeChain.current=bladeChainTimer.current>0?Math.min(3,bladeChain.current+1):1;bladeChainTimer.current=1.05}else bladeChain.current=0;const chainBonus=!spell&&!riposte?(bladeChain.current-1)*3:0;const base=(spell?28+(s.perkArcane?12:0)+(s.relic==="ember"?8:0)+boon+(arcaneBurst?10:0):22+(s.perkBlade?8:0)+(s.relic==="iron"?6:0)+boon+(riposte?14:0)+chainBonus)+(execution?18:0)+(focusStrike?10:0);if(focusStrike){duelFocus.current=0;s.stamina=Math.min(100,s.stamina+18)}e.hp=Math.max(0,e.hp-base);e.hit=execution?.72:arcaneBurst?.52:.18;damagePop.current={value:base,kind:execution?"execution":"damage",time:.72};if(execution){duelRecord.current.executions=(duelRecord.current.executions??0)+1;e.guardBroken=0;hitStop.current=.13;impactFx.current=.46;shakeFx.current=7;playCombatSound("perfect")}
      if(!execution){hitStop.current=riposte?.095:arcaneBurst?.08:spell?.045:.032;impactFx.current=riposte?.34:arcaneBurst?.32:spell?.26:.19;shakeFx.current=riposte?5:arcaneBurst?4:spell?3:2}if(e.boss){s.enemyHp=e.hp;guardianPosture.current=Math.max(0,guardianPosture.current-(riposte?100:arcaneBurst?24:spell?6:6+bladeChain.current*3));if(guardianPosture.current===0){guardBroken=true;e.guardBroken=1.45;e.hit=.95;e.cooldown=2.1;guardianPosture.current=100;perfectImpactFx.current=.52;setMessage("GARDE BRISÉE — le Gardien chancelle : ripostez sans attendre !")}}
      if(e.hp===0){e.alive=false;e.death=.62;queuedAttack.current=null;s.gold+=e.boss?18:6;gainXp(e.boss?40:16);if(e.boss){s.quest=1;pendingCombatSummary.current=true;setMessage("Le gardien tombe. Valbrume vous attend !")}else setMessage("L’ombre se dissipe en cendres.");}
      else {if(riposte)duelRecord.current.ripostes++;if(!guardBroken)setMessage(focusStrike?"SANG-FROID LIBÉRÉ — +10 dégâts et endurance restaurée !":execution?"EXÉCUTION DU SCEAU — la garde brisée cède sous votre coup !":riposte?"RIPOSTE — votre lame frappe dans l’ouverture !":arcaneBurst?"FLAMME AMPLIFIÉE — la braise consume l’ouverture !":spell?"La flamme dévore le gardien !":bladeChain.current===3?"TROISIÈME FRAPPE — l’enchaînement atteint son sommet !":bladeChain.current===2?"DEUXIÈME FRAPPE — gardez le rythme.":"Votre lame mord la pierre vive !");}
    }else if(e.alive){if(!spell)bladeChain.current=0;setMessage(spell?"La flamme se dissipe hors de portée.":"Votre lame ne trouve que le vent.");}
    sync();
  },[gainXp,panel,playCombatSound,sync]);

  const shootBow = useCallback(()=>{
    if(panel||potionFx.current>0)return;
    const s=state.current;
    if(!s.arrows){setMessage("Plus de flèches.");return}
    if(s.stamina<6){setMessage("TROP ÉPUISÉ — impossible de stabiliser l’arc.");return}
    const foes=[enemy.current,...minions.current].filter(e=>e.alive).sort((a,b)=>targetScore(a,s)-targetScore(b,s));
    const e=lockedTarget.current?.alive?lockedTarget.current:foes[0];
    if(e?.boss&&!allShrinesAwake(s.shrines)){setMessage("Le sceau des trois bornes dévie votre flèche.");sync();return}
    s.arrows--;s.stamina-=6;staminaDelay.current=.48;attackFx.current=.28;
    if(e){
      const dist=Math.hypot(e.x-s.x,e.y-s.y),target=Math.atan2(e.y-s.y,e.x-s.x),diff=Math.abs(Math.atan2(Math.sin(target-s.a),Math.cos(target-s.a)));
      if(dist<10&&diff<.18){
        const opening=e.hit>.42,focusStrike=duelFocus.current>=3,damage=30+(s.perkBow?12:0)+(s.relic==="oak"?8:0)+(s.courtBoon==="fury"?4:0)+(opening?10:0)+(focusStrike?10:0);
        if(focusStrike){duelFocus.current=0;s.stamina=Math.min(100,s.stamina+18)}
        e.hp=Math.max(0,e.hp-damage);e.hit=opening?.58:.22;damagePop.current={value:damage,kind:"damage",time:.72};hitStop.current=opening?.075:.035;impactFx.current=opening?.32:.2;shakeFx.current=opening?4:2;
        if(e.boss){s.enemyHp=e.hp;guardianPosture.current=Math.max(0,guardianPosture.current-(opening?30:10))}
        if(!e.hp){e.alive=false;e.death=.62;s.gold+=e.boss?18:6;gainXp(e.boss?40:16);if(e.boss){s.quest=1;pendingCombatSummary.current=true;setMessage("TRAIT FINAL — le Gardien s’effondre dans les cendres.")}else setMessage("Le trait dissipe l’ombre.")}
        else setMessage(focusStrike?"SANG-FROID LIBÉRÉ — le trait renforcé transperce la garde !":opening?"TIR D’OPPORTUNITÉ — la flèche transperce l’ouverture !":"FLÈCHE PRÉCISE — impact confirmé.");
      }else setMessage("La flèche se perd hors de l’axe.");
    }else setMessage("Aucune cible pour ce trait.");
    sync();
  },[gainXp,panel,sync]);
  const primaryAttack=useCallback(()=>{const spec=state.current.spec;if(spec==="bow")shootBow();else strike(spec==="arcane")},[shootBow,strike]);

  const parry = useCallback(()=>{const s=state.current;if(panel||potionFx.current>0||staggerFx.current>0)return;if(attackFx.current>.09||spellFx.current>.08){setMessage("ACTION ENGAGÉE — terminez votre attaque avant de lever la garde.");return}if(dodgeFx.current>0)return;if(s.stamina<10){setMessage("Endurance insuffisante pour parer.");return}const foe=enemy.current;if(foe.telegraph>0)defenseTap.current={progress:100-Math.max(0,Math.min(100,foe.telegraph/attackDuration(foe.intent)*100)),time:.82,kind:"parry"};s.stamina-=10;staminaDelay.current=.82;parryFx.current=.46;perfectFx.current=.13;playCombatSound("guard");sync();setMessage("Parade — frappez au moment de l’impact pour une parade parfaite.")},[panel,playCombatSound,sync]);
  const dodge = useCallback(()=>{const s=state.current;if(panel||potionFx.current>0||staggerFx.current>0)return;if(attackFx.current>.09||spellFx.current>.08){setMessage("ACTION ENGAGÉE — impossible d’annuler cette frappe.");return}if(parryFx.current>.18){setMessage("GARDE ENGAGÉE — relâchez-la avant d’esquiver.");return}if(s.stamina<24){setMessage("Endurance insuffisante pour esquiver.");return}const foe=enemy.current;if(foe.telegraph>0)defenseTap.current={progress:100-Math.max(0,Math.min(100,foe.telegraph/attackDuration(foe.intent)*100)),time:.82,kind:"dodge"};s.stamina-=24;staminaDelay.current=1.05;dodgeFx.current=.34;playCombatSound("dodge");const side=(keys.current[bindingsRef.current.left]?-1:0)+(keys.current[bindingsRef.current.right]?1:0);const angle=s.a+(side?side*Math.PI/2:Math.PI);const nx=s.x+Math.cos(angle)*.9,ny=s.y+Math.sin(angle)*.9;if(!wallAt(nx,s.y))s.x=nx;if(!wallAt(s.x,ny))s.y=ny;sync();setMessage(side?"Esquive latérale !":"Esquive arrière !")},[panel,playCombatSound,sync]);
  const ability=useCallback(()=>{
    const s=state.current;if(panel||potionFx.current>0||s.hp<=0)return;
    if(abilityCd.current>0){setMessage("Le pouvoir de votre voie se recharge.");return}
    abilityCd.current=s.courtBoon==="focus"?6.5:9;abilityReadyRef.current=false;setAbilityReady(false);abilityFx.current=.7;
    const foes=[enemy.current,...minions.current].filter(foe=>foe.alive&&(!foe.boss||allShrinesAwake(s.shrines))),boon=s.courtBoon==="fury"?4:0;
    let struck=0;
    if(s.spec==="blade"){
      s.stamina=100;parryFx.current=s.relic==="iron"?1.35:1.05;perfectFx.current=s.relic==="iron"?.52:.38;
      for(const foe of foes){if(Math.hypot(foe.x-s.x,foe.y-s.y)<(s.relic==="iron"?2.8:2.1)){foe.hit=.8;foe.cooldown=1.9;struck++}}
      setMessage(s.relic==="iron"?"GARDE DU FER — le Cœur de fer étend votre riposte.":"GARDE DU FER — vos parades brisent l’élan adverse.");
    }else if(s.spec==="bow"){
      for(const foe of foes){const target=Math.atan2(foe.y-s.y,foe.x-s.x),diff=Math.abs(Math.atan2(Math.sin(target-s.a),Math.cos(target-s.a)));if(diff<.32&&Math.hypot(foe.x-s.x,foe.y-s.y)<11){foe.hp=Math.max(0,foe.hp-20-(s.perkBow?8:0)-(s.relic==="oak"?6:0)-boon);foe.hit=.45;if(foe.boss)s.enemyHp=foe.hp;struck++}}
      setMessage(struck?"VOLÉE DU RÔDEUR — les traits fendent l’air.":"Volée perdue : aucune cible devant vous.");
    }else{
      if(s.mana<25){abilityCd.current=0;abilityFx.current=0;abilityReadyRef.current=true;setAbilityReady(true);setMessage("Pas assez de mana pour les braises profondes.");return}
      s.mana-=25;for(const foe of foes){if(Math.hypot(foe.x-s.x,foe.y-s.y)<5.2){foe.hp=Math.max(0,foe.hp-24-(s.perkArcane?8:0)-(s.relic==="ember"?8:0)-boon);foe.hit=.55;if(foe.boss)s.enemyHp=foe.hp;struck++}}
      setMessage(struck?"BRAISES PROFONDES — la plaine s’embrase autour de vous.":"Les braises se dissipent dans le vent.");
    }
    if(struck){impactFx.current=.3;shakeFx.current=s.spec==="blade"?2:4}
    for(const foe of foes){if(foe.hp===0&&foe.alive){foe.alive=false;foe.death=.62;s.gold+=foe.boss?18:6;gainXp(foe.boss?40:16);if(foe.boss){s.quest=1;pendingCombatSummary.current=true;setMessage("POUVOIR DÉCISIF — le Gardien tombe. Valbrume vous attend !")}}}
    sync();
  },[gainXp,panel,sync]);
  const interact=useCallback(()=>{if(panel||village)return;const s=state.current;const atRest=s.quest>=7&&Math.hypot(CASTLE_REST.x-s.x,CASTLE_REST.y-s.y)<1.75;if(atRest){s.hp=100;s.mana=100;s.stamina=100;s.potions=Math.max(s.potions,s.quest>=12?5:4);localStorage.setItem("cendreval-save",JSON.stringify(s));sync();setMessage("ANCRAGE DU CHÂTEAU — forces restaurées et progression sauvegardée.");return}const atGate=Math.hypot(CASTLE_GATE.x-s.x,CASTLE_GATE.y-s.y)<1.8;if(s.quest===4&&atGate){beginCastleApproach();return}if(s.quest===6&&atGate){enterCastleCourt();return}const loreIndex=LORE_STONES.findIndex(stone=>Math.hypot(stone.x-s.x,stone.y-s.y)<1.35);if(loreIndex>=0){const flag=1<<loreIndex,stone=LORE_STONES[loreIndex];if(!(s.lore&flag)){s.lore|=flag;s.gold+=2;gainXp(4);localStorage.setItem("cendreval-save",JSON.stringify(s));setMessage(`MÉMOIRE RETROUVÉE · ${stone.text} (+2 or, +4 exp.)`)}else setMessage(stone.text);sync();return}const index=SHRINES.findIndex(shrine=>Math.hypot(shrine.x-s.x,shrine.y-s.y)<1.75);if(index<0){setMessage(s.quest===4||s.quest===6?"La porte du château noir vous attend au nord-est.":s.quest>=7?"Cherchez l’ancrage de cendre au cœur du château.":"Aucun lieu ancien à portée.");return}const shrine=SHRINES[index],flag=1<<index;if(!(s.shrines&flag)){s.shrines|=flag;s.checkpoint=index+1;s.hp=100;s.mana=100;s.stamina=100;s.potions=Math.max(s.potions,2);s.gold+=4;localStorage.setItem("cendreval-save",JSON.stringify(s));if(s.shrines===7){setMessage("Les trois bornes répondent : le gardien des ruines s’éveille.");setPanel("combat")}else setMessage(`${shrine.name} éveillée — checkpoint ancré dans les ruines.`)}else{s.checkpoint=index+1;s.hp=100;s.mana=100;s.stamina=100;localStorage.setItem("cendreval-save",JSON.stringify(s));setMessage(`${shrine.name} vous rend vos forces.`)}sync()},[gainXp,panel,sync,village]);

  useEffect(()=>{
    const raw=localStorage.getItem("cendreval-bindings");
    if(raw){try{applyBindings({...DEFAULT_BINDINGS,...JSON.parse(raw)})}catch{}}
    const savedSensitivity=Number(localStorage.getItem("cendreval-mouse-sensitivity"));
    if(savedSensitivity){setSensitivity(savedSensitivity);sensitivityRef.current=savedSensitivity}
    const savedVolume=Number(localStorage.getItem("cendreval-audio-volume"));
    if(Number.isFinite(savedVolume)&&savedVolume>=0){setAudioVolume(savedVolume);audioVolumeRef.current=savedVolume}
    const savedShake=Number(localStorage.getItem("cendreval-shake-scale"));
    if(Number.isFinite(savedShake)&&savedShake>=0){setShakeScale(savedShake);shakeScaleRef.current=savedShake}
    if(localStorage.getItem("cendreval-guide-dismissed")==="1")setGuideOpen(false)
  },[applyBindings]);

  useEffect(()=>{
    const horizon=new Image();
    horizon.src="/cendreval-plains-v2.png";
    horizon.onload=()=>{horizonRef.current=horizon};
    const guardian=new Image();
    guardian.src="/ash-warden-v1.png";
    guardian.onload=()=>{const clean=document.createElement("canvas");clean.width=guardian.naturalWidth;clean.height=guardian.naturalHeight;const cleanCtx=clean.getContext("2d")!;cleanCtx.drawImage(guardian,0,0);const pixels=cleanCtx.getImageData(0,0,clean.width,clean.height);for(let p=0;p<pixels.data.length;p+=4){const r=pixels.data[p],g=pixels.data[p+1],b=pixels.data[p+2];if(g>135&&g>r*1.32&&g>b*1.32)pixels.data[p+3]=0}cleanCtx.putImageData(pixels,0,0);guardianRef.current=clean};
    const shadow=new Image();
    shadow.src="/shadow-pixel.png";
    shadow.onload=()=>{shadowRef.current=shadow};
  },[]);

  useEffect(()=>{
    const trigger=(input:string)=>{
      if(village)return;
      const action=(Object.keys(bindingsRef.current) as Action[]).find(a=>bindingsRef.current[a]===input);
      if(action==="attack")primaryAttack();
      if(action==="spell")strike(true);
      if(action==="bow")shootBow();
      if(action==="parry")parry();
      if(action==="dodge")dodge();
      if(action==="potion")potion();
      if(action==="ability")ability();
      if(action==="lockOn")setLocked(value=>{if(value){lockedTarget.current=null;setMessage("Cible libérée.");return false}const s=state.current,target=[enemy.current,...minions.current].filter(foe=>foe.alive).sort((a,b)=>targetScore(a,s)-targetScore(b,s))[0];lockedTarget.current=target??null;setMessage(target?`CIBLE VERROUILLÉE — ${target.name}.`:"Aucune menace à verrouiller.");return Boolean(target)});
      if(action==="interact")interact();
      if(action==="inventory")setPanel(p=>p==="inventory"?null:"inventory");
      if(action==="journal")setPanel(p=>p==="journal"?null:"journal");
      if(action==="save")save();
    };
    const down=(e:KeyboardEvent)=>{
      if(capture){e.preventDefault();if(e.code==="Escape"){setCapture(null);setMessage("Association annulée.");return}applyBindings({...bindingsRef.current,[capture]:e.code});setCapture(null);return}
      keys.current[e.code]=true;inputPulse.current[e.code]=performance.now();
      trigger(e.code);
      if(e.code==="Space")e.preventDefault();
      if(e.code==="Escape"){e.preventDefault();clearInput();if(panel==="pause"){setPanel(null);lockCursor()}else{setPanel("pause");document.exitPointerLock?.();if(document.fullscreenElement)document.exitFullscreen?.()}}
    };
    const up=(e:KeyboardEvent)=>{keys.current[e.code]=false;delete inputPulse.current[e.code]};
    const mouseDown=(e:PointerEvent)=>{
      const input=`Mouse${e.button}`;
      if(capture){e.preventDefault();e.stopPropagation();suppressCapturedClick.current=true;applyBindings({...bindingsRef.current,[capture]:input});setCapture(null);setMessage(`Commande associée à ${bindingLabel(input)}.`);return}
      const target=e.target as Element|null;
      const onGameSurface=Boolean(target?.closest?.(".stage"));
      const onControl=Boolean(target?.closest?.("button,input,select,textarea,a"));
      const captured=document.pointerLockElement===canvasRef.current;
      if(!captured){if(started&&!panel&&!village&&onGameSurface&&!onControl){e.preventDefault();captureMouse()}return}
      keys.current[input]=true;inputPulse.current[input]=performance.now();trigger(input);
      e.preventDefault();if(e.button!==0)e.stopPropagation()
    };
    const mouseUp=(e:PointerEvent)=>{const input=`Mouse${e.button}`;keys.current[input]=false;delete inputPulse.current[input]};
    const pointerCancel=()=>clearInput();
    const blockCapturedClick=(e:MouseEvent)=>{if(!suppressCapturedClick.current)return;suppressCapturedClick.current=false;e.preventDefault();e.stopImmediatePropagation()};
    const move=(e:MouseEvent)=>{
      if(!started||panel||village||choosingSpec)return;
      const canvas=canvasRef.current;
      if(document.pointerLockElement===canvas){state.current.a+=e.movementX*.0024*sensitivityRef.current;cameraPitch.current=Math.max(-.65,Math.min(.65,cameraPitch.current-e.movementY*.0024*sensitivityRef.current));return}
    };
    const lock=()=>{const captured=document.pointerLockElement===canvasRef.current;if(!captured){clearInput();if(started&&!panel&&!village&&!choosingSpec)setPanel("pause")}setMouseLook(captured)};
    const lockError=()=>{clearInput();setMouseLook(false);setMessage("CAPTURE REFUSÉE — recliquez dans le décor pour verrouiller la souris.")};
    const blockAux=(e:MouseEvent)=>{const target=e.target as Element|null;if(started&&!panel&&!village&&target?.closest?.(".stage")){e.preventDefault();e.stopPropagation()}};
    const blur=()=>clearInput();
    const visibility=()=>{if(document.hidden)clearInput()};
    const fullscreen=()=>clearInput();
    addEventListener("keydown",down);addEventListener("keyup",up);addEventListener("pointerdown",mouseDown);addEventListener("pointerup",mouseUp);addEventListener("pointercancel",pointerCancel);addEventListener("click",blockCapturedClick,true);addEventListener("auxclick",blockAux,true);addEventListener("mousemove",move);addEventListener("pointerlockchange",lock);addEventListener("pointerlockerror",lockError);addEventListener("fullscreenchange",fullscreen);document.addEventListener("visibilitychange",visibility);addEventListener("pagehide",blur);addEventListener("blur",blur);
    return()=>{removeEventListener("keydown",down);removeEventListener("keyup",up);removeEventListener("pointerdown",mouseDown);removeEventListener("pointerup",mouseUp);removeEventListener("pointercancel",pointerCancel);removeEventListener("click",blockCapturedClick,true);removeEventListener("auxclick",blockAux,true);removeEventListener("mousemove",move);removeEventListener("pointerlockchange",lock);removeEventListener("pointerlockerror",lockError);removeEventListener("fullscreenchange",fullscreen);document.removeEventListener("visibilitychange",visibility);removeEventListener("pagehide",blur);removeEventListener("blur",blur)};
  },[ability,applyBindings,capture,captureMouse,choosingSpec,clearInput,dodge,interact,lockCursor,panel,parry,primaryAttack,save,shootBow,started,strike,village]);

  useEffect(()=>{
    clearInput();
    if(panel||village||choosingSpec)document.exitPointerLock?.();
  },[clearInput,panel,village,choosingSpec]);

  useEffect(()=>{
    if(!started) return;
    const canvas=canvasRef.current!; const ctx=canvas.getContext("2d")!;
    ctx.imageSmoothingEnabled=false;
    let raf=0;
    const loop=(t:number)=>{
      let dt=Math.min(.04,(t-last.current)/1000||0);last.current=t;if(hitStop.current>0){hitStop.current=Math.max(0,hitStop.current-dt);dt*=.12}
      const s=state.current;
      if(!panel&&!village&&!choosingSpec&&s.hp>0)worldTime.current=(worldTime.current+dt*.006)%1;
      if(s.quest===0&&s.shrines===7&&enemy.current.alive&&!panel&&!village&&!choosingSpec&&s.hp>0)duelTimer.current+=dt;
      if(s.hp>0&&!panel&&!village&&!choosingSpec&&staggerFx.current===0){
        for(const code of [bindingsRef.current.forward,bindingsRef.current.back,bindingsRef.current.left,bindingsRef.current.right,bindingsRef.current.turnLeft,bindingsRef.current.turnRight]){const pulse=inputPulse.current[code];if(keys.current[code]&&pulse&&performance.now()-pulse>1500){keys.current[code]=false;delete inputPulse.current[code]}}
        let turn=0,move=0,strafe=0;
        if(keys.current[bindingsRef.current.turnLeft])turn-=1;
        if(keys.current[bindingsRef.current.turnRight])turn+=1;
        if(keys.current[bindingsRef.current.forward])move+=1;
        if(keys.current[bindingsRef.current.back])move-=1;
        if(keys.current[bindingsRef.current.left])strafe-=1;if(keys.current[bindingsRef.current.right])strafe+=1;
        s.a+=turn*dt*2.15;
        const responsiveness=1-Math.exp(-dt*(move||strafe?15:10));movement.current.forward+=(move-movement.current.forward)*responsiveness;movement.current.strafe+=(strafe-movement.current.strafe)*responsiveness;
        const actionWeight=potionFx.current>0?.31:attackFx.current>.09||spellFx.current>.08?.52:parryFx.current>.18?.68:1,speed=dt*2.35*actionWeight, dx=(Math.cos(s.a)*movement.current.forward+Math.cos(s.a+Math.PI/2)*movement.current.strafe)*speed, dy=(Math.sin(s.a)*movement.current.forward+Math.sin(s.a+Math.PI/2)*movement.current.strafe)*speed;
        if(!wallAt(s.x+dx,s.y))s.x+=dx;if(!wallAt(s.x,s.y+dy))s.y+=dy;
        const focus=lockedTarget.current;if(locked&&focus?.alive){const target=Math.atan2(focus.y-s.y,focus.x-s.x),diff=Math.atan2(Math.sin(target-s.a),Math.cos(target-s.a));s.a+=diff*Math.min(1,dt*3.6)}else if(locked&&!focus?.alive){lockedTarget.current=null;setLocked(false)}
      }
      attackFx.current=Math.max(0,attackFx.current-dt);spellFx.current=Math.max(0,spellFx.current-dt);hurtFx.current=Math.max(0,hurtFx.current-dt);damagePop.current.time=Math.max(0,damagePop.current.time-dt);defenseTap.current.time=Math.max(0,defenseTap.current.time-dt);parryFx.current=Math.max(0,parryFx.current-dt);perfectFx.current=Math.max(0,perfectFx.current-dt);perfectImpactFx.current=Math.max(0,perfectImpactFx.current-dt);perfectDodgeFx.current=Math.max(0,perfectDodgeFx.current-dt);dodgeFx.current=Math.max(0,dodgeFx.current-dt);abilityFx.current=Math.max(0,abilityFx.current-dt);impactFx.current=Math.max(0,impactFx.current-dt);shakeFx.current=Math.max(0,shakeFx.current-dt);phaseFx.current=Math.max(0,phaseFx.current-dt);duelIntroFx.current=Math.max(0,duelIntroFx.current-dt);staggerFx.current=Math.max(0,staggerFx.current-dt);bladeChainTimer.current=Math.max(0,bladeChainTimer.current-dt);staminaDelay.current=Math.max(0,staminaDelay.current-dt);if(bladeChainTimer.current===0)bladeChain.current=0;if(attackFx.current===0&&queuedAttack.current!==null&&staggerFx.current===0){queuedAttack.current=null;strike(false)}if(!panel&&!village&&!choosingSpec)abilityCd.current=Math.max(0,abilityCd.current-dt);if(abilityCd.current===0&&!abilityReadyRef.current){abilityReadyRef.current=true;setAbilityReady(true)}if(staminaDelay.current===0&&staggerFx.current===0)s.stamina=Math.min(100,s.stamina+dt*16);
      const potionBefore=potionFx.current;potionFx.current=Math.max(0,potionFx.current-dt);if(pendingPotion.current&&s.hp<potionStartHp.current){pendingPotion.current=false;potionFx.current=0;setMessage("GORGÉE INTERROMPUE — le coup renverse la potion.")}else if(potionBefore>0&&potionFx.current===0&&pendingPotion.current){pendingPotion.current=false;s.hp=Math.min(100,s.hp+45);impactFx.current=.18;sync();setMessage("POTION BUE — la chaleur revient dans vos veines.")}
      if(s.shrines!==7)duelIntroShown.current=false;
      if(s.quest===0&&s.shrines===7&&enemy.current.alive&&!duelIntroShown.current){duelIntroShown.current=true;duelTimer.current=0;duelFinalTime.current=0;duelIntroFx.current=2.8;enemy.current.cooldown=Math.max(enemy.current.cooldown,2.9);setMessage("LE GARDIEN DES RUINES — observez avant de frapper.")}
      if(enemy.current.alive&&enemy.current.boss&&enemy.current.hit<.42)guardianPosture.current=Math.min(100,guardianPosture.current+dt*3.4);
      hudRefresh.current+=dt;if(hudRefresh.current>=.1){hudRefresh.current=0;setHud({...s,shrines:shrineCount(s.shrines)})}
      if(s.hp>0&&!panel&&!village&&!choosingSpec)for(const foe of [enemy.current,...minions.current]){
        const telegraphBefore=foe.telegraph,strikeBefore=foe.strike??0;foe.hit=Math.max(0,foe.hit-dt);foe.cooldown=Math.max(0,foe.cooldown-dt);foe.telegraph=Math.max(0,foe.telegraph-dt);foe.strike=Math.max(0,strikeBefore-dt);foe.death=Math.max(0,(foe.death??0)-dt);foe.guardBroken=Math.max(0,(foe.guardBroken??0)-dt);
        if(!foe.alive||(foe.boss&&s.shrines!==7))continue;
        if(foe.boss&&foe.hp<=35&&guardianPhase.current===1){guardianPhase.current=2;phaseFx.current=1.8;foe.hit=1.35;foe.cooldown=2.2;foe.telegraph=0;foe.strike=0;foe.impactDone=true;guardianPosture.current=100;shakeFx.current=6;impactFx.current=.34;playCombatSound("phase");setMessage("PHASE II — le Gardien brise son sceau : ses enchaînements accélèrent !")}
        const vx=s.x-foe.x,vy=s.y-foe.y,dist=Math.hypot(vx,vy);
        if(foe.hit>.42&&dist>.01){const recoil=dt*(foe.boss?1.15:.8),rx=foe.x-vx/dist*recoil,ry=foe.y-vy/dist*recoil;if(!wallAt(rx,foe.y))foe.x=rx;if(!wallAt(foe.x,ry))foe.y=ry;}
        const enraged=foe.boss&&foe.hp<=35;
        const ranged=foe.kind==="ranged",brute=foe.kind==="brute"&&!foe.boss,reach=ranged?5.4:foe.intent==="slam"?2.35:foe.intent==="lunge"?1.75:1.25,stop=ranged?3.2:.9;
        if(dist<7&&dist>stop&&foe.telegraph===0&&(foe.strike??0)===0&&foe.hit<.42){const healPunish=foe.boss&&potionFx.current>0,step=dt*(foe.boss?(healPunish?1.28:enraged ? .96 : .65):ranged?.56:brute?.62:.85),nx=foe.x+vx/dist*step,ny=foe.y+vy/dist*step;if(!wallAt(nx,foe.y))foe.x=nx;if(!wallAt(foe.x,ny))foe.y=ny;}
        if(dist<reach&&foe.cooldown===0&&foe.telegraph===0&&(foe.strike??0)===0){const healPunish=foe.boss&&potionFx.current>0;if(foe.boss){guardianBeat.current++;if(healPunish){foe.intent="lunge";foe.followup=false}else if(foe.followup){foe.intent="lunge";foe.followup=false}else foe.intent=guardianBeat.current<=2?"sweep":enraged&&guardianBeat.current%4===0?"slam":enraged&&guardianBeat.current%2===0?"crush":guardianBeat.current%3===0?"crush":"sweep"}else foe.intent=ranged?"shot":(foe.intent==="sweep"?"crush":"sweep");foe.telegraph=foe.intent==="slam"?1.02:foe.intent==="crush"?(foe.boss?.82:.78):foe.intent==="lunge"?(healPunish?.25:.34):foe.boss?(enraged ? .42 : .64):ranged?.72:.48;foe.impactDone=false;if(foe.boss)playCombatSound(foe.intent==="slam"?"slam":foe.intent==="lunge"?"lunge":foe.intent==="sweep"?"sweep":"heavy");setMessage(healPunish?"SOIF PUNIE — le Gardien fond sur votre potion !":foe.intent==="slam"?"RUPTURE DE CENDRE — le sol va exploser : esquivez hors de l’onde !":foe.intent==="crush"?"Le Gardien arme un ÉCRASEMENT — esquivez ou parez tard !":foe.intent==="lunge"?"ENCHAÎNEMENT — le Gardien ramène sa lame pour une ESTOCADE !":foe.intent==="sweep"?"Le Gardien ouvre sa garde pour un BALAYAGE — préparez la parade !":"Le Veilleur vise une flèche de cendre !");}
        if(telegraphBefore>0&&foe.telegraph===0){foe.strike=foe.intent==="slam"?.38:foe.intent==="crush"?.32:foe.intent==="lunge"?.27:foe.intent==="shot"?.24:.22;foe.impactDone=false;if(foe.boss)playCombatSound("impact")}
        const impactAt=foe.intent==="slam"?.15:foe.intent==="crush"?.13:foe.intent==="lunge"?.1:foe.intent==="shot"?.08:.09;
        if((foe.strike??0)>0&&!foe.impactDone&&(foe.strike??0)<=impactAt){foe.impactDone=true;if(!ranged&&dist>reach+.35){foe.cooldown=.65;foe.hit=.34;setMessage(foe.boss?"Le Gardien frappe le vide — l’ouverture est brève.":"L’ennemi manque son coup.");continue}foe.cooldown=foe.intent==="slam"?1.9:foe.boss?(enraged ? .72 : 1.15):ranged?1.8:brute?1.65:1.35;if(foe.boss&&enraged&&foe.intent==="sweep"){foe.cooldown=.22;foe.followup=true}if(dodgeFx.current>0){foe.hit=foe.intent==="slam"?.76:.42;foe.cooldown=foe.intent==="slam"?2.05:1.65;foe.followup=false;s.stamina=Math.min(100,s.stamina+10);perfectDodgeFx.current=.42;impactFx.current=foe.intent==="slam"?.32:.18;playCombatSound("perfect");if(foe.boss){duelRecord.current.perfectDodges++;guardianPosture.current=Math.max(0,guardianPosture.current-(foe.intent==="slam"?28:15))}setMessage(foe.intent==="slam"?"ONDE FRANCHIE — le Gardien reste agenouillé : ripostez !":"ESQUIVE PARFAITE — l’ennemi vous perd et votre endurance revient.")}else if(parryFx.current>0){if(foe.intent==="slam"){const chip=Math.max(2,8-(s.courtBoon==="ward"?2:0));s.hp=Math.max(0,s.hp-chip);s.stamina=Math.max(0,s.stamina-30);duelFocus.current=0;if(foe.boss)duelRecord.current.hitsTaken++;hurtFx.current=.2;shakeFx.current=7;setMessage("ONDE IMBLOCABLE — la garde cède : cette rupture doit être esquivée !")}else if(perfectFx.current>0){foe.hit=.65;foe.cooldown=1.8;foe.followup=false;s.stamina=Math.min(100,s.stamina+22);perfectImpactFx.current=.36;impactFx.current=.25;shakeFx.current=2;playCombatSound("perfect");if(foe.boss){duelRecord.current.perfectParries++;guardianPosture.current=Math.max(0,guardianPosture.current-48);if(guardianPosture.current===0){foe.hit=.95;foe.cooldown=2.1;guardianPosture.current=100;perfectImpactFx.current=.52;setMessage("GARDE BRISÉE — le Gardien chancelle : ripostez sans attendre !")}else setMessage("PARADE PARFAITE — l’ennemi est étourdi !")}else setMessage("PARADE PARFAITE — l’ennemi est étourdi !")}else if(foe.intent==="crush"){const chip=Math.max(1,4-(s.courtBoon==="ward"?2:0));s.hp=Math.max(0,s.hp-chip);s.stamina=Math.max(0,s.stamina-18);if(foe.boss)duelRecord.current.hitsTaken++;hurtFx.current=.14;shakeFx.current=3;setMessage("GARDE ÉBRANLÉE — l’écrasement traverse une parade tardive.")}else{setMessage("Parade réussie.")}}else{const raw=foe.boss?(foe.intent==="slam"?15:foe.intent==="lunge"?13:enraged?11:8):ranged?5:brute?8:4;const damage=Math.max(1,raw-(s.courtBoon==="ward"?2:0));s.hp=Math.max(0,s.hp-damage);if(foe.boss)duelRecord.current.hitsTaken++;hurtFx.current=.25;shakeFx.current=foe.intent==="slam"?8:foe.intent==="lunge"?6:4;sync();setMessage(s.hp?`${foe.intent==="slam"?"L’onde de rupture":foe.intent==="lunge"?"L’estocade du Gardien":ranged?"La flèche de cendre":brute?"Le marteau du Veilleur":foe.boss?"Le gardien":"Une ombre"} vous frappe !`: "Vous êtes tombé… rechargez votre sauvegarde.");}}
      }
      if(perfectImpactFx.current>.5&&enemy.current.alive&&enemy.current.boss&&enemy.current.hit>.9)enemy.current.guardBroken=Math.max(enemy.current.guardBroken??0,1.45);
      if(hurtFx.current>.23){const incoming=enemy.current.intent==="slam"?15:enemy.current.intent==="lunge"?13:enemy.current.intent==="crush"?guardianPhase.current===2?11:8:8;damagePop.current={value:incoming,kind:"hurt",time:.72};duelFocus.current=0}
      if(hurtFx.current>0&&enemy.current.alive&&enemy.current.boss)setMistakeCoach(enemy.current.intent==="slam"?"La rupture embrase tout le cercle : quittez le sol avec une esquive, ne tentez pas de bloquer.":enemy.current.intent==="crush"?"Son arme reste levée plus longtemps : attendez sa chute avant d’esquiver.":enemy.current.intent==="lunge"?"L’estocade est le second temps du combo : gardez une esquive en réserve.":"Le balayage se pare quand sa traînée atteint le centre de l’écran.");
      if(perfectDodgeFx.current>0||perfectImpactFx.current>0)setMistakeCoach(null);
      if(s.stamina===0&&parryFx.current>0&&hurtFx.current>0&&staggerFx.current===0){staggerFx.current=.72;parryFx.current=0;perfectFx.current=0;queuedAttack.current=null;setMessage("GARDE ROMPUE — vous êtes sans défense jusqu’à reprendre appui !")}
      if(perfectDodgeFx.current>0&&!defenseRewarded.current.dodge){defenseRewarded.current.dodge=true;duelFocus.current=Math.min(3,duelFocus.current+1);duelRecord.current.bestFocus=Math.max(duelRecord.current.bestFocus??0,duelFocus.current);if(duelFocus.current>=3)setMessage("SANG-FROID PARFAIT — votre prochaine attaque est renforcée.");else if(s.spec==="bow"){s.arrows=Math.min(30,s.arrows+1);setMessage("PAS FANTÔME — esquive parfaite : une flèche récupérée.")}else if(s.spec==="arcane"){s.mana=Math.min(100,s.mana+12);setMessage("FLUX ÉVITÉ — esquive parfaite : +12 mana.")}else{s.stamina=Math.min(100,s.stamina+12);setMessage("PAS DU DUELLISTE — esquive parfaite : +12 endurance.")}sync()}
      if(perfectDodgeFx.current===0)defenseRewarded.current.dodge=false;
      if(perfectImpactFx.current>0&&parryFx.current>0&&!defenseRewarded.current.parry){defenseRewarded.current.parry=true;duelFocus.current=Math.min(3,duelFocus.current+1);duelRecord.current.bestFocus=Math.max(duelRecord.current.bestFocus??0,duelFocus.current);if(duelFocus.current>=3)setMessage("SANG-FROID PARFAIT — frappe renforcée prête !");else if(s.spec==="blade"){s.stamina=100;bladeChainTimer.current=1.35;setMessage("CONTRE DU VEILLEUR — parade parfaite : endurance pleine et combo prolongé.")}else if(s.spec==="bow"){s.arrows=Math.min(30,s.arrows+2);setMessage("ŒIL OUVERT — parade parfaite : deux flèches récupérées.")}else{s.mana=Math.min(100,s.mana+18);abilityCd.current=Math.max(0,abilityCd.current-2);setMessage("RÉSONANCE — parade parfaite : +18 mana et pouvoir accéléré.")}sync()}
      if(perfectImpactFx.current===0||parryFx.current===0)defenseRewarded.current.parry=false;
      if(pendingCombatSummary.current&&!enemy.current.alive&&(enemy.current.death??0)<=0){pendingCombatSummary.current=false;duelFinalTime.current=duelTimer.current;playCombatSound("victory");setCombatSummary(true)}
      if(s.shrines===7&&enemy.current.alive&&enemy.current.hp<=35&&!reinforcements.current){reinforcements.current=true;impactFx.current=.3;shakeFx.current=5;setMessage("DUEL SCELLÉ — aucune ombre n’interrompra votre face-à-face.")}
      if(s.quest===3&&!minions.current.some(foe=>foe.alive)){s.quest=4;s.expedition=2;s.gold+=20;s.talent++;sync();setMessage("EXPÉDITION ACCOMPLIE — les veilleurs cendrés se dispersent. +20 or, +1 talent.")}
      if(s.quest===5&&!enemy.current.alive){s.quest=6;s.gold+=30;s.talent++;localStorage.setItem("cendreval-save",JSON.stringify(s));sync();setMessage("LA PORTE CÈDE — la route du château noir est ouverte. +30 or, +1 talent.")}
      if(s.quest===7&&!enemy.current.alive&&!minions.current.some(foe=>foe.alive)){s.quest=8;s.gold+=55;s.talent++;localStorage.setItem("cendreval-save",JSON.stringify(s));sync();setMessage("COUR NETTOYÉE — le capitaine noir s’effondre. +55 or, +1 talent.")}
      if(s.quest===10&&!enemy.current.alive&&!minions.current.some(foe=>foe.alive)){s.quest=11;s.gold+=80;s.talent+=2;localStorage.setItem("cendreval-save",JSON.stringify(s));sync();setMessage("SALLES BASSES PURGÉES — le maître d’armes tombe. +80 or, +2 talents.")}
      if(s.quest===12&&!enemy.current.alive&&!minions.current.some(foe=>foe.alive)){s.quest=13;s.gold+=110;s.talent+=2;localStorage.setItem("cendreval-save",JSON.stringify(s));sync();setMessage("DONJON BRISÉ — le maréchal de cendre tombe. +110 or, +2 talents.")}
      if(s.quest===14&&!enemy.current.alive&&!minions.current.some(foe=>foe.alive)){s.quest=15;s.gold+=180;s.talent+=3;s.hp=100;s.mana=100;s.stamina=100;localStorage.setItem("cendreval-save",JSON.stringify(s));sync();setMessage("TRÔNE PURIFIÉ — le roi de cendre s’efface. Cendreval respire à nouveau. +180 or, +3 talents.")}
      if(s.quest===16&&!enemy.current.alive&&!minions.current.some(foe=>foe.alive)){const reward=22+s.echoTier*12;s.quest=15;s.echoBest=Math.max(s.echoBest,s.echoTier);s.gold+=reward;if(s.echoTier%2===0)s.talent++;s.hp=100;s.mana=100;s.stamina=100;localStorage.setItem("cendreval-save",JSON.stringify(s));sync();setMessage(`ÉCHO VAINCU — palier ${s.echoTier}, +${reward} or${s.echoTier%2===0?", +1 talent":""}.`) }

      // Ciel voûté et sol en damier rétro.
      const inCourt=s.quest>=7;
      const inHalls=s.quest>=10;
      const inDungeon=s.quest>=12;
      const inThrone=s.quest>=14;
      const firstDuel=s.quest===0&&s.shrines===7&&enemy.current.alive;
      ctx.fillStyle=inThrone?"#0b091b":inDungeon?"#120d17":inCourt?"#17141e":"#263c66";ctx.fillRect(0,0,W,H);
      ctx.save();ctx.translate(0,cameraPitch.current*H*.28);
      const sky=ctx.createLinearGradient(0,0,0,H/2);sky.addColorStop(0,inThrone?"#090b1d":inDungeon?"#130e19":inCourt?"#181625":"#314d82");sky.addColorStop(.55,inThrone?"#282259":inDungeon?"#3a202b":inCourt?"#4a4154":"#8ca6c7");sky.addColorStop(1,inThrone?"#8c4966":inDungeon?"#6e3534":inCourt?"#786b66":"#c4b88f");ctx.fillStyle=sky;ctx.fillRect(0,0,W,H/2);
      const horizon=horizonRef.current;
      if(inHalls){ctx.fillStyle=inThrone?"#120f2a":inDungeon?"#1f101b":"#211c25";ctx.fillRect(0,0,W,H*.5);ctx.fillStyle=inThrone?"rgba(107,88,234,.24)":inDungeon?"rgba(204,63,53,.2)":"rgba(163,110,78,.18)";for(let x=-8;x<W+14;x+=34){ctx.fillRect(x,0,16,H*.42);ctx.fillRect(x-5,H*.3,26,4)}ctx.fillStyle=inThrone?"#6f63be":inDungeon?"#9f3837":"#6b5761";ctx.fillRect(0,H*.37,W,5);for(let x=0;x<W;x+=36)ctx.fillRect(x,H*.25,5,H*.17);if(inThrone){ctx.fillStyle="rgba(227,198,255,.25)";for(let x=17;x<W;x+=74){ctx.fillRect(x,H*.12,3,H*.32);ctx.fillRect(x-3,H*.1,9,3)}}}else if(horizon&&!inCourt){const pan=Math.sin(s.a)*12;ctx.drawImage(horizon,pan-14,0,W+28,H*.59)}else{
        ctx.fillStyle="rgba(244,222,161,.72)";ctx.fillRect(55,27,18,18);ctx.fillStyle="rgba(244,222,161,.28)";ctx.fillRect(50,22,28,28);
        ctx.fillStyle="rgba(238,242,230,.38)";ctx.fillRect(125,27,42,3);ctx.fillRect(141,23,23,3);ctx.fillRect(190,45,58,3);ctx.fillRect(205,41,25,3);
        ctx.fillStyle="#7283a0";ctx.beginPath();ctx.moveTo(0,93);ctx.lineTo(68,48);ctx.lineTo(120,94);ctx.lineTo(190,60);ctx.lineTo(263,95);ctx.lineTo(342,45);ctx.lineTo(W,92);ctx.lineTo(W,120);ctx.lineTo(0,120);ctx.fill();
        ctx.fillStyle="#38435c";ctx.fillRect(296,55,22,43);ctx.fillRect(321,67,38,31);ctx.fillRect(301,46,12,52);ctx.fillRect(346,50,9,48);ctx.fillStyle="#253044";ctx.fillRect(298,43,18,6);ctx.fillRect(344,47,15,5);ctx.fillRect(316,61,47,6);
      }
      const floor=ctx.createLinearGradient(0,H/2,0,H);floor.addColorStop(0,inThrone?"#3d3467":inDungeon?"#4d282a":inHalls?"#463a36":inCourt?"#5b5357":"#6f8050");floor.addColorStop(1,inThrone?"#0c0a1b":inDungeon?"#100c14":inHalls?"#15131a":inCourt?"#242229":"#26341e");ctx.fillStyle=floor;ctx.fillRect(0,H/2,W,H/2);
      for(let y=H/2;y<H;y+=8){ctx.fillStyle=inCourt?(y%16?"rgba(24,21,28,.52)":"rgba(156,139,126,.19)"):(y%16?"rgba(33,56,27,.45)":"rgba(161,146,82,.24)");ctx.fillRect(0,y,W,1)}
      if(inCourt){ctx.fillStyle=inDungeon?"#1d1019":inHalls?"#211b21":"#37313a";ctx.fillRect(0,H*.43,W,H*.08);ctx.fillStyle=inDungeon?"#b44d43":inHalls?"#9b6348":"#7c6970";for(let x=0;x<W;x+=18)ctx.fillRect(x,H*.43,11,4);if(inHalls){ctx.fillStyle=inDungeon?"rgba(244,67,54,.34)":"rgba(245,137,58,.3)";for(let x=16;x<W;x+=74){ctx.fillRect(x,H*.4,4,13);ctx.fillRect(x-2,H*.4,8,3)}}}else{ctx.fillStyle="rgba(181,146,80,.35)";ctx.beginPath();ctx.moveTo(W*.45,H);ctx.lineTo(W*.64,H);ctx.lineTo(W*.56,H/2);ctx.lineTo(W*.53,H/2);ctx.fill();}
      if(firstDuel){const breath=.5+.5*Math.sin(t*.0024);ctx.fillStyle=`rgba(48,20,35,${.08+breath*.05})`;ctx.fillRect(0,H*.43,W,H*.57);ctx.save();ctx.translate(W/2,H*.7);ctx.scale(1,.28);ctx.strokeStyle=`rgba(216,142,83,${.22+breath*.18})`;ctx.lineWidth=2;for(let ring=0;ring<3;ring++){ctx.beginPath();ctx.arc(0,0,52+ring*25+breath*4,0,Math.PI*2);ctx.stroke()}ctx.strokeStyle="rgba(103,49,51,.34)";for(let rune=0;rune<8;rune++){const a=rune*Math.PI/4;ctx.beginPath();ctx.moveTo(Math.cos(a)*48,Math.sin(a)*48);ctx.lineTo(Math.cos(a)*118,Math.sin(a)*118);ctx.stroke()}ctx.restore()}
      const guide=s.quest===4||s.quest===6?CASTLE_GATE:!allShrinesAwake(s.shrines)?SHRINES.find((_,index)=>!(s.shrines&(1<<index))):enemy.current;
      const guideLabel=s.quest===4?"PORTE NOIRE":s.quest===6?"COUR EXTÉRIEURE":!allShrinesAwake(s.shrines)?"BORNE ANCIENNE":s.quest>=10?"ENNEMI MARQUÉ":"RUINES SCELLÉES";
      if(guide&&(!("alive" in guide)||guide.alive)){let guideAngle=Math.atan2(guide.y-s.y,guide.x-s.x)-s.a;guideAngle=Math.atan2(Math.sin(guideAngle),Math.cos(guideAngle));const gx=W/2+Math.max(-W*.34,Math.min(W*.34,guideAngle/FOV*W));ctx.strokeStyle="rgba(255,228,160,.75)";ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(W/2,14);ctx.lineTo(gx,14);ctx.stroke();ctx.fillStyle="#ffe7ae";ctx.beginPath();ctx.moveTo(gx,9);ctx.lineTo(gx+4,16);ctx.lineTo(gx-4,16);ctx.fill();ctx.font="8px Arial";ctx.textAlign="center";ctx.fillText(guideLabel,W/2,8)}
      const zbuf=new Float32Array(W);
      for(let x=0;x<W;x++){
        const ray=s.a-FOV/2+(x/W)*FOV; let d=.02,hit=0;
        while(d<18&&!hit){d+=.025;hit=wallAt(s.x+Math.cos(ray)*d,s.y+Math.sin(ray)*d)}
        d*=Math.cos(ray-s.a);zbuf[x]=d;
        const wh=Math.min(H*1.6,H/d);const top=(H-wh)/2;
        const side=(Math.floor(s.x+Math.cos(ray)*d*8)+Math.floor(s.y+Math.sin(ray)*d*8))%2;
        const shade=Math.max(20,155-d*9)+(side?8:0);
        const colors=hit===2?[shade*.16,shade*.42,shade*.19]:hit===3?[shade*.38,shade*.39,shade*.42]:inThrone?[shade*.26,shade*.22,shade*.48]:inDungeon?[shade*.4,shade*.16,shade*.18]:inHalls?[shade*.33,shade*.25,shade*.24]:inCourt?[shade*.35,shade*.31,shade*.34]:[shade*.42,shade*.36,shade*.31];
        ctx.fillStyle=`rgb(${colors[0]},${colors[1]},${colors[2]})`;ctx.fillRect(x,top,1,wh);
        if(x%13===0){ctx.fillStyle="rgba(10,5,10,.22)";ctx.fillRect(x,top,1,wh)}
      }

      // Ombres errantes : elles suivent le joueur et apparaissent comme des sprites dans le couloir.
      for(const shade of minions.current){
        if(!shade.alive||shade.telegraph<=0)continue;
        const dx=shade.x-s.x,dy=shade.y-s.y,dist=Math.hypot(dx,dy);let ang=Math.atan2(dy,dx)-s.a;ang=Math.atan2(Math.sin(ang),Math.cos(ang));const column=Math.max(0,Math.min(W-1,Math.floor((ang/FOV+.5)*W)));
        if(Math.abs(ang)>=FOV*.7||dist>=zbuf[column])continue;
        const size=Math.min(98,105/dist),cx=(.5+ang/FOV)*W,base=H/2+size*.52,charge=1-shade.telegraph/(shade.intent==="crush"?.78:shade.kind==="ranged"?.72:.48);
        ctx.save();ctx.translate(cx,base-size*.42);ctx.globalAlpha=.45+charge*.5;ctx.strokeStyle=shade.kind==="ranged"?"#efc269":shade.intent==="crush"?"#ff8a5c":"#e95766";ctx.lineWidth=Math.max(2,size*.045);ctx.beginPath();
        if(shade.kind==="ranged"){ctx.moveTo(-size*.34,-size*.18);ctx.lineTo(size*(.04+charge*.18),0);ctx.lineTo(-size*.34,size*.18);ctx.stroke();ctx.fillStyle="#fff0af";ctx.fillRect(-size*.03,-1,size*(.22+charge*.12),2)}else{ctx.arc(0,0,size*(.2+charge*.22),-1.3,-1.3+Math.PI*(.45+charge*.65));ctx.stroke()}
        ctx.restore();
      }

      for(const shade of minions.current){
        if(!shade.alive)continue;
        const dx=shade.x-s.x,dy=shade.y-s.y,dist=Math.hypot(dx,dy);let ang=Math.atan2(dy,dx)-s.a;ang=Math.atan2(Math.sin(ang),Math.cos(ang));
        const column=Math.max(0,Math.min(W-1,Math.floor((ang/FOV+.5)*W)));
        if(Math.abs(ang)<FOV*.7&&dist<zbuf[column]){const size=Math.min(98,105/dist),cx=(.5+ang/FOV)*W,base=H/2+size*.52,u=size/12,idle=Math.sin(t*.009+shade.x*2.1)*size*.03,strikeDuration=shade.intent==="crush"?.32:shade.intent==="shot"?.24:.22,attack=(shade.strike??0)>0?1-(shade.strike??0)/strikeDuration:0,attackSwing=Math.sin(Math.min(1,attack)*Math.PI);ctx.save();ctx.translate(Math.floor(cx-size/2),Math.floor(base-size+idle));if(shade.telegraph>0){const charge=1-shade.telegraph/(shade.intent==="crush"?.78:shade.kind==="ranged"?.72:.48);ctx.translate(0,charge*size*.07);ctx.rotate((shade.kind==="ranged"?-.08:.14)*charge)}else if(attack>0){ctx.translate(attackSwing*size*.12,-attackSwing*size*.18);ctx.scale(1+attackSwing*.12,1-attackSwing*.08);ctx.rotate((shade.kind==="ranged"?-.18:.42)*attackSwing)}const sprite=shadowRef.current;if(sprite){ctx.drawImage(sprite,0,0,sprite.width,sprite.height,0,0,size,size);if(shade.telegraph>0){ctx.fillStyle="rgba(172,31,55,.28)";ctx.fillRect(0,0,size,size)}if(attack>0){ctx.fillStyle=`rgba(255,105,82,${attackSwing*.3})`;ctx.fillRect(0,0,size,size)}if(shade.hit){ctx.fillStyle="rgba(255,230,205,.32)";ctx.fillRect(0,0,size,size)}}else{ctx.fillStyle=shade.hit?"#f9d9bf":shade.telegraph>0?"#8e273c":"#100d1b";ctx.fillRect(3*u,2*u,6*u,9*u);ctx.fillStyle="#4a315f";ctx.fillRect(2*u,5*u,8*u,5*u);ctx.fillStyle="#c44c6a";ctx.fillRect(4*u,4*u,u,u);ctx.fillRect(7*u,4*u,u,u);ctx.fillStyle="#21152e";ctx.fillRect(2*u,10*u,3*u,2*u);ctx.fillRect(7*u,10*u,3*u,2*u)}ctx.restore();}
      }

      // Un ennemi vaincu laisse une brève silhouette de cendres, au lieu de disparaître net.
      for(const shade of minions.current){
        const death=shade.death??0;if(shade.alive||death<=0)continue;
        const dx=shade.x-s.x,dy=shade.y-s.y,dist=Math.hypot(dx,dy);let ang=Math.atan2(dy,dx)-s.a;ang=Math.atan2(Math.sin(ang),Math.cos(ang));
        const column=Math.max(0,Math.min(W-1,Math.floor((ang/FOV+.5)*W)));if(Math.abs(ang)>=FOV*.7||dist>=zbuf[column])continue;
        const size=Math.min(98,105/dist),cx=(.5+ang/FOV)*W,base=H/2+size*.52,fade=Math.min(1,death/.62),u=Math.max(1,size/12);
        ctx.save();ctx.globalAlpha=fade;ctx.translate(Math.floor(cx-size/2),Math.floor(base-size*(.32+.68*fade)));ctx.scale(1+.18*(1-fade),.38+.62*fade);ctx.fillStyle="#31232f";ctx.fillRect(3*u,4*u,6*u,7*u);ctx.fillStyle="#b45b4a";ctx.fillRect(4*u,5*u,1*u,1*u);ctx.fillRect(7*u,5*u,1*u,1*u);ctx.globalAlpha=fade*.55;ctx.fillStyle="#c7a38a";for(let ash=0;ash<5;ash++)ctx.fillRect((2+ash*2)*u,(1+(1-fade)*5+(ash%2))*u,u,u);ctx.restore();
      }

      for(const prop of (inCourt?[]:SCENERY)){
        const dx=prop.x-s.x,dy=prop.y-s.y,dist=Math.hypot(dx,dy);let ang=Math.atan2(dy,dx)-s.a;ang=Math.atan2(Math.sin(ang),Math.cos(ang));
        const column=Math.max(0,Math.min(W-1,Math.floor((ang/FOV+.5)*W)));
        if(Math.abs(ang)>=FOV*.7||dist>=zbuf[column])continue;
        const size=Math.min(prop.kind==="tree"?102:64,(prop.kind==="tree"?92:62)/dist),cx=(.5+ang/FOV)*W,base=H/2+size*.56,u=Math.max(1,size/12);
        ctx.save();ctx.translate(Math.floor(cx-size/2),Math.floor(base-size));
        if(prop.kind==="tree"){
          ctx.fillStyle="#38271d";ctx.fillRect(5*u,6*u,2*u,6*u);ctx.fillStyle="#193b28";ctx.fillRect(2*u,1*u,8*u,7*u);ctx.fillStyle="#285538";ctx.fillRect(4*u,0,5*u,5*u);ctx.fillStyle="#5f7940";ctx.fillRect(5*u,1*u,2*u,2*u);
        } else if(prop.kind==="sign"){
          ctx.fillStyle="#4c3022";ctx.fillRect(5*u,2*u,2*u,10*u);ctx.fillStyle="#b58b4f";ctx.fillRect(1*u,1*u,10*u,4*u);ctx.fillStyle="#312018";ctx.fillRect(3*u,2*u,6*u,u);
        } else {ctx.fillStyle="#29313b";ctx.fillRect(2*u,5*u,8*u,7*u);ctx.fillStyle="#68707a";ctx.fillRect(3*u,3*u,6*u,6*u);ctx.fillStyle="#99a0a0";ctx.fillRect(4*u,3*u,3*u,u)}
        ctx.restore();
      }

      for(let index=0;index<LORE_STONES.length;index++){const stone=LORE_STONES[index],dx=stone.x-s.x,dy=stone.y-s.y,dist=Math.hypot(dx,dy);let ang=Math.atan2(dy,dx)-s.a;ang=Math.atan2(Math.sin(ang),Math.cos(ang));const column=Math.max(0,Math.min(W-1,Math.floor((ang/FOV+.5)*W)));if(Math.abs(ang)>=FOV*.7||dist>=zbuf[column])continue;const size=Math.min(56,58/dist),cx=(.5+ang/FOV)*W,base=H/2+size*.54,u=Math.max(1,size/8),read=Boolean(s.lore&(1<<index));ctx.save();ctx.translate(Math.floor(cx-size/2),Math.floor(base-size));ctx.fillStyle=read?"#48595b":"#5b4554";ctx.fillRect(3*u,1*u,2*u,7*u);ctx.fillStyle=read?"#9ec3b6":"#d9a66a";ctx.fillRect(2*u,2*u,4*u,4*u);ctx.fillStyle=read?"#d6f1cf":"#fff0af";ctx.fillRect(3*u,3*u,2*u,u);ctx.restore();if(dist<1.35&&Math.abs(ang)<.28){ctx.fillStyle="#fff1c7";ctx.font="8px Arial";ctx.textAlign="center";ctx.fillText(read?"E · RELIRE LA MÉMOIRE":"E · LIRE LA MÉMOIRE",W/2,H*.67)}}
      for(let index=0;index<SHRINES.length;index++){const shrine=SHRINES[index],dx=shrine.x-s.x,dy=shrine.y-s.y,dist=Math.hypot(dx,dy);let ang=Math.atan2(dy,dx)-s.a;ang=Math.atan2(Math.sin(ang),Math.cos(ang));const column=Math.max(0,Math.min(W-1,Math.floor((ang/FOV+.5)*W)));if(Math.abs(ang)>=FOV*.7||dist>=zbuf[column])continue;const size=Math.min(94,92/dist),cx=(.5+ang/FOV)*W,base=H/2+size*.54,u=Math.max(1,size/12),active=Boolean(s.shrines&(1<<index));ctx.save();ctx.translate(Math.floor(cx-size/2),Math.floor(base-size));ctx.fillStyle="#3f3739";ctx.fillRect(4*u,4*u,4*u,8*u);ctx.fillStyle=active?"#92d9d0":"#537b9a";ctx.fillRect(3*u,1*u,6*u,5*u);ctx.fillStyle=active?"#e5ffcf":"#9cc8e8";ctx.fillRect(5*u,2*u,2*u,2*u);ctx.fillStyle=active?"rgba(138,255,218,.22)":"rgba(112,190,255,.16)";ctx.fillRect(1*u,0,10*u,12*u);ctx.restore();if(dist<1.75&&Math.abs(ang)<.28){ctx.fillStyle="#fff1c7";ctx.font="8px Arial";ctx.textAlign="center";ctx.fillText(active?"E · SE RECUEILLIR":"E · ÉVEILLER LA BORNE",W/2,H*.67)}}

      if(s.quest>=7){const dx=CASTLE_REST.x-s.x,dy=CASTLE_REST.y-s.y,dist=Math.hypot(dx,dy);let ang=Math.atan2(dy,dx)-s.a;ang=Math.atan2(Math.sin(ang),Math.cos(ang));const column=Math.max(0,Math.min(W-1,Math.floor((ang/FOV+.5)*W)));if(Math.abs(ang)<FOV*.7&&dist<zbuf[column]){const size=Math.min(90,88/dist),cx=(.5+ang/FOV)*W,base=H/2+size*.54,u=Math.max(1,size/12);ctx.save();ctx.translate(Math.floor(cx-size/2),Math.floor(base-size));ctx.fillStyle="#281e28";ctx.fillRect(3*u,5*u,6*u,7*u);ctx.fillStyle=inDungeon?"#e34c4c":"#e38b52";ctx.fillRect(4*u,2*u,4*u,5*u);ctx.fillStyle="#ffe19a";ctx.fillRect(5*u,3*u,2*u,2*u);ctx.fillStyle="rgba(255,133,73,.2)";ctx.fillRect(1*u,0,10*u,12*u);ctx.restore();if(dist<1.75&&Math.abs(ang)<.28){ctx.fillStyle="#fff1c7";ctx.font="8px Arial";ctx.textAlign="center";ctx.fillText("E · ANCRER LA PROGRESSION",W/2,H*.67)}}}

      if(s.quest>=4){const dx=CASTLE_GATE.x-s.x,dy=CASTLE_GATE.y-s.y,dist=Math.hypot(dx,dy);let ang=Math.atan2(dy,dx)-s.a;ang=Math.atan2(Math.sin(ang),Math.cos(ang));const column=Math.max(0,Math.min(W-1,Math.floor((ang/FOV+.5)*W)));if(Math.abs(ang)<FOV*.7&&dist<zbuf[column]){const size=Math.min(128,135/dist),cx=(.5+ang/FOV)*W,base=H/2+size*.54,u=Math.max(1,size/12);ctx.save();ctx.translate(Math.floor(cx-size/2),Math.floor(base-size));ctx.fillStyle="#211b28";ctx.fillRect(1*u,1*u,10*u,11*u);ctx.fillStyle="#655765";ctx.fillRect(2*u,2*u,8*u,9*u);ctx.fillStyle="#15111b";ctx.fillRect(3*u,3*u,6*u,8*u);ctx.fillStyle="#ab823f";for(let bar=0;bar<5;bar++)ctx.fillRect((3+bar)*u,3*u,u,8*u);ctx.restore();if(dist<1.8&&Math.abs(ang)<.3&&(s.quest===4||s.quest===6)){ctx.fillStyle="#fff1c7";ctx.font="8px Arial";ctx.textAlign="center";ctx.fillText(s.quest===4?"E · OUVRIR LA PORTE NOIRE":"E · ENTRER DANS LA COUR",W/2,H*.67)}}}
      // Gardien sous forme de billboard pixelisé.
      const e=enemy.current;
      if(e.alive){
        const dx=e.x-s.x,dy=e.y-s.y,dist=Math.hypot(dx,dy);let ang=Math.atan2(dy,dx)-s.a;ang=Math.atan2(Math.sin(ang),Math.cos(ang));
        if(Math.abs(ang)<FOV*.7 && dist<zbuf[Math.max(0,Math.min(W-1,Math.floor((ang/FOV+.5)*W)))]){
          const size=Math.min(130,150/dist),cx=(.5+ang/FOV)*W,base=H/2+size*.52,telegraphCharge=e.telegraph>0?1-e.telegraph/(e.intent==="slam"?1.02:e.intent==="crush"?.82:e.intent==="lunge"?.34:.64):0;
          if(e.boss&&allShrinesAwake(s.shrines)){const phaseTwo=e.hp<=35,pulse=.5+.5*Math.sin(t*.006);ctx.save();ctx.translate(cx,base-size*.48);const aura=ctx.createRadialGradient(0,0,size*.08,0,0,size*.68);aura.addColorStop(0,phaseTwo?`rgba(255,72,45,${.2+pulse*.13})`:`rgba(177,93,62,${.13+pulse*.08})`);aura.addColorStop(.55,phaseTwo?"rgba(132,25,32,.16)":"rgba(69,35,52,.1)");aura.addColorStop(1,"transparent");ctx.fillStyle=aura;ctx.fillRect(-size*.8,-size*.8,size*1.6,size*1.6);ctx.restore();ctx.save();ctx.translate(cx,base+size*.02);ctx.scale(1,.22);ctx.fillStyle=phaseTwo?`rgba(81,10,18,${.52+pulse*.13})`:"rgba(10,6,13,.58)";ctx.beginPath();ctx.arc(0,0,size*.48,0,Math.PI*2);ctx.fill();ctx.strokeStyle=phaseTwo?"rgba(244,76,49,.66)":"rgba(181,110,68,.38)";ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,size*(.4+pulse*.05),0,Math.PI*2);ctx.stroke();ctx.restore()}
          if(e.telegraph>0){ctx.save();ctx.translate(cx,base-size*.04);ctx.scale(1,.28);ctx.strokeStyle=e.intent==="crush"?`rgba(246,176,78,${.34+.42*telegraphCharge})`:`rgba(220,75,72,${.24+.38*telegraphCharge})`;ctx.lineWidth=Math.max(1,size*.025);ctx.beginPath();ctx.arc(0,0,size*(e.intent==="crush"?.5:.38+telegraphCharge*.14),0,Math.PI*2);ctx.stroke();if(e.intent==="crush"){ctx.globalAlpha=.25+.32*telegraphCharge;ctx.fillStyle="#e59445";ctx.fillRect(-size*.09,-size*.22,size*.18,size*.22)}ctx.restore();ctx.save();ctx.translate(cx,base-size*.62);ctx.strokeStyle=e.intent==="crush"?"rgba(255,196,92,.82)":"rgba(255,91,91,.82)";for(let ghost=0;ghost<3;ghost++){ctx.globalAlpha=.18+ghost*.19+telegraphCharge*.16;ctx.lineWidth=1+ghost;ctx.beginPath();if(e.intent==="crush"){ctx.moveTo(-size*.08,-size*(.34-ghost*.08));ctx.lineTo(size*.06,size*(.18+telegraphCharge*.22))}else ctx.arc(0,size*.14,size*(.24+ghost*.07),-2.55,-.35+telegraphCharge*.75);ctx.stroke()}if(telegraphCharge>.72){ctx.fillStyle=`rgba(255,235,173,${(telegraphCharge-.72)*2.8})`;ctx.fillRect(-size*.34,-size*.55,size*.68,2)}ctx.restore()}
          const idle=Math.sin(t*.007+e.x*1.7)*size*.04,strikeDuration=e.intent==="slam"?.38:e.intent==="crush"?.32:e.intent==="lunge"?.27:.22,attack=(e.strike??0)>0?1-(e.strike??0)/strikeDuration:0,attackSwing=Math.sin(Math.min(1,attack)*Math.PI);ctx.save();ctx.translate(Math.floor(cx-size/2),Math.floor(base-size+idle));if(e.telegraph>0){const charge=1-e.telegraph/(e.intent==="slam"?1.02:e.intent==="crush"?.82:e.intent==="lunge"?.34:.64);ctx.translate(e.intent==="lunge"?-charge*size*.13:0,charge*size*(e.intent==="lunge"?.08:e.intent==="slam"?.25:.18));ctx.scale(1+charge*(e.intent==="lunge"?.2:.12),1-charge*(e.intent==="slam"?.14:.07));ctx.rotate((e.intent==="sweep"?-.32:e.intent==="lunge"?-.16:e.intent==="slam"?.05:.24)*charge)}else if(attack>0){ctx.translate(attackSwing*size*(e.intent==="lunge"?.3:e.intent==="sweep"?.18:0),-attackSwing*size*(e.intent==="lunge"?.12:e.intent==="slam"?.08:.3));ctx.scale(1+attackSwing*(e.intent==="lunge"?.28:.16),1-attackSwing*(e.intent==="slam"?.2:.11));ctx.rotate((e.intent==="sweep"?-.62:e.intent==="lunge"?.12:e.intent==="slam"?.02:.44)*attackSwing)}
          const sprite=guardianRef.current;
          if(sprite){if(e.boss&&e.hp<=35){ctx.save();ctx.globalAlpha=.18+.08*Math.sin(t*.012);for(const [ox,oy] of [[-3,0],[3,0],[0,-3],[0,3]])ctx.drawImage(sprite,0,0,sprite.width,sprite.height,ox,oy,size,size);ctx.restore()}ctx.drawImage(sprite,0,0,sprite.width,sprite.height,0,0,size,size);if(!allShrinesAwake(s.shrines)){ctx.fillStyle="rgba(72,124,186,.48)";ctx.fillRect(0,0,size,size);ctx.strokeStyle="rgba(158,223,255,.78)";ctx.lineWidth=2;ctx.beginPath();ctx.arc(size/2,size/2,size*.43,0,Math.PI*2);ctx.stroke()}if(e.telegraph>0){ctx.fillStyle="rgba(179,25,35,.24)";ctx.fillRect(0,0,size,size)}if(e.hit){ctx.fillStyle="rgba(255,235,181,.30)";ctx.fillRect(0,0,size,size)}}else{const u=size/16;ctx.fillStyle=e.hit?"#fff0c4":e.telegraph>0?"#9f2b37":"#16101b";ctx.fillRect(4*u,3*u,8*u,12*u);ctx.fillStyle="#696075";ctx.fillRect(5*u,2*u,6*u,7*u);ctx.fillRect(3*u,7*u,10*u,6*u);ctx.fillStyle="#c4463d";ctx.fillRect(6*u,5*u,1.5*u,u);ctx.fillRect(9*u,5*u,1.5*u,u);ctx.fillStyle="#a87a42";ctx.fillRect(1*u,6*u,3*u,2*u);ctx.fillRect(12*u,6*u,3*u,2*u);ctx.fillStyle="#3b3146";ctx.fillRect(4*u,13*u,3*u,3*u);ctx.fillRect(9*u,13*u,3*u,3*u)}ctx.restore();
        }
      }

      // Une arme vectorielle superposée rend chaque pose du Gardien lisible même sur le sprite pixelisé.
      if(e.alive&&e.boss&&allShrinesAwake(s.shrines)){
        const dx=e.x-s.x,dy=e.y-s.y,dist=Math.hypot(dx,dy);let ang=Math.atan2(dy,dx)-s.a;ang=Math.atan2(Math.sin(ang),Math.cos(ang));const column=Math.max(0,Math.min(W-1,Math.floor((ang/FOV+.5)*W)));
        if(Math.abs(ang)<FOV*.7&&dist<zbuf[column]){const size=Math.min(130,150/dist),cx=(.5+ang/FOV)*W,base=H/2+size*.52,strikeDuration=e.intent==="slam"?.38:e.intent==="crush"?.32:e.intent==="lunge"?.27:.22,strikeProgress=(e.strike??0)>0?1-(e.strike??0)/strikeDuration:0,swing=Math.sin(Math.min(1,strikeProgress)*Math.PI),charge=e.telegraph>0?1-e.telegraph/(e.intent==="slam"?1.02:e.intent==="crush"?.82:e.intent==="lunge"?.34:.64):0,recover=e.telegraph===0&&(e.strike??0)===0&&e.cooldown>0?Math.min(1,e.cooldown/(e.intent==="slam"?1.9:1.15)):0;
          ctx.save();ctx.translate(cx,base-size*.58);ctx.lineCap="square";ctx.shadowColor=e.hp<=35?"#ff493f":"#ffc06b";ctx.shadowBlur=(charge+swing)*9;
          const weaponAlpha=e.telegraph>0?.48+charge*.48:(e.strike??0)>0?.62+swing*.38:.34;ctx.strokeStyle=`rgba(255,${e.hp<=35?112:199},${e.hp<=35?76:116},${weaponAlpha})`;ctx.fillStyle=ctx.strokeStyle;ctx.lineWidth=Math.max(2,size*.035);
          if(e.intent==="slam"){const plunge=e.telegraph>0?charge:strikeProgress;ctx.globalAlpha=weaponAlpha;ctx.lineWidth=Math.max(3,size*.045);ctx.beginPath();ctx.moveTo(0,-size*(.4-.3*plunge));ctx.lineTo(0,size*(.12+.48*plunge));ctx.stroke();ctx.fillRect(-size*.15,-size*(.43-.3*plunge),size*.3,size*.08);if((e.strike??0)>0){ctx.globalAlpha=.3+.5*swing;ctx.strokeStyle="#ff724f";for(let ring=0;ring<3;ring++){ctx.beginPath();ctx.ellipse(0,size*.58,size*(.2+ring*.17)*swing,size*(.04+ring*.025)*swing,0,0,Math.PI*2);ctx.stroke()}}}
          else if(e.intent==="crush"){const lean=e.telegraph>0?charge:strikeProgress;const x=-size*.03+lean*size*.12,y0=-size*(.28-.5*lean),y1=size*(.12+.4*lean);for(let ghost=0;ghost<(e.telegraph>0?3:1);ghost++){ctx.globalAlpha=weaponAlpha*(1-ghost*.22);ctx.beginPath();ctx.moveTo(x-ghost*size*.055,y0+ghost*size*.035);ctx.lineTo(x+ghost*size*.025,y1);ctx.stroke()}ctx.globalAlpha=weaponAlpha;ctx.fillRect(x-size*.11,y0-size*.035,size*.22,size*.07)}
          else if(e.intent==="lunge"){const reach=e.telegraph>0?charge:strikeProgress;ctx.globalAlpha=weaponAlpha;ctx.beginPath();ctx.moveTo(-size*(.27-.16*reach),size*.02);ctx.lineTo(size*(.08+.56*reach),-size*(.05+.03*swing));ctx.stroke();ctx.beginPath();ctx.moveTo(size*(.08+.56*reach),-size*(.05+.03*swing));ctx.lineTo(size*(.01+.44*reach),-size*.13);ctx.lineTo(size*(.01+.44*reach),size*.02);ctx.closePath();ctx.fill()}
          else {const arc=e.telegraph>0?-.9+charge*.72:-.18+strikeProgress*2.35;for(let ghost=0;ghost<(e.telegraph>0?3:2);ghost++){ctx.globalAlpha=weaponAlpha*(1-ghost*.26);ctx.beginPath();ctx.arc(0,size*.12,size*(.28+ghost*.055),arc-1.08,arc+.18);ctx.stroke()}ctx.globalAlpha=weaponAlpha;const tipX=Math.cos(arc)*size*.42,tipY=size*.12+Math.sin(arc)*size*.42;ctx.fillRect(tipX-size*.08,tipY-size*.025,size*.16,size*.05)}
          if(recover>.18){ctx.globalAlpha=.18+recover*.18;ctx.strokeStyle="#d7b987";ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(-size*.2,size*.3);ctx.lineTo(size*.18,size*(.3+recover*.08));ctx.stroke()}ctx.restore();
        }
      }

      const guardianStrikeDuration=e.intent==="slam"?.38:e.intent==="crush"?.32:e.intent==="lunge"?.27:.22,guardianAttack=(e.strike??0)>0?1-(e.strike??0)/guardianStrikeDuration:0;
      if(e.alive&&e.telegraph===0&&guardianAttack>0){const dx=e.x-s.x,dy=e.y-s.y,dist=Math.hypot(dx,dy),target=Math.atan2(dy,dx),diff=Math.abs(Math.atan2(Math.sin(target-s.a),Math.cos(target-s.a))),swing=Math.sin(guardianAttack*Math.PI);if(dist<3.2&&diff<FOV*.72){const x=W/2+Math.sin(target-s.a)*W*.22,y=H*.55;ctx.save();ctx.translate(x,y);ctx.rotate((target-s.a)+Math.PI/2);ctx.strokeStyle=`rgba(255,${Math.floor(150+95*swing)},${Math.floor(82+110*swing)},${.22+.68*swing})`;ctx.lineWidth=2+5*swing;ctx.beginPath();ctx.arc(0,0,18+38*swing,-1.1,1.1);ctx.stroke();ctx.restore()}}

      const guardianDeath=e.death??0;
      if(!e.alive&&guardianDeath>0){
        const dx=e.x-s.x,dy=e.y-s.y,dist=Math.hypot(dx,dy);let ang=Math.atan2(dy,dx)-s.a;ang=Math.atan2(Math.sin(ang),Math.cos(ang));const column=Math.max(0,Math.min(W-1,Math.floor((ang/FOV+.5)*W)));
        if(Math.abs(ang)<FOV*.7&&dist<zbuf[column]){const size=Math.min(130,150/dist),cx=(.5+ang/FOV)*W,base=H/2+size*.52,fade=Math.min(1,guardianDeath/.62);ctx.save();ctx.globalAlpha=fade;ctx.translate(Math.floor(cx-size/2),Math.floor(base-size*(.27+.73*fade)));ctx.scale(1+.2*(1-fade),.3+.7*fade);const sprite=guardianRef.current;if(sprite)ctx.drawImage(sprite,0,0,sprite.width,sprite.height,0,0,size,size);else{ctx.fillStyle="#241826";ctx.fillRect(size*.25,size*.2,size*.5,size*.72)}ctx.globalAlpha=fade*.48;ctx.fillStyle="#e0a360";for(let ash=0;ash<8;ash++)ctx.fillRect(size*(.12+ash*.1),size*(.08+(ash%3)*.07+(1-fade)*.35),Math.max(1,size*.025),Math.max(1,size*.025));ctx.restore()}
      }

      ctx.restore();

      const daylight=Math.max(.08,Math.sin(worldTime.current*Math.PI*2)*.78+.22);
      if(daylight<.45){ctx.fillStyle=`rgba(3,8,28,${.64*(.48-daylight)/.4})`;ctx.fillRect(0,0,W,H);ctx.fillStyle=`rgba(220,235,255,${(.45-daylight)*1.8})`;for(let star=0;star<36;star++){const sx=(star*83)%W,sy=(star*47)%Math.floor(H*.43);ctx.fillRect(sx,sy,star%3?1:2,1)}}
      if(firstDuel){ctx.save();for(let mist=0;mist<4;mist++){const drift=(t*.006+mist*97)%W;ctx.fillStyle=`rgba(182,157,139,${.025+mist*.008})`;ctx.fillRect(drift-W*.42,H*(.45+mist*.075),W*.42,3+mist);ctx.fillRect(drift+W*.18,H*(.45+mist*.075),W*.34,2+mist)}for(let ash=0;ash<34;ash++){const ax=(ash*73+t*(.009+ash%4*.002))%W,ay=(ash*41+t*(.014+ash%3*.003))%H,bright=ash%7===0;ctx.fillStyle=bright&&enemy.current.hp<=35?"rgba(255,113,60,.72)":"rgba(213,190,166,.38)";ctx.fillRect(ax,ay,bright?2:1,bright?2:1)}const vignette=ctx.createRadialGradient(W/2,H*.5,H*.18,W/2,H*.5,W*.62);vignette.addColorStop(0,"transparent");vignette.addColorStop(.72,"rgba(18,7,14,.08)");vignette.addColorStop(1,"rgba(5,2,8,.58)");ctx.fillStyle=vignette;ctx.fillRect(0,0,W,H);ctx.restore()}

      // Arme, sort et viseur.
      const threats=[enemy.current,...minions.current].filter(foe=>foe.alive);
      for(const foe of threats){const dx=foe.x-s.x,dy=foe.y-s.y,dist=Math.hypot(dx,dy);let ang=Math.atan2(dy,dx)-s.a;ang=Math.atan2(Math.sin(ang),Math.cos(ang));if(Math.abs(ang)>FOV*.48&&dist<8){const right=ang>0,x=right?W-17:17,y=H*.48;ctx.save();ctx.translate(x,y);ctx.rotate(right?Math.PI/2:-Math.PI/2);ctx.fillStyle=foe.telegraph>0?"#ff6260":"rgba(255,223,164,.72)";ctx.beginPath();ctx.moveTo(0,-8);ctx.lineTo(7,7);ctx.lineTo(-7,7);ctx.fill();ctx.restore();}}
      const nearest=threats.sort((a,b)=>Math.hypot(a.x-s.x,a.y-s.y)-Math.hypot(b.x-s.x,b.y-s.y))[0];
      let targetReady=false;if(nearest){const target=Math.atan2(nearest.y-s.y,nearest.x-s.x),diff=Math.abs(Math.atan2(Math.sin(target-s.a),Math.cos(target-s.a)));targetReady=diff<.12&&Math.hypot(nearest.x-s.x,nearest.y-s.y)<7}
      if(spellFx.current>0){const r=30+spellFx.current*90,g=ctx.createRadialGradient(W*.68,H*.68,2,W*.68,H*.68,r);g.addColorStop(0,"#fff7a0");g.addColorStop(.35,"#ff6b28");g.addColorStop(1,"transparent");ctx.fillStyle=g;ctx.fillRect(0,0,W,H)}
      if(abilityFx.current>0){const palette=s.spec==="blade"?[180,210,255]:s.spec==="bow"?[225,190,105]:[222,90,255];ctx.strokeStyle=`rgba(${palette[0]},${palette[1]},${palette[2]},${abilityFx.current*.68})`;ctx.lineWidth=3;ctx.beginPath();ctx.arc(W/2,H/2,32+(1-abilityFx.current/.7)*72,0,Math.PI*2);ctx.stroke()}
      if(dodgeFx.current>0){const phase=1-dodgeFx.current/.34;ctx.save();ctx.globalAlpha=(1-phase)*.46;ctx.strokeStyle="#d9e2d6";ctx.lineWidth=2;for(let streak=0;streak<4;streak++){const y=H*(.58+streak*.065),start=W*(.16+phase*.32),end=start+W*(.16+phase*.1);ctx.beginPath();ctx.moveTo(start,y);ctx.lineTo(end,y-5);ctx.stroke()}ctx.restore()}
      const attackPhase=attackFx.current?Math.sin(attackFx.current/.28*Math.PI):0;const swing=attackPhase*(s.spec==="bow"?-12:s.spec==="arcane"?18:38);const guarding=parryFx.current>0;const guardLift=guarding?(1-parryFx.current/.46)*52:0;
      const locomotion=Math.min(1,Math.abs(movement.current.forward)+Math.abs(movement.current.strafe)),weaponBob=Math.sin(t*.012)*2+Math.sin(t*.021)*locomotion*4,weaponSway=Math.cos(t*.008)*2.4;
      const shake=shakeFx.current?Math.sin(t*.09)*shakeFx.current*shakeScaleRef.current:0;ctx.save();ctx.translate(W*.64+swing+shake+weaponSway,H*.78-swing*.6-guardLift+shake*.35+weaponBob);if(s.spec==="bow"){ctx.rotate(-.18+swing*.004);ctx.strokeStyle="#6e4b2e";ctx.lineWidth=5;ctx.beginPath();ctx.arc(22,2,55,-1.15,1.15);ctx.stroke();ctx.strokeStyle="#dbc99b";ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(44,-47);ctx.lineTo(70,2);ctx.lineTo(44,51);ctx.stroke();ctx.fillStyle="#d7b06a";ctx.fillRect(25,0,76,2)}else if(s.spec==="arcane"){const pulse=4+Math.sin(t*.012)*3;ctx.rotate(-.42+swing*.005);ctx.fillStyle="#30213a";ctx.fillRect(-4,-3,90,7);ctx.fillStyle="#9b6cb0";ctx.fillRect(6,-2,76,2);ctx.fillStyle=`rgba(225,125,255,${.65+spellFx.current})`;ctx.beginPath();ctx.arc(88,0,8+pulse,0,Math.PI*2);ctx.fill()}else{ctx.rotate(guarding?-1.22+swing*.008:-.62+swing*.012);ctx.fillStyle="#211724";ctx.fillRect(-5,-2,15,8);ctx.fillStyle="#c0aeb1";ctx.fillRect(8,0,92,5);ctx.fillStyle="#f2d89c";ctx.fillRect(8,0,88,1)}ctx.restore();
      // La main gauche matérialise la garde, son ouverture parfaite et le recul de l’impact.
      if(parryFx.current>0){const guardProgress=1-parryFx.current/.46,perfect=perfectFx.current>0,impact=perfectImpactFx.current>0?perfectImpactFx.current/.36:0;ctx.save();ctx.translate(W*(.28+.08*guardProgress)-impact*9,H*(.86-.26*guardProgress)+impact*5);ctx.rotate(.18-.34*guardProgress);ctx.fillStyle=perfect?"#7e6a35":"#293545";ctx.strokeStyle=perfect?"#ffe69b":"#9ab4d0";ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-34,24);ctx.lineTo(-28,-24);ctx.lineTo(3,-42);ctx.lineTo(35,-20);ctx.lineTo(31,27);ctx.lineTo(0,43);ctx.closePath();ctx.fill();ctx.stroke();ctx.fillStyle=perfect?"rgba(255,236,160,.52)":"rgba(151,190,225,.22)";ctx.fillRect(-3,-34,6,68);ctx.fillRect(-25,-2,51,5);if(perfect){ctx.shadowColor="#ffe8a5";ctx.shadowBlur=14;ctx.fillStyle="#fff5c8";ctx.fillRect(-3,-4,7,7)}ctx.restore()}
      if(dodgeFx.current>0){const evade=1-dodgeFx.current/.34;ctx.save();for(let ghost=0;ghost<3;ghost++){ctx.globalAlpha=(.28-ghost*.07)*(1-evade);ctx.translate(-10-ghost*7,5+ghost*3);ctx.strokeStyle=s.spec==="arcane"?"#d78bea":s.spec==="bow"?"#d7b977":"#d5dce5";ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(W*.61,H*.75);ctx.lineTo(W*.82,H*(.65+evade*.12));ctx.stroke()}ctx.restore()}
      if(damagePop.current.kind==="execution"&&damagePop.current.time>0){const finish=damagePop.current.time/.72;ctx.save();ctx.fillStyle=`rgba(15,7,9,${.14*finish})`;ctx.fillRect(0,0,W,H*.1);ctx.fillRect(0,H*.9,W,H*.1);ctx.translate(W*.5,H*.54);ctx.rotate(-.18);ctx.strokeStyle=`rgba(255,229,150,${finish})`;ctx.lineWidth=3+finish*4;ctx.beginPath();ctx.moveTo(-W*.23,H*.2);ctx.lineTo(W*.19,-H*.14);ctx.stroke();ctx.fillStyle=`rgba(255,245,190,${finish})`;ctx.fillRect(W*.17,-H*.15,24,4);ctx.restore()}
      if(attackFx.current>0){const progress=1-attackFx.current/.28;ctx.save();ctx.globalAlpha=Math.sin(progress*Math.PI)*.78;if(s.spec==="blade"){ctx.strokeStyle="#fff0bc";ctx.lineWidth=2;for(let trail=0;trail<3;trail++){ctx.globalAlpha=(1-trail*.24)*Math.sin(progress*Math.PI)*.7;ctx.beginPath();ctx.arc(W*.55,H*.65,42+trail*8,-1.25+progress*1.4,.1+progress*1.4);ctx.stroke()}}else if(s.spec==="arcane"){ctx.strokeStyle="#df79ff";ctx.lineWidth=2;for(let spark=0;spark<5;spark++){const a=progress*5+spark*1.25,r=18+spark*7;ctx.beginPath();ctx.moveTo(W*.66+Math.cos(a)*r,H*.7+Math.sin(a)*r);ctx.lineTo(W*.66+Math.cos(a)*(r+12),H*.7+Math.sin(a)*(r+12));ctx.stroke()}}else{ctx.strokeStyle="#f6d789";ctx.lineWidth=1;for(let line=0;line<4;line++){ctx.beginPath();ctx.moveTo(W*(.62+line*.015),H*(.62+line*.018));ctx.lineTo(W*(.49-progress*.1),H*(.5-progress*.05));ctx.stroke()}}ctx.restore()}
      if(potionFx.current>0){const drink=1-potionFx.current/.78,lift=Math.sin(Math.min(1,drink)*Math.PI);ctx.save();ctx.translate(W*(.72-.12*lift),H*(.88-.26*lift));ctx.rotate(-.35*lift);ctx.fillStyle="#351d27";ctx.fillRect(-12,-4,34,9);ctx.fillStyle="#7d2633";ctx.fillRect(18,-18,16,25);ctx.fillStyle="#dc6054";ctx.fillRect(21,-15,10,16);ctx.fillStyle="#f4c47d";ctx.fillRect(23,-21,6,6);ctx.restore()}
      if(s.spec==="bow"&&attackFx.current>0){const flight=1-attackFx.current/.28;ctx.save();ctx.globalAlpha=Math.max(0,1-flight*.82);ctx.strokeStyle="#f6d98c";ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(W*.7-flight*W*.2,H*.66+flight*H*.14);ctx.lineTo(W*.51,H*.51);ctx.stroke();ctx.fillStyle="#fff0b0";ctx.fillRect(W*.5-2,H*.5-1,7,2);ctx.restore()}
      if(parryFx.current>0){const r=34+(1-parryFx.current/.46)*18;ctx.strokeStyle=perfectFx.current>0?"#ffe49a":"#9db5d5";ctx.lineWidth=5;ctx.beginPath();ctx.arc(W*.78,H*.73,r,Math.PI*.45,Math.PI*1.55);ctx.stroke();ctx.strokeStyle=perfectFx.current>0?"rgba(255,230,140,.55)":"rgba(142,190,235,.35)";ctx.lineWidth=2;ctx.beginPath();ctx.arc(W*.78,H*.73,r+8,Math.PI*.5,Math.PI*1.48);ctx.stroke()}
      if(impactFx.current>0){const power=impactFx.current/.34;ctx.save();ctx.translate(W/2,H/2);ctx.strokeStyle=`rgba(255,${Math.floor(170+power*75)},${Math.floor(95+power*130)},${power})`;ctx.lineWidth=2+power*3;for(let spark=0;spark<8;spark++){const a=spark*Math.PI/4+t*.01,len=8+power*20;ctx.beginPath();ctx.moveTo(Math.cos(a)*5,Math.sin(a)*5);ctx.lineTo(Math.cos(a)*len,Math.sin(a)*len);ctx.stroke()}ctx.restore()}
      if(perfectImpactFx.current>0){const pulse=1-perfectImpactFx.current/.36;ctx.save();ctx.strokeStyle=`rgba(255,230,143,${perfectImpactFx.current/.36})`;ctx.lineWidth=2;ctx.beginPath();ctx.arc(W/2,H/2,18+pulse*82,0,Math.PI*2);ctx.stroke();ctx.restore()}
      if(perfectDodgeFx.current>0){const pulse=1-perfectDodgeFx.current/.42;ctx.save();ctx.strokeStyle=`rgba(150,230,255,${perfectDodgeFx.current/.42})`;ctx.lineWidth=2;ctx.setLineDash([4,3]);ctx.beginPath();ctx.arc(W/2,H*.68,18+pulse*70,0,Math.PI*2);ctx.stroke();ctx.restore()}
      const riposteReady=Boolean(nearest&&nearest.hit>.42);ctx.fillStyle=riposteReady?"#ffe28a":targetReady?"#ff7968":"rgba(255,239,190,.75)";ctx.fillRect(W/2-5,H/2,11,1);ctx.fillRect(W/2,H/2-5,1,11);if(riposteReady){ctx.strokeStyle="rgba(255,221,130,.7)";ctx.lineWidth=1;ctx.strokeRect(W/2-9,H/2-9,18,18)}
      if(hurtFx.current){const pain=hurtFx.current/.25,g=ctx.createRadialGradient(W/2,H/2,H*.12,W/2,H/2,W*.62);g.addColorStop(0,`rgba(105,0,8,${pain*.05})`);g.addColorStop(.58,`rgba(151,8,18,${pain*.14})`);g.addColorStop(1,`rgba(92,0,10,${pain*.72})`);ctx.fillStyle=g;ctx.fillRect(0,0,W,H);ctx.save();ctx.translate(W/2,H/2);ctx.rotate(-.68);ctx.fillStyle=`rgba(255,170,130,${pain*.55})`;ctx.fillRect(-W*.22,-1,W*.44,2);ctx.restore()}
      if(s.hp>0&&s.hp<30){const danger=.12+.08*Math.sin(t*.008);const low=ctx.createRadialGradient(W/2,H/2,H*.28,W/2,H/2,W*.62);low.addColorStop(0,"transparent");low.addColorStop(1,`rgba(73,0,9,${danger})`);ctx.fillStyle=low;ctx.fillRect(0,0,W,H)}
      raf=requestAnimationFrame(loop);
    };
    raf=requestAnimationFrame(loop);return()=>cancelAnimationFrame(raf);
  },[panel,playCombatSound,started,strike,sync]);

  const hold=(code:string,on:boolean)=>{keys.current[code]=on};
  const holdAction=(action:"forward"|"back"|"left"|"right",on:boolean)=>hold(bindingsRef.current[action],on);
  const potion=()=>{const s=state.current;if(panel||potionFx.current>0||staggerFx.current>0)return;if(attackFx.current>.09||spellFx.current>.08||dodgeFx.current>0||parryFx.current>.18){setMessage("ACTION ENGAGÉE — trouvez une vraie ouverture avant de boire.");return}if(!s.potions){setMessage("Votre ceinture ne contient plus de potion.");return}if(s.hp>=100){setMessage("Votre vitalité est déjà pleine.");return}s.potions--;pendingPotion.current=true;potionStartHp.current=s.hp;potionFx.current=.78;staminaDelay.current=Math.max(staminaDelay.current,.78);sync();setMessage("BOIRE — le Gardien punira une gorgée prise à découvert.")};
  const revive=()=>{const s=state.current;const inCastle=s.quest>=7,checkpoint=!inCastle&&s.checkpoint?SHRINES[s.checkpoint-1]:null;s.x=inCastle?CASTLE_REST.x:checkpoint?checkpoint.x:3.5;s.y=inCastle?CASTLE_REST.y:checkpoint?checkpoint.y+1.05:16.5;s.a=inCastle?Math.PI/2:-Math.PI/2;s.hp=100;s.mana=100;s.stamina=100;if(s.quest===0&&enemy.current.alive){s.enemyHp=70;guardianPhase.current=1;guardianPosture.current=100;guardianBeat.current=0;duelFocus.current=0;duelRecord.current={perfectParries:0,perfectDodges:0,ripostes:0,executions:0,bestFocus:0,hitsTaken:0};enemy.current={x:10.5,y:8.5,hp:70,alive:true,hit:0,cooldown:1.2,telegraph:0,strike:0,impactDone:true,boss:true,name:"gardien",kind:"brute"}}sync();setMessage(inCastle?"Vous reprenez conscience à l’ancrage du château.":checkpoint?`Vous reprenez conscience à la ${checkpoint.name}.`:"Vous reprenez conscience près du chemin des ruines.")};
  const shiftSky=()=>{worldTime.current=worldTime.current<.5?.73:.24;setMessage(worldTime.current<.5?"L’aube éclaire de nouveau les plaines.":"La nuit enveloppe Cendreval.")};
  const restoreForTest=()=>{const s=state.current;s.hp=100;s.mana=100;s.stamina=100;s.arrows=22;s.potions=Math.max(3,s.potions);sync();setMessage("Ressources restaurées — à toi de jouer.")};
  const resetEncounter=()=>{const s=state.current;s.x=3.5;s.y=16.5;s.a=-Math.PI/2;s.enemyHp=70;s.quest=0;s.shrines=0;s.checkpoint=0;s.expedition=0;reinforcements.current=false;guardianPosture.current=100;guardianBeat.current=0;guardianPhase.current=1;phaseFx.current=0;duelFocus.current=0;duelRecord.current={perfectParries:0,perfectDodges:0,ripostes:0,executions:0,bestFocus:0,hitsTaken:0};enemy.current={x:10.5,y:8.5,hp:70,alive:true,hit:0,cooldown:0,telegraph:0,strike:0,impactDone:true,boss:true,name:"gardien",kind:"brute"};minions.current=[{x:6.5,y:5.5,hp:34,alive:true,hit:0,cooldown:0,telegraph:0,boss:false,name:"ombre",kind:"melee"},{x:14.5,y:13.5,hp:34,alive:true,hit:0,cooldown:0,telegraph:0,boss:false,name:"ombre",kind:"melee"}];restoreForTest();setMessage("Rencontre réinitialisée — départ de la plaine.")};
  const prepareFirstDuel=()=>{const s=state.current;s.quest=0;s.shrines=7;s.checkpoint=3;s.x=10.5;s.y=13.5;s.a=-Math.PI/2;s.hp=100;s.mana=100;s.stamina=100;s.potions=Math.max(s.potions,3);s.enemyHp=70;reinforcements.current=false;guardianPosture.current=100;guardianBeat.current=0;guardianPhase.current=1;phaseFx.current=0;duelFocus.current=0;duelRecord.current={perfectParries:0,perfectDodges:0,ripostes:0,executions:0,bestFocus:0,hitsTaken:0};enemy.current={x:10.5,y:8.5,hp:70,alive:true,hit:0,cooldown:1.2,telegraph:0,strike:0,impactDone:true,boss:true,name:"gardien",kind:"brute"};minions.current=[];sync();setMessage("DUEL D’ENTRAÎNEMENT — lisez Balayage et Écrasement, puis ripostez.")};
  const claimReward=()=>{const s=state.current;if(s.quest===1&&!s.reward){s.reward=1;s.quest=2;s.gold+=35;s.potions+=2;s.level=2;s.hp=100;s.mana=100;sync();setMessage("Récompense reçue : 35 or, 2 potions. Niveau 2 !")} };
  const chooseRelic=(relic:Relic)=>{const s=state.current;if(s.relic!=="none")return;s.relic=relic;sync();setMessage("Relique liée à votre âme.")};
  const beginExpedition=()=>{const s=state.current;if(s.relic==="none"){setMessage("Choisissez d’abord une relique dans la halle de Valbrume.");return}s.quest=3;s.expedition=1;s.x=3.5;s.y=16.5;s.a=-Math.PI/2;s.hp=100;s.mana=100;s.stamina=100;s.potions=Math.max(s.potions,3);s.arrows=Math.max(s.arrows,18);enemy.current.alive=false;minions.current=[{x:7.3,y:13.1,hp:42,alive:true,hit:0,cooldown:.7,telegraph:0,boss:false,name:"veilleur archer",kind:"ranged"},{x:13.2,y:10.4,hp:46,alive:true,hit:0,cooldown:1.1,telegraph:0,boss:false,name:"veilleur",kind:"melee"},{x:9.4,y:6.7,hp:52,alive:true,hit:0,cooldown:1.5,telegraph:0,boss:false,name:"veilleur lourd",kind:"brute"}];setVillage(false);localStorage.setItem("cendreval-save",JSON.stringify(s));sync();setMessage("EXPÉDITION — un archer, un duelliste et un lourd gardent la plaine.")};
  const beginCastleApproach=()=>{const s=state.current;s.quest=5;s.expedition=3;s.hp=100;s.mana=100;s.stamina=100;s.potions=Math.max(3,s.potions);enemy.current={x:14.4,y:4.7,hp:100,alive:true,hit:0,cooldown:1,telegraph:0,boss:false,name:"sentinelle noire",kind:"brute"};minions.current=[];localStorage.setItem("cendreval-save",JSON.stringify(s));sync();setMessage("LA PORTE NOIRE — vainquez la sentinelle du château.")};
  const enterCastleCourt=()=>{const s=state.current;s.quest=7;s.expedition=4;s.x=15.1;s.y=4.8;s.a=Math.PI;s.hp=100;s.mana=100;s.stamina=100;s.potions=Math.max(s.potions,4);s.arrows=Math.max(s.arrows,20);enemy.current={x:10.5,y:6.8,hp:130,alive:true,hit:0,cooldown:1.2,telegraph:0,boss:false,name:"capitaine noir",kind:"brute"};minions.current=[{x:12.7,y:5.6,hp:48,alive:true,hit:0,cooldown:.5,telegraph:0,boss:false,name:"archer de cour",kind:"ranged"},{x:8.5,y:7.1,hp:54,alive:true,hit:0,cooldown:1,telegraph:0,boss:false,name:"garde noir",kind:"melee"}];localStorage.setItem("cendreval-save",JSON.stringify(s));sync();setMessage("COUR EXTÉRIEURE — abattez le capitaine noir et sa garde.")};
  const chooseCourtBoon=(boon:CourtBoon)=>{const s=state.current;if(s.quest!==8||s.courtBoon!=="none")return;s.courtBoon=boon;s.quest=9;localStorage.setItem("cendreval-save",JSON.stringify(s));sync();setMessage(boon==="ward"?"Égide de la cour — les coups ennemis sont amoindris.":boon==="fury"?"Fureur royale — vos attaques gagnent en puissance.":"Focus royal — votre pouvoir de voie revient plus vite.")};
  const enterLowerHalls=()=>{const s=state.current;if(s.courtBoon==="none"){setMessage("Choisissez d’abord le butin de la cour.");return}s.quest=10;s.expedition=5;s.x=10.5;s.y=8.8;s.a=Math.PI/2;s.hp=100;s.mana=100;s.stamina=100;s.potions=Math.max(s.potions,4);s.arrows=Math.max(s.arrows,22);enemy.current={x:10.5,y:5.8,hp:150,alive:true,hit:0,cooldown:1.1,telegraph:0,boss:false,name:"maître d’armes",kind:"brute"};minions.current=[{x:6.7,y:7.2,hp:55,alive:true,hit:0,cooldown:.5,telegraph:0,boss:false,name:"tireur de braise",kind:"ranged"},{x:14.2,y:7.1,hp:60,alive:true,hit:0,cooldown:.8,telegraph:0,boss:false,name:"lame noire",kind:"melee"},{x:10.4,y:10.4,hp:60,alive:true,hit:0,cooldown:1.3,telegraph:0,boss:false,name:"lame noire",kind:"melee"}];setVillage(false);localStorage.setItem("cendreval-save",JSON.stringify(s));sync();setMessage("SALLES BASSES — terrassez le maître d’armes et ses trois lieutenants.")};
  const beginDungeonAssault=()=>{const s=state.current;if(s.quest<11){setMessage("Les salles basses doivent d’abord être purgées.");return}s.quest=12;s.expedition=6;s.x=10.5;s.y=9.3;s.a=Math.PI/2;s.hp=100;s.mana=100;s.stamina=100;s.potions=Math.max(s.potions,5);s.arrows=Math.max(s.arrows,26);enemy.current={x:10.5,y:5.2,hp:180,alive:true,hit:0,cooldown:1,telegraph:0,boss:false,name:"maréchal de cendre",kind:"brute"};minions.current=[{x:6.4,y:7.3,hp:64,alive:true,hit:0,cooldown:.5,telegraph:0,boss:false,name:"arbalétrier noir",kind:"ranged"},{x:14.5,y:7.4,hp:64,alive:true,hit:0,cooldown:.7,telegraph:0,boss:false,name:"arbalétrier noir",kind:"ranged"},{x:10.5,y:10.2,hp:72,alive:true,hit:0,cooldown:1.1,telegraph:0,boss:false,name:"gardien de braise",kind:"brute"}];setVillage(false);localStorage.setItem("cendreval-save",JSON.stringify(s));sync();setMessage("DONJON NOIR — abattez le maréchal de cendre et ses gardiens.")};
  const beginThroneAssault=()=>{const s=state.current;if(s.quest<13){setMessage("Le donjon noir doit d’abord tomber.");return}s.quest=14;s.expedition=7;s.x=10.5;s.y=15.8;s.a=-Math.PI/2;s.hp=100;s.mana=100;s.stamina=100;s.potions=Math.max(s.potions,6);s.arrows=Math.max(s.arrows,30);enemy.current={x:10.5,y:4.7,hp:240,alive:true,hit:0,cooldown:.8,telegraph:0,boss:false,name:"roi de cendre",kind:"brute"};minions.current=[{x:7.1,y:8.2,hp:72,alive:true,hit:0,cooldown:.4,telegraph:0,boss:false,name:"héraut du trône",kind:"ranged"},{x:13.9,y:8.2,hp:72,alive:true,hit:0,cooldown:.7,telegraph:0,boss:false,name:"héraut du trône",kind:"ranged"},{x:10.5,y:9.9,hp:84,alive:true,hit:0,cooldown:1.1,telegraph:0,boss:false,name:"garde du trône",kind:"brute"}];setVillage(false);localStorage.setItem("cendreval-save",JSON.stringify(s));sync();setMessage("TOUR DES CENDRES — brisez le roi de cendre et ses hérauts.")};
  const beginAshEcho=()=>{const s=state.current;if(s.quest<15){setMessage("Les Échos ne répondent qu’après la chute du roi de cendre.");return}const tier=Math.min(5,s.echoTier+1);const hp=96+tier*28;s.echoTier=tier;s.quest=16;s.expedition=8;s.x=10.5;s.y=15.8;s.a=-Math.PI/2;s.hp=100;s.mana=100;s.stamina=100;s.potions=Math.max(s.potions,6);s.arrows=Math.max(s.arrows,30);enemy.current={x:10.5,y:4.7,hp,alive:true,hit:0,cooldown:.7,telegraph:0,boss:false,name:`écho royal ${tier}`,kind:"brute"};minions.current=[{x:7.1,y:8.2,hp:42+tier*10,alive:true,hit:0,cooldown:.4,telegraph:0,boss:false,name:"écho archer",kind:"ranged"},{x:13.9,y:8.2,hp:42+tier*10,alive:true,hit:0,cooldown:.7,telegraph:0,boss:false,name:"écho archer",kind:"ranged"},{x:10.5,y:9.9,hp:52+tier*11,alive:true,hit:0,cooldown:1.1,telegraph:0,boss:false,name:"écho lourd",kind:"brute"}];setVillage(false);localStorage.setItem("cendreval-save",JSON.stringify(s));sync();setMessage(`ÉCHO DE CENDRE · PALIER ${tier} — survivez à la tour déformée.`)};
  const restartJourney=()=>{state.current={...START};enemy.current={x:10.5,y:8.5,hp:70,alive:true,hit:0,cooldown:0,telegraph:0,boss:true,name:"gardien",kind:"brute"};minions.current=[{x:6.5,y:5.5,hp:34,alive:true,hit:0,cooldown:0,telegraph:0,boss:false,name:"ombre",kind:"melee"},{x:14.5,y:13.5,hp:34,alive:true,hit:0,cooldown:0,telegraph:0,boss:false,name:"ombre",kind:"melee"}];reinforcements.current=false;setEndingSeen(true);setVillage(false);localStorage.setItem("cendreval-save",JSON.stringify(state.current));sync();setMessage("NOUVEAU VOYAGE — les bornes vous appellent de nouveau.")};
  const prepareCastleTest=()=>{const s=state.current;s.quest=11;s.expedition=5;s.shrines=7;s.reward=1;s.relic=s.relic==="none"?"iron":s.relic;s.courtBoon=s.courtBoon==="none"?"ward":s.courtBoon;s.x=CASTLE_REST.x;s.y=CASTLE_REST.y;s.a=Math.PI/2;s.hp=100;s.mana=100;s.stamina=100;s.potions=Math.max(s.potions,5);s.arrows=Math.max(s.arrows,26);enemy.current={x:10.5,y:8.5,hp:0,alive:false,hit:0,cooldown:0,telegraph:0,boss:true,name:"gardien",kind:"brute"};minions.current=[];reinforcements.current=false;localStorage.setItem("cendreval-save",JSON.stringify(s));sync();setMessage("TEST CHÂTEAU — ancrage, relique et assaut du donjon préparés.")};
  const buyPotion=()=>{const s=state.current;if(s.gold<8){setMessage("Il vous manque des pièces d’or.");return}s.gold-=8;s.potions++;sync();setMessage("Potion achetée.")};
  const chooseSpec=(spec:Save["spec"])=>{const s=state.current;s.spec=spec;s.perkBlade=spec==="blade";s.perkBow=spec==="bow";s.perkArcane=spec==="arcane";if(spec==="blade")s.stamina=100;if(spec==="bow")s.arrows=Math.max(s.arrows,22);if(spec==="arcane")s.mana=100;sync();setChoosingSpec(false);setStarted(true);canvasRef.current?.focus();lockCursor();setMessage(`Voie choisie : ${spec==="blade"?"Lame":spec==="bow"?"Rôdeur":"Arcanes"}.`)};
  const learnPerk=(perk:"perkBlade"|"perkBow"|"perkArcane")=>{const s=state.current;if(!s.talent||s[perk])return;s.talent--;s[perk]=true;sync();setMessage("Talent appris !")};
  const changeSensitivity=(value:number)=>{setSensitivity(value);sensitivityRef.current=value;localStorage.setItem("cendreval-mouse-sensitivity",String(value))};

  return <main className="game-shell">
    <div className="grain" />
    <header><div className="brand"><span>CHRONIQUES DE</span><strong>CENDREVAL</strong></div><div className="chapter">{village?"VALBRUME · LE VILLAGE DES BRUMES":hud.quest>=14?"ACTE IV · LA TOUR DES CENDRES":hud.quest>=12?"ACTE III · LE DONJON NOIR":hud.quest>=7?"ACTE II · LE CHÂTEAU NOIR":"ACTE I · LES PLAINES DE CENDREVAL"}</div></header>
    <section className={`stage${started&&mouseLook&&!panel&&!village&&!choosingSpec?" playing":""}${panel||village||choosingSpec?" paused":""}`} aria-label="Jeu en vue subjective">
      <canvas ref={canvasRef} width={W} height={H} tabIndex={0} onPointerDown={captureMouse} onContextMenu={e=>e.preventDefault()} />
      {started&&<div className="hud-frame" aria-hidden="true"><i/><i/><i/><i/></div>}
      {!started&&!choosingSpec&&<div className="start-screen"><div className="sigil">ᛉ</div><h1>CENDREVAL</h1><p>Au-delà des plaines, le château noir veille.<br/>Votre légende commence sous un ciel ouvert.</p><button onClick={()=>setChoosingSpec(true)}>NOUVELLE PARTIE</button><button className="secondary" onClick={load}>CONTINUER</button><small>Cliquez dans le jeu pour diriger la caméra à la souris</small></div>}
      {choosingSpec&&<div className="start-screen spec-select"><span className="eyebrow">CHOISISSEZ VOTRE VOIE</span><h1>VOTRE LÉGENDE</h1><div className="spec-cards"><button onClick={()=>chooseSpec("blade")}><b>⚔ LAME</b><small>Combat rapproché et endurance renforcée.</small></button><button onClick={()=>chooseSpec("bow")}><b>⌁ RÔDEUR</b><small>Arc, distance et vingt-deux flèches.</small></button><button onClick={()=>chooseSpec("arcane")}><b>✦ ARCANES</b><small>Mana maximum pour la flamme ancienne.</small></button></div><button className="secondary" onClick={()=>setChoosingSpec(false)}>RETOUR</button></div>}
      {started&&<><div className="top-hud"><div className="quest"><span>NIV. {hud.level} · {hud.xp}/{hud.level*40} EXP · BORNES {hud.shrines}/3</span>{hud.quest===0?(hud.shrines<3?"Éveiller les bornes anciennes de la plaine":"Nettoyer les ruines de la plaine"):hud.quest===1?"Retourner à Valbrume":hud.quest===2?"Préparer l’expédition des Veilleurs":hud.quest===3?`Traquer les Veilleurs cendrés (${minions.current.filter(foe=>foe.alive).length}/3)`:hud.quest===4?"Rejoindre la porte du château noir":hud.quest===5?"Vaincre la sentinelle de la porte":hud.quest===6?"Entrer dans la cour extérieure":hud.quest===7?`Nettoyer la cour (${[enemy.current,...minions.current].filter(foe=>foe.alive).length}/3)`:hud.quest===8?"Réclamer le butin de la cour":hud.quest===9?"Préparer les salles basses":hud.quest===10?`Purger les salles basses (${[enemy.current,...minions.current].filter(foe=>foe.alive).length}/4)`:hud.quest===11?"Préparer l’assaut du donjon":hud.quest===12?`Briser le donjon (${[enemy.current,...minions.current].filter(foe=>foe.alive).length}/4)`:hud.quest===13?"Retourner à Valbrume : la tour s’ouvre":hud.quest===14?`Prendre la tour (${[enemy.current,...minions.current].filter(foe=>foe.alive).length}/4)`:"La tour des Cendres est purifiée"}</div><div className="top-actions"><button className={testMode?"active-test":""} onClick={()=>setTestMode(v=>!v)}>Test</button>{hud.talent>0&&<button onClick={()=>setPanel("talents")}>Talent {hud.talent}</button>}{hud.quest>0&&<button onClick={()=>setVillage(true)}>Valbrume</button>}<button onClick={save}>Sauvegarder</button></div></div>
      <div className="player-card"><span>VOIE DU VEILLEUR</span><b>{hud.spec==="blade"?"Lame des plaines":hud.spec==="bow"?"Rôdeur de Valbrume":"Tisseur de braises"}</b><small>NIVEAU {hud.level} · {hud.shrines}/3 BORNES</small></div>
      <div className={`class-passive ${hud.spec}`}><span>INSTINCT DE VOIE</span><b>{hud.spec==="blade"?"CONTRE DU VEILLEUR":hud.spec==="bow"?"PAS FANTÔME":"RÉSONANCE"}</b><small>{hud.spec==="blade"?"Défense parfaite · endurance et combo":hud.spec==="bow"?"Défense parfaite · flèches récupérées":"Défense parfaite · mana et pouvoir"}</small></div>
      {hud.quest===0&&<div className="exploration-ledger"><span>CHRONIQUE DES PLAINES</span><b>Mémoires retrouvées · {shrineCount(hud.lore)}/3</b><small>{hud.shrines<3?"Cherchez les stèles aux lueurs dorées entre les bornes.":"La posture dorée du Gardien cède aux défenses parfaites."}</small></div>}
      <div className="control-ribbon"><span><b>{bindingLabel(bindings.interact)}</b> Interagir</span><span><b>{bindingLabel(bindings.parry)}</b> Parade</span><span><b>{bindingLabel(bindings.dodge)}</b> Esquive</span><span><b>{bindingLabel(bindings.lockOn)}</b> Cible</span><span><b>Échap</b> Pause</span></div>
      <div className="message" role="status" aria-live="polite">{message}</div>
      {potionFx.current>0&&<div className="drink-state"><span>POTION CARMIN</span><b>NE ROMPEZ PAS LE GESTE</b><i><em style={{width:`${(1-potionFx.current/.78)*100}%`}}/></i></div>}
      {parryFx.current>0&&<div className={`guard-state ${perfectFx.current>0?"perfect":""}`}>{perfectFx.current>0?"FENÊTRE PARFAITE":"GARDE LEVÉE"}</div>}
      {perfectImpactFx.current>0&&<div className="defense-result parried"><b>PARADE PARFAITE</b><span>RIPOSTEZ</span></div>}
      {perfectDodgeFx.current>0&&<div className="defense-result dodged"><b>ESQUIVE PARFAITE</b><span>OUVERTURE CRÉÉE</span></div>}
      {started&&!mouseLook&&!panel&&!village&&!choosingSpec&&<button className="capture-hint" onClick={lockCursor}><b>◉ VERROUILLER LA SOURIS</b><span>Cliquez : le curseur restera capturé, même entre deux écrans</span></button>}
      {started&&guideOpen&&hud.quest===0&&<aside className="first-steps"><button aria-label="Fermer l’aide" onClick={()=>{setGuideOpen(false);localStorage.setItem("cendreval-guide-dismissed","1")}}>×</button><span>PREMIERS PAS</span><b>{hud.shrines<3?"Réveillez les bornes" : "Le Gardien vous attend"}</b><small>{hud.shrines<3?"Suivez l’orbe en haut de l’écran. Approchez une borne et pressez E : elle soigne et sauvegarde votre route.":enemy.current.hit>.42?"Le Gardien vacille : avancez et frappez avant qu’il ne retrouve sa garde.":enemy.current.telegraph>0?enemy.current.intent==="crush"?"Il lève son arme : décalez-vous à l’impact avec Shift + Q/D.":"Son arme se tend : déclenchez votre parade au dernier instant (MB3).":"Restez face à lui. Sa posture et le cercle au sol annoncent toujours le prochain coup."}</small><div><i className={hud.shrines>0?"done":""}>1</i><i className={hud.shrines>1?"done":""}>2</i><i className={hud.shrines>2?"done":""}>3</i></div></aside>}
      {testMode&&<button className="duel-button" onClick={()=>{duelIntroShown.current=false;prepareFirstDuel()}}>DUEL · PREMIER GARDIEN</button>}
      {enemy.current.alive&&(enemy.current.telegraph>0||(enemy.current.strike??0)>0)&&hud.shrines>=3&&(()=>{const duration=attackDuration(enemy.current.intent);const impact=(enemy.current.strike??0)>0;const progress=impact?100:100-Math.max(0,Math.min(100,enemy.current.telegraph/duration*100));const dodgeOnly=enemy.current.intent==="slam";const tap=defenseTap.current;const tapVisible=tap.time>0;const timing=tapVisible?(tap.progress>=72?"BON TIMING":tap.kind==="dodge"?"ESQUIVE TROP TÔT":"GARDE LEVÉE TÔT"):progress>=72?"PRÉPAREZ-VOUS":"ATTENDEZ";return <div className={`attack-warning ${enemy.current.intent??"sweep"}${impact?" impact":""}`}><b>{impact?"◆ IMPACT":dodgeOnly?"☠ RUPTURE DE CENDRE":enemy.current.intent==="crush"?"⚠ ÉCRASEMENT":enemy.current.intent==="lunge"?"⚠ ESTOCADE":enemy.current.intent==="sweep"?"⚠ BALAYAGE":"⚠ TIR DE CENDRE"}</b><span>{impact?(dodgeOnly?"Onde imblocable : esquivez maintenant !":"Maintenant : parade ou esquive !"):dodgeOnly?"Le cercle entier va éclater : préparez une esquive tardive.":enemy.current.intent==="crush"?"Impact lourd : esquive latérale ou parade parfaite.":enemy.current.intent==="lunge"?"Second temps rapide : esquivez de côté ou parez au dernier instant.":enemy.current.intent==="sweep"?"Restez proche : la parade ouvre une riposte.":"Sortez de l’axe ou brisez le tireur."}</span><small className={`timing-callout${tapVisible?` ${tap.kind}`:""}`}>{impact?(dodgeOnly?"ESQUIVEZ MAINTENANT":"PAREZ MAINTENANT"):timing}</small><i className="timing-track" aria-hidden="true"><em style={{width:`${progress}%`}}/><strong/>{tapVisible&&<u className={tap.kind} style={{left:`${tap.progress}%`}}/>}</i></div>})()}
      {enemy.current.alive&&enemy.current.boss&&enemy.current.telegraph>0&&<div className="defense-keys"><span>{enemy.current.intent==="slam"?"ESQUIVE OBLIGATOIRE":enemy.current.intent==="crush"||enemy.current.intent==="lunge"?"DÉCALAGE CONSEILLÉ":"PARADE CONSEILLÉE"}</span><b>{enemy.current.intent==="slam"?bindingLabel(bindings.dodge):enemy.current.intent==="crush"||enemy.current.intent==="lunge"?`${bindingLabel(bindings.dodge)} + ${bindingLabel(bindings.left)}/${bindingLabel(bindings.right)}`:bindingLabel(bindings.parry)}</b></div>}
      {enemy.current.alive&&enemy.current.boss&&hud.shrines>=3&&<div className={`combat-cue${enemy.current.hit>.42?" opening":""}`}>{enemy.current.hit>.42?(hud.spec==="blade"?"OUVERTURE · RIPOSTE LOURDE":hud.spec==="bow"?"OUVERTURE · TIR D’OPPORTUNITÉ":"OUVERTURE · FLAMME AMPLIFIÉE"):enemy.current.telegraph>0?enemy.current.intent==="slam"?"ONDE IMBLOCABLE · ESQUIVEZ":enemy.current.intent==="crush"?"ESQUIVEZ À L’IMPACT":enemy.current.intent==="lunge"?"SECOND TEMPS · DÉCALEZ-VOUS":"PAREZ À L’IMPACT":"OBSERVEZ SA GARDE"}</div>}
      {enemy.current.alive&&enemy.current.boss&&hud.shrines>=3&&bladeChain.current>0&&<div className={`blade-chain chain-${bladeChain.current}`}><span>ENCHAÎNEMENT</span><b>{bladeChain.current}/3</b><i><em style={{width:`${bladeChainTimer.current/1.05*100}%`}}/></i></div>}
      {hud.hp<=0&&<div className="death-attempt"><span>BILAN DE L’ESSAI</span><b>{Math.floor(duelTimer.current/60)}:{String(Math.floor(duelTimer.current%60)).padStart(2,"0")}</b><small>{duelRecord.current.hitsTaken} coups subis · {duelRecord.current.perfectParries+duelRecord.current.perfectDodges} défenses parfaites</small></div>}
      {hud.hp<=0&&<div className="death-screen"><span className="eyebrow">VOUS ÊTES TOMBÉ</span><h2>Les plaines attendent votre retour.</h2><p>La rencontre est conservée : reprenez immédiatement le test depuis le chemin.</p><button onClick={revive}>SE RELEVER</button></div>}
      {combatSummary&&<div className="combat-summary"><span>PREMIER GARDIEN VAINCU</span><h2>La plaine se tait.</h2><p>+18 or · +40 expérience</p><strong className="duel-rank">RANG {duelRecord.current.hitsTaken===0?"S — SANS BLESSURE":duelRecord.current.hitsTaken<=2?"A — VEILLEUR":"B — SURVIVANT"}</strong><div className="duel-record"><span>PARADES PARFAITES <b>{duelRecord.current.perfectParries}</b></span><span>ESQUIVES PARFAITES <b>{duelRecord.current.perfectDodges}</b></span><span>RIPOSTES <b>{duelRecord.current.ripostes}</b></span><span>MEILLEUR SANG-FROID <b>{duelRecord.current.bestFocus??0}/3</b></span><span>COUPS SUBIS <b>{duelRecord.current.hitsTaken}</b></span></div><small>{duelRecord.current.perfectParries+duelRecord.current.perfectDodges>0?"Votre défense a brisé le rythme du Gardien. Valbrume se souviendra de votre sang-froid.":"Vous avez ouvert la route de Valbrume. Les bornes restent des refuges : utilisez-les avant chaque grand combat."}</small><button onClick={()=>{setCombatSummary(false);setVillage(true)}}>POURSUIVRE VERS VALBRUME</button></div>}
      {combatSummary&&<div className="duel-time"><span>TEMPS DU DUEL</span><b>{Math.floor(duelFinalTime.current/60)}:{String(Math.floor(duelFinalTime.current%60)).padStart(2,"0")}</b><small>{duelRecord.current.executions??0} exécution{(duelRecord.current.executions??0)>1?"s":""}</small></div>}
      {duelIntroFx.current>0&&<div className="duel-intro"><span>LES TROIS BORNES ONT PARLÉ</span><h2>GARDIEN DES RUINES</h2><i>Serment brisé de Cendreval</i></div>}
      {hud.quest>=15&&!endingSeen&&<div className="ending-screen"><span className="eyebrow">CHRONIQUE ACHEVÉE</span><h2>La cendre retombe.</h2><p>Le roi a disparu, les cloches de Valbrume résonnent dans la plaine et le château noir cesse enfin de veiller.</p><div><button onClick={()=>{setEndingSeen(true);setVillage(true)}}>RETOURNER À VALBRUME</button><button className="ending-close" onClick={()=>{setEndingSeen(true);setMessage("Cendreval respire à nouveau.")}}>CONTINUER À EXPLORER</button></div></div>}
      {hud.quest>=15&&endingSeen&&!village&&<div className="echo-card"><span>ÉCHOS DE CENDRE</span><b>Palier accompli : {hud.echoBest}/5</b><small>Un défi rejouable pour éprouver vos talents et la défense active.</small><button onClick={beginAshEcho}>ENTRER DANS L’ÉCHO {Math.min(5,hud.echoTier+1)}</button><button className="echo-reset" onClick={restartJourney}>NOUVEAU VOYAGE</button></div>}
      {enemy.current.alive&&hud.shrines>=3&&<div className="boss-health"><span>{enemy.current.boss?`GARDIEN DES RUINES${enemy.current.hp<=35?" · PHASE II":""}`:hud.quest===7?"CAPITAINE NOIR DE LA COUR":hud.quest===10?"MAÎTRE D’ARMES DES SALLES BASSES":hud.quest===12?"MARÉCHAL DE CENDRE":hud.quest===14?"ROI DE CENDRE · TOUR FINALE":"SENTINELLE DE LA PORTE NOIRE"}</span><i style={{width:`${enemy.current.hp/(enemy.current.boss?70:hud.quest===7?130:hud.quest===10?150:hud.quest===12?180:hud.quest===14?240:100)*100}%`}}/></div>}
      {enemy.current.alive&&enemy.current.boss&&enemy.current.hit>0&&<div className={`boss-wound-state${enemy.current.guardBroken?" broken":""}`}>{enemy.current.guardBroken?"POSTURE BRISÉE":enemy.current.hp<=35?"ARMURE FISSURÉE":"IMPACT CONFIRMÉ"}</div>}
      {enemy.current.alive&&enemy.current.boss&&hud.shrines>=3&&<div className={`guardian-state${enemy.current.hit>.42?" opening":enemy.current.telegraph>0?" arming":(enemy.current.strike??0)>0?" striking":""}`}><b>{enemy.current.hit>.42?"VULNÉRABLE":potionFx.current>0&&enemy.current.intent==="lunge"?"PUNIT VOTRE SOIN":(enemy.current.strike??0)>0?"FRAPPE ACTIVE":enemy.current.telegraph>0?enemy.current.intent==="slam"?"RUPTURE · ONDE IMBLOCABLE":enemy.current.intent==="crush"?"ANTICIPATION · ÉCRASEMENT":enemy.current.intent==="lunge"?"ENCHAÎNEMENT · ESTOCADE":"ANTICIPATION · BALAYAGE":enemy.current.cooldown>.25?"RÉCUPÉRATION":"EN GARDE"}</b><span>{enemy.current.hit>.42?"Ripostez maintenant.":potionFx.current>0&&enemy.current.intent==="lunge"?"La potion sera interrompue si l’estocade touche.":(enemy.current.strike??0)>0?"Fenêtre défensive ouverte.":enemy.current.telegraph>0?enemy.current.intent==="slam"?"La parade cédera : attendez l’explosion et esquivez.":enemy.current.intent==="lunge"?"Ne relâchez pas votre garde après le balayage.":"Lisez le geste, attendez l’impact.":enemy.current.cooldown>.25?"Avancez ou reprenez votre souffle.":"Gardez-le au centre de l’écran."}</span></div>}
      {enemy.current.alive&&enemy.current.boss&&hud.shrines>=3&&<div className="duel-cadence" aria-label="Rythme du duel"><span className={enemy.current.telegraph>0?"active":""}><i>1</i>LIRE</span><span className={(enemy.current.strike??0)>0?"active":""}><i>2</i>DÉFENDRE</span><span className={enemy.current.hit>.42?"active":""}><i>3</i>RIPOSTER</span></div>}
      {enemy.current.alive&&enemy.current.boss&&hud.shrines>=3&&duelFocus.current>0&&<div className={`duel-focus focus-${duelFocus.current}`}><span>SANG-FROID</span><div>{[1,2,3].map(level=><i key={level} className={duelFocus.current>=level?"filled":""}/>)}</div><b>{duelFocus.current>=3?"FRAPPE RENFORCÉE PRÊTE":"DÉFENSES PARFAITES CONSÉCUTIVES"}</b></div>}
      {enemy.current.alive&&enemy.current.boss&&enemy.current.guardBroken&&<div className="execution-window"><span>POSTURE ANÉANTIE</span><b>FRAPPEZ · EXÉCUTION DU SCEAU</b><small>+18 dégâts · impact renforcé</small></div>}
      {damagePop.current.time>0&&<div className={`damage-pop ${damagePop.current.kind}`}>{damagePop.current.kind==="hurt"?"−":"+"}{damagePop.current.value}<small>{damagePop.current.kind==="execution"?"EXÉCUTION":damagePop.current.kind==="hurt"?"SUBI":"DÉGÂTS"}</small></div>}
      {mistakeCoach&&enemy.current.alive&&enemy.current.boss&&hud.shrines>=3&&<div className="mistake-coach"><span>CONSEIL DU VEILLEUR</span><b>{mistakeCoach}</b><small>Une défense parfaite efface ce conseil.</small></div>}
      {phaseFx.current>0&&<div className="phase-transition"><span>LE SCEAU SE BRISE</span><b>PHASE II</b><small>Enchaînements accélérés · dégâts renforcés</small></div>}
      {staggerFx.current>0&&<div className="guard-break"><span>GARDE ROMPUE</span><b>REPRENEZ APPUI</b><i style={{width:`${(1-staggerFx.current/.72)*100}%`}}/></div>}
      {enemy.current.alive&&enemy.current.boss&&hud.shrines>=3&&<div className="posture-meter"><span>POSTURE DU GARDIEN</span><i><em style={{width:`${guardianPosture.current}%`}}/></i><small>{guardianPosture.current<=35?"Une défense parfaite peut le briser.":"Parades parfaites et ripostes brisent sa garde."}</small></div>}
      {locked&&lockedTarget.current?.alive&&<div className="lock-state"><b>◈ CIBLE VERROUILLÉE</b><span>{lockedTarget.current.name} · {bindingLabel(bindings.lockOn)} pour libérer</span></div>}
      {locked&&lockedTarget.current?.alive&&<div className={`lock-reticle${lockedTarget.current.guardBroken?" broken":""}`} aria-hidden="true"><i/><i/><i/><i/></div>}
      {enemy.current.alive&&enemy.current.boss&&hud.shrines>=3&&guardianBeat.current<3&&<div className="combat-lesson"><span>RITUEL DU GARDIEN · {guardianBeat.current+1}/3</span><b>{guardianBeat.current<2?"Balayage : attendez l’impact, puis parez.":"Écrasement : restez mobile, esquivez au dernier instant."}</b></div>}
      {[enemy.current,...minions.current].filter(foe=>foe.alive).length>1&&<div className="threat-feed"><span>MENACES ACTIVES</span>{[enemy.current,...minions.current].filter(foe=>foe.alive).slice(0,4).map((foe,index)=><i key={`${foe.name}-${index}`} className={foe.kind}><b>{foe.kind==="ranged"?"ARC":foe.kind==="brute"?"LOURD":"LAME"}</b>{foe.name}</i>)}</div>}
      {testMode&&<div className="test-kit"><span>BAC À SABLE</span><button onClick={restoreForTest}>RESSOURCES</button><button onClick={resetEncounter}>REJOUER LE COMBAT</button><button onClick={prepareCastleTest}>PRÉPARER LE CHÂTEAU</button>{hud.quest>=2&&<button onClick={beginExpedition}>LANCER L’EXPÉDITION</button>}{hud.quest>=9&&<button onClick={enterLowerHalls}>TESTER LES SALLES BASSES</button>}{hud.quest>=11&&<button onClick={beginDungeonAssault}>TESTER LE DONJON</button>}{hud.quest>=13&&<button onClick={beginThroneAssault}>TESTER LA TOUR</button>}<button onClick={shiftSky}>AUBE / NUIT</button><small>Les raccourcis et la sauvegarde restent actifs.</small></div>}
      <div className={`bars${hud.hp<30?" critical":""}${hud.stamina<24?" exhausted":""}`}><div><label>VIE <b>{Math.ceil(hud.hp)}</b></label><i className="hp" style={{width:`${hud.hp}%`}}/></div><div><label>MANA <b>{Math.ceil(hud.mana)}</b></label><i className="mana" style={{width:`${hud.mana}%`}}/></div><div><label>ENDURANCE <b>{Math.ceil(hud.stamina)}</b></label><i className="stamina" style={{width:`${hud.stamina}%`}}/></div></div>
      <div className="quickbar"><button onClick={potion}><b>{bindingLabel(bindings.potion)}</b> Potion <em>{hud.potions}</em></button><button onClick={primaryAttack}><b>{bindingLabel(bindings.attack)}</b> {hud.spec==="blade"?"Lame":hud.spec==="bow"?"Tir rapide":"Étincelle"}</button><button onClick={()=>strike(true)}><b>{bindingLabel(bindings.spell)}</b> Flamme</button><button onClick={shootBow}><b>{bindingLabel(bindings.bow)}</b> Arc <em>{hud.arrows}</em></button><button onClick={parry}><b>{bindingLabel(bindings.parry)}</b> Parade</button><button onClick={dodge}><b>{bindingLabel(bindings.dodge)}</b> Esquive</button><button className={`ability${abilityReady?"":" cooldown"}`} onClick={ability}><b>{bindingLabel(bindings.ability)}</b> {abilityReady?(hud.spec==="blade"?"Garde":hud.spec==="bow"?"Volée":"Braises"):"Recharge…"}</button><span>◈ {hud.gold}</span></div>
      <div className="menu-buttons"><button onClick={()=>setPanel("inventory")}>SAC</button><button onClick={()=>setPanel("journal")}>JOURNAL</button><button onClick={()=>setPanel("combat")}>COMBAT</button><button onClick={()=>setPanel("controls")}>OPTIONS</button></div>
      <div className="touch"><div className="touch-dpad"><button aria-label="Pas à gauche" onPointerDown={()=>holdAction("left",true)} onPointerUp={()=>holdAction("left",false)} onPointerCancel={()=>holdAction("left",false)} onPointerLeave={()=>holdAction("left",false)}>◀</button><button aria-label="Avancer" onPointerDown={()=>holdAction("forward",true)} onPointerUp={()=>holdAction("forward",false)} onPointerCancel={()=>holdAction("forward",false)} onPointerLeave={()=>holdAction("forward",false)}>▲</button><button aria-label="Reculer" onPointerDown={()=>holdAction("back",true)} onPointerUp={()=>holdAction("back",false)} onPointerCancel={()=>holdAction("back",false)} onPointerLeave={()=>holdAction("back",false)}>▼</button><button aria-label="Pas à droite" onPointerDown={()=>holdAction("right",true)} onPointerUp={()=>holdAction("right",false)} onPointerCancel={()=>holdAction("right",false)} onPointerLeave={()=>holdAction("right",false)}>▶</button></div><div className="touch-actions"><button aria-label="Attaque principale" onClick={primaryAttack}>⚔</button><button aria-label="Parer" onClick={parry}>◒</button><button aria-label="Esquiver" onClick={dodge}>↯</button><button aria-label="Pouvoir de voie" onClick={ability}>✦</button></div></div></>}
      {panel==="pause"&&<div className="pause-panel"><span className="eyebrow">JEU EN PAUSE</span><h2>La plaine attend.</h2><p>Le temps, les ennemis et vos ressources sont arrêtés.</p><button onClick={()=>{setPanel(null);lockCursor()}}>REPRENDRE</button><div><button onClick={()=>setPanel("inventory")}>SAC</button><button onClick={()=>setPanel("journal")}>JOURNAL</button><button onClick={()=>setPanel("combat")}>COMBAT</button><button onClick={()=>setPanel("controls")}>OPTIONS</button></div><small>Échap · reprendre</small></div>}
      {panel==="controls"&&<div className="feel-settings"><span>RESSENTI</span><label>Volume des combats <input aria-label="Volume des combats" type="range" min="0" max="1" step="0.1" value={audioVolume} onChange={e=>{const value=Number(e.target.value);setAudioVolume(value);audioVolumeRef.current=value;localStorage.setItem("cendreval-audio-volume",String(value))}}/><b>{Math.round(audioVolume*100)}%</b></label><label>Secousses de caméra <input aria-label="Secousses de caméra" type="range" min="0" max="1.5" step="0.25" value={shakeScale} onChange={e=>{const value=Number(e.target.value);setShakeScale(value);shakeScaleRef.current=value;localStorage.setItem("cendreval-shake-scale",String(value))}}/><b>{Math.round(shakeScale*100)}%</b></label></div>}
      {panel&&panel!=="pause"&&<div className="panel"><button className="close" onClick={()=>setPanel(null)}>×</button>{panel==="controls"?<><span className="eyebrow">COMMANDES</span><h2>Clavier et souris</h2><p className="controls-note">Cliquez dans le jeu pour capturer la souris. Échap libère le curseur. Cliquez sur une action, puis pressez une touche ou un bouton de souris. Échap annule une association en attente.</p><label className="sensitivity">Sensibilité souris <input aria-label="Sensibilité souris" type="range" min="0.3" max="2.5" step="0.1" value={sensitivity} onChange={e=>changeSensitivity(Number(e.target.value))}/><b>{sensitivity.toFixed(1)}×</b></label><div className="bindings">{(Object.keys(ACTION_LABELS) as Action[]).map(action=><div className="binding" key={action}><span>{ACTION_LABELS[action]}</span><button className={capture===action?"listening":""} onClick={()=>setCapture(action)}>{capture===action?"Appuyez…":bindingLabel(bindings[action])}</button></div>)}</div><button className="reset-bindings" onClick={()=>applyBindings(DEFAULT_BINDINGS)}>RÉTABLIR LES COMMANDES</button></>:panel==="inventory"?<><span className="eyebrow">ÉQUIPEMENT · NIVEAU {hud.level}</span><h2>Sac de l’aventurier</h2><div className="inventory"><div className="item selected">⚔<span>Lame ébréchée<small>Dégâts 22{hud.relic==="iron"?" + 6":""}</small></span></div><div className="item">✦<span>Flamme ancienne<small>Coût 15 mana{hud.relic==="ember"?" · + 8 dégâts":""}</small></span></div><div className="item">♥<span>Potion carmin<small>Quantité : {hud.potions}</small></span></div><div className="item">◆<span>Éclats d’or<small>{hud.gold} pièces</small></span></div>{hud.relic!=="none"&&<div className="item selected">✥<span>{hud.relic==="iron"?"Cœur de fer":hud.relic==="oak"?"Œil du chêne":"Braise scellée"}<small>{hud.relic==="iron"?"+6 dégâts de lame":hud.relic==="oak"?"+8 dégâts d’arc":"+8 dégâts de flamme"}</small></span></div>}{hud.courtBoon!=="none"&&<div className="item selected">♜<span>{hud.courtBoon==="ward"?"Égide de la cour":hud.courtBoon==="fury"?"Fureur royale":"Focus royal"}<small>{hud.courtBoon==="ward"?"−2 dégâts reçus":hud.courtBoon==="fury"?"+4 dégâts infligés":"Pouvoir rechargé 28 % plus vite"}</small></span></div>}</div></>:panel==="combat"?<><span className="eyebrow">MANUEL DU VEILLEUR</span><h2>Lire le combat</h2><div className="objective"><b>Parade · MB3</b><br/><small>Bloque la frappe annoncée. Si elle touche pendant l’éclair bref de garde, l’ennemi est étourdi et vous récupérez 22 endurance. Frappez-le aussitôt : la riposte ajoute 14 dégâts.</small></div><div className="objective"><b>Esquive · Shift</b><br/><small>Évitez à la fin de la télégraphie : l’ennemi perd son élan et vous récupérez 10 endurance.</small></div><div className="objective"><b>Priorités</b><br/><small>Éliminez les archers à distance, puis exploitez l’étourdissement des brutes. Les actes de château possèdent un ancrage orange : il restaure et sauvegarde.</small></div><div className="objective"><b>Votre sceau</b><br/><small>{hud.courtBoon==="none"?"Le butin de la cour offrira Égide, Fureur ou Focus.":hud.courtBoon==="ward"?"Égide réduit chaque coup subi de 2.":hud.courtBoon==="fury"?"Fureur ajoute 4 dégâts à toutes vos attaques.":"Focus ramène plus vite votre pouvoir de voie."}</small></div></>:<><span className="eyebrow">JOURNAL</span><h2>La Crypte des rois muets</h2><p>Le village de Valbrume vit dans l’ombre d’un ancien gardien réveillé sous les collines.</p><div className={hud.shrines===3?"objective done":"objective"}>{hud.shrines===3?"✓ Les trois bornes ont répondu":`○ Éveiller les bornes anciennes (${hud.shrines}/3)`}</div><div className={hud.quest>0?"objective done":"objective"}>{hud.quest>0?"✓ Gardien terrassé":"○ Trouver et terrasser le gardien"}</div><div className={hud.quest>=2?"objective done":"objective"}>{hud.quest>=2?"✓ Récompense de Valbrume reçue":"○ Retourner à Valbrume"}</div><div className={hud.quest>=4?"objective done":"objective"}>{hud.quest>=4?"✓ Veilleurs cendrés dissipés":"○ Accomplir l’expédition des Veilleurs"}</div><div className={hud.quest>=8?"objective done":"objective"}>{hud.quest>=8?"✓ Cour extérieure libérée":"○ Nettoyer la cour du château noir"}</div><div className={hud.quest>=11?"objective done":"objective"}>{hud.quest>=11?"✓ Salles basses purgées":"○ Vaincre le maître d’armes"}</div><div className={hud.quest>=13?"objective done":"objective"}>{hud.quest>=13?"✓ Donjon noir brisé":"○ Abattre le maréchal de cendre"}</div></>}</div>}
      {village&&<div className="village"><div className="village-art"><div className="moon"/><div className="mountain one"/><div className="mountain two"/><div className="houses"><i/><i/><i/></div></div><div className="village-copy"><span className="eyebrow">VALBRUME · HALLE DU CONSEIL</span><h2>{hud.quest>=4?"« Les Veilleurs ont enfin cessé de chanter. »":"« Vous avez rendu le silence à nos morts. »"}</h2><p>{hud.quest>=4?"La doyenne pose une main sur votre relique. Au-delà de la plaine, la route du château noir est désormais ouverte.":"La doyenne Elenn vous accueille au coin du feu. Les habitants sortent de leurs maisons et le marchand a rouvert son étal."}</p>{hud.quest===1?<button className="gold-button" onClick={claimReward}>RECEVOIR LA RÉCOMPENSE</button>:<><div className="rewarded">✓ Vous êtes désormais protecteur de Valbrume.</div>{hud.relic==="none"&&<div className="relic-choice"><span>CHOISISSEZ UNE RELIQUE</span><button onClick={()=>chooseRelic("iron")}>CŒUR DE FER <small>+6 lame</small></button><button onClick={()=>chooseRelic("oak")}>ŒIL DU CHÊNE <small>+8 arc</small></button><button onClick={()=>chooseRelic("ember")}>BRAISE SCELLÉE <small>+8 flamme</small></button></div>}{hud.quest===2&&<button className="gold-button expedition-button" onClick={beginExpedition}>PARTIR POUR LES VEILLEURS</button>}{hud.quest===3&&<div className="rewarded">◌ L’expédition est en cours dans la plaine.</div>}{hud.quest===4&&<div className="rewarded">✓ Première expédition accomplie. La route du château noir attend.</div>}</>}<div className="merchant"><span>ÉTAL DE RUNE</span><p>Potion carmin · restaure 45 points de vie</p><button onClick={buyPotion}>ACHETER · 8 OR</button></div><button className="leave" onClick={()=>setVillage(false)}>RETOURNER À LA CRYPTE</button></div><button className="close village-close" onClick={()=>setVillage(false)}>×</button></div>}
      {village&&hud.quest>=8&&<div className="court-planning"><span className="eyebrow">CONSEIL DE GUERRE</span><h2>{hud.quest===8?"Choisissez un sceau de guerre.":hud.quest===9?"Les salles basses vous attendent.":hud.quest===10?"L’assaut des salles basses est en cours.":hud.quest===11?"Le donjon noir reste à prendre.":hud.quest===12?"L’assaut du donjon est en cours.":hud.quest===13?"La tour des Cendres s’est ouverte au-dessus du château.":hud.quest===14?"Le roi de cendre vous attend au sommet.":"La tour des Cendres est silencieuse."}</h2>{hud.quest===8&&<div className="boon-choice"><button onClick={()=>chooseCourtBoon("ward")}><b>ÉGIDE</b><small>−2 dégâts reçus</small></button><button onClick={()=>chooseCourtBoon("fury")}><b>FUREUR</b><small>+4 dégâts infligés</small></button><button onClick={()=>chooseCourtBoon("focus")}><b>FOCUS</b><small>Pouvoir plus rapide</small></button></div>}{hud.quest===9&&<button className="gold-button" onClick={enterLowerHalls}>ENTRER DANS LES SALLES BASSES</button>}{hud.quest===10&&<p className="rewarded">◌ Le maître d’armes demeure dans le château.</p>}{hud.quest===11&&<button className="gold-button" onClick={beginDungeonAssault}>LANCER L’ASSAUT DU DONJON</button>}{hud.quest===12&&<p className="rewarded">◌ Le maréchal de cendre garde le donjon.</p>}{hud.quest===13&&<button className="gold-button" onClick={beginThroneAssault}>MONTER À LA TOUR DES CENDRES</button>}{hud.quest===14&&<p className="rewarded">◌ Le roi de cendre défend encore son trône.</p>}{hud.quest>=15&&<p className="rewarded">✓ Cendreval est libre. La première chronique est achevée.</p>}</div>}
    </section>
    <footer><span>Une aventure rétro en vue subjective</span><span>Version prototype · Sauvegarde locale</span></footer>
    {panel==="talents"&&<div className="talent-panel"><button className="close" onClick={()=>setPanel(null)}>×</button><span className="eyebrow">PROGRESSION · {hud.talent} POINT</span><h2>Talents de combat</h2><p>Chaque voie peut être maîtrisée : les bonus sont permanents et s’ajoutent à la défense active.</p><div className="talent-list"><button className={hud.perkBlade?"learned":""} onClick={()=>learnPerk("perkBlade")}><b>Frappe du gardien</b><small>+8 dégâts de lame</small></button><button className={hud.perkBow?"learned":""} onClick={()=>learnPerk("perkBow")}><b>Flèche de chêne</b><small>+12 dégâts d’arc</small></button><button className={hud.perkArcane?"learned":""} onClick={()=>learnPerk("perkArcane")}><b>Braise profonde</b><small>+12 dégâts de flamme</small></button></div></div>}
  </main>;
}

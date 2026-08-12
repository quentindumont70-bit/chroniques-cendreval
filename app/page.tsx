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
let activeMap = PLAINS_MAP;
function mapForQuest(quest:number){return quest>=12?DUNGEON_MAP:quest>=10?HALLS_MAP:quest>=7?COURT_MAP:PLAINS_MAP}

type Relic = "none"|"iron"|"oak"|"ember";
type CourtBoon = "none"|"ward"|"fury"|"focus";
type Save = { x:number; y:number; a:number; hp:number; mana:number; stamina:number; gold:number; potions:number; arrows:number; spec:"blade"|"bow"|"arcane"; xp:number; talent:number; perkBlade:boolean; perkBow:boolean; perkArcane:boolean; enemyHp:number; quest:number; level:number; reward:number; shrines:number; relic:Relic; expedition:number; courtBoon:CourtBoon };
type Foe = {x:number;y:number;hp:number;alive:boolean;hit:number;cooldown:number;telegraph:number;boss:boolean;name:string;kind:"melee"|"ranged"|"brute"};
const START: Save = { x:3.5, y:16.5, a:-Math.PI/2, hp:100, mana:80, stamina:100, gold:12, potions:2, arrows:14, spec:"blade", xp:0, talent:0, perkBlade:false, perkBow:false,perkArcane:false,enemyHp:70,quest:0,level:1,reward:0,shrines:0,relic:"none",expedition:0,courtBoon:"none" };
const W = 426, H = 240, FOV = Math.PI / 3;
const SCENERY = [
  {x:4.7,y:13.5,kind:"tree"},{x:6.1,y:15.1,kind:"tree"},{x:8.1,y:16.9,kind:"stone"},
  {x:11.2,y:13.8,kind:"tree"},{x:13.6,y:15.8,kind:"tree"},{x:16.1,y:11.4,kind:"tree"},
  {x:5.4,y:8.3,kind:"tree"},{x:8.1,y:5.1,kind:"stone"},{x:13.6,y:5.7,kind:"tree"},
  {x:15.4,y:7.8,kind:"stone"},{x:10.1,y:12.8,kind:"sign"}
];
const SHRINES = [{x:7.5,y:14.5,name:"Borne du chemin"},{x:15.5,y:10.5,name:"Borne des pins"},{x:8.5,y:5.5,name:"Borne des ruines"}];
const CASTLE_GATE = {x:16.5,y:3.5};
const CASTLE_REST = {x:10.5,y:8.8};
type Action = "forward"|"back"|"left"|"right"|"turnLeft"|"turnRight"|"attack"|"spell"|"bow"|"parry"|"dodge"|"potion"|"ability"|"interact"|"inventory"|"journal"|"save";
type Bindings = Record<Action,string>;
const DEFAULT_BINDINGS: Bindings = {forward:"KeyZ",back:"KeyS",left:"KeyQ",right:"KeyD",turnLeft:"ArrowLeft",turnRight:"ArrowRight",attack:"Mouse0",spell:"Mouse2",bow:"KeyR",parry:"Mouse1",dodge:"ShiftLeft",potion:"Digit1",ability:"KeyF",interact:"KeyE",inventory:"KeyI",journal:"KeyJ",save:"KeyP"};
const ACTION_LABELS: Record<Action,string> = {forward:"Avancer",back:"Reculer",left:"Pas à gauche",right:"Pas à droite",turnLeft:"Tourner à gauche",turnRight:"Tourner à droite",attack:"Attaquer",spell:"Lancer la flamme",bow:"Tirer à l’arc",parry:"Parer",dodge:"Esquiver",potion:"Boire une potion",ability:"Pouvoir de voie",interact:"Interagir",inventory:"Ouvrir le sac",journal:"Ouvrir le journal",save:"Sauvegarder"};
function bindingLabel(value:string){return value.replace("Key","Touche ").replace("Digit","Touche ").replace("Arrow","Flèche ").replace("Mouse0","Clic gauche").replace("Mouse1","Clic molette").replace("Mouse2","Clic droit").replace("Mouse3","Souris 3").replace("Mouse4","Souris 4")}

function wallAt(x:number, y:number) {
  const row = activeMap[Math.floor(y)];
  return !row ? 1 : Number(row[Math.floor(x)] ?? 1);
}

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const horizonRef = useRef<HTMLImageElement|null>(null);
  const guardianRef = useRef<HTMLImageElement|null>(null);
  const shadowRef = useRef<HTMLImageElement|null>(null);
  const state = useRef<Save>({...START});
  const keys = useRef<Record<string,boolean>>({});
  const dragLook = useRef(false);
  const hoverLook = useRef(false);
  const lastMouseX = useRef<number|null>(null);
  const enemy = useRef<Foe>({x:10.5,y:8.5,hp:70,alive:true,hit:0,cooldown:0,telegraph:0,boss:true,name:"gardien",kind:"brute"});
  const minions = useRef<Foe[]>([
    {x:6.5,y:5.5,hp:34,alive:true,hit:0,cooldown:0,telegraph:0,boss:false,name:"ombre",kind:"melee"},
    {x:14.5,y:13.5,hp:34,alive:true,hit:0,cooldown:0,telegraph:0,boss:false,name:"ombre",kind:"melee"},
  ]);
  const reinforcements = useRef(false);
  const attackFx = useRef(0);
  const spellFx = useRef(0);
  const hurtFx = useRef(0);
  const parryFx = useRef(0);
  const perfectFx = useRef(0);
  const dodgeFx = useRef(0);
  const abilityFx = useRef(0);
  const abilityCd = useRef(0);
  const abilityReadyRef = useRef(true);
  const worldTime = useRef(.24);
  const last = useRef(0);
  const [started,setStarted] = useState(false);
  const [testMode,setTestMode] = useState(false);
  const [panel,setPanel] = useState<"inventory"|"journal"|"controls"|"combat"|"talents"|null>(null);
  const [village,setVillage] = useState(false);
  const [choosingSpec,setChoosingSpec] = useState(false);
  const [bindings,setBindings] = useState<Bindings>(DEFAULT_BINDINGS);
  const bindingsRef = useRef<Bindings>(DEFAULT_BINDINGS);
  const [capture,setCapture] = useState<Action|null>(null);
  const [mouseLook,setMouseLook] = useState(false);
  const [sensitivity,setSensitivity] = useState(1);
  const [abilityReady,setAbilityReady] = useState(true);
  const sensitivityRef = useRef(1);
  const [hud,setHud] = useState({...START});
  const [message,setMessage] = useState("Les ruines murmurent votre nom…");

  const sync = useCallback(() => {activeMap=mapForQuest(state.current.quest);setHud({...state.current})}, []);
  const gainXp = (amount:number)=>{const s=state.current;s.xp+=amount;while(s.xp>=s.level*40){s.xp-=s.level*40;s.level++;s.talent++;s.hp=100;s.mana=100;s.stamina=100;setMessage(`Niveau ${s.level} atteint — un point de talent disponible !`)}sync()};
  const applyBindings = useCallback((next:Bindings)=>{bindingsRef.current=next;setBindings(next);localStorage.setItem("cendreval-bindings",JSON.stringify(next))},[]);
  const clearInput = useCallback(()=>{keys.current={}},[]);
  const captureMouse = useCallback((event?:{clientX?:number})=>{if(started&&!panel&&!village&&!choosingSpec){dragLook.current=true;lastMouseX.current=event?.clientX??null;canvasRef.current?.requestPointerLock?.()}},[choosingSpec,panel,started,village]);
  const save = useCallback(() => {
    localStorage.setItem("cendreval-save", JSON.stringify(state.current));
    setMessage("Partie sauvegardée");
  }, []);
  const load = useCallback(() => {
    const raw=localStorage.getItem("cendreval-save");
    if(raw){const saved={...START,...JSON.parse(raw)};state.current=saved;if(saved.quest===3){enemy.current={x:10.5,y:8.5,hp:0,alive:false,hit:0,cooldown:0,telegraph:0,boss:true,name:"gardien",kind:"brute"};minions.current=[{x:7.3,y:13.1,hp:42,alive:true,hit:0,cooldown:.7,telegraph:0,boss:false,name:"veilleur archer",kind:"ranged"},{x:13.2,y:10.4,hp:46,alive:true,hit:0,cooldown:1.1,telegraph:0,boss:false,name:"veilleur",kind:"melee"},{x:9.4,y:6.7,hp:52,alive:true,hit:0,cooldown:1.5,telegraph:0,boss:false,name:"veilleur lourd",kind:"brute"}]}else if(saved.quest===5){enemy.current={x:14.4,y:4.7,hp:100,alive:true,hit:0,cooldown:1,telegraph:0,boss:false,name:"sentinelle noire",kind:"brute"};minions.current=[]}else if(saved.quest===7){enemy.current={x:10.5,y:6.8,hp:130,alive:true,hit:0,cooldown:1.2,telegraph:0,boss:false,name:"capitaine noir",kind:"brute"};minions.current=[{x:12.7,y:5.6,hp:48,alive:true,hit:0,cooldown:.5,telegraph:0,boss:false,name:"archer de cour",kind:"ranged"},{x:8.5,y:7.1,hp:54,alive:true,hit:0,cooldown:1,telegraph:0,boss:false,name:"garde noir",kind:"melee"}]}else if(saved.quest===10){enemy.current={x:10.5,y:5.8,hp:150,alive:true,hit:0,cooldown:1.1,telegraph:0,boss:false,name:"maître d’armes",kind:"brute"};minions.current=[{x:6.7,y:7.2,hp:55,alive:true,hit:0,cooldown:.5,telegraph:0,boss:false,name:"tireur de braise",kind:"ranged"},{x:14.2,y:7.1,hp:60,alive:true,hit:0,cooldown:.8,telegraph:0,boss:false,name:"lame noire",kind:"melee"},{x:10.4,y:10.4,hp:60,alive:true,hit:0,cooldown:1.3,telegraph:0,boss:false,name:"lame noire",kind:"melee"}]}else if(saved.quest===12){enemy.current={x:10.5,y:5.2,hp:180,alive:true,hit:0,cooldown:1,telegraph:0,boss:false,name:"maréchal de cendre",kind:"brute"};minions.current=[{x:6.4,y:7.3,hp:64,alive:true,hit:0,cooldown:.5,telegraph:0,boss:false,name:"arbalétrier noir",kind:"ranged"},{x:14.5,y:7.4,hp:64,alive:true,hit:0,cooldown:.7,telegraph:0,boss:false,name:"arbalétrier noir",kind:"ranged"},{x:10.5,y:10.2,hp:72,alive:true,hit:0,cooldown:1.1,telegraph:0,boss:false,name:"gardien de braise",kind:"brute"}]}else if(saved.quest>=6){enemy.current={x:10.5,y:8.5,hp:0,alive:false,hit:0,cooldown:0,telegraph:0,boss:true,name:"gardien",kind:"brute"};minions.current=[]}else{enemy.current.hp=saved.enemyHp;enemy.current.alive=saved.enemyHp>0}sync();setMessage("Sauvegarde chargée");}
    setStarted(true);
  },[sync]);

  const strike = useCallback((spell=false) => {
    if(panel) return;
    const s=state.current;
    if(spell && s.mana<15){setMessage("Pas assez de mana");return;}
    if(spell){s.mana-=15;spellFx.current=.35}else attackFx.current=.28;
    const candidates=[enemy.current,...minions.current].filter(e=>e.alive).sort((a,b)=>Math.hypot(a.x-s.x,a.y-s.y)-Math.hypot(b.x-s.x,b.y-s.y));
    const e=candidates[0]; if(!e){setMessage("La crypte est silencieuse.");sync();return}
    if(e.boss&&s.shrines<3){setMessage("Le sceau des trois bornes protège encore le gardien.");sync();return}
    const d=Math.hypot(e.x-s.x,e.y-s.y);
    const target=Math.atan2(e.y-s.y,e.x-s.x);
    const diff=Math.abs(Math.atan2(Math.sin(target-s.a),Math.cos(target-s.a)));
    if(e.alive && d<(spell?7:1.65) && diff<.32){
      const boon=s.courtBoon==="fury"?4:0;const base=spell?28+(s.perkArcane?12:0)+(s.relic==="ember"?8:0)+boon:22+(s.perkBlade?8:0)+(s.relic==="iron"?6:0)+boon;e.hp=Math.max(0,e.hp-base); e.hit=.18;
      if(e.boss)s.enemyHp=e.hp;
      if(e.hp===0){e.alive=false;s.gold+=e.boss?18:6;gainXp(e.boss?40:16);if(e.boss){s.quest=1;setMessage("Le gardien tombe. Valbrume vous attend !")}else setMessage("L’ombre se dissipe en cendres.");}
      else setMessage(spell?"La flamme dévore le gardien !":"Votre lame mord la pierre vive !");
    }
    sync();
  },[panel,sync]);

  const shootBow = useCallback(()=>{if(panel)return;const s=state.current;if(!s.arrows){setMessage("Plus de flèches.");return}const foes=[enemy.current,...minions.current].filter(e=>e.alive).sort((a,b)=>Math.hypot(a.x-s.x,a.y-s.y)-Math.hypot(b.x-s.x,b.y-s.y));const e=foes[0];if(e?.boss&&s.shrines<3){setMessage("Le sceau des trois bornes dévie votre flèche.");sync();return}s.arrows--;if(e){const dist=Math.hypot(e.x-s.x,e.y-s.y),target=Math.atan2(e.y-s.y,e.x-s.x),diff=Math.abs(Math.atan2(Math.sin(target-s.a),Math.cos(target-s.a)));if(dist<10&&diff<.18){e.hp=Math.max(0,e.hp-(30+(s.perkBow?12:0)+(s.relic==="oak"?8:0)+(s.courtBoon==="fury"?4:0)));if(e.boss)s.enemyHp=e.hp;e.hit=.22;if(!e.hp){e.alive=false;s.gold+=e.boss?18:6;gainXp(e.boss?40:16);if(e.boss)s.quest=1;}setMessage("Flèche précise !")}else setMessage("La flèche se perd dans les ténèbres.")}sync()},[panel,sync]);

  const parry = useCallback(()=>{const s=state.current;if(panel||s.stamina<10)return;s.stamina-=10;parryFx.current=.46;perfectFx.current=.13;sync();setMessage("Parade — frappez au moment de l’impact pour une parade parfaite.")},[panel,sync]);
  const dodge = useCallback(()=>{const s=state.current;if(panel||s.stamina<24)return;s.stamina-=24;dodgeFx.current=.34;const nx=s.x-Math.cos(s.a)*.9,ny=s.y-Math.sin(s.a)*.9;if(!wallAt(nx,s.y))s.x=nx;if(!wallAt(s.x,ny))s.y=ny;sync();setMessage("Esquive !")},[panel,sync]);
  const ability=useCallback(()=>{const s=state.current;if(panel||s.hp<=0)return;if(abilityCd.current>0){setMessage("Le pouvoir de votre voie se recharge.");return}abilityCd.current=s.courtBoon==="focus"?6.5:9;abilityReadyRef.current=false;setAbilityReady(false);abilityFx.current=.7;const foes=[enemy.current,...minions.current].filter(foe=>foe.alive&&(!foe.boss||s.shrines===3));const boon=s.courtBoon==="fury"?4:0;if(s.spec==="blade"){s.stamina=100;parryFx.current=s.relic==="iron"?1.35:1.05;perfectFx.current=s.relic==="iron"?.52:.38;for(const foe of foes){const dist=Math.hypot(foe.x-s.x,foe.y-s.y);if(dist<(s.relic==="iron"?2.8:2.1)){foe.hit=.8;foe.cooldown=1.9}}setMessage(s.relic==="iron"?"GARDE DU FER — le Cœur de fer étend votre riposte.":"GARDE DU FER — vos parades brisent l’élan adverse.")}else if(s.spec==="bow"){let struck=0;for(const foe of foes){const target=Math.atan2(foe.y-s.y,foe.x-s.x),diff=Math.abs(Math.atan2(Math.sin(target-s.a),Math.cos(target-s.a)));if(diff<.32&&Math.hypot(foe.x-s.x,foe.y-s.y)<11){foe.hp=Math.max(0,foe.hp-20-(s.perkBow?8:0)-(s.relic==="oak"?6:0)-boon);foe.hit=.45;if(foe.boss)s.enemyHp=foe.hp;struck++}}setMessage(struck?"VOLÉE DU RÔDEUR — les traits fendent l’air.":"Volée perdue : aucune cible devant vous.");}else{if(s.mana<25){abilityCd.current=0;abilityFx.current=0;abilityReadyRef.current=true;setAbilityReady(true);setMessage("Pas assez de mana pour les braises profondes.");return}s.mana-=25;let struck=0;for(const foe of foes){if(Math.hypot(foe.x-s.x,foe.y-s.y)<5.2){foe.hp=Math.max(0,foe.hp-24-(s.perkArcane?8:0)-(s.relic==="ember"?8:0)-boon);foe.hit=.55;if(foe.boss)s.enemyHp=foe.hp;struck++}}setMessage(struck?"BRAISES PROFONDES — la plaine s’embrase autour de vous.":"Les braises se dissipent dans le vent.")}for(const foe of foes){if(foe.hp===0&&foe.alive){foe.alive=false;s.gold+=foe.boss?18:6;gainXp(foe.boss?40:16);if(foe.boss){s.quest=1;setMessage("Le gardien tombe. Valbrume vous attend !")}}}sync()},[gainXp,panel,sync]);
  const interact=useCallback(()=>{if(panel||village)return;const s=state.current;const atRest=s.quest>=7&&Math.hypot(CASTLE_REST.x-s.x,CASTLE_REST.y-s.y)<1.75;if(atRest){s.hp=100;s.mana=100;s.stamina=100;s.potions=Math.max(s.potions,s.quest>=12?5:4);localStorage.setItem("cendreval-save",JSON.stringify(s));sync();setMessage("ANCRAGE DU CHÂTEAU — forces restaurées et progression sauvegardée.");return}const atGate=Math.hypot(CASTLE_GATE.x-s.x,CASTLE_GATE.y-s.y)<1.8;if(s.quest===4&&atGate){beginCastleApproach();return}if(s.quest===6&&atGate){enterCastleCourt();return}const index=SHRINES.findIndex(shrine=>Math.hypot(shrine.x-s.x,shrine.y-s.y)<1.75);if(index<0){setMessage(s.quest===4||s.quest===6?"La porte du château noir vous attend au nord-est.":s.quest>=7?"Cherchez l’ancrage de cendre au cœur du château.":"Aucun lieu ancien à portée.");return}const shrine=SHRINES[index],flag=1<<index;if(!(s.shrines&flag)){s.shrines|=flag;s.hp=100;s.mana=100;s.stamina=100;s.potions=Math.max(s.potions,2);s.gold+=4;localStorage.setItem("cendreval-save",JSON.stringify(s));setMessage(s.shrines===7?"Les trois bornes répondent : le gardien des ruines s’éveille.":`${shrine.name} éveillée — votre présence y est désormais ancrée.`)}else{s.hp=100;s.mana=100;s.stamina=100;setMessage(`${shrine.name} vous rend vos forces.`)}sync()},[panel,sync,village]);

  useEffect(()=>{
    const raw=localStorage.getItem("cendreval-bindings");
    if(raw){try{applyBindings({...DEFAULT_BINDINGS,...JSON.parse(raw)})}catch{}}
    const savedSensitivity=Number(localStorage.getItem("cendreval-mouse-sensitivity"));
    if(savedSensitivity){setSensitivity(savedSensitivity);sensitivityRef.current=savedSensitivity}
  },[applyBindings]);

  useEffect(()=>{
    const horizon=new Image();
    horizon.src="/cendreval-plains-v2.png";
    horizon.onload=()=>{horizonRef.current=horizon};
    const guardian=new Image();
    guardian.src="/guardian-pixel.png";
    guardian.onload=()=>{guardianRef.current=guardian};
    const shadow=new Image();
    shadow.src="/shadow-pixel.png";
    shadow.onload=()=>{shadowRef.current=shadow};
  },[]);

  useEffect(()=>{
    const trigger=(input:string)=>{
      if(village)return;
      const action=(Object.keys(bindingsRef.current) as Action[]).find(a=>bindingsRef.current[a]===input);
      if(action==="attack")strike(false);
      if(action==="spell")strike(true);
      if(action==="bow")shootBow();
      if(action==="parry")parry();
      if(action==="dodge")dodge();
      if(action==="potion")potion();
      if(action==="ability")ability();
      if(action==="interact")interact();
      if(action==="inventory")setPanel(p=>p==="inventory"?null:"inventory");
      if(action==="journal")setPanel(p=>p==="journal"?null:"journal");
      if(action==="save")save();
    };
    const down=(e:KeyboardEvent)=>{
      if(capture){e.preventDefault();if(e.code==="Escape"){setCapture(null);setMessage("Association annulée.");return}applyBindings({...bindingsRef.current,[capture]:e.code});setCapture(null);return}
      keys.current[e.code]=true;
      trigger(e.code);
      if(e.code==="Space")e.preventDefault();
      if(e.code==="Escape"){e.preventDefault();clearInput();setPanel(p=>p==="controls"?null:"controls");document.exitPointerLock?.()}
    };
    const up=(e:KeyboardEvent)=>{keys.current[e.code]=false};
    const mouseDown=(e:PointerEvent)=>{
      const input=`Mouse${e.button}`;
      if(capture){e.preventDefault();e.stopPropagation();applyBindings({...bindingsRef.current,[capture]:input});setCapture(null);setMessage(`Commande associée à ${bindingLabel(input)}.`);return}
      keys.current[input]=true;trigger(input);
      if(started && !panel && !village && canvasRef.current?.contains(e.target as Node))captureMouse(e);
      if(e.button!==0){e.preventDefault();e.stopPropagation()}
    };
    const mouseUp=(e:PointerEvent)=>{keys.current[`Mouse${e.button}`]=false;if(e.button===0&&document.pointerLockElement!==canvasRef.current){dragLook.current=false;lastMouseX.current=null}};
    const move=(e:MouseEvent)=>{const locked=document.pointerLockElement===canvasRef.current;if(started&&(locked||dragLook.current||hoverLook.current)&&!panel&&!village){const delta=locked?e.movementX:(lastMouseX.current===null?0:e.clientX-lastMouseX.current);lastMouseX.current=e.clientX;state.current.a+=delta*.0024*sensitivityRef.current}};
    const lock=()=>{if(document.pointerLockElement!==canvasRef.current){clearInput();lastMouseX.current=null}setMouseLook(document.pointerLockElement===canvasRef.current)};
    const blur=()=>clearInput();
    addEventListener("keydown",down);addEventListener("keyup",up);addEventListener("pointerdown",mouseDown);addEventListener("pointerup",mouseUp);addEventListener("mousemove",move);addEventListener("pointerlockchange",lock);addEventListener("blur",blur);
    return()=>{removeEventListener("keydown",down);removeEventListener("keyup",up);removeEventListener("pointerdown",mouseDown);removeEventListener("pointerup",mouseUp);removeEventListener("mousemove",move);removeEventListener("pointerlockchange",lock);removeEventListener("blur",blur)};
  },[ability,applyBindings,capture,captureMouse,clearInput,dodge,interact,panel,parry,save,shootBow,started,strike,village]);

  useEffect(()=>{clearInput();document.exitPointerLock?.()},[clearInput,panel,village,choosingSpec]);

  useEffect(()=>{
    if(!started) return;
    const canvas=canvasRef.current!; const ctx=canvas.getContext("2d")!;
    ctx.imageSmoothingEnabled=false;
    let raf=0;
    const loop=(t:number)=>{
      const dt=Math.min(.04,(t-last.current)/1000||0);last.current=t;
      const s=state.current;
      if(!panel&&!village&&!choosingSpec&&s.hp>0)worldTime.current=(worldTime.current+dt*.006)%1;
      if(s.hp>0&&!panel&&!village&&!choosingSpec){
        let turn=0,move=0,strafe=0;
        if(keys.current[bindingsRef.current.turnLeft])turn-=1;
        if(keys.current[bindingsRef.current.turnRight])turn+=1;
        if(keys.current[bindingsRef.current.forward])move+=1;
        if(keys.current[bindingsRef.current.back])move-=1;
        if(keys.current[bindingsRef.current.left])strafe-=1;if(keys.current[bindingsRef.current.right])strafe+=1;
        s.a+=turn*dt*2.15;
        const speed=dt*2.35, dx=(Math.cos(s.a)*move+Math.cos(s.a+Math.PI/2)*strafe)*speed, dy=(Math.sin(s.a)*move+Math.sin(s.a+Math.PI/2)*strafe)*speed;
        if(!wallAt(s.x+dx,s.y))s.x+=dx;if(!wallAt(s.x,s.y+dy))s.y+=dy;
      }
      attackFx.current=Math.max(0,attackFx.current-dt);spellFx.current=Math.max(0,spellFx.current-dt);hurtFx.current=Math.max(0,hurtFx.current-dt);parryFx.current=Math.max(0,parryFx.current-dt);perfectFx.current=Math.max(0,perfectFx.current-dt);dodgeFx.current=Math.max(0,dodgeFx.current-dt);abilityFx.current=Math.max(0,abilityFx.current-dt);if(!panel&&!village&&!choosingSpec)abilityCd.current=Math.max(0,abilityCd.current-dt);if(abilityCd.current===0&&!abilityReadyRef.current){abilityReadyRef.current=true;setAbilityReady(true)}s.stamina=Math.min(100,s.stamina+dt*16);
      if(s.hp>0&&!panel&&!village&&!choosingSpec)for(const foe of [enemy.current,...minions.current]){
        const telegraphBefore=foe.telegraph;foe.hit=Math.max(0,foe.hit-dt);foe.cooldown=Math.max(0,foe.cooldown-dt);foe.telegraph=Math.max(0,foe.telegraph-dt);
        if(!foe.alive||(foe.boss&&s.shrines<3))continue;
        const vx=s.x-foe.x,vy=s.y-foe.y,dist=Math.hypot(vx,vy);
        const enraged=foe.boss&&foe.hp<=35;
        const ranged=foe.kind==="ranged",brute=foe.kind==="brute"&&!foe.boss,reach=ranged?5.4:1.25,stop=ranged?3.2:.9;
        if(dist<7&&dist>stop&&foe.telegraph===0){const step=dt*(foe.boss?(enraged ? .96 : .65):ranged?.56:brute?.62:.85),nx=foe.x+vx/dist*step,ny=foe.y+vy/dist*step;if(!wallAt(nx,foe.y))foe.x=nx;if(!wallAt(foe.x,ny))foe.y=ny;}
        if(dist<reach&&foe.cooldown===0&&foe.telegraph===0){foe.telegraph=foe.boss?(enraged ? .42 : .64):ranged?.72:brute?.72:.48;setMessage(foe.boss?(enraged?"Le gardien se déchaîne !":"Le gardien lève son arme !"):ranged?"Le Veilleur tend son arc de cendre !":brute?"Le Veilleur lourd arme son marteau !":"L’ombre se prépare à frapper !");}
        if(telegraphBefore>0&&foe.telegraph===0){foe.cooldown=foe.boss?(enraged ? .72 : 1.15):ranged?1.8:brute?1.65:1.35;if(dodgeFx.current>0){foe.hit=.42;foe.cooldown=1.65;s.stamina=Math.min(100,s.stamina+10);setMessage("ESQUIVE PARFAITE — l’ennemi vous perd et votre endurance revient.")}else if(parryFx.current>0){if(perfectFx.current>0){foe.hit=.65;foe.cooldown=1.8;s.stamina=Math.min(100,s.stamina+22);setMessage("PARADE PARFAITE — l’ennemi est étourdi !")}else{setMessage("Parade réussie.")}}else{const raw=foe.boss?(enraged?11:8):ranged?5:brute?8:4;const damage=Math.max(1,raw-(s.courtBoon==="ward"?2:0));s.hp=Math.max(0,s.hp-damage);hurtFx.current=.25;sync();setMessage(s.hp?`${ranged?"La flèche de cendre":brute?"Le marteau du Veilleur":foe.boss?"Le gardien":"Une ombre"} vous frappe !`: "Vous êtes tombé… rechargez votre sauvegarde.");}}
      }
      if(s.shrines===3&&enemy.current.alive&&enemy.current.hp<=35&&!reinforcements.current){reinforcements.current=true;minions.current.push({x:8.2,y:8.4,hp:28,alive:true,hit:0,cooldown:.5,telegraph:0,boss:false,name:"ombre",kind:"melee"},{x:12.8,y:9.2,hp:28,alive:true,hit:0,cooldown:.7,telegraph:0,boss:false,name:"ombre",kind:"melee"});setMessage("PHASE II — les ombres jaillissent des ruines !")}
      if(s.quest===3&&!minions.current.some(foe=>foe.alive)){s.quest=4;s.expedition=2;s.gold+=20;s.talent++;sync();setMessage("EXPÉDITION ACCOMPLIE — les veilleurs cendrés se dispersent. +20 or, +1 talent.")}
      if(s.quest===5&&!enemy.current.alive){s.quest=6;s.gold+=30;s.talent++;localStorage.setItem("cendreval-save",JSON.stringify(s));sync();setMessage("LA PORTE CÈDE — la route du château noir est ouverte. +30 or, +1 talent.")}
      if(s.quest===7&&!enemy.current.alive&&!minions.current.some(foe=>foe.alive)){s.quest=8;s.gold+=55;s.talent++;localStorage.setItem("cendreval-save",JSON.stringify(s));sync();setMessage("COUR NETTOYÉE — le capitaine noir s’effondre. +55 or, +1 talent.")}
      if(s.quest===10&&!enemy.current.alive&&!minions.current.some(foe=>foe.alive)){s.quest=11;s.gold+=80;s.talent+=2;localStorage.setItem("cendreval-save",JSON.stringify(s));sync();setMessage("SALLES BASSES PURGÉES — le maître d’armes tombe. +80 or, +2 talents.")}
      if(s.quest===12&&!enemy.current.alive&&!minions.current.some(foe=>foe.alive)){s.quest=13;s.gold+=110;s.talent+=2;localStorage.setItem("cendreval-save",JSON.stringify(s));sync();setMessage("DONJON BRISÉ — le maréchal de cendre tombe. +110 or, +2 talents.")}

      // Ciel voûté et sol en damier rétro.
      const inCourt=s.quest>=7;
      const inHalls=s.quest>=10;
      const inDungeon=s.quest>=12;
      const sky=ctx.createLinearGradient(0,0,0,H/2);sky.addColorStop(0,inDungeon?"#130e19":inCourt?"#181625":"#314d82");sky.addColorStop(.55,inDungeon?"#3a202b":inCourt?"#4a4154":"#8ca6c7");sky.addColorStop(1,inDungeon?"#6e3534":inCourt?"#786b66":"#c4b88f");ctx.fillStyle=sky;ctx.fillRect(0,0,W,H/2);
      const horizon=horizonRef.current;
      if(inHalls){ctx.fillStyle=inDungeon?"#1f101b":"#211c25";ctx.fillRect(0,0,W,H*.5);ctx.fillStyle=inDungeon?"rgba(204,63,53,.2)":"rgba(163,110,78,.18)";for(let x=-8;x<W+14;x+=34){ctx.fillRect(x,0,16,H*.42);ctx.fillRect(x-5,H*.3,26,4)}ctx.fillStyle=inDungeon?"#9f3837":"#6b5761";ctx.fillRect(0,H*.37,W,5);for(let x=0;x<W;x+=36)ctx.fillRect(x,H*.25,5,H*.17)}else if(horizon&&!inCourt){const pan=Math.sin(s.a)*12;ctx.drawImage(horizon,pan-14,0,W+28,H*.59)}else{
        ctx.fillStyle="rgba(244,222,161,.72)";ctx.fillRect(55,27,18,18);ctx.fillStyle="rgba(244,222,161,.28)";ctx.fillRect(50,22,28,28);
        ctx.fillStyle="rgba(238,242,230,.38)";ctx.fillRect(125,27,42,3);ctx.fillRect(141,23,23,3);ctx.fillRect(190,45,58,3);ctx.fillRect(205,41,25,3);
        ctx.fillStyle="#7283a0";ctx.beginPath();ctx.moveTo(0,93);ctx.lineTo(68,48);ctx.lineTo(120,94);ctx.lineTo(190,60);ctx.lineTo(263,95);ctx.lineTo(342,45);ctx.lineTo(W,92);ctx.lineTo(W,120);ctx.lineTo(0,120);ctx.fill();
        ctx.fillStyle="#38435c";ctx.fillRect(296,55,22,43);ctx.fillRect(321,67,38,31);ctx.fillRect(301,46,12,52);ctx.fillRect(346,50,9,48);ctx.fillStyle="#253044";ctx.fillRect(298,43,18,6);ctx.fillRect(344,47,15,5);ctx.fillRect(316,61,47,6);
      }
      const floor=ctx.createLinearGradient(0,H/2,0,H);floor.addColorStop(0,inDungeon?"#4d282a":inHalls?"#463a36":inCourt?"#5b5357":"#6f8050");floor.addColorStop(1,inDungeon?"#100c14":inHalls?"#15131a":inCourt?"#242229":"#26341e");ctx.fillStyle=floor;ctx.fillRect(0,H/2,W,H/2);
      for(let y=H/2;y<H;y+=8){ctx.fillStyle=inCourt?(y%16?"rgba(24,21,28,.52)":"rgba(156,139,126,.19)"):(y%16?"rgba(33,56,27,.45)":"rgba(161,146,82,.24)");ctx.fillRect(0,y,W,1)}
      if(inCourt){ctx.fillStyle=inDungeon?"#1d1019":inHalls?"#211b21":"#37313a";ctx.fillRect(0,H*.43,W,H*.08);ctx.fillStyle=inDungeon?"#b44d43":inHalls?"#9b6348":"#7c6970";for(let x=0;x<W;x+=18)ctx.fillRect(x,H*.43,11,4);if(inHalls){ctx.fillStyle=inDungeon?"rgba(244,67,54,.34)":"rgba(245,137,58,.3)";for(let x=16;x<W;x+=74){ctx.fillRect(x,H*.4,4,13);ctx.fillRect(x-2,H*.4,8,3)}}}else{ctx.fillStyle="rgba(181,146,80,.35)";ctx.beginPath();ctx.moveTo(W*.45,H);ctx.lineTo(W*.64,H);ctx.lineTo(W*.56,H/2);ctx.lineTo(W*.53,H/2);ctx.fill();}
      const guide=s.quest===4||s.quest===6?CASTLE_GATE:s.shrines<3?SHRINES.find((_,index)=>!(s.shrines&(1<<index))):enemy.current;
      const guideLabel=s.quest===4?"PORTE NOIRE":s.quest===6?"COUR EXTÉRIEURE":s.shrines<3?"BORNE ANCIENNE":s.quest>=10?"ENNEMI MARQUÉ":"RUINES SCELLÉES";
      if(guide&&(!("alive" in guide)||guide.alive)){let guideAngle=Math.atan2(guide.y-s.y,guide.x-s.x)-s.a;guideAngle=Math.atan2(Math.sin(guideAngle),Math.cos(guideAngle));const gx=W/2+Math.max(-W*.34,Math.min(W*.34,guideAngle/FOV*W));ctx.strokeStyle="rgba(255,228,160,.75)";ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(W/2,14);ctx.lineTo(gx,14);ctx.stroke();ctx.fillStyle="#ffe7ae";ctx.beginPath();ctx.moveTo(gx,9);ctx.lineTo(gx+4,16);ctx.lineTo(gx-4,16);ctx.fill();ctx.font="8px Arial";ctx.textAlign="center";ctx.fillText(guideLabel,W/2,8)}
      const zbuf=new Float32Array(W);
      for(let x=0;x<W;x++){
        const ray=s.a-FOV/2+(x/W)*FOV; let d=.02,hit=0;
        while(d<18&&!hit){d+=.025;hit=wallAt(s.x+Math.cos(ray)*d,s.y+Math.sin(ray)*d)}
        d*=Math.cos(ray-s.a);zbuf[x]=d;
        const wh=Math.min(H*1.6,H/d);const top=(H-wh)/2;
        const side=(Math.floor(s.x+Math.cos(ray)*d*8)+Math.floor(s.y+Math.sin(ray)*d*8))%2;
        const shade=Math.max(20,155-d*9)+(side?8:0);
        const colors=hit===2?[shade*.16,shade*.42,shade*.19]:hit===3?[shade*.38,shade*.39,shade*.42]:inDungeon?[shade*.4,shade*.16,shade*.18]:inHalls?[shade*.33,shade*.25,shade*.24]:inCourt?[shade*.35,shade*.31,shade*.34]:[shade*.42,shade*.36,shade*.31];
        ctx.fillStyle=`rgb(${colors[0]},${colors[1]},${colors[2]})`;ctx.fillRect(x,top,1,wh);
        if(x%13===0){ctx.fillStyle="rgba(10,5,10,.22)";ctx.fillRect(x,top,1,wh)}
      }

      // Ombres errantes : elles suivent le joueur et apparaissent comme des sprites dans le couloir.
      for(const shade of minions.current){
        if(!shade.alive)continue;
        const dx=shade.x-s.x,dy=shade.y-s.y,dist=Math.hypot(dx,dy);let ang=Math.atan2(dy,dx)-s.a;ang=Math.atan2(Math.sin(ang),Math.cos(ang));
        const column=Math.max(0,Math.min(W-1,Math.floor((ang/FOV+.5)*W)));
        if(Math.abs(ang)<FOV*.7&&dist<zbuf[column]){const size=Math.min(98,105/dist),cx=(.5+ang/FOV)*W,base=H/2+size*.52,u=size/12;ctx.save();ctx.translate(Math.floor(cx-size/2),Math.floor(base-size));const sprite=shadowRef.current;if(sprite){ctx.drawImage(sprite,0,0,sprite.width,sprite.height,0,0,size,size);if(shade.telegraph>0){ctx.fillStyle="rgba(172,31,55,.28)";ctx.fillRect(0,0,size,size)}if(shade.hit){ctx.fillStyle="rgba(255,230,205,.32)";ctx.fillRect(0,0,size,size)}}else{ctx.fillStyle=shade.hit?"#f9d9bf":shade.telegraph>0?"#8e273c":"#100d1b";ctx.fillRect(3*u,2*u,6*u,9*u);ctx.fillStyle="#4a315f";ctx.fillRect(2*u,5*u,8*u,5*u);ctx.fillStyle="#c44c6a";ctx.fillRect(4*u,4*u,u,u);ctx.fillRect(7*u,4*u,u,u);ctx.fillStyle="#21152e";ctx.fillRect(2*u,10*u,3*u,2*u);ctx.fillRect(7*u,10*u,3*u,2*u)}ctx.restore();}
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

      for(let index=0;index<SHRINES.length;index++){const shrine=SHRINES[index],dx=shrine.x-s.x,dy=shrine.y-s.y,dist=Math.hypot(dx,dy);let ang=Math.atan2(dy,dx)-s.a;ang=Math.atan2(Math.sin(ang),Math.cos(ang));const column=Math.max(0,Math.min(W-1,Math.floor((ang/FOV+.5)*W)));if(Math.abs(ang)>=FOV*.7||dist>=zbuf[column])continue;const size=Math.min(94,92/dist),cx=(.5+ang/FOV)*W,base=H/2+size*.54,u=Math.max(1,size/12),active=Boolean(s.shrines&(1<<index));ctx.save();ctx.translate(Math.floor(cx-size/2),Math.floor(base-size));ctx.fillStyle="#3f3739";ctx.fillRect(4*u,4*u,4*u,8*u);ctx.fillStyle=active?"#92d9d0":"#537b9a";ctx.fillRect(3*u,1*u,6*u,5*u);ctx.fillStyle=active?"#e5ffcf":"#9cc8e8";ctx.fillRect(5*u,2*u,2*u,2*u);ctx.fillStyle=active?"rgba(138,255,218,.22)":"rgba(112,190,255,.16)";ctx.fillRect(1*u,0,10*u,12*u);ctx.restore();if(dist<1.75&&Math.abs(ang)<.28){ctx.fillStyle="#fff1c7";ctx.font="8px Arial";ctx.textAlign="center";ctx.fillText(active?"E · SE RECUEILLIR":"E · ÉVEILLER LA BORNE",W/2,H*.67)}}

      if(s.quest>=7){const dx=CASTLE_REST.x-s.x,dy=CASTLE_REST.y-s.y,dist=Math.hypot(dx,dy);let ang=Math.atan2(dy,dx)-s.a;ang=Math.atan2(Math.sin(ang),Math.cos(ang));const column=Math.max(0,Math.min(W-1,Math.floor((ang/FOV+.5)*W)));if(Math.abs(ang)<FOV*.7&&dist<zbuf[column]){const size=Math.min(90,88/dist),cx=(.5+ang/FOV)*W,base=H/2+size*.54,u=Math.max(1,size/12);ctx.save();ctx.translate(Math.floor(cx-size/2),Math.floor(base-size));ctx.fillStyle="#281e28";ctx.fillRect(3*u,5*u,6*u,7*u);ctx.fillStyle=inDungeon?"#e34c4c":"#e38b52";ctx.fillRect(4*u,2*u,4*u,5*u);ctx.fillStyle="#ffe19a";ctx.fillRect(5*u,3*u,2*u,2*u);ctx.fillStyle="rgba(255,133,73,.2)";ctx.fillRect(1*u,0,10*u,12*u);ctx.restore();if(dist<1.75&&Math.abs(ang)<.28){ctx.fillStyle="#fff1c7";ctx.font="8px Arial";ctx.textAlign="center";ctx.fillText("E · ANCRER LA PROGRESSION",W/2,H*.67)}}}

      if(s.quest>=4){const dx=CASTLE_GATE.x-s.x,dy=CASTLE_GATE.y-s.y,dist=Math.hypot(dx,dy);let ang=Math.atan2(dy,dx)-s.a;ang=Math.atan2(Math.sin(ang),Math.cos(ang));const column=Math.max(0,Math.min(W-1,Math.floor((ang/FOV+.5)*W)));if(Math.abs(ang)<FOV*.7&&dist<zbuf[column]){const size=Math.min(128,135/dist),cx=(.5+ang/FOV)*W,base=H/2+size*.54,u=Math.max(1,size/12);ctx.save();ctx.translate(Math.floor(cx-size/2),Math.floor(base-size));ctx.fillStyle="#211b28";ctx.fillRect(1*u,1*u,10*u,11*u);ctx.fillStyle="#655765";ctx.fillRect(2*u,2*u,8*u,9*u);ctx.fillStyle="#15111b";ctx.fillRect(3*u,3*u,6*u,8*u);ctx.fillStyle="#ab823f";for(let bar=0;bar<5;bar++)ctx.fillRect((3+bar)*u,3*u,u,8*u);ctx.restore();if(dist<1.8&&Math.abs(ang)<.3&&(s.quest===4||s.quest===6)){ctx.fillStyle="#fff1c7";ctx.font="8px Arial";ctx.textAlign="center";ctx.fillText(s.quest===4?"E · OUVRIR LA PORTE NOIRE":"E · ENTRER DANS LA COUR",W/2,H*.67)}}}
      // Gardien sous forme de billboard pixelisé.
      const e=enemy.current;
      if(e.alive){
        const dx=e.x-s.x,dy=e.y-s.y,dist=Math.hypot(dx,dy);let ang=Math.atan2(dy,dx)-s.a;ang=Math.atan2(Math.sin(ang),Math.cos(ang));
        if(Math.abs(ang)<FOV*.7 && dist<zbuf[Math.max(0,Math.min(W-1,Math.floor((ang/FOV+.5)*W)))]){
          const size=Math.min(130,150/dist),cx=(.5+ang/FOV)*W,base=H/2+size*.52;
          ctx.save();ctx.translate(Math.floor(cx-size/2),Math.floor(base-size));
          const sprite=guardianRef.current;
          if(sprite){ctx.drawImage(sprite,0,0,sprite.width,sprite.height,0,0,size,size);if(s.shrines<3){ctx.fillStyle="rgba(72,124,186,.48)";ctx.fillRect(0,0,size,size);ctx.strokeStyle="rgba(158,223,255,.78)";ctx.lineWidth=2;ctx.beginPath();ctx.arc(size/2,size/2,size*.43,0,Math.PI*2);ctx.stroke()}if(e.telegraph>0){ctx.fillStyle="rgba(179,25,35,.24)";ctx.fillRect(0,0,size,size)}if(e.hit){ctx.fillStyle="rgba(255,235,181,.30)";ctx.fillRect(0,0,size,size)}}else{const u=size/16;ctx.fillStyle=e.hit?"#fff0c4":e.telegraph>0?"#9f2b37":"#16101b";ctx.fillRect(4*u,3*u,8*u,12*u);ctx.fillStyle="#696075";ctx.fillRect(5*u,2*u,6*u,7*u);ctx.fillRect(3*u,7*u,10*u,6*u);ctx.fillStyle="#c4463d";ctx.fillRect(6*u,5*u,1.5*u,u);ctx.fillRect(9*u,5*u,1.5*u,u);ctx.fillStyle="#a87a42";ctx.fillRect(1*u,6*u,3*u,2*u);ctx.fillRect(12*u,6*u,3*u,2*u);ctx.fillStyle="#3b3146";ctx.fillRect(4*u,13*u,3*u,3*u);ctx.fillRect(9*u,13*u,3*u,3*u)}ctx.restore();
        }
      }

      const daylight=Math.max(.08,Math.sin(worldTime.current*Math.PI*2)*.78+.22);
      if(daylight<.45){ctx.fillStyle=`rgba(3,8,28,${.64*(.48-daylight)/.4})`;ctx.fillRect(0,0,W,H);ctx.fillStyle=`rgba(220,235,255,${(.45-daylight)*1.8})`;for(let star=0;star<36;star++){const sx=(star*83)%W,sy=(star*47)%Math.floor(H*.43);ctx.fillRect(sx,sy,star%3?1:2,1)}}

      // Arme, sort et viseur.
      const threats=[enemy.current,...minions.current].filter(foe=>foe.alive);
      for(const foe of threats){const dx=foe.x-s.x,dy=foe.y-s.y,dist=Math.hypot(dx,dy);let ang=Math.atan2(dy,dx)-s.a;ang=Math.atan2(Math.sin(ang),Math.cos(ang));if(Math.abs(ang)>FOV*.48&&dist<8){const right=ang>0,x=right?W-17:17,y=H*.48;ctx.save();ctx.translate(x,y);ctx.rotate(right?Math.PI/2:-Math.PI/2);ctx.fillStyle=foe.telegraph>0?"#ff6260":"rgba(255,223,164,.72)";ctx.beginPath();ctx.moveTo(0,-8);ctx.lineTo(7,7);ctx.lineTo(-7,7);ctx.fill();ctx.restore();}}
      const nearest=threats.sort((a,b)=>Math.hypot(a.x-s.x,a.y-s.y)-Math.hypot(b.x-s.x,b.y-s.y))[0];
      let targetReady=false;if(nearest){const target=Math.atan2(nearest.y-s.y,nearest.x-s.x),diff=Math.abs(Math.atan2(Math.sin(target-s.a),Math.cos(target-s.a)));targetReady=diff<.12&&Math.hypot(nearest.x-s.x,nearest.y-s.y)<7}
      if(spellFx.current>0){const r=30+spellFx.current*90,g=ctx.createRadialGradient(W*.68,H*.68,2,W*.68,H*.68,r);g.addColorStop(0,"#fff7a0");g.addColorStop(.35,"#ff6b28");g.addColorStop(1,"transparent");ctx.fillStyle=g;ctx.fillRect(0,0,W,H)}
      if(abilityFx.current>0){const palette=s.spec==="blade"?[180,210,255]:s.spec==="bow"?[225,190,105]:[222,90,255];ctx.strokeStyle=`rgba(${palette[0]},${palette[1]},${palette[2]},${abilityFx.current*.68})`;ctx.lineWidth=3;ctx.beginPath();ctx.arc(W/2,H/2,32+(1-abilityFx.current/.7)*72,0,Math.PI*2);ctx.stroke()}
      const swing=attackFx.current?Math.sin(attackFx.current/.28*Math.PI)*38:0;
      ctx.save();ctx.translate(W*.64+swing,H*.78-swing*.6);ctx.rotate(-.62+swing*.012);ctx.fillStyle="#211724";ctx.fillRect(-5,-2,15,8);ctx.fillStyle="#c0aeb1";ctx.fillRect(8,0,92,5);ctx.fillStyle="#f2d89c";ctx.fillRect(8,0,88,1);ctx.restore();
      if(parryFx.current>0){ctx.strokeStyle=perfectFx.current>0?"#ffe49a":"#9db5d5";ctx.lineWidth=5;ctx.beginPath();ctx.arc(W*.78,H*.73,35,Math.PI*.45,Math.PI*1.55);ctx.stroke()}
      ctx.fillStyle=targetReady?"#ff7968":"rgba(255,239,190,.75)";ctx.fillRect(W/2-5,H/2,11,1);ctx.fillRect(W/2,H/2-5,1,11);
      if(hurtFx.current){ctx.fillStyle=`rgba(170,15,20,${hurtFx.current})`;ctx.fillRect(0,0,W,H)}
      raf=requestAnimationFrame(loop);
    };
    raf=requestAnimationFrame(loop);return()=>cancelAnimationFrame(raf);
  },[panel,started,sync]);

  const hold=(code:string,on:boolean)=>{keys.current[code]=on};
  const holdAction=(action:"forward"|"back"|"left"|"right",on:boolean)=>hold(bindingsRef.current[action],on);
  const potion=()=>{if(state.current.potions&&state.current.hp<100){state.current.potions--;state.current.hp=Math.min(100,state.current.hp+45);sync();setMessage("La potion réchauffe votre sang.")}};
  const revive=()=>{const s=state.current;const inCastle=s.quest>=7;s.x=inCastle?CASTLE_REST.x:3.5;s.y=inCastle?CASTLE_REST.y:16.5;s.a=inCastle?Math.PI/2:-Math.PI/2;s.hp=100;s.mana=100;s.stamina=100;sync();setMessage(inCastle?"Vous reprenez conscience à l’ancrage du château.":"Vous reprenez conscience près du chemin des ruines.")};
  const shiftSky=()=>{worldTime.current=worldTime.current<.5?.73:.24;setMessage(worldTime.current<.5?"L’aube éclaire de nouveau les plaines.":"La nuit enveloppe Cendreval.")};
  const restoreForTest=()=>{const s=state.current;s.hp=100;s.mana=100;s.stamina=100;s.arrows=22;s.potions=Math.max(3,s.potions);sync();setMessage("Ressources restaurées — à toi de jouer.")};
  const resetEncounter=()=>{const s=state.current;s.x=3.5;s.y=16.5;s.a=-Math.PI/2;s.enemyHp=70;s.quest=0;s.expedition=0;reinforcements.current=false;enemy.current={x:10.5,y:8.5,hp:70,alive:true,hit:0,cooldown:0,telegraph:0,boss:true,name:"gardien",kind:"brute"};minions.current=[{x:6.5,y:5.5,hp:34,alive:true,hit:0,cooldown:0,telegraph:0,boss:false,name:"ombre",kind:"melee"},{x:14.5,y:13.5,hp:34,alive:true,hit:0,cooldown:0,telegraph:0,boss:false,name:"ombre",kind:"melee"}];restoreForTest();setMessage("Rencontre réinitialisée — départ de la plaine.")};
  const claimReward=()=>{const s=state.current;if(s.quest===1&&!s.reward){s.reward=1;s.quest=2;s.gold+=35;s.potions+=2;s.level=2;s.hp=100;s.mana=100;sync();setMessage("Récompense reçue : 35 or, 2 potions. Niveau 2 !")} };
  const chooseRelic=(relic:Relic)=>{const s=state.current;if(s.relic!=="none")return;s.relic=relic;sync();setMessage("Relique liée à votre âme.")};
  const beginExpedition=()=>{const s=state.current;if(s.relic==="none"){setMessage("Choisissez d’abord une relique dans la halle de Valbrume.");return}s.quest=3;s.expedition=1;s.x=3.5;s.y=16.5;s.a=-Math.PI/2;s.hp=100;s.mana=100;s.stamina=100;s.potions=Math.max(s.potions,3);s.arrows=Math.max(s.arrows,18);enemy.current.alive=false;minions.current=[{x:7.3,y:13.1,hp:42,alive:true,hit:0,cooldown:.7,telegraph:0,boss:false,name:"veilleur archer",kind:"ranged"},{x:13.2,y:10.4,hp:46,alive:true,hit:0,cooldown:1.1,telegraph:0,boss:false,name:"veilleur",kind:"melee"},{x:9.4,y:6.7,hp:52,alive:true,hit:0,cooldown:1.5,telegraph:0,boss:false,name:"veilleur lourd",kind:"brute"}];setVillage(false);localStorage.setItem("cendreval-save",JSON.stringify(s));sync();setMessage("EXPÉDITION — un archer, un duelliste et un lourd gardent la plaine.")};
  const beginCastleApproach=()=>{const s=state.current;s.quest=5;s.expedition=3;s.hp=100;s.mana=100;s.stamina=100;s.potions=Math.max(3,s.potions);enemy.current={x:14.4,y:4.7,hp:100,alive:true,hit:0,cooldown:1,telegraph:0,boss:false,name:"sentinelle noire",kind:"brute"};minions.current=[];localStorage.setItem("cendreval-save",JSON.stringify(s));sync();setMessage("LA PORTE NOIRE — vainquez la sentinelle du château.")};
  const enterCastleCourt=()=>{const s=state.current;s.quest=7;s.expedition=4;s.x=15.1;s.y=4.8;s.a=Math.PI;s.hp=100;s.mana=100;s.stamina=100;s.potions=Math.max(s.potions,4);s.arrows=Math.max(s.arrows,20);enemy.current={x:10.5,y:6.8,hp:130,alive:true,hit:0,cooldown:1.2,telegraph:0,boss:false,name:"capitaine noir",kind:"brute"};minions.current=[{x:12.7,y:5.6,hp:48,alive:true,hit:0,cooldown:.5,telegraph:0,boss:false,name:"archer de cour",kind:"ranged"},{x:8.5,y:7.1,hp:54,alive:true,hit:0,cooldown:1,telegraph:0,boss:false,name:"garde noir",kind:"melee"}];localStorage.setItem("cendreval-save",JSON.stringify(s));sync();setMessage("COUR EXTÉRIEURE — abattez le capitaine noir et sa garde.")};
  const chooseCourtBoon=(boon:CourtBoon)=>{const s=state.current;if(s.quest!==8||s.courtBoon!=="none")return;s.courtBoon=boon;s.quest=9;localStorage.setItem("cendreval-save",JSON.stringify(s));sync();setMessage(boon==="ward"?"Égide de la cour — les coups ennemis sont amoindris.":boon==="fury"?"Fureur royale — vos attaques gagnent en puissance.":"Focus royal — votre pouvoir de voie revient plus vite.")};
  const enterLowerHalls=()=>{const s=state.current;if(s.courtBoon==="none"){setMessage("Choisissez d’abord le butin de la cour.");return}s.quest=10;s.expedition=5;s.x=10.5;s.y=8.8;s.a=Math.PI/2;s.hp=100;s.mana=100;s.stamina=100;s.potions=Math.max(s.potions,4);s.arrows=Math.max(s.arrows,22);enemy.current={x:10.5,y:5.8,hp:150,alive:true,hit:0,cooldown:1.1,telegraph:0,boss:false,name:"maître d’armes",kind:"brute"};minions.current=[{x:6.7,y:7.2,hp:55,alive:true,hit:0,cooldown:.5,telegraph:0,boss:false,name:"tireur de braise",kind:"ranged"},{x:14.2,y:7.1,hp:60,alive:true,hit:0,cooldown:.8,telegraph:0,boss:false,name:"lame noire",kind:"melee"},{x:10.4,y:10.4,hp:60,alive:true,hit:0,cooldown:1.3,telegraph:0,boss:false,name:"lame noire",kind:"melee"}];setVillage(false);localStorage.setItem("cendreval-save",JSON.stringify(s));sync();setMessage("SALLES BASSES — terrassez le maître d’armes et ses trois lieutenants.")};
  const beginDungeonAssault=()=>{const s=state.current;if(s.quest<11){setMessage("Les salles basses doivent d’abord être purgées.");return}s.quest=12;s.expedition=6;s.x=10.5;s.y=9.3;s.a=Math.PI/2;s.hp=100;s.mana=100;s.stamina=100;s.potions=Math.max(s.potions,5);s.arrows=Math.max(s.arrows,26);enemy.current={x:10.5,y:5.2,hp:180,alive:true,hit:0,cooldown:1,telegraph:0,boss:false,name:"maréchal de cendre",kind:"brute"};minions.current=[{x:6.4,y:7.3,hp:64,alive:true,hit:0,cooldown:.5,telegraph:0,boss:false,name:"arbalétrier noir",kind:"ranged"},{x:14.5,y:7.4,hp:64,alive:true,hit:0,cooldown:.7,telegraph:0,boss:false,name:"arbalétrier noir",kind:"ranged"},{x:10.5,y:10.2,hp:72,alive:true,hit:0,cooldown:1.1,telegraph:0,boss:false,name:"gardien de braise",kind:"brute"}];setVillage(false);localStorage.setItem("cendreval-save",JSON.stringify(s));sync();setMessage("DONJON NOIR — abattez le maréchal de cendre et ses gardiens.")};
  const prepareCastleTest=()=>{const s=state.current;s.quest=11;s.expedition=5;s.shrines=7;s.reward=1;s.relic=s.relic==="none"?"iron":s.relic;s.courtBoon=s.courtBoon==="none"?"ward":s.courtBoon;s.x=CASTLE_REST.x;s.y=CASTLE_REST.y;s.a=Math.PI/2;s.hp=100;s.mana=100;s.stamina=100;s.potions=Math.max(s.potions,5);s.arrows=Math.max(s.arrows,26);enemy.current={x:10.5,y:8.5,hp:0,alive:false,hit:0,cooldown:0,telegraph:0,boss:true,name:"gardien",kind:"brute"};minions.current=[];reinforcements.current=false;localStorage.setItem("cendreval-save",JSON.stringify(s));sync();setMessage("TEST CHÂTEAU — ancrage, relique et assaut du donjon préparés.")};
  const buyPotion=()=>{const s=state.current;if(s.gold<8){setMessage("Il vous manque des pièces d’or.");return}s.gold-=8;s.potions++;sync();setMessage("Potion achetée.")};
  const chooseSpec=(spec:Save["spec"])=>{const s=state.current;s.spec=spec;s.perkBlade=spec==="blade";s.perkBow=spec==="bow";s.perkArcane=spec==="arcane";if(spec==="blade")s.stamina=100;if(spec==="bow")s.arrows=Math.max(s.arrows,22);if(spec==="arcane")s.mana=100;sync();setChoosingSpec(false);setStarted(true);setMessage(`Voie choisie : ${spec==="blade"?"Lame":spec==="bow"?"Rôdeur":"Arcanes"}.`)};
  const learnPerk=(perk:"perkBlade"|"perkBow"|"perkArcane")=>{const s=state.current;if(!s.talent||s[perk])return;s.talent--;s[perk]=true;sync();setMessage("Talent appris !")};
  const changeSensitivity=(value:number)=>{setSensitivity(value);sensitivityRef.current=value;localStorage.setItem("cendreval-mouse-sensitivity",String(value))};

  return <main className="game-shell">
    <div className="grain" />
    <header><div className="brand"><span>CHRONIQUES DE</span><strong>CENDREVAL</strong></div><div className="chapter">{village?"VALBRUME · LE VILLAGE DES BRUMES":hud.quest>=12?"ACTE III · LE DONJON NOIR":hud.quest>=7?"ACTE II · LE CHÂTEAU NOIR":"ACTE I · LES PLAINES DE CENDREVAL"}</div></header>
    <section className="stage" aria-label="Jeu en vue subjective">
      <canvas ref={canvasRef} width={W} height={H} tabIndex={0} onPointerEnter={e=>{hoverLook.current=true;lastMouseX.current=e.clientX}} onPointerLeave={()=>{hoverLook.current=false;lastMouseX.current=null}} onPointerDown={captureMouse} onContextMenu={e=>e.preventDefault()} />
      {!started&&!choosingSpec&&<div className="start-screen"><div className="sigil">ᛉ</div><h1>CENDREVAL</h1><p>Au-delà des plaines, le château noir veille.<br/>Votre légende commence sous un ciel ouvert.</p><button onClick={()=>setChoosingSpec(true)}>NOUVELLE PARTIE</button><button className="secondary" onClick={load}>CONTINUER</button><small>Cliquez dans le jeu pour diriger la caméra à la souris</small></div>}
      {choosingSpec&&<div className="start-screen spec-select"><span className="eyebrow">CHOISISSEZ VOTRE VOIE</span><h1>VOTRE LÉGENDE</h1><div className="spec-cards"><button onClick={()=>chooseSpec("blade")}><b>⚔ LAME</b><small>Combat rapproché et endurance renforcée.</small></button><button onClick={()=>chooseSpec("bow")}><b>⌁ RÔDEUR</b><small>Arc, distance et vingt-deux flèches.</small></button><button onClick={()=>chooseSpec("arcane")}><b>✦ ARCANES</b><small>Mana maximum pour la flamme ancienne.</small></button></div><button className="secondary" onClick={()=>setChoosingSpec(false)}>RETOUR</button></div>}
      {started&&<><div className="top-hud"><div className="quest"><span>NIV. {hud.level} · {hud.xp}/{hud.level*40} EXP · BORNES {hud.shrines}/3</span>{hud.quest===0?(hud.shrines<3?"Éveiller les bornes anciennes de la plaine":"Nettoyer les ruines de la plaine"):hud.quest===1?"Retourner à Valbrume":hud.quest===2?"Préparer l’expédition des Veilleurs":hud.quest===3?`Traquer les Veilleurs cendrés (${minions.current.filter(foe=>foe.alive).length}/3)`:hud.quest===4?"Rejoindre la porte du château noir":hud.quest===5?"Vaincre la sentinelle de la porte":hud.quest===6?"Entrer dans la cour extérieure":hud.quest===7?`Nettoyer la cour (${[enemy.current,...minions.current].filter(foe=>foe.alive).length}/3)`:hud.quest===8?"Réclamer le butin de la cour":hud.quest===9?"Préparer les salles basses":hud.quest===10?`Purger les salles basses (${[enemy.current,...minions.current].filter(foe=>foe.alive).length}/4)`:hud.quest===11?"Préparer l’assaut du donjon":hud.quest===12?`Briser le donjon (${[enemy.current,...minions.current].filter(foe=>foe.alive).length}/4)`:"Le premier donjon est brisé"}</div><div className="top-actions"><button className={testMode?"active-test":""} onClick={()=>setTestMode(v=>!v)}>Test</button>{hud.talent>0&&<button onClick={()=>setPanel("talents")}>Talent {hud.talent}</button>}{hud.quest>0&&<button onClick={()=>setVillage(true)}>Valbrume</button>}<button onClick={save}>Sauvegarder</button></div></div>
      <div className="message">{message}</div>
      {hud.hp<=0&&<div className="death-screen"><span className="eyebrow">VOUS ÊTES TOMBÉ</span><h2>Les plaines attendent votre retour.</h2><p>La rencontre est conservée : reprenez immédiatement le test depuis le chemin.</p><button onClick={revive}>SE RELEVER</button></div>}
      {enemy.current.alive&&hud.shrines>=3&&<div className="boss-health"><span>{enemy.current.boss?`GARDIEN DES RUINES${enemy.current.hp<=35?" · PHASE II":""}`:hud.quest===7?"CAPITAINE NOIR DE LA COUR":hud.quest===10?"MAÎTRE D’ARMES DES SALLES BASSES":hud.quest===12?"MARÉCHAL DE CENDRE":"SENTINELLE DE LA PORTE NOIRE"}</span><i style={{width:`${enemy.current.hp/(enemy.current.boss?70:hud.quest===7?130:hud.quest===10?150:hud.quest===12?180:100)*100}%`}}/></div>}
      {[enemy.current,...minions.current].filter(foe=>foe.alive).length>1&&<div className="threat-feed"><span>MENACES ACTIVES</span>{[enemy.current,...minions.current].filter(foe=>foe.alive).slice(0,4).map((foe,index)=><i key={`${foe.name}-${index}`} className={foe.kind}><b>{foe.kind==="ranged"?"ARC":foe.kind==="brute"?"LOURD":"LAME"}</b>{foe.name}</i>)}</div>}
      {testMode&&<div className="test-kit"><span>BAC À SABLE</span><button onClick={restoreForTest}>RESSOURCES</button><button onClick={resetEncounter}>REJOUER LE COMBAT</button><button onClick={prepareCastleTest}>PRÉPARER LE CHÂTEAU</button>{hud.quest>=2&&<button onClick={beginExpedition}>LANCER L’EXPÉDITION</button>}{hud.quest>=9&&<button onClick={enterLowerHalls}>TESTER LES SALLES BASSES</button>}{hud.quest>=11&&<button onClick={beginDungeonAssault}>TESTER LE DONJON</button>}<button onClick={shiftSky}>AUBE / NUIT</button><small>Les raccourcis et la sauvegarde restent actifs.</small></div>}
      <div className="bars"><div><label>VIE</label><i className="hp" style={{width:`${hud.hp}%`}}/></div><div><label>MANA</label><i className="mana" style={{width:`${hud.mana}%`}}/></div><div><label>ENDURANCE</label><i className="stamina" style={{width:`${hud.stamina}%`}}/></div></div>
      <div className="quickbar"><button onClick={potion}><b>1</b> Potion <em>{hud.potions}</em></button><button onClick={()=>strike(false)}><b>2</b> Lame</button><button onClick={()=>strike(true)}><b>3</b> Flamme</button><button onClick={shootBow}><b>R</b> Arc <em>{hud.arrows}</em></button><button onClick={parry}><b>MB3</b> Parade</button><button onClick={dodge}><b>⇧</b> Esquive</button><button className={`ability${abilityReady?"":" cooldown"}`} onClick={ability}><b>F</b> {abilityReady?(hud.spec==="blade"?"Garde":hud.spec==="bow"?"Volée":"Braises"):"Recharge…"}</button><span>◈ {hud.gold}</span></div>
      <div className="menu-buttons"><button onClick={()=>setPanel("inventory")}>SAC</button><button onClick={()=>setPanel("journal")}>JOURNAL</button><button onClick={()=>setPanel("combat")}>COMBAT</button><button onClick={()=>setPanel("controls")}>OPTIONS</button></div>
      <div className="touch"><div className="touch-dpad"><button aria-label="Pas à gauche" onPointerDown={()=>holdAction("left",true)} onPointerUp={()=>holdAction("left",false)} onPointerCancel={()=>holdAction("left",false)} onPointerLeave={()=>holdAction("left",false)}>◀</button><button aria-label="Avancer" onPointerDown={()=>holdAction("forward",true)} onPointerUp={()=>holdAction("forward",false)} onPointerCancel={()=>holdAction("forward",false)} onPointerLeave={()=>holdAction("forward",false)}>▲</button><button aria-label="Reculer" onPointerDown={()=>holdAction("back",true)} onPointerUp={()=>holdAction("back",false)} onPointerCancel={()=>holdAction("back",false)} onPointerLeave={()=>holdAction("back",false)}>▼</button><button aria-label="Pas à droite" onPointerDown={()=>holdAction("right",true)} onPointerUp={()=>holdAction("right",false)} onPointerCancel={()=>holdAction("right",false)} onPointerLeave={()=>holdAction("right",false)}>▶</button></div><div className="touch-actions"><button aria-label="Attaquer" onClick={()=>strike(false)}>⚔</button><button aria-label="Parer" onClick={parry}>◒</button><button aria-label="Esquiver" onClick={dodge}>↯</button><button aria-label="Pouvoir de voie" onClick={ability}>✦</button></div></div></>}
      {panel&&<div className="panel"><button className="close" onClick={()=>setPanel(null)}>×</button>{panel==="controls"?<><span className="eyebrow">COMMANDES</span><h2>Clavier et souris</h2><p className="controls-note">Cliquez dans le jeu pour capturer la souris. Échap libère le curseur. Cliquez sur une action, puis pressez une touche ou un bouton de souris. Échap annule une association en attente.</p><label className="sensitivity">Sensibilité souris <input aria-label="Sensibilité souris" type="range" min="0.3" max="2.5" step="0.1" value={sensitivity} onChange={e=>changeSensitivity(Number(e.target.value))}/><b>{sensitivity.toFixed(1)}×</b></label><div className="bindings">{(Object.keys(ACTION_LABELS) as Action[]).map(action=><div className="binding" key={action}><span>{ACTION_LABELS[action]}</span><button className={capture===action?"listening":""} onClick={()=>setCapture(action)}>{capture===action?"Appuyez…":bindingLabel(bindings[action])}</button></div>)}</div><button className="reset-bindings" onClick={()=>applyBindings(DEFAULT_BINDINGS)}>RÉTABLIR LES COMMANDES</button></>:panel==="inventory"?<><span className="eyebrow">ÉQUIPEMENT · NIVEAU {hud.level}</span><h2>Sac de l’aventurier</h2><div className="inventory"><div className="item selected">⚔<span>Lame ébréchée<small>Dégâts 22{hud.relic==="iron"?" + 6":""}</small></span></div><div className="item">✦<span>Flamme ancienne<small>Coût 15 mana{hud.relic==="ember"?" · + 8 dégâts":""}</small></span></div><div className="item">♥<span>Potion carmin<small>Quantité : {hud.potions}</small></span></div><div className="item">◆<span>Éclats d’or<small>{hud.gold} pièces</small></span></div>{hud.relic!=="none"&&<div className="item selected">✥<span>{hud.relic==="iron"?"Cœur de fer":hud.relic==="oak"?"Œil du chêne":"Braise scellée"}<small>{hud.relic==="iron"?"+6 dégâts de lame":hud.relic==="oak"?"+8 dégâts d’arc":"+8 dégâts de flamme"}</small></span></div>}{hud.courtBoon!=="none"&&<div className="item selected">♜<span>{hud.courtBoon==="ward"?"Égide de la cour":hud.courtBoon==="fury"?"Fureur royale":"Focus royal"}<small>{hud.courtBoon==="ward"?"−2 dégâts reçus":hud.courtBoon==="fury"?"+4 dégâts infligés":"Pouvoir rechargé 28 % plus vite"}</small></span></div>}</div></>:panel==="combat"?<><span className="eyebrow">MANUEL DU VEILLEUR</span><h2>Lire le combat</h2><div className="objective"><b>Parade · MB3</b><br/><small>Bloque la frappe annoncée. Si elle touche pendant l’éclair bref de garde, l’ennemi est étourdi et vous récupérez 22 endurance.</small></div><div className="objective"><b>Esquive · Shift</b><br/><small>Évitez à la fin de la télégraphie : l’ennemi perd son élan et vous récupérez 10 endurance.</small></div><div className="objective"><b>Priorités</b><br/><small>Éliminez les archers à distance, puis exploitez l’étourdissement des brutes. Les actes de château possèdent un ancrage orange : il restaure et sauvegarde.</small></div><div className="objective"><b>Votre sceau</b><br/><small>{hud.courtBoon==="none"?"Le butin de la cour offrira Égide, Fureur ou Focus.":hud.courtBoon==="ward"?"Égide réduit chaque coup subi de 2.":hud.courtBoon==="fury"?"Fureur ajoute 4 dégâts à toutes vos attaques.":"Focus ramène plus vite votre pouvoir de voie."}</small></div></>:<><span className="eyebrow">JOURNAL</span><h2>La Crypte des rois muets</h2><p>Le village de Valbrume vit dans l’ombre d’un ancien gardien réveillé sous les collines.</p><div className={hud.shrines===3?"objective done":"objective"}>{hud.shrines===3?"✓ Les trois bornes ont répondu":`○ Éveiller les bornes anciennes (${hud.shrines}/3)`}</div><div className={hud.quest>0?"objective done":"objective"}>{hud.quest>0?"✓ Gardien terrassé":"○ Trouver et terrasser le gardien"}</div><div className={hud.quest>=2?"objective done":"objective"}>{hud.quest>=2?"✓ Récompense de Valbrume reçue":"○ Retourner à Valbrume"}</div><div className={hud.quest>=4?"objective done":"objective"}>{hud.quest>=4?"✓ Veilleurs cendrés dissipés":"○ Accomplir l’expédition des Veilleurs"}</div><div className={hud.quest>=8?"objective done":"objective"}>{hud.quest>=8?"✓ Cour extérieure libérée":"○ Nettoyer la cour du château noir"}</div><div className={hud.quest>=11?"objective done":"objective"}>{hud.quest>=11?"✓ Salles basses purgées":"○ Vaincre le maître d’armes"}</div><div className={hud.quest>=13?"objective done":"objective"}>{hud.quest>=13?"✓ Donjon noir brisé":"○ Abattre le maréchal de cendre"}</div></>}</div>}
      {village&&<div className="village"><div className="village-art"><div className="moon"/><div className="mountain one"/><div className="mountain two"/><div className="houses"><i/><i/><i/></div></div><div className="village-copy"><span className="eyebrow">VALBRUME · HALLE DU CONSEIL</span><h2>{hud.quest>=4?"« Les Veilleurs ont enfin cessé de chanter. »":"« Vous avez rendu le silence à nos morts. »"}</h2><p>{hud.quest>=4?"La doyenne pose une main sur votre relique. Au-delà de la plaine, la route du château noir est désormais ouverte.":"La doyenne Elenn vous accueille au coin du feu. Les habitants sortent de leurs maisons et le marchand a rouvert son étal."}</p>{hud.quest===1?<button className="gold-button" onClick={claimReward}>RECEVOIR LA RÉCOMPENSE</button>:<><div className="rewarded">✓ Vous êtes désormais protecteur de Valbrume.</div>{hud.relic==="none"&&<div className="relic-choice"><span>CHOISISSEZ UNE RELIQUE</span><button onClick={()=>chooseRelic("iron")}>CŒUR DE FER <small>+6 lame</small></button><button onClick={()=>chooseRelic("oak")}>ŒIL DU CHÊNE <small>+8 arc</small></button><button onClick={()=>chooseRelic("ember")}>BRAISE SCELLÉE <small>+8 flamme</small></button></div>}{hud.quest===2&&<button className="gold-button expedition-button" onClick={beginExpedition}>PARTIR POUR LES VEILLEURS</button>}{hud.quest===3&&<div className="rewarded">◌ L’expédition est en cours dans la plaine.</div>}{hud.quest===4&&<div className="rewarded">✓ Première expédition accomplie. La route du château noir attend.</div>}</>}<div className="merchant"><span>ÉTAL DE RUNE</span><p>Potion carmin · restaure 45 points de vie</p><button onClick={buyPotion}>ACHETER · 8 OR</button></div><button className="leave" onClick={()=>setVillage(false)}>RETOURNER À LA CRYPTE</button></div><button className="close village-close" onClick={()=>setVillage(false)}>×</button></div>}
      {village&&hud.quest>=8&&<div className="court-planning"><span className="eyebrow">BUTIN DE LA COUR</span><h2>{hud.quest===8?"Choisissez un sceau de guerre.":hud.quest===9?"Les salles basses vous attendent.":hud.quest===10?"L’assaut des salles basses est en cours.":hud.quest===11?"Le donjon noir reste à prendre.":hud.quest===12?"L’assaut du donjon est en cours.":"Le premier donjon est sous votre contrôle."}</h2>{hud.quest===8&&<div className="boon-choice"><button onClick={()=>chooseCourtBoon("ward")}><b>ÉGIDE</b><small>−2 dégâts reçus</small></button><button onClick={()=>chooseCourtBoon("fury")}><b>FUREUR</b><small>+4 dégâts infligés</small></button><button onClick={()=>chooseCourtBoon("focus")}><b>FOCUS</b><small>Pouvoir plus rapide</small></button></div>}{hud.quest===9&&<button className="gold-button" onClick={enterLowerHalls}>ENTRER DANS LES SALLES BASSES</button>}{hud.quest===10&&<p className="rewarded">◌ Le maître d’armes demeure dans le château.</p>}{hud.quest===11&&<button className="gold-button" onClick={beginDungeonAssault}>LANCER L’ASSAUT DU DONJON</button>}{hud.quest===12&&<p className="rewarded">◌ Le maréchal de cendre garde le donjon.</p>}{hud.quest>=13&&<p className="rewarded">✓ Le premier donjon du château noir est tombé.</p>}</div>}
    </section>
    <footer><span>Une aventure rétro en vue subjective</span><span>Version prototype · Sauvegarde locale</span></footer>
    {panel==="talents"&&<div className="talent-panel"><button className="close" onClick={()=>setPanel(null)}>×</button><span className="eyebrow">PROGRESSION · {hud.talent} POINT</span><h2>Talents de combat</h2><p>Chaque voie peut être maîtrisée : les bonus sont permanents et s’ajoutent à la défense active.</p><div className="talent-list"><button className={hud.perkBlade?"learned":""} onClick={()=>learnPerk("perkBlade")}><b>Frappe du gardien</b><small>+8 dégâts de lame</small></button><button className={hud.perkBow?"learned":""} onClick={()=>learnPerk("perkBow")}><b>Flèche de chêne</b><small>+12 dégâts d’arc</small></button><button className={hud.perkArcane?"learned":""} onClick={()=>learnPerk("perkArcane")}><b>Braise profonde</b><small>+12 dégâts de flamme</small></button></div></div>}
  </main>;
}

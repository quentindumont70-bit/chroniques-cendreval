"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const MAP = [
  "1111111111111111",
  "1000000000000001",
  "1022200011110001",
  "1020000000010001",
  "1020000000010001",
  "1022200000010001",
  "1000000000000001",
  "1000111100033301",
  "1000100000030301",
  "1000100000030301",
  "1000100000033301",
  "1000000000000001",
  "1000011100000001",
  "1000000000000001",
  "1000000000000001",
  "1111111111111111",
];

type Save = { x:number; y:number; a:number; hp:number; mana:number; stamina:number; gold:number; potions:number; arrows:number; spec:"blade"|"bow"|"arcane"; xp:number; talent:number; perkBlade:boolean; perkBow:boolean; perkArcane:boolean; enemyHp:number; quest:number; level:number; reward:number };
const START: Save = { x:2.5, y:13.2, a:-Math.PI/2, hp:100, mana:80, stamina:100, gold:12, potions:2, arrows:14, spec:"blade", xp:0, talent:0, perkBlade:false, perkBow:false, perkArcane:false, enemyHp:70, quest:0, level:1, reward:0 };
const W = 426, H = 240, FOV = Math.PI / 3;
type Action = "forward"|"back"|"left"|"right"|"turnLeft"|"turnRight"|"attack"|"spell"|"bow"|"parry"|"dodge"|"potion"|"inventory"|"journal"|"save";
type Bindings = Record<Action,string>;
const DEFAULT_BINDINGS: Bindings = {forward:"KeyZ",back:"KeyS",left:"KeyQ",right:"KeyD",turnLeft:"ArrowLeft",turnRight:"ArrowRight",attack:"Mouse0",spell:"Mouse2",bow:"KeyR",parry:"Mouse1",dodge:"ShiftLeft",potion:"Digit1",inventory:"KeyI",journal:"KeyJ",save:"KeyP"};
const ACTION_LABELS: Record<Action,string> = {forward:"Avancer",back:"Reculer",left:"Pas à gauche",right:"Pas à droite",turnLeft:"Tourner à gauche",turnRight:"Tourner à droite",attack:"Attaquer",spell:"Lancer la flamme",bow:"Tirer à l’arc",parry:"Parer",dodge:"Esquiver",potion:"Boire une potion",inventory:"Ouvrir le sac",journal:"Ouvrir le journal",save:"Sauvegarder"};
function bindingLabel(value:string){return value.replace("Key","Touche ").replace("Digit","Touche ").replace("Arrow","Flèche ").replace("Mouse0","Clic gauche").replace("Mouse1","Clic molette").replace("Mouse2","Clic droit").replace("Mouse3","Souris 3").replace("Mouse4","Souris 4")}

function wallAt(x:number, y:number) {
  const row = MAP[Math.floor(y)];
  return !row ? 1 : Number(row[Math.floor(x)] ?? 1);
}

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const state = useRef<Save>({...START});
  const keys = useRef<Record<string,boolean>>({});
  const enemy = useRef({x:11.5,y:4.5,hp:70,alive:true,hit:0,cooldown:0,telegraph:0,boss:true,name:"gardien"});
  const minions = useRef([
    {x:5.5,y:3.5,hp:34,alive:true,hit:0,cooldown:0,telegraph:0,boss:false,name:"ombre"},
    {x:8.5,y:11.5,hp:34,alive:true,hit:0,cooldown:0,telegraph:0,boss:false,name:"ombre"},
  ]);
  const attackFx = useRef(0);
  const spellFx = useRef(0);
  const hurtFx = useRef(0);
  const parryFx = useRef(0);
  const perfectFx = useRef(0);
  const dodgeFx = useRef(0);
  const last = useRef(0);
  const [started,setStarted] = useState(false);
  const [panel,setPanel] = useState<"inventory"|"journal"|"controls"|"talents"|null>(null);
  const [village,setVillage] = useState(false);
  const [choosingSpec,setChoosingSpec] = useState(false);
  const [bindings,setBindings] = useState<Bindings>(DEFAULT_BINDINGS);
  const bindingsRef = useRef<Bindings>(DEFAULT_BINDINGS);
  const [capture,setCapture] = useState<Action|null>(null);
  const [mouseLook,setMouseLook] = useState(false);
  const [sensitivity,setSensitivity] = useState(1);
  const sensitivityRef = useRef(1);
  const [hud,setHud] = useState({...START});
  const [message,setMessage] = useState("Les ruines murmurent votre nom…");

  const sync = useCallback(() => setHud({...state.current}), []);
  const gainXp = (amount:number)=>{const s=state.current;s.xp+=amount;while(s.xp>=s.level*40){s.xp-=s.level*40;s.level++;s.talent++;s.hp=100;s.mana=100;s.stamina=100;setMessage(`Niveau ${s.level} atteint — un point de talent disponible !`)}sync()};
  const applyBindings = useCallback((next:Bindings)=>{bindingsRef.current=next;setBindings(next);localStorage.setItem("cendreval-bindings",JSON.stringify(next))},[]);
  const clearInput = useCallback(()=>{keys.current={}},[]);
  const captureMouse = useCallback(()=>{if(started&&!panel&&!village&&!choosingSpec)canvasRef.current?.requestPointerLock?.()},[choosingSpec,panel,started,village]);
  const save = useCallback(() => {
    localStorage.setItem("cendreval-save", JSON.stringify(state.current));
    setMessage("Partie sauvegardée");
  }, []);
  const load = useCallback(() => {
    const raw=localStorage.getItem("cendreval-save");
    if(raw){ state.current={...START,...JSON.parse(raw)}; enemy.current.hp=state.current.enemyHp; enemy.current.alive=state.current.enemyHp>0; sync(); setMessage("Sauvegarde chargée"); }
    setStarted(true);
  },[sync]);

  const strike = useCallback((spell=false) => {
    if(panel) return;
    const s=state.current;
    if(spell && s.mana<15){setMessage("Pas assez de mana");return;}
    if(spell){s.mana-=15;spellFx.current=.35}else attackFx.current=.28;
    const candidates=[enemy.current,...minions.current].filter(e=>e.alive).sort((a,b)=>Math.hypot(a.x-s.x,a.y-s.y)-Math.hypot(b.x-s.x,b.y-s.y));
    const e=candidates[0]; if(!e){setMessage("La crypte est silencieuse.");sync();return}
    const d=Math.hypot(e.x-s.x,e.y-s.y);
    const target=Math.atan2(e.y-s.y,e.x-s.x);
    const diff=Math.abs(Math.atan2(Math.sin(target-s.a),Math.cos(target-s.a)));
    if(e.alive && d<(spell?7:1.65) && diff<.32){
      const base=spell?28+(s.perkArcane?12:0):22+(s.perkBlade?8:0);e.hp=Math.max(0,e.hp-base); e.hit=.18;
      if(e.boss)s.enemyHp=e.hp;
      if(e.hp===0){e.alive=false;s.gold+=e.boss?18:6;gainXp(e.boss?40:16);if(e.boss){s.quest=1;setMessage("Le gardien tombe. Valbrume vous attend !")}else setMessage("L’ombre se dissipe en cendres.");}
      else setMessage(spell?"La flamme dévore le gardien !":"Votre lame mord la pierre vive !");
    }
    sync();
  },[panel,sync]);

  const shootBow = useCallback(()=>{if(panel)return;const s=state.current;if(!s.arrows){setMessage("Plus de flèches.");return}const foes=[enemy.current,...minions.current].filter(e=>e.alive).sort((a,b)=>Math.hypot(a.x-s.x,a.y-s.y)-Math.hypot(b.x-s.x,b.y-s.y));const e=foes[0];s.arrows--;if(e){const dist=Math.hypot(e.x-s.x,e.y-s.y),target=Math.atan2(e.y-s.y,e.x-s.x),diff=Math.abs(Math.atan2(Math.sin(target-s.a),Math.cos(target-s.a)));if(dist<10&&diff<.18){e.hp=Math.max(0,e.hp-(30+(s.perkBow?12:0)));if(e.boss)s.enemyHp=e.hp;e.hit=.22;if(!e.hp){e.alive=false;s.gold+=e.boss?18:6;gainXp(e.boss?40:16);if(e.boss)s.quest=1;}setMessage("Flèche précise !")}else setMessage("La flèche se perd dans les ténèbres.")}sync()},[panel,sync]);

  const parry = useCallback(()=>{const s=state.current;if(panel||s.stamina<10)return;s.stamina-=10;parryFx.current=.46;perfectFx.current=.13;sync();setMessage("Parade — frappez au moment de l’impact pour une parade parfaite.")},[panel,sync]);
  const dodge = useCallback(()=>{const s=state.current;if(panel||s.stamina<24)return;s.stamina-=24;dodgeFx.current=.34;const nx=s.x-Math.cos(s.a)*.9,ny=s.y-Math.sin(s.a)*.9;if(!wallAt(nx,s.y))s.x=nx;if(!wallAt(s.x,ny))s.y=ny;sync();setMessage("Esquive !")},[panel,sync]);

  useEffect(()=>{
    const raw=localStorage.getItem("cendreval-bindings");
    if(raw){try{applyBindings({...DEFAULT_BINDINGS,...JSON.parse(raw)})}catch{}}
    const savedSensitivity=Number(localStorage.getItem("cendreval-mouse-sensitivity"));
    if(savedSensitivity){setSensitivity(savedSensitivity);sensitivityRef.current=savedSensitivity}
  },[applyBindings]);

  useEffect(()=>{
    const trigger=(input:string)=>{
      const action=(Object.keys(bindingsRef.current) as Action[]).find(a=>bindingsRef.current[a]===input);
      if(action==="attack")strike(false);
      if(action==="spell")strike(true);
      if(action==="bow")shootBow();
      if(action==="parry")parry();
      if(action==="dodge")dodge();
      if(action==="potion")potion();
      if(action==="inventory")setPanel(p=>p==="inventory"?null:"inventory");
      if(action==="journal")setPanel(p=>p==="journal"?null:"journal");
      if(action==="save")save();
    };
    const down=(e:KeyboardEvent)=>{
      if(capture){e.preventDefault();applyBindings({...bindingsRef.current,[capture]:e.code});setCapture(null);return}
      keys.current[e.code]=true;
      trigger(e.code);
      if(e.code==="Space")e.preventDefault();
      if(e.code==="Escape"){clearInput();setPanel(null);document.exitPointerLock?.()}
    };
    const up=(e:KeyboardEvent)=>{keys.current[e.code]=false};
    const mouseDown=(e:MouseEvent)=>{
      const input=`Mouse${e.button}`;
      if(capture){e.preventDefault();applyBindings({...bindingsRef.current,[capture]:input});setCapture(null);return}
      keys.current[input]=true;trigger(input);
      if(started && !panel && !village && canvasRef.current?.contains(e.target as Node))canvasRef.current.requestPointerLock?.();
      if(e.button!==0)e.preventDefault();
    };
    const mouseUp=(e:MouseEvent)=>{keys.current[`Mouse${e.button}`]=false};
    const move=(e:MouseEvent)=>{if(document.pointerLockElement===canvasRef.current&&!panel&&!village){state.current.a+=e.movementX*.0024*sensitivityRef.current}};
    const lock=()=>{if(document.pointerLockElement!==canvasRef.current)clearInput();setMouseLook(document.pointerLockElement===canvasRef.current)};
    const blur=()=>clearInput();
    addEventListener("keydown",down);addEventListener("keyup",up);addEventListener("mousedown",mouseDown);addEventListener("mouseup",mouseUp);addEventListener("mousemove",move);addEventListener("pointerlockchange",lock);addEventListener("blur",blur);
    return()=>{removeEventListener("keydown",down);removeEventListener("keyup",up);removeEventListener("mousedown",mouseDown);removeEventListener("mouseup",mouseUp);removeEventListener("mousemove",move);removeEventListener("pointerlockchange",lock);removeEventListener("blur",blur)};
  },[applyBindings,capture,clearInput,dodge,panel,parry,save,shootBow,started,strike,village]);

  useEffect(()=>{clearInput();document.exitPointerLock?.()},[clearInput,panel,village,choosingSpec]);

  useEffect(()=>{
    if(!started) return;
    const canvas=canvasRef.current!; const ctx=canvas.getContext("2d")!;
    ctx.imageSmoothingEnabled=false;
    let raf=0;
    const loop=(t:number)=>{
      const dt=Math.min(.04,(t-last.current)/1000||0);last.current=t;
      const s=state.current;
      if(!panel&&!village&&!choosingSpec){
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
      attackFx.current=Math.max(0,attackFx.current-dt);spellFx.current=Math.max(0,spellFx.current-dt);hurtFx.current=Math.max(0,hurtFx.current-dt);parryFx.current=Math.max(0,parryFx.current-dt);perfectFx.current=Math.max(0,perfectFx.current-dt);dodgeFx.current=Math.max(0,dodgeFx.current-dt);s.stamina=Math.min(100,s.stamina+dt*16);
      for(const foe of [enemy.current,...minions.current]){
        const telegraphBefore=foe.telegraph;foe.hit=Math.max(0,foe.hit-dt);foe.cooldown=Math.max(0,foe.cooldown-dt);foe.telegraph=Math.max(0,foe.telegraph-dt);
        if(!foe.alive)continue;
        const vx=s.x-foe.x,vy=s.y-foe.y,dist=Math.hypot(vx,vy);
        if(dist<7&&dist>.9&&foe.telegraph===0){const step=dt*(foe.boss?.65:.85),nx=foe.x+vx/dist*step,ny=foe.y+vy/dist*step;if(!wallAt(nx,foe.y))foe.x=nx;if(!wallAt(foe.x,ny))foe.y=ny;}
        if(dist<1.25&&foe.cooldown===0&&foe.telegraph===0){foe.telegraph=foe.boss?.64:.48;setMessage(`${foe.boss?"Le gardien lève son arme !":"L’ombre se prépare à frapper !"}`);}
        if(telegraphBefore>0&&foe.telegraph===0){foe.cooldown=foe.boss?1.15:1.35;if(dodgeFx.current>0){setMessage("Esquive parfaite !")}else if(parryFx.current>0){if(perfectFx.current>0){foe.hit=.65;foe.cooldown=1.8;s.stamina=Math.min(100,s.stamina+22);setMessage("PARADE PARFAITE — l’ennemi est étourdi !")}else{setMessage("Parade réussie.")}}else{s.hp=Math.max(0,s.hp-(foe.boss?8:4));hurtFx.current=.25;sync();setMessage(s.hp?`${foe.boss?"Le gardien":"Une ombre"} vous frappe !`: "Vous êtes tombé… rechargez votre sauvegarde.");}}
      }

      // Ciel voûté et sol en damier rétro.
      const sky=ctx.createLinearGradient(0,0,0,H/2);sky.addColorStop(0,"#090815");sky.addColorStop(1,"#34213b");ctx.fillStyle=sky;ctx.fillRect(0,0,W,H/2);
      const floor=ctx.createLinearGradient(0,H/2,0,H);floor.addColorStop(0,"#261b22");floor.addColorStop(1,"#09080c");ctx.fillStyle=floor;ctx.fillRect(0,H/2,W,H/2);
      for(let y=H/2;y<H;y+=8){ctx.fillStyle=y%16?"#1a1319":"#21171d";ctx.fillRect(0,y,W,1)}
      const zbuf=new Float32Array(W);
      for(let x=0;x<W;x++){
        const ray=s.a-FOV/2+(x/W)*FOV; let d=.02,hit=0;
        while(d<18&&!hit){d+=.025;hit=wallAt(s.x+Math.cos(ray)*d,s.y+Math.sin(ray)*d)}
        d*=Math.cos(ray-s.a);zbuf[x]=d;
        const wh=Math.min(H*1.6,H/d);const top=(H-wh)/2;
        const side=(Math.floor(s.x+Math.cos(ray)*d*8)+Math.floor(s.y+Math.sin(ray)*d*8))%2;
        const shade=Math.max(20,155-d*9)+(side?8:0);
        const colors=hit===2?[shade*.55,shade*.32,shade*.2]:hit===3?[shade*.25,shade*.52,shade*.48]:[shade*.48,shade*.42,shade*.44];
        ctx.fillStyle=`rgb(${colors[0]},${colors[1]},${colors[2]})`;ctx.fillRect(x,top,1,wh);
        if(x%13===0){ctx.fillStyle="rgba(10,5,10,.22)";ctx.fillRect(x,top,1,wh)}
      }

      // Ombres errantes : elles suivent le joueur et apparaissent comme des sprites dans le couloir.
      for(const shade of minions.current){
        if(!shade.alive)continue;
        const dx=shade.x-s.x,dy=shade.y-s.y,dist=Math.hypot(dx,dy);let ang=Math.atan2(dy,dx)-s.a;ang=Math.atan2(Math.sin(ang),Math.cos(ang));
        const column=Math.max(0,Math.min(W-1,Math.floor((ang/FOV+.5)*W)));
        if(Math.abs(ang)<FOV*.7&&dist<zbuf[column]){const size=Math.min(98,105/dist),cx=(.5+ang/FOV)*W,base=H/2+size*.52,u=size/12;ctx.save();ctx.translate(Math.floor(cx-size/2),Math.floor(base-size));ctx.fillStyle=shade.hit?"#f9d9bf":shade.telegraph>0?"#8e273c":"#100d1b";ctx.fillRect(3*u,2*u,6*u,9*u);ctx.fillStyle="#4a315f";ctx.fillRect(2*u,5*u,8*u,5*u);ctx.fillStyle="#c44c6a";ctx.fillRect(4*u,4*u,u,u);ctx.fillRect(7*u,4*u,u,u);ctx.fillStyle="#21152e";ctx.fillRect(2*u,10*u,3*u,2*u);ctx.fillRect(7*u,10*u,3*u,2*u);ctx.restore();}
      }

      // Gardien sous forme de billboard pixelisé.
      const e=enemy.current;
      if(e.alive){
        const dx=e.x-s.x,dy=e.y-s.y,dist=Math.hypot(dx,dy);let ang=Math.atan2(dy,dx)-s.a;ang=Math.atan2(Math.sin(ang),Math.cos(ang));
        if(Math.abs(ang)<FOV*.7 && dist<zbuf[Math.max(0,Math.min(W-1,Math.floor((ang/FOV+.5)*W)))]){
          const size=Math.min(130,150/dist),cx=(.5+ang/FOV)*W,base=H/2+size*.52;
          ctx.save();ctx.translate(Math.floor(cx-size/2),Math.floor(base-size));
          const u=size/16;ctx.fillStyle=e.hit?"#fff0c4":e.telegraph>0?"#9f2b37":"#16101b";ctx.fillRect(4*u,3*u,8*u,12*u);
          ctx.fillStyle="#696075";ctx.fillRect(5*u,2*u,6*u,7*u);ctx.fillRect(3*u,7*u,10*u,6*u);
          ctx.fillStyle="#c4463d";ctx.fillRect(6*u,5*u,1.5*u,u);ctx.fillRect(9*u,5*u,1.5*u,u);
          ctx.fillStyle="#a87a42";ctx.fillRect(1*u,6*u,3*u,2*u);ctx.fillRect(12*u,6*u,3*u,2*u);
          ctx.fillStyle="#3b3146";ctx.fillRect(4*u,13*u,3*u,3*u);ctx.fillRect(9*u,13*u,3*u,3*u);ctx.restore();
        }
      }

      // Arme, sort et viseur.
      if(spellFx.current>0){const r=30+spellFx.current*90,g=ctx.createRadialGradient(W*.68,H*.68,2,W*.68,H*.68,r);g.addColorStop(0,"#fff7a0");g.addColorStop(.35,"#ff6b28");g.addColorStop(1,"transparent");ctx.fillStyle=g;ctx.fillRect(0,0,W,H)}
      const swing=attackFx.current?Math.sin(attackFx.current/.28*Math.PI)*38:0;
      ctx.save();ctx.translate(W*.64+swing,H*.78-swing*.6);ctx.rotate(-.62+swing*.012);ctx.fillStyle="#211724";ctx.fillRect(-5,-2,15,8);ctx.fillStyle="#c0aeb1";ctx.fillRect(8,0,92,5);ctx.fillStyle="#f2d89c";ctx.fillRect(8,0,88,1);ctx.restore();
      if(parryFx.current>0){ctx.strokeStyle=perfectFx.current>0?"#ffe49a":"#9db5d5";ctx.lineWidth=5;ctx.beginPath();ctx.arc(W*.78,H*.73,35,Math.PI*.45,Math.PI*1.55);ctx.stroke()}
      ctx.fillStyle="rgba(255,239,190,.75)";ctx.fillRect(W/2-5,H/2,11,1);ctx.fillRect(W/2,H/2-5,1,11);
      if(hurtFx.current){ctx.fillStyle=`rgba(170,15,20,${hurtFx.current})`;ctx.fillRect(0,0,W,H)}
      raf=requestAnimationFrame(loop);
    };
    raf=requestAnimationFrame(loop);return()=>cancelAnimationFrame(raf);
  },[panel,started,sync]);

  const hold=(code:string,on:boolean)=>{keys.current[code]=on};
  const potion=()=>{if(state.current.potions&&state.current.hp<100){state.current.potions--;state.current.hp=Math.min(100,state.current.hp+45);sync();setMessage("La potion réchauffe votre sang.")}};
  const claimReward=()=>{const s=state.current;if(s.quest===1&&!s.reward){s.reward=1;s.quest=2;s.gold+=35;s.potions+=2;s.level=2;s.hp=100;s.mana=100;sync();setMessage("Récompense reçue : 35 or, 2 potions. Niveau 2 !")} };
  const buyPotion=()=>{const s=state.current;if(s.gold<8){setMessage("Il vous manque des pièces d’or.");return}s.gold-=8;s.potions++;sync();setMessage("Potion achetée.")};
  const chooseSpec=(spec:Save["spec"])=>{const s=state.current;s.spec=spec;s.perkBlade=spec==="blade";s.perkBow=spec==="bow";s.perkArcane=spec==="arcane";if(spec==="blade")s.stamina=100;if(spec==="bow")s.arrows=Math.max(s.arrows,22);if(spec==="arcane")s.mana=100;sync();setChoosingSpec(false);setStarted(true);setMessage(`Voie choisie : ${spec==="blade"?"Lame":spec==="bow"?"Rôdeur":"Arcanes"}.`)};
  const learnPerk=(perk:"perkBlade"|"perkBow"|"perkArcane")=>{const s=state.current;if(!s.talent||s[perk])return;s.talent--;s[perk]=true;sync();setMessage("Talent appris !")};
  const changeSensitivity=(value:number)=>{setSensitivity(value);sensitivityRef.current=value;localStorage.setItem("cendreval-mouse-sensitivity",String(value))};

  return <main className="game-shell">
    <div className="grain" />
    <header><div className="brand"><span>CHRONIQUES DE</span><strong>CENDREVAL</strong></div><div className="chapter">{village?"VALBRUME · LE VILLAGE DES BRUMES":"ACTE I · LA CRYPTE DES ROIS MUETS"}</div></header>
    <section className="stage" aria-label="Jeu en vue subjective">
      <canvas ref={canvasRef} width={W} height={H} tabIndex={0} onPointerDown={captureMouse} />
      {!started&&!choosingSpec&&<div className="start-screen"><div className="sigil">ᛉ</div><h1>CENDREVAL</h1><p>Un royaume brisé. Une crypte oubliée.<br/>Votre légende commence sous terre.</p><button onClick={()=>setChoosingSpec(true)}>NOUVELLE PARTIE</button><button className="secondary" onClick={load}>CONTINUER</button><small>Cliquez dans le jeu pour diriger la caméra à la souris</small></div>}
      {choosingSpec&&<div className="start-screen spec-select"><span className="eyebrow">CHOISISSEZ VOTRE VOIE</span><h1>VOTRE LÉGENDE</h1><div className="spec-cards"><button onClick={()=>chooseSpec("blade")}><b>⚔ LAME</b><small>Combat rapproché et endurance renforcée.</small></button><button onClick={()=>chooseSpec("bow")}><b>⌁ RÔDEUR</b><small>Arc, distance et vingt-deux flèches.</small></button><button onClick={()=>chooseSpec("arcane")}><b>✦ ARCANES</b><small>Mana maximum pour la flamme ancienne.</small></button></div><button className="secondary" onClick={()=>setChoosingSpec(false)}>RETOUR</button></div>}
      {started&&<><div className="top-hud"><div className="quest"><span>NIV. {hud.level} · {hud.xp}/{hud.level*40} EXP</span>{hud.quest===0?"Terrasser le gardien de la crypte":hud.quest===1?"Retourner à Valbrume":"Préparer la prochaine expédition"}</div><div className="top-actions">{hud.talent>0&&<button onClick={()=>setPanel("talents")}>Talent {hud.talent}</button>}{hud.quest>0&&<button onClick={()=>setVillage(true)}>Valbrume</button>}<button onClick={save}>Sauvegarder</button></div></div>
      <div className="message">{message}</div>
      <div className="bars"><div><label>VIE</label><i className="hp" style={{width:`${hud.hp}%`}}/></div><div><label>MANA</label><i className="mana" style={{width:`${hud.mana}%`}}/></div><div><label>ENDURANCE</label><i className="stamina" style={{width:`${hud.stamina}%`}}/></div></div>
      <div className="quickbar"><button onClick={potion}><b>1</b> Potion <em>{hud.potions}</em></button><button onClick={()=>strike(false)}><b>2</b> Lame</button><button onClick={()=>strike(true)}><b>3</b> Flamme</button><button onClick={shootBow}><b>R</b> Arc <em>{hud.arrows}</em></button><button onClick={parry}><b>MB3</b> Parade</button><button onClick={dodge}><b>⇧</b> Esquive</button><span>◈ {hud.gold}</span></div>
      <div className="menu-buttons"><button onClick={()=>setPanel("inventory")}>SAC</button><button onClick={()=>setPanel("journal")}>JOURNAL</button><button onClick={()=>setPanel("controls")}>OPTIONS</button></div>
      <div className="touch"><button onPointerDown={()=>hold("KeyA",true)} onPointerUp={()=>hold("KeyA",false)}>◀</button><button onPointerDown={()=>hold("KeyW",true)} onPointerUp={()=>hold("KeyW",false)}>▲</button><button onPointerDown={()=>hold("KeyD",true)} onPointerUp={()=>hold("KeyD",false)}>▶</button><button onClick={()=>strike(false)}>⚔</button><button onClick={()=>strike(true)}>✦</button></div></>}
      {panel&&<div className="panel"><button className="close" onClick={()=>setPanel(null)}>×</button>{panel==="controls"?<><span className="eyebrow">COMMANDES</span><h2>Clavier et souris</h2><p className="controls-note">Cliquez dans le jeu pour capturer la souris. Échap libère le curseur. Cliquez sur une action, puis pressez une touche ou un bouton de souris.</p><label className="sensitivity">Sensibilité souris <input aria-label="Sensibilité souris" type="range" min="0.3" max="2.5" step="0.1" value={sensitivity} onChange={e=>changeSensitivity(Number(e.target.value))}/><b>{sensitivity.toFixed(1)}×</b></label><div className="bindings">{(Object.keys(ACTION_LABELS) as Action[]).map(action=><div className="binding" key={action}><span>{ACTION_LABELS[action]}</span><button className={capture===action?"listening":""} onClick={()=>setCapture(action)}>{capture===action?"Appuyez…":bindingLabel(bindings[action])}</button></div>)}</div><button className="reset-bindings" onClick={()=>applyBindings(DEFAULT_BINDINGS)}>RÉTABLIR LES COMMANDES</button></>:panel==="inventory"?<><span className="eyebrow">ÉQUIPEMENT · NIVEAU {hud.level}</span><h2>Sac de l’aventurier</h2><div className="inventory"><div className="item selected">⚔<span>Lame ébréchée<small>Dégâts 22</small></span></div><div className="item">✦<span>Flamme ancienne<small>Coût 15 mana</small></span></div><div className="item">♥<span>Potion carmin<small>Quantité : {hud.potions}</small></span></div><div className="item">◆<span>Éclats d’or<small>{hud.gold} pièces</small></span></div></div></>:<><span className="eyebrow">JOURNAL</span><h2>La Crypte des rois muets</h2><p>Le village de Valbrume vit dans l’ombre d’un ancien gardien réveillé sous les collines.</p><div className={hud.quest>0?"objective done":"objective"}>{hud.quest>0?"✓ Gardien terrassé":"○ Trouver et terrasser le gardien"}</div><div className={hud.quest===2?"objective done":"objective"}>{hud.quest===2?"✓ Récompense de Valbrume reçue":"○ Retourner à Valbrume"}</div></>}</div>}
      {village&&<div className="village"><div className="village-art"><div className="moon"/><div className="mountain one"/><div className="mountain two"/><div className="houses"><i/><i/><i/></div></div><div className="village-copy"><span className="eyebrow">VALBRUME · HALLE DU CONSEIL</span><h2>« Vous avez rendu le silence à nos morts. »</h2><p>La doyenne Elenn vous accueille au coin du feu. Les habitants sortent de leurs maisons et le marchand a rouvert son étal.</p>{hud.quest===1?<button className="gold-button" onClick={claimReward}>RECEVOIR LA RÉCOMPENSE</button>:<div className="rewarded">✓ Vous êtes désormais protecteur de Valbrume.</div>}<div className="merchant"><span>ÉTAL DE RUNE</span><p>Potion carmin · restaure 45 points de vie</p><button onClick={buyPotion}>ACHETER · 8 OR</button></div><button className="leave" onClick={()=>setVillage(false)}>RETOURNER À LA CRYPTE</button></div><button className="close village-close" onClick={()=>setVillage(false)}>×</button></div>}
    </section>
    <footer><span>Une aventure rétro en vue subjective</span><span>Version prototype · Sauvegarde locale</span></footer>
    {panel==="talents"&&<div className="talent-panel"><button className="close" onClick={()=>setPanel(null)}>×</button><span className="eyebrow">PROGRESSION · {hud.talent} POINT</span><h2>Talents de combat</h2><p>Chaque voie peut être maîtrisée : les bonus sont permanents et s’ajoutent à la défense active.</p><div className="talent-list"><button className={hud.perkBlade?"learned":""} onClick={()=>learnPerk("perkBlade")}><b>Frappe du gardien</b><small>+8 dégâts de lame</small></button><button className={hud.perkBow?"learned":""} onClick={()=>learnPerk("perkBow")}><b>Flèche de chêne</b><small>+12 dégâts d’arc</small></button><button className={hud.perkArcane?"learned":""} onClick={()=>learnPerk("perkArcane")}><b>Braise profonde</b><small>+12 dégâts de flamme</small></button></div></div>}
  </main>;
}

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

type Save = { x:number; y:number; a:number; hp:number; mana:number; gold:number; potions:number; enemyHp:number; quest:number; level:number; reward:number };
const START: Save = { x: 2.5, y: 13.2, a: -Math.PI/2, hp: 100, mana: 80, gold: 12, potions: 2, enemyHp: 70, quest: 0, level:1, reward:0 };
const W = 426, H = 240, FOV = Math.PI / 3;
type Action = "forward"|"back"|"left"|"right"|"turnLeft"|"turnRight"|"attack"|"spell"|"potion"|"inventory"|"journal"|"save";
type Bindings = Record<Action,string>;
const DEFAULT_BINDINGS: Bindings = {forward:"KeyZ",back:"KeyS",left:"KeyQ",right:"KeyD",turnLeft:"ArrowLeft",turnRight:"ArrowRight",attack:"Mouse0",spell:"Mouse2",potion:"Digit1",inventory:"KeyI",journal:"KeyJ",save:"KeyP"};
const ACTION_LABELS: Record<Action,string> = {forward:"Avancer",back:"Reculer",left:"Pas à gauche",right:"Pas à droite",turnLeft:"Tourner à gauche",turnRight:"Tourner à droite",attack:"Attaquer",spell:"Lancer la flamme",potion:"Boire une potion",inventory:"Ouvrir le sac",journal:"Ouvrir le journal",save:"Sauvegarder"};
function bindingLabel(value:string){return value.replace("Key","Touche ").replace("Digit","Touche ").replace("Arrow","Flèche ").replace("Mouse0","Clic gauche").replace("Mouse1","Clic molette").replace("Mouse2","Clic droit").replace("Mouse3","Souris 3").replace("Mouse4","Souris 4")}

function wallAt(x:number, y:number) {
  const row = MAP[Math.floor(y)];
  return !row ? 1 : Number(row[Math.floor(x)] ?? 1);
}

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const state = useRef<Save>({...START});
  const keys = useRef<Record<string,boolean>>({});
  const enemy = useRef({x:11.5,y:4.5,hp:70,alive:true,hit:0,cooldown:0,boss:true,name:"gardien"});
  const minions = useRef([
    {x:5.5,y:3.5,hp:34,alive:true,hit:0,cooldown:0,boss:false,name:"ombre"},
    {x:8.5,y:11.5,hp:34,alive:true,hit:0,cooldown:0,boss:false,name:"ombre"},
  ]);
  const attackFx = useRef(0);
  const spellFx = useRef(0);
  const hurtFx = useRef(0);
  const last = useRef(0);
  const [started,setStarted] = useState(false);
  const [panel,setPanel] = useState<"inventory"|"journal"|"controls"|null>(null);
  const [village,setVillage] = useState(false);
  const [bindings,setBindings] = useState<Bindings>(DEFAULT_BINDINGS);
  const bindingsRef = useRef<Bindings>(DEFAULT_BINDINGS);
  const [capture,setCapture] = useState<Action|null>(null);
  const [mouseLook,setMouseLook] = useState(false);
  const [sensitivity,setSensitivity] = useState(1);
  const sensitivityRef = useRef(1);
  const [hud,setHud] = useState({...START});
  const [message,setMessage] = useState("Les ruines murmurent votre nom…");

  const sync = useCallback(() => setHud({...state.current}), []);
  const applyBindings = useCallback((next:Bindings)=>{bindingsRef.current=next;setBindings(next);localStorage.setItem("cendreval-bindings",JSON.stringify(next))},[]);
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
      e.hp=Math.max(0,e.hp-(spell?28:22)); e.hit=.18;
      if(e.boss)s.enemyHp=e.hp;
      if(e.hp===0){e.alive=false;s.gold+=e.boss?18:6;if(e.boss){s.quest=1;setMessage("Le gardien tombe. Valbrume vous attend !")}else setMessage("L’ombre se dissipe en cendres.");}
      else setMessage(spell?"La flamme dévore le gardien !":"Votre lame mord la pierre vive !");
    }
    sync();
  },[panel,sync]);

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
      if(e.code==="Escape") setPanel(null);
    };
    const up=(e:KeyboardEvent)=>{keys.current[e.code]=false};
    const mouseDown=(e:MouseEvent)=>{
      const input=`Mouse${e.button}`;
      if(capture){e.preventDefault();applyBindings({...bindingsRef.current,[capture]:input});setCapture(null);return}
      keys.current[input]=true;trigger(input);
      if(started && !panel && !village && canvasRef.current?.contains(e.target as Node))canvasRef.current.requestPointerLock();
      if(e.button!==0)e.preventDefault();
    };
    const mouseUp=(e:MouseEvent)=>{keys.current[`Mouse${e.button}`]=false};
    const move=(e:MouseEvent)=>{if(document.pointerLockElement===canvasRef.current&&!panel&&!village){state.current.a+=e.movementX*.0024*sensitivityRef.current}};
    const lock=()=>setMouseLook(document.pointerLockElement===canvasRef.current);
    addEventListener("keydown",down);addEventListener("keyup",up);addEventListener("mousedown",mouseDown);addEventListener("mouseup",mouseUp);addEventListener("mousemove",move);addEventListener("pointerlockchange",lock);
    return()=>{removeEventListener("keydown",down);removeEventListener("keyup",up);removeEventListener("mousedown",mouseDown);removeEventListener("mouseup",mouseUp);removeEventListener("mousemove",move);removeEventListener("pointerlockchange",lock)};
  },[applyBindings,capture,panel,save,started,strike,village]);

  useEffect(()=>{
    if(!started) return;
    const canvas=canvasRef.current!; const ctx=canvas.getContext("2d")!;
    ctx.imageSmoothingEnabled=false;
    let raf=0;
    const loop=(t:number)=>{
      const dt=Math.min(.04,(t-last.current)/1000||0);last.current=t;
      const s=state.current;
      if(!panel){
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
      attackFx.current=Math.max(0,attackFx.current-dt);spellFx.current=Math.max(0,spellFx.current-dt);hurtFx.current=Math.max(0,hurtFx.current-dt);
      for(const foe of [enemy.current,...minions.current]){
        foe.hit=Math.max(0,foe.hit-dt);foe.cooldown=Math.max(0,foe.cooldown-dt);
        if(!foe.alive)continue;
        const vx=s.x-foe.x,vy=s.y-foe.y,dist=Math.hypot(vx,vy);
        if(dist<7&&dist>.9){const step=dt*(foe.boss?.65:.85),nx=foe.x+vx/dist*step,ny=foe.y+vy/dist*step;if(!wallAt(nx,foe.y))foe.x=nx;if(!wallAt(foe.x,ny))foe.y=ny;}
        if(dist<1.25&&foe.cooldown===0){foe.cooldown=foe.boss?1.15:1.45;s.hp=Math.max(0,s.hp-(foe.boss?8:4));hurtFx.current=.25;sync();setMessage(s.hp?`${foe.boss?"Le gardien":"Une ombre"} vous frappe !`: "Vous êtes tombé… rechargez votre sauvegarde.");}
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
        if(Math.abs(ang)<FOV*.7&&dist<zbuf[column]){const size=Math.min(98,105/dist),cx=(.5+ang/FOV)*W,base=H/2+size*.52,u=size/12;ctx.save();ctx.translate(Math.floor(cx-size/2),Math.floor(base-size));ctx.fillStyle=shade.hit?"#f9d9bf":"#100d1b";ctx.fillRect(3*u,2*u,6*u,9*u);ctx.fillStyle="#4a315f";ctx.fillRect(2*u,5*u,8*u,5*u);ctx.fillStyle="#c44c6a";ctx.fillRect(4*u,4*u,u,u);ctx.fillRect(7*u,4*u,u,u);ctx.fillStyle="#21152e";ctx.fillRect(2*u,10*u,3*u,2*u);ctx.fillRect(7*u,10*u,3*u,2*u);ctx.restore();}
      }

      // Gardien sous forme de billboard pixelisé.
      const e=enemy.current;
      if(e.alive){
        const dx=e.x-s.x,dy=e.y-s.y,dist=Math.hypot(dx,dy);let ang=Math.atan2(dy,dx)-s.a;ang=Math.atan2(Math.sin(ang),Math.cos(ang));
        if(Math.abs(ang)<FOV*.7 && dist<zbuf[Math.max(0,Math.min(W-1,Math.floor((ang/FOV+.5)*W)))]){
          const size=Math.min(130,150/dist),cx=(.5+ang/FOV)*W,base=H/2+size*.52;
          ctx.save();ctx.translate(Math.floor(cx-size/2),Math.floor(base-size));
          const u=size/16;ctx.fillStyle=e.hit?"#fff0c4":"#16101b";ctx.fillRect(4*u,3*u,8*u,12*u);
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
  const changeSensitivity=(value:number)=>{setSensitivity(value);sensitivityRef.current=value;localStorage.setItem("cendreval-mouse-sensitivity",String(value))};

  return <main className="game-shell">
    <div className="grain" />
    <header><div className="brand"><span>CHRONIQUES DE</span><strong>CENDREVAL</strong></div><div className="chapter">{village?"VALBRUME · LE VILLAGE DES BRUMES":"ACTE I · LA CRYPTE DES ROIS MUETS"}</div></header>
    <section className="stage" aria-label="Jeu en vue subjective">
      <canvas ref={canvasRef} width={W} height={H} />
      {!started&&<div className="start-screen"><div className="sigil">ᛉ</div><h1>CENDREVAL</h1><p>Un royaume brisé. Une crypte oubliée.<br/>Votre légende commence sous terre.</p><button onClick={()=>setStarted(true)}>NOUVELLE PARTIE</button><button className="secondary" onClick={load}>CONTINUER</button><small>Cliquez dans le jeu pour diriger la caméra à la souris</small></div>}
      {started&&<><div className="top-hud"><div className="quest"><span>OBJECTIF</span>{hud.quest===0?"Terrasser le gardien de la crypte":hud.quest===1?"Retourner à Valbrume":"Préparer la prochaine expédition"}</div><div className="top-actions">{hud.quest>0&&<button onClick={()=>setVillage(true)}>Valbrume</button>}<button onClick={save}>Sauvegarder</button></div></div>
      <div className="message">{message}</div>
      <div className="bars"><div><label>VIE</label><i className="hp" style={{width:`${hud.hp}%`}}/></div><div><label>MANA</label><i className="mana" style={{width:`${hud.mana}%`}}/></div></div>
      <div className="quickbar"><button onClick={potion}><b>1</b> Potion <em>{hud.potions}</em></button><button onClick={()=>strike(false)}><b>2</b> Lame</button><button onClick={()=>strike(true)}><b>3</b> Flamme</button><span>◈ {hud.gold}</span></div>
      <div className="menu-buttons"><button onClick={()=>setPanel("inventory")}>SAC</button><button onClick={()=>setPanel("journal")}>JOURNAL</button><button onClick={()=>setPanel("controls")}>OPTIONS</button></div>
      <div className="touch"><button onPointerDown={()=>hold("KeyA",true)} onPointerUp={()=>hold("KeyA",false)}>◀</button><button onPointerDown={()=>hold("KeyW",true)} onPointerUp={()=>hold("KeyW",false)}>▲</button><button onPointerDown={()=>hold("KeyD",true)} onPointerUp={()=>hold("KeyD",false)}>▶</button><button onClick={()=>strike(false)}>⚔</button><button onClick={()=>strike(true)}>✦</button></div></>}
      {panel&&<div className="panel"><button className="close" onClick={()=>setPanel(null)}>×</button>{panel==="controls"?<><span className="eyebrow">COMMANDES</span><h2>Clavier et souris</h2><p className="controls-note">Cliquez dans le jeu pour capturer la souris. Échap libère le curseur. Cliquez sur une action, puis pressez une touche ou un bouton de souris.</p><label className="sensitivity">Sensibilité souris <input aria-label="Sensibilité souris" type="range" min="0.3" max="2.5" step="0.1" value={sensitivity} onChange={e=>changeSensitivity(Number(e.target.value))}/><b>{sensitivity.toFixed(1)}×</b></label><div className="bindings">{(Object.keys(ACTION_LABELS) as Action[]).map(action=><div className="binding" key={action}><span>{ACTION_LABELS[action]}</span><button className={capture===action?"listening":""} onClick={()=>setCapture(action)}>{capture===action?"Appuyez…":bindingLabel(bindings[action])}</button></div>)}</div><button className="reset-bindings" onClick={()=>applyBindings(DEFAULT_BINDINGS)}>RÉTABLIR LES COMMANDES</button></>:panel==="inventory"?<><span className="eyebrow">ÉQUIPEMENT · NIVEAU {hud.level}</span><h2>Sac de l’aventurier</h2><div className="inventory"><div className="item selected">⚔<span>Lame ébréchée<small>Dégâts 22</small></span></div><div className="item">✦<span>Flamme ancienne<small>Coût 15 mana</small></span></div><div className="item">♥<span>Potion carmin<small>Quantité : {hud.potions}</small></span></div><div className="item">◆<span>Éclats d’or<small>{hud.gold} pièces</small></span></div></div></>:<><span className="eyebrow">JOURNAL</span><h2>La Crypte des rois muets</h2><p>Le village de Valbrume vit dans l’ombre d’un ancien gardien réveillé sous les collines.</p><div className={hud.quest>0?"objective done":"objective"}>{hud.quest>0?"✓ Gardien terrassé":"○ Trouver et terrasser le gardien"}</div><div className={hud.quest===2?"objective done":"objective"}>{hud.quest===2?"✓ Récompense de Valbrume reçue":"○ Retourner à Valbrume"}</div></>}</div>}
      {village&&<div className="village"><div className="village-art"><div className="moon"/><div className="mountain one"/><div className="mountain two"/><div className="houses"><i/><i/><i/></div></div><div className="village-copy"><span className="eyebrow">VALBRUME · HALLE DU CONSEIL</span><h2>« Vous avez rendu le silence à nos morts. »</h2><p>La doyenne Elenn vous accueille au coin du feu. Les habitants sortent de leurs maisons et le marchand a rouvert son étal.</p>{hud.quest===1?<button className="gold-button" onClick={claimReward}>RECEVOIR LA RÉCOMPENSE</button>:<div className="rewarded">✓ Vous êtes désormais protecteur de Valbrume.</div>}<div className="merchant"><span>ÉTAL DE RUNE</span><p>Potion carmin · restaure 45 points de vie</p><button onClick={buyPotion}>ACHETER · 8 OR</button></div><button className="leave" onClick={()=>setVillage(false)}>RETOURNER À LA CRYPTE</button></div><button className="close village-close" onClick={()=>setVillage(false)}>×</button></div>}
    </section>
    <footer><span>Une aventure rétro en vue subjective</span><span>Version prototype · Sauvegarde locale</span></footer>
  </main>;
}

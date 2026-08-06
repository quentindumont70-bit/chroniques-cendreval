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

type Save = { x:number; y:number; a:number; hp:number; mana:number; gold:number; potions:number; enemyHp:number; quest:number };
const START: Save = { x: 2.5, y: 13.2, a: -Math.PI/2, hp: 100, mana: 80, gold: 12, potions: 2, enemyHp: 70, quest: 0 };
const W = 426, H = 240, FOV = Math.PI / 3;

function wallAt(x:number, y:number) {
  const row = MAP[Math.floor(y)];
  return !row ? 1 : Number(row[Math.floor(x)] ?? 1);
}

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const state = useRef<Save>({...START});
  const keys = useRef<Record<string,boolean>>({});
  const enemy = useRef({x:11.5,y:4.5,alive:true,hit:0});
  const attackFx = useRef(0);
  const spellFx = useRef(0);
  const hurtFx = useRef(0);
  const last = useRef(0);
  const [started,setStarted] = useState(false);
  const [panel,setPanel] = useState<"inventory"|"journal"|null>(null);
  const [hud,setHud] = useState({...START});
  const [message,setMessage] = useState("Les ruines murmurent votre nom…");

  const sync = useCallback(() => setHud({...state.current}), []);
  const save = useCallback(() => {
    localStorage.setItem("cendreval-save", JSON.stringify(state.current));
    setMessage("Partie sauvegardée");
  }, []);
  const load = useCallback(() => {
    const raw=localStorage.getItem("cendreval-save");
    if(raw){ state.current={...START,...JSON.parse(raw)}; enemy.current.alive=state.current.enemyHp>0; sync(); setMessage("Sauvegarde chargée"); }
    setStarted(true);
  },[sync]);

  const strike = useCallback((spell=false) => {
    if(panel) return;
    const s=state.current;
    if(spell && s.mana<15){setMessage("Pas assez de mana");return;}
    if(spell){s.mana-=15;spellFx.current=.35}else attackFx.current=.28;
    const e=enemy.current, d=Math.hypot(e.x-s.x,e.y-s.y);
    const target=Math.atan2(e.y-s.y,e.x-s.x);
    const diff=Math.abs(Math.atan2(Math.sin(target-s.a),Math.cos(target-s.a)));
    if(e.alive && d<(spell?7:1.65) && diff<.32){
      s.enemyHp=Math.max(0,s.enemyHp-(spell?28:22)); e.hit=.18;
      if(s.enemyHp===0){e.alive=false;s.gold+=18;s.quest=1;setMessage("Le gardien tombe. La crypte est libre !");}
      else setMessage(spell?"La flamme dévore le gardien !":"Votre lame mord la pierre vive !");
    }
    sync();
  },[panel,sync]);

  useEffect(()=>{
    const down=(e:KeyboardEvent)=>{
      keys.current[e.code]=true;
      if(e.code==="Space"){e.preventDefault();strike(false)}
      if(e.code==="KeyF") strike(true);
      if(e.code==="KeyI") setPanel(p=>p==="inventory"?null:"inventory");
      if(e.code==="KeyJ") setPanel(p=>p==="journal"?null:"journal");
      if(e.code==="KeyP") save();
      if(e.code==="Escape") setPanel(null);
    };
    const up=(e:KeyboardEvent)=>{keys.current[e.code]=false};
    addEventListener("keydown",down);addEventListener("keyup",up);
    return()=>{removeEventListener("keydown",down);removeEventListener("keyup",up)};
  },[save,strike]);

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
        if(keys.current.ArrowLeft||keys.current.KeyQ)turn-=1;
        if(keys.current.ArrowRight||keys.current.KeyE)turn+=1;
        if(keys.current.KeyW||keys.current.KeyZ||keys.current.ArrowUp)move+=1;
        if(keys.current.KeyS||keys.current.ArrowDown)move-=1;
        if(keys.current.KeyA)strafe-=1;if(keys.current.KeyD)strafe+=1;
        s.a+=turn*dt*2.15;
        const speed=dt*2.35, dx=(Math.cos(s.a)*move+Math.cos(s.a+Math.PI/2)*strafe)*speed, dy=(Math.sin(s.a)*move+Math.sin(s.a+Math.PI/2)*strafe)*speed;
        if(!wallAt(s.x+dx,s.y))s.x+=dx;if(!wallAt(s.x,s.y+dy))s.y+=dy;
      }
      attackFx.current=Math.max(0,attackFx.current-dt);spellFx.current=Math.max(0,spellFx.current-dt);hurtFx.current=Math.max(0,hurtFx.current-dt);enemy.current.hit=Math.max(0,enemy.current.hit-dt);

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
          if(dist<1.35 && t%900<35){s.hp=Math.max(0,s.hp-7);hurtFx.current=.25;sync();setMessage(s.hp?"Le gardien vous frappe !":"Vous êtes tombé… rechargez votre sauvegarde.");}
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

  return <main className="game-shell">
    <div className="grain" />
    <header><div className="brand"><span>CHRONIQUES DE</span><strong>CENDREVAL</strong></div><div className="chapter">ACTE I · LA CRYPTE DES ROIS MUETS</div></header>
    <section className="stage" aria-label="Jeu en vue subjective">
      <canvas ref={canvasRef} width={W} height={H} />
      {!started&&<div className="start-screen"><div className="sigil">ᛉ</div><h1>CENDREVAL</h1><p>Un royaume brisé. Une crypte oubliée.<br/>Votre légende commence sous terre.</p><button onClick={()=>setStarted(true)}>NOUVELLE PARTIE</button><button className="secondary" onClick={load}>CONTINUER</button><small>ZQSD / flèches · Espace attaque · F magie</small></div>}
      {started&&<><div className="top-hud"><div className="quest"><span>OBJECTIF</span>{hud.quest?"Retourner au village":"Terrasser le gardien de la crypte"}</div><button onClick={save}>Sauvegarder</button></div>
      <div className="message">{message}</div>
      <div className="bars"><div><label>VIE</label><i className="hp" style={{width:`${hud.hp}%`}}/></div><div><label>MANA</label><i className="mana" style={{width:`${hud.mana}%`}}/></div></div>
      <div className="quickbar"><button onClick={potion}><b>1</b> Potion <em>{hud.potions}</em></button><button onClick={()=>strike(false)}><b>2</b> Lame</button><button onClick={()=>strike(true)}><b>3</b> Flamme</button><span>◈ {hud.gold}</span></div>
      <div className="menu-buttons"><button onClick={()=>setPanel("inventory")}>I · SAC</button><button onClick={()=>setPanel("journal")}>J · JOURNAL</button></div>
      <div className="touch"><button onPointerDown={()=>hold("KeyA",true)} onPointerUp={()=>hold("KeyA",false)}>◀</button><button onPointerDown={()=>hold("KeyW",true)} onPointerUp={()=>hold("KeyW",false)}>▲</button><button onPointerDown={()=>hold("KeyD",true)} onPointerUp={()=>hold("KeyD",false)}>▶</button><button onClick={()=>strike(false)}>⚔</button><button onClick={()=>strike(true)}>✦</button></div></>}
      {panel&&<div className="panel"><button className="close" onClick={()=>setPanel(null)}>×</button>{panel==="inventory"?<><span className="eyebrow">ÉQUIPEMENT</span><h2>Sac de l’aventurier</h2><div className="inventory"><div className="item selected">⚔<span>Lame ébréchée<small>Dégâts 22</small></span></div><div className="item">✦<span>Flamme ancienne<small>Coût 15 mana</small></span></div><div className="item">♥<span>Potion carmin<small>Quantité : {hud.potions}</small></span></div><div className="item">◆<span>Éclats d’or<small>{hud.gold} pièces</small></span></div></div></>:<><span className="eyebrow">JOURNAL</span><h2>La Crypte des rois muets</h2><p>Le village de Valbrume vit dans l’ombre d’un ancien gardien réveillé sous les collines.</p><div className={hud.quest?"objective done":"objective"}>{hud.quest?"✓ Gardien terrassé":"○ Trouver et terrasser le gardien"}</div><div className="objective">○ Retourner à Valbrume</div></>}</div>}
    </section>
    <footer><span>Une aventure rétro en vue subjective</span><span>Version prototype · Sauvegarde locale</span></footer>
  </main>;
}

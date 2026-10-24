"use client";
import {useEffect,useRef} from "react";
import type {PointerEvent} from "react";
type Props={onMove:(f:number,s:number)=>void;onLook:(x:number,y:number)=>void;onAttack:()=>void;onAbility:()=>void;onGuard:(held:boolean)=>void;onDodge:(f:number,s:number)=>void;onInteract:()=>void;onPotion:()=>void;onWake:()=>void};
type Finger={id:number;x:number;y:number;lastX:number;lastY:number;time:number;max:number;peakX:number;peakY:number;peakAt:number;dodgeAt:number;guard:boolean;dodged:boolean;looking:boolean};
const HOLD_MS=140,TAP_MS=210;
export default function TouchControls(props:Props){
  const latest=useRef(props);latest.current=props;
  const fingers=useRef<{left:Finger|null;right:Finger|null}>({left:null,right:null});
  const timers=useRef<{hold:ReturnType<typeof setTimeout>|null;left:ReturnType<typeof setTimeout>|null;right:ReturnType<typeof setTimeout>|null}>({hold:null,left:null,right:null});
  const ring=useRef<HTMLDivElement>(null),knob=useRef<HTMLSpanElement>(null),surface=useRef<HTMLDivElement>(null);
  const cancel=(key:keyof typeof timers.current)=>{if(timers.current[key]!==null)clearTimeout(timers.current[key]!);timers.current[key]=null};
  const reset=()=>{cancel("hold");cancel("left");cancel("right");fingers.current={left:null,right:null};latest.current.onMove(0,0);latest.current.onGuard(false);if(ring.current)ring.current.style.opacity="0";surface.current?.removeAttribute("data-guard")};
  useEffect(()=>{window.addEventListener("blur",reset);document.addEventListener("visibilitychange",reset);return()=>{window.removeEventListener("blur",reset);document.removeEventListener("visibilitychange",reset);reset()}},[]);
  const down=(e:PointerEvent<HTMLDivElement>)=>{
    e.preventDefault();e.stopPropagation();latest.current.onWake();
    const box=e.currentTarget.getBoundingClientRect(),side=e.clientX<box.left+box.width*.5?"left":"right";
    if(fingers.current[side])return;
    const f:Finger={id:e.pointerId,x:e.clientX,y:e.clientY,lastX:e.clientX,lastY:e.clientY,time:performance.now(),max:0,peakX:0,peakY:0,peakAt:-Infinity,dodgeAt:-Infinity,guard:false,dodged:false,looking:false};fingers.current[side]=f;e.currentTarget.setPointerCapture(e.pointerId);
    if(side==="left"&&ring.current){ring.current.style.left=`${f.x-box.left}px`;ring.current.style.top=`${f.y-box.top}px`;ring.current.style.opacity=".65";if(knob.current)knob.current.style.transform="translate(-50%,-50%)"}
    if(side==="right"){cancel("hold");timers.current.hold=setTimeout(()=>{timers.current.hold=null;if(fingers.current.right===f&&!f.looking&&f.max<12){cancel("right");f.guard=true;latest.current.onGuard(true);surface.current?.setAttribute("data-guard","true")}},HOLD_MS)}
  };
  const move=(e:PointerEvent<HTMLDivElement>)=>{
    const side=fingers.current.left?.id===e.pointerId?"left":fingers.current.right?.id===e.pointerId?"right":null;if(!side)return;
    e.preventDefault();e.stopPropagation();const f=fingers.current[side]!,dx=e.clientX-f.x,dy=e.clientY-f.y,dist=Math.hypot(dx,dy);
    if(dist>f.max){f.max=dist;f.peakX=dx;f.peakY=dy}
    if(side==="left"){
      if(dist>=42&&Math.hypot(f.lastX-f.x,f.lastY-f.y)<42){f.peakAt=performance.now();f.peakX=dx;f.peakY=dy}
      const radius=48,power=Math.max(0,Math.min(1,(dist-6)/(radius-6)));
      latest.current.onMove(dist?-dy/dist*power:0,dist?dx/dist*power:0);
      if(knob.current)knob.current.style.transform=`translate(calc(-50% + ${dx/Math.max(1,dist)*Math.min(dist,radius)}px),calc(-50% + ${dy/Math.max(1,dist)*Math.min(dist,radius)}px))`;
      // A deliberate out-and-back gesture, never an ordinary sustained walk.
      if(f.max>=42&&dist<18&&performance.now()-f.peakAt<240&&performance.now()-f.dodgeAt>450){f.dodged=true;f.dodgeAt=performance.now();f.peakAt=-Infinity;cancel("left");const len=Math.hypot(f.peakX,f.peakY);latest.current.onDodge(-f.peakY/len,f.peakX/len)}
    }else{
      if(!f.guard&&dist>12){f.looking=true;cancel("hold");cancel("right")}
      if(f.looking||f.guard)latest.current.onLook((e.clientX-f.lastX)*(f.guard?.35:1),(e.clientY-f.lastY)*(f.guard?.35:1));
    }
    f.lastX=e.clientX;f.lastY=e.clientY;
  };
  const end=(e:PointerEvent<HTMLDivElement>,aborted=false)=>{
    const side=fingers.current.left?.id===e.pointerId?"left":fingers.current.right?.id===e.pointerId?"right":null;if(!side)return;
    e.stopPropagation();const f=fingers.current[side]!;fingers.current[side]=null;
    if(side==="left"){latest.current.onMove(0,0);if(ring.current)ring.current.style.opacity="0"}else{cancel("hold");latest.current.onGuard(false);surface.current?.removeAttribute("data-guard")}
    if(aborted){cancel(side);return}
    if(!f.guard&&!f.dodged&&!f.looking&&f.max<12&&performance.now()-f.time<HOLD_MS){
      if(timers.current[side]){cancel(side);if(side==="right")latest.current.onAbility();else latest.current.onPotion()}
      else timers.current[side]=setTimeout(()=>{timers.current[side]=null;if(side==="right")latest.current.onAttack();else latest.current.onInteract()},TAP_MS);
    }
  };
  return <div ref={surface} className="thumb-surface" role="group" aria-label="Commandes gestuelles aux deux pouces" onPointerDown={down} onPointerMove={move} onPointerUp={e=>end(e)} onPointerCancel={e=>end(e,true)} onLostPointerCapture={e=>end(e,true)} onContextMenu={e=>e.preventDefault()}><div className="thumb-ring" ref={ring}><span ref={knob}/></div><div className="thumb-caption left">GLISSER · MARCHER<small>aller-retour bref · esquive</small></div><div className="thumb-caption right">GLISSER · REGARDER<small>tap · frappe / maintenir · garde</small></div><div className="thumb-guard">GARDE</div></div>;
}

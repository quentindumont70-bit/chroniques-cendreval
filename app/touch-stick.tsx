"use client";
import { useEffect, useRef } from "react";
import type { PointerEvent } from "react";

export default function TouchStick({onMove}:{onMove:(forward:number,strafe:number)=>void}){
  const pointer=useRef<number|null>(null);
  const knob=useRef<HTMLSpanElement>(null);
  const latest=useRef(onMove);latest.current=onMove;
  const reset=()=>{pointer.current=null;if(knob.current)knob.current.style.transform="translate(-50%,-50%)";latest.current(0,0)};
  useEffect(()=>{
    const stop=()=>{pointer.current=null;if(knob.current)knob.current.style.transform="translate(-50%,-50%)";latest.current(0,0)};
    window.addEventListener("blur",stop);document.addEventListener("visibilitychange",stop);
    return()=>{window.removeEventListener("blur",stop);document.removeEventListener("visibilitychange",stop);stop()};
  },[]);
  const move=(e:PointerEvent<HTMLDivElement>)=>{
    if(pointer.current!==e.pointerId)return;e.preventDefault();e.stopPropagation();
    const box=e.currentTarget.getBoundingClientRect(),radius=box.width*.33;
    let dx=e.clientX-box.left-box.width/2,dy=e.clientY-box.top-box.height/2;
    const distance=Math.hypot(dx,dy),scale=Math.min(1,radius/Math.max(1,distance));dx*=scale;dy*=scale;
    if(knob.current)knob.current.style.transform=`translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px))`;
    const power=Math.max(0,(Math.min(1,distance/radius)-.13)/.87);
    latest.current(distance?-dy/Math.min(distance,radius)*power:0,distance?dx/Math.min(distance,radius)*power:0);
  };
  return <div className="touch-stick" role="group" aria-label="Joystick de déplacement : glisser pour avancer, reculer ou se décaler" onPointerDown={e=>{if(pointer.current!==null)return;pointer.current=e.pointerId;e.currentTarget.setPointerCapture(e.pointerId);move(e)}} onPointerMove={move} onPointerUp={e=>{if(pointer.current===e.pointerId)reset()}} onPointerCancel={e=>{if(pointer.current===e.pointerId)reset()}} onLostPointerCapture={e=>{if(pointer.current===e.pointerId)reset()}}><i aria-hidden="true"/><span ref={knob} aria-hidden="true"/><small>SE DÉPLACER</small></div>;
}

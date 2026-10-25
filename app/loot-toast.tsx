"use client";
import {useEffect,useState} from "react";
import {type LootEvent,lootAnnouncement,recentLoot} from "./loot-feed";
import {ITEMS} from "./loot";
import {itemRarityColor} from "./equipment-effects";
export default function LootToast({events}:{events:readonly LootEvent[]}){
 const [now,setNow]=useState(0);
 useEffect(()=>{setNow(Date.now());const id=setInterval(()=>setNow(Date.now()),1000);return()=>clearInterval(id)},[events]);
 const visible=recentLoot(events,now);
 if(!visible.length)return null;
 return <aside aria-label="Butin obtenu" aria-live="polite" style={{position:"fixed",right:12,top:"calc(env(safe-area-inset-top, 0px) + 100px)",zIndex:1000,display:"grid",gap:6,maxWidth:"min(340px,calc(100vw - 24px))",pointerEvents:"none"}}>
 {visible.slice(-3).map(event=><div key={event.id} style={{background:"rgba(12,15,24,.98)",border:"2px solid #d1b47e",borderLeft:`4px solid ${itemRarityColor(Object.values(ITEMS).find(item=>item.id===event.itemId)??ITEMS.ash)}`,padding:"14px 16px",boxShadow:"0 6px 22px #0008",borderRadius:6,color:"#f5e8d2",fontSize:"clamp(15px,3.8vw,19px)",fontWeight:700,lineHeight:1.4,textShadow:"0 2px 3px #000",animation:"loot-reveal .25s ease-out"}}>
 <strong style={{display:"block",color:"#ffdb96"}}>BUTIN OBTENU</strong>{lootAnnouncement(event)}
 </div>)}
 <style>{`@keyframes loot-reveal{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}@media (prefers-reduced-motion:reduce){aside[aria-label="Butin obtenu"]>div{animation:none!important}}`}</style>
 </aside>;
}

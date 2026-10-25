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
 return <aside aria-label="Butin obtenu" aria-live="polite" style={{position:"fixed",right:12,top:"max(72px, env(safe-area-inset-top, 0px))",zIndex:1000,display:"grid",gap:6,maxWidth:"min(310px,80vw)",pointerEvents:"none"}}>
 {visible.slice(-3).map(event=><div key={event.id} style={{background:"rgba(16,18,25,.94)",border:"1px solid #927b51",borderLeft:`4px solid ${itemRarityColor(Object.values(ITEMS).find(item=>item.id===event.itemId)??ITEMS.ash)}`,padding:"10px 13px",boxShadow:"0 6px 22px #0008",borderRadius:6,color:"#f5e8d2",fontSize:13}}>
 <strong style={{display:"block",color:"#ffdb96"}}>BUTIN OBTENU</strong>{lootAnnouncement(event)}
 </div>)}
 </aside>;
}

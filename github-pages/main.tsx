import React,{Suspense,lazy} from "react";
import {createRoot} from "react-dom/client";
import '../app/expedition3d/expedition.css';
const Classic=lazy(()=>Promise.all([import('../app/page'),import('../app/globals.css')]).then(([m])=>m));
const Expedition=lazy(()=>import('../app/expedition3d/Expedition'));
const classic=new URLSearchParams(location.search).get('expedition')!=='1';
createRoot(document.getElementById('root')!).render(<Suspense fallback={<div style={{background:'#142722',color:'#e0d6b6',height:'100vh',display:'grid',placeItems:'center',fontFamily:'Georgia'}}>Outbinched · Ouverture du passage…</div>}>{classic?<Classic/>:<Expedition/>}</Suspense>);

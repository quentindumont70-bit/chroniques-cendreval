/* Big Cthu: automatic cold-start updates; never interrupt a clinical session. */
(()=>{
 'use strict';
 if(!('serviceWorker' in navigator)||(location.protocol!=='https:'&&location.hostname!=='localhost'))return;
 const worker=navigator.serviceWorker;
 let currentController=worker.controller;
 const openedAt=Date.now();
 let interacted=false,autoAttempted=false;
 for(const type of ['pointerdown','touchstart','keydown','input','change','click'])document.addEventListener(type,()=>{interacted=true},{capture:true,passive:true});
 const canAutoRefresh=()=>!interacted&&!document.hidden&&Date.now()-openedAt<20000&&navigator.onLine!==false;
 const readyToRefresh=()=>canAutoRefresh()&&!document.body.classList.contains('tournee-locked')&&document.getElementById('tour-security-gate')?.hidden===true&&typeof window.tourneeSafeRefresh==='function';
 const showReady=()=>{
  const bar=document.getElementById('tour-save-summary');
  if(!bar||document.getElementById('tour-refresh-latest'))return;
  const button=document.createElement('button');
  button.type='button';
  button.id='tour-refresh-latest';
  button.textContent='↻ Nouvelle version';
  button.title='Actualiser Tournée pour utiliser la dernière version';
  button.onclick=async()=>{
   if(!window.confirm('Actualiser Tournée après la sauvegarde des modifications en cours ?'))return;
   if(typeof window.tourneeSafeRefresh!=='function'){
    button.textContent='Impossible de vérifier la sauvegarde : ferme et rouvre Tournée normalement.';
    button.disabled=true;
    return;
   }
   button.disabled=true;
   button.textContent='Enregistrement avant actualisation…';
   try{await window.tourneeSafeRefresh()}
   catch(_){button.disabled=false;button.textContent='↻ Réessayer après sauvegarde';}
  };
  bar.append(button);
 };
 const autoRefreshAtStartup=async()=>{
  if(autoAttempted||!canAutoRefresh()){showReady();return;}
  autoAttempted=true;
  // Allow the local vault to finish opening; an interaction cancels automation.
  for(let i=0;i<40&&canAutoRefresh()&&!readyToRefresh();i++)await new Promise(resolve=>setTimeout(resolve,100));
  if(!readyToRefresh()){showReady();return;}
  try{const refreshed=await window.tourneeSafeRefresh(readyToRefresh);if(refreshed===false)showReady();}
  catch(_){showReady();}
 };
 worker.addEventListener('controllerchange',()=>{
  const hadController=!!currentController;
  currentController=worker.controller;
  if(hadController&&currentController)autoRefreshAtStartup();
 });
 worker.register('./sw.js',{updateViaCache:'none'}).then(reg=>{
  const update=()=>{if(navigator.onLine!==false)reg.update().catch(()=>{});};
  update();
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)update();});
  window.addEventListener('pageshow',update);
  window.addEventListener('online',update);
  if(reg.waiting&&currentController)showReady();
 }).catch(()=>{});
})();

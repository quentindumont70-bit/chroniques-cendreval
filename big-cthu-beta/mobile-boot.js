/* Big Cthu: public cache updates, without automatic reloading of unsaved clinical forms. */
(()=>{
 'use strict';
 if(!('serviceWorker' in navigator)||(location.protocol!=='https:'&&location.hostname!=='localhost'))return;
 const worker=navigator.serviceWorker;
 let currentController=worker.controller;
 const showReady=()=>{
  const bar=document.getElementById('tour-save-summary');
  if(!bar||document.getElementById('tour-refresh-latest'))return;
  const button=document.createElement('button');
  button.type='button';
  button.id='tour-refresh-latest';
  button.textContent='↻ Nouvelle version';
  button.title='Actualiser Tournée pour utiliser la dernière version';
  button.onclick=()=>{
   if(window.confirm('Actualiser Tournée maintenant ? Vérifie que tes post-it et autres modifications sont bien enregistrés.'))location.reload();
  };
  bar.append(button);
 };
 worker.addEventListener('controllerchange',()=>{
  if(currentController)showReady();
  currentController=worker.controller;
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

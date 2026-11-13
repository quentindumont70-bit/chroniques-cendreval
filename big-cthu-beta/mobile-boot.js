/* Big Cthu: enregistrement facultatif du cache public pour accès hors ligne, sans compte ni service IA. */
(()=>{
 'use strict';
 if(!('serviceWorker' in navigator)||(location.protocol!=='https:'&&location.hostname!=='localhost'))return;
 const worker=navigator.serviceWorker;
 worker.register('./sw.js').then(reg=>{
  if(navigator.onLine!==false)reg.update().catch(()=>{});
  document.addEventListener('visibilitychange',()=>{
    if(!document.hidden&&navigator.onLine!==false)reg.update().catch(()=>{});
  });
 }).catch(()=>{});
})();

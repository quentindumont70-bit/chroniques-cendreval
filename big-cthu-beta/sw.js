/* Cache only this public prototype shell. Never cache clinical/UGAP/private data. */
const CACHE='big-cthu-public-v2-v153';
// Only the three public, cinematic background photographs can be stored after a successful first view.
// Cross-origin images are cached separately from the app shell; no user information enters this cache.
const PUBLIC_SCENERY_CACHE='big-cthu-public-scenery-v1';
const PUBLIC_ALPINE_PHOTO='/photo-1649401691853-6ecfa00f044e';
const PUBLIC_SCENERY_PHOTOS=new Set([PUBLIC_ALPINE_PHOTO,'/photo-1523486230352-65ff5222cea4','/photo-1648565726114-cfb73eb46340']);
const ASSETS=['./','./index.html','./cockpit-themes.css','./cockpit-themes.js','./maison-pulse.js','./nutrition.html','./nutrition-hub.js','./musique.html','./musique-studio.js','./active-pulse.js','./next-session.js','./cockpit-neuf.html','./premium-cinema.html','./organic-cinema.html','./medical-ops-cinema.html','./tournee-complete.html','./tournee.html','./absences-demo.html','./absences-demo-core.js','./installation-iphone.html','./mobile-boot.js','./maison.html','./equipements.html','./migration-maison.html','./discobinch.html','./entretiens.html','./depenses-maison.html','./registre-maison.html','./force.html','./recettes.html','./escalade.html','./programmes.html','./repas.html','./contrats.html','./consommations.html','./rpg.html','./ugap-demo.html','./agenda.html','./capture.html','./passions.html','./cerveau.html','./garde-manger.html','./budget.html','./voyages.html','./voyages-core.js','./cantine.html','./cantine-core.js','./etudes.html','./apprentissage.html','./apprentissage-data.js','./parcours-scolaires.html','./code-permis.html','./annales.html','./examens.html','./flashcards.html','./fiches-imprimables.html','./etudiant.html','./outils.html','./outils-mesure.html','./outils-atelier.html','./outils-tempo.html','./outils-favoris.html','./outils-chantier.html','./outils-scientifique.html','./outils-photo.html','./outils-intervalles.html','./sauvegardes.html','./manifest.webmanifest','./icon.svg','./apple-touch-icon.png'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('big-cthu-public-v2-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',event=>{
 const r=event.request;
 if(r.method!=='GET')return;
 const url=new URL(r.url);
 // Safari asks for CSS background images as cross-origin no-cors subresources.
 // Cache these three public photographs only; after the first online view they remain
 // available offline, but never let its CDN failure block installation of the app.
 if(url.hostname==='images.unsplash.com'&&PUBLIC_SCENERY_PHOTOS.has(url.pathname)&&r.destination==='image'){
  event.respondWith((async()=>{
   let gallery=null;
   try{
    gallery=await caches.open(PUBLIC_SCENERY_CACHE);
    const hit=await gallery.match(r);
    if(hit)return hit;
   }catch(e){/* Safari private mode or quota errors must not hide an online photo */}
   const response=await fetch(r);
   if(gallery&&(response.ok||response.type==='opaque')){
    try{await gallery.put(r,response.clone())}catch(e){/* storage quota: online photo still displays */}
   }
   return response;
  })());
  return;
 }
 if(url.origin!==self.location.origin)return;
 const asset=ASSETS.find(a=>new URL(a,self.registration.scope).pathname===url.pathname);
 if(r.mode==='navigate'){
  const offlineCopy=async()=>{
   const cached=await caches.match(r,{ignoreSearch:true});
   if(cached)return cached;
   if(asset)return (await caches.match(asset)) || (await caches.match('./index.html'));
   return caches.match('./index.html');
  };
  event.respondWith(fetch(r).then(async response=>{
   if(response.status>=500)return (await offlineCopy())||response;
   return response;
  }).catch(offlineCopy));
  return;
 }
 if(asset)event.respondWith(caches.match(r,{ignoreSearch:true}).then(hit=>hit||fetch(r)));
});

/* Cache only this public prototype shell. Never cache clinical/UGAP/private data. */
const CACHE='big-cthu-public-v2-v95';
const ASSETS=['./','./index.html','./cockpit-neuf.html','./tournee-complete.html','./tournee.html','./absences-demo.html','./absences-demo-core.js','./installation-iphone.html','./mobile-boot.js','./maison.html','./equipements.html','./migration-maison.html','./discobinch.html','./entretiens.html','./depenses-maison.html','./registre-maison.html','./force.html','./recettes.html','./escalade.html','./programmes.html','./repas.html','./contrats.html','./consommations.html','./rpg.html','./ugap-demo.html','./agenda.html','./capture.html','./passions.html','./cerveau.html','./garde-manger.html','./budget.html','./voyages.html','./voyages-core.js','./cantine.html','./cantine-core.js','./etudes.html','./apprentissage.html','./apprentissage-data.js','./parcours-scolaires.html','./code-permis.html','./annales.html','./examens.html','./flashcards.html','./fiches-imprimables.html','./etudiant.html','./outils.html','./outils-mesure.html','./outils-atelier.html','./outils-tempo.html','./outils-favoris.html','./outils-chantier.html','./outils-scientifique.html','./outils-photo.html','./outils-intervalles.html','./sauvegardes.html','./manifest.webmanifest','./icon.svg','./apple-touch-icon.png'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('big-cthu-public-v2-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',event=>{
 const r=event.request;
 if(r.method!=='GET')return;
 const url=new URL(r.url);
 if(url.origin!==self.location.origin)return;
 const asset=ASSETS.find(a=>new URL(a,self.registration.scope).pathname===url.pathname);
 if(r.mode==='navigate'){
  event.respondWith(fetch(r).catch(async()=>{
   const cached=await caches.match(r,{ignoreSearch:true});
   if(cached)return cached;
   if(asset)return (await caches.match(asset)) || (await caches.match('./index.html'));
   return caches.match('./index.html');
  }));
  return;
 }
 if(asset)event.respondWith(caches.match(r,{ignoreSearch:true}).then(hit=>hit||fetch(r)));
});

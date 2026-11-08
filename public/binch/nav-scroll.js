/* La Binch — navigation compacte uniquement après le défilement de l'en-tête.
   Un seul IntersectionObserver, aucune boucle scroll/RAF. */
(()=>{'use strict';
function mount(){
 const app=document.getElementById('app');
 const nav=app?.querySelector('nav.nav');
 if(!app||!nav||document.getElementById('binch-nav-sticky-sentinel'))return;
 const sentinel=document.createElement('span');
 sentinel.id='binch-nav-sticky-sentinel';
 sentinel.setAttribute('aria-hidden','true');
 sentinel.style.cssText='display:block;height:1px;pointer-events:none;';
 nav.before(sentinel);
 if('IntersectionObserver' in window){
  const observer=new IntersectionObserver(entries=>{
   const compact=!entries[0].isIntersecting;
   if(nav.classList.contains('binch-nav-condensed')===compact)return;
   nav.classList.toggle('binch-nav-condensed',compact);
   nav.dataset.scrollMode=compact?'compact':'full';
  },{threshold:0,rootMargin:'-2px 0px 0px 0px'});
  observer.observe(sentinel);
 }
 nav.addEventListener('click',e=>{
  const button=e.target.closest('button[data-page]');
  if(!button||!nav.contains(button))return;
  if(nav.classList.contains('binch-nav-condensed')){
   button.scrollIntoView({block:'nearest',inline:'nearest',behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
  }
 });
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
})();
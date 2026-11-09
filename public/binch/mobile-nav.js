/* La Binch — navigation mobile légère, sans remplacer la navigation principale. */
(()=>{'use strict';
const $=s=>document.querySelector(s);
const ITEMS=[['hub','Carnet','⌂'],['progression','Carte','◈'],['bibliotheque','Biblio','▤'],['gm','Guilde','♜']];
function init(){
 const app=$('#app'),original=$('#app nav.nav');if(!app||!original||$('#binch-mobile-navigation'))return;
 const nav=document.createElement('nav');nav.id='binch-mobile-navigation';
 nav.setAttribute('aria-label','Navigation rapide sur mobile');
 nav.innerHTML=ITEMS.map(([id,label,icon])=>'<button type="button" data-mobile-page="'+id+'" aria-label="'+label+'"><span aria-hidden="true">'+icon+'</span><small>'+label+'</small></button>').join('')+
 '<button type="button" id="binch-mobile-more" aria-expanded="false" aria-label="Afficher la navigation complète"><span aria-hidden="true">☷</span><small>Plus</small></button>';
 app.append(nav);
 app.classList.add('binch-mobile-nav-ready');
 let expanded=false;
 function active(){
  const visible=!app.classList.contains('hidden');
  nav.hidden=!visible;
  document.body.classList.toggle('binch-mobile-active',visible&&window.matchMedia('(max-width:750px)').matches);
  if(!visible)return;
  const selected=$('#app nav.nav button.active[data-page]')?.dataset.page||'hub';
  nav.querySelectorAll('[data-mobile-page]').forEach(b=>{
   const on=b.dataset.mobilePage===selected;
   b.classList.toggle('active',on);
   if(on)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');
  });
 }
 function setExpanded(open){
  expanded=Boolean(open);
  original.classList.toggle('binch-mobile-nav-expanded',expanded);
  const btn=$('#binch-mobile-more');if(btn)btn.setAttribute('aria-expanded',String(expanded));
 }
 nav.addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b)return;
  if(b.id==='binch-mobile-more'){
   setExpanded(!expanded);
   if(expanded)original.scrollIntoView({behavior:'smooth',block:'start'});
   return;
  }
  const slug=b.dataset.mobilePage;
  if(!slug)return;
  const target=original.querySelector('[data-page="'+slug+'"]');
  if(target)target.click();
  else{
   const page=$('#page-'+slug);
   if(page){
    app.querySelectorAll('main .page').forEach(x=>x.classList.toggle('active',x===page));
    original.querySelectorAll('button').forEach(x=>x.classList.toggle('active',x.dataset.page===slug));
   }
  }
  setExpanded(false);
  window.scrollTo({top:0,behavior:'smooth'});
  active();
 });
 original.addEventListener('click',()=>{setExpanded(false);requestAnimationFrame(active)});
 const observer=new MutationObserver(active);
 observer.observe(original,{subtree:true,attributes:true,attributeFilter:['class','data-page'],childList:true});
 const appObserver=new MutationObserver(active);
 appObserver.observe(app,{attributes:true,attributeFilter:['class']});
 document.addEventListener('grimoire:sync',active);
 window.addEventListener('resize',()=>{if(window.innerWidth>750)setExpanded(false);active()});
 active();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
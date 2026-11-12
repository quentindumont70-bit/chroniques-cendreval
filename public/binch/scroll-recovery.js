/* La Binch — vertical scroll recovery, nonintrusive.
   Never clear locks while an accessible dialog is open. */
(()=>{'use strict';
const $=s=>document.querySelector(s);
let button;
const modal=()=>Boolean(document.querySelector('dialog[open],[aria-modal="true"]:not([hidden])'));
const native=()=>document.documentElement.dataset.binchScroll==='native';
function unlock(){
 if(modal()||native())return false;
 let changed=false;
 for(const el of [document.documentElement,document.body]){
  if(!el)continue;
  const css=getComputedStyle(el);
  if(['hidden','clip'].includes(css.overflowY)&&el.scrollHeight>innerHeight+80){
   el.style.setProperty('overflow-y','auto','important');changed=true;
  }
 }
 return changed;
}
function down(){
 if(modal()||native())return;
 unlock();
 const sc=document.scrollingElement||document.documentElement,old=window.scrollY||sc.scrollTop;
 window.scrollBy({top:Math.max(310,Math.round(innerHeight*.7)),behavior:'smooth'});
 setTimeout(()=>{
  if((window.scrollY||sc.scrollTop)>old+8)return;
  const active=$('#app main .page.active');
  const nodes=[active,active?.parentElement,$('#app main')].filter(Boolean);
  for(const node of nodes){
   if(node.scrollHeight>node.clientHeight+100&&getComputedStyle(node).overflowY!=='visible'){
    node.scrollTop+=Math.max(310,innerHeight*.7);break;
   }
  }
 },400);
}
function paint(){
 if(!button)return;
 const app=$('#app'),sc=document.scrollingElement||document.documentElement;
 const active=app&&!app.classList.contains('hidden');
 const tall=Math.max(sc.scrollHeight,document.body?.scrollHeight||0)>innerHeight+190;
 const bottom=(window.scrollY||sc.scrollTop)+innerHeight>=sc.scrollHeight-100;
 button.hidden=!active||!tall||bottom||modal()||native();
}
function init(){
 if($('#binch-scroll-recovery'))return;
 button=document.createElement('button');button.id='binch-scroll-recovery';button.type='button';
 button.textContent='Descendre ↓';button.setAttribute('aria-label','Faire défiler vers le bas');
 button.title='Défilement de secours';document.body.append(button);
 button.addEventListener('click',down);
 let scheduled=false;
 function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;paint()})}
 window.addEventListener('scroll',schedule,{passive:true});window.addEventListener('resize',schedule,{passive:true});
 const nav=document.querySelector('#app nav.nav');
 nav?.addEventListener('click',()=>setTimeout(()=>{unlock();paint()},0));
 // On narrow screens the horizontal sticky navigation can swallow vertical gestures.
 // Route *only* vertical intent to the page, leaving horizontal tab swipes untouched.
 let gesture=null;
 nav?.addEventListener('touchstart',e=>{if(e.touches.length!==1){gesture=null;return}
  gesture={x:e.touches[0].clientX,y:e.touches[0].clientY,axis:''};
 },{passive:true});
 nav?.addEventListener('touchmove',e=>{
  if(!gesture||e.touches.length!==1||modal()||native())return;
  const touch=e.touches[0],dx=touch.clientX-gesture.x,dy=touch.clientY-gesture.y;
  if(!gesture.axis&&Math.max(Math.abs(dx),Math.abs(dy))>9)gesture.axis=Math.abs(dy)>Math.abs(dx)*1.35?'vertical':'horizontal';
  if(gesture.axis==='vertical'&&Math.abs(dy)>0){
   e.preventDefault();unlock();window.scrollBy({top:-dy,behavior:'instant'});gesture.y=touch.clientY;gesture.x=touch.clientX;
  }
 },{passive:false});
 nav?.addEventListener('touchend',()=>{gesture=null},{passive:true});
 nav?.addEventListener('touchcancel',()=>{gesture=null},{passive:true});
 nav?.addEventListener('wheel',e=>{
  if(modal()||native()||Math.abs(e.deltaX)>=Math.abs(e.deltaY)||!e.deltaY)return;
  e.preventDefault();unlock();window.scrollBy({top:e.deltaY,behavior:'instant'});
 },{passive:false});
 document.addEventListener('binch:display-preferences',()=>{unlock();paint()});
 document.addEventListener('keydown',e=>{if(e.key!=='PageDown'||modal()||native()||['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName))return;
  const start=window.scrollY;setTimeout(()=>{if(window.scrollY===start)unlock()},100);
 });
 unlock();paint();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
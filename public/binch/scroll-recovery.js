/* La Binch — vertical scroll recovery, nonintrusive.
   Never clear locks while an accessible dialog is open. */
(()=>{'use strict';
const $=s=>document.querySelector(s);
let button;
const modal=()=>Boolean(document.querySelector('dialog[open],[aria-modal="true"]:not([hidden])'));
function unlock(){
 if(modal())return false;
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
 if(modal())return;
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
 button.hidden=!active||!tall||bottom||modal();
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
 document.querySelector('#app nav.nav')?.addEventListener('click',()=>setTimeout(()=>{unlock();paint()},0));
 document.addEventListener('keydown',e=>{if(e.key!=='PageDown'||modal()||['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName))return;
  const start=window.scrollY;setTimeout(()=>{if(window.scrollY===start)unlock()},100);
 });
 unlock();paint();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
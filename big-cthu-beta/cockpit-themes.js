/* Big Cthu V113 — appearance only. No patient, task or other data is moved. */
(function(){
'use strict';
const KEY='big-cthu-cockpit-theme-v1';
const themes={premium:'Command Center Premium',organic:'Dark Organic Luxury',medical:'Futurist Medical Ops'};
const root=document.documentElement;
function valid(name){return Object.prototype.hasOwnProperty.call(themes,name)}
function stored(){
 try{const name=localStorage.getItem(KEY);return valid(name)?name:'organic'}
 catch(e){return 'organic'}
}
function apply(name,persist){
 if(!valid(name))return false;
 root.dataset.cthuTheme=name;
 if(persist){
  try{localStorage.setItem(KEY,name)}
  catch(e){
   const status=document.getElementById('cthuThemeStatus');
   if(status)status.textContent='Thème changé pour cette session ; stockage indisponible.';
  }
 }
 const label=document.getElementById('cthuThemeCurrent');
 if(label)label.textContent=themes[name];
 document.querySelectorAll('[data-cthu-choice]').forEach(button=>{
  const selected=button.dataset.cthuChoice===name;
  button.setAttribute('aria-pressed',selected?'true':'false');
 });
 return true;
}
function setup(){
 let toggle=document.getElementById('cthuThemeToggle');
 let menu=document.getElementById('cthuThemeMenu');
 // En dehors du cockpit, monter un sélecteur local seulement dans les pages explicitement opt-in.
 if((!toggle||!menu)&&document.body&&document.body.dataset.cthuThemeTentacle==='yes'){
  const host=document.querySelector('header')||document.querySelector('main');
  if(host){
   const holder=document.createElement('div');
   holder.className='cthu-theme-wrap cthu-theme-mini';
   holder.innerHTML='<button class="pill" id="cthuThemeToggle" type="button" aria-haspopup="true" aria-expanded="false" aria-controls="cthuThemeMenu">🎨 Apparence</button>'+
    '<div id="cthuThemeMenu" role="group" aria-label="Choix du thème Big Cthu" hidden>'+
    '<div class="cthu-theme-title">Un thème pour toutes les tentacules</div>'+
    '<button type="button" class="cthu-theme-choice" data-cthu-choice="premium" data-theme="premium" aria-pressed="false"><span class="cthu-theme-swatch" aria-hidden="true"></span><span><strong>Command Center Premium</strong><small>Bleu nuit · élégance</small></span></button>'+
    '<button type="button" class="cthu-theme-choice" data-cthu-choice="organic" data-theme="organic" aria-pressed="false"><span class="cthu-theme-swatch" aria-hidden="true"></span><span><strong>Dark Organic Luxury</strong><small>Violet · cuivre</small></span></button>'+
    '<button type="button" class="cthu-theme-choice" data-cthu-choice="medical" data-theme="medical" aria-pressed="false"><span class="cthu-theme-swatch" aria-hidden="true"></span><span><strong>Futurist Medical Ops</strong><small>Cyan · précision</small></span></button>'+
    '<span id="cthuThemeStatus" role="status">Préférence locale à cet appareil.</span></div>';
   if(host.tagName==='MAIN')host.prepend(holder);
   else host.append(holder);
   toggle=document.getElementById('cthuThemeToggle');
   menu=document.getElementById('cthuThemeMenu');
  }
 }
 if(!toggle||!menu)return;
 apply(stored(),false);
 // V119 : garantir la visibilité complète du menu sur les iPhone étroits.
 const placeMenu=()=>{
  if(typeof window==='undefined'||!toggle.getBoundingClientRect||!menu.style)return;
  const viewport=window.visualViewport?.width||window.innerWidth;
  if(!Number.isFinite(viewport)||viewport<=0)return;
  if(viewport>750){menu.style.left='';menu.style.right='';menu.style.width='';return}
  const rect=toggle.getBoundingClientRect();
  const margin=12;
  const width=Math.min(340,Math.max(160,viewport-margin*2));
  const left=Math.max(margin,Math.min(rect.right-width,viewport-width-margin));
  menu.style.width=width+'px';
  menu.style.left=(left-rect.left)+'px';
  menu.style.right='auto';
 };
 const close=()=>{
  menu.hidden=true;
  toggle.setAttribute('aria-expanded','false');
 };
 toggle.addEventListener('click',()=>{
  const open=menu.hidden;
  if(open)placeMenu();
  menu.hidden=!open;
  toggle.setAttribute('aria-expanded',open?'true':'false');
 });
 if(typeof window!=='undefined'&&window.addEventListener){
  window.addEventListener('resize',()=>{if(!menu.hidden)placeMenu()});
 }
 menu.querySelectorAll('[data-cthu-choice]').forEach(button=>{
  button.addEventListener('click',()=>{
   apply(button.dataset.cthuChoice,true);
   close();
   toggle.focus();
  });
 });
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!menu.hidden){close();toggle.focus()}});
 document.addEventListener('click',e=>{
  if(!menu.hidden&&!menu.contains(e.target)&&!toggle.contains(e.target))close();
 });
}
// Exécuté dans <head> avant le premier rendu, sans imposer de requête réseau.
apply(stored(),false);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup,{once:true});
else setup();
})();

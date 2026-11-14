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
 const toggle=document.getElementById('cthuThemeToggle');
 const menu=document.getElementById('cthuThemeMenu');
 if(!toggle||!menu)return;
 apply(stored(),false);
 const close=()=>{
  menu.hidden=true;
  toggle.setAttribute('aria-expanded','false');
 };
 toggle.addEventListener('click',()=>{
  const open=menu.hidden;
  menu.hidden=!open;
  toggle.setAttribute('aria-expanded',open?'true':'false');
 });
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
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup,{once:true});
else setup();
})();

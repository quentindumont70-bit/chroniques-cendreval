/* Renaissance choice accessibility. Existing onboarding remains source of truth. */
(()=>{'use strict';
const GROUPS=[['race-choices','Choisir un peuple'],['class-choices','Choisir une classe'],['job-choices','Choisir jusqu’à deux métiers']];
function decorate(group){
 const buttons=[...group.querySelectorAll('button.choice')];
 for(const button of buttons){
  button.type='button';
  button.setAttribute('aria-pressed',String(button.classList.contains('selected')));
  if(button.classList.contains('selected'))button.setAttribute('data-renaissance-selected','');
  else button.removeAttribute('data-renaissance-selected');
 }
}
function mount(){
 if(!document.getElementById('onboarding'))return false;
 for(const [id,label] of GROUPS){
  const group=document.getElementById(id);
  if(!group)continue;
  group.setAttribute('role','group');group.setAttribute('aria-label',label);
  decorate(group);
  if(group.dataset.renaissanceA11y==='ready')continue;
  group.dataset.renaissanceA11y='ready';
  group.addEventListener('keydown',e=>{
   if(!['ArrowRight','ArrowLeft','Home','End'].includes(e.key))return;
   const buttons=[...group.querySelectorAll('button.choice:not([disabled])')];
   const index=buttons.indexOf(document.activeElement);
   if(index<0||!buttons.length)return;
   const next=e.key==='Home'?0:e.key==='End'?buttons.length-1:
    (index+(e.key==='ArrowRight'?1:-1)+buttons.length)%buttons.length;
   buttons[next].focus();e.preventDefault();
  });
  if(typeof MutationObserver==='function'){
   const observer=new MutationObserver(()=>decorate(group));
   observer.observe(group,{childList:true});
  }
 }
 return true;
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);
else mount();
})();
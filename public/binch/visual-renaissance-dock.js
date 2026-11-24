/* Renaissance mobile expedition dock — mirrors existing tab buttons only.
   No new routes, no gameplay writes and no hiding the original navigation. */
(()=>{'use strict';
const ITEMS=[
 ['hub','Quartier','⌂'],
 ['progression','Carte','◇'],
 ['specs','Talents','✧'],
 ['gm','Guilde','⚑']
];
const $=id=>document.getElementById(id);
function nav(){return document.querySelector('#app nav.nav')}
function source(id){
 const n=nav();return n?[...n.querySelectorAll('button[data-page]')].find(b=>b.dataset.page===id&&!b.disabled):null;
}
function create(){
 if($('binch-renaissance-dock'))return $('binch-renaissance-dock');
 if(!$('app')||!nav())return null;
 const root=document.createElement('nav');
 root.id='binch-renaissance-dock';root.className='binch-renaissance-dock';
 root.setAttribute('aria-label','Navigation rapide de l’aventurier');
 for(const [id,name,glyph] of ITEMS){
  const button=document.createElement('button');
  button.type='button';button.className='binch-renaissance-dock-action';button.dataset.to=id;
  button.setAttribute('aria-label','Aller à '+name);button.setAttribute('aria-current','false');
  const icon=document.createElement('span'),label=document.createElement('small');
  icon.className='binch-dock-glyph';icon.setAttribute('aria-hidden','true');icon.textContent=glyph;
  label.textContent=name;button.append(icon,label);
  button.addEventListener('click',()=>{const tab=source(id);if(tab)tab.click()});
  root.append(button);
 }
 $('app').append(root);return root;
}
function refresh(){
 const dock=create();if(!dock)return false;
 for(const button of dock.querySelectorAll('button[data-to]')){
  const tab=source(button.dataset.to),available=Boolean(tab);
  button.disabled=!available;
  button.hidden=!available;
  button.setAttribute('aria-current',available&&tab.classList.contains('active')?'page':'false');
  button.title=available?'Ouvrir '+tab.textContent.trim():'Module indisponible';
 }
 dock.hidden=![...dock.querySelectorAll('button[data-to]')].some(b=>!b.hidden);
 return !dock.hidden;
}
function start(){
 if(!nav())return;
 refresh();
 const n=nav();
 if(typeof MutationObserver!=='function')return;
 let pending=false;
 const observer=new MutationObserver(()=>{
  if(pending)return;pending=true;
  // Coalesce observed class changes. Never mutate the source tabs.
  Promise.resolve().then(()=>{pending=false;refresh()});
 });
 observer.observe(n,{childList:true,subtree:true,attributes:true,attributeFilter:['class','disabled']});
}
document.addEventListener('binch:adventure-ready',refresh);
document.addEventListener('binch:profile-change',refresh);
document.addEventListener('grimoire:sync',refresh);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();

/* La Binch — Renaissance: decorative UI, manual ambience and actual module navigation. */
(()=>{'use strict';
const KEY='binch.visual.ambience.v1';
const AMBIENCES=[['dusk','Crépuscule','☀'],['moon','Nuit lunaire','☾'],['embers','Braises','✷']];
const PORTALS=[['progression','Carte d’expédition','Ton prochain horizon','✥'],['specs','Grimoire des talents','Maîtriser ta classe','✧'],['metiers','Atelier des métiers','Recettes et ressources','⚒'],['gm','Salle du conseil','Préparer la guilde','⚑'],['command','Oracle Faith','Ton prochain conseil','✺'],['tresors','Reliquaire','Tes trouvailles','✦']];
const $=id=>document.getElementById(id);
function readAmbience(){try{const v=localStorage.getItem(KEY);return AMBIENCES.some(x=>x[0]===v)?v:'dusk'}catch{return 'dusk'}}
let ambience=readAmbience();
function applyAmbience(){
 document.documentElement.dataset.binchAmbience=ambience;
 document.querySelectorAll('#binch-renaissance-ambiences button[data-ambience]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.ambience===ambience)));
}
function selectAmbience(next){
 if(!AMBIENCES.some(x=>x[0]===next))return false;
 ambience=next;try{localStorage.setItem(KEY,ambience)}catch{}applyAmbience();return true;
}
function navigation(id){
 const nav=document.querySelector('#app nav.nav');
 return nav?[...nav.querySelectorAll('button[data-page]')].find(b=>b.dataset.page===id):null;
}
function navigate(id){
 const tab=navigation(id);if(!tab)return false;
 tab.click();window.scrollTo?.({top:0,behavior:'auto'});if(id==='command')$('binch-faith-advisor')?.scrollIntoView?.({block:'start',behavior:'smooth'});return true;
}
function ambienceSelector(){
 const host=document.createElement('div');host.id='binch-renaissance-ambiences';host.className='binch-renaissance-ambiences';host.setAttribute('role','group');host.setAttribute('aria-label','Ambiance du décor');
 const title=document.createElement('span');title.textContent='Ambiance';host.append(title);
 for(const [id,label,glyph] of AMBIENCES){
  const button=document.createElement('button');button.type='button';button.dataset.ambience=id;button.title=label;button.setAttribute('aria-label','Ambiance : '+label);button.textContent=glyph;
  button.addEventListener('click',()=>selectAmbience(id));host.append(button);
 }
 return host;
}
function portals(){
 const host=document.createElement('nav');host.id='binch-renaissance-portals';host.className='binch-renaissance-portals';host.setAttribute('aria-label','Portes du quartier général');
 for(const [id,title,subtitle,glyph] of PORTALS){
  const button=document.createElement('button');button.type='button';button.className='binch-renaissance-portal';button.dataset.to=id;
  const icon=document.createElement('span');icon.className='binch-portal-icon';icon.setAttribute('aria-hidden','true');icon.textContent=glyph;
  const words=document.createElement('span'),heading=document.createElement('strong'),desc=document.createElement('small');heading.textContent=title;desc.textContent=subtitle;
  words.append(heading,desc);button.append(icon,words);
  button.addEventListener('click',()=>navigate(id));host.append(button);
 }
 return host;
}
function refreshPortals(){
 document.querySelectorAll('#binch-renaissance-portals .binch-renaissance-portal').forEach(b=>{
  const available=Boolean(navigation(b.dataset.to));b.disabled=!available;b.title=available?'Ouvrir '+b.querySelector('strong').textContent:'Module indisponible dans cette version';
 });
}
function mount(){
 const home=$('binch-adventure-home'),hero=home?.querySelector('.binch-character-card');
 if(!hero)return false;if($('binch-renaissance-ambiences'))return true;
 const stage=document.createElement('div');stage.className='binch-renaissance-stage';stage.setAttribute('aria-hidden','true');hero.prepend(stage);
 const copy=hero.querySelector('.binch-kicker')?.parentElement;
 if(copy){const chapter=document.createElement('span');chapter.className='binch-renaissance-chapter';chapter.textContent='AZEROTH · TON HISTOIRE';copy.prepend(chapter)}
 hero.append(ambienceSelector());hero.after(portals());refreshPortals();applyAmbience();return true;
}
function start(){
 applyAmbience();if(mount())return;
 const app=$('app');if(!app)return;
 const observer=new MutationObserver(()=>{if(mount())observer.disconnect()});
 observer.observe(app,{childList:true,subtree:true});setTimeout(()=>observer.disconnect(),12000);
}
document.addEventListener('binch:adventure-ready',mount);
document.addEventListener('DOMContentLoaded',refreshPortals); // other deferred modules may create tabs later
document.addEventListener('binch:adventure-ready',()=>{
 const nav=document.querySelector('#app nav.nav');
 if(nav&&typeof MutationObserver==='function'){
  const observer=new MutationObserver(refreshPortals);
  observer.observe(nav,{childList:true});
 }
});
document.addEventListener('binch:profile-change',applyAmbience);
document.addEventListener('grimoire:sync',applyAmbience);
window.addEventListener('storage',e=>{if(e.key===KEY){ambience=readAmbience();applyAmbience()}});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
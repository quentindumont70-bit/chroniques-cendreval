/* La Binch — Renaissance: decorative UI, manual ambience and actual module navigation. */
(()=>{'use strict';
const KEY='binch.visual.ambience.v1',DETAIL_KEY='binch.visual.detail.v1';
const AMBIENCES=[['dusk','Crépuscule','☀'],['moon','Nuit lunaire','☾'],['embers','Braises','✷']];
const PORTALS=[['progression','Carte d’expédition','Ton prochain horizon','✥'],['specs','Grimoire des talents','Maîtriser ta classe','✧'],['metiers','Atelier des métiers','Recettes et ressources','⚒'],['gm','Salle du conseil','Préparer la guilde','⚑'],['command','Oracle Faith','Ton prochain conseil','✺'],['tresors','Reliquaire','Tes trouvailles','✦']];
const $=id=>document.getElementById(id);
const FOCUS_KEY='binch.visual.route-focus.v1';
const VISIONS=[
 ['druid','Druide','Forêt des anciens'],['warrior','Guerrier','Bastion de fer'],
 ['mage','Mage','Observatoire arcanique'],['priest','Prêtre','Temple des aubes'],
 ['paladin','Paladin','Citadelle sacrée'],['rogue','Voleur','Toits de la nuit'],
 ['hunter','Chasseur','Poste des rangers'],['shaman','Chaman','Fort des éléments'],
 ['warlock','Démoniste','Portail des ombres']
];
function readRouteFocus(){try{return localStorage.getItem(FOCUS_KEY)==='todo'?'todo':'all'}catch{return 'all'}}
let routeFocus=readRouteFocus();
function applyRouteFocus(){
 document.documentElement.dataset.binchRouteFocus=routeFocus;
 const button=$('binch-renaissance-route-focus');
 if(button){button.setAttribute('aria-pressed',String(routeFocus==='todo'));button.textContent=routeFocus==='todo'?'Afficher les étapes terminées':'Masquer les étapes terminées'}
}
function toggleRouteFocus(){
 routeFocus=routeFocus==='todo'?'all':'todo';
 try{localStorage.setItem(FOCUS_KEY,routeFocus)}catch{}
 applyRouteFocus();return routeFocus;
}
function attachRouteFocus(){
 const tools=document.querySelector('#binch-adventure-home .binch-route-tools');
 if(!tools||$('binch-renaissance-route-focus'))return false;
 const button=document.createElement('button');button.id='binch-renaissance-route-focus';
 button.type='button';button.className='binch-renaissance-route-focus';
 button.setAttribute('aria-label','Afficher ou masquer les étapes déjà terminées');
 button.addEventListener('click',toggleRouteFocus);tools.append(button);
 applyRouteFocus();return true;
}
function showGallery(){
 let dialog=$('binch-renaissance-gallery');
 if(!dialog){
  dialog=document.createElement('dialog');dialog.id='binch-renaissance-gallery';
  dialog.className='binch-renaissance-gallery';dialog.setAttribute('aria-labelledby','binch-gallery-heading');
  const header=document.createElement('header'),heading=document.createElement('h2'),close=document.createElement('button');
  heading.id='binch-gallery-heading';heading.textContent='Les neuf visions';
  close.type='button';close.textContent='Fermer ✕';close.className='binch-gallery-close';
  close.addEventListener('click',()=>dialog.close?dialog.close():dialog.removeAttribute('open'));
  header.append(heading,close);
  const info=document.createElement('p');info.className='binch-gallery-disclaimer';
  info.textContent='Galerie artistique originale : ces panoramas ne sont pas des cartes de jeu et ne modifient pas ton personnage.';
  const scene=document.createElement('figure'),image=document.createElement('img'),caption=document.createElement('figcaption');
  scene.className='binch-gallery-scene';image.loading='lazy';image.alt='';
  scene.append(image,caption);
  const grid=document.createElement('div');grid.className='binch-gallery-grid';
  grid.setAttribute('aria-label','Choisir un paysage à contempler');
  function choose(id){
   const item=VISIONS.find(v=>v[0]===id);if(!item)return false;
   image.src='./renaissance-world-'+item[0]+'.svg';
   image.alt='Illustration originale : '+item[2];
   caption.textContent=item[1]+' · '+item[2];
   grid.querySelectorAll('button[data-vision]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.vision===id)));
   return true;
  }
  for(const item of VISIONS){
   const b=document.createElement('button');b.type='button';b.dataset.vision=item[0];b.className='binch-gallery-choice';
   b.setAttribute('aria-label','Contempler '+item[1]);b.setAttribute('aria-pressed','false');
   const icon=document.createElement('img');icon.loading='lazy';icon.src='./renaissance-sigil-'+item[0]+'.svg';icon.alt='';
   const text=document.createElement('span');text.textContent=item[1];
   b.append(icon,text);b.addEventListener('click',()=>choose(item[0]));grid.append(b);
  }
  grid.addEventListener('keydown',event=>{
   if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
   const options=[...grid.querySelectorAll('button[data-vision]')];
   if(!options.length)return;
   const current=options.indexOf(document.activeElement);
   const next=event.key==='Home'?0:event.key==='End'?options.length-1:
    (Math.max(0,current)+(event.key==='ArrowRight'?1:-1)+options.length)%options.length;
   options[next].focus();choose(options[next].dataset.vision);event.preventDefault();
  });
  dialog.append(header,info,scene,grid);
  dialog.addEventListener('click',e=>{if(e.target===dialog){dialog.close?dialog.close():dialog.removeAttribute('open')}});
  document.body.append(dialog);
  let id='druid';try{const profile=JSON.parse(localStorage.getItem('grimoire.hub.v3'))||{};
   const themes={'Druide':'druid','Guerrier':'warrior','Mage':'mage','Prêtre':'priest','Paladin':'paladin','Voleur':'rogue','Chasseur':'hunter','Chaman':'shaman','Démoniste':'warlock'};
   id=themes[profile.classe]||id;
  }catch{}
  choose(id);
 }
 if(!dialog.open){if(typeof dialog.showModal==='function')dialog.showModal();
 else dialog.setAttribute('open','');}
 return dialog;
}
function attachGalleryButton(hero){
 const copy=hero.querySelector('.binch-kicker')?.parentElement;
 if(!copy||$('binch-renaissance-visions'))return false;
 const button=document.createElement('button');button.type='button';button.id='binch-renaissance-visions';
 button.className='binch-renaissance-visions';button.textContent='Explorer les neuf visions ✦';
 button.setAttribute('aria-haspopup','dialog');
 button.addEventListener('click',showGallery);copy.append(button);return true;
}
function readAmbience(){try{const v=localStorage.getItem(KEY);return AMBIENCES.some(x=>x[0]===v)?v:'dusk'}catch{return 'dusk'}}
let ambience=readAmbience();
function readDetail(){try{return localStorage.getItem(DETAIL_KEY)==='lite'?'lite':'rich'}catch{return 'rich'}}
let detail=readDetail();
function applyDetail(){
 document.documentElement.dataset.binchDetail=detail;
 const button=document.querySelector('#binch-renaissance-ambiences button[data-binch-detail]');
 if(button){button.setAttribute('aria-pressed',String(detail==='lite'));button.title=detail==='lite'?'Désactiver le mode léger':'Activer le mode léger'}
}
function toggleDetail(){detail=detail==='lite'?'rich':'lite';try{localStorage.setItem(DETAIL_KEY,detail)}catch{}applyDetail();return detail}

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
 tab.click();window.scrollTo?.({top:0,behavior:'auto'});if(id==='command'){const reduced=detail==='lite'||Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches);$('binch-faith-advisor')?.scrollIntoView?.({block:'start',behavior:reduced?'auto':'smooth'});}return true;
}
function ambienceSelector(){
 const host=document.createElement('div');host.id='binch-renaissance-ambiences';host.className='binch-renaissance-ambiences';host.setAttribute('role','group');host.setAttribute('aria-label','Ambiance du décor');
 const title=document.createElement('span');title.textContent='Ambiance';host.append(title);
 for(const [id,label,glyph] of AMBIENCES){
  const button=document.createElement('button');button.type='button';button.dataset.ambience=id;button.title=label;button.setAttribute('aria-label','Ambiance : '+label);button.textContent=glyph;
  button.addEventListener('click',()=>selectAmbience(id));host.append(button);
 }
 const lite=document.createElement('button');lite.type='button';lite.dataset.binchDetail='lite';lite.setAttribute('aria-label','Mode léger — économiser les effets graphiques');lite.textContent='▤';lite.addEventListener('click',toggleDetail);host.append(lite);
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
 attachGalleryButton(hero);hero.append(ambienceSelector());hero.after(portals());attachRouteFocus();refreshPortals();applyAmbience();applyDetail();applyRouteFocus();return true;
}
function start(){
 applyAmbience();applyDetail();applyRouteFocus();if(mount())return;
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
let routeToastTimer=null;
function clearRouteToast(){
 const toast=$('binch-renaissance-route-toast');
 if(routeToastTimer!==null){clearTimeout(routeToastTimer);routeToastTimer=null}
 if(toast)toast.remove();
}
function showRouteToast(event){
 if(!event?.detail?.done)return; // never celebrate an unchecking operation
 const id=String(event.detail.id||'');
 if(!id)return;
 const buttons=[...document.querySelectorAll('#binch-route-list [data-done]')];
 const target=buttons.find(b=>b.dataset.done===id);
 const name=target?.querySelector('strong')?.textContent?.trim().slice(0,110)||'Une étape';
 clearRouteToast();
 const toast=document.createElement('div');toast.id='binch-renaissance-route-toast';
 toast.className='binch-renaissance-route-toast';toast.setAttribute('role','status');
 toast.setAttribute('aria-live','polite');
 const rune=document.createElement('span');rune.className='binch-route-toast-rune';rune.setAttribute('aria-hidden','true');rune.textContent='✧';
 const message=document.createElement('span'),title=document.createElement('strong'),subtitle=document.createElement('small');
 title.textContent=name;subtitle.textContent='Noté comme terminé dans ton carnet local · non confirmé dans WoW';
 message.append(title,subtitle);
 const close=document.createElement('button');close.type='button';close.textContent='×';
 close.setAttribute('aria-label','Fermer la notification');close.addEventListener('click',clearRouteToast);
 toast.append(rune,message,close);document.body.append(toast);
 routeToastTimer=setTimeout(clearRouteToast,3300);
}
document.addEventListener('binch:route-complete',showRouteToast);
document.addEventListener('binch:profile-change',applyAmbience);
document.addEventListener('grimoire:sync',applyAmbience);
window.addEventListener('storage',e=>{if(e.key===KEY){ambience=readAmbience();applyAmbience()}if(e.key===DETAIL_KEY){detail=readDetail();applyDetail()}if(e.key===FOCUS_KEY){routeFocus=readRouteFocus();applyRouteFocus()}});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
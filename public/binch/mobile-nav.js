/* La Binch — barre mobile personnalisable, sans timers permanents. */
(()=>{'use strict';
const $=s=>document.querySelector(s),KEY='binch.mobile.shortcuts.v2';
const ITEMS=[['hub','Carnet','⌂'],['progression','Carte','◈'],['bibliotheque','Biblio','▤'],['gm','Guilde','♜'],['command','Cockpit','◉'],['lfg','LFG','⚔'],['equipment','Équipement','◇'],['market','Bourse','¤'],['coffre','Coffre','▣']];
const defaults=ITEMS.slice(0,4).map(x=>x[0]);
function load(){try{const v=JSON.parse(localStorage.getItem(KEY));return Array.isArray(v)&&v.length===4&&v.every(id=>ITEMS.some(x=>x[0]===id))&&new Set(v).size===4?v:defaults.slice()}catch{return defaults.slice()}}
function save(p){try{localStorage.setItem(KEY,JSON.stringify(p))}catch{}}
function init(){
 const app=$('#app'),original=$('#app nav.nav');if(!app||!original||$('#binch-mobile-navigation'))return;
 const nav=document.createElement('nav');nav.id='binch-mobile-navigation';
 nav.setAttribute('aria-label','Navigation rapide sur mobile');
 nav.innerHTML='<button type="button" id="binch-mobile-more" aria-expanded="false" aria-label="Afficher la navigation complète"><span aria-hidden="true">☷</span><small>Plus</small></button>';
 app.append(nav);app.classList.add('binch-mobile-nav-ready');
 const settings=document.createElement('section');settings.id='binch-mobile-shortcuts';settings.hidden=true;
 settings.innerHTML='<strong>Mes quatre raccourcis</strong><p>Choisis les accès rapides à conserver sur cet appareil.</p><div id="binch-mobile-shortcuts-fields"></div><button type="button" id="binch-mobile-shortcuts-close">Terminer</button>';
 app.append(settings);
 let expanded=false,picks=load(),pending=false;
 function selected(){return $('#app nav.nav button.active[data-page]')?.dataset.page||'hub'}
 function active(){
  const visible=!app.classList.contains('hidden');
  nav.hidden=!visible;settings.hidden=!visible||!expanded;
  document.body.classList.toggle('binch-mobile-active',visible&&matchMedia('(max-width:750px)').matches);
  if(!visible)return;
  const current=selected();
  nav.querySelectorAll('[data-mobile-page]').forEach(b=>{const yes=b.dataset.mobilePage===current;b.classList.toggle('active',yes);if(yes)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current')});
 }
 function choices(){return ITEMS.filter(([slug])=>!!original.querySelector('button[data-page="'+slug+'"]'))}
 function build(){
  nav.querySelectorAll('[data-mobile-page]').forEach(b=>b.remove());
  for(const id of picks){
   const [slug,label,icon]=ITEMS.find(x=>x[0]===id)||ITEMS[0];
   const b=document.createElement('button');b.type='button';b.dataset.mobilePage=slug;b.setAttribute('aria-label',label);
   const picture=document.createElement('span');picture.setAttribute('aria-hidden','true');picture.textContent=icon;
   const small=document.createElement('small');small.textContent=label;b.append(picture,small);
   nav.insertBefore(b,$('#binch-mobile-more'));
  }
  active();
 }
 function drawSettings(){
  const fields=$('#binch-mobile-shortcuts-fields');fields.replaceChildren();
  const available=choices();
  picks.forEach((id,i)=>{
   const label=document.createElement('label');label.textContent='Emplacement '+(i+1);
   const select=document.createElement('select');select.dataset.mobileSlot=String(i);
   for(const [slug,title] of available){const option=document.createElement('option');option.value=slug;option.textContent=title;select.append(option)}
   select.value=id;label.append(select);fields.append(label)
  });
 }
 function expand(open){
  expanded=Boolean(open);original.classList.toggle('binch-mobile-nav-expanded',expanded);
  $('#binch-mobile-more').setAttribute('aria-expanded',String(expanded));
  settings.hidden=!expanded;if(expanded)drawSettings();
 }
 nav.addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b)return;
  if(b.id==='binch-mobile-more'){expand(!expanded);if(expanded)original.scrollIntoView({behavior:'auto',block:'start'});return}
  const target=original.querySelector('button[data-page="'+b.dataset.mobilePage+'"]');if(target)target.click();
  expand(false);window.scrollTo({top:0,behavior:'auto'});active();
 });
 settings.addEventListener('change',e=>{
  const field=e.target.closest('[data-mobile-slot]');if(!field)return;
  const index=Number(field.dataset.mobileSlot),value=field.value;if(index<0||index>3||!choices().some(x=>x[0]===value))return;
  const other=picks.indexOf(value);if(other>=0&&other!==index)picks[other]=picks[index];
  picks[index]=value;save(picks);build();drawSettings()
 });
 $('#binch-mobile-shortcuts-close').onclick=()=>expand(false);
 original.addEventListener('click',()=>{expand(false);requestAnimationFrame(active)});
 function queue(){if(pending)return;pending=true;requestAnimationFrame(()=>{pending=false;active()})}
 const obs=new MutationObserver(queue);obs.observe(original,{subtree:true,attributes:true,attributeFilter:['class'],childList:true});
 const appObs=new MutationObserver(queue);appObs.observe(app,{attributes:true,attributeFilter:['class']});
 document.addEventListener('grimoire:sync',queue);
 window.addEventListener('resize',()=>{if(innerWidth>750)expand(false);queue()});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&expanded)expand(false)});
 build();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
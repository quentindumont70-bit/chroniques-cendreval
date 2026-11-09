/* La Binch — organise le carnet sans supprimer les outils ni leurs données. */
(()=>{'use strict';
const $=id=>document.getElementById(id);
const groups=[
 {id:'binch-session-planner',label:'Préparer une session',desc:'Itinéraire, priorités et durée de jeu',open:true},
 {id:'binch-personal-objectives',label:'Mes objectifs',desc:'Quêtes et jalons créés à la main'},
 {id:'binch-leveling-journal',label:'Journal de progression',desc:'Historique, niveaux et temps par zone'},
 {id:'binch-local-backup',label:'Sauvegardes locales',desc:'Exporter et restaurer les données du portail',existing:true}
];
const STORAGE='binch.dashboard.panels.v1';
function stored(){try{return JSON.parse(localStorage.getItem(STORAGE))||{}}catch{return {}}}
function init(){
 const hub=$('page-hub'),home=$('binch-adventure-home');
 if(!hub||!home||$('binch-adventure-tools'))return;
 const root=document.createElement('section');root.id='binch-adventure-tools';
 root.innerHTML='<div class="binch-adventure-tools-head"><div><span class="eyebrow">TABLEAU DE BORD / MON AVENTURE</span><h2>Mes outils de progression</h2><p>Choisis un atelier : les autres restent accessibles sans encombrer le Carnet de route.</p></div><button type="button" id="binch-tools-expand">Tout déplier</button></div>';
 home.insertAdjacentElement('afterend',root);
 const preference=stored();
 for(const spec of groups){
  const original=$(spec.id);if(!original)continue;
  if(spec.existing){
   const wrapper=document.createElement('div');wrapper.className='binch-tool-existing';wrapper.append(original);root.append(wrapper);
   continue;
  }
  const details=document.createElement('details');details.className='binch-tool-accordion';details.dataset.tool=spec.id;
  details.open=Object.prototype.hasOwnProperty.call(preference,spec.id)?Boolean(preference[spec.id]):Boolean(spec.open);
  const summary=document.createElement('summary');
  summary.innerHTML='<strong>'+spec.label+'</strong><small>'+spec.desc+'</small>';
  details.append(summary);details.append(original);root.append(details);
  details.addEventListener('toggle',()=>{
   const current=stored();current[spec.id]=details.open;
   try{localStorage.setItem(STORAGE,JSON.stringify(current))}catch{}
   controls();
  });
 }
 const expand=$('binch-tools-expand');
 function controls(){const all=[...root.querySelectorAll('details.binch-tool-accordion')];const every=all.length&&all.every(d=>d.open);expand.textContent=every?'Tout replier':'Tout déplier';expand.setAttribute('aria-expanded',String(Boolean(every)));}
 expand.onclick=()=>{const all=[...root.querySelectorAll('details.binch-tool-accordion')];const makeOpen=!all.every(d=>d.open);all.forEach(d=>d.open=makeOpen);controls()};
 controls();
 // External links can open the corresponding collapsed panel without altering its content.
 document.addEventListener('click',e=>{
  const link=e.target.closest&&e.target.closest('a[href^="#"]');if(!link)return;
  const id=link.getAttribute('href').slice(1);
  const target=$(id);if(!target)return;
  const wrapper=target.closest('details.binch-tool-accordion');if(wrapper&&!wrapper.open)wrapper.open=true;
 });
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
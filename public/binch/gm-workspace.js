/* La Binch — atelier GM compact, sans modification du registre des données. */
(()=>{'use strict';
const $=id=>document.getElementById(id);
const KEY='binch.gm.workspace.v1';
const groups=[
 {id:'binch-guild-weekly',name:'Vue hebdomadaire',description:'Alertes, sorties et besoins des sept prochains jours',open:true},
 {id:'binch-guild-calendar',name:'Calendrier & inscriptions',description:'Planifier et confirmer les effectifs par sortie'},
 {id:'binch-guild-roster',name:'Groupes & réserve',description:'Former les groupes, répartir les rôles et préparer Discord'},
 {id:'binch-dungeon-prep',name:'Préparation des donjons',description:'Checklists et briefing avant le départ'}
];
function preferences(){try{const v=JSON.parse(localStorage.getItem(KEY));return v&&typeof v==='object'&&!Array.isArray(v)?v:{}}catch{return {}}}
function init(){
 const page=$('page-gm'),banner=$('binch-gm-hub');
 if(!page||!banner||$('binch-gm-workspace'))return;
 const wrapper=document.createElement('section');wrapper.id='binch-gm-workspace';
 wrapper.innerHTML='<header class="binch-gm-workspace-head"><div><span class="eyebrow">ÉTAT-MAJOR / TES ATELIERS</span><h2>Organiser la guilde</h2><p>Les outils restent disponibles ici, sans occuper tout l’écran en permanence.</p></div><button type="button" id="binch-gm-expand">Tout déplier</button></header>';
 banner.insertAdjacentElement('afterend',wrapper);
 const saved=preferences();
 const entries=new Map();
 for(const group of groups){
  const target=$(group.id);
  if(!target)continue;
  const details=document.createElement('details');details.className='binch-gm-workspace-group';details.dataset.gmPanel=group.id;
  details.open=Object.prototype.hasOwnProperty.call(saved,group.id)?Boolean(saved[group.id]):Boolean(group.open);
  const summary=document.createElement('summary');
  const strong=document.createElement('strong');strong.textContent=group.name;
  const small=document.createElement('small');small.textContent=group.description;
  summary.append(strong,small);details.append(summary,target);wrapper.append(details);
  entries.set(group.id,details);
  details.addEventListener('toggle',()=>{
   const updated=preferences();updated[group.id]=details.open;
   try{localStorage.setItem(KEY,JSON.stringify(updated))}catch{}
   update();
  });
 }
 function update(){
  const all=[...entries.values()];
  const opened=all.length&&all.every(d=>d.open);
  const button=$('binch-gm-expand');
  if(button){button.textContent=opened?'Tout replier':'Tout déplier';button.setAttribute('aria-expanded',String(Boolean(opened)));}
 }
 $('binch-gm-expand').addEventListener('click',()=>{
  const all=[...entries.values()],next=!all.every(d=>d.open);
  all.forEach(d=>d.open=next);
  update();
 });
 // Other GM modules scroll to these panels; reveal them first.
 function reveal(id){
  const node=entries.get(id);
  if(!node)return;
  node.open=true;
 }
 const destinations={calendar:'binch-guild-calendar',roster:'binch-guild-roster',dungeon:'binch-dungeon-prep'};
 page.addEventListener('click',e=>{
  const button=e.target.closest('[data-gm-destination]');
  if(button&&destinations[button.dataset.gmDestination])reveal(destinations[button.dataset.gmDestination]);
  if(e.target.closest('[data-weekly-plan]'))reveal('binch-guild-calendar');
 },true);
 document.addEventListener('click',e=>{
  const link=e.target.closest('a[href^="#"]');if(!link)return;
  const id=link.getAttribute('href').slice(1);
  const parent=$(id)?.closest('details.binch-gm-workspace-group');if(parent)parent.open=true;
 },true);
 update();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
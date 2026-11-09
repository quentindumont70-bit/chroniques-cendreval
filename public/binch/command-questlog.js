/* La Binch / Journal de quêtes issu des SavedVariables (aucune quête inventée). */
(()=>{'use strict';
const $=id=>document.getElementById(id);
function read(key){try{return JSON.parse(localStorage.getItem(key))||{}}catch{return {}}}
function render(){
 const list=$('binch-command-quest-list'),state=$('binch-command-quest-status');if(!list||!state)return;
 const p=read('grimoire.hub.v3'),name=String(p.data?.pseudo||'').trim().toLowerCase(),last=read('grimoire.bridge.last'),same=!!name&&String(last.name||'').toLowerCase()===name;
 list.textContent='';
 if(!same){state.textContent='Aucune sauvegarde confirmée pour ce personnage. Importe GrimoireSync.lua pour récupérer les quêtes.';return}
 const api=last.questLogAPI||'unavailable',quests=Array.isArray(last.questLog)?last.questLog.filter(q=>Number.isInteger(Number(q.id))&&q.title).slice(0,45):[];
 if(api==='unavailable'){state.textContent='Le client ne transmet pas encore les quêtes via une API reconnue. Le suivi manuel reste disponible.';return}
 state.textContent=quests.length+' quêtes identifiées dans le dernier import · API '+api+' · photographie de la sauvegarde, pas de suivi en direct.';
 if(!quests.length){const m=document.createElement('p');m.className='binch-command-quest-empty';m.textContent='Aucune quête identifiable dans le dernier export. Ce résultat ne prouve pas que ton journal est vide.';list.append(m);return}
 for(const quest of quests){
  const row=document.createElement('div');row.className='binch-command-quest-entry';
  const mark=document.createElement('span');mark.className='binch-command-quest-mark';mark.textContent=quest.complete?'✓':'◇';
  const content=document.createElement('div');const title=document.createElement('strong');title.textContent=quest.title;const meta=document.createElement('small');meta.textContent='#'+quest.id+(quest.complete?' · Prête à rendre (si statut pris en charge)':' · Présente dans le journal');
  content.append(title,meta);
  const btn=document.createElement('button');btn.type='button';btn.textContent='☆';btn.title='Épingler '+quest.title;btn.setAttribute('aria-label','Épingler '+quest.title);
  btn.addEventListener('click',()=>{
   if(!window.BinchPinned?.set){btn.textContent='!';btn.title='Carnet indisponible';return}
   window.BinchPinned.set({id:'quest:'+quest.id,n:Number(last.level)||1,c:'Quête importée',t:quest.title,d:'Quête présente dans la sauvegarde WoW, identifiant '+quest.id+'.',s:'next',source:'GrimoireSync'});
   btn.textContent='✓';btn.disabled=true;
  });
  row.append(mark,content,btn);list.append(row);
 }
}
function mount(){
 const host=$('page-command')?.querySelector('.binch-command'),discovery=$('binch-command-discoveries'),stats=host?.querySelector('.binch-command-stats');
 if(!host||$('binch-command-questlog'))return;
 const section=document.createElement('section');section.id='binch-command-questlog';section.className='binch-command-questlog';
 section.innerHTML='<div class="binch-command-label"><span>JOURNAL DE QUÊTES</span><span>GRIMOIRESYNC · SAUVEGARDE LOCALE</span></div><div class="binch-command-quest-heading"><h3>Mes quêtes <em>en cours</em></h3><button type="button" id="binch-command-quest-import">↻ Actualiser via GrimoireSync</button></div><p id="binch-command-quest-status"></p><div id="binch-command-quest-list"></div>';
 (discovery||stats)?.after(section);
 $('binch-command-quest-import').addEventListener('click',()=>{document.body.classList.remove('binch-command-focus');document.querySelector('#app nav.nav [data-page="sync"]')?.click()});
 document.addEventListener('grimoire:sync',render);$('binch-command-refresh')?.addEventListener('click',render);
 window.addEventListener('storage',e=>{if(e.key==='grimoire.bridge.last'||e.key==='grimoire.hub.v3')render()});
 render();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
})();
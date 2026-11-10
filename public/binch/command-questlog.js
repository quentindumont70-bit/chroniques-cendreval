/* La Binch / Journal de quêtes issu des SavedVariables (aucune quête inventée). */
(()=>{'use strict';
const $=id=>document.getElementById(id);
let filter='all',search='';
function read(key){try{return JSON.parse(localStorage.getItem(key))||{}}catch{return {}}}
function render(){
 const list=$('binch-command-quest-list'),state=$('binch-command-quest-status');if(!list||!state)return;
 const p=read('grimoire.hub.v3'),name=String(p.data?.pseudo||'').trim().toLowerCase(),last=read('grimoire.bridge.last'),same=!!name&&String(last.name||'').toLowerCase()===name;
 list.textContent='';
 if(!same){state.textContent='Aucune sauvegarde confirmée pour ce personnage. Importe GrimoireSync.lua pour récupérer les quêtes.';return}
 const api=last.questLogAPI||'unavailable',quests=Array.isArray(last.questLog)?last.questLog.filter(q=>Number.isInteger(Number(q.id))&&q.title).slice(0,100):[];
 if(api==='unavailable'){state.textContent='Le client ne transmet pas encore les quêtes via une API reconnue. Le suivi manuel reste disponible.';return}
 const ready=quests.filter(q=>q.complete===true).length;
 state.textContent=quests.length+' quêtes identifiées · '+ready+' prêtes à rendre selon la sauvegarde · API '+api+' · pas de suivi en direct.';
 if(!quests.length){const m=document.createElement('p');m.className='binch-command-quest-empty';m.textContent='Aucune quête identifiable dans le dernier export. Ce résultat ne prouve pas que ton journal est vide.';list.append(m);return}
 const shown=quests.filter(q=>(filter==='all'||(filter==='ready'?q.complete===true:q.complete!==true))&&(!search||String(q.title).toLocaleLowerCase('fr').includes(search)||String(q.id).includes(search))).sort((a,b)=>Number(b.complete===true)-Number(a.complete===true));
 if(!shown.length){const empty=document.createElement('p');empty.className='binch-command-quest-empty';empty.textContent='Aucune quête correspondant au filtre actuel.';list.append(empty);return}
 for(const quest of shown){
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
 section.innerHTML='<div class="binch-command-label"><span>JOURNAL DE QUÊTES</span><span>GRIMOIRESYNC · SAUVEGARDE LOCALE</span></div><div class="binch-command-quest-heading"><h3>Mes quêtes <em>en cours</em></h3><button type="button" id="binch-command-quest-import">↻ Actualiser via GrimoireSync</button></div><div class="binch-command-quest-controls"><input type="search" id="binch-command-quest-search" placeholder="Rechercher une quête ou son ID" aria-label="Rechercher dans mes quêtes"><select id="binch-command-quest-filter" aria-label="Filtrer les quêtes"><option value="all">Toutes</option><option value="ready">Prêtes à rendre</option><option value="pending">À poursuivre</option></select></div><p id="binch-command-quest-status"></p><div id="binch-command-quest-list"></div>';
 (discovery||stats)?.after(section);
 $('binch-command-quest-search').addEventListener('input',e=>{search=e.target.value.trim().toLocaleLowerCase('fr');render()});
 $('binch-command-quest-filter').addEventListener('change',e=>{filter=e.target.value;render()});
 $('binch-command-quest-import').addEventListener('click',()=>{document.body.classList.remove('binch-command-focus');document.querySelector('#app nav.nav [data-page="sync"]')?.click()});
 document.addEventListener('grimoire:sync',render);$('binch-command-refresh')?.addEventListener('click',render);
 window.addEventListener('storage',e=>{if(e.key==='grimoire.bridge.last'||e.key==='grimoire.hub.v3')render()});
 render();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
})();
/* Radar des découvertes — source unique : carnet de découvertes public La Binch. */
(()=>{'use strict';
const $=id=>document.getElementById(id);
function item(q){
 const card=document.createElement('article');card.className='binch-command-discovery';
 const top=document.createElement('div');top.className='binch-command-discovery-top';
 const category=document.createElement('span');category.textContent=q.category||'Découverte';
 const level=document.createElement('span');level.textContent=q.available?'Accessible · conseiller niv. '+q.rec:'À venir · niv. '+q.level;
 top.append(category,level);
 const title=document.createElement('strong');title.textContent=q.title;
 const desc=document.createElement('p');desc.textContent=q.summary||'Découverte documentée dans le carnet de route.';
 const bottom=document.createElement('div');bottom.className='binch-command-discovery-bottom';
 const source=document.createElement('a');source.href=q.source||'#';source.target='_blank';source.rel='noopener noreferrer';source.textContent=q.sourceName?'Source : '+q.sourceName:'Catalogue La Binch';
 if(!q.source){source.removeAttribute('href');source.removeAttribute('target')}
 const pin=document.createElement('button');pin.type='button';pin.textContent='☆ Épingler';pin.title='Ajouter à mon carnet de route';
 pin.addEventListener('click',()=>{
  if(!window.BinchPinned?.set){pin.textContent='Carnet indisponible';pin.disabled=true;return}
  window.BinchPinned.set({id:'discovery:'+q.id,n:Number(q.level),c:q.category||'Découverte',t:q.title,d:q.summary||'',s:'next',source:q.source||''});
  pin.textContent='✓ Épinglé';pin.disabled=true;
 });
 bottom.append(source,pin);card.append(top,title,desc,bottom);return card;
}
function render(){
 const root=$('binch-command-discoveries-list'),note=$('binch-command-discoveries-info');if(!root||!note)return;
 const api=window.BinchDiscoveries;if(!api){note.textContent='Le catalogue est indisponible sur cette version.';root.textContent='';return}
 const rows=api.recommendations?.()||[],now=rows.filter(q=>q.available&&q.verified),soon=rows.filter(q=>!q.available&&q.verified);
 const chosen=[...now.slice(0,3),...soon.slice(0,2)].slice(0,4);
 note.textContent=api.getCount()+' découvertes dans le catalogue · '+now.length+' compatibles et accessibles parmi les premières propositions · progression des quêtes non synchronisée';
 root.textContent='';
 if(!chosen.length){const fallback=document.createElement('p');fallback.className='binch-command-muted';fallback.textContent='Aucune découverte vérifiée correspondant à ce niveau et à cette classe dans notre sélection actuelle.';root.append(fallback)}
 else chosen.forEach(q=>root.append(item(q)));
}
function mount(){
 const shell=$('page-command')?.querySelector('.binch-command'),bottom=shell?.querySelector('.binch-command-bottom');if(!shell||!bottom||$('binch-command-discoveries'))return;
 const section=document.createElement('section');section.id='binch-command-discoveries';section.className='binch-command-discoveries';
 section.innerHTML='<div class="binch-command-label"><span>RADAR DES DÉCOUVERTES</span><span>QUÊTES ET RÉCOMPENSES SOURCÉES</span></div><div class="binch-command-discoveries-heading"><h3>À ne pas <em>manquer</em></h3><button id="binch-command-discoveries-open" type="button">Ouvrir les découvertes ↗</button></div><p id="binch-command-discoveries-info" class="binch-command-muted"></p><div id="binch-command-discoveries-list"></div>';
 bottom.after(section);
 $('binch-command-discoveries-open').addEventListener('click',()=>{document.querySelector('#app nav.nav [data-page="discoveries"]')?.click();document.body.classList.remove('binch-command-focus')});
 document.addEventListener('grimoire:sync',render);document.addEventListener('binch:pins-changed',render);
 window.addEventListener('storage',e=>{if(e.key?.startsWith('grimoire.discovery.')||e.key==='grimoire.hub.v3')render()});
 $('binch-command-refresh')?.addEventListener('click',render);
 render();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
})();
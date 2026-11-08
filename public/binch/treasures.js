(()=>{
'use strict';
const $=x=>document.querySelector(x);
const escape=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const SHOW='binch.treasure.exhibit.v1.';
function playerId(){try{const p=JSON.parse(localStorage.getItem('grimoire.hub.v3'));return String(p?.data?.pseudo||p?.name||'personnage').toLocaleLowerCase('fr').slice(0,40)}catch{return 'personnage'}}
function exhibitId(){return SHOW+playerId()}
function equipped(){try{return localStorage.getItem(exhibitId())||''}catch{return ''}}
function displayExhibit(){
 const hub=$('#binch-adventure-home');if(!hub)return;
 const api=window.BinchRewards;if(!api)return;
 const chosen=equipped(),item=api.items.find(x=>x.id===chosen&&Number(api.read()?.drops?.[x.id]||0)>0);
 let box=$('#binch-profile-exhibit');if(!box){box=document.createElement('aside');box.id='binch-profile-exhibit';const guard=$('#binch-priority-guard');if(guard)guard.after(box);else hub.append(box)}
 if(!item){box.hidden=true;box.replaceChildren();return}
 box.hidden=false;
 box.style.setProperty('--exhibit',item.color);
 box.innerHTML='<span class="binch-exhibit-symbol" aria-hidden="true">'+({relics:'◆',companions:'✦',characters:'♜',mounts:'♞'}[item.category]||'✧')+'</span><div><small>VITRINE DU PERSONNAGE · TROUVAILLE COSMÉTIQUE</small><strong>'+escape(item.name)+'</strong><p>'+escape(item.categoryName)+' · '+escape(item.tierName)+' · souvenir conservé dans ce navigateur</p></div><button type="button" data-exhibit-open="'+escape(item.id)+'">Contempler</button><button type="button" data-exhibit-remove="1" aria-label="Retirer de la vitrine">✕</button>';
 box.querySelector('[data-exhibit-open]').onclick=()=>{openPage('tresors');api.preview(item.id)};
 box.querySelector('[data-exhibit-remove]').onclick=()=>{localStorage.removeItem(exhibitId());displayExhibit();render()};
}
function setExhibit(id){
 const api=window.BinchRewards;
 if(!api||!api.items.some(x=>x.id===id&&Number(api.read()?.drops?.[id]||0)>0))return;
 try{localStorage.setItem(exhibitId(),id)}catch{}
 displayExhibit();render();
}

function setupNavigation(){
 const nav=$('#app nav.nav');if(!nav)return;
 nav.dataset.binchNavRows='1';
 const apply=()=>{
  const n=nav.querySelectorAll('button[data-page]').length;
  nav.style.setProperty('--binch-nav-columns',Math.max(2,Math.ceil(n/2)));
 };
 apply();
 const observer=new MutationObserver(apply);
 observer.observe(nav,{childList:true});
}
function openPage(name){
 const page=$('#page-'+name);if(!page)return;
 document.querySelectorAll('#app main .page').forEach(p=>p.classList.toggle('active',p===page));
 document.querySelectorAll('#app nav.nav button[data-page]').forEach(b=>b.classList.toggle('active',b.dataset.page===name));
 window.scrollTo({top:0,behavior:'instant'});
 if(name==='tresors')render();
}
function render(){
 const root=$('#binch-treasure-collection');if(!root)return;
 const API=window.BinchRewards;
 if(!API){root.textContent='La collection n’est pas encore chargée.';return}
 const state=API.read(),drops=state.drops||{};
 const items=API.items.filter(x=>Number(drops[x.id]||0)>0);
 const unlocked=new Set(items.map(x=>x.id)); const selected=equipped();
 const progress=$('#binch-treasures-progress');
 if(progress)progress.textContent=items.length+' / '+API.items.length+' trésors découverts';
 const q=$('#binch-treasure-search')?.value.trim().toLocaleLowerCase('fr')||'';
 const filter=$('#binch-treasure-category')?.value||'all';
 const matched=items.filter(x=>(filter==='all'||x.category===filter)&&(!q||x.name.toLocaleLowerCase('fr').includes(q)||x.tierName.toLocaleLowerCase('fr').includes(q)));
 root.innerHTML=matched.length?matched.map(x=>'<div class="binch-treasure-frame"><button type="button" class="binch-treasure-card" data-treasure="'+escape(x.id)+'" style="--treasure-accent:'+escape(x.color)+'"><span class="binch-treasure-card-art" aria-hidden="true">'+({relics:'◆',companions:'✦',characters:'♜',mounts:'♞'}[x.category]||'✦')+'</span><span class="binch-treasure-card-main"><small>'+escape(x.categoryName)+' · '+escape(x.tierName)+'</small><strong>'+escape(x.name)+'</strong><em>Obtenu × '+Number(drops[x.id])+'</em><span class="binch-treasure-open">Contempler le trésor ↗</span></span></button><button type="button" class="binch-exhibit-set" data-exhibit="'+escape(x.id)+'">'+(selected===x.id?'★ Exposé sur mon profil':'☆ Exposer sur mon profil')+'</button></div>').join(''):'<div class="binch-treasure-empty">'+(items.length?'Aucun trésor ne correspond à ces filtres.':'Ton coffre est vide pour le moment. Les surprises découvertes en naviguant sur La Binch apparaîtront ici. Clique sur le blason pour consulter les hauts faits et les récompenses possibles.')+'</div>';
}
function build(){
 setupNavigation();
 const nav=$('#app nav.nav'),main=$('#app main');if(!nav||!main||$('#page-tresors'))return;
 const button=document.createElement('button');button.type='button';button.dataset.page='tresors';button.textContent='Trésors';nav.append(button);
 button.addEventListener('click',()=>openPage('tresors'));
 const page=document.createElement('section');page.id='page-tresors';page.className='page';
 page.innerHTML='<section class="panel section binch-treasures"><div class="eyebrow">✧ LA BINCH / SALLE DES TRÉSORS</div><h2>Ton trésor de guerre</h2><p>Un écrin pour les apparitions cosmétiques réellement découvertes. Clique sur une récompense pour revoir son animation et sa fiche. Aucun objet n’est transféré dans WoW.</p><div class="binch-treasures-top"><strong id="binch-treasures-progress">0 / 80 trésors découverts</strong><button type="button" id="binch-treasures-achievements">Voir le suivi des hauts faits ↗</button></div><div class="binch-treasure-filters"><input id="binch-treasure-search" type="search" placeholder="Chercher dans mes trésors…"><select id="binch-treasure-category"><option value="all">Toutes catégories</option><option value="relics">Reliques</option><option value="companions">Compagnons</option><option value="characters">Personnages</option><option value="mounts">Montures</option></select></div><div id="binch-treasure-collection" class="binch-treasure-collection"></div></section>';
 main.append(page);
 page.querySelector('#binch-treasure-search').addEventListener('input',render);
 page.querySelector('#binch-treasure-category').addEventListener('change',render);
 page.querySelector('#binch-treasures-achievements').addEventListener('click',()=>{const crest=$('#app .binch-crest-secret');if(crest)crest.click()});
 page.querySelector('#binch-treasure-collection').addEventListener('click',e=>{const chosen=e.target.closest('[data-exhibit]');if(chosen){setExhibit(chosen.dataset.exhibit);return}const b=e.target.closest('[data-treasure]');if(b&&window.BinchRewards)window.BinchRewards.preview(b.dataset.treasure)});
 document.addEventListener('binch:treasure',()=>{render();displayExhibit()});document.addEventListener('grimoire:sync',displayExhibit);
 window.addEventListener('storage',e=>{if(e.key==='binch.procs.v1')render()});
 render();setTimeout(displayExhibit,0);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',build);else build();
})();
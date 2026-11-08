(()=>{
'use strict';
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function navigate(name){const page=$('#page-'+name);if(!page)return;document.querySelectorAll('#app .page').forEach(x=>x.classList.toggle('active',x===page));document.querySelectorAll('#app nav.nav [data-page]').forEach(x=>x.classList.toggle('active',x.dataset.page===name));window.scrollTo({top:0,behavior:'instant'});}
function boot(){
 const main=$('#app main'),nav=$('#app nav.nav');if(!main||!nav||$('#page-tresors'))return;
 const button=document.createElement('button');button.type='button';button.dataset.page='tresors';button.textContent='Trésors';button.title='Admirer tes récompenses cosmétiques obtenues';button.onclick=()=>{navigate('tresors');render()};nav.append(button);
 const page=document.createElement('section');page.className='page';page.id='page-tresors';
 page.innerHTML='<section class="panel section binch-treasures"><div class="eyebrow">LA BINCH / SALLE DES TRÉSORS</div><header class="binch-treasure-head"><div><h2>Mes trésors</h2><p>Chaque surprise obtenue rejoint ton inventaire cosmétique. Clique sur un trésor pour l’examiner et revoir son animation. Aucun objet n’est ajouté à ton personnage WoW.</p></div><div class="binch-treasure-tally"><strong id="binch-treasure-owned">0</strong><span>trésors uniques</span></div></header><div class="binch-treasure-controls"><label>Rechercher un trésor<input id="binch-treasure-search" type="search" placeholder="Nom du trésor…"></label><label>Catégorie<select id="binch-treasure-category"><option value="all">Toutes les catégories</option><option value="relics">Reliques</option><option value="companions">Compagnons</option><option value="characters">Personnages</option><option value="mounts">Montures</option></select></label><label>Rareté<select id="binch-treasure-rarity"><option value="all">Toutes les raretés</option></select></label></div><div id="binch-treasure-grid" class="binch-treasure-grid"></div><div class="binch-treasure-footer"><button type="button" id="binch-treasure-tracker">Voir le suivi des hauts faits et surprises ↗</button><p>Les trésors sont sauvegardés dans ce navigateur. Une remise à zéro du site ou des données locales peut les effacer.</p></div></section>';
 main.append(page);
 const api=window.BINCH_TREASURE_API;
 if(api){const tiers=[...new Map(api.items.map(x=>[x.tier,x.rarityName])).entries()];$('#binch-treasure-rarity').insertAdjacentHTML('beforeend',tiers.map(([key,name])=>'<option value="'+esc(key)+'">'+esc(name)+'</option>').join(''));}
 const render=()=>{
  const api=window.BINCH_TREASURE_API,root=$('#binch-treasure-grid');if(!api||!root)return;
  const state=api.read(),drops=state.drops||{},items=api.items.filter(x=>Number(drops[x.id]||0)>0);
  $('#binch-treasure-owned').textContent=String(items.length);
  const q=$('#binch-treasure-search').value.toLocaleLowerCase('fr').trim(),cat=$('#binch-treasure-category').value,tier=$('#binch-treasure-rarity').value;
  const matched=items.filter(x=>(cat==='all'||x.category===cat)&&(tier==='all'||x.tier===tier)&&(!q||x.name.toLocaleLowerCase('fr').includes(q)));
  root.innerHTML=matched.length?matched.map(item=>'<button type="button" class="binch-treasure-item" data-open-treasure="'+esc(item.id)+'" style="--treasure-accent:'+esc(item.color)+'"><span class="binch-treasure-symbol" aria-hidden="true">'+({relics:'⚔',companions:'✦',characters:'♟',mounts:'♞'}[item.category]||'✦')+'</span><span class="binch-treasure-kind">'+esc(item.categoryName)+' · '+esc(item.rarityName)+'</span><strong>'+esc(item.name)+'</strong><small>Obtenu '+Number(drops[item.id])+' fois</small><span class="binch-treasure-see">Examiner ↗</span></button>').join(''):'<div class="binch-treasure-empty"><div class="binch-treasure-empty-icon">◇</div><h3>'+(items.length?'Aucun trésor ne correspond aux filtres':'La salle des trésors attend sa première découverte')+'</h3><p>'+(items.length?'Change tes filtres pour retrouver un autre objet.':'Explore La Binch : certaines interactions peuvent déclencher une surprise cosmétique. Tes découvertes apparaîtront ici.')+'</p><button type="button" id="binch-treasure-open-tracker">Voir le Cabinet des surprises ↗</button></div>';
 };
 page.addEventListener('click',e=>{
  const open=e.target.closest('[data-open-treasure]');
  if(open){window.BINCH_TREASURE_API?.preview(open.dataset.openTreasure);return}
  if(e.target.closest('#binch-treasure-tracker,#binch-treasure-open-tracker')){
   const crest=document.querySelector('.binch-crest-secret');
   if(crest)crest.click();
  }
 });
 ['#binch-treasure-search','#binch-treasure-category','#binch-treasure-rarity'].forEach(q=>$(q).addEventListener(q.includes('search')?'input':'change',render));
 document.addEventListener('binch:treasure',render);
 window.addEventListener('storage',e=>{if(e.key==='binch.procs.v1')render()});
 render();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
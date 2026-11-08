/* La Binch — codex narratif des apparitions.
   Les références de lore non vérifiées sont explicitement signalées. */
(()=>{
'use strict';
const $=q=>document.querySelector(q);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function init(){
 const host=$('#page-bibliotheque');
 const catalog=window.BINCH_LORE_CATALOG;
 const api=window.BINCH_TREASURE_API;
 if(!host||!catalog||!api||$('#binch-lore-codex'))return;
 const region=document.createElement('section');region.id='binch-lore-codex';region.className='binch-lore-codex';
 region.innerHTML='<div class="binch-lore-header"><div class="eyebrow">ARCHIVES D’AZEROTH · CRÉATION ORIGINALE</div><h2>Encyclopédie des apparitions</h2><p>Chaque trésor possède son nom, son histoire, sa future mise en scène et ses accessoires. Les références de Warcraft se distinguent des inventions humoristiques propres à La Binch.</p></div><div class="binch-lore-controls"><label>Afficher<select id="binch-lore-filter"><option value="curated">Scènes scénarisées</option><option value="all">Toutes les 80 récompenses</option><option value="owned">Mes découvertes</option></select></label><label>Rechercher<input id="binch-lore-search" type="search" placeholder="Péon, sanglier, artefact…"></label></div><div id="binch-lore-list" class="binch-lore-list"></div><p class="binch-lore-source-note">Textes de présentation originaux. Les extraits de livres ne seront ajoutés qu’après identification vérifiable de l’ouvrage, de la page et des droits de citation. Les scènes proposées ne prétendent pas être des événements canoniques.</p>';
 host.append(region);
 const render=()=>{
  const root=$('#binch-lore-list'),mode=$('#binch-lore-filter').value,q=$('#binch-lore-search').value.toLocaleLowerCase('fr').trim();
  const owned=api.read().drops||{};
  const items=api.items.filter(x=>(mode==='all'||mode==='curated'&&catalog.entries[x.id]||mode==='owned'&&owned[x.id]>0));
  const filtered=items.filter(x=>{
   const c=catalog.entries[x.id],hay=[x.name,x.categoryName,x.rarityName,c?.scene,c?.lore,c?.place,...(c?.assets||[])].filter(Boolean).join(' ').toLocaleLowerCase('fr');
   return !q||hay.includes(q);
  });
  root.innerHTML=filtered.map((item,index)=>{
   const lore=catalog.entries[item.id],ownedItem=Number(owned[item.id]||0)>0,assets=lore?.assets||[],scene=lore?.scene||'Scène propre à cette récompense à écrire et à animer.',context=lore?.lore||'Référence à documenter : vérifier le contexte historique et les sources avant d’écrire le scénario.';
   const motif={relics:'⚔',companions:'✦',characters:'♟',mounts:'♞'}[item.category]||'✧';
   return '<details class="binch-lore-entry" style="--lore-glow:'+esc(item.color)+'"><summary><span class="binch-lore-medallion" aria-hidden="true">'+motif+'</span><span class="binch-lore-summary"><small>'+esc(item.categoryName)+' · '+esc(item.rarityName)+'</small><strong>'+esc(item.name)+'</strong><em>'+(lore?'Scène documentée / animation à produire':'À scénariser')+'</em></span><span class="binch-lore-owned">'+(ownedItem?'✦ Découvert':'À découvrir')+'</span><span aria-hidden="true" class="binch-lore-chevron">⌄</span></summary><div class="binch-lore-detail"><div><h3>La scène</h3><p>'+esc(scene)+'</p><h3>Le lore</h3><p>'+esc(context)+'</p><p class="binch-lore-canon">'+(lore?.verified?'Référence vérifiée':'Référence en cours de vérification / création originale')+'</p>'+(lore?.source?'<a target="_blank" rel="noopener noreferrer" href="'+esc(lore.source)+'">Source de contexte ↗</a>':'')+'</div><aside><h3>Assets de la scène</h3>'+(assets.length?'<ul>'+assets.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul>':'<p>Storyboard et assets à déterminer.</p>')+(lore?.place?'<p><b>Décor :</b> '+esc(lore.place)+'</p>':'')+'<p><b>État :</b> Animation HD non encore produite.</p>'+(ownedItem?'<button data-lore-preview="'+esc(item.id)+'" type="button">Revoir le prototype actuel ↗</button>':'')+'</aside></div></details>';
  }).join('')||'<p class="binch-lore-none">Aucune fiche pour cette recherche.</p>';
  region.querySelectorAll('[data-lore-preview]').forEach(b=>b.onclick=()=>api.preview(b.dataset.lorePreview));
 };
 $('#binch-lore-filter').onchange=render;$('#binch-lore-search').oninput=render;
 document.addEventListener('binch:treasure',render);
 render();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
/* La Binch Ultimate — accessible module switcher (Ctrl+K / ⌘K).
   Discovers actual navigation buttons rather than inventing routes; never locks page scroll. */
(()=>{'use strict';
const $=id=>document.getElementById(id),KEY='binch.command.quicknav.v1';
let favorite=[],query='';
try{const v=JSON.parse(localStorage.getItem(KEY));favorite=Array.isArray(v)?v.filter(x=>typeof x==='string').slice(0,12):[]}catch{}
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function links(){
 const nav=document.querySelector('#app nav.nav');if(!nav)return [];
 const seen=new Set();
 return [...nav.querySelectorAll('button[data-page]')].map(b=>({id:b.dataset.page,title:b.textContent.trim()})).filter(x=>x.id&&x.title&&!seen.has(x.id)&&seen.add(x.id));
}
function save(){try{localStorage.setItem(KEY,JSON.stringify(favorite))}catch{}}
function paint(){
 const root=$('binch-quicknav-results');if(!root)return;
 const keys=links().filter(x=>!query||x.title.toLocaleLowerCase('fr').includes(query)||x.id.includes(query)).sort((a,b)=>Number(favorite.includes(b.id))-Number(favorite.includes(a.id))||a.title.localeCompare(b.title,'fr'));
 $('binch-quicknav-count').textContent=keys.length+' rubrique(s) disponibles';
 root.innerHTML=keys.length?keys.map(x=>'<div class="binch-quicknav-item"><button type="button" data-nav-go="'+esc(x.id)+'">'+esc(x.title)+'</button><button type="button" data-nav-star="'+esc(x.id)+'" aria-label="'+(favorite.includes(x.id)?'Retirer des favoris':'Ajouter aux favoris')+' : '+esc(x.title)+'" aria-pressed="'+favorite.includes(x.id)+'">'+(favorite.includes(x.id)?'★':'☆')+'</button></div>').join(''):'<p>Aucune rubrique trouvée.</p>';
}
function close(){
 const p=$('binch-quicknav-dialog'),launch=$('binch-quicknav-launch');if(!p)return;
 p.hidden=true;launch?.setAttribute('aria-expanded','false');launch?.focus({preventScroll:true});
}
function open(){
 const p=$('binch-quicknav-dialog'),launch=$('binch-quicknav-launch');if(!p)return;
 p.hidden=false;launch?.setAttribute('aria-expanded','true');query='';$('binch-quicknav-search').value='';paint();$('binch-quicknav-search').focus({preventScroll:true});
}
function init(){
 const nav=document.querySelector('#app nav.nav');if(!nav||$('binch-quicknav-launch'))return;
 const launch=document.createElement('button');launch.id='binch-quicknav-launch';launch.type='button';launch.textContent='⌕ Trouver une rubrique';launch.setAttribute('aria-expanded','false');launch.setAttribute('aria-controls','binch-quicknav-dialog');nav.after(launch);
 const panel=document.createElement('section');panel.id='binch-quicknav-dialog';panel.className='binch-quicknav-dialog';panel.hidden=true;panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','false');panel.setAttribute('aria-label','Recherche rapide dans La Binch');
 panel.innerHTML='<div class="binch-quicknav-head"><strong>Navigation rapide · La Binch</strong><button type="button" id="binch-quicknav-close" aria-label="Fermer">×</button></div><label class="binch-quicknav-search">Rechercher une rubrique<input id="binch-quicknav-search" type="search" autocomplete="off" placeholder="Ex. : quêtes, talents, guilde…"></label><p id="binch-quicknav-count"></p><div id="binch-quicknav-results"></div><small>Ctrl + K pour ouvrir. ★ pour épingler une rubrique. Aucune donnée envoyée.</small>';
 nav.after(panel);
 launch.onclick=()=>panel.hidden?open():close();
 $('binch-quicknav-close').onclick=close;
 $('binch-quicknav-search').oninput=e=>{query=e.target.value.trim().toLocaleLowerCase('fr').slice(0,70);paint()};
 $('binch-quicknav-results').onclick=e=>{
  const star=e.target.closest('[data-nav-star]');if(star){const id=star.dataset.navStar;favorite=favorite.includes(id)?favorite.filter(x=>x!==id):[...favorite,id].slice(-12);save();paint();return}
  const go=e.target.closest('[data-nav-go]');if(go){const tab=[...nav.querySelectorAll('button[data-page]')].find(x=>x.dataset.page===go.dataset.navGo);close();tab?.click()}
 };
 document.addEventListener('keydown',e=>{
  if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();panel.hidden?open():close()}
  else if(e.key==='Escape'&&!panel.hidden){e.stopPropagation();close()}
  else if(e.key==='Enter'&&!panel.hidden&&e.target===$('binch-quicknav-search')){e.preventDefault();const first=$('binch-quicknav-results button[data-nav-go]');first?.click()}
 });
 document.addEventListener('pointerdown',e=>{if(!panel.hidden&&!panel.contains(e.target)&&e.target!==launch)close()});
 paint();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
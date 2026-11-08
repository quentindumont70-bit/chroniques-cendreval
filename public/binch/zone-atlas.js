(()=>{
 'use strict';const $=id=>document.getElementById(id);let selected=null;
 function profile(){try{return JSON.parse(localStorage.getItem('grimoire.hub.v3'))||{}}catch{return {}}}
 function factionForRace(r){return ['Humain','Nain','Elfe','Gnome'].includes(r)?'Alliance':['Orc','Tauren','Troll','MortVivant'].includes(r)?'Horde':'Neutre'}
 function build(){
   const page=$('page-progression');if(!page||$('zone-browser'))return;
   const section=document.createElement('section');section.id='zone-browser';section.className='panel section zone-browser';section.innerHTML='<div class="eyebrow">Atlas Forever · cartes du client</div><h2>Explorer les zones</h2><p class="muted">Cartes réelles du build Forever. Recherche libre, filtres de niveau et recommandation selon ton personnage.</p><div class="zone-controls"><input id="zone-search" placeholder="Rechercher une zone ou un lieu…"><select id="zone-continent"><option value="">Tous les continents</option><option>Kalimdor</option><option>Royaumes de l’Est</option><option>Zéphrass</option></select><select id="zone-faction"><option value="">Toutes les factions</option><option>Alliance</option><option>Horde</option><option>Mixte</option><option>Neutre</option></select><select id="zone-level"><option value="">Tous niveaux</option><option value="1">1–10</option><option value="15">10–20</option><option value="25">20–30</option><option value="35">30–40</option><option value="45">40–50</option><option value="55">50–60</option></select></div><div id="zone-list" class="zone-list"></div><div id="zone-map-view" class="zone-map-view"><div class="zone-map-frame"><img id="zone-map-img" alt=""></div><aside class="zone-details"><div class="eyebrow" id="zone-map-type"></div><h3 id="zone-map-name"></h3><p id="zone-map-meta"></p><p id="zone-map-places"></p><button id="zone-close" class="btn">Fermer la carte</button><p class="source-note">Carte issue du build Forever, servie par Azerothbase ou la source indiquée. Grimoire ajoute uniquement le contexte du personnage.</p></aside></div><hr style="border-color:#39433d;margin:28px 0"><div class="eyebrow">Instances</div><h2>Donjons par niveau</h2><div id="dungeon-grid" class="dungeon-grid"></div>';
   page.append(section);['zone-search','zone-continent','zone-faction','zone-level'].forEach(id=>$(id).addEventListener(id==='zone-search'?'input':'change',render));$('zone-close').onclick=()=>{$('zone-map-view').classList.remove('active');selected=null;render()};render();renderDungeons();
 }
 function render(){
   const root=$('zone-list');if(!root)return;const p=profile(),lvl=+p.data?.level||1,pf=factionForRace(p.race),q=$('zone-search').value.toLowerCase().trim(),cont=$('zone-continent').value,fac=$('zone-faction').value,lv=+$('zone-level').value||0;
   const list=window.GRIMOIRE_ZONES.filter(z=>(!q||(z.name+' '+z.places).toLowerCase().includes(q))&&(!cont||z.continent===cont)&&(!fac||z.faction===fac)&&(!lv||(z.levels[0]<=lv&&z.levels[1]>=lv))).sort((a,b)=>{const as=(a.levels[0]<=lvl&&a.levels[1]>=lvl?3:0)+(a.faction===pf?2:0),bs=(b.levels[0]<=lvl&&b.levels[1]>=lvl?3:0)+(b.faction===pf?2:0);return bs-as||a.levels[0]-b.levels[0]});
   root.innerHTML=list.map(z=>'<button class="zone-card '+(selected===z.id?'active':'')+'" data-zone="'+z.id+'"><span class="range">'+z.levels[0]+'–'+z.levels[1]+'</span><small>'+z.continent+' · '+z.faction+'</small><b>'+z.name+'</b><small>'+z.places+'</small></button>').join('')||'<div class="empty-state">Aucune carte ne correspond à ces filtres.</div>';
   root.querySelectorAll('[data-zone]').forEach(b=>b.onclick=()=>openZone(b.dataset.zone));
 }
 function openZone(id){
   const z=window.GRIMOIRE_ZONES.find(x=>x.id===id);if(!z)return;selected=id;$('zone-map-img').src=z.map;$('zone-map-img').alt='Carte de '+z.name;$('zone-map-type').textContent=z.type+' · '+z.continent;$('zone-map-name').textContent=z.name;$('zone-map-meta').textContent='Niveaux '+z.levels[0]+'–'+z.levels[1]+' · '+z.faction;$('zone-map-places').innerHTML='<b>Repères :</b> '+z.places;$('zone-map-view').classList.add('active');render();$('zone-map-view').scrollIntoView({behavior:'smooth',block:'center'});
 }
 function renderDungeons(){
   const p=profile(),lvl=+p.data?.level||1,root=$('dungeon-grid');if(!root)return;root.innerHTML=window.GRIMOIRE_DUNGEONS.sort((a,b)=>Math.abs(a.levels[0]-lvl)-Math.abs(b.levels[0]-lvl)).map(d=>'<article class="dungeon-card"><small>'+d.zone+' · '+d.levels[0]+'–'+d.levels[1]+'</small><b>'+d.name+'</b><span class="muted">'+d.roles+'</span><br><small>'+d.status+'</small></article>').join('');
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',build);else build();
})();


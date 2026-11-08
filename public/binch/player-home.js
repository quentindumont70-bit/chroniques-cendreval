(()=>{
'use strict';
const PROFILE='grimoire.hub.v3',DONE='binch.route.done.v1.',PIN='binch.route.pins.v1.',$=id=>document.getElementById(id),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const glyph={Guerrier:'⚔',Paladin:'✧',Chasseur:'➶',Voleur:'✦','Prêtre':'✢',Chaman:'ϟ',Mage:'✣','Démoniste':'⬡',Druide:'❧',Humain:'⚜',Nain:'◆',Elfe:'☾',Gnome:'⚙',Orc:'✦',MortVivant:'☠',Tauren:'◉',Troll:'⟡'};
const milestones={Guerrier:[[10,'Posture défensive'],[30,'Posture berserker']],Paladin:[[12,'Rédemption'],[20,'Arme de classe']],Chasseur:[[10,'Apprivoiser ton familier']],Voleur:[[10,'Arme du maître voleur'],[20,'Poisons et thé de chardon']],Prêtre:[[10,'Sort racial du prêtre'],[20,'Pouvoir de protection']],Chaman:[[4,'Totem de Terre'],[10,'Totem de Feu'],[30,'Totem d’Air']],Mage:[[30,'Baguette de Tabetha']],Démoniste:[[2,'Invocation du diablotin'],[10,'Marcheur du Vide']],Druide:[[10,'Forme d’ours'],[16,'Forme aquatique'],[20,'Forme de félin']]};
function read(k,f={}){try{return JSON.parse(localStorage.getItem(k))||f}catch{return f}}
function profile(){const p=read(PROFILE),d=p.data||{},last=read('grimoire.bridge.last');return {...p,name:d.pseudo||'Aventurier',level:Math.max(1,Math.min(60,+d.level||1)),zone:last.zone||d.zone||'Zone non synchronisée'}}
function key(p){return (p.name+'-'+p.race+'-'+p.classe).toLowerCase().replace(/[^a-z0-9]+/g,'-')}
function route(p){const out=[],zone=(window.GRIMOIRE_ZONES||[]).filter(z=>z.levels[0]<=p.level+5&&z.levels[1]>=p.level-2).sort((a,b)=>Math.abs(a.levels[0]-p.level)-Math.abs(b.levels[0]-p.level))[0];if(zone)out.push({id:'z-'+zone.id,n:p.level,c:'Zone',t:'Explorer '+zone.name,d:zone.places,s:'now'});for(const [n,t] of (milestones[p.classe]||[]).filter(x=>x[0]>=p.level-2&&x[0]<=p.level+12).slice(0,2))out.push({id:'c-'+n+'-'+t,n,c:'Quête de classe',t,d:'Étape essentielle pour '+p.classe+'.',s:n<=p.level?'now':'next'});const dungeon=(window.GRIMOIRE_DUNGEONS||[]).filter(d=>d.levels[0]<=p.level+8&&d.levels[1]>=p.level).sort((a,b)=>Math.abs(a.levels[0]-p.level)-Math.abs(b.levels[0]-p.level))[0];if(dungeon)out.push({id:'d-'+dungeon.id,n:dungeon.levels[0],c:'Donjon',t:dungeon.name,d:'Rassemble les quêtes avant le départ.',s:dungeon.levels[0]<=p.level?'now':'next'});for(const job of (p.jobs||[]).slice(0,2))out.push({id:'j-'+job,n:p.level,c:'Métier',t:'Faire progresser '+job,d:'Maître, recettes et composants à vérifier.',s:'now'});out.push({id:'sleep',n:14,c:'Secret',t:'La chaîne du sac de couchage',d:'Un incontournable Forever à préparer tôt.',s:p.level>=12?'now':'future'},{id:'level',n:Math.min(60,p.level+1),c:'Progression',t:'Préparer le niveau '+Math.min(60,p.level+1),d:'Compétences, consommables et prochain trajet.',s:'next'});return out.sort((a,b)=>a.n-b.n)}

function pins(p=profile()){const v=read(PIN+key(p),{});return v&&typeof v==='object'&&!Array.isArray(v)?v:{}}
function writePins(p,v){try{localStorage.setItem(PIN+key(p),JSON.stringify(v))}catch{}document.dispatchEvent(new CustomEvent('binch:pins-changed'))}
function pinItem(item,p=profile()){
 const v=pins(p);if(v[item.id])delete v[item.id];else v[item.id]={id:item.id,n:Number(item.n)||p.level,c:item.c,t:item.t,d:item.d||'',s:item.s||'next',source:item.source||''};
 writePins(p,v);renderRoute()
}
function enhanceProfile(){
 const hub=$('page-hub'),form=hub?.querySelector('.panel.section:has(#pseudo)');
 if(!form||form.closest('#binch-edit-profile'))return;
 const wrap=document.createElement('details');wrap.id='binch-edit-profile';wrap.className='binch-edit-profile';
 const title=document.createElement('summary');title.innerHTML='<span>✎ Modifier mon personnage</span><small>Informations manuelles et corrections du profil synchronisé</small>';
 wrap.append(title);form.replaceWith(wrap);wrap.append(form);
 const last=read('grimoire.bridge.last',{});
 const p=profile();wrap.open=!(last.name&&String(last.name).toLowerCase()===p.name.toLowerCase());
}
function showGuard(p,all,done,activePins){
 const target=$('binch-priority-guard');if(!target)return;
 const selected=all.filter(i=>activePins[i.id]&&!done[i.id]).slice(0,7);
 const alertable=all.filter(i=>!done[i.id]&&i.n<=p.level+8&&['Quête de classe','Secret','Recette','Métier','Donjon'].includes(i.c));
 const suggest=alertable.filter(i=>!activePins[i.id]).slice(0,3);
 target.innerHTML='<header><div><span class="binch-kicker">VEILLE DE FAITH · OBJECTIFS ESSENTIELS</span><h2>Ne laisse rien derrière toi</h2><p>Un clic sur ☆, dans ta timeline ou dans les listes de recettes et de découvertes, épingle une étape ici.</p></div><span class="binch-guard-counter">'+selected.length+' épinglé(s)</span></header>'+
 '<div class="binch-guard-list">'+(selected.length?selected.map(i=>'<button type="button" data-guard-go="'+esc(i.id)+'"><small>'+esc(i.c)+' · niveau '+i.n+'</small><strong>'+esc(i.t)+'</strong><span>Retrouver dans la timeline ↗</span></button>').join(''):'<div class="binch-guard-empty">Aucun objectif épinglé. Choisis les priorités de ton aventure, sans obligation de tout faire.</div>')+'</div>'+
 (suggest.length?'<footer><span>À surveiller :</span>'+suggest.map(i=>'<button type="button" data-guard-pin="'+esc(i.id)+'">+ '+esc(i.t)+'</button>').join('')+'</footer>':'');
 target.querySelectorAll('[data-guard-go]').forEach(b=>b.onclick=()=>{cat='Épinglés';renderRoute();const el=[...document.querySelectorAll('#binch-route-list [data-route-pin]')].find(x=>x.dataset.routePin===b.dataset.guardGo)?.closest('.binch-route-step');el?.scrollIntoView({block:'center',behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'auto':'smooth'})});
 target.querySelectorAll('[data-guard-pin]').forEach(b=>b.onclick=()=>{const i=all.find(i=>i.id===b.dataset.guardPin);if(i)pinItem(i,p)});
}
function syncExternalButtons(){
 const present=pins();
 document.querySelectorAll('[data-route-pin-external]').forEach(b=>{
  const on=!!present[b.dataset.routePinExternal];b.textContent=on?'★ Épinglé':'☆ Épingler';b.setAttribute('aria-pressed',String(on));b.classList.toggle('is-pinned',on);
 })
}
window.BinchPinned={has:id=>!!pins()[id],set:item=>pinItem(item)};
function xp(last){const x=+last.xp,m=+last.xpMax;if(!(m>0&&x>=0&&x<=m))return '<div class="binch-xp-missing"><b>XP non synchronisée</b><small>La Binch n’invente aucune valeur. Réinstalle l’addon puis fais /reload.</small></div>';return '<div class="binch-xp-line"><span>Expérience</span><b>'+x.toLocaleString('fr-FR')+' / '+m.toLocaleString('fr-FR')+'</b></div><div class="binch-xp-bar" role="progressbar" aria-valuemin="0" aria-valuemax="'+m+'" aria-valuenow="'+x+'"><i style="width:'+(x/m*100).toFixed(2)+'%"></i></div>'}
let cat='Toutes';
function mount(){
 const hub=$('page-hub');if(!hub||$('binch-adventure-home'))return;
 const root=document.createElement('section');root.id='binch-adventure-home';
 root.innerHTML='<section class="binch-character-card"><div class="binch-portrait"><span id="binch-race-glyph"></span><b id="binch-class-glyph"></b></div><div><div class="binch-kicker">CARNET D’AVENTURE</div><h1 id="binch-home-name"></h1><p id="binch-home-meta"></p><div id="binch-fresh"></div><div id="binch-home-xp"></div></div><div class="binch-level"><small>NIVEAU</small><strong id="binch-home-level"></strong><span id="binch-home-zone"></span></div></section>'+
 '<section id="binch-priority-guard" class="binch-priority-guard" aria-label="Objectifs épinglés"></section>'+
 '<section class="binch-route"><header><div><div class="binch-kicker">TA ROUTE, MAINTENANT</div><h2>Les prochaines étapes</h2><p>Épingle les étapes qui comptent, coche celles que tu termines. Une seule timeline pour tes objectifs.</p></div><div id="binch-route-count"></div></header><div class="binch-route-tools"><input id="binch-route-search" type="search" placeholder="Quête, donjon, métier, recette…"><div id="binch-route-filters"></div></div><div id="binch-route-list"></div></section>';
 hub.prepend(root);hub.classList.add('binch-adventure-ready');
 $('binch-route-search').oninput=renderRoute;
 enhanceProfile();
}
function renderRoute(){
 const p=profile(),natural=route(p),stored=pins(p),done=read(DONE+key(p));
 const all=natural.concat(Object.values(stored).filter(i=>i&&!natural.some(n=>n.id===i.id)))
   .sort((a,b)=>Number(a.n)-Number(b.n)||String(a.t).localeCompare(String(b.t),'fr'));
 const pinned=all.filter(i=>stored[i.id]);
 const cats=['Toutes','Épinglés',...new Set(all.map(i=>i.c))],query=$('binch-route-search').value.toLocaleLowerCase('fr');
 if(!cats.includes(cat))cat='Toutes';
 $('binch-route-filters').innerHTML=cats.map(c=>'<button class="'+(c===cat?'active':'')+'" data-cat="'+esc(c)+'">'+esc(c)+'</button>').join('');
 $('binch-route-filters').querySelectorAll('button').forEach(b=>b.onclick=()=>{cat=b.dataset.cat;renderRoute()});
 const selected=all.filter(i=>(cat==='Toutes'||(cat==='Épinglés'?!!stored[i.id]:i.c===cat))&&(!query||(i.t+' '+i.d+' '+i.c).toLocaleLowerCase('fr').includes(query)));
 $('binch-route-count').innerHTML='<b>'+pinned.filter(i=>!done[i.id]).length+'</b><span>épinglée(s) à faire</span>';
 const list=$('binch-route-list');
 list.innerHTML=selected.map((i,n)=>'<article class="binch-route-step '+esc(i.s||'next')+' cat-'+esc(i.c.toLocaleLowerCase('fr').replace(/[^a-z0-9]/g,'-'))+' '+(done[i.id]?'done':'')+' '+(stored[i.id]?'pinned':'')+'"><i>'+(done[i.id]?'✓':n+1)+'</i><div class="binch-route-task"><button class="binch-route-main" data-done="'+esc(i.id)+'" aria-pressed="'+!!done[i.id]+'"><small>'+esc(i.c)+' · niveau '+i.n+'</small><strong>'+esc(i.t)+'</strong><span>'+esc(i.d)+'</span><em>'+(done[i.id]?'↶ Marquer à faire':'✓ Marquer terminé')+'</em></button><button type="button" class="binch-route-pin" data-route-pin="'+esc(i.id)+'" aria-label="'+(stored[i.id]?'Désépingler ':'Épingler ')+esc(i.t)+'" aria-pressed="'+!!stored[i.id]+'" title="Épingler / désépingler">'+(stored[i.id]?'★':'☆')+'</button></div></article>').join('')||'<p class="binch-route-empty">Aucun résultat pour ce filtre.</p>';
 list.querySelectorAll('[data-done]').forEach(b=>b.onclick=()=>{
  const id=b.dataset.done;done[id]=!done[id];
  localStorage.setItem(DONE+key(p),JSON.stringify(done));
  document.dispatchEvent(new CustomEvent('binch:route-complete',{detail:{id,done:!!done[id]}}));renderRoute()
 });
 list.querySelectorAll('[data-route-pin]').forEach(b=>b.onclick=()=>{const i=all.find(i=>i.id===b.dataset.routePin);if(i)pinItem(i,p)});
 showGuard(p,all,done,stored);syncExternalButtons();
}
function render(){mount();if(!$('binch-adventure-home'))return;const p=profile(),last=read('grimoire.bridge.last'),age=last.updated?Date.now()-new Date(last.updated):Infinity,fresh=age<864e5?'Synchronisé aujourd’hui':age<7*864e5?'Import à actualiser':last.updated?'Import ancien':'Profil manuel';$('binch-home-name').textContent=p.name;$('binch-home-level').textContent=p.level;$('binch-home-zone').textContent=p.zone;$('binch-home-meta').textContent=[p.race,p.classe,p.data?.role].filter(Boolean).join(' · ');$('binch-race-glyph').textContent=glyph[p.race]||'◆';$('binch-class-glyph').textContent=glyph[p.classe]||'✦';$('binch-fresh').innerHTML='<span class="'+(age<864e5?'fresh':'')+'">● '+fresh+'</span><small>'+(last.updated?new Date(last.updated).toLocaleString('fr-FR'):'Aucun import WoW')+'</small>';$('binch-home-xp').innerHTML=xp(last);renderRoute()}
const start=()=>setTimeout(render,0);if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();document.addEventListener('grimoire:sync',render);
document.addEventListener('binch:pins-changed',()=>{if($('binch-route-list'))renderRoute()});
document.addEventListener('click',event=>{
 const btn=event.target.closest('[data-route-pin-external]');
 if(!btn)return;
 event.preventDefault();event.stopPropagation();
 const d=btn.dataset;
 const item={id:d.routePinExternal,n:Number(d.routeLevel)||profile().level,c:d.routeCategory||'Objectif',t:d.routeTitle||'Objectif à suivre',d:d.routeDescription||'',s:'next',source:d.routeSource||''};
 pinItem(item);
});
document.addEventListener('binch:external-complete',e=>{
 const p=profile(),done=read(DONE+key(p));if(!e.detail?.id)return;
 done[e.detail.id]=!!e.detail.done;
 localStorage.setItem(DONE+key(p),JSON.stringify(done));if($('binch-route-list'))renderRoute();
});
window.addEventListener('storage',render);
})();

/* La Binch · reminder on the command screen, with a single quest record in Secrets & incontournables. */
(()=>{'use strict';
const GUIDE='https://wow-forever.gg/guides/collections/cozy-sleeping-bag/';
const BUILD='https://www.icy-veins.com/wow-forever/feral-druid-leveling/';
const STORE='grimoire.hub.v3',QUEST='bag-quest',DONE='grimoire.discovery.done.v1';
const $=id=>document.getElementById(id);
function profile(){try{const p=JSON.parse(localStorage.getItem(STORE))||{};return {race:p.race||'',className:p.classe||'',name:String(p.data?.pseudo||'aventurier').trim().toLowerCase()}}catch{return {race:'',className:'',name:'aventurier'}}}
function key(){const p=profile();return DONE+'.'+p.name+'.'+p.race+'.'+p.className}
function marked(){try{return !!JSON.parse(localStorage.getItem(key()))?.[QUEST]}catch{return false}}
function setDone(done){
 try{const v=JSON.parse(localStorage.getItem(key()))||{};v[QUEST]=done;localStorage.setItem(key(),JSON.stringify(v))}catch{return}
 document.dispatchEvent(new CustomEvent('binch:route-complete',{detail:{id:'discovery:'+QUEST,done}}));paint();
}
function openDiscoveries(){
 const tab=document.querySelector('#app nav.nav [data-page="discoveries"]');tab?.click();
 const card=document.querySelector('#page-discoveries #discovery-all article');
 if(!tab)return;
 const filter=$('discovery-filter'),search=$('discovery-search');
 if(filter){filter.value='mine';filter.dispatchEvent(new Event('change',{bubbles:true}))}
 if(search){search.value='Old Toolbox';search.dispatchEvent(new Event('input',{bubbles:true}))}
 setTimeout(()=>{(document.querySelector('#page-discoveries .discovery-card h3')||card)?.scrollIntoView({block:'center',behavior:'smooth'})},110);
}
async function copy(value,button){
 try{await navigator.clipboard.writeText(value);button.textContent='Copié ✓';setTimeout(()=>button.textContent='Copier /way',1500)}
 catch{window.prompt('Copier les coordonnées',value)}
}
const locations=[
 ['Tarides, sud du camp Taurajo','/way #1413 46.1 74.3','Départ de la chaîne : dépouille calcinée.'],
 ['Marche de l’Ouest, ferme d’Alexston','/way #1436 37.3 50.4','Remettre la note et prendre Stepping Stones (territoire Alliance).'],
 ['Serres-Rocheuses, camp abandonné','/way #1442 40.6 52.4','Cliquer Pocket Litter : sac Old Toolbox 12 places.']
];
function paint(){
 const panel=$('binch-remember-bag');if(!panel)return;
 const done=marked(),p=profile(),badge=$('binch-remember-state');
 panel.classList.toggle('is-done',done);
 if(badge)badge.textContent=done?'Terminé (marquage manuel)':'À faire dès le niveau 14';
 const button=$('binch-remember-done');if(button)button.textContent=done?'↩ Replacer dans mes objectifs':'✓ Marquer terminé';
 const profileNote=$('binch-remember-profile');if(profileNote)profileNote.textContent=p.race==='Tauren'?'Itinéraire pour ton Tauren (Horde).':'Itinéraire Horde / Tauren ; la Horde démarre aux Tarides.';
}
function mount(){
 if($('binch-remember-bag'))return;
 const home=$('page-hub');if(!home)return;
 const panel=document.createElement('section');panel.id='binch-remember-bag';panel.className='binch-remember-bag panel section';
 panel.innerHTML='<header class="binch-remember-head"><div><div class="eyebrow">NE PAS OUBLIER · INCONTOURNABLES</div><h2>Sac 12 places gratuit dès le niveau 14</h2><p id="binch-remember-profile">Tauren · Horde</p></div><strong id="binch-remember-state">À faire dès le niveau 14</strong></header><p>La chaîne cachée du <strong>Cozy Sleeping Bag</strong> donne à la Horde l’<strong>Old Toolbox (12 emplacements)</strong> dès la quête <em>Stepping Stones</em>. Tu peux poursuivre ensuite pour le sac de couchage et son bonus XP.</p><details id="binch-remember-details"><summary>Mini-guide du trajet Tauren (3 étapes pour le sac)</summary><ol>'+locations.map(x=>'<li><strong>'+x[0]+'</strong><small>'+x[2]+'</small><div class="binch-remember-copy"><code>'+x[1]+'</code><button type="button" data-way="'+x[1]+'">Copier /way</button></div></li>').join('')+'</ol><p>Attention : trajet intercontinental et zone Alliance potentiellement dangereuse à bas niveau. La chaîne est accessible dès le niveau 14.</p></details><div class="binch-remember-actions"><button id="binch-remember-open" type="button">Voir dans Secrets & incontournables</button><button id="binch-remember-done" type="button">✓ Marquer terminé</button><a href="'+GUIDE+'" target="_blank" rel="noopener noreferrer">Guide détaillé</a><a href="'+BUILD+'" target="_blank" rel="noopener noreferrer">Mon build druide farouche pex ↗</a></div>';
 // Place above other home cards while respecting the command-style hero.
 const front=$('binch-front');
 if(front)front.after(panel);else home.prepend(panel);
 $('binch-remember-open').onclick=openDiscoveries;
 $('binch-remember-done').onclick=()=>setDone(!marked());
 panel.addEventListener('click',e=>{const btn=e.target.closest('button[data-way]');if(btn)copy(btn.dataset.way,btn)});
 document.addEventListener('binch:route-complete',e=>{if(e.detail?.id==='discovery:'+QUEST)paint()});
 document.addEventListener('binch:external-complete',e=>{if(e.detail?.id==='discovery:'+QUEST)paint()});
 window.addEventListener('storage',e=>{if(!e.key||e.key.startsWith(DONE)||e.key===STORE)paint()});
 paint();
}
function start(){if(mount())return;const root=$('app');if(!root)return;const mo=new MutationObserver(()=>{if(mount())mo.disconnect()});mo.observe(root,{childList:true,subtree:true});setTimeout(()=>mo.disconnect(),12000)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
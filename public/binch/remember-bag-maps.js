/* La Binch — actual WoW Forever zone map illustrations for the Horde bag route.
   Map artwork is linked from the Forever atlas, not generated or re-drawn. */
(()=>{'use strict';
const $=id=>document.getElementById(id);
const maps=[
 {zone:'Les Tarides',subtitle:'1. Départ au sud du camp Taurajo',x:46.1,y:74.3,way:'/way #1413 46.1 74.3',img:'https://assets.wow-forever.gg/maps/wow_classic_beta/17.png?v=8a20388fbb'},
 {zone:'Marche de l’Ouest',subtitle:'2. Chariot brûlé de la ferme d’Alexston',x:37.3,y:50.4,way:'/way #1436 37.3 50.4',img:'https://assets.wow-forever.gg/maps/wow_classic_beta/40.png?v=952aa8539a'},
 {zone:'Serres-Rocheuses',subtitle:'3. Camp de Pocket Litter : Old Toolbox',x:40.6,y:52.4,way:'/way #1442 40.6 52.4',img:'https://assets.wow-forever.gg/maps/wow_classic_beta/406.png?v=3dc6cedef3'}
];
let active=0;
function paint(){
 const root=$('binch-bag-game-map');if(!root)return;
 const m=maps[active];
 root.querySelectorAll('[data-bag-map-tab]').forEach((b,i)=>{b.setAttribute('aria-selected',String(i===active));b.tabIndex=i===active?0:-1});
 const img=$('binch-bag-map-image'),pin=$('binch-bag-map-pin');
 img.src=m.img;img.alt='Véritable carte WoW Forever : '+m.zone;
 pin.style.left=m.x+'%';pin.style.top=m.y+'%';pin.title=m.zone+' · '+m.x+', '+m.y;
 $('binch-bag-map-caption').textContent=m.subtitle;
 $('binch-bag-map-coord').textContent=m.way;
 $('binch-bag-map-status').textContent='Fond de carte du jeu, repère superposé selon les coordonnées publiées. Le placement peut varier légèrement selon le guide.';
}
async function copy(){
 const b=$('binch-bag-map-copy'),way=maps[active].way;
 try{await navigator.clipboard.writeText(way);b.textContent='Copié ✓';setTimeout(()=>b.textContent='Copier le /way',1600)}
 catch{window.prompt('Copier les coordonnées',way)}
}
function mount(){
 if($('binch-bag-game-map'))return true;
 const panel=$('binch-remember-bag');if(!panel)return false;
 const root=document.createElement('section');root.id='binch-bag-game-map';root.className='binch-bag-game-map';
 root.innerHTML='<header><div><strong>Cartes du jeu · quête du sac 12 places</strong><p>Les trois zones de ton trajet Horde, sur les véritables cartes WoW utilisées par l’atlas Forever.</p></div></header><div class="binch-bag-map-tabs" role="tablist" aria-label="Choisir une étape">'+maps.map((m,i)=>'<button type="button" role="tab" data-bag-map-tab="'+i+'" aria-selected="'+(i===0)+'">'+(i+1)+'. '+m.zone+'</button>').join('')+'</div><figure class="binch-bag-map-figure"><div class="binch-bag-map-crop"><img id="binch-bag-map-image" loading="lazy" alt=""><span id="binch-bag-map-pin" aria-hidden="true">✦</span></div><figcaption><strong id="binch-bag-map-caption"></strong><div class="binch-bag-map-copy"><code id="binch-bag-map-coord"></code><button type="button" id="binch-bag-map-copy">Copier le /way</button></div><small id="binch-bag-map-status"></small></figcaption></figure><p class="binch-bag-map-credit">Cartes du client WoW Classic publiées via <a href="https://wow-forever.gg/guides/collections/cozy-sleeping-bag/" target="_blank" rel="noopener noreferrer">l’atlas WoW Forever</a> · illustrations de jeu © Blizzard. Les repères sont indicatifs, les commandes /way restent les références.</p>';
 const guide=$('binch-remember-details');if(guide)guide.after(root);else panel.append(root);
 root.querySelectorAll('[data-bag-map-tab]').forEach(b=>b.addEventListener('click',()=>{active=Number(b.dataset.bagMapTab);paint()}));
 $('binch-bag-map-copy').addEventListener('click',copy);
 const img=$('binch-bag-map-image');img.addEventListener('error',()=>{$('binch-bag-map-status').textContent='Carte externe inaccessible : utilise le /way ou ouvre le guide source.'});
 paint();return true;
}
function start(){if(mount())return;const app=$('app');if(!app)return;const mo=new MutationObserver(()=>{if(mount())mo.disconnect()});mo.observe(app,{childList:true,subtree:true});setTimeout(()=>mo.disconnect(),12000)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
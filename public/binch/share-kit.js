(()=>{
'use strict';
const URL='https://quentindumont70-bit.github.io/chroniques-cendreval/binch/',VERSION='Bêta 0.8 · 8 novembre 2026',$=s=>document.querySelector(s);
const syncStyle=document.createElement('link');syncStyle.rel='stylesheet';syncStyle.href='./sync-wizard.css';document.head.append(syncStyle);const wizard=document.createElement('script');wizard.src='./sync-wizard.js';wizard.defer=true;document.head.append(wizard);
const lfgStyle=document.createElement('link');lfgStyle.rel='stylesheet';lfgStyle.href='./lfg.css';document.head.append(lfgStyle);const lfgScript=document.createElement('script');lfgScript.src='./lfg.js';lfgScript.defer=true;document.head.append(lfgScript);
const css=document.createElement('link');css.rel='stylesheet';css.href='./share-kit.css';document.head.append(css);
const placement=document.createElement('script');placement.src='./sync-placement.js';placement.defer=true;document.head.append(placement);
const gm=document.createElement('script');gm.src='./gm-quick.js';gm.defer=true;document.head.append(gm);
async function copy(text,button){try{await navigator.clipboard.writeText(text);button.textContent='Copié ✓';setTimeout(()=>button.textContent='Copier le lien',1800)}catch{prompt('Copie ce lien :',text)}}
function mount(){const home=$('#binch-adventure-home')||$('#page-hub');if(!home||$('#binch-share-kit'))return;const box=document.createElement('section');box.id='binch-share-kit';box.innerHTML='<div><span>PRÊT POUR LA GUILDE</span><h2>Ouvre, choisis ton personnage, pars à l’aventure.</h2><p>La Binch fonctionne sans compte. GrimoireSync reste facultatif et sert uniquement à importer les données locales autorisées.</p><div class="binch-share-version">'+VERSION+' · Hébergé indépendamment sur GitHub Pages</div></div><ol><li><b>1</b><span>Ouvre le lien et crée ton profil.</span></li><li><b>2</b><span>Explore la route, l’équipement et les outils.</span></li><li><b>3</b><span>Pour synchroniser WoW, suis l’onglet dédié.</span></li></ol><div class="binch-share-actions"><button type="button" id="binch-share-copy">Copier le lien</button><a href="'+URL+'" target="_blank" rel="noopener">Ouvrir la bêta ↗</a></div>';home.append(box);$('#binch-share-copy').onclick=e=>copy(URL,e.currentTarget)}
const start=()=>setTimeout(mount,0);if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();

(()=>{
'use strict';
const URL='https://quentindumont70-bit.github.io/chroniques-cendreval/binch/',VERSION='Bêta 0.17 · 8 novembre 2026',$=s=>document.querySelector(s);
const syncStyle=document.createElement('link');syncStyle.rel='stylesheet';syncStyle.href='./sync-wizard.css';document.head.append(syncStyle);const wizard=document.createElement('script');wizard.src='./sync-wizard.js';wizard.defer=true;document.head.append(wizard);
const lfgStyle=document.createElement('link');lfgStyle.rel='stylesheet';lfgStyle.href='./lfg.css';document.head.append(lfgStyle);const lfgScript=document.createElement('script');lfgScript.src='./lfg.js';lfgScript.defer=true;document.head.append(lfgScript);
const procStyle=document.createElement('link');procStyle.rel='stylesheet';procStyle.href='./true-procs.css';document.head.append(procStyle);const procScript=document.createElement('script');procScript.src='./true-procs.js';procScript.defer=true;document.head.append(procScript);
const intendantStyle=document.createElement('link');intendantStyle.rel='stylesheet';intendantStyle.href='./intendant.css';document.head.append(intendantStyle);const intendantScript=document.createElement('script');intendantScript.src='./intendant.js';intendantScript.defer=true;document.head.append(intendantScript);
const navStyle=document.createElement('link');navStyle.rel='stylesheet';navStyle.href='./nav-scroll.css';document.head.append(navStyle);const navScript=document.createElement('script');navScript.src='./nav-scroll.js';navScript.defer=true;document.head.append(navScript);
const categoryStyle=document.createElement('link');categoryStyle.rel='stylesheet';categoryStyle.href='./category-colors.css';document.head.append(categoryStyle);const performanceStyle=document.createElement('link');performanceStyle.rel='stylesheet';performanceStyle.href='./performance-guard.css';document.head.append(performanceStyle);
const premiumNavStyle=document.createElement('link');premiumNavStyle.rel='stylesheet';premiumNavStyle.href='./navigation-premium.css';document.head.append(premiumNavStyle);
const revealStyle=document.createElement('link');revealStyle.rel='stylesheet';revealStyle.href='./treasure-reveal.css';document.head.append(revealStyle);
const css=document.createElement('link');css.rel='stylesheet';css.href='./share-kit.css';document.head.append(css);
const placement=document.createElement('script');placement.src='./sync-placement.js';placement.defer=true;document.head.append(placement);
const plannerCss=document.createElement('link');plannerCss.rel='stylesheet';plannerCss.href='./guild-planner.css';document.head.append(plannerCss);const plannerJs=document.createElement('script');plannerJs.src='./guild-planner.js';plannerJs.defer=true;document.head.append(plannerJs);
const soundtrackStyle=document.createElement('link');soundtrackStyle.rel='stylesheet';soundtrackStyle.href='./soundscape.css';document.head.append(soundtrackStyle);const soundtrack=document.createElement('script');soundtrack.src='./soundscape.js';soundtrack.defer=true;document.head.append(soundtrack);
const quoteStyle=document.createElement('link');quoteStyle.rel='stylesheet';quoteStyle.href='./daily-quotes.css';document.head.append(quoteStyle);const quotes=document.createElement('script');quotes.src='./daily-quotes.js';quotes.defer=true;document.head.append(quotes);
const gm=document.createElement('script');gm.src='./gm-quick.js';gm.defer=true;document.head.append(gm);
async function copy(text,button){try{await navigator.clipboard.writeText(text);button.textContent='Copié ✓';setTimeout(()=>button.textContent='Copier le lien',1800)}catch{prompt('Copie ce lien :',text)}}
function mount(){
 const home=$('#binch-adventure-home')||$('#page-hub');if(!home||$('#binch-share-kit'))return;
 const box=document.createElement('aside');box.id='binch-share-kit';box.className='binch-share-compact';
 box.innerHTML='<div><span>LA BINCH · INVITER SA GUILDE</span><h2>Un compagnon mérite d’autres compagnons.</h2><p>Partage le portail avec la guilde. Aucun compte n’est requis pour le guide.</p><small class="binch-share-version">'+VERSION+' · GitHub Pages</small></div><div class="binch-share-actions"><button type="button" id="binch-share-copy">Copier le lien de la guilde</button></div>';
 home.append(box);$('#binch-share-copy').onclick=e=>copy(URL,e.currentTarget);
}
const start=()=>setTimeout(mount,0);if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();

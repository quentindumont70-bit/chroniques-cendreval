/* La Binch — portfolio marchand V2 : synthèse FIFO locale, sans données AH externes. */
(()=>{'use strict';
const MARKET='binch.ah.market.v1',SCOPE='binch.ah.scope.v1',$=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
const read=(key,f)=>{try{return JSON.parse(localStorage.getItem(key))??f}catch{return f}};
const coin=c=>{let n=Math.round(c),sign=n<0?'-':'';n=Math.abs(n);return sign+Math.floor(n/10000)+'o '+Math.floor(n%10000/100)+'a '+n%100+'c'};
let show='all',focus='all';
const display=e=>{let name=e.item||'';return String(name).length>90?String(name).slice(0,90):name};
function calculate(){
 const source=read(MARKET,{}),core=window.BinchAHPortfolio;if(!core)return null;
 const rows=Array.isArray(source.trades)?source.trades:[];
 return core.ledger(rows,source.fee??5);
}
function render(){
 const root=$('binch-ah-portfolio');if(!root)return;
 const summary=calculate();if(!summary){root.textContent='Module de calcul marchand indisponible.';return}
 const scope=read(SCOPE,{}),sid=scope.realm&&['Horde','Alliance'].includes(scope.faction)?String(scope.realm).trim().toLocaleLowerCase('fr')+'|'+scope.faction:'legacy';
 const current=$('binch-ah-portfolio-scope'),wanted=current?.value||'all';
 const positions=summary.positions.filter(p=>(wanted==='all'||p.market===wanted)&&(show==='all'||(show==='stock'?p.remaining>0:show==='uncertain'?p.unmatched>0:p.realized!==0)));
 const sales=summary.sales.filter(p=>wanted==='all'||p.market===wanted);
 const knownRealized=sales.reduce((n,s)=>n+s.margin,0),unmatched=sales.reduce((n,s)=>n+s.unmatched,0);
 const stock=positions.reduce((n,p)=>n+p.carryingCost,0),units=positions.reduce((n,p)=>n+p.remaining,0);
 $('binch-ah-portfolio-kpis').innerHTML='<article><small>Résultat réalisé documenté</small><strong>'+coin(knownRealized)+'</strong><span>Ventes rapprochées d’achats saisis</span></article>'+
 '<article><small>Stock restant au coût d’achat</small><strong>'+coin(stock)+'</strong><span>'+units+' unités tracées</span></article>'+
 '<article><small>Unités vendues sans achat documenté</small><strong>'+unmatched+'</strong><span>Coût inconnu : bénéfice non calculé</span></article>';
 $('binch-ah-portfolio-count').textContent=positions.length+' ligne(s) d’objets · '+sales.length+' vente(s) saisie(s) · '+summary.invalid.length+' ligne(s) invalide(s) ignorée(s) · taux de commission utilisé : '+summary.fee+' %';
 $('binch-ah-portfolio-rows').innerHTML=positions.length?positions.map(p=>
  '<article class="binch-ah-portfolio-row"><div><strong>'+esc(display(p))+'</strong><small>'+esc(p.market==='legacy'?'Marché ancien non attribué':p.market)+'</small></div><div><small>Stock déclaré</small><strong>'+p.remaining+' unité(s)</strong><span>'+coin(p.carryingCost)+' au coût d’achat</span></div><div><small>Résultat réalisé documenté</small><strong>'+coin(p.realized)+'</strong><span>'+(p.unmatched?p.unmatched+' vente(s) sans coût connu':'Aucune vente sans achat documenté')+'</span></div></article>').join(''):'<p>Aucune position correspondant aux filtres.</p>';
 $('binch-ah-portfolio-sales').innerHTML=sales.length?sales.slice().reverse().slice(0,30).map(x=>
  '<article><strong>'+esc(display(x))+'</strong><span>'+x.matched+' / '+x.qty+' unités rapprochées · marge documentée '+coin(x.margin)+(x.unmatched?' · '+x.unmatched+' coût(s) inconnus':'')+'</span></article>').join(''):'<p>Aucune vente déclarée pour ce marché.</p>';
 const markets=[...new Set(summary.positions.map(x=>x.market))].sort();
 const previous=$('binch-ah-portfolio-scope').value;
 $('binch-ah-portfolio-scope').innerHTML='<option value="all">Tous marchés (sans les mélanger)</option>'+markets.map(x=>'<option value="'+esc(x)+'">'+esc(x==='legacy'?'Non attribué (ancien)':x)+'</option>').join('');
 $('binch-ah-portfolio-scope').value=markets.includes(previous)?previous:'all';
 const trackedScope=$('binch-ah-portfolio-current');if(trackedScope)trackedScope.textContent='Marché affiché dans la Bourse : '+(sid==='legacy'?'non identifié':sid)+'. Le portefeuille sépare toujours les marchés renseignés et anciens.';
}
function mount(){
 const base=$('page-market');if(!base||$('binch-ah-portfolio'))return;
 const target=base.querySelector('.binch-ah');if(!target)return;
 const section=document.createElement('section');section.id='binch-ah-portfolio';section.className='binch-ah-portfolio';
 section.innerHTML='<div class="eyebrow">BOURSE D’AZEROTH · PORTEFEUILLE MARCHAND</div><h2>Résultats d’achat–revente (FIFO)</h2><p>Les achats sont consommés du plus ancien au plus récent. Une vente sans achat enregistré reste de coût inconnu : elle ne devient jamais un bénéfice fictif. Les montants dépendent des transactions que tu déclares, pas des ventes réelles du serveur.</p><div class="binch-ah-portfolio-filters"><label>Marché<select id="binch-ah-portfolio-scope"><option value="all">Tous marchés</option></select></label><label>Afficher<select id="binch-ah-portfolio-filter"><option value="all">Tous les objets</option><option value="stock">Stock restant</option><option value="uncertain">Ventes non rapprochées</option><option value="realized">Résultat constaté</option></select></label><button type="button" id="binch-ah-portfolio-refresh">Actualiser les calculs</button></div><small id="binch-ah-portfolio-current"></small><div id="binch-ah-portfolio-kpis"></div><p id="binch-ah-portfolio-count"></p><div id="binch-ah-portfolio-rows"></div><details><summary>Ventes rapprochées (maximum 30 dernières)</summary><div id="binch-ah-portfolio-sales"></div></details><p class="binch-ah-portfolio-note">Méthode : FIFO par objet et marché déclaré. Commission appliquée aux ventes, avec le taux actuellement indiqué dans la Bourse. Les frais de dépôt, les taxes supplémentaires et les objets obtenus gratuitement ne sont pas inférés. Les transactions anciennes sans royaume restent séparées.</p>';
 const footer=target.querySelector(':scope > footer');if(footer)footer.before(section);else target.append(section);
 $('binch-ah-portfolio-refresh').onclick=render;
 $('binch-ah-portfolio-filter').onchange=e=>{show=e.target.value;render()};
 $('binch-ah-portfolio-scope').onchange=render;
 base.addEventListener('submit',e=>{if(e.target.closest('#binch-ah-trade-form'))setTimeout(render,0)});
 base.addEventListener('click',e=>{if(e.target.closest('[data-ah-trade-delete]'))setTimeout(render,0)});
 document.querySelector('#app nav.nav [data-page="market"]')?.addEventListener('click',render);
 window.addEventListener('storage',e=>{if(e.key===MARKET||e.key===SCOPE)render()});
 render();
}
const start=()=>setTimeout(mount,0);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
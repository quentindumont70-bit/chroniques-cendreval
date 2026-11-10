/* La Binch · Bourse V3 — statistical market radar. Read-only local AH observations. 
 Every recommendation is attributed, timestamped and may be explicitly "insufficient". */
(()=>{'use strict';
const $=id=>document.getElementById(id),KEY='binch.ah.market.v1',SCOPE='binch.ah.scope.v1';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const read=(k,f)=>{try{return JSON.parse(localStorage.getItem(k))??f}catch{return f}};
const coin=n=>{let x=Math.round(n),sign=x<0?'-':'';x=Math.abs(x);return sign+Math.floor(x/10000)+'o '+Math.floor(x%10000/100)+'a '+x%100+'c'};
const ago=s=>{const t=Date.parse(s);if(!Number.isFinite(t))return 'sans date';const h=Math.floor((Date.now()-t)/3600000);return h<1?'moins d’une heure':h+' h'};
const median=a=>{const s=a.slice().sort((x,y)=>x-y);return s.length?(s.length%2?s[(s.length-1)/2]:(s[s.length/2-1]+s[s.length/2])/2):null};
const scope=()=>{const s=read(SCOPE,{});return s.realm&&['Horde','Alliance'].includes(s.faction)?String(s.realm).trim().toLocaleLowerCase('fr')+'|'+s.faction:'legacy'};
const validPrice=v=>Number.isSafeInteger(Number(v))&&Number(v)>0&&Number(v)<1e12;
let filter='all',search='';
function stats(item){
 const rows=Array.isArray(item.history)?item.history.filter(x=>validPrice(x.price)&&Number.isFinite(Date.parse(x.at))&&Date.parse(x.at)<=Date.now()+3600000).slice().sort((a,b)=>String(a.at).localeCompare(String(b.at))).slice(-120):[];
 const values=rows.map(x=>Number(x.price)),mid=median(values),last=rows[rows.length-1],unit=last?Number(last.price):null;
 const age=last?Date.now()-Date.parse(last.at):Infinity;
 const deviation=values.length>=3?median(values.map(x=>Math.abs(x-mid))):null;
 const discount=mid&&unit?100*(mid-unit)/mid:null;
 const breadth=new Set(rows.map(x=>String(x.at).slice(0,10))).size;
 const reliable=rows.length>=5&&breadth>=3&&age<=86400000;
 const label=!rows.length?'Aucune observation':age>86400000?'Relevé ancien':!reliable?'Échantillon limité':'Échantillon suivi';
 const erratic=mid>0&&deviation!=null?100*deviation/mid:null;
 const signal=reliable&&discount>15&&erratic!=null&&erratic<40?'Prix inférieur à l’historique (étude possible)':reliable&&discount < -15?'Prix supérieur à l’historique':'Aucune opportunité suffisamment étayée';
 return {rows,mid,last,unit,age,deviation,discount,breadth,reliable,label,signal,erratic};
}
function chart(rows){
 if(rows.length<2)return '<p class="binch-ah-trend-empty">Au moins deux relevés datés sont nécessaires pour tracer une évolution.</p>';
 const n=rows.length,values=rows.map(x=>Number(x.price)),min=Math.min(...values),max=Math.max(...values),delta=max-min||1;
 const pts=rows.map((r,i)=>({x:Math.round(12+((i)/(n-1))*476),y:Math.round(105-(Number(r.price)-min)/delta*86)}));
 const poly=pts.map(p=>p.x+','+p.y).join(' ');
 return '<svg role="img" aria-label="Évolution du prix observé de '+n+' relevés, de '+coin(values[0])+' à '+coin(values[n-1])+'" viewBox="0 0 500 126" preserveAspectRatio="none"><line x1="12" y1="105" x2="488" y2="105" stroke="#63755e" stroke-width="1"/><polyline fill="none" stroke="#edc17e" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" points="'+poly+'"/>'+pts.map(p=>'<circle cx="'+p.x+'" cy="'+p.y+'" r="3" fill="#f3deae"/>').join('')+'</svg><div class="binch-ah-trend-axis"><span>'+coin(values[0])+' · '+esc(rows[0].at.slice(0,10))+'</span><span>'+coin(values[n-1])+' · '+esc(rows[n-1].at.slice(0,10))+'</span></div>';
}
function render(){
 const host=$('binch-ah-insights');if(!host||!host.isConnected)return;
 const sid=scope(),data=read(KEY,{}),items=Array.isArray(data.items)?data.items.filter(x=>(x.scope||'legacy')===sid):[];
 const pairs=items.map(item=>({item,s:stats(item)})).filter(x=>!search||String(x.item.name).toLocaleLowerCase('fr').includes(search));
 const candidates=pairs.filter(x=>x.s.reliable&&x.s.discount>15).sort((a,b)=>b.s.discount-a.s.discount);
 const rows=filter==='opportunities'?candidates:filter==='stale'?pairs.filter(x=>x.s.age>86400000):filter==='history'?pairs.filter(x=>x.s.rows.length>=5):pairs;
 $('binch-ah-insights-status').textContent=items.length+' objet(s) dans '+(sid==='legacy'?'le registre ancien non attribué':sid)+' · '+candidates.length+' signal(s) statistiques · zéro prix inventé';
 const list=$('binch-ah-insights-list');
 list.innerHTML=rows.length?rows.slice().sort((a,b)=>b.s.age<86400000&&a.s.age>86400000?1:a.s.age<86400000&&b.s.age>86400000?-1:(b.s.discount??-999)-(a.s.discount??-999)).slice(0,80).map(({item,s})=>
 '<article class="binch-ah-insight-card"><div><strong>'+esc(item.name)+'</strong><small>'+esc(s.label)+' · '+s.rows.length+' relevés sur '+s.breadth+' jours distincts</small><small>Source dernier relevé : '+esc(s.last?.source||item.source||'inconnue')+' · '+ago(s.last?.at||item.observedAt)+'</small></div><div class="binch-ah-insight-number"><strong>'+(s.unit?coin(s.unit):'—')+'</strong><small>Médiane '+(s.mid?coin(s.mid):'—')+' · écart '+(Number.isFinite(s.discount)?s.discount.toFixed(1)+' %':'—')+'</small></div><button type="button" data-ah-insight="'+esc(item.key)+'">Historique</button></article>').join(''):'<p>Pas de résultat. Un signal nécessite au moins cinq observations sur trois dates distinctes, dont une récente.</p>';
 const old=$('binch-ah-insights-detail').dataset.key||'';
 if(old){const picked=pairs.find(x=>x.item.key===old);if(picked)detail(picked);else $('binch-ah-insights-detail').replaceChildren()}
}
function detail(pair){
 const {item,s}=pair;
 const node=$('binch-ah-insights-detail');node.dataset.key=item.key;
 node.innerHTML='<h3>'+esc(item.name)+'</h3><p><strong>'+esc(s.signal)+'</strong></p><div class="binch-ah-trend-chart">'+chart(s.rows)+'</div><p>Médiane : '+(s.mid?coin(s.mid):'inconnue')+'. Dispersion médiane : '+(Number.isFinite(s.erratic)?s.erratic.toFixed(1)+' %':'insuffisante')+'. '+s.rows.length+' prix relevés, '+s.breadth+' jours différents.</p><p>Cette analyse compare des annonces observées, pas des ventes réalisées. La liquidité, les volumes vendus et les taxes supplémentaires sont inconnus.</p>';
}
function mount(){
 const page=$('page-market'),container=page?.querySelector('.binch-ah');if(!container||$('binch-ah-insights'))return;
 const box=document.createElement('section');box.className='binch-ah-insights';box.id='binch-ah-insights';
 box.innerHTML='<header><div><span class="eyebrow">BOURSE / ANALYSE QUANTITATIVE</span><h2>Radar des prix d’Azeroth</h2><p>Courbes et signaux issus exclusivement des relevés du carnet local. Les données insuffisantes ne produisent pas de conseil d’achat.</p></div><button id="binch-ah-insights-refresh" type="button">Actualiser les signaux</button></header><div class="binch-ah-insights-controls"><label>Objet<input type="search" id="binch-ah-insights-query" placeholder="Chercher un objet"></label><label>Fiabilité<select id="binch-ah-insights-filter"><option value="all">Tous</option><option value="opportunities">Prix sous médiane suivie</option><option value="history">Historique suffisant</option><option value="stale">Relevés périmés</option></select></label></div><p id="binch-ah-insights-status"></p><div id="binch-ah-insights-list"></div><div id="binch-ah-insights-detail" aria-live="polite"></div><p class="binch-ah-insights-foot">Méthode : au moins 5 relevés sur 3 dates et moins de 24 h pour parler d’un signal. Seuil de réduction indicatif 15 %, dispersion médiane inférieure à 40 %. Aucun achat automatique, prix live ni bénéfice garanti.</p>';
 const footer=container.querySelector(':scope > footer');if(footer)footer.before(box);else container.append(box);
 $('binch-ah-insights-query').oninput=e=>{search=e.target.value.toLocaleLowerCase('fr').trim().slice(0,80);render()};
 $('binch-ah-insights-filter').onchange=e=>{filter=e.target.value;render()};
 $('binch-ah-insights-refresh').onclick=render;
 $('binch-ah-insights-list').onclick=e=>{const b=e.target.closest('[data-ah-insight]');if(!b)return;const data=read(KEY,{}),item=(data.items||[]).find(x=>x.key===b.dataset.ahInsight);if(item)detail({item,s:stats(item)})};
 page.addEventListener('submit',e=>{if(e.target.closest('#binch-ah-add'))setTimeout(render,0)});
 page.addEventListener('click',e=>{if(e.target.closest('[data-ah-select]'))setTimeout(render,0)});
 document.querySelector('#app nav.nav [data-page="market"]')?.addEventListener('click',render);
 window.addEventListener('storage',e=>{if([KEY,SCOPE].includes(e.key))render()});
 render();
}
const start=()=>setTimeout(mount,0);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
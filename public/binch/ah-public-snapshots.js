/* La Binch — optional read-only AH snapshot viewer for auctionhouse.fyi.
   No login or key. Only explicit requests. Never merges community prices into manual ledgers.
   Public data = player-reported hourly snapshot, NOT real-time trade execution. */
(()=>{'use strict';
const BASE='https://auctionhouse.fyi/api/v1/ah/';
const MARKETS=['forever.normal.horde.us','forever.normal.alliance.us','forever.pvp.horde.us','forever.pvp.alliance.us','forever.rp.horde.us','forever.rp.alliance.us'];
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const coin=n=>{let p=Math.round(n);return Math.floor(p/10000)+'o '+Math.floor(p%10000/100)+'a '+p%100+'c'};
const time=t=>Number.isFinite(t)&&t>1e12?new Date(t).toLocaleString('fr-FR'):'Horodatage indisponible';
let last=null;
async function read(market,item){
 if(!MARKETS.includes(market)||!Number.isSafeInteger(item)||item<1)throw Error('Marché ou identifiant d’objet invalide.');
 const ctrl=new AbortController(),id=setTimeout(()=>ctrl.abort(),11000);
 try{
  const res=await fetch(BASE+market+'/'+item,{signal:ctrl.signal,headers:{Accept:'application/json'},cache:'no-store'});
  if(!res.ok)throw Error('Service distant HTTP '+res.status);
  const data=await res.json();
  if(data.market!==market||Number(data.item)!==item||!Array.isArray(data.row)&&data.row!==null)throw Error('Réponse de marché inattendue.');
  const row=data.row;
  if(row!==null&&(!Array.isArray(row)||row.length<3||row[0]!==null&&!Number.isSafeInteger(row[0])||row[0]<0||row[1]!==null&&!Number.isSafeInteger(row[1])||!Number.isFinite(row[2])))throw Error('Prix / date invalides.');
  return {market,item,row,live:data.live===true,now:Number(data.now)||null};
 }finally{clearTimeout(id)}
}
function show(result){
 const output=$('binch-ah-public-result');if(!output)return;
 if(!result.row){output.innerHTML='<p>Aucun relevé disponible pour cet objet sur ce marché. Ce n’est pas la preuve que l’objet est absent des ventes actuelles.</p>';return}
 const [price,quantity,at]=result.row,age=Date.now()-at;
 const ageInfo=age<0?'horloge distante en avance':Math.round(age/60000)+' minutes';
 const label=Number.isSafeInteger(price)?coin(price):'Aucun prix de liste dans ce relevé';
 output.innerHTML='<div class="binch-ah-public-metrics"><div><small>Prix unitaire observé</small><strong>'+esc(label)+'</strong></div><div><small>Quantité listée</small><strong>'+(quantity===null?'Inconnue':quantity)+'</strong></div><div><small>Actualisation</small><strong>'+esc(ageInfo)+'</strong></div></div><p>Marché : '+esc(result.market)+' · Objet #'+result.item+'. Observation : '+esc(time(at))+'. Mode '+(result.live?'live déclaré par la source':'instantané horaire public')+'.</p><p>Les prix sont rapportés par des joueurs et ne prouvent ni vente réalisée ni rentabilité. Ne pas confondre prix affiché et cours négociable.</p>';
}
function mount(){
 const page=$('page-market'),container=page?.querySelector('.binch-ah');if(!container||$('binch-ah-public'))return;
 const section=document.createElement('section');section.id='binch-ah-public';section.className='binch-ah-public';
 section.innerHTML='<header><span class="eyebrow">BOURSE / MARCHÉS COMMUNAUTAIRES</span><h2>Consultation des cours publics Forever</h2><p>Interroge manuellement un relevé joueur hébergé par auctionhouse.fyi. Pas de compte requis pour cette consultation. Le serveur peut être indisponible ou refuser les requêtes navigateur.</p></header><form id="binch-ah-public-form"><label>Marché exact<select id="binch-ah-public-market">'+MARKETS.map(x=>'<option value="'+x+'">'+x.replace('forever.','').replaceAll('.',' · ')+'</option>').join('')+'</select></label><label>Identifiant d’objet WoW<input id="binch-ah-public-item" type="number" min="1" max="9007199254740991" step="1" placeholder="Ex. 2589" required></label><button type="submit">Lire le dernier relevé</button></form><p id="binch-ah-public-result" role="status">Choisis un marché et un identifiant d’objet. Les prix communautaires restent séparés de tes observations manuelles.</p><p class="binch-ah-public-source">Source : <a href="https://auctionhouse.fyi/docs/api/quickstart" target="_blank" rel="noopener noreferrer">Documentation de l’API communautaire</a> · public sans clé · 6 marchés US documentés · relevés horaires. Aucune donnée européenne supposée, aucune clé exposée.</p>';
 const footer=container.querySelector(':scope > footer');if(footer)footer.before(section);else container.append(section);
 $('binch-ah-public-form').onsubmit=async e=>{
  e.preventDefault();const market=$('binch-ah-public-market').value,item=Number($('binch-ah-public-item').value),out=$('binch-ah-public-result');
  out.textContent='Consultation distante en cours…';
  try{last=await read(market,item);show(last)}
  catch(error){out.innerHTML='<p>Relevé impossible à récupérer : '+esc(error.name==='AbortError'?'Délai dépassé':error.message)+'. Le carnet local reste utilisable. <a href="https://auctionhouse.fyi/markets" target="_blank" rel="noopener noreferrer">Consulter les marchés sur le site source</a>.</p>'}
 };
}
const start=()=>setTimeout(mount,0);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
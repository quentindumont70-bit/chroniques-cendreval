/* La Binch — Bourse d'Azeroth V1. Local observations, not live AH quotations. */
(()=>{'use strict';
const $=id=>document.getElementById(id),KEY='binch.market.v1',MAX=400;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
const clean=(s,max=90)=>String(s??'').trim().slice(0,max);
const coins=n=>{n=Math.round(Number(n)||0);return Math.floor(n/10000)+' po '+Math.floor(n%10000/100)+' pa '+n%100+' pc'};
const read=k=>{try{return JSON.parse(localStorage.getItem(k))||{}}catch{return {}}};
const initial=()=>({version:1,realm:'',faction:'',fee:5,prices:[],trades:[],watch:[]});
let state=read(KEY);if(state.version!==1||!Array.isArray(state.prices)||!Array.isArray(state.trades)||!Array.isArray(state.watch))state=initial();
const id=()=>window.crypto?.randomUUID?.()||Date.now().toString(36)+'-'+Math.random().toString(36).slice(2);
function save(){state.prices=state.prices.slice(-MAX);state.trades=state.trades.slice(-MAX);state.watch=state.watch.slice(-100);try{localStorage.setItem(KEY,JSON.stringify(state))}catch{}render()}
function current(){const p=read('grimoire.hub.v3');return {character:clean(p.data?.pseudo||'Personnage inconnu',40),realm:state.realm,faction:state.faction}}
function sample(item){const ctx=current(),arr=state.prices.filter(x=>x.item.toLocaleLowerCase('fr')===item.toLocaleLowerCase('fr')&&x.realm===ctx.realm&&x.faction===ctx.faction);return arr.sort((a,b)=>b.time.localeCompare(a.time))[0]}
function snapshot(){return JSON.stringify({format:'binch-market-v1',exportedAt:new Date().toISOString(),data:state},null,2)}
function exportFile(){const url=URL.createObjectURL(new Blob([snapshot()],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='la-binch-bourse.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1200)}
async function importFile(file){
 if(!file||file.size>250000)throw Error('Fichier absent ou volumineux');
 const payload=JSON.parse(await file.text()),v=payload?.data;
 if(payload.format!=='binch-market-v1'||v?.version!==1||!Array.isArray(v.prices)||!Array.isArray(v.trades)||!Array.isArray(v.watch)||v.prices.length>MAX||v.trades.length>MAX||v.watch.length>100)throw Error('Format de registre non reconnu');
 const validAmount=n=>Number.isSafeInteger(n)&&n>=0&&n<=1000000000000;
 function validate(x,kind){
  if(!x||!clean(x.item)||!validAmount(x.unit??x.ceiling)||!Number.isFinite(Date.parse(x.time||new Date().toISOString())))throw Error('Enregistrement invalide');
  if(kind!=='watch'&&(!Number.isInteger(x.quantity)||x.quantity<1||x.quantity>100000))throw Error('Quantité invalide');
  if(kind==='trade'&&!['buy','sell'].includes(x.type))throw Error('Type invalide');
  return {id:id(),item:clean(x.item),unit:kind==='watch'?undefined:x.unit,ceiling:kind==='watch'?x.ceiling:undefined,quantity:kind==='watch'?undefined:x.quantity,
   type:kind==='trade'?x.type:undefined,time:kind==='watch'?undefined:new Date(x.time).toISOString(),source:kind==='price'?'manual':undefined,
   realm:clean(x.realm,60),faction:clean(x.faction,20),character:clean(x.character,40),fee:kind==='trade'?Math.max(0,Math.min(30,Number(x.fee)||0)):undefined};
 }
 const prices=v.prices.map(x=>validate(x,'price')),trades=v.trades.map(x=>validate(x,'trade')),watch=v.watch.map(x=>validate(x,'watch'));
 if(!confirm('Remplacer les cours et transactions manuels de cet appareil ?'))return;
 state={version:1,realm:clean(v.realm,60),faction:clean(v.faction,20),fee:Math.max(0,Math.min(30,Number(v.fee)||5)),prices,trades,watch};save();
}
function mount(){
 const main=$('app')?.querySelector('main'),nav=$('app')?.querySelector('nav.nav');if(!main||!nav||$('page-market'))return;
 const button=document.createElement('button');button.type='button';button.dataset.page='market';button.textContent='Bourse AH';
 nav.append(button);
 const page=document.createElement('section');page.id='page-market';page.className='page';
 page.innerHTML='<section class="panel section binch-market"><div class="eyebrow">BOURSE D’AZEROTH · REGISTRE LOCAL</div><h2>Le comptoir des marchands</h2><p>Les prix ci-dessous sont des <strong>relevés manuels</strong>, pas des cours AH en direct. Aucune transaction WoW n’est exécutée. Chaque prix indique sa source et son âge.</p><div class="binch-market-config"><label>Royaume<input id="binch-market-realm" maxlength="60" placeholder="Serveur / royaume"></label><label>Faction<select id="binch-market-faction"><option value="">À préciser</option><option>Horde</option><option>Alliance</option><option>Neutre</option></select></label><label>Commission AH simulée (%)<input id="binch-market-fee" type="number" min="0" max="30" step=".5"></label></div><div class="binch-market-stats" id="binch-market-stats"></div><div class="binch-market-grid"><section><h3>Relever un cours</h3><form id="binch-market-price-form"><input name="item" required maxlength="90" placeholder="Objet (nom exact)"><label>Prix unitaire en pièces de cuivre<input name="unit" type="number" min="0" max="1000000000000" required></label><label>Quantité observée<input name="quantity" type="number" min="1" max="100000" value="1" required></label><button type="submit">Enregistrer le relevé</button></form></section><section><h3>Journal marchand</h3><form id="binch-market-trade-form"><input name="item" required maxlength="90" placeholder="Objet acheté ou vendu"><select name="type"><option value="buy">Achat</option><option value="sell">Vente</option></select><label>Prix unitaire en cuivre<input name="unit" type="number" min="0" max="1000000000000" required></label><label>Quantité<input name="quantity" type="number" min="1" max="100000" value="1" required></label><button type="submit">Noter la transaction</button></form></section><section><h3>Surveillance de prix</h3><form id="binch-market-watch-form"><input name="item" required maxlength="90" placeholder="Objet à surveiller"><label>Prix cible maximum en cuivre<input name="ceiling" type="number" min="0" max="1000000000000" required></label><button type="submit">Ajouter une cible</button></form><small>Alertes comparées aux seuls relevés manuels disponibles sur cet appareil. Aucune surveillance en arrière-plan.</small></section><section><h3>Simulation achat / revente</h3><form id="binch-market-calc"><label>Prix d’achat unitaire (cuivre)<input name="buy" type="number" min="0" value="10000" required></label><label>Prix de vente envisagé (cuivre)<input name="sell" type="number" min="0" value="12000" required></label><label>Quantité<input name="qty" type="number" min="1" value="1" required></label><button type="submit">Simuler une marge</button></form><p id="binch-market-profit"></p></section></div><div class="binch-market-actions"><input id="binch-market-search" type="search" placeholder="Rechercher un objet dans mon registre"><button id="binch-market-export" type="button">Exporter JSON</button><label>Importer JSON<input id="binch-market-import" type="file" accept=".json,application/json"></label></div><div class="binch-market-grid"><section><h3>Derniers cours saisis</h3><div id="binch-market-prices"></div></section><section><h3>Mes transactions déclarées</h3><div id="binch-market-trades"></div></section><section><h3>Mes prix cibles</h3><div id="binch-market-watch"></div></section></div><p class="binch-market-disclaimer">Les frais sont une hypothèse modifiable. Sans quantité réelle vendue, commission effective, dépôt et profondeur du carnet d’ordres, la simulation ne prouve pas une opportunité rentable.</p></section>';
 main.append(page);
 button.addEventListener('click',()=>{nav.querySelectorAll('button[data-page]').forEach(x=>x.classList.toggle('active',x===button));main.querySelectorAll('.page').forEach(x=>x.classList.toggle('active',x===page));window.scrollTo({top:0,behavior:'auto'});render()});
 $('binch-market-realm').onchange=e=>{state.realm=clean(e.target.value,60);save()};
 $('binch-market-faction').onchange=e=>{state.faction=e.target.value;save()};
 $('binch-market-fee').onchange=e=>{state.fee=Math.max(0,Math.min(30,Number(e.target.value)||0));save()};
 function form(id,fn){$(id).addEventListener('submit',e=>{e.preventDefault();const values=Object.fromEntries(new FormData(e.currentTarget));const item=clean(values.item),qty=Number(values.quantity||1),unit=Number(values.unit),ceiling=Number(values.ceiling);if(!item||!Number.isInteger(qty)||qty<1||qty>100000)return;fn({item,qty,unit,ceiling,values});e.currentTarget.reset()})}
 form('binch-market-price-form',({item,qty,unit})=>{if(!Number.isSafeInteger(unit)||unit<0)return;state.prices.push({id:id(),item,unit,quantity:qty,time:new Date().toISOString(),source:'manual',realm:state.realm,faction:state.faction});save()});
 form('binch-market-trade-form',({item,qty,unit,values})=>{if(!Number.isSafeInteger(unit)||unit<0)return;state.trades.push({id:id(),item,unit,quantity:qty,type:values.type==='sell'?'sell':'buy',fee:state.fee,time:new Date().toISOString(),realm:state.realm,faction:state.faction,character:current().character});save()});
 form('binch-market-watch-form',({item,ceiling})=>{if(!Number.isSafeInteger(ceiling)||ceiling<0)return;state.watch.push({id:id(),item,ceiling,realm:state.realm,faction:state.faction});save()});
 $('binch-market-calc').onsubmit=e=>{e.preventDefault();const d=new FormData(e.target),buy=Number(d.get('buy')),sell=Number(d.get('sell')),qty=Number(d.get('qty'));if(![buy,sell,qty].every(Number.isFinite)||buy<0||sell<0||qty<1)return;const gain=Math.round((sell*(1-state.fee/100)-buy)*qty);$('binch-market-profit').textContent='Résultat théorique : '+moneySigned(gain)+' (hors dépôt et autres frais).'};
 $('binch-market-search').oninput=render;
 $('binch-market-export').onclick=exportFile;
 $('binch-market-import').onchange=async e=>{const file=e.target.files?.[0];e.target.value='';if(!file)return;try{await importFile(file)}catch(err){alert('Import refusé : '+err.message)}};
 page.addEventListener('click',e=>{const b=e.target.closest('[data-market-delete]');if(!b)return;const group=b.dataset.marketGroup;if(!['prices','trades','watch'].includes(group))return;if(!confirm('Supprimer cette entrée locale ?'))return;state[group]=state[group].filter(x=>x.id!==b.dataset.marketDelete);save()});
 render();
}
function moneySigned(n){return(n<0?'-':'')+coins(Math.abs(n))}
function render(){
 if(!$('page-market'))return;
 const q=($('binch-market-search').value||'').trim().toLocaleLowerCase('fr'),ctx=current(),context=x=>x.realm===ctx.realm&&x.faction===ctx.faction;
 $('binch-market-realm').value=state.realm;$('binch-market-faction').value=state.faction;$('binch-market-fee').value=state.fee;
 const prices=state.prices.filter(x=>context(x)&&(!q||x.item.toLocaleLowerCase('fr').includes(q))).slice().reverse();
 const trades=state.trades.filter(x=>context(x)&&(!q||x.item.toLocaleLowerCase('fr').includes(q))).slice().reverse();
 const targets=state.watch.filter(x=>context(x)&&(!q||x.item.toLocaleLowerCase('fr').includes(q)));
 const total=trades.reduce((n,x)=>n+(x.type==='sell'?x.unit*x.quantity*(1-(Number(x.fee)||0)/100):-x.unit*x.quantity),0);
 const provisional=state.trades.filter(context).length;
 $('binch-market-stats').innerHTML='<span>'+prices.length+' relevé(s)</span><span>'+provisional+' transaction(s) déclarée(s)</span><span>Flux net déclaré : '+moneySigned(total)+'</span><span>Sources : saisies manuelles</span>';
 const card=(x,group,desc)=>'<article class="binch-market-row"><strong>'+esc(x.item)+'</strong><span>'+desc+'</span><button type="button" data-market-group="'+group+'" data-market-delete="'+esc(x.id)+'">Supprimer</button></article>';
 $('binch-market-prices').innerHTML=prices.slice(0,40).map(x=>card(x,'prices',coins(x.unit)+' / unité · '+x.quantity+' observée(s) · '+new Date(x.time).toLocaleString('fr-FR')+' · manuel')).join('')||'<p>Aucun cours relevé pour ce royaume et cette faction.</p>';
 $('binch-market-trades').innerHTML=trades.slice(0,40).map(x=>card(x,'trades',(x.type==='sell'?'Vente':'Achat')+' × '+x.quantity+' · '+coins(x.unit)+' / unité · '+(x.character||'Personnage inconnu'))).join('')||'<p>Aucune transaction déclarée.</p>';
 $('binch-market-watch').innerHTML=targets.map(x=>{const latest=sample(x.item),hit=latest&&latest.unit<=x.ceiling;return card(x,'watch','Cible : '+coins(x.ceiling)+' · '+(latest?('dernier relevé manuel : '+coins(latest.unit)+(hit?' · seuil atteint sur ce relevé':' · au-dessus du seuil')):'aucun relevé disponible'))}).join('')||'<p>Aucune cible enregistrée.</p>';
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
})();
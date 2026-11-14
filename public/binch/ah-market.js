/* La Binch — Bourse d'Azeroth V1. All prices must be observed/imported, never fabricated.
   Local data only. Live integration requires a verified CORS API and fresh provenance. */
(()=>{'use strict';
const KEY='binch.ah.market.v1',MAX=1500;
const $=id=>document.getElementById(id),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clean=(s,n=100)=>String(s??'').trim().slice(0,n);
const fresh=()=>({version:1,items:[],trades:[],alerts:[],fee:5});
function read(){try{const v=JSON.parse(localStorage.getItem(KEY));return v?.version===1&&Array.isArray(v.items)&&Array.isArray(v.trades)&&Array.isArray(v.alerts)?v:fresh()}catch{return fresh()}}
let store=read(),q='',order='recent';
const SCOPE_KEY='binch.ah.scope.v1';
function currentScope(){try{const s=JSON.parse(localStorage.getItem(SCOPE_KEY));return s&&String(s.realm||'').trim()&&['Horde','Alliance'].includes(s.faction)?{realm:String(s.realm).trim().slice(0,65).toLocaleLowerCase('fr'),faction:s.faction}:null}catch{return null}}
const scopeId=s=>s?s.realm+'|'+s.faction:'legacy';
const itemScope=x=>x.scope||'legacy';
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(store))}catch{}};
const date=s=>{const v=new Date(s);return Number.isFinite(+v)?v:null};
const copper=n=>Number.isFinite(n)?Math.round(n):0;
const coin=n=>{n=copper(n);let sign=n<0?'-':'';n=Math.abs(n);return sign+Math.floor(n/10000)+'o '+Math.floor(n%10000/100)+'a '+n%100+'c'};
const fromGold=n=>{if(n===null||String(n).trim()==='')return null;const x=Number(String(n).replace(',','.'));return Number.isFinite(x)&&x>=0&&x<1e10?Math.round(x*10000):null};
const percent=x=>Number.isFinite(x)?x.toLocaleString('fr-FR',{maximumFractionDigits:1})+' %':'—';
const norm=s=>clean(s,100).toLocaleLowerCase('fr');
const rankPrice=x=>x.filter(v=>Number.isFinite(v)&&v>0).sort((a,b)=>a-b);
const median=x=>{const a=rankPrice(x),m=a.length>>1;return a.length?(a.length%2?a[m]:(a[m-1]+a[m])/2):null};
const id=()=>window.crypto?.randomUUID?.()||String(Date.now())+'-'+Math.random().toString(36).slice(2);
const maxAge=24*60*60*1000;
function ages(item){let d=date(item.observedAt);return !d?'date inconnue':Math.max(0,Math.floor((Date.now()-d)/3600000))+' h'}
function estimate(item){
 const points=item.history.filter(v=>v&&Number(v.price)>0).slice(-60);
 const prices=points.map(v=>Number(v.price)),med=median(prices),low=prices.length?Math.min(...prices):null;
 const last=Number(item.last)||null,fee=Math.max(0,Math.min(20,Number(store.fee)||0));
 const net=last==null?null:Math.floor(last*(1-fee/100));
 const diff=med&&last?100*(med-last)/med:null;
 return {med,low,last,net,diff,points};
}
function validateRow(row,requireTimestamp=false){
 if(!row||typeof row!=='object'||Array.isArray(row))return null;
 const name=clean(row.name||row.item||row.title||row.itemName,100);
 const numericPrice=row.priceCopper??row.unitPriceCopper??row.copper??null;
 const price=numericPrice!=null?Number(numericPrice):fromGold(row.priceGold??row.gold??row.price);
 const qty=Number(row.quantity??row.qty??1);
 const source=clean(row.source||'Saisie personnelle',120);
 const time=row.observedAt||row.timestamp||(requireTimestamp?null:new Date().toISOString());
 if(typeof time!=='string'||!time.trim())return null;
 if(name.length<2||!Number.isSafeInteger(price)||price<1||price>1e12||!Number.isInteger(qty)||qty<1||qty>1e9||!date(time)||date(time)>new Date())return null;
 const realm=clean(row.realm||'',65).toLocaleLowerCase('fr'),faction=String(row.faction||'');
 if((!!realm)!==(!!faction)||(faction&&!['Horde','Alliance'].includes(faction)))return null;
 return {name,price,quantity:qty,source,observedAt:new Date(time).toISOString(),scope:realm?realm+'|'+faction:'legacy'};
}
function ingest(rows,requireTimestamp=false){
 if(rows.length>MAX)throw Error('Trop de lignes : maximum '+MAX+' observations par import.');
 let added=0,rejected=0;
 for(const raw of rows){const r=validateRow(raw,requireTimestamp);if(!r){rejected++;continue}
  const key=r.scope==='legacy'?norm(r.name):r.scope+'|'+norm(r.name),found=store.items.find(v=>v.key===key);
  const item=found||{key,scope:r.scope,name:r.name,history:[],last:0,quantity:0,observedAt:'',source:''};
  const sample={price:r.price,quantity:r.quantity,at:r.observedAt,source:r.source};
  if(!item.history.some(x=>x.at===sample.at&&x.price===sample.price&&x.source===sample.source)){
   item.history.push(sample);item.history.sort((a,b)=>String(a.at).localeCompare(String(b.at)));
   item.history=item.history.slice(-120);added++;
  }
  const recent=item.history[item.history.length-1];item.last=recent.price;item.quantity=recent.quantity;item.observedAt=recent.at;item.source=recent.source;
  if(!found){if(store.items.length>=500)throw Error('Catalogue limité à 500 objets.');store.items.push(item)}
 }
 save();return {added,rejected};
}
function headers(line,separator){return line.split(separator).map(s=>s.replace(/^"|"$/g,'').trim())}
function csvRows(text){
 // simple semicolon/tab CSV; quoted delimiters handled by state machine.
 const lines=[],table=[];let row=[],cell='',quoted=false;
 for(let i=0;i<text.length;i++){const c=text[i],next=text[i+1];if(c==='"'&&quoted&&next==='"'){cell+='"';i++;continue}if(c==='"'){quoted=!quoted;continue}
 if(!quoted&&(c===';'||c==='\t'||c==='\n'||c==='\r')){if(c==='\r'&&next==='\n')i++;row.push(cell.trim());cell='';if(c==='\n'||c==='\r'){table.push(row);row=[]}continue}cell+=c}
 if(quoted)throw Error('CSV : guillemet non terminé');row.push(cell.trim());if(row.some(Boolean))table.push(row);
 if(!table.length)return[];
 const cols=table.shift().map(x=>x.toLowerCase());const required=['name','pricegold'];if(!cols.includes('name')||(!cols.includes('pricegold')&&!cols.includes('pricecopper')))throw Error('Colonnes CSV requises : name et priceGold ou priceCopper.');
 return table.filter(row=>row.some(Boolean)).map(values=>Object.fromEntries(cols.map((k,i)=>[k==='pricegold'?'priceGold':k==='pricecopper'?'priceCopper':k==='observedat'?'observedAt':k,values[i]||''])));
}
async function loadFile(file){
 if(!file||file.size>800000)throw Error('Fichier vide ou trop volumineux (800 Ko max).');
 const text=await file.text(),rows=file.name.toLowerCase().endsWith('.json')?JSON.parse(text):csvRows(text);
 const arr=Array.isArray(rows)?rows:Array.isArray(rows?.observations)?rows.observations:null;
 if(!arr)throw Error('Le JSON doit contenir une liste d’observations, pas un export d’enchères non reconnu.');
 return ingest(arr,true);
}
function exportData(){
 const body=JSON.stringify({format:'binch-ah-market-v1',savedAt:new Date().toISOString(),observations:store.items.flatMap(x=>x.history.map(p=>({name:x.name,priceCopper:p.price,quantity:p.quantity,source:p.source,observedAt:p.at,realm:itemScope(x)==='legacy'?undefined:itemScope(x).split('|')[0],faction:itemScope(x)==='legacy'?undefined:itemScope(x).split('|')[1]}))),trades:store.trades,alerts:store.alerts},null,2);
 const url=URL.createObjectURL(new Blob([body],{type:'application/json'})),a=document.createElement('a');a.download='la-binch-bourse.json';a.href=url;a.click();setTimeout(()=>URL.revokeObjectURL(url),1200);
}
function market(){
 const table=$('binch-ah-list');if(!table)return;
 const sid=scopeId(currentScope());const rows=store.items.filter(x=>itemScope(x)===sid&&(!q||norm(x.name).includes(q))).map(x=>({...x,calc:estimate(x)}));
 rows.sort((a,b)=>order==='price'?b.last-a.last:order==='name'?a.name.localeCompare(b.name,'fr'):order==='discount'?(b.calc.diff??-999)-(a.calc.diff??-999):String(b.observedAt).localeCompare(String(a.observedAt)));
 const freshCount=rows.filter(x=>date(x.observedAt)&&Date.now()-date(x.observedAt)<maxAge).length;
 $('binch-ah-overview').textContent=rows.length+' objets dans ce marché · '+freshCount+' relevés de moins de 24 h · '+(sid==='legacy'?'anciens relevés non attribués':'royaume/faction déclarés')+' · aucun cours direct';
 table.innerHTML=rows.length?rows.slice(0,150).map(x=>'<article class="binch-ah-item"><div><strong>'+esc(x.name)+'</strong><small>Dernière observation : '+esc(ages(x))+' · '+esc(x.source)+'</small><small>'+x.history.length+' observation(s) · '+x.quantity+' unité(s) annoncée(s) au dernier relevé</small></div><div class="binch-ah-price"><strong>'+coin(x.last)+'</strong><small>Médiane historique : '+(x.calc.med?coin(x.calc.med):'—')+'</small><small>Écart à médiane : '+percent(x.calc.diff)+'</small></div><button type="button" data-ah-select="'+esc(x.key)+'">Analyser</button></article>').join(''):'<p>Aucune observation correspondante. Ajoute un prix constaté en jeu ou importe ton relevé.</p>';
}
function selectItem(key){
 const x=store.items.find(v=>v.key===key&&itemScope(v)===scopeId(currentScope()));if(!x)return;
 $('binch-ah-selected').value=x.name;$('binch-ah-selected-title').textContent=x.name;
 const e=estimate(x),age=date(x.observedAt)?Date.now()-date(x.observedAt):Infinity;
 let opinion=!e.med||e.points.length<3?'Données insuffisantes pour comparer.':e.diff>20?'Prix nettement sous la médiane des observations : marge théorique à étudier.':e.diff < -20?'Prix au-dessus de la médiane : prudence sur la revente.':'Prix proche de la médiane observée.';
 const caution=(age>maxAge?'Dernier relevé ancien. ':'')+'La médiane ne garantit pas la liquidité, les ventes ni le bénéfice futur.';
 $('binch-ah-advice').innerHTML='<strong>'+esc(opinion)+'</strong><p>'+esc(caution)+'</p><dl><div><dt>Prix le plus récent</dt><dd>'+coin(e.last)+'</dd></div><div><dt>Médiane observée</dt><dd>'+(e.med?coin(e.med):'—')+'</dd></div><div><dt>Montant net potentiel après commission de '+store.fee+' %</dt><dd>'+(e.net?coin(e.net):'—')+'</dd></div></dl><small>Sources : '+esc(x.source)+' · horodatage '+esc(date(x.observedAt)?.toLocaleString('fr-FR')||'inconnu')+' · échantillon '+e.points.length+'. Aucun ordre d’achat automatisé.</small>';
 const buy=$('binch-ah-buy'),sale=$('binch-ah-sell');if(e.last){if(!buy.value)buy.value=(e.last/10000).toFixed(4);if(!sale.value&&e.med)sale.value=(e.med/10000).toFixed(4)}
 calc();
}
function calc(){
 const buy=fromGold($('binch-ah-buy')?.value),sale=fromGold($('binch-ah-sell')?.value),count=Number($('binch-ah-qty')?.value)||1,deposit=fromGold($('binch-ah-deposit')?.value)??0;
 if(buy==null||sale==null||count<1||count>100000||!Number.isInteger(count)){$('binch-ah-math').textContent='Renseigne des montants et une quantité valides.';return}
 const gross=sale*count,net=Math.floor(gross*(1-Number(store.fee)/100)),profit=net-buy*count-deposit;
 $('binch-ah-math').innerHTML='<span>Investissement : <b>'+coin(buy*count)+'</b></span><span>Revente nette théorique : <b>'+coin(net)+'</b></span><span>Résultat après commission et dépôt : <b>'+coin(profit)+'</b></span><span>Rendement : <b>'+percent((buy*count+deposit)>0?profit/(buy*count+deposit)*100:NaN)+'</b></span><small>Hypothèse : toutes les unités vendues à ce prix, sans dépôt perdu supplémentaire. Aucune transaction réelle.</small>';
}
function tradesRender(){
 const target=$('binch-ah-trades-list');if(!target)return;
 const lines=store.trades,results=lines.map(x=>({x,margin:x.kind==='sell'?Math.floor(x.price*x.qty*(1-Number(store.fee)/100)):-(x.price*x.qty)}));
 const sum=results.reduce((acc,r)=>acc+r.margin,0);
 $('binch-ah-trades-total').textContent=lines.length+' opération(s) déclarée(s) · solde de trésorerie net : '+coin(sum)+' (ceci n’est pas un bénéfice réalisé calculé par lots)';
 target.innerHTML=lines.length?lines.slice().reverse().slice(0,40).map(x=>'<article><div><strong>'+esc(x.item)+'</strong><small>'+esc(x.kind==='buy'?'Achat':'Vente')+' · '+x.qty+' × '+coin(x.price)+' · '+esc(x.scope&&x.scope!=='legacy'?x.scope:'Marché ancien non attribué')+' · '+esc(date(x.at)?.toLocaleString('fr-FR')||'date inconnue')+'</small></div><button type="button" data-ah-trade-delete="'+esc(x.id)+'">×</button></article>').join(''):'<p>Aucune transaction déclarée.</p>';
}
function alertsRender(){
 const target=$('binch-ah-alerts-list');if(!target)return;
 target.innerHTML=store.alerts.length?store.alerts.map(a=>{
  const item=store.items.find(x=>x.key===a.key&&itemScope(x)===scopeId(currentScope())),hit=item&&date(item.observedAt)&&Date.now()-date(item.observedAt)<maxAge&&item.last<=a.ceiling;
  return '<article><div><strong>'+esc(a.name)+'</strong><small>Seuil : '+coin(a.ceiling)+' · '+(hit?'Prix observé sous le seuil (moins de 24 h)':'Pas de signal récent confirmé')+'</small></div><button data-ah-alert-delete="'+esc(a.id)+'" type="button">×</button></article>';
 }).join(''):'<p>Pas d’alerte locale enregistrée. Les alertes sont évaluées à l’ouverture de la page, sans notification distante.</p>';
}
function render(){market();tradesRender();alertsRender();const selected=$('binch-ah-selected')?.value;if(selected){const item=store.items.find(x=>x.key===norm(selected));if(item)selectItem(item.key)}}
function mount(){
 const nav=document.querySelector('#app nav.nav'),main=document.querySelector('#app main');if(!nav||!main)return;
 const existing=$('page-market');
 if(existing&&existing.querySelector('.binch-ah'))return;
 const tab=existing?nav.querySelector('[data-page="market"]'):document.createElement('button');
 if(!existing){tab.type='button';tab.dataset.page='market';tab.textContent='◈ Bourse d’Azeroth';nav.append(tab)}
 const page=existing||document.createElement('section');
 if(!existing){page.className='page';page.id='page-market'}
 const content='<section class="binch-ah"><header><div><div class="eyebrow">LA BINCH · ÉCONOMIE ET INTENDANCE</div><h1>Bourse d’Azeroth</h1><p>Cotation et décision commerciale fondées uniquement sur tes observations. Aucun prix fictif.</p></div><div class="binch-ah-status">Marché local · API non connectée</div></header><p class="binch-ah-warning">WoW Forever : le flux des enchères dépend d’un fournisseur ou de l’API autorisée. Cette version ne récupère pas automatiquement les cours. Toutes les valeurs affichées proviennent de relevés fournis par l’utilisateur.</p><div class="binch-ah-grid"><section><h2>Relevés de marché</h2><form id="binch-ah-scope-form"><label>Royaume déclaré<input id="binch-ah-realm" maxlength="65" placeholder="Nom exact du royaume"></label><label>Faction<select id="binch-ah-faction"><option value="">Choisir</option><option value="Horde">Horde</option><option value="Alliance">Alliance</option></select></label><button>Utiliser ce marché</button><button id="binch-ah-scope-legacy" type="button">Voir relevés anciens</button></form><p id="binch-ah-scope-status" role="status">Relevés historiques sans royaume.</p><form id="binch-ah-add"><input name="name" required maxlength="100" placeholder="Nom exact de l’objet" aria-label="Objet"><label>Prix unitaire (or)<input name="priceGold" type="number" min=".0001" step=".0001" required placeholder="1.2500"></label><label>Quantité observée<input name="quantity" type="number" min="1" max="1000000" value="1" required></label><button>Enregistrer le cours observé</button></form><div class="binch-ah-toolbar"><input id="binch-ah-search" type="search" placeholder="Rechercher un objet"><select id="binch-ah-order"><option value="recent">Dernière observation</option><option value="discount">Écart à la médiane</option><option value="price">Prix décroissant</option><option value="name">Nom</option></select></div><p id="binch-ah-overview"></p><div id="binch-ah-list"></div><details><summary>Importer / exporter les relevés</summary><p>CSV délimité par point-virgule : name;priceGold;quantity;source;observedAt. JSON : tableau d’observations avec name, priceCopper ou priceGold, quantity, source et observedAt.</p><input id="binch-ah-import" type="file" accept=".json,.csv,text/csv,application/json"><button id="binch-ah-export" type="button">Exporter mon carnet JSON</button><p id="binch-ah-import-result" role="status"></p><p>Sources externes à consulter : <a target="_blank" rel="noopener noreferrer" href="https://everloot.app/tools/auctions">Everloot</a> et <a target="_blank" rel="noopener noreferrer" href="https://auctionhouse.fyi/docs/api">Auctionhouse.fyi</a>. Aucune connexion directe activée.</p></details></section><section><h2>Conseiller marchand</h2><input id="binch-ah-selected" readonly placeholder="Choisis un objet dans le tableau" aria-label="Objet analysé"><h3 id="binch-ah-selected-title">Aucun objet sélectionné</h3><div id="binch-ah-advice">Ajoute un relevé pour afficher une analyse.</div><h3>Simulateur achat / revente</h3><div class="binch-ah-calc"><label>Prix d’achat unitaire (or)<input id="binch-ah-buy" type="number" min="0" step=".0001"></label><label>Prix de vente unitaire envisagé (or)<input id="binch-ah-sell" type="number" min="0" step=".0001"></label><label>Quantité<input id="binch-ah-qty" type="number" min="1" max="100000" value="1"></label><label>Dépôt potentiellement perdu (or)<input id="binch-ah-deposit" type="number" min="0" step=".0001" value="0"></label><label>Commission AH (%)<input id="binch-ah-fee" type="number" min="0" max="20" step=".1" value="5"></label></div><p id="binch-ah-math"></p><h3>Surveillance locale des prix</h3><form id="binch-ah-alert-form"><input id="binch-ah-alert-name" required maxlength="100" placeholder="Nom de l’objet"><input id="binch-ah-alert-price" type="number" min=".0001" step=".0001" required placeholder="Prix maximum (or)" aria-label="Seuil en or"><button>Ajouter une alerte</button></form><div id="binch-ah-alerts-list"></div></section></div><section><h2>Portefeuille marchand · registre manuel</h2><p>Les achats et ventes sont saisis manuellement. Le solde indique les flux de trésorerie, pas un résultat comptable par objet.</p><form id="binch-ah-trade-form"><select name="kind"><option value="buy">Achat</option><option value="sell">Vente</option></select><input name="item" required maxlength="100" placeholder="Objet" aria-label="Objet négocié"><input name="qty" type="number" required min="1" max="100000" value="1" aria-label="Quantité"><input name="priceGold" type="number" required min=".0001" step=".0001" placeholder="Prix unitaire en or" aria-label="Prix unitaire en or"><button>Enregistrer</button></form><p id="binch-ah-trades-total"></p><div id="binch-ah-trades-list"></div></section><footer>La Binch · carnet personnel de l’hôtel des ventes. Les estimations ne constituent pas des achats/ventes réels.</footer></section>';
 if(existing){const wrapper=document.createElement('div');wrapper.innerHTML=content;const panel=wrapper.firstElementChild;if(panel)page.append(panel)}
 else{page.innerHTML=content;main.append(page)}
 if(tab)tab.addEventListener('click',()=>{if(!existing){nav.querySelectorAll('[data-page]').forEach(x=>x.classList.toggle('active',x===tab));main.querySelectorAll('.page').forEach(x=>x.classList.toggle('active',x===page));window.scrollTo({top:0,behavior:'auto'})}render()});
 const sc=currentScope();if(sc){$('binch-ah-realm').value=sc.realm;$('binch-ah-faction').value=sc.faction}
 const scopeStatus=()=>{$('binch-ah-scope-status').textContent=currentScope()?'Marché sélectionné : '+currentScope().realm+' / '+currentScope().faction+' (déclaratif, jamais synchronisé)':'Anciens relevés sans identification de royaume/faction : ne pas comparer avec les marchés identifiés.'};
 $('binch-ah-scope-form').onsubmit=e=>{e.preventDefault();const realm=clean($('binch-ah-realm').value,65).toLocaleLowerCase('fr'),faction=$('binch-ah-faction').value;if(!realm||!['Horde','Alliance'].includes(faction))return;localStorage.setItem(SCOPE_KEY,JSON.stringify({realm,faction}));scopeStatus();render()};
 $('binch-ah-scope-legacy').onclick=()=>{localStorage.removeItem(SCOPE_KEY);$('binch-ah-realm').value='';$('binch-ah-faction').value='';scopeStatus();render()};
 scopeStatus();
 $('binch-ah-add').addEventListener('submit',e=>{e.preventDefault();const f=e.target,d=new FormData(f),out=ingest([{name:d.get('name'),priceGold:d.get('priceGold'),quantity:d.get('quantity'),realm:currentScope()?.realm||'',faction:currentScope()?.faction||'',source:'Observation saisie dans La Binch',observedAt:new Date().toISOString()}]);if(out.added){f.reset();render()}});
 $('binch-ah-search').oninput=e=>{q=norm(e.target.value);market()};
 $('binch-ah-order').onchange=e=>{order=e.target.value;market()};
 $('binch-ah-list').addEventListener('click',e=>{const b=e.target.closest('[data-ah-select]');if(b){$('binch-ah-buy').value='';$('binch-ah-sell').value='';selectItem(b.dataset.ahSelect)}});
 for(const key of ['buy','sell','qty','deposit'])$('binch-ah-'+key).addEventListener('input',calc);
 $('binch-ah-fee').value=String(store.fee);
 $('binch-ah-fee').oninput=e=>{const fee=Number(e.target.value);if(Number.isFinite(fee)&&fee>=0&&fee<=20){store.fee=fee;save();calc();const selected=store.items.find(x=>x.key===norm($('binch-ah-selected').value));if(selected)selectItem(selected.key)}};
 $('binch-ah-import').onchange=async e=>{const file=e.target.files?.[0];e.target.value='';if(!file)return;try{const result=await loadFile(file);$('binch-ah-import-result').textContent=result.added+' observations ajoutées · '+result.rejected+' rejetées';render()}catch(error){$('binch-ah-import-result').textContent='Import refusé : '+error.message}};
 $('binch-ah-export').onclick=exportData;
 $('binch-ah-alert-form').onsubmit=e=>{e.preventDefault();const name=clean($('binch-ah-alert-name').value),ceiling=fromGold($('binch-ah-alert-price').value);if(!name||ceiling==null||ceiling<=0||store.alerts.length>=100)return;store.alerts.push({id:id(),name,key:norm(name),ceiling});save();e.target.reset();alertsRender()};
 $('binch-ah-alerts-list').onclick=e=>{const b=e.target.closest('[data-ah-alert-delete]');if(!b)return;store.alerts=store.alerts.filter(x=>x.id!==b.dataset.ahAlertDelete);save();alertsRender()};
 $('binch-ah-trade-form').onsubmit=e=>{e.preventDefault();const f=e.target,d=new FormData(f),price=fromGold(d.get('priceGold')),qty=Number(d.get('qty'));if(!clean(d.get('item'))||price==null||price<1||!Number.isInteger(qty)||qty<1||qty>100000||store.trades.length>=400)return;store.trades.push({id:id(),kind:d.get('kind'),item:clean(d.get('item')),qty,price,scope:scopeId(currentScope()),fee:Number(store.fee??5),at:new Date().toISOString()});save();f.reset();tradesRender()};
 $('binch-ah-trades-list').onclick=e=>{const b=e.target.closest('[data-ah-trade-delete]');if(!b)return;store.trades=store.trades.filter(x=>x.id!==b.dataset.ahTradeDelete);save();tradesRender()};
 document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&page.classList.contains('active'))alertsRender()});
 window.addEventListener('storage',e=>{if(e.key===KEY){store=read();if(page.classList.contains('active'))render()}});
 render();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
})();
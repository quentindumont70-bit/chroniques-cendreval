/* La Binch — onglet « Assistant Trading ». Interface du moteur BinchTrading.
   Réutilise le carnet AH (binch.ah.market.v1), le marché déclaré (binch.ah.scope.v1),
   l'import GrimoireSync (grimoire.bridge.last, grimoire.craft.v1) et l'atelier (binch.ah.craft.v1).
   Ses propres réglages : binch.ah.trading.v1. Aucune transaction réelle, aucun appel réseau. */
(()=>{'use strict';
const T=window.BinchTrading;if(!T)return;
const AH=window.BinchAHLedger;
const MARKET='binch.ah.market.v1',SCOPE='binch.ah.scope.v1',KEY='binch.ah.trading.v1',CRAFT='binch.ah.craft.v1';
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const read=(k,f)=>{try{return JSON.parse(localStorage.getItem(k))??f}catch{return f}};
const write=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));return true}catch{return false}};
const uid=()=>window.crypto?.randomUUID?.()||Date.now().toString(36)+Math.random().toString(36).slice(2);
const coin=T.coin,pct=x=>Number.isFinite(x)?(x>0?'+':'')+x.toLocaleString('fr-FR',{maximumFractionDigits:1})+' %':'—';
const when=iso=>{const t=Date.parse(iso);if(!Number.isFinite(t))return 'date inconnue';const h=(Date.now()-t)/3600000;return new Date(t).toLocaleString('fr-FR',{dateStyle:'short',timeStyle:'short'})+' ('+(h<1?'< 1 h':Math.floor(h)+' h')+')'};
const gold=v=>{if(v==null||String(v).trim()==='')return null;const x=Number(String(v).replace(',','.'));return Number.isFinite(x)&&x>=0&&x<1e8?Math.round(x*10000):null};
const toGold=c=>Number.isFinite(c)?(c/10000).toFixed(4):'';
const defaults=()=>({version:2,region:null,confirmedMarket:null,reservePct:40,maxItemPct:15,capitalOverride:null,feedMarket:null,autoFeed:false,decisions:[],alerts:[],imports:[],grimoire:null,view:'dashboard'});
let state=Object.assign(defaults(),read(KEY,{}));if(state.version!==2){state.version=2;state.autoFeed=false;state.confirmedMarket=null;state.region=state.region||null} // revue : jamais d’intégration externe sans confirmation
if(!Array.isArray(state.decisions))state.decisions=[];if(!Array.isArray(state.alerts))state.alerts=[];if(!Array.isArray(state.imports))state.imports=[];
let lookupItemId=null,lookupItemName='';
let pendingScan=null,historyItem='',simSeed=null,feed=read('binch.ah.feed.cache.v1',null),feedStatus='',feedTimer=null;
const save=()=>{state.decisions=state.decisions.slice(-300);state.alerts=state.alerts.slice(-100);state.imports=state.imports.slice(-30);write(KEY,state)};

/* ---------- contexte de données ---------- */
function scopeOf(){const s=read(SCOPE,null);return s?.realm&&['Horde','Alliance'].includes(s.faction)?{id:String(s.realm).trim().toLocaleLowerCase('fr')+'|'+s.faction,realm:String(s.realm).trim(),faction:s.faction}:null}
function character(){
 const hub=read('grimoire.hub.v3',{}),last=read('grimoire.bridge.last',{}),g=state.grimoire;
 const pseudo=String(hub.data?.pseudo||last.name||g?.character?.name||'').trim();
 const mine=g&&g.character?.name&&g.character.name.toLowerCase()===pseudo.toLowerCase();
 const inventory=mine&&Array.isArray(g.inventory)&&g.inventory.length?{list:g.inventory,at:g.importedAt,src:'Assistant Trading (GrimoireSync.lua)'}:
  Array.isArray(last.inventory)&&String(last.name||'').toLowerCase()===pseudo.toLowerCase()?{list:last.inventory,at:last.updated,src:'Synchronisation La Binch'}:{list:[],at:null,src:null};
 let professions=mine&&g.professions&&Object.keys(g.professions).length?g.professions:{};
 if(!Object.keys(professions).length){const imports=read('grimoire.craft.v1',{}).imports||{};for(const [k,v] of Object.entries(imports))if(k.startsWith(pseudo.toLowerCase()+'-')&&v?.skills)for(const [n,r] of Object.entries(v.skills))professions[n]={rank:Number(r)||0}}
 const level=Number(mine&&g.character.level)||Number(hub.data?.level)||Number(last.level)||0;
 return {pseudo:pseudo||'Aventurier',level,inventory,professions,gold:mine&&Number.isSafeInteger(g.character.gold)?{value:g.character.gold,at:g.importedAt}:null};
}
function context(){
 const store=read(MARKET,{version:1,items:[],trades:[],alerts:[],fee:5}),scope=scopeOf(),fee=Number(store.fee??5);
 const index=T.marketIndex(store,scope?.id||'legacy');
 const ch=character(),crafts=T.craftAnalysis({index,professions:ch.professions,recipes:read(CRAFT,[]),fee});
 const bags=T.bagAdvice({inventory:ch.inventory.list,index,crafts,fee});
 const capital=Number.isSafeInteger(state.capitalOverride)?{value:state.capitalOverride,src:'saisi manuellement'}:ch.gold?{value:ch.gold.value,src:'or du personnage au '+when(ch.gold.at)}:null;
 const budget=capital?T.budgetPlan({capital:capital.value,reservePct:state.reservePct,maxItemPct:state.maxItemPct}):null;
 const opps=T.opportunities({index,fee,budget});
 const trades=(Array.isArray(store.trades)?store.trades:[]).filter(t=>(t.scope||'legacy')===(scope?.id||'legacy'));
 const ledger=window.BinchAHPortfolio?.ledger?window.BinchAHPortfolio.ledger(trades,fee):{positions:[],realized:0,remainingCost:0};
 const resale=T.resaleCandidates({positions:ledger.positions,index,fee});
 const performance=window.BinchAHPortfolio?.tradePerformance?.(ledger)||null;
 const fresh=index.items.filter(x=>Date.now()-Date.parse(x.observedAt)<86400000).length;
 const scans=index.items.filter(x=>String(x.source).startsWith(T.SCAN_SOURCE)).map(x=>x.observedAt).sort().pop()||null;
 return {store,scope,fee,index,ch,crafts,bags,capital,budget,opps,trades,ledger,performance,resale,fresh,lastScan:scans};
}

/* ---------- composants ---------- */
const VIEWS=[['dashboard','Tableau de bord'],['live','En direct'],['bags','Mes sacs'],['radar','Radar'],['history','Historique'],['sim','Simulateur'],['crafts','Métiers'],['wallet','Portefeuille'],['journal','Journal'],['alerts','Alertes'],['faith','Faith marchande'],['data','Données']];
const conf=c=>'<span class="bt-conf bt-conf-'+esc(String(c).normalize('NFD').replace(/[^a-z]/gi,'').toLowerCase())+'">'+esc(c)+'</span>';
const empty=msg=>'<p class="bt-empty">'+msg+'</p>';
function card({title,price,reference,qty,margin,risks,confidence,at,extra='',actions=''}){
 return '<article class="bt-card"><header><strong>'+esc(title)+'</strong>'+conf(confidence||'Insuffisante')+'</header><dl>'+
  '<div><dt>Prix observé</dt><dd>'+(price!=null?coin(price):'—')+'</dd></div><div><dt>Référence historique</dt><dd>'+(reference!=null?coin(reference):'—')+'</dd></div>'+
  '<div><dt>Quantité</dt><dd>'+(qty!=null?esc(qty):'à définir')+'</dd></div><div><dt>Marge théorique</dt><dd>'+(margin!=null?coin(margin):'—')+'</dd></div></dl>'+
  extra+(risks&&risks.length?'<p class="bt-risk">Risques : '+esc(risks.join(' · '))+'</p>':'')+'<small>Dernier relevé : '+esc(when(at))+'</small>'+(actions?'<div class="bt-actions">'+actions+'</div>':'')+'</article>';
}
function scopeBanner(c){
 if(!c.scope)return '<p class="bt-alert">Choisis d’abord ton royaume et ta faction dans l’onglet « Bourse d’Azeroth » (ou importe un scan ci-dessous) : sans marché identifié, aucun conseil n’est produit.</p>';
 return '<p class="bt-honesty">Marché : <b>'+esc(c.scope.realm)+' · '+esc(c.scope.faction)+'</b> · '+c.index.items.length+' objets suivis, '+c.fresh+' relevés de moins de 24 h · dernier scan GrimoireSync : '+(c.lastScan?esc(when(c.lastScan)):'aucun')+'. <b>Pas de cours temps réel garanti</b> : les prix disponibles viennent de scans et de relevés datés. Un fournisseur Blizzard Forever existe à titre expérimental dans le collecteur, sans garantie de disponibilité.</p>';
}

/* ---------- vues ---------- */
function vDashboard(c){
 const count=d=>c.bags.filter(b=>b.decision===d).length;
 const stockAH=c.bags.reduce((n,b)=>n+(b.ahNetTotal||0),0),stockVendor=c.bags.reduce((n,b)=>n+(b.vendorTotal||0),0);
 const actions=[...c.bags.filter(b=>['Vendre à l’AH','Transformer'].includes(b.decision)).slice(0,3).map(b=>b.decision+' : '+b.name+' ×'+b.count),...c.opps.filter(o=>o.status==='Achat à étudier').slice(0,2).map(o=>'Achat à étudier : '+o.name+' à '+coin(o.price)),...c.resale.filter(r=>r.gain>0).slice(0,2).map(r=>'Revendre : '+r.item)];
 return '<div class="bt-kpis">'+
  kpi('Capital',c.capital?coin(c.capital.value):'—',c.capital?c.capital.src:'importe GrimoireSync ou saisis-le')+
  kpi('Réserve conservée',c.budget?coin(c.budget.reserve):'—',state.reservePct+' % du capital')+
  kpi('Valeur des sacs seulement (net AH)',stockAH?coin(stockAH):'—','marchand : '+coin(stockVendor))+
  kpi('Objets à vendre / garder',count('Vendre à l’AH')+' / '+count('Garder'),count('Transformer')+' à transformer · '+count('Données insuffisantes')+' sans cote')+
  kpi('Achats à étudier',String(c.opps.filter(o=>o.status==='Achat à étudier').length),c.opps.filter(o=>o.status!=='Achat à étudier').length+' décote(s) à surveiller')+
  kpi('Résultat réalisé (FIFO)',coin(c.ledger.realized||0),'d’après tes opérations déclarées')+
  kpi('Ventes consignées (30 j)',c.performance?.operations?String(c.performance.sold)+' unité(s)':'—',c.performance?.unmatched?'dont '+c.performance.unmatched+' sans prix d’achat connu':'déclarations personnelles, pas volume du marché')+'</div>'+
  '<h3>Priorités du moment</h3>'+(actions.length?'<ol class="bt-list">'+actions.map(a=>'<li>'+esc(a)+'</li>').join('')+'</ol>':empty('Données insuffisantes pour proposer une action. Lance <code>/grimoire scan</code> à l’hôtel des ventes, fais <code>/reload</code>, puis importe GrimoireSync.lua dans « Données ».'))+
  '<h3>Marchés en mouvement</h3>'+moversTable(T.movers(c.index));
}
const kpi=(label,value,sub)=>'<div class="bt-kpi"><small>'+esc(label)+'</small><strong>'+esc(value)+'</strong><span>'+esc(sub)+'</span></div>';
function moversTable(list){
 if(!list.length)return empty('Aucune variation ≥ 10 % mesurable : il faut au moins 4 relevés sur 2 jours par objet.');
 return '<div class="bt-table"><table><thead><tr><th>Objet</th><th>Tendance</th><th>Cours</th><th>Médiane</th><th>Confiance</th></tr></thead><tbody>'+list.slice(0,12).map(m=>'<tr><td>'+esc(m.name)+'</td><td class="'+(m.trend>0?'bt-up':'bt-down')+'">'+pct(m.trend)+'</td><td>'+coin(m.current)+'</td><td>'+coin(m.median)+'</td><td>'+conf(m.confidence)+'</td></tr>').join('')+'</tbody></table></div>';
}
function vBags(c){
 if(!c.ch.inventory.list.length)return empty('Aucun inventaire importé pour '+esc(c.ch.pseudo)+'. Importe GrimoireSync.lua (onglet Synchronisation ou « Données » ici).');
 return '<p class="bt-note">Sacs de '+esc(c.ch.pseudo)+' · source : '+esc(c.ch.inventory.src)+' · '+esc(when(c.ch.inventory.at))+'. <b>Sacs seulement</b> : la banque n’est pas lue par l’addon actuel.</p><div class="bt-cards">'+c.bags.map(b=>card({title:b.name+' ×'+b.count,price:b.price,reference:b.stats?.median??null,qty:b.count,margin:b.ahNetTotal!=null?b.ahNetTotal-b.vendorTotal:null,
  risks:b.stats?.sufficient?riskList(b.stats):[],confidence:b.stats?.confidence,at:b.lastAt,
  extra:'<p class="bt-decision bt-d-'+esc(b.decision.normalize('NFD').replace(/[^a-z]/gi,'').toLowerCase())+'">'+esc(b.decision)+'</p><p>'+esc(b.reasons.join(' '))+'</p><small>Marge affichée = net AH − revente marchand.</small>',
  actions:(Number.isSafeInteger(Number(b.itemId))&&Number(b.itemId)>0&&Number(b.itemId)<=1000000?'<button type="button" data-bt-lookup="'+Number(b.itemId)+'" data-bt-lookup-name="'+esc(b.name)+'">Vérifier le prix EU/US</button>':'')+(b.price?'<button type="button" data-bt-decide="'+esc(b.name)+'" data-bt-action="'+esc(b.decision)+'" data-bt-ref="'+b.price+'" data-bt-qty="'+b.count+'">Noter ma décision</button>':'')})).join('')+'</div>';
}
const riskList=s=>{const r=[];if(s.volatility>=25)r.push('volatilité '+Math.round(s.volatility)+' %');if(s.ageH>=24)r.push('relevé > 24 h');if(s.n<5)r.push(s.n+' relevés');return r};
function vRadar(c){
 const buy=c.opps.length?'<div class="bt-cards">'+c.opps.slice(0,24).map(o=>card({title:o.name,price:o.price,reference:o.reference,qty:o.qty,margin:o.margin??o.unitMargin,risks:o.risks,confidence:o.confidence,at:o.lastAt,
  extra:'<p class="bt-decision"><strong>'+esc(o.status||'Surveillance')+'</strong> · décote '+pct(-o.discount)+' · marge unitaire théorique après commission '+coin(o.unitMargin)+'.</p>'+
   '<p>Si la revente se fait 10 % sous la médiane historique : '+coin(o.stressedUnitMargin)+' par unité, avant dépôts et invendus. Quantité limitée par : '+esc(o.limitedBy)+'.</p>'+
   (o.status!=='Achat à étudier'?'<p class="bt-note">Signal d’observation uniquement : '+esc((o.warnings||[]).join(' · '))+'.</p>':'<p class="bt-note">Même avec profondeur connue, la vitesse de vente reste non prouvée. Vérifie l’AH en jeu.</p>'),
  actions:'<button type="button" data-bt-sim="'+esc(JSON.stringify({buy:o.price,sell:o.reference,qty:o.qty||1}))+'">Simuler</button>'+
   (o.status==='Achat à étudier'?'<button type="button" data-bt-decide="'+esc(o.name)+'" data-bt-action="Acheter" data-bt-ref="'+o.price+'" data-bt-exp="'+o.reference+'" data-bt-qty="'+o.qty+'">Noter ma décision</button>':'') })).join('')+'</div>':empty('Aucune décote suffisamment étayée (≥ 15 % sous la médiane, ≥ 3 relevés, < 24 h, volatilité < 40 %). C’est un résultat, pas une panne.');
 const res=c.resale.length?'<div class="bt-table"><table><thead><tr><th>Position</th><th>Unités</th><th>Coût unitaire</th><th>Cours</th><th>Gain net estimé</th><th>Statut</th></tr></thead><tbody>'+c.resale.map(r=>'<tr><td>'+esc(r.item)+'</td><td>'+r.remaining+'</td><td>'+coin(r.unitCost)+'</td><td>'+(r.current?coin(r.current):'—')+'</td><td>'+(r.gain!=null?coin(r.gain):'—')+'</td><td>'+esc(r.status)+'</td></tr>').join('')+'</tbody></table></div>':empty('Aucune position ouverte dans ton registre d’achats.');
 return '<h3>Achats sous-évalués</h3><p class="bt-note">« Achat à étudier » exige capital, profondeur observée, au moins 3 jours d’historique et absence de forte chute antérieure. Les autres décotes restent en surveillance.</p>'+buy+'<h3>Reventes possibles de mes positions</h3>'+res+'<h3>Variations</h3>'+moversTable(T.movers(c.index));
}
function chart(rows){
 if(rows.length<2)return empty('Au moins deux relevés datés sont nécessaires pour tracer une courbe.');
 const v=rows.map(r=>r.ref),min=Math.min(...v),max=Math.max(...v),d=max-min||1,n=rows.length,med=T.median(v);
 const X=i=>Math.round(30+i/(n-1)*560),Y=p=>Math.round(150-(p-min)/d*125);
 return '<svg class="bt-chart" viewBox="0 0 600 175" role="img" aria-label="Évolution de '+n+' relevés, de '+esc(coin(v[0]))+' à '+esc(coin(v[n-1]))+'"><line x1="30" x2="590" y1="'+Y(med)+'" y2="'+Y(med)+'" class="bt-med"/><polyline points="'+rows.map((r,i)=>X(i)+','+Y(r.ref)).join(' ')+'"/>'+rows.map((r,i)=>'<circle cx="'+X(i)+'" cy="'+Y(r.ref)+'" r="3"><title>'+esc(coin(r.ref)+' · '+when(r.at))+'</title></circle>').join('')+'<text x="30" y="170">'+esc(coin(min))+'</text><text x="590" y="16" text-anchor="end">'+esc(coin(max))+'</text><text x="590" y="'+(Y(med)-4)+'" text-anchor="end" class="bt-medtxt">médiane '+esc(coin(med))+'</text></svg>';
}
function supplySection(item){
 const d=T.supplyChange(item);
 const title='<h3>Évolution de l’offre entre deux scans personnels</h3>';
 const caution='<p class="bt-note">Comparaison de deux scans GrimoireSync du même marché, espacés de moins de 7 jours, dont le plus récent date de moins de 72 h. Une baisse du nombre d’annonces ou d’objets visibles <strong>ne prouve pas une vente</strong> : annulations, expirations ou nouveaux dépôts peuvent expliquer les écarts.</p>';
 if(!d)return title+empty('Deux scans complets GrimoireSync récents et comparables sont nécessaires. Les saisies manuelles et relevés communautaires ne permettent pas ce calcul.')+caution;
 return title+'<div class="bt-kpis">'+
  kpi('Objets actuellement listés',String(d.to),d.from+' → '+d.to+' ('+pct(d.changePct)+')')+
  kpi('Nombre d’annonces',String(d.listingsTo),d.listingsFrom+' → '+d.listingsTo+' ('+(d.listingsChange>0?'+':'')+d.listingsChange+')')+
  kpi('Prix plancher',coin(d.floorTo),coin(d.floorFrom)+' → '+coin(d.floorTo)+' ('+pct(d.floorChangePct)+')')+
  kpi('Intervalle entre relevés',Math.round(d.hours*10)/10+' h',when(d.fromAt)+' → '+when(d.toAt))+
  '</div>'+caution;
}
function vHistory(c){
 const items=c.index.items.slice().sort((a,b)=>a.name.localeCompare(b.name,'fr'));
 if(!items.length)return empty('Aucun relevé pour ce marché.');
 const cur=items.find(x=>x.key===historyItem)||items[0];historyItem=cur.key;
 const s=T.itemStats(cur),rows=(cur.history||[]).map(h=>({...h,ref:Number(h.ask10)||Number(h.price)})).filter(h=>h.ref>0);
 return '<label class="bt-field">Objet<select id="bt-history-item">'+items.map(x=>'<option value="'+esc(x.key)+'"'+(x.key===cur.key?' selected':'')+'>'+esc(x.name)+' ('+x.history.length+')</option>').join('')+'</select></label>'+chart(rows)+supplySection(cur)+
  '<div class="bt-kpis">'+kpi('Médiane',coin(s.median),s.n+' relevés · '+s.days+' jours')+kpi('Moyenne pondérée',coin(s.weightedMean),'pondérée par la quantité listée')+kpi('Volatilité',s.volatility!=null?Math.round(s.volatility)+' %':'—','écart absolu médian / médiane')+kpi('Tendance',pct(s.trend),'tiers récents vs anciens')+kpi('Fraîcheur',s.freshness,when(s.lastAt))+kpi('Confiance',s.confidence,'score '+s.score+'/100')+'</div>'+
  '<div class="bt-table"><table><thead><tr><th>Date</th><th>Plancher</th><th>Prix à 10 %</th><th>Quantité listée</th><th>Annonces</th><th>Source</th></tr></thead><tbody>'+rows.slice().reverse().slice(0,40).map(h=>'<tr><td>'+esc(when(h.at))+'</td><td>'+coin(Number(h.price))+'</td><td>'+(h.ask10?coin(Number(h.ask10)):'—')+'</td><td>'+esc(h.quantity)+'</td><td>'+(h.listings??'—')+'</td><td>'+esc(h.source)+'</td></tr>').join('')+'</tbody></table></div>';
}
function vSim(c){
 const s=simSeed||{};
 return '<form id="bt-sim" class="bt-form"><label class="bt-field">Prix d’achat unitaire (or)<input name="buy" inputmode="decimal" value="'+esc(toGold(s.buy))+'"></label><label class="bt-field">Prix de revente unitaire (or)<input name="sell" inputmode="decimal" value="'+esc(toGold(s.sell))+'"></label><label class="bt-field">Quantité<input name="qty" type="number" min="1" value="'+esc(s.qty||1)+'"></label><label class="bt-field">Commission AH (%)<input name="fee" inputmode="decimal" value="'+esc(c.fee)+'"></label><label class="bt-field">Dépôts perdus (or)<input name="deposit" inputmode="decimal" value="0"></label><label class="bt-field">Part invendue (%)<input name="unsold" type="number" min="0" max="100" value="0"></label></form><div id="bt-sim-out" class="bt-kpis"></div><p class="bt-note">Le dépôt dépend du prix marchand et de la durée de mise en vente : saisis le montant affiché par le jeu. Simulation théorique : aucune garantie d’écoulement.</p>';
}
function simCompute(){
 const f=$('bt-sim');if(!f)return;const d=new FormData(f);
 const r=T.simulate({buy:gold(d.get('buy')),sell:gold(d.get('sell')),qty:Number(d.get('qty')),fee:Number(String(d.get('fee')).replace(',','.')),deposit:gold(d.get('deposit'))||0,unsoldShare:Number(d.get('unsold'))/100});
 $('bt-sim-out').innerHTML=r?kpi('Investissement',coin(r.invest),'achat total')+kpi('Revente nette',coin(r.net),'commission '+coin(r.cut))+kpi('Résultat',coin(r.profit),'après dépôts')+kpi('Rendement',pct(r.roi),'sur capital engagé')+kpi('Seuil de rentabilité',coin(r.breakEven),'prix de vente unitaire minimal')+kpi('Si invendus',coin(r.partial.profit),r.partial.sold+' unité(s) vendue(s), le reste en stock'):'<p class="bt-empty">Renseigne un prix d’achat, un prix de vente et une quantité entière.</p>';
}
function vCrafts(c){
 const profs=Object.entries(c.ch.professions);
 const head='<p class="bt-note">Métiers de '+esc(c.ch.pseudo)+' : '+(profs.length?profs.map(([n,v])=>esc(n)+' '+esc(v.rank)).join(' · '):'non importés')+'. Conversions de cuir : références Classic, à confirmer sur WoW Forever. Tes recettes de l’atelier « Fabriquer ou revendre » sont reprises automatiquement.</p>';
 const list=c.crafts.length?'<div class="bt-cards">'+c.crafts.map(x=>'<article class="bt-card"><header><strong>'+esc(x.recipe.output.name)+'</strong>'+conf(x.status==='ok'?x.confidence:'Insuffisante')+'</header><p>'+esc(x.recipe.ingredients.map(i=>i.qty+' × '+(i.name||i.itemId)).join(' + '))+' → '+esc(x.recipe.yield)+' × '+esc(x.recipe.output.name)+'</p>'+
  (x.status==='ok'?'<dl><div><dt>Coût d’achat des composants</dt><dd>'+coin(x.cost)+'</dd></div><div><dt>Produit net</dt><dd>'+coin(x.outputNet)+'</dd></div><div><dt>Marge si j’achète</dt><dd>'+coin(x.margin)+'</dd></div><div><dt>Gain vs vente des composants</dt><dd>'+coin(x.transformGain)+'</dd></div></dl><p class="bt-decision">'+(x.transformGain>0?'Transformer est plus rentable que vendre les composants':'Vendre les composants rapporte autant ou plus')+'</p><small>Produit relevé : '+esc(when(x.outputAt))+'</small>':'<p class="bt-alert">Données insuffisantes : '+esc(x.missing.join(', '))+'.</p>')+'<small>'+esc(x.recipe.reference)+'</small></article>').join('')+'</div>':empty('Aucune recette applicable : importe tes métiers (Travail du cuir) ou ajoute une recette dans l’atelier de la Bourse.');
 const farm=T.farmTargets({index:c.index,professions:c.ch.professions});
 const farmHtml=farm.length?'<div class="bt-table"><table><thead><tr><th>Ressource</th><th>Cours</th><th>Médiane</th><th>Quantité listée</th><th>Confiance</th><th>Relevé</th></tr></thead><tbody>'+farm.map(f=>'<tr><td>'+esc(f.name)+'</td><td>'+(f.price!=null?coin(f.price):'—')+'</td><td>'+(f.median!=null?coin(f.median):'—')+'</td><td>'+(f.quantity??'—')+'</td><td>'+conf(f.confidence)+'</td><td>'+esc(f.lastAt?when(f.lastAt):'—')+'</td></tr>').join('')+'</tbody></table></div><p class="bt-note">Classement par cours observé. Aucun « or par heure » n’est estimé : il dépend de ta zone et de ton rythme, non mesurés.</p>':empty('Aucune ressource de récolte reconnue pour tes métiers (Dépeçage attendu).');
 return head+list+'<h3>Que dépecer à mon niveau ?</h3>'+skinHtml(c)+'<h3>Que farmer ?</h3>'+farmHtml;
}
function vWallet(c){
 const b=c.budget;
 return '<form id="bt-budget" class="bt-form"><label class="bt-field">Capital mobilisable (or)<input name="capital" inputmode="decimal" placeholder="'+esc(c.ch.gold?toGold(c.ch.gold.value):'ex. 25')+'" value="'+esc(Number.isSafeInteger(state.capitalOverride)?toGold(state.capitalOverride):'')+'"></label><label class="bt-field">Réserve à conserver (%)<input name="reserve" type="number" min="0" max="100" value="'+esc(state.reservePct)+'"></label><label class="bt-field">Exposition max par objet (%)<input name="cap" type="number" min="1" max="100" value="'+esc(state.maxItemPct)+'"></label><button type="submit">Appliquer</button></form>'+
  (b?'<div class="bt-kpis">'+kpi('Capital',coin(b.capital),c.capital.src)+kpi('Réserve intouchable',coin(b.reserve),state.reservePct+' %')+kpi('Déployable',coin(b.deployable),'pour l’ensemble des achats')+kpi('Plafond par objet',coin(b.perItemCap),state.maxItemPct+' % du capital')+kpi('Stock acheté (coût)',coin(c.ledger.remainingCost||0),(c.ledger.remainingUnits||0)+' unité(s) en lots FIFO')+kpi('Résultat réalisé',coin(c.ledger.realized||0),'ventes rapprochées d’achats')+'</div>':empty('Capital inconnu : importe GrimoireSync.lua (or du personnage) ou saisis un montant.'))+
  '<h3>Exposition actuelle par objet</h3>'+(c.ledger.positions?.length?'<div class="bt-table"><table><thead><tr><th>Objet</th><th>Unités</th><th>Coût engagé</th><th>Part du capital</th></tr></thead><tbody>'+c.ledger.positions.filter(p=>p.remaining>0).map(p=>'<tr><td>'+esc(p.item)+'</td><td>'+p.remaining+'</td><td>'+coin(p.carryingCost)+'</td><td>'+(b&&b.capital?pct(100*p.carryingCost/b.capital).replace('+',''):'—')+(b&&p.carryingCost>b.perItemCap?' ⚠':'')+'</td></tr>').join('')+'</tbody></table></div>':empty('Aucune position : déclare tes achats dans le journal ou la Bourse d’Azeroth.'));
}
function tradePerformanceSection(p){
 if(!p)return '';
 const note='<p class="bt-note">Uniquement les opérations que tu as <strong>déclarées</strong> dans le Journal ou la Bourse. Ce n’est ni le volume réel de l’AH, ni une mesure de liquidité globale. Les ventes sans achat enregistré ne contribuent jamais au bénéfice FIFO.</p>';
 if(!p.operations)return '<h3>Ventes déclarées · 30 derniers jours</h3>'+note+empty('Aucune vente datée et saisie sur cette période.');
 const overview='<div class="bt-kpis">'+
  kpi('Unités vendues et saisies',String(p.sold),p.operations+' déclaration(s) sur '+p.days+' jours')+
  kpi('Bénéfice FIFO calculable',coin(p.realized),p.matched+' unité(s) rapprochée(s) d’un achat')+
  kpi('Coût d’achat inconnu',String(p.unmatched)+' unité(s)','exclues du bénéfice, jamais valorisées à zéro')+
  kpi('Rendement sur coût rapproché',p.roi==null?'—':pct(p.roi),p.roi==null?'aucun coût d’achat connu':'hors dépôts et autres frais non déclarés')+'</div>';
 const table='<div class="bt-table"><table><thead><tr><th>Objet</th><th>Vendu</th><th>Coût connu</th><th>Sans coût</th><th>Bénéfice FIFO</th><th>ROI</th><th>Dernière déclaration</th></tr></thead><tbody>'+
  p.rows.slice(0,40).map(x=>'<tr><td>'+esc(x.item)+'</td><td>'+x.sold+'</td><td>'+x.matched+'</td><td>'+x.unmatched+'</td><td>'+coin(x.realized)+'</td><td>'+(x.roi==null?'—':pct(x.roi))+'</td><td>'+esc(when(x.lastSale))+'</td></tr>').join('')+
  '</tbody></table></div>';
 return '<h3>Ventes déclarées · '+p.days+' derniers jours</h3>'+note+overview+table+
  (p.excluded?'<p class="bt-note">'+p.excluded+' déclaration(s) écartée(s) : date ou données incohérentes.</p>':'');
}
function vJournal(c){
 const rev=T.journalReview({decisions:state.decisions,trades:c.trades,index:c.index,fee:c.fee});
 return '<form id="bt-trade" class="bt-form"><label class="bt-field">Opération réelle<select name="kind"><option value="buy">Achat</option><option value="sell">Vente</option></select></label><label class="bt-field">Objet<input name="item" required maxlength="100"></label><label class="bt-field">Quantité<input name="qty" type="number" min="1" value="1" required></label><label class="bt-field">Prix unitaire (or)<input name="price" inputmode="decimal" required></label><button type="submit">Déclarer</button></form><p class="bt-note">Les opérations sont ajoutées au registre de la Bourse d’Azeroth (même carnet) pour comparer prévisions et résultats.</p>'+
  tradePerformanceSection(c.performance)+
  (rev.length?'<div class="bt-table"><table><thead><tr><th>Date</th><th>Décision</th><th>Référence</th><th>Attendu</th><th>Ventes réelles</th><th>Écart</th><th>Cours actuel</th><th>Bilan</th><th></th></tr></thead><tbody>'+rev.slice().reverse().map(d=>'<tr><td>'+esc(when(d.at))+'</td><td>'+esc(d.action+' · '+d.item+' ×'+d.qty)+'</td><td>'+coin(d.reference)+'</td><td>'+(d.expected?coin(d.expected):'—')+'</td><td>'+(d.realizedQty?d.realizedQty+' à '+coin(d.realizedAvg):'—')+'</td><td>'+pct(d.realizedVsExpected)+'</td><td>'+(d.marketNow?coin(d.marketNow)+' ('+pct(d.marketVsReference)+')':'—')+'</td><td>'+esc(d.outcome)+'</td><td><button type="button" data-bt-del-decision="'+esc(d.id)+'" aria-label="Supprimer">×</button></td></tr>').join('')+'</tbody></table></div>':empty('Aucune décision notée. Utilise « Noter ma décision » depuis les sacs ou le radar.'));
}
function vAlerts(c){
 const mine=T.evaluateAlerts(state.alerts,c.index),legacy=T.evaluateAlerts((c.store.alerts||[]).map(a=>({...a,kind:'below',legacy:true})),c.index);
 const rows=[...mine,...legacy];
 return '<form id="bt-alert" class="bt-form"><label class="bt-field">Objet<input name="name" required maxlength="100" list="bt-names"></label><label class="bt-field">Condition<select name="kind"><option value="below">Cours ≤ seuil (achat)</option><option value="above">Cours ≥ seuil (vente)</option></select></label><label class="bt-field">Seuil (or)<input name="ceiling" inputmode="decimal" required></label><button type="submit">Ajouter</button></form><datalist id="bt-names">'+c.index.items.map(x=>'<option value="'+esc(x.name)+'">').join('')+'</datalist>'+
  (rows.length?'<div class="bt-table"><table><thead><tr><th>Objet</th><th>Condition</th><th>Cours</th><th>État</th><th>Relevé</th><th></th></tr></thead><tbody>'+rows.map(a=>'<tr class="'+(a.state==='Seuil atteint'?'bt-hit':'')+'"><td>'+esc(a.name)+'</td><td>'+(a.kind==='above'?'≥ ':'≤ ')+coin(a.ceiling)+'</td><td>'+(a.current?coin(a.current):'—')+'</td><td>'+esc(a.state)+'</td><td>'+esc(a.lastAt?when(a.lastAt):'—')+'</td><td>'+(a.legacy?'<small>Bourse</small>':'<button type="button" data-bt-del-alert="'+esc(a.id)+'" aria-label="Supprimer">×</button>')+'</td></tr>').join('')+'</tbody></table></div>':empty('Aucune alerte.'))+'<p class="bt-note">Les alertes sont évaluées sur tes relevés à l’ouverture de l’onglet, sans notification ni surveillance en arrière-plan.</p>';
}
function vFaith(c){
 const f=T.faithBrief({bags:c.bags,opps:c.opps,crafts:c.crafts,budget:c.budget,scope:c.scope?.id,dataNote:c.lastScan?'Données du scan du '+when(c.lastScan)+'.':'Aucun scan GrimoireSync importé : les avis reposent sur des relevés manuels.'});
 return '<div class="bt-faith"><p class="bt-faith-intro">Faith, intendante marchande : je ne reformule que les calculs ci-dessus, sans rien inventer.</p>'+f.lines.map(l=>'<p>'+esc(l)+'</p>').join('')+(f.refs.length?'<h3>Références</h3><ol class="bt-refs">'+f.refs.map(r=>'<li>'+esc(r)+'</li>').join('')+'</ol>':'')+'</div>';
}
function feedMarketId(){const ids=Object.keys(feed?.markets||{});return state.feedMarket&&ids.includes(state.feedMarket)?state.feedMarket:null}
function regionMarket(){const id=feedMarketId();if(!id)return null;const m=T.marketMeta(id,feed.markets[id].meta);return m.region&&m.region===state.region&&state.confirmedMarket===id?feed.markets[id]:null}
function gate(c){const id=feedMarketId();return T.canMergeFeed({userRegion:state.region,confirmedMarket:state.confirmedMarket,marketId:id,marketInfo:id?feed.markets[id].meta:null,scopeFaction:c.scope?.faction,enabled:state.autoFeed})}
function skinHtml(c){
 const plan=T.skinningPlan({level:c.ch.level,professions:c.ch.professions,index:c.index,feedMarket:regionMarket()});
 if(plan.status!=='ok')return empty('Dépeçage non importé : importe GrimoireSync.lua pour obtenir un plan selon ton niveau.');
 const best=plan.best?'<p class="bt-decision">Priorité : '+esc(plan.best.name)+' — '+coin(plan.best.leather.price)+' l’unité ('+esc(plan.best.leather.src)+', '+esc(when(plan.best.leather.at))+'), monstres niveau '+plan.best.mobRange.join('–')+'.</p>':'<p class="bt-alert">Aucun cuir accessible n’a de cote connue : données insuffisantes.</p>';
 return '<p class="bt-note">Niveau '+(plan.level||'inconnu')+' · Dépeçage '+plan.skill+' → monstres dépeçables jusqu’au niveau '+plan.maxMob+(plan.nextSkill?' (niveau '+plan.nextSkill.mobLevel+' à '+plan.nextSkill.skill+' de compétence)':'')+'. Règle et tranches de niveaux Classic, à confirmer sur Forever.</p>'+best+
  '<div class="bt-table"><table><thead><tr><th>Cuir</th><th>Monstres</th><th>Cuir</th><th>Peau</th><th>Pour toi</th></tr></thead><tbody>'+plan.tiers.map(t=>'<tr><td>'+esc(t.name)+'</td><td>'+t.mobs.join('–')+'</td><td>'+(t.leather?coin(t.leather.price):'—')+'</td><td>'+(t.hideP?coin(t.hideP.price):'—')+'</td><td>'+esc(t.why)+'</td></tr>').join('')+'</tbody></table></div>';
}
function ahledgerLookupSection(c){
 const faction=c.scope?.faction==='Alliance'?'alliance':'horde';
 const market=AH?.market('eu','normal',faction);
 const link=market?.page||'https://ahledger.com';
 return '<section class="bt-ahl-source"><h3>Prix EU par objet · AHledger</h3>'+
  '<p class="bt-note">Consultation ponctuelle de prix publics, sans clé API. Choisis la région, le type de serveur et la faction : cela ne modifie pas ton marché La Binch. Aucun achat, import ou enregistrement automatique.</p>'+ (lookupItemId?'<p class="bt-honesty">Objet de tes sacs présélectionné : <b>'+esc(lookupItemName)+'</b> (#'+lookupItemId+'). Vérifie le marché avant de demander son cours.</p>':'')+
  '<form id="bt-ahl-query" class="bt-form">'+
  '<label class="bt-field">Région<select name="region"><option value="eu">Europe (EU)</option><option value="us">Amériques (US)</option></select></label>'+
  '<label class="bt-field">Mode<select name="ruleset"><option value="normal">Normal</option><option value="pvp">JcJ</option><option value="rp">RP</option><option value="rppvp">RP JcJ</option></select></label>'+
  '<label class="bt-field">Faction<select name="faction"><option value="horde"'+(faction==='horde'?' selected':'')+'>Horde</option><option value="alliance"'+(faction==='alliance'?' selected':'')+'>Alliance</option></select></label>'+
  '<label class="bt-field">ID de l’objet WoW<input name="item" type="number" min="1" max="1000000" step="1" required value="'+(lookupItemId||'')+'" placeholder="Ex. 2318"></label>'+
  '<button type="submit">Consulter ce prix</button>'+
  '<div class="bt-actions">'+[['deals','Bonnes affaires'],['crafting','Craft rentable'],['structure','Liquidité AH'],['signals','Signaux de prix']].map(([tool,label])=>
   '<a data-bt-market-tool="'+tool+'" href="'+esc(AH?.marketToolUrl?.(market,tool)||'https://ahledger.com')+'" target="_blank" rel="noopener noreferrer">'+esc(label)+' ↗</a>').join('')+'</div></form>'+
  '<div id="bt-ahl-result" role="status" aria-live="polite"></div>'+
  '<p class="bt-note">Source tierce gratuite avec attribution. Les prix ne sont ni garantis ni versés dans ton carnet. <a href="'+link+'" target="_blank" rel="noopener noreferrer">Ouvrir le marché Europe · Normal · '+esc(faction==='horde'?'Horde':'Alliance')+' chez AHledger</a> · <a href="https://ahledger.com/developers" target="_blank" rel="noopener noreferrer">API et conditions</a>.</p></section>';
}

async function onAhl(form){
 const target=$('bt-ahl-result'),values=new FormData(form);
 const market=AH?.market(String(values.get('region')||''),String(values.get('ruleset')||''),String(values.get('faction')||''));
 const itemId=Number(values.get('item')),url=AH?.lookupUrl(market,itemId);
 if(!target||!market||!url){if(target)target.textContent='Choisis un marché valide et un ID d’objet positif.';return}
 target.textContent='Consultation ponctuelle AHledger en cours…';
 const ctrl=new AbortController(),timeout=setTimeout(()=>ctrl.abort(),9000);
 try{
  const response=await fetch(url,{signal:ctrl.signal,cache:'no-store'});
  if(!response.ok)throw Error('HTTP '+response.status);
  const quote=AH.parseQuote(await response.json(),{...market,itemId});
  if(!quote.ok){target.innerHTML='<p class="bt-alert">'+esc(quote.reason)+'</p><a href="'+market.page+'" target="_blank" rel="noopener noreferrer">Consulter directement le marché sur AHledger</a>';return}
  const price=n=>n==null?'non renseigné':coin(n);
  const rate=quote.estimatedSalesPerDay;
  const liquidity=rate==null?'Rotation non estimable : historique de ventes insuffisant.':'Rotation estimée : '+rate.toLocaleString('fr-FR',{maximumFractionDigits:1})+' unité(s)/jour'+(quote.salesWindowDays?' sur '+quote.salesWindowDays+' jours':'')+'.';
  target.innerHTML='<article class="bt-card"><h4>'+esc(quote.name)+' · '+market.id.toUpperCase()+'</h4>'+
   '<p>Prix le plus bas : <strong>'+price(quote.minBuyout)+'</strong> · médiane : <strong>'+price(quote.median)+'</strong>'+
   ' · médiane sur 7 jours : '+price(quote.median7d)+'.</p>'+
   '<p>Quantité : '+(quote.quantity??'inconnue')+' · annonces : '+(quote.auctions??'inconnues')+' · source : '+esc(quote.source)+' · '+esc(when(quote.observedAt))+'.</p>'+
   '<p class="bt-note">'+esc(liquidity)+' Estimation AHledger, non une preuve de ventes conclues ni une garantie de revente.</p>'+
   (quote.stale?'<p class="bt-alert">Relevé périmé (plus de 72 h) : pas de conseil d’achat.</p>':'<p class="bt-note">Donnée observée, pas une promesse de vente ni un ordre d’achat.</p>')+
   '<p><a href="'+esc(quote.attribution)+'" target="_blank" rel="noopener noreferrer">Prices from AHledger</a> · <a href="'+market.page+'" target="_blank" rel="noopener noreferrer">Voir le marché</a>.</p></article>';
 }catch(err){
  target.innerHTML='<p class="bt-alert">Lecture directe indisponible ('+esc(err?.name==='AbortError'?'délai dépassé':'réseau ou accès navigateur refusé')+'). Aucun prix inventé.</p>'+
   '<p><a href="'+market.page+'" target="_blank" rel="noopener noreferrer">Consulter gratuitement les prix du marché chez AHledger</a></p>';
 }finally{clearTimeout(timeout)}
}

function vLive(c){
 const sum=T.feedSummary(feed),mk=feedMarketId();
 const head='<p class="bt-honesty">Flux de relevés : auctionhouse.fyi (marchés US) et, seulement si configurée, API Blizzard Forever expérimentale. Publication planifiée toutes les 3 h, relecture ici toutes les 10 minutes. Les prix dépendent des scans d’autres joueurs : <b>ce n’est pas un flux temps réel</b>. Ton propre <code>/grimoire scan</code> reste la source la plus fraîche.</p>';
 if(!sum)return head+ahledgerLookupSection(c)+empty(feedStatus||'Flux communautaire actuellement indisponible.')+'<button type="button" id="bt-feed-refresh">Réessayer</button>';
 const markets=sum.markets;
 const ids=[...new Set(markets.flatMap(m=>Object.keys(feed.markets[m.market].items||{})))];
 const table='<div class="bt-table"><table><thead><tr><th>Objet</th>'+markets.map(m=>'<th>'+esc(m.label)+'</th>').join('')+'</tr></thead><tbody>'+ids.map(id=>{
  const cm=T.crossMarket(feed,Number(id)),comparable=cm.filter(x=>x.price!=null&&x.fresh&&x.region===state.region&&x.faction===c.scope?.faction);
  const low=comparable.length>=2?comparable[0].market:null;
  return '<tr><td>'+esc(feed.names?.[id]?.n||'Objet '+id)+'</td>'+markets.map(m=>{
   const x=cm.find(y=>y.market===m.market);
   const cell=x?.price!=null?coin(x.price)+'<br><small>'+esc(when(x.at))+' · '+(x.fresh?'relevé récent':'périmé, non comparable')+'</small>':'—';
   return '<td'+(low&&x?.market===low?' class="bt-up"':'')+'>'+cell+'</td>';
  }).join('')+'</tr>';
 }).join('')+'</tbody></table></div>';
 const top=[...c.bags.filter(b=>['Vendre à l’AH','Transformer','Garder'].includes(b.decision)).slice(0,4).map(b=>b.decision+' : '+b.name+' ×'+b.count+(b.price?' (cours '+coin(b.price)+')':'')),...c.opps.filter(o=>o.status==='Achat à étudier').slice(0,3).map(o=>'Achat à étudier : '+o.name+' à '+coin(o.price)+' (médiane '+coin(o.reference)+')')];
 const g=mk?gate(c):{ok:false,reason:'Choisis un marché.'},regionHas=markets.some(m=>m.meta.region===state.region);
 const controls='<div class="bt-form"><label class="bt-field">Région de ton compte<select id="bt-region"><option value="">Non renseignée</option>'+['eu','us'].map(r=>'<option value="'+r+'"'+(state.region===r?' selected':'')+'>'+r.toUpperCase()+'</option>').join('')+'</select></label><label class="bt-field">Marché à afficher<select id="bt-feed-market"><option value="">Choisir…</option>'+markets.map(m=>'<option value="'+esc(m.market)+'"'+(m.market===mk?' selected':'')+'>'+esc(m.label)+'</option>').join('')+'</select></label><button type="button" id="bt-feed-refresh">Actualiser</button></div>'+
  (mk?'<label class="bt-check"><input type="checkbox" id="bt-feed-confirm"'+(state.confirmedMarket===mk?' checked':'')+'> Je confirme que « '+esc(T.MARKET_LABEL(mk,feed.markets[mk].meta))+' » est bien mon marché</label><label class="bt-check"><input type="checkbox" id="bt-feed-auto"'+(state.autoFeed?' checked':'')+'> Intégrer ce marché à mon carnet</label><p class="'+(g.ok?'bt-honesty':'bt-alert')+'">Intégration : '+esc(g.ok?'active':'bloquée')+' — '+esc(g.reason)+'</p>':'')+
  (state.region&&!regionHas?'<p class="bt-alert">Aucun marché '+esc(state.region.toUpperCase())+' dans le flux : les cours ci-dessous concernent une autre région, à titre indicatif seulement. Ton <code>/grimoire scan</code> reste la seule source de ton serveur.</p>':'');
 return head+ahledgerLookupSection(c)+controls+
  '<div class="bt-kpis">'+kpi('Flux publié',when(sum.generatedAt),'collecteur GitHub')+markets.map(m=>kpi(m.label,m.scanAt?when(m.scanAt):'—',m.items+' objets · '+m.contributors7d+' contributeur(s) / 7 j')).join('')+'</div>'+
  '<h3>Conseils du moment pour '+esc(c.ch.pseudo)+(c.ch.level?' (niveau '+c.ch.level+')':'')+'</h3>'+(top.length?'<ol class="bt-list">'+top.map(t=>'<li>'+esc(t)+'</li>').join('')+'</ol>':empty('Pas encore de conseil étayé : il faut au moins 3 relevés par objet (le flux en apporte jusqu’à 8 par passage).'))+
  '<h3>Que dépecer maintenant ?</h3>'+skinHtml(c)+
  '<h3>Comparaison des hôtels des ventes</h3><p class="bt-note">Le moins cher est en vert seulement si au moins deux relevés récents (72 h maximum) concernent ta région et ta faction. Les cours périmés sont visibles, mais exclus de la comparaison. Aucun transfert automatique entre serveurs ou factions.</p>'+table+(feedStatus?'<p class="bt-note">'+esc(feedStatus)+'</p>':'');
}
async function loadFeed(force){
 try{
  const res=await fetch(T.FEED_URL+(force?'?t='+Date.now():''),{cache:force?'no-store':'default'});
  if(!res.ok)throw Error(res.status===404?'Flux pas encore publié (collecteur actif après fusion de la PR).':'Flux indisponible (HTTP '+res.status+').');
  const f=await res.json();if(!T.feedSummary(f))throw Error('Flux au format inattendu.');
  feed=f;write('binch.ah.feed.cache.v1',f);feedStatus='';
 }catch(e){feedStatus=(e.message||'Flux injoignable')+(feed?' Dernière copie locale affichée.':'')}
 mergeFeed();render();
}
function mergeFeed(){
 const scope=scopeOf(),mk=feedMarketId();if(!feed||!scope||!mk)return;
 if(!T.canMergeFeed({userRegion:state.region,confirmedMarket:state.confirmedMarket,marketId:mk,marketInfo:feed.markets[mk].meta,scopeFaction:scope.faction,enabled:state.autoFeed}).ok)return;
 const rows=T.feedObservations(feed,mk,{realm:scope.realm});if(!rows.length)return;
 const out=T.mergeObservations(read(MARKET,{}),rows);
 if(out.marketConflicts)feedStatus=out.marketConflicts+' relevé(s) refusé(s) : un autre marché ou une autre région est déjà présent dans l’historique de cet objet. Aucun mélange effectué.';
 if(out.added)try{persistMarket(out.store)}catch{}
}
function vData(c){
 const p=pendingScan;
 return '<h3>1 · Scan de l’hôtel des ventes (recommandé)</h3><ol class="bt-list"><li>En jeu, ouvre l’hôtel des ventes et tape <code>/grimoire scan</code> (lecture seule, un scan complet est accepté environ toutes les 15 minutes).</li><li>Attends le message « scan termine », puis tape <code>/reload</code>.</li><li>Choisis <code>WTF/Account/…/SavedVariables/GrimoireSync.lua</code> ci-dessous.</li></ol>'+
  '<label class="bt-file">Choisir GrimoireSync.lua<input id="bt-scan-file" type="file" accept=".lua,.txt"></label><p id="bt-scan-status" role="status"></p>'+
  (p?'<div class="bt-scan-preview"><p><b>'+esc(p.g.character.name)+'</b> · '+esc(p.g.scan.realm)+' · '+esc(p.g.scan.faction)+' · scan du '+esc(when(p.g.scan.at))+' · '+p.g.scan.listings.length+' annonces · '+p.agg.length+' objets distincts.</p>'+
   (c.scope&&c.scope.id!==p.g.scan.realm.toLocaleLowerCase('fr')+'|'+p.g.scan.faction?'<p class="bt-alert">Ce scan concerne '+esc(p.g.scan.realm+' / '+p.g.scan.faction)+', différent du marché sélectionné ('+esc(c.scope.realm+' / '+c.scope.faction)+'). L’import basculera la Bourse sur le marché du scan.</p>':'')+
   '<label class="bt-check"><input type="checkbox" id="bt-scan-top" checked> Ajouter aussi les objets les plus listés (dans la limite de 500 objets suivis)</label><p class="bt-note">Toujours inclus : tes sacs, les objets déjà suivis, tes recettes, les cuirs et peaux. '+p.relevant+' objet(s) concerné(s).</p><button type="button" id="bt-scan-apply">Enregistrer ce scan dans le carnet</button> <button type="button" id="bt-scan-cancel">Annuler</button></div>':'')+
  '<h3>2 · Relevé communautaire auctionhouse.fyi (optionnel)</h3><p class="bt-note">Le site n’autorise pas la lecture directe depuis La Binch (pas d’en-tête CORS). Ouvre <code>https://auctionhouse.fyi/api/v1/ah/forever.normal.horde.us/&lt;id&gt;</code>, copie la réponse JSON et colle-la ici. Données communautaires horaires, enregistrées comme telles.</p><form id="bt-fyi" class="bt-form"><label class="bt-field">Nom de l’objet<input name="name" required maxlength="100"></label><label class="bt-field bt-wide">Réponse JSON<textarea name="json" rows="3" required></textarea></label><button type="submit">Importer</button></form><p id="bt-fyi-status" role="status"></p>'+
  '<h3>3 · Relevés manuels et CSV</h3><p class="bt-note">Toujours disponibles dans l’onglet « Bourse d’Azeroth ».</p>'+
  '<h3>Historique des imports</h3>'+(state.imports.length?'<ul class="bt-list">'+state.imports.slice().reverse().map(i=>'<li>'+esc(when(i.at))+' · '+esc(i.kind)+' · '+esc(i.detail)+'</li>').join('')+'</ul>':empty('Aucun import réalisé depuis l’Assistant Trading.'));
}

/* ---------- actions ---------- */
function persistMarket(store){
 if(!write(MARKET,store))throw Error('Stockage local plein : exporte puis allège le carnet dans la Bourse.');
 // Prévenir les modules déjà chargés (Bourse, radar, atelier) qui gardent une copie en mémoire.
 try{window.dispatchEvent(new StorageEvent('storage',{key:MARKET}))}catch{}
}
async function onScanFile(file){
 const status=$('bt-scan-status');pendingScan=null;
 try{
  if(!file||file.size>25e6)throw Error('Fichier absent ou trop volumineux (25 Mo max).');
  const g=T.parseGrimoire(await file.text());
  state.grimoire={character:g.character,professions:g.professions,inventory:g.inventory,importedAt:new Date().toISOString()};save();
  if(!g.scan)throw Error('Personnage, sacs et métiers importés. Aucun scan AH dans ce fichier : lance /grimoire scan à l’hôtel des ventes puis /reload.');
  if(!g.scan.valid)throw Error('Personnage importé. Scan AH inexploitable : '+g.scan.problem);
  const agg=T.aggregateListings(g.scan.listings),store=read(MARKET,{}),scopeId=g.scan.realm.toLocaleLowerCase('fr')+'|'+g.scan.faction;
  const ids=new Set(g.inventory.map(x=>x.id));Object.keys(T.LEATHER).forEach(id=>ids.add(Number(id)));
  const names=new Set();for(const x of store.items||[])if(x.scope===scopeId){names.add(x.name.toLocaleLowerCase('fr'));if(x.itemId)ids.add(x.itemId)}
  for(const r of read(CRAFT,[])){names.add(String(r.output||'').toLocaleLowerCase('fr'));for(const i of r.ingredients||[])names.add(String(i.name||'').toLocaleLowerCase('fr'))}
  for(const a of state.alerts)names.add(String(a.name).toLocaleLowerCase('fr'));
  const relevant=agg.filter(a=>ids.has(a.itemId)||names.has(a.name.toLocaleLowerCase('fr')));
  pendingScan={g,agg,ids,names,relevant:relevant.length,scopeId};
  status.textContent='Scan lu. Vérifie le résumé puis enregistre.';
 }catch(e){status.textContent=e.message}
 render();
}
function applyScan(){
 const p=pendingScan;if(!p)return;
 const top=$('bt-scan-top')?.checked,store=read(MARKET,{version:1,items:[],trades:[],alerts:[],fee:5});
 const tracked=(store.items||[]).filter(x=>x.scope===p.scopeId).length;
 let room=Math.max(0,500-(store.items||[]).length);
 const keep=new Set(p.agg.filter(a=>p.ids.has(a.itemId)||p.names.has(a.name.toLocaleLowerCase('fr'))).map(a=>a.itemId));
 if(top)for(const a of p.agg){if(keep.size>=room+tracked)break;keep.add(a.itemId)} // la fusion plafonne de toute façon à 500 objets
 const rows=T.scanObservations(p.g.scan,a=>keep.has(a.itemId));
 const out=T.mergeObservations(store,rows);
 try{
  persistMarket(out.store);
  write(SCOPE,{realm:p.g.scan.realm.toLocaleLowerCase('fr'),faction:p.g.scan.faction});
  state.imports.push({at:new Date().toISOString(),kind:'Scan GrimoireSync',detail:p.g.scan.realm+' / '+p.g.scan.faction+' · scan du '+when(p.g.scan.at)+' · '+out.added+' relevés ajoutés'+(out.skipped?' · '+out.skipped+' ignorés (limite 500 objets)':'')+' · '+tracked+' objets déjà suivis'});save();
  pendingScan=null;$('bt-scan-status').textContent=out.added+' relevé(s) ajouté(s) au carnet, '+out.rejected+' rejeté(s).';
 }catch(e){$('bt-scan-status').textContent=e.message}
 state.view='dashboard';render();
}
function onFyi(form){
 const d=new FormData(form),scope=scopeOf(),status=$('bt-fyi-status');
 try{
  if(!scope)throw Error('Choisis d’abord ton marché (royaume et faction).');
  if(state.region!=='us')throw Error('auctionhouse.fyi ne couvre que des marchés US : renseigne la région US dans « En direct » si c’est bien la tienne.');
  const rows=T.parseCommunity(String(d.get('json')),{name:d.get('name'),realm:scope.realm});
  if(rows.some(r=>r.faction!==scope.faction))throw Error('Ce relevé concerne l’autre faction que ton marché sélectionné.');
  const out=T.mergeObservations(read(MARKET,{}),rows);persistMarket(out.store);
  state.imports.push({at:new Date().toISOString(),kind:'auctionhouse.fyi',detail:d.get('name')+' · '+out.added+' relevé(s)'});save();
  status.textContent=out.added+' relevé(s) communautaire(s) ajouté(s).'+(out.marketConflicts?' '+out.marketConflicts+' refusé(s) : historique d’un autre marché/règleset, aucun mélange.':'');form.reset();
 }catch(e){status.textContent=e instanceof SyntaxError?'JSON invalide : colle la réponse complète.':e.message}
}
function onTrade(form){
 const d=new FormData(form),price=gold(d.get('price')),qty=Number(d.get('qty')),item=String(d.get('item')||'').trim().slice(0,100),scope=scopeOf();
 if(!item||!price||!Number.isInteger(qty)||qty<1)return;
 const store=read(MARKET,{version:1,items:[],trades:[],alerts:[],fee:5});store.trades=Array.isArray(store.trades)?store.trades:[];
 if(store.trades.length>=400)return alert('Registre plein (400 opérations).');
 store.trades.push({id:uid(),kind:d.get('kind')==='sell'?'sell':'buy',item,qty,price,scope:scope?.id||'legacy',fee:Number(store.fee??5),at:new Date().toISOString()});
 persistMarket(store);form.reset();render();
}
function render(){
 const host=$('bt-view');if(!host)return;
 const c=context(),v=VIEWS.some(x=>x[0]===state.view)?state.view:'dashboard';
 document.querySelectorAll('#bt-tabs [data-bt-view]').forEach(b=>{const on=b.dataset.btView===v;b.classList.toggle('active',on);b.setAttribute('aria-selected',on)});
 $('bt-scope').innerHTML=scopeBanner(c);
 host.innerHTML='<h2>'+esc(VIEWS.find(x=>x[0]===v)[1])+'</h2>'+({dashboard:vDashboard,live:vLive,bags:vBags,radar:vRadar,history:vHistory,sim:vSim,crafts:vCrafts,wallet:vWallet,journal:vJournal,alerts:vAlerts,faith:vFaith,data:vData})[v](c);
 if(v==='sim')simCompute();
}

function mount(){
 const nav=document.querySelector('#app nav.nav'),main=document.querySelector('#app main');
 if(!nav||!main||$('page-trading'))return;
 const tab=document.createElement('button');tab.type='button';tab.dataset.page='trading';tab.textContent='⚖ Assistant Trading';
 const market=nav.querySelector('[data-page="market"]');market?market.after(tab):nav.append(tab);
 const page=document.createElement('section');page.className='page';page.id='page-trading';
 page.innerHTML='<section class="bt"><header class="bt-head"><div><div class="eyebrow">LA BINCH · CONSEILLER MARCHAND</div><h1>Assistant Trading</h1><p>Vendre, garder, transformer, acheter : des avis calculés et expliqués à partir de tes vrais relevés. Tu décides et tu cliques toi-même en jeu.</p></div><span class="bt-badge">Aucune transaction automatisée</span></header><div id="bt-scope"></div><nav id="bt-tabs" class="bt-tabs" role="tablist" aria-label="Sections de l’Assistant Trading">'+VIEWS.map(([id,label])=>'<button type="button" role="tab" data-bt-view="'+id+'">'+esc(label)+'</button>').join('')+'</nav><div id="bt-view" class="bt-view" role="tabpanel"></div></section>';
 main.append(page);
 tab.addEventListener('click',()=>{nav.querySelectorAll('[data-page]').forEach(x=>x.classList.toggle('active',x===tab));main.querySelectorAll('.page').forEach(x=>x.classList.toggle('active',x===page));window.scrollTo({top:0,behavior:'auto'});render();loadFeed(false);clearInterval(feedTimer);feedTimer=setInterval(()=>{if(page.classList.contains('active')&&document.visibilityState==='visible')loadFeed(true)},600000)});
 page.addEventListener('click',e=>{
  const t=e.target.closest('button');if(!t)return;
  if(t.dataset.btLookup){
   const id=Number(t.dataset.btLookup);if(!Number.isSafeInteger(id)||id<1||id>1000000)return;
   lookupItemId=id;lookupItemName=String(t.dataset.btLookupName||'Objet #'+id).slice(0,100);
   state.view='live';save();render();$('bt-ahl-query')?.scrollIntoView({behavior:'auto',block:'start'});return;
  }
  if(t.dataset.btView){state.view=t.dataset.btView;save();render();return}
  if(t.dataset.btSim){simSeed=JSON.parse(t.dataset.btSim);state.view='sim';render();return}
  if(t.dataset.btDecide){
   const ref=Number(t.dataset.btRef),exp=Number(t.dataset.btExp)||null,qty=Number(t.dataset.btQty)||1;
   state.decisions.push({id:uid(),item:t.dataset.btDecide,action:t.dataset.btAction,reference:ref,expected:exp,qty,at:new Date().toISOString()});save();
   t.textContent='Décision notée ✓';t.disabled=true;return}
  if(t.dataset.btDelDecision){state.decisions=state.decisions.filter(d=>d.id!==t.dataset.btDelDecision);save();render();return}
  if(t.dataset.btDelAlert){state.alerts=state.alerts.filter(a=>a.id!==t.dataset.btDelAlert);save();render();return}
  if(t.id==='bt-feed-refresh'){feedStatus='Actualisation…';loadFeed(true);return}
  if(t.id==='bt-scan-apply')applyScan();
  if(t.id==='bt-scan-cancel'){pendingScan=null;render()}
 });
 page.addEventListener('change',e=>{
  // Ces liens correspondent au marché réellement choisi dans les sélecteurs, sans fetch ni import.
  if(e.target.closest('#bt-ahl-query')){
   const form=$('bt-ahl-query'),d=new FormData(form),m=AH?.market(String(d.get('region')||''),String(d.get('ruleset')||''),String(d.get('faction')||''));
   form.querySelectorAll('a[data-bt-market-tool]').forEach(a=>{const url=AH?.marketToolUrl?.(m,a.dataset.btMarketTool);if(url)a.href=url});
  }
  if(e.target.id==='bt-scan-file'){const f=e.target.files?.[0];e.target.value='';onScanFile(f)}
  if(e.target.id==='bt-history-item'){historyItem=e.target.value;render()}
  if(e.target.id==='bt-feed-market'){state.feedMarket=e.target.value||null;save();render()}
  if(e.target.id==='bt-region'){state.region=e.target.value||null;save();render()}
  if(e.target.id==='bt-feed-confirm'){state.confirmedMarket=e.target.checked?feedMarketId():null;save();mergeFeed();render()}
  if(e.target.id==='bt-feed-auto'){state.autoFeed=e.target.checked;save();mergeFeed();render()}
 });
 page.addEventListener('input',e=>{if(e.target.closest('#bt-sim'))simCompute()});
 page.addEventListener('submit',e=>{
  e.preventDefault();const f=e.target;
  if(f.id==='bt-ahl-query')onAhl(f);
  if(f.id==='bt-fyi')onFyi(f);
  if(f.id==='bt-trade')onTrade(f);
  if(f.id==='bt-budget'){const d=new FormData(f);state.capitalOverride=gold(d.get('capital'));state.reservePct=Math.max(0,Math.min(100,Number(d.get('reserve'))||0));state.maxItemPct=Math.max(1,Math.min(100,Number(d.get('cap'))||15));save();render()}
  if(f.id==='bt-alert'){const d=new FormData(f),ceiling=gold(d.get('ceiling')),name=String(d.get('name')||'').trim().slice(0,100);if(name&&ceiling>0){state.alerts.push({id:uid(),name,kind:d.get('kind')==='above'?'above':'below',ceiling});save();render()}}
 });
 window.addEventListener('storage',e=>{if([MARKET,SCOPE,KEY,CRAFT,'grimoire.bridge.last','grimoire.craft.v1'].includes(e.key)&&page.classList.contains('active')){if(e.key===KEY)state=Object.assign(defaults(),read(KEY,{}));render()}});
 if(location.hash==='#trading')tab.click();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(mount,0));else setTimeout(mount,0);
})();

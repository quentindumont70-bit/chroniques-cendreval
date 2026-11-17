/* La Binch — Assistant Trading · moteur économique (sans DOM, testable sous Node).
   Règles : aucune donnée inventée, aucune transaction automatisée, « Données insuffisantes »
   plutôt qu'un conseil fabriqué. Toutes les valeurs monétaires sont en pièces de cuivre entières.
   Sources réelles exploitées :
   - carnet AH existant `binch.ah.market.v1` (saisies et imports de La Binch) ;
   - scan de l'hôtel des ventes lancé par le joueur avec l'addon GrimoireSync (`/grimoire scan`),
     relu depuis SavedVariables/GrimoireSync.lua (section AH/A du payload GF6) ;
   - réponse JSON d'auctionhouse.fyi collée manuellement (relevés communautaires, pas de CORS).
*/
(function(root,factory){const api=factory();root.BinchTrading=api;if(typeof module==='object'&&module&&module.exports)module.exports=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){'use strict';

const DAY=86400000,HOUR=3600000;
const SCAN_SOURCE='Scan GrimoireSync (/grimoire scan)';
const COMMUNITY_SOURCE='auctionhouse.fyi (relevé communautaire)';
const MAX_HISTORY=120,MAX_ITEMS=500;

/* ---------- outils ---------- */
const clean=(s,n=100)=>String(s??'').trim().slice(0,n);
const norm=s=>clean(s).toLocaleLowerCase('fr');
const isCopper=v=>Number.isSafeInteger(v)&&v>0&&v<1e12;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const feeRate=f=>{const x=Number(f);return Number.isFinite(x)?clamp(x,0,20)/100:0.05};
const decode=s=>{try{return decodeURIComponent(String(s??''))}catch{return String(s??'')}};
function coin(n){
 if(!Number.isFinite(n))return '—';
 let x=Math.round(n);const sign=x<0?'-':'';x=Math.abs(x);
 const g=Math.floor(x/10000),s=Math.floor(x%10000/100),c=x%100;
 return sign+(g?g+'po ':'')+(g||s?s+'pa ':'')+c+'pc';
}
function median(values){
 const a=values.filter(Number.isFinite).sort((x,y)=>x-y),m=a.length>>1;
 return a.length?(a.length%2?a[m]:(a[m-1]+a[m])/2):null;
}
/** Médiane pondérée : [{value,weight}] */
function weightedMedian(rows){
 const a=rows.filter(r=>Number.isFinite(r.value)&&r.weight>0).sort((x,y)=>x.value-y.value);
 const total=a.reduce((n,r)=>n+r.weight,0);if(!total)return null;
 let acc=0;for(const r of a){acc+=r.weight;if(acc>=total/2)return r.value}
 return a[a.length-1].value;
}
function weightedMean(rows){
 let w=0,s=0;for(const r of rows){if(Number.isFinite(r.value)&&r.weight>0){w+=r.weight;s+=r.value*r.weight}}
 return w?s/w:null;
}
function parseTime(v){
 if(typeof v==='number'&&Number.isFinite(v))return v<1e11?v*1000:v; // secondes Lua ou millisecondes
 const t=Date.parse(v);return Number.isFinite(t)?t:null;
}

/* ---------- 1. Lecture du scan GrimoireSync ---------- */
function extractPayload(text){
 const raw=String(text??'').trim();
 if(/^GF\d+\|/.test(raw))return raw;
 const m=raw.match(/(?:\["payload"\]|payload)\s*=\s*"((?:\\.|[^"\\])*)"/);
 if(!m)throw Error('Aucun payload GrimoireSync trouvé. Fais /grimoire scan à l’hôtel des ventes puis /reload avant de choisir GrimoireSync.lua.');
 return m[1].replace(/\\"/g,'"').replace(/\\\\/g,'\\');
}
function sections(payload){
 const out={};
 for(const part of payload.split('|').slice(1)){const i=part.indexOf(':');if(i>0)out[part.slice(0,i)]=part.slice(i+1)}
 return out;
}
/** Retourne le personnage, ses métiers, ses sacs et le dernier scan AH contenus dans le payload. */
function parseGrimoire(text,now=Date.now()){
 const payload=extractPayload(text);
 if(!/^GF[3-9]\|/.test(payload))throw Error('Format GrimoireSync non pris en charge.');
 const s=sections(payload),c=(s.C||'').split(',');
 const character={name:decode(c[0]),realm:decode(c[1]),level:Number(c[2])||0,classToken:decode(c[3]),faction:decode(c[5]),gold:Number.isSafeInteger(Number(c[7]))&&Number(c[7])>=0?Number(c[7]):null,capturedAt:parseTime(Number(c[8]))};
 const professions={};
 for(const row of (s.P||'').split(';').filter(Boolean)){const [n,rank,max]=row.split(',');const r=Number(rank);if(n&&Number.isFinite(r)&&r>=0&&r<=450)professions[decode(n)]={rank:r,max:Number(max)||null}}
 const inventory=(s.I||'').split(';').filter(Boolean).slice(0,500).map(row=>{const [id,count,bag,slot,quality,vendor,name]=row.split(',');return {id:Number(id),count:Number(count)||1,bag:Number(bag),slot:Number(slot),quality:Number(quality)||0,vendor:Number(vendor)||0,name:decode(name)}}).filter(x=>Number.isSafeInteger(x.id)&&x.id>0);
 let scan=null;
 if(s.AH!==undefined){
  const [realm,faction,ts,total]=(s.AH||'').split(',');
  const at=parseTime(Number(ts));
  const listings=(s.A||'').split(';').filter(Boolean).map(row=>{const [id,count,buyout,unit,name]=row.split(',');return {id:Number(id),count:Number(count)||1,buyout:Number(buyout),unit:Number(unit),name:decode(name)}}).filter(x=>Number.isSafeInteger(x.id)&&x.id>0&&isCopper(x.unit)&&Number.isInteger(x.count)&&x.count>0);
  const valid=decode(realm)&&['Horde','Alliance'].includes(decode(faction))&&at&&at>0&&at<=now+5*60000;
  scan={realm:decode(realm),faction:decode(faction),at:at?new Date(at).toISOString():null,declaredTotal:Number(total)||0,listings,valid:!!valid&&listings.length>0,
   problem:!listings.length?'Aucune annonce dans le dernier scan enregistré.':!valid?'Scan sans royaume, faction ou date exploitable.':null};
 }
 return {schema:payload.slice(0,3),character,professions,inventory,scan};
}
/** Agrège les annonces d'un scan par objet : plancher, prix à 10 % de profondeur, médiane pondérée. */
function aggregateListings(listings){
 const by=new Map();
 for(const l of listings){const k=l.id;if(!by.has(k))by.set(k,{itemId:k,name:l.name,rows:[]});const e=by.get(k);if(!e.name&&l.name)e.name=l.name;e.rows.push({value:l.unit,weight:l.count})}
 const out=[];
 for(const e of by.values()){
  const rows=e.rows.sort((a,b)=>a.value-b.value),quantity=rows.reduce((n,r)=>n+r.weight,0);
  const floor=rows[0].value;
  let acc=0,ask10=floor;for(const r of rows){acc+=r.weight;if(acc>=Math.max(1,quantity*0.1)){ask10=r.value;break}}
  const qtyAtFloor=rows.filter(r=>r.value<=Math.floor(floor*1.05)).reduce((n,r)=>n+r.weight,0);
  out.push({itemId:e.itemId,name:clean(e.name,100)||('Objet '+e.itemId),listings:rows.length,quantity,floor,ask10,medianAsk:Math.round(weightedMedian(rows)),qtyAtFloor});
 }
 return out.sort((a,b)=>b.quantity-a.quantity);
}
/** Transforme un scan en observations normalisées (une par objet), prêtes pour le carnet. */
function scanObservations(scan,filter){
 if(!scan?.valid)return [];
 const agg=aggregateListings(scan.listings),keep=typeof filter==='function'?filter:()=>true;
 return agg.filter(keep).map(a=>({name:a.name,itemId:a.itemId,priceCopper:a.floor,quantity:a.quantity,listings:a.listings,ask10:a.ask10,medianAsk:a.medianAsk,qtyAtFloor:a.qtyAtFloor,source:SCAN_SOURCE,observedAt:scan.at,realm:scan.realm,faction:scan.faction}));
}

/* ---------- 2. Relevés communautaires collés (auctionhouse.fyi) ---------- */
const FYI_MARKET=/^forever\.(normal|pvp|rp)\.(horde|alliance)\.us$/;
function parseCommunity(json,{name,realm,now=Date.now()}={}){
 const d=typeof json==='string'?JSON.parse(json):json;
 if(!d||!FYI_MARKET.test(String(d.market))||!Number.isSafeInteger(Number(d.item)))throw Error('Réponse auctionhouse.fyi non reconnue (champs market et item attendus).');
 const faction=String(d.market).includes('.horde.')?'Horde':'Alliance',label=clean(name,100)||('Objet '+d.item);
 const rows=[],src=COMMUNITY_SOURCE+' · '+d.market;
 if(Array.isArray(d.row)&&isCopper(d.row[0])){const t=parseTime(d.row[2]);if(t&&t<=now)rows.push({name:label,itemId:Number(d.item),priceCopper:d.row[0],quantity:Number.isSafeInteger(d.row[1])&&d.row[1]>0?d.row[1]:1,source:src,observedAt:new Date(t).toISOString(),realm:realm||d.market,faction,region:'us',market:String(d.market)})}
 for(const day of Array.isArray(d.days)?d.days:[]){
  const [epochDay,low,,qty]=day,t=Number(epochDay)*DAY+12*HOUR; // milieu de journée UTC, journée close
  if(!Number.isSafeInteger(epochDay)||!isCopper(low)||t>now)continue;
  rows.push({name:label,itemId:Number(d.item),priceCopper:low,quantity:Number.isSafeInteger(qty)&&qty>0?qty:1,source:src+' (plus bas du jour)',observedAt:new Date(t).toISOString(),realm:realm||d.market,faction,region:'us',market:String(d.market)});
 }
 return rows;
}

/* ---------- 3. Fusion dans le carnet existant binch.ah.market.v1 ---------- */
function validObservation(r,now=Date.now()){
 const name=clean(r?.name,100),price=Number(r?.priceCopper),qty=Number(r?.quantity??1),t=parseTime(r?.observedAt);
 const realm=clean(r?.realm,65).toLocaleLowerCase('fr'),faction=String(r?.faction||'');
 if(name.length<2||!isCopper(price)||!Number.isInteger(qty)||qty<1||qty>1e9||!t||t>now)return null;
 if(!realm||!['Horde','Alliance'].includes(faction))return null; // un relevé sans marché identifié n'est jamais fusionné
 const extra={};
 if(['eu','us','kr','tw'].includes(r.region))extra.region=r.region;
 if(typeof r.market==='string'&&/^[a-z0-9._-]{3,100}$/i.test(r.market))extra.market=r.market;
 for(const k of ['listings','ask10','medianAsk','qtyAtFloor'])if(Number.isSafeInteger(Number(r[k]))&&Number(r[k])>=0)extra[k]=Number(r[k]);
 return {name,itemId:Number.isSafeInteger(Number(r.itemId))&&Number(r.itemId)>0?Number(r.itemId):null,price,quantity:qty,at:new Date(t).toISOString(),source:clean(r.source||'Import',120),scope:realm+'|'+faction,extra};
}
/** Fusion pure : renvoie un nouveau carnet, ne retire jamais d'observations existantes. */
function mergeObservations(store,rows,now=Date.now()){
 const base=store&&store.version===1&&Array.isArray(store.items)?store:{version:1,items:[],trades:[],alerts:[],fee:5};
 const next={...base,items:base.items.map(x=>({...x,history:Array.isArray(x.history)?x.history.slice():[]}))};
 let added=0,rejected=0,skipped=0,marketConflicts=0;
 for(const raw of Array.isArray(rows)?rows:[]){
  const r=validObservation(raw,now);if(!r){rejected++;continue}
  const key=r.scope+'|'+norm(r.name);
  let item=next.items.find(v=>v.key===key)||(r.itemId?next.items.find(v=>v.scope===r.scope&&v.itemId===r.itemId):null);
  if(!item){if(next.items.length>=MAX_ITEMS){skipped++;continue}item={key,scope:r.scope,name:r.name,history:[],last:0,quantity:0,observedAt:'',source:''};next.items.push(item)}
  // Plusieurs rulesets/régions peuvent avoir le même realm « Forever » : jamais fusionner leurs cotations tierces.
  if(item.history.some(h=>(r.extra.market&&h.market&&h.market!==r.extra.market)||
      (r.extra.region&&h.region&&h.region!==r.extra.region))){rejected++;marketConflicts++;continue}
  if(r.itemId&&!item.itemId)item.itemId=r.itemId;
  const sample={price:r.price,quantity:r.quantity,at:r.at,source:r.source,...r.extra};
  if(item.history.some(x=>x.at===sample.at&&x.price===sample.price&&x.source===sample.source))continue;
  item.history.push(sample);item.history.sort((a,b)=>String(a.at).localeCompare(String(b.at)));item.history=item.history.slice(-MAX_HISTORY);added++;
  const last=item.history[item.history.length-1];item.last=last.price;item.quantity=last.quantity;item.observedAt=last.at;item.source=last.source;
 }
 return {store:next,added,rejected,skipped,marketConflicts};
}

/* ---------- 4. Statistiques et confiance ---------- */
/** La provenance reste informative : le texte « source » est importé et non signé. */
function observationOrigin(row){
 const source=String(row?.source||'').trim();
 if(source===SCAN_SOURCE)return 'scan';
 if(row?.market||row?.region||/auctionhouse\.fyi|blizzard|ahledger/i.test(source))return 'community';
 return 'manual';
}
function itemStats(item,now=Date.now()){
 const rows=(Array.isArray(item?.history)?item.history:[]).map(x=>({...x,t:parseTime(x.at),ref:isCopper(Number(x.ask10))?Number(x.ask10):Number(x.price)}))
  .filter(x=>isCopper(Number(x.price))&&x.t&&x.t<=now).sort((a,b)=>a.t-b.t).slice(-MAX_HISTORY);
 const n=rows.length,last=rows[n-1]||null,refs=rows.map(x=>x.ref);
 const origins=[...new Set(rows.map(observationOrigin))];
 const sourceKind=origins.length>1?'mixed':origins[0]||'manual';
 const med=median(refs),wmean=weightedMean(rows.map(x=>({value:x.ref,weight:Number(x.quantity)||1})));
 const ageH=last?(now-last.t)/HOUR:Infinity,days=new Set(rows.map(x=>new Date(x.t).toISOString().slice(0,10))).size;
 const mad=n>=3?median(refs.map(v=>Math.abs(v-med))):null,volatility=med&&mad!=null?100*mad/med:null;
 const trendOf=v=>{if(v.length<4||days<2)return null;const k=Math.max(1,Math.floor(v.length/3)),a=median(v.slice(0,k)),b=median(v.slice(-k));return a&&b?100*(b-a)/a:null};
 const trend=trendOf(refs),priorTrend=trendOf(refs.slice(0,-1)); // priorTrend : tendance avant le dernier relevé
 const current=last?last.ref:null,discount=med&&current?100*(med-current)/med:null;
 const scans=rows.filter(x=>Number.isSafeInteger(Number(x.listings)));
 let depthChange=null;
 if(scans.length>=2){const p=scans[scans.length-2],q=scans[scans.length-1];depthChange={from:Number(p.quantity),to:Number(q.quantity),hours:(q.t-p.t)/HOUR}}
 let score=0;
 score+=n>=8?30:n>=5?20:n>=3?10:0;
 score+=days>=5?25:days>=3?15:days>=2?8:0;
 score+=ageH<6?25:ageH<24?18:ageH<72?8:0;
 score+=last&&Number.isSafeInteger(Number(last.listings))?20:last?5:0;
 const confidence=n<3?'Insuffisante':score>=70?'Élevée':score>=45?'Moyenne':score>=25?'Faible':'Insuffisante';
 const freshness=!last?'Aucun relevé':ageH<6?'Frais (< 6 h)':ageH<24?'Du jour (< 24 h)':ageH<72?'Ancien (< 3 j)':'Périmé (> 3 j)';
 return {n,days,last,lastAt:last?new Date(last.t).toISOString():null,ageH,current,median:med,weightedMean:wmean,low:n?Math.min(...refs):null,high:n?Math.max(...refs):null,
  volatility,trend,priorTrend,discount,depthChange,score,confidence,freshness,sufficient:n>=3&&ageH<72,sourceKind,sourceKinds:origins,sources:[...new Set(rows.map(x=>x.source))]};
}

/* ---------- 4b. Offre réellement observée entre deux scans complets ---------- */
/** Deux instantanés de l'addon (même objet et même marché local), jamais de ventes présumées.
 * La baisse du stock visible peut provenir d'expirations ou d'annulations.
 * Ne compare ni saisies manuelles, ni flux communautaires, ni données périmées.
 */
function supplyChange(item,now=Date.now()){
 const snapshots=(Array.isArray(item?.history)?item.history:[]).map(h=>{
  const t=parseTime(h.at),quantity=Number(h.quantity),listings=Number(h.listings),price=Number(h.price);
  if(h.source!==SCAN_SOURCE||!t||t>now||
     !Number.isSafeInteger(quantity)||quantity<1||quantity>1e9||
     !Number.isSafeInteger(listings)||listings<1||listings>1e8||
     !isCopper(price))return null;
  return {at:new Date(t).toISOString(),t,quantity,listings,price,
   market:String(h.market||''),region:String(h.region||'')};
 }).filter(Boolean).sort((a,b)=>a.t-b.t);
 if(snapshots.length<2)return null;
 const latest=snapshots[snapshots.length-1];
 if(now-latest.t>72*HOUR)return null;
 const prior=snapshots.slice(0,-1).reverse().find(p=>
  p.t<latest.t&&latest.t-p.t<=7*24*HOUR&&p.market===latest.market&&p.region===latest.region);
 if(!prior)return null;
 return {
  fromAt:prior.at,toAt:latest.at,hours:(latest.t-prior.t)/HOUR,
  from:prior.quantity,to:latest.quantity,
  change:latest.quantity-prior.quantity,changePct:100*(latest.quantity-prior.quantity)/prior.quantity,
  listingsFrom:prior.listings,listingsTo:latest.listings,listingsChange:latest.listings-prior.listings,
  floorFrom:prior.price,floorTo:latest.price,floorChangePct:100*(latest.price-prior.price)/prior.price,
  source:SCAN_SOURCE
 };
}

/* ---------- 5. Simulation de marge ---------- */
function simulate({buy,sell,qty=1,fee=5,deposit=0,unsoldShare=0,priceDropPct=0,extraDeposits=0}={}){
 const b=Number(buy),s=Number(sell),q=Number(qty),d=Number(deposit),extra=Number(extraDeposits),r=feeRate(fee);
 const u=clamp(Number(unsoldShare)||0,0,1),drop=clamp(Number(priceDropPct)||0,0,95);
 if(!Number.isSafeInteger(b)||b<0||!Number.isSafeInteger(s)||s<1||
    !Number.isSafeInteger(q)||q<1||q>100000||
    !Number.isSafeInteger(d)||d<0||!Number.isSafeInteger(extra)||extra<0||
    !Number.isSafeInteger(b*q)||!Number.isSafeInteger(s*q))return null;
 const invest=b*q,gross=s*q,cut=Math.floor(gross*r),net=gross-cut,profit=net-invest-d;
 const sold=Math.floor(q*(1-u)),partial=Math.floor(s*sold*(1-r))-invest-d; // anciens appels : solde de trésorerie, stock restant non revendu
 const salePrice=Math.max(1,Math.floor(s*(1-drop/100)));
 const soldGross=sold*salePrice,saleCut=Math.floor(soldGross*r),soldNet=soldGross-saleCut;
 const unsold=q-sold,heldCost=b*unsold,fees=d+extra;
 const cashflow=soldNet-invest-fees; // inclut l'argent immobilisé dans le stock non vendu
 const matchedMargin=soldNet-b*sold-fees; // coût uniquement des unités revendues + dépôts perdus
 const breakEvenSold=sold>0?Math.ceil((invest+fees)/(sold*(1-r))):null;
 return {invest,gross,cut,net,deposit:d,profit,roi:invest+d>0?100*profit/(invest+d):null,breakEven:Math.ceil((invest+d)/(q*(1-r))),
  partial:{sold,profit:partial},
  stress:{salePrice,sold,unsold,soldNet,saleCut,heldCost,extraDeposits:extra,fees,cashflow,matchedMargin,
   breakEvenSold,priceDropPct:drop}};
}

/* ---------- 6. Catalogue métiers (références Classic, à confirmer sur Forever) ---------- */
const LEATHER={2934:'Restes de cuir abîmé',2318:'Cuir léger',2319:'Cuir moyen',4234:'Cuir lourd',4304:'Cuir épais',8170:'Cuir robuste',783:'Peau légère',4232:'Peau moyenne',4235:'Peau lourde',8169:'Peau épaisse',8171:'Peau robuste'};
const CONVERSIONS=[[2934,3,2318],[2318,4,2319],[2319,5,4234],[4234,6,4304],[4304,6,8170]].map(([input,count,output])=>({
 id:'lw-'+output,profession:'Travail du cuir',output:{itemId:output,name:LEATHER[output]},yield:1,ingredients:[{itemId:input,name:LEATHER[input],qty:count}],
 reference:'Conversion de cuir Classic (warcraft.wiki.gg) — à confirmer sur WoW Forever',builtin:true}));
const GATHERING={'Dépeçage':[2934,2318,783,2319,4232,4234,4235,4304,8169,8170,8171],Skinning:[2934,2318,783,2319,4232,4234,4235,4304,8169,8170,8171]};
const PROFESSION_ALIASES={'Travail du cuir':['travail du cuir','leatherworking'],'Dépeçage':['dépeçage','depecage','skinning']};
function hasProfession(professions,label){
 const keys=Object.keys(professions||{}).map(norm);return (PROFESSION_ALIASES[label]||[norm(label)]).some(a=>keys.includes(a));
}

/* ---------- 7. Index de marché pour un royaume/faction ---------- */
function marketIndex(store,scope,now=Date.now()){
 const items=(store?.items||[]).filter(x=>(x.scope||'legacy')===scope);
 const byName=new Map(),byId=new Map();
 for(const x of items){const e={item:x,stats:itemStats(x,now)};byName.set(norm(x.name),e);if(x.itemId)byId.set(Number(x.itemId),e)}
 return {scope,items,find:(ref)=>(ref?.itemId&&byId.get(Number(ref.itemId)))||(ref?.name?byName.get(norm(ref.name)):null)||null,all:()=>[...byName.values()]};
}

/* ---------- 8. Recettes : coûts, marges, données manquantes ---------- */
function evaluateRecipe(recipe,index,fee=5){
 const r=feeRate(fee),missing=[];
 const parts=recipe.ingredients.map(i=>{const e=index.find(i),p=e?.stats.sufficient?e.stats.current:null;if(p==null)missing.push(i.name||('Objet '+i.itemId));return {...i,unit:p,total:p==null?null:p*i.qty,netIfSold:p==null?null:Math.floor(p*i.qty*(1-r)),at:e?.stats.lastAt||null}});
 const out=index.find(recipe.output),sale=out?.stats.sufficient?out.stats.current:null;if(sale==null)missing.push(recipe.output.name||'produit');
 if(missing.length)return {recipe,status:'Données insuffisantes',missing,parts};
 const cost=parts.reduce((n,p)=>n+p.total,0),componentsNet=parts.reduce((n,p)=>n+p.netIfSold,0);
 const outputNet=Math.floor(sale*(recipe.yield||1)*(1-r));
 return {recipe,status:'ok',parts,cost,componentsNet,outputNet,margin:outputNet-cost,
  transformGain:outputNet-componentsNet, // si les composants sont déjà dans les sacs
  outputAt:out.stats.lastAt,confidence:[out.stats.confidence,...parts.map(p=>index.find(p)?.stats.confidence)].includes('Faible')?'Faible':out.stats.confidence};
}
function userRecipes(list){
 return (Array.isArray(list)?list:[]).filter(x=>x&&x.output&&Array.isArray(x.ingredients)).slice(0,100).map(x=>({id:'user-'+(x.id||x.output),profession:clean(x.profession,40)||'Métier non précisé',output:{name:clean(x.output)},yield:Number(x.yield)||1,
  ingredients:x.ingredients.filter(i=>i&&i.name).map(i=>({name:clean(i.name),qty:Number(i.qty||i.count)||1})),reference:'Recette saisie dans l’atelier La Binch',builtin:false}));
}
function craftAnalysis({index,professions,recipes=[],fee=5}){
 const builtin=hasProfession(professions,'Travail du cuir')?CONVERSIONS:[];
 return [...builtin,...userRecipes(recipes)].map(r=>evaluateRecipe(r,index,fee)).sort((a,b)=>(b.status==='ok')-(a.status==='ok')||(b.transformGain??-Infinity)-(a.transformGain??-Infinity));
}

/* ---------- 9. Mes sacs : vendre / garder / transformer ---------- */
function bagAdvice({inventory,index,crafts=[],fee=5}){
 const r=feeRate(fee),groups=new Map();
 for(const x of Array.isArray(inventory)?inventory:[]){if(!groups.has(x.id))groups.set(x.id,{itemId:x.id,name:x.name,count:0,quality:x.quality,vendor:x.vendor});groups.get(x.id).count+=x.count}
 const out=[];
 for(const g of groups.values()){
  const e=index.find(g),s=e?.stats,reasons=[];let decision,price=null;
  const vendorTotal=(g.vendor||0)*g.count;
  const transform=crafts.find(c=>c.status==='ok'&&c.transformGain>0&&c.parts.some(p=>(p.itemId&&p.itemId===g.itemId)||norm(p.name)===norm(g.name)));
  if(g.quality===0&&g.vendor>0){decision='Vendre au marchand';reasons.push('Objet de qualité médiocre (gris) : revente marchande '+coin(vendorTotal)+'.')}
  else if(!s||!s.sufficient){decision='Données insuffisantes';reasons.push(s?'Seulement '+s.n+' relevé(s), dernier '+s.freshness.toLowerCase()+'.':'Aucun relevé AH pour cet objet sur ce marché.');if(g.vendor>0)reasons.push('Repère certain : prix marchand '+coin(g.vendor)+' l’unité.')}
  else{
   const netUnit=Math.floor(s.current*(1-r));price=s.current;
   if(g.vendor>0&&netUnit<=g.vendor){decision='Vendre au marchand';reasons.push('Net AH après '+(r*100)+' % ('+coin(netUnit)+') ≤ prix marchand ('+coin(g.vendor)+').')}
   else if(transform){decision='Transformer';reasons.push('« '+transform.recipe.output.name+' » rapporterait '+coin(transform.transformGain)+' de plus par fabrication que la vente des composants ('+transform.recipe.reference+').')}
   else if(s.discount!=null&&s.discount>=15&&(s.priorTrend==null||s.priorTrend>-10)){decision='Garder';reasons.push('Cours actuel '+Math.round(s.discount)+' % sous la médiane observée ('+coin(s.median)+') : attendre un retour vers la médiane est défendable, sans garantie.')}
   else{decision='Vendre à l’AH';reasons.push('Prix indicatif : aligner sur le plancher observé '+coin(s.current)+' (net '+coin(netUnit)+' l’unité).')}
   if(s.trend!=null&&s.trend<=-10)reasons.push('Tendance baissière ('+Math.round(s.trend)+' %).');
  }
  out.push({...g,decision,price,stats:s||null,vendorTotal,ahNetTotal:price?Math.floor(price*g.count*(1-r)):null,reasons,lastAt:s?.lastAt||null});
 }
 const order={'Transformer':0,'Vendre à l’AH':1,'Garder':2,'Vendre au marchand':3,'Données insuffisantes':4};
 return out.sort((a,b)=>order[a.decision]-order[b.decision]||(b.ahNetTotal||0)-(a.ahNetTotal||0));
}

/* ---------- 10. Budget, exposition, opportunités ---------- */
function budgetPlan({capital,reservePct=40,maxItemPct=15}={}){
 const c=Number(capital);if(!Number.isSafeInteger(c)||c<0)return null;
 const reserve=Math.ceil(c*clamp(Number(reservePct)||0,0,100)/100),deployable=c-reserve;
 return {capital:c,reserve,deployable,perItemCap:Math.floor(c*clamp(Number(maxItemPct)||0,0,100)/100)};
}
function risksOf(s){
 const list=[];
 if(s.volatility!=null&&s.volatility>=25)list.push('Volatilité élevée ('+Math.round(s.volatility)+' % d’écart médian)');
 if(s.ageH>=24)list.push('Relevé de plus de 24 h');
 if(s.n<5)list.push('Historique court ('+s.n+' relevés)');
 if(s.days<3)list.push('Moins de 3 jours observés');
 if(s.priorTrend!=null&&s.priorTrend<=-10)list.push('Tendance baissière avant ce relevé ('+Math.round(s.priorTrend)+' %)');
 else if(s.trend!=null&&s.trend<=-10&&s.discount>=15)list.push('Chute récente : vérifier qu’elle n’annonce pas une baisse durable');
 if(!s.last||!Number.isSafeInteger(Number(s.last.listings)))list.push('Profondeur du marché inconnue (pas de scan complet)');
 return list;
}
function opportunities({index,fee=5,budget=null,minDiscount=15}){
 const r=feeRate(fee),out=[];
 // Le capital déclaré sert de garde-fou : jamais proposer un achat impossible
 // simplement parce qu'une médiane historique est supérieure au cours du jour.
 const cap=budget?Math.max(0,Math.min(Number(budget.perItemCap)||0,Number(budget.deployable)||0)):null;
 for(const {item,stats:s} of index.all()){
  if(!s.sufficient||s.confidence==='Insuffisante'||s.ageH>=24||s.discount==null||s.discount<minDiscount)continue;
  if(s.volatility!=null&&s.volatility>=40)continue;
  const resaleNet=Math.floor(s.median*(1-r)),unitMargin=resaleNet-s.current;
  if(unitMargin<=0||!Number.isFinite(s.current)||s.current<=0)continue;
  if(cap!==null&&cap<s.current)continue; // impossible d'acheter une seule unité en respectant la réserve
  const floorQty=Number.isSafeInteger(Number(s.last?.qtyAtFloor))&&Number(s.last.qtyAtFloor)>0
   ?Number(s.last.qtyAtFloor):null;
  let qty=floorQty,limitedBy=floorQty?'quantité au plancher du dernier scan':'profondeur inconnue : ne pas supposer de quantité disponible';
  if(cap!==null&&qty!==null){
   const byCap=Math.floor(cap/s.current);
   if(byCap<qty){qty=byCap;limitedBy='plafond d’exposition par objet'}
  }
  if(qty===0)continue;
  // Une forte décote n'est pas une preuve de rebond ni de liquidité.
  const trendRisk=s.priorTrend!=null&&s.priorTrend<=-10;
  const warnings=[];
  if(!budget)warnings.push('Capital disponible non renseigné');
  if(floorQty===null)warnings.push('Quantité au meilleur prix inconnue');
  if(s.days<3)warnings.push('Historique de moins de trois jours distincts');
  if(trendRisk)warnings.push('Baisse antérieure : risque de poursuite de la chute');
  if(s.confidence==='Faible')warnings.push('Confiance statistique faible');
  if(s.sourceKind!=='scan')warnings.push(s.sourceKind==='mixed'?'Sources historiques mélangées : vérifier la comparabilité des prix':'Profondeur et prix non certifiés par un scan GrimoireSync personnel');
  const actionable=!!budget&&qty!==null&&qty>=1&&s.days>=3&&!trendRisk&&s.confidence!=='Faible'&&s.sourceKind==='scan';
  const stressedSell=Math.floor(s.median*0.9);
  const stressedUnitMargin=Math.floor(stressedSell*(1-r))-s.current;
  out.push({name:item.name,itemId:item.itemId||null,price:s.current,reference:s.median,discount:s.discount,unitMargin,qty,limitedBy,
   margin:qty?unitMargin*qty:null,stressedUnitMargin,sourceKind:s.sourceKind,status:actionable?'Achat à étudier':'Surveillance',
   warnings,risks:[...risksOf(s),...warnings],confidence:s.confidence,lastAt:s.lastAt,source:s.last.source});
 }
 return out.sort((a,b)=>(a.status===b.status?0:a.status==='Achat à étudier'?-1:1)||
  (b.margin??b.unitMargin)-(a.margin??a.unitMargin));
}
/** Filtres du radar, sans mutation ni recalcul de prix : n'élèvent jamais une surveillance au rang d'achat. */
function filterOpportunities(opps,{source='all',ageH=24,status='all'}={},now=Date.now()){
 const allowedSources=['all','scan','community','manual','mixed'];
 const src=allowedSources.includes(source)?source:'all';
 const st=['all','buy','watch'].includes(status)?status:'all';
 const maxAge=ageH===6?6:24;
 return (Array.isArray(opps)?opps:[]).filter(o=>{
  if(src!=='all'&&o.sourceKind!==src)return false;
  if(st==='buy'&&o.status!=='Achat à étudier')return false;
  if(st==='watch'&&o.status!=='Surveillance')return false;
  const t=Date.parse(o.lastAt||'');
  return Number.isFinite(t)&&t>0&&t<=now&&now-t<maxAge*HOUR;
 });
}
function movers(index,threshold=10){
 return index.all().filter(e=>e.stats.trend!=null&&Math.abs(e.stats.trend)>=threshold).map(e=>({name:e.item.name,trend:e.stats.trend,current:e.stats.current,median:e.stats.median,volatility:e.stats.volatility,confidence:e.stats.confidence,lastAt:e.stats.lastAt})).sort((a,b)=>Math.abs(b.trend)-Math.abs(a.trend));
}
/** Revente de positions détenues (registre FIFO existant) lorsque le cours dépasse le coût de revient net. */
function resaleCandidates({positions,index,fee=5}){
 const r=feeRate(fee);
 return (Array.isArray(positions)?positions:[]).filter(p=>p.remaining>0).map(p=>{
  const e=index.find({name:p.item}),s=e?.stats,unitCost=p.carryingCost/p.remaining;
  if(!s?.sufficient)return {item:p.item,remaining:p.remaining,unitCost,status:'Données insuffisantes'};
  const net=Math.floor(s.current*(1-r)),gain=(net-unitCost)*p.remaining;
  return {item:p.item,remaining:p.remaining,unitCost,current:s.current,net,gain,status:gain>0?'Revente bénéficiaire possible':'Sous le coût de revient : conserver ou couper la perte',confidence:s.confidence,lastAt:s.lastAt};
 });
}
function farmTargets({index,professions}){
 const ids=new Set();for(const [label,list] of Object.entries(GATHERING))if(hasProfession(professions,label))list.forEach(id=>ids.add(id));
 return [...ids].map(id=>{const e=index.find({itemId:id,name:LEATHER[id]}),s=e?.stats;return {itemId:id,name:e?.item.name||LEATHER[id],price:s?.sufficient?s.current:null,median:s?.median??null,quantity:s?.last?Number(s.last.quantity):null,confidence:s?.confidence||'Insuffisante',lastAt:s?.lastAt||null}})
  .sort((a,b)=>(b.price??-1)-(a.price??-1));
}

/* ---------- 11. Journal des décisions ---------- */
function journalReview({decisions,trades,index,fee=5}){
 const r=feeRate(fee);
 return (Array.isArray(decisions)?decisions:[]).map(d=>{
  const after=(Array.isArray(trades)?trades:[]).filter(t=>norm(t.item)===norm(d.item)&&parseTime(t.at)>=parseTime(d.at));
  const sells=after.filter(t=>t.kind==='sell'),qty=sells.reduce((n,t)=>n+Number(t.qty),0);
  const avg=qty?sells.reduce((n,t)=>n+Number(t.price)*Number(t.qty),0)/qty:null;
  const s=index.find({name:d.item})?.stats;
  return {...d,realizedQty:qty,realizedAvg:avg,realizedVsExpected:avg&&d.expected?100*(avg-d.expected)/d.expected:null,
   marketNow:s?.sufficient?s.current:null,marketVsReference:s?.sufficient&&d.reference?100*(s.current-d.reference)/d.reference:null,
   outcome:!qty?'En attente de ventes déclarées':avg*(1-r)>=(d.reference||0)?'Conforme ou meilleur':'Inférieur à la référence'};
 });
}

/* ---------- 12. Alertes de prix observés ---------- */
function evaluateAlerts(alerts,index){
 return (Array.isArray(alerts)?alerts:[]).map(a=>{
  const s=index.find({name:a.name})?.stats;
  if(!s||!s.last)return {...a,state:'Aucun relevé'};
  if(s.ageH>=24)return {...a,state:'Relevé trop ancien',current:s.current,lastAt:s.lastAt};
  const hit=a.kind==='above'?s.current>=a.ceiling:s.current<=a.ceiling;
  return {...a,state:hit?'Seuil atteint':'Pas de signal',current:s.current,lastAt:s.lastAt};
 });
}

/* ---------- 13. Synthèse « Faith marchande » : reformulation sans invention ---------- */
function faithBrief({bags=[],opps=[],crafts=[],budget=null,scope,dataNote}){
 const lines=[],refs=[];
 const cite=(name,at,src)=>{refs.push(name+' — '+(at?new Date(at).toLocaleString('fr-FR'):'date inconnue')+(src?' · '+src:''));return '['+refs.length+']'};
 if(!scope||scope==='legacy')return {lines:['Données insuffisantes : choisis d’abord ton royaume et ta faction dans la Bourse d’Azeroth.'],refs};
 const sell=bags.filter(b=>b.decision==='Vendre à l’AH').slice(0,3);
 if(sell.length)lines.push('À vendre maintenant : '+sell.map(b=>b.name+' ×'+b.count+' vers '+coin(b.price)+' '+cite(b.name,b.lastAt,b.stats?.last?.source)).join(', ')+'.');
 const keep=bags.filter(b=>b.decision==='Garder').slice(0,3);
 if(keep.length)lines.push('À garder : '+keep.map(b=>b.name+' (cours '+Math.round(b.stats.discount)+' % sous sa médiane) '+cite(b.name,b.lastAt,b.stats.last.source)).join(', ')+'.');
 const tr=crafts.filter(c=>c.status==='ok'&&c.transformGain>0).slice(0,2);
 if(tr.length)lines.push('À transformer : '+tr.map(c=>c.recipe.output.name+' (+'+coin(c.transformGain)+' par fabrication) '+cite(c.recipe.output.name,c.outputAt,c.recipe.reference)).join(', ')+'.');
 if(opps.length){const o=opps[0];lines.push((o.status==='Achat à étudier'?'Achat à étudier, après vérification en jeu':'Sous surveillance, sans conseil d’achat')+' : '+o.name+' à '+coin(o.price)+' contre une médiane de '+coin(o.reference)+' '+cite(o.name,o.lastAt,o.source)+'. Confiance '+o.confidence.toLowerCase()+(o.risks.length?' ; risques : '+o.risks.join(', ').toLowerCase():'')+'.')}
 if(budget)lines.push('Capital : '+coin(budget.capital)+', réserve conservée '+coin(budget.reserve)+', plafond par objet '+coin(budget.perItemCap)+'.');
 const insufficient=bags.filter(b=>b.decision==='Données insuffisantes').length;
 if(insufficient)lines.push(insufficient+' objet(s) de tes sacs restent sans cote fiable : un /grimoire scan à l’hôtel des ventes les couvrira.');
 if(!lines.length)lines.push('Données insuffisantes pour proposer une opération. Importe un scan GrimoireSync récent.');
 if(dataNote)lines.push(dataNote);
 lines.push('Tu restes seul décisionnaire : aucune enchère, achat ou mise en vente n’est déclenché par La Binch.');
 return {lines,refs};
}

/* ---------- 14. Flux communautaire multi-marchés (branche binch-ah-data) ---------- */
const FEED_URL='https://raw.githubusercontent.com/quentindumont70-bit/chroniques-cendreval/binch-ah-data/ah-feed.json';
/** Décrit un marché sans ambiguïté : fournisseur, région, règleset, faction, maison. */
function marketMeta(id,info){
 const fyi=String(id).match(/^forever\.(normal|pvp|rp)\.(horde|alliance)\.us$/);
 if(fyi)return {id:String(id),provider:'auctionhouse.fyi',region:'us',ruleset:fyi[1],faction:fyi[2]==='horde'?'Horde':'Alliance',houseId:null};
 const m=info&&typeof info==='object'?info:{};
 const region=['eu','us','kr','tw'].includes(m.region)?m.region:null;
 const faction=['Horde','Alliance','Neutral'].includes(m.faction)?m.faction:null;
 return {id:String(id),provider:clean(m.provider,40)||'inconnu',region,ruleset:clean(m.ruleset,40)||null,faction,houseId:m.houseId??null};
}
const RULESET_FR={normal:'Normal',pvp:'JcJ',rp:'RP'};
const FACTION_FR={Horde:'Horde',Alliance:'Alliance',Neutral:'Neutre'};
function MARKET_LABEL(id,info){const m=marketMeta(id,info);return (m.region?m.region.toUpperCase():'Région ?')+' · '+(RULESET_FR[m.ruleset]||m.ruleset||'règleset ?')+' · '+(FACTION_FR[m.faction]||'faction ?')+(m.houseId!=null?' · maison '+m.houseId:'')+' ('+m.provider+')'}
/** Garde-fou : un flux externe n'entre dans le carnet que si région et marché sont confirmés par le joueur. */
function canMergeFeed({userRegion,confirmedMarket,marketId,marketInfo,scopeFaction,enabled}){
 const m=marketMeta(marketId,marketInfo);
 if(!enabled)return {ok:false,reason:'Intégration automatique désactivée.'};
 if(!['eu','us','kr','tw'].includes(userRegion))return {ok:false,reason:'Région de ton compte non renseignée : aucun prix externe n’est intégré.'};
 if(!m.region)return {ok:false,reason:'Région du marché inconnue.'};
 if(m.region!==userRegion)return {ok:false,reason:'Marché '+m.region.toUpperCase()+' différent de ta région '+userRegion.toUpperCase()+' : jamais mélangés.'};
 if(confirmedMarket!==m.id)return {ok:false,reason:'Confirme d’abord que ce marché (règleset et maison) est bien le tien.'};
 if(!m.faction||(m.faction!=='Neutral'&&m.faction!==scopeFaction))return {ok:false,reason:m.faction==='Neutral'?'':'Faction du marché différente de ton carnet.'};
 if(m.faction==='Neutral'&&scopeFaction)return {ok:false,reason:'Maison neutre : séparée des maisons de faction, non fusionnée dans ton carnet '+scopeFaction+'.'};
 return {ok:true,reason:'Marché confirmé.'};
}
function validFeed(f){return !!f&&['binch-ah-feed-v1','binch-ah-feed-v2'].includes(f.format)&&f.markets&&typeof f.markets==='object'}
/** Observations d'un marché du flux, au format du carnet (réutilise parseCommunity). */
function feedObservations(feed,market,{realm,now=Date.now()}={}){
 if(!validFeed(feed)||!feed.markets[market])return [];
 const info=feed.markets[market],meta=marketMeta(market,info.meta),out=[];
 if(!meta.faction||!meta.region)return [];
 const src=(meta.provider==='auctionhouse.fyi'?COMMUNITY_SOURCE:meta.provider)+' · '+MARKET_LABEL(market,info.meta);
 for(const [id,v] of Object.entries(info.items||{})){
  const name=feed.names?.[id]?.n||('Objet '+id),base={name,itemId:Number(id),realm,faction:meta.faction==='Neutral'?null:meta.faction,region:meta.region,market};
  const r=v.row;
  if(Array.isArray(r)&&isCopper(r[0])&&Number.isSafeInteger(r[1])&&r[1]>0){const t=parseTime(r[2]);if(t&&t<=now)out.push({...base,priceCopper:r[0],quantity:r[1],source:src,observedAt:new Date(t).toISOString()})}
  for(const d of Array.isArray(v.days)?v.days:[]){const [day,low,,q]=d,t=Number(day)*DAY+12*HOUR;if(Number.isSafeInteger(day)&&isCopper(low)&&Number.isSafeInteger(q)&&q>0&&t<=now)out.push({...base,priceCopper:low,quantity:q,source:src+' (plus bas du jour)',observedAt:new Date(t).toISOString()})}
 }
 return out;
}
/** Comparaison d'un objet entre tous les marchés du flux (information, pas d'arbitrage automatique). */
function crossMarket(feed,itemId,now=Date.now()){
 if(!validFeed(feed))return [];
 return Object.entries(feed.markets).map(([m,v])=>{
  const r=v.items?.[itemId]?.row,t=r?parseTime(r[2]):null,validTime=t&&t<=now;
  const meta=marketMeta(m,v.meta),price=validTime&&r&&isCopper(r[0])?r[0]:null;
  const ageH=validTime?(now-t)/HOUR:null;
  // Afficher un vieux cours est utile pour l'historique, jamais pour qualifier un meilleur achat.
  return {market:m,label:MARKET_LABEL(m,v.meta),region:meta.region,faction:meta.faction,price,
   quantity:r&&Number.isSafeInteger(r[1])?r[1]:null,at:validTime?new Date(t).toISOString():null,
   ageH,fresh:price!==null&&ageH<=72};
 }).sort((a,b)=>(a.price??Infinity)-(b.price??Infinity));
}
function feedSummary(feed,now=Date.now()){
 if(!validFeed(feed))return null;
 const gen=parseTime(feed.generatedAt);
 return {generatedAt:feed.generatedAt,ageH:gen?(now-gen)/HOUR:null,markets:Object.entries(feed.markets).map(([m,v])=>({market:m,label:MARKET_LABEL(m,v.meta),meta:marketMeta(m,v.meta),stale:v.at?(now-v.at)/HOUR>72:true,scanAt:v.at?new Date(v.at).toISOString():null,scanAgeH:v.at?(now-v.at)/HOUR:null,items:Object.keys(v.items||{}).length,contributors7d:v.contributors7d||0}))};
}

/* ---------- 15. Progression : quoi dépecer à mon niveau ---------- */
// Niveaux de monstres par cuir (archive Vanilla) ; seuil de dépeçage Classic : (niveau-10)×10 jusqu'au niveau 20, puis niveau×5.
const LEATHER_TIERS=[{itemId:2318,hide:783,name:'Cuir léger',mobs:[1,27]},{itemId:2319,hide:4232,name:'Cuir moyen',mobs:[15,38]},{itemId:4234,hide:4235,name:'Cuir lourd',mobs:[26,46]},{itemId:4304,hide:8169,name:'Cuir épais',mobs:[35,58]},{itemId:8170,hide:8171,name:'Cuir robuste',mobs:[45,60]}];
const skinSkillFor=level=>level<=10?1:level<=20?(level-10)*10:level*5;
const maxSkinnableLevel=skill=>{let lv=1;for(let l=1;l<=63;l++)if(skinSkillFor(l)<=skill)lv=l;return lv};
function professionRank(professions,label){const keys=PROFESSION_ALIASES[label]||[norm(label)];for(const [n,v] of Object.entries(professions||{}))if(keys.includes(norm(n)))return Number(v?.rank??v)||0;return null}
function skinningPlan({level,professions,index,feedMarket}){
 const skill=professionRank(professions,'Dépeçage');
 if(skill==null)return {status:'Dépeçage non importé',tiers:[]};
 const lv=Number(level)||0,cap=maxSkinnableLevel(skill);
 const price=id=>{const e=index?.find({itemId:id});if(e?.stats.sufficient)return {price:e.stats.current,at:e.stats.lastAt,src:'carnet'};const r=feedMarket?.items?.[id]?.row;return r&&isCopper(r[0])?{price:r[0],at:new Date(parseTime(r[2])).toISOString(),src:'flux communautaire'}:null};
 const tiers=LEATHER_TIERS.map(t=>{
  const lo=t.mobs[0],hi=Math.min(t.mobs[1],lv+3,cap);
  const reachable=lv>0&&hi>=lo&&lo<=lv+3;
  const p=price(t.itemId),h=price(t.hide);
  return {...t,reachable,mobRange:reachable?[lo,hi]:null,leather:p,hideP:h,why:!lv?'Niveau inconnu':lo>lv+3?'Monstres trop forts pour ton niveau ('+lo+'+)':lo>cap?'Compétence de dépeçage insuffisante (niveau '+cap+' max)':'Monstres niveau '+lo+'–'+hi+' accessibles'};
 });
 const ranked=tiers.filter(t=>t.reachable&&t.leather).sort((a,b)=>b.leather.price-a.leather.price);
 return {status:'ok',skill,level:lv,maxMob:cap,tiers,best:ranked[0]||null,nextSkill:cap<60?{mobLevel:cap+1,skill:skinSkillFor(cap+1)}:null};
}

return {FEED_URL,MARKET_LABEL,marketMeta,canMergeFeed,feedObservations,crossMarket,feedSummary,LEATHER_TIERS,skinSkillFor,maxSkinnableLevel,skinningPlan,SCAN_SOURCE,COMMUNITY_SOURCE,LEATHER,CONVERSIONS,coin,median,weightedMedian,weightedMean,extractPayload,parseGrimoire,aggregateListings,scanObservations,parseCommunity,
 mergeObservations,itemStats,supplyChange,simulate,hasProfession,marketIndex,evaluateRecipe,craftAnalysis,bagAdvice,budgetPlan,opportunities,filterOpportunities,observationOrigin,movers,resaleCandidates,farmTargets,journalReview,evaluateAlerts,faithBrief};
});

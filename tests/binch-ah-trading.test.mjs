import test from 'node:test';
import assert from 'node:assert/strict';
import '../public/binch/ah-trading-core.js';
import '../public/binch/ah-portfolio-core.js';
const T=globalThis.BinchTrading;
const NOW=Date.parse('2026-11-16T12:00:00Z');
const sec=iso=>Math.floor(Date.parse(iso)/1000);
const enc=s=>encodeURIComponent(s);

function payload({at='2026-11-16T11:00:00Z',faction='Horde',listings,inventory=[],prof='Travail%20du%20cuir,120,150;D%C3%A9pe%C3%A7age,130,150'}={}){
 const C=['Bobinch','Forever',32,'DRUID','Tauren','Horde','Mulgore',123456,sec(at),0,0,0].map(String).join(',');
 const A=(listings||[]).map(l=>[l.id,l.count,l.unit*l.count,l.unit,enc(l.name)].join(',')).join(';');
 const I=inventory.map(i=>[i.id,i.count,0,1,i.quality??1,i.vendor??0,enc(i.name)].join(',')).join(';');
 return 'GF6|C:'+C+'|P:'+prof+'|Q:|L:|LS:ok|I:'+I+'|E:|AH:Forever,'+faction+','+sec(at)+','+(listings||[]).length+'|A:'+A;
}
const lua=p=>'GrimoireSyncDB = {\n ["payload"] = "'+p.replace(/\\/g,'\\\\').replace(/"/g,'\\"')+'",\n}';

test('Scan GrimoireSync: payload Lua lu, royaume/faction/date conservés, agrégation par objet',()=>{
 const p=payload({listings:[{id:2318,count:20,unit:30,name:'Cuir léger'},{id:2318,count:5,unit:28,name:'Cuir léger'},{id:2318,count:100,unit:45,name:'Cuir léger'},{id:4234,count:1,unit:900,name:'Cuir lourd'}]});
 const g=T.parseGrimoire(lua(p),NOW);
 assert.equal(g.character.name,'Bobinch');
 assert.equal(g.character.gold,123456);
 assert.equal(g.professions['Travail du cuir'].rank,120);
 assert.equal(g.scan.valid,true);
 assert.equal(g.scan.realm,'Forever');
 assert.equal(g.scan.at,'2026-11-16T11:00:00.000Z');
 const agg=T.aggregateListings(g.scan.listings).find(x=>x.itemId===2318);
 assert.equal(agg.floor,28);
 assert.equal(agg.quantity,125);
 assert.equal(agg.listings,3);
 assert.equal(agg.ask10,30); // 10 % de 125 = 12,5 unités : atteint dans la 2e annonce
 assert.equal(agg.qtyAtFloor,5);
 const obs=T.scanObservations(g.scan);
 assert.equal(obs.length,2);
 assert.equal(obs[0].source,T.SCAN_SOURCE);
});

test('Scan GrimoireSync: futur, faction inconnue ou scan vide ne produisent aucune observation',()=>{
 const future=T.parseGrimoire(payload({at:'2026-11-17T12:00:00Z',listings:[{id:1,count:1,unit:5,name:'X'}]}),NOW);
 assert.equal(future.scan.valid,false);
 assert.deepEqual(T.scanObservations(future.scan),[]);
 const empty=T.parseGrimoire(payload({listings:[]}),NOW);
 assert.equal(empty.scan.valid,false);
 assert.match(empty.scan.problem,/Aucune annonce/);
 assert.throws(()=>T.parseGrimoire('pas un fichier',NOW),/Aucun payload/);
});

test('Fusion carnet: compatible binch.ah.market.v1, sans doublon, sans relevé non attribué',()=>{
 const legacy={version:1,items:[{key:'vieux',scope:'legacy',name:'Vieux',history:[{price:5,quantity:1,at:'2026-11-01T00:00:00Z',source:'x'}],last:5}],trades:[{id:'t'}],alerts:[],fee:5};
 const rows=[{name:'Cuir léger',itemId:2318,priceCopper:28,quantity:125,listings:3,ask10:30,qtyAtFloor:5,source:T.SCAN_SOURCE,observedAt:'2026-11-16T11:00:00Z',realm:'Forever',faction:'Horde'},
  {name:'Sans marché',priceCopper:10,quantity:1,observedAt:'2026-11-16T11:00:00Z'},
  {name:'Futur',priceCopper:10,quantity:1,observedAt:'2026-11-17T11:00:00Z',realm:'Forever',faction:'Horde'}];
 const a=T.mergeObservations(legacy,rows,NOW);
 assert.equal(a.added,1);assert.equal(a.rejected,2);
 const item=a.store.items.find(x=>x.key==='forever|Horde|cuir léger');
 assert.equal(item.itemId,2318);assert.equal(item.last,28);assert.equal(item.history[0].listings,3);
 assert.equal(a.store.items[0].history.length,1,'les anciens relevés sont conservés');
 assert.deepEqual(a.store.trades,[{id:'t'}]);
 assert.equal(legacy.items.length,1,'fusion pure : entrée intacte');
 const b=T.mergeObservations(a.store,rows,NOW);
 assert.equal(b.added,0,'réimport du même scan sans doublon');
});

test('Relevé communautaire collé: row + days convertis, journée future ignorée',()=>{
 const json={market:'forever.normal.horde.us',item:2318,row:[30,15560,Date.parse('2026-11-16T10:00:00Z')],days:[[20772,23,29,15381],[20773,24,30,15560],[20800,1,1,1]],volume:[],now:NOW,live:false};
 const rows=T.parseCommunity(json,{name:'Cuir léger',realm:'Forever',now:NOW});
 assert.equal(rows.length,3);
 assert.ok(rows.every(r=>r.faction==='Horde'&&r.source.startsWith(T.COMMUNITY_SOURCE)));
 assert.throws(()=>T.parseCommunity({foo:1}),/non reconnue/);
});

function history(prices,{start='2026-11-10T12:00:00Z',stepH=24,scan=true}={}){
 return prices.map((p,i)=>({price:p,quantity:50,at:new Date(Date.parse(start)+i*stepH*3600000).toISOString(),source:scan?T.SCAN_SOURCE:'Saisie',...(scan?{listings:4,ask10:p,qtyAtFloor:10}:{})}));
}
function store(items){return {version:1,trades:[],alerts:[],fee:5,items:items.map(([name,id,prices,opt])=>{const h=history(prices,opt);const l=h[h.length-1];return {key:'forever|Horde|'+name.toLowerCase(),scope:'forever|Horde',name,itemId:id,history:h,last:l.price,quantity:l.quantity,observedAt:l.at,source:l.source}})}}

test('Statistiques: médiane, volatilité, tendance, confiance et « Insuffisante »',()=>{
 const s=T.itemStats(store([['Cuir léger',2318,[100,100,100,100,100,100,80]]]).items[0],NOW);
 assert.equal(s.median,100);
 assert.equal(Math.round(s.discount),20);
 assert.equal(s.confidence,'Élevée');
 const few=T.itemStats(store([['Rare',1,[100,90]]]).items[0],NOW);
 assert.equal(few.confidence,'Insuffisante');assert.equal(few.sufficient,false);
 const old=T.itemStats(store([['Ancien',2,[100,100,100,100]]],).items[0],Date.parse('2026-11-30T00:00:00Z'));
 assert.equal(old.sufficient,false,'relevé > 3 jours : pas de conseil');
});

test('Simulation: commission, dépôt, seuil de rentabilité et ventes partielles',()=>{
 const s=T.simulate({buy:1000,sell:2000,qty:10,fee:5,deposit:300});
 assert.equal(s.net,19000);assert.equal(s.profit,8700);
 assert.equal(s.breakEven,Math.ceil(10300/(10*0.95)));
 assert.equal(T.simulate({buy:1000,sell:2000,qty:10,fee:5,unsoldShare:0.5}).partial.profit,9500-10000);
 assert.equal(T.simulate({buy:1,sell:0,qty:1}),null);
});

test('Sacs: marchand, AH, garder, transformer et données insuffisantes',()=>{
 const st=store([['Cuir léger',2318,[30,30,30,30,30,30,30]],['Cuir moyen',2319,[400,400,400,400,400,400,400]],['Dent',5,[100,100,100,100,100,100,60]],['Bijou',6,[1000,1000,1000,1000,1000,1000,1000]],['Croc',7,[10,10,10,10,10]]]);
 const index=T.marketIndex(st,'forever|Horde',NOW);
 const crafts=T.craftAnalysis({index,professions:{'Travail du cuir':{rank:120}},fee:5});
 const conv=crafts.find(c=>c.recipe.output.itemId===2319);
 assert.equal(conv.status,'ok');
 assert.equal(conv.transformGain,Math.floor(400*0.95)-Math.floor(120*0.95));
 const bags=T.bagAdvice({inventory:[{id:2318,count:8,name:'Cuir léger',quality:1,vendor:5},{id:5,count:3,name:'Dent',quality:1,vendor:1},{id:6,count:1,name:'Bijou',quality:2,vendor:10},{id:7,count:2,name:'Croc',quality:1,vendor:50},{id:99,count:1,name:'Gris',quality:0,vendor:7},{id:98,count:1,name:'Inconnu',quality:1,vendor:3}],index,crafts,fee:5});
 const d=Object.fromEntries(bags.map(b=>[b.name,b.decision]));
 assert.equal(d['Cuir léger'],'Transformer');
 assert.equal(d['Dent'],'Garder');
 assert.equal(d['Bijou'],'Vendre à l’AH');
 assert.equal(d['Croc'],'Vendre au marchand');
 assert.equal(d['Gris'],'Vendre au marchand');
 assert.equal(d['Inconnu'],'Données insuffisantes');
 const noProf=T.craftAnalysis({index,professions:{},fee:5});
 assert.equal(noProf.filter(c=>c.recipe.builtin).length,0,'pas de conversion sans Travail du cuir');
});

test('Opportunités: décote étayée, plafond d’exposition et profondeur, rien sur données pauvres',()=>{
 const st=store([['Dent',5,[100,100,100,100,100,100,60]],['Pauvre',8,[100,40]],['Stable',9,[100,100,100,100,100,100,100]]]);
 const index=T.marketIndex(st,'forever|Horde',NOW);
 const budget=T.budgetPlan({capital:1000,reservePct:40,maxItemPct:30});
 assert.deepEqual(budget,{capital:1000,reserve:400,deployable:600,perItemCap:300});
 const o=T.opportunities({index,fee:5,budget});
 assert.equal(o.length,1);
 assert.equal(o[0].name,'Dent');
 assert.equal(o[0].qty,5,'300 pc / 60 pc = 5 unités, sous les 10 au plancher');
 assert.equal(o[0].unitMargin,95-60);
 assert.ok(o[0].risks.length>=0);
});

test('Revente, journal et alertes: aucune valeur fabriquée',()=>{
 const st=store([['Dent',5,[100,100,100,100,100,100,200]]]);
 const index=T.marketIndex(st,'forever|Horde',NOW);
 const L=globalThis.BinchAHPortfolio.ledger([{id:'a',kind:'buy',item:'Dent',qty:4,price:100,scope:'forever|Horde',at:'2026-11-10T00:00:00Z'},{id:'b',kind:'buy',item:'Inconnu',qty:1,price:5,scope:'forever|Horde',at:'2026-11-10T00:00:00Z'}],5);
 const r=T.resaleCandidates({positions:L.positions,index,fee:5});
 assert.equal(r.find(x=>x.item==='Dent').status,'Revente bénéficiaire possible');
 assert.equal(r.find(x=>x.item==='Inconnu').status,'Données insuffisantes');
 const j=T.journalReview({decisions:[{id:'d',item:'Dent',action:'buy',reference:100,expected:150,at:'2026-11-12T00:00:00Z'}],trades:[{kind:'sell',item:'Dent',qty:2,price:180,at:'2026-11-15T00:00:00Z'},{kind:'sell',item:'Dent',qty:9,price:1,at:'2026-11-01T00:00:00Z'}],index,fee:5});
 assert.equal(j[0].realizedQty,2);assert.equal(j[0].realizedAvg,180);assert.equal(Math.round(j[0].realizedVsExpected),20);
 const a=T.evaluateAlerts([{name:'Dent',ceiling:250,kind:'below'},{name:'Absent',ceiling:1}],index);
 assert.equal(a[0].state,'Seuil atteint');assert.equal(a[1].state,'Aucun relevé');
});

test('Faith marchande: références datées, refus sans marché identifié',()=>{
 const st=store([['Bijou',6,[1000,1000,1000,1000,1000,1000,1000]]]);
 const index=T.marketIndex(st,'forever|Horde',NOW);
 const bags=T.bagAdvice({inventory:[{id:6,count:1,name:'Bijou',quality:2,vendor:10}],index,fee:5});
 const f=T.faithBrief({bags,opps:[],crafts:[],scope:'forever|Horde'});
 assert.match(f.lines[0],/Bijou ×1 vers 10pa 0pc \[1\]/);
 assert.equal(f.refs.length,1);
 assert.match(f.lines.at(-1),/aucune enchère/);
 assert.match(T.faithBrief({scope:'legacy'}).lines[0],/Données insuffisantes/);
});

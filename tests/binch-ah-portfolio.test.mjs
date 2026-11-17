import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import '../public/binch/ah-portfolio-core.js';
const ledger=globalThis.BinchAHPortfolio?.ledger;
test('Bourse: FIFO purchased lots, realized gain and residual cost',()=>{
 assert.equal(typeof ledger,'function');
 const t=[
 {id:'a',kind:'buy',item:'Feuillerêve',qty:10,price:10000,scope:'forever|Horde',at:'2026-11-10T10:00:00Z'},
 {id:'b',kind:'buy',item:'Feuillerêve',qty:5,price:15000,scope:'forever|Horde',at:'2026-11-10T10:30:00Z'},
 {id:'c',kind:'sell',item:'Feuillerêve',qty:12,price:20000,fee:5,scope:'forever|Horde',at:'2026-11-10T11:00:00Z'}
 ];
 const s=ledger(t,9);
 assert.equal(s.remainingUnits,3);
 assert.equal(s.remainingCost,45000);
 assert.equal(s.costRealized,130000);
 assert.equal(s.realized,98000);
 assert.equal(s.unmatchedUnits,0);
});
test('Bourse: missing buy cost and different factions cannot fabricate profits',()=>{
 const t=[
 {id:'a',kind:'buy',item:'Feuillerêve',qty:2,price:10000,scope:'forever|Horde',at:'2026-11-10T10:00:00Z'},
 {id:'b',kind:'sell',item:'Feuillerêve',qty:2,price:22000,fee:10,scope:'forever|Alliance',at:'2026-11-10T11:00:00Z'}
 ];
 const s=ledger(t,5);
 assert.equal(s.unmatchedUnits,2);
 assert.equal(s.realized,0);
 assert.equal(s.remainingCost,20000);
 assert.equal(s.positions.length,2);
});
test('Bourse: original commission is stable when the default changes later',()=>{
 const t=[
 {kind:'buy',item:'Copper',qty:1,price:1000,at:'2026-11-10T10:00:00Z'},
 {kind:'sell',item:'Copper',qty:1,price:2000,fee:10,at:'2026-11-10T11:00:00Z'}
 ];
 assert.equal(ledger(t,1).realized,800);
 assert.equal(ledger(t,20).realized,800);
});

test('Trading: 30-day declared sales summary excludes unknown FIFO costs and foreign markets',()=>{
 const {tradePerformance}=globalThis.BinchAHPortfolio;
 assert.equal(typeof tradePerformance,'function');
 const t=[
  {id:'a',kind:'buy',item:'Cuir léger',qty:3,price:1000,scope:'forever|Horde',at:'2026-11-01T00:00:00Z'},
  {id:'b',kind:'sell',item:'Cuir léger',qty:5,price:2000,fee:5,scope:'forever|Horde',at:'2026-11-16T12:00:00Z'},
  {id:'c',kind:'sell',item:'Cuir léger',qty:2,price:500,scope:'forever|Alliance',at:'2026-11-16T15:00:00Z'},
  {id:'d',kind:'sell',item:'Ancienne vente',qty:1,price:1000,scope:'forever|Horde',at:'2026-09-01T12:00:00Z'}
 ];
 const original=JSON.stringify(t);
 const all=ledger(t,5),horde={...all,sales:all.sales.filter(x=>x.market==='forever|Horde')};
 const p=tradePerformance(horde,{now:Date.parse('2026-11-17T12:00:00Z'),days:30});
 assert.equal(p.days,30);
 assert.equal(p.operations,1,'ignore older and other-faction sales');
 assert.equal(p.sold,5);
 assert.equal(p.matched,3);
 assert.equal(p.unmatched,2);
 assert.equal(p.cost,3000);
 assert.equal(p.proceeds,5700);
 assert.equal(p.realized,2700);
 assert.equal(p.roi,90);
 assert.equal(p.rows.length,1);
 assert.equal(p.rows[0].unitProfit,900);
 assert.equal(p.rows[0].lastSale,'2026-11-16T12:00:00.000Z');
 assert.equal(JSON.stringify(t),original,'never mutate original trades');
 const alliance=tradePerformance({...all,sales:all.sales.filter(x=>x.market==='forever|Alliance')},{now:Date.parse('2026-11-17T12:00:00Z')});
 assert.equal(alliance.sold,2);
 assert.equal(alliance.matched,0);
 assert.equal(alliance.realized,0);
 assert.equal(alliance.roi,null,'unknown cost never becomes a zero-cost profit');
});
test('Trading: invalid dates, future sales and missing cost never become liquidity evidence',()=>{
 const {tradePerformance}=globalThis.BinchAHPortfolio;
 const p=tradePerformance({sales:[
  {item:'A',market:'forever|Horde',qty:1,matched:1,unmatched:0,margin:2,cost:10,proceedsMatched:12,at:'n/a'},
  {item:'B',market:'forever|Horde',qty:1,matched:1,unmatched:0,margin:2,cost:10,proceedsMatched:12,at:'2026-12-01T00:00:00Z'},
  {item:'C',market:'forever|Horde',qty:1,matched:0,unmatched:1,margin:0,cost:0,proceedsMatched:0,at:'2026-11-17T00:00:00Z'}
 ]},{now:Date.parse('2026-11-17T12:00:00Z')});
 assert.equal(p.excluded,2);
 assert.equal(p.sold,1);
 assert.equal(p.unmatched,1);
 assert.equal(p.roi,null);
 assert.equal(p.realized,0);
});

test('Trading UI: 30-day declared sales report is connected and cache-refreshed',()=>{
 const ui=readFileSync(new URL('../public/binch/ah-trading.js',import.meta.url),'utf8');
 const html=readFileSync(new URL('../public/binch/index.html',import.meta.url),'utf8');
 assert.match(ui,/tradePerformance\?\.\(ledger\)/);
 assert.match(ui,/tradePerformanceSection\(c\.performance\)/);
 assert.match(ui,/Ventes déclarées/);
 assert.match(ui,/Ce n’est ni le volume réel de l’AH/);
 assert.match(ui,/Unités vendues et saisies/);
 assert.match(html,/ah-portfolio-core\.js\?v=003/);
 assert.match(html,/ah-trading\.js\?v=012/);
});

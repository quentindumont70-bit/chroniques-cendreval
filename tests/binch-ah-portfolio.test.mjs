import test from 'node:test';
import assert from 'node:assert/strict';
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

'use strict';
// Run from repository root: node public/binch/test-ah-craft.cjs
// Pure-function regression checks: no DOM mount, no player data and no network.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, 'ah-craft.js'), 'utf8');
const marker = /\}\)\(\);\s*$/;
assert.match(source, marker, 'Expected module wrapper');
const testingSource = source.replace(marker, 'window.__binchEstimateTest=estimate;})();');
const storage = new Map();
const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
const tomorrow = new Date(Date.now() + 86400000).toISOString();
storage.set('binch.ah.scope.v1', JSON.stringify({ realm: 'Forever', faction: 'Horde' }));
const window = {
  addEventListener() {},
  BinchMarketBridge: { snapshot: () => ({ items: [] }), latestFor: () => null }
};
const document = { readyState: 'loading', addEventListener() {} };
const localStorage = { getItem: key => storage.get(key) ?? null };
vm.runInNewContext(testingSource, { window, document, localStorage, Date, Number, Math, JSON, String, Array, Object, crypto: {} }, { filename: 'ah-craft.js' });
const recipe = { output: 'Armure', yield: 2, ingredients: [{ name: 'Barre', qty: 2 }] };
function market(cost, price, at = oneHourAgo, fee = 5) {
  storage.set('binch.ah.market.v1', JSON.stringify({
    fee,
    items: [
      { name: 'Barre', scope: 'forever|Horde', last: cost, observedAt: at, source: 'test' },
      { name: 'Armure', scope: 'forever|Horde', last: price, observedAt: at, source: 'test' }
    ]
  }));
}
let count = 0;
function test(actual, expected, label) { assert.equal(actual, expected, label); count++; }
market(10000, 50000);
let result = window.__binchEstimateTest(recipe);
test(result.cost, 20000, 'material cost');
test(result.net, 95000, 'net output');
test(result.margin, 75000, 'gross margin');
test(result.advantage, 76000, 'craft advantage vs component resale');
test(result.stale, false, 'recent observations');
market(10000, 50000, tomorrow);
result = window.__binchEstimateTest(recipe);
test(result.cost, null, 'future ingredient observation rejected');
test(result.sale, null, 'future output observation rejected');
market(1e12, 1e12);
result = window.__binchEstimateTest({
  ...recipe, yield: 999, ingredients: [{ name: 'Barre', qty: 99999 }]
});
test(result.cost, null, 'unsafe cost total hidden');
test(result.net, 949050000000000, 'large safe net retains precise value');
market(10000, 50000);
result = window.__binchEstimateTest({ ...recipe, yield: 1e12 });
test(result.net, null, 'unsafe revenue total hidden');
market(10000, 50000, oneHourAgo, 'not a number');
result = window.__binchEstimateTest(recipe);
test(result.fee, 5, 'invalid fee defaults to five percent');
console.log('AH craft: ' + count + ' assertions passed');

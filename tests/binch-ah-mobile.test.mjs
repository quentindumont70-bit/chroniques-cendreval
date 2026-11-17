import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = file => readFileSync(new URL('../public/binch/' + file, import.meta.url), 'utf8');

test('Trading is offered as a customizable mobile shortcut and navigates to the real tab', () => {
  const mobile=read('mobile-nav.js'),trading=read('ah-trading.js'),html=read('index.html');
  assert.match(mobile,/\['trading','Trading','◇'\]/);
  assert.match(mobile,/original\.querySelector\('button\[data-page="/);
  assert.match(mobile,/target\.click\(\)/);
  assert.match(trading,/dataset\.page\s*=\s*'trading'/);
  assert.match(html,/mobile-nav\.js\?v=004/);
  assert.match(html,/ah-trading\.js\?v=004/);
});

test('Trading accepts future supported AH feed formats through the shared parser', () => {
  const ui=read('ah-trading.js'),core=read('ah-trading-core.js'),collector=readFileSync(new URL('../scripts/collect-ah-feed.mjs', import.meta.url),'utf8');
  assert.match(ui,/if\(!T\.feedSummary\(f\)\)throw Error/);
  assert.match(core,/binch-ah-feed-v1/);
  assert.match(core,/binch-ah-feed-v2/);
  assert.match(collector,/binch-ah-feed-v2/);
});

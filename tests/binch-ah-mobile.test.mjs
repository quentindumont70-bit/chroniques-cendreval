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

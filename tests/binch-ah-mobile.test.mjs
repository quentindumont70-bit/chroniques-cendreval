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
  assert.match(html,/ah-trading\.js\?v=014/);
  assert.match(html,/ah-trading-core\.js\?v=008/);
});

test('Trading accepts future supported AH feed formats through the shared parser', () => {
  const ui=read('ah-trading.js'),core=read('ah-trading-core.js'),collector=readFileSync(new URL('../scripts/collect-ah-feed.mjs', import.meta.url),'utf8');
  assert.match(ui,/if\(!T\.feedSummary\(f\)\)throw Error/);
  assert.match(core,/binch-ah-feed-v1/);
  assert.match(core,/binch-ah-feed-v2/);
  assert.match(collector,/binch-ah-feed-v2/);
});


test('Trading comparateur ne surligne que les cotations récentes de la bonne région/faction',()=>{
 const ui=read('ah-trading.js');
 assert.match(ui,/comparable=cm\.filter\(x=>x\.price!=null&&x\.fresh&&x\.region===state\.region&&x\.faction===c\.scope\?\.faction\)/);
 assert.match(ui,/comparable\.length>=2/);
 assert.match(ui,/périmé, non comparable/);
 assert.match(ui,/Les cours périmés sont visibles, mais exclus de la comparaison/);
});


test('From imported bags, item lookup is explicit and never auto-fetches or writes a price',()=>{
 const ui=read('ah-trading.js');
 assert.match(ui,/data-bt-lookup=/);
 assert.match(ui,/Number\.isSafeInteger\(Number\(b\.itemId\)\)/);
 assert.match(ui,/lookupItemId=id;lookupItemName=/);
 assert.match(ui,/state\.view='live';save\(\);render\(\)/);
 assert.match(ui,/id<1\|\|id>1000000/);
 assert.match(ui,/value="'\+\(lookupItemId\|\|''\)\+'/);
 assert.match(ui,/Vérifie le marché avant de demander son cours/);
 const clickHandler=ui.slice(ui.indexOf('if(t.dataset.btLookup)'),ui.indexOf('if(t.dataset.btView)'));
 assert.doesNotMatch(clickHandler,/fetch\(|onAhl\(/);
 assert.doesNotMatch(clickHandler,/persistMarket\(|mergeFeed\(/);
});

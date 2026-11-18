import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=file=>readFileSync(new URL('../public/binch/'+file,import.meta.url),'utf8');

test('Talents Druide : constellation originale et distinction guide / données du jeu',()=>{
 const xml=read('renaissance-feral-constellation.svg'),css=read('visual-renaissance-finale.css');
 const guide=read('specs-guide.js');
 assert.ok(xml.startsWith('<svg xmlns="http://www.w3.org/2000/svg"'));
 assert.ok(xml.includes('viewBox="0 0 1200 560"'));
 assert.match(xml,/arbre de talents officiel/);
 assert.ok(css.includes('renaissance-feral-constellation.svg'));
 assert.ok(css.includes('#page-specs #binch-specs .binch-specs-progress'));
 assert.ok(css.includes('#page-specs #binch-specs .binch-specs-step.is-current'));
 assert.ok(css.includes('#page-specs #binch-specs .binch-specs-step.is-done'));
 assert.ok(css.includes('#page-specs #binch-specs .binch-specs-step.is-future'));
 assert.ok(guide.includes('guides publics Forever, pas des valeurs lues en direct dans WoW')||guide.includes('Guides publics Forever, pas des valeurs lues en direct dans WoW'));
 assert.ok(guide.includes("g.id!=='druid-feral'"),'other classes must not show an invented route');
});

test('Interface Renaissance : arrière-plan de classe et présentations sans écriture métier',()=>{
 const css=read('visual-renaissance-finale.css'),html=read('index.html');
 assert.ok(css.includes('var(--br-world-art)'));
 assert.ok(css.includes('body:has(#app:not(.hidden))'));
 assert.ok(css.includes('#page-tresors .binch-treasure-card'));
 assert.ok(css.includes('#page-gm .binch-gm-watch-event strong'));
 assert.ok(css.includes('#binch-specs-pinned:not([hidden])'));
 assert.ok(html.includes('./visual-renaissance-finale.css?v=001'));
 assert.ok(html.lastIndexOf('./visual-renaissance-finale.css?v=001')>html.indexOf('./visual-renaissance-dock.css?v=002'));
 assert.ok(!css.includes('localStorage'));
 assert.ok(!css.includes('fetch('));
});

test('Renaissance finale : écrans étroits, mouvement réduit, mode léger et couleurs système',()=>{
 const css=read('visual-renaissance-finale.css');
 assert.ok(css.includes('@media(max-width:540px)'));
 assert.ok(css.includes('@media(max-width:370px)'));
 assert.ok(css.includes('@media(prefers-reduced-motion:reduce)'));
 assert.ok(css.includes('html[data-binch-detail=lite]'));
 assert.ok(css.includes('@media(forced-colors:active)'));
 assert.ok(css.includes('#page-specs #binch-specs-cards{grid-template-columns:1fr}'));
 assert.ok(css.includes('#page-specs #binch-specs .binch-specs-steps{grid-template-columns:1fr}'));
 assert.ok(css.includes('background-image:linear-gradient(#0b191d,#0b1218)'));
});

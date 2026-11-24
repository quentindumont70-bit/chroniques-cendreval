import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const read=name=>readFile(new URL('../big-cthu-beta/'+name,import.meta.url),'utf8');
const cssPromise=read('tournee-medical-ops.css');
test('V261 : toutes les nouvelles règles restent limitées au thème facultatif',async()=>{
 const css=(await cssPromise).replace(/\/\*[\s\S]*?\*\//g,'');
 let level=0;
 for(const character of css){
  if(character==='{')level++;
  if(character==='}')level--;
  assert.ok(level>=0,'accolade fermante sans ouvrante');
 }
 assert.equal(level,0,'feuille CSS équilibrée');
 const selectors=[...css.matchAll(/([^{}]+)\{/g)].map(m=>m[1].trim());
 for(const selector of selectors){
  if(selector.startsWith('@media'))continue;
  for(const part of selector.split(','))assert.ok(part.trim().startsWith('[data-theme=medicalops]'),'sélecteur non isolé : '+part.trim().slice(0,80));
 }
 assert.doesNotMatch(css,/url\(|@import|fetch\s*\(|localStorage|indexedDB|tidel_Pl|https?:\/\//);
});
test('V261 : les actions de rappel atteignent 44 px et la saisie évite le zoom iOS',async()=>{
 const css=await cssPromise;
 assert.match(css,/\.tq-sticky-actions button,[\s\S]*?\.tq-sticky-actions \.tq-sticky-delete\s*\{[\s\S]*?min-width:44px;min-height:44px;/);
 assert.match(css,/\.tq-sticky-new input,[\s\S]*?\.tq-week select\s*\{[\s\S]*?font-size:max\(16px,1em\);min-height:44px;/);
 assert.match(css,/\.tq-sticky-new button\{min-height:48px\}/);
 const html=await read('tournee-complete.html');
 assert.match(html,/class="tq-sticky-new"/);
 assert.match(html,/class="tq-sticky-delete"/);
});
test('V261 : à 430 px, entête adaptable, onglets lisibles et bas protégé',async()=>{
 const css=await cssPromise;
 const responsive=css.slice(css.indexOf('@media(max-width:430px)'));
 const section=responsive.split('@media(max-width:380px)')[0];
 assert.match(section,/header \.t\s*\{[^}]*flex-wrap:wrap/);
 assert.match(section,/header \.ttl\s*\{[^}]*flex:1 0 100%/);
 assert.match(section,/header \.hbtn\s*\{[^}]*min-width:44px/);
 assert.match(section,/nav\.tabs button\s*\{[^}]*min-height:66px/);
 assert.match(section,/nav\.tabs button\s*\{[^}]*overflow-wrap:anywhere/);
 assert.match(section,/main\s*\{[^}]*safe-area-inset-bottom/);
});
test('V261 : à 380 puis 340 px, stats et boutons peuvent passer sur plusieurs lignes',async()=>{
 const css=await cssPromise;
 const small=css.slice(css.lastIndexOf('@media(max-width:380px)')).split('@media(max-width:340px)')[0];
 const tiny=css.slice(css.lastIndexOf('@media(max-width:340px)')).split('@media(prefers-contrast:more)')[0];
 assert.ok(small&&tiny);
 assert.match(small,/\.tq-pro-overview-stats\s*\{[^}]*repeat\(2,minmax\(0,1fr\)\)/);
 assert.match(small,/\.tq-sticky-new\s*\{[^}]*display:grid/);
 assert.match(tiny,/\.tq-pro-overview-actions\s*\{[^}]*grid-template-columns:minmax\(0,1fr\)/);
 assert.match(tiny,/\.tq-pro-overview-stats\s*\{[^}]*grid-template-columns:minmax\(0,1fr\)/);
});
test('V261 : erreur de sauvegarde visible en entier, et respect du contraste et du mouvement réduits',async()=>{
 const css=await cssPromise;
 assert.match(css,/#tour-save-strip\[data-state="error"\] #tour-save-text\s*\{[^}]*max-height:none;overflow:visible/);
 assert.match(css,/@media\(prefers-contrast:more\)/);
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
 const html=await read('tournee-complete.html');
 assert.match(html,/id="tour-save-strip"/);
 assert.match(html,/id="tour-save-text"/);
});
test('V261 : aucun changement du coffre, mise en cache et CI complètes',async()=>{
 const [html,sw,control,pkg,plan,old]=await Promise.all([
  read('tournee-complete.html'),read('sw.js'),read('tournee-controle-iphone.html'),
  readFile(new URL('../package.json',import.meta.url),'utf8'),
  readFile(new URL('../docs/tournee-pro/PLAN-DE-LANCEMENT.md',import.meta.url),'utf8'),
  readFile(new URL('tournee-v260-medical-ops-theme.test.mjs',import.meta.url),'utf8')
 ]);
 assert.match(sw,/big-cthu-public-v2-v267/);
 assert.match(control,/big-cthu-public-v2-v267/);
 assert.match(sw,/'\.\/tournee-medical-ops\.css'/);
 assert.match(html,/function writeEncryptedVaultRecord\(record\)/);
 assert.match(html,/function tqPostitBlock\(\)/);
 assert.match(pkg,/tests\/tournee-v261-small-iphone\.test\.mjs/);
 assert.match(plan,/Golipette V261/);
 assert.match(old,/Medical Ops/);
});

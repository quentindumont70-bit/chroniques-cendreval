import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext,Script} from 'node:vm';

const read=name=>readFile(new URL('../big-cthu-beta/'+name,import.meta.url),'utf8');
async function source(){
 const html=await read('tournee-complete.html');
 const js=html.split('<script type="text/plain" id="tour-source-js">')[1]?.split('</script>')[0];
 assert.ok(js,'code de tournée disponible');
 return {html,js};
}
const section=(js,start,end)=>{
 const i=js.indexOf(start),j=js.indexOf(end,i+start.length);
 assert.ok(i>=0&&j>i,'source métier trouvable : '+start);
 return js.slice(i,j);
};
test('V267 : Nouveau patient accessible avant recherche, indépendamment des filtres',async()=>{
 const {js}=await source();
 const code=section(js,'function viewPat(){','function psortOf(){');
 const ctx={q:'',flt:'all',FL:[['all','Tous']],esc:s=>s,patList:()=>'<div id="fictive-patients">Fictif</div>',render(){}};
 runInNewContext(code+'this.view=viewPat;',ctx,{timeout:1000});
 for(const [q,flt]of [['','all'],['filtre fictif','all'],['','tj'],['filtre fictif','res']]){
  ctx.q=q;ctx.flt=flt;
  const html=ctx.view();
  assert.match(html,/class="tq-patient-create-button"/);
  assert.match(html,/onclick="editP\(\)"/);
  assert.match(html,/＋ Nouveau patient/);
  assert.ok(html.indexOf('tq-patient-create-button')<html.indexOf('type="search"'),'bouton visible avant le champ de recherche');
 }
 assert.doesNotMatch(code,/\bEDIT\b/,'création non bloquée par le mode édition');
});
test('V267 : créer ouvre le formulaire complet existant, jamais une copie de base',async()=>{
 const {js}=await source();
 const code=section(js,'function editP(id){','function edForm(){');
 let called=0;
 const ctx={P:[],day:'2026-11-25',Date,JSON,DT:value=>new Date(value+'T12:00:00'),DR:null,edForm(){called++}};
 runInNewContext(code+'this.create=editP;',ctx,{timeout:1000});
 ctx.create();
 assert.equal(called,1);
 assert.equal(ctx.DR.n,'');
 assert.equal(ctx.DR.deb,'2026-11-25');
 assert.equal(ctx.DR._new,true);
 assert.equal(ctx.DR.h,'');
});
test('V267 : boutons de tri visibles en mode standard et après une recherche',async()=>{
 const {js}=await source();
 const code=section(js,'function sortRow(){','function patList(){');
 const cases=[['manual',false,false],['az',true,false],['za',false,true]];
 for(const [mode,az,za] of cases){
  const ctx={psortOf:()=>mode};
  runInNewContext(code+'this.make=sortRow;',ctx,{timeout:1000});
  const html=ctx.make();
  assert.match(html,/tq-patient-sort-btn/);
  assert.match(html,/▲ A-Z/);
  assert.match(html,/▼ Z-A/);
  assert.match(html,/aria-label="Tri alphabétique rapide"/);
  assert.match(html,new RegExp('aria-pressed="'+az+'"'));
  assert.match(html,new RegExp('aria-pressed="'+za+'"'));
  assert.doesNotMatch(html,/disabled|pointer-events:none|opacity:0/);
  assert.doesNotMatch(code,/\bEDIT\b|\bflt\b|\bq\b/);
 }
});
test('V267 : tri A-Z/Z-A alterne avec l ordre manuel sans toucher aux fiches',async()=>{
 const {js}=await source(),code=section(js,'function sortRow(){','function patList(){');
 for(const [mode,expected]of [['manual',"psortSet('az')"],['az',"psortSet('manual')"],['za',"psortSet('manual')"]]){
  const ctx={psortOf:()=>mode};
  runInNewContext(code+'this.make=sortRow;',ctx,{timeout:1000});
  const html=ctx.make();
  assert.ok(html.includes(expected));
  assert.doesNotMatch(code,/TOUR_STORE|localStorage|indexedDB|fetch\s*\(/);
 }
});
test('V267 : contrastes explicites des boutons normaux et sélectionnés, sur tous les thèmes',async()=>{
 const css=await read('tournee-v267-patients.css');
 assert.match(css,/\.tq-patient-sort-btn\s*\{[^}]*background:var\(--card\)!important;color:var\(--ink\)!important/);
 assert.match(css,/\.tq-patient-sort-btn\.is-active\s*\{[^}]*background:var\(--acc\)!important;color:var\(--acc-ink\)!important/);
 assert.match(css,/opacity:1!important/);
 assert.match(css,/min-height:48px/);
 assert.match(css,/\.tq-patient-create-button\s*\{[^}]*min-height:54px/);
 assert.match(css,/focus-visible/);
 assert.match(css,/@media\(max-width:360px\)/);
 assert.doesNotMatch(css,/@import|url\(|https?:\/\//);
});
test('V267 : création dédiée n exige pas le mode édition pour pouvoir ouvrir la fiche',async()=>{
 const {js}=await source(),pat=section(js,'function viewPat(){','function psortOf(){');
 const sort=section(js,'function sortRow(){','function patList(){');
 assert.match(pat,/onclick="editP\(\)"/);
 assert.doesNotMatch(sort,/Nouveau patient/,'pas de double bouton de création dans la ligne du tri');
 assert.match(js,/async function edSave\(\)/);
 assert.match(js,/if\(DR\._new&&!DR\.deb\)/);
 assert.match(js,/function edEveryDay\(\)/);
});
test('V267 : styles sans interaction avec le coffre, code JS valide',async()=>{
 const {html,js}=await source(),css=await read('tournee-v267-patients.css');
 assert.doesNotThrow(()=>new Script(js));
 assert.match(html,/<link rel="stylesheet" href="\.\/tournee-v267-patients\.css">/);
 assert.match(html,/function writeEncryptedVaultRecord\(record\)/);
 assert.match(js,/function cfgSave\(msg\)/);
 assert.doesNotMatch(css,/localStorage|indexedDB|fetch\s*\(|WebSocket|tidel_Pl/);
});
test('V267 : cache public, tests historiques et feuille de route à jour',async()=>{
 const [sw,control,pkg,plan]=await Promise.all([
  read('sw.js'),read('tournee-controle-iphone.html'),
  readFile(new URL('../package.json',import.meta.url),'utf8'),
  readFile(new URL('../docs/tournee-pro/PLAN-DE-LANCEMENT.md',import.meta.url),'utf8')
 ]);
 assert.match(sw,/big-cthu-public-v2-v267/);
 assert.match(sw,/'\.\/tournee-v267-patients\.css'/);
 assert.match(control,/big-cthu-public-v2-v267/);
 assert.match(pkg,/tests\/tournee-v267-patient-actions\.test\.mjs/);
 assert.match(plan,/Golipette V267/);
});

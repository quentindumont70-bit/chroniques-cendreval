import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext,Script} from 'node:vm';

const read=name=>readFile(new URL('../big-cthu-beta/'+name,import.meta.url),'utf8');
async function appSource(){
 const html=await read('tournee-complete.html');
 const script=html.split('<script type="text/plain" id="tour-source-js">')[1]?.split('</script>')[0];
 assert.ok(script);
 return {html,script};
}
test('V260 : Medical Ops disponible dans le sélecteur, pas activé par défaut',async()=>{
 const {html,script}=await appSource();
 const at=script.indexOf('const THEMES='),stop=script.indexOf(';\nconst ALL=',at);
 assert.ok(at>0&&stop>at);
 const ctx={};
 runInNewContext(script.slice(at,stop+1)+'\nthis.themes=THEMES;',ctx,{timeout:1000});
 const themes=Array.from(ctx.themes);
 assert.ok(themes.some(item=>item[0]==='medicalops'&&item[1]==='Medical Ops'));
 assert.ok(themes.some(item=>item[0]==='lagon'));
 assert.ok(themes.some(item=>item[0]==='nuit'));
 assert.notEqual(themes[0][0],'medicalops');
 assert.match(script,/aria-pressed="\$\{id===cur\}"/);
 assert.match(script,/présentation facultative/);
 assert.match(html,/<link rel="stylesheet" href="\.\/tournee-medical-ops\.css">/);
 assert.ok(html.indexOf('./tournee-medical-ops.css')<html.indexOf('</head>'));
});
test('V260 : sélection et retour vers Lagon utilisent le réglage de thème existant',async()=>{
 const {script}=await appSource();
 const start=script.indexOf('function setTheme(t){'),end=script.indexOf('\nfunction openPk(){',start);
 assert.ok(start>0&&end>start);
 const saved=[],meta={content:''};
 const document={documentElement:{dataset:{theme:'lagon'}},querySelector:sel=>sel==='meta[name=theme-color]'?meta:null};
 const ctx={document,THEMES:[['medicalops','Medical Ops','','','#76e5ed',''],['lagon','Lagon','','','#0b6e69','']],
  st:{set:(key,value)=>saved.push([key,value])},skSync(){},renderPk(){},autoAmb(){}};
 runInNewContext(script.slice(start,end)+'\nthis.select=setTheme;',ctx,{timeout:1000});
 ctx.select('medicalops');
 assert.equal(document.documentElement.dataset.theme,'medicalops');
 ctx.select('lagon');
 assert.equal(document.documentElement.dataset.theme,'lagon');
 assert.equal(JSON.stringify(saved),JSON.stringify([['theme','medicalops'],['theme','lagon']]));
 assert.equal(meta.content,'#0b6e69');
});
test('V260 : thème choisi repris au chargement, valeur inattendue ignorée',async()=>{
 const {script}=await appSource();
 const start=script.indexOf('/* V260 : reprendre le thème choisi');
 const end=script.indexOf('/* ===== V8 :',start);
 assert.ok(start>0&&end>start);
 const code=script.slice(start,end);
 const themes=[['auto'],['lagon'],['nuit'],['medicalops']];
 const document={documentElement:{dataset:{theme:'lagon'}}};
 runInNewContext(code,{document,THEMES:themes,st:{get:()=> 'medicalops'},autoAmb(){throw Error('pas auto')}},{timeout:1000});
 assert.equal(document.documentElement.dataset.theme,'medicalops');
 const invalid={documentElement:{dataset:{theme:'lagon'}}};
 runInNewContext(code,{document:invalid,THEMES:themes,st:{get:()=> '../../unsafe'},autoAmb(){}},{timeout:1000});
 assert.equal(invalid.documentElement.dataset.theme,'lagon');
 const automatic={documentElement:{dataset:{theme:'lagon'}}};
 runInNewContext(code,{document:automatic,THEMES:themes,st:{get:()=> 'auto'},autoAmb(){automatic.documentElement.dataset.theme='nuit'}},{timeout:1000});
 assert.equal(automatic.documentElement.dataset.theme,'nuit');
 assert.doesNotMatch(code,/localStorage|setItem|indexedDB|fetch\s*\(/);
});
test('V260 : styles limités à Medical Ops, lecture et mobilité',async()=>{
 const css=await read('tournee-medical-ops.css');
 assert.match(css,/\[data-theme=medicalops\]/);
 assert.match(css,/\.tq-pro-overview/);
 assert.match(css,/\.tq-sticky/);
 assert.match(css,/\.stop \.card/);
 assert.match(css,/nav\.tabs/);
 assert.match(css,/min-height:48px/);
 assert.match(css,/min-height:44px/);
 assert.match(css,/prefers-reduced-motion:reduce/);
 assert.doesNotMatch(css,/url\(|@import|fetch\s*\(|localStorage|indexedDB|tidel_Pl|https?:\/\//);
 assert.doesNotMatch(css,/(^|\n)(?:body|header|\.card|:root)\s*\{/);
});
test('V260 : feuille de style publique mise en cache pour l utilisation hors ligne',async()=>{
 const sw=await read('sw.js');
 const pkg=await readFile(new URL('../package.json',import.meta.url),'utf8');
 const plan=await readFile(new URL('../docs/tournee-pro/PLAN-DE-LANCEMENT.md',import.meta.url),'utf8');
 assert.match(sw,/big-cthu-public-v2-v264/);
 assert.match(sw,/'\.\/tournee-medical-ops\.css'/);
 assert.doesNotMatch(sw,/tidel_Pl|indexedDB|localStorage/);
 assert.match(pkg,/tests\/tournee-v260-medical-ops-theme\.test\.mjs/);
 assert.match(plan,/Golipette V260/);
});
test('V260 : vue et chiffrement métier inchangés, script syntaxiquement valide',async()=>{
 const {html,script}=await appSource();
 assert.doesNotThrow(()=>new Script(script));
 assert.match(html,/function writeEncryptedVaultRecord\(record\)/);
 assert.match(html,/function tqPostitBlock\(\)/);
 assert.match(html,/function tqProOverview\(L,completed\)/);
 assert.match(html,/id="tour-save-strip"/);
});

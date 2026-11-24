import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext,Script} from 'node:vm';

const read=name=>readFile(new URL('../big-cthu-beta/'+name,import.meta.url),'utf8');
async function app(){
 const html=await read('tournee-complete.html');
 const js=html.split('<script type="text/plain" id="tour-source-js">')[1]?.split('</script>')[0];
 assert.ok(js,'script métier embarqué');
 return {html,js};
}
const cut=(s,a,b)=>{
 const i=s.indexOf(a),j=s.indexOf(b,i+a.length);
 assert.ok(i>=0&&j>i, 'source réelle: '+a);
 return s.slice(i,j);
};
test('V266 : nouvelle fiche initialise date de début depuis la date affichée, sans inventer de dossier',async()=>{
 const {js}=await app();
 const src=cut(js,'function editP(id){','function edForm(){');
 const ctx={P:[],day:'2026-11-25',DT:date=>new Date(date+'T12:00:00'),Date,JSON,DR:null,edForm(){}};
 runInNewContext(src+'this.create=editP;',ctx,{timeout:1000});
 ctx.create();
 assert.equal(ctx.DR.deb,'2026-11-25');
 assert.deepEqual(Array.from(ctx.DR.j),[3]);
 assert.equal(ctx.DR.n,'');
 assert.equal(ctx.DR.routeFirst,undefined);
});
test('V266 : le formulaire expose début, priorité et jours tous les jours',async()=>{
 const {html,js}=await app();
 assert.match(js,/id="e_deb" type="date"/);
 assert.match(js,/Début de prise en charge/);
 assert.match(js,/id="e_first"/);
 assert.match(js,/En première position de la tournée/);
 assert.match(js,/onclick="edEveryDay\(\)"/);
 assert.match(html,/<link rel="stylesheet" href="\.\/tournee-v266-intake\.css">/);
});
test('V266 : les deux champs supplémentaires sont lus dans le brouillon, sans stockage distinct',async()=>{
 const {js}=await app(),first=cut(js,'function edGrab(){','["n","h","a","etage","telNote"');
 const nodes={e_deb:{value:'2026-11-25'},e_first:{checked:true}};
 const ctx={DR:{id:'FICTIF-V266'},document:{getElementById:k=>nodes[k]}};
 runInNewContext(first+'};this.read=edGrab;',ctx,{timeout:1000});
 ctx.read();
 assert.equal(ctx.DR.deb,'2026-11-25');
 assert.equal(ctx.DR.routeFirst,true);
 nodes.e_deb.value='';
 nodes.e_first.checked=false;
 ctx.read();
 assert.equal(ctx.DR.deb,undefined);
 assert.equal(ctx.DR.routeFirst,undefined);
});
test('V266 : Tous les jours efface seulement les jours fixes et dates exclusives',async()=>{
 const {js}=await app(),body=cut(js,'function edEveryDay(){','function edDay(d){');
 let refresh=0,warning='';
 const ctx={DR:{id:'FICTIF-V266',j:[1,4],only:['2026-11-25'],deb:'2026-11-25',routeFirst:true},
 edGrab(){},edForm(){refresh++},toast:m=>warning=m};
 runInNewContext(body+'this.allDays=edEveryDay;',ctx,{timeout:1000});
 ctx.allDays();
 assert.equal(ctx.DR.j,undefined);
 assert.equal(ctx.DR.only,undefined);
 assert.equal(ctx.DR.deb,'2026-11-25');
 assert.equal(ctx.DR.routeFirst,true);
 assert.equal(refresh,1);
 ctx.DR.cyc={a:'2026-11-25',ch:[1],gr:[2]};
 ctx.allDays();
 assert.match(warning,/cycle/i);
 assert.ok(ctx.DR.cyc);
 assert.equal(refresh,1);
});
test('V266 : les passages antérieurs à la date de début ne sont jamais programmés',async()=>{
 const {js}=await app(),source=cut(js,'function onDate(p,s){','function daysOf(p){');
 const ctx={ALL:[1,2,3,4,5,6,0],DT:s=>new Date(s+'T12:00:00'),tqOverride:()=>null,suspOf:()=>false,cyk:()=>'',Date};
 runInNewContext(source+'this.isDue=onDate;',ctx,{timeout:1000});
 const p={id:'FICTIF-V266',deb:'2026-11-25',h:'6h45',routeFirst:true};
 assert.equal(ctx.isDue(p,'2026-11-24'),false);
 assert.equal(ctx.isDue(p,'2026-11-23'),false);
 assert.equal(ctx.isDue(p,'2026-11-25'),true);
 assert.equal(ctx.isDue(p,'2026-11-26'),true);
 assert.equal(ctx.isDue({...p,j:[3]},'2026-11-26'),false);
});
test('V266 : patient explicitement prioritaire reste premier même avec un ordre de journée enregistré',async()=>{
 const {js}=await app(),source=cut(js,'function list(d){','function doneSet(){');
 const other={id:'FICTIF-OLDER'},patient={id:'FICTIF-NEW',routeFirst:true},third={id:'FICTIF-THIRD'};
 const P=[other,third,patient],ctx={P,st:{get:()=>['FICTIF-THIRD','FICTIF-OLDER','FICTIF-NEW']},
  onDate:()=>true,dkey:d=>d};
 runInNewContext(source+'this.schedule=list;',ctx,{timeout:1000});
 const order=Array.from(ctx.schedule('2026-11-25')).map(p=>p.id);
 assert.deepEqual(order,['FICTIF-NEW','FICTIF-THIRD','FICTIF-OLDER']);
 assert.deepEqual(P.map(x=>x.id),['FICTIF-OLDER','FICTIF-THIRD','FICTIF-NEW'],'les autres dossiers restent inchangés');
});
test('V266 : ordre historique inchangé quand aucun patient ne demande la priorité',async()=>{
 const {js}=await app(),source=cut(js,'function list(d){','function doneSet(){');
 const P=[{id:'A'},{id:'B'},{id:'C'}];
 const ctx={P,st:{get:()=>['C','A','B']},onDate:()=>true,dkey:d=>d};
 runInNewContext(source+'this.schedule=list;',ctx,{timeout:1000});
 assert.deepEqual(Array.from(ctx.schedule('2026-11-25')).map(p=>p.id),['C','A','B']);
});
test('V266 : sauvegarde refuse la nouvelle fiche sans date et les dates invalides',async()=>{
 const {js}=await app(),source=cut(js,'async function edSave(){','async function edDel(');
 const events=[],ctx={DR:{id:'FICTIF-NEW',_new:true,n:'TEST Fictif',a:'Rue imaginaire',h:'6h45'},
 P:[],edGrab(){},toast:m=>events.push(m),cfgSave:async()=>{events.push('save');return true},document:{getElementById:()=>({classList:{remove(){}}})},
 fiche(){},fhLog(){}};
 runInNewContext(source+'this.save=edSave;',ctx,{timeout:1000});
 await ctx.save();
 assert.equal(ctx.P.length,0);assert.equal(events.includes('save'),false);
 ctx.DR.deb='2026-25-25';
 await ctx.save();
 assert.equal(ctx.P.length,0);assert.equal(events.includes('save'),false);
 ctx.DR.deb='2026-11-25';
 ctx.DR.routeFirst=true;
 await ctx.save();
 assert.equal(ctx.P.length,1);
 assert.equal(ctx.P[0].routeFirst,true);
 assert.equal(ctx.P[0].deb,'2026-11-25');
 assert.equal(events.includes('save'),true);
});
test('V266 : si la sauvegarde échoue, la fiche n est pas ajoutée à la tournée',async()=>{
 const {js}=await app(),source=cut(js,'async function edSave(){','async function edDel(');
 const ctx={DR:{id:'FICTIF-NEW',_new:true,n:'TEST Fictif',a:'Rue imaginaire',h:'6h45',deb:'2026-11-25',routeFirst:true},
 P:[],edGrab(){},toast(){},cfgSave:async()=>false,document:{getElementById:()=>({classList:{remove(){}}})},
 fiche(){throw Error('fiche ouverte malgré échec')},fhLog(){}};
 runInNewContext(source+'this.save=edSave;',ctx,{timeout:1000});
 await ctx.save();
 assert.equal(ctx.P.length,0);
});
test('V266 : le nouveau CSS est tactile, réversible et ne charge aucune donnée distante',async()=>{
 const css=await read('tournee-v266-intake.css');
 assert.match(css,/#e_deb\{/);
 assert.match(css,/font-size:16px/);
 assert.match(css,/min-height:48px/);
 assert.match(css,/\.tq-route-first/);
 assert.match(css,/focus-visible/);
 assert.doesNotMatch(css,/url\(|@import|fetch\s*\(|localStorage|indexedDB|https?:\/\//);
});
test('V266 : aucune fiche réelle embarquée dans le code, chiffrement et caches inchangés',async()=>{
 const {html,js}=await app();
 const [sw,control,pkg,plan]=await Promise.all([
  read('sw.js'),read('tournee-controle-iphone.html'),
  readFile(new URL('../package.json',import.meta.url),'utf8'),
  readFile(new URL('../docs/tournee-pro/PLAN-DE-LANCEMENT.md',import.meta.url),'utf8')
 ]);
 assert.doesNotThrow(()=>new Script(js));
 assert.match(html,/function writeEncryptedVaultRecord\(record\)/);
 assert.match(js,/async function cfgSave\(msg\)/);
 assert.match(sw,/big-cthu-public-v2-v267/);
 assert.match(sw,/'\.\/tournee-v266-intake\.css'/);
 assert.match(control,/big-cthu-public-v2-v267/);
 assert.match(pkg,/tests\/tournee-v266-new-patient-start\.test\.mjs/);
 assert.match(plan,/Golipette V266/);
 assert.doesNotMatch(html,/D'Andrea|Delandine|0763331378/i);
});

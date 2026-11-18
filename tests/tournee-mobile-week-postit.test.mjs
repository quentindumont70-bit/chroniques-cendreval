import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext,Script} from 'node:vm';

const read=path=>readFile(new URL('../big-cthu-beta/'+path,import.meta.url),'utf8');
const sandbox={module:{exports:{}},Set,Map,Date,Array,JSON};
runInNewContext(await read('tournee-quick-core.js'),sandbox,{timeout:1000});
const Q=sandbox.module.exports;
const plain=x=>JSON.parse(JSON.stringify(x));
const patient={id:'p-example',n:'EXEMPLE Camille',cyc:{a:'2026-11-16',from:'2026-11-16',ch:[5,6,0],gr:[1,2,3,4]}};

test('Tournée : cette semaine commence lundi 16/11/2026, la prochaine lundi 23/11',()=>{
 assert.equal(Q.monday('2026-11-18'),'2026-11-16');
 assert.equal(Q.add('2026-11-16',7),'2026-11-23');
 assert.equal(Q.weekMode(patient.cyc,'2026-11-16'),'ch');
 assert.equal(Q.weekMode(patient.cyc,'2026-11-23'),'gr');
 assert.equal(Q.dayNames([5,6,0]),'Ven · Sam · Dim');
});

test('Tournée : inverser le cycle par semaine, sans modifier le patient ni les autres semaines',()=>{
 const entries=[
  {pid:patient.id,week:'2026-11-16',mode:'ch',days:[5,6,0]},
  {pid:patient.id,week:'2026-11-23',mode:'gr',days:[1,2,3,4]}
 ];
 const before=[];
 const changed=plain(Q.update(before,entries));
 assert.equal(Q.validateList(changed),true);
 assert.equal(Q.overrideFor(changed,patient.id,'2026-11-20').mode,'ch');
 assert.equal(Q.overrideFor(changed,patient.id,'2026-11-22').days.includes(0),true);
 assert.equal(Q.overrideFor(changed,patient.id,'2026-11-24').mode,'gr');
 assert.equal(Q.overrideFor(changed,patient.id,'2026-11-30'),null);
 assert.deepEqual(before,[]);
 assert.deepEqual(patient.cyc.ch,[5,6,0]);
});

test('Tournée : refuse doublons, semaines qui ne commencent pas lundi et jours invalides',()=>{
 const valid={pid:'patient-1',week:'2026-11-16',mode:'ch',days:[5,6,0]};
 assert.equal(Q.validOverride({...valid,week:'2026-11-18'}),false);
 assert.equal(Q.validOverride({...valid,days:[5,5,0]}),false);
 assert.equal(Q.validOverride({...valid,mode:'autre'}),false);
 assert.equal(Q.validateList([valid,valid]),false);
 assert.throws(()=>Q.update([valid,valid],[valid]),/invalides/);
});

test('Tournée : phrase écrite sur téléphone => deux semaines, jours spécifiques et aucune modification immédiate',()=>{
 const msg='EXEMPLE en chimio cette semaine vendredi samedi dimanche, granocyte semaine prochaine';
 const plan=plain(Q.parseCommand(msg,'2026-11-18'));
 assert.equal(plan.type,'cycle');
 assert.deepEqual(plan.entries,[
  {week:'2026-11-16',mode:'ch',days:[5,6,0]},
  {week:'2026-11-23',mode:'gr',days:null}
 ]);
 assert.deepEqual(plain(Q.patientMatches(msg,[patient])),[plain(patient)]);
 assert.equal(Q.parseCommand('Changement étrange sans date','2026-11-18'),null);
});

test('Tournée : une note du lendemain est traitée en local sans patient dans le dépôt',()=>{
 const plan=plain(Q.parseCommand('pour demain ajouter dans le pense-bête « prise de sang TEST »','2026-11-18'));
 assert.deepEqual(plan,{type:'memo',day:'2026-11-19',text:'prise de sang TEST'});
 assert.deepEqual(plain(Q.parseCommand('demain : penser au prélèvement','2026-11-18')),{type:'memo',day:'2026-11-19',text:'penser au prélèvement'});
 assert.deepEqual(plain(Q.parseCommand('inverse les semaines pour EXEMPLE','2026-11-18')),{type:'swap',entries:[]});
});

test('Tournée : commandes locales, sauvegarde chiffrée existante et aucune requête réseau ajoutée',async()=>{
 const [page,helper,sw]=await Promise.all(['tournee-complete.html','tournee-quick-core.js','sw.js'].map(read));
 const embedded=page.split('<script type="text/plain" id="tour-source-js">')[1]?.split('</script>')[0];
 assert.ok(embedded,'Source Tournée absente');
 assert.doesNotThrow(()=>new Script(embedded), 'La source de la tournée doit rester syntaxiquement valide');
 assert.match(page,/script src="\.\/tournee-quick-core\.js"/);
 assert.match(page,/tqPostitBlock\(\)/);
 assert.match(page,/tqChatBlock\(\)/);
 assert.match(page,/tqWeekBlock\(\)/);
 assert.match(page,/TQ_WEEK_KEY="tidel_cyc_week_override_v1"/);
 assert.match(page,/TQ_STICKY_ID="tq-postit"/);
 assert.match(page,/await ensureVaultSaved\(\)/);
 assert.match(page,/function cyk\(p,s\)\{[^]*?const ov=tqOverride\(p,s\)/);
 assert.match(page,/function onDate\(p,s\)\{[^]*?const ov=tqOverride\(p,s\)/);
 assert.match(page,/aria-label="Post-it du /);
 assert.match(helper,/Never contacts a server/);
 assert.doesNotMatch(helper,/fetch\(|XMLHttpRequest|WebSocket|sendBeacon|Topaze/);
 assert.match(sw,/'\.\/tournee-quick-core\.js'/);
});

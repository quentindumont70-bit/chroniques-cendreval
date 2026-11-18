import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';

const read=name=>readFile(new URL('../big-cthu-beta/'+name,import.meta.url),'utf8');
const helperText=await read('tournee-quick-core.js');
const env={module:{exports:{}}};
runInNewContext(helperText,env,{timeout:1500});
const TQ=env.module.exports;
const html=await read('tournee-complete.html');
const opener='<script type="text/plain" id="tour-source-js">';
const start=html.indexOf(opener),end=html.indexOf('</script>',start+opener.length);
const source=html.slice(start+opener.length,end);

test('Tournée V238: embedded source script parses and loads local helper',()=>{
 assert.ok(start>0&&end>start);
 assert.doesNotThrow(()=>new Function(source));
 assert.match(html,/<script src="\.\/tournee-quick-core\.js"><\/script>/);
 assert.match(source,/const TQ=window\.TOURNEE_QUICK/);
});

test('V238: this-week chemo on Friday-Sunday and next-week granocytes',()=>{
 const now='2026-11-18';
 const plan=TQ.parseCommand('Exemple cette semaine chimio vendredi samedi dimanche et semaine pro granocyte',now);
 assert.equal(plan.type,'cycle');
 assert.equal(plan.entries.length,2);
 assert.deepEqual(JSON.parse(JSON.stringify(plan.entries)),[
  {week:'2026-11-16',mode:'ch',days:[5,6,0]},
  {week:'2026-11-23',mode:'gr',days:null}
 ]);
 const list=TQ.update([],[{pid:'demo-person',week:'2026-11-16',mode:'ch',days:[5,6,0]},
  {pid:'demo-person',week:'2026-11-23',mode:'gr',days:[1,3,5]}]);
 assert.equal(TQ.overrideFor(list,'demo-person','2026-11-18').mode,'ch');
 assert.equal(TQ.overrideFor(list,'demo-person','2026-11-27').mode,'gr');
 assert.equal(TQ.overrideFor(list,'other','2026-11-18'),null);
 assert.equal(TQ.dayNames(list[0].days),'Ven · Sam · Dim');
});

test('V238: date-specific post-it text is parsed without external service',()=>{
 const note=TQ.parseCommand('Note pour demain : prise de sang test','2026-11-18');
 assert.equal(note.type,'memo');
 assert.equal(note.day,'2026-11-19');
 assert.equal(note.text,'prise de sang test');
 const second=TQ.parseCommand('ajoute au pense-bête de demain « matériel test »','2026-11-18');
 assert.equal(second.day,'2026-11-19');
 assert.equal(second.text,'matériel test');
 assert.equal(TQ.parseCommand('modifie le tarif du patient', '2026-11-18'),null);
 assert.doesNotMatch(helperText,/fetch\s*\(|XMLHttpRequest|WebSocket|sendBeacon/);
});

test('V238: exact weekly overrides cannot silently overflow or duplicate',()=>{
 const a={pid:'demo',week:'2026-11-16',mode:'ch',days:[5,6,0]};
 assert.equal(TQ.validateList([a]),true);
 assert.equal(TQ.validateList([a,a]),false);
 assert.equal(TQ.validOverride({...a,week:'2026-11-18'}),false);
 assert.equal(TQ.validOverride({...a,days:[0,0]}),false);
 assert.equal(TQ.validOverride({...a,days:[]}),false);
 assert.throws(()=>TQ.update([], [{...a,days:[]}]),/semaines invalides/i);
 const updated=TQ.update([a],[{...a,mode:'gr',days:[1]}]);
 assert.equal(updated.length,1);
 assert.equal(updated[0].mode,'gr');
});

test('V238: onDate respects a saved override before normal alternating cycle',()=>{
 const cykStart=source.indexOf('function cyk(p,s){'),cykEnd=source.indexOf('function sx(p)',cykStart);
 const onDateStart=source.indexOf('function onDate(p,s){'),onDateEnd=source.indexOf('function daysOf(p)',onDateStart);
 assert.ok(cykStart>0&&cykEnd>cykStart&&onDateEnd>onDateStart);
 const mocks={
  DT:s=>{const [y,m,d]=s.split('-').map(Number);return new Date(y,m-1,d,12);},
  addD:TQ.add,
  suspOf:()=>false,
  tqOverride:(p,s)=>TQ.overrideFor(p.overrides,p.id,s)
 };
 const run= new Function(...Object.keys(mocks),
  source.slice(cykStart,cykEnd)+'\n'+source.slice(onDateStart,onDateEnd)+'\nreturn {cyk,onDate};');
 const {cyk,onDate}=run(...Object.values(mocks));
 const patient={id:'demo',cyc:{from:'2026-01-01',a:'2026-11-16',ch:[1,3],gr:[2,4]},overrides:[
   {pid:'demo',week:'2026-11-16',mode:'ch',days:[5,6,0]},
   {pid:'demo',week:'2026-11-23',mode:'gr',days:[2,4]}
 ]};
 for(const day of ['2026-11-16','2026-11-17','2026-11-18','2026-11-19'])assert.equal(onDate(patient,day),false,day);
 for(const day of ['2026-11-20','2026-11-21','2026-11-22'])assert.equal(onDate(patient,day),true,day);
 assert.equal(cyk(patient,'2026-11-20'),'ch');
 assert.equal(cyk(patient,'2026-11-24'),'gr');
 assert.equal(onDate(patient,'2026-11-24'),true);
 patient.rm=['2026-11-21'];
 assert.equal(onDate(patient,'2026-11-21'),false,'explicitly removed visit must override weekly schedule');
 delete patient.rm;
 assert.equal(onDate(patient,'2026-11-23'),false);
});

test('V238: the daily sticky note reuses the encrypted Tournée memo key',()=>{
 assert.match(source,/const key="tidel_memo_"\+d/);
 assert.match(source,/await tqCommitVaultKey\(key,JSON\.stringify\(next\),old\)/);
 assert.match(source,/await ensureVaultSaved\(\)/);
 assert.match(source,/function tqPostitBlock\(\)/);
 assert.match(source,/oninput="tqStickyDraft\(this\)" onblur="tqStickySave\(this\)"/);
 assert.match(source,/data-tq-day=/);
 assert.match(source,/function tqChatPreview\(e\)/);
 assert.match(source,/function tqWeekWarning\(\)/);
 assert.match(source,/const tqStickyDrafts=Object\.create\(null\)/);
 assert.match(source,/function tqWeekApply\(\)/);
 assert.match(source,/if\(!confirm\(/);
 assert.match(source,/AUCUNE donnée encore changée/);
 assert.match(source,/Ce n’est pas un chat IA connecté/);
});

test('V238: no real patient details or Topaze automation hardcoded in helper',()=>{
 assert.doesNotMatch(helperText,/Fillon|Bernard|Topaze|patient named|https?:\/\//i);
 assert.match(html,/Tournée · Application principale/);
});


test('Tournée V239: cache hors ligne rafraîchi et nouveau helper présent dans les assets',async()=>{
 const sw=await read('sw.js');
 assert.match(sw,/const CACHE='big-cthu-public-v2-v\d+'/);
 assert.match(sw,/'\.\/tournee-complete\.html'/);
 assert.match(sw,/'\.\/tournee-quick-core\.js'/);
 const [helper,html]=await Promise.all(['tournee-quick-core.js','tournee-complete.html'].map(read));
 assert.doesNotMatch(helper,/\bfetch\s*\(|XMLHttpRequest|WebSocket/);
 assert.match(html,/function tqWeekWarning\(\)/);
 assert.match(html,/function tqStickyDraft\(el\)/);
});

test('Tournée V240: accès visible à l’assistant depuis l’en-tête, sans recherche dans la tournée',()=>{
 assert.match(html,/id="tq-header-chat"/);
 assert.match(html,/onclick="tqOpenAssistant\(\)"/);
 assert.match(html,/💬 Assistant/);
 assert.match(source,/function tqOpenAssistant\(\)/);
 assert.match(source,/panel\.scrollIntoView\(\{behavior:"smooth",block:"start"\}\)/);
 assert.match(source,/input\.focus\(\{preventScroll:true\}\)/);
 assert.match(source,/panel\.classList\.add\("tq-targeted"\)/);
});

test('Tournée V240: PIN supplémentaire inactif par défaut, réactivation possible, coffre AES-GCM conservé',()=>{
 assert.match(source,/const TQ_PIN_OPTIN="tq_pin_screen_optin_v240"/);
 assert.match(source,/function tqPinScreenEnabled\(\)\{return st\.get\(TQ_PIN_OPTIN,false\)===true/);
 assert.match(source,/function lockNow\(\)\{if\(!tqPinScreenEnabled\(\)\)return;/);
 assert.match(source,/function tqPinScreenOff\(\)/);
 assert.match(source,/function tqPinScreenOn\(\)/);
 assert.match(source,/st\.set\(TQ_PIN_OPTIN,true\)/);
 assert.match(source,/st\.set\(TQ_PIN_OPTIN,false\)/);
 assert.match(html,/const ORIGINAL_KEY='bigcthu_tournee_full_encrypted_v1'/);
 assert.match(html,/AES-GCM/);
 assert.match(html,/await ensureVaultSaved\(\)/);
 assert.doesNotMatch(source,/function pinOff\(\)\{[^}]*secureState\s*=/);
});


test('Tournée V241: la barre de sauvegarde ne recouvre plus la tournée sur iPhone',()=>{
 const segment=html.slice(html.indexOf('#tour-save-strip{'),html.indexOf('#tour-save-strip[data-state="error"]'));
 assert.match(segment,/#tour-save-strip\{position:relative;z-index:2/);
 assert.doesNotMatch(segment,/position:sticky|z-index:9999/);
 assert.match(html,/#tour-save-strip\[data-state="error"\]\{position:sticky/);
 assert.match(html,/#tour-save-actions\[hidden\]\{display:none!important\}/);
 assert.match(html,/<div id="tour-save-actions" hidden>/);
 assert.match(html,/id="tour-save-menu" aria-expanded="false" aria-controls="tour-save-actions"/);
 assert.match(html,/id="tour-recovery-launch" hidden/);
 assert.match(html,/id="tour-save-text" role="status" aria-live="polite"/);
 assert.match(html,/id="tour-save-retry" hidden/);
});

test('Tournée V241: les outils s’ouvrent et se referment sans toucher au coffre',()=>{
 const start=html.indexOf('function tourSaveMenuToggle(){');
 const end=html.indexOf('function saveStatus(',start);
 assert.ok(start>0&&end>start);
 const panel={hidden:true};
 const menu={attributes:{},textContent:'⋯ Outils',setAttribute(k,v){this.attributes[k]=v}};
 const document={getElementById:k=>k==='tour-save-actions'?panel:k==='tour-save-menu'?menu:null};
 const open=new Function('document',html.slice(start,end)+'; return tourSaveMenuToggle;')(document);
 open();
 assert.equal(panel.hidden,false);
 assert.equal(menu.attributes['aria-expanded'],'true');
 open();
 assert.equal(panel.hidden,true);
 assert.equal(menu.attributes['aria-expanded'],'false');
 assert.doesNotMatch(html.slice(start,end),/TOUR_STORE|secureState|localStorage|fetch\(/);
});

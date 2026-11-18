import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const read=name=>readFile(new URL('../big-cthu-beta/'+name,import.meta.url),'utf8');
test('V245: no secondary PIN lock or PIN setup in Tournée interface',async()=>{
 const html=await read('tournee-complete.html');
 assert.match(html,/function tqPinScreenEnabled\(\)\{return false\}/);
 assert.match(html,/function lockBlock\(\)\{return ''\}/);
 assert.doesNotMatch(html,/function tqPinScreenOn\(\)\{[^}]*st\.set\(TQ_PIN_OPTIN,true\)/);
});
test('V245: recovery shows an actionable button when an old encrypted vault exists',async()=>{
 const html=await read('tournee-complete.html');
 assert.match(html,/id="tour-recovery-direct">Retrouver mes patients/);
 assert.match(html,/if\(direct\)direct\.hidden=false/);
 assert.match(html,/recoverySpaceEmpty\(secureState\)/);
 assert.match(html,/id="tour-recovery-launch">Récupérer mes anciennes données/);
 assert.match(html,/function openTourRecovery\(\)/);
 assert.match(html,/candidates\.push\(\{raw:old,legacy:false\}\)/);
 assert.match(html,/candidates\.push\(\{raw:previous,legacy:true\}\)/);
 assert.match(html,/decryptWithDeviceKey\(candidate\.raw,device\.key\)/);
 assert.match(html,/if\(JSON\.parse\(possible\.tidel_Pl\)\.length>0\)/);
 assert.match(html,/if\(!recoverySpaceEmpty\(secureState\)\)throw Error/);
 assert.match(html,/Ancien coffre et contenu actuel conservés/);
});
test('V245: new recovery does not upload patient data and offline shell is refreshed',async()=>{
 const html=await read('tournee-complete.html');
 const recover=html.slice(html.indexOf('async function recoverOldVault('),html.indexOf('\nfunction fillFromBackup',html.indexOf('async function recoverOldVault(')));
 assert.ok(recover.length>500);
 assert.doesNotMatch(recover,/fetch\s*\(|sendBeacon\s*\(|\.clear\s*\(|removeItem\s*\(/);
 const worker=await read('sw.js');
 assert.match(worker,/const CACHE='big-cthu-public-v2-v247'/);
 assert.match(worker,/'\.\/tournee-complete\.html'/);
});

test('V246: separate rescue route avoids the cached old page and opens recovery immediately',async()=>{
 const rescue=await read('tournee-secours-v246.html');
 assert.match(rescue,/<title>Tournée · Récupération directe V246<\/title>/);
 assert.match(rescue,/autoOpenTournee\(\)\.then\(opened=>\{if\(opened\)openTourRecovery\(\)\}\)/);
 assert.match(rescue,/id="tour-recovery-launch">Récupérer mes anciennes données/);
 assert.match(rescue,/if\(!recoverySpaceEmpty\(secureState\)\)throw Error/);
 const worker=await read('sw.js');
 assert.match(worker,/'\.\/tournee-secours-v246\.html'/);
});

test('V247: empty patient list may import JSON while keeping nonempty local notes',async()=>{
 const html=await read('tournee-complete.html');
 assert.match(html,/function recoveryPatientListEmpty\(state\)/);
 assert.match(html,/if\(!recoveryPatientListEmpty\(secureState\)\)throw Error/);
 assert.match(html,/if\(key==='tidel_Pl'\)continue/);
 assert.match(html,/if\(value!==undefined && !\['','\[\]','\{\}','null'\]\.includes\(value\)\)combined\[key\]=value/);
 const importer=await read('tournee-import-v247.html');
 assert.match(importer,/<details open style="margin-top:14px"/);
 assert.match(importer,/id="tour-import">2 · Restaurer les patients depuis ce fichier/);
 assert.match(importer,/autoOpenTournee\(\)\.then\(opened=>\{if\(opened\)/);
 assert.doesNotMatch(importer,/tournee-idel-sauvegarde-2026-11-13\.json/);
 const worker=await read('sw.js');
 assert.match(worker,/'\.\/tournee-import-v247\.html'/);
});

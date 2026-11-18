import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const read=name=>readFile(new URL('../big-cthu-beta/'+name,import.meta.url),'utf8');
test('V244: no secondary PIN lock or PIN setup in Tournée interface',async()=>{
 const html=await read('tournee-complete.html');
 assert.match(html,/function tqPinScreenEnabled\(\)\{return false\}/);
 assert.match(html,/function lockBlock\(\)\{return ''\}/);
 assert.doesNotMatch(html,/function tqPinScreenOn\(\)\{[^}]*st\.set\(TQ_PIN_OPTIN,true\)/);
});
test('V244: recovery shows an actionable button when an old encrypted vault exists',async()=>{
 const html=await read('tournee-complete.html');
 assert.match(html,/id="tour-recovery-direct" hidden>Retrouver mes patients/);
 assert.match(html,/direct\.hidden=!empty/);
 assert.match(html,/recoverySpaceEmpty\(secureState\)/);
 assert.match(html,/candidates\.push\(\{raw:old,legacy:false\}\)/);
 assert.match(html,/candidates\.push\(\{raw:previous,legacy:true\}\)/);
 assert.match(html,/decryptWithDeviceKey\(candidate\.raw,device\.key\)/);
 assert.match(html,/if\(JSON\.parse\(possible\.tidel_Pl\)\.length>0\)/);
 assert.match(html,/if\(!recoverySpaceEmpty\(secureState\)\)throw Error/);
 assert.match(html,/Ancien coffre et contenu actuel conservés/);
});
test('V244: new recovery does not upload patient data and offline shell is refreshed',async()=>{
 const html=await read('tournee-complete.html');
 const recover=html.slice(html.indexOf('async function recoverOldVault('),html.indexOf('\nfunction fillFromBackup',html.indexOf('async function recoverOldVault(')));
 assert.ok(recover.length>500);
 assert.doesNotMatch(recover,/fetch\s*\(|sendBeacon\s*\(|\.clear\s*\(|removeItem\s*\(/);
 const worker=await read('sw.js');
 assert.match(worker,/const CACHE='big-cthu-public-v2-v244'/);
 assert.match(worker,/'\.\/tournee-complete\.html'/);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const read=name=>readFile(new URL('../big-cthu-beta/'+name,import.meta.url),'utf8');

test('V248: PIN supprimé, aucun champ ni texte de déverrouillage dans Tournée',async()=>{
 const html=await read('tournee-complete.html');
 assert.match(html,/function tqPinScreenEnabled\(\)\{return false\}/);
 assert.match(html,/function lockBlock\(\)\{return ''\}/);
 assert.doesNotMatch(html,/tour-pass|phrase secrète|phrase de sauvegarde/i);
});

test('V248: formulaire JSON disponible depuis la vraie application',async()=>{
 const html=await read('tournee-complete.html');
 assert.match(html,/id="tour-recovery-direct">Importer mon JSON/);
 assert.match(html,/id="tour-recovery-launch">Importer mes patients \(JSON\)/);
 assert.match(html,/id="tour-file" accept="\.json,application\/json"/);
 assert.match(html,/id="tour-import" type="button">2 · Importer le JSON dans cette application/);
 assert.match(html,/document\.getElementById\('tour-import'\)\.addEventListener\('click',\(\)=>login\(true\)\)/);
 assert.match(html,/location\.hash==='#import-json'/);
 assert.match(html,/function openTourRecovery\(\)/);
});

test('V248: restauration locale autorisée uniquement sur liste vide, avec notes préservées et sans upload',async()=>{
 const html=await read('tournee-complete.html');
 const recover=html.slice(html.indexOf('async function recoverOldVault('),html.indexOf('\nfunction fillFromBackup',html.indexOf('async function recoverOldVault(')));
 assert.ok(recover.length>500);
 assert.match(recover,/if\(!recoveryPatientListEmpty\(secureState\)\)throw Error/);
 assert.match(recover,/if\(key==='tidel_Pl'\)continue/);
 assert.match(recover,/if\(value!==undefined && !\['','\[\]','\{\}','null'\]\.includes\(value\)\)combined\[key\]=value/);
 assert.match(recover,/decryptWithDeviceKey\(candidate\.raw,device\.key\)/);
 assert.doesNotMatch(recover,/fetch\s*\(|sendBeacon\s*\(|\.clear\s*\(|removeItem\s*\(/);
});

test('V248: les anciens liens redirigent vers import JSON PWA et le cache est renouvelé',async()=>{
 for(const page of ['tournee-import-v247.html','tournee-secours-v246.html']){
  const html=await read(page);
  assert.match(html,/location\.replace\('\.\/tournee-complete\.html#import-json'\)/);
  assert.doesNotMatch(html,/phrase secrète|tour-pass/i);
 }
 const worker=await read('sw.js');
 assert.match(worker,/const CACHE='big-cthu-public-v2-v248'/);
 assert.match(worker,/'\.\/tournee-complete\.html'/);
});

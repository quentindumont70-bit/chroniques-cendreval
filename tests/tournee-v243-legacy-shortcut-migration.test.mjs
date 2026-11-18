import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';
const read=path=>readFile(new URL('../big-cthu-beta/'+path,import.meta.url),'utf8');
const [legacy,modern,sw,guide,home]=await Promise.all(['tournee.html','tournee-complete.html','sw.js','installation-iphone.html','index.html'].map(read));
const entry=legacy.slice(legacy.indexOf('<script>')+'<script>'.length,legacy.indexOf('</script>',legacy.indexOf('<script>')));
function route(href){
 const calls=[];
 const location={href,search:new URL(href).search,replace:x=>calls.push(x)};
 runInNewContext(entry,{location,URL,URLSearchParams},{timeout:1000});
 return calls;
}
test('V243: le raccourci historique rejoint directement Tournée complète',()=>{
 const url='https://example.test/big-cthu-beta/tournee.html';
 assert.deepEqual(route(url),['https://example.test/big-cthu-beta/tournee-complete.html']);
 assert.deepEqual(route(url+'?v=198'),['https://example.test/big-cthu-beta/tournee-complete.html']);
 assert.deepEqual(route(url+'?legacy=1'),[]);
 assert.doesNotMatch(entry,/localStorage\.removeItem|localStorage\.clear|caches\.delete|fetch\(/);
});
test('V243: l’ancienne interface reste accessible explicitement pour exporter un JSON',()=>{
 assert.match(guide,/href="\.\/tournee\.html\?legacy=1"/);
 assert.match(home,/href="\.\/tournee\.html\?legacy=1" id="tourneeLegacyExport"/);
 assert.match(modern,/href="\.\/tournee\.html\?legacy=1"/);
 assert.match(legacy,/function exportAll\(\)/);
});
const begin=modern.indexOf('function legacyPlainCandidates(){');
const end=modern.indexOf('function launch(){',begin);
assert.ok(begin>0&&end>begin);
const migrateFunctions=modern.slice(begin,end);
const storage=values=>{
 const map=new Map(Object.entries(values));
 let writes=0;
 return {getItem:k=>map.get(k)??null,key:i=>[...map.keys()][i]??null,get length(){return map.size},
  setItem(){writes++;throw Error('Unexpected write')},
  removeItem(){writes++;throw Error('Unexpected deletion')},
  writes:()=>writes};
};
test('V243: lecture de la Tournée historique sans modification de stockage',()=>{
 const legacyStorage=storage({
  tidel_Pl:JSON.stringify([{id:'ref-1',n:'Personne fictive',a:'Adresse fictive'}]),
  tidel_memo_2026:'[]',
  'bigcthu_tournee_full_encrypted_v1':'coffre-simulé'
 });
 const readLegacy=new Function('localStorage','validPortableState',migrateFunctions+'; return legacyPlainCandidates;')(
  legacyStorage,state=>Array.isArray(JSON.parse(state.tidel_Pl||'null'))
 );
 const value=readLegacy();
 assert.equal(value.count,1);
 assert.equal(JSON.parse(value.state.tidel_Pl)[0].id,'ref-1');
 assert.equal(value.state['bigcthu_tournee_full_encrypted_v1'],undefined);
 assert.equal(legacyStorage.writes(),0);
});
test('V243: l’import dans le coffre attend confirmation et n’écrase pas les dossiers déjà présents',()=>{
 assert.match(modern,/id="tour-legacy-migration" hidden/);
 assert.match(modern,/id="tour-legacy-apply"/);
 assert.match(modern,/function maybeOfferLegacyMigration\(\)/);
 assert.match(modern,/if\(!legacy\|\|!recoverySpaceEmpty\(secureState\)\)/);
 assert.match(modern,/function migrateLegacyOnce\(\)/);
 assert.match(modern,/if\(!secureBooted\|\|!secureKey\|\|!recoverySpaceEmpty\(secureState\)\)/);
 assert.match(modern,/if\(!confirm\('Importer '/);
 assert.match(modern,/await ensureVaultSaved\(\)/);
 assert.match(modern,/source\.remove\(\);setTimeout\(maybeOfferLegacyMigration,0\)/);
 assert.doesNotMatch(migrateFunctions,/localStorage\.removeItem\(|localStorage\.clear\(|fetch\(|XMLHttpRequest|WebSocket/);
 assert.match(modern,/#tour-legacy-migration\[hidden\]\{display:none!important\}/);
});
test('V243: le cache PWA renouvelle la page et ne transporte pas les données',()=>{
 assert.match(sw,/const CACHE='big-cthu-public-v2-v243'/);
 assert.match(sw,/'\.\/tournee\.html'/);
 assert.match(sw,/'\.\/tournee-complete\.html'/);
 assert.match(sw,/fetch\(r,\{cache:'no-store'\}\)/);
 assert.match(sw,/if\(r\.method!=='GET'\)return/);
 assert.match(sw,/if\(url\.origin!==self\.location\.origin\)return/);
});

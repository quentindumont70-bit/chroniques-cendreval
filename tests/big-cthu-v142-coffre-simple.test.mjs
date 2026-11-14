import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const read=name=>readFile(new URL('../big-cthu-beta/'+name,import.meta.url),'utf8');

test('V142: sauvegarde immédiate et restauration explicitement repliée',async()=>{
 const html=await read('sauvegardes.html');
 const first=html.indexOf('id="export"'),later=html.indexOf('id="restore"');
 assert.ok(first>0&&later>first,'export mis avant restauration');
 assert.match(html,/<button class="btn" id="export" type="button">Télécharger ma sauvegarde<\/button>/);
 const open=html.indexOf('<details class="restore-details" id="restoreOptions">');
 const close=html.indexOf('</details>',open);
 assert.ok(open>0&&close>open);
 const details=html.slice(open,close);
 assert.match(details,/<summary>Choisir un fichier à restaurer<\/summary>/);
 assert.match(details,/id="file"/);
 assert.match(details,/id="preview"/);
 assert.match(details,/id="consent"/);
 assert.match(details,/id="restore" disabled/);
 assert.doesNotMatch(html.slice(open,open+120),/\bopen\b/);
 assert.match(html,/Les modules présents dans le fichier remplaceront leurs données actuelles/);
 assert.match(html,/Compatible V1 à V26/);
});

test('V142: aucun changement des clés, sauvegarde JSON ni garanties de restauration',async()=>{
 const [html,sw,tour]=await Promise.all(['sauvegardes.html','sw.js','tournee-complete.html'].map(read));
 assert.match(html,/a\.download='big-cthu-coffre-v26-'/);
 assert.match(html,/JSON\.stringify\(data,null,2\)/);
 assert.match(html,/for\(const key of changes\.keys\(\)\)before\.set\(key,localStorage\.getItem\(key\)\)/);
 assert.match(html,/for\(const key of applied\.reverse\(\)\)/);
 assert.match(html,/if\(!staged\|\|!\$\('consent'\)\.checked\)return/);
 assert.match(html,/Le fichier JSON n'est pas chiffré/);
 assert.match(sw,/big-cthu-public-v2-v142/);
 assert.match(sw,/'\.\/sauvegardes\.html'/);
 assert.doesNotMatch(tour,/restoreOptions/);
});

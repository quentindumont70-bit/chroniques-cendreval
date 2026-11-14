import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const read=name=>readFile(new URL('../big-cthu-beta/'+name,import.meta.url),'utf8');

test('V138: capture en un champ par défaut et options complémentaires à la demande',async()=>{
 const html=await read('capture.html');
 const formStart=html.indexOf('<form id="form">');
 const formEnd=html.indexOf('</form>',formStart);
 assert.ok(formStart>0&&formEnd>formStart);
 const form=html.slice(formStart,formEnd);
 assert.match(form,/<input id="title"[^>]+required/);
 assert.match(form,/<details class="capture-more" id="captureMore">/);
 assert.match(form,/<summary>Options facultatives/);
 assert.ok(form.indexOf('<details class="capture-more"')<form.indexOf('id="target"'));
 assert.ok(form.indexOf('id="notes"')<form.indexOf('</details>'));
 assert.match(form,/<option value="inbox">Boîte d'entrée<\/option>/);
 assert.doesNotMatch(form,/<details[^>]+open(?:\s|>)/);
 assert.match(html,/if\(save\(\[obj,\.\.\.items\]\)\)/);
});

test('V138: garder les destinations, l export via coffre et les règles de confidentialité',async()=>{
 const [html,sw,tournee]=await Promise.all(['capture.html','sw.js','tournee-complete.html'].map(read));
 for(const target of ['inbox','task','maison','agenda','nutrition','sport','musique','gaming']){
  assert.ok(html.includes('<option value="'+target+'">'),target);
 }
 assert.match(html,/const KEY='big-cthu-v2-inbox-v1'/);
 assert.match(html,/localStorage\.setItem\(KEY,JSON\.stringify\(next\)\)/);
 assert.match(html,/if\(x\.target!=='task'&&x\.target!=='agenda'\)return false/);
 assert.match(html,/Ne pas saisir de données patients/);
 assert.match(sw,/'\.\/capture\.html'/);
 assert.match(sw,/big-cthu-public-v2-v138/);
 assert.doesNotMatch(tournee,/capture-more|captureMore/);
});

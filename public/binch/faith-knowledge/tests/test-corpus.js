/* Run from repository root: node public/binch/faith-knowledge/tests/test-corpus.js */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const base=path.resolve(__dirname,'..');
const validator=require(path.join(base,'validator.js'));
const search=require(path.join(base,'search.js'));
const records=JSON.parse(fs.readFileSync(path.join(base,'data','core.json'),'utf8'));
assert.deepEqual(validator.check(records),{ok:true,errors:[],count:records.length},'seed corpus is valid');
assert.match(search.answer('sauvegarde GrimoireSync',records).recordId,/^system:grimoire_reload$/);
assert.match(search.answer('Faith addon',records).recordId,/^system:faith_ingame$/);
for(const query of ['talent farouche niveau 14','quel est le taux de drop de sulfuras ?','build druide 60','quel raid pour moi ?']){
 const result=search.answer(query,records);
 assert.equal(result.found,false,'cannot claim unsupported knowledge for '+query);
 assert.equal(result.citations.length,0);
}
const stale={...records[0],id:'system:stale',verification:'obsolete'};
assert.equal(search.answer('faith local', [stale]).found,false,'obsolete records are ignored');
const unconfirmed={...records[0],id:'system:unconfirmed',verification:'a_confirmer'};
assert.equal(search.answer('faith local',[unconfirmed]).found,false,'unconfirmed records are ignored');
const classic={...records[0],id:'system:classic',scope:'classic'};
assert.equal(search.answer('faith local',[classic]).found,false,'Classic claims are not Forever facts');
const duplicate=validator.check([...records,records[0]]);
assert.equal(duplicate.ok,false);
assert.ok(duplicate.errors.some(x=>x.includes('duplique')));
const insecure={...records[0],id:'system:insecure',sources:[{...records[0].sources[0],url:'http://example.org'}]};
assert.equal(validator.check([insecure]).ok,false,'requires HTTPS provenance');
console.log('Faith corpus: OK ('+records.length+' fiches, 10 assertions de base + scenarios)');

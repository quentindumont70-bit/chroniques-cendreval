/* Run: node public/binch/faith-knowledge/tests/test-catalog.js */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const api=require(path.join(root,'catalog.js'));
const validator=require(path.join(root,'validator.js'));
const read=relative=>JSON.parse(fs.readFileSync(path.join(root,relative),'utf8'));
const fetchMock=async url=>{
 const relative=String(url).replace(/^\.\/faith-knowledge\//,'');
 if(relative.includes('..'))throw Error('invalid path');
 return {ok:true,json:async()=>read(relative)};
};
(async()=>{
 assert.equal(api.validPath('data/core.json'),true);
 for(const candidate of ['../secrets.json','https://evil.test/data.json','data/../core.json','data/core.js','data/UPPER.json','/data/core.json'])assert.equal(api.validPath(candidate),false,candidate);
 const records=await api.load(fetchMock,validator);
 assert.ok(records.length>=3);
 assert.equal(records.every(x=>x.scope==='forever'&&x.verification==='verifie'),true);
 await assert.rejects(()=>api.load(async url=>url.endsWith('manifest.json')?{ok:true,json:async()=>({schemaVersion:1,datasets:['../outside.json']})}:fetchMock(url),validator),/Manifest/);
 await assert.rejects(()=>api.load(async url=>url.endsWith('manifest.json')?{ok:true,json:async()=>({schemaVersion:1,datasets:['data/core.json','data/core.json']})}:fetchMock(url),validator),/Manifest/);
 await assert.rejects(()=>api.load(async url=>url.endsWith('data/core.json')?{ok:true,json:async()=>[...records,...records]}:fetchMock(url),validator),/Corpus/);
 console.log('Faith catalog: OK, '+records.length+' sourced records');
})().catch(err=>{console.error(err);process.exitCode=1});

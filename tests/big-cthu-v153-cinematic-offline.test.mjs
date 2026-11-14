import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const read=name=>readFile(new URL('../big-cthu-beta/'+name,import.meta.url),'utf8');

test('V153: trois décors publics conservés hors ligne après un premier chargement',async()=>{
 const [sw,index,premium,organic,medical]=await Promise.all(
  ['sw.js','index.html','premium-cinema.html','organic-cinema.html','medical-ops-cinema.html'].map(read));
 const paths=['/photo-1649401691853-6ecfa00f044e','/photo-1523486230352-65ff5222cea4','/photo-1648565726114-cfb73eb46340'];
 for(const photo of paths){
  assert.ok(sw.includes(photo),photo);
  assert.ok(index.includes(photo),photo);
 }
 assert.ok(premium.includes(paths[0]));
 assert.ok(organic.includes(paths[1]));
 assert.ok(medical.includes(paths[2]));
 assert.match(sw,/PUBLIC_SCENERY_PHOTOS=new Set\(/);
 assert.match(sw,/url\.hostname==='images\.unsplash\.com'&&PUBLIC_SCENERY_PHOTOS\.has\(url\.pathname\)&&r\.destination==='image'/);
 assert.match(sw,/if\(gallery&&\(response\.ok\|\|response\.type==='opaque'\)\)/);
 assert.match(sw,/big-cthu-public-v2-v153/);
});

test('V153: cache ne collecte ni données personnelles ni domaines tiers arbitraires',async()=>{
 const sw=await read('sw.js');
 assert.match(sw,/if\(r\.method!=='GET'\)return/);
 assert.match(sw,/url\.hostname==='images\.unsplash\.com'/);
 assert.match(sw,/if\(url\.origin!==self\.location\.origin\)return/);
 assert.doesNotMatch(sw,/localStorage|indexedDB|patients|Topaze|tidel_/);
 const tour=await read('tournee-complete.html');
 assert.doesNotMatch(tour,/PUBLIC_SCENERY_PHOTOS|V153/);
});

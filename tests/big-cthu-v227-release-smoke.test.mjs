import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const read=name=>readFile(new URL('../big-cthu-beta/'+name,import.meta.url),'utf8');

test('V225: recherche groupée dans une seule frame sur navigateur compatible',async()=>{
 const pulse=await read('active-pulse.js');
 assert.match(pulse,/function scheduleSearchRender\(\)/);
 assert.match(pulse,/if\(searchFrame\)return/);
 assert.match(pulse,/requestAnimationFrame\(\(\)=>\{searchFrame=false;render\(\)\}\)/);
 assert.match(pulse,/if\(next===searchTerm\)return/);
 assert.doesNotMatch(pulse,/localStorage\.setItem|fetch\(|XMLHttpRequest|WebSocket/);
});

test('V226: cache public complet pour le parcours cockpit, actions, favoris et coffre',async()=>{
 const sw=await read('sw.js');
 assert.match(sw,/const CACHE='big-cthu-public-v2-v227'/);
 for(const asset of ['./index.html','./active-pulse.js','./action-favorites.js','./next-session.js','./sauvegardes.html','./cockpit-themes.css','./cockpit-themes.js','./cinema-upgrade.css','./cinema-nutrition.css','./cinema-musique.css','./cinema-maison.css']){
  assert.ok(sw.includes("'"+asset+"'"),asset+' absent du cache public');
 }
 assert.match(sw,/if\(r\.method!=='GET'\)return/);
 assert.match(sw,/if\(url\.origin!==self\.location\.origin\)return/);
 assert.doesNotMatch(sw,/localStorage|indexedDB|tidel_|Topaze/);
});

test('V227: trois univers CINEMA et sauvegarde V27 conservés sans import automatique',async()=>{
 const [theme,html,backup]=await Promise.all(['cockpit-themes.js','index.html','sauvegardes.html'].map(read));
 assert.match(theme,/premium:'Command Center Premium',organic:'Dark Organic Luxury',medical:'Futurist Medical Ops'/);
 assert.match(theme,/const KEY='big-cthu-cockpit-theme-v1'/);
 assert.match(html,/src="\.\/action-favorites\.js" defer><\/script><script src="\.\/active-pulse\.js" defer>/);
 assert.match(backup,/version:27,exportedAt/);
 assert.match(backup,/if\(data\.version>=27\)/);
 assert.match(backup,/stage\(ACTION_PINS,staged\.actionFavorites\)/);
 assert.match(backup,/Formats V1 à V27 acceptés/);
 assert.doesNotMatch(backup,/autoImportTournee|syncTourneePatients/);
});

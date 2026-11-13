import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';

const source=()=>readFile(new URL('../big-cthu-beta/tournee-complete.html',import.meta.url),'utf8');
async function fixture(){
 const html=await source();
 const begin=html.indexOf("ap('ap-more').addEventListener('click',()=>{");
 const end=html.indexOf('function absenceTodayLocal(){',begin);
 assert.ok(begin>=0&&end>begin,'iPhone navigation callbacks exist');
 const actions=new Map(),scrolls=[],focuses=[];
 const host={children:Array.from({length:50},(_,i)=>({id:'synthetic-'+i}))};
 const controls={
  'ap-more':{addEventListener:(kind,cb)=>actions.set('more:'+kind,cb)},
  'ap-jump-filters':{addEventListener:(kind,cb)=>actions.set('jump:'+kind,cb)},
  'ap-events':host,
  'ap-shortcuts':{scrollIntoView:opts=>scrolls.push({target:'filters',options:opts})},
  'ap-today':{focus:opts=>focuses.push(opts)}
 };
 const ctx={
  Math,ap:id=>controls[id],ABSENCE_PAGE_SIZE:50,
  absenceVisible:50,
  absenceRender:()=>{
   host.children=Array.from({length:ctx.absenceVisible},(_,i)=>({
    id:'synthetic-'+i,
    scrollIntoView:opts=>scrolls.push({target:'synthetic-'+i,options:opts})
   }));
  }
 };
 runInNewContext(html.slice(begin,end)+'\nthis.page=()=>absenceVisible;',ctx,{timeout:1000});
 return {html,actions,scrolls,focuses,ctx};
}

test('V108: après Afficher 50 autres, Safari remonte au premier nouveau résultat plutôt que perdre la position',async()=>{
 const f=await fixture();
 f.actions.get('more:click')();
 assert.equal(f.ctx.page(),100);
 assert.equal(f.scrolls.length,1);
 assert.equal(f.scrolls[0].target,'synthetic-50');
 assert.equal(f.scrolls[0].options.block,'start');
 f.actions.get('more:click')();
 assert.equal(f.ctx.page(),150);
 assert.equal(f.scrolls[1].target,'synthetic-100');
});

test('V108: pagination plafonnée à 500, sans écriture ni requête réseau',async()=>{
 const f=await fixture();
 for(let i=0;i<15;i++)f.actions.get('more:click')();
 assert.equal(f.ctx.page(),500);
 const code=f.html.slice(f.html.indexOf("ap('ap-more').addEventListener"),f.html.indexOf('function absenceTodayLocal(){'));
 assert.doesNotMatch(code,/fetch\(|XMLHttpRequest|localStorage|TOUR_STORE|indexedDB/);
});

test('V108: bouton Retour aux filtres fonctionne au tactile et donne le focus sans ouvrir la recherche',async()=>{
 const f=await fixture();
 f.actions.get('jump:click')();
 assert.equal(f.scrolls[0].target,'filters');
 assert.equal(f.scrolls[0].options.block,'start');
 assert.equal(f.focuses.length,1);
 assert.equal(f.focuses[0].preventScroll,true);
 assert.match(f.html,/id="ap-jump-filters" aria-label="Remonter aux filtres du journal"/);
 assert.match(f.html,/id="ap-shortcuts" role="group"/);
});

test('V108: nouvelle ergonomie ne change ni le verrouillage ni les données de Tournée',async()=>{
 const html=await source();
 assert.match(html,/id="tour-security-gate" hidden/);
 assert.match(html,/const ABSENCE_PAGE_SIZE=50/);
 assert.match(html,/const rows=absenceRead\(\);if\(!rows\)return/);
 assert.match(html,/window\.addEventListener\('pageshow',resumeTournee\)/);
});

import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';

const read=()=>readFile(new URL('../big-cthu-beta/tournee-complete.html',import.meta.url),'utf8');
async function fixture(){
 const html=await read();
 const start=html.indexOf('const ABSENCE_PAGE_SIZE=50;');
 const end=html.indexOf('function absenceRender(){',start);
 assert.ok(start>0&&end>start);
 const ctx={Math,Array};
 runInNewContext(html.slice(start,end)+'\nthis.page=absenceVisiblePage;this.limit=ABSENCE_PAGE_SIZE;',ctx,{timeout:1000});
 return {html,ctx};
}

test('V102: limite le rendu initial à 50 dossiers fictifs sur 500, sans perte ni mutation',async()=>{
 const {ctx}=await fixture();
 const original=Array.from({length:500},(_,i)=>({id:'fiction-'+String(i).padStart(3,'0')}));
 const first=ctx.page(original,ctx.limit);
 assert.equal(first.length,50);
 assert.equal(first[0].id,'fiction-000');
 assert.equal(first[49].id,'fiction-049');
 const more=ctx.page(original,100);
 assert.equal(more.length,100);
 assert.equal(more[99].id,'fiction-099');
 const all=ctx.page(original,500);
 assert.equal(all.length,500);
 assert.equal(original.length,500);
 assert.deepEqual(JSON.parse(JSON.stringify(all)),original);
});

test('V102: les limites négatives, extrêmes ou trop hautes ne créent jamais de rendu infini',async()=>{
 const {ctx}=await fixture();
 const rows=Array.from({length:750},(_,i)=>i);
 assert.equal(ctx.page(rows,-20).length,0);
 assert.equal(ctx.page(rows,1).length,1);
 assert.equal(ctx.page(rows,600).length,500);
 assert.equal(ctx.page(rows,Number.POSITIVE_INFINITY).length,500);
});

test('V102: recherche et filtres repartent à 50 sans écriture de donnée patient',async()=>{
 const {html}=await fixture();
 assert.match(html,/id="ap-more" hidden>Afficher 50 autres signalements/);
 assert.match(html,/const visible=absenceVisiblePage\(filtered,absenceVisible\)/);
 assert.match(html,/for\(const x of visible\)/);
 assert.match(html,/function absenceFiltersChanged\(\)\{absenceVisible=ABSENCE_PAGE_SIZE;absenceRender\(\)\}/);
 assert.match(html,/ap\('ap-search'\)\.addEventListener\('input',absenceFiltersChanged\)/);
 assert.match(html,/absenceVisible=Math\.min\(absenceVisible\+ABSENCE_PAGE_SIZE,500\)/);
 assert.match(html,/const next=ap\('ap-events'\)\.children\[previousCount\]/);
 const paginator=html.slice(html.indexOf('const ABSENCE_PAGE_SIZE=50;'),html.indexOf('function absenceRender(){'));
 assert.doesNotMatch(paginator,/fetch\(|XMLHttpRequest|localStorage|TOUR_STORE|indexedDB/);
});

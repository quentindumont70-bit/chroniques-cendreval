import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';
const read=()=>readFile(new URL('../big-cthu-beta/tournee-complete.html',import.meta.url),'utf8');
async function fixture(){
 const html=await read();
 const begin=html.indexOf('function absenceTodayLocal(){');
 const end=html.indexOf('for(const [button,mode]',begin);
 assert.ok(begin>0&&end>begin);
 const elements=Object.fromEntries(['ap-from','ap-to','ap-filter-state','ap-filter-reason','ap-search','ap-sort','ap-filter-cancelled'].map(id=>[id,{value:'ancienne valeur'}]));
 let renders=0,activities=0;
 const ctx={
  Date,
  ap:id=>elements[id],
  absenceQuickRange:(today,mode)=>mode==='review'?{from:'',to:''}:{from:today,to:today},
  absenceRender:()=>{renders++},
  noteTourActivity:()=>{activities++}
 };
 runInNewContext(html.slice(begin,end)+'\nthis.quickSet=absenceSetQuickRange;',ctx,{timeout:1000});
 return {ctx,elements,renders:()=>renders,activities:()=>activities,html};
}
test('V100: raccourci À rapprocher réinitialise dates, recherche et exclusions sans modifier les soins',async()=>{
 const f=await fixture();
 f.ctx.quickSet('review');
 assert.equal(f.elements['ap-from'].value,'');
 assert.equal(f.elements['ap-to'].value,'');
 assert.equal(f.elements['ap-filter-state'].value,'À rapprocher');
 assert.equal(f.elements['ap-filter-reason'].value,'');
 assert.equal(f.elements['ap-search'].value,'');
 assert.equal(f.elements['ap-sort'].value,'newest');
 assert.equal(f.elements['ap-filter-cancelled'].value,'active');
 assert.equal(f.renders(),1);
 assert.equal(f.activities(),1);
});
test('V100: effacement des filtres revient aux signalements actifs ordinaires',async()=>{
 const f=await fixture();
 f.ctx.quickSet('review');
 f.ctx.quickSet('clear');
 assert.equal(f.elements['ap-filter-state'].value,'');
 assert.equal(f.elements['ap-filter-cancelled'].value,'active');
 assert.equal(f.renders(),2);
});
test('V100: badge en lecture seule et aucun transfert patient/Topaze',async()=>{
 const f=await fixture();
 assert.match(f.html,/id="ap-review">À rapprocher \(0\)<\/button>/);
 assert.match(f.html,/ap\('ap-review'\)\.textContent='À rapprocher \('\+absenceSummary\(rows\)\.toReview/);
 assert.match(f.html,/Aucun signalement pour ces filtres/);
 assert.match(f.html,/\['ap-review','review'\]/);
 const js=f.html.slice(f.html.indexOf('function absenceTodayLocal(){'),f.html.indexOf('for(const [button,mode]'));
 assert.doesNotMatch(js,/fetch\(|localStorage|TOUR_STORE|XMLHttpRequest|topaze\.fr/);
});

/* Faith Knowledge: offline, deterministic, citation-first retrieval. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;root.BinchFaithKnowledge=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){'use strict';
const normalize=v=>String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const tokens=v=>normalize(v).split(' ').filter(w=>w.length>2&& !['avec','dans','pour','quel','quelle','comment','faire','avoir','sont','est','les','des','une','sur','plus','mon','mes','qui'].includes(w));
function rank(query,records,opts={}){
 const q=tokens(query);if(!q.length||!Array.isArray(records))return [];
 const results=[];
 for(const r of records){
  if(!r||r.verification!=='verifie'||r.scope!=='forever')continue;
  if(opts.topic&&r.topic!==opts.topic)continue;
  if(opts.class&&r.class&&normalize(opts.class)!==normalize(r.class))continue;
  if(opts.level&&((r.levelMin&&opts.level<r.levelMin)||(r.levelMax&&opts.level>r.levelMax)))continue;
  const title=normalize(r.title),tags=normalize((r.tags||[]).join(' ')),body=normalize(r.summary);
  let score=0;for(const term of q){if(title.includes(term))score+=5;if(tags.includes(term))score+=4;if(body.includes(term))score+=1}
  if(score>0)results.push({record:r,score});
 }
 return results.sort((a,b)=>b.score-a.score||a.record.id.localeCompare(b.record.id)).slice(0,Math.min(8,Math.max(1,opts.limit||3)));
}
function answer(query,records,opts={}){
 const found=rank(query,records,opts);
 if(!found.length)return {found:false,text:"Je n'ai aucune fiche Forever verifiee correspondant a cette question. Je prefere dire que je ne sais pas plutot que d'inventer.",citations:[]};
 const best=found[0].record;
 return {found:true,text:best.summary,recordId:best.id,citations:best.sources.map(s=>({url:s.url,label:s.label,checkedAt:s.checkedAt})),updatedAt:best.updatedAt,more:found.slice(1).map(x=>x.record.id)};
}
return {rank,answer,normalize};
});

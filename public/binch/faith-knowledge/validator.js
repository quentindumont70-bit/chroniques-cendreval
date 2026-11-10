/* Faith corpus validator — no dependencies. Works in node and browser. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;root.BinchFaithKnowledgeValidator=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){'use strict';
const TOPICS=new Set(['talent','build','quest','boss','item','profession','system']),SCOPES=new Set(['forever','classic','unknown']),STATES=new Set(['verifie','a_confirmer','obsolete']);
const DAY=/^\d{4}-\d{2}-\d{2}$/;
const validDay=s=>typeof s==='string'&&DAY.test(s)&&Number.isFinite(Date.parse(s+'T00:00:00Z'))&&new Date(s+'T00:00:00Z').toISOString().slice(0,10)===s;
function check(records){
 const errors=[],ids=new Set();if(!Array.isArray(records))return {ok:false,errors:['Corpus: tableau attendu'],count:0};
 if(records.length>10000)errors.push('Corpus: trop de fiches (max 10000)');
 for(let i=0;i<records.length;i++){const r=records[i],p='fiche '+(i+1);
  if(!r||typeof r!=='object'||Array.isArray(r)){errors.push(p+': objet attendu');continue}
  if(typeof r.id!=='string'||! /^[a-z]+:[a-z0-9][a-z0-9_-]{2,90}$/.test(r.id))errors.push(p+': id invalide');
  else if(ids.has(r.id))errors.push(p+': id duplique '+r.id);else ids.add(r.id);
  if(!TOPICS.has(r.topic))errors.push(p+': topic invalide');
  if(typeof r.title!=='string'||r.title.trim().length<3||r.title.length>120)errors.push(p+': title invalide');
  if(typeof r.summary!=='string'||r.summary.trim().length<10||r.summary.length>1200)errors.push(p+': summary invalide');
  if(!SCOPES.has(r.scope)||!STATES.has(r.verification))errors.push(p+': scope/verification invalide');
  if(!validDay(r.updatedAt))errors.push(p+': updatedAt invalide');
  if(!Array.isArray(r.tags)||r.tags.length<1||r.tags.length>20||r.tags.some(t=>typeof t!=='string'||!t.trim()||t.length>50)||new Set(r.tags).size!==r.tags.length)errors.push(p+': tags invalides');
  if(!Array.isArray(r.sources)||r.sources.length<1||r.sources.length>6)errors.push(p+': sources manquantes');
  else for(const [j,s] of r.sources.entries()){
   let url;try{url=new URL(s&&s.url)}catch{url=null}
   if(!url||url.protocol!=='https:'||!url.hostname||url.username||url.password||!s||typeof s.label!=='string'||s.label.length<3||!validDay(s.checkedAt))errors.push(p+': source '+(j+1)+' invalide');
  }
  if(r.levelMin!=null&&(!Number.isInteger(r.levelMin)||r.levelMin<1||r.levelMin>80))errors.push(p+': levelMin invalide');
  if(r.levelMax!=null&&(!Number.isInteger(r.levelMax)||r.levelMax<1||r.levelMax>80||(Number.isInteger(r.levelMin)&&r.levelMax<r.levelMin)))errors.push(p+': levelMax invalide');
  if(r.scope==='classic'&&r.verification==='verifie')errors.push(p+': Classic ne peut pas etre verifie Forever par defaut');
 }
 return {ok:errors.length===0,errors,count:records.length};
}
return {check};
});

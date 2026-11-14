/* V128 — résumé Maison en lecture seule : une vue, zéro nouvelle base. */
(function(){
'use strict';
const SOURCES=[
 {key:'big-cthu-v2-maison-v1',kind:'Travaux',url:'./maison.html',label:'Chantier',date:'due',name:'name',skipDone:true},
 {key:'big-cthu-v2-maintenance-v1',kind:'Entretien',url:'./entretiens.html',label:'Entretien',date:'next',name:'title'},
 {key:'big-cthu-v2-equipments-v1',kind:'Équipement',url:'./equipements.html',label:'Équipement',date:'maintenance',name:'name'}
];
const $=id=>document.getElementById(id);
function localDay(date){
 const d=date instanceof Date?date:new Date(date);
 return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
}
function dateValid(x){return typeof x==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(x)&&!Number.isNaN(Date.parse(x+'T12:00:00Z'))}
function collect(today){
 const upcoming=new Date(today+'T12:00:00Z');
 upcoming.setUTCDate(upcoming.getUTCDate()+30);
 const end=upcoming.toISOString().slice(0,10);
 const entries=[];
 let warnings=0;
 for(const source of SOURCES){
  let rows;
  try{
   const raw=localStorage.getItem(source.key);
   if(raw===null)continue;
   rows=JSON.parse(raw);
   if(!Array.isArray(rows))throw Error('unexpected data shape');
  }catch(e){warnings++;continue}
  for(const x of rows.slice(0,2000)){
   if(!x||typeof x!=='object')continue;
   if(source.skipDone&&x.status==='done')continue;
   const day=x[source.date],name=x[source.name];
   if(!dateValid(day)||typeof name!=='string'||!name.trim()||name.length>150||day>end)continue;
   entries.push({name,day,kind:source.kind,url:source.url,late:day<today});
  }
 }
 entries.sort((a,b)=>a.day.localeCompare(b.day)||a.kind.localeCompare(b.kind));
 return {entries:entries.slice(0,8),total:entries.length,warnings};
}
function node(tag,cls,text){
 const n=document.createElement(tag);
 if(cls)n.className=cls;
 if(text!==undefined)n.textContent=text;
 return n;
}
function render(){
 const host=$('maisonPulseList');
 if(!host)return;
 host.replaceChildren();
 const today=localDay(new Date()),data=collect(today);
 const panel=$('maisonPulse');
 if(panel)panel.dataset.hasItems=data.warnings?'unknown':data.total?'true':'false';
 const count=$('maisonPulseCount');
 if(count)count.textContent=data.total+' échéance(s) à suivre';
 if(!data.entries.length)host.append(node('p','muted','Aucune échéance de travaux ou d’entretien dans les 30 prochains jours.'));
 for(const item of data.entries){
  const row=node('a','maison-pulse-item');
  row.href=item.url;
  const title=node('strong','',item.name);
  const meta=node('span','',item.kind+' · '+item.day+(item.late?' · À traiter':''));
  row.append(title,meta);
  if(item.late)row.classList.add('is-late');
  host.append(row);
 }
 if(data.total>data.entries.length)host.append(node('p','muted','+'+(data.total-data.entries.length)+' autres échéances dans les modules Maison.'));
 const warning=$('maisonPulseStatus');
 if(warning)warning.textContent=data.warnings?'Certaines données locales sont illisibles. Aucun élément n’a été modifié.':data.total?'Lecture seule depuis les modules Maison de cet appareil.':'Aucune échéance dans les 30 prochains jours.';
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',render,{once:true});else render();
window.addEventListener('pageshow',render);
window.addEventListener('storage',event=>{if(SOURCES.some(s=>s.key===event.key))render()});
})();
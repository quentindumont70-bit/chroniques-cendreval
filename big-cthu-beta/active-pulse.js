/* V131 — actions vraiment utiles, lecture locale des modules existants, sans duplication. */
(function(){
'use strict';
const SOURCES=[
 {key:'big-cthu-v2-pantry-v1',kind:'Stock',url:'./garde-manger.html',limit:2},
 {key:'big-cthu-v2-agenda-v1',kind:'Agenda',url:'./agenda.html',limit:2},
 {key:'big-cthu-v2-inbox-v1',kind:'Captures',url:'./capture.html',limit:2},
 {key:'big-cthu-v2-demo-tasks',kind:'Priorités',url:'#priorities',limit:2},
 {key:'big-cthu-v2-maison-v1',kind:'Maison',url:'./maison.html',limit:2},
 {key:'big-cthu-v2-passions-v1',kind:'Musique',url:'./musique.html',limit:2},
 {key:'big-cthu-v2-next-session-v1',kind:'Jeux',url:'#nextSession',limit:2}
];
const $=id=>document.getElementById(id);
function validDate(day){return typeof day==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(day)&&!Number.isNaN(Date.parse(day+'T12:00:00Z'))&&new Date(day+'T12:00:00Z').toISOString().slice(0,10)===day}
function read(key){
 try{
  const raw=localStorage.getItem(key);
  if(raw===null)return {rows:[],bad:false};
  const rows=JSON.parse(raw);
  if(!Array.isArray(rows)||rows.length>3000)throw Error('unexpected list');
  return {rows,bad:false};
 }catch(e){return {rows:[],bad:true}}
}
function collect(){
 const now=new Date();
 const today=[now.getFullYear(),String(now.getMonth()+1).padStart(2,'0'),String(now.getDate()).padStart(2,'0')].join('-');
 const end=new Date(now);end.setDate(end.getDate()+7);
 const stop=[end.getFullYear(),String(end.getMonth()+1).padStart(2,'0'),String(end.getDate()).padStart(2,'0')].join('-');
 const results=[];
 let warnings=0,total=0;
 for(const source of SOURCES){
  const {rows,bad}=read(source.key);
  if(bad){warnings++;continue}
  let selected=[];
  if(source.kind==='Stock')selected=rows.filter(x=>x&&typeof x.name==='string'&&x.name.trim()&&x.name.length<=90&&validDate(x.date)&&x.date<=stop&&['DLC','DDM'].includes(x.kind)).sort((a,b)=>(a.kind==='DLC'?0:1)-(b.kind==='DLC'?0:1)||a.date.localeCompare(b.date)).map(x=>({title:x.name,next:x.kind+' · '+(x.date<today?(x.kind==='DLC'?'Date limite dépassée : ':'DDM dépassée, qualité à vérifier : '):'Échéance : ')+x.date}));
  if(source.kind==='Agenda')selected=rows.filter(x=>x&&typeof x.title==='string'&&x.title.trim()&&x.title.length<=120&&validDate(x.date)&&x.date>=today&&x.date<=stop&&(!x.time||/^([01]\d|2[0-3]):[0-5]\d$/.test(x.time))).sort((a,b)=>(a.date+' '+(a.time||'00:00')).localeCompare(b.date+' '+(b.time||'00:00'))).map(x=>({title:x.title,next:'Le '+x.date+(x.time?' · '+x.time:'')}));
  if(source.kind==='Captures')selected=rows.filter(x=>x&&x.status==='new'&&typeof x.title==='string'&&x.title.trim()&&x.title.length<=140).map(x=>({title:x.title,next:x.target==='agenda'?'À envoyer vers Agenda':x.target==='task'?'À envoyer vers Priorités':'À traiter dans Capture'}));
  if(source.kind==='Priorités')selected=rows.filter(x=>x&&typeof x.text==='string'&&x.text.trim()&&x.text.length<=160&&!x.done).map(x=>({title:x.text,next:''}));
  if(source.kind==='Maison')selected=rows.filter(x=>x&&typeof x.name==='string'&&x.name.trim()&&x.name.length<=120&&['todo','doing'].includes(x.status)).sort((a,b)=>(a.status==='doing'?0:1)-(b.status==='doing'?0:1)).map(x=>({title:x.name,next:typeof x.notes==='string'?x.notes.slice(0,120):''}));
  if(source.kind==='Musique')selected=rows.filter(x=>x&&x.mode==='musique'&&['active','planned'].includes(x.status)&&typeof x.title==='string'&&x.title.trim()&&x.title.length<=140).sort((a,b)=>String(b.date||'').localeCompare(String(a.date||''))).map(x=>({title:x.title,next:typeof x.note==='string'?x.note.slice(0,120):''}));
  if(source.kind==='Jeux')selected=rows.filter(x=>x&&x.done===false&&typeof x.game==='string'&&x.game.length<=60&&typeof x.text==='string'&&x.text.trim()&&x.text.length<=180).map(x=>({title:x.game,next:x.text}));
  total+=selected.length;
  for(const item of selected.slice(0,source.limit))results.push({...item,kind:source.kind,url:source.url});
 }
 return {items:results,warnings,total};
}
function node(tag,text,className){
 const x=document.createElement(tag);
 x.textContent=text;
 if(className)x.className=className;
 return x;
}
function render(){
 const root=$('activePulseList');if(!root)return;
 const {items,warnings,total}=collect();
 root.replaceChildren();
 const count=$('activePulseCount');if(count)count.textContent=total===items.length?total+' actions retrouvées':total+' actions · '+items.length+' affichées';
 const heroCount=$('cinemaPulseCount');if(heroCount)heroCount.textContent=total===0?(warnings?'Certaines actions indisponibles':'Aucune action en attente'):total+' action'+(total>1?'s':'')+' à reprendre';
 if(!items.length)root.append(node('p',warnings?'Certaines données sont illisibles : impossible de garantir que tout est à jour.':'Aucune action en attente dans tes modules locaux. Tu peux simplement continuer ta journée.','muted'));
 for(const item of items){
  const link=node('a','','active-pulse-item');
  link.href=item.url;
  link.append(node('small',item.kind),node('strong',item.title));
  if(item.next)link.append(node('span',item.next,'active-pulse-next'));
  root.append(link);
 }
 const status=$('activePulseStatus');
 if(status)status.textContent=warnings?'Certaines données locales sont illisibles ; aucune n’a été modifiée.':'Rappels lus localement, sans copie ni synchronisation.';
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',render,{once:true});else render();
window.addEventListener('pageshow',render);
window.addEventListener('focus',render);
document.addEventListener('bigcthu:changes',render);
window.addEventListener('storage',e=>{if(SOURCES.some(s=>s.key===e.key))render()});
})();
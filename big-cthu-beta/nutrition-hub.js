/* V129 — bilan cuisine transversal, sans écriture ni serveur. */
(function(){
'use strict';
const SOURCES={
 pantry:'big-cthu-v2-pantry-v1',
 recipes:'big-cthu-v2-recipes-v1',
 meals:'big-cthu-v2-meals-v1'
};
function dateOK(day){return typeof day==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(day)&&!Number.isNaN(Date.parse(day+'T12:00:00Z'))&&new Date(day+'T12:00:00Z').toISOString().slice(0,10)===day}
function dayLocal(date){const d=date instanceof Date?date:new Date(date);return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-')}
function read(key){
 try{
  const raw=localStorage.getItem(key);
  if(raw===null)return {rows:[],bad:false};
  const rows=JSON.parse(raw);
  if(!Array.isArray(rows)||rows.length>5000)throw Error('Invalid saved list');
  return {rows,bad:false};
 }catch(e){return {rows:[],bad:true}}
}
function snapshot(today){
 const data=Object.fromEntries(Object.entries(SOURCES).map(([kind,key])=>[kind,read(key)]));
 const until=new Date(today+'T12:00:00Z');until.setUTCDate(until.getUTCDate()+7);
 const end=until.toISOString().slice(0,10);
 const pantry=data.pantry.rows.filter(x=>x&&typeof x.name==='string'&&x.name.length<=90);
 const attention=pantry.filter(x=>dateOK(x.date)&&x.date<=end&&['DLC','DDM'].includes(x.kind)).sort((a,b)=>(a.kind==='DLC'?0:1)-(b.kind==='DLC'?0:1)||a.date.localeCompare(b.date));
 const recipes=data.recipes.rows.filter(x=>x&&typeof x.title==='string'&&x.title.length<=120);
 const meals=data.meals.rows.filter(x=>x&&typeof x.recipe==='string'&&x.recipe.length<=140&&x.status==='Prévu'&&dateOK(x.date)&&x.date>=today&&x.date<=end);
 return {stock:pantry.length,recipes:recipes.length,meals:meals.length,attention:attention.slice(0,6),hidden:Math.max(0,attention.length-6),warnings:Object.values(data).filter(x=>x.bad).length};
}
function node(tag,text,cls){
 const el=document.createElement(tag);
 el.textContent=text;
 if(cls)el.className=cls;
 return el;
}
function render(){
 const root=document.getElementById('nh-attention-list');
 if(!root)return;
 const now=dayLocal(new Date());
 const data=snapshot(now);
 const attentionPanel=document.getElementById('nutritionAttention');
 if(attentionPanel)attentionPanel.dataset.hasAlerts=data.attention.length?'true':data.warnings?'unknown':'false';
 for(const [id,value]of [['nh-stock-count',data.stock],['nh-recipes-count',data.recipes],['nh-meals-count',data.meals]]){
  const target=document.getElementById(id);if(target)target.textContent=String(value);
 }
 root.replaceChildren();
 if(!data.attention.length)root.append(node('p','Aucune date proche enregistrée dans le stock local.','muted'));
 for(const row of data.attention){
  const link=node('a','','attention-item');
  link.href='./garde-manger.html';
  const name=node('strong',row.name);
  const label=node('small',row.kind+' · '+row.date+(row.date<now?(row.kind==='DLC'?' · limite de consommation dépassée':' · durabilité minimale dépassée, qualité à vérifier'):''));
  link.append(name,label);
  if(row.date<now)link.classList.add('is-past');
  root.append(link);
 }
 if(data.hidden)root.append(node('p','+'+data.hidden+' autres produits à consulter dans le garde-manger.','muted'));
 const status=document.getElementById('nh-status');
 if(status)status.textContent=data.warnings?'Certaines données locales sont illisibles : aucune n’a été remplacée.':'Bilan établi localement, sans modifier les modules source.';
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',render,{once:true});else render();
window.addEventListener('pageshow',render);
window.addEventListener('storage',event=>{if(Object.values(SOURCES).includes(event.key))render()});
})();
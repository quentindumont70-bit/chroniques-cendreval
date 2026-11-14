/* V130 : Studio orienté prochaine action. Réutilise le journal Passions, sans nouvelle base. */
(function(){
'use strict';
const KEY='big-cthu-v2-passions-v1',LIMIT=1500;
const MODES=['nutrition','muscu','escalade','musique','gaming'];
const STATUS=['planned','active','done'];
const $=id=>document.getElementById(id);
const valid=x=>!!x&&typeof x.id==='string'&&x.id.length>0&&x.id.length<=120&&
 MODES.includes(x.mode)&&typeof x.title==='string'&&x.title.trim().length>0&&x.title.length<=140&&
 typeof x.date==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(x.date)&&
 typeof x.metric==='string'&&x.metric.length<=60&&
 typeof x.note==='string'&&x.note.length<=1200&&STATUS.includes(x.status);
let blocked=false,rows=[];
function read(){
 try{
  const raw=localStorage.getItem(KEY);
  if(raw===null)return [];
  const data=JSON.parse(raw);
  if(!Array.isArray(data)||data.length>LIMIT||!data.every(valid)||
   new Set(data.map(x=>x.id)).size!==data.length)throw Error('Invalid existing passions');
  return data;
 }catch(e){blocked=true;notice('Atelier existant illisible ou stockage indisponible : aucune modification autorisée.',true);return null}
}
function notice(message,error=false){
 const el=$('studio-status');if(el){el.textContent=message;el.dataset.error=error?'true':'false'}
}
function persist(next){
 if(blocked){notice('Données protégées : aucune modification enregistrée.',true);return false}
 try{
  const json=JSON.stringify(next);
  localStorage.setItem(KEY,json);
  if(localStorage.getItem(KEY)!==json)throw Error('Write not confirmed');
  rows=next;notice('Enregistré localement dans ton atelier.');
  return true;
 }catch(e){notice('Sauvegarde indisponible : conserve cette page et vérifie ton stockage.',true);return false}
}
function currentData(){
 const loaded=read();
 if(loaded===null)return null;
 return loaded;
}
function today(){
 const d=new Date();
 return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
}
function element(tag,css,text){
 const x=document.createElement(tag);if(css)x.className=css;
 if(text!==undefined)x.textContent=text;return x;
}
function render(){
 const host=$('studio-list');if(!host)return;
 host.replaceChildren();
 const current=rows.filter(x=>x.mode==='musique'&&x.status!=='done')
  .sort((a,b)=>b.date.localeCompare(a.date));
 const count=$('studio-count');if(count)count.textContent=current.length+' piste(s) à reprendre';
 if(!current.length){host.append(element('p','muted','Aucun projet en cours : une idée suffit pour commencer.'));return}
 for(const item of current.slice(0,20)){
  const card=element('article','project'),name=element('strong','',item.title),date=element('small','',item.date+' · '+(item.status==='active'?'En cours':'À démarrer'));
  card.append(name,date);
  if(item.note)card.append(element('p','',item.note));
  const actions=element('div','project-actions');
  const done=element('button','','✓ Terminé');done.type='button';
  done.setAttribute('aria-label','Terminer le projet '+item.title);
  done.addEventListener('click',()=>{
   if(!confirm('Marquer « '+item.title+' » comme terminé ?'))return;
   const loaded=currentData();if(!loaded)return;
   const target=loaded.find(x=>x.id===item.id&&x.mode==='musique');
   if(!target||target.status==='done'){rows=loaded;render();notice('Projet déjà modifié ailleurs : liste actualisée.',true);return}
   if(persist(loaded.map(x=>x.id===item.id?{...x,status:'done'}:x)))render();
  });
  const edit=element('button','','Modifier la prochaine action');edit.type='button';
  edit.setAttribute('aria-label','Modifier la prochaine action de '+item.title);
  edit.addEventListener('click',()=>{
   if(card.querySelector('.studio-edit'))return;
   const form=element('form','studio-edit');
   const label=element('label','','Prochaine action pour '+item.title);
   const input=element('textarea','studio-edit-input');
   input.maxLength=1200;input.required=true;input.value=item.note||'';
   label.append(input);form.append(label);
   const controls=element('div','project-actions');
   const save=element('button','','Enregistrer');save.type='submit';
   const cancel=element('button','','Annuler');cancel.type='button';
   cancel.addEventListener('click',()=>{form.remove();edit.focus()});
   controls.append(save,cancel);form.append(controls);
   form.addEventListener('submit',event=>{
    event.preventDefault();
    const note=input.value.trim();
    if(!note||note.length>1200){notice('Ajoute une prochaine action de 1200 caractères maximum.',true);return}
    const loaded=currentData();if(!loaded)return;
    const target=loaded.find(x=>x.id===item.id&&x.mode==='musique');
    if(!target||target.status==='done'){rows=loaded;render();notice('Ce projet a été modifié ailleurs ; liste actualisée.',true);return}
    const next=loaded.map(x=>x.id===item.id?{...x,note,date:today()}:x);
    if(persist(next))render();
   });
   card.append(form);input.focus();
  });
  const link=element('a','','Historique');link.href='./passions.html#musique';
  actions.append(done,edit,link);card.append(actions);host.append(card);
 }
 if(current.length>20)host.append(element('p','muted','+'+(current.length-20)+' projets dans l’atelier complet.'));
}
function setup(){
 const form=$('studio-form');if(!form)return;
 const initial=read();if(initial!==null)rows=initial;
 render();
 form.addEventListener('submit',event=>{
  event.preventDefault();
  if(blocked){notice('Sauvegarde bloquée pour protéger tes entrées existantes.',true);return}
  const title=$('studio-title').value.trim(),next=$('studio-next').value.trim();
  if(!title||!next||title.length>140||next.length>1200)return;
  const loaded=currentData();if(!loaded)return;
  if(loaded.length>=LIMIT){notice('Atelier plein : 1500 entrées maximum.',true);return}
  const item={id:'studio-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,12),mode:'musique',title,date:today(),metric:'',note:next,status:'active'};
  if(!valid(item)){notice('Projet invalide, aucune entrée ajoutée.',true);return}
  if(persist([...loaded,item])){$('studio-title').value='';$('studio-next').value='';render();$('studio-title').focus()}
 });
 window.addEventListener('storage',event=>{if(event.key===KEY){blocked=false;const loaded=read();if(loaded!==null)rows=loaded;render()}});
 window.addEventListener('pageshow',()=>{if(!blocked){const loaded=read();if(loaded!==null)rows=loaded;render()}});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup,{once:true});else setup();
})();
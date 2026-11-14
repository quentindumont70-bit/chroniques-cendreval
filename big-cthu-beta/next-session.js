/* Big Cthu V118 — next-session reminders, never a gaming calendar. */
(function(){
 'use strict';
 const KEY='big-cthu-v2-next-session-v1',MAX=100;
 const $=id=>document.getElementById(id);
 const valid=x=>!!x&&typeof x.id==='string'&&x.id.length>0&&x.id.length<=80&&
  typeof x.game==='string'&&x.game.trim().length>0&&x.game.length<=60&&
  typeof x.text==='string'&&x.text.trim().length>0&&x.text.length<=180&&typeof x.done==='boolean';
 let rows=[],locked=false;
 function show(message,error=false){
  const el=$('ns-status');if(el){el.textContent=message||'';el.dataset.error=error?'true':'false'}
 }
 function load(){
  try{
   const raw=localStorage.getItem(KEY);
   if(raw===null)return [];
   const value=JSON.parse(raw);
   if(!Array.isArray(value)||value.length>MAX||!value.every(valid)||new Set(value.map(x=>x.id)).size!==value.length)throw Error('invalid reminder data');
   return value;
  }catch(e){locked=true;show('Notes locales illisibles ou indisponibles : aucune écriture autorisée pour éviter de les écraser.',true);return []}
 }
 function save(next){
  if(locked){show('Sauvegarde indisponible. Aucune note n’a été remplacée.',true);return false}
  try{
   const data=JSON.stringify(next);
   localStorage.setItem(KEY,data);
   if(localStorage.getItem(KEY)!==data)throw Error('missing browser confirmation');
   rows=next;
   if(typeof document.dispatchEvent==='function'&&typeof Event==='function')document.dispatchEvent(new Event('bigcthu:changes'));
   show('Notes conservées sur cet appareil. Elles ne constituent pas un rendez-vous.');
   return true;
  }catch(e){show('Impossible d’enregistrer sur cet appareil : aucune modification confirmée.',true);return false}
 }
 function el(tag,cls,content){
  const node=document.createElement(tag);
  if(cls)node.className=cls;
  if(content!==undefined)node.textContent=content;
  return node;
 }
 function render(){
  const host=$('ns-list');if(!host)return;
  host.replaceChildren();
  const remaining=rows.filter(x=>!x.done).length;
  const counter=$('ns-count');if(counter)counter.textContent=remaining+' à retrouver';
  if(!rows.length){host.append(el('p','muted','Aucun rappel. Note simplement quoi reprendre quand l’envie de jouer revient.'));return}
  rows.forEach(item=>{
   const line=el('div','ns-item'+(item.done?' isdone':''));
   const left=el('div','ns-content');
   left.append(el('strong','ns-game-name',item.game),el('span','ns-note',item.text));
   const actions=el('div','ns-actions');
   const done=el('button','ns-done',item.done?'↶ À reprendre':'✓ Fait');
   done.type='button';done.setAttribute('aria-label',(item.done?'Remettre à faire : ':'Marquer fait : ')+item.text);
   done.addEventListener('click',()=>{
    const next=rows.map(x=>x.id===item.id?{...x,done:!x.done}:x);
    if(save(next))render();
   });
   const remove=el('button','ns-remove','Supprimer');
   remove.type='button';remove.setAttribute('aria-label','Supprimer : '+item.text);
   remove.addEventListener('click',()=>{
    if(!confirm('Supprimer définitivement ce rappel de prochaine session ?'))return;
    const next=rows.filter(x=>x.id!==item.id);
    if(save(next))render();
   });
   actions.append(done,remove);line.append(left,actions);host.append(line);
  });
 }
 function setup(){
  const form=$('ns-form');if(!form)return;
  rows=load();render();
  form.addEventListener('submit',event=>{
   event.preventDefault();
   const game=$('ns-game').value.trim(),text=$('ns-text').value.trim();
   if(!game||!text)return;
   if(game.length>60||text.length>180||rows.length>=MAX){show('Limite de 100 rappels, 60 caractères pour le jeu et 180 pour la note.',true);return}
   const id='session-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,10);
   const next=[{id,game,text,done:false},...rows];
   if(save(next)){$('ns-text').value='';render();$('ns-text').focus()}
  });
  window.addEventListener('storage',e=>{if(e.key===KEY){locked=false;rows=load();render()}});
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup,{once:true});
 else setup();
})();

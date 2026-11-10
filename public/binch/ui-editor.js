/* La Binch — UI editor V1: local layouts, magnetic grid and alignment guides.
   Strictly visual HTML editor; no game interaction or backend. */
(()=>{'use strict';
const KEY='binch.ui.editor.v1',PROFILES='binch.ui.profiles.v2',STEP=12,THRESHOLD=9,MIN_W=160,MIN_H=90;
const saved=()=>{try{return JSON.parse(localStorage.getItem(KEY))||{}}catch{return {}}};
const db=saved(),$=id=>document.getElementById(id);
function store(){try{localStorage.setItem(KEY,JSON.stringify(db))}catch{status('Stockage local indisponible : disposition non sauvegardée.')}}
let editing=false,handles=[],drag=null,frame=0,pending=null;
const undoStack=[],redoStack=[],MAX_HISTORY=30;
const snapshot=()=>JSON.stringify(cfg());
function commitHistory(before){if(!before||before===snapshot())return;undoStack.push(before);if(undoStack.length>MAX_HISTORY)undoStack.shift();redoStack.length=0;historyState()}
function historyState(){if($('binch-edit-undo'))$('binch-edit-undo').disabled=!undoStack.length;if($('binch-edit-redo'))$('binch-edit-redo').disabled=!redoStack.length}
function restoreHistory(from,to){if(!from.length)return;const previous=snapshot(),state=JSON.parse(from.pop());db[key()]=state;to.push(previous);store();setupTargets();historyState();status('Disposition restaurée.')}
const profileRead=()=>{try{const x=JSON.parse(localStorage.getItem(PROFILES));return x&&typeof x==='object'&&!Array.isArray(x)?x:{}}catch{return {}}};
const baseStyles=new WeakMap();
let magnet=localStorage.getItem('binch.ui.magnet.v1')!=='0';
function snap(n){return Math.round(n/STEP)*STEP}
function scope(){const page=document.querySelector('#app main .page.active');return page||document.querySelector('#page-hub.active')||null}
function pageKey(){return scope()?.id||'page-hub'}
function viewport(){return window.innerWidth<700?'mobile':window.innerWidth<1200?'tablet':'desktop'}
function key(){return pageKey()+'|'+viewport()}
function cfg(){return db[key()]||(db[key()]={})}
function profileList(){const select=$('binch-edit-profiles');if(!select)return;const names=Object.keys(profileRead()[key()]||{}).sort();select.replaceChildren(new Option('Profils sauvegardés',''),...names.map(n=>new Option(n,n)))}
function saveProfile(){const name=window.prompt('Nom du profil (max. 40 caractères) :')?.trim().slice(0,40);if(!name)return;const all=profileRead(),group=all[key()]||{};if(Object.keys(group).length>=12&&!group[name]){status('12 profils maximum pour cette page.');return}group[name]=JSON.parse(JSON.stringify(cfg()));all[key()]=group;try{localStorage.setItem(PROFILES,JSON.stringify(all));profileList();$('binch-edit-profiles').value=name;status('Profil « '+name+' » enregistré.')}catch{status('Stockage local indisponible.')}}
function loadProfile(){const name=$('binch-edit-profiles').value,source=profileRead()[key()]?.[name];if(!name||!source)return;const before=snapshot();db[key()]=JSON.parse(JSON.stringify(source));store();setupTargets();commitHistory(before);status('Profil « '+name+' » chargé.')}
function deleteProfile(){const name=$('binch-edit-profiles').value;if(!name||!window.confirm('Supprimer le profil « '+name+' » ?'))return;const all=profileRead();delete all[key()][name];localStorage.setItem(PROFILES,JSON.stringify(all));profileList();status('Profil supprimé.')}
function status(msg){const node=$('binch-edit-message');if(node)node.textContent=msg}
function exportLayout(){
 const body=JSON.stringify({format:'binch-ui-v3',page:pageKey(),viewport:viewport(),layout:cfg()},null,2);
 const a=document.createElement('a'),url=URL.createObjectURL(new Blob([body],{type:'application/json'}));
 a.href=url;a.download='binch-interface-'+pageKey()+'.json';a.click();
 setTimeout(()=>URL.revokeObjectURL(url),1000);status('Disposition exportée au format JSON.');
}
async function importLayout(event){
 const file=event.target.files?.[0];event.target.value='';if(!file)return;
 try{
  if(file.size>50000)throw Error('Fichier trop volumineux');
  const value=JSON.parse(await file.text());
  if(value?.format!=='binch-ui-v3'||value.page!==pageKey()||!value.layout||Array.isArray(value.layout)||typeof value.layout!=='object')throw Error('Format ou page incompatible');
  const entries=Object.entries(value.layout);
  if(entries.length>40||entries.some(([id,v])=>id.length>160||!v||typeof v!=='object'||Array.isArray(v)||['x','y','width','height'].some(k=>v[k]!=null&&(!Number.isFinite(v[k])||Math.abs(v[k])>10000))))throw Error('Dimensions invalides');
  const before=snapshot();db[key()]={};
  for(const [id,record] of entries){db[key()][id]={};for(const field of ['x','y','width','height'])if(Number.isFinite(record[field]))db[key()][id][field]=record[field]}
  store();setupTargets();commitHistory(before);status('Disposition importée sur cette page.');
 }catch(error){status('Import refusé : '+error.message)}
}
function targets(){
 const page=scope();if(!page)return [];
 const query=':scope > .panel,:scope > article,:scope > section,:scope > .binch-command,:scope > .binch-todo,:scope > .binch-play-today, #binch-command-deck > [data-command-widget], .binch-command-hero, .binch-command-layout, .binch-command-stats, .binch-command-pin-wrap, .binch-command-discoveries, .binch-command-questlog, .binch-command-progress, .binch-command-bottom, .binch-command-row, .binch-command-notes, .binch-command-row > .binch-command-card, .binch-command-bottom > .binch-command-card, .binch-command-stats > .binch-command-stat';
 let elements=[];
 try{elements=Array.from(page.querySelectorAll(query))}catch{}
 if(page.id==='page-command')elements=elements.filter(x=>x.closest('#binch-command-deck')||x.classList.contains('binch-command-hero')||x.classList.contains('binch-command-layout'));
 else{
  elements=elements.filter(x=>!elements.some(y=>y!==x&&y.contains(x)));
  if(elements.length<2){
   const candidates=Array.from(page.querySelectorAll('.panel,.card,article,section')).filter(x=>x.getBoundingClientRect().width>110&&x.getBoundingClientRect().height>55);
   elements=candidates.filter(x=>!candidates.some(y=>y!==x&&y.contains(x))).slice(0,24);
  }
 }
 return elements.filter(x=>{const r=x.getBoundingClientRect(),style=getComputedStyle(x);return r.width>110&&r.height>45&&style.display!=='none'&&style.visibility!=='hidden'}).slice(0,30);
}
function identity(el,i){return el.id?'#'+el.id:el.dataset.commandWidget?'widget:'+el.dataset.commandWidget:'block:'+i}
function applyTo(el,id,i){
 const item=cfg()[id]||{};
 if(!baseStyles.has(el))baseStyles.set(el,{width:el.style.width,maxWidth:el.style.maxWidth,boxSizing:el.style.boxSizing,height:el.style.height,minHeight:el.style.minHeight});
 el.dataset.binchEditorId=id;
 el.classList.add('binch-edit-target');
 el.style.setProperty('--binch-edit-x',(Number(item.x)||0)+'px');
 el.style.setProperty('--binch-edit-y',(Number(item.y)||0)+'px');
 if(Number(item.width)>0){el.style.width=Math.round(item.width)+'px';el.style.maxWidth='100%';el.style.boxSizing='border-box'}
 if(Number(item.height)>0){el.style.height=Math.round(item.height)+'px';el.style.minHeight='0';el.style.boxSizing='border-box'}
 el.dataset.binchEditName=el.getAttribute('aria-label')||el.querySelector('h2,h3')?.textContent?.trim().slice(0,65)||el.id||'Panneau '+(i+1);
}
function clearTransient(){
 document.querySelectorAll('.binch-edit-selected').forEach(n=>n.classList.remove('binch-edit-selected'));
 for(const node of handles)node.remove();handles=[];
 ['binch-edit-guide-x','binch-edit-guide-y'].forEach(id=>{const e=$(id);if(e)e.hidden=true});
}
function clearTargets(){document.querySelectorAll('.binch-edit-target').forEach(el=>{el.classList.remove('binch-edit-target','binch-edit-selected');delete el.dataset.binchEditorId;delete el.dataset.binchEditName;el.style.removeProperty('--binch-edit-x');el.style.removeProperty('--binch-edit-y');const base=baseStyles.get(el);if(base){el.style.width=base.width;el.style.maxWidth=base.maxWidth;el.style.boxSizing=base.boxSizing;el.style.height=base.height;el.style.minHeight=base.minHeight}else{el.style.removeProperty('width');el.style.removeProperty('max-width');el.style.removeProperty('box-sizing');el.style.removeProperty('height');el.style.removeProperty('min-height')}})}
function setupTargets(){
 clearTransient();clearTargets();
 const els=targets();
 els.forEach((el,i)=>applyTo(el,identity(el,i),i));
 $('binch-edit-count').textContent=els.length+' blocs modifiables · '+pageKey();
}
function select(el){
 clearTransient();el.classList.add('binch-edit-selected');const rect=el.getBoundingClientRect();
 const handle=document.createElement('button');handle.className='binch-edit-resize';handle.type='button';handle.title='Redimensionner ce panneau';handle.setAttribute('aria-label','Redimensionner '+(el.dataset.binchEditName||'ce panneau'));handle.textContent='◢';
 handle.style.left=(rect.right-16)+'px';handle.style.top=(rect.bottom-16)+'px';document.body.append(handle);handles.push(handle);
 const label=document.createElement('div');label.className='binch-edit-label';label.textContent=el.dataset.binchEditName||'Panneau';label.style.left=Math.max(10,rect.left)+'px';label.style.top=Math.max(4,rect.top-26)+'px';document.body.append(label);handles.push(label);
 handle.addEventListener('pointerdown',e=>begin(e,el,'resize'));
}
function updateHandles(){
 const el=document.querySelector('.binch-edit-selected');if(!el||handles.length<2)return;
 const r=el.getBoundingClientRect();handles[0].style.left=(r.right-16)+'px';handles[0].style.top=(r.bottom-16)+'px';handles[1].style.left=Math.max(10,r.left)+'px';handles[1].style.top=Math.max(4,r.top-26)+'px';
}
function guides(gx,gy){
 const x=$('binch-edit-guide-x'),y=$('binch-edit-guide-y');
 x.hidden=gx==null;y.hidden=gy==null;
 if(gx!=null)x.style.left=gx+'px';if(gy!=null)y.style.top=gy+'px';
}
function magnetic(el,newX,newY){
 let x=newX,y=newY,gx=null,gy=null;
 if(!magnet)return {x,y,gx,gy};
 x=snap(x);y=snap(y);
 const current=el.getBoundingClientRect(),baseX=current.left-(parseFloat(el.style.getPropertyValue('--binch-edit-x'))||0),baseY=current.top-(parseFloat(el.style.getPropertyValue('--binch-edit-y'))||0);
 const w=current.width,h=current.height;
 const others=Array.from(document.querySelectorAll('.binch-edit-target')).filter(t=>t!==el&&!t.contains(el)&&!el.contains(t));
 let bestX=THRESHOLD+1,bestY=THRESHOLD+1;
 for(const other of others){
  const r=other.getBoundingClientRect();
  const xCandidates=[r.left,r.right,r.left+r.width/2],selfX=[0,w,w/2];
  const yCandidates=[r.top,r.bottom,r.top+r.height/2],selfY=[0,h,h/2];
  for(let i=0;i<3;i++)for(let j=0;j<3;j++){
   const dx=xCandidates[j]-(baseX+x+selfX[i]),dy=yCandidates[j]-(baseY+y+selfY[i]);
   if(Math.abs(dx)<bestX&&Math.abs(dx)<=THRESHOLD){bestX=Math.abs(dx);x+=dx;gx=xCandidates[j]}
   if(Math.abs(dy)<bestY&&Math.abs(dy)<=THRESHOLD){bestY=Math.abs(dy);y+=dy;gy=yCandidates[j]}
  }
 }
 return {x:Math.round(x),y:Math.round(y),gx,gy};
}
function hasOverlap(el,left,top,width,height){
 // Avoid intersecting panels anywhere in the active page, except descendants/ancestors
 // whose rectangles naturally contain each other.
 const others=Array.from(scope()?.querySelectorAll('.binch-edit-target')||[])
  .filter(x=>x!==el&&!x.contains(el)&&!el.contains(x));
 return others.some(other=>{
  const r=other.getBoundingClientRect();
  return left<r.right-4&&left+width>r.left+4&&top<r.bottom-4&&top+height>r.top+4
 });

}
function constrainMove(d,x,y){
 const rect=d.el.getBoundingClientRect(),oldX=parseFloat(d.el.style.getPropertyValue('--binch-edit-x'))||0,oldY=parseFloat(d.el.style.getPropertyValue('--binch-edit-y'))||0;
 const baseLeft=rect.left-oldX,baseTop=rect.top-oldY;
 x=Math.round(Math.min(Math.max(x,12-baseLeft),window.innerWidth-12-rect.width-baseLeft));
 y=Math.round(Math.max(y,12-baseTop));
 if(!hasOverlap(d.el,baseLeft+x,baseTop+y,rect.width,rect.height))return {x,y,blocked:false};
 const axisX=!hasOverlap(d.el,baseLeft+x,baseTop+d.offsetY,rect.width,rect.height);
 const axisY=!hasOverlap(d.el,baseLeft+d.offsetX,baseTop+y,rect.width,rect.height);
 if(axisX&&!axisY)return {x,y:d.offsetY,blocked:true};
 if(axisY&&!axisX)return {x:d.offsetX,y,blocked:true};
 if(axisX&&axisY)return Math.abs(x-d.offsetX)>=Math.abs(y-d.offsetY)?{x,y:d.offsetY,blocked:true}:{x:d.offsetX,y,blocked:true};
 return {x:d.offsetX,y:d.offsetY,blocked:true};
}
function begin(e,el,mode){
 if(!editing||e.button!==0||(e.target.closest('button,input,select,textarea,a')&&mode!=='resize'))return;
 e.preventDefault();e.stopPropagation();select(el);
 const r=el.getBoundingClientRect(),id=el.dataset.binchEditorId,c=cfg()[id]||{};
 drag={id,el,mode,startX:e.clientX,startY:e.clientY,offsetX:Number(c.x)||0,offsetY:Number(c.y)||0,width:r.width,height:r.height,changed:false,before:snapshot()};
 document.body.classList.add('binch-edit-dragging');
}
function onMove(e){
 if(!drag)return;
 pending={x:e.clientX,y:e.clientY};
 if(frame)return;
 frame=requestAnimationFrame(()=>{
  frame=0;
  if(!drag||!pending)return;
  const d=drag,dx=pending.x-d.startX,dy=pending.y-d.startY;pending=null;
  if(d.mode==='resize'){
   const bounds=d.el.parentElement?.getBoundingClientRect();
   const maxW=Math.max(MIN_W,Math.min(window.innerWidth-24, (bounds?.right||window.innerWidth)-d.el.getBoundingClientRect().left));
   let width=Math.max(MIN_W,Math.min(maxW,d.width+dx));
   let height=Math.max(MIN_H,Math.min(1400,d.height+dy));
   if(magnet){width=snap(width);height=snap(height)}
   // Recheck against siblings before committing either dimension.
   const r=d.el.getBoundingClientRect();
   if(!hasOverlap(d.el,r.left,r.top,width,height)){
    d.el.style.width=Math.round(width)+'px';d.el.style.height=Math.round(height)+'px';
    d.el.style.maxWidth='100%';d.el.style.minHeight='0';d.el.style.boxSizing='border-box';
   }
   guides(null,null);
  }else{
   const result=magnetic(d.el,d.offsetX+dx,d.offsetY+dy);
   const allowed=constrainMove(d,result.x,result.y);
   d.el.style.setProperty('--binch-edit-x',allowed.x+'px');
   d.el.style.setProperty('--binch-edit-y',allowed.y+'px');
   guides(allowed.blocked?null:result.gx,allowed.blocked?null:result.gy);
  }
  d.changed=true;updateHandles();
 });
}
function end(){
 if(!drag)return;
 if(frame){cancelAnimationFrame(frame);frame=0;pending=null}
 const d=drag,record=cfg()[d.id]||{};
 if(d.changed){
  if(d.mode==='resize'){record.width=Math.round(d.el.getBoundingClientRect().width);record.height=Math.round(d.el.getBoundingClientRect().height)}
  else{record.x=parseFloat(d.el.style.getPropertyValue('--binch-edit-x'))||0;record.y=parseFloat(d.el.style.getPropertyValue('--binch-edit-y'))||0}
  cfg()[d.id]=record;store();commitHistory(d.before);$('binch-edit-message').textContent='Disposition enregistrée sur cet appareil.';
 }
 drag=null;guides(null,null);document.body.classList.remove('binch-edit-dragging');
}
 function applySaved(){
  if(editing)return;
  clearTargets();
  targets().forEach((el,i)=>applyTo(el,identity(el,i),i));
  document.querySelectorAll('.binch-edit-target').forEach(el=>el.classList.remove('binch-edit-target'));
 }

function toggle(force){
 editing=typeof force==='boolean'?force:!editing;
 document.body.classList.toggle('binch-editing',editing);
 $('binch-editor-toggle').textContent=editing?'✓ Terminer':'✥ Modifier l’interface';
 $('binch-editor-toggle').setAttribute('aria-pressed',String(editing));
 $('binch-edit-toolbar').hidden=!editing;
 if(editing){setupTargets();profileList();historyState()}else{clearTransient();applySaved()}
}
function reset(){
 if(!window.confirm('Réinitialiser la disposition de cette page sur cet appareil ?'))return;
 const before=snapshot();delete db[key()];store();setupTargets();commitHistory(before);$('binch-edit-message').textContent='Disposition de la page réinitialisée.';
}
function mount(){
 if($('binch-editor-toggle'))return;
 const button=document.createElement('button');button.type='button';button.id='binch-editor-toggle';button.textContent='✥ Modifier l’interface';button.title='Mode édition WoW : déplacer et ajuster les panneaux';button.setAttribute('aria-pressed','false');document.body.append(button);
 const toolbar=document.createElement('div');toolbar.id='binch-edit-toolbar';toolbar.hidden=true;toolbar.innerHTML='<strong>✥ Mode édition</strong><span id="binch-edit-count"></span><label class="binch-edit-magnet"><input type="checkbox" id="binch-edit-magnet" checked> Aimantation grille + panneaux</label><select id="binch-edit-profiles" aria-label="Profils de disposition"><option value="">Profils sauvegardés</option></select><button type="button" id="binch-edit-profile-save">Sauver profil</button><button type="button" id="binch-edit-profile-load">Charger</button><button type="button" id="binch-edit-profile-delete">Supprimer</button><button type="button" id="binch-edit-undo" disabled title="Ctrl+Z">Annuler</button><button type="button" id="binch-edit-redo" disabled title="Ctrl+Y">Refaire</button><button type="button" id="binch-edit-export">Exporter JSON</button><label class="binch-edit-import">Importer JSON<input id="binch-edit-import-file" type="file" accept=".json,application/json"></label><button type="button" id="binch-edit-reset">Réinitialiser la page</button><span id="binch-edit-message">Glisse les panneaux et redimensionne largeur + hauteur par le coin. Les collisions entre panneaux voisins sont bloquées.</span><button type="button" id="binch-edit-done">Terminer</button>';document.body.append(toolbar);
 const x=document.createElement('div');x.id='binch-edit-guide-x';x.className='binch-edit-guide vertical';x.hidden=true;document.body.append(x);
 const y=document.createElement('div');y.id='binch-edit-guide-y';y.className='binch-edit-guide horizontal';y.hidden=true;document.body.append(y);
 $('binch-edit-magnet').checked=magnet;
 button.addEventListener('click',()=>toggle());
 $('binch-edit-done').addEventListener('click',()=>toggle(false));
 $('binch-edit-magnet').addEventListener('change',e=>{magnet=e.target.checked;localStorage.setItem('binch.ui.magnet.v1',magnet?'1':'0')});
 $('binch-edit-reset').addEventListener('click',reset);
 $('binch-edit-undo').addEventListener('click',()=>restoreHistory(undoStack,redoStack));
 $('binch-edit-redo').addEventListener('click',()=>restoreHistory(redoStack,undoStack));
 $('binch-edit-export').addEventListener('click',exportLayout);
 $('binch-edit-import-file').addEventListener('change',importLayout);
 $('binch-edit-profile-save').addEventListener('click',saveProfile);
 $('binch-edit-profile-load').addEventListener('click',loadProfile);
 $('binch-edit-profile-delete').addEventListener('click',deleteProfile);
 profileList();
 document.addEventListener('pointerdown',e=>{
  if(!editing||e.target.closest('#binch-edit-toolbar,#binch-editor-toggle,.binch-edit-resize'))return;
  const candidate=e.target.closest('.binch-edit-target');
  if(candidate)begin(e,candidate,'move')
 },true);
 document.addEventListener('pointermove',onMove,true);document.addEventListener('pointerup',end,true);document.addEventListener('pointercancel',end,true);
 document.addEventListener('keydown',e=>{
 if(!editing)return;
 if(e.key==='Escape'){end();toggle(false);return}
 if(e.target.closest('input,textarea,select,[contenteditable="true"]'))return;
 if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){e.preventDefault();restoreHistory(e.shiftKey?redoStack:undoStack,e.shiftKey?undoStack:redoStack)}
 else if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='y'){e.preventDefault();restoreHistory(redoStack,undoStack)}
 else if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){
  const el=document.querySelector('.binch-edit-selected');if(!el||drag)return;
  e.preventDefault();
  const id=el.dataset.binchEditorId,before=snapshot(),record=cfg()[id]||{};
  const dx=e.key==='ArrowLeft'?-1:e.key==='ArrowRight'?1:0;
  const dy=e.key==='ArrowUp'?-1:e.key==='ArrowDown'?1:0;
  const step=e.shiftKey?1:STEP,oldX=Number(record.x)||0,oldY=Number(record.y)||0;
  const pos=constrainMove({el,offsetX:oldX,offsetY:oldY},oldX+dx*step,oldY+dy*step);
  el.style.setProperty('--binch-edit-x',pos.x+'px');el.style.setProperty('--binch-edit-y',pos.y+'px');
  cfg()[id]={...record,x:pos.x,y:pos.y};store();commitHistory(before);updateHandles();
 }
});
 // Navigation of La Binch is dynamic and does not reload the document.
 document.addEventListener('click',e=>{
  if(!editing)return;
  if(e.target.closest('#app nav.nav [data-page]'))setTimeout(setupTargets,0)
 },false);
 window.addEventListener('resize',()=>{if(editing){clearTransient();setupTargets()}else applySaved()});
 // Apply persistent offsets when pages change via navigation; no permanent polling.
 document.addEventListener('click',e=>{
  if(!e.target.closest('#app nav.nav [data-page]'))return;
  setTimeout(()=>{if(!editing)applySaved()},0)
 });
 applySaved();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
})();
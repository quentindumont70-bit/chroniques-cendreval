/* La Binch — UI editor V1: local layouts, magnetic grid and alignment guides.
   Strictly visual HTML editor; no game interaction or backend. */
(()=>{'use strict';
const KEY='binch.ui.editor.v1',STEP=12,THRESHOLD=9;
const saved=()=>{try{return JSON.parse(localStorage.getItem(KEY))||{}}catch{return {}}};
const db=saved(),$=id=>document.getElementById(id);
let editing=false,handles=[],drag=null;
const baseStyles=new WeakMap();
let magnet=localStorage.getItem('binch.ui.magnet.v1')!=='0';
function snap(n){return Math.round(n/STEP)*STEP}
function scope(){const page=document.querySelector('#app main .page.active');return page||document.querySelector('#page-hub.active')||null}
function pageKey(){return scope()?.id||'page-hub'}
function viewport(){return window.innerWidth<700?'mobile':window.innerWidth<1200?'tablet':'desktop'}
function key(){return pageKey()+'|'+viewport()}
function cfg(){return db[key()]||(db[key()]={})}
function targets(){
 const page=scope();if(!page)return [];
 const query=':scope > .panel,:scope > article,:scope > section,:scope > .binch-command,:scope > .binch-todo,:scope > .binch-play-today, #binch-command-deck > [data-command-widget], .binch-command-hero, .binch-command-layout, .binch-command-stats, .binch-command-pin-wrap, .binch-command-discoveries, .binch-command-questlog, .binch-command-progress, .binch-command-bottom, .binch-command-row, .binch-command-notes';
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
 if(!baseStyles.has(el))baseStyles.set(el,{width:el.style.width,maxWidth:el.style.maxWidth,boxSizing:el.style.boxSizing});
 el.dataset.binchEditorId=id;
 el.classList.add('binch-edit-target');
 el.style.setProperty('--binch-edit-x',(Number(item.x)||0)+'px');
 el.style.setProperty('--binch-edit-y',(Number(item.y)||0)+'px');
 if(Number(item.width)>0){el.style.width=Math.round(item.width)+'px';el.style.maxWidth='100%';el.style.boxSizing='border-box'}
 el.dataset.binchEditName=el.getAttribute('aria-label')||el.querySelector('h2,h3')?.textContent?.trim().slice(0,65)||el.id||'Panneau '+(i+1);
}
function clearTransient(){
 document.querySelectorAll('.binch-edit-selected').forEach(n=>n.classList.remove('binch-edit-selected'));
 for(const node of handles)node.remove();handles=[];
 ['binch-edit-guide-x','binch-edit-guide-y'].forEach(id=>{const e=$(id);if(e)e.hidden=true});
}
function clearTargets(){document.querySelectorAll('.binch-edit-target').forEach(el=>{el.classList.remove('binch-edit-target','binch-edit-selected');delete el.dataset.binchEditorId;delete el.dataset.binchEditName;el.style.removeProperty('--binch-edit-x');el.style.removeProperty('--binch-edit-y');const base=baseStyles.get(el);if(base){el.style.width=base.width;el.style.maxWidth=base.maxWidth;el.style.boxSizing=base.boxSizing}else{el.style.removeProperty('width');el.style.removeProperty('max-width');el.style.removeProperty('box-sizing')}})}
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
 const others=Array.from(document.querySelectorAll('.binch-edit-target')).filter(t=>t!==el);
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
function begin(e,el,mode){
 if(!editing||e.button!==0||(e.target.closest('button,input,select,textarea,a')&&mode!=='resize'))return;
 e.preventDefault();e.stopPropagation();select(el);
 const r=el.getBoundingClientRect(),id=el.dataset.binchEditorId,c=cfg()[id]||{};
 drag={id,el,mode,startX:e.clientX,startY:e.clientY,offsetX:Number(c.x)||0,offsetY:Number(c.y)||0,width:r.width,changed:false};
 document.body.classList.add('binch-edit-dragging');
}
function onMove(e){
 if(!drag)return;
 const d=drag,dx=e.clientX-d.startX,dy=e.clientY-d.startY;
 if(d.mode==='resize'){
  const width=Math.max(160,Math.min(window.innerWidth-24,d.width+dx));
  const adjusted=magnet?snap(width):Math.round(width);
  d.el.style.width=Math.max(160,adjusted)+'px';d.el.style.maxWidth='100%';guides(null,null);
 }else{
  const result=magnetic(d.el,d.offsetX+dx,d.offsetY+dy);
  d.el.style.setProperty('--binch-edit-x',result.x+'px');
  d.el.style.setProperty('--binch-edit-y',result.y+'px');
  guides(result.gx,result.gy);
 }
 d.changed=true;updateHandles();
}
function end(){
 if(!drag)return;
 const d=drag,record=cfg()[d.id]||{};
 if(d.changed){
  if(d.mode==='resize')record.width=Math.round(d.el.getBoundingClientRect().width);
  else{record.x=parseFloat(d.el.style.getPropertyValue('--binch-edit-x'))||0;record.y=parseFloat(d.el.style.getPropertyValue('--binch-edit-y'))||0}
  cfg()[d.id]=record;store();$('binch-edit-message').textContent='Disposition enregistrée sur cet appareil.';
 }
 drag=null;guides(null,null);document.body.classList.remove('binch-edit-dragging');
}
function toggle(force){
 editing=typeof force==='boolean'?force:!editing;
 document.body.classList.toggle('binch-editing',editing);
 $('binch-editor-toggle').textContent=editing?'✓ Terminer':'✥ Modifier l’interface';
 $('binch-editor-toggle').setAttribute('aria-pressed',String(editing));
 $('binch-edit-toolbar').hidden=!editing;
 if(editing)setupTargets();else{clearTransient();applySaved()}
}
function reset(){
 if(!window.confirm('Réinitialiser la disposition de cette page sur cet appareil ?'))return;
 delete db[key()];store();setupTargets();$('binch-edit-message').textContent='Disposition de la page réinitialisée.';
}
function mount(){
 if($('binch-editor-toggle'))return;
 const button=document.createElement('button');button.type='button';button.id='binch-editor-toggle';button.textContent='✥ Modifier l’interface';button.title='Mode édition WoW : déplacer et ajuster les panneaux';button.setAttribute('aria-pressed','false');document.body.append(button);
 const toolbar=document.createElement('div');toolbar.id='binch-edit-toolbar';toolbar.hidden=true;toolbar.innerHTML='<strong>✥ Mode édition</strong><span id="binch-edit-count"></span><label class="binch-edit-magnet"><input type="checkbox" id="binch-edit-magnet" checked> Aimantation grille + panneaux</label><button type="button" id="binch-edit-reset">Réinitialiser la page</button><span id="binch-edit-message">Glisse un panneau ou redimensionne-le par son coin inférieur droit.</span><button type="button" id="binch-edit-done">Terminer</button>';document.body.append(toolbar);
 const x=document.createElement('div');x.id='binch-edit-guide-x';x.className='binch-edit-guide vertical';x.hidden=true;document.body.append(x);
 const y=document.createElement('div');y.id='binch-edit-guide-y';y.className='binch-edit-guide horizontal';y.hidden=true;document.body.append(y);
 $('binch-edit-magnet').checked=magnet;
 button.addEventListener('click',()=>toggle());
 $('binch-edit-done').addEventListener('click',()=>toggle(false));
 $('binch-edit-magnet').addEventListener('change',e=>{magnet=e.target.checked;localStorage.setItem('binch.ui.magnet.v1',magnet?'1':'0')});
 $('binch-edit-reset').addEventListener('click',reset);
 document.addEventListener('pointerdown',e=>{
  if(!editing||e.target.closest('#binch-edit-toolbar,#binch-editor-toggle,.binch-edit-resize'))return;
  const candidate=e.target.closest('.binch-edit-target');
  if(candidate)begin(e,candidate,'move')
 },true);
 document.addEventListener('pointermove',onMove,true);document.addEventListener('pointerup',end,true);document.addEventListener('pointercancel',end,true);
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&editing){end();toggle(false)}});
 // Navigation of La Binch is dynamic and does not reload the document.
 document.addEventListener('click',e=>{
  if(!editing)return;
  if(e.target.closest('#app nav.nav [data-page]'))setTimeout(setupTargets,0)
 },false);
 window.addEventListener('resize',()=>{if(editing){clearTransient();setupTargets()}else applySaved()});
 function applySaved(){
  if(editing)return;
  clearTargets();
  targets().forEach((el,i)=>applyTo(el,identity(el,i),i));
  document.querySelectorAll('.binch-edit-target').forEach(el=>el.classList.remove('binch-edit-target'));
 }
 // Apply persistent offsets when pages change via navigation; no permanent polling.
 document.addEventListener('click',e=>{
  if(!e.target.closest('#app nav.nav [data-page]'))return;
  setTimeout(()=>{if(!editing)applySaved()},0)
 });
 applySaved();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
})();
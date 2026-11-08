/* La Binch — objectifs personnalisés, hors addon. */
(()=>{'use strict';
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const K='binch.custom.objectives.v1.';
const TYPES=['Quête','Métier','Donjon','Exploration','Équipement','Autre'];
const PRIORITIES=['Essentiel','Normal','Plus tard'];
let currentKey='',items=[],filter='À faire';
function getKey(){
 let p;try{p=JSON.parse(localStorage.getItem('grimoire.hub.v3'))||{}}catch{p={}}
 const name=String(p.data?.pseudo||'Aventurier').trim().toLocaleLowerCase('fr');
 return K+[name,p.race||'',p.classe||''].map(v=>encodeURIComponent(String(v))).join('.');
}
function load(){
 const next=getKey();if(currentKey===next)return;
 currentKey=next;try{const v=JSON.parse(localStorage.getItem(currentKey));items=Array.isArray(v)?v.slice(0,120).filter(x=>x&&typeof x.title==='string'&&x.title.length<=100&&TYPES.includes(x.type)&&PRIORITIES.includes(x.priority)&&Number.isInteger(x.level)&&x.level>=1&&x.level<=60).map(x=>({id:String(x.id||''),title:x.title,type:x.type,priority:x.priority,level:x.level,done:!!x.done})):[]}catch{items=[]}
}
function save(){localStorage.setItem(currentKey,JSON.stringify(items))}
function init(){
 const hub=$('page-hub');if(!hub||$('binch-personal-objectives'))return;
 const box=document.createElement('section');box.id='binch-personal-objectives';box.className='panel section';
 box.innerHTML='<div class="eyebrow">TON AVENTURE / OBJECTIFS LIBRES</div><h2>Mes objectifs personnels</h2><p class="muted">Ajoute tes propres étapes de leveling et retrouve-les sur ce navigateur. Ces tâches sont indépendantes de la synchronisation WoW.</p>'+
 '<form id="binch-objective-form" class="binch-objective-form">'+
 '<label>Objectif <input name="title" maxlength="100" placeholder="Ex. : Terminer les quêtes de Mulgore" required></label>'+
 '<label>Catégorie <select name="type">'+TYPES.map(v=>'<option>'+v+'</option>').join('')+'</select></label>'+
 '<label>Priorité <select name="priority">'+PRIORITIES.map(v=>'<option>'+v+'</option>').join('')+'</select></label>'+
 '<label>Niveau visé <input name="level" type="number" min="1" max="60" value="1" required></label>'+
 '<button type="submit">Ajouter</button></form>'+
 '<div class="binch-objective-toolbar"><div role="group" aria-label="Filtrer les objectifs"><button type="button" data-objective-filter="À faire">À faire</button><button type="button" data-objective-filter="Tous">Tous</button><button type="button" data-objective-filter="Terminés">Terminés</button></div><button type="button" id="binch-objective-copy">Copier mes objectifs</button></div>'+
 '<p id="binch-objective-summary" aria-live="polite" role="status"></p><div id="binch-objective-list"></div>';
 const anchor=$('binch-adventure-home');if(anchor)anchor.insertAdjacentElement('afterend',box);else hub.prepend(box);
 $('binch-objective-form').onsubmit=e=>{
  e.preventDefault();load();
  const form=e.currentTarget,d=new FormData(form),title=String(d.get('title')||'').trim(),type=String(d.get('type')),priority=String(d.get('priority')),level=Number(d.get('level'));
  if(!title||title.length>100||!TYPES.includes(type)||!PRIORITIES.includes(priority)||!Number.isInteger(level)||level<1||level>60||items.length>=120)return;
  items.push({id:Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8),title,type,priority,level,done:false});
  save();form.elements.namedItem('title').value='';render();
 };
 box.addEventListener('click',e=>{
  const filterButton=e.target.closest('[data-objective-filter]');
  if(filterButton){filter=filterButton.dataset.objectiveFilter;render();return}
  const change=e.target.closest('[data-objective-done]');
  if(change){load();const row=items.find(x=>x.id===change.dataset.objectiveDone);if(row){row.done=!row.done;save();render()}return}
  const del=e.target.closest('[data-objective-del]');
  if(del){load();const row=items.find(x=>x.id===del.dataset.objectiveDel);if(row&&confirm('Supprimer « '+row.title+' » ?')){items=items.filter(x=>x!==row);save();render()}}
 });
 $('binch-objective-copy').onclick=async()=>{
  load();const list=items.filter(x=>!x.done).sort((a,b)=>a.level-b.level),text=['La Binch — objectifs à venir',...list.map(x=>'- [ ] Nv '+x.level+' · '+x.type+' · '+x.title+' ('+x.priority+')')].join('\n');
  try{await navigator.clipboard.writeText(text);$('binch-objective-copy').textContent='Copié ✓'}catch{prompt('Copier mes objectifs',text)}
 };
 document.addEventListener('grimoire:sync',render);
 window.addEventListener('storage',render);
 document.addEventListener('binch:profile-changed',render);
 render();
}
function render(){
 if(!$('binch-objective-list'))return;
 load();const ordered=items.slice().sort((a,b)=>a.done-b.done||PRIORITIES.indexOf(a.priority)-PRIORITIES.indexOf(b.priority)||a.level-b.level);
 const shown=ordered.filter(x=>filter==='Tous'||(filter==='À faire'?!x.done:x.done));
 const total=items.filter(x=>!x.done).length;
 $('binch-objective-summary').textContent=total+' objectif(s) à faire · '+(items.length-total)+' terminé(s).';
 document.querySelectorAll('[data-objective-filter]').forEach(b=>b.classList.toggle('active',b.dataset.objectiveFilter===filter));
 $('binch-objective-list').innerHTML=shown.length?shown.map(x=>'<article class="binch-objective-item'+(x.done?' is-done':'')+'"><button type="button" data-objective-done="'+esc(x.id)+'" aria-pressed="'+x.done+'">'+(x.done?'✓':'○')+'</button><span><b>'+esc(x.title)+'</b><small>NV. '+x.level+' · '+esc(x.type)+' · '+esc(x.priority)+'</small></span><button type="button" data-objective-del="'+esc(x.id)+'" aria-label="Supprimer '+esc(x.title)+'">×</button></article>').join(''):'<p class="muted">Aucun objectif dans cette vue.</p>';
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();

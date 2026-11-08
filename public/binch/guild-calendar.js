/* La Binch — programme de sorties de guilde, local uniquement. */
(()=>{'use strict';
const KEY='binch.guild.events.v1',MAX=100,$=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const KINDS=['Donjon','Raid','Quêtes','Métiers','Exploration','Réunion de guilde','Autre'];
let events=[],filter='upcoming';
function storage(){try{const v=JSON.parse(localStorage.getItem(KEY));events=Array.isArray(v)?v.slice(0,MAX).filter(valid).map(x=>({...x,done:!!x.done})):[]}catch{events=[]}}
function valid(x){return x&&typeof x.title==='string'&&x.title.trim().length>0&&x.title.length<=100&&KINDS.includes(x.kind)&&typeof x.date==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(x.date)&&!Number.isNaN(Date.parse(x.date+'T00:00:00'))&&typeof x.time==='string'&&/^([01]\d|2[0-3]):[0-5]\d$/.test(x.time)&&typeof x.note==='string'&&x.note.length<=280&&Number.isInteger(x.size)&&x.size>=2&&x.size<=40}
function persist(){localStorage.setItem(KEY,JSON.stringify(events))}
function start(){
 const page=$('page-gm');if(!page||$('binch-guild-calendar'))return;
 storage();
 const box=document.createElement('section');box.id='binch-guild-calendar';box.className='panel section';
 box.innerHTML='<div class="eyebrow">AGENDA DE GUILDE / ORGANISATION</div><h2>Calendrier des sorties</h2>'+
 '<p class="muted">Planifie les prochains événements, prépare une annonce Discord et conserve l’historique. Cet agenda est local : il ne crée pas d’événement dans WoW ou Discord.</p>'+
 '<form id="binch-calendar-form" class="binch-calendar-form">'+
 '<label>Nom de la sortie<input required name="title" maxlength="100" placeholder="Ex. : Ragefeu vendredi"></label>'+
 '<label>Activité<select name="kind">'+KINDS.map(x=>'<option>'+x+'</option>').join('')+'</select></label>'+
 '<label>Date<input type="date" name="date" required></label>'+
 '<label>Heure locale<input type="time" name="time" value="20:30" required></label>'+
 '<label>Places<input type="number" name="size" min="2" max="40" value="5" required></label>'+
 '<label class="binch-calendar-note">Instructions / lieu de rendez-vous<textarea maxlength="280" name="note" rows="2" placeholder="Canal vocal, point de rendez-vous, prérequis…"></textarea></label>'+
 '<button type="submit">Ajouter la sortie</button></form>'+
 '<div class="binch-calendar-filters" role="group" aria-label="Filtrer les événements"><button type="button" data-cal-filter="upcoming">À venir</button><button type="button" data-cal-filter="all">Tous</button><button type="button" data-cal-filter="done">Terminés</button></div>'+
 '<p id="binch-calendar-count" role="status" aria-live="polite"></p><div id="binch-calendar-list"></div>';
 const roster=$('binch-guild-roster');if(roster)roster.insertAdjacentElement('afterend',box);else page.prepend(box);
 const form=$('binch-calendar-form'),dateInput=form.elements.namedItem('date');
 const now=new Date(),yyyy=now.getFullYear(),mm=String(now.getMonth()+1).padStart(2,'0'),dd=String(now.getDate()).padStart(2,'0');
 dateInput.value=yyyy+'-'+mm+'-'+dd;
 form.onsubmit=e=>{
  e.preventDefault();if(events.length>=MAX)return alert('Maximum de '+MAX+' événements atteint.');
  const d=new FormData(form),x={id:Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8),title:String(d.get('title')||'').trim(),kind:String(d.get('kind')),date:String(d.get('date')),time:String(d.get('time')),size:Number(d.get('size')),note:String(d.get('note')||'').trim(),done:false};
  if(!valid(x))return alert('Complète correctement la sortie.');
  events.push(x);persist();render();form.elements.namedItem('title').value='';form.elements.namedItem('note').value='';
 };
 box.addEventListener('click',async e=>{
  const f=e.target.closest('[data-cal-filter]');if(f){filter=f.dataset.calFilter;render();return;}
  const b=e.target.closest('[data-cal-action]');if(!b)return;
  const event=events.find(x=>x.id===b.dataset.calId);if(!event)return;
  if(b.dataset.calAction==='done'){event.done=!event.done;persist();render();return;}
  if(b.dataset.calAction==='delete'){if(!confirm('Supprimer la sortie '+event.title+' ?'))return;events=events.filter(x=>x!==event);persist();render();return;}
  if(b.dataset.calAction==='copy'){
   const lines=['LA BINCH — '+event.kind.toUpperCase(),event.title, 'Date : '+event.date.split('-').reverse().join('/')+' à '+event.time+' (heure locale)', 'Places : '+event.size, event.note||'Rendez-vous à confirmer','Répondez avec votre personnage, classe et rôle.'];
   const text=lines.join('\n');try{await navigator.clipboard.writeText(text);b.textContent='Annonce copiée ✓'}catch{prompt('Copier l’annonce',text)}
  }
 });
 function render(){
  const now=new Date();now.setHours(0,0,0,0);
  const list=events.filter(x=>filter==='all'||(filter==='done'?x.done:!x.done&&new Date(x.date+'T00:00:00')>=now)).slice().sort((a,b)=>a.date.localeCompare(b.date)||a.time.localeCompare(b.time));
  const coming=events.filter(x=>!x.done&&new Date(x.date+'T00:00:00')>=now).length;
  $('binch-calendar-count').textContent=coming+' sortie(s) à venir · '+events.length+' enregistrée(s).';
  box.querySelectorAll('[data-cal-filter]').forEach(b=>b.classList.toggle('active',b.dataset.calFilter===filter));
  $('binch-calendar-list').innerHTML=list.length?list.map(x=>'<article class="binch-calendar-event'+(x.done?' done':'')+'"><div><small>'+esc(x.kind)+' · '+x.date.split('-').reverse().join('/')+' à '+x.time+'</small><h3>'+esc(x.title)+'</h3><p>'+esc(x.note||'Rendez-vous à confirmer')+'</p><span>'+x.size+' places · '+(x.done?'Sortie terminée':'À organiser')+'</span></div><div class="binch-calendar-actions"><button type="button" data-cal-action="copy" data-cal-id="'+esc(x.id)+'">Copier pour Discord</button><button type="button" data-cal-action="done" data-cal-id="'+esc(x.id)+'">'+(x.done?'Rouvrir':'Terminer')+'</button><button type="button" data-cal-action="delete" data-cal-id="'+esc(x.id)+'">Supprimer</button></div></article>').join(''):'<p class="muted">Aucune sortie dans cette vue.</p>';
 }
 render();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();

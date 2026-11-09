/* La Binch — programme de sorties de guilde, local uniquement. */
(()=>{'use strict';
const KEY='binch.guild.events.v1',MAX=100,$=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const KINDS=['Donjon','Raid','Quêtes','Métiers','Exploration','Réunion de guilde','Autre'];
let events=[],filter='upcoming';
const ROLES=['Tank','Soigneur','DPS','Flexible'];
const STATES=['Confirmé','Incertain','Absent'];
function attendances(e){return Array.isArray(e.attendees)?e.attendees.filter(a=>a&&typeof a.name==='string'&&a.name.length>0&&a.name.length<=36&&ROLES.includes(a.role)&&STATES.includes(a.status)).slice(0,80):[]}
function confirmed(e){return attendances(e).filter(a=>a.status==='Confirmé')}
function download(filename,mime,text){const url=URL.createObjectURL(new Blob([text],{type:mime})),a=document.createElement('a');a.href=url;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),1500)}
function icalEscape(value){return String(value??'').replace(/\\/g,'\\\\').replace(/\r?\n/g,'\\n').replace(/,/g,'\\,').replace(/;/g,'\\;')}
function invite(e){const start=new Date(e.date+'T'+e.time+':00');const end=new Date(start.getTime()+90*60*1000);const fmt=d=>[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('')+'T'+[d.getHours(),d.getMinutes(),d.getSeconds()].map(n=>String(n).padStart(2,'0')).join('');const stamp=fmt(start),finish=fmt(end);const description=[e.note,'Places : '+e.size,...confirmed(e).map(a=>a.name+' ('+a.role+')')].filter(Boolean).join('\n');const uid='la-binch-'+String(e.id).replace(/[^a-zA-Z0-9-]/g,'')+'@local';return ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//La Binch//Calendrier de guilde//FR','CALSCALE:GREGORIAN','BEGIN:VEVENT','UID:'+uid,'DTSTAMP:'+new Date().toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'') ,'DTSTART:'+stamp,'DTEND:'+finish,'SUMMARY:'+icalEscape(e.title),'DESCRIPTION:'+icalEscape(description),'END:VEVENT','END:VCALENDAR'].join('\r\n')+'\r\n'}
function storage(){try{const v=JSON.parse(localStorage.getItem(KEY));events=Array.isArray(v)?v.slice(0,MAX).filter(valid).map(x=>({...x,done:!!x.done,attendees:attendances(x)})):[]}catch{events=[]}}
function validCalendarDate(value){if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;const [year,month,day]=value.split('-').map(Number);const dt=new Date(year,month-1,day);return dt.getFullYear()===year&&dt.getMonth()===month-1&&dt.getDate()===day;}
function valid(x){return x&&typeof x.title==='string'&&x.title.trim().length>0&&x.title.length<=100&&KINDS.includes(x.kind)&&typeof x.date==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(x.date)&&validCalendarDate(x.date)&&typeof x.time==='string'&&/^([01]\d|2[0-3]):[0-5]\d$/.test(x.time)&&typeof x.note==='string'&&x.note.length<=280&&Number.isInteger(x.size)&&x.size>=2&&x.size<=40}
function persist(){localStorage.setItem(KEY,JSON.stringify(events));document.dispatchEvent(new Event('binch:calendar-change'))}
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
  e.preventDefault();
  const editing=form.dataset.editId;
  const previous=editing?events.find(x=>x.id===editing):null;
  if(!previous&&events.length>=MAX)return alert('Maximum de '+MAX+' événements atteint.');
  const d=new FormData(form),x={id:previous?.id||(Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8)),title:String(d.get('title')||'').trim(),kind:String(d.get('kind')),date:String(d.get('date')),time:String(d.get('time')),size:Number(d.get('size')),note:String(d.get('note')||'').trim(),done:previous?.done||false,attendees:previous?.attendees||[]};
  if(!valid(x))return alert('Complète correctement la sortie.');
  if(previous)Object.assign(previous,x);else events.push(x);
  persist();render();delete form.dataset.editId;
  form.querySelector('[type="submit"]').textContent='Ajouter la sortie';
  form.elements.namedItem('title').value='';form.elements.namedItem('note').value='';
 };
 box.addEventListener('click',async e=>{
  const f=e.target.closest('[data-cal-filter]');if(f){filter=f.dataset.calFilter;render();return;}
  const b=e.target.closest('[data-cal-action]');if(!b)return;
  const event=events.find(x=>x.id===b.dataset.calId);if(!event)return;
  if(b.dataset.calAction==='edit'){
   form.dataset.editId=event.id;
   for(const field of ['title','kind','date','time','size','note'])form.elements.namedItem(field).value=event[field];
   form.querySelector('[type="submit"]').textContent='Enregistrer les modifications';
   form.scrollIntoView({behavior:'smooth',block:'center'});
   form.elements.namedItem('title').focus();
   return;
  }
  if(b.dataset.calAction==='done'){event.done=!event.done;persist();render();return;}
  if(b.dataset.calAction==='delete'){if(!confirm('Supprimer la sortie '+event.title+' ?'))return;events=events.filter(x=>x!==event);persist();render();return;}
  if(b.dataset.calAction==='ics'){download('la-binch-'+event.date+'.ics','text/calendar;charset=utf-8',invite(event));return;}
  if(b.dataset.calAction==='copy'){
   const lines=['LA BINCH — '+event.kind.toUpperCase(),event.title, 'Date : '+event.date.split('-').reverse().join('/')+' à '+event.time+' (heure locale)', 'Places : '+confirmed(event).length+' / '+event.size+' confirmées', event.note||'Rendez-vous à confirmer','',...attendances(event).map(a=>'• '+a.name+' — '+a.role+' ('+a.status+')'),'','Répondez avec votre personnage, classe et rôle.'];
   const text=lines.join('\n');try{await navigator.clipboard.writeText(text);b.textContent='Annonce copiée ✓'}catch{prompt('Copier l’annonce',text)}
  }
 });
 // Event-specific signups; unlike the global guild roster, each outing has its own list.
 box.addEventListener('submit',e=>{
  const form=e.target.closest('[data-cal-signup]');if(!form)return;
  e.preventDefault();const event=events.find(x=>x.id===form.dataset.calSignup);if(!event)return;
  const d=new FormData(form),name=String(d.get('name')||'').trim(),role=String(d.get('role')||''),status=String(d.get('status')||'');
  if(!name||name.length>36||!ROLES.includes(role)||!STATES.includes(status))return;
  event.attendees=attendances(event);
  const existing=event.attendees.find(a=>a.name.toLocaleLowerCase('fr')===name.toLocaleLowerCase('fr'));
  if(existing){existing.role=role;existing.status=status;}
  else{if(event.attendees.length>=80)return alert('Limite de 80 inscriptions atteinte.');event.attendees.push({name,role,status});}
  persist();render();
 });
 box.addEventListener('click',e=>{
  const del=e.target.closest('[data-cal-attendee-remove]');if(!del)return;
  const event=events.find(x=>x.id===del.dataset.calEvent);if(!event)return;
  event.attendees=attendances(event).filter(a=>a.name!==del.dataset.calAttendeeRemove);persist();render();
 });
 function render(){
  const now=new Date();now.setHours(0,0,0,0);
  const list=events.filter(x=>filter==='all'||(filter==='done'?x.done:!x.done&&new Date(x.date+'T00:00:00')>=now)).slice().sort((a,b)=>a.date.localeCompare(b.date)||a.time.localeCompare(b.time));
  const coming=events.filter(x=>!x.done&&new Date(x.date+'T00:00:00')>=now).length;
  $('binch-calendar-count').textContent=coming+' sortie(s) à venir · '+events.length+' enregistrée(s).';
  box.querySelectorAll('[data-cal-filter]').forEach(b=>b.classList.toggle('active',b.dataset.calFilter===filter));
  const opened=new Set([...box.querySelectorAll('details.binch-cal-attendance[open]')].map(d=>d.dataset.calOpen));
  $('binch-calendar-list').innerHTML=list.length?list.map(x=>{
   const people=attendances(x),yes=confirmed(x),wait=people.filter(a=>a.status==='Incertain'),roles=ROLES.map(role=>role+' : '+yes.filter(a=>a.role===role).length).join(' · ');
   return '<article class="binch-calendar-event'+(x.done?' done':'')+'"><div><small>'+esc(x.kind)+' · '+x.date.split('-').reverse().join('/')+' à '+x.time+'</small><h3>'+esc(x.title)+'</h3><p>'+esc(x.note||'Rendez-vous à confirmer')+'</p><span>'+yes.length+' / '+x.size+' places confirmées · '+wait.length+' incertain(s)'+(yes.length>x.size?' · ⚠ Capacité dépassée':'')+'</span><small class="binch-cal-role-count">'+esc(roles)+'</small></div>'+
   '<div class="binch-calendar-actions"><button type="button" data-cal-action="edit" data-cal-id="'+esc(x.id)+'">Modifier</button><button type="button" data-cal-action="copy" data-cal-id="'+esc(x.id)+'">Copier pour Discord</button><button type="button" data-cal-action="ics" data-cal-id="'+esc(x.id)+'">Ajouter à mon calendrier (.ics)</button><button type="button" data-cal-action="done" data-cal-id="'+esc(x.id)+'">'+(x.done?'Rouvrir':'Terminer')+'</button><button type="button" data-cal-action="delete" data-cal-id="'+esc(x.id)+'">Supprimer</button></div>'+
   '<details class="binch-cal-attendance" data-cal-open="'+esc(x.id)+'"><summary>Inscriptions · '+people.length+' membre(s)</summary><form class="binch-cal-signup" data-cal-signup="'+esc(x.id)+'"><input name="name" required maxlength="36" aria-label="Nom du personnage" placeholder="Personnage"/><select name="role" aria-label="Rôle">'+ROLES.map(v=>'<option>'+v+'</option>').join('')+'</select><select name="status" aria-label="Disponibilité">'+STATES.map(v=>'<option>'+v+'</option>').join('')+'</select><button type="submit">Ajouter / modifier</button></form>'+
   '<div class="binch-cal-attendees">'+(people.length?people.map(a=>'<div><span>'+esc(a.name)+' — '+esc(a.role)+' · '+esc(a.status)+'</span><button type="button" data-cal-event="'+esc(x.id)+'" data-cal-attendee-remove="'+esc(a.name)+'" aria-label="Retirer '+esc(a.name)+'">×</button></div>').join(''):'<p class="muted">Aucun inscrit : les inscriptions sont saisies manuellement, sur cet appareil.</p>')+'</div></details></article>';
  }).join(''):'<p class="muted">Aucune sortie dans cette vue.</p>';
  box.querySelectorAll('details.binch-cal-attendance').forEach(d=>{if(opened.has(d.dataset.calOpen))d.open=true});
 }
 render();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();

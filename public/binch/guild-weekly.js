/* La Binch — tableau hebdomadaire des sorties, données locales uniquement. */
(()=>{'use strict';
const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const read=(key,fall)=>{try{return JSON.parse(localStorage.getItem(key))??fall}catch{return fall}};
const days=7;
function currentEvents(){
 const raw=read('binch.guild.events.v1',[]);if(!Array.isArray(raw))return[];
 const now=new Date();now.setHours(0,0,0,0);
 const last=new Date(now);last.setDate(last.getDate()+days);
 return raw.filter(e=>e&&!e.done&&typeof e.date==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(e.date)&&typeof e.title==='string'&&typeof e.time==='string'&&Number.isInteger(e.size)&&e.size>=2&&e.size<=40&&new Date(e.date+'T00:00:00')>=now&&new Date(e.date+'T00:00:00')<last)
 .slice().sort((a,b)=>a.date.localeCompare(b.date)||a.time.localeCompare(b.time)).slice(0,35);
}
function metrics(event){
 const members=Array.isArray(event.attendees)?event.attendees.filter(x=>x&&x.status==='Confirmé'&&typeof x.name==='string'&&['Tank','Soigneur','DPS','Flexible'].includes(x.role)):[];
 const uncertain=Array.isArray(event.attendees)?event.attendees.filter(x=>x&&x.status==='Incertain').length:0;
 const count=members.length,tanks=members.filter(x=>x.role==='Tank').length,healers=members.filter(x=>x.role==='Soigneur').length;
 const isFive=event.size<=5;
 const flags=[];
 if(count===0)flags.push('Aucun membre confirmé');
 else if(count<event.size)flags.push((event.size-count)+' place(s) libres');
 else if(count>event.size)flags.push((count-event.size)+' participant(s) de trop');
 if(isFive&&tanks===0)flags.push('Tank à confirmer');
 if(isFive&&healers===0)flags.push('Soigneur à confirmer');
 if(uncertain)flags.push(uncertain+' réponse(s) incertaine(s)');
 return {count,tanks,healers,uncertain,flags};
}
function init(){
 const page=$('page-gm');if(!page||$('binch-guild-weekly'))return;
 const region=document.createElement('section');region.id='binch-guild-weekly';region.className='panel section';
 region.innerHTML='<div class="eyebrow">ÉTAT-MAJOR / PROCHAINS JOURS</div><h2>Cette semaine en guilde</h2>'+
 '<p class="muted">Une vue de coordination des sept prochains jours, à partir du calendrier local. Les membres inscrits sur un autre appareil ne sont pas visibles ici sans import.</p>'+
 '<div id="binch-weekly-summary" role="status" aria-live="polite"></div>'+
 '<div id="binch-weekly-list"></div>'+
 '<div class="binch-weekly-actions"><button type="button" id="binch-weekly-copy">Copier le briefing de la semaine</button><button type="button" id="binch-weekly-refresh">Actualiser</button></div>';
 const banner=$('binch-gm-hub');
 if(banner)banner.insertAdjacentElement('afterend',region);
 else page.prepend(region);
 region.addEventListener('click',e=>{
  if(!e.target.closest('[data-weekly-plan]'))return;
  const calendar=$('binch-guild-calendar');if(calendar)calendar.scrollIntoView({behavior:'smooth',block:'start'});
 });
 $('binch-weekly-refresh').onclick=render;
 $('binch-weekly-copy').onclick=async()=>{
  const events=currentEvents();
  const lines=['LA BINCH — BRIEFING DES 7 PROCHAINS JOURS','Données locales : confirmations à reconfirmer dans Discord et WoW',''];
  if(!events.length)lines.push('Aucune sortie enregistrée pour les sept prochains jours.');
  else for(const e of events){const m=metrics(e);lines.push(e.date.split('-').reverse().join('/')+' '+e.time+' — '+e.title+' ['+e.kind+']',m.count+'/'+e.size+' confirmés'+(m.uncertain?', '+m.uncertain+' incertain(s)':''),...(m.flags.length?m.flags.map(x=>'  • '+x):['  Prêt selon les confirmations enregistrées']),'');}
  const value=lines.join('\n');
  try{await navigator.clipboard.writeText(value);$('binch-weekly-copy').textContent='Briefing copié ✓'}catch{window.prompt('Copier le briefing',value)}
 };
 document.addEventListener('binch:calendar-change',render);
 window.addEventListener('storage',render);
 render();
}
function render(){
 if(!$('binch-weekly-list'))return;
 const events=currentEvents();
 const open=events.filter(e=>metrics(e).flags.length).length;
 const total=events.reduce((n,e)=>n+metrics(e).count,0);
 $('binch-weekly-summary').textContent=events.length+' sortie(s) dans les 7 jours · '+total+' inscription(s) confirmée(s) · '+open+' sortie(s) nécessitant une attention.';
 $('binch-weekly-list').innerHTML=events.length?events.map(e=>{
  const m=metrics(e);
  return '<article class="binch-weekly-event"><div><small>'+esc(e.date.split('-').reverse().join('/')+' · '+e.time+' · '+e.kind)+'</small><strong>'+esc(e.title)+'</strong><span>'+m.count+'/'+e.size+' confirmés</span></div><div class="binch-weekly-alerts">'+(m.flags.length?m.flags.map(f=>'<small>'+esc(f)+'</small>').join(''):'<small>Pas d’alerte de préparation selon les données locales</small>')+'</div><button type="button" data-weekly-plan="'+esc(e.id)+'">Préparer</button></article>';
 }).join(''):'<p class="muted">Aucune sortie dans les sept prochains jours. Programme un événement dans le calendrier de guilde.</p>';
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
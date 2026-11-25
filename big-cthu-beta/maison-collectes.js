/* Municipal public dates, no address or personal data. CCPA official 2026 calendar. */
(function(){'use strict';
function makeSchedule(){
 const months={ordures:[[2,9,16,23,30],[6,13,20,27],[6,13,20,27],[3,10,17,24,30],[7,15,22,29],[5,12,19,26],[3,10,17,24,31],[7,14,21,28],[4,11,18,25],[2,9,16,23,30],[6,13,20,27],[4,11,18,24,31]],tri:[[12,26],[9,23],[9,23],[7,20],[4,18],[1,15,29],[13,27],[10,24],[7,21],[5,19],[2,16,30],[14,28]]};
 return Object.entries(months).flatMap(([kind,ms])=>ms.flatMap((days,m)=>days.map(d=>({kind,date:'2026-'+String(m+1).padStart(2,'0')+'-'+String(d).padStart(2,'0')})))).sort((a,b)=>a.date.localeCompare(b.date));
}
function dayParis(now){const p=new Intl.DateTimeFormat('fr-FR',{timeZone:'Europe/Paris',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now);return ['year','month','day'].map(t=>p.find(x=>x.type===t).value).join('-')}
function shift(day,n){const d=new Date(day+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10)}
function upcoming(schedule,today){return schedule.filter(x=>x.date>=today).map(x=>({...x,evening:shift(x.date,-1)}))}
const schedule=makeSchedule();
const names={ordures:'Ordures ménagères',tri:'Tri sélectif'};
const fmt=d=>new Intl.DateTimeFormat('fr-FR',{weekday:'long',day:'numeric',month:'long',timeZone:'UTC'}).format(new Date(d+'T12:00:00Z'));
function el(tag,cls,value){const n=document.createElement(tag);if(cls)n.className=cls;if(value)n.textContent=value;return n}
function render(){const today=dayParis(new Date()),future=upcoming(schedule,today);for(const root of document.querySelectorAll('[data-cthu-collectes]')){const host=root.querySelector('[data-collectes-next]');if(!host)continue;host.replaceChildren();for(const kind of ['ordures','tri']){const x=future.find(e=>e.kind===kind);const row=el('div','cthu-collecte-row');const title=el('strong','', (kind==='ordures'?'🟢 ':'🟡 ')+names[kind]);row.append(title);if(x){row.append(el('span','',fmt(x.date)));const urgent=x.evening===today?'À sortir ce soir':x.date===today?'Collecte aujourd’hui':'À sortir '+fmt(x.evening)+' au soir';row.append(el('small',x.evening===today||x.date===today?'cthu-collecte-urgent':'',urgent))}else row.append(el('small','','Prochaine date à confirmer avec le calendrier 2027.'));host.append(row)}const detail=root.querySelector('[data-collectes-list]');if(detail){detail.replaceChildren();for(const x of future){const li=el('li','',fmt(x.date)+' · '+names[x.kind]+' — sortie '+fmt(x.evening)+' au soir');detail.append(li)}if(!future.length)detail.append(el('li','','Aucune autre date officielle disponible pour 2026.'))}}}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',render,{once:true});else render();window.addEventListener('pageshow',render);document.addEventListener('visibilitychange',()=>{if(!document.hidden)render()});setInterval(()=>{if(!document.hidden)render()},60000);
})();

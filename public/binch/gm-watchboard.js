/* La Binch · GM watchboard. Reads local guild registers; no shared-state claims. */
(()=>{'use strict';
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const read=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key))??fallback}catch{return fallback}};
const num=(n)=>Number.isSafeInteger(Number(n))&&Number(n)>=0?Number(n):0;
const text=(s,n=90)=>String(s??'').trim().slice(0,n);
const stamp=e=>{const d=new Date(String(e.date||'')+'T'+String(e.time||'00:00')+':00');return Number.isFinite(+d)?+d:Infinity};
function snapshot(){
 const now=Date.now(),events=read('binch.guild.events.v1',[]),planner=read('binch.guild.planner.v1',{}),bank=read('binch.guild.bank.v1',[]);
 const upcoming=(Array.isArray(events)?events:[]).filter(e=>e&&!e.done&&typeof e.date==='string'&&stamp(e)>=now-60000).sort((a,b)=>stamp(a)-stamp(b)).slice(0,8);
 const requests=(Array.isArray(planner.requests)?planner.requests:[]).filter(r=>r&&!r.closed&&text(r.title)).sort((a,b)=>Number(b.priority==='urgent')-Number(a.priority==='urgent')||Date.parse(a.deadline||'9999')-Date.parse(b.deadline||'9999')).slice(0,12);
 const resources=(Array.isArray(bank)?bank:[]).filter(r=>r&&text(r.item)&&num(r.count)>0);
 const delegated=read('binch.guild.delegations.v1',[]),tasks=(Array.isArray(delegated)?delegated:[]).filter(x=>x&&x.status!=='done');
 const overdue=requests.filter(r=>r.deadline&&Number.isFinite(Date.parse(r.deadline))&&Date.parse(r.deadline)<now);
 const fulfillment=requests.map(r=>({id:r.id,title:r.title,needed:num(r.quantity),received:(Array.isArray(r.contributions)?r.contributions:[]).filter(c=>c.status==='confirmed').reduce((n,c)=>n+num(c.quantity),0)}));
 return {upcoming,requests,resources,overdue,fulfillment,tasks};
}
function roleCounts(e){
 const confirmed=(Array.isArray(e.attendees)?e.attendees:[]).filter(a=>a?.status==='Confirmé');
 const count=role=>confirmed.filter(a=>a.role===role).length;
 return {tank:count('Tank'),heal:count('Soigneur'),dps:count('DPS'),flex:count('Flexible'),total:confirmed.length};
}
function missing(e){
 const c=roleCounts(e),size=Math.max(2,Math.min(40,num(e.size)||5));
 return {c,size,slots:Math.max(0,size-c.total),tank:Math.max(0,1-c.tank),heal:Math.max(0,1-c.heal)};
}
function summary(s){
 const lines=['LA BINCH · RAPPORT GM (brouillon local)','Données sur cet appareil, non synchronisées entre membres.',''];
 if(!s.upcoming.length)lines.push('Sorties : aucune à venir dans le calendrier local.');
 for(const e of s.upcoming.slice(0,5)){
  const m=missing(e);
  lines.push('• '+text(e.title)+' — '+e.date+' '+text(e.time,5)+' | '+m.c.total+'/'+m.size+' confirmés | '+m.slots+' places non confirmées | tanks '+m.c.tank+', soins '+m.c.heal+', DPS '+m.c.dps+', flex '+m.c.flex);
 }
 lines.push('',s.requests.length?'Demandes ouvertes :':'Aucune demande ouverte dans le Planner local.');
 for(const r of s.requests.slice(0,7))lines.push('• '+text(r.title)+' · reçus '+(s.fulfillment.find(f=>f.id===r.id)?.received||0)+' / '+num(r.quantity)+(r.priority==='urgent'?' [URGENT]':'')+(r.deadline?' · échéance '+new Date(r.deadline).toLocaleDateString('fr-FR'):''));
 lines.push('','Délégations ouvertes : '+s.tasks.length);for(const t of s.tasks.slice(0,5))lines.push('• '+text(t.title)+' — '+text(t.owner||'Non attribué')+' — '+text(t.due||'Sans échéance'));lines.push('','Coffre : '+s.resources.length+' ligne(s) déclarée(s), à confirmer avec les propriétaires.','Copie manuelle pour Discord ; aucun message publié automatiquement.');
 return lines.join('\n');
}
function render(){
 const host=$('binch-gm-watch');if(!host||!host.isConnected)return;
 const s=snapshot(),next=s.upcoming[0],urgent=s.requests.filter(r=>r.priority==='urgent').length;
 $('binch-gm-watch-stats').innerHTML='<div><b>'+s.upcoming.length+'</b><span>sortie(s) à venir</span></div><div><b>'+s.requests.length+'</b><span>demande(s) ouverte(s)</span></div><div><b>'+urgent+'</b><span>urgence(s) déclarée(s)</span></div><div><b>'+s.resources.length+'</b><span>ligne(s) de coffre</span></div>';
 const target=$('binch-gm-watch-list');
 target.innerHTML=next?s.upcoming.slice(0,4).map(e=>{
  const m=missing(e),hours=new Date(stamp(e)).toLocaleString('fr-FR',{dateStyle:'medium',timeStyle:'short'});
  return '<article class="binch-gm-watch-event"><div><strong>'+esc(text(e.title))+'</strong><small>'+esc(hours)+' · '+m.c.total+'/'+m.size+' confirmés localement · '+m.slots+' place(s) non confirmée(s)</small><small>Tank '+m.c.tank+' · Soins '+m.c.heal+' · DPS '+m.c.dps+' · Flex '+m.c.flex+'</small></div><button type="button" data-gm-watch-open="calendar">Gérer</button></article>';
 }).join(''):'<p>Aucune sortie à venir dans le calendrier local. Ajoute un rendez-vous avant de convoquer les joueurs.</p>';
 $('binch-gm-watch-urgent').innerHTML=s.requests.length?s.requests.slice(0,5).map(r=>'<article><strong>'+esc(text(r.title))+'</strong><span>'+Math.min(num(r.quantity),s.fulfillment.find(f=>f.id===r.id)?.received||0)+' / '+num(r.quantity)+' réception(s) confirmée(s) manuellement'+(r.priority==='urgent'?' · Urgent':'')+(r.deadline&&Number.isFinite(Date.parse(r.deadline))?' · échéance '+esc(new Date(r.deadline).toLocaleDateString('fr-FR'))+(Date.parse(r.deadline)<Date.now()?' (dépassée)':''):'')+'</span></article>').join(''):'<p>Aucune demande ouverte dans le Planner local.</p>';
}
function navigate(destination){
 if(destination==='calendar'){const element=document.getElementById('binch-guild-calendar');if(element){element.scrollIntoView({behavior:'smooth',block:'start'});return}}
 if(destination==='planner'){const element=document.getElementById('binch-guild-planner');if(element){element.open=true;element.scrollIntoView({behavior:'smooth',block:'start'});return}}
 if(destination==='delegations'){const node=$('binch-gm-delegations');if(node){node.scrollIntoView({behavior:'smooth',block:'start'});return}}
 if(destination==='coffre'){document.querySelector('#app nav.nav [data-page="coffre"]')?.click();return}
 document.querySelector('#app nav.nav [data-page="gm"]')?.click();
}
function mount(){
 const home=$('binch-gm-hub');if(!home||$('binch-gm-watch'))return false;
 const box=document.createElement('section');box.id='binch-gm-watch';box.className='binch-gm-watch';
 box.innerHTML='<header><div><div class="eyebrow">BRIEFING EXPRESS · INFORMATIONS LOCALES</div><h2>Tableau de garde du maître de guilde</h2><p>Prochaines sorties, confirmations, demandes et ressources déclarées. Aucun statut en direct sans service partagé.</p></div><button type="button" id="binch-gm-watch-copy">Copier le briefing Discord</button></header><div id="binch-gm-watch-stats"></div><div class="binch-gm-watch-grid"><div><h3>Sorties à préparer</h3><div id="binch-gm-watch-list"></div></div><div><h3>Demandes ouvertes</h3><div id="binch-gm-watch-urgent"></div><button type="button" data-gm-watch-open="planner">Ouvrir le Planner</button><button type="button" data-gm-watch-open="coffre">Voir le coffre</button><button type="button" data-gm-watch-open="delegations">Gérer les délégations</button></div></div><p class="binch-gm-watch-status" id="binch-gm-watch-status" role="status" aria-live="polite"></p>';
 home.querySelector('.binch-gm-menu')?.before(box);
 box.addEventListener('click',e=>{const b=e.target.closest('[data-gm-watch-open]');if(b)navigate(b.dataset.gmWatchOpen)});
 $('binch-gm-watch-copy').onclick=async()=>{const value=summary(snapshot());try{if(!navigator.clipboard?.writeText)throw Error('Clipboard unavailable');await navigator.clipboard.writeText(value);$('binch-gm-watch-status').textContent='Briefing copié, à coller dans Discord.'}catch{window.prompt('Copier pour Discord',value)}};
 document.addEventListener('binch:calendar-change',render);
 document.addEventListener('binch:planner-change',render);
 document.addEventListener('binch:chest-change',render);
 document.addEventListener('binch:delegations-change',render);
 window.addEventListener('storage',e=>{if(['binch.guild.events.v1','binch.guild.planner.v1','binch.guild.bank.v1','binch.guild.delegations.v1'].includes(e.key))render()});
 const tab=document.querySelector('#app nav.nav [data-page="gm"]');tab?.addEventListener('click',render);
 render();return true;
}
function start(){if(mount())return;const app=$('app');if(!app)return;const observer=new MutationObserver(()=>{if(mount())observer.disconnect()});observer.observe(app,{childList:true,subtree:true});setTimeout(()=>observer.disconnect(),12000)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
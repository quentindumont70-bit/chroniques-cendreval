/* La Binch — Quartier général express, tout local et consultable mobile. */
(()=>{'use strict';
const KEY='binch.gm.quick.v2',OLD='binch.gm.quick.v1',CHECK='binch.gm.tasks.v1';
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const read=(k)=>{try{return JSON.parse(localStorage.getItem(k))||{}}catch{return {}}};
const css=document.createElement('link');css.rel='stylesheet';css.href='./gm-quick.css';document.head.append(css);
const TASKS=['Date et objectif communiqués','Rôles principaux confirmés','Remplaçant ou plan B désigné','Consommables / réparations rappelés','Stratégies et accès communiqués','Officiers informés des délégations'];
function data(){const out={};document.querySelectorAll('#binch-gm-quick [data-gm-field]').forEach(x=>out[x.dataset.gmField]=x.value);return out}
function save(){const d=data();try{localStorage.setItem(KEY,JSON.stringify(d))}catch{}render(d)}
function numeric(v){return Math.max(0,Math.min(100,Number(v)||0))}
function render(d=data()){
const t=numeric(d.tanks),h=numeric(d.heals),p=numeric(d.dps),reserve=numeric(d.bench),total=t+h+p;
const missing=[];if(!t)missing.push('tank');if(!h)missing.push('soin');if(!p)missing.push('DPS');
const checked=read(CHECK),complete=TASKS.filter((_,i)=>checked[i]).length;
const summary=$('#binch-gm-quick-summary');if(!summary)return;
summary.innerHTML='<article><small>PROCHAINE SORTIE</small><strong>'+esc(d.event||'À préparer')+'</strong><span>'+esc(d.date||'Horaire à définir')+'</span></article>'+
'<article><small>PARTICIPANTS DÉCLARÉS</small><strong>'+t+' / '+h+' / '+p+'</strong><span>'+total+' membres + '+reserve+' remplaçant(s)</span></article>'+
'<article class="'+(missing.length?'warning':'ready')+'"><small>PROCHAINE ACTION</small><strong>'+(missing.length?'Trouver '+esc(missing.join(', ')):(complete<TASKS.length?'Finaliser les préparatifs':'Brief prêt'))+'</strong><span>'+complete+'/'+TASKS.length+' préparatifs cochés</span></article>';
const progress=$('#binch-gm-check-count');if(progress)progress.textContent=complete+' / '+TASKS.length;
const bar=$('#binch-gm-check-progress');if(bar)bar.style.width=(complete/TASKS.length*100)+'%';
}
function text(officers=false){const d=data(),t=numeric(d.tanks),h=numeric(d.heals),p=numeric(d.dps),r=numeric(d.bench);
const lines=['⚔ LA BINCH — '+(d.event||'Prochaine sortie'),'Quand : '+(d.date||'À préciser'),'Effectif : '+t+' tank · '+h+' heal · '+p+' DPS · '+r+' remplaçant(s)','Objectif : '+(d.objective||'À préciser'),'Rendez-vous : '+(d.meet||'À définir'),'Répondez avec votre personnage, votre rôle et votre disponibilité.'];
if(officers){const checks=read(CHECK);lines.push('','CHECKLIST :');TASKS.forEach((item,i)=>lines.push((checks[i]?'[OK] ':'[ ] ')+item));lines.push('Délégations : '+(d.delegate||'À répartir'));lines.push('Note : '+(d.note||'Aucune'))}
return lines.join('\n')}
async function copy(button,officers=false){save();const output=text(officers);try{await navigator.clipboard.writeText(output);const previous=button.textContent;button.textContent='Copié ✓';setTimeout(()=>{button.textContent=previous},1800)}catch{prompt('Copie ce texte :',output)}}
function mount(){const hub=$('#binch-gm-hub');if(!hub||$('#binch-gm-quick'))return;
const legacy=read(OLD),d={...legacy,...read(KEY)},box=document.createElement('section');box.id='binch-gm-quick';
box.innerHTML='<header><div><div class="eyebrow">QUARTIER GÉNÉRAL · MODE EXPRESS · LOCAL</div><h2>Une soirée prête en cinq minutes</h2><p class="binch-gm-intro">Entre deux déplacements, prépare le strict nécessaire et délègue ce qui peut l’être.</p></div><div class="binch-gm-command-actions"><button type="button" id="binch-gm-copy">Copier l’annonce Discord</button><button type="button" id="binch-gm-officers">Briefing officiers</button></div></header>'+
'<div class="binch-gm-quick-form">'+
'<label>Événement<input data-gm-field="event" maxlength="100" placeholder="Ex. : raid découverte"></label>'+
'<label>Date / heure<input data-gm-field="date" type="datetime-local"></label>'+
'<label>Tanks<input data-gm-field="tanks" type="number" min="0" max="100" value="0"></label>'+
'<label>Soins<input data-gm-field="heals" type="number" min="0" max="100" value="0"></label>'+
'<label>DPS<input data-gm-field="dps" type="number" min="0" max="100" value="0"></label>'+
'<label>Remplaçants<input data-gm-field="bench" type="number" min="0" max="100" value="0"></label>'+
'<label>Objectif<input data-gm-field="objective" maxlength="140" placeholder="Boss, donjon, progression..."></label>'+
'<label>Rendez-vous<input data-gm-field="meet" maxlength="100" placeholder="Pierre, vocal, capitale..."></label>'+
'<label>Délégation<input data-gm-field="delegate" maxlength="180" placeholder="Officier : tâche"></label>'+
'<label>Notes privées<textarea data-gm-field="note" rows="2" maxlength="600" placeholder="Préparatifs, plan B, points de vigilance"></textarea></label></div>'+
'<div id="binch-gm-quick-summary" aria-live="polite"></div>'+
'<div class="binch-gm-preflight"><div class="binch-gm-preflight-head"><h3>Prêt pour le départ ?</h3><span id="binch-gm-check-count"></span></div><div class="binch-gm-preflight-track"><span id="binch-gm-check-progress"></span></div><div class="binch-gm-check-grid">'+TASKS.map((task,i)=>'<label><input type="checkbox" data-gm-task="'+i+'"><span>'+esc(task)+'</span></label>').join('')+'</div></div>'+
'<p class="binch-gm-privacy">Ce hub fonctionne hors connexion, n’interroge pas le roster WoW et ne publie rien sur Discord automatiquement. Les nombres et présences sont déclaratifs et enregistrés sur cet appareil uniquement.</p>';
hub.querySelector('.binch-gm-banner')?.after(box);if(!box.parentNode)hub.prepend(box);
box.querySelectorAll('[data-gm-field]').forEach(x=>{x.value=d[x.dataset.gmField]??x.value;x.addEventListener('input',save)});
const checked=read(CHECK);box.querySelectorAll('[data-gm-task]').forEach(x=>{x.checked=!!checked[x.dataset.gmTask];x.addEventListener('change',()=>{const v=read(CHECK);v[x.dataset.gmTask]=x.checked;localStorage.setItem(CHECK,JSON.stringify(v));render()})});
$('#binch-gm-copy').onclick=e=>copy(e.currentTarget,false);$('#binch-gm-officers').onclick=e=>copy(e.currentTarget,true);render();
}
const start=()=>setTimeout(mount,80);if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
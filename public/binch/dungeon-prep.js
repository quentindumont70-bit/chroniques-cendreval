/* La Binch — préparation de donjon, locale, sans synchronisation WoW. */
(()=>{'use strict';
const KEY='binch.dungeon.prep.v1',ROSTER='binch.guild.roster.v1',EVENTS='binch.guild.events.v1';
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const TASKS=[
 ['roles','Groupe confirmé : tank, soigneur et DPS'],
 ['quests','Quêtes du donjon récupérées et partagées'],
 ['gear','Équipement réparé et sac suffisamment vide'],
 ['consumables','Eau, nourriture, potions et composants prêts'],
 ['meeting','Point de rendez-vous et horaires communiqués'],
 ['strategies','Boss et mécaniques étudiés (si sources fiables)'],
 ['loot','Règles de butin décidées avant de partir']
];
let state={dungeon:'',notes:{},checked:{}},selected='',search='';
function read(key,fallback){try{return JSON.parse(localStorage.getItem(key))??fallback}catch{return fallback}}
function safe(){const d=read(KEY,{});state={dungeon:typeof d.dungeon==='string'?d.dungeon.slice(0,120):'',notes:d.notes&&typeof d.notes==='object'&&!Array.isArray(d.notes)?d.notes:{},checked:d.checked&&typeof d.checked==='object'&&!Array.isArray(d.checked)?d.checked:{}};selected=state.dungeon}
function save(){localStorage.setItem(KEY,JSON.stringify(state))}
function catalog(){return Array.isArray(window.GRIMOIRE_DUNGEONS)?window.GRIMOIRE_DUNGEONS.filter(d=>d&&typeof d.name==='string'&&d.name.length<=120):[]}
function members(){const r=read(ROSTER,{});return Array.isArray(r.members)?r.members.filter(m=>m&&m.status==='Confirmé'&&m.group>0&&m.group<=8):[]}
function events(){const data=read(EVENTS,[]);return Array.isArray(data)?data.filter(e=>e&&!e.done&&typeof e.date==='string'&&typeof e.title==='string'):[]}
function matchingEvents(d){const today=new Date();today.setHours(0,0,0,0);return events().filter(e=>e.title.toLocaleLowerCase('fr').includes(d.name.toLocaleLowerCase('fr'))&&new Date(e.date+'T00:00:00')>=today).sort((a,b)=>a.date.localeCompare(b.date)||a.time.localeCompare(b.time)).slice(0,3)}
function eventMembers(e){return Array.isArray(e.attendees)?e.attendees.filter(a=>a&&a.status==='Confirmé'&&typeof a.name==='string'&&['Tank','Soigneur','DPS','Flexible'].includes(a.role)).slice(0,40):[]}
function current(){return catalog().find(d=>d.name===selected)}
function key(){return encodeURIComponent(selected)}
function check(){const v=state.checked[key()];return v&&typeof v==='object'&&!Array.isArray(v)?v:{}}
function note(){const n=state.notes[key()];return typeof n==='string'?n.slice(0,500):''}
function init(){
 const host=$('page-gm');if(!host||$('binch-dungeon-prep'))return;
 safe();
 const section=document.createElement('section');section.id='binch-dungeon-prep';section.className='panel section';
 section.innerHTML='<div class="eyebrow">LA BINCH / PRÉPARATION DES INSTANCES</div><h2>Préparer un donjon</h2>'+
 '<p class="muted">Sélectionne un donjon depuis le catalogue disponible, puis prépare ta sortie. Les niveaux proviennent de l’index existant ; les stratégies et tables de butin non vérifiées ne sont pas inventées.</p>'+
 '<div class="binch-dungeon-controls"><label>Rechercher un donjon<input id="binch-dungeon-search" type="search" placeholder="Nom, zone, continent"></label><label>Instance<select id="binch-dungeon-select"><option value="">Choisir un donjon</option></select></label></div>'+
 '<div id="binch-dungeon-info" class="binch-dungeon-info"></div>'+
 '<section class="binch-dungeon-checks"><h3>Checklist avant le départ</h3><div id="binch-dungeon-checklist"></div></section>'+
 '<label class="binch-dungeon-notes">Notes de préparation<textarea id="binch-dungeon-note" maxlength="500" rows="3" placeholder="Quêtes à prendre, chemin, rendez-vous, consignes de guilde…"></textarea></label>'+
 '<div id="binch-dungeon-roster"></div><div id="binch-dungeon-events"></div>'+
 '<div class="binch-dungeon-actions"><button type="button" id="binch-dungeon-copy">Copier le briefing Discord</button><button type="button" id="binch-dungeon-clear">Réinitialiser ce donjon</button></div><p id="binch-dungeon-status" role="status" aria-live="polite"></p>';
 const calendar=$('binch-guild-calendar');if(calendar)calendar.insertAdjacentElement('afterend',section);
 else host.append(section);
 const searchInput=$('binch-dungeon-search'),select=$('binch-dungeon-select');
 function options(){
  const filtered=catalog().filter(d=>[d.name,d.zone,d.continent].join(' ').toLocaleLowerCase('fr').includes(search));
  select.innerHTML='<option value="">Choisir un donjon ('+filtered.length+')</option>'+filtered.map(d=>'<option value="'+esc(d.name)+'"'+(d.name===selected?' selected':'')+'>'+esc(d.name)+'</option>').join('');
  if(selected&&!filtered.some(d=>d.name===selected))select.insertAdjacentHTML('beforeend','<option value="'+esc(selected)+'" selected>'+esc(selected)+' (hors filtre)</option>');
 }
 searchInput.oninput=()=>{search=searchInput.value.trim().toLocaleLowerCase('fr');options()};
 select.onchange=()=>{selected=select.value;state.dungeon=selected;save();render()};
 $('binch-dungeon-checklist').addEventListener('change',e=>{
  const input=e.target.closest('input[data-dungeon-task]');if(!input||!selected)return;
  const all=state.checked[key()]||{};all[input.dataset.dungeonTask]=input.checked;state.checked[key()]=all;save();render();
 });
 $('binch-dungeon-note').oninput=e=>{if(!selected)return;state.notes[key()]=e.target.value.slice(0,500);save()};
 $('binch-dungeon-clear').onclick=()=>{
  if(!selected||!confirm('Effacer la checklist et les notes de « '+selected+' » ?'))return;
  delete state.checked[key()];delete state.notes[key()];save();render()
 };
 $('binch-dungeon-copy').onclick=async()=>{
  const d=current();if(!d)return;
  const done=check(),level=Array.isArray(d.levels)?d.levels.join('–'):'À confirmer';
  const lines=['LA BINCH — BRIEFING DONJON',d.name,'Zone : '+(d.zone||'à confirmer')+' · Niveaux indicatifs : '+level,'',
    ...TASKS.map(([id,t])=>(done[id]?'[x] ':'[ ] ')+t)];
  if(note().trim())lines.push('','Notes : '+note().trim());
  const outing=matchingEvents(d)[0];const roster=outing?eventMembers(outing):members();if(roster.length)lines.push('','Effectifs confirmés'+(outing?' pour la sortie '+outing.date:' du registre général')+' :',...roster.map(m=>(outing?'':('G'+m.group+' · '))+m.name+' — '+m.role));
  lines.push('','Données d’instance indicatives. Vérifier les particularités de WoW Forever en jeu.');
  try{await navigator.clipboard.writeText(lines.join('\n'));$('binch-dungeon-status').textContent='Briefing copié pour Discord.'}
  catch{window.prompt('Copier le briefing',lines.join('\n'))}
 };
 function render(){
  options();
  const d=current(),checks=check();
  $('binch-dungeon-note').value=note();
  if(!d){
   $('binch-dungeon-info').textContent='Sélectionne une instance du catalogue pour préparer ta sortie.';
   $('binch-dungeon-checklist').innerHTML='';
   $('binch-dungeon-roster').innerHTML='';
   $('binch-dungeon-events').innerHTML='';
   $('binch-dungeon-copy').disabled=true;
   return;
  }
  $('binch-dungeon-copy').disabled=false;
  const levels=Array.isArray(d.levels)?d.levels.join('–'):'non confirmés';
  $('binch-dungeon-info').innerHTML='<h3>'+esc(d.name)+'</h3><p>'+esc(d.zone||'Zone inconnue')+' · '+esc(d.continent||'')+' · Niveaux indicatifs '+esc(levels)+'</p><small>Aucune stratégie de boss ou table de butin présentée comme vérifiée sans source.</small>';
  $('binch-dungeon-checklist').innerHTML=TASKS.map(([id,text])=>'<label><input type="checkbox" data-dungeon-task="'+id+'"'+(checks[id]?' checked':'')+'> <span>'+esc(text)+'</span></label>').join('');
  const count=TASKS.filter(([id])=>checks[id]).length;
  $('binch-dungeon-status').textContent=count+' / '+TASKS.length+' préparatifs effectués · sauvegarde locale.';
  const upcoming=matchingEvents(d),outing=upcoming[0],roster=outing?eventMembers(outing):members();
  const groups=[...new Set(roster.map(m=>Number(m.group)||0))].sort((a,b)=>a-b);
  const title=outing?'Effectifs confirmés pour la sortie du '+outing.date:'Effectifs du registre général';
  $('binch-dungeon-roster').innerHTML='<h3>'+title+'</h3>'+(groups.length?groups.map(g=>'<p>'+(g?'Groupe '+g+' : ':'Participants : ')+roster.filter(m=>(Number(m.group)||0)===g).map(m=>esc(m.name)+' ('+esc(m.role)+')').join(', ')+'</p>').join(''):'<p class="muted">Aucun membre confirmé : ajoute les inscriptions à la sortie dans le calendrier GM.</p>');
  $('binch-dungeon-events').innerHTML=upcoming.length?'<h3>Sorties déjà prévues</h3>'+upcoming.map(e=>'<p>'+esc(e.date)+' à '+esc(e.time)+' — '+esc(e.title)+' · '+eventMembers(e).length+'/'+Number(e.size||0)+' confirmés</p>').join(''):'';
 }
 options();render();
 document.addEventListener('binch:roster-change',render);
 document.addEventListener('binch:calendar-change',render);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();

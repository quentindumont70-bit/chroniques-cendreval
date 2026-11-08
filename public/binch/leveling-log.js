/* La Binch — journal de progression manuel, indépendant de GrimoireSync. */
(()=>{'use strict';
const PREFIX='binch.leveling.log.v1.',$=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function read(k,f){try{return JSON.parse(localStorage.getItem(k))??f}catch{return f}}
function profile(){const p=read('grimoire.hub.v3',{});return{name:String(p.data?.pseudo||'Aventurier').trim(),cls:p.classe||'',race:p.race||'',level:Math.max(1,Math.min(60,Number(p.data?.level)||1))}}
function key(p){return PREFIX+[p.name,p.race,p.cls].map(s=>encodeURIComponent(String(s).toLocaleLowerCase('fr'))).join('.')}
function valid(x){return x&&Number.isInteger(x.level)&&x.level>=1&&x.level<=60&&typeof x.when==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(x.when)&&!Number.isNaN(Date.parse(x.when+'T00:00:00'))&&typeof x.note==='string'&&x.note.length<=240&&typeof x.zone==='string'&&x.zone.length<=100&&Number.isInteger(x.minutes)&&x.minutes>=0&&x.minutes<=1440}
let loadedKey='',entries=[],show='recent';
function load(p){const k=key(p);if(k===loadedKey)return;loadedKey=k;const v=read(k,[]);entries=Array.isArray(v)?v.slice(0,240).filter(valid).map(x=>({id:String(x.id||''),when:x.when,level:x.level,minutes:x.minutes,zone:x.zone,note:x.note})):[]}
function save(){localStorage.setItem(loadedKey,JSON.stringify(entries))}
function date(){const d=new Date();return[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-')}
function init(){
 const hub=$('page-hub');if(!hub||$('binch-leveling-journal'))return;
 const box=document.createElement('section');box.id='binch-leveling-journal';box.className='panel section';
 box.innerHTML='<div class="eyebrow">LA BINCH / CHRONIQUES DU LEVELING</div><h2>Journal de progression</h2>'+
 '<p class="muted">Consigne tes sessions et tes niveaux atteints sans addon. Les durées sont celles que tu saisis toi-même ; aucune estimation d’XP ou synchronisation automatique.</p>'+
 '<form id="binch-level-log-form" class="binch-level-log-form">'+
 '<label>Date<input name="when" type="date" required></label>'+
 '<label>Niveau atteint<input name="level" type="number" min="1" max="60" required></label>'+
 '<label>Durée jouée (minutes)<input name="minutes" type="number" min="0" max="1440" value="60" required></label>'+
 '<label>Zone / activité<input name="zone" maxlength="100" placeholder="Ex. : Mulgore"></label>'+
 '<label class="binch-level-log-note">Bilan de session<textarea name="note" maxlength="240" rows="2" placeholder="Quêtes, métiers, découvertes…"></textarea></label>'+
 '<button type="submit">Enregistrer ma session</button></form>'+
 '<div id="binch-level-log-summary" aria-live="polite" role="status"></div><div id="binch-level-log-insights" class="binch-level-log-insights"></div>'+
 '<div class="binch-level-log-actions"><button type="button" data-level-log-view="recent">Dernières sessions</button><button type="button" data-level-log-view="all">Toutes</button><button type="button" id="binch-level-log-export">Exporter JSON</button><label class="binch-level-log-import-label">Importer JSON<input id="binch-level-log-import" type="file" accept=".json,application/json" hidden></label></div>'+
 '<div id="binch-level-log-list"></div>';
 const plan=$('binch-session-planner');
 if(plan)plan.insertAdjacentElement('afterend',box);else hub.append(box);
 const form=$('binch-level-log-form');form.elements.namedItem('when').value=date();
 const p=profile();form.elements.namedItem('level').value=p.level;load(p);
 form.onsubmit=e=>{
  e.preventDefault();load(profile());
  if(entries.length>=240){alert('Limite de 240 sessions atteinte. Exporte le journal avant de faire de la place.');return;}
  const d=new FormData(form);
  const x={id:Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,9),when:String(d.get('when')),level:Number(d.get('level')),minutes:Number(d.get('minutes')),zone:String(d.get('zone')||'').trim(),note:String(d.get('note')||'').trim()};
  if(!valid(x)){alert('Date, niveau ou durée invalide.');return;}
  entries.push(x);save();form.elements.namedItem('note').value='';render()
 };
 box.addEventListener('click',e=>{
  const view=e.target.closest('[data-level-log-view]');if(view){show=view.dataset.levelLogView;render();return;}
  const del=e.target.closest('[data-level-log-remove]');if(!del)return;
  const item=entries.find(x=>x.id===del.dataset.levelLogRemove);if(!item)return;
  if(confirm('Supprimer cette session du '+item.when+' ?')){entries=entries.filter(x=>x!==item);save();render()}
 });
 $('binch-level-log-export').onclick=()=>{
  load(profile());const data={format:'binch-leveling-journal-v1',character:loadedKey.slice(PREFIX.length),entries:entries.map(({when,level,minutes,zone,note})=>({when,level,minutes,zone,note}))};
  const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download='la-binch-journal-leveling.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1500);
 };
 $('binch-level-log-import').onchange=async e=>{
  const file=e.target.files?.[0];e.target.value='';if(!file)return;
  if(file.size>150000){alert('Journal trop volumineux.');return;}
  try{
   const data=JSON.parse(await file.text());
   if(data.format!=='binch-leveling-journal-v1'||!Array.isArray(data.entries)||data.entries.length>240)throw Error('Format non reconnu');
   const incoming=data.entries.map(x=>{if(!valid(x))throw Error('Session invalide');return{when:x.when,level:x.level,minutes:x.minutes,zone:x.zone,note:x.note}});
   load(profile());
   if(data.character!==loadedKey.slice(PREFIX.length)&&!confirm('Journal d’un autre personnage : l’importer dans le profil actuel ?'))return;
   const fingerprint=x=>[x.when,x.level,x.minutes,x.zone,x.note].join('\t');
   const seen=new Set(entries.map(fingerprint));
   const fresh=incoming.filter(x=>{const k=fingerprint(x);if(seen.has(k))return false;seen.add(k);return true}).slice(0,240-entries.length);
   if(!fresh.length){alert('Aucune nouvelle session à importer.');return;}
   if(!confirm('Ajouter '+fresh.length+' sessions sans effacer le journal actuel ?'))return;
   entries.push(...fresh.map(x=>({...x,id:Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,9)})));save();render();
  }catch(err){alert('Import impossible : '+err.message)}
 };
 document.addEventListener('grimoire:sync',render);
 window.addEventListener('storage',render);
 render();
}
function render(){
 if(!$('binch-level-log-list'))return;
 const p=profile(),previous=loadedKey;load(p);
 if(previous!==loadedKey){$('binch-level-log-form').elements.namedItem('level').value=p.level;}
 const list=entries.slice().sort((a,b)=>b.when.localeCompare(a.when)||b.id.localeCompare(a.id));
 const total=entries.reduce((sum,x)=>sum+x.minutes,0);
 const max=entries.length?Math.max(...entries.map(x=>x.level)):null;
 const days=new Set(entries.map(x=>x.when)).size;
 $('binch-level-log-summary').textContent=entries.length+' session(s) consignées · '+days+' jour(s) distinct(s) · '+(Math.round(total/60*10)/10).toLocaleString('fr-FR')+' h déclarées'+(max!==null?' · niveau max consigné : '+max:'')+'.';
 const zones=new Map();for(const x of entries){const label=x.zone.trim()||'Zone non indiquée';const value=zones.get(label)||{mins:0,count:0};value.mins+=x.minutes;value.count++;zones.set(label,value)}
 const popular=[...zones.entries()].sort((a,b)=>b[1].mins-a[1].mins).slice(0,4);
 const uniqueLevels=[...new Set(entries.map(x=>x.level))].sort((a,b)=>a-b);
 const first=uniqueLevels.length?uniqueLevels[0]:null,last=uniqueLevels.length?uniqueLevels[uniqueLevels.length-1]:null;
 const trend=first!==null&&last!==null&&last>first?'Niveaux consignés de '+first+' à '+last:'Pas assez de niveaux distincts pour dégager une progression.';
 $('binch-level-log-insights').innerHTML=popular.length?
 '<div class="binch-level-insight-head"><strong>Répartition du temps déclaré par zone</strong><small>'+esc(trend)+'</small></div>'+
 popular.map(([name,stat])=>'<div class="binch-level-insight"><span>'+esc(name)+'</span><div class="binch-level-insight-track"><i style="width:'+(total>0?(100*stat.mins/total).toFixed(1):'0')+'%"></i></div><small>'+(Math.round(stat.mins/60*10)/10).toLocaleString('fr-FR')+' h · '+stat.count+' session(s)</small></div>').join(''):
 '<p class="muted">Les statistiques par zone apparaîtront après tes premières sessions.</p>';
 boxButtons();
 const shown=show==='recent'?list.slice(0,7):list;
 $('binch-level-log-list').innerHTML=shown.length?shown.map(x=>'<article class="binch-level-log-entry"><div><small>'+esc(x.when)+' · '+x.minutes+' min'+(x.zone?' · '+esc(x.zone):'')+'</small><strong>Niveau '+x.level+'</strong>'+(x.note?'<p>'+esc(x.note)+'</p>':'')+'</div><button type="button" data-level-log-remove="'+esc(x.id)+'" aria-label="Supprimer cette session">×</button></article>').join(''):'<p class="muted">Aucune session consignée. Commence par une première entrée.</p>';
}
function boxButtons(){document.querySelectorAll('[data-level-log-view]').forEach(b=>b.classList.toggle('active',b.dataset.levelLogView===show))}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
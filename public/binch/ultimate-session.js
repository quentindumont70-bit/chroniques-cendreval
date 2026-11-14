/* La Binch Ultimate — optional per-character session plan.
   A local checklist, NOT a real WoW quest-completion signal. */
(()=>{'use strict';
const $=id=>document.getElementById(id),KEY='binch.ultimate.session.v1.';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let current='',state={duration:60,checked:[]};
function character(){
 try{const p=JSON.parse(localStorage.getItem('grimoire.hub.v3'))||{};return [p.data?.pseudo||'aventurier',p.race||'',p.classe||''].map(x=>encodeURIComponent(String(x).trim().toLocaleLowerCase('fr'))).join('.')}
 catch{return 'aventurier..'}
}
function load(){const k=character();if(k===current)return;current=k;try{const v=JSON.parse(localStorage.getItem(KEY+k))||{};state={duration:[30,60,120].includes(v.duration)?v.duration:60,checked:Array.isArray(v.checked)?v.checked.filter(x=>typeof x==='string').slice(-30):[]}}catch{state={duration:60,checked:[]}}}
function save(){try{localStorage.setItem(KEY+current,JSON.stringify(state))}catch{}}
function tasks(){const plan=window.BinchUltimate?.getPlan();return plan?.actions?.filter(x=>x.when==='now').slice(0,state.duration===30?3:state.duration===60?5:8)||[]}
function render(){
 const host=$('binch-ultimate-session');if(!host)return;load();
 const list=$('binch-session-list'),rows=tasks(),checked=new Set(state.checked);
 const pick=$('binch-session-duration');pick.value=String(state.duration);
 const count=rows.filter(x=>checked.has(x.id)).length;
 $('binch-session-progress').textContent=count+' / '+rows.length+' tâches cochées manuellement · '+state.duration+' minutes envisagées';
 list.innerHTML=rows.length?rows.map((x,i)=>'<label class="binch-session-check"><input type="checkbox" data-session-done="'+esc(x.id)+'" '+(checked.has(x.id)?'checked':'')+'><span><strong>'+esc(x.title)+'</strong><small>'+esc(x.category)+' · '+esc(x.origin||'source locale')+'</small></span><button type="button" data-session-open="'+esc(x.page)+'">Ouvrir</button></label>').join(''):'<p>Pas de mission accessible à planifier. Mets ton profil à jour.</p>';
}
function summary(){
 const plan=window.BinchUltimate?.getPlan(),list=tasks(),completed=new Set(state.checked);
 return 'LA BINCH — PLAN DE SESSION '+state.duration+' MIN\n'+(plan?.profile?.className||'Personnage')+' niveau '+(plan?.profile?.level||'?')+'\n'+list.map((x,i)=>(completed.has(x.id)?'[x] ':'[ ] ')+(i+1)+'. '+x.title+' — '+x.category).join('\n')+'\n\nListe de préparation personnelle, pas un état des quêtes du jeu.';
}
function mount(){
 const parent=$('binch-ultimate-briefing');if(!parent||$('binch-ultimate-session'))return false;
 const panel=document.createElement('details');panel.id='binch-ultimate-session';panel.className='binch-ultimate-session';
 panel.innerHTML='<summary>Préparer ma session WoW · itinéraire et checklist</summary><div class="binch-session-inner"><p>Choisis ton temps disponible, puis coche tes tâches au fil de la partie. Ces coches n’affectent jamais ton journal de quêtes WoW ni les Secrets & incontournables.</p><div class="binch-session-controls"><label>Temps disponible<select id="binch-session-duration"><option value="30">30 minutes</option><option value="60">1 heure</option><option value="120">2 heures</option></select></label><button type="button" id="binch-session-copy">Copier mon programme</button><button type="button" id="binch-session-clear">Réinitialiser les coches</button></div><p id="binch-session-progress" role="status"></p><div id="binch-session-list"></div><small>Plan construit à partir des recommandations locales. Un changement de profil ou de mode d’aventure peut modifier la liste.</small></div>';
 const actions=$('binch-ultimate-actions');if(actions)actions.after(panel);else parent.append(panel);
 $('binch-session-duration').onchange=e=>{state.duration=Number(e.target.value);save();render()};
 $('binch-session-clear').onclick=()=>{state.checked=[];save();render()};
 $('binch-session-copy').onclick=async()=>{
  const value=summary(),button=$('binch-session-copy');
  try{await navigator.clipboard.writeText(value);button.textContent='Programme copié ✓';setTimeout(()=>button.textContent='Copier mon programme',1700)}catch{window.prompt('Copier mon plan de session',value)}
 };
 panel.addEventListener('change',e=>{const box=e.target.closest('[data-session-done]');if(!box)return;const set=new Set(state.checked);if(box.checked)set.add(box.dataset.sessionDone);else set.delete(box.dataset.sessionDone);state.checked=[...set].slice(-30);save();render()});
 panel.addEventListener('click',e=>{const b=e.target.closest('[data-session-open]');if(b)window.BinchUltimate?.open?.(b.dataset.sessionOpen)});
 document.addEventListener('binch:ultimate-updated',()=>{if(panel.open)render()});
 window.addEventListener('storage',e=>{if(!e.key||e.key==='grimoire.hub.v3'||e.key.startsWith(KEY)){current='';if(panel.open)render()}});
 panel.addEventListener('toggle',()=>{if(panel.open)render()});
 return true;
}
function init(){if(mount())return;const home=$('page-hub');if(!home)return;const mo=new MutationObserver(()=>{if(mount())mo.disconnect()});mo.observe(home,{childList:true,subtree:true});setTimeout(()=>mo.disconnect(),12000)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
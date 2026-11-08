/* La Binch — VRAIS PROCS: événements visuels de l'interface.
 * Distincts des artéfacts/trésors ET des procs officiels de WoW.
 * Tirage à chaque navigation admissible, cooldown, aucune animation permanente.
 */
(()=>{'use strict';
const KEY='binch.true-procs.v1', COOLDOWN=45000, $=s=>document.querySelector(s);
const DATA=[
{id:'chicken',title:'La grande évasion',rarity:'Commun',chance:2.0,kind:'road',trigger:'Navigation',caption:'Un poulet s’enfuit. Brog poursuit une promotion déjà compromise.',actors:['chicken','peon']},
{id:'gnome',title:'Une invention parfaitement sûre',rarity:'Inhabituel',chance:1.4,kind:'blast',trigger:'Navigation',caption:'Le gnome avait dit « presque sûr ». La machine avait entendu « presque ».',actors:['gnome','machine']},
{id:'murloc',title:'Le diplomate amphibie',rarity:'Rare',chance:0.8,kind:'slide',trigger:'Navigation',caption:'Un murloc de bonne compagnie salue… avant de glisser sur sa dignité.',actors:['murloc','letter']},
{id:'book',title:'La revanche du grimoire',rarity:'Épique',chance:0.35,kind:'fall',trigger:'Navigation',caption:'Le livre répond enfin aux questions. Avec les coins de sa couverture.',actors:['book','peon']},
{id:'drake',title:'Éternuement draconique',rarity:'Très rare',chance:0.15,kind:'fly',trigger:'Navigation',caption:'Un dragonnet éternue. Aucun bâtiment n’a demandé à être relooké.',actors:['drake','spark']},
{id:'specter',title:'La ronde des disparus',rarity:'Légendaire',chance:0.05,kind:'ghost',trigger:'Navigation',caption:'La vieille bannière se souvient de ceux qui ne sont jamais rentrés.',actors:['specter','banner']}
];
const art={
peon:'<svg viewBox="0 0 100 100"><path d="M32 44 24 29 41 31 55 14 71 30 65 44" fill="#4f7455" stroke="#213a33" stroke-width="4"/><ellipse cx="52" cy="51" rx="29" ry="27" fill="#6c9763" stroke="#203c31" stroke-width="4"/><circle cx="43" cy="47" r="4" fill="#1b2721"/><circle cx="64" cy="47" r="4" fill="#1b2721"/><path d="M44 65q10 10 22-1" fill="none" stroke="#253d27" stroke-width="3"/><path d="M25 76h53v19H25z" fill="#795336" stroke="#3c2c20" stroke-width="4"/><path d="M38 77v-9h28v9" stroke="#dec18a" fill="none" stroke-width="6"/></svg>',
chicken:'<svg viewBox="0 0 100 100"><path d="M30 61Q10 37 17 23l25 18" fill="#d2d9cb"/><ellipse cx="53" cy="62" rx="28" ry="25" fill="#f5e9cd" stroke="#8c886f" stroke-width="4"/><circle cx="67" cy="44" r="20" fill="#f5e9cd" stroke="#8c886f" stroke-width="3"/><path d="M62 25 69 11l8 14 9-6-2 15" fill="#c65c47"/><circle cx="75" cy="41" r="3" fill="#25251c"/><path d="M84 51 99 55 84 63" fill="#d8a044"/><path d="M46 83v15m18-15v15" stroke="#d8a044" stroke-width="5"/></svg>',
gnome:'<svg viewBox="0 0 100 100"><path d="M22 40 51 3 78 40Z" fill="#8d6499" stroke="#4d365e" stroke-width="4"/><ellipse cx="50" cy="57" rx="27" ry="24" fill="#d9ac90" stroke="#7c5d4c" stroke-width="3"/><circle cx="40" cy="52" r="6" fill="#fbf3cf"/><circle cx="62" cy="52" r="6" fill="#fbf3cf"/><circle cx="40" cy="52" r="2" fill="#23272f"/><circle cx="62" cy="52" r="2" fill="#23272f"/><path d="M36 72 52 93 68 72" fill="#e9e2d4" stroke="#a49487" stroke-width="3"/></svg>',
machine:'<svg viewBox="0 0 100 100"><rect x="20" y="32" width="60" height="55" rx="8" fill="#64817d" stroke="#b4a06e" stroke-width="5"/><circle cx="49" cy="59" r="20" fill="#304f50" stroke="#d0c494" stroke-width="4"/><path d="M49 43v32M33 59h32" stroke="#e9c06b" stroke-width="5"/><path d="M30 27 20 7m50 18 15-20" stroke="#e7c870" stroke-width="5"/></svg>',
murloc:'<svg viewBox="0 0 100 100"><path d="M17 44 2 28 17 22 30 36M85 45l12-16-12-9-14 15" fill="#5d8997"/><ellipse cx="50" cy="55" rx="34" ry="32" fill="#66b3af" stroke="#24666c" stroke-width="4"/><circle cx="37" cy="40" r="13" fill="#fcf4dd" stroke="#255e63" stroke-width="3"/><circle cx="66" cy="40" r="13" fill="#fcf4dd" stroke="#255e63" stroke-width="3"/><circle cx="38" cy="39" r="4" fill="#1a2f40"/><circle cx="66" cy="39" r="4" fill="#1a2f40"/><path d="M32 67q18 15 37 0" fill="none" stroke="#2b5666" stroke-width="5"/><path d="M32 20h39l-7-13H39z" fill="#40332b" stroke="#d4bc8a" stroke-width="3"/></svg>',
letter:'<svg viewBox="0 0 100 100"><rect x="12" y="20" width="77" height="60" rx="5" fill="#e9d5a2" stroke="#92764d" stroke-width="5"/><path d="m12 20 38 31 39-31" fill="none" stroke="#b59262" stroke-width="4"/><circle cx="50" cy="58" r="10" fill="#b76665"/></svg>',
book:'<svg viewBox="0 0 100 100"><path d="M13 15h68v75H13z" fill="#6c4464" stroke="#bc9a65" stroke-width="6"/><path d="M22 19v66" stroke="#c8b4a0" stroke-width="5"/><circle cx="54" cy="53" r="19" fill="#d1b774" stroke="#412b4d" stroke-width="5"/><path d="M54 31v42M32 53h44" stroke="#523951" stroke-width="5"/></svg>',
drake:'<svg viewBox="0 0 100 100"><path d="M23 56 3 18 47 37 88 20 78 62" fill="#8b6fa7" stroke="#534a85" stroke-width="4"/><path d="M30 49 19 14 51 32 84 26 75 55" fill="#af97bb"/><path d="M33 52q-12 37 18 39 35 0 28-38" fill="#6b79a9" stroke="#393f77" stroke-width="5"/><circle cx="45" cy="60" r="5" fill="#fce59d"/><circle cx="70" cy="60" r="5" fill="#fce59d"/><path d="m48 72 11 5 10-4" stroke="#edd28b" fill="none" stroke-width="4"/></svg>',
spark:'<svg viewBox="0 0 100 100"><path d="M58 4 25 57h27L42 96l37-54H54z" fill="#eac473" stroke="#f7dca1" stroke-width="5"/></svg>',
specter:'<svg viewBox="0 0 100 100"><path d="M26 77q-18-39 2-58 24-29 49 1 17 21-3 61l-15-9-10 14-12-12Z" fill="#a9cdd0" fill-opacity=".8" stroke="#88a6bb" stroke-width="4"/><circle cx="43" cy="45" r="7" fill="#263f53"/><circle cx="66" cy="45" r="7" fill="#263f53"/><path d="M46 63q7 8 15 0" stroke="#263f53" fill="none" stroke-width="4"/></svg>',
banner:'<svg viewBox="0 0 100 100"><path d="M24 7v89" stroke="#b4a287" stroke-width="7"/><path d="M28 12h60L75 43l13 27H28z" fill="#6a6684" stroke="#a99d92" stroke-width="4"/><path d="m48 29 17 13-17 13" stroke="#e8dfc8" fill="none" stroke-width="5"/></svg>'
};
const load=()=>{try{const v=JSON.parse(localStorage.getItem(KEY));return v&&typeof v==='object'?v:{enabled:true,total:0,hits:{},history:[],last:0}}catch{return {enabled:true,total:0,hits:{},history:[],last:0}}};
let state=load();state.hits=state.hits||{};state.history=Array.isArray(state.history)?state.history:[];
if(typeof state.enabled!=='boolean')state.enabled=true;
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(state))}catch{}};
let stage=null,closing=null;
const formatPercent=n=>n.toLocaleString('fr-FR',{maximumFractionDigits:2})+' %';
function closeStage(){if(closing)clearTimeout(closing);if(stage){stage.remove();stage=null}document.body.classList.remove('binch-proc-playing')}
function play(e,preview=false){
 closeStage();
 stage=document.createElement('aside');stage.id='binch-proc-stage';stage.className='binch-proc-scene scene-'+e.kind;stage.setAttribute('role','dialog');stage.setAttribute('aria-modal','false');stage.setAttribute('aria-label','Événement surprise : '+e.title);
 stage.innerHTML='<div class="binch-proc-curtain" aria-hidden="true"></div><div class="binch-proc-theater"><div class="binch-proc-scene-tag">'+(preview?'REPRÉSENTATION · SANS TIRAGE':'UN PROC ! · '+e.rarity)+'</div><div class="binch-proc-actors"><div class="binch-proc-actor first">'+art[e.actors[0]]+'</div><div class="binch-proc-actor second">'+art[e.actors[1]]+'</div></div><div class="binch-proc-caption"><h3>'+e.title+'</h3><p>'+e.caption+'</p></div><button type="button" class="binch-proc-skip" aria-label="Fermer cette scène">Passer ✕</button></div>';
 document.body.append(stage);document.body.classList.add('binch-proc-playing');
 stage.querySelector('button').addEventListener('click',closeStage);
 const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
 closing=setTimeout(closeStage,reduce?2800:4900);
 if(!preview){state.hits[e.id]=(Number(state.hits[e.id])||0)+1;state.history.unshift({id:e.id,t:Date.now()});state.history=state.history.slice(0,30);state.last=Date.now();save();render()}
}
function roll(){
 if(!state.enabled||Date.now()-Number(state.last||0)<COOLDOWN||stage)return;
 state.total=(Number(state.total)||0)+1;
 let n=Math.random()*100;
 for(const e of DATA){if(n<e.chance){play(e);break}n-=e.chance}
 save();
}
function render(){
 const table=$('#binch-true-procs-list'),stats=$('#binch-true-procs-stats'),log=$('#binch-true-procs-log');if(!table)return;
 const totalHits=Object.values(state.hits).reduce((n,v)=>n+(Number(v)||0),0);
 stats.textContent=(state.total||0)+' navigations éligibles · '+totalHits+' événements déclenchés';
 const toggle=$('#binch-procs-enable');if(toggle)toggle.checked=!!state.enabled;
 table.replaceChildren();
 for(const e of DATA){
  const item=document.createElement('article');item.className='binch-procs-entry';
  item.innerHTML='<div class="binch-procs-entry-art">'+art[e.actors[0]]+'</div><div class="binch-procs-entry-text"><small>'+e.rarity+' · '+e.trigger+'</small><strong>'+e.title+'</strong><p>'+e.caption+'</p></div><div class="binch-procs-entry-chance"><strong>'+formatPercent(e.chance)+'</strong><small>par navigation éligible</small><span>Vus : '+(state.hits[e.id]||0)+'</span><button type="button">Rejouer la scène</button></div>';
  item.querySelector('button').onclick=()=>play(e,true);table.append(item);
 }
 log.replaceChildren();
 if(!state.history.length){log.textContent='Aucun proc naturel pour le moment. Un aperçu ne compte pas comme un tirage.';return}
 for(const record of state.history.slice(0,15)){const e=DATA.find(x=>x.id===record.id);if(!e)continue;const line=document.createElement('div');line.textContent=e.title+' · '+new Date(record.t).toLocaleString('fr-FR');log.append(line)}
}
function mount(){
 const nav=$('#app nav.nav'),main=$('#app main');if(!nav||!main||$('#page-evenements'))return;
 const button=document.createElement('button');button.type='button';button.dataset.page='evenements';button.textContent='Vrais procs';nav.append(button);
 const page=document.createElement('section');page.id='page-evenements';page.className='page';
 page.innerHTML='<div class="binch-procs-hero"><span>LA BINCH · LA SCÈNE DES IMPROBABLES</span><h1>Les vrais procs</h1><p>Pas des artéfacts à gagner : de vrais mini-événements qui surgissent dans l’interface, avec leurs propres personnages et mouvements.</p><div class="binch-procs-mode">☑ Événements cosmétiques propres à La Binch — <strong>aucun objet, avantage ou taux de proc WoW officiel</strong>.</div></div><div class="binch-procs-layout"><section class="binch-procs-main"><div class="binch-procs-subhead"><div><div class="eyebrow">TABLE D’ÉVÉNEMENTS</div><h2>Déclencheurs & probabilités</h2></div><span id="binch-true-procs-stats"></span></div><p class="binch-procs-rule">À chaque clic de navigation principale, si le cooldown de 45 secondes est terminé, un seul tirage est effectué. Les chances ci-dessous sont des valeurs internes transparentes, jamais des taux WoW. Un événement réussi démarre une scène visible ; les aperçus ne comptent pas.</p><label class="binch-procs-toggle"><input id="binch-procs-enable" type="checkbox" checked><span>Autoriser les événements surprises pendant la navigation</span></label><div id="binch-true-procs-list"></div></section><aside class="binch-procs-aside"><h2>Le journal de scène</h2><p>Souvenirs des scènes naturellement déclenchées sur cet appareil.</p><div id="binch-true-procs-log"></div><button type="button" id="binch-proc-demo">Voir un événement de démonstration</button><p>Accessibilité : bouton pour passer une scène, préférence système « Réduire les animations » respectée. Les effets ne tournent jamais en continu.</p></aside></div>';
 main.append(page);
 button.onclick=()=>{nav.querySelectorAll('button[data-page]').forEach(b=>b.classList.toggle('active',b===button));main.querySelectorAll('.page').forEach(p=>p.classList.toggle('active',p===page));scrollTo({top:0,behavior:'instant'});render()};
 $('#binch-procs-enable').onchange=e=>{state.enabled=e.target.checked;save();render()};
 $('#binch-proc-demo').onclick=()=>play(DATA[Math.floor(Math.random()*DATA.length)],true);
 document.addEventListener('click',e=>{
  if(!e.isTrusted)return;
  const target=e.target.closest('#app nav.nav button[data-page]');
  if(target)roll()
 },true);
 render();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
})();

/* La Binch · Specs Forever. Verified guide links, no fabricated talent API. */
(()=>{'use strict';
const $=id=>document.getElementById(id),KEY='binch.specs.focus.v1';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const DRUID_ROUTE=[
 [10,14,'Férocité',5,'Combat farouche'],[15,16,'Peau épaisse',2,'Combat farouche'],
 [17,18,'Célérité farouche',2,'Combat farouche'],[19,19,'Fureur',1,'Combat farouche'],
 [20,21,'Furie sauvage',2,'Combat farouche'],[22,23,'Griffes aiguisées',2,'Combat farouche'],
 [24,26,'Attaques lacérantes',3,'Combat farouche'],[27,29,'Frappes de prédateur',3,'Combat farouche'],
 [30,30,'Chef de la meute',1,'Combat farouche'],[31,32,'Frénésie sanglante',2,'Combat farouche'],
 [33,33,'Charge farouche',1,'Combat farouche'],[34,34,'Discipline prédatrice',1,'Combat farouche'],
 [35,39,'Pourfendre et déchirer',5,'Combat farouche'],[40,40,'Puissance fluctuante',1,'Combat farouche'],
 [41,42,'Instinct naturel',2,'Combat farouche'],[43,46,'Fureur',4,'Combat farouche'],
 [47,51,'Genèse',5,'Équilibre'],[52,53,'Majesté de la nature',2,'Équilibre'],
 [54,55,'Allonge de la Nature',2,'Équilibre'],[56,60,'Cœur de fauve',5,'Restauration']
];
const guides=[
 {id:'druid-feral',cls:'Druide',name:'Farouche — pex',role:'Pex / hybride félin–ours',style:'Priorité pex',primary:true,description:'Progression solo et donjons occasionnels : mobilité félin, dégâts, survie et option ours. Ordre détaillé ci-dessous.',icy:'https://www.icy-veins.com/wow-forever/feral-druid-leveling',wowhead:'https://www.wowhead.com/forever/guide/classes/druid/feral/dps-leveling-tips',calculator:'https://armorywowforever.com/talents/druid',other:'https://foreverspec.com/fr/classes/druid/feral/'},
 {id:'druid-bear',cls:'Druide',name:'Ours — tank',role:'Tank / donjons et off-tank',description:'Pour préparer le tanking : privilégie la résistance, la menace et le contrôle ; vérifie ton arbre Forever avant d’attribuer les points.',icy:'https://www.icy-veins.com/wow-forever/feral-druid-melee-dps-and-tank-pve-spec-builds-talents',calculator:'https://armorywowforever.com/talents/druid',other:'https://foreverspec.com/fr/classes/druid/feral/'},
 {id:'druid-cat',cls:'Druide',name:'Félin — DPS raid',role:'DPS / niveau 60',description:'Optimisation de dégâts pour les rencontres prolongées, distincte du build de pex.',icy:'https://www.icy-veins.com/wow-forever/feral-druid-melee-dps-and-tank-pve-spec-builds-talents',calculator:'https://armorywowforever.com/talents/druid',other:'https://www.wowhead.com/forever/guide/classes/druid/feral/talent-builds-pve-dps'},
 {id:'druid-resto',cls:'Druide',name:'Restauration — soins',role:'Heal / groupe',description:'Profil soin à étudier séparément du farouche pex ; aucun ordre de points inventé.',icy:'https://www.icy-veins.com/wow-forever/feral-druid-leveling',calculator:'https://armorywowforever.com/talents/druid'},
 {id:'hunter-bm',cls:'Chasseur',name:'Maîtrise des bêtes',role:'Pex / familier',description:'Familier tank et dégâts réguliers, très bon rendement en solo.',icy:'https://www.icy-veins.com/wow-forever/beast-mastery-hunter-leveling',calculator:'https://armorywowforever.com/talents/hunter'},
 {id:'warrior-arms',cls:'Guerrier',name:'Armes',role:'Pex / arme 2M',description:'Frappe mortelle et Frappe circulaire sur plusieurs cibles ; privilégier les améliorations d’armes.',icy:'https://www.icy-veins.com/wow-forever/arms-warrior-leveling',calculator:'https://armorywowforever.com/talents/warrior'},
 {id:'mage-frost',cls:'Mage',name:'Givre',role:'Pex / contrôle',description:'Ralentissements, contrôle et survie à distance.',icy:'https://www.icy-veins.com/wow-forever/frost-mage-leveling',calculator:'https://armorywowforever.com/talents/mage'},
 {id:'shaman-enh',cls:'Chaman',name:'Amélioration',role:'Pex / mêlée',description:'Polyvalence, dégâts explosifs et soins entre combats ; gestion de mana importante.',icy:'https://www.icy-veins.com/wow-forever/enhancement-shaman-leveling',calculator:'https://armorywowforever.com/talents/shaman'},
 {id:'warlock-aff',cls:'Démoniste',name:'Affliction',role:'Pex / dégâts périodiques',description:'DoT, Drain de vie et familier ; privilégier la régularité.',icy:'https://www.icy-veins.com/wow-forever/affliction-warlock-leveling',calculator:'https://armorywowforever.com/talents/warlock'},
 {id:'rogue-combat',cls:'Voleur',name:'Combat',role:'Pex / mêlée',description:'Bon mono-cible, Blade Flurry sur deux cibles et furtivité.',icy:'https://www.icy-veins.com/wow-forever/combat-rogue-leveling',calculator:'https://armorywowforever.com/talents/rogue'},
 {id:'priest-shadow',cls:'Prêtre',name:'Ombre',role:'Pex / distance',description:'Gestion de mana, baguette, buffs et dégâts d’Ombre.',icy:'https://www.icy-veins.com/wow-forever/shadow-priest-leveling',calculator:'https://armorywowforever.com/talents/priest'},
 {id:'paladin-ret',cls:'Paladin',name:'Vindicte',role:'Pex / mêlée',description:'Bon sustain et outils défensifs. Classe/faction selon les règles Forever.',icy:'https://www.icy-veins.com/wow-forever/retribution-paladin-leveling',calculator:'https://armorywowforever.com/talents/paladin'}
];
const urlOK=u=>/^https:\/\/(www\.)?(icy-veins\.com|wowhead\.com|armorywowforever\.com|foreverspec\.com)\//.test(u);
function read(){try{let v=JSON.parse(localStorage.getItem(KEY));return v&&typeof v==='object'?v:{}}catch{return {}}}
let state=read();if(!guides.some(g=>g.id===state.id))state.id='druid-feral';
let levelLocked=Number.isInteger(state.level)&&state.level>=10&&state.level<=60;
function importedLevel(){
 try{const p=JSON.parse(localStorage.getItem('grimoire.hub.v3'))||{},l=JSON.parse(localStorage.getItem('grimoire.bridge.last'))||{},n=String(p.data?.pseudo||'').trim().toLowerCase(),match=n&&n===String(l.name||'').trim().toLowerCase(),level=Number(match?l.level:p.data?.level);return Number.isInteger(level)?Math.max(10,Math.min(60,level)):10}catch{return 10}
}
function level(){return levelLocked?state.level:importedLevel()}
function persist(){try{localStorage.setItem(KEY,JSON.stringify(state))}catch{}document.dispatchEvent(new Event('binch:specs-change'))}
function current(){return guides.find(g=>g.id===state.id)||guides[0]}
function rankAt(step,lvl){return Math.max(0,Math.min(step[3],lvl-step[0]+1))}
function build(lvl){return DRUID_ROUTE.filter(step=>lvl>=step[0]).map(step=>({...{from:step[0],to:step[1],name:step[2],ranks:step[3],tree:step[4]},owned:rankAt(step,lvl)}))}
function nextPoint(lvl){for(const step of DRUID_ROUTE)if(step[1]>=lvl+1)return {level:Math.max(lvl+1,step[0]),name:step[2],rank:Math.max(1,Math.max(lvl+1,step[0])-step[0]+1),max:step[3]};return null}
function links(g){return [g.icy?['Icy Veins · Guide Forever',g.icy]:null,g.wowhead?['Wowhead Forever',g.wowhead]:null,g.other?['Autre guide',g.other]:null,g.calculator?['Calculateur Forever',g.calculator]:null].filter(Boolean).filter(([,u])=>urlOK(u)).map(([label,u])=>'<a href="'+u+'" rel="noopener noreferrer" target="_blank">'+label+' ↗</a>').join('')}
function render(){
 const root=$('binch-specs');if(!root)return;
 const lvl=level(),g=current();
 $('binch-specs-level').value=String(lvl);
 $('binch-specs-level-mode').textContent=levelLocked?'Niveau manuel':'Niveau du profil (ou 10 si absent)';
 $('binch-specs-selection').textContent=g.cls+' · '+g.name;
 $('binch-specs-summary').innerHTML='<h3>'+esc(g.name)+'</h3><p>'+esc(g.description)+'</p><p class="binch-specs-sources">Guides publics Forever, pas des valeurs lues en direct dans WoW. Mise à jour documentaire : novembre 2026. Vérifie le calculateur si un hotfix modifie les talents.</p><div class="binch-specs-links">'+links(g)+'</div>';
 $('binch-specs-cards').innerHTML=guides.filter(x=>(state.filter||'all')==='all'||x.cls===state.filter).map(x=>'<button type="button" class="binch-spec-card'+(x.id===g.id?' active':'')+'" data-spec-id="'+x.id+'" aria-pressed="'+(x.id===g.id)+'"><span>'+esc(x.cls)+'</span><strong>'+esc(x.name)+'</strong><small>'+esc(x.role)+'</small></button>').join('');
 const route=$('binch-specs-route');
 if(g.id!=='druid-feral'){
  route.innerHTML='<p class="binch-specs-sources">Ce profil possède un guide source et un calculateur Forever. Son ordre détaillé de talents n’est pas encore certifié dans La Binch : aucun rang fictif affiché.</p>';return;
 }
 const pts=Math.max(0,lvl-9),n=nextPoint(lvl);
 const owned=build(lvl);
 route.innerHTML='<div class="binch-specs-progress"><strong>'+pts+' / 51 points · niveau '+lvl+'</strong><span>'+ (n?'Prochain point au niveau '+n.level+' : '+esc(n.name)+' ('+n.rank+'/'+n.max+')':'Progression terminée : 51 points')+'</span></div>'+
 '<div class="binch-specs-steps">'+DRUID_ROUTE.map(step=>{
  const taken=rankAt(step,lvl),done=taken===step[3],future=lvl<step[0];
  return '<article class="binch-specs-step'+(done?' is-done':future?' is-future':' is-current')+'"><span class="binch-specs-range">'+step[0]+(step[1]!==step[0]?'–'+step[1]:'')+'</span><div><strong>'+esc(step[2])+'</strong><small>'+esc(step[4])+'</small></div><b>'+taken+'/'+step[3]+'</b></article>';
 }).join('')+'</div><p class="binch-specs-sources">Ordre de leveling adapté du guide ForeverSpec du 6 novembre, à confronter au calculateur et à Icy Veins. Félin au niveau 20, ours dès le 10. Attention : certains talents peuvent être réorganisés par hotfix.</p>';
 $('binch-specs-pin-state').textContent=state.pinned?'Build épinglé dans le bandeau flottant.':'Bandeau non épinglé.';
 renderPinned();
}
function renderPinned(){
 const pin=$('binch-specs-pinned');if(!pin)return;
 if(!state.pinned){pin.hidden=true;return}
 pin.hidden=false;const g=current(),lvl=level(),n=g.id==='druid-feral'?nextPoint(lvl):null;
 $('binch-specs-pin-content').textContent=g.cls+' · '+g.name+' · niv. '+lvl+(n?' | prochain '+n.level+' : '+n.name+' '+n.rank+'/'+n.max:'');
}
function navigate(){const btn=document.querySelector('#app nav.nav [data-page="specs"]');btn?.click();$('binch-specs')?.scrollIntoView({behavior:'auto',block:'start'})}
function mount(){
 const main=document.querySelector('#app main'),nav=document.querySelector('#app nav.nav');if(!main||!nav||$('page-specs'))return false;
 const button=document.createElement('button');button.type='button';button.dataset.page='specs';button.textContent='Specs';nav.append(button);
 const page=document.createElement('section');page.id='page-specs';page.className='page';
 page.innerHTML='<section class="panel section" id="binch-specs"><header class="binch-specs-head"><div><span class="eyebrow">GRIMOIRE DES SPÉCIALISATIONS</span><h2>Specs & builds WoW Forever</h2><p>Druide farouche en priorité · guides utiles pour les neuf classes. Un ordre par niveau, une progression et un pense-bête épinglable.</p></div><button type="button" id="binch-specs-pin">Épingler mon build</button></header><div class="binch-specs-toolbar"><label>Classe<select id="binch-specs-class"></select></label><label>Niveau<input type="number" id="binch-specs-level" min="10" max="60" step="1"></label><button type="button" id="binch-specs-auto-level">Suivre le profil</button><span id="binch-specs-level-mode"></span></div><p id="binch-specs-selection" class="binch-specs-selected"></p><div id="binch-specs-cards"></div><section id="binch-specs-summary"></section><section id="binch-specs-route"></section><p id="binch-specs-pin-state" role="status"></p></section>';
 main.append(page);
 const pin=document.createElement('aside');pin.id='binch-specs-pinned';pin.hidden=true;pin.setAttribute('aria-label','Build épinglé');pin.innerHTML='<button type="button" id="binch-specs-pin-open">Specs</button><strong id="binch-specs-pin-content"></strong><button type="button" id="binch-specs-pin-close" aria-label="Retirer le build épinglé">×</button>';document.body.append(pin);
 $('binch-specs-class').innerHTML='<option value="all">Toutes les classes</option>'+[...new Set(guides.map(g=>g.cls))].map(x=>'<option value="'+x+'">'+x+'</option>').join('');
 $('binch-specs-class').value=state.filter||'all';
 button.onclick=()=>{document.querySelectorAll('#app nav.nav button[data-page]').forEach(x=>x.classList.toggle('active',x===button));document.querySelectorAll('#app main .page').forEach(x=>x.classList.toggle('active',x===page));scrollTo({top:0,behavior:'auto'});render()};
 $('binch-specs-cards').onclick=e=>{const b=e.target.closest('[data-spec-id]');if(!b)return;state.id=b.dataset.specId;persist();render()};
 $('binch-specs-class').onchange=e=>{state.filter=e.target.value;persist();render()};
 $('binch-specs-level').onchange=e=>{const n=Number(e.target.value);if(!Number.isInteger(n)||n<10||n>60){render();return}state.level=n;levelLocked=true;persist();render()};
 $('binch-specs-auto-level').onclick=()=>{delete state.level;levelLocked=false;persist();render()};
 $('binch-specs-pin').onclick=()=>{state.pinned=!state.pinned;persist();render()};
 $('binch-specs-pin-open').onclick=navigate;
 $('binch-specs-pin-close').onclick=()=>{state.pinned=false;persist();render()};
 document.addEventListener('grimoire:sync',render);window.addEventListener('storage',e=>{if(e.key===KEY){state=read();levelLocked=Number.isInteger(state.level);render()}else if(e.key==='grimoire.hub.v3'||e.key==='grimoire.bridge.last')render()});
 render();return true;
}
function start(){if(mount())return;const app=document.getElementById('app');if(!app)return;const observer=new MutationObserver(()=>{if(mount())observer.disconnect()});observer.observe(app,{childList:true,subtree:true});setTimeout(()=>observer.disconnect(),15000)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
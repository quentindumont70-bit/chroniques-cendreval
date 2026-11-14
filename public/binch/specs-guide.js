/* La Binch · Specs Forever. Build farouche officiel décodé du calculateur Forever, guides publics vérifiés — aucune donnée inventée. */
(()=>{'use strict';
const $=id=>document.getElementById(id),KEY='binch.specs.focus.v1';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
/* Source de vérité du build farouche : guide Icy Veins Forever « Feral Druid Leveling » (Meyra, 4 nov 2026),
   décodé depuis le hash de son calculateur officiel : 51 points, niveaux 10 → 60 (export talentsforever du 4 nov 2026).
   SEQ = ordre exact : l’entrée i est le point pris au niveau 10+i. Frappes de prédateur est prise au 29 puis
   poursuivie aux 33–34 (non contigu) — c’est le build officiel, pas une interpolation.
   Noms français : fichiers du client Forever 1.60.1.70790 (relevés via ForeverSpec, 6 nov 2026).
   Infobulles : traduction fidèle des infobulles du calculateur officiel (valeurs identiques). */
const T={
 ferocite:{n:'Férocité',t:'Combat farouche',max:5,tip:'Réduit de 1 par rang (jusqu’à 5) le coût en Rage ou Énergie de Mutiler, Morsure primordiale, Balayage, Griffe et Griffure.'},
 instinct:{n:'Instinct farouche',t:'Combat farouche',max:3,tip:'Jusqu’à +30 % aux dégâts de Balayage ; en Rôder, tu es plus difficile à repérer, comme si tu avais jusqu’à 3 niveaux de plus.'},
 swiftness:{n:'Célérité farouche',t:'Combat farouche',max:2,tip:'Jusqu’à +30 % de vitesse de déplacement en Forme de félin et jusqu’à +4 % de chances d’esquive.'},
 charge:{n:'Charge farouche',t:'Combat farouche',max:1,tip:'Charge un ennemi (8–25 m), l’immobilise et interrompt son incantation 4 s ; bondit derrière lui. 5 Rage, recharge 15 s.'},
 savagefury:{n:'Furie sauvage',t:'Combat farouche',max:2,tip:'Jusqu’à +10 % aux dégâts de Griffe, Griffure, Lambeau, Mutiler et Balayage.'},
 claws:{n:'Griffes aiguisées',t:'Combat farouche',max:2,tip:'Jusqu’à +6 % de chances de coup critique en Forme de félin et en formes d’ours.'},
 lacerate:{n:'Lacérer',t:'Combat farouche',max:1,tip:'Saignement d’ours : 20 dégâts sur 15 s, plus 10 % des dégâts d’arme par application déjà présente ; cumulable 5 fois, menace élevée. 15 Rage.'},
 bloodfrenzy:{n:'Frénésie sanglante',t:'Combat farouche',max:2,tip:'Jusqu’à 100 % de chances de gagner 5 Rage de plus sur un coup critique en ours ; jusqu’à 100 % de chances d’ajouter un point de combo sur un coup critique félin générateur.'},
 predisc:{n:'Predatory Discipline',t:'Combat farouche',max:1,tip:'Morsure féroce ne convertit plus l’Énergie excédentaire en dégâts, mais en tire quand même des dégâts supplémentaires.'},
 prestrikes:{n:'Frappes de prédateur',t:'Combat farouche',max:3,tip:'Jusqu’à +150 % de ton niveau en puissance d’attaque en Forme de félin et en formes d’ours (90 au niveau 60 au rang 3).'},
 lotp:{n:'Chef de la meute',t:'Combat farouche',max:1,tip:'En forme de félin ou d’ours : +3 % de chances de coup critique pour tout le groupe ou le raid dans un rayon de 45 m.'},
 natinstinct:{n:'Instinct naturel',t:'Combat farouche',max:2,tip:'Jusqu’à +20 % au bonus de dégâts des coups critiques en mêlée ; tes soins gagnent jusqu’à 25 % de ton Intelligence.'},
 rendtear:{n:'Pourfendre et déchirer',t:'Combat farouche',max:5,tip:'Jusqu’à +15 % aux dégâts de tes capacités de mêlée sur les cibles qui saignent.'},
 primalbite:{n:'Morsure primordiale',t:'Combat farouche',max:1,tip:'Morsure d’ours : 100 % des dégâts normaux plus 42, menace élevée. 20 Rage, recharge 6 s.'},
 shiftpower:{n:'Puissance fluctuante',t:'Combat farouche',max:1,tip:'Convertit instantanément du mana en 40 Énergie en Forme de félin ; coût 55 % du mana de base, recharge 8 s, réduit par les effets qui réduisent le coût des métamorphoses.'},
 hotw:{n:'Cœur de fauve',t:'Restauration',max:5,tip:'Jusqu’à +10 % d’Intelligence ; jusqu’à +20 % d’Endurance en formes d’ours ; jusqu’à +10 % de Force en Forme de félin.'},
 naturalist:{n:'Naturaliste',t:'Restauration',max:5,tip:'Jusqu’à −0,5 s d’incantation sur Toucher guérisseur et Croissance sauvage, et jusqu’à +10 % à tous les dégâts infligés.'},
 genesis:{n:'Genèse',t:'Équilibre',max:5,tip:'Jusqu’à +10 % aux dégâts et soins périodiques de tes sorts et capacités.'},
 reach:{n:'Allonge de la Nature',t:'Équilibre',max:2,tip:'Jusqu’à +20 % à la portée de tes sorts offensifs d’équilibre et jusqu’à +4 % de chances de toucher.'},
 majesty:{n:'Majesté de la nature',t:'Équilibre',max:2,tip:'Jusqu’à +4 % de chances de coup critique pour tes sorts et tes attaques en mêlée.'}
};
const SEQ=[['ferocite',5],['instinct',3],['swiftness',2],['charge',1],['savagefury',2],['claws',2],['lacerate',1],['bloodfrenzy',2],['predisc',1],['prestrikes',1],['lotp',1],['natinstinct',2],['prestrikes',2],['rendtear',5],['primalbite',1],['shiftpower',1],['hotw',5],['naturalist',5],['genesis',5],['reach',2],['majesty',2]].flatMap(([k,n])=>Array(n).fill(k));
const PHASES=[
 {from:10,to:19,title:'Niveaux 10–19 · En ours',text:'La Forme de félin n’arrive qu’au niveau 20 (fichiers du client Forever) : on ouvre en ours. Férocité allège Mutiler et Balayage, Instinct farouche renforce Balayage et la discrétion, Célérité farouche apporte l’esquive.'},
 {from:20,to:28,title:'Niveaux 20–28 · Passage félin',text:'Charge farouche pour bondir et interrompre, Furie sauvage et Griffes aiguisées pour les dégâts et le critique, Lacérer pour l’ours, Frénésie sanglante pour le rythme des points de combo.'},
 {from:29,to:41,title:'Niveaux 29–41 · Cœur farouche',text:'Frappes de prédateur (au 29 puis 33–34), Chef de la meute au 30 pour le groupe, Instinct naturel, Pourfendre et déchirer 5/5, puis Morsure primordiale et Puissance fluctuante : les plus gros gains du build.'},
 {from:42,to:60,title:'Niveaux 42–60 · Arbres voisins',text:'Cœur de fauve et Naturaliste en Restauration, puis Genèse, Allonge de la Nature et Majesté de la nature en Équilibre : dégâts polyvalents, toucher et critique. Build final : 9 Équilibre / 32 Combat farouche / 10 Restauration.'}
];
const guides=[
 {id:'druid-feral',cls:'Druide',name:'Farouche — pex',role:'Pex / hybride félin–ours',primary:true,description:'Ordre exact niveau par niveau du build de leveling Icy Veins Forever (Meyra, 4 nov 2026), décodé depuis le calculateur officiel : 51 points du niveau 10 au 60, infobulles et phases ci-dessous.',icy:'https://www.icy-veins.com/wow-forever/feral-druid-leveling',wowhead:'https://www.wowhead.com/forever/guide/classes/druid/feral/dps-leveling-tips',calculator:'https://armorywowforever.com/talents/druid',other:'https://foreverspec.com/fr/classes/druid/feral/'},
 {id:'druid-bear',cls:'Druide',name:'Ours — tank',role:'Tank / donjons et off-tank',description:'Pour préparer le tanking : ForeverSpec détaille un build ours 60 (0/41/10) — Lacérer et Morsure primordiale pour la menace, Cœur de fauve pour l’Endurance. Builds 60 théoriques jusqu’à l’ouverture des raids (9 décembre).',icy:'https://www.icy-veins.com/wow-forever/feral-druid-melee-dps-and-tank-pve-spec-builds-talents',calculator:'https://armorywowforever.com/talents/druid',other:'https://foreverspec.com/fr/classes/druid/feral/'},
 {id:'druid-cat',cls:'Druide',name:'Félin — DPS raid',role:'DPS / niveau 60',description:'Optimisation des dégâts sur rencontres prolongées, distincte du build de pex : Icy Veins et Wowhead publient des builds dédiés (ForeverSpec : 9/32/10 au niveau 60).',icy:'https://www.icy-veins.com/wow-forever/feral-druid-melee-dps-and-tank-pve-spec-builds-talents',wowhead:'https://www.wowhead.com/forever/guide/classes/druid/feral/talent-builds-pve-dps',calculator:'https://armorywowforever.com/talents/druid',other:'https://foreverspec.com/fr/classes/druid/feral/'},
 {id:'druid-resto',cls:'Druide',name:'Restauration — soins',role:'Heal / groupe',description:'Soins. ForeverSpec conseille de monter en Farouche puis de respécialiser au 60 (11/0/40 : Croissance sauvage, Prompte guérison, Floraison) ; Icy Veins publie aussi un guide de leveling restauration dédié.',icy:'https://www.icy-veins.com/wow-forever/restoration-druid-leveling',calculator:'https://armorywowforever.com/talents/druid',other:'https://foreverspec.com/fr/classes/druid/restoration/'},
 {id:'druid-balance',cls:'Druide',name:'Équilibre — distance',role:'DPS distance',description:'DPS à distance : ForeverSpec publie un build leveling 41/0/10 (Colère améliorée, DoT, Forme de sélénien au 42, Naturaliste vers le 50) ; Icy Veins publie aussi un guide de leveling équilibre.',icy:'https://www.icy-veins.com/wow-forever/balance-druid-leveling',calculator:'https://armorywowforever.com/talents/druid',other:'https://foreverspec.com/fr/classes/druid/balance/'},
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
if(state.filter&&state.filter!=='all'&&guides.some(g=>g.cls===state.filter)&&!guides.some(g=>g.id===state.id&&g.cls===state.filter))state.id=guides.find(g=>g.cls===state.filter).id;
let levelLocked=Number.isInteger(state.level)&&state.level>=10&&state.level<=60;
function importedLevel(){
 try{const p=JSON.parse(localStorage.getItem('grimoire.hub.v3'))||{},l=JSON.parse(localStorage.getItem('grimoire.bridge.last'))||{},n=String(p.data?.pseudo||'').trim().toLowerCase(),match=n&&n===String(l.name||'').trim().toLowerCase(),level=Number(match?l.level:p.data?.level);return Number.isInteger(level)?Math.max(10,Math.min(60,level)):10}catch{return 10}
}
function level(){return levelLocked?state.level:importedLevel()}
function persist(){try{localStorage.setItem(KEY,JSON.stringify(state))}catch{}document.dispatchEvent(new Event('binch:specs-change'))}
function current(){return guides.find(g=>g.id===state.id)||guides[0]}
function points(lvl){return Math.min(51,Math.max(0,lvl-9))}
function stepsAt(lvl){
 const runs=[];let cur=null;
 for(let i=0;i<SEQ.length;i++){const k=SEQ[i],L=10+i;if(cur&&cur.k===k)cur.to=L;else{cur={k,from:L,to:L};runs.push(cur)}}
 const order=[],by=new Map();
 for(const r of runs){if(!by.has(r.k)){by.set(r.k,[]);order.push(r.k)}by.get(r.k).push(r)}
 return order.map(k=>{const t=T[k],rs=by.get(k),owned=rs.reduce((s,r)=>s+Math.max(0,Math.min(r.to,lvl)-r.from+1),0);
  return {k,name:t.n,tree:t.t,tip:t.tip,max:t.max,owned,first:rs[0].from,label:rs.map(r=>r.from===r.to?String(r.from):r.from+'–'+r.to).join(', ')}});
}
function nextPoint(lvl){if(lvl>=60)return null;const idx=lvl+1-10,k=SEQ[idx];if(!k||!T[k])return null;let rank=0;for(let i=0;i<=idx;i++)if(SEQ[i]===k)rank++;const t=T[k];return{k,level:lvl+1,name:t.n,rank,max:t.max}}
function links(g){return [g.icy?['Icy Veins · Guide Forever',g.icy]:null,g.wowhead?['Wowhead Forever',g.wowhead]:null,g.other?['ForeverSpec (fr)',g.other]:null,g.calculator?['Calculateur Forever',g.calculator]:null].filter(Boolean).filter(([,u])=>urlOK(u)).map(([label,u])=>'<a href="'+u+'" rel="noopener noreferrer" target="_blank">'+label+' ↗</a>').join('')}
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
  route.innerHTML='<p class="binch-specs-sources">Ce profil possède des guides sources et un calculateur Forever. Son ordre de talents détaillé n’est pas certifié point par point dans La Binch : aucun rang fictif affiché. Le parcours farouche ci-contre reste consultable en sélectionnant « Farouche — pex ».</p>';
  $('binch-specs-pin-state').textContent=state.pinned?'Build épinglé dans le bandeau flottant.':'Bandeau non épinglé.';
  renderPinned();return;
 }
 const pts=points(lvl),n=nextPoint(lvl),steps=stepsAt(lvl);
 route.innerHTML='<div class="binch-specs-progress"><strong>'+pts+' / 51 points · niveau '+lvl+'</strong><span>'+(n?'Prochain point au niveau '+n.level+' : '+esc(n.name)+' ('+n.rank+'/'+n.max+')':'Build complet : 51 points au niveau 60')+'</span></div>'+
 '<div class="binch-specs-phases">'+PHASES.map(p=>{const st=lvl>=p.to?'is-done':lvl>=p.from?'is-active':'is-future';return '<div class="binch-specs-phase '+st+'"><strong>'+esc(p.title)+'</strong><p>'+esc(p.text)+'</p></div>'}).join('')+'</div>'+
 '<div class="binch-specs-steps">'+steps.map(s=>{
  const done=s.owned>=s.max,isNext=n&&n.k===s.k,cls=done?'is-done':isNext?'is-next':s.owned>0?'is-current':'is-future';
  return '<article class="binch-specs-step '+cls+'"><span class="binch-specs-range">'+esc(s.label)+'</span><div><strong>'+esc(s.name)+'</strong><small>'+esc(s.tree)+'</small><p class="binch-specs-tip">'+esc(s.tip)+'</p></div><b>'+(isNext&&!done?'→ ':'')+s.owned+'/'+s.max+'</b></article>';
 }).join('')+'</div>'+
 '<p class="binch-specs-sources">Source : build de leveling Icy Veins Forever « Feral Druid Leveling » (Meyra, 4 nov 2026), ordre exact décodé depuis le hash de son calculateur officiel (données talentsforever du 4 nov 2026) ; noms français du client Forever 1.60.1.70790 (via ForeverSpec). Les valeurs applicées par le serveur peuvent différer en jeu. Variante communautaire ForeverSpec (6 nov 2026, 9/37/5) : Peau épaisse 15–16, Célérité farouche 17–18, Fureur au 19, Attaques lacérantes 24–26, Frappes de prédateur contiguës 27–29, Frénésie sanglante 31–32, Charge farouche 33, Predatory Discipline 34, Puissance fluctuante au 40, Fureur ×4 43–46, puis Genèse 47–51, Majesté de la nature 52–53, Allonge de la Nature 54–55 et Cœur de fauve 56–60 — sans Instinct farouche, Lacérer, Morsure primordiale ni Naturaliste. Jalons partagés avec Icy Veins : félin au 20, Chef de la meute au 30, Pourfendre et déchirer 35–39, Puissance fluctuante au 40 — <a href="https://foreverspec.com/fr/classes/druid/feral/" rel="noopener noreferrer" target="_blank">voir l’ordre ForeverSpec complet ↗</a>.</p>';
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
 page.innerHTML='<section class="panel section" id="binch-specs"><header class="binch-specs-head"><div><span class="eyebrow">GRIMOIRE DES SPÉCIALISATIONS</span><h2>Specs & builds WoW Forever</h2><p>Druide farouche en priorité · guides utiles pour les neuf classes. Un ordre officiel par niveau, des infobulles et un pense-bête épinglable.</p></div><button type="button" id="binch-specs-pin">Épingler mon build</button></header><div class="binch-specs-toolbar"><label>Classe<select id="binch-specs-class"></select></label><label>Niveau<input type="number" id="binch-specs-level" min="10" max="60" step="1"></label><button type="button" id="binch-specs-auto-level">Suivre le profil</button><span id="binch-specs-level-mode"></span></div><p id="binch-specs-selection" class="binch-specs-selected"></p><div id="binch-specs-cards"></div><section id="binch-specs-summary"></section><section id="binch-specs-route"></section><p id="binch-specs-pin-state" role="status"></p></section>';
 main.append(page);
 const pin=document.createElement('aside');pin.id='binch-specs-pinned';pin.hidden=true;pin.setAttribute('aria-label','Build épinglé');pin.innerHTML='<button type="button" id="binch-specs-pin-open">Specs</button><strong id="binch-specs-pin-content"></strong><button type="button" id="binch-specs-pin-close" aria-label="Retirer le build épinglé">×</button>';document.body.append(pin);
 $('binch-specs-class').innerHTML='<option value="all">Toutes les classes</option>'+[...new Set(guides.map(g=>g.cls))].map(x=>'<option value="'+x+'">'+x+'</option>').join('');
 $('binch-specs-class').value=state.filter||'all';
 button.onclick=()=>{document.querySelectorAll('#app nav.nav button[data-page]').forEach(x=>x.classList.toggle('active',x===button));document.querySelectorAll('#app main .page').forEach(x=>x.classList.toggle('active',x===page));scrollTo({top:0,behavior:'auto'});render()};
 $('binch-specs-cards').onclick=e=>{const b=e.target.closest('[data-spec-id]');if(!b)return;state.id=b.dataset.specId;persist();render()};
 $('binch-specs-class').onchange=e=>{state.filter=e.target.value;const selected=current();if(state.filter!=='all'&&selected.cls!==state.filter){const first=guides.find(g=>g.cls===state.filter);if(first)state.id=first.id}persist();render()};
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

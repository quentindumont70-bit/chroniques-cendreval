/* La Binch — VRAIS procs d'objets WoW Forever, distincts des événements cosmétiques.
 * Petit échantillon sourcé, NON exhaustif, aucun tirage simulé.
 * N'afficher une chance numérique que si elle est explicitement établie.
 */
(()=>{'use strict';
 const $=s=>document.querySelector(s);
 const data=[
  {name:'Sulfuras, Main de Ragnaros',family:'weapon',tag:'Arme légendaire',level:60,trigger:'Chance lors d’un coup porté',effect:'Projette une boule de feu infligeant 273 à 333 dégâts de Feu, puis 75 dégâts supplémentaires sur 10 secondes.',chance:null,notes:'Son autre effet, le retour de dégâts de Feu quand on te frappe, est un effet d’équipement distinct du proc.',source:'https://www.wowhead.com/forever/item=17182/sulfuras-hand-of-ragnaros'},
  {name:'Thunderfury, Lame bénie du Cherchevent',family:'weapon',tag:'Arme légendaire',level:60,trigger:'Chance lors d’un coup porté',effect:'Décharge de 300 dégâts de Nature qui bondit sur cinq cibles et réduit leur résistance à la Nature de 25 ; la cible principale subit un ralentissement de vitesse d’attaque de 20 % pendant 12 secondes.',chance:null,notes:'La probabilité exacte de déclenchement n’est pas précisée dans la fiche Forever citée.',source:'https://www.wowhead.com/forever/item=19019/thunderfury-blessed-blade-of-the-windseeker'},
  {name:'La Main d’Antu’sul',family:'weapon',tag:'Masse',level:45,trigger:'Chance lors d’un coup porté',effect:'Frappe électrique touchant jusqu’à quatre ennemis proches : 42 dégâts de Nature et allongement de 11 % du temps entre leurs attaques pendant 10 secondes.',chance:null,notes:'Chiffres issus de la fiche anglaise Forever, à privilégier sur d’anciennes versions Classic.',source:'https://www.wowhead.com/forever/item=9639/the-hand-of-antusul'},
  {name:'Main de justice',family:'trinket',tag:'Bijou',level:null,trigger:'Coup de mêlée',effect:'Chance de déclencher une attaque supplémentaire. Le sort lié possède un délai interne mentionné de 2 secondes.',chance:null,notes:'Attention : la fiche du sort Forever montre une aura « 3 % » mais sa description mentionne « 1 % », avec un modificateur racial. Taux réel marqué à confirmer au lieu de choisir arbitrairement l’un des deux.',source:'https://www.wowhead.com/forever/spell=15600/hand-of-justice'},
  {name:'Enchantement d’arme — Insight',family:'enchant',tag:'Enchantement Forever',level:null,trigger:'Lancement de sorts',effect:'Possibilité d’augmenter temporairement l’Esprit lors de l’utilisation de sorts.',chance:null,notes:'Guide Forever : taux et durée exacts non établis à ce stade.',source:'https://mobalytics.gg/wow-forever/guides/enchanting-profession-guide'},
  {name:'Enchantement d’arme — Recovery',family:'enchant',tag:'Enchantement Forever',level:null,trigger:'Attaque parée ou esquivée',effect:'Possibilité de récupérer de la vie dans une situation de parade ou d’esquive adverse.',chance:null,notes:'Guide Forever : déclencheur documenté, fréquence non validée ici.',source:'https://mobalytics.gg/wow-forever/guides/enchanting-profession-guide'},
  {name:'Enchantement d’arme — Revelation',family:'enchant',tag:'Enchantement Forever',level:null,trigger:'Sort direct non critique',effect:'Possibilité d’accroître fortement les chances de critique du prochain sort direct après un sort qui n’a pas critiqué.',chance:null,notes:'Guide Forever : effet décrit ; fréquence de proc à confirmer en combat.',source:'https://mobalytics.gg/wow-forever/guides/enchanting-profession-guide'}
 ];
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 let filter='all',term='';
 function card(r){
  return '<article class="binch-wow-proc" data-kind="'+r.family+'"><div class="binch-wow-proc-heading"><span>'+esc(r.tag)+'</span><span>'+(r.level?'Niveau '+r.level+' requis':'Niveau variable')+'</span></div><h3>'+esc(r.name)+'</h3><div class="binch-wow-proc-trigger"><strong>Déclencheur :</strong> '+esc(r.trigger)+'</div><p>'+esc(r.effect)+'</p><div class="binch-wow-proc-chance"><strong>Chance de proc :</strong> '+(r.chance!==null?r.chance+' % confirmé':'Non confirmée')+'</div><small>'+esc(r.notes)+'</small><a href="'+r.source+'" target="_blank" rel="noopener noreferrer">Fiche source ↗</a></article>';
 }
 function draw(){
  const output=$('#binch-wow-procs-cards');if(!output)return;
  const matches=data.filter(p=>(filter==='all'||p.family===filter)&&[p.name,p.tag,p.trigger,p.effect].join(' ').toLocaleLowerCase('fr').includes(term));
  output.innerHTML=matches.length?matches.map(card).join(''):'<p>Aucun proc correspondant à cette recherche.</p>';
  const n=$('#binch-wow-procs-count');if(n)n.textContent=matches.length+' / '+data.length+' exemples sourcés';
 }
 function mount(){
  const lib=$('#page-bibliotheque');if(!lib||$('#binch-wow-procs'))return;
  const details=document.createElement('details');details.id='binch-wow-procs';details.className='binch-wow-procs';
  details.innerHTML='<summary><span class="binch-wow-procs-icon">ϟ</span><span><strong>Vrais procs de Warcraft</strong><small>Déclencheurs, effets et données sources — pas les surprises cosmétiques</small></span><span class="binch-wow-procs-pill">7 fiches sourcées</span></summary><div class="binch-wow-procs-body"><p class="binch-wow-procs-notice"><b>Tableau de référence, pas un simulateur.</b> Les effets viennent de fiches WoW Forever ou de guides dédiés. Un taux absent ou contradictoire reste « non confirmé ». Les chances de drop et les animations de Choc nébulaire n’ont aucun rapport avec ces mécaniques.</p><div class="binch-wow-procs-tools"><input id="binch-wow-procs-search" type="search" placeholder="Chercher un objet, sort ou déclencheur…" aria-label="Rechercher un proc"><div id="binch-wow-procs-filters"><button type="button" data-kind="all" aria-pressed="true">Tous</button><button type="button" data-kind="weapon">Armes</button><button type="button" data-kind="trinket">Bijoux</button><button type="button" data-kind="enchant">Enchantements</button></div><span id="binch-wow-procs-count"></span></div><div class="binch-wow-procs-grid" id="binch-wow-procs-cards"></div><p class="binch-wow-procs-disclaimer">Catalogue initial non exhaustif. Les fiches historiques Classic et les pages Forever peuvent différer ; la version du client prime lors d’un désaccord.</p></div>';
  const first=lib.querySelector('.binch-library-encyclopedia')||lib.firstElementChild; if(first)first.before(details);else lib.append(details);
  details.querySelectorAll('[data-kind]').forEach(btn=>btn.onclick=()=>{filter=btn.dataset.kind;details.querySelectorAll('button[data-kind]').forEach(b=>b.setAttribute('aria-pressed',String(b===btn)));draw()});
  details.querySelector('#binch-wow-procs-search').oninput=e=>{term=e.target.value.trim().toLocaleLowerCase('fr');draw()};
  draw();
  window.BinchOpenWoWProcs=()=>{details.open=true;details.scrollIntoView({block:'start',behavior:window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches?'instant':'smooth'});details.querySelector('#binch-wow-procs-search')?.focus({preventScroll:true})};
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
})();

/* La Binch — VRAIS PROCS: événements visuels de l'interface.
 * Distincts des artéfacts/trésors ET des procs officiels de WoW.
 * Tirage à chaque navigation admissible, cooldown, aucune animation permanente.
 */
(()=>{'use strict';
const KEY='binch.true-procs.v1', COOLDOWN=45000, $=s=>document.querySelector(s);
const DATA=[
 {id:'chicken',title:'La grande évasion',rarity:'Commun',chance:1.45,kind:'road',caption:'Un poulet prend la fuite. Un péon découvre qu’il court moins vite que sa dette.',actors:['chicken','peon']},
 {id:'gnome',title:'Une invention parfaitement sûre',rarity:'Commun',chance:1.15,kind:'blast',caption:'Le gnome avait dit « presque sûr ». La machine avait entendu « presque ».',actors:['gnome','machine']},
 {id:'murloc',title:'Le diplomate amphibie',rarity:'Commun',chance:1.10,kind:'slide',caption:'Un murloc salue la foule avant de glisser sur sa dignité.',actors:['murloc','letter']},
 {id:'book',title:'La revanche du grimoire',rarity:'Inhabituel',chance:0.85,kind:'fall',caption:'Quand les livres ont une opinion, les casques deviennent indispensables.',actors:['book','peon']},
 {id:'drake',title:'Éternuement draconique',rarity:'Rare',chance:0.55,kind:'fly',caption:'Un dragonnet éternue. Une tour perd sa dignité, mais pas ses pierres.',actors:['drake','spark']},
 {id:'specter',title:'La ronde des disparus',rarity:'Légendaire',chance:0.08,kind:'ghost',caption:'La vieille bannière se souvient de ceux qui ne sont jamais rentrés.',actors:['specter','banner']},
 {id:'bear',title:'L’ours et la lune',rarity:'Commun',chance:1.35,kind:'dance',caption:'Un ours essaie de danser. Les druides gardent un silence diplomatique.',actors:['bear','moon']},
 {id:'tavern',title:'La tournée fantôme',rarity:'Commun',chance:1.20,kind:'bounce',caption:'Un tonneau roule tout seul. L’aubergiste préfère ne pas poser de questions.',actors:['barrel','specter']},
 {id:'frog',title:'Conseil du vieux crapaud',rarity:'Commun',chance:1.00,kind:'bounce',caption:'Le marais a parlé. Il réclame une mouche et davantage de respect.',actors:['frog','flybug']},
 {id:'owl',title:'Le hibou bureaucrate',rarity:'Inhabituel',chance:0.90,kind:'swirl',caption:'Trois parchemins signés, un tampon. Le hibou est officiellement en retard.',actors:['owl','scroll']},
 {id:'goblin',title:'Le prix de l’impossible',rarity:'Inhabituel',chance:0.82,kind:'duel',caption:'Le gobelin vend une garantie qui expire une seconde avant l’explosion.',actors:['goblin','coin']},
 {id:'cauldron',title:'Le chaudron capricieux',rarity:'Inhabituel',chance:0.78,kind:'forge',caption:'La potion passe du vert au violet. L’alchimiste annule le dîner.',actors:['cauldron','spark']},
 {id:'raven',title:'Le messager des cendres',rarity:'Inhabituel',chance:0.75,kind:'fly',caption:'Un corbeau apporte une lettre sans destinataire. Faith connaît pourtant l’écriture.',actors:['raven','letter']},
 {id:'cat',title:'La reine des toits',rarity:'Inhabituel',chance:0.72,kind:'chase',caption:'Une chatte vole la couronne d’un héros. Personne n’ose la récupérer.',actors:['cat','crown']},
 {id:'totem',title:'Les quatre vents',rarity:'Rare',chance:0.50,kind:'swirl',caption:'Un totem oublié se réveille et rappelle que les éléments n’aiment pas patienter.',actors:['totem','wisp']},
 {id:'forge',title:'L’étincelle de Sulfuras',rarity:'Rare',chance:0.43,kind:'forge',caption:'Une étincelle raconte un marteau de légende. Faith se tait un instant.',actors:['hammer','ember']},
 {id:'portal',title:'Le portail qui hésite',rarity:'Rare',chance:0.40,kind:'orbit',caption:'Le portail demande l’adresse. Le mage avait oublié de noter la destination.',actors:['portal','mage']},
 {id:'turtle',title:'Le champion du détour',rarity:'Rare',chance:0.38,kind:'race',caption:'Une tortue termine la course en première place. Les autres étaient partis hier.',actors:['turtle','hourglass']},
 {id:'whisper',title:'Un murmure de l’au-delà',rarity:'Épique',chance:0.28,kind:'ghost',caption:'Deux voix se répondent au-dessus d’un vieux masque. Aucun vent ne souffle.',actors:['spiritmask','wisp']},
 {id:'meteor',title:'Une étoile en retard',rarity:'Épique',chance:0.24,kind:'crash',caption:'Une météorite manque la bataille. Les astronomes l’appellent « retard stratégique ».',actors:['meteor','shield']},
 {id:'dream',title:'Le jardin des rêveurs',rarity:'Épique',chance:0.22,kind:'bloom',caption:'Une fleur pousse dans le vide. Le temps semble, un instant, respirer autrement.',actors:['flower','butterfly']},
 {id:'sea',title:'L’appel des profondeurs',rarity:'Très rare',chance:0.16,kind:'ripple',caption:'Une conque répond à la mer, même à des centaines de lieues des vagues.',actors:['shell','fish']},
 {id:'phoenix',title:'Le dernier feu',rarity:'Très rare',chance:0.12,kind:'rebirth',caption:'Le phénix se défait en braises, puis se souvient qu’il n’a pas fini.',actors:['phoenix','ember']},
 {id:'faith',title:'La mémoire de Faith',rarity:'Légendaire',chance:0.04,kind:'ascend',caption:'L’esprit du chaman lève les yeux. Au loin, l’écho de Sulfuras résonne encore.',actors:['spiritmask','hammer']}
].map(x=>({...x,trigger:'Navigation'}));

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
// Assets SVG originaux et autonomes ; tous visibles dans le codex après déblocage.
const makeArt=inside=>'<svg viewBox="0 0 100 100" aria-hidden="true" focusable="false">'+inside+'</svg>';
const extraArt={
 bear:makeArt('<circle cx="23" cy="23" r="16" fill="#6f654e"/><circle cx="77" cy="23" r="16" fill="#6f654e"/><ellipse cx="50" cy="55" rx="40" ry="38" fill="#967b60" stroke="#3d403c" stroke-width="4"/><ellipse cx="50" cy="70" rx="23" ry="17" fill="#d5bd97"/><circle cx="34" cy="48" r="6" fill="#24272e"/><circle cx="66" cy="48" r="6" fill="#24272e"/><path d="M43 66q7-9 15 0q-7 11-15 0" fill="#272329"/>'),
 moon:makeArt('<circle cx="52" cy="50" r="35" fill="#eddaa9"/><circle cx="67" cy="34" r="32" fill="#2b365c"/><circle cx="18" cy="18" r="3" fill="#fcf6d4"/><circle cx="79" cy="71" r="4" fill="#f4ecac"/>'),
 barrel:makeArt('<rect x="20" y="20" width="60" height="65" rx="17" fill="#856341" stroke="#432f2a" stroke-width="5"/><path d="M19 39h62M19 67h62" stroke="#c2b7aa" stroke-width="9"/><path d="M40 22v62M60 22v62" stroke="#4d3a2b" stroke-width="3"/>'),
 frog:makeArt('<ellipse cx="50" cy="62" rx="39" ry="27" fill="#659c65" stroke="#335d4d" stroke-width="4"/><circle cx="33" cy="35" r="18" fill="#8bbc79"/><circle cx="69" cy="35" r="18" fill="#8bbc79"/><circle cx="34" cy="35" r="9" fill="#f1f3c0"/><circle cx="68" cy="35" r="9" fill="#f1f3c0"/><circle cx="34" cy="37" r="4" fill="#293d35"/><circle cx="67" cy="37" r="4" fill="#293d35"/><path d="M34 65Q50 77 69 64" fill="none" stroke="#304638" stroke-width="5"/>'),
 flybug:makeArt('<ellipse cx="50" cy="53" rx="12" ry="24" fill="#e0a65b"/><ellipse cx="28" cy="37" rx="20" ry="29" fill="#b6e0dd" fill-opacity=".8"/><ellipse cx="72" cy="37" rx="20" ry="29" fill="#b6e0dd" fill-opacity=".8"/><path d="M50 30v52" stroke="#404d44" stroke-width="4"/>'),
 owl:makeArt('<path d="M17 17 44 25 50 10 60 25 84 17 78 76 55 90 23 75Z" fill="#836b5c" stroke="#3e3e43" stroke-width="4"/><circle cx="36" cy="48" r="16" fill="#e6d6ab"/><circle cx="66" cy="48" r="16" fill="#e6d6ab"/><circle cx="36" cy="48" r="7" fill="#252d35"/><circle cx="65" cy="48" r="7" fill="#252d35"/><path d="m48 58 12 0-6 12Z" fill="#e9ab63"/>'),
 scroll:makeArt('<rect x="29" y="18" width="47" height="63" rx="4" fill="#e9d8a4" stroke="#a18b5d" stroke-width="4"/><path d="M35 35h35M35 46h24M35 57h30" stroke="#a5906c" stroke-width="4"/><circle cx="24" cy="22" r="11" fill="#eacb89" stroke="#826a51" stroke-width="3"/><circle cx="24" cy="78" r="11" fill="#eacb89" stroke="#826a51" stroke-width="3"/>'),
 goblin:makeArt('<path d="M32 40 3 25l10 32 27-4M68 40l29-15-10 32-27-4" fill="#7ea26b" stroke="#365c41" stroke-width="4"/><ellipse cx="50" cy="52" rx="28" ry="30" fill="#91b777" stroke="#365c41" stroke-width="4"/><circle cx="39" cy="45" r="5" fill="#252d2b"/><circle cx="61" cy="45" r="5" fill="#252d2b"/><path d="m42 64 18 1-10 6Z" fill="#f4e1b8"/><path d="M30 22h41l-8-12H40Z" fill="#6b4163"/>'),
 coin:makeArt('<circle cx="50" cy="50" r="35" fill="#c89546" stroke="#f3d996" stroke-width="7"/><circle cx="50" cy="50" r="22" fill="none" stroke="#89623a" stroke-width="4"/><path d="M62 36Q35 28 39 47Q42 54 58 54Q70 65 45 69" fill="none" stroke="#f8e4a1" stroke-width="7"/>'),
 cauldron:makeArt('<path d="M20 35h60l-8 42-13 11H40L27 77Z" fill="#536961" stroke="#b6b99e" stroke-width="5"/><ellipse cx="50" cy="35" rx="33" ry="13" fill="#86c2a2" stroke="#ced5b9" stroke-width="4"/><circle cx="37" cy="27" r="6" fill="#bcecab"/><circle cx="60" cy="18" r="7" fill="#bcecab"/><path d="M41 88v10M61 88v10" stroke="#e0c890" stroke-width="5"/>'),
 raven:makeArt('<path d="M19 78Q3 53 24 29Q38 11 60 31Q73 37 85 25L80 48Q93 80 68 88Z" fill="#465067" stroke="#272d40" stroke-width="5"/><circle cx="60" cy="46" r="5" fill="#ecd19b"/><path d="m78 54 19 4-18 8Z" fill="#cca06f"/><path d="M25 58 1 84 34 78" fill="#303549"/>'),
 cat:makeArt('<path d="M15 36V8l27 20Q50 21 59 28L84 8V37Q97 71 69 87Q34 102 16 74Z" fill="#6e7180" stroke="#343b4e" stroke-width="5"/><ellipse cx="35" cy="53" rx="9" ry="11" fill="#f1dc9f"/><ellipse cx="66" cy="53" rx="9" ry="11" fill="#f1dc9f"/><path d="m46 71 8 0-4 7Z" fill="#e8a5a4"/><path d="M22 73H5M77 73h18" stroke="#f1f1ef" stroke-width="3"/>'),
 crown:makeArt('<path d="M14 27 34 44 48 13l18 31 22-17-9 52H22Z" fill="#dfb35f" stroke="#6e5434" stroke-width="5"/><path d="M26 74h50" stroke="#f5e1a3" stroke-width="8"/><circle cx="49" cy="57" r="8" fill="#c04c67"/>'),
 totem:makeArt('<rect x="31" y="11" width="38" height="79" rx="7" fill="#926c4f" stroke="#443b35" stroke-width="5"/><path d="M22 36 50 13 80 36 50 54Z" fill="#69a6a4" stroke="#2d6268" stroke-width="5"/><circle cx="43" cy="35" r="4" fill="#f6e4b2"/><circle cx="60" cy="35" r="4" fill="#f6e4b2"/><path d="M32 65h37M32 77h37" stroke="#d3b983" stroke-width="5"/>'),
 wisp:makeArt('<circle cx="51" cy="53" r="22" fill="#9fdcd9" stroke="#ecffeb" stroke-width="3"/><path d="M53 10Q25 29 34 42M67 12Q84 39 73 53M46 76Q22 72 17 92" fill="none" stroke="#d5f7e9" stroke-width="8" stroke-linecap="round"/><circle cx="48" cy="49" r="7" fill="#fff9d8"/>'),
 hammer:makeArt('<path d="M44 36 56 46 36 90 25 85Z" fill="#9b7651" stroke="#4f3b35" stroke-width="4"/><path d="M23 16 69 10 86 27 58 56 16 35Z" fill="#ac6854" stroke="#f2c279" stroke-width="5"/><path d="M28 26h39M44 14l11 33" stroke="#f8e0a4" stroke-width="3"/>'),
 ember:makeArt('<path d="M50 5Q19 37 37 50Q17 55 25 76Q48 103 70 80Q83 62 64 42Q68 22 50 5Z" fill="#eb8b56" stroke="#f8c684" stroke-width="5"/><path d="M50 48Q34 65 42 81Q60 89 64 71Z" fill="#ffe3a3"/>'),
 portal:makeArt('<ellipse cx="50" cy="51" rx="36" ry="43" fill="#332d5d" stroke="#a9a7da" stroke-width="8"/><ellipse cx="50" cy="51" rx="23" ry="32" fill="#568fb8"/><path d="M41 27Q75 40 40 59Q18 72 60 78" stroke="#c2d8ff" fill="none" stroke-width="5"/>'),
 mage:makeArt('<path d="M18 45 50 6 81 45Z" fill="#596caf" stroke="#a7b6eb" stroke-width="5"/><ellipse cx="50" cy="58" rx="25" ry="27" fill="#c2a8a5" stroke="#8f8493" stroke-width="4"/><circle cx="40" cy="55" r="4" fill="#2e3247"/><circle cx="60" cy="55" r="4" fill="#2e3247"/><path d="M32 74Q50 98 68 74" fill="#eae2ce"/>'),
 turtle:makeArt('<ellipse cx="51" cy="56" rx="36" ry="25" fill="#83a97e" stroke="#536d64" stroke-width="5"/><path d="M28 60q22-28 46 0M50 31v50" fill="none" stroke="#4e7059" stroke-width="5"/><circle cx="83" cy="61" r="15" fill="#8fb28f"/><circle cx="90" cy="59" r="3" fill="#253c39"/><path d="M25 80l-7 13M57 82l-3 13" stroke="#64866b" stroke-width="9"/>'),
 hourglass:makeArt('<path d="M24 10h52M24 89h52M30 10Q32 34 50 50Q68 63 70 89H30Q32 64 50 50Q68 32 70 10" stroke="#c8af82" stroke-width="6" fill="#435060"/><path d="M34 20h32L50 42ZM35 78l15-15 16 15Z" fill="#d7b879"/>'),
 spiritmask:makeArt('<path d="M22 15Q50-5 78 15L85 62 66 88H34L15 62Z" fill="#598baa" fill-opacity=".85" stroke="#b4e0e2" stroke-width="5"/><ellipse cx="36" cy="50" rx="11" ry="6" fill="#e2ffff"/><ellipse cx="65" cy="50" rx="11" ry="6" fill="#e2ffff"/><path d="M31 78q18-12 38 0" fill="none" stroke="#d1f0ee" stroke-width="5"/><path d="M20 70 7 84 10 55M79 70l14 14-3-29" stroke="#eef6dd" stroke-width="6"/>'),
 meteor:makeArt('<path d="M8 9 51 27 73 45 84 73 65 89 37 76 21 47Z" fill="#d87757" stroke="#f3ba83" stroke-width="5"/><path d="M5 6 38 20M6 28l36 16M13 58l26 7" stroke="#ffd68d" stroke-width="6"/><path d="M52 51 67 60 58 76 42 64Z" fill="#74536b"/>'),
 shield:makeArt('<path d="M50 8 83 24 77 69 50 92 23 69 17 24Z" fill="#758ea5" stroke="#c6d2df" stroke-width="6"/><path d="M50 16v65M27 48h47" stroke="#ddc9a2" stroke-width="6"/>'),
 flower:makeArt('<circle cx="50" cy="35" r="12" fill="#f3d99b"/><circle cx="28" cy="33" r="18" fill="#d5a9e4"/><circle cx="73" cy="33" r="18" fill="#bca3e7"/><circle cx="48" cy="15" r="16" fill="#a4cce9"/><circle cx="47" cy="55" r="16" fill="#d6addc"/><circle cx="50" cy="35" r="10" fill="#f5d97d"/><path d="M49 55v42M49 79q-24-17-28 0M52 88q20-19 30-7" fill="none" stroke="#73b193" stroke-width="6"/>'),
 butterfly:makeArt('<ellipse cx="28" cy="28" rx="23" ry="19" fill="#bca8f2"/><ellipse cx="73" cy="28" rx="23" ry="19" fill="#9dd4da"/><ellipse cx="29" cy="65" rx="18" ry="22" fill="#ddc69e"/><ellipse cx="71" cy="65" rx="18" ry="22" fill="#d4a6dd"/><path d="M49 15v70M49 22 34 4M51 22 67 4" stroke="#665a75" stroke-width="7"/>'),
 shell:makeArt('<path d="M12 71Q-3 27 50 14Q103 27 88 71L51 89Z" fill="#b4bfd0" stroke="#7b8eac" stroke-width="6"/><path d="M50 19 50 84M32 24 43 83M69 24 58 83M18 36 35 79M82 36 64 79" stroke="#eff2e7" stroke-width="4"/>'),
 fish:makeArt('<ellipse cx="43" cy="53" rx="32" ry="22" fill="#80c4c5" stroke="#458b9e" stroke-width="5"/><path d="M71 53 97 30v46Z" fill="#6b9ec1"/><circle cx="27" cy="49" r="5" fill="#223f50"/><path d="M48 32 57 12 68 35" fill="#a6e0dc"/>'),
 phoenix:makeArt('<path d="M50 9Q12 45 30 75Q39 93 52 94Q77 88 76 60Q69 67 65 70Q74 39 50 9Z" fill="#ec9253" stroke="#f7cb83" stroke-width="5"/><path d="M47 30Q35 61 49 78Q64 76 62 58Q55 62 55 65Z" fill="#ffe0a0"/><path d="M24 64 6 48 18 86M77 63 95 43 89 85" stroke="#f0aa58" stroke-width="7"/>')
};
Object.assign(art,extraArt);

const load=()=>{try{const v=JSON.parse(localStorage.getItem(KEY));return v&&typeof v==='object'?v:{enabled:true,total:0,hits:{},history:[],last:0}}catch{return {enabled:true,total:0,hits:{},history:[],last:0}}};
let state=load();state.hits=state.hits||{};state.history=Array.isArray(state.history)?state.history:[];
if(typeof state.enabled!=='boolean')state.enabled=true;
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(state))}catch{}};
let stage=null,closing=null;
const formatPercent=n=>n.toLocaleString('fr-FR',{maximumFractionDigits:2})+' %';
function previewUnlocked(id){
 try{const hub=JSON.parse(localStorage.getItem('grimoire.hub.v3'));const name=String(hub?.data?.pseudo||hub?.name||'').toLocaleLowerCase('fr');if(name==='shaaby')return true}catch{}
 return Number(state.hits?.[id]||0)>0;
}
function closeStage(){if(closing)clearTimeout(closing);if(stage){stage.remove();stage=null}document.body.classList.remove('binch-proc-playing')}
function play(e,preview=false){
 closeStage();
 stage=document.createElement('section');stage.id='binch-proc-stage';stage.className='binch-proc-scene scene-'+e.kind;stage.setAttribute('role','region');stage.setAttribute('aria-label','Scène découverte : '+e.title);
 stage.innerHTML='<div class="binch-proc-curtain" aria-hidden="true"></div><div class="binch-proc-theater"><div class="binch-proc-scene-tag">'+(preview?'REPRÉSENTATION · SANS TIRAGE':'UN PROC ! · '+e.rarity)+'</div><div class="binch-proc-actors"><div class="binch-proc-actor first">'+art[e.actors[0]]+'</div><div class="binch-proc-actor second">'+art[e.actors[1]]+'</div></div><div class="binch-proc-caption"><h3>'+e.title+'</h3><p>'+e.caption+'</p></div><button type="button" class="binch-proc-skip" aria-label="Fermer cette scène">Passer ✕</button></div>';
 const page=document.querySelector('#app main .page.active')||document.querySelector('#page-evenements');if(!page)return;page.prepend(stage);
 stage.querySelector('button').addEventListener('click',closeStage);
 /* Ne vole pas le focus clavier. */
 const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
 closing=setTimeout(closeStage,reduce?3800:6500);
 if(!preview){state.hits[e.id]=(Number(state.hits[e.id])||0)+1;state.history.unshift({id:e.id,t:Date.now()});state.history=state.history.slice(0,30);state.last=Date.now();save();render()}
}
function roll(){
 if(!state.enabled||Date.now()-Number(state.last||0)<COOLDOWN||stage)return;
 state.total=(Number(state.total)||0)+1;
 state.last=Date.now(); // cooldown starts for every eligible draw, not just winners
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
  const unlocked=previewUnlocked(e.id);item.classList.toggle('binch-proc-locked',!unlocked);item.innerHTML='<div class="binch-procs-entry-art">'+art[e.actors[0]]+'</div><div class="binch-procs-entry-text"><small>'+e.rarity+' · '+e.trigger+'</small><strong>'+e.title+'</strong><p>'+e.caption+'</p></div><div class="binch-procs-entry-chance"><strong>'+formatPercent(e.chance)+'</strong><small>par navigation éligible</small><span>'+(unlocked?'✦ Débloqué':'◇ Non découvert')+' · vus '+(state.hits[e.id]||0)+'</span><button type="button"'+(unlocked?'':' disabled title="Débloque la scène en la découvrant"')+'>'+(unlocked?'Revoir la scène':'À découvrir')+'</button></div>';
  item.querySelector('button').onclick=()=>{if(previewUnlocked(e.id))play(e,true)};table.append(item);
 }
 log.replaceChildren();
 if(!state.history.length){log.textContent='Aucun proc naturel pour le moment. Un aperçu ne compte pas comme un tirage.';return}
 for(const record of state.history.slice(0,15)){const e=DATA.find(x=>x.id===record.id);if(!e)continue;const line=document.createElement('div');line.textContent=e.title+' · '+new Date(record.t).toLocaleString('fr-FR');log.append(line)}
}
function mount(){
 const nav=$('#app nav.nav'),main=$('#app main');if(!nav||!main||$('#page-evenements'))return;
 const button=document.createElement('button');button.type='button';button.dataset.page='evenements';button.textContent='Choc nébulaire';nav.append(button);
 const page=document.createElement('section');page.id='page-evenements';page.className='page';
 page.innerHTML='<div class="binch-procs-hero"><span>LA BINCH · LA SCÈNE DES IMPROBABLES</span><h1>Choc nébulaire</h1><p>Pas des artéfacts à gagner : de vrais mini-événements qui surgissent dans l’interface, avec leurs propres personnages et mouvements.</p><div class="binch-procs-mode">☑ Événements cosmétiques propres à La Binch — <strong>aucun objet, avantage ou taux de proc WoW officiel</strong>.</div></div><div class="binch-procs-layout"><section class="binch-procs-main"><div class="binch-procs-subhead"><div><div class="eyebrow">TABLE D’ÉVÉNEMENTS</div><h2>Déclencheurs & probabilités</h2></div><span id="binch-true-procs-stats"></span></div><p class="binch-procs-rule">À chaque clic de navigation principale, si le cooldown de 45 secondes est terminé, un seul tirage est effectué. Les chances ci-dessous sont des valeurs internes transparentes, jamais des taux WoW. Un événement réussi démarre une scène visible ; les aperçus ne comptent pas.</p><label class="binch-procs-toggle"><input id="binch-procs-enable" type="checkbox" checked><span>Autoriser les événements surprises pendant la navigation</span></label><div id="binch-true-procs-list"></div></section><aside class="binch-procs-aside"><h2>Le journal de scène</h2><p>Souvenirs des scènes naturellement déclenchées sur cet appareil.</p><div id="binch-true-procs-log"></div><button type="button" id="binch-proc-demo">Voir un événement de démonstration</button><p>Accessibilité : bouton pour passer une scène, préférence système « Réduire les animations » respectée. Les effets ne tournent jamais en continu.</p></aside></div>';
 main.append(page);
 button.onclick=()=>{nav.querySelectorAll('button[data-page]').forEach(b=>b.classList.toggle('active',b===button));main.querySelectorAll('.page').forEach(p=>p.classList.toggle('active',p===page));scrollTo({top:0,behavior:'instant'});render()};
 $('#binch-procs-enable').onchange=e=>{state.enabled=e.target.checked;save();render()};
 $('#binch-proc-demo').onclick=()=>{const pool=DATA.filter(e=>previewUnlocked(e.id));if(!pool.length){alert('Découvre ta première scène en naviguant dans La Binch.');return}play(pool[Math.floor(Math.random()*pool.length)],true)};
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&stage){e.preventDefault();closeStage()}});
 document.addEventListener('click',e=>{
  if(!e.isTrusted)return;
  const target=e.target.closest('#app nav.nav button[data-page]');
  if(target)roll()
 },false);
 render();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
})();

/* La Binch P9 — identité composite, reforge transactionnelle et décors légers. */
(()=>{'use strict';
const KEY='grimoire.hub.v3';
const RACES={
 Humain:{id:'human',glyph:'⚜',name:'Humain',matter:'#28332f',metal:'#d4b278',architecture:'royal',path:'<path d="M140 415V150h175v265M166 150V95h120v55M187 95V55h77v40M177 415V246q53-70 106 0v169M410 415V195h170v220M430 195V130h130v65M454 130V75h80v55M438 415V273q56-70 112 0v142"/><path d="M52 445h696M90 95l30-45 30 45 30-45 30 45" />'},
 Nain:{id:'dwarf',glyph:'◆',name:'Nain',matter:'#302b28',metal:'#dfae6d',architecture:'forge',path:'<path d="M55 420 190 115l116 305M115 420l75-160 60 160M275 420 425 65l175 355M343 420l80-180 87 180M550 420 650 165l103 255"/><path d="M390 220h95v30h-95zM418 250v130m-52-10h105M102 445h590"/>'},
 Elfe:{id:'elf',glyph:'☾',name:'Elfe',matter:'#122d2a',metal:'#9fdbcb',architecture:'moon-grove',path:'<path d="M350 28a145 145 0 1 0 105 245A118 118 0 0 1 350 28Z"/><path d="M125 435V275q10-110 95-175M125 285q-110-40-110-160M125 275q130-18 170-120M575 435V240q-20-85-100-125M575 250q112-40 135-130M575 250q-100-10-130-100"/><path d="M60 455h690"/>'},
 Gnome:{id:'gnome',glyph:'⚙',name:'Gnome',matter:'#293040',metal:'#aac9e9',architecture:'clockwork',path:'<circle cx="505" cy="220" r="116"/><circle cx="505" cy="220" r="77"/><circle cx="505" cy="220" r="22"/><path d="M505 67v43m0 220v45M351 220h43m220 0h45M396 110l32 32m150 150 32 32M396 330l32-32m150-150 32-32M150 425V185h180v240M170 185V130h140v55M180 425V260h120v165"/>'},
 Orc:{id:'orc',glyph:'✦',name:'Orc',matter:'#32291f',metal:'#bfa46b',architecture:'warcamp',path:'<path d="M65 435 128 75l52 80 46-70 46 350M325 435l63-360 52 80 46-70 46 350M600 435l55-300 55 300M90 300l160-95M335 300l160-95"/><path d="M88 445h640M160 205 240 120m160 85 80-85"/>'},
 MortVivant:{id:'forsaken',glyph:'☠',name:'Mort-vivant',matter:'#1c2a2e',metal:'#91c5ae',architecture:'necropolis',path:'<path d="M105 445V160l48-115 48 115v285M280 445V220l56-165 56 165v225M465 445V135l69-100 69 100v310M622 445V260l48-100 48 100v185"/><path d="M128 260h52m-36 50h20m150-10h50m137-70h70m-42 80h22M50 445h700"/><path d="M318 55a98 98 0 1 0 65 169A83 83 0 0 1 318 55Z"/>'},
 Tauren:{id:'tauren',glyph:'◉',name:'Tauren',matter:'#2c3026',metal:'#d8b37b',architecture:'totems',path:'<path d="M180 440V158h76v282M165 158q-90-10-90-90 55 55 125 30 80 25 125-30 0 80-70 90M185 228h65m-65 68h65M510 440V170h85v270m-120-270q80-85 155 0M485 265h130m-115 76h110"/><path d="M50 450h700m-360-20V85m-30 30 30-40 30 40"/>'},
 Troll:{id:'troll',glyph:'⟡',name:'Troll',matter:'#182e31',metal:'#69d0bd',architecture:'voodoo',path:'<path d="M390 65 255 162l22 155 115 98 115-98 22-155Z"/><path d="m295 220 65 24-30 26m158-50-65 24 30 26M367 345l25-32 25 32M285 295q-105 75-165-25 100 28 140-40M495 295q105 75 165-25-100 28-140-40"/><path d="M85 460V125m-25 55 25-75 25 75m560 280V125m-25 55 25-75 25 75"/>'}
};
const CLASSES={
 Guerrier:{id:'warrior',glyph:'⚔',light:'#dca77d',aura:'#8f392b',scene:'renaissance-p10-hero-warrior.svg',name:'Guerrier'},
 Paladin:{id:'paladin',glyph:'✧',light:'#f7d3b8',aura:'#d4aa64',scene:'renaissance-p10-hero-paladin.svg',name:'Paladin'},
 Chasseur:{id:'hunter',glyph:'➶',light:'#aadf88',aura:'#3a8066',scene:'renaissance-p10-hero-hunter.svg',name:'Chasseur'},
 Voleur:{id:'rogue',glyph:'✦',light:'#e7d394',aura:'#3a5967',scene:'renaissance-p10-hero-rogue.svg',name:'Voleur'},
 Prêtre:{id:'priest',glyph:'✢',light:'#fff2c7',aura:'#9b9ec8',scene:'renaissance-p10-hero-priest.svg',name:'Prêtre'},
 Chaman:{id:'shaman',glyph:'ϟ',light:'#9ddcf5',aura:'#1864a8',scene:'renaissance-p10-hero-shaman.svg',name:'Chaman'},
 Mage:{id:'mage',glyph:'✣',light:'#8bd8fc',aura:'#704ba2',scene:'renaissance-p10-hero-mage.svg',name:'Mage'},
 Démoniste:{id:'warlock',glyph:'⬡',light:'#c2a6f5',aura:'#623d91',scene:'renaissance-p9-hero-warlock.svg',name:'Démoniste'},
 Druide:{id:'druid',glyph:'❧',light:'#b4e28f',aura:'#3f8e5e',scene:'renaissance-p9-hero-druid.svg',name:'Druide'}
};
const JOBS={
 Minage:{glyph:'◆',name:'Minage',effect:'ore'},
 Ingénierie:{glyph:'⚙',name:'Ingénierie',effect:'clock'},
 Herboristerie:{glyph:'❧',name:'Herboristerie',effect:'leaves'},
 Alchimie:{glyph:'⚗',name:'Alchimie',effect:'vials'},
 Dépeçage:{glyph:'◇',name:'Dépeçage',effect:'hides'},
 'Travail du cuir':{glyph:'◈',name:'Travail du cuir',effect:'leather'},
 Forge:{glyph:'⚒',name:'Forge',effect:'sparks'},
 Enchantement:{glyph:'✧',name:'Enchantement',effect:'runes'},
 Couture:{glyph:'⌁',name:'Couture',effect:'threads'}
};
const keys=o=>Object.keys(o),valid=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
function clean(input){
 const p=input&&typeof input==='object'?input:{};
 return {race:valid(RACES,p.race)?p.race:'Humain',classe:valid(CLASSES,p.classe)?p.classe:'Guerrier',
  jobs:[...new Set(Array.isArray(p.jobs)?p.jobs.filter(x=>valid(JOBS,x)):[])].slice(0,2)};
}
function read(){
 try{return JSON.parse(localStorage.getItem(KEY))||{}}catch{return {}}
}
function raceArt(race){
 // Paths are fixed product artwork, never assembled from user-supplied markup.
 const r=RACES[race];
 const svg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 480"><g fill="none" stroke="'+r.metal+'" stroke-width="9" stroke-linecap="round" stroke-linejoin="round" opacity=".9">'+r.path+'</g></svg>';
 return 'url("data:image/svg+xml,'+encodeURIComponent(svg)+'")';
}
function compose(input){
 const p=clean(input),r=RACES[p.race],c=CLASSES[p.classe],j=p.jobs.map(x=>JOBS[x]);
 return {profile:p,race:r,classe:c,jobs:j,
  vars:{'--br-race-matter':r.matter,'--br-race-metal':r.metal,'--br-race-art':raceArt(p.race),
  '--br-class-light':c.light,'--br-vital-aura':c.aura,'--br-class-world':'url("./'+c.scene+'")',
  '--br-job-glyph':JSON.stringify(j[0]?.glyph||''),'--br-second-glyph':JSON.stringify(j[1]?.glyph||'')},
  signature:r.name+' · '+c.name+(j.length?' · '+j.map(x=>x.name).join(' / '):'')};
}
function apply(input){
 const c=compose(input),root=document.documentElement;
 root.dataset.brRace=c.race.id;root.dataset.brClass=c.classe.id;
 // The Shaaby artwork is a flagship only for the authentic saved Tauren/Druide identity.
 // It must not be applied to other characters or while the initial wizard is unfinished.
 root.dataset.binchShaaby=String(Boolean(input?.onboarded&&c.profile.race==='Tauren'&&c.profile.classe==='Druide'));
 root.dataset.binchForsaken=String(Boolean(input?.onboarded&&c.profile.race==='MortVivant'&&c.profile.classe==='Démoniste'));
 // P16 third cinematic flagship: same Tauren race, entirely different shamanic world.
 root.dataset.binchStorm=String(Boolean(input?.onboarded&&c.profile.race==='Tauren'&&c.profile.classe==='Chaman'));
 // Fourth premium flagship: Gnome Mage star-library, never activated on other races/classes.
 root.dataset.binchMageLibrary=String(Boolean(input?.onboarded&&c.profile.race==='Gnome'&&c.profile.classe==='Mage'));
 root.dataset.brJobs=c.jobs.map(j=>j.effect).join(' ');
 for(const [key,value] of Object.entries(c.vars))root.style.setProperty(key,value);
 const note=document.getElementById('binch-identity-signature');
 if(note)note.textContent=c.signature;
 return c;
}
function commit(draft){
 const p=clean(draft),prior=read();
 const next={...prior,race:p.race,classe:p.classe,jobs:p.jobs,onboarded:true,step:2};
 try{localStorage.setItem(KEY,JSON.stringify(next));return true}catch{return false}
}
let dialog=null,draft=null,opener=null;
function el(tag,className,textContent){
 const n=document.createElement(tag);
 if(className)n.className=className;
 if(textContent!==undefined)n.textContent=textContent;
 return n;
}
function button(label,css){
 const b=el('button',css,label);b.type='button';return b;
}
function field(label,kind,data){
 const set=el('fieldset','binch-reforge-set'),legend=el('legend','',label),grid=el('div','binch-reforge-options');
 grid.dataset.kind=kind;
 for(const [name,t] of Object.entries(data)){
  const b=button('', 'binch-reforge-choice');
  b.dataset.value=name;
  b.append(el('span','binch-reforge-glyph',t.glyph),el('span','',t.name));
  grid.append(b);
 }
 set.append(legend,grid);
 return set;
}
function refresh(){
 if(!dialog||!draft)return;
 const c=compose(draft),preview=dialog.querySelector('.binch-reforge-preview');
 preview.dataset.binchShaabyPreview=String(c.profile.race==='Tauren'&&c.profile.classe==='Druide');
 preview.dataset.binchForsakenPreview=String(c.profile.race==='MortVivant'&&c.profile.classe==='Démoniste');
 preview.dataset.binchStormPreview=String(c.profile.race==='Tauren'&&c.profile.classe==='Chaman');
 preview.dataset.binchMageLibraryPreview=String(c.profile.race==='Gnome'&&c.profile.classe==='Mage');
 // Reforge's surrounding materials follow the unsaved preview, not the saved character.
 dialog.dataset.binchPreview=c.profile.race==='Tauren'&&c.profile.classe==='Druide'?'shaaby':c.profile.race==='Tauren'&&c.profile.classe==='Chaman'?'storm':c.profile.race==='Gnome'&&c.profile.classe==='Mage'?'mage-library':c.profile.race==='MortVivant'&&c.profile.classe==='Démoniste'?'forsaken':'other';
 preview.style.setProperty('--br-preview-world',c.vars['--br-class-world']);
 preview.style.setProperty('--br-preview-race',c.vars['--br-race-art']);
 preview.style.setProperty('--br-preview-metal',c.race.metal);
 preview.style.setProperty('--br-preview-aura',c.classe.aura);
 preview.querySelector('.binch-reforge-summary').textContent=c.signature;
 preview.querySelector('.binch-reforge-emblem').textContent=c.classe.glyph;
 dialog.querySelectorAll('.binch-reforge-options').forEach(grid=>{
  grid.querySelectorAll('button').forEach(b=>{
   const selected=grid.dataset.kind==='race'?draft.race===b.dataset.value:
    grid.dataset.kind==='classe'?draft.classe===b.dataset.value:draft.jobs.includes(b.dataset.value);
   b.setAttribute('aria-pressed',String(selected));
   b.classList.toggle('selected',selected);
  });
 });
 dialog.querySelector('.binch-reforge-job-count').textContent=draft.jobs.length+'/2 métiers · sélection facultative';
}
function close(){
 if(!dialog)return;
 if(dialog.open&&typeof dialog.close==='function')dialog.close();else dialog.removeAttribute('open');
 draft=null;opener?.focus?.();
}
function createDialog(){
 if(dialog)return dialog;
 dialog=el('dialog','binch-reforge-dialog');dialog.id='binch-reforge-dialog';dialog.setAttribute('aria-labelledby','binch-reforge-title');
 const frame=el('div','binch-reforge-frame');
 const heading=el('header','binch-reforge-header'),h=el('h2','','Reforger ton identité');
 h.id='binch-reforge-title';
 const exit=button('Fermer ×','binch-reforge-close');
 exit.addEventListener('click',close);
 const intro=el('p','', 'Change ton peuple, ta classe et tes métiers. Observe le décor avant de décider : aucune donnée n’est modifiée avant « Appliquer ».'); 
 heading.append(h,exit);
 const preview=el('div','binch-reforge-preview');
 preview.append(el('span','binch-reforge-emblem','❧'),el('strong','binch-reforge-summary',''));
 const race=field('I · Héritage du peuple','race',RACES),classe=field('II · Vocation','classe',CLASSES),jobs=field('III · Signatures des métiers','jobs',JOBS);
 const count=el('p','binch-reforge-job-count','0/2 métiers · sélection facultative');
 const footer=el('footer','binch-reforge-footer'),warning=el('p','binch-reforge-error','');
 warning.setAttribute('role','alert');warning.hidden=true;
 const cancel=button('Annuler','binch-reforge-cancel');
 const applyButton=button('Appliquer ma nouvelle identité','binch-reforge-apply');
 cancel.addEventListener('click',close);
 applyButton.addEventListener('click',()=>{
  if(!commit(draft)){warning.textContent='Enregistrement local impossible. Aucun changement appliqué.';warning.hidden=false;return}
  close();window.location.reload(); // Reload core wizard state from its existing persisted source.
 });
 footer.append(cancel,applyButton);
 frame.append(heading,intro,preview,race,classe,jobs,count,warning,footer);
 dialog.append(frame);
 dialog.addEventListener('click',event=>{if(event.target===dialog)close()});
 dialog.addEventListener('close',()=>{draft=null;opener?.focus?.()});
 dialog.addEventListener('click',event=>{
  const b=event.target.closest('.binch-reforge-choice');if(!b||!draft)return;
  const kind=b.parentElement.dataset.kind,name=b.dataset.value;
  if(kind==='race')draft.race=name;
  else if(kind==='classe')draft.classe=name;
  else if(kind==='jobs'){
   if(draft.jobs.includes(name))draft.jobs=draft.jobs.filter(x=>x!==name);
   else if(draft.jobs.length<2)draft.jobs.push(name);
  }
  refresh();
 });
 document.body.append(dialog);
 return dialog;
}
function open(trigger){
 opener=trigger||document.activeElement;
 draft=clean(read());
 const modal=createDialog();
 const error=modal.querySelector('.binch-reforge-error');error.hidden=true;
 refresh();
 if(typeof modal.showModal==='function')modal.showModal();else modal.setAttribute('open','');
}
function attach(){
 const identity=document.getElementById('binch-profile-trigger');
 if(identity&&!identity.dataset.binchReforgeBound){
  identity.dataset.binchReforgeBound='1';
  identity.addEventListener('click',()=>open(identity));
 }
 const rebuild=document.getElementById('rebuild');
 if(rebuild){rebuild.onclick=event=>{event.preventDefault();open(rebuild)};rebuild.textContent='Reforger race, classe et métiers';}
 apply(read());
 const hero=document.querySelector('#page-hub .hero');
 if(hero&&!hero.querySelector('.binch-identity-composition')){
  const layer=el('div','binch-identity-composition');layer.setAttribute('aria-hidden','true');
  layer.append(el('div','binch-identity-landscape'),el('div','binch-identity-architecture'),el('div','binch-identity-aura'),el('div','binch-identity-professions'));
  hero.prepend(layer);
 }
 const cinematic=document.querySelector('#binch-adventure-home .binch-character-card');
 const portfolio=document.querySelector('#binch-adventure-home .binch-kicker')?.parentElement;
 if(portfolio&&!document.getElementById('binch-p10-expo')){
  const link=el('a','binch-p10-expo','Contempler les neuf sanctuaires ✦');
  link.id='binch-p10-expo';link.href='./renaissance-p10-showcase.html';
  portfolio.append(link);
 }
 // One functional gallery link; its highlight follows the saved class, not a draft.
 if(portfolio){
  let premium=document.getElementById('binch-shaaby-premium-expo');
  if(!premium){
   premium=el('a','binch-p10-expo binch-shaaby-premium-expo','');
   premium.id='binch-shaaby-premium-expo';
   portfolio.append(premium);
  }
  const saved=read();
  const featured=saved?.onboarded&&saved.race==='Gnome'&&saved.classe==='Mage'?'mage':
   saved?.onboarded&&saved.race==='Tauren'&&saved.classe==='Chaman'?'storm':
   saved?.onboarded&&saved.race==='MortVivant'&&saved.classe==='Démoniste'?'forsaken':'tauren';
  premium.href='./premium-sanctuaries-review.html?identity='+featured;
  premium.textContent=featured==='mage'?'Contempler la Bibliothèque des Équations ✦':
   featured==='storm'?'Contempler le Cœur de l’Orage ✦':
   featured==='forsaken'?'Contempler le Pacte des Ombres ✦':
   saved?.onboarded&&saved.race==='Tauren'&&saved.classe==='Druide'?'Contempler le sanctuaire de Shaaby ✦':'Comparer les quatre sanctuaires premium ✦';
  premium.setAttribute('aria-label','Ouvrir la galerie artistique premium, sans modifier le profil');
 }
 if(cinematic&&!cinematic.querySelector('.binch-identity-composition')){
  const layer=el('div','binch-identity-composition');layer.setAttribute('aria-hidden','true');
  layer.append(el('div','binch-identity-landscape'),el('div','binch-identity-architecture'),el('div','binch-identity-aura'),el('div','binch-identity-professions'));
  cinematic.prepend(layer);
 }
}
window.BinchVisualIdentity=Object.freeze({clean,compose,commit,read,apply,open});
document.addEventListener('binch:profile-change',()=>{apply(read());attach()});
document.addEventListener('binch:adventure-ready',attach);
window.addEventListener('storage',event=>{if(event.key===KEY)attach()});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',attach,{once:true});else attach();
})();
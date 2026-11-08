(()=>{
'use strict';
const ROOT='grimoire.',SCHEMA='la-binch-beta-1';
const KEY='grimoire.hub.v3',C='grimoire.craft.v1';
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch]));
const get=k=>{try{return JSON.parse(localStorage.getItem(k))}catch{return null}};
const safeKey=k=>k===KEY||k===C||k.startsWith('grimoire.discovery.done.v1.');
const keys=()=>Object.keys(localStorage).filter(safeKey);
function profile(){return get(KEY)||{}}
function info(message,error=false){const el=$('binch-beta-status');if(el){el.textContent=message;el.classList.toggle('binch-beta-error',error)}}
function download(name,text){
 const blob=new Blob([text],{type:'application/json;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');
 a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);
}
function exportBackup(){
 if(localStorage.getItem('binch.beta.demo.active')==='1'){info('Quitte le mode démo pour exporter une sauvegarde personnelle.',true);return}
 const entries={};for(const k of keys()){try{const v=get(k);if(v!==null)entries[k]=v}catch{}}
 const value={format:SCHEMA,exportedAt:new Date().toISOString(),source:'La Binch',entries};
 const p=profile().data?.pseudo||'aventurier';
 download('la-binch-sauvegarde-'+String(p).replace(/[^a-z0-9_-]/gi,'_')+'.json',JSON.stringify(value,null,2));
 info('Sauvegarde téléchargée. Ne partage pas ce fichier : il peut contenir des informations de personnage.');
}
function validateBackup(obj){
 if(!obj||obj.format!==SCHEMA||!obj.entries||typeof obj.entries!=='object'||Array.isArray(obj.entries))throw Error('Ce fichier n’est pas une sauvegarde La Binch valide.');
 const allowed=Object.entries(obj.entries).filter(([k,v])=>safeKey(k)&&k.length<220&&v&&typeof v==='object');
 if(!allowed.length||allowed.length>250)throw Error('La sauvegarde est vide ou contient trop de données.');
 // Never import arbitrary keys or execute imported text; JSON only.
 if(JSON.stringify(obj).length>3_000_000)throw Error('Sauvegarde trop volumineuse.');
 const imported=Object.fromEntries(allowed);
 const hub=imported[KEY];if(hub&&(!hub.data||typeof hub.data!=='object'))throw Error('Profil invalide dans cette sauvegarde.');
 return imported;
}
async function restoreBackup(file){
 if(!file||file.size>3_000_000){info('Fichier trop volumineux (maximum 3 Mo).',true);return}
 try{
 const parsed=JSON.parse(await file.text()),values=validateBackup(parsed);
 if(!confirm('Restaurer '+Object.keys(values).length+' éléments ? Les données locales portant les mêmes clés seront remplacées.'))return;
 for(const [k,v] of Object.entries(values))localStorage.setItem(k,JSON.stringify(v));
 info('Sauvegarde restaurée. Rechargement du portail…');
 location.reload();
 }catch(e){info('Import refusé : '+e.message,true)}
}
function guildBrief(){
 const p=profile(),d=p.data||{};
 const lines=[(localStorage.getItem('binch.beta.demo.active')==='1'?'EXEMPLE — MODE DÉMONSTRATION':'LA BINCH — BRIEF DE GUILDE'),d.guild||'Notre guilde','','Prochaine activité : '+(d.event||'à définir'),'Date : '+(d.when||'à confirmer'),'Objectif : '+(d.goal||'à préciser'), 'Composition : '+(d.tanks||0)+' tank / '+(d.heals||0)+' soins / '+(d.dps||0)+' DPS', 'Remplaçants : '+(d.bench||0), 'Délégations : '+(d.delegation||'à définir'), 'Note : '+(d.notes||'aucune'),'','Bêta La Binch : https://quentindumont70-bit.github.io/chroniques-cendreval/binch/'];
 return lines.join('\n');
}
function copy(str){return navigator.clipboard?.writeText(str).then(()=>true).catch(()=>false)??Promise.resolve(false)}
async function copyGuild(){const msg=guildBrief();if(await copy(msg))info('Brief de guilde copié : prêt à coller sur Discord.');else{prompt('Copier le brief :',msg)}}
async function copyFeedback(){
 const p=profile(),d=p.data||{},last=get('grimoire.bridge.last')||{};
 const message='LA BINCH — RETOUR BÊTA\nAppareil / navigateur : \nOnglet concerné : \nCe qui fonctionne : \nProblème rencontré : \nComment le reproduire : \n\nVersion : bêta guild 0.7\nClasse : '+(p.classe||'inconnue')+'\nRace : '+(p.race||'inconnue')+'\nNiveau : '+(d.level||'?')+'\nDonnées du jeu : '+(last.name?'import disponibles':'non importées')+'\nNe pas joindre les SavedVariables ni les données privées.';
 if(await copy(message))info('Modèle de retour copié : ton frère peut le coller dans Discord.');else prompt('Copier le retour :',message);
}

function demo(){
 const wizard=$('onboarding');if(!wizard||$('binch-demo-btn'))return;
 const holder=document.createElement('div');holder.id='binch-demo-entry';
 holder.innerHTML='<div class="binch-demo-or">— ou —</div><button type="button" id="binch-demo-btn">Découvrir La Binch en mode démo →</button><p class="muted">Pour ton premier essai : un personnage fictif niveau 18 et un exemple de sortie de guilde. Aucune connexion à WoW nécessaire.</p>';
 const card=wizard.querySelector('.onboard-card');if(card)card.append(holder);
 $('binch-demo-btn').onclick=()=>{
   if(!localStorage.getItem('binch.beta.demo.backup'))localStorage.setItem('binch.beta.demo.backup',localStorage.getItem(KEY)||'');
   const sample={step:2,onboarded:true,race:'Humain',classe:'Paladin',jobs:['Alchimie','Herboristerie'],data:{
     pseudo:'Éclaireur Démo',level:'18',role:'Soigneur',objective:'Monter de niveau',
     guild:'La Binch',event:'Expédition de découverte (démo)',when:'À convenir',goal:'Préparer une sortie de donjon',
     tanks:'1',heals:'1',dps:'3',bench:'0',delegation:'Répartir les quêtes et composants',notes:'Personnage et événement fictifs pour découvrir La Binch.'},checks:[],map:1};
   localStorage.setItem(KEY,JSON.stringify(sample));
   localStorage.setItem('binch.beta.demo.active','1');
   location.reload();
 };
}
function demoBanner(){
 if(localStorage.getItem('binch.beta.demo.active')!=='1'||$('binch-demo-banner'))return;
 const app=$('app');if(!app)return;
 const banner=document.createElement('div');banner.id='binch-demo-banner';
 banner.innerHTML='<strong>MODE DÉMO</strong><span>Personnage et événements fictifs · aucune donnée synchronisée</span><button type="button" id="binch-demo-exit">Quitter la démonstration</button>';
 app.insertBefore(banner,app.querySelector('.nav'));
 $('binch-demo-exit').onclick=()=>{
   const previous=localStorage.getItem('binch.beta.demo.backup');
   if(previous){localStorage.setItem(KEY,previous)}else{localStorage.removeItem(KEY)}
   localStorage.removeItem('binch.beta.demo.active');localStorage.removeItem('binch.beta.demo.backup');
   location.reload();
 };
}

function mount(){
 demo();demoBanner();
 if($('binch-beta-kit'))return;
 const page=$('page-sync')||$('page-hub');if(!page)return;
 const box=document.createElement('section');box.id='binch-beta-kit';box.className='panel section';
 box.innerHTML='<div class="eyebrow">La Binch · Bêta de guilde</div><h2>Centre de préparation</h2><p class="muted">Une sauvegarde du profil permet de retrouver ses choix et quêtes cochées dans un autre navigateur. Tout est géré localement : aucun compte ni inscription.</p><div class="binch-beta-actions"><button type="button" id="binch-beta-export">Sauvegarder mon profil</button><label for="binch-beta-import" class="binch-beta-label">Restaurer une sauvegarde</label><input id="binch-beta-import" type="file" accept=".json,application/json" hidden><button type="button" id="binch-beta-guild">Copier le brief GM</button><button type="button" id="binch-beta-feedback">Copier un retour bêta</button></div><p id="binch-beta-status" role="status" class="muted"></p><details class="binch-beta-help"><summary>Première utilisation — guide rapide</summary><ol><li>Choisis ta race, ta classe et tes métiers.</li><li>Ouvre le Carnet de route pour les prochaines actions.</li><li>Consulte les Secrets et l’Atlas des recettes avant de changer de zone.</li><li>Sans addon, utilise le niveau manuel ; avec GrimoireSync, importe tes données dans Synchronisation.</li><li>Pour changer d’appareil, sauvegarde puis restaure tes choix.</li></ol></details><p class="muted">La bêta peut contenir des informations de recettes à confirmer ; consulte toujours la fiche source. N’importe pas de données venant d’un inconnu.</p>';
 page.append(box);
 $('binch-beta-export').onclick=exportBackup;
 $('binch-beta-import').onchange=e=>{const file=e.target.files?.[0];if(file)restoreBackup(file);e.target.value=''};
 $('binch-beta-guild').onclick=copyGuild;
 $('binch-beta-feedback').onclick=copyFeedback;
}
const css=document.createElement('style');
css.textContent='.binch-beta-actions{display:flex;flex-wrap:wrap;gap:9px;margin:15px 0}.binch-beta-actions button,.binch-beta-label{display:inline-flex;align-items:center;padding:10px 14px;border-radius:7px;border:1px solid #8a7248;background:#243328;color:#f1ddac;font-weight:700;font-size:.83rem;cursor:pointer}.binch-beta-actions button:hover,.binch-beta-label:hover{border-color:#f5d895}.binch-beta-error{color:#ff9c8c!important}.binch-beta-help{padding:14px;border:1px solid var(--line);border-radius:9px;background:#101813}.binch-beta-help summary{cursor:pointer;color:#e9c375}.binch-beta-help li{margin:9px 0}';
css.textContent+='.binch-demo-or{text-align:center;margin:10px 0 13px;color:#a5b3a9;font-size:.8rem}.binch-demo-or:before,.binch-demo-or:after{content:" — ";color:#8d7852}#binch-demo-entry{text-align:center;margin-top:22px;padding:18px;border:1px dashed #6a775b;border-radius:10px;background:#10231a}#binch-demo-btn{border:1px solid #e2bd7e;border-radius:9px;padding:12px 19px;background:linear-gradient(#f0d59c,#c19a5c);color:#20170d;font-weight:800;cursor:pointer}#binch-demo-entry p{font-size:.78rem;margin:12px 0 0}#binch-demo-banner{display:flex;align-items:center;gap:14px;justify-content:center;flex-wrap:wrap;margin:8px 0;padding:9px 15px;background:#3d3320;color:#f0dfb5;border:1px solid #a2824b;border-radius:8px;font-size:.8rem}#binch-demo-banner strong{letter-spacing:.1em}#binch-demo-banner button{background:#111d16;border:1px solid #debd80;color:#f6e3bf;padding:6px 12px;border-radius:6px;cursor:pointer}';document.head.append(css);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
})();
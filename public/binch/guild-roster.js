/* La Binch — compositions de groupes, sans serveur ni données du jeu. */
(()=>{'use strict';
const KEY='binch.guild.roster.v1';
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ROLES=['Tank','Soigneur','DPS','Flexible'];
const CLASSES=['Guerrier','Paladin','Chasseur','Voleur','Prêtre','Chaman','Mage','Démoniste','Druide'];
const validName=s=>typeof s==='string'&&s.trim().length>0&&s.trim().length<=36;
let record={event:'',members:[]};
function restore(){
 try{const d=JSON.parse(localStorage.getItem(KEY));if(!d||typeof d!=='object')return;
 record.event=typeof d.event==='string'?d.event.slice(0,100):'';
 record.members=Array.isArray(d.members)?d.members.slice(0,100).filter(m=>m&&validName(m.name)&&ROLES.includes(m.role)&&CLASSES.includes(m.cls)&&['Confirmé','Incertain','Absent'].includes(m.status)&&Number.isInteger(m.group)&&m.group>=0&&m.group<=8).map(m=>({id:String(m.id||'').slice(0,50),name:m.name.trim(),cls:m.cls,role:m.role,status:m.status,group:m.group})):[];}catch{}
}
function save(){localStorage.setItem(KEY,JSON.stringify(record));document.dispatchEvent(new Event('binch:roster-change'));}
function id(){return Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,9);}
function init(){
 const page=$('page-gm');if(!page||$('binch-guild-roster'))return;
 restore();
 const section=document.createElement('section');section.id='binch-guild-roster';section.className='panel section';
 section.innerHTML='<div class="eyebrow">ÉTAT-MAJOR / ORGANISATION LOCALE</div><h2>Effectifs & compositions</h2>'+
 '<p class="muted">Prépare jusqu’à huit groupes, suis les confirmations et copie la composition pour Discord. Données enregistrées uniquement dans ce navigateur ; aucun membre n’est automatiquement invité dans WoW.</p>'+
 '<label class="binch-roster-event">Nom de la sortie <input id="binch-roster-event" maxlength="100" placeholder="Ex. : Donjon de vendredi"></label>'+
 '<form id="binch-roster-form" class="binch-roster-form">'+
 '<label>Personnage <input name="name" required maxlength="36" placeholder="Nom en jeu"></label>'+
 '<label>Classe <select name="cls">'+CLASSES.map(c=>'<option>'+c+'</option>').join('')+'</select></label>'+
 '<label>Rôle <select name="role">'+ROLES.map(c=>'<option>'+c+'</option>').join('')+'</select></label>'+
 '<label>Statut <select name="status"><option>Confirmé</option><option>Incertain</option><option>Absent</option></select></label>'+
 '<label>Groupe <select name="group"><option value="0">Réserve</option>'+Array.from({length:8},(_,i)=>'<option value="'+(i+1)+'">Groupe '+(i+1)+'</option>').join('')+'</select></label>'+
 '<button type="submit">Ajouter le membre</button></form>'+
 '<p id="binch-roster-summary" role="status" aria-live="polite"></p>'+
 '<div id="binch-roster-groups" class="binch-roster-groups"></div>'+
 '<div class="binch-roster-actions"><button type="button" id="binch-roster-arrange">Composer les groupes depuis la réserve</button><button type="button" id="binch-roster-copy">Copier pour Discord</button><button type="button" id="binch-roster-export">Exporter JSON</button><label class="binch-roster-file">Importer JSON<input type="file" id="binch-roster-import" accept=".json,application/json" hidden></label><button type="button" id="binch-roster-clear">Effacer les effectifs</button></div>';
 const hub=$('binch-gm-hub');
 if(hub)hub.insertAdjacentElement('afterend',section);else page.prepend(section);
 $('binch-roster-event').value=record.event;
 $('binch-roster-event').oninput=e=>{record.event=e.target.value.slice(0,100);save();};
 $('binch-roster-form').onsubmit=e=>{
  e.preventDefault();
  const form=e.currentTarget,d=new FormData(form),name=String(d.get('name')||'').trim();
  if(!validName(name)||record.members.length>=100)return;
  if(record.members.some(m=>m.name.toLocaleLowerCase('fr')===name.toLocaleLowerCase('fr'))){alert('Ce personnage figure déjà dans les effectifs.');return;}
  const cls=String(d.get('cls')),role=String(d.get('role')),status=String(d.get('status')),group=Number(d.get('group'));
  if(!CLASSES.includes(cls)||!ROLES.includes(role)||!['Confirmé','Incertain','Absent'].includes(status)||!Number.isInteger(group)||group<0||group>8)return;
  record.members.push({id:id(),name,cls,role,status,group});save();render();form.elements.name.value='';form.elements.name.focus();
 };
 section.addEventListener('change',e=>{
  const field=e.target.closest('[data-roster-id]');if(!field)return;
  const row=record.members.find(m=>m.id===field.dataset.rosterId);if(!row)return;
  const key=field.dataset.rosterField,value=field.value;
  if(key==='group'&&Number.isInteger(Number(value))&&Number(value)>=0&&Number(value)<=8)row.group=Number(value);
  else if(key==='role'&&ROLES.includes(value))row.role=value;
  else if(key==='status'&&['Confirmé','Incertain','Absent'].includes(value))row.status=value;
  save();render();
 });
 section.addEventListener('click',e=>{
  const b=e.target.closest('[data-roster-remove]');if(!b)return;
  const member=record.members.find(x=>x.id===b.dataset.rosterRemove);
  if(member&&confirm('Retirer '+member.name+' des effectifs ?')){record.members=record.members.filter(x=>x.id!==member.id);save();render();}
 });
 $('binch-roster-copy').onclick=async()=>{
  const lines=[record.event||'Sortie de guilde — La Binch','Composition indicative (déclarations manuelles)'];
  for(let g=1;g<=8;g++){
   const members=record.members.filter(m=>m.group===g&&m.status!=='Absent');if(!members.length)continue;
   lines.push('','Groupe '+g);members.forEach(m=>lines.push('• '+m.name+' — '+m.cls+' / '+m.role+' ('+m.status+')'));
  }
  const reserve=record.members.filter(m=>m.group===0&&m.status!=='Absent');
  if(reserve.length){lines.push('','Réserve');reserve.forEach(m=>lines.push('• '+m.name+' — '+m.cls+' / '+m.role+' ('+m.status+')'))}
  const txt=lines.join('\n');
  try{await navigator.clipboard.writeText(txt);$('binch-roster-copy').textContent='Composition copiée ✓'}catch{prompt('Copier la composition',txt)}
 };
 $('binch-roster-export').onclick=()=>{
  const blob=new Blob([JSON.stringify({format:'binch-roster-v1',event:record.event,members:record.members},null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='la-binch-effectifs.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1500);
 };
 $('binch-roster-import').onchange=async e=>{
  const f=e.target.files&&e.target.files[0];e.target.value='';
  if(!f||f.size>100000){alert('Fichier absent ou trop volumineux.');return;}
  try{
   const data=JSON.parse(await f.text());
   if(data.format!=='binch-roster-v1'||!Array.isArray(data.members)||data.members.length>100)throw Error('Format non reconnu');
   const members=data.members.map(m=>{
    if(!m||!validName(m.name)||!CLASSES.includes(m.cls)||!ROLES.includes(m.role)||!['Confirmé','Incertain','Absent'].includes(m.status)||!Number.isInteger(m.group)||m.group<0||m.group>8)throw Error('Membre invalide');
    return {id:id(),name:m.name.trim(),cls:m.cls,role:m.role,status:m.status,group:m.group};
   });
   if(new Set(members.map(m=>m.name.toLocaleLowerCase('fr'))).size!==members.length)throw Error('Doublons de personnages');
   if(!confirm('Remplacer les effectifs locaux par '+members.length+' membre(s) importés ?'))return;
   record={event:typeof data.event==='string'?data.event.slice(0,100):'',members};save();$('binch-roster-event').value=record.event;render();
  }catch(error){alert('Import refusé : '+error.message)}
 };
 $('binch-roster-arrange').onclick=()=>{
  // Only assign reserve volunteers; never overwrite the organiser's existing groups.
  const reserve=record.members.filter(m=>m.group===0&&m.status!=='Absent');
  const rank={Tank:0,Soigneur:1,Flexible:2,DPS:3};
  reserve.sort((a,b)=>(a.status==='Confirmé'?0:1)-(b.status==='Confirmé'?0:1)||rank[a.role]-rank[b.role]);
  const counts=Array.from({length:9},(_,i)=>record.members.filter(m=>m.group===i&&m.status!=='Absent').length);
  const changes=[];
  for(const member of reserve){
   const eligible=Array.from({length:8},(_,i)=>i+1).filter(g=>counts[g]<5);
   if(!eligible.length)break;
   const score=g=>{
    const list=record.members.filter(m=>m.group===g&&m.status!=='Absent');
    const same=list.some(m=>m.role===member.role);
    return (same?4:0)+counts[g]*2+(g-1)*0.005;
   };
   eligible.sort((a,b)=>score(a)-score(b));
   const group=eligible[0];counts[group]++;changes.push({member,group});
  }
  if(!changes.length){alert('Aucun membre de réserve à répartir, ou les huit groupes sont complets.');return;}
  if(!confirm('Répartir '+changes.length+' membre(s) de la réserve sans modifier les groupes existants ?'))return;
  for(const {member,group} of changes)member.group=group;
  save();render();
 };
 $('binch-roster-clear').onclick=()=>{if(record.members.length&&confirm('Effacer tous les effectifs de cette sortie ?')){record.members=[];save();render();}};
 function render(){
  const confirmed=record.members.filter(m=>m.status==='Confirmé'),uncertain=record.members.filter(m=>m.status==='Incertain');
  const totals=confirmed.reduce((acc,m)=>(acc[m.role]=(acc[m.role]||0)+1,acc),{});
  $('binch-roster-summary').textContent=confirmed.length+' confirmé(s), '+uncertain.length+' incertain(s), '+(record.members.length-confirmed.length-uncertain.length)+' absent(s) · '+(totals.Tank||0)+' tanks, '+(totals.Soigneur||0)+' soigneurs, '+(totals.DPS||0)+' DPS, '+(totals.Flexible||0)+' flexibles.';
  $('binch-roster-groups').innerHTML=Array.from({length:9},(_,g)=>{
   const members=record.members.filter(m=>m.group===g);
   if(g>0&&!members.length)return '';
   const active=members.filter(m=>m.status!=='Absent');
   const tanks=active.filter(m=>m.role==='Tank').length,healers=active.filter(m=>m.role==='Soigneur').length;
   const readiness=g===0?'':('<p class="binch-roster-readiness">'+active.length+'/5 participants · '+(active.length>5?'⚠ Groupe surchargé · ':'')+(tanks===0?'⚠ Tank manquant · ':'')+(healers===0?'⚠ Soigneur manquant · ':'')+(active.length<=5&&tanks>0&&healers>0?'Composition équilibrée':'Composition à ajuster')+'</p>');
   return '<section class="binch-roster-group"><h3>'+(g?'Groupe '+g:'Réserve / sans groupe')+' <small>'+members.filter(m=>m.status==='Confirmé').length+' confirmé(s)</small></h3>'+readiness+
   (members.length?members.map(m=>'<div class="binch-roster-member"><b>'+esc(m.name)+'</b><small>'+esc(m.cls)+'</small>'+
    '<select aria-label="Rôle de '+esc(m.name)+'" data-roster-id="'+esc(m.id)+'" data-roster-field="role">'+ROLES.map(v=>'<option'+(v===m.role?' selected':'')+'>'+v+'</option>').join('')+'</select>'+
    '<select aria-label="Statut de '+esc(m.name)+'" data-roster-id="'+esc(m.id)+'" data-roster-field="status">'+['Confirmé','Incertain','Absent'].map(v=>'<option'+(v===m.status?' selected':'')+'>'+v+'</option>').join('')+'</select>'+
    '<select aria-label="Groupe de '+esc(m.name)+'" data-roster-id="'+esc(m.id)+'" data-roster-field="group">'+Array.from({length:9},(_,n)=>'<option value="'+n+'"'+(n===m.group?' selected':'')+'>'+(n?'G'+n:'Réserve')+'</option>').join('')+'</select>'+
    '<button type="button" data-roster-remove="'+esc(m.id)+'" aria-label="Retirer '+esc(m.name)+'">×</button></div>').join(''):'<p class="muted">Aucun membre en réserve.</p>')+'</section>';
  }).join('');
 }
 render();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();

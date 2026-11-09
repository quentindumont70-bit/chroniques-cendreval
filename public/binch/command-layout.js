/* La Binch — cockpit personnalisable: aucun serveur, aucune modification des données WoW. */
(()=>{'use strict';
const $=id=>document.getElementById(id);
const KEY='binch.command.layout.v1';
const GROUPS=[
 {id:'journey',label:'Parcours & classe',selector:'.binch-command-row',required:true},
 {id:'statistics',label:'Chiffres du personnage',selector:'.binch-command-stats'},
 {id:'session',label:'Chronique de session',selector:'.binch-command-progress'},
 {id:'faith',label:'Conseils de Faith & butin',selector:'.binch-command-bottom'},
 {id:'pins',label:'Objectifs épinglés',selector:'.binch-command-pin-wrap'},
 {id:'notes',label:'Carnet de terrain',selector:'#binch-command-notes'}
];
const PRESETS={
 leveling:{density:'comfortable',columns:3,visible:['journey','statistics','session','faith','pins','notes'],order:GROUPS.map(g=>g.id)},
 minimal:{density:'compact',columns:2,visible:['journey','faith','pins'],order:['journey','faith','pins','statistics','session','notes']},
 gathering:{density:'comfortable',columns:2,visible:['statistics','faith','pins','notes','journey','session'],order:['statistics','faith','notes','pins','journey','session']}
};
const read=()=>{try{const v=JSON.parse(localStorage.getItem(KEY));return v&&typeof v==='object'?v:null}catch{return null}};
let settings=read()||{...PRESETS.leveling,preset:'leveling'},dragId=null;
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(settings))}catch{}};
function normalized(){
 const ids=GROUPS.map(g=>g.id),order=Array.isArray(settings.order)?settings.order.filter(x=>ids.includes(x)):[];
 settings.order=[...new Set([...order,...ids])];
 settings.visible=Array.isArray(settings.visible)?settings.visible.filter(x=>ids.includes(x)):ids.slice();
 settings.visible=[...new Set([...settings.visible,'journey'])];
 settings.columns=[2,3].includes(+settings.columns)?+settings.columns:3;
 settings.density=['compact','comfortable'].includes(settings.density)?settings.density:'comfortable';
}
function block(id){return document.querySelector('#page-command [data-command-widget="'+id+'"]')}
function layout(){
 normalized();const page=$('page-command'),deck=$('binch-command-deck');if(!page||!deck)return;
 page.dataset.commandDensity=settings.density;page.dataset.commandColumns=String(settings.columns);
 settings.order.forEach(id=>{const el=block(id);if(!el)return;deck.append(el);el.hidden=!settings.visible.includes(id)});
 document.querySelectorAll('#binch-command-deck [data-command-widget]').forEach(el=>el.setAttribute('aria-hidden',String(el.hidden)));
 updateControls();
}
function move(id,direction){
 const order=[...settings.order],from=order.indexOf(id),to=from+direction;if(from<0||to<0||to>=order.length)return;
 [order[from],order[to]]=[order[to],order[from]];settings.order=order;settings.preset='custom';save();layout();
}
function applyPreset(preset){
 settings={...PRESETS[preset],preset,visible:[...PRESETS[preset].visible],order:[...PRESETS[preset].order]};
 save();layout();
}
function setVisible(id,yes){
 if(id==='journey')return;
 if(yes){if(!settings.visible.includes(id))settings.visible.push(id)}
 else settings.visible=settings.visible.filter(x=>x!==id);
 settings.preset='custom';save();layout();
}
function updateControls(){
 const list=$('binch-command-widget-list');if(!list)return;
 list.textContent='';
 settings.order.forEach((id,i)=>{
  const group=GROUPS.find(g=>g.id===id),row=document.createElement('div');row.className='binch-command-widget-control';row.draggable=true;row.dataset.widgetId=id;
  const drag=document.createElement('span');drag.className='binch-command-grip';drag.textContent='⠿';drag.title='Glisser pour réordonner sur ordinateur';
  const checkbox=document.createElement('input');checkbox.type='checkbox';checkbox.checked=settings.visible.includes(id);checkbox.disabled=!!group.required;checkbox.id='binch-widget-toggle-'+id;
  checkbox.addEventListener('change',()=>setVisible(id,checkbox.checked));
  const label=document.createElement('label');label.htmlFor=checkbox.id;label.textContent=group.label;
  const controls=document.createElement('div');controls.className='binch-command-move';
  for(const [symbol,dir] of [['↑',-1],['↓',1]]){
   const btn=document.createElement('button');btn.type='button';btn.textContent=symbol;btn.disabled=(dir===-1&&i===0)||(dir===1&&i===settings.order.length-1);
   btn.title=(dir===-1?'Monter ':'Descendre ')+group.label;btn.setAttribute('aria-label',btn.title);
   btn.addEventListener('click',()=>move(id,dir));controls.append(btn);
  }
  row.addEventListener('dragstart',e=>{dragId=id;e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain',id);row.classList.add('is-dragged')});
  row.addEventListener('dragend',()=>{dragId=null;row.classList.remove('is-dragged')});
  row.addEventListener('dragover',e=>{e.preventDefault();e.dataTransfer.dropEffect='move'});
  row.addEventListener('drop',e=>{e.preventDefault();const source=dragId;if(!source||source===id)return;const order=settings.order.filter(x=>x!==source);order.splice(order.indexOf(id),0,source);settings.order=order;settings.preset='custom';save();layout()});
  row.append(drag,checkbox,label,controls);list.append(row);
 });
 const preset=$('binch-command-preset');if(preset)preset.value=PRESETS[settings.preset]?settings.preset:'custom';
 const density=$('binch-command-density');if(density)density.value=settings.density;
 const columns=$('binch-command-columns');if(columns)columns.value=String(settings.columns);
}
function exportConfig(){
 normalized();const data=JSON.stringify({version:1,preset:settings.preset,density:settings.density,columns:settings.columns,visible:settings.visible,order:settings.order},null,2);
 const result=$('binch-command-config-status');
 const fallback=()=>{const file=new Blob([data],{type:'application/json'}),url=URL.createObjectURL(file),a=document.createElement('a');a.href=url;a.download='la-binch-disposition.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),500)};
 if(navigator.clipboard?.writeText)navigator.clipboard.writeText(data).then(()=>{if(result)result.textContent='Disposition copiée : colle-la dans un fichier pour la sauvegarder.'}).catch(fallback);
 else fallback();
}
function importConfig(raw){
 const conf=JSON.parse(raw),ids=GROUPS.map(g=>g.id);
 if(!conf||conf.version!==1||!Array.isArray(conf.order)||!Array.isArray(conf.visible))throw Error('Format non reconnu');
 if(conf.order.some(id=>!ids.includes(id))||conf.visible.some(id=>!ids.includes(id)))throw Error('Disposition contenant un panneau inconnu');
 settings={preset:'custom',density:conf.density,columns:conf.columns,order:conf.order,visible:conf.visible};
 normalized();save();layout();
}
function mount(){
 const page=$('page-command'),shell=page?.querySelector('.binch-command');if(!shell||$('binch-command-layout'))return;
 const stats=shell.querySelector('.binch-command-stats'),row=shell.querySelector('.binch-command-row'),hero=shell.querySelector('.binch-command-hero');
 if(!stats||!row||!hero)return;
 const toolbar=document.createElement('div');toolbar.id='binch-command-layout';toolbar.className='binch-command-layout';
 toolbar.innerHTML='<div class="binch-command-layout-heading"><div><strong>Mon cockpit</strong><small>Personnalise ton écran de jeu, sans perdre tes données.</small></div><button type="button" id="binch-command-customize" aria-expanded="false" aria-controls="binch-command-settings">⚙ Configurer l’affichage</button></div><div id="binch-command-settings" hidden><div class="binch-command-layout-options"><label>Profil<select id="binch-command-preset"><option value="leveling">Leveling</option><option value="minimal">Minimaliste</option><option value="gathering">Récolte & métiers</option><option value="custom">Personnalisé</option></select></label><label>Affichage<select id="binch-command-density"><option value="comfortable">Confortable</option><option value="compact">Compact</option></select></label><label>Colonnes principales<select id="binch-command-columns"><option value="3">Trois</option><option value="2">Deux</option></select></label></div><p class="binch-command-layout-hint">Affiche, masque et réorganise les modules. Les flèches fonctionnent aussi sur mobile. Le bandeau de ton personnage reste toujours visible.</p><div id="binch-command-widget-list"></div><div class="binch-command-layout-actions"><button type="button" id="binch-command-export">Copier ma disposition</button><label class="binch-command-import">Importer une disposition <input type="file" id="binch-command-import-file" accept=".json,application/json"></label><button type="button" id="binch-command-reset">Réinitialiser</button></div><p id="binch-command-config-status" role="status"></p></div>';
 hero.after(toolbar);
 const deck=document.createElement('div');deck.id='binch-command-deck';shell.insertBefore(deck,toolbar.nextSibling);
 GROUPS.forEach(group=>{const element=shell.querySelector(group.selector);if(element){element.dataset.commandWidget=group.id;deck.append(element)}});
 // Modules that mount later (Faith strategist / notes / session) keep their original
 // parent nodes; the session and notes nodes are already available because scripts are deferred.
 // Attach a mutation observer only to the shell until the optional modules have mounted.
 const pending=GROUPS.filter(group=>!block(group.id));
 if(pending.length){
  const observer=new MutationObserver(()=>{for(const group of pending){const element=shell.querySelector(group.selector);if(element&&!element.dataset.commandWidget){element.dataset.commandWidget=group.id;deck.append(element)}}layout();if(pending.every(g=>block(g.id)))observer.disconnect()});
  observer.observe(shell,{childList:true,subtree:true});setTimeout(()=>observer.disconnect(),10000);
 }
 const button=$('binch-command-customize'),panel=$('binch-command-settings');
 button.addEventListener('click',()=>{panel.hidden=!panel.hidden;button.setAttribute('aria-expanded',String(!panel.hidden))});
 $('binch-command-preset').addEventListener('change',e=>{if(PRESETS[e.target.value])applyPreset(e.target.value)});
 $('binch-command-density').addEventListener('change',e=>{settings.density=e.target.value;settings.preset='custom';save();layout()});
 $('binch-command-columns').addEventListener('change',e=>{settings.columns=+e.target.value;settings.preset='custom';save();layout()});
 $('binch-command-reset').addEventListener('click',()=>applyPreset('leveling'));
 $('binch-command-export').addEventListener('click',exportConfig);
 $('binch-command-import-file').addEventListener('change',async e=>{const file=e.target.files?.[0];if(!file)return;try{if(file.size>30000)throw Error('Fichier trop volumineux');importConfig(await file.text());$('binch-command-config-status').textContent='Disposition importée.'}catch(err){$('binch-command-config-status').textContent=err.message}e.target.value=''});
 window.addEventListener('storage',e=>{if(e.key===KEY){settings=read()||settings;layout()}});
 layout();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
})();
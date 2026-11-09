/* La Binch · journal de progression. Comparaisons issues uniquement des imports locaux. */
(()=>{'use strict';
const $=id=>document.getElementById(id),KEY='binch.command.progress.v1';
const load=(k,f)=>{try{return JSON.parse(localStorage.getItem(k))??f}catch{return f}};
function character(){const state=load('grimoire.hub.v3',{}),last=load('grimoire.bridge.last',{}),name=String(state.data?.pseudo||'').toLowerCase();if(!last.name||String(last.name).toLowerCase()!==name||!last.updated)return null;
 const ids=Array.isArray(last.inventory)?last.inventory:[],copper=ids.filter(i=>Number(i.id)===2770).reduce((n,i)=>n+Number(i.count||1),0);
 return {id:name+'-'+String(last.realm||'').toLowerCase(),name:last.name,level:Number(last.level)||1,xp:Number(last.xp),xpMax:Number(last.xpMax),copper,updated:last.updated,zone:last.zone||'',ts:Date.parse(last.updated)};}
function observe(){
 const current=character();if(!current||!Number.isFinite(current.ts))return;
 const db=load(KEY,{});
 const history=Array.isArray(db[current.id])?db[current.id]:[];
 if(history.some(s=>s.updated===current.updated))return;
 history.push(current);db[current.id]=history.slice(-60);
 try{localStorage.setItem(KEY,JSON.stringify(db))}catch{}
}
function render(){
 const box=$('binch-command-progress');if(!box)return;
 const current=character();if(!current){$('binch-command-progress-summary').textContent='Aucune sauvegarde GrimoireSync importée pour ce personnage.';return}
 const records=load(KEY,{})[current.id]||[],first=records[0],prior=records.length>1?records[records.length-2]:null;
 if(!prior){$('binch-command-progress-summary').textContent='Premier point de suivi enregistré. Au prochain import, les évolutions apparaîtront ici.';return}
 const levelDiff=current.level-prior.level;
 const xpDiff=levelDiff===0&&Number.isFinite(current.xp)&&Number.isFinite(prior.xp)?current.xp-prior.xp:null;
 const copperDiff=current.copper-prior.copper;
 const summaries=[];
 if(levelDiff>0)summaries.push('+'+levelDiff+' niveau'+(levelDiff>1?'x':''));
 else if(levelDiff<0)summaries.push('Niveau différent : vérifier le personnage');
 else if(xpDiff!==null)summaries.push((xpDiff>=0?'+':'')+xpDiff.toLocaleString('fr-FR')+' XP depuis le précédent import');
 if(Number.isFinite(copperDiff))summaries.push((copperDiff>0?'+':'')+copperDiff+' cuivre (net)');
 const stamp=new Date(prior.ts).toLocaleString('fr-FR');
 $('binch-command-progress-summary').textContent=summaries.join(' · ')+' · comparaison avec '+stamp;
 const count=$('binch-command-progress-count');if(count)count.textContent=records.length+' sauvegarde(s) suivie(s)';
}
function mount(){
 const host=$('page-command')?.querySelector('.binch-command-hero');if(!host||$('binch-command-progress'))return;
 const el=document.createElement('aside');el.id='binch-command-progress';el.className='binch-command-progress';
 el.innerHTML='<div class="binch-command-label">CHRONIQUE DE SESSION <span id="binch-command-progress-count">Suivi des imports</span></div><p id="binch-command-progress-summary" role="status">En attente du premier import.</p>';
 host.after(el);
 observe();render();
 document.addEventListener('grimoire:sync',()=>{observe();render()});
 window.addEventListener('storage',e=>{if(e.key===KEY||e.key==='grimoire.bridge.last'){observe();render()}});
 document.getElementById('binch-command-refresh')?.addEventListener('click',()=>{observe();render()});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
})();
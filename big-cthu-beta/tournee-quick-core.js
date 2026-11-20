/* Tournée: local-only date, weekly cycle and command helpers. Never contacts a server. */
(function(root){
'use strict';
const DAY=['Dim','Lun','Mar','Mer','Jeu','Ven','Sam'];
const PHI_WEEK_KEY='cyc_week_override_v1';
function norm(s){return String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[’']/g,' ').replace(/\s+/g,' ').trim();}
function validDay(s){if(!/^\d{4}-\d{2}-\d{2}$/.test(s||''))return false;const x=new Date(s+'T12:00:00Z');return !Number.isNaN(x.getTime())&&x.toISOString().slice(0,10)===s;}
function parseDay(s){if(!validDay(s))throw Error('Date invalide');const [y,m,d]=s.split('-').map(Number);return new Date(y,m-1,d,12);}
function iso(d){return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');}
function add(s,n){const d=parseDay(s);d.setDate(d.getDate()+n);return iso(d);}
function monday(s){const d=parseDay(s);d.setDate(d.getDate()-((d.getDay()+6)%7));return iso(d);}
function validDays(days){return Array.isArray(days)&&days.length>0&&days.length<=7&&days.every(x=>Number.isInteger(x)&&x>=0&&x<=6)&&new Set(days).size===days.length;}
function validOverride(x){return !!x&&typeof x==='object'&&typeof x.pid==='string'&&x.pid.length>0&&x.pid.length<=120&&validDay(x.week)&&monday(x.week)===x.week&&['ch','gr'].includes(x.mode)&&validDays(x.days);}
function validateList(x){return Array.isArray(x)&&x.length<=500&&x.every(validOverride)&&new Set(x.map(y=>y.pid+'|'+y.week)).size===x.length;}
function overrideFor(list,pid,day){return list.find(x=>x.pid===pid&&x.week===monday(day))||null;}
function update(list,entries){if(!validateList(list)||!Array.isArray(entries)||!entries.length||!entries.every(validOverride))throw Error('Semaines invalides. Aucune modification appliquée.');const key=x=>x.pid+'|'+x.week;const all=new Map(list.map(x=>[key(x),x]));for(const e of entries)all.set(key(e),e);const out=[...all.values()];if(!validateList(out))throw Error('Limite des exceptions de semaines atteinte.');return out;}
// Un basculement s'applique a partir de la semaine choisie : aucun historique clinique reecrit.
function validPhaseFlips(cycle){
 const flips=cycle&&cycle.phaseFlips;
 return flips===undefined||(Array.isArray(flips)&&flips.length<=52&&flips.every((week,i)=>validDay(week)&&monday(week)===week&&(i===0||flips[i-1]<week)));
}
function weekMode(cycle,week){
 if(!cycle||!validDay(cycle.a)||!validDay(week)||!validDays(cycle.ch)||!validDays(cycle.gr)||!validPhaseFlips(cycle))return '';
 const target=monday(week);
 const diff=Math.round((parseDay(target)-parseDay(monday(cycle.a)))/604800000);
 const base=((diff%2)+2)%2?'gr':'ch';
 const switches=(cycle.phaseFlips||[]).filter(start=>start<=target).length;
 return switches%2?(base==='ch'?'gr':'ch'):base;
}
function togglePhase(cycle,week){
 if(!cycle||!validDay(week)||!validDay(cycle.a)||!validDays(cycle.ch)||!validDays(cycle.gr)||!validPhaseFlips(cycle))throw Error('Cycle invalide : aucune modification appliquee.');
 const target=monday(week),old=cycle.phaseFlips||[];
 const flips=old.includes(target)?old.filter(d=>d!==target):old.concat(target).sort();
 if(flips.length>52)throw Error('Historique des inversions plein : aucune modification appliquee.');
 const next={...cycle};
 if(flips.length)next.phaseFlips=flips;
 else delete next.phaseFlips;
 return next;
}
function cycleDays(cycle,mode){const days=cycle&&cycle[mode];return validDays(days)?days.slice():null;}
function dayNames(days){return days.slice().sort((a,b)=>((a+6)%7)-((b+6)%7)).map(x=>DAY[x]).join(' · ');}
function dateHere(){return iso(new Date());}
function extractWeekCommands(phrase,today=dateHere()){
 const raw=String(phrase||'').trim(),line=norm(raw);
 const base=monday(today),clauses=line.split(/[,;]|\s+(?:et|puis|ensuite)\s+/).map(x=>x.trim()).filter(Boolean);
 const out=[];
 for(const c of clauses){
  const mode=/\bchimio(?:therapie)?\b/.test(c)?'ch':/\bgranocyt(?:e|es)?\b/.test(c)?'gr':null;
  const target=/semaine prochaine|semaine pro\b|la semaine d apres/.test(c)?'next':/cette semaine|semaine en cours/.test(c)?'this':null;
  if(!mode||!target)continue;
  const days=[];
  for(const [regex,n] of [[/\blundi\b/,1],[/\bmardi\b/,2],[/\bmercredi\b/,3],[/\bjeudi\b/,4],[/\bvendredi\b/,5],[/\bsamedi\b/,6],[/\bdimanche\b/,0]])if(regex.test(c))days.push(n);
  out.push({week:target==='next'?add(base,7):base,mode,days:days.length?days:null});
 }
 if(out.length&&new Set(out.map(x=>x.week)).size===out.length)return {type:'cycle',entries:out};
 if(/\binvers(?:e|er|ion)\b/.test(line)&&/\bsemaine/.test(line))return {type:'swap',entries:[]};
 return null;
}
function extractMemo(phrase,today=dateHere()){
 const raw=String(phrase||'').trim(),plain=norm(raw);
 let day='',text='';
 const date=raw.match(/\b(20\d{2}-\d{2}-\d{2})\b/);
 if(date&&validDay(date[1]))day=date[1];
 else if(/\bdemain\b/.test(plain))day=add(today,1);
 else if(/\baujourd hui\b/.test(plain))day=today;
 if(!day)return null;
 const quoted=raw.match(/[«"]([^»"]{1,600})[»"]/);
 if(quoted)text=quoted[1].trim();
 else {
  const colon=raw.indexOf(':');
  if(colon>=0)text=raw.slice(colon+1).trim();
  else{
   text=raw.replace(/^(?:ajoute|note|mets|ecris|rappelle|post-it|pense.bete)\s*/i,'')
    .replace(/^(?:dans\s+)?(?:le\s+)?(?:post-it|pense.bete)\s*(?:du|de|pour)?\s*/i,'')
    .replace(/\b(?:demain|aujourd['’]hui|le 20\d{2}-\d{2}-\d{2})\b/i,'').trim()
    .replace(/^(?:pour|du|de|le|la)\s+/i,'').replace(/^[-–:,]\s*/,'');
  }
 }
 if(!text||text.length>600||!(/(?:note|pense|post.it|rappel|demain|aujourd)/.test(plain)))return null;
 return {type:'memo',day,text};
}
function parseCommand(text,today=dateHere()){
 if(typeof text!=='string'||text.length>600)return null;
 const cycle=extractWeekCommands(text,today);if(cycle)return cycle;
 const memo=extractMemo(text,today);if(memo)return memo;
 return null;
}
function patientMatches(text,patients){
 const line=' '+norm(text)+' ';
 return patients.filter(x=>{
  if(!x||typeof x.n!=='string'||typeof x.id!=='string')return false;
  const full=norm(x.n);
  if(full.length>=4&&line.includes(' '+full+' '))return true;
  return full.split(' ').some(name=>name.length>=4&&line.includes(' '+name+' '));
 });
}
const api={PHI_WEEK_KEY,norm,validDay,add,monday,validDays,validOverride,validateList,overrideFor,update,validPhaseFlips,weekMode,togglePhase,cycleDays,dayNames,dateHere,parseCommand,patientMatches};
if(typeof module!=='undefined'&&module.exports)module.exports=api;
if(root)root.TOURNEE_QUICK=api;
})(typeof window!=='undefined'?window:null);

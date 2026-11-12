// La Binch — safe build-time snapshot of CC BY 4.0 Forever talent data.
// Remote fields are sanitized; a network error never breaks Pages publishing.
import {writeFile,stat} from 'node:fs/promises';
import path from 'node:path';
const CLASSES=['druid','warrior','paladin','hunter','rogue','priest','shaman','mage','warlock'];
const ROOT=path.resolve('pages-dist/binch');
const safe=(x,n=150)=>typeof x==='string'?x.slice(0,n):'';
async function download(name){
 const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),12000);
 try{
  const res=await fetch('https://talentsforever.com/export/'+name+'.json',{signal:ctrl.signal,headers:{Accept:'application/json'}});
  if(!res.ok)throw Error('HTTP '+res.status);
  const body=await res.text();
  if(body.length>1_000_000)throw Error('Export too large');
  return JSON.parse(body);
 }finally{clearTimeout(timer)}
}
function sanitize(raw,name){
 if(String(raw?.class||'').toLowerCase()!==name||!Array.isArray(raw?.talents?.trees))throw Error('Invalid '+name+' export');
 const trees=raw.talents.trees.map(tree=>{
  const name=tree?.name;
  if(!name||!Array.isArray(tree.talents)||tree.talents.length<9||tree.talents.length>40)throw Error('Tree incomplete: '+name);
  const used=new Set();
  const talents=tree.talents.map(t=>{
   const row=Number(t.row),col=Number(t.col),max=Number(t.max),icon=safe(t.icon,90),talent=safe(t.name,90);
   if(!talent||!Number.isInteger(row)||row<1||row>7||!Number.isInteger(col)||col<1||col>4||!Number.isInteger(max)||max<1||max>5||!/^[a-z0-9_]+$/i.test(icon))throw Error('Invalid talent data');
   if(used.has(row+':'+col))throw Error('Duplicate tree position');
   used.add(row+':'+col);
   return {name:talent,row,col,max,icon,desc:Array.isArray(t.desc)?t.desc.slice(0,max).map(x=>safe(x,1500)):[]};
  });
  return {name,talents};
 });
 if(trees.length!==3)throw Error('Expected 3 trees');
 return {class:raw.class,generated:safe(raw.generated,30),snapshotAt:new Date().toISOString(),source:'https://talentsforever.com/export/'+name+'.json',license:'CC BY 4.0 — talentsforever.com',talents:{trees}};
}
const site=await stat(ROOT).catch(()=>null);
if(!site?.isDirectory())throw Error('pages-dist/binch absent; run build:pages first');
for(const name of CLASSES){
 try{
  const raw=await download(name),payload=sanitize(raw,name);
  await writeFile(path.join(ROOT,'forever-talents-'+name+'.json'),JSON.stringify(payload)+'\n','utf8');
  console.log('La Binch: '+name+' · '+payload.talents.trees.map(t=>t.name+' '+t.talents.length).join(', '));
 }catch(err){
  console.warn('La Binch: no snapshot '+name+' ('+String(err?.message||err)+'); official calculator fallback available.');
 }
}

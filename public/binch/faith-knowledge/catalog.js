/* Faith knowledge catalog: bounded, same-origin static JSON only. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;root.BinchFaithKnowledgeCatalog=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){'use strict';
const MAX=5000,MAXSETS=24;
function validPath(s){return typeof s==='string'&&/^data\/[a-z0-9-]+\.json$/.test(s)}
async function load(fetcher,validator,base='./faith-knowledge/'){
 if(typeof fetcher!=='function'||typeof validator?.check!=='function')throw Error('Chargeur ou validateur indisponible');
 const root=String(base);
 const get=async relative=>{
  const r=await fetcher(root+relative,{cache:'no-store'});
  if(!r||!r.ok)throw Error('Chargement impossible: '+relative);
  return r.json();
 };
 const manifest=await get('manifest.json');
 if(manifest?.schemaVersion!==1||!Array.isArray(manifest.datasets)||!manifest.datasets.length||manifest.datasets.length>MAXSETS||!manifest.datasets.every(validPath)||new Set(manifest.datasets).size!==manifest.datasets.length)throw Error('Manifest Faith invalide');
 const groups=await Promise.all(manifest.datasets.map(get));
 const rows=groups.flat();
 if(rows.length>MAX)throw Error('Corpus trop volumineux');
 const v=validator.check(rows);
 if(!v.ok)throw Error('Corpus non valide: '+v.errors.slice(0,3).join('; '));
 return rows.filter(x=>x.verification==='verifie'&&x.scope==='forever');
}
return {load,validPath};
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const root=new URL('../big-cthu-beta/',import.meta.url);
const read=name=>readFile(new URL(name,root),'utf8');

test('V256 : guide de cinq étapes et contenu exclusivement fictif',async()=>{
 const html=await read('tournee-demarrage.html');
 assert.match(html,/<html lang="fr">/);
 assert.match(html,/<meta name="viewport"/);
 for(let i=1;i<=5;i++)assert.match(html,new RegExp('id="etape-'+i+'"'));
 assert.match(html,/entièrement fictifs/);
 assert.match(html,/ne crée aucun patient/);
 assert.match(html,/Topaze/);
 assert.match(html,/fichier JSON contient des données de santé lisibles/);
 assert.match(html,/min-height:44px/);
});

test('V256 : page pédagogique statique, sans lecture ni écriture de données',async()=>{
 const html=await read('tournee-demarrage.html');
 assert.doesNotMatch(html,/<script\b|<form\b|<input\b/i);
 assert.doesNotMatch(html,/localStorage|sessionStorage|indexedDB|document\.cookie|sendBeacon|XMLHttpRequest|fetch\s*\(/);
 assert.doesNotMatch(html,/https?:\/\/[^" ]+\.js/i);
});

test('V256 : guide accessible depuis Tournée et préchargé hors ligne',async()=>{
 const [app,sw]=await Promise.all([read('tournee-complete.html'),read('sw.js')]);
 assert.match(app,/id="tour-onboarding-open"/);
 assert.match(app,/window\.open\('\.\/tournee-demarrage\.html','_blank','noopener,noreferrer'\)/);
 assert.match(sw,/'\.\/tournee-demarrage\.html'/);
 assert.match(sw,/const CACHE='big-cthu-public-v2-v\d+'/);
});

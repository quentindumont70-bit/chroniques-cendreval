/* Generate ephemeral CI-only screenshots of the REAL La Binch dashboard.
 * NEVER check in generated .p14-preview-*.html; never seed a user's origin.
 * Actual game data is synthetic and written only on CI's local file origin.
 */
import {readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';

const dir=resolve('public/binch');
const original=readFileSync(resolve(dir,'index.html'),'utf8');
if(!original.startsWith('<!doctype html>')||!original.includes('<head>')||!original.includes('id="app"')){
 throw Error('Refusing fixture generation: unexpected live app HTML');
}
const baseData={
 level:'42',role:'Tank',objective:'Monter de niveau',guild:'Guilde témoin',
 event:'Sortie de donjon',when:'',goal:'Tester le compagnon',tanks:1,heals:1,dps:3,
 bench:0,delegation:'',notes:'Données synthétiques pour captures CI'
};
const cases={
 tauren:{
  step:2,onboarded:true,race:'Tauren',classe:'Druide',jobs:['Herboristerie','Alchimie'],
  data:{...baseData,pseudo:'Shaaby'},checks:[],map:0
 },
 forsaken:{
  step:2,onboarded:true,race:'MortVivant',classe:'Démoniste',jobs:['Ingénierie','Enchantement'],
  data:{...baseData,pseudo:'Le Nécromancien',role:'DPS distance'},checks:[],map:0
 },
 storm:{
  step:2,onboarded:true,race:'Tauren',classe:'Chaman',jobs:['Minage','Forge'],
  data:{...baseData,pseudo:'Corne-de-Tonnerre',role:'DPS distance'},checks:[],map:0
 }
};
for(const [name,profile] of Object.entries(cases)){
 const seed=JSON.stringify(profile).replace(/</g,'\\u003c');
 const bootstrap='<script>/* P14 synthetic CI profile, not deployed. */'
  +"try{localStorage.setItem('grimoire.hub.v3',JSON.stringify("+seed+"));}"
  +"catch(e){document.documentElement.dataset.p14FixtureStorage='blocked';}"
  +"document.addEventListener('DOMContentLoaded',function(){"
  +"if(location.search.includes('reforge=1'))setTimeout(function(){"
  +"document.getElementById('binch-profile-trigger')?.click();},550);"
  +"if(location.search.includes('page=metiers'))setTimeout(function(){"
  +"document.querySelector('#app nav.nav button[data-page=metiers]')?.click();},700);"
  +"if(location.search.includes('menu=open'))setTimeout(function(){"
  +"document.getElementById('binch-p14-sections')?.click();},700);});"
  +'</script>';
 const temp=original.replace('<head>','<head>'+bootstrap);
 if(temp===original)throw Error('Could not seed screenshot fixture');
 writeFileSync(resolve(dir,'.p14-preview-'+name+'.html'),temp);
 console.log('P14 CI-only screenshot fixture created: '+name);
}

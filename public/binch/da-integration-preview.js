/* Experimental appearance switch for the REAL Binch homepage.
   ?da-preview=1 opts in for this page load only; no storage, imports or game data touched. */
(function(){
 'use strict';
 if(typeof window==='undefined'||typeof document==='undefined')return;
 const params=new URLSearchParams(window.location.search);
 if(params.get('da-preview')!=='1')return;
 const supported=new Set(['tauren-druid','troll-shaman','orc-warrior','elf-druid','undead-warlock','gnome-mage','neutral']);
 const candidate=params.get('da-pair')||'tauren-druid';
 const pair=supported.has(candidate)?candidate:'neutral';
 document.documentElement.dataset.binchDaPair=pair;
 document.documentElement.classList.add('binch-da-preview');
})();

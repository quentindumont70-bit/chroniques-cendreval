/* La Binch Ultimate — non-destructive visual identities.
   Uses existing game profile only. Never changes a gameplay field. */
(()=>{'use strict';
const K='grimoire.hub.v3';
const themes={
 'Druide':'druid','Chaman':'shaman','Guerrier':'warrior','Paladin':'paladin',
 'Prêtre':'priest','Voleur':'rogue','Mage':'mage','Chasseur':'hunter','Démoniste':'warlock'
};
const races={'Tauren':'tauren','Orc':'orc','Troll':'troll','Humain':'human','Nain':'dwarf','Gnome':'gnome','Elfe':'elf','MortVivant':'undead','Skyborne':'skyborne'};
const root=document.documentElement;
function apply(){
 let p={};try{p=JSON.parse(localStorage.getItem(K))||{}}catch{}
 root.dataset.binchIdentity=themes[p.classe]||'adventurer';
 root.dataset.binchAncestry=races[p.race]||'wanderer';
}
apply();
document.addEventListener('grimoire:sync',apply);
window.addEventListener('storage',e=>{if(e.key===K)apply()});
document.addEventListener('binch:profile-change',apply);
window.addEventListener('focus',apply);
document.addEventListener('click',e=>{if(e.target.closest('#onboarding'))setTimeout(apply,0)});
document.addEventListener('change',e=>{if(e.target.closest('#app'))setTimeout(apply,0)});
})();

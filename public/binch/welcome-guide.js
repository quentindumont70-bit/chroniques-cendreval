/* La Binch — première visite, sans synchronisation ni modification du profil. */
(()=>{'use strict';
const $=id=>document.getElementById(id);
function mount(){
 const onboarding=$('onboarding');
 if(!onboarding||$('binch-first-visit'))return;
 const card=onboarding.querySelector('.onboard-card');
 if(!card)return;
 const section=document.createElement('section');
 section.id='binch-first-visit';
 section.setAttribute('aria-label','Présentation de La Binch');
 section.innerHTML='<div class="binch-welcome-kicker">BÊTA · COMPAGNON WOW FOREVER</div>'+
 '<h2>Bienvenue dans La Binch</h2>'+
 '<p>Un compagnon gratuit pour préparer ton aventure et organiser tes sorties de guilde. Commence par créer ton profil : aucun compte externe n’est nécessaire.</p>'+
 '<div class="binch-welcome-steps">'+
 '<div><strong>1. Choisis ton personnage</strong><small>Race, classe et métiers dans le parcours ci-dessus.</small></div>'+
 '<div><strong>2. Prépare ta progression</strong><small>Zones, objectifs, donjons et journal de sessions.</small></div>'+
 '<div><strong>3. Organise la guilde</strong><small>Groupes, calendrier et annonces à copier pour Discord.</small></div></div>'+
 '<details><summary>Ce qui fonctionne sans addon</summary><p>La carte, la Bibliothèque, les objectifs manuels et les outils de planification. Les informations créées ici sont enregistrées sur cet appareil : elles ne se partagent pas automatiquement entre membres.</p></details>'+
 '<details><summary>Et la synchronisation WoW ?</summary><p>Elle est encore en chantier et n’est pas nécessaire pour découvrir le site. Ton niveau et tes objectifs peuvent être saisis manuellement.</p></details>';
 card.append(section);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
})();
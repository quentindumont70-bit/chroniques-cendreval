// Démonstration volontairement isolée : aucune donnée clinique ni stockage.
export const REASONS=Object.freeze(['Patient absent','Soin non réalisé','Horaire modifié','Autre']);
export const SYNC_STATES=Object.freeze(['À rapprocher','Vérifié localement','Sans suite']);
export const SAMPLE_CHANGES=Object.freeze([
 {id:'demo-001',day:'2026-11-10',alias:'Exemple A',reason:'Patient absent',kind:'absence',note:'Visite fictive non réalisée',sync:'À rapprocher',history:[{at:'2026-11-10 08:30',action:'Signalement fictif'}]},
 {id:'demo-002',day:'2026-11-11',alias:'Exemple B',reason:'Soin non réalisé',kind:'soin',note:'Acte fictif annulé',sync:'Vérifié localement',history:[{at:'2026-11-11 09:00',action:'Signalement fictif'},{at:'2026-11-11 10:10',action:'Marqué comme vérifié (simulation)'}]},
 {id:'demo-003',day:'2026-11-12',alias:'Exemple C',reason:'Horaire modifié',kind:'horaire',note:'Passage fictif décalé',sync:'À rapprocher',history:[{at:'2026-11-12 14:05',action:'Horaire fictif modifié'}]},
 {id:'demo-004',day:'2026-11-13',alias:'Exemple D',reason:'Autre',kind:'autre',note:'Note de démonstration',sync:'Sans suite',history:[{at:'2026-11-13 16:00',action:'Création fictive'}]}
]);
function dateValid(day){return typeof day==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(day)&&!Number.isNaN(Date.parse(day+'T12:00:00Z'))}
export function filterChanges(rows,{from='',to='',reason='',sync=''}={}){
 if(from&&!dateValid(from))return [];
 if(to&&!dateValid(to))return [];
 if(from&&to&&from>to)return [];
 return rows.filter(x=>(!from||x.day>=from)&&(!to||x.day<=to)&&(!reason||x.reason===reason)&&(!sync||x.sync===sync));
}
export function summary(rows){
 return {total:rows.length,absences:rows.filter(x=>x.kind==='absence').length,soins:rows.filter(x=>x.kind==='soin').length,horaires:rows.filter(x=>x.kind==='horaire').length,aRapprocher:rows.filter(x=>x.sync==='À rapprocher').length};
}

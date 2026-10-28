import type {CSSProperties} from 'react';
import {CLASSES,skillCooldown,type ClassId} from './rpg';
import {CLASS_THEMES} from './class-art';
import {SkillIcon} from './action-deck';
const styles:Record<ClassId,{role:string;strength:string;care:string}>={
 blade:{role:'Mêlée · défense',strength:'Garde gratuite et récupération d’endurance.',care:'Restez au contact pour briser les armures.'},
 bow:{role:'Distance · précision',strength:'Critiques et pénétration physique.',care:'Gardez vos distances ; surveillez vos flèches.'},
 arcane:{role:'Magie · puissance',strength:'Pénétration magique et régénération de mana.',care:'Armure légère : alternez sorts et étincelles gratuites.'},
 hex:{role:'Magie · drain',strength:'Vol de vie et soins dans les attaques.',care:'Le drain récompense les impacts, pas les coups dans le vide.'},
 cantor:{role:'Magie · soutien',strength:'Recharges réduites et régénération élevée.',care:'Préparez une ouverture avant de lancer vos accords.'},
 reaver:{role:'Mêlée · absorption',strength:'Armure élevée et vol de vie.',care:'Résistance magique faible : esquivez les projectiles.'}
};
export default function ClassSelection({onChoose,onBack}:{onChoose:(id:ClassId)=>void;onBack:()=>void}){return <section className="start-screen spec-select class-gallery" aria-label="Choisir une classe"><div className="class-gallery-heading"><span className="eyebrow">SIX VOIES · UN SERMENT</span><h1>Votre légende</h1><p>Comparez les styles de jeu. Chaque voie possède trois compétences.</p></div><div className="spec-cards">{(Object.keys(CLASSES) as ClassId[]).map(id=>{const c=CLASSES[id],s=styles[id];return <article key={id} style={{'--class-accent':CLASS_THEMES[id].color} as CSSProperties}><button onClick={()=>onChoose(id)} aria-label={`Choisir ${c.name}`}><SkillIcon id={id} index={0}/><span><small>{s.role}</small><b>{c.name}</b></span><span className="class-enter" aria-hidden="true">→</span></button><p>{c.lore}</p><div className="class-traits"><strong>{s.strength}</strong><small>{s.care}</small></div><details><summary>Les trois compétences</summary><div className="class-skill-list">{c.skills.map((skill,i)=><div key={skill.name}><SkillIcon id={id} index={i}/><section><b>{skill.name}</b><p>{skill.description}</p><small>{skill.cost===0?'Sans mana':`${skill.cost} mana`} · {skillCooldown(skill,c.stats).toFixed(1)} s</small></section></div>)}</div></details></article>})}</div><button className="secondary class-back" onClick={onBack}>RETOUR</button></section>}

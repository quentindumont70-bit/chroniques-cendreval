import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const read=file=>readFileSync(new URL('../public/binch/'+file,import.meta.url),'utf8');

test('Création de personnage : les neuf arts correspondent aux vraies classes du profil',()=>{
 const css=read('visual-renaissance-onboarding.css'),html=read('index.html');
 const matches=[
  ['Druide','druid'],['Guerrier','warrior'],['Mage','mage'],['Prêtre','priest'],
  ['Paladin','paladin'],['Voleur','rogue'],['Chasseur','hunter'],['Chaman','shaman'],['Démoniste','warlock']
 ];
 for(const [fr,en] of matches){
  assert.ok(css.includes('[data-classe="'+fr+'"]'),'French class '+fr);
  assert.ok(css.includes('renaissance-world-'+en+'.svg'),'landscape '+en);
  assert.ok(css.includes('renaissance-sigil-'+en+'.svg'),'crest '+en);
 }
 for(const race of ['Orc','Tauren','Troll','MortVivant']){
  assert.ok(css.includes('[data-race="'+race+'"]'),'Horde '+race);
 }
 for(const race of ['Humain','Nain','Elfe','Gnome']){
  assert.ok(css.includes('[data-race="'+race+'"]'),'Alliance '+race);
 }
 assert.ok(css.includes('content:"HORDE"'));
 assert.ok(css.includes('content:"ALLIANCE"'));
 for(const job of ['mining','engineering'])assert.ok(css.includes('renaissance-profession-'+job+'.svg'));
 assert.ok(css.includes(':has(#class-choices .choice.selected)'),'selected class changes backdrop');
 assert.ok(html.includes('id="race-choices"')&&html.includes('id="class-choices"')&&html.includes('id="job-choices"'));
 assert.ok(html.includes('./visual-renaissance-onboarding.css?v=001'));
 assert.ok(html.includes('./visual-renaissance-onboarding.js?v=001'));
});

test('Création de personnage : choix annoncés, mise à jour après rerender, flèches sans sélection forcée',()=>{
 const code=read('visual-renaissance-onboarding.js');
 const doc={readyState:'complete',activeElement:null};
 const groups=new Map(),records=[];
 function button(chosen=false){
  return {type:'',selected:chosen,attrs:{},classList:{contains(x){return x==='selected'&&this.owner.selected}},
   setAttribute(k,v){this.attrs[k]=v},removeAttribute(k){delete this.attrs[k]},
   focus(){doc.activeElement=this}};
 }
 for(const id of ['race-choices','class-choices','job-choices']){
  const btns=[button(),button(true),button()];
  btns.forEach(btn=>btn.classList.owner=btn);
  const group={id,dataset:{},buttons:btns,attrs:{},listeners:{},
   querySelectorAll(q){return q==='button.choice'||q==='button.choice:not([disabled])'?this.buttons:[]},
   setAttribute(k,v){this.attrs[k]=v},
   addEventListener(k,fn){this.listeners[k]=fn}};
  groups.set(id,group);
 }
 doc.getElementById=id=>id==='onboarding'?{}:groups.get(id)||null;
 const context={document:doc,MutationObserver:class{constructor(callback){this.callback=callback}
  observe(group){records.push({group,callback:this.callback})}}};
 runInNewContext(code,context);
 assert.equal(records.length,3,'one observer per existing wizard group');
 for(const group of groups.values()){
  assert.equal(group.attrs.role,'group');
  assert.equal(group.buttons[1].attrs['aria-pressed'],'true');
  assert.equal(group.buttons[0].attrs['aria-pressed'],'false');
  assert.equal(group.dataset.renaissanceA11y,'ready');
 }
 const group=groups.get('class-choices');
 doc.activeElement=group.buttons[0];
 let prevented=false;
 group.listeners.keydown({key:'ArrowRight',preventDefault(){prevented=true}});
 assert.equal(doc.activeElement,group.buttons[1]);
 assert.equal(prevented,true);
 assert.equal(group.buttons[0].attrs['aria-pressed'],'false','arrows only move focus');
 group.buttons[1].selected=false;group.buttons[2].selected=true;
 records.find(x=>x.group===group).callback();
 assert.equal(group.buttons[1].attrs['aria-pressed'],'false');
 assert.equal(group.buttons[2].attrs['aria-pressed'],'true');
});

test('Création de personnage : petits écrans, contraste et mouvement réduit',()=>{
 const css=read('visual-renaissance-onboarding.css'),js=read('visual-renaissance-onboarding.js');
 assert.ok(css.includes('@media(max-width:530px)'));
 assert.ok(css.includes('@media(max-width:360px)'));
 assert.ok(css.includes('prefers-reduced-motion:reduce'));
 assert.ok(css.includes('forced-colors:active'));
 assert.ok(css.includes(':focus-visible'));
 assert.ok(js.includes("observe(group,{childList:true})"));
 assert.ok(!js.includes('localStorage'),'does not alter profile');
 assert.ok(!js.includes('fetch('),'no external request');
 const main=read('visual-renaissance.js');
 assert.ok(main.includes("if(!dialog.open){if(typeof dialog.showModal==='function')"));
 assert.ok(main.includes("['ArrowLeft','ArrowRight','Home','End']"));
});

test('Atelier sans profil : les neuf choix réels restent visibles et capturables sur iPhone',()=>{
 const gallery=read('renaissance-onboarding-atelier.html');
 const workflow=readFileSync(new URL('../.github/workflows/verify.yml',import.meta.url),'utf8');
 for(const cls of ['Druide','Guerrier','Mage','Prêtre','Paladin','Voleur','Chasseur','Chaman','Démoniste']){
  assert.ok(gallery.includes('data-classe="'+cls+'"'),'class visible: '+cls);
 }
 assert.ok(gallery.includes('<meta name="viewport"'));
 assert.ok(gallery.includes('role="status"'));
 assert.ok(gallery.includes('aria-pressed="true"'));
 assert.ok(gallery.includes("grid.addEventListener('keydown'"));
 assert.ok(gallery.includes('./visual-renaissance-onboarding.css?v=001'));
 assert.ok(!gallery.includes('localStorage'));
 assert.ok(!gallery.includes('fetch('));
 assert.ok(workflow.includes('creation-classe-desktop.png'));
 assert.ok(workflow.includes('creation-classe-mobile.png'));
 assert.ok(workflow.includes('renaissance-onboarding-atelier.html'));
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=(name)=>readFileSync(new URL('../public/binch/'+name,import.meta.url),'utf8');

test('P11: flagship Mulgore is self-contained, original artwork embedded once and no network',()=>{
 const html=read('shaaby-mulgore-premium.html');
 assert.ok(html.startsWith('<!doctype html>'));
 assert.match(html,/<title>La Binch — Sanctuaire de Shaaby<\/title>/);
 assert.match(html,/--shaaby-image:url\(data:image\/webp;base64,UklGR/);
 assert.equal((html.match(/data:image\/webp;base64,/g)||[]).length,1,'artwork is embedded only once');
 assert.match(html,/background-image:var\(--shaaby-image\)/);
 assert.ok(!html.includes('fetch('),'no network requests');
 assert.ok(!html.includes('localStorage.setItem('),'no live profile mutation');
 assert.ok(!/<script\s+src=|<link\s+rel="stylesheet"/.test(html),'offline single-page prototype');
 assert.ok(html.length<600000,'embedded demonstration must stay reasonably sized');
});

test('P11: functional profile preview, events and reduced effects are accessible',()=>{
 const html=read('shaaby-mulgore-premium.html');
 for(const id of ['profile-trigger','hero-reforge','reforge','reforge-title','choices-race','choices-classe','choices-jobs','apply-reforge','cancel-reforge','lite','map-name','active-jobs']){
  assert.ok(html.includes('id="'+id+'"'),'missing '+id);
 }
 assert.ok(html.includes("dialog.showModal()"),'native modal');
 assert.ok(html.includes("aria-pressed"),'selection state');
 assert.ok(html.includes("prefers-reduced-motion:reduce"),'reduced motion');
 assert.ok(html.includes("is_mobile")===false,'no screenshot harness dependency');
 assert.ok(html.includes("draft.race==='Tauren'&&draft.classe==='Druide'"),'nonflagship combinations not misrepresented');
 assert.ok(html.includes("apply.disabled=!original"),'flagship-only apply');
 assert.ok(html.includes("root.dataset.lite"),'lightweight effect opt-out');
 assert.ok(html.includes("data-demo-module"),'demo modules flagged');
});

test('P11: legitimate entry from the companion and P10 workshop',()=>{
 const engine=read('visual-identity-compositor.js'),studio=read('renaissance-p10-showcase.html');
 assert.ok(engine.includes("premium.href='./premium-sanctuaries-review.html?identity='+featured"),'companion opens the identity-aware premium gallery');
 assert.ok(studio.includes('href="./shaaby-mulgore-premium.html"'));
});

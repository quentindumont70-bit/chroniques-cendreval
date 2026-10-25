import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const page=readFileSync(new URL('../app/page.tsx',import.meta.url),'utf8');
const inventory=readFileSync(new URL('../app/loot-inventory.tsx',import.meta.url),'utf8');
const toast=readFileSync(new URL('../app/loot-toast.tsx',import.meta.url),'utf8');
test('combat loot and the live notifications are wired together',()=>{
 assert.match(page,/collectEnemyLoot\(lootRef\.current/);
 assert.match(page,/appendLootEvents\(previous,result\.drops,foe\.name\)/);
 assert.match(page,/<LootToast events=\{lootEvents\}\/>/);
 assert.doesNotMatch(page,/lootNotice&&/);
});
test('portable profile includes inventory and restores the backup',()=>{
 assert.match(page,/portableAdventure\(state\.current,lootRef\.current\)/);
 assert.match(page,/readPortableAdventure\(await file\.text\(\)\)/);
 assert.match(page,/cendreval-loot-before-import/);
});
test('touch-friendly inventory includes a gear comparison and rarity cues',()=>{
 assert.match(inventory,/Comparer avec mon équipement/);
 assert.match(inventory,/ÉQUIPÉ/);
 assert.match(toast,/safe-area-inset-top/);
 assert.match(toast,/prefers-reduced-motion/);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
import {join} from 'node:path';
test('static release has a valid mount point and portable local bundle paths',async()=>{const html=await readFile('pages-dist/index.html','utf8');assert.match(html,/lang="fr"/);assert.match(html,/id="root"/);assert.match(html,/Cendreval/);const scripts=[...html.matchAll(/(?:src|href)="(\.\/assets\/[^"]+)"/g)];assert(scripts.length>=2);for(const [,path]of scripts)assert((await stat(join('pages-dist',path))).size>100);assert.doesNotMatch(html,/https?:\/\/[^" ]+\.(js|css)/)});
test('all foreground, guardian and panorama assets ship with the release',async()=>{for(const name of ['warden-sulfuras-atlas.webp','warden-thunderfury-atlas.webp','valley-props-atlas.webp','cendreval-horizon-v3.webp','shadow-pixel.png','ash-warden-v1.png'])assert((await stat(join('pages-dist',name))).size>1000,`missing ${name}`)});

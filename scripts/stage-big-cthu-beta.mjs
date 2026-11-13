// Package the audited Big Cthu public beta without copying any other repository data.
// GitHub Pages publishes pages-dist/, not the repository root.
import { readFile, readdir, lstat, mkdir, copyFile } from 'node:fs/promises';
import { resolve, join, basename } from 'node:path';

const source = resolve('big-cthu-beta');
const destinationRoot = resolve('pages-dist');
const destination = join(destinationRoot, 'big-cthu-beta');
const sw = await readFile(join(source, 'sw.js'), 'utf8');
const assetList = sw.match(/const ASSETS=\[([\s\S]*?)\];/);
if (!assetList) throw new Error('Big Cthu: service worker asset manifest not found');

const assetNames = [...assetList[1].matchAll(/'\.\/([^']+)'/g)].map((match) => match[1]);
const allowed = [...new Set([...assetNames, 'sw.js'])];
if (allowed.length < 30 || !allowed.includes('index.html') || !allowed.includes('manifest.webmanifest')
    || !allowed.includes('icon.svg') || !allowed.includes('apprentissage.html')
    || !allowed.includes('flashcards.html')) {
  throw new Error('Big Cthu: incomplete or invalid public asset manifest');
}
if (allowed.length !== assetNames.length + 1) {
  throw new Error('Big Cthu: duplicate paths in service worker assets');
}
for (const name of allowed) {
  if (basename(name) !== name || !/^[a-z0-9][a-z0-9.-]*\.(?:html|js|svg|png|webmanifest)$/.test(name)) {
    throw new Error('Big Cthu: disallowed asset name: ' + name);
  }
}

const entries = await readdir(source, { withFileTypes: true });
const existing = entries.map((entry) => entry.name);
for (const entry of entries) {
  if (!entry.isFile() || !allowed.includes(entry.name)) {
    throw new Error('Big Cthu: unreviewed or non-file asset in public source: ' + entry.name);
  }
}
for (const name of allowed) {
  if (!existing.includes(name)) throw new Error('Big Cthu: missing public asset: ' + name);
  if (!(await lstat(join(source, name))).isFile()) throw new Error('Big Cthu: unsafe asset type: ' + name);
}
if (!(await lstat(destinationRoot)).isDirectory()) {
  throw new Error('Big Cthu: pages-dist is missing; build the existing site first');
}
await mkdir(destination, { recursive: true });
for (const name of allowed) {
  await copyFile(join(source, name), join(destination, name));
}
console.log('Big Cthu: staged ' + allowed.length + ' reviewed static assets to pages-dist/big-cthu-beta/');

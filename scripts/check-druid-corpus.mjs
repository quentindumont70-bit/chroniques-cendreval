// Golipette — contrôle local du corpus Druide avant publication.
// Exécution : node scripts/check-druid-corpus.mjs
// Sans réseau, dépendance externe, écriture ni donnée de joueur.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const base = resolve('public/binch/faith-knowledge/data');
const files = ['builds.json', 'druid-other.json'];
const errors = [];
const counts = {};
const seen = new Map();

for (const file of files) {
  let records;
  try {
    records = JSON.parse(readFileSync(resolve(base, file), 'utf8'));
  } catch (error) {
    errors.push(`${file}: impossible de lire le JSON (${error.message})`);
    continue;
  }
  if (!Array.isArray(records)) {
    errors.push(`${file}: la racine doit être un tableau`);
    continue;
  }
  counts[file] = records.length;
  if (!records.length) errors.push(`${file}: corpus vide`);
  for (const [index, item] of records.entries()) {
    const where = `${file}[${index}]`;
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      errors.push(`${where}: fiche invalide`);
      continue;
    }
    for (const key of ['id', 'topic', 'title', 'summary', 'class', 'scope', 'verification', 'updatedAt']) {
      if (typeof item[key] !== 'string' || !item[key].trim()) {
        errors.push(`${where}: champ ${key} manquant`);
      }
    }
    if (typeof item.id === 'string') {
      if (seen.has(item.id)) errors.push(`${where}: ID en doublon avec ${seen.get(item.id)} : ${item.id}`);
      else seen.set(item.id, where);
    }
    if (item.scope !== 'forever') errors.push(`${where}: portée non Forever`);
    if (!['build', 'talent'].includes(item.topic)) errors.push(`${where}: topic non pris en charge`);
    if (item.class !== 'Druide') errors.push(`${where}: classe inattendue`);
    if (!Array.isArray(item.tags) || !item.tags.length) errors.push(`${where}: tags absents`);
    if (!Array.isArray(item.sources) || !item.sources.length) {
      errors.push(`${where}: aucune source`);
    } else {
      for (const [sourceIndex, source] of item.sources.entries()) {
        const prefix = `${where}.sources[${sourceIndex}]`;
        if (typeof source?.url !== 'string' || !/^https:\/\/[^\s]+$/i.test(source.url)) {
          errors.push(`${prefix}: URL HTTPS invalide`);
        }
        if (typeof source?.label !== 'string' || !source.label.trim()) {
          errors.push(`${prefix}: libellé de source absent`);
        }
        if (typeof source?.checkedAt !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(source.checkedAt)) {
          errors.push(`${prefix}: date de vérification absente ou mal formée`);
        }
      }
    }
    if (item.topic === 'build') {
      if (!Number.isInteger(item.levelMin) || !Number.isInteger(item.levelMax) ||
          item.levelMin < 1 || item.levelMax > 60 || item.levelMin > item.levelMax) {
        errors.push(`${where}: plage de niveaux invalide`);
      }
      if (typeof item.spec !== 'string' || !item.spec.trim()) errors.push(`${where}: spécialisation absente`);
    }
  }
}

console.log('Corpus Druide :', JSON.stringify(counts), 'IDs uniques :', seen.size);
if (errors.length) {
  for (const error of errors) console.error('ERREUR :', error);
  process.exitCode = 1;
} else {
  console.log('OK — métadonnées, sources HTTPS et unicité contrôlées (sans vérifier la disponibilité des URL).');
}

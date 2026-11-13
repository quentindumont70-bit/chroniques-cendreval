import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';

// Browser-less smoke tests for the public, dummy-data-only Big Cthu beta.
// The fake localStorage deliberately throws to simulate a full/private browser.
async function boot(page, initial = {}) {
  const html = await readFile(new URL('../big-cthu-beta/' + page, import.meta.url), 'utf8');
  const source = html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
  assert.ok(source, page + ' must have a script');
  const nodes = new Map();
  const memory = new Map(Object.entries(initial));
  const alerts = [];
  let full = false, failedKey = null, seq = 0;
  const windowEvents = {}, navigator = { onLine: true };
  const node = (id) => ({
    id, children: [], value: '', checked: false, hidden: false, textContent: '',
    className: '', dataset: {}, listeners: {}, style: {},
    append(...children) { this.children.push(...children); },
    replaceChildren(...children) { this.children = children; },
    setAttribute() {}, focus() {}, reset() {}, scrollIntoView() {},
    addEventListener(type, fn) { (this.listeners[type] ??= []).push(fn); },
    async fire(type, override = {}) {
      for (const fn of this.listeners[type] ?? []) {
        await fn({ preventDefault() {}, target: this, ...override });
      }
    },
  });
  function get(id) {
    if (!nodes.has(id)) nodes.set(id, node(id));
    return nodes.get(id);
  }
  const document = {
    body: { dataset: {} },
    createElement: node,
    getElementById: get,
    querySelector: (s) => get(s.startsWith('#') ? s.slice(1) : s),
    querySelectorAll() { return []; },
    addEventListener() {},
  };
  get('filter').value = 'all';
  const localStorage = {
    getItem: (k) => memory.get(k) ?? null,
    setItem(k, v) { if (full || failedKey === k) throw new Error('QuotaExceededError'); memory.set(k, String(v)); },
    removeItem: (k) => memory.delete(k),
  };
  runInNewContext(source, {
    document, localStorage, window: { addEventListener(type, fn) { (windowEvents[type] ??= []).push(fn); } }, navigator,
    location: { protocol: 'http:', hostname: 'test.invalid' },
    crypto: { randomUUID: () => 'sample-' + ++seq },
    confirm: () => true, alert: (msg) => alerts.push(msg),
    URL: { createObjectURL: () => 'blob:mock', revokeObjectURL() {} },
    Blob: class {}, setTimeout() {},
  }, { filename: page, timeout: 1500 });
  return { get, memory, alerts, setFull: (value) => { full = value; }, setFailedKey: (value) => { failedKey = value; },
    setNetwork: (online) => { navigator.onLine = online; for (const fn of windowEvents[online ? 'online' : 'offline'] ?? []) fn(); } };
}

test('Budget: no phantom add/delete/settings when browser storage fails', async () => {
  const b = await boot('budget.html');
  const key = 'big-cthu-v2-budget-v1';
  b.get('label').value = 'Facture exemple';
  b.get('amount').value = '48';
  b.get('type').value = 'fixed';
  b.setFull(true);
  await b.get('form').fire('submit');
  assert.equal(b.memory.has(key), false);
  assert.equal(b.get('entries').children.length, 1);
  b.setFull(false);
  await b.get('form').fire('submit');
  assert.equal(JSON.parse(b.memory.get(key)).items.length, 1);
  const deleteButton = b.get('entries').children[0].children[2].children[0];
  b.setFull(true);
  await deleteButton.fire('click');
  assert.equal(JSON.parse(b.memory.get(key)).items.length, 1);
  b.get('balance').value = '999';
  await b.get('saveSettings').fire('click');
  assert.equal(JSON.parse(b.memory.get(key)).balance, 0);
  assert.equal(Number(b.get('balance').value), 0);
  assert.ok(b.alerts.length >= 2);
});

test('Cockpit: no phantom tasks or checkbox changes when storage fails', async () => {
  const h = await boot('index.html');
  const key = 'big-cthu-v2-demo-tasks';
  h.get('newtask').value = 'Priorité exemple';
  h.setFull(true);
  await h.get('taskform').fire('submit');
  assert.equal(h.memory.has(key), false);
  h.setFull(false);
  await h.get('taskform').fire('submit');
  assert.equal(JSON.parse(h.memory.get(key)).length, 1);
  const row = h.get('tasklist').children[0];
  const checkbox = row.children[0].children[0];
  h.setFull(true);
  checkbox.checked = true;
  await checkbox.fire('change');
  assert.equal(checkbox.checked, false);
  assert.equal(JSON.parse(h.memory.get(key))[0].done, false);
  await row.children[1].fire('click');
  assert.equal(JSON.parse(h.memory.get(key)).length, 1);
  assert.ok(h.alerts.length >= 2);
});

test('Cockpit: reject invalid task imports before overwriting local tasks', async () => {
  const h = await boot('index.html');
  const key = 'big-cthu-v2-demo-tasks';
  h.get('newtask').value = 'Tâche conservée';
  await h.get('taskform').fire('submit');
  const file = { size: 250, text: async () => JSON.stringify({ version: 1, tasks: [
    { id: 'duplicate', text: 'A' }, { id: 'duplicate', text: 'B' },
  ] }) };
  await h.get('importfile').fire('change', { target: { files: [file], value: '' } });
  assert.equal(JSON.parse(h.memory.get(key))[0].text, 'Tâche conservée');
  assert.match(h.alerts.at(-1), /Import impossible/);
});

test('Capture: a failed inbox write can be retried without duplicating the destination', async () => {
  const box = await boot('capture.html');
  const inboxKey = 'big-cthu-v2-inbox-v1';
  const tasksKey = 'big-cthu-v2-demo-tasks';
  box.get('title').value = 'Note fictive';
  box.get('target').value = 'task';
  box.get('due').value = '';
  box.get('notes').value = '';
  box.setFull(true);
  await box.get('form').fire('submit');
  assert.equal(box.memory.has(inboxKey), false);
  box.setFull(false);
  await box.get('form').fire('submit');
  assert.equal(JSON.parse(box.memory.get(inboxKey)).length, 1);
  box.setFailedKey(inboxKey);
  let send = box.get('list').children[0].children[1].children[0];
  await send.fire('click');
  assert.equal(JSON.parse(box.memory.get(tasksKey)).length, 1);
  assert.equal(JSON.parse(box.memory.get(inboxKey))[0].status, 'new');
  box.setFailedKey(null);
  send = box.get('list').children[0].children[1].children[0];
  await send.fire('click');
  assert.equal(JSON.parse(box.memory.get(tasksKey)).length, 1);
  assert.equal(JSON.parse(box.memory.get(inboxKey))[0].status, 'sent');
});

test('Cockpit: report navigator connectivity without claiming cloud synchronization', async () => {
  const h = await boot('index.html');
  assert.match(h.get('networkState').textContent, /Connexion détectée/);
  h.setNetwork(false);
  assert.match(h.get('networkState').textContent, /Réseau absent/);
  h.setNetwork(true);
  assert.match(h.get('networkState').textContent, /sans synchronisation/);
});

test('Coffre: preflight and rollback preserve existing modules on quota failure', async () => {
  const b = await boot('sauvegardes.html');
  const tasksKey = 'big-cthu-v2-demo-tasks';
  const jobsKey = 'big-cthu-v2-maison-v1';
  const originalTasks = JSON.stringify([{ id: 'old-task', text: 'Conserver', done: false }]);
  const originalJobs = JSON.stringify([{ id: 'old-job', name: 'Travaux conservés', status: 'todo', amount: 20 }]);
  b.memory.set(tasksKey, originalTasks);
  b.memory.set(jobsKey, originalJobs);
  const fixture = { app: 'big-cthu-v2-backup', version: 1, tasks: [{ id: 'new-task', text: 'Nouvelle', done: false }], jobs: [{ id: 'new-job', name: 'Nouveau', status: 'todo', amount: 12 }] };
  const file = { size: 300, text: async () => JSON.stringify(fixture) };
  await b.get('file').fire('change', { target: { files: [file] } });
  assert.match(b.get('preview').textContent, /Fichier valide/);
  assert.ok(!b.get('preview').textContent.includes('undefined'));
  b.get('consent').checked = true;
  await b.get('consent').fire('change');
  b.setFailedKey(jobsKey);
  await b.get('restore').fire('click');
  assert.equal(b.memory.get(tasksKey), originalTasks, 'task write is rolled back');
  assert.equal(b.memory.get(jobsKey), originalJobs, 'failed job write leaves jobs untouched');
  assert.match(b.get('preview').textContent, /Aucune modification conservée/);
  b.setFailedKey(null);
  await b.get('restore').fire('click');
  assert.deepEqual(JSON.parse(b.memory.get(tasksKey)), fixture.tasks);
  assert.deepEqual(JSON.parse(b.memory.get(jobsKey)), fixture.jobs);
  assert.match(b.get('preview').textContent, /Restauration réussie/);
});

test('Coffre: invalid backup leaves local data unchanged', async () => {
  const b = await boot('sauvegardes.html');
  const key = 'big-cthu-v2-demo-tasks';
  b.memory.set(key, JSON.stringify([{ id: 'old', text: 'Garder', done: false }]));
  const file = { size: 150, text: async () => JSON.stringify({
    app: 'big-cthu-v2-backup', version: 1,
    tasks: [{ id: 'dupe', text: 'A', done: false }, { id: 'dupe', text: 'B', done: false }], jobs: [],
  }) };
  await b.get('file').fire('change', { target: { files: [file] } });
  assert.match(b.get('preview').textContent, /Import impossible/);
  assert.equal(b.get('restore').disabled, true);
  assert.equal(JSON.parse(b.memory.get(key))[0].text, 'Garder');
});

test('Agenda: failed saves cannot create or remove ghost events', async () => {
  const a = await boot('agenda.html');
  const key = 'big-cthu-v2-agenda-v1';
  a.get('title').value = 'Rendez-vous fictif';
  a.get('date').value = '2026-12-01';
  a.get('time').value = '08:30';
  a.get('category').value = 'perso';
  a.get('notes').value = 'Sans donnée sensible';
  a.setFull(true);
  await a.get('form').fire('submit');
  assert.equal(a.memory.has(key), false);
  assert.equal(a.get('title').value, 'Rendez-vous fictif');
  a.setFull(false);
  await a.get('form').fire('submit');
  assert.equal(JSON.parse(a.memory.get(key)).length, 1);
  const article = a.get('events').children[0];
  const deleteButton = article.children.at(-1).children[0];
  a.setFull(true);
  await deleteButton.fire('click');
  assert.equal(JSON.parse(a.memory.get(key)).length, 1);
  a.setFull(false);
  await deleteButton.fire('click');
  assert.equal(JSON.parse(a.memory.get(key)).length, 0);
  assert.ok(a.alerts.length >= 2);
});

test('Maison: reject quota, restore status selection and preserve data on invalid import', async () => {
  const m = await boot('maison.html');
  const key = 'big-cthu-v2-maison-v1';
  m.get('name').value = 'Réparer une fenêtre';
  m.get('amount').value = '120';
  m.get('room').value = 'Salon';
  m.get('priority').value = 'normale';
  m.get('due').value = '';
  m.get('notes').value = '';
  m.setFull(true);
  await m.get('form').fire('submit');
  assert.equal(m.memory.has(key), false);
  m.setFull(false);
  await m.get('form').fire('submit');
  assert.equal(JSON.parse(m.memory.get(key)).length, 1);
  const article = m.get('jobs').children[0];
  const status = article.children.at(-1).children[0];
  status.value = 'doing';
  m.setFull(true);
  await status.fire('change');
  assert.equal(status.value, 'todo');
  assert.equal(JSON.parse(m.memory.get(key))[0].status, 'todo');
  m.setFull(false);
  const file = { size: 300, text: async () => JSON.stringify({ app: 'big-cthu-maison', version: 1, jobs: [
    { id: 'dupe', name: 'Un', amount: 30, status: 'todo' },
    { id: 'dupe', name: 'Deux', amount: 40, status: 'todo' },
  ] }) };
  await m.get('file').fire('change', { target: { files: [file], value: '' } });
  assert.equal(JSON.parse(m.memory.get(key)).length, 1);
  assert.match(m.alerts.at(-1), /Import impossible/);
  m.setFull(true);
  await article.children.at(-1).children[1].fire('click');
  assert.equal(JSON.parse(m.memory.get(key)).length, 1);
  assert.ok(m.alerts.length >= 3);
});

test('Équipements: no phantom additions or deletions after quota failure', async () => {
  const e = await boot('equipements.html');
  const key = 'big-cthu-v2-equipments-v1';
  e.get('name').value = 'Équipement fictif';
  e.get('room').value = 'Atelier';
  e.get('ref').value = '';
  e.get('warranty').value = '';
  e.get('maintenance').value = '';
  e.get('notes').value = '';
  e.setFull(true);
  await e.get('form').fire('submit');
  assert.equal(e.memory.has(key), false);
  e.setFull(false);
  await e.get('form').fire('submit');
  assert.equal(JSON.parse(e.memory.get(key)).length, 1);
  const card = e.get('list').children[0];
  e.setFull(true);
  await card.children.at(-1).children[0].fire('click');
  assert.equal(JSON.parse(e.memory.get(key)).length, 1);
  assert.ok(e.alerts.length >= 2);
});

test('Entretiens: completion is not recorded when storage fails; imported duplicates are deduplicated', async () => {
  const m = await boot('entretiens.html');
  const key = 'big-cthu-v2-maintenance-v1';
  m.get('title').value = 'Révision fictive';
  m.get('category').value = 'Maison';
  m.get('interval').value = '12';
  m.get('next').value = '2026-12-01';
  m.setFull(true);
  await m.get('form').fire('submit');
  assert.equal(m.memory.has(key), false);
  m.setFull(false);
  await m.get('form').fire('submit');
  assert.equal(JSON.parse(m.memory.get(key)).length, 1);
  const item = m.get('list').children[0];
  const done = item.children.at(-1).children[0];
  m.setFull(true);
  await done.fire('click');
  assert.deepEqual(JSON.parse(m.memory.get(key))[0].history, []);
  m.setFull(false);
  await done.fire('click');
  assert.equal(JSON.parse(m.memory.get(key))[0].history.length, 1);
  const file = { size: 300, text: async () => JSON.stringify({ rec: [
    { t: 'Fenêtres', cat: 'Maison', every: 12, next: '2026-12-01' },
    { t: 'Fenêtres', cat: 'Maison', every: 12, next: '2026-12-01' },
  ] }) };
  await m.get('file').fire('change', { target: { files: [file] } });
  assert.match(m.get('preview').textContent, /1 à ajouter/);
  assert.ok(m.alerts.length >= 2);
});

test('Dépenses Maison: do not alter the ledger if a write is refused', async () => {
  const d = await boot('depenses-maison.html');
  const key = 'big-cthu-v2-house-expenses-v1';
  d.get('date').value = new Date().toISOString().slice(0, 10);
  d.get('amount').value = '25.50';
  d.get('category').value = 'Travaux';
  d.get('note').value = 'Achat fictif';
  d.setFull(true);
  await d.get('form').fire('submit');
  assert.equal(d.memory.has(key), false);
  d.setFull(false);
  await d.get('form').fire('submit');
  assert.equal(JSON.parse(d.memory.get(key)).length, 1);
  const card = d.get('list').children[0];
  d.setFull(true);
  await card.children.at(-1).fire('click');
  assert.equal(JSON.parse(d.memory.get(key)).length, 1);
  assert.ok(d.alerts.length >= 2);
});

test('Cockpit: find tentacules without accents and respect current profile', async () => {
  const h = await boot('index.html');
  const lookup = h.get('tentacleSearch');
  assert.equal(h.get('tentacleCount').textContent, h.get('tiles').children.length + ' tentacule(s) affichée(s)');
  lookup.value = 'musique';
  await lookup.fire('input');
  assert.equal(h.get('tiles').children.length, 1);
  assert.match(h.get('tiles').children[0].children[1].textContent, /Musique/);
  lookup.value = 'infirmiere';
  await lookup.fire('input');
  assert.equal(h.get('tiles').children.length, 1);
  assert.match(h.get('tiles').children[0].textContent, /Aucune tentacule/);
  lookup.value = 'tournée';
  await lookup.fire('input');
  assert.equal(h.get('tiles').children.length, 1);
  await h.get('profile').fire('click');
  assert.equal(h.get('tiles').children.length, 1);
  assert.match(h.get('tiles').children[0].textContent, /Aucune tentacule/);
  await h.get('tentacleReset').fire('click');
  assert.equal(h.get('tentacleCount').textContent, h.get('tiles').children.length + ' tentacule(s) affichée(s)');
});

test('Registre Maison: preserve records after quota errors and deduplicate historical IDs', async () => {
  const key = 'big-cthu-v2-house-register-v1';
  const old = { id: 'existing', kind: 'history', title: 'Travaux antérieurs', category: 'Maison', note: '', reference: '', unit: '', date: '2026-10-01', cost: 50, reading: 0 };
  const m = await boot('registre-maison.html', { [key]: JSON.stringify([old]) });
  assert.equal(m.get('list').children.length, 1);
  const del = m.get('list').children[0].children.at(-1);
  m.setFull(true);
  await del.fire('click');
  assert.equal(JSON.parse(m.memory.get(key)).length, 1);
  m.setFull(false);
  const file = { size: 300, text: async () => JSON.stringify({ hist: [
    { id: 'repeat', type: 'Toiture', date: '2026-10-01', cout: 12 },
    { id: 'repeat', type: 'Toiture', date: '2026-10-01', cout: 12 },
  ] }) };
  await m.get('file').fire('change', { target: { files: [file] } });
  assert.match(m.get('preview').textContent, /1 nouvelle/);
  assert.ok(m.alerts.length >= 1);
});

test('Contrats: reject phantom add/delete when storage is full', async () => {
  const c = await boot('contrats.html');
  const key = 'big-cthu-v2-contracts-v1';
  c.get('title').value = 'Contrat fictif';
  c.get('category').value = 'Assurance';
  c.get('provider').value = '';
  c.get('due').value = '2026-12-01';
  c.get('amount').value = '35';
  c.get('status').value = 'Actif';
  c.get('notes').value = '';
  c.setFull(true);
  await c.get('form').fire('submit');
  assert.equal(c.memory.has(key), false);
  c.setFull(false);
  await c.get('form').fire('submit');
  assert.equal(JSON.parse(c.memory.get(key)).length, 1);
  c.setFull(true);
  await c.get('list').children[0].children.at(-1).fire('click');
  assert.equal(JSON.parse(c.memory.get(key)).length, 1);
  assert.ok(c.alerts.length >= 2);
});

test('Consommations: cannot lose a meter reading on failed local write', async () => {
  const c = await boot('consommations.html');
  const key = 'big-cthu-v2-meter-trends-v1';
  c.get('meter').value = 'Électricité';
  c.get('date').value = '2026-12-01';
  c.get('reading').value = '234';
  c.get('unit').value = 'kWh';
  c.get('note').value = '';
  c.setFull(true);
  await c.get('form').fire('submit');
  assert.equal(c.memory.has(key), false);
  c.setFull(false);
  await c.get('form').fire('submit');
  assert.equal(JSON.parse(c.memory.get(key)).length, 1);
  c.setFull(true);
  await c.get('list').children[0].children.at(-1).fire('click');
  assert.equal(JSON.parse(c.memory.get(key)).length, 1);
  assert.ok(c.alerts.length >= 2);
});

test('Cockpit: accès rapides persistants et isolation des données métier', async () => {
  const h=await boot('index.html');
  const key='big-cthu-v2-favorites-v1';
  assert.equal(h.get('favoriteLinks').children.length,3);
  assert.equal(h.get('favoriteLinks').children[0].children[0].href,'./tournee.html');
  h.get('favoriteSelect').value='voyages';
  await h.get('favoriteAdd').fire('click');
  assert.deepEqual(JSON.parse(h.memory.get(key)),['tour','agenda','budget','voyages']);
  assert.equal(h.get('favoriteLinks').children.length,4);
  assert.equal(h.memory.has('tidel_Pl'),false,'Favoris ne touchent pas au stockage clinique');
  const fresh=await boot('index.html',{[key]:h.memory.get(key)});
  assert.equal(fresh.get('favoriteLinks').children.length,4);
  assert.equal(fresh.get('favoriteLinks').children[3].children[0].href,'./voyages.html');
  const remove=fresh.get('favoriteLinks').children[3].children[1];
  await remove.fire('click');
  assert.equal(JSON.parse(fresh.memory.get(key)).includes('voyages'),false);
});

test('Cockpit: échec de stockage conserve les favoris visibles', async () => {
  const h=await boot('index.html');
  h.setFull(true);
  h.get('favoriteSelect').value='cantine';
  await h.get('favoriteAdd').fire('click');
  assert.equal(h.get('favoriteLinks').children.length,3);
  assert.match(h.get('favoriteStatus').textContent,/impossible/);
  assert.equal(h.memory.has('big-cthu-v2-favorites-v1'),false);
});

test('Tournée: les deux versions locales restent distinctes et sans promesse de synchronisation', async () => {
  const base=new URL('../big-cthu-beta/',import.meta.url);
  const [home,original,complete]=await Promise.all(['index.html','tournee.html','tournee-complete.html'].map(x=>readFile(new URL(x,base),'utf8')));
  assert.match(home,/b\.href='\.\/tournee\.html'/);
  assert.match(home,/\['tourfull','Tournée complète \(chiffrée\)','tournee-complete\.html'\]/);
  for(const code of [original,complete]){
    assert.match(code,/Aucune synchronisation automatique entre appareils/);
    assert.doesNotMatch(code,/se synchroniseront au retour du réseau/);
  }
  assert.match(complete,/AES-GCM/);
  assert.match(complete,/id="tour-import"/);
  assert.match(original,/function importAll\(/);
});

test('Coffre V25: compte les favoris du cockpit sans accéder aux données Tournée',async()=>{
 const key='big-cthu-v2-favorites-v1';
 const c=await boot('sauvegardes.html',{[key]:JSON.stringify(['tour','tourfull','coffre'])});
 assert.match(c.get('counts').textContent,/favoris : 3/);
 assert.equal(c.memory.has('tidel_Pl'),false);
 const broken=await boot('sauvegardes.html',{[key]:JSON.stringify(['tour','tour','other'])});
 assert.match(broken.get('counts').textContent,/Favoris invalides/);
});
test('Coffre V25: sauvegarde les favoris, conserve les versions antérieures et protège la restauration',async()=>{
 const html=await readFile(new URL('../big-cthu-beta/sauvegardes.html',import.meta.url),'utf8');
 assert.match(html,/Schéma V26/);
 assert.match(html,/version:25/);
 assert.match(html,/if\(data.version>=25\)/);
 assert.match(html,/validFavorites\(data.favorites\)/);
 assert.match(html,/data.favorites=readFavorites\(\)/);
 assert.match(html,/stage\(FAVORITES,staged.favorites\)/);
 assert.match(html,/20,21,22,23,24,25/);
 assert.doesNotMatch(html,/stage\(.*tidel_/);
});

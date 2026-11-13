import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';

// Browser-less smoke tests for the public, dummy-data-only Big Cthu beta.
// The fake localStorage deliberately throws to simulate a full/private browser.
async function boot(page) {
  const html = await readFile(new URL('../big-cthu-beta/' + page, import.meta.url), 'utf8');
  const source = html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
  assert.ok(source, page + ' must have a script');
  const nodes = new Map();
  const memory = new Map();
  const alerts = [];
  let full = false, failedKey = null, seq = 0;
  const windowEvents = {}, navigator = { onLine: true };
  const node = (id) => ({
    id, children: [], value: '', checked: false, hidden: false, textContent: '',
    className: '', dataset: {}, listeners: {},
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

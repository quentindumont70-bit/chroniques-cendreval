import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(new Request("http://localhost/", { headers: { accept: "text/html" } }), { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } }, { waitUntil() {}, passThroughOnException() {} });
}

test("server-renders the Cendreval opening screen", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  const html = await response.text();
  assert.match(html, /<title>Chroniques de Cendreval/i);
  assert.match(html, /Jeu en vue subjective/);
  assert.match(html, /NOUVELLE PARTIE/);
  assert.match(html, /CONTINUER/);
  assert.match(html, /<canvas[^>]*width="426"[^>]*height="240"/i);
  assert.doesNotMatch(html, /Your site is taking shape|Building your site|codex-preview/i);
});

test("keeps the rendered shell tied to the game rather than the starter", async () => {
  const [page, layout, css] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);
  assert.match(page, /const MAP/);
  assert.match(page, /cendreval-save/);
  assert.match(page, /Mouse3/);
  assert.match(page, /PARADE PARFAITE/);
  assert.match(page, /DONJON NOIR/);
  assert.match(page, /MANUEL DU VEILLEUR/);
  assert.match(page, /ANCRAGE DU CHÂTEAU/);
  assert.match(layout, /Chroniques de Cendreval/);
  assert.match(css, /game-shell/);
  assert.doesNotMatch(page, /SkeletonPreview|react-loading-skeleton/);
});

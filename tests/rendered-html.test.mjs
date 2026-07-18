import assert from "node:assert/strict";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the Open Loop Inbox experience", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>Open Loop Inbox/);
  assert.match(html, /会話に残った/);
  assert.match(html, /サンプルの1日を試す/);
  assert.match(html, /JUDGE SANDBOX/);
  assert.match(html, /ログイン不要/);
  assert.doesNotMatch(html, /codex-preview/);
  assert.doesNotMatch(html, /react-loading-skeleton/);
});

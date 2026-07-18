import assert from "node:assert/strict";
import { request } from "node:http";
import test from "node:test";
import { createCompanionServer } from "../src/http-server.mjs";

async function withServer(historyService, run) {
  const server = createCompanionServer({ historyService });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;
  try {
    await run(baseUrl);
  } finally {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  }
}

function serviceMock() {
  const calls = [];
  return {
    workspace: "/Users/example/project",
    calls,
    async listThreads({ limit }) {
      calls.push({ type: "list", limit });
      return [{ id: "one", title: "One", updatedAt: 123, cwd: this.workspace, source: "cli" }];
    },
    async readThread(threadId) {
      calls.push({ type: "read", threadId });
      return { id: threadId, title: "One", messages: [] };
    },
  };
}

test("metadata endpoint does not read a thread", async () => {
  const service = serviceMock();
  await withServer(service, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/threads?limit=10`);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), {
      threads: [{ id: "one", title: "One", updatedAt: 123, cwd: service.workspace, source: "cli" }],
    });
  });
  assert.deepEqual(service.calls, [{ type: "list", limit: 10 }]);
});

test("read endpoint requires explicit confirmation", async () => {
  const service = serviceMock();
  await withServer(service, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/threads/read`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ threadId: "one" }),
    });
    assert.equal(response.status, 400);
    assert.match((await response.json()).error, /confirmation/);
  });
  assert.deepEqual(service.calls, []);
});

test("read endpoint forwards one confirmed selection", async () => {
  const service = serviceMock();
  await withServer(service, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/threads/read`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ threadId: "one", confirmed: true }),
    });
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { thread: { id: "one", title: "One", messages: [] } });
  });
  assert.deepEqual(service.calls, [{ type: "read", threadId: "one" }]);
});

test("cross-origin requests are rejected before service access", async () => {
  const service = serviceMock();
  await withServer(service, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/threads`, { headers: { Origin: "https://example.com" } });
    assert.equal(response.status, 403);
  });
  assert.deepEqual(service.calls, []);
});

test("unexpected Host headers are rejected before service access", async () => {
  const service = serviceMock();
  await withServer(service, async (baseUrl) => {
    const statusCode = await new Promise((resolve, reject) => {
      const target = new URL("/api/threads", baseUrl);
      const req = request(target, { headers: { Host: "localhost:4317" } }, (response) => {
        response.resume();
        response.on("end", () => resolve(response.statusCode));
      });
      req.on("error", reject);
      req.end();
    });
    assert.equal(statusCode, 403);
  });
  assert.deepEqual(service.calls, []);
});

test("static UI includes restrictive browser security headers", async () => {
  const service = serviceMock();
  await withServer(service, async (baseUrl) => {
    const response = await fetch(baseUrl);
    assert.equal(response.status, 200);
    assert.match(response.headers.get("content-security-policy"), /connect-src 'self'/);
    assert.equal(response.headers.get("x-frame-options"), "DENY");
  });
});

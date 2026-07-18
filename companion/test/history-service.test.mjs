import assert from "node:assert/strict";
import test from "node:test";
import { HistoryService, extractMessages } from "../src/history-service.mjs";

const workspace = "/Users/example/project";

function mockClient(results) {
  const calls = [];
  return {
    calls,
    async request(method, params) {
      calls.push({ method, params });
      return results[method];
    },
  };
}

test("listThreads requests only the configured workspace and returns metadata", async () => {
  const client = mockClient({
    "thread/list": {
      data: [
        { id: "inside", name: "Inside", updatedAt: 123, cwd: workspace, source: "vscode", path: "/secret/session.jsonl" },
        { id: "outside", name: "Outside", updatedAt: 456, cwd: "/Users/example/other", source: "cli" },
      ],
    },
  });
  const service = new HistoryService({ client, workspace });

  const threads = await service.listThreads({ limit: 10 });

  assert.deepEqual(threads, [{ id: "inside", title: "Inside", updatedAt: 123, cwd: workspace, source: "vscode" }]);
  assert.equal("path" in threads[0], false);
  assert.deepEqual(client.calls[0], {
    method: "thread/list",
    params: {
      archived: false,
      cwd: workspace,
      limit: 10,
      sortKey: "updated_at",
      sortDirection: "desc",
      sourceKinds: ["cli", "vscode", "appServer"],
    },
  });
});

test("readThread is rejected until the thread appeared in the latest list", async () => {
  const client = mockClient({});
  const service = new HistoryService({ client, workspace });

  await assert.rejects(() => service.readThread("not-selected"), /Select a thread/);
  assert.equal(client.calls.length, 0);
});

test("readThread reads one selected thread and returns message text only", async () => {
  const client = mockClient({
    "thread/list": { data: [{ id: "selected", name: "Selected", updatedAt: 123, cwd: workspace, source: "vscode" }] },
    "thread/read": {
      thread: {
        id: "selected",
        cwd: workspace,
        path: "/secret/session.jsonl",
        turns: [{ items: [
          { type: "userMessage", content: [{ type: "inputText", text: "確認して" }] },
          { type: "agentMessage", content: [{ type: "outputText", text: "確認します" }] },
          { type: "commandExecution", command: "printenv", aggregatedOutput: "TOKEN=secret" },
        ] }],
      },
    },
  });
  const service = new HistoryService({ client, workspace });
  await service.listThreads();

  const thread = await service.readThread("selected");

  assert.deepEqual(thread.messages, [
    { role: "user", text: "確認して" },
    { role: "assistant", text: "確認します" },
  ]);
  assert.equal("path" in thread, false);
  assert.deepEqual(client.calls[1], {
    method: "thread/read",
    params: { threadId: "selected", includeTurns: true },
  });
});

test("extractMessages ignores tool and command output", () => {
  assert.deepEqual(extractMessages({ turns: [{ items: [
    { type: "toolCall", content: "secret" },
    { type: "assistant", role: "assistant", content: "safe summary" },
  ] }] }), [{ role: "assistant", text: "safe summary" }]);
});

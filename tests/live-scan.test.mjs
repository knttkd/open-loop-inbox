import assert from "node:assert/strict";
import test from "node:test";
import {
  buildActionProposals,
  extractThreadEvidence,
  scanLiveHistory,
} from "../plugins/open-loop-inbox/mcp-app/live-scan.mjs";

const workspace = "/Users/kanta/github/hackathon-0718-codex";

function userMessage(text, turnId = "turn-1") {
  return { role: "user", text, turnId, occurredAt: "2026-07-18T00:00:00.000Z" };
}

test("live scan strictly scopes to this workspace and excludes the current thread before reading", async () => {
  const calls = [];
  const client = {
    async request(method, params) {
      calls.push({ method, params });
      if (method === "thread/list") {
        return {
          data: [
            { id: "current", cwd: workspace, title: "Current task" },
            { id: "other-workspace", cwd: "/Users/kanta/github/another-project", title: "Do not read" },
            { id: "valid", cwd: `${workspace}/.`, title: "Implement the plugin" },
          ],
        };
      }
      assert.equal(method, "thread/read");
      assert.equal(params.threadId, "valid");
      return {
        thread: {
          id: "valid",
          cwd: workspace,
          turns: [{ id: "turn-1", items: [{ role: "user", content: "TODOを確認してください" }] }],
        },
      };
    },
  };

  const result = await scanLiveHistory({ workspace, limit: 1, currentThreadId: "current", client });

  assert.equal(result.scannedThreadCount, 1);
  assert.equal(result.currentThreadExcluded, true);
  assert.deepEqual(calls.map((call) => call.method), ["thread/list", "thread/read"]);
  assert.deepEqual(calls[0].params, {
    archived: false,
    cwd: workspace,
    limit: 2,
    sortKey: "updated_at",
    sortDirection: "desc",
    sourceKinds: ["cli", "vscode", "appServer"],
  });
  assert.equal(calls[1].params.threadId, "valid");
  assert.equal(result.actions[0].evidenceSummary, "TODOを確認してください");
});

test("thread evidence keeps conversational text only, never command or file output", () => {
  const evidence = extractThreadEvidence({
    turns: [{
      id: "turn-1",
      items: [
        { role: "user", content: "設定を修正してください" },
        { type: "command_execution", role: "assistant", content: "DATABASE_URL=postgres://private-command-output" },
        { type: "file_change", role: "assistant", content: "diff --git a/.env\n+API_KEY=private-file-output" },
        { role: "assistant", content: "対応方針を確認しました。" },
      ],
    }],
  });

  assert.deepEqual(evidence.messages.map((message) => message.text), [
    "設定を修正してください",
    "対応方針を確認しました。",
  ]);
  assert.equal(evidence.hasVerification, false);
});

test("todo proposals are deterministic, merge duplicates, and require evidence before completion", () => {
  const openRequest = "競合サービスについて調べてください";
  const threads = [
    {
      id: "thread-a",
      evidence: {
        hasVerification: false,
        messages: [userMessage(openRequest, "turn-a")],
      },
    },
    {
      id: "thread-b",
      evidence: {
        hasVerification: false,
        messages: [
          userMessage(openRequest, "turn-b"),
          { role: "assistant", text: "調査を完了しました。", turnId: "turn-b" },
        ],
      },
    },
    {
      id: "thread-c",
      evidence: {
        hasVerification: true,
        messages: [
          userMessage("プラグインのREADMEを修正してください", "turn-c"),
          { role: "assistant", text: "修正しました。", turnId: "turn-c" },
        ],
      },
    },
  ];

  const first = buildActionProposals(threads, workspace);
  const second = buildActionProposals(threads, workspace);

  assert.deepEqual(first, second);
  assert.deepEqual(first.summary, {
    sources: 3,
    candidates: 3,
    merged: 1,
    completed: 1,
    review: 1,
  });
  assert.equal(first.actions.length, 1);
  assert.equal(first.actions[0].status, "Ready");
  assert.equal(first.actions[0].type, "Research");
  assert.equal(first.actions[0].evidenceSummary, openRequest);
  assert.match(first.actions[0].reconciliationReason, /2件の同一成果物/);
  assert.equal(first.completed, 1);
});

test("uses the request body instead of attached-file metadata for task proposals", () => {
  const attachedRequest = `# Files mentioned by the user:

## codex-clipboard.png:
/var/folders/example/codex-clipboard.png

## My request for Codex:

プラグインの実行時、タスク名から何をやっているか分かるように修正してください`;

  const result = buildActionProposals([{
    id: "thread-with-attachment",
    evidence: { hasVerification: false, messages: [userMessage(attachedRequest)] },
  }], workspace);

  assert.equal(result.actions.length, 1);
  assert.equal(result.actions[0].title, "対応する: プラグインの実行時、タスク名から何をやっているか分かるように");
  assert.equal(result.actions[0].evidenceSummary, "プラグインの実行時、タスク名から何をやっているか分かるように修正してください");
  assert.doesNotMatch(result.actions[0].title, /codex-clipboard|var\/folders/);
  assert.doesNotMatch(result.actions[0].evidenceSummary, /codex-clipboard|var\/folders/);
});

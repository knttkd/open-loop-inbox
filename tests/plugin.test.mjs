import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { scopeThreadList } from "../plugins/open-loop-inbox/skills/open-loop-inbox/scripts/history-scope.mjs";

const pluginRoot = new URL("../plugins/open-loop-inbox/", import.meta.url);
const skillRoot = new URL("skills/open-loop-inbox/", pluginRoot);
const mcpServer = new URL("mcp-app/server.mjs", pluginRoot);

function runMcpMessages(messages) {
  const input = messages.map((message) => JSON.stringify(message)).join("\n") + "\n";
  const result = spawnSync(process.execPath, [mcpServer.pathname], {
    encoding: "utf8",
    input,
  });
  assert.equal(result.status, 0, result.stderr);
  return result.stdout
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

test("plugin manifest points to the bundled Open Loop skill", async () => {
  const manifest = JSON.parse(
    await readFile(new URL(".codex-plugin/plugin.json", pluginRoot), "utf8"),
  );
  const skill = await readFile(new URL("SKILL.md", skillRoot), "utf8");

  assert.equal(manifest.name, "open-loop-inbox");
  assert.equal(manifest.skills, "./skills/");
  assert.equal(manifest.mcpServers, "./.mcp.json");
  assert.match(skill, /name: open-loop-inbox/);
  assert.match(skill, /Never execute before explicit approval/);
  assert.match(skill, /call the `scan_open_loop_history` MCP Tool/);
});

test("plugin MCP config starts the bundled UI experiment", async () => {
  const config = JSON.parse(await readFile(new URL(".mcp.json", pluginRoot), "utf8"));
  const server = config.mcpServers["open-loop-inbox-ui"];

  assert.equal(server.command, "node");
  assert.deepEqual(server.args, ["./mcp-app/server.mjs"]);
  assert.equal(server.cwd, ".");
});

test("MCP UI experiment exposes a portable resource and structured fallback", () => {
  const responses = runMcpMessages([
    {
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: { protocolVersion: "2025-11-25", capabilities: {} },
    },
    { jsonrpc: "2.0", id: 2, method: "tools/list", params: {} },
    {
      jsonrpc: "2.0",
      id: 3,
      method: "resources/read",
      params: { uri: "ui://open-loop-inbox/action-cards-v6.html" },
    },
    {
      jsonrpc: "2.0",
      id: 4,
      method: "tools/call",
      params: { name: "show_open_loop_actions", arguments: {} },
    },
    {
      jsonrpc: "2.0",
      id: 5,
      method: "tools/call",
      params: {
        name: "record_open_loop_decision",
        arguments: {
          proposalId: "proposal-1",
          title: "サイトを公開する",
          decision: "Approve",
        },
      },
    },
  ]);

  const initialize = responses.find((response) => response.id === 1).result;
  const tools = responses.find((response) => response.id === 2).result.tools;
  const tool = tools[0];
  const liveScanTool = tools.find((candidate) => candidate.name === "scan_open_loop_history");
  const decisionTool = tools.find((candidate) => candidate.name === "record_open_loop_decision");
  const resource = responses.find((response) => response.id === 3).result.contents[0];
  const toolResult = responses.find((response) => response.id === 4).result;
  const decisionResult = responses.find((response) => response.id === 5).result;

  assert.deepEqual(initialize.capabilities, { resources: {}, tools: {} });
  assert.equal(tool._meta.ui.resourceUri, "ui://open-loop-inbox/action-cards-v6.html");
  assert.equal(tool._meta["openai/outputTemplate"], tool._meta.ui.resourceUri);
  assert.equal(tool.annotations.readOnlyHint, true);
  assert.equal(liveScanTool.inputSchema.properties.workspace.type, "string");
  assert.equal(liveScanTool.inputSchema.properties.limit.maximum, 100);
  assert.equal(liveScanTool.annotations.readOnlyHint, true);
  assert.deepEqual(decisionTool.inputSchema.properties.decision.enum, ["Approve", "Dismiss", "Edit", "Snooze"]);
  assert.equal(decisionTool.annotations.destructiveHint, false);
  assert.equal(resource.mimeType, "text/html;profile=mcp-app");
  assert.match(resource.text, /ui\/notifications\/tool-result/);
  assert.match(resource.text, /ui\/notifications\/size-changed/);
  assert.match(resource.text, /ui\/request-display-mode/);
  assert.match(resource.text, /requestDisplayMode/);
  assert.match(resource.text, /main \{ width: 100%/);
  assert.match(resource.text, /--ink: #1d2130/);
  assert.match(resource.text, /card-type-research/);
  assert.match(resource.text, /STRONGEST EVIDENCE/);
  assert.match(resource.text, /PRACTICE WITH A REAL CARD/);
  assert.match(resource.text, /右スワイプは「実行」/);
  assert.match(resource.text, /左スワイプは「見送る」/);
  assert.match(resource.text, /上スワイプは「指示を追加」/);
  assert.match(resource.text, /練習をスキップ/);
  assert.match(resource.text, /const onboardingSampleAction = Object\.freeze/);
  assert.match(resource.text, /actionCardMarkup\(onboardingSampleAction, "01"/);
  assert.doesNotMatch(resource.text, /actionCardMarkup\(actions\[0\], "01", `onboarding-card practice/);
  assert.match(resource.text, /PRACTICE MODE/);
  assert.match(resource.text, /record_open_loop_decision/);
  assert.match(resource.text, /data-edit-note/);
  assert.match(resource.text, /サイドバーで開く/);
  assert.match(resource.text, /data-display-mode="inline"/);
  assert.match(resource.text, /if \(displayMode === "inline"\)/);
  assert.match(resource.text, /← チャットに戻す/);
  assert.equal(toolResult.structuredContent.actions.length, 3);
  assert.equal(toolResult._meta.ui.resourceUri, tool._meta.ui.resourceUri);
  assert.equal(toolResult._meta["openai/outputTemplate"], tool._meta.ui.resourceUri);
  assert.match(toolResult.content[0].text, /確認対象のActionは3件/);
  assert.equal(decisionResult.structuredContent.proposalId, "proposal-1");
  assert.equal(decisionResult.structuredContent.decision, "Approve");
  assert.equal(decisionResult.structuredContent.executionAuthorized, false);
});

test("bundled sample preserves the 7 to 3 golden path", async () => {
  const sample = JSON.parse(
    await readFile(new URL("assets/sample-result.json", skillRoot), "utf8"),
  );

  assert.equal(sample.summary.candidates, 7);
  assert.equal(sample.summary.merged, 2);
  assert.equal(sample.summary.completed, 1);
  assert.equal(sample.summary.review, 3);
  assert.equal(sample.proposals.length, 3);
});

test("history connector exposes scoped list and read commands", () => {
  const scriptPath = new URL("scripts/codex-history.mjs", skillRoot);
  const result = spawnSync(process.execPath, [scriptPath.pathname, "--help"], {
    encoding: "utf8",
  });

  assert.equal(result.status, 0);
  assert.match(result.stdout, /list \[--cwd/);
  assert.match(result.stdout, /read <thread-id>/);
  assert.match(result.stdout, /--exclude-thread/);
  assert.match(result.stdout, /--include-current/);
});

test("history scope excludes the current scan before applying the requested limit", () => {
  const result = {
    data: [
      { id: "current", title: "Review recent open loops" },
      { id: "task-1", title: "Fix zoom reset" },
      { id: "task-2", title: "Fix terminal scroll" },
    ],
    nextCursor: "cursor-1",
  };

  const scoped = scopeThreadList(result, {
    excludedThreadIds: new Set(["current"]),
    limit: 2,
  });

  assert.deepEqual(scoped.data.map((thread) => thread.id), ["task-1", "task-2"]);
  assert.equal(scoped.nextCursor, "cursor-1");
  assert.equal(result.data.length, 3);
});

test("receipt store accepts minimal references and protects the local file", async () => {
  const directory = await mkdtemp(join(tmpdir(), "open-loop-receipt-"));
  const fixture = join(directory, "receipt.json");
  const scriptPath = new URL("scripts/receipt-store.mjs", skillRoot);
  const receipt = {
    receiptId: "receipt-1",
    proposalId: "proposal-1",
    title: "確認結果をまとめる",
    evidenceRefs: [{ threadId: "thread-1", turnId: "turn-2" }],
    approvedPreview: {
      executor: "Codex",
      target: "current workspace",
      resultingArtifact: "evaluation note",
      externalEffect: "none",
      reversible: true,
    },
    resultStatus: "Completed",
    resultSummary: "評価メモを作成しました。",
    completedAt: "2026-07-17T12:00:00+09:00",
    undoInstructions: "評価メモを削除します。",
  };

  try {
    await writeFile(fixture, JSON.stringify(receipt));
    const result = spawnSync(
      process.execPath,
      [scriptPath.pathname, "add", "--file", fixture, "--cwd", directory],
      { encoding: "utf8" },
    );
    assert.equal(result.status, 0, result.stderr);
    const storedPath = join(directory, ".open-loop-inbox", "receipts.jsonl");
    assert.deepEqual(JSON.parse((await readFile(storedPath, "utf8")).trim()), receipt);
    assert.equal((await stat(storedPath)).mode & 0o777, 0o600);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("receipt store rejects raw evidence, secret-like values, and oversized text", async (t) => {
  const scriptPath = new URL("scripts/receipt-store.mjs", skillRoot);

  async function expectRejected(name, receipt) {
    await t.test(name, async () => {
      const directory = await mkdtemp(join(tmpdir(), "open-loop-receipt-"));
      const fixture = join(directory, "receipt.json");
      try {
        await writeFile(fixture, JSON.stringify(receipt));
        const result = spawnSync(
          process.execPath,
          [scriptPath.pathname, "add", "--file", fixture, "--cwd", directory],
          { encoding: "utf8" },
        );
        assert.notEqual(result.status, 0);
      } finally {
        await rm(directory, { recursive: true, force: true });
      }
    });
  }

  await expectRejected("raw Evidence quote", {
    receiptId: "receipt-unsafe-1",
    evidenceRefs: [{ threadId: "thread-1", quote: "原文を保存しない" }],
  });
  await expectRejected("secret value under a benign field", {
    receiptId: "receipt-unsafe-2",
    resultSummary: `sk-${"a".repeat(24)}`,
  });
  await expectRejected("conversation-sized string", {
    receiptId: "receipt-unsafe-3",
    resultSummary: "x".repeat(2_001),
  });
});

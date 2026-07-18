import { readFile } from "node:fs/promises";
import readline from "node:readline";
import { scanLiveHistory } from "./live-scan.mjs";

export const SERVER_NAME = "open-loop-inbox-ui";
export const SERVER_VERSION = "0.4.0";
export const TOOL_NAME = "show_open_loop_actions";
export const LIVE_SCAN_TOOL_NAME = "scan_open_loop_history";
export const RESOURCE_URI = "ui://open-loop-inbox/action-cards-v4.html";
export const RESOURCE_MIME_TYPE = "text/html;profile=mcp-app";

const actions = Object.freeze([
  {
    id: "proposal-research-1",
    title: "Cursorの受賞例を5件調べて月曜までに共有する",
    type: "Research",
    owner: "Kanta",
    due: "月曜",
    status: "Ready",
    risk: "Low",
    confidence: 97,
    executor: "Codex Research",
    effect: "5件の出典付き調査メモを作成します。外部公開はしません。",
    evidenceSource: "Meeting",
    evidenceSummary: "Cursorの受賞例を5件、月曜までにまとめておこう。",
    reconciliationReason: "会議とChatGPTの2件を統合し、後の会議にある件数と期限を採用しました。",
    suggestedAction: "実行",
  },
  {
    id: "proposal-calendar-1",
    title: "Build Weekの振り返り時間を確保する",
    type: "Calendar hold",
    owner: "Kanta",
    due: "未設定",
    status: "Needs input",
    risk: "Medium",
    confidence: 88,
    executor: "Calendar Hold",
    effect: "自分用の30分の仮予定を作成します。招待や通知は送りません。",
    evidenceSource: "Meeting",
    evidenceSummary: "終わったら30分だけ振り返りの時間を取ろう。日時はあとで決める。",
    reconciliationReason: "日時だけが不足しているため、実行前に一問だけ確認します。",
    suggestedAction: "日時を入力",
  },
  {
    id: "proposal-yuki-demo-followup",
    title: "YukiさんへデモURLと試してほしい点を送る",
    type: "Email draft",
    owner: "Kanta",
    due: "未設定",
    status: "Ready",
    risk: "Medium",
    confidence: 94,
    executor: "Gmail Draft",
    effect: "URLと確認ポイントを含むメール下書きを作成します。送信はしません。",
    evidenceSource: "Meeting",
    evidenceSummary: "デプロイ後、YukiさんにURLと、特にスワイプを試してほしいって送ろう。",
    reconciliationReason: "会議とChatGPTの2件を統合し、後の会議にある確認ポイントを採用しました。",
    suggestedAction: "実行",
  },
]);

export function actionListResult() {
  const structuredContent = {
    generatedAt: "2026-07-17T00:00:00.000Z",
    source: "mcp-ui-experiment",
    actions: actions.map((action) => ({ ...action })),
  };

  const lines = structuredContent.actions.map(
    (action, index) =>
      `${index + 1}. [${action.status}] ${action.title}\n   ${action.effect}\n   Evidence: ${action.evidenceSummary}`,
  );

  return {
    structuredContent,
    content: [
      {
        type: "text",
        text: `確認対象のActionは${structuredContent.actions.length}件です。\n\n${lines.join("\n\n")}`,
      },
    ],
    _meta: {
      ui: {
        resourceUri: RESOURCE_URI,
      },
      "openai/outputTemplate": RESOURCE_URI,
    },
  };
}

export function toolDescriptor() {
  return {
    name: TOOL_NAME,
    title: "Show Open Loop Actions",
    description:
      "Display a read-only review inbox of evidence-backed unfinished Actions. Use this experiment to verify whether the current MCP host renders the linked card UI.",
    inputSchema: {
      type: "object",
      properties: {},
      additionalProperties: false,
    },
    outputSchema: {
      type: "object",
      properties: {
        generatedAt: { type: "string" },
        source: { type: "string" },
        actions: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: { type: "string" },
              title: { type: "string" },
              type: { type: "string" },
              owner: { type: "string" },
              due: { type: "string" },
              status: { type: "string" },
              risk: { type: "string" },
              confidence: { type: "number" },
              executor: { type: "string" },
              effect: { type: "string" },
              evidenceSource: { type: "string" },
              evidenceSummary: { type: "string" },
              reconciliationReason: { type: "string" },
              suggestedAction: { type: "string" },
            },
            required: [
              "id",
              "title",
              "type",
              "owner",
              "due",
              "status",
              "risk",
              "confidence",
              "executor",
              "effect",
              "evidenceSource",
              "evidenceSummary",
              "reconciliationReason",
              "suggestedAction"
            ],
            additionalProperties: false,
          },
        },
      },
      required: ["generatedAt", "source", "actions"],
      additionalProperties: false,
    },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
    _meta: {
      ui: {
        resourceUri: RESOURCE_URI,
        visibility: ["model", "app"],
      },
      "openai/outputTemplate": RESOURCE_URI,
      "openai/toolInvocation/invoking": "Actionを整理しています…",
      "openai/toolInvocation/invoked": "Actionを表示しました。",
    },
  };
}

export function liveScanToolDescriptor() {
  return {
    name: LIVE_SCAN_TOOL_NAME,
    title: "Scan Open Loop History",
    description:
      "Read recent non-archived Codex threads from one explicitly supplied absolute workspace path, exclude the current scan thread, and return evidence-backed unfinished Action candidates. This tool never executes Actions or writes Receipts.",
    inputSchema: {
      type: "object",
      properties: {
        workspace: {
          type: "string",
          description: "Absolute path of the one workspace whose Codex history may be read.",
        },
        limit: {
          type: "integer",
          minimum: 1,
          maximum: 100,
          default: 20,
          description: "Maximum number of recent non-archived threads to read.",
        },
        excludeThreadId: {
          type: "string",
          description: "Current live-scan thread ID when CODEX_THREAD_ID is unavailable. It is excluded before any thread body is read.",
        },
      },
      required: ["workspace"],
      additionalProperties: false,
    },
    outputSchema: {
      type: "object",
      properties: {
        generatedAt: { type: "string" },
        source: { const: "live-codex-history" },
        workspace: { type: "string" },
        scannedThreadCount: { type: "integer" },
        currentThreadExcluded: { type: "boolean" },
        summary: {
          type: "object",
          properties: {
            sources: { type: "integer" },
            candidates: { type: "integer" },
            merged: { type: "integer" },
            completed: { type: "integer" },
            review: { type: "integer" },
          },
          required: ["sources", "candidates", "merged", "completed", "review"],
          additionalProperties: false,
        },
        actions: { type: "array" },
      },
      required: ["generatedAt", "source", "workspace", "scannedThreadCount", "currentThreadExcluded", "summary", "actions"],
      additionalProperties: false,
    },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
    _meta: {
      ui: {
        resourceUri: RESOURCE_URI,
        visibility: ["model", "app"],
      },
      "openai/outputTemplate": RESOURCE_URI,
      "openai/toolInvocation/invoking": "限定されたCodex履歴を照合しています…",
      "openai/toolInvocation/invoked": "Action候補を表示しました。",
    },
  };
}

function liveScanResult(scan) {
  const lines = scan.actions.map(
    (action, index) => `${index + 1}. [${action.status}] ${action.title}\n   ${action.effect}\n   Evidence: ${action.evidenceSummary}`,
  );
  const summary = scan.summary;
  return {
    structuredContent: scan,
    content: [
      {
        type: "text",
        text: [
          `対象Workspace: ${scan.workspace}`,
          `現在のscanタスクは${scan.currentThreadExcluded ? "除外しました" : "環境変数で特定できなかったため、対象一覧に含まれていないことだけを確認しました"}。`,
          `${summary.sources} sources → ${summary.candidates} candidates → ${summary.merged} merged → ${summary.completed} completed → ${summary.review} to review`,
          lines.length ? lines.join("\n\n") : "レビュー対象のActionは見つかりませんでした。",
        ].join("\n\n"),
      },
    ],
    _meta: {
      ui: { resourceUri: RESOURCE_URI },
      "openai/outputTemplate": RESOURCE_URI,
    },
  };
}

async function resourceResult() {
  const html = await readFile(new URL("./widget.html", import.meta.url), "utf8");
  return {
    contents: [
      {
        uri: RESOURCE_URI,
        name: "Open Loop Inbox action cards",
        mimeType: RESOURCE_MIME_TYPE,
        text: html,
        _meta: {
          ui: {
            prefersBorder: false,
            csp: {
              connectDomains: [],
              resourceDomains: [],
            },
          },
        },
      },
    ],
  };
}

function send(message) {
  process.stdout.write(`${JSON.stringify(message)}\n`);
}

function sendResult(id, result) {
  send({ jsonrpc: "2.0", id, result });
}

function sendError(id, code, message) {
  send({ jsonrpc: "2.0", id, error: { code, message } });
}

async function handleRequest(message) {
  const { id, method, params } = message;

  if (method === "initialize") {
    sendResult(id, {
      protocolVersion: params?.protocolVersion ?? "2025-11-25",
      capabilities: { resources: {}, tools: {} },
      serverInfo: { name: SERVER_NAME, version: SERVER_VERSION },
      instructions:
        "Call show_open_loop_actions for the sample-only UI experiment. Call scan_open_loop_history only after the user has explicitly supplied or approved one absolute workspace path. Both tools are read-only: neither executes an Action nor saves a Receipt.",
    });
    return;
  }

  if (method === "ping") {
    sendResult(id, {});
    return;
  }

  if (method === "resources/list") {
    sendResult(id, {
      resources: [
        {
          uri: RESOURCE_URI,
          name: "Open Loop Inbox action cards",
          description: "Interactive review cards for the MCP UI capability experiment.",
          mimeType: RESOURCE_MIME_TYPE,
        },
      ],
    });
    return;
  }

  if (method === "resources/read") {
    if (params?.uri !== RESOURCE_URI) {
      sendError(id, -32602, `Unknown resource URI: ${params?.uri ?? ""}`);
      return;
    }
    sendResult(id, await resourceResult());
    return;
  }

  if (method === "tools/list") {
    sendResult(id, { tools: [toolDescriptor(), liveScanToolDescriptor()] });
    return;
  }

  if (method === "tools/call") {
    if (params?.name === LIVE_SCAN_TOOL_NAME) {
      try {
        const arguments_ = params?.arguments ?? {};
        const scan = await scanLiveHistory({
          workspace: arguments_.workspace,
          limit: arguments_.limit ?? 20,
          currentThreadId: arguments_.excludeThreadId ?? process.env.CODEX_THREAD_ID,
        });
        sendResult(id, liveScanResult(scan));
      } catch {
        sendResult(id, {
          isError: true,
          content: [{ type: "text", text: "Live history scan could not run. Confirm the workspace path and that the current scan thread can be excluded, then try again." }],
        });
      }
      return;
    }
    if (params?.name !== TOOL_NAME) {
      sendError(id, -32602, `Unknown tool: ${params?.name ?? ""}`);
      return;
    }
    sendResult(id, actionListResult());
    return;
  }

  if (id !== undefined) {
    sendError(id, -32601, `Method not found: ${method}`);
  }
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  const lines = readline.createInterface({ input: process.stdin, crlfDelay: Infinity });
  lines.on("line", (line) => {
    if (line.trim().length === 0) return;
    try {
      void handleRequest(JSON.parse(line));
    } catch {
      // Invalid JSON on stdio cannot be associated with a request id safely.
    }
  });
}

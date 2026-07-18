import { readFile } from "node:fs/promises";
import readline from "node:readline";

export const SERVER_NAME = "open-loop-inbox-ui";
export const SERVER_VERSION = "0.3.0";
export const TOOL_NAME = "show_open_loop_actions";
export const RESOURCE_URI = "ui://open-loop-inbox/action-cards-v3.html";
export const RESOURCE_MIME_TYPE = "text/html;profile=mcp-app";

const actions = Object.freeze([
  {
    id: "proposal-research-1",
    title: "ハッカソンの受賞例を調査する",
    summary: "類似ハッカソンの受賞例を調査し、評価されやすい特徴をまとめます。",
    status: "Ready",
    risk: "Low",
    evidenceSummary: "企画検討の会話で調査が依頼され、完了報告は見つかっていません。",
    suggestedAction: "実行",
  },
  {
    id: "proposal-calendar-1",
    title: "レビュー日程を設定する",
    summary: "候補日時を選択または入力して、レビュー予定を準備します。",
    status: "Needs input",
    risk: "Medium",
    evidenceSummary: "レビュー開催の依頼はありますが、日時が確定していません。",
    suggestedAction: "日時を入力",
  },
  {
    id: "proposal-deferred-1",
    title: "公開用スクリーンショットを更新する",
    summary: "公開前に最新UIのスクリーンショットへ差し替えます。",
    status: "Deferred",
    risk: "Low",
    evidenceSummary: "公開作業の直前に行う項目として延期されています。",
    suggestedAction: "後で確認",
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
      `${index + 1}. [${action.status}] ${action.title}\n   ${action.summary}\n   Evidence: ${action.evidenceSummary}`,
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
              summary: { type: "string" },
              status: { type: "string" },
              risk: { type: "string" },
              evidenceSummary: { type: "string" },
              suggestedAction: { type: "string" },
            },
            required: [
              "id",
              "title",
              "summary",
              "status",
              "risk",
              "evidenceSummary",
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
        "Call show_open_loop_actions when the user asks to review the MCP UI experiment. This experiment is read-only and uses sample Actions; do not claim that it scanned live history or executed an Action.",
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
    sendResult(id, { tools: [toolDescriptor()] });
    return;
  }

  if (method === "tools/call") {
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

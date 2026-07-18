import path from "node:path";

const MAX_LIMIT = 50;
const MAX_MESSAGES = 200;
const MAX_TEXT_LENGTH = 20_000;

function normalizeWorkspace(value) {
  return path.resolve(value);
}

function listData(result) {
  if (Array.isArray(result?.data)) return result.data;
  if (Array.isArray(result?.threads)) return result.threads;
  if (Array.isArray(result?.items)) return result.items;
  return [];
}

function metadataFromThread(thread) {
  return {
    id: thread.id,
    title: thread.name || thread.title || thread.preview?.split("\n")[0] || "Untitled task",
    updatedAt: thread.updatedAt ?? thread.updated_at ?? null,
    cwd: thread.cwd,
    source: thread.source ?? null,
  };
}

function contentText(content) {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";
  return content
    .map((part) => {
      if (typeof part === "string") return part;
      if (typeof part?.text === "string") return part.text;
      if (typeof part?.input_text === "string") return part.input_text;
      return "";
    })
    .filter(Boolean)
    .join("\n");
}

function messageFromItem(item) {
  const type = String(item?.type ?? "").toLowerCase();
  const role = item?.role ?? (type.includes("user") ? "user" : type.includes("agent") || type.includes("assistant") ? "assistant" : null);
  if (role !== "user" && role !== "assistant") return null;

  const text = contentText(item.content ?? item.text ?? item.message?.content).trim();
  if (!text) return null;
  return { role, text: text.slice(0, MAX_TEXT_LENGTH) };
}

function extractMessages(thread) {
  const messages = [];
  for (const turn of thread?.turns ?? []) {
    for (const item of turn?.items ?? []) {
      const message = messageFromItem(item);
      if (message) messages.push(message);
      if (messages.length >= MAX_MESSAGES) return messages;
    }
  }
  return messages;
}

export class HistoryService {
  constructor({ client, workspace }) {
    if (!client) throw new Error("client is required");
    if (!path.isAbsolute(workspace)) throw new Error("workspace must be an absolute path");
    this.client = client;
    this.workspace = normalizeWorkspace(workspace);
    this.allowedThreads = new Map();
  }

  async listThreads({ limit = 10 } = {}) {
    if (!Number.isInteger(limit) || limit < 1 || limit > MAX_LIMIT) {
      throw new Error(`limit must be an integer from 1 to ${MAX_LIMIT}`);
    }

    const result = await this.client.request("thread/list", {
      archived: false,
      cwd: this.workspace,
      limit,
      sortKey: "updated_at",
      sortDirection: "desc",
      sourceKinds: ["cli", "vscode", "appServer"],
    });

    const threads = listData(result)
      .filter((thread) => thread?.id && thread?.cwd && normalizeWorkspace(thread.cwd) === this.workspace)
      .slice(0, limit)
      .map(metadataFromThread);

    this.allowedThreads = new Map(threads.map((thread) => [thread.id, thread]));
    return threads;
  }

  async readThread(threadId) {
    if (typeof threadId !== "string" || !this.allowedThreads.has(threadId)) {
      throw new Error("Select a thread from the latest metadata list before reading it");
    }

    const result = await this.client.request("thread/read", {
      threadId,
      includeTurns: true,
    });
    const thread = result?.thread;
    if (!thread || thread.id !== threadId) throw new Error("App Server returned a different thread");
    if (!thread.cwd || normalizeWorkspace(thread.cwd) !== this.workspace) {
      throw new Error("Thread is outside the configured workspace");
    }

    return {
      ...this.allowedThreads.get(threadId),
      messages: extractMessages(thread),
    };
  }
}

export { extractMessages };

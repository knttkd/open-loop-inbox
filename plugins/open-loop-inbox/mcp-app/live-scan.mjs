import path from "node:path";
import { spawn } from "node:child_process";
import { createInterface } from "node:readline";

const DEFAULT_THREAD_LIMIT = 20;
const MAX_THREADS = 100;
const MAX_MESSAGES_PER_THREAD = 80;
const MAX_MESSAGE_CHARS = 4_000;
const MAX_TOTAL_MESSAGE_CHARS = 60_000;
const MAX_EVIDENCE_CHARS = 240;
const REQUEST_TIMEOUT_MS = 20_000;

function collectionFrom(result) {
  for (const key of ["data", "threads", "items"]) {
    if (Array.isArray(result?.[key])) return result[key];
  }
  return [];
}

function textFromContent(content) {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";
  return content.map((part) => {
    if (typeof part === "string") return part;
    if (typeof part?.text === "string") return part.text;
    if (typeof part?.input_text === "string") return part.input_text;
    if (typeof part?.output_text === "string") return part.output_text;
    return "";
  }).filter(Boolean).join("\n");
}

function roleFromItem(item) {
  const type = String(item?.type ?? "").toLowerCase();
  const role = item?.role ?? (type.includes("user") ? "user" : type.includes("agent") || type.includes("assistant") ? "assistant" : null);
  return role === "user" || role === "assistant" ? role : null;
}

function hasSuccessfulStatus(item) {
  const status = String(item?.status ?? item?.result?.status ?? "").toLowerCase();
  const exitCode = item?.exitCode ?? item?.exit_code ?? item?.result?.exitCode;
  return exitCode === 0 || status === "completed" || status === "success" || status === "passed";
}

function redactSensitiveText(value) {
  return String(value)
    .replace(/\b(?:sk|rk|pk|ghp)_[A-Za-z0-9_-]{12,}\b/g, "[redacted]")
    .replace(/\b(?:api[_-]?key|token|password|secret)\s*[:=]\s*\S+/gi, "$1=[redacted]");
}

function compactText(value, maxLength = MAX_EVIDENCE_CHARS) {
  const normalized = redactSensitiveText(value).replace(/\s+/g, " ").trim();
  return normalized.length > maxLength ? `${normalized.slice(0, maxLength - 1)}…` : normalized;
}

function threadMetadata(thread) {
  return {
    id: thread.id,
    title: compactText(thread.name ?? thread.title ?? thread.preview?.split("\n")[0] ?? "Untitled task", 120),
    updatedAt: thread.updatedAt ?? thread.updated_at ?? null,
    cwd: thread.cwd,
  };
}

export function extractThreadEvidence(thread) {
  const messages = [];
  let totalCharacters = 0;
  let hasChange = false;
  let hasSuccessfulTest = false;

  for (let turnIndex = 0; turnIndex < (thread?.turns ?? []).length; turnIndex += 1) {
    const turn = thread.turns[turnIndex];
    for (const item of turn?.items ?? []) {
      const type = String(item?.type ?? "").toLowerCase();
      if (type.includes("file") && type.includes("change")) hasChange = true;
      if (type.includes("test") && hasSuccessfulStatus(item)) hasSuccessfulTest = true;
      if (type.includes("command") || type.includes("file") || type.includes("tool")) continue;

      const role = roleFromItem(item);
      if (!role || messages.length >= MAX_MESSAGES_PER_THREAD || totalCharacters >= MAX_TOTAL_MESSAGE_CHARS) continue;
      const remaining = Math.min(MAX_MESSAGE_CHARS, MAX_TOTAL_MESSAGE_CHARS - totalCharacters);
      const text = compactText(textFromContent(item.content ?? item.text ?? item.message?.content), remaining);
      if (!text) continue;
      totalCharacters += text.length;
      messages.push({
        role,
        text,
        turnId: turn?.id ?? turnIndex,
        occurredAt: turn?.createdAt ?? turn?.created_at ?? null,
      });
    }
  }

  return { messages, hasVerification: hasChange && hasSuccessfulTest };
}

function isExplicitRequest(text) {
  return /(?:してください|して下さい|お願いします|お願い|頼む|調べ(?:て|る)|まとめ(?:て|る)|実装(?:して|する)|修正(?:して|する)|追加(?:して|する)|作(?:って|る)|確認(?:して|する)|返信(?:して|する)|送(?:って|る)|対応(?:して|する)|TODO)/.test(text);
}

function requestTextFromUserMessage(text) {
  const requestMarker = /(?:^|\n)#{1,6}\s*My request for Codex\s*:\s*(?:\n|$)/i;
  const match = requestMarker.exec(text);
  if (!match) return text;

  const request = text.slice(match.index + match[0].length).trim();
  return request || text;
}

function actionType(text) {
  if (/(?:調べ|リサーチ|research|比較)/i.test(text)) return "Research";
  if (/(?:日程|予定|calendar|カレンダー)/i.test(text)) return "Calendar hold";
  if (/(?:メール|email|返信|送信)/i.test(text)) return "Email draft";
  return "Codex task";
}

function actionVerb(type) {
  if (type === "Research") return "調査する";
  if (type === "Calendar hold") return "仮予定を作成する";
  if (type === "Email draft") return "メール下書きを作成する";
  return "対応する";
}

function actionSubject(text) {
  return compactText(text
    .replace(/(?:調べ(?:て|る)|まとめ(?:て|る)|実装(?:して(?:ください|下さい)?|する)|修正(?:して(?:ください|下さい)?|する)|追加(?:して(?:ください|下さい)?|する)|作(?:って|る)|確認(?:して(?:ください|下さい)?|する)|返信(?:して(?:ください|下さい)?|する)|送(?:って|る)|対応(?:して(?:ください|下さい)?|する)|してください|して下さい|お願いします|お願い(?:します)?|頼む)[。！!？?]*$/u, "")
    .trim() || text, 110);
}

function proposalId(type, subject, threadId, turnId) {
  const raw = `${type}:${subject}:${threadId}:${turnId}`;
  let hash = 0;
  for (const character of raw) hash = (hash * 31 + character.codePointAt(0)) >>> 0;
  return `live-${hash.toString(36)}`;
}

function previewFor(type, workspace) {
  if (type === "Research") return { executor: "Codex Research", effect: "出典付きの調査メモを現在のWorkspace内に作成します。外部公開はしません。", risk: "Low" };
  if (type === "Calendar hold") return { executor: "Calendar Hold", effect: "自分用の仮予定を作成します。招待や通知は送りません。", risk: "Medium" };
  if (type === "Email draft") return { executor: "Email Draft", effect: "メールの下書きを作成します。送信はしません。", risk: "Medium" };
  return { executor: "Codex", effect: `変更案を${workspace}内で作成します。外部への変更は行いません。`, risk: "Low" };
}

function requestHasMissingField(type, text) {
  if (type === "Calendar hold" && !/(?:\d{1,2}[/:月日]|月曜|火曜|水曜|木曜|金曜|土曜|日曜|今日|明日|来週)/.test(text)) return "開催日時";
  if (type === "Email draft" && !/(?:さん|様|宛|to:|@)/i.test(text)) return "宛先";
  return null;
}

function hasCompletionStatement(messages, afterIndex) {
  return messages.slice(afterIndex + 1).some((message) => message.role === "assistant" && /(?:完了しました|実装しました|修正しました|作成しました|対応しました)/.test(message.text));
}

export function buildActionProposals(threads, workspace) {
  const candidates = [];
  let completed = 0;

  for (const thread of threads) {
    for (let messageIndex = 0; messageIndex < thread.evidence.messages.length; messageIndex += 1) {
      const message = thread.evidence.messages[messageIndex];
      if (message.role !== "user") continue;
      const request = requestTextFromUserMessage(message.text);
      if (!isExplicitRequest(request)) continue;
      const type = actionType(request);
      const subject = actionSubject(request);
      const preview = previewFor(type, workspace);
      const missingField = requestHasMissingField(type, request);
      const isCompleted = thread.evidence.hasVerification && hasCompletionStatement(thread.evidence.messages, messageIndex);
      if (isCompleted) completed += 1;
      candidates.push({
        id: proposalId(type, subject, thread.id, message.turnId),
        groupKey: `${type}:${request.toLocaleLowerCase("ja-JP")}`,
        title: `${actionVerb(type)}: ${subject}`,
        type,
        owner: "Unknown",
        due: "未設定",
        status: isCompleted ? "Completed" : missingField ? "Needs input" : "Ready",
        risk: preview.risk,
        confidence: missingField ? 72 : 84,
        executor: preview.executor,
        effect: preview.effect,
        evidenceSource: "Codex",
        evidenceSummary: request,
        evidenceRefs: [{ threadId: thread.id, turnId: message.turnId }],
        evidence: [{
          source: "Codex",
          threadId: thread.id,
          turnId: message.turnId,
          occurredAt: message.occurredAt,
          kind: "User message",
          excerpt: request,
        }],
        executionPreview: {
          executor: preview.executor,
          target: workspace,
          resultingArtifact: type === "Research" ? "research note" : type === "Codex task" ? "workspace change" : "draft",
          externalEffect: "none",
          reversible: true,
        },
        reconciliationReason: isCompleted
          ? "後続の完了報告と、ファイル変更または成功した検証結果があるためCompletedにしました。"
          : "Codexスレッド内の明示的な依頼として検出しました。",
        missingField,
      });
    }
  }

  const grouped = new Map();
  for (const candidate of candidates) {
    const current = grouped.get(candidate.groupKey);
    if (current) current.push(candidate);
    else grouped.set(candidate.groupKey, [candidate]);
  }

  const proposals = [];
  let merged = 0;
  for (const group of grouped.values()) {
    const preferred = group.find((candidate) => candidate.status !== "Completed") ?? group[group.length - 1];
    if (group.length > 1) {
      merged += group.length - 1;
      preferred.evidenceRefs = group.flatMap((candidate) => candidate.evidenceRefs);
      preferred.evidence = group.flatMap((candidate) => candidate.evidence);
      preferred.reconciliationReason = `${group.length}件の同一成果物に関する依頼を統合し、最新の依頼を表示しています。`;
    }
    proposals.push(preferred);
  }

  const review = proposals.filter((proposal) => proposal.status === "Ready" || proposal.status === "Needs input");
  return {
    summary: {
      sources: threads.length,
      candidates: candidates.length,
      merged,
      completed: proposals.filter((proposal) => proposal.status === "Completed").length,
      review: review.length,
    },
    actions: review.map((proposal) => {
      const action = { ...proposal };
      delete action.groupKey;
      return action;
    }),
    completed,
  };
}

export class AppServerClient {
  constructor({ spawnProcess = spawn } = {}) {
    this.nextId = 1;
    this.pending = new Map();
    this.process = spawnProcess("codex", ["app-server", "--listen", "stdio://"], { stdio: ["pipe", "pipe", "ignore"] });
    this.lines = createInterface({ input: this.process.stdout });
    this.lines.on("line", (line) => this.receive(line));
    this.process.on("exit", (code) => this.rejectAll(new Error(`codex app-server exited with code ${code}`)));
    this.process.on("error", (error) => this.rejectAll(error));
  }

  send(message) { this.process.stdin.write(`${JSON.stringify(message)}\n`); }

  request(method, params = {}) {
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => { this.pending.delete(id); reject(new Error(`${method} timed out after ${REQUEST_TIMEOUT_MS}ms`)); }, REQUEST_TIMEOUT_MS);
      this.pending.set(id, { resolve: (value) => { clearTimeout(timer); resolve(value); }, reject });
      this.send({ method, id, params });
    });
  }

  receive(line) {
    let message;
    try { message = JSON.parse(line); } catch { return; }
    if (message.id === undefined || !this.pending.has(message.id)) return;
    const pending = this.pending.get(message.id);
    this.pending.delete(message.id);
    if (message.error) pending.reject(new Error(message.error.message ?? "App Server error"));
    else pending.resolve(message.result);
  }

  rejectAll(error) { for (const pending of this.pending.values()) pending.reject(error); this.pending.clear(); }

  async initialize() {
    await this.request("initialize", { clientInfo: { name: "open_loop_inbox", title: "Open Loop Inbox", version: "0.2.0" } });
    this.send({ method: "initialized", params: {} });
  }

  close() { this.lines.close(); if (this.process.stdin.writable) this.process.stdin.end(); this.process.kill(); }
}

export async function scanLiveHistory({ workspace, limit = DEFAULT_THREAD_LIMIT, currentThreadId = process.env.CODEX_THREAD_ID, client } = {}) {
  if (typeof workspace !== "string" || !path.isAbsolute(workspace)) throw new Error("workspace must be an absolute path");
  if (!Number.isInteger(limit) || limit < 1 || limit > MAX_THREADS) throw new Error(`limit must be an integer from 1 to ${MAX_THREADS}`);
  if (typeof currentThreadId !== "string" || currentThreadId.length === 0) {
    throw new Error("current scan thread id is unavailable; refusing to read history without an exclusion id");
  }
  const fixedWorkspace = path.resolve(workspace);
  const appServer = client ?? new AppServerClient();
  try {
    if (!client) await appServer.initialize();
    const result = await appServer.request("thread/list", {
      archived: false,
      cwd: fixedWorkspace,
      limit: Math.min(limit + (currentThreadId ? 1 : 0), MAX_THREADS),
      sortKey: "updated_at",
      sortDirection: "desc",
      sourceKinds: ["cli", "vscode", "appServer"],
    });
    const metadata = collectionFrom(result)
      .filter((thread) => thread?.id && typeof thread.cwd === "string" && thread.archived !== true && path.resolve(thread.cwd) === fixedWorkspace && thread.id !== currentThreadId)
      .slice(0, limit)
      .map(threadMetadata);
    const threads = [];
    for (const item of metadata) {
      const response = await appServer.request("thread/read", { threadId: item.id, includeTurns: true });
      const thread = response?.thread;
      if (!thread || thread.id !== item.id || !thread.cwd || path.resolve(thread.cwd) !== fixedWorkspace) continue;
      threads.push({ ...item, evidence: extractThreadEvidence(thread) });
    }
    const analysis = buildActionProposals(threads, fixedWorkspace);
    return {
      generatedAt: new Date().toISOString(),
      source: "live-codex-history",
      workspace: fixedWorkspace,
      scannedThreadCount: threads.length,
      currentThreadExcluded: true,
      ...analysis,
    };
  } finally {
    if (!client) appServer.close();
  }
}

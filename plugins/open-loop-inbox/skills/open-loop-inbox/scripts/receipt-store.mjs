#!/usr/bin/env node

import { appendFile, chmod, mkdir, readFile } from "node:fs/promises";
import { isAbsolute, join, resolve } from "node:path";

const args = process.argv.slice(2);
const command = args[0];
const MAX_RECEIPT_BYTES = 16_384;
const MAX_STRING_LENGTH = 2_000;
const MAX_ARRAY_LENGTH = 50;
const MAX_DEPTH = 8;
const FORBIDDEN_EXACT_KEYS = new Set([
  "body",
  "commandoutput",
  "content",
  "conversation",
  "conversationhistory",
  "evidence",
  "excerpt",
  "fulltranscript",
  "messages",
  "prompt",
  "quote",
  "rawevidence",
  "text",
  "tooloutput",
  "transcript",
]);
const FORBIDDEN_KEY_PARTS = [
  "apikey",
  "authorization",
  "cookie",
  "credential",
  "password",
  "privatekey",
  "secret",
  "token",
];
const SECRET_VALUE_PATTERNS = [
  /\b(?:sk|rk|pk)-[a-z0-9_-]{16,}\b/i,
  /\bgh[pousr]_[a-z0-9]{20,}\b/i,
  /\bgithub_pat_[a-z0-9_]{20,}\b/i,
  /\bxox[a-z]-[a-z0-9-]{20,}\b/i,
  /\bAKIA[0-9A-Z]{16}\b/,
  /\bBearer\s+[a-z0-9._~+/-]{12,}={0,2}\b/i,
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
  /\beyJ[a-z0-9_-]{10,}\.[a-z0-9_-]{10,}\.[a-z0-9_-]{10,}\b/i,
];

function option(name) {
  const index = args.indexOf(`--${name}`);
  return index >= 0 ? args[index + 1] : undefined;
}

function receiptPath(cwd) {
  if (!isAbsolute(cwd)) throw new Error("--cwd must be an absolute path");
  return join(resolve(cwd), ".open-loop-inbox", "receipts.jsonl");
}

function normalizedKey(key) {
  return key.toLowerCase().replaceAll(/[^a-z0-9]/g, "");
}

function assertReceiptSafe(value, path = "$", depth = 0) {
  if (depth > MAX_DEPTH) throw new Error(`receipt is nested too deeply at ${path}`);
  if (typeof value === "string") {
    if (value.length > MAX_STRING_LENGTH) {
      throw new Error(`receipt string is too long at ${path}`);
    }
    if (SECRET_VALUE_PATTERNS.some((pattern) => pattern.test(value))) {
      throw new Error(`receipt contains a secret-like value at ${path}`);
    }
    return;
  }
  if (Array.isArray(value)) {
    if (value.length > MAX_ARRAY_LENGTH) {
      throw new Error(`receipt array is too large at ${path}`);
    }
    value.forEach((item, index) => assertReceiptSafe(item, `${path}[${index}]`, depth + 1));
    return;
  }
  if (!value || typeof value !== "object") return;
  for (const [key, child] of Object.entries(value)) {
    const normalized = normalizedKey(key);
    if (
      FORBIDDEN_EXACT_KEYS.has(normalized) ||
      FORBIDDEN_KEY_PARTS.some((part) => normalized.includes(part))
    ) {
      throw new Error(`receipt contains a forbidden field at ${path}.${key}`);
    }
    assertReceiptSafe(child, `${path}.${key}`, depth + 1);
  }
}

async function main() {
  const cwd = option("cwd");
  if (!cwd) throw new Error("--cwd is required");
  const destination = receiptPath(cwd);

  if (command === "add") {
    const file = option("file");
    if (!file) throw new Error("add requires --file");
    const receipt = JSON.parse(await readFile(file, "utf8"));
    assertReceiptSafe(receipt);
    const serialized = JSON.stringify(receipt);
    if (Buffer.byteLength(serialized, "utf8") > MAX_RECEIPT_BYTES) {
      throw new Error("receipt exceeds the maximum allowed size");
    }
    await mkdir(join(resolve(cwd), ".open-loop-inbox"), { recursive: true });
    await appendFile(destination, `${serialized}\n`, { encoding: "utf8", mode: 0o600 });
    await chmod(destination, 0o600);
    process.stdout.write(`${destination}\n`);
    return;
  }

  if (command === "list") {
    try {
      process.stdout.write(await readFile(destination, "utf8"));
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
    return;
  }

  throw new Error("Usage: receipt-store.mjs add --file receipt.json --cwd /workspace | list --cwd /workspace");
}

main().catch((error) => {
  process.stderr.write(`Open Loop receipt store: ${error.message}\n`);
  process.exitCode = 1;
});

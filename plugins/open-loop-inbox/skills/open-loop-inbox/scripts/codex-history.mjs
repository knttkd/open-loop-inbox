#!/usr/bin/env node

import { spawn } from "node:child_process";
import { createInterface } from "node:readline";
import { scopeThreadList } from "./history-scope.mjs";

const REQUEST_TIMEOUT_MS = 20_000;

class AppServerClient {
  constructor() {
    this.nextId = 1;
    this.pending = new Map();
    this.process = spawn("codex", ["app-server"], {
      stdio: ["pipe", "pipe", "inherit"],
    });
    this.lines = createInterface({ input: this.process.stdout });
    this.lines.on("line", (line) => this.receive(line));
    this.process.on("exit", (code) => {
      for (const { reject } of this.pending.values()) {
        reject(new Error(`codex app-server exited with code ${code}`));
      }
      this.pending.clear();
    });
  }

  send(message) {
    this.process.stdin.write(`${JSON.stringify(message)}\n`);
  }

  request(method, params = {}) {
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`${method} timed out after ${REQUEST_TIMEOUT_MS}ms`));
      }, REQUEST_TIMEOUT_MS);
      this.pending.set(id, {
        resolve: (value) => {
          clearTimeout(timer);
          resolve(value);
        },
        reject: (error) => {
          clearTimeout(timer);
          reject(error);
        },
      });
      this.send({ method, id, params });
    });
  }

  receive(line) {
    let message;
    try {
      message = JSON.parse(line);
    } catch {
      return;
    }
    if (message.id === undefined) return;
    const pending = this.pending.get(message.id);
    if (!pending) return;
    this.pending.delete(message.id);
    if (message.error) {
      pending.reject(new Error(`${message.error.message ?? "App Server error"}`));
    } else {
      pending.resolve(message.result);
    }
  }

  async initialize() {
    await this.request("initialize", {
      clientInfo: {
        name: "open_loop_inbox",
        title: "Open Loop Inbox",
        version: "0.1.0",
      },
    });
    this.send({ method: "initialized", params: {} });
  }

  close() {
    this.lines.close();
    this.process.stdin.end();
    this.process.kill();
  }
}

function parseOptions(args) {
  const options = { _: [] };
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (!argument.startsWith("--")) {
      options._.push(argument);
      continue;
    }
    const key = argument.slice(2);
    if (key === "archived" || key === "include-current") {
      options[key] = true;
      continue;
    }
    const value = args[index + 1];
    if (!value || value.startsWith("--")) throw new Error(`Missing value for --${key}`);
    options[key] = value;
    index += 1;
  }
  return options;
}

function usage() {
  return [
    "Usage:",
    "  codex-history.mjs list [--cwd /absolute/path] [--limit 20] [--search text] [--archived] [--exclude-thread <id>] [--include-current]",
    "  codex-history.mjs read <thread-id> [<thread-id> ...] [--include-current]",
  ].join("\n");
}

async function main() {
  const [command, ...rawArgs] = process.argv.slice(2);
  if (!command || command === "--help" || command === "help") {
    process.stdout.write(`${usage()}\n`);
    return;
  }

  const options = parseOptions(rawArgs);
  const client = new AppServerClient();
  try {
    await client.initialize();

    if (command === "list") {
      const requestedLimit = options.limit ? Number.parseInt(options.limit, 10) : 20;
      if (!Number.isInteger(requestedLimit) || requestedLimit < 1 || requestedLimit > 100) {
        throw new Error("--limit must be an integer from 1 to 100");
      }
      const excludedThreadIds = new Set();
      if (options["exclude-thread"]) excludedThreadIds.add(options["exclude-thread"]);
      if (!options["include-current"] && process.env.CODEX_THREAD_ID) {
        excludedThreadIds.add(process.env.CODEX_THREAD_ID);
      }
      const params = {
        archived: options.archived ?? false,
        limit: Math.min(requestedLimit + (excludedThreadIds.size > 0 ? 1 : 0), 100),
        sortKey: "updated_at",
        sortDirection: "desc",
        sourceKinds: ["cli", "vscode", "appServer"],
      };
      if (options.cwd) params.cwd = options.cwd;
      if (options.search) params.searchTerm = options.search;
      const result = await client.request("thread/list", params);
      const scopedResult = scopeThreadList(result, {
        excludedThreadIds,
        limit: requestedLimit,
      });
      process.stdout.write(`${JSON.stringify(scopedResult, null, 2)}\n`);
      return;
    }

    if (command === "read") {
      if (options._.length === 0) throw new Error("read requires at least one thread id");
      if (
        !options["include-current"] &&
        process.env.CODEX_THREAD_ID &&
        options._.includes(process.env.CODEX_THREAD_ID)
      ) {
        throw new Error("refusing to read the current live-scan thread; use --include-current only for an explicit diagnostic");
      }
      const threads = [];
      for (const threadId of options._) {
        const result = await client.request("thread/read", {
          threadId,
          includeTurns: true,
        });
        threads.push(result.thread);
      }
      process.stdout.write(`${JSON.stringify({ threads }, null, 2)}\n`);
      return;
    }

    throw new Error(`Unknown command: ${command}`);
  } finally {
    client.close();
  }
}

main().catch((error) => {
  process.stderr.write(`Open Loop history connector: ${error.message}\n`);
  process.exitCode = 1;
});

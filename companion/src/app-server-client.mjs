import { spawn } from "node:child_process";
import { createInterface } from "node:readline";

const DEFAULT_TIMEOUT_MS = 20_000;

export class CodexAppServerClient {
  constructor({ spawnProcess = spawn, timeoutMs = DEFAULT_TIMEOUT_MS } = {}) {
    this.spawnProcess = spawnProcess;
    this.timeoutMs = timeoutMs;
    this.nextId = 1;
    this.pending = new Map();
    this.process = null;
    this.lines = null;
    this.initialized = false;
  }

  async connect() {
    if (this.initialized) return;

    this.process = this.spawnProcess("codex", ["app-server", "--listen", "stdio://"], {
      stdio: ["pipe", "pipe", "ignore"],
      env: process.env,
    });
    this.lines = createInterface({ input: this.process.stdout });
    this.lines.on("line", (line) => this.receive(line));
    this.process.on("error", (error) => this.rejectAll(error));
    this.process.on("exit", (code) => {
      this.initialized = false;
      this.rejectAll(new Error(`codex app-server exited with code ${code}`));
    });

    await this.request("initialize", {
      clientInfo: {
        name: "open_loop_inbox_companion",
        title: "Open Loop Inbox Companion",
        version: "0.1.0",
      },
    });
    this.send({ method: "initialized", params: {} });
    this.initialized = true;
  }

  async request(method, params = {}) {
    if (!this.process) {
      if (method === "initialize") throw new Error("App Server process is not available");
      await this.connect();
    }

    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`${method} timed out after ${this.timeoutMs}ms`));
      }, this.timeoutMs);

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

  send(message) {
    if (!this.process?.stdin?.writable) throw new Error("App Server stdin is unavailable");
    this.process.stdin.write(`${JSON.stringify(message)}\n`);
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
      pending.reject(new Error(message.error.message ?? "App Server error"));
      return;
    }
    pending.resolve(message.result);
  }

  rejectAll(error) {
    for (const pending of this.pending.values()) pending.reject(error);
    this.pending.clear();
  }

  close() {
    this.initialized = false;
    this.lines?.close();
    if (this.process?.stdin?.writable) this.process.stdin.end();
    this.process?.kill();
    this.process = null;
  }
}

#!/usr/bin/env node

import { realpath } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { CodexAppServerClient } from "./app-server-client.mjs";
import { HistoryService } from "./history-service.mjs";
import { createCompanionServer } from "./http-server.mjs";

const HOST = "127.0.0.1";

function parseArgs(args) {
  const options = { workspace: process.cwd(), port: 4317 };
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument === "--workspace") options.workspace = args[++index];
    else if (argument === "--port") options.port = Number.parseInt(args[++index], 10);
    else if (argument === "--help") options.help = true;
    else throw new Error(`Unknown option: ${argument}`);
  }
  return options;
}

function usage() {
  return "Usage: npm start -- [--workspace /absolute/path] [--port 4317]";
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    process.stdout.write(`${usage()}\n`);
    return;
  }
  if (!Number.isInteger(options.port) || options.port < 1024 || options.port > 65_535) {
    throw new Error("port must be an integer from 1024 to 65535");
  }

  const workspace = await realpath(path.resolve(options.workspace));
  const client = new CodexAppServerClient();
  const historyService = new HistoryService({ client, workspace });
  const server = createCompanionServer({ historyService });

  server.listen(options.port, HOST, () => {
    process.stdout.write(`Open Loop Inbox Companion: http://${HOST}:${options.port}\n`);
    process.stdout.write(`Workspace: ${workspace}\n`);
    process.stdout.write("History stays between this localhost process and the local Codex App Server.\n");
  });

  const shutdown = () => {
    server.close(() => client.close());
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((error) => {
  process.stderr.write(`Companion failed: ${error.message}\n${usage()}\n`);
  process.exitCode = 1;
});

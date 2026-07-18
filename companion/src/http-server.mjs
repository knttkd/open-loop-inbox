import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const DEFAULT_PUBLIC_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../public");
const MAX_BODY_BYTES = 4_096;
const STATIC_FILES = new Map([
  ["/", ["index.html", "text/html; charset=utf-8"]],
  ["/app.js", ["app.js", "text/javascript; charset=utf-8"]],
  ["/styles.css", ["styles.css", "text/css; charset=utf-8"]],
]);

function sendJson(response, status, value) {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  response.end(JSON.stringify(value));
}

function isLoopbackAddress(address) {
  return address === "127.0.0.1" || address === "::1" || address === "::ffff:127.0.0.1";
}

function validHost(host) {
  return /^127\.0\.0\.1(?::\d+)?$/.test(host ?? "");
}

function validOrigin(origin, host) {
  return !origin || origin === `http://${host}`;
}

async function parseJsonBody(request) {
  let size = 0;
  const chunks = [];
  for await (const chunk of request) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) throw new Error("Request body is too large");
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
}

function securityHeaders(response) {
  response.setHeader("Content-Security-Policy", "default-src 'self'; connect-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'");
  response.setHeader("Referrer-Policy", "no-referrer");
  response.setHeader("X-Content-Type-Options", "nosniff");
  response.setHeader("X-Frame-Options", "DENY");
}

export function createCompanionServer({ historyService, publicDir = DEFAULT_PUBLIC_DIR }) {
  if (!historyService) throw new Error("historyService is required");

  return createServer(async (request, response) => {
    securityHeaders(response);
    const host = request.headers.host;
    if (!isLoopbackAddress(request.socket.remoteAddress) || !validHost(host)) {
      sendJson(response, 403, { error: "Local access only" });
      return;
    }
    if (!validOrigin(request.headers.origin, host)) {
      sendJson(response, 403, { error: "Origin is not allowed" });
      return;
    }

    try {
      const url = new URL(request.url, `http://${host}`);
      if (request.method === "GET" && url.pathname === "/api/config") {
        sendJson(response, 200, { workspace: historyService.workspace, localOnly: true });
        return;
      }
      if (request.method === "GET" && url.pathname === "/api/threads") {
        const limit = Number.parseInt(url.searchParams.get("limit") ?? "10", 10);
        const threads = await historyService.listThreads({ limit });
        sendJson(response, 200, { threads });
        return;
      }
      if (request.method === "POST" && url.pathname === "/api/threads/read") {
        if (request.headers["content-type"]?.split(";")[0] !== "application/json") {
          sendJson(response, 415, { error: "application/json is required" });
          return;
        }
        const body = await parseJsonBody(request);
        if (body.confirmed !== true) {
          sendJson(response, 400, { error: "Explicit confirmation is required" });
          return;
        }
        const thread = await historyService.readThread(body.threadId);
        sendJson(response, 200, { thread });
        return;
      }

      if (request.method === "GET" && STATIC_FILES.has(url.pathname)) {
        const [file, contentType] = STATIC_FILES.get(url.pathname);
        const filePath = path.join(publicDir, file);
        await stat(filePath);
        response.writeHead(200, { "Content-Type": contentType, "Cache-Control": "no-store" });
        createReadStream(filePath).pipe(response);
        return;
      }

      sendJson(response, 404, { error: "Not found" });
    } catch (error) {
      const clientError = /limit|Select a thread|different thread|outside|JSON|too large/.test(error.message);
      sendJson(response, clientError ? 400 : 502, { error: error.message });
    }
  });
}

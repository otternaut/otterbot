import { Buffer } from "node:buffer";
import * as http from "node:http";
import { timingSafeEqual } from "node:crypto";
import type { ReviewSession } from "~/runner/session";

/**
 * Expose scoped tools to agent subprocesses on the container loopback interface.
 *
 * No public route, disk checkpoint, or durable storage is created.
 *
 * @param session - In-memory review state; the PAT remains in this parent process.
 * @param token - Random per-process bearer credential.
 * @returns A listening server and its private loopback origin.
 * @throws Error if the local server cannot bind.
 * @example
 * ```ts
 * import type { ReviewSession } from "~/runner/session";
 * import { startToolServer } from "~/runner/server";
 * async function openTools(session: ReviewSession) {
 *   const tools = await startToolServer(session, crypto.randomUUID());
 *   // Pass tools.url to the runner; close tools.server when the review finishes.
 *   return tools;
 * }
 * ```
 */
export async function startToolServer(
  session: ReviewSession,
  token: string,
): Promise<{ server: http.Server; url: string }> {
  const expected = Buffer.from(`Bearer ${token}`);
  const server = http.createServer((request, response) => {
    void (async () => {
      response.setHeader("content-type", "application/json");
      const supplied = Buffer.from(request.headers.authorization ?? "");
      if (
        request.method !== "POST" ||
        request.url !== "/internal/tool" ||
        supplied.length !== expected.length ||
        !timingSafeEqual(supplied, expected)
      ) {
        response.writeHead(401).end('{"error":"unauthorized"}');
        return;
      }

      try {
        const chunks: Buffer[] = [];
        let size = 0;

        for await (const chunk of request) {
          if (!(chunk instanceof Buffer)) {
            throw new Error("Unexpected request chunk");
          }

          const bytes = chunk;

          size += bytes.length;
          if (size > 2 * 1024 * 1024) {
            throw new Error("Tool payload too large");
          }

          chunks.push(bytes);
        }

        const result = await session.execute(JSON.parse(Buffer.concat(chunks).toString("utf8")));

        response.end(JSON.stringify(result));
      } catch {
        response.writeHead(400).end('{"error":"tool-rejected"}');
      }
    })().catch(() => response.destroy());
  });

  server.requestTimeout = 120000;
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("Missing tool server address");
  }

  return { server, url: `http://127.0.0.1:${String(address.port)}` };
}

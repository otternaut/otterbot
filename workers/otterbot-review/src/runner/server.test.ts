import type { Server } from "node:http";
import * as vitest from "vitest";
import { GitHub } from "~/runner/github";
import { startToolServer } from "~/runner/server";
import { ReviewSession } from "~/runner/session";
import { job } from "../../test/fixtures";

const servers: Server[] = [];

async function setup() {
  const value = job();
  const session = new ReviewSession(value, new GitHub("example-only-token", value));
  const execute = vitest.vi.spyOn(session, "execute").mockResolvedValue({ status: "ok" });
  const token = "example-loopback-capability";
  const { server, url } = await startToolServer(session, token);

  servers.push(server);

  return { execute, url, token };
}

vitest.afterEach(async () => {
  await Promise.all(
    servers.splice(0).map(async (server) => {
      server.closeAllConnections();
      await new Promise<void>((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
          } else {
            resolve();
          }
        });
      });
    }),
  );
  vitest.vi.restoreAllMocks();
});

vitest.describe("loopback tool boundary", () => {
  vitest.it("executes an authenticated JSON operation and returns its result", async () => {
    const { execute, url, token } = await setup();
    const response = await fetch(`${url}/internal/tool`, {
      method: "POST",
      headers: { authorization: `Bearer ${token}` },
      body: JSON.stringify({ operation: "context" }),
    });

    vitest.expect(new URL(url).hostname).toBe("127.0.0.1");
    vitest.expect(response.status).toBe(200);
    vitest.expect(await response.json()).toEqual({ status: "ok" });
    vitest.expect(execute).toHaveBeenCalledExactlyOnceWith({ operation: "context" });
  });

  vitest.it.each([
    { method: "POST", path: "/internal/tool", token: "invalid-capability" },
    { method: "GET", path: "/internal/tool", token: "example-loopback-capability" },
    { method: "POST", path: "/other", token: "example-loopback-capability" },
  ])("rejects unauthorized method, path, or token: $method $path $token", async (input) => {
    const { execute, url } = await setup();
    const response = await fetch(`${url}${input.path}`, {
      method: input.method,
      headers: { authorization: `Bearer ${input.token}` },
    });

    vitest.expect(response.status).toBe(401);
    vitest.expect(execute).not.toHaveBeenCalled();
  });

  vitest.it("rejects malformed JSON without executing a tool", async () => {
    const { execute, url, token } = await setup();
    const response = await fetch(`${url}/internal/tool`, {
      method: "POST",
      headers: { authorization: `Bearer ${token}` },
      body: "{invalid",
    });

    vitest.expect(response.status).toBe(400);
    vitest.expect(execute).not.toHaveBeenCalled();
  });

  vitest.it("sanitizes tool failures without retrying execution", async () => {
    const { execute, url, token } = await setup();

    execute.mockRejectedValue(new Error("private provider credentials"));
    const response = await fetch(`${url}/internal/tool`, {
      method: "POST",
      headers: { authorization: `Bearer ${token}` },
      body: JSON.stringify({ operation: "context" }),
    });

    vitest.expect(response.status).toBe(400);
    vitest.expect(await response.json()).toEqual({ error: "tool-rejected" });
    vitest.expect(execute).toHaveBeenCalledTimes(1);
  });

  vitest.it("enforces the request size limit before executing a tool", async () => {
    const { execute, url, token } = await setup();
    const response = await fetch(`${url}/internal/tool`, {
      method: "POST",
      headers: { authorization: `Bearer ${token}` },
      body: JSON.stringify({ content: "x".repeat(2 * 1024 * 1024) }),
    });

    vitest.expect(response.status).toBe(400);
    vitest.expect(execute).not.toHaveBeenCalled();
  });
});

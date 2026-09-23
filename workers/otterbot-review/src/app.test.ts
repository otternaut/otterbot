import * as vitest from "vitest";
import * as application from "~/app";
import type { LaunchReview } from "~/worker/handler";
import type { Env } from "~/worker/env";
import * as fixtures from "../test/fixtures";

const env: Env = {
  SANDBOX: {} as Env["SANDBOX"],
  CONFIG_JSON: JSON.stringify(fixtures.testConfig),
  WEBHOOK_SECRET_EXAMPLE: "test-webhook-secret",
};

async function handleRequest(request: Request, bindings: Env, launch: LaunchReview) {
  return application.createApp(launch).fetch(request, bindings, {
    waitUntil: vitest.vi.fn(),
    passThroughOnException: vitest.vi.fn(),
    props: {},
  });
}

async function webhook(
  body: unknown = fixtures.payload(),
  event = "pull_request",
): Promise<Request> {
  const bytes = new TextEncoder().encode(JSON.stringify(body));

  return new Request("https://reviews.example.com/webhooks/github/example", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-github-event": event,
      "x-hub-signature-256": `sha256=${fixtures.sign("test-webhook-secret", bytes)}`,
    },
    body: bytes,
  });
}

vitest.afterEach(() => vitest.vi.restoreAllMocks());

vitest.describe("webhook intake", () => {
  vitest.it("starts another independent run for every re-request or redelivery", async () => {
    const launch = vitest.vi.fn<LaunchReview>().mockResolvedValue("run-id");

    for (let i = 0; i < 2; i++) {
      const result = await handleRequest(await webhook(), env, launch);

      vitest.expect(result.status).toBe(202);
      vitest.expect(await result.json()).toEqual({
        status: "accepted",
        runId: "run-id",
      });
    }

    vitest.expect(launch).toHaveBeenCalledTimes(2);
    vitest.expect(launch.mock.calls[0]?.[0].organization.patSecret).toBe("GH_PAT_EXAMPLE");
  });

  vitest.it("rejects tampered bodies before launching a provider", async () => {
    const request = await webhook();

    request.headers.set("x-hub-signature-256", `sha256=${"a".repeat(64)}`);
    const launch = vitest.vi.fn();

    vitest.expect((await handleRequest(request, env, launch)).status).toBe(401);
    vitest.expect(launch).not.toHaveBeenCalled();
  });

  vitest.it.each(["ping", "push"])("acknowledges %s without starting a review", async (event) => {
    const launch = vitest.vi.fn();

    vitest.expect((await handleRequest(await webhook({}, event), env, launch)).status).toBe(200);
    vitest.expect(launch).not.toHaveBeenCalled();
  });

  vitest.it("ignores a different reviewer and unrelated pull request actions", async () => {
    const launch = vitest.vi.fn();
    const value = fixtures.payload();

    value.requested_reviewer.id = 999;
    await handleRequest(await webhook(value), env, launch);
    value.action = "synchronize";
    await handleRequest(await webhook(value), env, launch);
    vitest.expect(launch).not.toHaveBeenCalled();
  });

  vitest.it("rejects oversized and malformed payloads", async () => {
    const launch = vitest.vi.fn();
    const oversized = await webhook();

    oversized.headers.set("content-length", String(2 * 1024 * 1024));
    vitest.expect((await handleRequest(oversized, env, launch)).status).toBe(413);
    vitest.expect((await handleRequest(await webhook({}), env, launch)).status).toBe(400);
    vitest.expect(launch).not.toHaveBeenCalled();
  });

  vitest.it("does not retry launch failures or expose their details", async () => {
    vitest.vi.spyOn(console, "error").mockImplementation(() => undefined);
    const launch = vitest.vi.fn().mockRejectedValue(new Error("secret-provider-value"));
    const response = await handleRequest(await webhook(), env, launch);

    vitest.expect(response.status).toBe(503);
    vitest.expect(await response.text()).not.toContain("secret-provider-value");
    vitest.expect(launch).toHaveBeenCalledTimes(1);
  });
});

vitest.describe("Hono HTTP routes", () => {
  vitest.it("serves health without credentials or a container launcher", async () => {
    const launch = vitest.vi.fn<LaunchReview>();
    const app = application.createApp(launch);
    const response = await app.request("/health");

    vitest.expect(response.status).toBe(200);
    vitest.expect(await response.json()).toEqual({ service: "otterbot-review", status: "ok" });
    vitest.expect(response.headers.get("cache-control")).toBe("no-store");
    vitest.expect(launch).not.toHaveBeenCalled();
    const head = await app.request("/health", { method: "HEAD" });

    vitest.expect(head.status).toBe(200);
    vitest.expect(await head.text()).toBe("");
  });

  vitest.it.each([
    "/unknown",
    "/webhooks/github/INVALID",
    "/webhooks/github/" + "a".repeat(65),
    "/webhooks/github/example/extra",
  ])("rejects unmatched route %s", async (path) => {
    const response = await application.createApp(vitest.vi.fn()).request(path, { method: "POST" });

    vitest.expect(response.status).toBe(404);
    vitest.expect(await response.json()).toEqual({ error: "not-found" });
    vitest.expect(response.headers.get("cache-control")).toBe("no-store");
  });

  vitest.it.each(["GET", "PUT", "OPTIONS"])(
    "allows only POST for webhook routes: %s",
    async (method) => {
      const launch = vitest.vi.fn();
      const response = await application
        .createApp(launch)
        .request("/webhooks/github/example", { method });

      vitest.expect(response.status).toBe(405);
      vitest.expect(response.headers.get("allow")).toBe("POST");
      vitest.expect(response.headers.get("cache-control")).toBe("no-store");
      vitest.expect(launch).not.toHaveBeenCalled();
    },
  );

  vitest.it("rejects unsupported media types before reading configuration", async () => {
    const response = await application
      .createApp(vitest.vi.fn())
      .request("/webhooks/github/example", {
        method: "POST",
        headers: { "content-type": "text/plain" },
        body: "{}",
      });

    vitest.expect(response.status).toBe(415);
    vitest.expect(await response.json()).toEqual({ error: "unsupported-content-type" });
  });

  vitest.it("sanitizes configuration failures through the global error boundary", async () => {
    const logger = vitest.vi.spyOn(console, "error").mockImplementation(() => undefined);
    const launch = vitest.vi.fn();
    const response = await handleRequest(
      await webhook(),
      { ...env, CONFIG_JSON: "private-invalid-config" },
      launch,
    );

    vitest.expect(response.status).toBe(503);
    vitest.expect(await response.json()).toEqual({ error: "launch-failed" });
    vitest.expect(response.headers.get("cache-control")).toBe("no-store");
    vitest.expect(JSON.stringify(logger.mock.calls)).not.toContain("private-invalid-config");
    vitest.expect(launch).not.toHaveBeenCalled();
  });

  vitest.it("authenticates the exact bytes rather than reserializing JSON", async () => {
    const launch = vitest.vi.fn<LaunchReview>().mockResolvedValue("run-id");
    const body = new TextEncoder().encode(JSON.stringify(fixtures.payload(), null, 2) + "\n");
    const request = new Request("https://reviews.example.com/webhooks/github/example", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-github-event": "pull_request",
        "x-hub-signature-256": `sha256=${fixtures.sign("test-webhook-secret", body)}`,
      },
      body,
    });
    const response = await handleRequest(request, env, launch);

    vitest.expect(response.status).toBe(202);
    vitest.expect(launch).toHaveBeenCalledTimes(1);
  });
});

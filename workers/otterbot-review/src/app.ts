import { Hono } from "hono";
import type { Env } from "~/worker/env";
import * as handler from "~/worker/handler";

/**
 * Compose the importable Hono application with authenticated webhook routes.
 *
 * Read original request bytes before parsing JSON. Each accepted delivery starts an independent
 * run; Hono adds no storage, retry, or background execution mechanism.
 *
 * @param launch - Runtime-owned container launcher, injected for isolated HTTP tests.
 * @returns Application ready to serve through Cloudflare's fetch entry point.
 * @example
 * ```ts
 * import { createApp } from "~/app";
 * const app = createApp(async () => "example-run");
 * const response = await app.request("/health");
 * console.log(response.status); // 200; no container or credentials are needed.
 * ```
 */
export function createApp(launch: handler.LaunchReview): Hono<{ Bindings: Env }> {
  const app = new Hono<{ Bindings: Env }>();

  app.use("*", async (context, next) => {
    context.header("cache-control", "no-store");
    await next();
  });
  app.onError((_error, context) => {
    console.error(JSON.stringify({ event: "review-launch-failed" }));
    return context.json({ error: "launch-failed" }, 503);
  });
  app.notFound((context) => context.json({ error: "not-found" }, 404));
  app.get("/health", (context) => context.json({ service: "otterbot-review", status: "ok" }));

  const webhookPath = "/webhooks/github/:hook{[a-z0-9-]{1,64}}";

  app.post(webhookPath, (context) => handler.handleWebhook(context, launch));
  app.all(webhookPath, (context) => {
    context.header("allow", "POST");
    return context.json({ error: "method-not-allowed" }, 405);
  });

  return app;
}

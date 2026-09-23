import type { Context } from "hono";
import * as configuration from "~/contracts/config";
import type { Event } from "~/contracts/review";
import type { Env } from "~/worker/env";
import * as security from "~/worker/security";
import { routeEvent } from "~/worker/webhooks";

/** Launch one authenticated event without waiting for the review to finish. */
export type LaunchReview = (
  event: Event,
  config: configuration.Config,
  env: Env,
  ctx: Pick<ExecutionContext, "waitUntil">,
) => string | Promise<string>;

/**
 * Authenticate the original webhook bytes and dispatch one eligible review.
 *
 * Signature verification precedes JSON parsing. Unexpected failures reach the app error boundary.
 *
 * @param context - Hono request context with the matched hook and deployment bindings.
 * @param launch - Runtime launcher for a single fire-and-forget invocation.
 * @returns Acknowledgement or a bounded validation error response.
 * @example
 * ```ts
 * import type { Context } from "hono";
 * import type { Env } from "~/worker/env";
 * import * as handler from "~/worker/handler";
 * async function receive(context: Context<{ Bindings: Env }>, launch: handler.LaunchReview) {
 *   return handler.handleWebhook(context, launch);
 * }
 * ```
 */
export async function handleWebhook(
  context: Context<{ Bindings: Env }>,
  launch: LaunchReview,
): Promise<Response> {
  const request = context.req.raw;
  const env = context.env;

  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
    return context.json({ error: "unsupported-content-type" }, 415);
  }

  const config = configuration.parseConfig(env.CONFIG_JSON);
  const hook = config.hooks.find((item) => item.id === context.req.param("hook"));
  if (!hook) {
    return context.json({ error: "not-found" }, 404);
  }

  let bytes: Uint8Array;

  try {
    bytes = await security.readBody(request);
  } catch {
    return context.json({ error: "body-too-large" }, 413);
  }

  const signature = request.headers.get("x-hub-signature-256") ?? "";
  const valid =
    signature.startsWith("sha256=") &&
    ((await security.verify(configuration.secret(env, hook.secret), signature.slice(7), bytes)) ||
      (hook.previousSecret &&
        (await security.verify(
          configuration.secret(env, hook.previousSecret),
          signature.slice(7),
          bytes,
        ))));
  if (!valid) {
    return context.json({ error: "invalid-signature" }, 401);
  }

  const kind = request.headers.get("x-github-event");
  if (kind === "ping") {
    return context.json({ status: "pong" });
  }

  if (kind !== "pull_request") {
    return context.json({ status: "ignored" });
  }

  let event: Event | null;

  try {
    event = routeEvent(JSON.parse(new TextDecoder().decode(bytes)), config, hook);
  } catch {
    return context.json({ error: "invalid-payload" }, 400);
  }

  if (!event) {
    return context.json({ status: "ignored" });
  }

  const runId = await launch(event, config, env, context.executionCtx);

  console.log(JSON.stringify({ event: "review-accepted", runId }));
  return context.json({ status: "accepted", runId }, 202);
}

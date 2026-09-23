import { getSandbox } from "@cloudflare/sandbox";
import { createApp } from "~/app";
import * as configuration from "~/contracts/config";
import type { Event } from "~/contracts/review";
import { hex } from "~/worker/security";
import type { Env } from "~/worker/env";

export { Sandbox } from "@cloudflare/sandbox";

/**
 * Start a bounded background process in a fresh ephemeral sandbox.
 *
 * The container outlives the HTTP request. There is no application retry.
 *
 * @param event - Authenticated organization and reviewer route.
 * @param config - Validated deployment configuration.
 * @param env - Container binding and runtime secrets.
 * @param ctx - Worker context used only to finish container startup.
 * @returns Unique run identifier immediately after scheduling startup.
 * @throws Error if configuration or required credentials are missing.
 */
function launchReview(
  event: Event,
  config: configuration.Config,
  env: Env,
  ctx: Pick<ExecutionContext, "waitUntil">,
): string {
  const token = configuration.secret(env, event.organization.patSecret);
  const apiKey = configuration.secret(env, event.profile.apiKeySecret);
  const id = hex(crypto.getRandomValues(new Uint8Array(32)));
  const deadline = Date.now() + config.runSeconds * 1000;
  const sandbox = getSandbox(env.SANDBOX, id, {
    sleepAfter: config.runSeconds + 60,
    enableDefaultSession: false,
    containerTimeouts: {
      instanceGetTimeoutMS: 10000,
      portReadyTimeoutMS: 10000,
    },
  });
  const startup = sandbox.startProcess("node /app/dist/runner/index.js", {
    processId: "review",
    timeout: config.runSeconds * 1000,
    cwd: "/workspace",
    env: {
      RUN_JSON: JSON.stringify({
        id,
        event,
        deadline,
        toolsUsed: 0,
      }),
      GITHUB_TOKEN: token,
      PROVIDER: event.profile.provider,
      PROVIDER_API_KEY: apiKey,
      PROVIDER_MODEL: event.profile.model,
      ...(event.profile.effort ? { PROVIDER_EFFORT: event.profile.effort } : {}),
      DEADLINE: String(deadline),
      HOME: "/workspace/home",
    },
  });

  ctx.waitUntil(
    startup.then(
      () => {
        console.log(JSON.stringify({ event: "review-started", runId: id }));
      },
      () => {
        console.error(JSON.stringify({ event: "review-launch-failed", runId: id }));
      },
    ),
  );
  return id;
}

export default createApp(launchReview);

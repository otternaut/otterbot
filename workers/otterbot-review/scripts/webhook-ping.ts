import { createHmac } from "node:crypto";
import { parseArgs } from "node:util";
import * as configuration from "~/contracts/config";

/**
 * Send one authenticated ping without launching a review or following redirects.
 *
 * @returns Nothing after reporting the verified pong response.
 * @throws Error for invalid arguments, missing bindings, or an unsuccessful response.
 */
async function main(): Promise<void> {
  const { values } = parseArgs({
    args: process.argv.slice(2),
    options: {
      url: { type: "string", default: "http://127.0.0.1:8787" },
      hook: { type: "string" },
      help: { type: "boolean", default: false },
    },
  });
  if (values.help) {
    console.log("Usage: bun run webhook:ping [--hook example] [--url http://127.0.0.1:8787]");
    return;
  }

  const config = configuration.parseConfig(configuration.secret(process.env, "CONFIG_JSON"));
  const hook = values.hook
    ? config.hooks.find((item) => item.id === values.hook)
    : config.hooks.length === 1
      ? config.hooks[0]
      : undefined;
  if (!hook) {
    throw new Error("Select a configured hook");
  }

  const base = new URL(values.url);
  if (
    !["http:", "https:"].includes(base.protocol) ||
    base.username ||
    base.password ||
    base.pathname !== "/" ||
    base.search ||
    base.hash
  ) {
    throw new Error("Expected an HTTP origin");
  }

  const body = JSON.stringify({ zen: "Local signature check" });
  const signature = createHmac("sha256", configuration.secret(process.env, hook.secret))
    .update(body)
    .digest("hex");
  const response = await fetch(new URL(`/webhooks/github/${hook.id}`, base), {
    method: "POST",
    redirect: "error",
    signal: AbortSignal.timeout(10000),
    headers: {
      "content-type": "application/json",
      "x-github-event": "ping",
      "x-hub-signature-256": `sha256=${signature}`,
    },
    body,
  });
  const result: unknown = await response.json();
  if (
    response.status !== 200 ||
    typeof result !== "object" ||
    result === null ||
    !("status" in result) ||
    result.status !== "pong"
  ) {
    throw new Error("Expected a successful pong");
  }

  console.log(JSON.stringify({ status: "pong", httpStatus: response.status }));
}

void main().catch(() => {
  console.error(
    "Webhook ping failed. Check the URL, hook selection, local configuration, and signing secret.",
  );
  process.exitCode = 1;
});

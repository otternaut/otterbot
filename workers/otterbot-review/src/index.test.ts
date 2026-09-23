import type { Sandbox } from "@cloudflare/sandbox";
import { vi } from "vitest";
import * as vitest from "vitest";
import worker from "~/index";
import type { Env } from "~/worker/env";
import * as fixtures from "../test/fixtures";

const sandbox = vi.hoisted(() => ({
  startProcess: vi.fn<(...args: Parameters<Sandbox["startProcess"]>) => Promise<void>>(),
}));
const getSandbox = vi.hoisted(() => vi.fn(() => sandbox));

vi.mock("@cloudflare/sandbox", () => ({ getSandbox, Sandbox: vi.fn() }));

const env: Env = {
  SANDBOX: {} as Env["SANDBOX"],
  CONFIG_JSON: JSON.stringify(fixtures.testConfig),
  GH_PAT_EXAMPLE: "test-github-token",
  PROVIDER_KEY_EXAMPLE: "test-provider-key",
  WEBHOOK_SECRET_EXAMPLE: "test-webhook-secret",
};

async function request(): Promise<Request> {
  const body = new TextEncoder().encode(JSON.stringify(fixtures.payload()));

  return new Request("https://reviews.example.com/webhooks/github/example", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-github-event": "pull_request",
      "x-hub-signature-256": `sha256=${fixtures.sign("test-webhook-secret", body)}`,
    },
    body,
  });
}

vitest.afterEach(() => vi.restoreAllMocks());

vitest.describe("background container startup", () => {
  vitest.it(
    "acknowledges before startup finishes and keeps only startup in waitUntil",
    async () => {
      let finish!: () => void;

      sandbox.startProcess.mockReturnValue(
        new Promise<void>((resolve) => {
          finish = resolve;
        }),
      );
      const waitUntil = vi.fn();
      const response = await worker.fetch(await request(), env, {
        waitUntil,
      } as unknown as ExecutionContext);

      vitest.expect(response.status).toBe(202);
      vitest.expect(waitUntil).toHaveBeenCalledTimes(1);
      vitest.expect(getSandbox).toHaveBeenCalledWith(
        env.SANDBOX,
        vitest.expect.any(String),
        vitest.expect.objectContaining({
          sleepAfter: fixtures.config.runSeconds + 60,
          enableDefaultSession: false,
        }),
      );
      const [command, options] = sandbox.startProcess.mock.calls[0]!;

      vitest.expect(command).toBe("node /app/dist/runner/index.js");
      vitest.expect(options?.env?.["GITHUB_TOKEN"]).toBe("test-github-token");
      vitest.expect(options?.env?.["PROVIDER_API_KEY"]).toBe("test-provider-key");
      vitest.expect(options?.env?.["PROVIDER_EFFORT"]).toBe("medium");
      vitest.expect(options?.timeout).toBe(fixtures.config.runSeconds * 1000);
      vitest.expect(await response.text()).not.toContain("test-github-token");
      finish();
      await waitUntil.mock.calls[0]?.[0];
    },
  );

  vitest.it("logs a failed startup without retrying or logging the raw error", async () => {
    const logger = vi.spyOn(console, "error").mockImplementation(() => undefined);

    sandbox.startProcess.mockRejectedValue(new Error("private SDK response"));
    const waitUntil = vi.fn();

    vitest
      .expect(
        (
          await worker.fetch(await request(), env, {
            waitUntil,
          } as unknown as ExecutionContext)
        ).status,
      )
      .toBe(202);
    await waitUntil.mock.calls[0]?.[0];
    vitest.expect(sandbox.startProcess).toHaveBeenCalledTimes(1);
    vitest.expect(JSON.stringify(logger.mock.calls)).not.toContain("private SDK response");
    vitest.expect(JSON.stringify(logger.mock.calls)).toContain("review-launch-failed");
  });
});

import { execFile } from "node:child_process";
import { promisify } from "node:util";
import * as files from "node:fs/promises";
import { tmpdir } from "node:os";
import * as paths from "node:path";
import { vi } from "vitest";
import * as vitest from "vitest";
import type { ProviderInput } from "~/runner/providers";
import * as runtime from "~/runner/runtime";
import * as skillBundle from "~/runner/skill";
import { GitHub } from "~/runner/github";
import { runReview } from "~/runner/index";
import * as fixtures from "../../test/fixtures";

const runProvider = vi.hoisted(() => vi.fn<(input: ProviderInput) => Promise<string>>());

vi.mock("~/runner/providers", () => ({ runProvider }));

const directories: string[] = [];

vitest.afterEach(async () => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  runProvider.mockReset();
  await Promise.all(
    directories.splice(0).map((root) => files.rm(root, { recursive: true, force: true })),
  );
});

async function setup(provider: "claude" | "codex" | "cursor" = "codex") {
  const value = fixtures.job();
  const workspace = await files.mkdtemp(paths.join(tmpdir(), "otterbot-runner-test-"));

  directories.push(workspace);
  value.event.profile = { ...value.event.profile, provider, mode: "shadow" };
  delete value.frozen;
  vi.stubEnv("RUN_JSON", JSON.stringify(value));
  vi.stubEnv("GITHUB_TOKEN", "example-github-token");
  vi.stubEnv("PROVIDER", provider);
  vi.stubEnv("PROVIDER_API_KEY", "example-provider-key");
  vi.stubEnv("PROVIDER_MODEL", "example-model");
  vi.stubEnv("PROVIDER_EFFORT", "low");
  vi.stubEnv("DEADLINE", String(value.deadline));
  vi.stubEnv("BROKER_URL", "");
  vi.stubEnv("BROKER_TOKEN", "");
  vi.spyOn(GitHub.prototype, "snapshot").mockResolvedValue(structuredClone(fixtures.snapshot));
  vi.spyOn(GitHub.prototype, "history").mockResolvedValue({ reviews: [], comments: [] });
  const publish = vi.spyOn(GitHub.prototype, "publish");

  return { value, workspace, publish };
}

vitest.describe("repository skill invocation", () => {
  vitest.it.each(["claude", "codex", "cursor"] as const)(
    "passes the packaged repository skill to %s and completes a shadow review",
    async (provider) => {
      const { value, workspace, publish } = await setup(provider);
      const skill = await files.readFile("../../skills/otterbot-review/SKILL.md", "utf8");

      runProvider.mockImplementation(async (input) => {
        vitest.expect(input.provider).toBe(provider);
        vitest.expect(input.effort).toBe("low");
        vitest.expect(input.prompt).toContain("Run otterbot-review for the one PR");
        vitest.expect(input.prompt).toContain(`TRUSTED SKILL:\n${skill}`);
        vitest.expect(process.env["GITHUB_TOKEN"]).toBeUndefined();
        vitest.expect(process.env["RUN_JSON"]).toBeUndefined();
        const release = await skillBundle.readRelease(".output/skill");

        vitest.expect(input.prompt).toContain(release.skillHash);
        value.release = release;
        await runtime.callBroker({ operation: "freeze", findings: [] }, input);
        await runtime.callBroker({ operation: "history", external: true }, input);
        vitest
          .expect(
            await runtime.callBroker(
              { operation: "propose", proposal: fixtures.proposal(value) },
              input,
            ),
          )
          .toEqual({ status: "shadow", verdict: "ship-it" });

        return "Review complete";
      });
      await runReview(".output/skill", workspace);
      vitest.expect(runProvider).toHaveBeenCalledTimes(1);
      vitest.expect(publish).not.toHaveBeenCalled();
      vitest.expect(await files.readdir(workspace)).toEqual([]);
    },
  );

  vitest.it(
    "executes the compiled entry point and fails closed without launcher credentials",
    async () => {
      await vitest
        .expect(
          promisify(execFile)(process.execPath, [paths.resolve(".output/dist/runner/index.js")], {
            env: { PATH: process.env["PATH"] ?? "/usr/bin:/bin" },
            timeout: 10000,
          }),
        )
        .rejects.toMatchObject({
          code: 1,
          stdout: "",
          stderr: "otterbot-review runner failed; no automatic retry will occur.\n",
        });
    },
  );

  vitest.it("cleans up after a provider failure without a second attempt", async () => {
    const { workspace, publish } = await setup();

    runProvider.mockRejectedValue(new Error("Provider connection lost"));
    await vitest
      .expect(runReview(".output/skill", workspace))
      .rejects.toThrow("Provider connection lost");
    vitest.expect(runProvider).toHaveBeenCalledTimes(1);
    vitest.expect(publish).not.toHaveBeenCalled();
    vitest.expect(await files.readdir(workspace)).toEqual([]);
  });

  vitest.it("rejects prose-only completion and cleans the workspace without retrying", async () => {
    const { workspace, publish } = await setup();

    runProvider.mockResolvedValue("Looks good");
    await vitest
      .expect(runReview(".output/skill", workspace))
      .rejects.toThrow("without submitting");
    vitest.expect(runProvider).toHaveBeenCalledTimes(1);
    vitest.expect(publish).not.toHaveBeenCalled();
    vitest.expect(await files.readdir(workspace)).toEqual([]);
  });

  vitest.it("rejects a tampered bundle before invoking a provider", async () => {
    const { workspace } = await setup();
    const root = paths.join(workspace, "skill");

    await files.cp(".output/skill", root, { recursive: true });
    await files.appendFile(paths.join(root, "SKILL.md"), "\nUntrusted replacement instructions");
    await vitest.expect(runReview(root, workspace)).rejects.toThrow("identity mismatch");
    vitest.expect(runProvider).not.toHaveBeenCalled();
  });
});

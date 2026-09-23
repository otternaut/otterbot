import * as files from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import * as vitest from "vitest";
import * as skillBundle from "~/runner/skill";

const directories: string[] = [];

async function bundle(): Promise<string> {
  const root = await files.mkdtemp(join(tmpdir(), "otterbot-bundle-test-"));

  directories.push(root);
  await files.writeFile(join(root, "SKILL.md"), "Example trusted skill");
  await files.writeFile(
    join(root, "manifest.json"),
    JSON.stringify({ hash: await skillBundle.bundleHash(root), policyRevision: "7" }),
  );
  return root;
}

vitest.afterEach(async () => {
  await Promise.all(
    directories.splice(0).map((root) => files.rm(root, { recursive: true, force: true })),
  );
});

vitest.describe("automatic bundle identity", () => {
  vitest.it(
    "derives identity from the packaged manifest without deployment configuration",
    async () => {
      const root = await bundle();

      vitest.expect(await skillBundle.readRelease(root)).toEqual({
        skillHash: await skillBundle.bundleHash(root),
        policyRevision: "7",
      });
    },
  );

  vitest.it("rejects modified skill contents", async () => {
    const root = await bundle();

    await files.writeFile(join(root, "SKILL.md"), "Changed instructions");
    await vitest.expect(skillBundle.readRelease(root)).rejects.toThrow("identity mismatch");
  });

  vitest.it("rejects malformed release metadata", async () => {
    const root = await bundle();

    await files.writeFile(
      join(root, "manifest.json"),
      JSON.stringify({ hash: "invalid", policyRevision: "not-a-revision" }),
    );
    await vitest.expect(skillBundle.readRelease(root)).rejects.toThrow();
  });
});

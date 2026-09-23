import * as files from "node:fs/promises";
import { resolve } from "node:path";
import * as vitest from "vitest";
import * as skillBundle from "~/runner/skill";

vitest.describe("repository skill bundle", () => {
  vitest.it(
    "ships every repository skill file byte-for-byte, including references and helpers",
    async () => {
      const source = resolve("../../skills/otterbot-review");
      const packaged = resolve(".output/skill");
      const expected = await skillBundle.bundleFiles(source);

      vitest.expect(expected).toContain("SKILL.md");
      vitest.expect(expected).toContain("references/readiness.md");
      vitest.expect(expected).toContain("scripts/decide");
      vitest.expect(expected).toContain("scripts/phrase");
      vitest.expect(await skillBundle.bundleFiles(packaged)).toEqual(expected);

      for (const path of expected) {
        vitest
          .expect(await files.readFile(resolve(packaged, path)))
          .toEqual(await files.readFile(resolve(source, path)));
      }

      vitest
        .expect((await skillBundle.readRelease(packaged)).skillHash)
        .toBe(await skillBundle.bundleHash(source));
    },
  );
});

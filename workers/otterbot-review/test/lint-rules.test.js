import { RuleTester } from "eslint";
import tseslint from "typescript-eslint";
import * as vitest from "vitest";
import { rules } from "../eslint-rules.config.js";

RuleTester.describe = vitest.describe;
RuleTester.it = vitest.it;
RuleTester.itOnly = vitest.it.only;

const tester = new RuleTester({ languageOptions: { parser: tseslint.parser } });
const filename = `${import.meta.dirname}/../src/runner/example.ts`;

tester.run("application imports", rules.imports, {
  valid: [
    {
      filename,
      code: 'import * as v from "valibot";\nimport { secret } from "~/contracts/config";',
    },
    { filename, code: 'import type * as contracts from "~/contracts/review";' },
    { filename, code: 'import { vi } from "vitest";\nimport * as vitest from "vitest";' },
    { filename, code: 'import { rules } from "../../eslint-rules.config.js";' },
    { filename, code: 'const worker = await import("~/index");' },
  ],
  invalid: [
    {
      filename,
      code: 'import { secret } from "../contracts/config";',
      errors: [{ messageId: "alias" }],
    },
    {
      filename,
      code: 'export { secret } from "../contracts/config";',
      errors: [{ messageId: "alias" }],
    },
    {
      filename,
      code: 'const config = await import("../contracts/config");',
      errors: [{ messageId: "alias" }],
    },
    {
      filename,
      code: 'type Config = import("../contracts/config").Config;',
      errors: [{ messageId: "alias" }],
    },
    {
      filename,
      code: 'import { parse, string } from "valibot";',
      errors: [{ messageId: "namespace" }],
    },
    {
      filename,
      code: 'import { secret } from "~/contracts/config";\nimport * as v from "valibot";',
      errors: [{ messageId: "order" }],
    },
    {
      filename,
      code: 'import * as v from "valibot";\n\nimport { secret } from "~/contracts/config";',
      errors: [{ messageId: "spacing" }],
    },
    {
      filename,
      code: 'const started = true;\nimport * as v from "valibot";',
      errors: [{ messageId: "order" }],
    },
  ],
});

const workerFile = `${import.meta.dirname}/../src/worker/handler.ts`;
const contractsFile = `${import.meta.dirname}/../src/contracts/review.ts`;

tester.run("runtime boundaries", rules.boundaries, {
  valid: [
    { filename: workerFile, code: 'import { getSandbox } from "@cloudflare/sandbox";' },
    { filename: workerFile, code: 'import type { Event } from "~/contracts/review";' },
    { filename, code: 'import { readFile } from "node:fs/promises";' },
    { filename: contractsFile, code: 'import * as v from "valibot";' },
    {
      filename: workerFile.replace(".ts", ".test.ts"),
      code: 'import { fixture } from "../../test/fixtures";',
    },
  ],
  invalid: [
    ...[
      'import { readFile } from "node:fs/promises";',
      'import { readFile } from "fs/promises";',
      'export * from "~/runner/runtime";',
      'const runner = await import("../runner/index");',
      'type Settings = import("~/runner/runtime").Settings;',
      'import { Codex } from "@openai/codex-sdk";',
    ].map((code) => ({ filename: workerFile, code, errors: [{ messageId: "runtime" }] })),
    { filename, code: 'import { createApp } from "~/app";', errors: [{ messageId: "runtime" }] },
    {
      filename: contractsFile,
      code: 'import type { Env } from "~/worker/env";',
      errors: [{ messageId: "runtime" }],
    },
    {
      filename: contractsFile,
      code: 'export * from "~/runner/tools";',
      errors: [{ messageId: "runtime" }],
    },
    {
      filename,
      code: 'import { fixture } from "../../test/fixtures";',
      errors: [{ messageId: "test" }],
    },
    { filename, code: 'import "~/runner/session.test.ts";', errors: [{ messageId: "test" }] },
  ],
});

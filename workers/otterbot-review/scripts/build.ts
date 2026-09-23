import { build } from "esbuild";
import * as files from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import * as skillBundle from "~/runner/skill";

/**
 * Build the runner and package this repository's skill together.
 *
 * The source remains untouched; output contains no deployment configuration.
 *
 * @returns Nothing after printing only the bundle manifest.
 * @throws Error for invalid arguments, unsafe files, or missing policy identity.
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  if (args.includes("--help")) {
    console.log("Usage: bun run build [--dry-run]");
    return;
  }

  if (args.some((arg) => arg !== "--dry-run")) {
    throw new Error("Unknown build option");
  }

  const root = fileURLToPath(new URL("../../../skills/otterbot-review/", import.meta.url));
  const skill = await files.readFile(resolve(root, "SKILL.md"), "utf8");
  if (!/^name: otterbot-review$/m.test(skill)) {
    throw new Error("Wrong skill");
  }

  const version = /^version:\s*(\S+)/m.exec(skill)?.[1];
  const readiness = await files.readFile(resolve(root, "references/readiness.md"), "utf8");
  const policyRevision = /current review policy revision is \*\*(\d+)\*\*/.exec(readiness)?.[1];
  if (!version || !policyRevision) {
    throw new Error("Missing skill identity");
  }

  const hash = await skillBundle.bundleHash(root);
  const manifest = {
    schema: 1,
    name: "otterbot-review",
    version,
    policyRevision,
    hash,
  };
  if (!args.includes("--dry-run")) {
    const out = fileURLToPath(new URL("../.output/skill/", import.meta.url));

    // Release directories are replaced only inside the application-owned output tree.
    await files.rm(out, { recursive: true, force: true });
    await files.mkdir(out, { recursive: true });
    await files.cp(root, out, { recursive: true, errorOnExist: false });
    await files.writeFile(resolve(out, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
  }

  await build({
    absWorkingDir: fileURLToPath(new URL("../", import.meta.url)),
    entryPoints: ["src/runner/index.ts", "src/runner/mcp.ts"],
    outdir: ".output/dist",
    outbase: "src",
    bundle: true,
    packages: "external",
    loader: { ".md": "text" },
    alias: { "~": fileURLToPath(new URL("../src", import.meta.url)) },
    platform: "node",
    target: "node24",
    format: "esm",
    write: !args.includes("--dry-run"),
  });
  console.log(JSON.stringify(manifest));
}

void main().catch(() => {
  console.error("Build failed. Check the repository skill and runner sources.");
  process.exitCode = 1;
});

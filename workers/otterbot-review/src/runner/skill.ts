import { fileURLToPath } from "node:url";
import * as files from "node:fs/promises";
import { createHash } from "node:crypto";
import * as paths from "node:path";
import * as v from "valibot";

/** Packaged skill beside dist/ in both the local build and the container image. */
export const skillDirectory = fileURLToPath(new URL("../../skill/", import.meta.url));

/**
 * Recursively list trusted bundle files in deterministic order.
 *
 * @param root - Bundle root.
 * @param directory - Current directory, defaulting to the root.
 * @returns Relative file paths, excluding the generated manifest.
 * @throws Error if symlinks or non-regular files are encountered.
 *
 * @example
 * ```ts
 * import { bundleFiles } from "~/runner/skill";
 * const files = await bundleFiles(".output/skill"); // Run after bun run build.
 * console.log(files.includes("SKILL.md"));
 * ```
 */
export async function bundleFiles(root: string, directory = root): Promise<string[]> {
  const result: string[] = [];

  for (const item of await files.readdir(directory, { withFileTypes: true })) {
    const path = paths.resolve(directory, item.name);
    if (item.isSymbolicLink()) {
      throw new Error("Skill symlinks are not allowed");
    }

    if (item.isDirectory()) {
      result.push(...(await bundleFiles(root, path)));
    } else if (item.isFile() && paths.relative(root, path) !== "manifest.json") {
      result.push(paths.relative(root, path));
    } else if (!item.isFile()) {
      throw new Error("Unexpected bundle entry");
    }
  }

  return result.sort();
}

/**
 * Hash complete trusted bundle contents including paths and sizes.
 *
 * @param root - Skill bundle directory.
 * @returns SHA-256 bundle identity.
 *
 * @example
 * ```ts
 * import { bundleHash } from "~/runner/skill";
 * const hash = await bundleHash(".output/skill"); // Run after bun run build.
 * console.log(hash.length); // 64
 * ```
 */
export async function bundleHash(root: string): Promise<string> {
  const hash = createHash("sha256");

  for (const file of await bundleFiles(root)) {
    const bytes = await files.readFile(paths.resolve(root, file));

    hash.update(`${file}\0${String(bytes.length)}\0`);
    hash.update(bytes);
  }

  return hash.digest("hex");
}

/**
 * Read a file only from the immutable packaged skill.
 *
 * @param path - Relative bundle path.
 * @returns UTF-8 skill instructions or script source.
 * @throws Error for traversal, missing files, or oversized entries.
 *
 * @example
 * ```ts
 * import { readSkill } from "~/runner/skill";
 * async function instructions() {
 *   return readSkill("SKILL.md"); // The container image supplies /app/skill.
 * }
 * ```
 */
export async function readSkill(path: string): Promise<string> {
  const root = paths.resolve(skillDirectory);
  const full = paths.resolve(root, path);
  if (!full.startsWith(`${root}/`) || path.split("/").includes("..")) {
    throw new Error("Invalid skill path");
  }

  if ((await files.stat(full)).size > 500000) {
    throw new Error("Skill file too large");
  }

  return files.readFile(full, "utf8");
}

/**
 * Load and verify the release identity shipped inside the container image.
 *
 * @param root - Packaged skill directory.
 * @returns Identity derived from the verified bundle, without deployment settings.
 * @throws Error when the manifest is malformed or bundle contents do not match.
 *
 * @example
 * ```ts
 * import { readRelease } from "~/runner/skill";
 * const release = await readRelease(".output/skill"); // Run after bun run build.
 * console.log(release.policyRevision);
 * ```
 */
export async function readRelease(root: string): Promise<{
  skillHash: string;
  policyRevision: string;
}> {
  const manifest = v.parse(
    v.object({
      hash: v.pipe(v.string(), v.regex(/^[a-f0-9]{64}$/)),
      policyRevision: v.pipe(v.string(), v.regex(/^\d+$/)),
    }),
    JSON.parse(await files.readFile(paths.resolve(root, "manifest.json"), "utf8")),
  );
  if ((await bundleHash(root)) !== manifest.hash) {
    throw new Error("Skill bundle identity mismatch");
  }

  return { skillHash: manifest.hash, policyRevision: manifest.policyRevision };
}

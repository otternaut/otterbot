import * as v from "valibot";

const binding = v.pipe(v.string(), v.regex(/^[A-Z][A-Z0-9_]{1,100}$/));
const login = v.pipe(v.string(), v.regex(/^[a-zA-Z0-9][a-zA-Z0-9-]{0,99}$/));
const repository = v.pipe(v.string(), v.regex(/^[a-zA-Z0-9_.-]{1,100}$/));

export const effortSchema = v.picklist(["low", "medium", "high", "xhigh", "max"]);
export const providerSchema = v.picklist(["claude", "codex", "cursor"]);
export const profileSchema = v.strictObject({
  provider: providerSchema,
  model: v.pipe(v.string(), v.minLength(1), v.maxLength(120)),
  effort: v.optional(effortSchema),
  apiKeySecret: binding,
  mode: v.optional(v.picklist(["shadow", "no-approve", "live"]), "shadow"),
  toolBudget: v.optional(
    v.pipe(v.number(), v.safeInteger(), v.minValue(20), v.maxValue(1000)),
    150,
  ),
});
export const organizationSchema = v.strictObject({
  owner: login,
  ownerId: v.pipe(v.number(), v.safeInteger(), v.gtValue(0)),
  reviewer: login,
  reviewerId: v.pipe(v.number(), v.safeInteger(), v.gtValue(0)),
  patSecret: binding,
  repositories: v.pipe(v.array(repository), v.minLength(1)),
  profile: v.pipe(v.string(), v.minLength(1)),
  repositoryProfiles: v.optional(v.record(repository, v.string()), {}),
});
export const hookSchema = v.strictObject({
  id: v.pipe(v.string(), v.regex(/^[a-z0-9-]{1,64}$/)),
  organization: login,
  secret: binding,
  previousSecret: v.optional(binding),
});
export const configSchema = v.strictObject({
  profiles: v.record(v.string(), profileSchema),
  organizations: v.pipe(v.array(organizationSchema), v.minLength(1), v.maxLength(100)),
  hooks: v.pipe(v.array(hookSchema), v.minLength(1), v.maxLength(100)),
  runSeconds: v.optional(
    v.pipe(v.number(), v.safeInteger(), v.minValue(60), v.maxValue(3600)),
    1800,
  ),
});
/** Validated deployment routes, provider profiles, and per-run execution limits. */
export type Config = v.InferOutput<typeof configSchema>;
/** Stable GitHub identities, repository allowlist, and secret binding for one organization. */
export type Organization = v.InferOutput<typeof organizationSchema>;
/** Explicit provider credentials, model, publication mode, and tool budget. */
export type Profile = v.InferOutput<typeof profileSchema>;
/** Webhook route and current or rotating signing-secret binding names. */
export type Hook = v.InferOutput<typeof hookSchema>;

/**
 * Parse deployment configuration and reject ambiguous identity routes.
 *
 * No default organization or provider is inferred.
 *
 * @param raw - Private JSON supplied through a Cloudflare environment binding.
 * @returns Validated configuration with canonical organization keys.
 * @throws Error when configuration or cross-references are invalid.
 * @example
 * ```ts
 * import { parseConfig } from "~/contracts/config";
 * const config = parseConfig(JSON.stringify({
 *   profiles: { primary: { provider: "codex", model: "example-model", apiKeySecret: "AI_KEY" } },
 *   organizations: [{ owner: "example-org", ownerId: 1, reviewer: "example-bot", reviewerId: 2,
 *     patSecret: "GH_PAT", repositories: ["example-repo"], profile: "primary" }],
 *   hooks: [{ id: "example", organization: "example-org", secret: "HOOK_SECRET" }],
 * }));
 * console.log(config.runSeconds); // 1800
 * ```
 */
export function parseConfig(raw: string): Config {
  const config = v.parse(configSchema, JSON.parse(raw));
  const owners = new Set<string>();
  const ids = new Set<number>();

  for (const org of config.organizations) {
    org.owner = org.owner.toLowerCase();
    if (owners.has(org.owner) || ids.has(org.ownerId)) {
      throw new Error("Duplicate organization");
    }

    owners.add(org.owner);
    ids.add(org.ownerId);

    for (const name of [org.profile, ...Object.values(org.repositoryProfiles)]) {
      if (!config.profiles[name]) {
        throw new Error("Unknown provider profile");
      }
    }
  }

  const hooks = new Set<string>();

  for (const hook of config.hooks) {
    hook.organization = hook.organization.toLowerCase();
    if (hooks.has(hook.id) || !owners.has(hook.organization)) {
      throw new Error("Invalid hook route");
    }

    hooks.add(hook.id);
  }

  return config;
}

/**
 * Resolve only an explicitly named secret binding.
 *
 * Error messages intentionally omit secret values.
 *
 * @param env - Runtime bindings; never serialized into job state.
 * @param name - Configuration-selected binding name.
 * @returns The nonempty secret value.
 * @throws Error when a required secret is absent.
 * @example
 * ```ts
 * import { secret } from "~/contracts/config";
 * const token = secret({ EXAMPLE_TOKEN: "example-only-token" }, "EXAMPLE_TOKEN");
 * ```
 */
export function secret(env: object, name: string): string {
  const value: unknown = Reflect.get(env, name);
  if (typeof value !== "string" || value.length < 8) {
    throw new Error(`Missing secret binding: ${name}`);
  }

  return value;
}

import * as v from "valibot";
import * as configuration from "~/contracts/config";
import type { ProviderInput } from "~/runner/providers";

const settingsSchema = v.strictObject({
  provider: configuration.providerSchema,
  apiKey: v.pipe(v.string(), v.minLength(1)),
  model: v.pipe(v.string(), v.minLength(1)),
  effort: v.optional(configuration.effortSchema),
  brokerUrl: v.pipe(v.string(), v.url()),
  brokerToken: v.pipe(v.string(), v.minLength(1)),
  deadline: v.pipe(v.number(), v.finite(), v.gtValue(0)),
});

/** Validated per-process provider settings and scoped broker access. */
export type Settings = v.InferOutput<typeof settingsSchema>;

/**
 * Read a required runner variable without echoing its value.
 *
 * @param name - Environment variable name.
 * @returns The configured value.
 * @throws Error if configuration is missing.
 *
 * @example
 * ```ts
 * import { required } from "~/runner/runtime";
 * function configuredModel(): string {
 *   return required("PROVIDER_MODEL"); // Throws when the launcher omitted the model.
 * }
 * ```
 */
export function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing runner variable: ${name}`);
  }

  return value;
}

/**
 * Parse provider settings once at the process boundary.
 *
 * @param broker - Parent-created broker access; subprocesses read their explicit environment.
 * @returns Validated provider, model, credentials, deadline, and broker settings.
 * @throws Error if a required setting is missing or invalid.
 *
 * @example
 * ```ts
 * import { readSettings } from "~/runner/runtime";
 * const settings = readSettings(); // Inside a configured MCP subprocess.
 * ```
 */
export function readSettings(broker?: Pick<Settings, "brokerUrl" | "brokerToken">): Settings {
  return v.parse(settingsSchema, {
    provider: required("PROVIDER"),
    apiKey: required("PROVIDER_API_KEY"),
    model: required("PROVIDER_MODEL"),
    ...(process.env["PROVIDER_EFFORT"] ? { effort: process.env["PROVIDER_EFFORT"] } : {}),
    deadline: Number(required("DEADLINE")),
    ...(broker ?? { brokerUrl: required("BROKER_URL"), brokerToken: required("BROKER_TOKEN") }),
  });
}

/**
 * Bind validated settings to one isolated provider invocation.
 *
 * @param settings - Settings already parsed at process startup.
 * @param cwd - Fresh private agent working directory.
 * @param prompt - Trusted instructions and explicitly delimited evidence.
 * @param role - Lead or independently restricted specialist role.
 * @returns Invocation containing only the explicit settings and work context.
 *
 * @example
 * ```ts
 * import * as runtime from "~/runner/runtime";
 * function lead(settings: runtime.Settings, directory: string) {
 *   return runtime.providerInput(settings, directory, "Review the scoped PR.", "lead");
 * }
 * ```
 */
export function providerInput(
  settings: Settings,
  cwd: string,
  prompt: string,
  role: "lead" | "specialist",
): ProviderInput {
  const { effort, ...requiredSettings } = settings;

  return { ...requiredSettings, ...(effort ? { effort } : {}), cwd, prompt, role };
}

/**
 * Invoke a scoped loopback tool and reject redirects to other hosts.
 *
 * @param operation - Structured tool operation.
 * @param settings - Validated broker access for this process.
 * @returns Parsed broker output.
 * @throws Error on HTTP rejection or timeout, without exposing response bodies.
 *
 * @example
 * ```ts
 * import * as runtime from "~/runner/runtime";
 * async function context(settings: runtime.Settings) {
 *   return runtime.callBroker({ operation: "context" }, settings);
 * }
 * ```
 */
export async function callBroker(
  operation: object,
  settings: Pick<Settings, "brokerUrl" | "brokerToken">,
): Promise<unknown> {
  const response = await fetch(new URL("/internal/tool", settings.brokerUrl), {
    method: "POST",
    redirect: "error",
    headers: {
      authorization: `Bearer ${settings.brokerToken}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(operation),
    signal: AbortSignal.timeout(120000),
  });
  if (!response.ok) {
    throw new Error(`Review tool rejected (${String(response.status)})`);
  }

  return response.json();
}

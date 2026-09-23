import type { Sandbox } from "@cloudflare/sandbox";

/** Cloudflare bindings. Organization and provider secrets are selected by config. */
export interface Env {
  CONFIG_JSON: string;
  SANDBOX: DurableObjectNamespace<Sandbox>;
  [key: string]: unknown;
}

import { parseArgs } from "node:util";
import { readFile } from "node:fs/promises";
import { Octokit } from "octokit";
import * as configuration from "~/contracts/config";

/**
 * Validate local bindings or a private deployment file and optionally check GitHub access.
 *
 * --online makes read-only GitHub requests and never invokes paid agents.
 *
 * @returns Nothing after reporting sanitized validation results.
 * @throws Error for invalid configuration, secret bindings, or PAT identities.
 */
async function main(): Promise<void> {
  const { values } = parseArgs({
    args: process.argv.slice(2),
    options: {
      config: { type: "string" },
      online: { type: "boolean", default: false },
      help: { type: "boolean", default: false },
    },
  });
  if (values.help) {
    console.log("Usage: bun run preflight [--config /private/config.json] [--online]");
    return;
  }

  const raw = values.config
    ? await readFile(values.config, "utf8")
    : configuration.secret(process.env, "CONFIG_JSON");
  const config = configuration.parseConfig(raw);

  for (const hook of config.hooks) {
    configuration.secret(process.env, hook.secret);
    if (hook.previousSecret) {
      configuration.secret(process.env, hook.previousSecret);
    }
  }

  for (const profile of Object.values(config.profiles)) {
    configuration.secret(process.env, profile.apiKeySecret);
  }

  for (const org of config.organizations) {
    const token = configuration.secret(process.env, org.patSecret);
    if (values.online) {
      const client = new Octokit({
        auth: token,
        retry: { enabled: false },
        throttle: { enabled: false },
      });
      const { data: user } = await client.rest.users.getAuthenticated();
      if (user.id !== org.reviewerId) {
        throw new Error("PAT identity mismatch");
      }

      for (const repo of org.repositories) {
        const { data } = await client.rest.repos.get({
          owner: org.owner,
          repo,
        });
        if (data.owner.id !== org.ownerId) {
          throw new Error("Repository owner mismatch");
        }
      }
    }
  }

  console.log(
    JSON.stringify({
      status: "configuration-valid",
      organizations: config.organizations.length,
      profiles: Object.keys(config.profiles).length,
      githubChecked: values.online,
      providerRunsChecked: false,
    }),
  );
}

void main().catch(() => {
  console.error(
    "Preflight failed. Check private configuration, credentials, and GitHub identity/access. No secret values were printed.",
  );
  process.exitCode = 1;
});

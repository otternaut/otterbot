# Deploying the Worker

Run commands from `workers/otterbot-review`. Keep deployment-specific files
outside the public repository. Use the Cloudflare account that owns the intended
DNS zone and supports Containers.

Complete [setup](setup.md) first to create your private configuration and credentials.
Use [local testing](local-testing.md) to validate them before deploying.

## 1. Build and verify

Install Bun, Node 24, and Docker, and start the Docker daemon. Authenticate
Wrangler to the intended account:

```sh
bun install --frozen-lockfile
bunx wrangler login
bun run check
bun run deploy:dry-run
```

`bun run deploy` and `bun run deploy:dry-run` automatically package the skill
and build the runner. There is no release hash to copy into configuration.
`bun run check` also compares the skill's decision helper against the host
policy.

The Docker image contains the complete skill bundle, its generated manifest, and
the pinned SDK installations. The runner verifies the bundle against that
manifest. Updating the skill only requires running the deployment command again.
Never copy private configuration or credentials into the Docker image.

## 2. Deploy code and set secrets

```sh
bun run deploy
bunx wrangler secret put CONFIG_JSON < /absolute/private/config.json
bunx wrangler secret put GH_PAT_EXAMPLE
bunx wrangler secret put WEBHOOK_SECRET_EXAMPLE
bunx wrangler secret put CLAUDE_API_KEY
```

Repeat secret creation for every binding named by the private configuration,
including additional PATs and provider profiles. Use Wrangler's interactive
prompt for token values so they do not appear in shell history. You can instead
use the Worker's **Settings → Variables and Secrets** page and select
**Secret**.

The first deployment creates the Worker, the Sandbox Durable Object binding, and
the container application. The initial Worker has no public route and cannot
accept webhook work until configuration and domain setup are complete. No R2,
D1, KV, Queue, Workflow, or scheduled trigger needs provisioning.

## 3. Attach the custom domain

In the Cloudflare dashboard, open the Worker and add a **Custom Domain** under
**Settings → Domains & Routes**, such as `reviews.example.com`. Cloudflare
manages DNS and TLS for the custom domain. Use the actual hostname from your
private deployment settings. See the official
[Custom Domains instructions](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/).

For configuration-as-code, add this to a private copy of the Wrangler
configuration and use `--config` consistently for deploy and secret commands:

```json
{
  "routes": [{ "pattern": "reviews.example.com", "custom_domain": true }]
}
```

This is a fragment, not a complete Wrangler configuration. When keeping the
complete copy outside the app, resolve `main` and the container `image` path
relative to that copy. The dashboard route is the simpler option for keeping the
real hostname out of this checkout. Keep `workers_dev` and `preview_urls` false.

Check `https://reviews.example.com/health`. Health checks confirm HTTP
availability only; they do not test secrets, container capacity, or providers.

## 4. Configure GitHub

Create an organization or repository webhook with:

- Payload URL: `https://reviews.example.com/webhooks/github/<hook-id>`.
- Content type: `application/json`.
- Secret: the value in that hook's configured webhook-secret binding.
- Events: **Pull requests**.
- SSL verification: enabled.

GitHub sends multiple pull request actions. The Worker handles only
`review_requested` for the configured user, an allowed repository, and an open,
non-draft PR. Team requests, pushes, and other actions do not start reviews.
Re-requesting a user review triggers another run.

A successful ping proves signature configuration. Start with `mode: shadow`,
request a review on a test PR, and inspect Worker/container logs for startup and
completion. Then change the selected profile to `live` or `no-approve` and
update `CONFIG_JSON`. Repeat the shadow check for each provider and PAT account
before routing production repositories to it.

## Operations and troubleshooting

Use Cloudflare's Worker and Container observability views. `bunx wrangler tail`
shows Worker intake and startup events; use container logs for runner completion
or failure. Application logs contain run IDs, status, review IDs, and shadow
counts, not review bodies, PATs, webhook payloads, or raw provider errors. Check
platform log retention separately; the app creates no log database.

| Symptom                      | Check                                                                                         |
| ---------------------------- | --------------------------------------------------------------------------------------------- |
| `401 invalid-signature`      | Hook route, binding name, and exact GitHub secret.                                            |
| `200 ignored`                | Action, reviewer ID, allowed repository, open/draft state.                                    |
| `400 invalid-payload`        | GitHub event shape and matching base repository IDs.                                          |
| `503 launch-failed`          | Private config and required secret bindings.                                                  |
| `202` with no review         | Startup/container logs, PAT identity, provider access, tool limit, deadline, and shadow mode. |
| Build requires Docker        | Start Docker; Worker-only dry runs cannot validate the image.                                 |
| Container capacity exhausted | `max_instances` and Cloudflare account limits; there is no waiting queue.                     |

Failures are final for that run. Inspect the PR before manually requesting a new
review because a timed-out write might already have succeeded. The app provides
no replay command or automatic redelivery. To stop intake, disable the GitHub
webhook. Existing runs continue until completion or their deadline; terminate
containers through Cloudflare if necessary.

Containers sleep after `runSeconds + 60` seconds of inactivity. This leaves time
for the bounded runner to finish but can keep idle containers allocated after a
short review. The setting deliberately avoids a persistent cleanup service.

For rollback, redeploy the previous code and skill bundle. Restore the private
routing configuration only if that deployment requires different routes.

## Updating the review skill

The build always reads `skills/otterbot-review` from this repository. It never uses a globally
installed copy or an external source flag. Rebuild and redeploy after changing the skill; an existing
container image keeps its previously packaged version. The build prints the skill version, policy
revision, and content hash. The runner verifies that hash before invoking a provider.

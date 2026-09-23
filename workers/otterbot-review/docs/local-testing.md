# Testing locally

Run commands from `workers/otterbot-review`. Choose the level you need:

| Level                  | What it proves                                                             | Requirements                                               |
| ---------------------- | -------------------------------------------------------------------------- | ---------------------------------------------------------- |
| Automated suite        | Routing, signatures, policy, skill packaging, compiled runner/MCP behavior | Bun and Node; no tokens or Docker                          |
| Local signed ping      | Wrangler can serve HTTP, read config, and verify your webhook secret       | Docker running and local bindings; no provider invocation  |
| Local shadow review    | Local container, GitHub PAT, and chosen provider work together             | Docker, real GitHub/provider credentials, eligible test PR |
| Deployed shadow review | Cloudflare routing, secrets, capacity, and deployed image work together    | Deployed Worker and GitHub webhook                         |

A local review still contacts real GitHub and provider APIs. `shadow` prevents
GitHub review writes, but it does not make provider usage free or offline.

## 1. Run the credential-free checks

```sh
bun install --frozen-lockfile
bun run check
```

`check` includes the build; no second build is needed. It packages this checkout's
review skill, checks types and lint, runs all tests, and checks formatting.
For targeted development:

```sh
bun run build
bun run test:watch
# Or run a single suite against the built artifacts:
bunx vitest run src/app.test.ts
```

Rebuild before watch/targeted tests after changing runner sources or the skill;
some tests execute compiled files in `.output/`. The full `bun run test` command
always rebuilds first. SDK execution and GitHub responses are mocked in the suite;
passing tests do not establish live account access.

## 2. Configure local bindings

For a first-time setup, copy the fictional template:

```sh
cp .dev.vars.example .dev.vars
chmod 600 .dev.vars
```

Do not repeat the copy over an existing local configuration. `.dev.vars` is
ignored by Git. The template's fictional configuration is enough for a signed
ping; its placeholder credentials cannot run a real review.

For real account testing, first create the private JSON described in
[setup](setup.md). The following replaces only `CONFIG_JSON` in `.dev.vars`,
preserving its other lines, without printing your routing information:

```sh
bun - /absolute/private/config.json <<'JS'
const config = JSON.parse(await Bun.file(process.argv[2]).text());
const file = Bun.file('.dev.vars');
const lines = (await file.text()).split('\n');
const json = JSON.stringify(config).replaceAll("'", "\\u0027");
const value = `CONFIG_JSON='${json}'`;
await Bun.write(file, lines.map((line) => line.startsWith('CONFIG_JSON=') ? value : line).join('\n'));
JS
```

Edit `.dev.vars` in your editor. Add a line for **every** `patSecret`,
`apiKeySecret`, and webhook `secret` binding named by your private config. Remove
unused placeholder lines. For example, a Claude profile using `CLAUDE_API_KEY`
needs that exact name, not `PROVIDER_KEY_EXAMPLE`. Keep every profile in shadow
mode for local review testing. `CONFIG_JSON` must remain a single-line value.

Wrangler and `bun run preflight` both load `.dev.vars`. Preflight validates its
`CONFIG_JSON` binding and required secrets:

```sh
bun run preflight
bun run preflight --online
```

Both commands now validate/use the same local `CONFIG_JSON` value. Rerun the copy
step whenever the private JSON changes and restart the dev server after changing
local bindings. To check a separate deployment file deliberately, use
`bun run preflight --config /absolute/private/config.json`; this explicit override
does not update the Worker configuration.
See Cloudflare's [local secrets documentation](https://developers.cloudflare.com/workers/local-development/environment-variables/)
for file loading behavior. These values are separate from deployed secrets.

## 3. Start the Worker and local container runtime

Start Docker Desktop or your Docker daemon, then:

```sh
docker info
bun run dev --ip 127.0.0.1 --port 8787
```

`bun run dev` first builds the runner and packages the skill automatically.
Keep this terminal running. Wrangler builds the configured Docker image and
runs the Worker with its local Sandbox binding. The first image build can take
several minutes. Restart `bun run dev` after changing the runner or skill: those
files are copied into the image, not hot-reloaded like Worker source.
See Cloudflare's [local Containers guide](https://developers.cloudflare.com/containers/guides/local-dev/).

In a second terminal, from the same application folder:

```sh
curl -i http://127.0.0.1:8787/health
```

Expect HTTP `200` and `{"service":"otterbot-review","status":"ok"}`.
Health does not validate secrets, start a review, or test a provider.

## 4. Send a signed ping

The command selects the only configured hook automatically. With multiple hooks,
pass `--hook` explicitly. It signs the exact bytes sent and makes one request:

```sh
bun run webhook:ping
# Select a specific hook or a different local port:
bun run webhook:ping --hook example --url http://127.0.0.1:8787
```

Expect `{"status":"pong","httpStatus":200}`. The command exits nonzero for an
unknown/ambiguous hook, missing credentials, timeout, redirect, or non-pong response.
It prints no raw server errors or secrets. `--url` must be an HTTP(S) origin without
a path, query, or credentials. Use `--help` for usage. A deployed origin can also be
checked when the local signing secret matches that deployment.

No container review or provider call is launched.
An unsigned request should fail authentication:

```sh
curl -i -X POST http://127.0.0.1:8787/webhooks/github/example \
  -H 'content-type: application/json' -H 'x-github-event: ping' --data '{}'
```

Replace `example` with your actual hook ID. Expect `401 invalid-signature`.

## 5. Run one real shadow review (optional)

Use real bindings, a profile in `shadow` mode, and an open, non-draft PR in an
allowed test repository. Request the configured user's review on GitHub first.
Use a PR authored by another account if you intend to test eventual approvals.
The PAT must belong to the requested reviewer.

Obtain a `pull_request` / `review_requested` payload from GitHub's webhook
**Recent deliveries** view and save its JSON outside the repository as
`/absolute/private/review-requested.json`. Use a test webhook that is not already
running production reviews for the same event. The local client below computes
a fresh signature using your local secret; do not reuse a copied signature
with reformatted JSON.

Replace the path and hook ID in this command:

```sh
bun --env-file=.dev.vars - /absolute/private/review-requested.json example <<'JS'
import { createHmac } from 'node:crypto';
const config = JSON.parse(process.env.CONFIG_JSON);
const hook = config.hooks.find((item) => item.id === process.argv[3]);
if (!hook) throw new Error('Unknown hook');
const org = config.organizations.find((item) => item.owner.toLowerCase() === hook.organization.toLowerCase());
const profileNames = [org.profile, ...Object.values(org.repositoryProfiles ?? {})];
if (profileNames.some((name) => (config.profiles[name].mode ?? 'shadow') !== 'shadow')) {
  throw new Error('Use shadow mode for this local test');
}
const secret = process.env[hook.secret];
if (!secret) throw new Error('Missing webhook secret');
const body = await Bun.file(process.argv[2]).text();
const signature = createHmac('sha256', secret).update(body).digest('hex');
const response = await fetch(`http://127.0.0.1:8787/webhooks/github/${hook.id}`, {
  method: 'POST',
  headers: {
    'content-type': 'application/json',
    'x-github-event': 'pull_request',
    'x-hub-signature-256': `sha256=${signature}`,
  },
  body,
});
console.log(response.status, await response.text());
JS
```

Expect `202` with `status: "accepted"` and a run ID. Watch the Wrangler terminal
for startup and use `docker ps` followed by `docker logs <container-id>` to
inspect the local Sandbox container. A `202` alone is not proof of completion;
confirm the runner's shadow completion summary. No GitHub review should be created.
Shadow mode does not save the generated review as an artifact.

If local platform logs do not expose the runner output, use the
[deployed shadow workflow](deployment.md#4-configure-github) and Cloudflare's
container logs to validate completion. Do not treat the ping or mocked tests as
a substitute for a completed provider run.

GitHub cannot deliver directly to `127.0.0.1`; the signed replay above needs no
public tunnel. For a real GitHub-to-Worker delivery, use the deployed test route.
There are no retries or deduplication: sending the payload again starts another
run. Check the previous result before deliberately replaying it.

## Validate each provider before production

Repeat the shadow workflow once for each configured provider: Claude, Codex, and
Cursor. Choose the matching organization/profile and eligible test PR, restart
`bun run dev` after local configuration changes, and send one explicit review
request. Require a completed `review-shadow-complete` result for each provider;
a ping, `202`, or mocked SDK test does not count. Confirm no GitHub review was
published. Keep validation notes private (provider, model, date, run ID, outcome),
without storing tokens or repository contents in this public checkout.

These are manual live acceptance checks, not part of `bun run check`. They require
Docker or an existing deployed test Worker, real provider keys/PATs, and accessible
PRs with the configured reviewer requested.

## Troubleshooting and stopping

| Symptom                                 | Next step                                                                                         |
| --------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Missing Bun/Node or unsupported runtime | Match `package.json`; use Node 24.15.x.                                                           |
| Missing `.output/dist` or skill files   | Run `bun run build` from the application folder with the full checkout present.                   |
| Docker connection/build failure         | Start Docker and verify `docker info`; container testing requires it.                             |
| `404`                                   | Check `/webhooks/github/<hook-id>` and the hook configured in `.dev.vars`.                        |
| `401`                                   | Match the secret binding and sign the exact body bytes.                                           |
| `400 invalid-payload`                   | Use the full pull request webhook payload, not the GitHub PR REST response.                       |
| `200 ignored`                           | Check action, requested reviewer ID, organization identity, allowlist, and open/non-draft status. |
| `503 launch-failed`                     | Check local config, secret names, and Docker/Sandbox startup logs.                                |
| `202`, then failure                     | Check PAT identity/access, provider key/model/effort, tool budget, and deadline.                  |
| No GitHub review after successful run   | This is expected in shadow mode.                                                                  |

Stop Wrangler with Ctrl-C. If a review container remains running, identify that
specific container with `docker ps` and stop it with `docker stop <container-id>`.
No review state is resumed on restart. Keep local secrets and saved webhook
payloads private; do not attach them to public issues.

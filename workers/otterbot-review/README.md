# otterbot-review

A standalone TypeScript/Hono application that starts an `otterbot-review` skill run
when GitHub requests a review from a configured user. A new review request
starts a new run, even when the pull request's head commit has not changed.

Hono handles the Worker's health and webhook routes. The Worker authenticates the webhook and selects the organization's PAT and
provider profile. A Cloudflare Sandbox runs the Claude, Codex, or Cursor SDK and
submits one grouped GitHub review under that PAT's account.

There is no application database, queue, artifact bucket, scheduled recovery, or
review retry. Each run's state exists only in process memory. The Sandbox SDK
requires a Cloudflare Durable Object binding to manage its container; this is
platform infrastructure, not an application job store. SDKs also use temporary
files inside the ephemeral container.

## Get started

Requirements: Bun 1.4.2, Node 24.15+, Docker for the container build, and a
Cloudflare account with Workers and Containers enabled. The runner image pins
Node 24.15.0. Use the versions in `package.json` and `Dockerfile` when
reproducing builds.

From this directory:

```sh
bun install --frozen-lockfile
bun run check
```

`bun run test` builds the runner and repository skill before running unit and integration tests. This app does not change how the repository installs portable
skills.

Start with [setup](docs/setup.md) for account selection, PATs, provider profiles, and secrets.
Use [local testing](docs/local-testing.md) for automated tests, a signed ping, and a real shadow review.
Follow [deployment](docs/deployment.md) to configure Cloudflare, credentials,
the custom domain, and GitHub webhooks. See
[configuration](docs/configuration.md) for organization and provider routing and
[architecture](docs/architecture.md) for execution and failure behavior.

## Development

```sh
bun run dev             # Build runner/skill, then start local Wrangler (requires Docker)
bun run preflight       # Validate local CONFIG_JSON and secrets from .dev.vars
bun run webhook:ping    # Send a signed ping; does not start a review
bun run format          # Apply the shared formatting rules
bun run format:check    # Check formatting without editing files
bun run typecheck       # Strict TypeScript checks
bun run lint            # Code quality and function documentation
bun run test            # Routing, signatures, publication, providers, policy
bun run check           # All of the above checks
bun run build          # Package the skill and build the runner
bun run deploy:dry-run  # Validate deployment and container build; requires Docker
```

For a Worker-only bundle check when Docker is unavailable:

```sh
bunx wrangler deploy --dry-run --containers-rollout=none --outdir .output/worker
```

That check does **not** validate the container image or execute a provider SDK.
Tests mock GitHub/provider boundaries and require no API credentials. Before
live use, run a shadow review in a test repository with the deployed container
and selected provider. Shadow mode logs only the result summary; it does not
store a review artifact.

## Source layout

```text
src/
  app.ts               Hono routes, middleware, and sanitized error boundary
  index.ts             Cloudflare entry point and container launch
  worker/              Webhook authentication, routing, Cloudflare bindings
  runner/              Node runner, scoped GitHub tools, provider adapters
  contracts/           Configuration schemas and review contracts
scripts/               Skill packaging, build, credential preflight
test/                  System checks and shared fictional fixtures
src/**/*.test.ts       Unit tests beside their source modules
docs/                  Setup, architecture, and development conventions
```

The Worker imports no provider SDK. The Node runner uses the shared schemas but
never imports the Worker entry point. Build output, local credentials, and
private deployment files are ignored. Keep real account mappings, domain
configuration, and planning documents outside this public checkout.

## Repository skill provenance

The single build command always packages [`../../skills/otterbot-review`](../../skills/otterbot-review).
It resolves this path from the build script, not the working directory, and has no alternate-source
option. It never reads a globally installed skill. Docker copies the complete bundle into `/app/skill`.
Changing the repository skill takes effect after rebuilding and redeploying the application.

Before starting an agent, the runner verifies the bundle hash and includes the complete `SKILL.md`
in the provider prompt. The `read_skill` tool serves the same bundle's references, and `decide` and
`phrase` execute its Bash helpers. Tool arguments have one shared Valibot schema contract.

Automated checks compare every packaged file byte-for-byte with the repository, exercise the
compiled MCP process against the real references/helpers, and verify the provider invocation for
Claude, Codex, and Cursor with mocked SDK execution. They do not prove live provider compliance;
a deployed shadow review is still required for that boundary. The host limitations below remain
explicit even though it loads the real skill.

## Operating limits

- `202 Accepted` means startup was scheduled, not that the review succeeded.
  Container startup is bounded background work; the long review runs in the
  container, independently of the webhook response.
- Failed runs are not retried. A lost GitHub response is treated as an unknown
  publication outcome; the application will not submit that review again.
- There is no delivery deduplication. Manually redelivering a webhook, replaying
  a valid signed payload, or overlapping review requests can produce separate
  runs and duplicate reviews. Check GitHub before intentionally requesting
  another run.
- The runner reads repository files through GitHub. It does not check out the
  PR, execute its tests, or run its scripts. Reviews must disclose this
  limitation.
- Re-reviews inspect earlier automation history, but do not dismiss earlier
  reviews, resolve threads, or edit human reviews. A maintainer handles old
  blocking reviews where necessary.
- There are no daily spending limits or global coordination. `runSeconds`, each
  profile's `toolBudget`, and Cloudflare's `max_instances` bound individual runs
  and container capacity. Idle containers can occupy capacity until they sleep.

The implementation makes no application-level retry attempts. Octokit retries
and Cursor agent retries are explicitly disabled. Third-party SDKs and the
Cloudflare platform can have their own internal transport behavior; this app
does not claim control over every network request they issue.

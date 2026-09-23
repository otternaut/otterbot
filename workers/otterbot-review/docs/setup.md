# Setup: from a fresh checkout to a configured reviewer

Run every command below from `workers/otterbot-review` unless stated otherwise.
Start with one organization, one test repository, and one provider in `shadow` mode.
Add more routes after that path works.

## 1. Install and verify the application

You need Bun 1.4.2 and Node 24.15.x. Docker is required to run or build the review
container, but not for the automated test suite. For deployment, you also need a
Cloudflare account with Containers available and access to your domain's DNS zone.
GitHub CLI (`gh`) is optional; the identity lookup examples below use it.

From the repository root:

```sh
cd workers/otterbot-review
bun install --frozen-lockfile
bun run check
```

A successful check includes compilation, lint, tests, and formatting. Tests use
mocked external services, so you do not need tokens or Cloudflare login for this step.
Keep the full repository checkout: the build reads `../../skills/otterbot-review`.
Copying only this application folder leaves the required skill unavailable.

## 2. Choose the GitHub account and repository

The configured reviewer is the GitHub **user whose review is requested**. The PAT
must belong to that user. The PR's author and webhook installer can be different users.
The reviewer needs access to each allowed repository.

Use GitHub CLI to look up stable IDs (substitute your own names):

```sh
gh auth status
gh api users/example-reviewer --jq '{login, id}'
gh api repos/example-org/example-repo --jq '{name, repositoryId: .id, owner: .owner.login, ownerId: .owner.id}'
```

Copy the user's `id` into `reviewerId` and the repository owner's `ownerId` into
`ownerId`. `repositories` contains repository names without the owner prefix.
The repository ID is useful for testing webhooks but is not a configuration field.
The CLI's signed-in account is only used for these lookups; the application uses
its configured PAT, not the CLI login.

Create a PAT under the reviewer account with access to the selected repositories.
See [credential permissions](configuration.md#credentials-and-local-validation).
Keep the PAT outside source files and command arguments.

## 3. Create the private routing configuration

Create `/absolute/private/config.json` outside this checkout. Start with the JSON
in [configuration](configuration.md), then:

1. Keep only the provider profiles you will use. Choose a model available to your
   provider API account; an editor subscription alone does not configure an API key.
2. Keep `mode: "shadow"` while testing. It runs the provider and validates a review
   without publishing it. Provider usage can still incur charges.
3. Replace `owner`, `ownerId`, `reviewer`, and `reviewerId` with your GitHub identities.
4. Set `repositories` to a nonempty list of allowed repository names.
5. Point `profile` at a key under `profiles`; remove unused `repositoryProfiles`.
6. Choose a hook ID such as `example` and set its `organization` to the same owner.

These references connect the configuration to credentials:

| Field                    | Example                  | What the named secret contains                   |
| ------------------------ | ------------------------ | ------------------------------------------------ |
| Organization `patSecret` | `GH_PAT_EXAMPLE`         | PAT owned by the configured reviewer             |
| Profile `apiKeySecret`   | `CLAUDE_API_KEY`         | API credential for that provider                 |
| Hook `secret`            | `WEBHOOK_SECRET_EXAMPLE` | Random webhook signing secret shared with GitHub |

The field values are **binding names**, not tokens. Names must match exactly in
local variables and deployed Cloudflare secrets. Generate a webhook signing
secret locally, for example with `openssl rand -hex 32`, and save it privately.
It is independent of both the GitHub PAT and the provider key.

For multiple GitHub accounts, create a PAT binding for each account and reference
it from the appropriate organizations. Several organization routes may reference
the same binding when that PAT has access to all their repositories. Separate
organization-scoped tokens are also supported. Profiles route to providers
independently of PAT selection; changing a model does not change the reviewer.

## 4. Configure local secrets and validate

Follow [local testing](local-testing.md#2-configure-local-bindings) to create
`.dev.vars`, load your private configuration, and populate its named secrets.
Run the offline preflight first, then the optional read-only GitHub check:

```sh
bun run preflight
bun run preflight --online
```

Success prints `status: "configuration-valid"`. The online check additionally
reports `githubChecked: true`; neither check runs a provider or submits reviews.
It verifies the PAT identity and repository access, not every GitHub write permission.
Local `.dev.vars` values are not uploaded when you deploy.

## 5. Test locally, then deploy

Use [local testing](local-testing.md) for a signed ping and an optional real shadow
review. Then follow [deployment](deployment.md) to deploy the container, upload
secrets, attach the custom domain, and create the GitHub webhook.

The webhook subscribes to **Pull requests** and points to
`https://reviews.example.com/webhooks/github/<hook-id>`. Request the configured
user's review on an open, non-draft PR in an allowed repository. A successful
`202` means startup was scheduled; use the runner logs to confirm completion.

After a successful shadow review, change the selected profile's mode to `live`
or `no-approve` in the private configuration and upload `CONFIG_JSON` again.
Repeat validation for each additional provider and GitHub account. See
[operating limits](../README.md#operating-limits) for fire-and-forget behavior.

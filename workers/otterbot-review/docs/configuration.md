# Configuration

For a first deployment, follow [setup](setup.md); for runnable examples, see
[local testing](local-testing.md). This page is the configuration reference.

Store `CONFIG_JSON` as a Cloudflare secret. It contains routing metadata and
secret **binding names**, never token values. Put the real configuration in a
private file outside this repository. The examples below use fictional accounts.

```json
{
  "runSeconds": 1800,
  "profiles": {
    "default": {
      "provider": "claude",
      "model": "opus",
      "effort": "medium",
      "apiKeySecret": "CLAUDE_API_KEY",
      "mode": "shadow",
      "toolBudget": 150
    },
    "alternate": {
      "provider": "codex",
      "model": "gpt-5.6-sol",
      "effort": "low",
      "apiKeySecret": "CODEX_API_KEY",
      "mode": "shadow"
    },
    "editor": {
      "provider": "cursor",
      "model": "gpt-5.6-sol",
      "effort": "low",
      "apiKeySecret": "CURSOR_API_KEY",
      "mode": "shadow"
    }
  },
  "organizations": [
    {
      "owner": "example-org",
      "ownerId": 100,
      "reviewer": "example-reviewer",
      "reviewerId": 200,
      "patSecret": "GH_PAT_EXAMPLE",
      "repositories": ["example-repo", "another-repo"],
      "profile": "default",
      "repositoryProfiles": {
        "another-repo": "alternate"
      }
    }
  ],
  "hooks": [
    {
      "id": "example",
      "organization": "example-org",
      "secret": "WEBHOOK_SECRET_EXAMPLE"
    }
  ]
}
```

Replace all placeholders and numeric IDs. Model IDs are explicit: select one
available to the corresponding API account. The build packages the skill and its
manifest together, so there is no release hash or policy revision to maintain in
configuration. Remove unused profiles so you do not need to configure unused
provider keys.

## Routing

Add one organization entry per owner. Organizations can use the same reviewer
while naming different PAT bindings, or reference the same binding when its PAT
has access to every listed repository. There is no fallback PAT. Routing requires
the base repository's owner ID and login, an allowed repository name, and the
requested reviewer's numeric ID. Fork owners and webhook senders cannot select
credentials. The PAT's authenticated numeric user ID is verified at run start.

`profile` selects the organization's default provider, model, and effort.
`repositoryProfiles` optionally overrides that choice for specific repositories.
Owner and repository matching is case-insensitive. All referenced profiles must
exist.

Each hook ID maps to exactly one organization and its signature secret.
Configure its webhook URL as:

```text
https://reviews.example.com/webhooks/github/example
```

The same Worker and custom domain can serve every configured organization. Use a
different hook ID and secret for each organization. Repository-level webhooks
can also use the corresponding organization's route.

## Settings

| Setting            | Meaning                                                                               |
| ------------------ | ------------------------------------------------------------------------------------- |
| `runSeconds`       | Shared run deadline, 60–3600 seconds; defaults to 1800.                               |
| `mode: shadow`     | Validate the review and log a summary, with no GitHub writes; the default.            |
| `mode: no-approve` | Publish findings but suppress an otherwise passing approval.                          |
| `mode: live`       | Publish the verdict allowed by the skill's policy.                                    |
| `toolBudget`       | Maximum combined tool requests across lead and specialists, 20–1000; defaults to 150. |
| `previousSecret`   | Optional old webhook-secret binding accepted during rotation.                         |

Configuration rejects unknown properties so typos do not silently change
behavior. There are no retry, queue, database, retention, or recovery settings.
If migrating an earlier configuration, remove `revision`, `publicUrl`, and
`release`; domain setup belongs only in Cloudflare, and bundle identity is now
automatic.

## Changing models and effort

Edit a named entry under `profiles` in your private `CONFIG_JSON`, or change an organization's
`profile` to select a different provider. Shared profiles update every organization referencing them.
PAT bindings can be shared by organizations using the same reviewer account and an appropriately
scoped token, or kept separate per organization. Provider profile selection does not change PAT identity.
`effort` accepts `low`, `medium`, `high`, `xhigh`, or `max`; omit it to retain the provider default.
A model must support the selected effort. Lead reviews and delegated specialists inherit the same
model/effort settings. The tool-call budget is separate from model reasoning effort.

- Codex passes `model` and `effort` to `model` and `modelReasoningEffort` in the SDK thread options.
  [GPT-5.6 Sol](https://developers.openai.com/api/docs/models/gpt-5.6-sol) supports `low` effort.
- Claude passes `model` and `effort` directly to its SDK options. The
  [`opus` alias](https://code.claude.com/docs/en/model-config) follows the provider's recommended
  Opus version; use an exact model ID to pin it instead.
- Cursor uses its authenticated model catalog to resolve the configured ID or alias and the
  model's advertised effort parameter. It refuses missing models, ambiguous effort parameters,
  or unsupported effort values without substituting another model. IDs/parameters vary by account;
  inspect [`Cursor.models.list()`](https://cursor.com/docs/sdk/typescript) with the configured API key
  and change `model` to its advertised ID if needed. This is a read-only catalog request before
  agent creation, not a retry or fallback.

After completing the repository allowlists and stable GitHub IDs, upload the private configuration:

```sh
bunx wrangler secret put CONFIG_JSON < /absolute/private/config.json
```

Each new webhook reads the deployed configuration. No source changes are needed for model/profile
updates. Keep tokens in their separate secret bindings. Local tests verify option forwarding;
account access and actual model availability still require deployment validation.

## Credentials and local validation

Configure PATs and provider keys as secret bindings in the Cloudflare dashboard
or with `wrangler secret put`. PATs need access to the allowed repositories,
repository content and PR metadata, and permission to submit pull request
reviews. Fine-grained PATs generally need Contents read and Pull requests write;
organization policies, token approval, and SSO authorization also apply. Verify
these against the
[GitHub review API](https://docs.github.com/en/rest/pulls/reviews).

A reviewer cannot approve their own pull request. The transport uses a comment
for self-review, and validation blocks a passing approval for that case.

For local use, copy `.dev.vars.example` to `.dev.vars` and fill it privately.
Wrangler and `bun run preflight` load `.dev.vars`; both use its `CONFIG_JSON`
binding. This file does not belong in Git.

```sh
bun run preflight
bun run preflight --online
```

To validate a separate deployment file, pass `--config /absolute/private/config.json`
explicitly. This overrides only the preflight input; it does not modify `.dev.vars`.

The offline command validates routing and required secret bindings. The online
option additionally verifies PAT identity and repository owner IDs through
read-only GitHub calls. It does not test paid provider access or publish
reviews. Errors intentionally omit credential values and raw API responses.

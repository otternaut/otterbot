# Development conventions

[AGENTS.md](../AGENTS.md) defines the application's coding contract. These conventions apply to the
isolated application; the repository's portable skills retain their own Markdown/Bash conventions.

## Formatting and checks

Prettier owns formatting; ESLint owns code quality, documentation, import conventions, and logical
spacing. This follows [Prettier's integration guidance](https://prettier.io/docs/integrating-with-linters).
The formatter uses double quotes, semicolons, trailing commas, two-space indentation, parenthesized
arrow parameters, and a 100-column target. EditorConfig sets UTF-8, LF, and final newlines. Preserve
intentional Markdown line breaks; Prettier's default prose wrapping leaves authored wrapping intact.

```sh
bun install --frozen-lockfile
bun run format
bun run lint:fix
bun run check
```

`check` runs both TypeScript configurations, type-aware ESLint, the build, the complete test suite,
and the formatter check. `scripts/build.ts` is the single owner of runner compilation and repository
skill packaging; `bun run build --dry-run` validates both without writing output. The lockfile, generated skill bundle, build output, and local secrets are ignored by
the formatter. The app uses the strict and stylistic type-checked
[typescript-eslint presets](https://typescript-eslint.io/users/configs/), with narrow test-only
exceptions documented in AGENTS.md. Prettier does not replace blank lines between logical steps.

## Runtime boundaries and imports

`src/app.ts` exports `createApp`, following Hono's importable app-composition pattern. The Worker
entry point injects the launcher and exports the Hono app. HTTP tests use `app.request`/`app.fetch`
without opening a network listener. Runtime tests verify that the real launcher still schedules
startup through `waitUntil`. Keep authentication on raw bytes before any JSON parsing. Hono handles
routing, no-store headers, and sanitized errors; `worker/handler.ts` owns webhook authentication
and dispatch, and Valibot owns input validation.

Source folders reflect execution ownership: `worker/` handles HTTP, `runner/` owns Node execution,
and `contracts/` owns runtime-independent contracts. Keep that small structure; add no speculative
service/controller/repository hierarchy. Source-specific tests live beside the code they cover.
The root `test/` folder holds cross-cutting checks and fictional fixture factories.
ESLint rejects cross-runtime dependencies, Node/provider imports from Worker or contracts modules,
and production imports of tests or fixtures. Tests can cross boundaries to exercise integrations.

`runner/skill.ts` owns bundle verification and reads. `runner/runtime.ts` reads settings once per
process; pass that typed object to provider and tool calls instead of rereading environment variables.
The build embeds `runner/instructions.md` as trusted host instructions alongside the separately
packaged repository skill. Change review policy in the skill, not in the host instructions.

Use `~/` for application imports. TypeScript, Vitest, Wrangler, and esbuild resolve it to `src/`.
Keep imports in one continuous block: libraries, contracts/root application code, runtime modules,
then test/tooling files. Use namespace imports for multiple exports, including types:

```ts
import * as v from "valibot";
import * as configuration from "~/contracts/config";
import * as security from "~/worker/security";

const settings = configuration.parseConfig(rawConfiguration);
```

The sample assumes `rawConfiguration` is the deployment's private JSON string. Do not embed real
configuration in examples. Named `vi` imports remain necessary for Vitest's static mock hoisting;
the rest of a test's Vitest imports use the namespace convention.

`tsconfig.json` checks the Worker against Cloudflare declarations. `tsconfig.runner.json` uses Node
24 declarations for the runner, tooling, and system tests. Both share strict options and aliases.
Separating the runtime globals prevents Cloudflare's compatibility declarations from weakening Node
checks, particularly `Buffer`. The Node version follows the container, even when local Bun or Node
is newer. Build scripts preserve external native SDK packages while bundling application aliases.

## Documentation and validation

Document functions, methods, classes, and exported contracts with TSDoc. Include meaningful
`@param`, `@returns`, and `@throws` tags as applicable, and examples for exported functions.
Keep useful context in the description before tags instead of using `@remarks`.
Remarks belong beneath their tag, within 100 columns. Examples that need provider credentials,
packaged skill files, or a running tool server must state that prerequisite. Keep examples current.

Use lower camel case for values and schemas, and PascalCase for types/classes. Keep external field
names unchanged. Prefer named exports and explicit module imports over internal barrels. Use only
existing redacted logs at execution boundaries; helpers should not emit arbitrary console output.

Runtime validation uses Valibot with `strictObject` for private configuration and agent tool inputs.
Webhook objects allow unrelated GitHub fields. Preserve schema defaults and rejection behavior.
JSON Schema for MCP tools and proposals comes from Valibot's
[official converter](https://valibot.dev/guides/json-schema/). Zod is not a direct application
dependency; upstream SDKs may still depend on it. The low-level MCP server intentionally accepts
these generated schemas without introducing another schema definition layer.

## Tests and integration checks

Keep tests focused on authentication, credential routing, provider restrictions, policy parity,
immutable publication context, and single-attempt publication. Use fictional accounts and tokens;
never call GitHub or paid providers in the default suite. Shared fixtures return fresh mutable state.
Lint-rule tests exercise accepted and rejected syntax so standards remain enforced over time.
Runner tests pass the real packaged skill through the provider invocation with mocked SDK execution.
Compiled MCP tests use real stdio/loopback transports and the repository's Bash helpers. Bundle tests
compare all repository skill files, including references and scripts, byte-for-byte. Tool schemas
have one owner in `src/runner/tools.ts`; keep strict validation at both subprocess boundaries.

Run the Docker-backed dry run when changing the image or deployment configuration. A Worker-only
bundle check must be reported as such. Provider SDK execution and live GitHub publication still
require the documented shadow deployment check; local unit tests do not establish live compatibility.

The reference application's database layers, HTTP resource conventions, logging infrastructure,
repository hooks, coverage threshold, and deployment pipeline are not prerequisites for this host.
Keep this application's simple execution contract and runtime-specific tooling. No organization
configuration or private reference source belongs in this public repository.

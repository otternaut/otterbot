# Agent guidance

This file is the source of truth for contributors and agents working on this standalone
TypeScript/Bun application. Read [README.md](README.md) and
[development conventions](docs/development.md) before changing it. Claude Code uses this same
contract through [CLAUDE.md](CLAUDE.md).

## Structure and scope

Keep modules with the runtime they serve:

- `src/app.ts`: importable Hono application, middleware, and HTTP route composition.
- `src/index.ts`: Cloudflare entry point and container startup wiring.
- `src/worker/`: webhook authentication/dispatch, event routing, and Cloudflare bindings.
- `src/runner/`: Node provider adapters, scoped tools, and GitHub review execution.
- `src/contracts/`: Valibot schemas and pure review contracts used across runtimes.
- `scripts/`: packaging, build, and credential preflight commands.
- `test/`: system-level convention checks and shared fictional fixtures.
- `docs/`: deployment, configuration, architecture, and contributor guidance.

Place unit tests beside their targets as `<name>.test.ts`; do not create nested test directories.
Keep helpers local until multiple consumers need them. Add no empty folders, speculative layers,
forwarding services, or internal barrel exports. Prefer named exports; default exports are reserved
for framework entry points and tooling configuration. This app has no REST resource/database layers.
Keep Worker imports free of Node execution and provider SDKs. Contracts must remain safe in both
runtimes. `tsconfig.json` checks Worker code; `tsconfig.runner.json` checks the Node runner and tooling.

Use Hono for public HTTP routing. Compose the app in `src/app.ts` and inject the runtime launcher
from `src/index.ts`; do not start a Bun/Node listener for the Worker. Keep the no-store middleware
and sanitized error boundary before routes. Verify signatures over `context.req.raw` bytes before
parsing JSON; never install body-parsing middleware ahead of authentication. Forward the request's
execution context to the launcher so only container startup uses `waitUntil`. Test HTTP behavior
through the composed app, including failures. Hono must not add persistence or retry behavior.

Keep webhook handling in `worker/handler.ts`; `app.ts` only composes middleware and routes.
`runner/skill.ts` owns skill bundle integrity and reads. `runner/runtime.ts` parses process settings
once and passes typed settings explicitly to provider and tool calls. Trusted host instructions live
in `runner/instructions.md` and are embedded by the build; they do not replace the repository skill.
ESLint enforces runtime boundaries and rejects production imports of tests or fixtures.

## Formatting and imports

Use the checked-in Prettier and EditorConfig settings: two spaces, double quotes, semicolons,
trailing commas, parenthesized arrow parameters, UTF-8, LF endings, and a 100-column target.
Use braces for every control-flow body. Separate logical steps with blank lines; keep a declaration
and its immediate guard together. ESLint enforces baseline statement spacing.

Use `~/` for every import into `src/`, including same-folder imports, type imports, dynamic imports,
and re-exports. Imports outside `src/` keep relative paths. Keep one continuous import block, ordered
as third-party/built-in libraries, contracts/root application code, runtime modules, then test/tooling
files. Preserve side-effect import order and keep type imports with their owning group.

Use a descriptive lower camel case namespace when consuming multiple exports from a module,
including types. A single export uses a named import; type-only namespaces use `import type * as`.
Keep named exports in their defining file rather than introducing wrapper objects. Vitest's `vi`
hoisting helpers are an explicit exception: import `vi` by name beside the test namespace so mock
hoisting recognizes them. Do not wrap or alias `vi.mock`/`vi.hoisted` calls.

Use lower camel case for values and schemas; PascalCase for types, interfaces, and classes. Global
constants, if needed by multiple independent consumers, belong in `src/constants.ts` with upper
snake case exports. Preserve external API fields and environment binding names exactly.

## Type safety and documentation

Use strict TypeScript and type-aware ESLint. Validate untrusted input with Valibot at its boundary.
Do not use `any`, non-null assertions, or unsafe casts to bypass validation. Keep optional properties
absent when absent; do not silently widen contracts to allow explicit `undefined`. Tests may assert
known fixture entries and inspect mocked methods without rebinding them; these exemptions do not
apply to production code. Runtime and configuration schemas use `strictObject` where unknown fields
must be rejected; GitHub webhook schemas intentionally accept unrelated payload fields.

Document named functions, every method (including private helpers), classes, exported interfaces,
and meaningful types with accurate TSDoc. Explain purpose, parameters (`@param`), returned values
(`@returns`), and consumer-visible failures (`@throws`) as applicable. Keep safety constraints and
other useful context in the description before tags; do not use `@remarks`.
Every exported function needs a useful `@example` showing its public contract and required setup.
Wrap docblock prose within 100 columns including indentation. Do not
repeat TypeScript types in tags or add empty boilerplate. Update examples with signatures.

Use direct, concrete inputs and keep validation and policy decisions in their owning modules.
Preserve the existing structured, redacted boundary logs. Do not add arbitrary console output to
helpers or log source content, raw SDK errors, credentials, or configuration values. The low-level
MCP server is intentional: it accepts Valibot-generated JSON Schema without another schema library.

Provider model and effort settings belong in `CONFIG_JSON` profiles, never in source-level
organization switches. Forward them to lead and specialist invocations. Resolve Cursor effort
against the authenticated account catalog and reject unsupported choices without model fallback.
Keep real organization routing outside this public checkout.

## Operational invariants

Preserve the fire-and-forget design: no application persistence, queues, retry loops, scheduled
recovery, or operator control plane. The Sandbox binding is required container infrastructure.
A lost response must never trigger another publication attempt within the same run. Preserve
credential isolation, webhook authentication, immutable review context, publication gates, and the
specialist tool restrictions when refactoring.

Never commit real domains, organization mappings, tokens, private deployment configuration, private
reference-repository contents, or planning documents. Examples and tests use fictional identities.
The portable skills remain dependency-free and unchanged by host refactors. `scripts/build.ts` always packages `../../skills/otterbot-review` from this checkout and derives
its release identity automatically. Do not add alternate skill sources, global-install fallbacks,
or manual hash/release settings. Keep tool schemas in `src/runner/tools.ts`; MCP advertisement and
parent validation share that contract. In-process calls stay in process; loopback HTTP is only for
SDK subprocess tools.

## Verification

Run `bun run format`, `bun run check`. Use `bun run lint:fix` for mechanical lint
fixes. Tests must exercise behavior and boundaries without contacting GitHub or paid providers.
Convention-rule regression tests belong in `test/`; avoid tests that merely match documentation prose.
Update relevant documentation whenever architecture, configuration, or workflows change.
`bun run dev` builds before starting Wrangler. Local preflight and webhook ping load `.dev.vars`;
preflight defaults to its `CONFIG_JSON`, with `--config` reserved for an explicit file override.
The ping command must never launch a review, follow redirects, or retry.
Keep the setup and local-testing walkthroughs aligned with scripts, secret loading, and configuration.
Use fictional identities in copyable examples and distinguish mocked checks from live provider runs.

For deployment changes, also run the Docker-backed deployment dry run when Docker is available.
Report Worker-only bundle checks and unverified live/container integration boundaries accurately.
Do not add repository-wide hooks or tooling; this folder owns its dependencies and generated files.

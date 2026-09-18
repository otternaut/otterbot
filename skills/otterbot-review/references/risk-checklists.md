# Focused risk checklists

Use only sections matching the changed behavior. They guide the lead and selected specialists,
not repeated generic per-hunk audits. An item is a question to settle, not an
automatic finding. Prefer repository conventions, typed contracts, validated
boundaries and shared infrastructure over speculative missing safeguards.
Escalate context depth only to establish an actual consequential path.

## Correctness and contracts

- At untrusted/dynamic boundaries: missing, empty, duplicate, malformed,
  Unicode and extreme inputs; avoid impossible values ruled out by real guards.
- Range endpoints, integer overflow, floating-point/currency rounding,
  time zones, DST and calendar boundaries when arithmetic changes.
- Callers and consumers of changed signatures, defaults, enums, return/error
  shapes, schemas, events and configuration; old persisted data and external
  consumers matter. Search references to removed symbols and routes.
- Boolean inversions, early exits, fallthrough, lost async failures, cleanup,
  initialization ordering, stale caches and partial multi-store updates.
- Feature-flag defaults, both enabled/disabled paths, and rollback behavior.

## Authentication, security and sensitive data

- Verify identity and object/tenant-level permissions before side effects;
  follow the actual guard and data path, not merely a function name.
- Trace untrusted data to SQL, shell, file/path, template, deserialization and
  browser sinks; verify parameterization or escaping at the relevant sink.
- Browser boundaries: CSRF, CORS, cookies and redirects where changed.
- Secrets and sensitive data in logs, errors, metrics, URLs, fixtures and new
  third-party stores. Name fields; never reproduce credentials or private data.
- Abuse paths: unbounded input/work, enumeration and missing resource limits.
- Cryptography: established primitives, secure randomness, token scope/expiry,
  secret comparison and key handling when the change touches them.
- Shared guards count only when reachable on every relevant entry path.

## Persistence and migrations

- Constraints, uniqueness, foreign keys, soft-delete/cascade behavior and
  financial precision; existing data must satisfy new assumptions.
- Backfills, null/default handling, locks on live tables, transactions, partial
  failures and recoverability. Check both old and new app/schema combinations.
- Irreversible changes require current human sign-off as well as independent
  correctness evidence; sign-off does not prove data will survive.

## Concurrency, reliability and operations

- Interleavings across check/update, lock ordering and atomicity; retries,
  duplicate delivery and job overlap. Identify what actually makes an operation
  idempotent and when that key/record is committed relative to external effects.
- External calls: timeout, bounded retry/backoff, intentional failure behavior
  and shared-client defaults. Trace rejected promises and swallowed errors.
- Close resources on failure paths; bound caches, queues, tasks and payloads.
- N+1 queries, scans, indexes and hot-loop costs at realistic scale; avoid
  micro-optimization findings without a material consequence.
- Rolling deployment and rollback with mixed versions; safe configuration
  defaults and startup validation. Existing logs/metrics should reveal failures.

## Tests and verification

- Assertions prove changed outcomes, including relevant negative/failure cases.
  Would the test still pass if the feature were disabled or the bug restored?
- Mocks and fixtures reflect actual contracts and do not bypass the changed
  guard, persistence boundary or concurrent operation being claimed as tested.
- Look for deleted/weakened assertions, skipped tests, wider tolerances and
  unexplained snapshot changes where they affect evidence for this change.
- Flakiness from wall-clock time, randomness, ordering, shared state, network
  and sleeps. Check a relevant passing result is for the reviewed head.
- Distinguish code inspection of a test from evidence that it executed and
  passed; neither implies coverage of every path. See `verification.md`.

## Public interfaces

- Compatibility for APIs, CLI flags, SDK exports, schemas and file formats;
  deprecation/versioning and unchanged consumers under repository conventions.
- Error shape/status, pagination, order and limits; shipped API docs, CLI help
  and changelog when maintained for the affected surface.
- Loading, empty, error, permission-denied and narrow-screen states; keyboard
  access, accessible names, long text and localization where the UI changes.

## Dependencies and deployment

- Used APIs across version changes, engine/peer/sibling ranges, registry and
  package provenance. Investigate material new privileges, licenses or data
  destinations; do not make a broad supply-chain audit out of a routine bump.
- CI trust boundaries: untrusted code plus credentials, token permissions,
  image provenance/privileges and changes in what runs in production.
- A version pin is not automatically safe if release behavior changes the
  relevant security or deployment boundary. Investigate actual behavior.

## Maintenance and clarity

- Names and comments agree with actual behavior and do not mislead callers.
- New duplicated decisions have a concrete divergence or maintenance cost;
  duplication alone is not a reason to demand abstraction.
- Tests describe what their assertions establish, with realistic fixtures and
  clear failures; do not request more tests without a specific useful check.
- Apply the selective nitpick criteria in `analysis.md`; cosmetic preferences,
  speculative extensibility and generic refactoring requests are not findings.

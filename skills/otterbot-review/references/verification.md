# Code evidence for approval

Read when consequential behavior affects approval. The objective
is a defensible decision about changed behavior, not a prescribed test count
or proof of all possible executions. No review can guarantee absence of bugs.

## Consequential behavior

Permissions, sensitive data, persistence, migrations, concurrency, external
side effects and public contracts require explicit evidence. Other changes
qualify when a realistic failure would materially affect users. For each
changed boundary, establish at least one adequate route:

- Existing relevant tests: read assertions and setup, including applicable
  failure/negative cases. Confirm they exercise the actual changed path and
  use only local execution results actually observed.
- Targeted reproduction: run a bounded local check demonstrating the important
  behavior, with realistic inputs and meaningful assertions, in an isolated
  temporary workspace. No installation, credentials or external side effects.
- Code-path argument: trace the actual reachable input/caller through guards,
  transformations and effects to success/failure outcomes. Cite the concrete
  guard, transaction/atomic primitive, consumer or contract that establishes
  the property. "Looks fine", a function name or an assumed upstream check is
  insufficient. State environmental assumptions; if material and unverified,
  the argument is not adequate.

A test read but not run is design evidence, not a passing result. It can
support approval when its behavior and the changed implementation can be
established by inspection; it cannot establish unobserved runtime, integration
or concurrency properties merely by existing. Choose evidence proportional to
the risk. Tests that stub out the changed boundary do not cover that boundary.
No test is universally mandatory except the retained prior-critical test gate.

Keep the boundary-to-evidence mapping in the finding records' `evidence` and
`disproof` fields (`analysis.md`) and in the coverage areas' `evidence` strings
(`readiness.md`); there is no separate structure. Publish only the decisive evidence or exact gap, with file/test
references. If adequate evidence is unavailable, use Request Changes for the
specific unverified behavior; do not label absence of tests a fabricated bug.
A demonstrated defect gets its actual severity and normal verdict precedence.
Human sign-off satisfies a human-approval gate, never this verification gate.

## Sufficient evidence and stopping

Before investigating, name the changed property and the realistic failure that
would change the verdict. Choose the cheapest adequate route above. Stop when
it establishes the real changed path and relevant success/failure handling,
material assumptions are supported, and no contradictory evidence or credible
blocker remains. One route may cover several related changes; unrelated
boundaries still need their own evidence. A passing test with a mocked boundary
or an unchanged helper alone does not satisfy this rule.

Do not add a reproduction after sufficient inspection merely for reassurance,
or read more equivalent tests after the decisive assertions establish the
property. Expand only to resolve a specific remaining uncertainty. The
prior-critical covering-test gate remains mandatory even when a code-path
argument otherwise suffices. Reuse applicable evidence under `readiness.md`.
Stop at the step budget in `performance.md`; preserve unresolved properties as
verification holds rather than lowering the standard.

## CI/CD exclusion

This section is the single owner of the CI rule; other files point here
instead of restating it.

Ignore workflow status, check results, logs, enforcement and merge-protection
rules entirely. Do not retrieve them, wait for them, use them as proof or as
gaps, or mention them anywhere: not in the blurb, findings, reasons, markers,
`decision_key`, resume keys or the conversation summary. A code-correctness
verdict is identical whether workflows pass, fail, run, are skipped, are
unavailable or do not exist. CI-only events require no review update and never
invalidate a completed review; a legacy CI-only hold is discarded under the
policy migration in `readiness.md` without querying checks.

Source changes to workflow and deployment definitions are ordinary behavioral
code and receive a normal review. Compile, type and behavioral defects are
reported only when established independently from source or a bounded local
reproduction; never read or cite CI diagnostics for them.

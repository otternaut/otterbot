# Evidence for approval and CI enforcement

Read when consequential behavior or CI state affects approval. The objective
is a defensible decision about changed behavior, not a prescribed test count
or proof of all possible executions. No review can guarantee absence of bugs.

## Consequential behavior

Permissions, sensitive data, persistence, migrations, concurrency, external
side effects and public contracts require explicit evidence. Other changes
qualify when a realistic failure would materially affect users. For each
changed boundary, establish at least one adequate route:

- Existing relevant tests: read assertions and setup, including applicable
  failure/negative cases. Confirm they exercise the actual changed path and
  identify any head-specific execution result available.
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

Record a compact internal mapping of changed boundary to evidence and remaining
uncertainty. Publish only the decisive evidence or exact gap, with file/test
references. If adequate evidence is unavailable, use Comment Only for the
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
Stop at the aggregate investigation deadline in `performance.md`; preserve
unresolved properties as verification holds rather than lowering the standard.

## CI decision

These are approval and merge-readiness gates, never prerequisites for code
review or delivery. Complete the available review and publish findings and a
verdict even while CI/CD workflows are queued or running, or check metadata is
unavailable. Report outstanding checks and specific evidence gaps without
waiting for results; a CI hold does not mean code coverage is incomplete.

Inspect check results for the reviewed head and their relevance to changed
behavior. Branch protection/rulesets or host merge settings must be read only
when approval would rely on them to hold a pending/failed check. Use effective
rules for the actual target branch and normal merge path; do not infer
requirements from workflow names, a green rollup or repository convention.
Do not edit merge settings or use bypass privileges to make a gate pass.

| Check state | Approval eligibility, assuming all other gates pass |
| --- | --- |
| Required and relevant checks passed at reviewed head | Eligible; still establish behavior coverage |
| Relevant/required check pending or failed, with confirmed effective merge enforcement for that exact check | Eligible only if no verified defect or independent evidence gap remains; say merging awaits that check |
| Relevant/required check pending or failed, but optional, unenforced or enforcement unknown | Comment Only; name check and missing enforcement/evidence |
| Check missing, skipped or cancelled | Do not call it passed; establish applicability and alternate evidence. If it is required or still needed to establish behavior, apply the outstanding-check rule |
| Unrelated optional check failed | Explain why unrelated briefly if material; no automatic hold |
| Repository has no CI requirement | Direct behavior evidence may suffice; no invented CI setup requirement |

Inspect failures far enough to distinguish a demonstrated behavioral defect,
a compile/type failure, infrastructure trouble and an unrelated optional job.
A known broken behavior still requires Request Changes even if merge rules
would catch it. For a diagnostic already reported by CI, link the check rather
than duplicate its inline report; concrete compile/type/test failures that
would ship broken still yield Request Changes. Pending status alone is not a
defect. If the failure's relationship to consequential behavior cannot be
settled, explain the independent uncertainty and withhold approval.

Enforcement means the unresolved check actually prevents the ordinary merge
path used for this PR, including automatic merging if applicable. If the
intended path bypasses that requirement, treat it as unenforced. Do not demand
proof that no administrator could ever override the repository.

Recheck applicable status and enforcement with mutable gates before granting
approval; include them in final verification if relied upon. If the check
finishes or settings change on the same head, gate reassessment can update the
decision without repeating the code review. A disappeared protection cannot
justify a retained approval while its relevant check remains outstanding.
Never poll waiting for CI or claim that approval itself guarantees merge safety.
Approval while enforced checks wait is Review passed / Waiting, never Ready
to merge. Readiness requires passing required integration evidence for the
current head and target/base context, as defined in `readiness.md`.

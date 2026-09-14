# Reviewer validation and staged rollout

Run this separately from ordinary PR reviews. Defined scenarios are expectations,
not evidence of model accuracy. Executing a fixture's code verifies its behavior,
not whether a reviewing model detects the defect.

## Three layers of validation

1. Run `scripts/test-phrases` for batch randomness invariants and
   `scripts/test-decisions`: deterministic normalized gate decisions,
   incomplete/stale contexts, minor boundaries and invalid-input rejection.
2. Run the actual reviewing agent in `--shadow` on fixture PRs, clean controls
   and corrected revisions. Give only the raw PR/context artifacts, never the
   expected answer. Use fresh sessions for initial reviews; corrected revisions
   receive only the prior delivered review/state and new raw artifacts.
3. Trial the same host workflow on a sandbox repository or mocked host adapter,
   including pagination, partial writes, stale approvals, edited commands,
   concurrent pushes/base advances, event redelivery and approval-removal failure.
   No production writes for validation. Shadow itself must issue zero writes.

The existing fixture-backed cases in `evals/evals.json` are a starting point,
not a representative release benchmark. Extend with anonymized realistic PRs
covering permission boundaries, migrations, concurrency, API compatibility,
dependency changes and ordinary safe refactors. Include cases where behavior
is safe because a real caller guard exists and cases where the guard is bypassed.
Include incomplete first reviews followed by small fixes, and clean PR heads
that become incompatible with a changed base. Use the same raw snapshots when
comparing skill/model versions. Repeat runs to expose nondeterminism.

## Record outcomes, not wording

Save a local artifact per case/run with model and skill version, fixture/context
identity, raw findings, coverage and evidence, verdict/readiness, attempted host
actions, elapsed time and usage if available. Do not invent unavailable usage.
Match findings by demonstrated root cause, not exact title or category spelling.

Report counts and denominators by risk class:

- Serious defects detected and missed; unsafe code approvals.
- Incorrect findings and unjustified holds on clean controls.
- Correct fixes that reach readiness without unrelated new demands.
- Correct rejection/deferral commands and persistent unresolved risks.
- State-transition and event-recovery failures; duplicate comments/approvals.
- Median/tail elapsed time and usage, including failure and recovery runs.

An unresolved major/critical miss or unsafe-ready case is a release blocker for
that risk class. Require all deterministic decision and host-transition cases
to pass. A clean small sample is not a statistical guarantee; show sample size
and repeat variability rather than claiming a universal detection rate.

## Rollout

Start with shadow, then sandbox delivery, then explicitly enabled autonomous
approval for supported lower-risk classes. Retain current human sign-off gates
for sensitive behavior. Expand only after comparing false holds, serious misses
and convergence against the previous version. Set quantitative acceptance
thresholds with repository owners before the trial, not after seeing results.
Pause expansion when evidence regresses; preserve normal human merge paths.
The skill does not provision automation, change branch protection, or merge PRs.

## Performance baseline and paired comparison

Before asserting a speedup, collect at least 12 representative snapshot cases:
four initial reviews (small, standard, sensitive, large), four changed-code
re-reviews (including a fixed blocker and a changed dependency), two comment/source-evidence
reassessments, one unchanged skip and one incomplete-review recovery. Include
buggy, clean and corrected controls. Capture the same raw source, paginated
host facts and initial review state for both skill versions; isolate their
sessions and caches so neither sees the other's findings. Alternate version
order and repeat each case at least twice. Record missing host capabilities;
a simulated adapter measures that adapter, not production host latency.

Save one local record per run using `evals/performance-record.json` as a field
template. Set unavailable counters to null, never zero. Collect available
elapsed time, input/output/cached tokens, tool calls and returned bytes from
runner traces; include any specialist usage in totals. Count repeated reads
from repeated resource/revision/range identities, not merely identical text.
Time snapshot, instruction loading, code/evidence work, state rendering and
host delivery separately; phase times should not double-count parallel work.
Metrics extraction is offline and must not add tool calls to normal reviews.
Do not persist credentials, raw private payloads or chain-of-thought.

Compare paired median and p90 elapsed time and total tokens by job, with
sample sizes and unavailable metrics shown. Report budget overruns separately
for investigation and host/recovery latency. Also compare serious misses,
false findings, false holds, incomplete-review rate and total time/tokens over
an entire PR's review-to-fix sequence. A fast partial review that merely shifts
work to subsequent runs is not a demonstrated improvement.

Adopt tighter budgets only when the comparison shows no new serious miss or
unsafe approval and no unexplained increase in false holds/incomplete reviews.
Investigate individual regressions even when aggregate time improves. The
runtime defaults in `performance.md` are provisional until this comparison
passes. Keep evidence and approval criteria fixed while tuning budgets. No
representative PR run or latency/token measurement is implied by these files.

## Production enablement checks

Before enabling autonomous approvals in a deployment, execute the paired
reviewer benchmark above and sandbox delivery tests using the intended identity.
Include approval withdrawal, concurrent head/base changes, duplicate/edited
events, partial writes, policy upgrades and paused-scope command recovery.
Record actual outcomes; scenario definitions are not executed results.

Verify the deployed event router and per-PR serialization, and provide a trusted
operational switch that disables new approvals while retaining feedback and
stale-approval cleanup (the review skill's `--no-approve` behavior). Recheck
that switch at preflight and during final verification; PR content cannot set
it. Start with explicitly enabled lower-risk repositories and expand only
after measured validation. This document does not deploy those controls or
authorize production mutations merely by being installed.

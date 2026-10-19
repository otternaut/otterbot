# Policy migrations

Read only when stored policy identity is missing or differs from the current
revision in `readiness.md`. Apply changes newer than the stored revision;
missing identity requires all applicable checks. Unknown future revisions or
malformed state cannot support cached approval. Reuse valid evidence and
reassess affected scope, then record the current revision. Current decisions
always come from `approval.md`; historical behavior is not an instruction.

## Revision 10 · Risk-based, stateless human review

Human review now asks whether auto-approving would be unsafe if Ollie were
wrong, using the costly-miss, unverifiable and judgment-call triggers and the
risk-direction table in `approval.md`, instead of escalating every change in a
sensitive area. Verified changes in the low-risk direction, such as narrowing
access or an additive nullable column, follow the ordinary gates. Escalation
ignores author, reviewing identity and every review state, and no human
approval clears it. The reviewing identity being the PR author is no longer an
approval gate; `hosts.md` covers the self-review delivery limitation.
On migration, drop sign-off states from `decision_key`, re-evaluate each old
`human` hold against the triggers with the existing evidence, rewrite any
surviving hold with its trigger and focused question, and recompute the
verdict. A hold that no trigger supports is dropped. Reuse code coverage; do
not reassess solely because a human approved.

## Revision 9 · Human sign-off with safe minors

One or two demonstrably safe minors no longer turn an otherwise human-only
hold into Request Changes. Recount current findings and rerun the decision;
keep safe minors visible. If the only hold is a human-review hold, deliver
Human Review Needed and reconcile the old Ollie request under `hosts.md`.
Three minors, uncertain impact, blockers and other holds still prevent this
outcome. Existing code coverage remains reusable when applicable.

## Earlier revisions

Revision 8 requires rendered evidence only for actual UI/visual changes and
introduces Evidence Required for a missing-visual-evidence-only hold. On
migration, retain valid code coverage and inspect the original changed behavior
for visual impact, even with an empty interdiff. Reuse applicable media or
record the visual hold and reconcile any prior Ollie approval. Nonvisual
reviews gain no screenshot requirement; unrelated verification holds retain
Request Changes. Unknown visual access remains a specific verification hold.
Revision 7 expands discovery to automatic relevant specialist selection,
behavior-based cross-file tracing and focused follow-through, separating minor
investigation from publication caps and enabling selective non-blocking
nitpicks. On migration, retain valid independently established evidence, but
reassess changed behaviors whose callers, failure paths or outcomes were not
covered under the earlier limits. Do not manufacture nitpicks on re-review or
require delegation when equivalent local coverage is established. Approval
thresholds and defect evidence standards are unchanged.
Revision 6 requires a clean information boundary between independent candidate
verification and external-review deduplication. On reassessment, reuse prior
Ollie evidence only when its provenance is independent of external comments.
Otherwise reverify affected scope without external-review content before
counting or publishing the claim. External thread URLs previously adopted into
Ollie's index are removed; a reverified matching finding is retained as a
threadless Ollie record built from Ollie's evidence, while an unverified
imported claim is excluded. Revision 5 delivers Human Review Needed as a
non-blocking host comment with
approval withheld instead of a blocking request for changes, and replaces minute
budgets with step budgets. On the next reassessment of a legacy human-only
Request Changes, dismiss Ollie's own request and repost the banner as a comment
using `hosts.md`; existing code evidence remains valid and no approval criterion
changes. Revision 4 distinguishes a completed review with no outstanding
findings and only a required human review/sign-off missing as Human Review
Needed. (Its instruction to retain a blocking host action for that case is
superseded by revision 5.) Revision 3 removes all CI/CD evidence, holds, freshness inputs and
merge-readiness claims. Discard legacy CI-only holds without querying checks;
reuse valid code coverage. Recalculate old Comment Only decisions: approve
benign feedback when review gates pass, otherwise request changes with the
review reason. Preserve explicit approval-action opt-outs. A legacy CI event may
require this one-time policy migration; subsequent CI-only events are no-ops.
Revision 2 requires independent discovery and verdicts, removes human-review
shortcuts and vetoes, and keeps accepted minor risks in Ollie's count. Reassess
old review-derived counts and holds; complete scope previously skipped because
of human approval. Retain code evidence only where independent provenance is
established; otherwise re-review the affected scope without imported findings.
Revision 1 introduces explicit policy identity and cross-sweep progress control;
older state has unknown policy identity, not implicitly revision 1.

# Approval gates and minor accounting

This is the authoritative decision contract: approval gates, verdict precedence
and normalized inputs. Read it before every decision. Use `format.md` for
presentation and `hosts.md` for state actions. Load accounting and reassessment
sections when applicable.

## Approval gates

**Approval gate.** Every rule must hold. A failure is named in the blurb and
in the marker's `gate` field.

These gates govern approval, not whether to perform or publish the review.

- Every requirement source the correctness depends on, such as a linked
  ticket or spec, was accessible and read.
- No open Ollie finding above minor, and every prior Ollie critical or
  major is fixed, superseded, or demonstrably disproven with evidence at the
  reviewed head. Accepted clears only a proven inapplicable finding; use
  withdrawn for a false positive. Deferral or risk acceptance never clears a
  blocker.
- Every critical found on this PR in any round is fixed and covered by a test
  Ollie read or ran, or was withdrawn.
- The current head, target branch and base/integration context match the
  verified review state; changed context was assessed before approval.
- The PR is not a draft. Other reviewers' review states do not affect Ollie's
  independent approval decision.
- Each consequential changed behavior has adequate evidence under
  `references/verification.md`; no material coverage claim rests on
  human assurance or presumed caller behavior alone.
- UI or visual changes have relevant rendered evidence under that reference's
  **Visual evidence** section. Nonvisual changes do not need captures.
- The author is not the reviewing identity. A bot author such as dependabot
  or renovate is not a failure on its own: its dependency bump is approved
  when the compatibility check is clean and every other rule holds, and a bot
  PR that changes anything else is gated exactly like a human's.
- The change either has no human-approval-zone behavior, or that exact
  behavior has explicit approval from an authorized human reviewer other than
  the PR author, applicable to the reviewed head. Zones cover: who is
  authenticated or what they may do; how secrets are stored, read, or
  transmitted; irreversible effects outside the system such as moving money,
  deleting user data, or sending to customers at scale; migrations that
  drop, rewrite, or cannot be rolled back; CI or deployment definitions that
  change what runs in production. Zones trigger on behavior, not vocabulary:
  a log line, test, comment, rename, read-only query, or pinned-version bump
  inside one is not a zone change. When a zone triggers, the blurb names the
  exact behavior that changed and links the human decision when satisfied.
  Verify reviewer authority from repository rules or host permissions. A
  generic approval without clear coverage is insufficient; changed behavior
  invalidates prior sign-off. Human sign-off never waives verified blockers.
- Fewer than three verified outstanding minors count under the approval
  accounting rules, and every remaining minor is demonstrably safe to address
  after merge. No material uncertainty about serious impact remains.
- The selected review scope was completed, and nothing in the verdict rests
  on an author assertion Ollie could not confirm in code.

Record missing authorized sign-off as a human hold, not a defect. Name the
behavior, required reviewer and approval needed for the reviewed head. Do not
infer this requirement from uncertainty or an unrelated host reviewer quota.
Verification gaps likewise remain holds with concrete clearing conditions;
only demonstrated defects receive severity and finding records.

## Decision table

Apply in order; every review input needs evidence or is unknown. Each row
gives the verdict, then the review status after the slash:

1. Verified outstanding critical/major: Request Changes / Blocked.
2. Complete review, current context, adequate evidence, at most two
   demonstrably safe minors, no blockers and only an explicit required human
   review/sign-off missing: Human Review Needed / Human Review Needed. Record
   the exact human action needed; retain safe minors in the findings index.
3. Actual UI/visual change with missing visual evidence as the only approval
   hold: Evidence Required / Blocked. Safe one or two minors may remain. Ask
   for a capture of the changed view/state, without inventing a defect.
4. Outside the human-only and visual-only cases above, incomplete review,
   stale/unknown context, any failed review gate or three counted minors:
   Request Changes / Blocked.
   Name each unmet gate and what clears it; distinguish verification gaps from
   verified defects.
5. All review gates pass: Ship It / Review passed, including benign comments.
6. For an otherwise passing review only, explicit `--no-approve` selects
   Comment Only / Review passed. Explain the requested approval-action opt-out.

`--shadow` leaves the hypothetical decision unchanged but prohibits every host
mutation. Shadow output never claims actual host approval. A host delivery
restriction preserves the intended verdict in a plain comment and discloses
why the corresponding host action could not be submitted.

## Deterministic helper

Run `scripts/decide --help` for normalized input flags. It emits JSON with
`verdict`, `readiness` (the legacy field name for review status) and reason
codes. Required review inputs fail on invalid/missing values. The helper reads
no credentials or network state and trusts evidence established by the reviewer:

- blockers/minors: distinct outstanding verified counts from Ollie's own review.
- coverage: complete only when every relevant changed code area has been
  addressed; pending visual inspection is tracked separately below.
- context: current only after verifying head, target/base and integration
  context.
- evidence: adequate only after consequential-behavior verification.
- visual-evidence: required; `not-required`, `provided`, `missing` or `unknown`
  as defined in `verification.md`. Missing records `missing_visual_evidence`;
  unknown records `unverified_visual_evidence`, never a claim of absent media.
  This field owns the visual hold; do not duplicate it in coverage, evidence or
  gates. Other gaps stay in those fields and take precedence over this verdict.
- gates: pass only when every other code-review gate passes, including
  sign-offs. Use `human-required` when an explicit required human review/sign-off
  is the only unmet gate represented by this field; coverage, evidence, visual
  proof and minor risk use their own fields. Use hold/unknown for other
  failed/unverified gates. The table above governs the combined result;
  `human_review_required` records missing sign-off even when another hold
  requires Request Changes.
- minor-risk: required when minors is nonzero. `safe` only when every counted
  minor has a concrete, limited consequence that is demonstrably safe to
  address after merge; `uncertain` otherwise, which withholds approval with a
  `minor_risk` reason. It never raises a minor's severity.
- no-approve: optional delivery opt-out, never a code-review gate.

Persist the helper's verdict and readiness IDs as returned. Display labels and
assets are mapped in `format.md`. If Bash is unavailable, apply the decision
table above and disclose that fallback. The helper accepts no CI, host or
merge-eligibility inputs.
Use the result to choose delivery. After transitions verify Ollie's effective
review state and update markers and advisory links in one bounded root edit.
Never overwrite failure reasons with a generic clean message.

## Minor accounting

The inline posting budget is four new minors. The approval count is independent
of that budget and includes every distinct verified outstanding minor known at
the reviewed head from Ollie's own review, including prior rounds and
independently discovered findings not posted inline because they are already
covered externally or exceed the posting cap. Do not import findings from
other reviews or comments. Deduplicate Ollie's records by root cause, including
against its ledger and prior threads. External root-cause matching changes only
publication and never supplies evidence. Questions, nitpicks and unverified
candidates do not count as minor defects.

When several minors combine into a demonstrated major/critical failure,
report that combined defect at its actual severity without double-counting
its cause. Count alone never increases severity. Investigate concrete concerns
about serious impact; unresolved impact is a verification hold, not a safe
minor or a speculative blocker.

Start with known prior findings and verified candidates. Verify blockers first,
then credible minors in risk order within the shared investigation budget.
The four-minor inline cap limits publication, not discovery or verification;
continue relevant behavior coverage after reaching it or the three-minor
verdict threshold. Do not seek findings to fill a quota. Stop optional nitpick
work first as the budget tightens, and preserve unfinished consequential scope
as a specific verification hold under `performance.md`.
Retain all already verified findings, including overflow. If budget expires with
a credible concern whose impact is needed to decide approval, disclose
incomplete assessment and do not approve.

## What clears a minor

- Fixed/superseded: code evidence shows the consequence is removed.
- Withdrawn/accepted: evidence shows the finding was incorrect or inapplicable.
- Deferred: still counted despite ticket creation or thread resolution.
- Another reviewer's approval or risk acceptance does not clear an Ollie
  finding or remove it from the count.

Recheck affected code, new replies and purported clearing evidence. Reuse
prior verified evidence only if the relevant behavior and context are
unchanged. If that cannot be established, verify again or withhold approval
for incomplete assessment. Minor accounting never
waives blocker or sensitive-change gates. Use this unified risk count; there
is no separate deferral-count or review-round approval limit.

## Visible accounting and continuity

Every finding affecting approval must have a visible trigger, consequence, code
reference and fix. Keep up to four new minors inline; render additional verified
minors and independently verified findings covered by another reviewer as
compact threadless entries in 🐟 Fishy Findings, with their stable IDs and
status. These entries are rendered only from Ollie's frozen record and remain
visible on subsequent rounds. Link only Ollie's own existing thread; otherwise
use a reviewed-commit code link or plain `file:line`, never another reviewer's
URL or an invented thread URL. Do not mention the matching reviewer or reproduce
their wording. Explain when the approval count differs from Ollie's index count.
Historical/overflow entries do not consume new inline slots; only newly
introduced claims must satisfy interdiff scope.

Maintain an approval ledger in every root review, including an empty list
when all overflow has cleared, so a later review cannot resurrect stale data:

```html
<!-- ollie-approval: {"head":"<full-sha>","unposted_minors":[{"id":"<root-cause-slug>","anchor":"<file:line>","claim":"<trigger and consequence>","evidence":["<supporting file:line and concise fact>"],"fix":"<concrete change>","status":"still-open"}]} -->
```

`unposted_minors` is the legacy field name for findings without inline threads;
they now have visible root entries. Track fixed, withdrawn and superseded
historical entries visibly in the index but remove them from this outstanding
ledger. Reuse the index in the newest review to preserve those historical IDs.
Use valid JSON, no secrets or literal HTML comment delimiters in values. The
marker is public source, not private storage. Preserve it during link updates.
Load the ledger from the newest attributable root review, never the newest
nonempty ledger from an older review. For legacy reviews without this field,
reconcile prior recorded entries with subsequent code and status evidence;
absence alone proves neither outstanding risk nor clearance. If records needed
to decide approval cannot be recovered, explain incomplete accounting and
withhold approval. Deduplicate ledger entries against findings now in threads.

Persist required sensitive-behavior sign-offs as linked evidence in the thread
or root when used to clear that gate; they never erase findings. Commands can
reference visible overflow IDs on the root; process those just like inline
findings without inventing threads.

## Bounded gate reassessment

Code-review freshness and decision freshness are separate. New evidence from
a reply, a screenshot/video or edited visual attachment, a required source,
a human sign-off, or an explicit request to
reassess gates may change the decision without a new commit. Reuse the prior
completed code review only when its head, target/base context and affected
evidence remain current under `readiness.md`. Fetch the
latest findings/statuses, ledger, behavior evidence and mutable review-gate
metadata.
Reverify disputed or affected claims and evaluate every approval gate. Do not
repeat the whole diff or investigate already settled issues merely to count
a new review round. An incomplete prior review cannot be treated as complete.

If head or base context changed, handle the reply but review the interdiff or
affected integration context plus any prior coverage gaps before approval.
Recheck head and mutable gates at delivery. If the head changes again, withhold
approval and disclose it; do not loop.

If verified evidence changes the verdict, its failed gates or the outstanding
risk record, publish one concise updated root review with the current index
and ledger, then reconcile Ollie's effective host state using `hosts.md`.
Label the blurb as a gate reassessment when useful and keep the same code-review
round for unchanged-head reassessments. Approval still requires all gates;
never approve merely because one thread was resolved. If neither decision,
gate reasons, accounting nor host state needs updating, reply only and reuse
the existing review. Deduplicate repeated source comment IDs/evidence; a prior
response does not excuse an unfinished gate update after partial delivery.

Do not leave a stale Ollie Request Changes in place after its concerns are
disproven, regardless of other reviewers' decisions. Reconcile Ollie's state
while leaving human reviews untouched. Root updates and thread replies retain
the personality footer. Automated sweeps need to supply changed decision
evidence to trigger this path; it does not install a comment listener or change
sweep eligibility.

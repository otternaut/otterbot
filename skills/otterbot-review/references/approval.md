# Approval gates and minor accounting

Read the approval gates for every proposed host verdict. Load minor accounting
and reassessment sections only when applicable.

## Approval gates

**Approval gate.** Every rule must hold. A failure is named in the blurb and
in the marker's `gate` field.

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
- The PR is not a draft, and no human reviewer has an active
  changes-requested state.
- Each consequential changed behavior has adequate evidence under
  `references/verification.md`; no material coverage claim rests on green
  checks, human assurance or presumed caller behavior alone.
- Required and behavior-relevant CI checks pass at the reviewed head, or
  every outstanding relevant check is confirmed enforced by the target's
  merge rules and no verified defect or independent evidence gap remains.
  Unknown enforcement cannot justify approving past a failed/pending check.
  No-CI repositories may use adequate direct verification; no blanket CI
  requirement is invented. See `references/verification.md` for exact cases.
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
- `no-approve` is not set.
- Fewer than three verified outstanding minors count under the approval
  accounting rules, and every remaining minor is demonstrably safe to address
  after merge. No material uncertainty about serious impact remains.
- The selected review scope was completed, and nothing in the verdict rests
  on an author assertion Ollie could not confirm in code.

## Minor accounting

The inline posting budget is four new minors. The approval count is independent
of that budget and includes every distinct verified outstanding minor known
at the reviewed head, including prior rounds, human findings independently
verified by Ollie, and verified findings not posted inline. Deduplicate by
root cause, including between ledger entries and existing threads. Questions,
nitpicks and unverified candidates do not count as minor defects.

## Decision

- A verified critical/major still yields Request Changes, regardless of count.
- Zero counted minors permits Ship It only when all other gates pass.
- One or two permits Ship It only when consequences are concrete, limited,
  and safe to address after merge, and all other gates pass.
- Three or more yields Comment Only, not Request Changes on count alone.
- A concrete unresolved concern about serious data, authorization or
  compatibility impact prevents auto-approval even if provisionally called
  minor or question. Investigate or state the uncertainty in Comment Only;
  do not manufacture a blocker from speculation.
- When several minors combine into a demonstrated major/critical failure,
  report that combined defect at its actual severity without double-counting
  the same cause as independent minors. Count alone never increases severity.

Start with known prior findings and verified candidates. Verify credible minor
candidates in risk order, up to four new inline findings within the optional
work budget. Once three outstanding minors count, approval is withheld, but
finish an already identified fourth candidate when useful and affordable.
Do not search for extra minors to fill the four slots or continue optional
investigation beyond them. Prioritize blocker work and mandatory scope until
the aggregate investigation deadline in `performance.md`; retain unfinished work as a verification hold.
Retain all already verified findings, including overflow. If budget expires
with a credible concern whose impact is needed to decide approval, disclose
incomplete assessment and do not approve.

## What clears a minor

- Fixed/superseded: code evidence shows the consequence is removed.
- Withdrawn/accepted: evidence shows the finding was incorrect or inapplicable.
- Deferred: still counted despite ticket creation or thread resolution.
- Human-approved risk: an authorized human reviewer other than the PR author explicitly
  approves that specific minor risk for merge. Link their decision, ensure it
  applies to the current behavior, and exclude that risk from the threshold.
  Verify their review authority from repository rules or host permissions.
  A generic approval, an author saying "accept", or a resolved thread is not
  this evidence. Keep its actual thread status; approval is not a code fix.

Recheck affected code, new replies and purported clearing evidence. Reuse
prior verified evidence only if the relevant behavior and context are
unchanged. If that cannot be established, verify again or withhold approval
for incomplete assessment. These exceptions apply only to minors and never
waive blocker or sensitive-change gates. Use this unified risk count; there
is no separate deferral-count or review-round approval limit.

## Visible accounting and continuity

Every finding affecting approval must have a visible trigger, consequence,
code reference and fix. Keep up to four new minors inline; render additional verified
minors as compact entries in Advisory Findings, with their stable IDs and
status. These entries are not hidden solely in metadata and remain visible
on subsequent rounds. Link an existing thread when available; otherwise use
a reviewed-commit code link or plain `file:line`, never an invented thread URL.
Existing human findings are linked in the root's approval explanation rather
than duplicated as Ollie's findings. Explain when the approval count differs
from Ollie's index count. Historical/overflow entries do not consume new
inline slots; only newly introduced claims must satisfy interdiff scope.

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

Persist specific human risk decisions as linked evidence in the thread or
root when used to clear a gate. Commands can reference visible overflow IDs
on the root; process those just like inline findings without inventing threads.

## Bounded gate reassessment

Code-review freshness and decision freshness are separate. New evidence from
a reply, a required source, CI results/enforcement, a human sign-off, or an
explicit request to
reassess gates may change the decision without a new commit. Reuse the prior
completed code review only when its head, target/base context and affected
evidence remain current under `readiness.md`. Fetch the
latest findings/statuses, ledger, behavior evidence and mutable gate metadata,
including CI enforcement when required by `verification.md`.
Reverify disputed or affected claims and evaluate every approval gate. Do not
repeat the whole diff or investigate already settled issues merely to count
a new review round. An incomplete prior review cannot be treated as complete.

If head or base context changed, handle the reply but review the interdiff
or affected integration context plus any prior coverage gaps before approval. Recheck head and mutable gates at delivery. If the
head changes again, withhold approval and disclose it; do not loop.

If verified evidence changes the verdict, its failed gates or the outstanding
risk record, publish one concise updated root review with the current index
and ledger, then reconcile Ollie's effective host state using `hosts.md`.
Label the blurb as a gate reassessment when useful and keep the same code-review
round for unchanged-head reassessments. Approval still requires all gates;
never approve merely because one thread was resolved. If neither decision,
gate reasons, accounting nor host state needs updating, reply only and reuse
the existing review. Deduplicate repeated source comment IDs/evidence; a prior
response does not excuse an unfinished gate update after partial delivery.

A human-approved shortcut does not leave a stale Ollie Request Changes in
place after its concerns are disproven. Reconcile Ollie's state while leaving
human reviews untouched. Root updates and thread replies retain the personality
footer. Automated sweeps need to supply changed decision evidence to trigger
this path; it does not install a comment listener or change sweep eligibility.

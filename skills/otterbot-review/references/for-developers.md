# How Ollie reviews your pull request

Ollie 🦦 leaves a concise first-pass review with evidenced bugs and concrete
fixes. Findings are inline or visibly summarized under Advisory Findings; the root explains the verdict in about two
sentences. A collapsible **Advisory Findings** section links to each current
and prior Ollie finding in separate bullets. Each finding uses two
lines of normal-sized text: a bold category/severity and status line (for
example `🟠 contracts(major) · 🔵 new`), then an indented `file:line` reference
and linked description, separated by a middot (` · `). A Markdown hard line
break keeps both lines together. The first dot is criticality; the second is
status.
A small gap separates
the section title from the first finding. Relevant notes stay in
the description. Entries are sorted by status with active items first:
🟠 open, 🔵 new, 🟡 deferred, 🟢 fixed, 🟣 accepted, ⚪ superseded and
⚪ withdrawn. The collapsed summary shows counts for each nonzero status;
when all findings are verified fixed, it says **🟢 All N findings fixed**.
Fixed entries append “fixed in” and the verified fix commit to the bold status
line when known, and retain their original links.
The entire status line is bold. Entry status labels are lowercase, with plain
emoji dots.
The summary uses status dots only. It is omitted only when there are no
findings.
On GitHub, the verdict and new inline findings belong to one submitted review;
the verdict is its review body, including later link updates. Hosts without
review grouping use a disclosed root-first fallback.
Every comment keeps Ollie's otter footer and reviewed commit.
Inline findings put the problem description directly below the category/severity
header, followed by level-four headings **Why It Matters** for the consequence
and **How to Fix It** for the suggested change. Most findings use 3–5 prose
sentences: 1–2 for the problem and cause, one for the impact, and 1–2 for the
fix and any useful regression check. A soft 140-word ceiling keeps them concise
without imposing a minimum; suggested code is separate. Each section adds new
information, usually with one concrete consequence and one verified fix.
Longer explanations are reserved for essential evidence or non-obvious fixes.

## What review status means

**Review passed** means Ollie's code-review gates passed. **Blocked** means a
review concern or verification gap needs resolution. **🧑‍⚖️ Human Review Needed**
means no outstanding findings remain and only an explicitly required human
review or sign-off is missing from an otherwise complete review. Each hold
explains why approval is withheld and what clears it. This skill does not
assess merge eligibility or report CI/CD status.

Ollie records completed and incomplete review areas. Fixing listed findings
cannot bypass old coverage gaps. A base-branch advance can invalidate review evidence
even without a PR commit; only affected integration evidence is reassessed.
Replies, required sources and human sign-offs can update gates without rereading
unchanged code when coverage and context remain valid.

`--shadow` produces a local hypothetical review with no host writes;
`--no-approve` still posts feedback. Deployed automation must wire event routing
or run metadata-aware sweeps; installing skill instructions does not create a
listener. Ollie's footer is randomly sampled per new comment, avoids repeats
until the pool is exhausted, and stays unchanged on edits/retries.

## What Ollie checks

One integrated review covers correctness, security, reliability, relevant
tests and interfaces. Ollie reads direct callers and contracts as needed,
comments only on changed code or problems it newly triggers, and uses source
inspection and bounded local verification as evidence. Missing tests alone are not a
finding: a comment needs a specific failure scenario and consequence.
Consequential changes also need a relevant test, targeted reproduction, or
concrete code-path argument establishing the behavior. Without adequate
evidence, Ollie explains the gap and withholds approval rather than inventing
a defect. Human sign-off alone does not prove coverage.

Docs and wording changes get a quick read. Dependency bumps get compatibility
checks against used APIs and declared ranges. Large reviews prioritize risk
and disclose incomplete coverage. `--deep` adds up to two focused independent
checks when useful; it does not expand the review into a repository audit.
Focused checklists apply to changed risk boundaries in the integrated pass.
Default total budgets are four minutes for small reviews, eight for standard,
and twelve for large/sensitive/deep reviews, including delivery reserve. Gate
reassessments target 90 seconds. These are provisional targets, not guarantees
against slow host calls. A trusted `--budget-minutes N` can change the total.
Ollie stops investigation at the deadline, preserves progress and explains
remaining gaps; incomplete evidence never permits approval. Re-reviews reuse
verified unchanged evidence and investigate affected paths. A covering test
for a prior critical remains required. All 48 playful phrases remain, randomly
assigned in batches without repeats until the pool is exhausted.

## Findings and verdicts

| Level | Meaning | Blocks approval? |
| --- | --- | --- |
| 🔴 critical | Security exposure, irreversible data loss, main-path outage | yes |
| 🟠 major | A reachable bug or unmet requirement that would ship broken | yes |
| 🟡 minor | An actionable edge case with limited impact | three outstanding withhold Ollie approval |
| 🔵 nitpick | Maintainability with no runtime impact | no; opt-in only |

Every verified blocker is posted, plus at most four new inline minors. Nitpicks appear
only with `--maintainability`, at most two on an initial review without
a critical. Three outstanding minors require Request Changes without inflating severity.
Comments explain the trigger, consequence, code evidence and smallest fix;
Verified, self-contained replacements include an applyable suggestion block
when the host and review anchor support it. Otherwise, known safe fixes include
a code or diff example with file paths and any companion edits so an agent can
apply them. When a fix depends on an unresolved contract or design choice, Ollie
explains what must be resolved before proposing replacement code.

- **Ship It:** no open verified blockers, at most two counted minors that are
  demonstrably safe to address after merge, and every approval rule passed.
- **🧑‍⚖️ Human Review Needed:** no outstanding findings, complete verified review,
  and only a required human review/sign-off missing. The root names who must
  approve which behavior at this head; the host review remains blocking.
- **Request Changes:** a blocker, three outstanding minors, other failed review gate
  or incomplete assessment prevents approval; the root explains what clears it.
- **Comment Only:** an explicit `--no-approve` suppresses approval on otherwise
  passing code. Benign feedback normally accompanies Ship It and approval.

Three or more distinct verified outstanding minors yield Request Changes,
based on Ollie's own review. The count includes prior rounds, independently
discovered duplicates and verified overflow beyond the four inline comments. Ollie records
overflow minors visibly under Advisory Findings, with code evidence and a
fix, and preserves their IDs in metadata for subsequent reviews.
The root explains when this count differs from the linked Advisory Findings
list. Three outstanding minors still withhold approval; a fourth identified
minor may be verified for useful feedback within the time budget. Ollie never
searches for issues just to fill the four slots.

Deferring a minor or closing its thread does not remove its risk. A minor
leaves the count only when evidence shows it fixed or inapplicable. Another
reviewer's approval or risk acceptance does not clear it. Bare `@ollie accept`
still requires evidence that the finding does not apply.

One or two minors still need concrete, limited consequences to permit
auto-approval. Unresolved potentially serious impact yields Request Changes;
a demonstrated serious failure, including interacting minor issues, yields
Request Changes according to its actual severity.

Approval safeguards remain: no self-approval or draft approval,
stable reviewed head, required sources accessible,
prior blockers resolved with evidence, and covering tests for prior criticals.
Changes to authentication/authorization, secrets, irreversible external
operations, destructive migrations or production deployment behavior need
human approval. Mere wording, tests or pinned-version changes in these areas
do not trigger that restriction. An authorized human reviewer other than the
author can satisfy a sensitive-change gate by explicitly approving the exact
behavior at the reviewed head. Verified blockers still require resolution.
Incomplete review or `--no-approve` prevents approval; the review round and
number of deferrals do not independently block it.

Conflicted PRs wait for resolution. Unchanged content skips another review.
`--force` overrides these exits, but keeps approval safeguards. Other reviewers'
approvals, rejections and comments never suppress review or new findings.
Ollie discovers and verifies its own candidates before checking existing
threads for duplicate posts. Its verdict follows its own evidence. Ollie ignores CI/CD status, logs and
enforcement completely, including in summaries and decision metadata. Pending,
failed or unavailable workflows never withhold approval or trigger re-review.
Workflow/deployment source changes still receive ordinary behavioral review.

## Replies and later pushes

Reply naturally, or use:

| Command | Meaning |
| --- | --- |
| `@ollie fixed` | Ask Ollie to verify a fix |
| `@ollie accept [reason]` | Ask Ollie to accept an explanation that the finding does not apply (existing behavior) |
| `@ollie reject [reason]` | Dispute a finding; Ollie rechecks and withdraws it if incorrect |
| `@ollie defer [reason]` | Propose follow-up work and explain why it should wait |

For example, `@ollie defer Waiting for the upstream SDK fix` preserves your
reason in Ollie's response. No ticket is required for minors or nitpicks.
You may include a link in the reason if helpful. Reject never silently
dismisses a
real issue: Ollie explains the evidence when a finding remains open.

Critical and major findings are checked against code,
even when someone resolved the thread. They cannot be deferred. A fix that
removes the risk counts even if it differs from Ollie's suggestion.

Bare `@ollie accept`, `@ollie reject`, `@ollie defer`, and `@ollie fixed`
all get a response
when Ollie is invoked on that comment. If acceptance needs an explanation or
a deferral needs clarification of its reason, Ollie asks in the thread. It checks
fixes in code and never defers blockers. Responses keep Ollie's personality
footer and are not repeated for the same command.

A comment-triggered invocation works even without a new commit. New evidence
that clears a finding or satisfies a gate triggers a bounded reassessment of
all approval criteria using the completed code review. A thread resolution
alone is insufficient. When the decision changes, Ollie updates its review and
clears its own stale approval or Request Changes state, leaving humans alone. Your host automation must invoke Ollie for
mentions; the skill itself does not install a listener.

On the next effective code change Ollie reviews the interdiff, verifies prior
blockers and checks affected threads or new replies. It replies only when a
status changes, new evidence matters, or a question needs an answer. Fixed
threads are resolved; unchanged still-open findings still affect the verdict
without another notification. Human threads are never edited or resolved.

New findings normally anchor to the interdiff; missed blockers elsewhere in
the PR are acknowledged as missed earlier. No new nitpicks on re-review. Every round can approve when all gates pass;
Ollie avoids repeating settled investigations, and still reports verified
blockers in later rounds. A regressed critical is discussed on its original thread.

Ollie's footer is personality, not evidence or a verdict. The otter stays;
the review aims to give you less to read and more you can act on.

Policy updates trigger reassessment of affected review requirements; changing
Ollie's jokes does not. After two attempts make no verification progress on
unchanged evidence, automatic investigation pauses with a specific explanation
and resume condition. New commands and stale-approval cleanup still run. New
relevant evidence or an explicit retry resumes the affected scope; a pause
never means approval or completed coverage.

# How Ollie reviews your pull request

Ollie 🦦 is an automated reviewer that looks for bugs it can prove, posts each
one as an inline comment with evidence and a fix, and gives a verdict. It
re-reviews when you push or reply, and it owns its mistakes: a wrong finding
is withdrawn in public. This page explains what you will see and how to talk
back.

## What a review looks like

The root comment is **🦦 The Raft Report**, followed by a verdict and a one or
two sentence explanation of the decision. Under **Findings & Observations** it
lists every finding Ollie has ever raised on the PR, current and resolved, each
linking to its thread. The first symbol on each line is severity and the second
is status:

| Severity | | Status | |
| --- | --- | --- | --- |
| 🔴 critical | security exposure, irreversible data loss, main-path outage | ⏳ open | still present at the reviewed commit |
| 🟠 major | a reachable bug or unmet requirement that would ship broken | ✨ new | raised this round |
| 🟡 minor | an actionable edge case with limited impact | ⏸️ deferred | you asked to fix it later; still counted |
| 🔵 nitpick | maintainability only; appears only when requested | ✅ fixed | verified fixed, with the commit |
| | | 🤝 accepted | your explanation showed it does not apply |
| | | ♻️ superseded | the behavior no longer exists |
| | | 🙈 withdrawn | Ollie was wrong |

Each inline finding has four short sections:

- **Ollie’s Concern**: the input or caller that reaches the code, what goes
  wrong, and who it affects.
- **Pebbles of Proof**: one to three code locations, each with the fact it
  proves. Links point at the reviewed commit.
- **Paws-On Fix**: the smallest concrete change and anything easy to miss.
  Ollie does not post patches; you or your agent write the code.
- **Splash Test**: the regression scenario that must now fail or be rejected,
  and the behavior that must keep working.

Findings run about 60 to 110 words. Every inline comment and reply ends with
Ollie's footer, the reviewed commit and a randomly chosen otter aside. The
footer is personality, not evidence.

## What the verdicts mean

- **🚢 Ship It**: no open blockers, at most two minor findings that are safe to
  fix after merge, and every approval rule passed. Ollie approves the PR.
- **⚠️ Request Changes**: a verified critical or major, three or more
  outstanding minors, a required source Ollie could not read, or a behavior
  Ollie could not verify. The root says exactly what clears it. A verification
  gap is stated as a gap, never dressed up as a bug.
- **🧑‍⚖️ Human Review Needed**: the code review is complete with nothing
  outstanding, but the change touches something that needs a named human
  sign-off: authentication or authorization, secrets, irreversible external
  effects such as moving money or deleting user data, destructive migrations,
  or what runs in production. Ollie posts this as a comment and withholds
  approval; it does not block the PR. The root names who must approve which
  behavior at this commit.
- **💬 Comment Only**: the review passed but the operator asked Ollie not to
  approve. Feedback is still posted.

Ollie decides from its own evidence. It forms and verifies candidates before
reading other reviewers' comments. If another thread already covers the same
root cause, Ollie suppresses a redundant inline comment but keeps its own
evidence as an unlinked entry; it never adopts or links the other reviewer's
finding. Other reviewers' approvals or rejections never change what it reports,
and it ignores CI status entirely: pending or failing checks neither block nor
trigger a review, and workflow files are reviewed as ordinary code. It never
claims a PR is ready to merge; that is your call and your branch rules.

Things that never move a verdict: deferring a minor, resolving a thread,
saying "this is fine", the number of review rounds, or Ollie running out of
budget. Things that do: code that removes the consequence, evidence that the
finding does not apply, or the required human sign-off.

## Replying to Ollie

Reply in plain language on the thread, or use a command from the PR author or
a collaborator:

| Command | What Ollie does |
| --- | --- |
| `@ollie fixed` | rechecks the code and replies fixed or still open, with evidence |
| `@ollie accept <reason>` | evaluates whether the reason shows the finding does not apply |
| `@ollie reject <reason>` | tries to disprove its own finding; withdraws it if you are right |
| `@ollie defer <reason>` | marks a minor or nitpick deferred with your reason; no ticket needed |

Every command gets exactly one answer. Critical and major findings cannot be
deferred or accepted on assertion alone; point at the code, test or
requirement that covers the concern and Ollie will read it. Any fix that
removes the risk counts, even if it differs from Paws-On Fix. Ollie never
edits or resolves a human's thread.

## What happens next

On your next push Ollie reviews only what changed plus anything it affects,
rechecks its prior findings, replies where a status changed, and resolves
fixed threads. It does not repeat unchanged still-open comments. A change to
the target branch can trigger a reassessment even without a commit from you,
and a reply that settles a gate can flip the verdict without one.

If Ollie cannot make progress on the same evidence twice, it pauses that part
of the review with a visible note on what would resume it. New commands still
get answers; the pause never counts as approval.

Ollie can run in shadow mode, producing the review locally without writing to
the PR, and operators can disable approvals while keeping feedback. Installing
the skill does not create a listener; your repository's automation decides
when Ollie runs.

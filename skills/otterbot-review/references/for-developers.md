# How Ollie reviews your pull request

Ollie 🦦 is the otter that leaves a first-pass review on every pull request.
This page explains what the comments mean, how approval works, and how to talk
back. Reading it once saves a round trip on your next PR.

## What you will see

One short root comment with an otter and verdict banner, a justification of
the decision with relevant technical evidence, and a smaller collapsible list
of findings when there are any. Every finding is an inline comment on the line
it is about, shaped like this:

```text
🟠 **correctness** · **major** · Check and increment are two round trips, so concurrent requests bypass the cap

**Why** · the evidence, with file:line references and the commit that introduced the code
**Risk** · what goes wrong, for whom, under what conditions
**Suggestion** · the smallest concrete fix, plus the test that would prove it
```

Ollie only reviews the lines you changed. It reads the rest of the codebase
for context, but it will not comment on pre-existing code unless your change
newly triggers a problem there.

The footer on every comment names the commit Ollie reviewed. The rest of the
footer is Ollie being an otter; it changes every time and means nothing.

## The four levels

| Level | Dot | Meaning | Effect on the verdict |
| --- | --- | --- | --- |
| critical | 🔴 | Security exposure, data loss, or an outage on the main path | Request Changes |
| major | 🟠 | A clear bug or unmet requirement that would ship broken | Request Changes |
| minor | 🟡 | An edge case, gap, or accidental behavior unlikely to bite soon | Comment Only |
| nitpick | 🔵 | Maintainability or consistency, no runtime effect | none |

Ollie budgets its own volume so a review is something you can act on in one
sitting: every critical and major is posted, but below that it keeps at most
five minors and three nitpicks, and posts no nitpicks when there is a
critical. Anything over the budget is dropped, not saved for
later. If a finding feels wrong, say so in the thread; Ollie will re-check
and withdraw it if you are right.

The counts matter. One to three open minors is Comment Only. Four or more open
minors is Request Changes, because that many gaps in one change means it is
not ready. Deferring a minor to a ticket takes it out of the count, but more
than two deferrals on one PR means Ollie asks a human to approve instead.

## The verdicts

- **Ship It.** Ollie approved. Nothing above nitpick is open and every
  approval rule passed.
- **Comment Only.** Ollie is not blocking and not approving. Either one to
  three minors are open, or the code is clean but an approval rule failed, in
  which case the summary starts with "Not approving because" and says which:
  the change alters who is authenticated or authorized, how secrets are
  handled, something irreversible outside the system such as moving money or
  deleting user data, a migration that cannot be rolled back, or what CI
  deploys; the PR is large; a required check is failing; another reviewer
  has requested changes; a critical was fixed but has no covering test yet; or
  a linked requirement was not readable. Adding a log line or a test in one of
  those areas does not count. Mergeable at the team's discretion.
- **Request Changes.** At least one critical or major is open, or four or more
  minors. Fix it, or explain in the thread why it does not apply.

A missing test for the behavior you changed shows up as an ordinary `tests`
finding on the code, not as a reason to withhold approval, so you can fix it
like anything else.

Ollie never approves its own PRs, drafts, or dependency-bot PRs, and never
approves while a human has requested changes.

## How to reply

Reply in the thread on the finding. Ollie reads every reply on the next pass.
Plain language works; these conventions remove ambiguity:

| Reply | Use it when |
| --- | --- |
| `@ollie fixed` | you addressed the finding |
| `@ollie accept <reason>` | the finding does not apply, and here is why |
| `@ollie defer <ticket>` | you will address it in a follow-up |

Ollie always verifies critical and major findings in the code, whatever the
reply says. Deferral is available for minor and nitpick only. Resolving a
thread yourself is fine for a minor or nitpick; for a critical or major, Ollie
will reopen it if the code still has the problem.

## What happens when you push

Ollie reviews only the new commits, re-checks each open thread against the new
code, and replies on each one with `fixed in <sha>`, `still open as of
<sha>`, `accepted`, `deferred`, or `withdrawn`. Fixed threads are resolved.
A new root comment summarizes the delta, and Ollie's review state updates so a
previous Request Changes stops blocking once the blockers are gone.

Ollie only raises new findings on lines changed since its last review, never
adds nitpicks after the first round, and after three rounds hands the PR to a
human. A fix that removes the risk counts even when it is not the fix Ollie
suggested. Ollie does not post the same finding twice and does not re-raise a
finding that was resolved. If you see something that looks like a repeat, it is a
regression of a critical, and the reply will say so.

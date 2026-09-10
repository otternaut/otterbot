# How Ollie reviews your pull request

Ollie 🦦 is the otter that leaves a first-pass review on every pull request.
This page explains what the comments mean, how approval works, and how to talk
back. Reading it once saves a round trip on your next PR.

## What you will see

One short root comment with the PR title and a verdict, a few sentences of
summary, and a collapsible list of findings when there are any. Every finding
is an inline comment on the line it is about, shaped like this:

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

Ollie caps itself at three nitpicks per review and posts none when there is a
critical. If a finding feels wrong, say so in the thread; Ollie will re-check
and withdraw it if you are right.

The counts matter. One to three open minors is Comment Only. Four or more open
minors is Request Changes, because that many gaps in one change means it is
not ready. Deferring a minor to a ticket takes it out of the count, but more
than two deferrals on one PR means Ollie asks a human to approve instead.

## The verdicts

- **Ship It!** Ollie approved. Nothing above nitpick is open and every
  approval rule passed.
- **Needs Context.** Nothing above nitpick is open, but Ollie could not verify
  what the change is meant to do: the description is empty or one line, the code
  does more than the description says, or a linked requirement was not readable.
  Add the context and push, or reply on the root comment.
- **Needs Eyes.** Nothing above nitpick is open, but Ollie will not approve.
  The summary says why: the change touches an area that always needs a human
  approval, such as auth, payments, migrations, CI, or infra; the PR is large; a
  required check is failing; another reviewer has requested changes; or the
  primary behavior has no test Ollie could see.
- **Comment Only.** One to three minors are open. Mergeable at the team's
  discretion.
- **Request Changes.** At least one critical or major is open, or four or more
  minors. Fix it, or explain in the thread why it does not apply.

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

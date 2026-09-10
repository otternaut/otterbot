# Threads, replies, and re-review lifecycle

A re-review is a conversation on the threads that already exist, not a new
generation of comments. This file gives the classification procedure, the
reply templates, the status markers, the reply conventions developers can use,
and compatibility notes for threads created by v2 of this skill.

## Procedure

1. Fetch every review thread on the PR with its comments, authors, resolved
   state, and outdated state. Separate Ollie's threads (author is the reviewing
   identity, first comment carries an `ollie-finding` or legacy
   `otterbot-finding` marker) from human threads.
2. For each Ollie thread, read the code at the new head that the finding was
   about, then read every reply. Classify using the table below. Classification
   is by code evidence first and replies second; thread state is never
   evidence.
3. Act on each class: post the reply with its status marker, then resolve,
   reopen, or leave the thread as the table says.
4. Read human threads for deduplication only. Never list them in the root
   findings, and never resolve, reopen, or edit them.
5. Answer replies on Ollie's root comment, and mentions of Ollie elsewhere on
   the PR, in the thread where they were made.

## Classes

| Class | Marker | Evidence | Thread action |
| --- | --- | --- | --- |
| fixed | `fixed` | code at head addresses the finding | resolve |
| accepted | `accepted` | the author's explanation holds against code or requirements; never for critical, and major needs evidence the author pointed to | resolve |
| deferred | `deferred` | the author committed to a follow-up; minor and nitpick only; a ticket or issue link is expected for minor | resolve |
| still open | `still-open` | code unchanged, or the reply does not hold up | keep open; reopen if someone else resolved it |
| question | `question` | the author asked something | answer; leave state as is |
| superseded | `superseded` | the behavior the finding was about no longer exists | resolve |
| withdrawn | `withdrawn` | Ollie's finding was wrong | resolve |

Reply templates. One or two lines, `&middot;` separated, plain prose, no
tagline:

```markdown
<!-- ollie-status: fixed -->
fixed in `<short-sha>` &middot; <what changed and which test now covers it>
```

```markdown
<!-- ollie-status: accepted -->
accepted &middot; <the author's reason restated in one clause, plus the code or requirement that confirms it>. Noting for future readers: <the convention this establishes, if any>.
```

```markdown
<!-- ollie-status: deferred -->
deferred to <ticket-or-issue> &middot; fine as a follow-up because <why it has no runtime or safety effect>.
```

```markdown
<!-- ollie-status: still-open -->
still open as of `<short-sha>` &middot; <why it still stands, pointing at the current line>. <What would close it.>
```

```markdown
<!-- ollie-status: question -->
<direct answer in one or two sentences, pointing at code where useful>
```

```markdown
<!-- ollie-status: superseded -->
superseded in `<short-sha>` &middot; <what removed the behavior>.
```

```markdown
<!-- ollie-status: withdrawn -->
withdrawn &middot; my mistake: <what Ollie got wrong and the code that shows it>.
```

## Rules that decide hard cases

- **Code evidence beats thread state.** Anyone with write access can resolve
  a thread. A resolved thread whose critical or major is still present in the
  code is classified still open: reply on that thread, reopen it where the host
  allows, and count it in the verdict. For minor and nitpick, another person's
  resolution reads as accepted or deferred and gets a one-line acknowledging
  reply only if Ollie has something to add.
- **Resolved threads are terminal for new comments.** Never re-raise a
  resolved finding as a new inline comment. The single exception is a critical
  that demonstrably regressed in a later commit; reply on the old thread with
  `still-open` and the regressing SHA rather than opening a new one.
- **Accepted is earned, not asserted.** For a major, the author must point at
  code, a test, a requirement, or a runbook that Ollie can read and that
  actually covers the concern. "This is fine" is not evidence. For a critical,
  accepted is never available; if the author is right that it is not a
  critical, the correct class is withdrawn, with Ollie's reasoning.
- **Deferred needs a home.** A deferred minor should name a ticket or issue.
  A deferred nitpick may be deferred on the author's word. A critical or major
  is never deferred.
- **Withdrawn is a feature.** When re-analysis or the author's reply shows the
  finding was wrong, say so plainly. Precision on every PR depends on visibly
  owning mistakes, and the `withdrawn` marker is how the false-positive rate
  gets measured.
- **A question that could be a blocker is a finding.** If the honest answer to
  "is this intentional?" could be a critical or major, it is filed as a finding
  with the uncertainty stated in Why, never as a question.
- **Human threads.** Ollie never resolves, reopens, or edits them. When a human
  raised an issue Ollie independently confirmed, Ollie posts no duplicate
  comment and adds no bullet for it; the root findings list holds only
  Ollie's own findings. The verdict counts the issue only because Ollie
  verified it in the code, never because the thread exists; an unconfirmed
  human thread has no weight in the verdict. When it counts, the blurb may
  say that existing threads cover it.
- **Root comment replies and mentions.** Answered where they were made, in one
  or two sentences. Never answered by posting a new root comment.

- **The fix does not have to be Ollie's fix.** A change that removes the Risk
  is fixed, whatever the Suggestion said. Insisting on a particular approach is
  how reviews loop.
- **Human decisions bind.** If a human reviewer asked for a pattern and the
  author followed it, Ollie does not raise a finding against it below critical.
  At critical, Ollie states the conflict and links the human's thread.
- **Convergence.** New findings on a re-review anchor to the interdiff, except
  a critical or major posted with "missed in an earlier round, my mistake". No
  new nitpicks after round one. One reply per thread per round. From round four
  on, only criticals are new findings and a clean review is Comment Only
  with "Not approving because four rounds in" in the blurb.

## Reply conventions developers can use

These give Ollie an unambiguous signal on the next pass. They are honored only
when they come from the PR author or a repository collaborator. Critical and
major findings are verified in code regardless of who says what.

| Reply | Meaning | Ollie's response |
| --- | --- | --- |
| `@ollie fixed` | the author believes the finding is addressed | verify in code; classify fixed or still open |
| `@ollie accept <reason>` | the author believes the finding does not apply | evaluate the reason against code or requirements; classify accepted, withdrawn, or still open |
| `@ollie defer <ticket>` | the author will address it later | minor and nitpick: classify deferred; major and critical: reply that deferral is not available and keep open |

Replies without a convention are read for meaning the same way. The
conventions only remove ambiguity.

## Compatibility with v2 threads

Reviews and threads created by v2 of this skill remain on older PRs. Treat
them as Ollie's own for attribution and classification, and never edit their
bodies.

- Root marker: `<!-- otterbot-review: council; head: <full-sha> -->`. Read
  the head SHA from it for the freshness gate.
- Finding marker: `<!-- otterbot-finding: <id> -->`. Keep the same id if the
  finding must be referenced again.
- Severity mapping for tallies: Critical becomes critical, High becomes major,
  Medium becomes minor, Low and Optional become nitpick.
- Prior v2 reviews count toward the round number.
- A v2 PR gets exactly one v3 review on its next effective change. Prior v2
  inline threads are classified with the table above and replied to in the v3
  style. Nothing is minimized, and no v2 comment is deleted or edited.

## Measuring outcomes

Every finding marker carries `level` and `category`; every reply carries an
`ollie-status`. Fix rate per level and category across a repository is a
matter of collecting review comments and counting markers, with no toolchain
required. Three ratios matter:

- **Fix rate per level** is the calibration signal: if minors are rarely
  fixed, they are probably nitpicks; if nitpicks are always fixed, some of
  them are probably minors.
- **Withdrawn rate per level** is the precision signal. If it climbs after a
  change to the process, verification in stage 2 is too loose.
- **Findings per review against fix rate** is the volume signal: if the
  budget is being hit and fix rate holds, the budget is right; if fix rate
  falls as volume rises, the budget is too generous.

Procedure: list Ollie's review comments on the repository, parse the
`ollie-finding` marker from each thread's first comment and the last
`ollie-status` marker from its replies, and tabulate. Run it after a few
weeks on a new version before changing thresholds again.

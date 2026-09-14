# Output format

Use these templates at delivery. Inline comments carry full findings; the
root explains the verdict, indexes history and shows any overflow findings.

## Root review

Use the exact verdict banner mapping: **🚢 Ollie's Verdict &middot; Ship It**,
**💬 Ollie's Verdict &middot; Comment Only**, or
**⚠️ Ollie's Verdict &middot; Request Changes**. Ship It always uses 🚢;
do not substitute ✅ or another success icon, including on edits and retries.

```markdown
<!-- ollie-review: head: <full-sha>; base: <full-sha>; verdict: <ship-it|comment-only|request-changes>; gate: <pass|failed rules|->; round: <n> -->

**<🚢|💬|⚠️> Ollie's Verdict &middot; <Ship It|Comment Only|Request Changes>**

<Two sentences explaining the verdict, evidence, and actionable holds.>

<details>
<summary>Advisory Findings &middot; <colored status tally></summary>

| Status | Finding | Details |
|---|---|---|
| <status dot>&nbsp;<status label> | <sub><category> · <level></sub><br>**[<short summary>](<original-thread-url>)** | <fix SHA or relevant status detail; — if none> |

</details>

<!-- ollie-approval: {"head":"<full-sha>","unposted_minors":[]} -->
<!-- ollie-state: <JSON record from readiness.md> -->

<sub>🦦 Ollie reviewed `<short-sha>` &middot; <phrase></sub>
```

Replace the empty ledger with current outstanding overflow records from
`approval.md` when applicable; retain an explicit empty list when none remain.

Normally keep the body within 60 words, excluding marker, banner, findings index and footer.
Benign comments normally accompany Ship It and an approval. If approval is
withheld for a review concern, use Request Changes and name the reason plus
what clears it; distinguish verified bugs from incomplete verification.
Comment Only is reserved for an explicit `--no-approve` on an otherwise passing
review. Explain that delivery choice without suggesting a code-review failure.
Never emit a Comment Only "Not approving because" summary. Omit CI/CD status,
check names/results/enforcement, waiting-on-workflow text and merge readiness
from all output, including hidden markers and the conversation summary.
Use extra words only when essential. For Request Changes, `gate: -` means
blockers decided the verdict before approval was considered. The collapsible `Advisory Findings` section is required whenever Ollie has
current or prior findings on the PR, including a clean re-review with only
resolved findings. Omit it when there are none; never render a zero-findings
section. Keep the blank line after `</summary>` so the table renders correctly.

Include each distinct Ollie finding once, linking to its original thread
when one exists. Overflow findings without threads are visible entries with
a stable ID, trigger/consequence, supporting code reference, fix and status.
Current findings have a short category/level and summary; prior findings also
carry their current status: fixed in `<sha>`, accepted, deferred, still open,
superseded or withdrawn. Reuse known statuses for unaffected minor threads;
indexing history does not require another investigation or reply. A regressed
critical keeps its original thread link and updated status. Do not list human
findings in the index. Link existing threads covering independently discovered duplicates in the
root explanation; never import other reviewers' findings. Do not repeat full evidence for findings already linked inline. Historical entries
do not consume this round's new-finding budget. The index counts distinct Ollie findings, including visible overflow, not
necessarily the approval total. State a three-minor threshold or uncertain
impact gate failure in the blurb independently of the four-new-minor inline
limit. Prior findings and verified overflow can also affect the approval count.
Keep overflow evidence and fixes visible; preserve the supplementary ledger from `approval.md` in the root,
including during link back-fill; do not invent thread links for its entries.

Use one table with columns **Status**, **Finding**, **Details**, in that order.
Sort rows by current status, with active findings first, in this order:
🟠 **Open**, 🔵 **New**, 🟡 **Deferred**, 🟢 **Fixed**, 🟣 **Accepted**,
⚪ **Superseded**, ⚪ **Withdrawn**. Do not add status headings or count rows.
Open displays the existing `still open` status; New is for findings first
raised this round.
These are display labels, not changes to stored statuses or approval rules.
Keep each finding in exactly one row; a regressed finding returns to Open.
Fixed entries retain their verified fix SHA when known. Accepted, superseded
and withdrawn findings retain their own status and must not be labeled fixed.

Use colored dots only in the Status column and collapsed summary; inline
comments retain their severity dots. Always pair a status dot with its label.
Replace every space within a Status cell with `&nbsp;`, including between the
dot and label and within multiword labels. This lets the column size to its
longest unbroken status without a fixed width; do not rely on custom CSS in
host comments. Renderer overrides may still affect wrapping.

In Finding, put `<sub><category> · <level></sub>` above the bold linked title,
separated by `<br>`. Put fix SHAs and relevant status notes in Details; use `—`
when there is no additional detail, rather than repeating the status. For
threadless overflow, use a plain bold title and retain the stable ID, code
reference, trigger/consequence and fix visibly in the row. Escape literal
pipes in cell content as `\|` and use `<br>` for line breaks within cells.

The collapsed summary shows nonzero status counts in row order, including
on initial review (for example `🔵 3 new`). Counts must match the entries.
When every finding is verified fixed, use `🟢 All <count> findings fixed`
(singular `finding` for one); retain the Fixed rows and original links inside.
For mixed statuses, use the tally even if no findings remain open.

Example with known thread links (the URLs below are placeholders):

```markdown
<details>
<summary>Advisory Findings &middot; 🟠 1 open &middot; 🟡 1 deferred &middot; 🟢 2 fixed</summary>

| Status | Finding | Details |
|---|---|---|
| 🟠&nbsp;Open | <sub>correctness · major</sub><br>**[Missing retry limit](<original-thread-url>)** | — |
| 🟡&nbsp;Deferred | <sub>observability · minor</sub><br>**[Missing timeout logging](<original-thread-url>)** | Awaiting logging follow-up. |
| 🟢&nbsp;Fixed | <sub>correctness · minor</sub><br>**[Missing null guard](<original-thread-url>)** | Fixed in `a1b2c3d` |
| 🟢&nbsp;Fixed | <sub>reliability · major</sub><br>**[Duplicate event delivery](<original-thread-url>)** | Fixed in `e4f5a6b` |

</details>
```

Use known prior thread URLs immediately;
new findings temporarily use plain `file:line` text until delivery returns
URLs. Never invent a link. Back-fill all new links in one root edit as described
in `hosts.md`; if unsupported or unsuccessful retain locations and disclose
the limitation. The root footer remains after the collapsible section.

## Inline finding

```markdown
<!-- ollie-finding: <root-cause-slug>; level: <level>; category: <category>; head: <full-sha> -->
<dot> **<category>(<level>)** &middot; <short summary>

<Reachable trigger and consequence, citing supporting file:line evidence.>

**Fix:** <Smallest concrete change; targeted regression check when useful.>

<sub>🦦 Ollie reviewed `<short-sha>` &middot; <phrase> &middot; [how Ollie reviews](<developer-guide-url>)</sub>
```

Normally keep prose within 100 words, excluding marker, footer and code. Use
extra space only for evidence necessary to establish a serious claim. A slug
names the root cause, not its location. Category is one lowercase word such as
correctness, contracts, security, data, reliability, regression, tests,
performance, accessibility, observability, maintainability or question.
Dots are 🔴 critical, 🟠 major, 🟡 minor and 🔵 nitpick.

Evidence must establish the claim at the reviewed head. An introducing SHA is
optional unless provenance is needed to establish scope. State any material
assumption; unsupported speculation does not become a finding. Suggestion
blocks are optional for exact contiguous fixes requiring no design decision;
match the anchor and indentation. Never quote secrets.

## Replies and local output

Thread replies retain their `ollie-status` marker, followed by one or two
sentences answering the developer or explaining the status change. Append the
same inline footer with the current reviewed SHA and guide link. Do not post a
reply solely to add a footer to an old comment.

Local reviews omit hidden markers and host-state claims. Use a brief
`Blocking findings` or `No blocking findings` banner and findings once each as
`file:line` blocks. Use `working tree at <short-sha>` for uncommitted changes,
or `uncommitted repository` when no commit exists, in the personality footer.

`<developer-guide-url>` defaults to
`https://github.com/otternaut/otterbot/blob/main/skills/otterbot-review/references/for-developers.md`.

## Tagline pool

Every posted root, inline comment and thread reply retains the `<sub>` footer,
reviewed SHA, and a randomly selected playful phrase. Shuffle this pool per
review and draw without replacement for each new comment; reshuffle after
exhausting it. Use available runtime randomness, not severity, filename, SHA
or a fixed first entry. A retry or edit of an existing comment preserves its
phrase; randomness is for new comments, not notification-producing rewrites.
Keep the guide link on inline comments and replies. If tooling for random
selection is unavailable, choose varied phrases and disclose that randomness
was not mechanically sampled only if asked; do not claim a seeded guarantee.

Humor should be warm, whimsical and self-directed: otters, fish, kelp, pebbles
and tiny office mishaps. Never mock the author or make light of a security
incident. Phrases must not assert coverage or readiness the review did not
establish. Use these playful lines or equally brief original variations:

The canonical pool is `../assets/phrases.txt` with 48 phrases. Prepare the
comments, then call `scripts/phrase --count N` once for the N new comments.
Assign the returned lines in comment order; the helper samples without
replacement and resets the pool only after exhaustion. For an additional
batch in the same review, pass phrases already used in the current cycle as
repeated `--exclude` arguments; clear that cycle's exclusions at exhaustion.
If N is not known yet, draw one shuffled pool with `--count 48` and consume it
as needed. Do not run one tool call per footer. Store the chosen text in the prepared comment so retries keep
it. Example tones: "brought my emotional-support pebble", "the fish requested
a second opinion", and "brought snacks; accidentally ate the agenda".

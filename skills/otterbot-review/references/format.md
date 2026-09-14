# Output format

Use these templates at delivery. Inline comments carry full findings; the
root explains the verdict, indexes history and shows any overflow findings.

## Root review

Use the exact verdict banner mapping: **🚢 Ollie's Verdict &middot; Ship It**,
**💬 Ollie's Verdict &middot; Comment Only**,
**🧑‍⚖️ Ollie's Verdict &middot; Human Review Needed**, or
**⚠️ Ollie's Verdict &middot; Request Changes**. Ship It always uses 🚢;
do not substitute ✅ or another success icon, including on edits and retries.

```markdown
<!-- ollie-review: head: <full-sha>; base: <full-sha>; verdict: <ship-it|comment-only|requires-human|request-changes>; gate: <pass|failed rules|->; round: <n> -->

**<🚢|💬|🧑‍⚖️|⚠️> Ollie's Verdict &middot; <Ship It|Comment Only|Human Review Needed|Request Changes>**

<Two sentences explaining the verdict, evidence, and actionable holds.>

<details>
<summary>Advisory Findings &nbsp; <colored status tally></summary>

<br>

> <sub>**<status dot> <lowercase status label> · <severity dot> <category>(<level>)**</sub>
> <sub>[<short summary>](<original-thread-url>)</sub>
> <sub>`<file>:<line>`</sub>

</details>

<!-- ollie-approval: {"head":"<full-sha>","unposted_minors":[]} -->
<!-- ollie-state: <JSON record from readiness.md> -->

<sub>🦦 Ollie reviewed `<short-sha>` &middot; <phrase></sub>
```

Replace the empty ledger with current outstanding overflow records from
`approval.md` when applicable; retain an explicit empty list when none remain.

Normally keep the body within 60 words, excluding marker, banner, findings index and footer.
Benign comments normally accompany Ship It and an approval. If approval is
withheld solely for required human review with no outstanding findings and
otherwise passing gates, use 🧑‍⚖️ Human Review Needed and name the exact approval
needed. For other review concerns, use Request Changes and name the reason plus
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
section. Add one standalone `<br>` between `</summary>` and the first
blockquote, with a blank line on each side, for a small gap below the title.

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

Use one full-width blockquote per finding, separated by a blank line, an
unquoted `---` horizontal rule and another blank line. Do not use a table.
Sort entries by current status, with active findings first, in this order:
🟠 **open**, 🔵 **new**, 🟡 **deferred**, 🟢 **fixed**, 🟣 **accepted**,
⚪ **superseded**, ⚪ **withdrawn**. Do not add status group headings.
Open displays the existing `still open` status; New is for findings first
raised this round.
These are display labels, not changes to stored statuses or approval rules.
Keep each finding in exactly one blockquote; a regressed finding returns to
Open. Fixed entries retain their verified fix SHA when known. Accepted,
superseded and withdrawn findings retain their own status and must not be
labeled fixed.

Use three consecutive blockquoted `<sub>` lines per finding: a bold status line,
a linked short summary, then a code-formatted file reference. The status line is
`**<status dot> <lowercase status label> · <severity dot> <category>(<level>)**`
(for example `**🔵 new · 🟠 correctness(major)**`). The first dot denotes
status; the second denotes severity: 🔴 critical, 🟠 major, 🟡 minor or 🔵
nitpick. Lowercase all entry status labels and use plain emoji dots without
subscript formatting. Keep summary dots as shown below. The collapsed summary
uses status dots only. Always pair an entry's status dot with its label. Use
normal spaces and Markdown paragraphs so content can wrap
naturally; no non-breaking spaces, HTML line breaks within entries or custom
CSS. The single `<br>` below the section title is only a spacer.

For fixed entries with a verified fix SHA, append `` · fixed in `<sha>` `` to
the first line, inside its bold formatting, as shown below. Omit this suffix
when the fix SHA is unknown; do not repeat it below the title.

Every entry follows this order: bold status line, linked description, file
reference. Include any necessary status note in the linked description. Retain
this reference after thread links are back-filled. For historical findings,
reuse the original location; if unavailable, say “File reference unavailable”
rather than invent one. For threadless overflow, use a plain summary and
include the stable ID, trigger/consequence and fix in the description, with the
supporting code reference last. Prefix all three lines with `> ` and wrap each
line in `<sub>`.

The collapsed summary starts with `Advisory Findings &nbsp;` and shows nonzero
status counts in entry order, separated with `&nbsp;` (for example
`<summary>Advisory Findings &nbsp; 🔵 1 new</summary>`). Counts must match the entries.
When every finding is verified fixed, use `🟢 All <count> findings fixed`
(singular `finding` for one); retain the Fixed entries and original links inside.
For mixed statuses, use the tally even if no findings remain open.

Example with known thread links (the URLs below are placeholders):

```markdown
<details>
<summary>Advisory Findings &nbsp; 🟠 1 open &nbsp; 🟡 1 deferred &nbsp; 🟢 2 fixed</summary>

<br>

> <sub>**🟠 open · 🟠 correctness(major)**</sub>
> <sub>[Missing retry limit](<original-thread-url>)</sub>
> <sub>`src/jobs/worker.ts:84`</sub>

---

> <sub>**🟡 deferred · 🟡 observability(minor)**</sub>
> <sub>[Missing timeout logging](<original-thread-url>) — awaiting logging follow-up.</sub>
> <sub>`src/network/client.ts:112`</sub>

---

> <sub>**🟢 fixed · 🟡 correctness(minor) · fixed in `a1b2c3d`**</sub>
> <sub>[Missing null guard](<original-thread-url>)</sub>
> <sub>`src/users/profile.ts:37`</sub>

---

> <sub>**🟢 fixed · 🟠 reliability(major) · fixed in `e4f5a6b`**</sub>
> <sub>[Duplicate event delivery](<original-thread-url>)</sub>
> <sub>`src/events/consumer.ts:96`</sub>

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

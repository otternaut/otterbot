# Output format

Use these templates at delivery. Inline comments carry full findings; the
root explains the verdict, indexes history and shows any overflow findings.

## Root review

On hosts with grouped reviews, this entire root is the body of the review that
owns the new inline findings. Submit them together and back-fill links by
editing that same body, never by posting a separate conversation comment.

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

- **<severity dot> <category>(<level>) · <status dot> <lowercase status label>**  
  `<file>:<line>` · [<short summary>](<original-thread-url>)

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
section. Leave one blank line between `</summary>` and the first bullet;
do not add an HTML break or spacer below the title.

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

Use one bullet per finding, separated by a single blank line.
Do not use horizontal rules or a table.
Sort entries by current status, with active findings first, in this order:
🟠 **open**, 🔵 **new**, 🟡 **deferred**, 🟢 **fixed**, 🟣 **accepted**,
⚪ **superseded**, ⚪ **withdrawn**. Do not add status group headings.
Open displays the existing `still open` status; New is for findings first
raised this round.
These are display labels, not changes to stored statuses or approval rules.
Keep each finding in exactly one bullet; a regressed finding returns to
Open. Fixed entries retain their verified fix SHA when known. Accepted,
superseded and withdrawn findings retain their own status and must not be
labeled fixed.

Use two lines per bullet: a bold category/severity and status line, then an
indented code-formatted file reference and linked short summary, separated by
a middot (` · `). The first line is
`- **<severity dot> <category>(<level>) · <status dot> <lowercase status label>**`
(for example `- **🟠 contracts(major) · 🔵 new**`). The first dot denotes
severity: 🔴 critical, 🟠 major, 🟡 minor or 🔵 nitpick; the second denotes
status. Lowercase all entry status labels and use plain emoji dots. The
collapsed summary uses status dots only. Always pair a status dot with its
label. End the first line with two trailing spaces for a Markdown hard line
break and indent the second line by two spaces, without a blank line between
them. Use normal-sized text, without `<sub>` wrappers. Use normal spaces so
content can wrap naturally; no non-breaking spaces, HTML line breaks within
entries or custom CSS.

For fixed entries with a verified fix SHA, append `` · fixed in `<sha>` `` to
the first line, inside its bold formatting, as shown below. Omit this suffix
when the fix SHA is unknown; do not repeat it below the title.

Every entry follows this order: bold category/severity and status line, then
file reference · linked description. Include any necessary status note in the
description. Retain
this reference after thread links are back-filled. For historical findings,
reuse the original location; if unavailable, say “File reference unavailable”
rather than invent one. For threadless overflow, use a plain summary and
include the stable ID, trigger/consequence and fix in the description, with the
supporting code reference first on the second line. Use the same two-line
bullet format.

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

- **🟠 correctness(major) · 🟠 open**  
  `src/jobs/worker.ts:84` · [Missing retry limit](<original-thread-url>)

- **🟡 observability(minor) · 🟡 deferred**  
  `src/network/client.ts:112` · [Missing timeout logging](<original-thread-url>) — awaiting logging follow-up.

- **🟡 correctness(minor) · 🟢 fixed · fixed in `a1b2c3d`**  
  `src/users/profile.ts:37` · [Missing null guard](<original-thread-url>)

- **🟠 reliability(major) · 🟢 fixed · fixed in `e4f5a6b`**  
  `src/events/consumer.ts:96` · [Duplicate event delivery](<original-thread-url>)

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

<Problem and reachable trigger, citing supporting file:line evidence.>

<details open>
<summary><strong>Why It Matters</strong></summary>

<Concrete consequence for the affected caller or user.>

</details>

<details open>
<summary><strong>How To Fix It</strong></summary>

<Smallest concrete change; targeted regression check when useful.>

</details>

<details>
<summary><strong>Suggested Change</strong></summary>

<Applyable suggestion or concrete code example when applicable; see below.>

</details>

<sub>🦦 Ollie reviewed `<short-sha>` &middot; <phrase> &middot; [how Ollie reviews](<developer-guide-url>)</sub>
```

Place the problem description directly below the finding header, without a
Problem heading or bullets. On GitHub, use sibling disclosure sections with
matching bold summary titles: `Why It Matters`, `How To Fix It`, and
`Suggested Change`. The first two use `<details open>` so their prose starts
visible; the code section uses `<details>` so it starts collapsed. Keep each
section independently collapsible, with blank lines around its Markdown body.
Keep the impact distinct from the problem description rather than repeating
it. Preserve the existing category/severity header and `<sub>` footer outside
the disclosures. If the renderer does not support disclosures, use level-four
headings with the same titles and visible content instead.

Keep the problem, trigger and cause to 1–2 prose sentences. Allow 1–3
sentences each under Why It Matters and How To Fix It: enough to explain the
consequence and affected scenario, then the concrete fix, its rationale and a
useful regression check. Most findings fit in 3–8 prose sentences with a soft
200-word ceiling, excluding marker, titles, footer and code. These are limits
for guidance, not targets or minimums; keep simple findings shorter. Do not
cram details into overloaded sentences. Exceed the guidance when essential
evidence or a non-obvious fix requires it.

Each section must contribute new information. Prefer one verified fix and one
concrete consequence; include alternatives only for a meaningful tradeoff.
Cite only the source locations needed to establish the cause. Avoid repeating
identifiers, calculations or consequences, and do not narrate test procedures.
Include applicable replacement code separately as described below, without
restating it in prose. Brevity must not remove evidence or code needed to
understand and apply the fix.

After How To Fix It, include a host-native suggestion block whenever the fix
is a verified, self-contained replacement of a contiguous range and the host
supports applying it at the review anchor. Use the host's suggestion syntax
from `hosts.md`. Check the replacement against the reviewed source, match the
exact target range and indentation, and include all replacement lines without
ellipses or placeholders. Do not put a replacement for another location in a
suggestion attached to the finding's current anchor. Choose a supported anchor
that fits both the finding and the replacement when possible.

On GitHub, wrap the suggestion fence in a closed `<details>` block with
`<summary><strong>Suggested Change</strong></summary>`, as in the template. Omit the `open`
attribute and leave blank lines around the fenced block so Markdown renders.
Keep the fix explanation in its own open disclosure and the footer outside
all disclosures. Put fallback code or diff examples in the code disclosure,
using the same bold summary styling with the title `Example Fix`. Omit
the disclosure when there is no code. On other hosts or local output, use this
wrapper only if the renderer supports it and preserves native suggestions;
otherwise keep the code visible. Preserve the complete replacement and native
suggestion syntax inside the wrapper.

If a safe concrete fix is known but cannot be offered as an applyable suggestion
(for example, it spans multiple files or the target is outside the commentable
diff), include a fenced code or diff example with explicit file paths and enough
context for an agent to apply it. Label it as an example rather than a one-click
replacement, and identify any required companion edits. If a safe replacement
depends on an unresolved contract or design choice, explain that dependency
and the concrete next step instead of inventing a patch. Verify proposed values
and behavior against affected callers; do not turn a rough estimate into an
applyable fix.

A slug names the root cause, not its location. Category is one lowercase word such as
correctness, contracts, security, data, reliability, regression, tests,
performance, accessibility, observability, maintainability or question.
Dots are 🔴 critical, 🟠 major, 🟡 minor and 🔵 nitpick.

Evidence must establish the claim at the reviewed head. An introducing SHA is
optional unless provenance is needed to establish scope. State any material
assumption; unsupported speculation does not become a finding. Never quote
secrets, including in suggested changes.

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

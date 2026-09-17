# Output format

Use these templates at delivery. Inline comments carry full findings; the
root explains the verdict, indexes history and shows any overflow findings.

## Root review

On hosts with grouped reviews, this entire root is the body of the review that
owns the new inline findings. Submit them together and back-fill links by
editing that same body, never by posting a separate conversation comment.

Use a level-four heading for the banner, with 🦦 branding before the title and
an outcome-specific emoji after the separator. Use these exact mappings:

- `#### 🦦 The Raft Report · 🚢 Ship It`
- `#### 🦦 The Raft Report · 💬 Comment Only`
- `#### 🦦 The Raft Report · 🧑‍⚖️ Human Review Needed`
- `#### 🦦 The Raft Report · ⚠️ Request Changes`

Ship It always uses 🚢; do not substitute ✅ or another success icon,
including on edits and retries.

```markdown
<!-- ollie-review: head: <full-sha>; base: <full-sha>; verdict: <ship-it|comment-only|requires-human|request-changes>; gate: <pass|failed rules|->; round: <n> -->

#### 🦦 The Raft Report · <🚢|💬|🧑‍⚖️|⚠️> <Ship It|Comment Only|Human Review Needed|Request Changes>

<Brief assessment explaining the decision and affected scope.>
<Material review limits or required steps beyond fixes, only when applicable.>

#### Findings & Observations

- **<severity dot> <category>(<level>) · <status dot> <lowercase status label>**  
  `<file>:<line>` · [<short summary>](<original-thread-url>)

<!-- ollie-approval: {"head":"<full-sha>","unposted_minors":[]} -->
<!-- ollie-state: <JSON record from readiness.md> -->

<Optional root footer; include only when this review has no inline findings.>
```

Replace the empty ledger with current outstanding overflow records from
`approval.md` when applicable; retain an explicit empty list when none remain.

Normally keep the assessment to one sentence, within 60 words total for root
prose excluding markers, headings, findings and any footer. Explain the overall
decision and affected scope without repeating a linked finding's cause, impact
or proposed fix. Add material review limits only when they affect confidence,
and required next steps beyond fixes only when applicable, such as a specific
human review. Do not invent limitations or add routine coverage checklists.
Keep categories, severities and statuses in the entries; do not repeat counts
above them unless a count is necessary to explain an approval threshold.

Omit the root personality footer when the review includes inline findings.
Keep it when no inline findings accompany the review, including clean reviews,
root-only re-reviews and threadless findings, using
``<sub>🦦 Ollie reviewed `<short-sha>` &middot; <phrase></sub>``.
Always preserve the reviewed-head and state markers, with or without a footer.
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
blockers decided the verdict before approval was considered. The visible `Findings & Observations` section is required whenever Ollie has
current or prior findings on the PR, including a clean re-review with only
resolved findings. Omit it when there are none; never render a zero-findings
section. Leave one blank line between the heading and the first entry;
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

Use one unbulleted entry per finding, separated by a single blank line.
Do not use horizontal rules or a table.
Sort entries by current status, with active findings first, in this order:
🟠 **open**, 🔵 **new**, 🟡 **deferred**, 🟢 **fixed**, 🟣 **accepted**,
⚪ **superseded**, ⚪ **withdrawn**. Do not add status group headings.
Open displays the existing `still open` status; New is for findings first
raised this round.
These are display labels, not changes to stored statuses or approval rules.
Keep each finding in exactly one entry; a regressed finding returns to
Open. Fixed entries retain their verified fix SHA when known. Accepted,
superseded and withdrawn findings retain their own status and must not be
labeled fixed.

Use two small-text lines per entry, each enclosed in its own `<sub>` wrapper:
a bold category/severity and status line, then a short summary linking directly
to the original finding thread. Do not add list markers or indentation, and
do not repeat source paths for linked findings. The first line is
`<sub>**<severity dot> <category>(<level>) · <status dot> <lowercase status label>**</sub>`.
The first dot denotes severity: 🔴 critical, 🟠 major, 🟡 minor or 🔵 nitpick;
the second denotes status. Lowercase all entry status labels and always pair
a status dot with its label. End the first line with two trailing spaces for
a Markdown hard line break, without a blank line between the two lines.
Keep Markdown links and bold formatting inside the inline `<sub>` wrappers.
Use normal spaces so content wraps naturally; no non-breaking spaces, HTML
line breaks within entries or custom CSS. On renderers without inline HTML
support, retain the unbulleted two-line format without the wrappers.

For fixed entries with a verified fix SHA, append `` · fixed in `<sha>` `` to
the first line, inside its bold formatting, as shown below. Omit this suffix
when the fix SHA is unknown; do not repeat it below the title.

For linked findings, the second line contains only the linked description and
any necessary status note. Source locations and evidence belong in the detailed
finding, including for historical entries. Add a short filename only when it
is needed to distinguish otherwise similar descriptions; do not repeat full
paths or add “File reference unavailable” placeholders to linked entries.
For threadless overflow, use a plain summary and include the stable ID,
trigger/consequence and fix in the description, with the supporting code
reference first on the second line. Use the same unbulleted, small-text two-line format.

Use `#### Findings & Observations`, matching the banner's heading level.
Keep every finding visible in one list; do not wrap it in a disclosure or add
separate resolved sections, status group headings or heading tallies. Retain
resolved entries with their statuses and original links in the same list.

Example with known thread links (the URLs below are placeholders):

```markdown
#### Findings & Observations

<sub>**🟠 correctness(major) · 🟠 open**</sub>  
<sub>[Missing retry limit](<original-thread-url>)</sub>

<sub>**🟡 observability(minor) · 🟡 deferred**</sub>  
<sub>[Missing timeout logging](<original-thread-url>) — awaiting logging follow-up.</sub>

<sub>**🟡 correctness(minor) · 🟢 fixed · fixed in `a1b2c3d`**</sub>  
<sub>[Missing null guard](<original-thread-url>)</sub>

<sub>**🟠 reliability(major) · 🟢 fixed · fixed in `e4f5a6b`**</sub>  
<sub>[Duplicate event delivery](<original-thread-url>)</sub>

```

Use known prior thread URLs immediately;
new findings temporarily use plain `file:line` text until delivery returns
URLs. Replace the temporary location with the linked summary once the thread
URL is known. Never invent a link. Back-fill all new links in one root edit as described
in `hosts.md`; if unsupported or unsuccessful retain locations and disclose
the limitation. Preserve the conditional root footer rule during link back-fill.

## Inline finding

```markdown
<!-- ollie-finding: <root-cause-slug>; level: <level>; category: <category>; head: <full-sha> -->
<dot> **<category>(<level>)** &middot; <short behavioral summary>

#### Ollie’s Concern

<Reachable trigger, incorrect behavior and concrete user/caller impact.>

#### Supporting Evidence

- <Linked file:line and symbol> — <observed fact and what it proves.>
- <Additional decisive location when needed> — <next causal step.>

#### Suggested Fix

<Concrete change, affected components and essential implementation constraints.>

**Verify** &middot; <Failure scenario that must stop and valid behavior to preserve.>

<sub>🦦 Ollie reviewed `<short-sha>` &middot; <phrase> &middot; [how Ollie reviews](<developer-guide-url>)</sub>
```

Keep all three headings and their contents visible at `####`, without heading
emojis or mandatory disclosures. Preserve the category/severity header,
finding marker, reviewed commit and existing otter tagline/footer.

Ollie’s Concern is one sentence, two only when the trigger needs setup: the
reachable trigger, the wrong behavior and who it affects. The title already
names the failure, so do not restate it, and do not repeat the same consequence
under a later heading.

Supporting Evidence is normally 1–2 bullets, at most 3 when the causal chain
needs them, one line each. Each bullet pairs an exact location and symbol with
the fact it proves — links pinned to the reviewed commit where supported, or
precise file:line references locally. Cover only the decisive steps from
trigger to consequence, including a cross-file caller or lifecycle transition
when that is what proves reachability. Filenames, identifiers and unsupported
assertions are not evidence; for a claimed missing guard/reset, cite the path
inspected and say why it allows the failure. Add a short excerpt, concrete
input/output or executed test result only when prose cannot carry the proof.
Never invent locations or results; distinguish code inspection, observed
execution and proposed checks, and state material assumptions.

Suggested Fix is normally 1–3 sentences: the smallest concrete change, where it
belongs, and any constraint or companion edit that is easy to miss. Prefer one
supported approach; mention an alternative or a tempting incomplete fix only
when evidence shows it matters. If the fix depends on an unresolved contract or
design choice, state the dependency and next step instead of inventing code.
Close with a one-sentence `**Verify** &middot; …` line naming the regression
scenario, its expected result and any behavior that must stay intact. Label
proposed checks as proposed and report executed ones with their actual results.

Target 60–110 words of prose per finding, excluding headings, markers, footer
and code; a minor comment is often done in 40. Pass 150 only when a multi-step
causal chain genuinely needs it, and do not exceed 200. Cut in this order:
repeated impact statements, fix rationale, then non-decisive evidence. Every
sentence must help the reader verify the issue or apply the fix — do not
narrate the investigation, hedge, or pad a section to match the others. Be
compact, not cryptic: keep the locations, constraints and impact that make the
finding actionable.

### Optional patch

Replacement code is optional. Include it when a small verified patch materially
helps apply the fix, or when explicitly requested. Do not generate speculative
or extensive multi-file examples merely to fill a section. Concrete prose
with locations, constraints and acceptance criteria is a complete fix handoff.

For a verified, self-contained replacement of a contiguous range, use a native
suggestion if the host supports it at the review anchor; see `hosts.md`. Check
the replacement against the reviewed source, exact range and indentation.
Include all replacement lines without ellipses or placeholders. Never attach
a replacement for a different location to the finding's current anchor.

If code is useful but cannot be applied as a native suggestion, label it as an
example and include explicit file paths, enough context and required companion
edits. Verify proposed values and behavior against affected callers.

On GitHub, place optional code after Suggested Fix and before the footer in a
closed disclosure:

```markdown
<details>
<summary><strong>Suggested Patch</strong></summary>
<br>

<Complete native suggestion or clearly labeled code/diff example.>

</details>
```

Keep blank lines around fenced code. Omit the disclosure entirely when there
is no code; never put repeated fix prose under Suggested Patch. On other hosts
or locally, use the wrapper only if supported without breaking suggestions;
otherwise show the code beneath a Suggested Patch heading. Essential evidence,
fix guidance and verification remain visible outside the disclosure.

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

Every inline comment and thread reply retains the `<sub>` footer, reviewed
SHA, and a randomly selected playful phrase. Root comments use a footer only
when no inline findings accompany that review. Shuffle this pool per
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
comments, then call `scripts/phrase --count N` once for the N new comments requiring footers.
Skip phrase selection when none require one.
Assign the returned lines in comment order; the helper samples without
replacement and resets the pool only after exhaustion. For an additional
batch in the same review, pass phrases already used in the current cycle as
repeated `--exclude` arguments; clear that cycle's exclusions at exhaustion.
If N is not known yet, draw one shuffled pool with `--count 48` and consume it
as needed. Do not run one tool call per footer. Store the chosen text in the prepared comment so retries keep
it. Example tones: "brought my emotional-support pebble", "the fish requested
a second opinion", and "brought snacks; accidentally ate the agenda".

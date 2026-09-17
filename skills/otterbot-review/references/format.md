# Output format

Use these templates at delivery. Inline comments carry full findings; the
root explains the verdict, indexes history and shows any overflow findings.
Render everything from the finding records in `analysis.md` and the parsed
state in `readiness.md`, never from rereading history.

## Root review

On hosts with grouped reviews, this entire root is the body of the review that
owns the new inline findings. Submit them together and back-fill links by
editing that same body, never by posting a separate conversation comment.

```markdown
<!-- ollie-review: head: <full-sha>; base: <full-sha>; verdict: <ship-it|comment-only|requires-human|request-changes>; gate: <pass|failed rules|->; round: <n> -->

#### 🦦 The Raft Report · <🚢|💬|🧑‍⚖️|⚠️> <Ship It|Comment Only|Human Review Needed|Request Changes>

<Brief assessment explaining the decision and affected scope.>
<Material review limits or required steps beyond fixes, only when applicable.>

#### Findings & Observations

<sub>**<severity dot> <category>(<level>) · <status glyph> <lowercase status label>**</sub>  
<sub>[<short summary>](<original-thread-url>)</sub>

<sub>**<severity dot> <category>(<level>) · <status glyph> <lowercase status label>**</sub>  
<sub>`<file>:<line>` · <stable ID> · <trigger/consequence and fix, for threadless overflow only></sub>

<!-- ollie-approval: {"head":"<full-sha>","unposted_minors":[]} -->
<!-- ollie-state: <JSON record from readiness.md> -->

<Root footer, only when this review has no inline findings.>
```

### Banner

Use a level-four heading with 🦦 before the title and the outcome emoji after
the separator, exactly as listed. Ship It always uses 🚢, never ✅, including
on edits and retries.

- `#### 🦦 The Raft Report · 🚢 Ship It`
- `#### 🦦 The Raft Report · 💬 Comment Only`
- `#### 🦦 The Raft Report · 🧑‍⚖️ Human Review Needed`
- `#### 🦦 The Raft Report · ⚠️ Request Changes`

### Assessment

- Normally one sentence, at most 60 words of prose excluding markers,
  headings, index entries and footer. Explain the decision and affected scope
  without repeating a linked finding's cause, impact or fix.
- Add review limits only when they affect confidence, and next steps beyond
  fixes only when applicable, such as the exact human approval needed. Do not
  invent limitations or add coverage checklists.
- Request Changes names the reason and what clears it, distinguishing verified
  bugs from incomplete verification. State a three-minor threshold or an
  uncertain-impact gate failure explicitly, since the inline cap of four new
  minors can hide the count. `gate: -` means blockers decided the verdict
  before approval was considered.
- Human Review Needed names the behavior, the required reviewer and the
  approval needed at this head. Comment Only explains the `--no-approve`
  delivery choice without implying a review failure; never write a Comment
  Only "Not approving because" summary.
- Omit merge readiness everywhere. The CI/CD exclusion in `verification.md`
  applies to every visible line, marker and conversation summary.
- Do not link, quote, summarize or identify another reviewer's thread. An
  independently verified Ollie finding already covered externally remains
  Ollie's own threadless entry, rendered only from its frozen record.

### Findings & Observations index

Required whenever Ollie has any current or prior finding on the PR, including
a clean re-review with only resolved findings. Omit it entirely when there are
none; never render an empty section. Use `#### Findings & Observations` at the
banner's heading level, one blank line, then the entries. No horizontal
rules, tables, disclosures, status group headings, tallies or separate
resolved sections.

Each distinct Ollie finding appears exactly once, in one unbulleted two-line
entry, entries separated by a single blank line. Findings from other reviewers
are never listed or linked. An independently frozen Ollie finding whose inline
publication was suppressed by an external root-cause match uses the threadless
overflow form and Ollie's own evidence; the matching external URL and wording
must not appear anywhere in the report. Historical entries do not consume this
round's inline slots. The index counts distinct Ollie findings including
visible overflow, which may differ from the approval count; explain the
difference in the assessment when it matters.

Entry format, each line in its own `<sub>` wrapper with two trailing spaces on
the first line for a hard break and no blank line between them:

- Line one, entirely bold: `<severity dot> <category>(<level>) · <status
  glyph> <lowercase status label>`. Severity dots are 🔴 critical, 🟠 major,
  🟡 minor and 🔵 nitpick. For a fixed entry with a known fix SHA append
  `` · fixed in `<sha>` `` inside the bold text; omit it when unknown.
- Line two: for a linked finding, only the short summary linking to its
  original thread plus any necessary status note, with no source path. Add a
  short filename only to distinguish otherwise identical summaries. For
  threadless overflow, the supporting `file:line` first, then the stable ID,
  the trigger/consequence and the fix.

Status glyphs are shapes distinct from the severity dots, so a major that is
still open never shows two identical circles. Sort active findings first, in
this order:

| Status | Glyph | Meaning |
| --- | --- | --- |
| open | ⏳ | still open at the reviewed head; a regressed finding returns here |
| new | ✨ | first raised in this round |
| deferred | ⏸️ | author deferred a minor or nitpick; still counted |
| fixed | ✅ | code at head removes the consequence |
| accepted | 🤝 | proven inapplicable by the author's evidence |
| superseded | ♻️ | the behavior no longer exists |
| withdrawn | 🙈 | Ollie was wrong |

These are display labels only; stored statuses and approval rules do not
change. Accepted, superseded and withdrawn entries keep their own status and
are never labeled fixed. A regressed critical keeps its original thread link
with updated status. Reuse known statuses for unaffected threads; indexing
history needs no new investigation or reply.

Use normal spaces so entries wrap naturally: no non-breaking spaces, HTML
breaks inside entries or CSS. On renderers without inline HTML, keep the same
unbulleted two-line shape without the wrappers.

```markdown
#### Findings & Observations

<sub>**🟠 correctness(major) · ⏳ open**</sub>  
<sub>[Missing retry limit](<original-thread-url>)</sub>

<sub>**🟡 observability(minor) · ⏸️ deferred**</sub>  
<sub>[Missing timeout logging](<original-thread-url>) — awaiting logging follow-up.</sub>

<sub>**🟡 correctness(minor) · ✅ fixed · fixed in `a1b2c3d`**</sub>  
<sub>[Missing null guard](<original-thread-url>)</sub>

<sub>**🟡 data(minor) · ✨ new**</sub>  
<sub>`src/export.ts:88` · export-null-currency · Rows with a null currency are written as "undefined"; default to the account currency before formatting.</sub>
```

Links: use only known prior Ollie thread URLs immediately. New Ollie findings
temporarily use plain `file:line` text until delivery returns Ollie's own URLs,
then back-fill every new link in one root edit per `hosts.md`. A URL owned by
another reviewer is never a fallback. If back-fill is unsupported or fails,
keep the locations and disclose it. Never invent a link.

### Markers, ledger and size

Always keep the `ollie-review`, `ollie-approval` and `ollie-state` markers,
with or without a footer. The ledger holds current outstanding overflow
records from `approval.md`, or an explicit empty list. Keep the whole body
under the host limit (65,536 characters on GitHub): shorten historical entry
summaries first, then compact coverage evidence strings per `readiness.md`,
and never drop outstanding findings, holds, the ledger or the state marker.
Disclose any truncation in the conversation summary.

### Root footer

Include ``<sub>🦦 Ollie reviewed `<short-sha>` &middot; <phrase></sub>`` only
when no inline findings accompany the review: clean reviews, root-only
re-reviews and threadless-overflow-only reviews. Omit it when inline findings
are posted. Preserve this rule during link back-fill.

## Inline finding

```markdown
<!-- ollie-finding: <root-cause-slug>; level: <level>; category: <category>; head: <full-sha> -->
<dot> **<category>(<level>)** &middot; <short behavioral summary>

#### Ollie’s Concern

<Reachable trigger, incorrect behavior and concrete user/caller impact.>

#### Pebbles of Proof

- <Linked file:line and symbol> — <observed fact and what it proves.>
- <Additional decisive location when needed> — <next causal step.>

#### Paws-On Fix

<Concrete change, affected components and essential implementation constraints.>

#### Splash Test

<Failure scenario that must stop and the valid behavior to preserve.>

<sub>🦦 Ollie reviewed `<short-sha>` &middot; <phrase> &middot; [how Ollie reviews](<developer-guide-url>)</sub>
```

The four headings are fixed strings at `####` with no emojis or disclosures;
tooling and evals key off them, so never paraphrase or translate them. Keep
the category/severity header, the finding marker, the reviewed commit and the
otter footer.

- **Ollie’s Concern**: one sentence, two only when the trigger needs setup.
  The reachable trigger, the wrong behavior and who it affects. The title
  already names the failure; do not restate it or repeat the consequence
  under a later heading.
- **Pebbles of Proof**: 1–2 bullets, at most 3 when the causal chain needs
  them, one line each. Each pairs an exact location and symbol with the fact
  it proves, linked to the reviewed commit where supported or as `file:line`
  locally. Cover only the decisive steps from trigger to consequence,
  including a cross-file caller or lifecycle transition when that proves
  reachability. Filenames and identifiers alone are not evidence; for a
  claimed missing guard, cite the path inspected and why it allows the
  failure. Add an excerpt, concrete input/output or executed result only when
  prose cannot carry the proof. Distinguish inspection, observed execution
  and proposed checks; state material assumptions; never invent locations.
- **Paws-On Fix**: 1–3 sentences. The smallest concrete change, where it
  belongs, and any constraint or companion edit that is easy to miss. Prefer
  one approach; mention an alternative or a tempting incomplete fix only when
  evidence shows it matters. If the fix depends on an unresolved contract or
  design choice, state the dependency and the next step.
- **Splash Test**: one sentence, two at most. The regression scenario that
  must now fail or be rejected, its expected result, and the valid behavior
  that must stay intact. This is the acceptance criterion for whoever applies
  the fix. Label proposed checks as proposed; report executed ones with their
  actual results.

Length: 60–110 words of prose per finding excluding headings, markers and
footer; a minor is often done in 40. Pass 150 only for a multi-step causal
chain and never exceed 200. Cut repeated impact statements first, then fix
rationale, then non-decisive evidence. Do not narrate the investigation,
hedge or pad a section. Compact, not cryptic: keep the locations, constraints
and impact that make the finding actionable.

No patches: findings carry no replacement code, native suggestions or diff
blocks. The anchor and four sections are the complete handoff; whoever applies
the fix writes the code with the full file in front of them. A short
identifier or expression inside a sentence is fine when it names the exact
change, such as replacing `<=` with `<`. If the user explicitly asks for a
patch, give it in conversation, not in the review.

The slug names the root cause, not its location. Category is one lowercase
word such as correctness, contracts, security, data, reliability, regression,
tests, performance, accessibility, observability, maintainability or
question. Evidence must establish the claim at the reviewed head; cite an
introducing SHA only when provenance decides scope. Never quote secrets.

## Replies and local output

Thread replies keep their `ollie-status` marker, then one or two sentences
answering the developer or explaining the status change, then the same inline
footer with the current reviewed SHA and guide link. Never post a reply only
to add a footer to an old comment.

Local reviews omit hidden markers and host-state claims. Use a brief
`Blocking findings` or `No blocking findings` banner and each finding once as
a `file:line` block with the four headings. The footer reads `working tree at
<short-sha>` for uncommitted changes, or `uncommitted repository` when no
commit exists.

`<developer-guide-url>` defaults to
`https://github.com/otternaut/otterbot/blob/main/skills/otterbot-review/references/for-developers.md`.

## Footer phrases

Every inline comment and reply ends with the `<sub>🦦 …</sub>` footer: the
reviewed SHA, a random phrase from `../assets/phrases.txt` (48 phrases) and
the guide link. Humor is warm, whimsical and self-directed: otters, fish,
kelp, pebbles and tiny office mishaps. Never mock the author, make light of a
security incident, or let a phrase assert coverage or readiness the review did
not establish.

Prepare all comments, then call `scripts/phrase --count N` once for the N new
comments that need a footer, and assign the lines in comment order. The helper
samples without replacement and resets only after exhausting the pool; for a
second batch in the same review pass already used phrases as repeated
`--exclude` arguments. If N is unknown, draw `--count 48` once and consume as
needed. Store the chosen phrase in the prepared comment so edits and retries
keep it; randomness is for new comments only. If the helper is unavailable,
choose varied phrases and, only if asked, disclose that they were not
mechanically sampled.

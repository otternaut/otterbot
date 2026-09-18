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

````markdown
<!-- ollie-finding: <root-cause-slug>; level: <level>; category: <category>; head: <full-sha> -->
<dot> **<category>(<level>) &middot; <short behavioral summary>**

**Concern** &middot; <Reachable trigger, cause and impact, with evidence links inline.>

**Fix** &middot; <Concrete change, affected components and essential constraints.>

**Verification** &middot; <Concrete check and expected outcome.>

```<language>
<Optional code example that guides the fix.>
```

<sub>🦦 Ollie reviewed `<short-sha>` &middot; <phrase> &middot; [how Ollie reviews](<developer-guide-url>)</sub>
````

Keep this order: title, Concern, Fix, Verification, optional code block, footer.
Bold the entire title after the severity dot, including category, level and
summary. Use the fixed bold labels **Concern**, **Fix** and **Verification**
followed by `&middot;` and the section text on the same line, with one blank
line between each piece. Do not use standalone section headings or a separate
evidence list. Keep the finding marker, reviewed commit and otter footer.

- **Concern**: 1–2 sentences covering the reachable trigger, cause and concrete
  user/caller impact. Integrate decisive evidence links with the facts they
  prove, including cross-file callers or lifecycle transitions when needed.
  Link exact locations and symbols to the reviewed commit where supported,
  or use `file:line` locally. For a missing guard, identify the inspected path
  and why it allows the failure; identifiers alone are not evidence. State
  material assumptions and never invent locations.
- **Fix**: 1–2 sentences explaining the smallest concrete change, where it
  belongs, and essential constraints or companion edits. Prefer one approach;
  mention alternatives or incomplete fixes only when evidence shows they
  matter. If an unresolved contract or design choice prevents a safe fix,
  state that dependency and the next step.
- **Verification**: 1 sentence describing a concrete check, its expected
  outcome and any valid behavior that must remain intact. Distinguish proposed
  checks from executed checks; report actual results only when observed.
- **Code block**: optional when it adds useful implementation guidance beyond
  the Fix summary, after Verification and before the footer. Use a fenced
  block with the appropriate language, as much or as little code as needed;
  there is no line limit. Preserve relevant guards and name required companion
  changes in Fix. Make illustrative omissions clear and do not invent a
  replacement when the safe implementation depends on an unresolved contract.

There are no finding word-count limits. Keep each section useful without
repeating the impact or narrating the investigation. Preserve the evidence,
constraints and expected behavior an agent needs to solve the issue.

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
a `file:line` block with the same bold title and labels. The footer reads `working tree at
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

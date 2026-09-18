# Step budgets and focused retrieval

Agents cannot measure wall-clock time reliably, so budgets are counted in
**steps**. One step is one tool call: a file read, a search, a host request,
a shell command or a subagent dispatch. Count every step from the first
snapshot request through final delivery verification, including steps spent
by specialists. Use these defaults unless a trusted invoker supplies
`--budget-steps N`:

| Job | Step budget | Delivery reserve |
| --- | --- | --- |
| Unchanged evidence and completed delivery | 6 | none, no writes |
| Gate reassessment only | 20 | 6 |
| Small code review | 40 | 8 |
| Standard code review | 80 | 10 |
| Large or sensitive review | 120 | 15 |

Legacy `--budget-minutes N` remains accepted: map it to `N × 10` steps with a
reserve of one eighth, rounded up. A trusted override replaces the total; keep
the same proportional reserve. Classification may raise the tier once when the
actual scope is discovered; never re-raise it later. Local and shadow runs
reserve the same steps to save and report results.

Wall-clock limits still apply where a real timeout exists: give every local
experiment a two-minute tool timeout, run at most three experiments per
review, and never start a host call or command whose known duration exceeds
what the invoker allows. Skill instructions cannot preempt an uninterruptible
host call.

## Stop and resume

Check the step count after the snapshot, after the integrated scan, after each
investigation batch and before delivery. Stop optional nitpick work first,
prioritize credible blockers, and continue minor investigation and relevant
coverage within the remaining budget. At total minus reserve, stop new
investigation, cancel owned experiments
where possible, and record verified findings plus the exact unreviewed
behaviors and paths.

Exhaustion is never proof: incomplete scope or evidence yields Request Changes
with the exact verification gap, without inventing a defect. Publish every
already verified blocker, preserve outstanding minor accounting, and record
specific holds with owner, clearing condition and resume trigger. Persist the
resume position under `readiness.md` so the next invocation continues rather
than restarts. If even freshness cannot be established within the budget,
report uncertainty rather than claiming an unchanged skip or approving.

Do not spawn continuation jobs to evade the budget. After two consecutive
no-progress attempts on unchanged inputs, pause automatic investigation of that
scope until the inputs change or a trusted explicit retry arrives. Targeted
commands, decision changes and stale-approval or delivery recovery are always
allowed; the pause never makes incomplete coverage eligible for approval.

Delivery keeps its preflight and final verification even when the budget is
gone. Safety recovery, such as withdrawing a detected invalid approval, may
exceed the reserve; report the overrun instead of silently raising the budget.
Never omit verified findings to fit a budget or retry writes blindly.

## Retrieval and output economy

- Fetch metadata and state once, then batch independent required reads when
  the tools allow. Keep the final freshness check; do not optimize it away.
- Locate guards, callers, consumers and tests with targeted search on changed
  symbols. Read enough enclosing context; expand only for a concrete
  correctness question. Avoid repeated whole-file or whole-diff dumps.
- Use lightweight thread identities, anchors and revision metadata for
  deduplication and invalidation; fetch bodies only for new, edited or affected
  threads. Compare others' bodies only after independently verifying
  candidates, and only to avoid duplicate posts.
- Parse the newest attributable state once into records and keep them for the
  whole run. Render the index from records, not from rereading history.
- Load only the reference section the current phase names. Stop after one
  adequate evidence route as defined in `verification.md`.
- Prepare all comments, assign footer phrases in one helper call, and reuse the
  assigned text on retries.

Use `benchmark.md` for baseline recording and comparison. Do not run a
benchmark as part of a PR review or invent unavailable usage data.

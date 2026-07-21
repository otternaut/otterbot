# Worked examples

These examples show the eligibility and orchestration boundaries. The
coordinator filters metadata and schedules jobs; each child independently runs
`otterbot-review` and delivers its own result on GitHub.

## Example 1: Filtered repository sweep

**User:**

> `otterbot-review-orchestrator https://github.com/acme/widgets`

At `2026-07-20T15:00:00Z`, the stale cutoff is
`2026-07-06T15:00:00Z`. The fully paginated candidate query returns:

- #7: open, ready, `REVIEW_REQUIRED`, updated July 19 — eligible.
- #12: open draft with `REVIEW_REQUIRED` — excluded as draft.
- #18: open and approved — excluded because review is not required.
- #33: open with `REVIEW_REQUIRED` and label `Stale` — excluded as stale.
- #41: open with `REVIEW_REQUIRED`, last updated July 1 — excluded as
  inactive for 14 days or more.
- #55: open, fresh, `REVIEW_REQUIRED`, but its current head matches the newest
  attributable Otterbot review marker — excluded as unchanged.
- #104: open, ready, `REVIEW_REQUIRED`, updated July 20 — eligible.

Only #7 and #104 pass preflight and receive distinct fresh workers. Neither
excluded PR enters a review context.

**Coordinator result:**

```markdown
### Otterbot review sweep · acme/widgets

Run start: 2026-07-20T15:00:00Z · Stale cutoff: 2026-07-06T15:00:00Z
Candidates: 7 · Eligible at snapshot: 2 · Workers started: 2
Excluded: closed/merged 0 · draft 1 · review not required 1 · stale label 1 ·
inactive 14+ days 1 · unchanged 1 · change unverified 0
Delivered: 2 · No review needed after snapshot: 0 · Skipped after snapshot: 0 ·
Failed: 0 · Uncertain: 0

#### PR #7 · Fix duplicate webhook delivery

- PR: https://github.com/acme/widgets/pull/7
- Status: Delivered
- Head: `47a031bd7b20a9f7a91d60dc123e22ef59074999`
- Verdict: Request Changes
- Review: https://github.com/acme/widgets/pull/7#pullrequestreview-501
- Inline findings: 2

#### PR #104 · Remove legacy retry worker

- PR: https://github.com/acme/widgets/pull/104
- Status: Delivered
- Head: `bb5b73ce6c5bd0cb9d3d301f9d41bf7925cda8d7`
- Verdict: Ship It!
- Review: https://github.com/acme/widgets/pull/104#pullrequestreview-503
- Inline findings: 0
```

The coordinator does not reproduce the Council reports, compare their scores,
or make a combined merge recommendation.

## Example 2: Eligibility changes and partial failure

**User:**

> `otterbot-review-pipeline https://github.com/acme/payhub/`

Discovery finds three fresh, ready, review-required PRs: #21, #22, and #30.

- #21 remains eligible; its worker completes and verifies delivery.
- #22 receives the needed approval while queued. Preflight now reports
  `APPROVED`, so the coordinator records `Skipped` and never starts a worker.
- #30 passes preflight, but its worker cannot load `otterbot-review`, so the
  result is `Failed`.

```markdown
### Otterbot review sweep · acme/payhub

Run start: 2026-07-20T15:00:00Z · Stale cutoff: 2026-07-06T15:00:00Z
Candidates: 3 · Eligible at snapshot: 3 · Workers started: 2
Excluded: closed/merged 0 · draft 0 · review not required 0 · stale label 0 ·
inactive 14+ days 0 · unchanged 0 · change unverified 0
Delivered: 1 · No review needed after snapshot: 0 · Skipped after snapshot: 1 ·
Failed: 1 · Uncertain: 0

#### PR #21 · Add payout reconciliation

- PR: https://github.com/acme/payhub/pull/21
- Status: Delivered
- Head: `0a226e03541fcf4767730264f381cf21a53f2055`
- Verdict: Comment Only
- Review: https://github.com/acme/payhub/pull/21#pullrequestreview-800
- Inline findings: 1

#### PR #22 · Update settlement schedule

- PR: https://github.com/acme/payhub/pull/22
- Status: Skipped
- Head: `bb2a16467853f2445c5ed6a5a0da1b8d61f160e9`
- Verdict: Not produced
- Review: Not delivered
- Inline findings: 0
- Note: Eligibility changed to reviewDecision=APPROVED before worker creation.

#### PR #30 · Harden webhook verification

- PR: https://github.com/acme/payhub/pull/30
- Status: Failed
- Head: `09b629e9317acb33c09847bbc91e45cd70a50514`
- Verdict: Not produced
- Review: Not delivered
- Inline findings: Unknown
- Note: The worker could not load the required otterbot-review skill.
```

## Example 3: No eligible pull requests

**User:**

> `review eligible PRs in https://github.com/acme/quiet-repo with otterbot`

The candidate query finds five open PRs: two drafts, one approved PR, one PR
inactive for 20 days, and one PR whose current effective revision already has
an attributable Otterbot review. No PR passes the eligibility gate. This is a
successful zero-job run; the coordinator creates or waits for no workers,
invokes no review skill, and returns:

```markdown
### Otterbot review sweep · acme/quiet-repo

Run start: 2026-07-20T15:00:00Z · Stale cutoff: 2026-07-06T15:00:00Z
Candidates: 5 · Eligible at snapshot: 0 · Workers started: 0
Excluded: closed/merged 0 · draft 2 · review not required 1 · stale label 0 ·
inactive 14+ days 1 · unchanged 1 · change unverified 0
Delivered: 0 · No review needed after snapshot: 0 · Skipped after snapshot: 0 ·
Failed: 0 · Uncertain: 0

No pull requests require an Otterbot review. Exiting.
```

## Example 4: Invalid input

**User:**

> `otterbot-review-orchestrator`

No repository URL was supplied. The coordinator does not inspect the current
checkout or a configured git remote and does not create workers. It asks for a
URL in the required form:

> Provide one GitHub repository URL, for example
> `https://github.com/acme/widgets`.

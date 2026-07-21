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
## 🦦 Otterbot Review Sweep · acme/widgets

Two reviews were posted and verified. PR #7 needs changes; PR #104 received
Otterbot's Ship It! verdict.

### ⏱️ Run details

- Started: 2026-07-20T15:00:00Z
- Stale cutoff: 2026-07-06T15:00:00Z (14 days)
- Candidates checked: 7
- Eligible at snapshot: 2 · Workers started: 2

### 🔎 Queue audit

- Excluded before review: closed/merged 0 · draft 1 · review not required 1 ·
  stale label 1 · inactive 14+ days 1 · unchanged 1 · change unverified 0
- Final job status: ✅ delivered 2 · ⏭️ no review needed 0 · ⏸️ skipped 0 ·
  ❌ failed 0 · ⚠️ uncertain 0
- Delivered verdicts: 🚢 Ship It! 1 · 💬 Comment Only 0 · ⚠️ Request Changes 1

### 📋 Pull request results

#### ✅ PR #7 · Fix duplicate webhook delivery

- **Status:** Delivered
- **Pull request:** https://github.com/acme/widgets/pull/7
- **Reviewed head:** `47a031bd7b20a9f7a91d60dc123e22ef59074999`
- **Verdict:** ⚠️ Request Changes
- **Review:** https://github.com/acme/widgets/pull/7#pullrequestreview-501
- **Findings:** 2 inline; high 1 · medium 1
- **Outcome:** The webhook path can still deliver the same event twice after a
  retry, so changes are required before merge.
- **Testing & verification:** Existing unit coverage was inspected; retry and
  duplicate-delivery behavior still needs a regression test.

#### ✅ PR #104 · Remove legacy retry worker

- **Status:** Delivered
- **Pull request:** https://github.com/acme/widgets/pull/104
- **Reviewed head:** `bb5b73ce6c5bd0cb9d3d301f9d41bf7925cda8d7`
- **Verdict:** 🚢 Ship It!
- **Review:** https://github.com/acme/widgets/pull/104#pullrequestreview-503
- **Findings:** 0 inline; no actionable findings
- **Outcome:** The removal preserves the remaining retry path and no
  merge-blocking concern was found.
- **Testing & verification:** Focused tests passed and the affected callers
  were inspected.

### 🧭 Follow-up

PR #7 needs the two requested fixes and a regression test; rerun the sweep once
those changes are pushed.
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
## 🦦 Otterbot Review Sweep · acme/payhub

One review was posted. PR #22 no longer required review, and PR #30 needs a
later retry because its review worker could not start.

### ⏱️ Run details

- Started: 2026-07-20T15:00:00Z
- Stale cutoff: 2026-07-06T15:00:00Z (14 days)
- Candidates checked: 3
- Eligible at snapshot: 3 · Workers started: 2

### 🔎 Queue audit

- Excluded before review: closed/merged 0 · draft 0 · review not required 0 ·
  stale label 0 · inactive 14+ days 0 · unchanged 0 · change unverified 0
- Final job status: ✅ delivered 1 · ⏭️ no review needed 0 · ⏸️ skipped 1 ·
  ❌ failed 1 · ⚠️ uncertain 0
- Delivered verdicts: 🚢 Ship It! 0 · 💬 Comment Only 1 · ⚠️ Request Changes 0

### 📋 Pull request results

#### ✅ PR #21 · Add payout reconciliation

- **Status:** Delivered
- **Pull request:** https://github.com/acme/payhub/pull/21
- **Reviewed head:** `0a226e03541fcf4767730264f381cf21a53f2055`
- **Verdict:** 💬 Comment Only
- **Review:** https://github.com/acme/payhub/pull/21#pullrequestreview-800
- **Findings:** 1 inline; low 1
- **Outcome:** The reconciliation path is acceptable; one non-blocking
  maintainability note was posted.
- **Testing & verification:** Focused reconciliation tests passed.

#### ⏸️ PR #22 · Update settlement schedule

- **Status:** Skipped
- **Pull request:** https://github.com/acme/payhub/pull/22
- **Reviewed head:** `bb2a16467853f2445c5ed6a5a0da1b8d61f160e9`
- **Verdict:** Not produced
- **Review:** Not delivered
- **Needs attention:** Eligibility changed to `reviewDecision=APPROVED` before
  worker creation, so no review was posted.

#### ❌ PR #30 · Harden webhook verification

- **Status:** Failed
- **Pull request:** https://github.com/acme/payhub/pull/30
- **Reviewed head:** `09b629e9317acb33c09847bbc91e45cd70a50514`
- **Verdict:** Not produced
- **Review:** Not delivered
- **Needs attention:** The worker could not load the required `otterbot-review`
  skill. No review was posted; retry after the skill is available.

### 🧭 Follow-up

No action is needed for PR #22. Restore the worker's `otterbot-review` skill
before retrying PR #30 on the next run.
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
## 🦦 Otterbot Review Sweep · acme/quiet-repo

No pull requests require an Otterbot review. No workers were started.

### ⏱️ Run details

- Started: 2026-07-20T15:00:00Z
- Stale cutoff: 2026-07-06T15:00:00Z (14 days)
- Candidates checked: 5
- Eligible at snapshot: 0 · Workers started: 0

### 🔎 Queue audit

- Excluded before review: closed/merged 0 · draft 2 · review not required 1 ·
  stale label 0 · inactive 14+ days 1 · unchanged 1 · change unverified 0
- Final job status: ✅ delivered 0 · ⏭️ no review needed 0 · ⏸️ skipped 0 ·
  ❌ failed 0 · ⚠️ uncertain 0

All candidates were filtered before review. Exiting successfully.
```

## Example 4: Invalid input

**User:**

> `otterbot-review-orchestrator`

No repository URL was supplied. The coordinator does not inspect the current
checkout or a configured git remote and does not create workers. It asks for a
URL in the required form:

> Provide one GitHub repository URL, for example
> `https://github.com/acme/widgets`.

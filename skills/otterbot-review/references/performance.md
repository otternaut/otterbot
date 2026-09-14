# Runtime budgets and focused retrieval

Start a clock before snapshot retrieval. All setup, reading, tool latency,
experiments and optional specialists count toward the total. Use these default
budgets unless a trusted invoker supplies `--budget-minutes N`:

| Job | Desired elapsed time | Total budget | Delivery reserve |
| --- | --- | --- | --- |
| Unchanged evidence and completed delivery | Under 30 seconds | 30 seconds | No writes |
| Gate reassessment only | 30–90 seconds | 90 seconds | 30 seconds |
| Small/trivial code review | 2–4 minutes | 4 minutes | 1 minute |
| Standard code review | 5–8 minutes | 8 minutes | 1 minute |
| Large, sensitive or deep review | 8–12 minutes | 12 minutes | 2 minutes |

Targets are provisional, not measured performance claims. Changed context or
incomplete scope uses the appropriate code-review tier. Classification may
raise a budget once when actual scope is discovered; keep the original start
clock and never repeatedly extend it. A trusted override supersedes the total;
reserve up to two minutes, normally one quarter of it, for delivery. Local and
shadow runs reserve equivalent time to save/report results.

## Stop and resume

Check elapsed time after snapshot, integrated scan, each investigation/tool
batch and before delivery. Stop optional minor/nitpick work first. At total
minus reserve, stop new investigation, cancel owned experiments where possible,
and record verified findings and exact unreviewed behaviors/paths. All local
experiments together fit this same deadline; each also has a two-minute cap.
Do not start a tool operation whose known duration exceeds remaining analysis
time. Use tool timeouts/cancellation when available; skill instructions cannot
preempt an uninterruptible host call or guarantee wall-clock latency.

Exhaustion is never proof: incomplete scope/evidence yields Comment Only,
unless a verified blocker requires Request Changes. Publish every already
verified blocker, preserve outstanding minor accounting, and record specific
holds with owner, clearing condition and resume trigger. Preserve completed
coverage and the next investigation step; do not restart on the next invocation.
In local/shadow mode save equivalent progress locally. If even freshness cannot
be established within the budget, report uncertainty rather than claiming an
unchanged skip or granting approval.

Do not wait automatically or spawn continuation jobs to evade the budget.
Persist resume position and progress under `readiness.md`. After two consecutive
no-progress attempts on unchanged relevant inputs, pause automatic investigation
across sweeps until those inputs change or a trusted explicit retry arrives.
Always allow targeted commands, decision changes and stale-approval/delivery
recovery; the pause never makes incomplete coverage eligible for approval.

Delivery must retain preflight and final host verification. On timeout, use
bounded host recovery and report pending/uncertain state. Never omit verified
findings to meet a target, blindly retry writes, or leave a detected invalid
approval without attempting its required withdrawal. Such safety recovery can
exceed the reserve; report the overrun instead of silently raising the budget.

## Retrieval and output economy

- Fetch metadata/state once, then independent required reads in a batch when
  supported. Keep final freshness checks; do not optimize them away.
- Use changed symbols and targeted search to locate actual guards, callers,
  consumers and tests. Read sufficient enclosing context; expand only for a
  concrete correctness question. Avoid repeated whole-file/diff dumps.
- Use complete lightweight thread identities, anchors and revision metadata
  for deduplication/invalidation. Fetch new/edited/affected bodies. If the host
  lacks reliable change metadata or cached attribution, fetch the needed full
  history with pagination. Compare others' bodies only after independently
  verifying candidates; use them for posting deduplication, never discovery.
- Parse newest attributable state once; retain compact records locally through
  the run. Reuse verified unchanged evidence under `readiness.md`. Do not send
  repeated public Markdown history through reasoning just to rebuild an index.
- Preserve the full public Advisory Findings history and required root markers.
  Group related coverage paths explicitly and keep evidence references concise;
  never truncate outstanding findings, gaps or command deduplication state.
- Load only routed reference sections. Do not read benchmark/developer guides
  during routine review. Stop after one adequate evidence route, as defined in
  `verification.md`; do not collect redundant proof for reassurance.
- Prepare all comments before delivery, assign random phrases in one helper
  call, and reuse assigned text on retries. Do not spend model calls inventing
  a fresh joke for each comment. Keep Ollie's playful footer on every comment.

For baseline recording, comparison and rollout, use `benchmark.md` separately.
Do not run a benchmark as part of a PR review or invent unavailable token data.

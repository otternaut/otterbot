# Output format and rendered examples

Everything Ollie posts uses `&middot;` as the separator, the four levels
nitpick, minor, major, and critical, and one lowercase category word per
finding. This file holds the exact templates, the tagline pool, calibration
guidance, and four fully rendered examples. The PR, repository, and SHAs in
the examples are invented; the level of specificity is the point.

## Root comment

```markdown
<!-- ollie-review: head: <full-sha>; base: <full-sha>; verdict: <ship-it|needs-context|needs-eyes|comment-only|request-changes>; gate: <pass|first failed rule>; round: <n> -->
#### 🦦 <PR title exactly as the host reports it> &middot; <🚢 Ship It!|📝 Needs Context|👀 Needs Eyes|💬 Comment Only|⚠️ Request Changes>

<Summary: one to three sentences.>

<details>
<summary>Findings &middot; <count></summary>
<br>

* **<category>** &middot; **<level>** &middot; [<one-line summary>](<thread-url>)

</details>

<sub>🦦 Ollie reviewed `<short-sha>` &middot; <tagline phrase></sub>
```

Rules:

- The title is the host's PR title verbatim. Never paraphrase it.
- The verdict in the title always carries its emoji: 🚢 Ship It!, 📝 Needs
  Context, 👀 Needs Eyes, 💬 Comment Only, ⚠️ Request Changes. Never post the
  verdict words alone.
- The summary paragraph is the whole summary block: one to three sentences and
  about fifty words at most, saying what the change does and the one thing
  that decides the verdict. On Request Changes that is the blocker or the minor
  count; on Needs Eyes or Needs Context it is every failed gate rule, briefly,
  for example "Not approving: the migration files are a human-approval zone."
  or "Not approving: the description is empty, so I could not check intent." A
  clause of credit is fine when genuinely earned. Mention the test run only
  when it decides the verdict, such as a failing run or a gate rule failed for
  lack of verification. Detail belongs in the inline comments, not here.
- On a re-review a `Since` line comes before the paragraph: `Since
  <prior-short-sha> &middot;` then each commit's short SHA and a few-word
  subject, `&middot;` separated. Past five commits, give the count and the
  first and last SHAs instead. The paragraph then says what changed about the
  findings.
- The `<details>` block appears only when the list has at least one bullet. A
  clean initial review, or a re-review with no prior threads and nothing new,
  goes straight from the summary block to the tagline. Never post
  `Findings &middot; 0`.
- The findings list is plain bullets, no emojis. Each bullet is the category
  and level in bold, then the one-line summary linked to its inline thread.
  Before the link back-fill described in `hosts.md`, the link target is
  `file:line`.
- A human-raised issue Ollie confirmed but did not comment on appears as
  `**<category>** &middot; **<level>** &middot; <summary> &middot; raised by
  @name` linking to the human's thread.
- On a re-review the `<summary>` tag carries the tally, for example
  `Findings &middot; 2 fixed &middot; 1 deferred &middot; 1 open &middot; 1
  new`, and each carried-over bullet ends with its status: `fixed in
  <short-sha>`, `accepted`, `deferred`, `still open`, `superseded`, or
  `withdrawn`. A finding posted this round has no status suffix; the bare
  bullet is what marks it as new.
- The `<br>` line after `<summary>` and the blank line after it are both
  required: the blank line makes the list render as Markdown, and the `<br>`
  gives the first bullet breathing room under the summary.
- `round` in the marker counts Ollie's reviews on this PR, starting at 1.
- `gate` is `pass`, the first failed rule, or `-` when findings decided the
  verdict before the gate ran.
- No horizontal rules, no headings other than the title, no sign-off line.

## Inline comment

```markdown
<!-- ollie-finding: <slug>; level: <level>; category: <category>; head: <full-sha> -->
<dot> **<category>** &middot; **<level>** &middot; <one-line summary>

**Why** &middot; <evidence>

**Risk** &middot; <impact>

**Suggestion** &middot; <fix>

<sub>🦦 Ollie reviewed `<short-sha>` &middot; <tagline phrase> &middot; [how Ollie reviews](<developer-guide-url>)</sub>
```

Rules:

- Dots: 🔴 critical, 🟠 major, 🟡 minor, 🔵 nitpick.
- The category and level on the first line, and the `Why`, `Risk`, and
  `Suggestion` labels, are always bold. Each label starts its own paragraph.
  That is what lets a reader find a section at a glance; do not add headings
  or horizontal rules to do the same job.
- The slug names the issue, not the location, so it survives a moved line:
  `rate-limit-key-spoofable`, not `ratelimiter-line-22`.
- Why cites at least one `file:line` and the commit that introduced the code
  as `(added in <short-sha>)`, or `pre-existing since <short-sha>` under the
  trigger-or-worsen exception. It also says what the tests do or do not cover.
- Risk says what goes wrong, for whom, under what conditions. If the impact is
  small, say so; that is what justifies a minor or nitpick.
- Suggestion is the smallest concrete fix inside the change plus the specific
  test to add. A host `suggestion` block may follow when the fix is small and
  mechanical. Never quote a secret.
- Attach to the smallest changed range that makes the issue clear. When there
  is no line, use a file-level comment on the changed file; if the host has no
  file-level comments, use the nearest changed line.
- The guide link defaults to this repository's copy of `for-developers.md`.

## Tagline pool

Every `<sub>` line, on the root comment and on each inline comment, is the
fixed prefix `🦦 Ollie reviewed <short-sha>` followed by `&middot;` and one
phrase from this pool. The prefix never changes, so the reviewed head is
always one glance away. Pick the phrase at random, independently for each
comment, and do not repeat one within a single review while the pool allows.
Phrases stay short, otter-flavored, and harmless: never a jab at the author and
never a hint about the verdict. Add to the pool sparingly.

- otterly thorough, as always
- no clam left uncracked
- floated by, poked at everything
- paws on every line
- back in the water until the next push
- sniffed every branch of this river
- surfaced with the details
- whiskers twitched at line one
- kept my favorite rock handy for this one
- cracked it open on my chest like a clam
- floating on my back, thinking about your edge cases
- holding paws with your test suite
- rafted up with the diff for a while
- dove deep, came up for air eventually
- slid down the mud bank into your call stack
- juggled a few pebbles while reading
- groomed every line until it shone
- ate a quarter of my body weight in context
- wrapped in kelp so this review would not drift off
- squeaked twice at the merge base
- you otter know I checked the callers
- in otter news, the diff has been read
- came for the fish, stayed for the diff
- left no pebble unturned
- your significant otter, reviewing
- watched the whole diff float by
- one paw on the diff, one on a rock
- the raft is holding
- whiskers up, eyes open
- swam the whole river for this
- did a barrel roll in the shallows first
- paddled over as fast as these little legs allow

## Calibration

| Level | Belongs here | Does not belong here |
| --- | --- | --- |
| critical | Exploitable auth or injection flaw, secret exposure, irreversible data loss, outage of the main path, money moved incorrectly | A bug behind a disabled flag, a theoretical race with no reachable trigger |
| major | Wrong result on a realistic input, unmet acceptance criterion, broken existing caller, missing consumer of a changed contract, high-risk path with no test | Style, naming, or a gap on an unlikely path |
| minor | Unhandled edge case, accidental failure behavior, missing test for a secondary path, misleading log or error | Anything that would ship visibly broken |
| nitpick | Naming, placement, duplication, consistency with an established pattern | Personal preference where the local pattern is clear and safe |

When torn between two levels, pick the lower one and let Risk explain why.
When torn about whether something is a critical, post it as a major and state
the uncertainty in Why; a human will escalate if needed.

## Example 1: initial PR review

**User:** "review https://github.com/acme/payhub/pull/142"

PR #142, "Add webhook rate limiting", adds a per-merchant token bucket in
front of `POST /webhooks` backed by Redis. The freshness gate finds no prior
Ollie review. `npm test` is discoverable from the CI workflow and passes.

Root comment, submitted as a changes-requested review:

```markdown
<!-- ollie-review: head: 8b2c6e1d4a9f7c3b5e0d1a8c6f2b9e4d7a3c1f0e; base: 3f9a0c2e7b1d5a8c4e6f0b2d9a1c3e5f7b9d1a3c; verdict: request-changes; gate: -; round: 1 -->
#### 🦦 Add webhook rate limiting &middot; ⚠️ Request Changes

Adds a per-merchant Redis token bucket in front of `POST /webhooks`, following the repo's middleware pattern. Two things stop it from doing its job: the bucket key comes from a client-controlled header, and the check-and-increment is two round trips, so bursts slip past the cap PAY-881 asks for.

<details>
<summary>Findings &middot; 4</summary>
<br>

* **security** &middot; **critical** &middot; [Rate-limit key is taken from the unauthenticated `X-Merchant-Id` header, so any caller can pick whose bucket they drain](https://github.com/acme/payhub/pull/142#discussion_r9001)
* **correctness** &middot; **major** &middot; [Check and increment are two round trips, so concurrent requests bypass the cap](https://github.com/acme/payhub/pull/142#discussion_r9002)
* **reliability** &middot; **minor** &middot; [A Redis error propagates as a 500, so an outage takes webhooks down instead of failing open or closed on purpose](https://github.com/acme/payhub/pull/142#discussion_r9003)
* **maintainability** &middot; **nitpick** &middot; [The `50` and `60_000` literals belong in `config/limits.ts` next to the other quotas](https://github.com/acme/payhub/pull/142#discussion_r9004)

</details>

<sub>🦦 Ollie reviewed `8b2c6e1` &middot; otterly thorough, as always</sub>
```

Inline comment on `src/webhooks/rateLimiter.ts:22`:

```markdown
<!-- ollie-finding: rate-limit-key-spoofable; level: critical; category: security; head: 8b2c6e1d4a9f7c3b5e0d1a8c6f2b9e4d7a3c1f0e -->
🔴 **security** &middot; **critical** &middot; Rate-limit key is taken from the unauthenticated `X-Merchant-Id` header, so any caller can pick whose bucket they drain

**Why** &middot; `src/webhooks/rateLimiter.ts:22` (added in `8b2c6e1`) builds the key as `` `rl:${req.headers['x-merchant-id']}` ``. The middleware runs before `verifyWebhookSignature` in `src/webhooks/router.ts:14`, so the header is unverified at that point. The signed payload already carries the real merchant in `event.merchant_id`, which `handler.ts:31` uses two lines later.

**Risk** &middot; A caller can spoof another merchant's ID and exhaust their bucket, blocking that merchant's legitimate webhooks. A caller can also rotate random IDs to get an unlimited number of fresh buckets, which removes the limit entirely for the one actor the limiter is meant to stop.

**Suggestion** &middot; Move the limiter after signature verification in `router.ts` and key on the verified `event.merchant_id`. If pre-verification limiting is wanted as a cheap first layer, key that one on source IP only and keep the per-merchant bucket behind the signature check. Add a test that sends a valid signature with a mismatched `X-Merchant-Id` and asserts the bucket charged is the signed merchant's.

<sub>🦦 Ollie reviewed `8b2c6e1` &middot; slid down the mud bank into your call stack &middot; [how Ollie reviews](https://github.com/otternaut/otterbot/blob/main/skills/otterbot-review/references/for-developers.md)</sub>
```

Inline comment on `src/webhooks/rateLimiter.ts:41-48`:

````markdown
<!-- ollie-finding: rate-limit-atomicity; level: major; category: correctness; head: 8b2c6e1d4a9f7c3b5e0d1a8c6f2b9e4d7a3c1f0e -->
🟠 **correctness** &middot; **major** &middot; Check and increment are two round trips, so concurrent requests bypass the cap

**Why** &middot; `src/webhooks/rateLimiter.ts:41-48` (added in `8b2c6e1`) calls `GET` on line 41, compares on line 44, then `INCR` on line 47. Two requests that both read `49` both pass. `test/rateLimiter.test.ts` issues its requests with `await` in sequence, so the race never appears in the suite.

**Risk** &middot; The limiter fails under exactly the burst traffic PAY-881 exists to cap. A merchant retry storm reaches the downstream processor unthrottled, which is the incident that opened the ticket.

**Suggestion** &middot; Use a single `INCR` and call `EXPIRE` only when the returned value is `1`, then compare the returned count against the limit. If the read-then-write shape has to stay, wrap it in `MULTI`/`EXEC`. Add a test that fires 60 parallel requests for one merchant and asserts at most 50 succeed.

```suggestion
    const count = await redis.incr(key);
    if (count === 1) await redis.expire(key, WINDOW_SECONDS);
    if (count > LIMIT) return reject(res);
```

<sub>🦦 Ollie reviewed `8b2c6e1` &middot; paws on every line &middot; [how Ollie reviews](https://github.com/otternaut/otterbot/blob/main/skills/otterbot-review/references/for-developers.md)</sub>
````

Inline comment on `src/webhooks/handler.ts:88`:

```markdown
<!-- ollie-finding: redis-error-500; level: minor; category: reliability; head: 8b2c6e1d4a9f7c3b5e0d1a8c6f2b9e4d7a3c1f0e -->
🟡 **reliability** &middot; **minor** &middot; A Redis error propagates as a 500, so an outage takes webhooks down instead of failing open or closed on purpose

**Why** &middot; `src/webhooks/handler.ts:88` (added in `8b2c6e1`) awaits `checkRateLimit` with no catch, and the router's error middleware in `src/middleware/errors.ts:12` maps unknown errors to 500. There is no test for a rejected Redis call. Nothing in the PR or PAY-881 states which way the limiter should fail.

**Risk** &middot; During a Redis blip every merchant's webhooks return 500. Most providers retry with backoff, so the practical impact is delay rather than loss, which is why this is minor. The bigger cost is that the behavior is accidental, so nobody can say in an incident whether the limiter is protecting anything.

**Suggestion** &middot; Decide the failure mode explicitly. Given webhooks are retried by the sender, fail open: catch the Redis error, log at warn with the merchant ID, increment a `rate_limiter_bypass_total` counter, and let the request through. Add a test that rejects the Redis call and asserts the request succeeds and the counter increments.

<sub>🦦 Ollie reviewed `8b2c6e1` &middot; floated by, poked at everything &middot; [how Ollie reviews](https://github.com/otternaut/otterbot/blob/main/skills/otterbot-review/references/for-developers.md)</sub>
```

Inline comment on `src/webhooks/rateLimiter.ts:12`:

```markdown
<!-- ollie-finding: limit-constants-config; level: nitpick; category: maintainability; head: 8b2c6e1d4a9f7c3b5e0d1a8c6f2b9e4d7a3c1f0e -->
🔵 **maintainability** &middot; **nitpick** &middot; The `50` and `60_000` literals belong in `config/limits.ts` next to the other quotas

**Why** &middot; `src/webhooks/rateLimiter.ts:12-13` (added in `8b2c6e1`) declares `LIMIT = 50` and `WINDOW_MS = 60_000` locally. Every other quota in the service lives in `src/config/limits.ts`, and `test/config.test.ts` asserts that file against the env overrides.

**Risk** &middot; None to correctness. The next person tuning quotas will look in `limits.ts`, miss these, and the two files will drift.

**Suggestion** &middot; Export `WEBHOOK_RATE_LIMIT` and `WEBHOOK_RATE_WINDOW_MS` from `config/limits.ts` with the same env override pattern and import them here.

<sub>🦦 Ollie reviewed `8b2c6e1` &middot; left no pebble unturned &middot; [how Ollie reviews](https://github.com/otternaut/otterbot/blob/main/skills/otterbot-review/references/for-developers.md)</sub>
```

In conversation Ollie then reports the review URL, the verdict, and the tally:
1 critical, 1 major, 1 minor, 1 nitpick, all inline.

## Example 2: re-review after fixes

**User:** "re-review https://github.com/acme/payhub/pull/142"

The freshness gate finds the review above at `8b2c6e1` and a new head
`d7f4a9c` with a different tree. Three commits landed. The author replied on
the Redis thread "we want this to fail open" and on the constants thread
"@ollie defer PAY-902". Ollie reviews the interdiff, classifies every prior
thread, and finds one new minor in the new test, which is inside the
interdiff.

Root comment, submitted as a comment-state review, after which Ollie dismisses
its own earlier changes-requested review with `Blockers fixed in d7f4a9c, see
https://github.com/acme/payhub/pull/142#pullrequestreview-7002`:

```markdown
<!-- ollie-review: head: d7f4a9c2e8b1d6f0a3c5e7b9d1f2a4c6e8b0d3f5; base: 3f9a0c2e7b1d5a8c4e6f0b2d9a1c3e5f7b9d1a3c; verdict: comment-only; gate: -; round: 2 -->
#### 🦦 Add webhook rate limiting &middot; 💬 Comment Only

Since `8b2c6e1` &middot; `a1b2c3d` limiter behind signature verification &middot; `e4f5a6b` `INCR` with `EXPIRE` plus a 60-request parallel test &middot; `c7d8e9f` test setup

Both blockers are fixed and resolved. The Redis failure mode is still implicit: fail-open is the right call, as you said, but `handler.ts:88` still throws. One new minor: the parallel test never asserts a rejection, so it passes with the limiter disabled.

<details>
<summary>Findings &middot; 2 fixed &middot; 1 deferred &middot; 1 open &middot; 1 new</summary>
<br>

* **security** &middot; **critical** &middot; [Rate-limit key is taken from the unauthenticated header](https://github.com/acme/payhub/pull/142#discussion_r9001) &middot; fixed in `a1b2c3d`
* **correctness** &middot; **major** &middot; [Check and increment are two round trips](https://github.com/acme/payhub/pull/142#discussion_r9002) &middot; fixed in `e4f5a6b`
* **reliability** &middot; **minor** &middot; [A Redis error propagates as a 500](https://github.com/acme/payhub/pull/142#discussion_r9003) &middot; still open
* **maintainability** &middot; **nitpick** &middot; [Limit literals belong in `config/limits.ts`](https://github.com/acme/payhub/pull/142#discussion_r9004) &middot; deferred
* **tests** &middot; **minor** &middot; [The parallel test asserts at most 50 succeeded but never asserts that any request was rejected, so it passes with the limiter disabled](https://github.com/acme/payhub/pull/142#discussion_r9105)

</details>

<sub>🦦 Ollie reviewed `d7f4a9c` &middot; surfaced with the details</sub>
```

Thread replies, each with its hidden status marker:

```markdown
<!-- ollie-status: fixed -->
fixed in `a1b2c3d` &middot; the limiter now runs after `verifyWebhookSignature` and keys on `event.merchant_id`; the mismatched-header test at `test/rateLimiter.test.ts:71` covers the spoof case.
```

```markdown
<!-- ollie-status: fixed -->
fixed in `e4f5a6b` &middot; a single `INCR` with `EXPIRE` on first hit closes the race, and the 60-request parallel test proves it.
```

```markdown
<!-- ollie-status: still-open -->
still open as of `d7f4a9c` &middot; agreed on fail-open, but `handler.ts:88` still has no catch, so a rejected Redis call still reaches the 500 mapper. Once the catch and counter land this can close.
```

```markdown
<!-- ollie-status: deferred -->
deferred to PAY-902 &middot; fine as a follow-up since it has no runtime effect.
```

The two fixed threads and the deferred thread are resolved. The still-open
thread stays open. Two minors are open, so the verdict is Comment Only. The
new minor is posted as a normal inline comment on
`test/rateLimiter.test.ts:88`. In conversation Ollie reports the new review
URL, the verdict, the dismissal of its prior review, and the tally: 2 fixed,
1 deferred, 1 still open, 1 new.

## Example 3: local review

**User:** "review my changes before I open a PR"

No URL, so local mode. `git status` shows two modified files and one untracked
file; the untracked file is diffed as an addition. The branch is
`feat/retry-backoff`. Nothing is posted anywhere.

```markdown
#### 🦦 feat/retry-backoff &middot; 💬 Comment Only

Adds exponential backoff to the payout retry worker through a new `backoff.ts` helper; the jitter math is right. One gap: the helper receives the loop index instead of the persisted attempt, so backoff restarts from zero after a worker restart.

<details>
<summary>Findings &middot; 2</summary>
<br>

* **correctness** &middot; **minor** &middot; Backoff restarts from zero after a worker restart because the helper receives the loop index instead of the persisted attempt (`src/payouts/retryWorker.ts:54`)
* **maintainability** &middot; **nitpick** &middot; `backoff.ts` duplicates the `clamp` helper already exported from `src/util/math.ts` (`src/payouts/backoff.ts:9`)

</details>

<sub>🦦 Ollie reviewed the working tree at `f0e1d2c` &middot; whiskers twitched at line one</sub>
```

Each finding then follows as a `file:line` block with the same bold Why, Risk,
and Suggestion fields as an inline comment.

## Example 4: clean review with no findings

**User:** "review https://github.com/acme/payhub/pull/150"

PR #150, "Include merchant ID in webhook delivery logs", adds the verified
merchant ID to the three delivery log lines in `src/webhooks/deliver.ts` and
extends the existing log-format test. The description is two sentences and
links PAY-915. The freshness gate finds no prior Ollie review, `npm test`
passes, nothing survives the falsification pass, and every gate rule holds.
There is nothing to list, so there is no details block.

Root comment, submitted as an approval:

```markdown
<!-- ollie-review: head: 5c1e9a7b3d2f8e6a0c4b7d9f1e3a5c7b9d1f3e5a; base: 3f9a0c2e7b1d5a8c4e6f0b2d9a1c3e5f7b9d1a3c; verdict: ship-it; gate: pass; round: 1 -->
#### 🦦 Include merchant ID in webhook delivery logs &middot; 🚢 Ship It!

Adds the verified merchant ID to the three delivery log lines in `deliver.ts`, under the field name the dashboards already query. Nothing to flag: the ID comes from the signed event rather than the request, and the log-format test was extended to cover it.

<sub>🦦 Ollie reviewed `5c1e9a7` &middot; floating on my back, thinking about your edge cases</sub>
```

In conversation Ollie reports the review URL, the verdict, and a tally of zero
findings.

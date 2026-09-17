# Host delivery notes

The skill is host-agnostic; this file records how the delivery rules map
onto the hosts Ollie is most often used with, and what to do when a host lacks
a capability. Prefer available tool schemas and established repository helpers. Consult host
documentation when a capability or field is unknown or rejected. When a capability is missing,
use the listed fallback and say so in the conversation summary.

## Review states

Select the verdict under `approval.md` before choosing the host operation.
Benign comments accompany an approval. Human Review Needed carries the human-only
hold defined in approval.md; other substantive non-approval reasons require
Request Changes with a clear explanation. Comment Only is only an
explicit opt-out for otherwise passing code. A host limitation can require a
plain comment carrying the intended verdict; never mislabel it Comment Only.
Ignore all CI/CD metadata during retrieval, submission and final verification.

Prepare the root and eligible inline findings together, regardless of verdict.
Where the host supports review grouping, the verdict body and every new inline
finding must belong to the same submitted review. The root is that review's
body, never a separate PR conversation comment. A link between separate posts
or matching timestamps does not establish attachment. Existing-thread replies
and historical findings retain their original threads.
During final verification, match every intended new inline finding to a
published comment by marker or anchor and verify its parent review identity; a successful root review or approval
alone does not establish finding delivery. Pending draft comments are not
published findings. Recover only missing comments within the recovery limit,
preserving deduplication and the same-review requirement. If the host cannot
attach a missing finding to the submitted review, do not publish it standalone
or create a second review merely to carry it. If inline publication remains unavailable, include
each missing finding's trigger, consequence, evidence and fix visibly in the
root index, or in conversation if host writes fail. Report the delivery
limitation and retain unfinished delivery for recovery; never silently drop
findings or mark delivery complete while comments remain pending.


| Verdict | GitHub | GitLab | Bitbucket Cloud |
| --- | --- | --- | --- |
| Ship It | review event `APPROVE` | approve the merge request | approve the pull request |
| Comment Only | `COMMENT` plus reconcile prior Ollie state | note plus reconcile prior Ollie state | comment plus reconcile prior Ollie state |
| Human Review Needed | review event `REQUEST_CHANGES` with the 🧑‍⚖️ banner | same blocking action/fallback as Request Changes with the 🧑‍⚖️ banner | request changes with the 🧑‍⚖️ banner |
| Request Changes | review event `REQUEST_CHANGES` | request changes where the version supports it; otherwise unapprove and post the root note | request changes |

Human Review Needed uses the same blocking host operations and state transitions
as Request Changes throughout this file; preserve `requires-human` in Ollie
markers and reports. When the required current-head sign-off arrives, reassess
all gates and clear/supersede Ollie's prior request before reporting approval.

Where a host cannot express a state, retain the intended verdict banner in
the grouped review body where supported and state the limitation. Use a plain
root comment only when the host lacks review grouping.

## Capability map

| Need | GitHub | GitLab | Bitbucket Cloud |
| --- | --- | --- | --- |
| Single-call review with inline comments | yes: create a review with a `comments` array and an `event` | draft notes, then publish all at once | no: post comments individually |
| File-level comment | yes: comment with `subject_type: file` | yes: file position type | yes: inline comment with a path and no line |
| Suggestion block | ```` ```suggestion ```` | ```` ```suggestion:-0+0 ```` | not supported; optional verified code or diff example |
| Edit review body after submit | yes | yes, edit the note | yes, edit the comment |
| Resolve or unresolve a thread | GraphQL `resolveReviewThread` / `unresolveReviewThread` | resolve or unresolve the discussion | resolve or reopen the comment |
| Dismiss own prior review | yes, with a message | unapprove | unapprove |
| Reviewer states | latest review per reviewer | approvals and reviewer states | participant states |

## GitHub

The required grouping uses GitHub's
[review API](https://docs.github.com/en/rest/pulls/reviews): one review owns the
verdict body and new inline comments. Use any available tool that preserves
this relationship; a tool lacking batch submission is not a host limitation.
Either create a review with its body, event and comments together, or stage all
comments on one pending review and submit that review with the verdict body.
Never submit an empty-body review with findings and post the verdict afterward
as an issue comment. Never publish new findings through standalone comment
operations before or after a separate verdict review.

The sequence for a GitHub PR, using the GitHub CLI's API access.
Replace placeholders; never pass a filename as the body.

1. Fetch the reviewing identity and a lightweight PR snapshot for early exits:
   author, head/base SHAs, target/integration context, draft/conflict state,
   latest
   reviewer states and the newest attributable Ollie marker. Then fetch changed
   files, lightweight thread identities/anchors/revisions and the newest
   attributable root review and ledger when review continues. Retrieve detailed
   bodies for new/edited/affected threads or missing records; when reliable
   metadata is unavailable, reconcile the full needed history. Fully paginate all needed
   connections, including nested comments; a single query is not a guarantee
   of completeness. Reuse results throughout the review.
2. Read the diff at the snapshot head. Investigate introducing commits only
   when provenance is necessary to establish a finding's scope.
3. Refresh head/base context and mutable gates once, then submit one review with the reviewed `commit_id`,
   verdict `event`, root Markdown `body` and inline `comments`. Changed head/base context
   prevents approval until assessed; never relabel findings as reviewing the newer head.
4. After the state transitions below, verify marker, effective review state,
   head/base context, review status, coverage state and mutable review gates, comment
   count and URLs together. Record the submitted review ID and verify its body
   contains the verdict banner, index and markers. Every new inline comment's
   `pull_request_review_id` must equal that ID; a pending review or a comment
   attached to another review is incomplete delivery.
   Match returned comments to findings by marker or anchor, then update the root
   once by editing that same review body to back-fill all new Findings & Observations
   links (never create an issue comment), preserving the approval
   ledger and ollie-state markers. Prior links come from the
   snapshot. If there are no missing links, no edit is needed. Retry a failed
   update at most once, then retain plain file:line entries and report the
   linking limitation without resubmitting the review.
5. Threads: reply to a prior comment with the replies endpoint, one call per
   necessary reply, never for unchanged status alone. Resolve and unresolve in a single GraphQL request by aliasing the
   mutations, for example
   `r1: resolveReviewThread(input:{threadId:"..."}) { thread { isResolved } }`
   repeated per thread, rather than one request per thread.
6. Reconcile the new verdict with Ollie's prior effective host state using
   the transition rules below; verify the effective state, not just the new
   comment's event. Never touch another reviewer's review.

Self-review: GitHub rejects approving or requesting changes on your own PR.
Post the review with `COMMENT`; the verdict banner carries the verdict.

## GitLab

Approvals are separate from notes. Post inline findings as draft notes and
publish them together so the review lands at once; post the root comment as
the first note. For Ship It, approve with the reviewed head as the API SHA
precondition; a mismatch prevents approval. For Request Changes, use the reviewer
request-changes action where available, otherwise remove any existing Ollie
approval and rely on the verdict banner. For an explicit Comment Only delivery opt-out, remove any prior
Ollie approval. Resolve discussions Ollie owns when a
finding
is classified fixed, deferred, accepted, superseded, or withdrawn.

## Bitbucket Cloud

Comments are posted individually; post the root comment first, then each
inline comment, then set the participant state with approve or request
changes; Comment Only removes any prior Ollie approval. Note in the conversation summary that delivery was not atomic.

## Effective review-state transitions

A new comment is not proof that an earlier approval or request for changes no
longer counts. Determine and reconcile Ollie's effective host state:

| Desired verdict | Required state action |
| --- | --- |
| Ship It | Approve at the reviewed head after all gates pass; supersede or clear Ollie's prior request for changes using the supported host operation |
| Request Changes | Submit that state and remove any prior Ollie approval if the host does not supersede it automatically |
| Comment Only after approval | Withdraw/dismiss only Ollie's prior approval, then leave the explanatory comment |
| Comment Only after Request Changes | Clear/dismiss Ollie's prior request only when every old blocker is verified fixed, superseded or disproven; retain any unresolved blocker as Request Changes |
| Comment Only with no active Ollie decision | Post the explanation; no removal needed |

GitHub uses review dismissal where an old decision must be cleared; GitLab
and Bitbucket have separate unapproval operations. Use the host's documented
operation for removing Ollie's request for changes when a new review does not
supersede it. Never reset all approvals or dismiss human reviews. Perform
necessary removals before granting any new approval; verify final effective
state after transitions. Include current head and mutable gates in that
verification. If a new push or gate change invalidated an approval during
delivery, withdraw Ollie's approval and explain the race without rereviewing
in a loop. Use atomic SHA preconditions where supported; on hosts without
atomic conditional approval, the final check is detection/recovery rather
than a guarantee against concurrent pushes. If removal is unauthorized or unsupported, report
that the prior decision remains active and the review state is not reconciled.
Do not claim an approval opt-out was applied while Ollie's approval still
counts. Do not claim blockers cleared on the host while its request remains.

## Fallbacks

Shadow bypasses all submission, transition, reply and edit operations; save a
local hypothetical result and attempted-action plan instead. For live work,
use one submission, one verification fetch and at most one root link update
normally, plus required state-transition calls, one call per necessary
thread reply and a batched resolution call. If a submission times
out, check the reviewed-head marker before retrying; never blindly duplicate
a review. Allow at most one recovery attempt for a failed operation, then
report the limitation. Pagination is required retrieval, not a retry loop.


- No single-call submission: use one pending review and submit it with the
  verdict body after staging its findings. If the host itself has no review
  grouping, use its host-specific root-first sequence and disclose that
  attachment is unavailable. If tools cannot access a host's supported review
  grouping, report the limitation and keep findings visible in the verdict
  body; do not fall back to detached inline comments.
- No body editing: retain known prior links and plain `file:line` for new
  findings; report that new links could not be back-filled.
- No file-level comments: attach to the nearest changed line in the file.
- Cannot express a verdict state: retain the verdict banner in the grouped
  review body when supported (for example, GitHub self-review uses `COMMENT`).
  Only hosts without review grouping use a plain root comment; state why.
- Cannot post at all: state the failure, show the report in conversation, and
  offer to review a pasted diff. Never present the review as delivered.

## super.engineering in-app surface

When running inside super.engineering, the in-app review surface is a
secondary target. A PR URL makes the hosting-provider review mandatory and the
in-app comments optional extras. With no PR URL, the in-app surface may be the
delivery target instead of the conversation. Read managed state with
`sc worktree status --json` for the target branch and
`sc worktree review-list --json` for existing comments. Post the root comment
with `sc worktree review-add ... --provider otterbot-review`, then each inline
finding on its changed range. On a re-review, update only affected Ollie comments
using the same lifecycle rules as host threads: resolve verified fixes, answer
new questions, and leave unchanged still-open comments without another reply.
Keep the personality footer on each new inline comment or reply; include it
on the root only when no inline findings accompany the review. Do not
archive unresolved findings merely to replace the review generation.

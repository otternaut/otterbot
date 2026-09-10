# Host delivery notes

The skill is host-agnostic; this file records how the delivery rules in §8 map
onto the hosts Ollie is most often used with, and what to do when a host lacks
a capability. Verify flags and field names against the host's current
documentation before relying on them; APIs drift. When a capability is missing,
use the listed fallback and say so in the conversation summary.

## Review states

| Verdict | GitHub | GitLab | Bitbucket Cloud |
| --- | --- | --- | --- |
| Ship It! | review event `APPROVE` | approve the merge request | approve the pull request |
| Needs Context | review event `COMMENT` | note only, no approval change | comment only |
| Needs Eyes | review event `COMMENT` | note only, no approval change | comment only |
| Comment Only | review event `COMMENT` | note only, no approval change | comment only |
| Request Changes | review event `REQUEST_CHANGES` | request changes where the version supports it; otherwise unapprove and post the root note | request changes |

Where a host cannot express a state, post the root comment as a plain comment
with the verdict in the title and state the limitation.

## Capability map

| Need | GitHub | GitLab | Bitbucket Cloud |
| --- | --- | --- | --- |
| Single-call review with inline comments | yes: create a review with a `comments` array and an `event` | draft notes, then publish all at once | no: post comments individually |
| File-level comment | yes: comment with `subject_type: file` | yes: file position type | yes: inline comment with a path and no line |
| Suggestion block | ```` ```suggestion ```` | ```` ```suggestion:-0+0 ```` | not supported; describe the change |
| Edit review body after submit | yes | yes, edit the note | yes, edit the comment |
| Resolve or unresolve a thread | GraphQL `resolveReviewThread` / `unresolveReviewThread` | resolve or unresolve the discussion | resolve or reopen the comment |
| Dismiss own prior review | yes, with a message | unapprove | unapprove |
| Required checks status | status check rollup on the head commit | pipeline status | commit statuses |
| Reviewer states | latest review per reviewer | approvals and reviewer states | participant states |

## GitHub

The recommended sequence for a GitHub PR, using the GitHub CLI's API access.
Replace placeholders; never pass a filename as the body.

1. Identity and freshness: `gh api user` for the reviewing login; fetch the PR
   with head and base SHAs, `isDraft`, `reviewDecision`, `statusCheckRollup`,
   the latest review per author, and every review thread with comments and
   `isResolved`. The marker in the newest Ollie review body gives the reviewed
   head. Compare tree OIDs of the two commits when heads differ.
2. Diff scope: `git diff --merge-base <base> <head>` or the compare endpoint.
   Use `git blame` at the head restricted to the PR's commits to find the
   introducing SHA for each anchored line.
3. Submit: one call to create the review with `commit_id` set to the reviewed
   head, `event` set from the verdict, `body` set to the root Markdown, and
   `comments` set to the inline findings, each with `path`, `line`, `side`, and
   optional `start_line`, or `subject_type: file` for a file-level comment.
4. Verify: fetch the created review and confirm the body starts with the
   marker and the comment count matches. Fetch the review's comments to get
   their URLs, then update the review body so each findings bullet links to its
   thread.
5. Threads: reply to a prior comment with the replies endpoint; resolve or
   unresolve with the GraphQL mutations using the thread node id.
6. Transitions: when the new verdict is Needs Context, Needs Eyes, or Comment
   Only and the
   prior Ollie review was changes requested with every blocker fixed, dismiss
   that prior review with the message `Blockers fixed in <sha>, see
   <review-url>`. A new approval or changes-requested review supersedes the
   prior state on its own.

Self-review: GitHub rejects approving or requesting changes on your own PR.
Post the review with `COMMENT` and state the verdict in the title.

## GitLab

Approvals are separate from notes. Post inline findings as draft notes and
publish them together so the review lands at once; post the root comment as
the first note. For Ship It!, approve. For Request Changes, use the reviewer
request-changes action where available, otherwise remove any existing Ollie
approval and rely on the title. Resolve discussions Ollie owns when a finding
is classified fixed, deferred, accepted, superseded, or withdrawn.

## Bitbucket Cloud

Comments are posted individually; post the root comment first, then each
inline comment, then set the participant state with approve or request
changes. Note in the conversation summary that delivery was not atomic.

## Fallbacks

- No single-call submission: post the root comment first, then each inline
  comment, then set the state. Say so.
- No file-level comments: attach to the nearest changed line in the file.
- No body editing: findings bullets keep `file:line` instead of links.
- Cannot attach a verdict: post the root comment as a plain comment with the
  verdict in the title and state why.
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
finding on its changed range. On a re-review, resolve every prior
`otterbot-review` comment with `sc worktree review-reply <id> --provider
otterbot-review --resolve` before posting the new root and only the current
open findings; this archival marks the old generation superseded on that
surface and does not imply a finding was fixed.

# super.engineering in-app surface

Read only when running inside super.engineering; `hosts.md` covers every other
delivery rule. There, the in-app review surface is a secondary target. A PR URL
makes the hosting-provider review mandatory and the in-app comments optional
extras. With no PR URL, the in-app surface may be the delivery target instead of
the conversation. Read managed state with `sc worktree status --json` for the
target branch and `sc worktree review-list --json` for existing comments. Post
the root comment with `sc worktree review-add ... --provider otterbot-review`,
then each inline finding on its changed range. On a re-review, update only
affected Ollie comments using the same lifecycle rules as host threads: resolve
verified fixes, answer new questions, and leave unchanged still-open comments
without another reply. Keep the personality footer on each new inline comment or
reply; include it on the root only when no inline findings accompany the review.
Do not archive unresolved findings merely to replace the review generation.


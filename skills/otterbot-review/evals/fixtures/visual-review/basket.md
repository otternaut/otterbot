# Offline pull-request snapshot

This is a synthetic, self-contained repository snapshot for shadow review.
Use the supplied files as the full repository and host snapshot; do not contact
an external host or publish a review. Inspect supplied image files directly.

- Repository: harbor-basket
- PR: https://github.com/fixture-org/harbor-basket/pull/12
- Author: river
- Reviewing identity: ollie-bot
- State: open, not draft
- Head: 2222222222222222222222222222222222222222
- Base and target main: 1111111111111111111111111111111111111111
- Integration: same content as supplied head; no conflicts
- Previous Ollie reviews: none
- Human review records: none
- Required linked sources: none
- Repository contents: one index.html served as-is with its inline script;
  no build step, external resources, network operations or route handlers. No repository-specific review requirements.
- Base index.html: basket-base.html
- Head index.html: basket-head.html
- Diff: basket.diff
- Snapshot unchanged at delivery preflight.

## Author description

Extract the basket total calculation into a named function.

## Author replies

None.

## Attachments

None.

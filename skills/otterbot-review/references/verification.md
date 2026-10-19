# Code evidence for approval

Read when consequential behavior affects approval. The objective
is a defensible decision about changed behavior, not a prescribed test count
or proof of all possible executions. No review can guarantee absence of bugs.

## Consequential behavior

Permissions, sensitive data, persistence, migrations, concurrency, external
side effects and public contracts require explicit evidence. Other changes
qualify when a realistic failure would materially affect users. For each
changed boundary, establish at least one adequate route:

- Existing relevant tests: read assertions and setup, including applicable
  failure/negative cases. Confirm they exercise the actual changed path and
  use only local execution results actually observed.
- Targeted reproduction: run a bounded local check demonstrating the important
  behavior, with realistic inputs and meaningful assertions, in an isolated
  temporary workspace. No installation, credentials or external side effects.
- Code-path argument: trace the actual reachable input/caller through guards,
  transformations and effects to success/failure outcomes. Cite the concrete
  guard, transaction/atomic primitive, consumer or contract that establishes
  the property. "Looks fine", a function name or an assumed upstream check is
  insufficient. State environmental assumptions; if material and unverified,
  the argument is not adequate.

A test read but not run is design evidence, not a passing result. It can
support approval when its behavior and the changed implementation can be
established by inspection; it cannot establish unobserved runtime, integration
or concurrency properties merely by existing. Choose evidence proportional to
the risk. Tests that stub out the changed boundary do not cover that boundary.
No test is universally mandatory except the retained prior-critical test gate.

Keep the boundary-to-evidence mapping in the finding records' `evidence` and
`disproof` fields (`analysis.md`) and in the coverage areas' `evidence` strings
(`readiness.md`); there is no separate structure. Publish only the decisive evidence or exact gap, with file/test
references. If adequate evidence is unavailable, use Request Changes for the
specific unverified behavior, except for the visual-evidence gate below; do not
label absence of tests a fabricated bug.
A demonstrated defect gets its actual severity and normal verdict precedence.
Human review never satisfies this verification gate.

## Visual evidence

For every review, determine whether the diff changes visible UI or rendered
output: layout, styling, displayed content, assets or visible interaction
states. Judge the effect, not the filename. Backend-only changes, tests,
internal frontend refactors with unchanged output and prose-only docs do not
require visual evidence. A backend change that actually changes the UI does.

For a visible change, inspect screenshots, video, GIFs or equivalent captured
rendered output in the PR description, attachments, linked evidence or author
replies. Local reviews may use supplied files or an already available local
capture. Apply the external-review information boundary before reading other
reviewers' material. Evidence must show the changed result and relevant states;
a before image, design mockup, source diff, test assertions, logs or "tested
locally" alone does not show the implemented change. A static screenshot may
establish a static change; use a recording or state captures when the change is
an interaction. Do not demand video, before/after pairs or every viewport by
default. No new screenshot is needed when existing evidence still applies to
unchanged visible behavior; an embedded commit SHA is not mandatory.

Normalize `visual-evidence` separately from ordinary behavior verification:

- `not-required`: inspection establishes no visible change.
- `provided`: inspected visual evidence shows the affected result/states and
  still applies to the reviewed behavior. Presence is not proof of correctness;
  report demonstrated defects normally.
- `missing`: a visible change is established, but relevant visual evidence is
  absent (including unrelated or obsolete media). Name what must be shown.
- `unknown`: applicability or access cannot be established, such as an
  attachment the reviewer cannot open. State that limitation under Request
  Changes rather than claiming the author supplied nothing.

Record missing visual evidence as a separate verification hold and continue the
code review. Ordinary code coverage and `evidence` exclude only the missing
visual inspection tracked by this gate: never mark unreviewed code complete or
an unrelated gap adequate. Use `approval.md` to select the verdict from all
holds and findings; absence of a capture is not a defect or severity.

Ask for a concrete capture, such as "Attach a screenshot of the updated account
menu in its open state." Record a verification hold and the missing views in
`readiness.md`. Relevant added or edited evidence triggers bounded reassessment
even without a new commit. Inspect it, clear only this hold, and rerun all
gates; attaching media never automatically approves.

## Sufficient evidence and stopping

Before investigating, name the changed property and the realistic failure that
would change the verdict. Choose the cheapest adequate route above. Stop when
it establishes the real changed path and relevant success/failure handling,
material assumptions are supported, and no contradictory evidence or credible
blocker remains. One route may cover several related changes; unrelated
boundaries still need their own evidence. A passing test with a mocked boundary
or an unchanged helper alone does not satisfy this rule.

Do not add a reproduction after sufficient inspection merely for reassurance,
or read more equivalent tests after the decisive assertions establish the
property. Expand only to resolve a specific remaining uncertainty. The
prior-critical covering-test gate remains mandatory even when a code-path
argument otherwise suffices. Reuse applicable evidence under `readiness.md`.
Stop at the step budget in `performance.md`; preserve unresolved properties as
verification holds rather than lowering the standard.

## CI/CD exclusion

This section is the single owner of the CI rule; other files point here
instead of restating it.

Ignore workflow status, check results, logs, enforcement and merge-protection
rules entirely. Do not retrieve them, wait for them, use them as proof or as
gaps, or mention them anywhere: not in the blurb, findings, reasons, markers,
`decision_key`, resume keys or the conversation summary. A code-correctness
verdict is identical whether workflows pass, fail, run, are skipped, are
unavailable or do not exist. CI-only events require no review update and never
invalidate a completed review; a legacy CI-only hold is discarded under the
policy migration in `readiness.md` without querying checks.

Source changes to workflow and deployment definitions are ordinary behavioral
code and receive a normal review. Compile, type and behavioral defects are
reported only when established independently from source or a bounded local
reproduction; never read or cite CI diagnostics for them.

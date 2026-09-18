# Finding records and disproof

Read when a candidate defect is identified, before verifying or posting it.
The goal is precision: every posted finding survived a deliberate attempt to
disprove it, and every discarded candidate leaves a one-line reason.

## Finding record

Keep one compact record per candidate for the whole run. Render inline
comments, the Findings index and the approval ledger from these
records, never from memory of the diff. Fields:

```json
{"id":"<root-cause-slug>","anchor":"<file:line at head>","category":"<one word>","level":"critical|major|minor|nitpick|question","trigger":"<concrete input, caller or sequence that reaches the code>","consequence":"<what breaks, for whom>","evidence":["<file:line symbol — fact it proves>"],"disproof":[{"check":"<guard, caller, test or contract inspected>","result":"holds|refuted|unknown"}],"status":"candidate|verified|refuted|unresolved","fix":"<smallest concrete change>","verify":"<regression scenario and expected result>","publication":"inline|overflow|externally-covered","thread_url":"<Ollie's own published thread URL or null>"}
```

Only `verified` records may be posted or counted. `refuted` records are
dropped silently. `unresolved` records with potentially serious impact become
a specific verification hold, not a finding. `externally-covered` is a
publication disposition on a verified Ollie record, not a source or status:
it suppresses a redundant inline comment but keeps Ollie's independently
established finding and count. Render it as threadless overflow from Ollie's
record. Never copy or persist the external URL, wording, evidence or fix.

## Independent-candidate boundary

For an initial or changed-code review, complete candidate formation, the
disproof protocol and verification without external-review content in context.
Freeze the verified records before fetching another reviewer's comment bodies,
titles, anchors, paths, lines or concern markers. The frozen record includes
its stable ID, trigger, consequence, evidence, disproof result, severity, fix
and verification scenario. Do not add a candidate after the external fetch
unless new code or requirement evidence—not the comment—independently exposes
it; defer that code investigation to a clean-context review when provenance
cannot be established.

After the freeze, compare external comments by root cause only. A match may set
`publication` to `externally-covered`; it must not alter the record, set
`thread_url`, appear in Findings as a linked finding, or be
labelled as a finding sourced from that reviewer. Non-matches do not expand
scope. Targeted replies and commands may be read earlier for their lifecycle
job, but their claims cannot seed candidates in a simultaneous code review.

## Disproof protocol

Before marking a candidate `verified`, attempt each applicable check and record
its result. A candidate is verified only when no check refutes it and every
check needed to establish reachability returned `holds`.

0. **Scope.** Confirm the anchor is a changed line, or that this change
   newly triggers or worsens the behavior. A pre-existing bug the change does
   not touch is out of scope and is not a finding.
1. **Guard search.** Search for an existing check on the same condition
   upstream of the anchor: callers, middleware, decorators, schema validation,
   type narrowing, database constraints. A guard counts only when it is on
   every relevant entry path, so enumerate the callers rather than assume.
2. **Reachability.** Name the real caller or input that produces the trigger.
   Values ruled out by types, enums, parsing or invariants are not triggers.
3. **Consequence.** Follow the wrong value or state to the point where a user,
   caller or record is affected. A wrong intermediate that is corrected,
   ignored or unreachable downstream is not a consequence.
4. **Tests.** Read tests covering the changed path. A test that exercises the
   trigger and asserts the correct outcome refutes the candidate unless the
   test mocks out the changed boundary.
5. **Intent.** Check the description, linked requirements and nearby comments
   for a stated reason the behavior is deliberate. Deliberate behavior with
   a verified harmful consequence remains a finding, stated as a trade-off.
6. **Severity.** Ask what the worst realistic outcome is and how many callers
   or records it reaches. When impact falls between levels, take the lower
   one; when the impact cannot be bounded, keep the record `unresolved`.

Prefer inspection; run a bounded local reproduction only when inspection
cannot settle a verdict-affecting check, within the limits in
`performance.md` and `verification.md`.

## Selective nitpicks

Consider maintenance and clarity improvements by default, but only post those
with a specific, evidenced benefit in changed code. They do not need a runtime
failure. For a nitpick record, `trigger` describes the maintenance task or
reading context, `consequence` the demonstrated confusion or maintenance cost,
and `verify` how to check the improvement while preserving behavior.

Before marking one verified, confirm scope, inspect repository conventions and
intent, identify the concrete cost, and check that the proposed change removes
it without unnecessary refactoring. Use applicable disproof checks above;
never invent a runtime trigger to force a suggestion into defect criteria.

Useful examples include a name or comment that contradicts actual behavior,
newly duplicated decision logic with evidenced divergence, or a test name that
claims behavior its assertions do not exercise. A demonstrated runtime defect
gets its actual severity instead. Missing tests alone remain insufficient.

Reject personal naming preferences, formatting already handled by tooling,
generic requests for helpers or tests, and speculative future extensibility.
Keep at most two useful nitpicks on an initial review without a critical finding,
none on re-review; omit the remainder rather than creating optional overflow.
Nitpicks never count toward approval, require a fix for approval or become a
verification hold. No nitpicks is a valid result.

## Common false positives

Discard candidates that rest only on these patterns unless a check above
shows a real consequence: a missing null check on a value the type system or
an upstream parser already guarantees; a "missing" error handler where the
caller intentionally propagates; a race on state that is only ever touched
from one task or request; an unbounded loop over an input that is bounded by
schema or pagination; a security concern about data that is already public or
already validated at the trust boundary; a performance concern without a
realistic scale; and a defect in unchanged code that this change neither
triggers nor worsens.

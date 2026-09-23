import * as vitest from "vitest";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
import * as contracts from "~/contracts/review";
import * as fixtures from "../../test/fixtures";

vitest.describe("publication contract", () => {
  vitest.it("accepts a complete evidenced proposal", () => {
    const value = fixtures.job();

    vitest
      .expect(contracts.validateProposal(fixtures.proposal(value), value).verdict)
      .toBe("ship-it");
  });
  vitest.it.each(["jobId", "head", "base", "skillHash", "policyRevision"] as const)(
    "rejects stale %s",
    (field) => {
      const value = fixtures.job();
      const result = fixtures.proposal(value);

      result[field] =
        field === "policyRevision"
          ? "999"
          : "f".repeat(field === "head" || field === "base" ? 40 : 64);
      vitest.expect(() => contracts.validateProposal(result, value)).toThrow();
    },
  );
  vitest.it(
    "rejects approval with incomplete coverage, holds, unknown merge context, or self review",
    () => {
      for (const variant of ["coverage", "hold", "mergeable", "author"]) {
        const value = fixtures.job();
        const result = fixtures.proposal(value);
        if (variant === "coverage") {
          result.coverage[0]!.status = "incomplete";
        }

        if (variant === "hold") {
          result.holds.push("Unresolved behavior");
        }

        if (variant === "mergeable") {
          value.snapshot!.mergeable = null;
        }

        if (variant === "author") {
          value.snapshot!.authorId = value.event.reviewerId;
        }

        vitest.expect(() => contracts.validateProposal(result, value)).toThrow();
      }
    },
  );
  vitest.it("requires candidate freeze and complete changed-file coverage", () => {
    const value = fixtures.job();

    delete value.frozen;
    vitest.expect(() => contracts.validateProposal(fixtures.proposal(value), value)).toThrow();
    value.frozen = "x";
    const result = fixtures.proposal(value);

    result.coverage[0]!.path = "unrelated";
    vitest.expect(() => contracts.validateProposal(result, value)).toThrow("Missing file coverage");
  });
  vitest.it("validates old and new hunk lines", () => {
    vitest.expect(contracts.validAnchor(fixtures.snapshot.files[0]!.patch, 2, "LEFT")).toBe(true);
    vitest.expect(contracts.validAnchor(fixtures.snapshot.files[0]!.patch, 3, "RIGHT")).toBe(true);
    vitest.expect(contracts.validAnchor(fixtures.snapshot.files[0]!.patch, 4, "RIGHT")).toBe(false);
    vitest.expect(contracts.validAnchor(undefined, 1, "RIGHT")).toBe(false);
  });
  vitest.it("rejects inconsistent counted findings", () => {
    const value = fixtures.job();
    const result = fixtures.proposal(value);

    result.decision.blockers = 1;
    result.verdict = "request-changes";
    vitest
      .expect(() => contracts.validateProposal(result, value))
      .toThrow("Inconsistent finding counts");
  });
});

vitest.describe("Bash policy parity", () => {
  const cases: contracts.Decision[] = [];

  for (const blockers of [0, 1]) {
    for (const minors of [0, 1, 3]) {
      for (const coverage of ["complete", "incomplete"] as const) {
        for (const gates of ["pass", "hold", "human-required"] as const) {
          for (const minorRisk of ["safe", "uncertain"] as const) {
            cases.push({
              blockers,
              minors,
              coverage,
              gates,
              minorRisk,
              context: "current",
              evidence: "adequate",
            });
          }
        }
      }
    }
  }

  vitest.it.each(cases)("matches the canonical helper for %j", (input) => {
    const args = [
      "--blockers",
      String(input.blockers),
      "--minors",
      String(input.minors),
      "--coverage",
      input.coverage,
      "--context",
      input.context,
      "--evidence",
      input.evidence,
      "--gates",
      input.gates,
      "--minor-risk",
      input.minorRisk!,
    ];
    const path = resolve(".output/skill/scripts/decide");
    const actual = JSON.parse(execFileSync("bash", [path, ...args], { encoding: "utf8" })) as {
      verdict: string;
    };

    vitest.expect(contracts.decide(input)).toBe(actual.verdict);
  });
  vitest.it("suppresses only passing approval for no-approve", () => {
    const input = fixtures.proposal().decision;

    vitest.expect(contracts.decide(input, true)).toBe("comment-only");
    vitest.expect(contracts.decide({ ...input, blockers: 1 }, true)).toBe("request-changes");
  });
});

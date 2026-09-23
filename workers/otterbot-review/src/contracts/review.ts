import * as v from "valibot";
import type * as configuration from "~/contracts/config";

/** Authenticated base-repository routing and the selected reviewer/provider configuration. */
export interface Event {
  action: string;
  repositoryId: number;
  owner: string;
  repository: string;
  number: number;
  reviewerId: number;
  organization: configuration.Organization;
  profile: configuration.Profile;
}

export const shaSchema = v.pipe(v.string(), v.regex(/^[a-f0-9]{40}$/));
export const decisionSchema = v.strictObject({
  blockers: v.pipe(v.number(), v.safeInteger(), v.minValue(0), v.maxValue(999999)),
  minors: v.pipe(v.number(), v.safeInteger(), v.minValue(0), v.maxValue(999999)),
  minorRisk: v.optional(v.picklist(["safe", "uncertain"])),
  coverage: v.picklist(["complete", "incomplete", "unknown"]),
  context: v.picklist(["current", "stale", "unknown"]),
  evidence: v.picklist(["adequate", "inadequate", "unknown"]),
  gates: v.picklist(["pass", "human-required", "hold", "unknown"]),
});
export const findingSchema = v.strictObject({
  id: v.pipe(v.string(), v.regex(/^[a-zA-Z0-9_-]{1,64}$/)),
  severity: v.picklist(["critical", "major", "minor", "nitpick"]),
  path: v.pipe(v.string(), v.minLength(1), v.maxLength(1024)),
  line: v.pipe(v.number(), v.safeInteger(), v.gtValue(0)),
  side: v.picklist(["LEFT", "RIGHT"]),
  body: v.pipe(v.string(), v.minLength(1), v.maxLength(20000)),
  evidence: v.pipe(v.array(v.pipe(v.string(), v.minLength(1), v.maxLength(4000))), v.minLength(1)),
  disposition: v.picklist(["inline", "overflow", "external", "historical"]),
});
export const proposalSchema = v.strictObject({
  schema: v.literal(1),
  jobId: v.pipe(v.string(), v.regex(/^[a-f0-9]{64}$/)),
  head: shaSchema,
  base: shaSchema,
  integration: v.nullable(shaSchema),
  skillHash: v.pipe(v.string(), v.regex(/^[a-f0-9]{64}$/)),
  policyRevision: v.string(),
  decision: decisionSchema,
  verdict: v.picklist(["ship-it", "request-changes", "requires-human", "comment-only"]),
  body: v.pipe(v.string(), v.minLength(1), v.maxLength(60000)),
  findings: v.pipe(v.array(findingSchema), v.maxLength(200)),
  coverage: v.pipe(
    v.array(
      v.strictObject({
        path: v.string(),
        status: v.picklist(["reviewed", "excluded", "incomplete"]),
        reason: v.pipe(v.string(), v.minLength(1)),
        evidence: v.array(v.string()),
      }),
    ),
    v.minLength(1),
    v.maxLength(5000),
  ),
  holds: v.pipe(v.array(v.pipe(v.string(), v.minLength(1))), v.maxLength(100)),
});
/** Validated agent findings, review coverage, and verdict bound to one immutable context. */
export type Proposal = v.InferOutput<typeof proposalSchema>;
/** Normalized review gate inputs consumed by the portable skill decision policy. */
export type Decision = v.InferOutput<typeof decisionSchema>;
/** GitHub state and changed-file evidence captured for a single review context. */
export interface Snapshot {
  head: string;
  base: string;
  integration: string | null;
  mergeBase: string;
  target: string;
  authorId: number;
  reviewerId: number;
  draft: boolean;
  open: boolean;
  mergeable: boolean | null;
  title: string;
  body: string;
  requested: boolean;
  files: {
    path: string;
    previous?: string;
    patch?: string;
    status: string;
    additions: number;
    deletions: number;
  }[];
}

/** In-memory state for a single review process; never persisted. */
export interface Job {
  id: string;
  event: Event;
  release: {
    skillHash: string;
    policyRevision: string;
  };
  deadline: number;
  snapshot?: Snapshot;
  toolsUsed: number;
  frozen?: string;
}

/**
 * Apply the skill's normalized decision table without changing its evidence.
 *
 * Parity tests compare this implementation with the bundled Bash helper.
 *
 * @param input - Verified normalized inputs.
 * @param noApprove - Explicit approval opt-out.
 * @returns The policy verdict.
 * @throws Error when minor risk is missing for outstanding minors.
 * @example
 * ```ts
 * import * as contracts from "~/contracts/review";
 * function verdict(verified: contracts.Decision) {
 *   return contracts.decide(verified, true); // Explicitly prevent approval.
 * }
 * ```
 */
export function decide(input: Decision, noApprove = false): Proposal["verdict"] {
  if (input.minors && !input.minorRisk) {
    throw new Error("Missing minor risk");
  }

  if (input.blockers) {
    return "request-changes";
  }

  if (
    !input.minors &&
    input.coverage === "complete" &&
    input.context === "current" &&
    input.evidence === "adequate" &&
    input.gates === "human-required"
  ) {
    return "requires-human";
  }

  if (
    input.coverage !== "complete" ||
    input.context !== "current" ||
    input.evidence !== "adequate" ||
    input.gates !== "pass" ||
    input.minors >= 3 ||
    (input.minors && input.minorRisk === "uncertain")
  ) {
    return "request-changes";
  }

  return noApprove ? "comment-only" : "ship-it";
}

/**
 * Validate a provider proposal against the active, immutable review attempt.
 *
 * Schema checks do not prove the semantic correctness of findings.
 *
 * @param input - Untrusted structured agent output.
 * @param job - Current authoritative job state.
 * @returns A schema-checked proposal authorized for this job.
 * @throws Error for stale identity, policy contradictions, or invalid anchors.
 * @example
 * ```ts
 * import * as contracts from "~/contracts/review";
 * function validate(input: unknown, job: contracts.Job) {
 *   return contracts.validateProposal(input, job); // Rejects stale identity or invalid evidence.
 * }
 * ```
 */
export function validateProposal(input: unknown, job: Job): Proposal {
  const proposal = v.parse(proposalSchema, input);
  const snapshot = job.snapshot;
  if (
    !snapshot ||
    proposal.jobId !== job.id ||
    proposal.head !== snapshot.head ||
    proposal.base !== snapshot.base ||
    proposal.integration !== snapshot.integration ||
    proposal.skillHash !== job.release.skillHash ||
    proposal.policyRevision !== job.release.policyRevision
  ) {
    throw new Error("Stale proposal identity");
  }

  if (decide(proposal.decision, job.event.profile.mode === "no-approve") !== proposal.verdict) {
    throw new Error("Contradictory verdict");
  }

  if (!job.frozen) {
    throw new Error("Candidates must be frozen before publication");
  }

  const ids = new Set<string>();

  for (const finding of proposal.findings) {
    if (ids.has(finding.id)) {
      throw new Error("Duplicate finding");
    }

    ids.add(finding.id);
    const file = snapshot.files.find((item) => item.path === finding.path);
    if (!file) {
      throw new Error("Finding outside reviewed change");
    }

    if (finding.disposition === "inline" && !validAnchor(file.patch, finding.line, finding.side)) {
      throw new Error("Invalid diff anchor");
    }

    if (finding.disposition !== "inline" && !proposal.body.includes(finding.id)) {
      throw new Error("Missing root finding");
    }
  }

  const blockers = proposal.findings.filter((f) =>
    ["critical", "major"].includes(f.severity),
  ).length;
  const minors = proposal.findings.filter((f) => f.severity === "minor").length;
  if (proposal.decision.blockers !== blockers || proposal.decision.minors !== minors) {
    throw new Error("Inconsistent finding counts");
  }

  for (const file of snapshot.files) {
    if (!proposal.coverage.some((area) => area.path === file.path)) {
      throw new Error("Missing file coverage");
    }
  }

  if (
    proposal.decision.coverage === "complete" &&
    proposal.coverage.some(
      (area) =>
        area.status === "incomplete" || (area.status === "reviewed" && !area.evidence.length),
    )
  ) {
    throw new Error("Incomplete coverage");
  }

  if (
    proposal.verdict === "ship-it" &&
    (proposal.holds.length ||
      snapshot.draft ||
      snapshot.authorId === snapshot.reviewerId ||
      snapshot.mergeable !== true)
  ) {
    throw new Error("Approval gates not met");
  }

  return proposal;
}

/**
 * Check whether a GitHub inline anchor belongs to a displayed diff hunk.
 *
 * Missing or truncated patches fail closed for inline publication.
 *
 * @param patch - GitHub's per-file unified patch, if available.
 * @param line - One-based line number.
 * @param side - Old or new side of the diff.
 * @returns Whether the line is addressable on the requested side.
 * @example
 * ```ts
 * import { validAnchor } from "~/contracts/review";
 * const patch = "@@ -1 +1 @@\n-old\n+new";
 * console.log(validAnchor(patch, 1, "RIGHT")); // true
 * ```
 */
export function validAnchor(
  patch: string | undefined,
  line: number,
  side: "LEFT" | "RIGHT",
): boolean {
  if (!patch) {
    return false;
  }

  let left = 0;
  let right = 0;
  let inHunk = false;

  for (const row of patch.split("\n")) {
    const match = /^@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/.exec(row);
    if (match) {
      left = Number(match[1]);
      right = Number(match[2]);
      inHunk = true;
      continue;
    }

    if (!inHunk || row.startsWith("\\")) {
      continue;
    }

    if (
      (side === "LEFT" && !row.startsWith("+") && left === line) ||
      (side === "RIGHT" && !row.startsWith("-") && right === line)
    ) {
      return true;
    }

    if (!row.startsWith("+")) {
      left++;
    }

    if (!row.startsWith("-")) {
      right++;
    }
  }

  return false;
}

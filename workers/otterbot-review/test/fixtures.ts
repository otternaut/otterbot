import { createHmac } from "node:crypto";
import { parseConfig } from "~/contracts/config";
import type * as contracts from "~/contracts/review";

export const testConfig = {
  profiles: {
    default: {
      provider: "claude",
      model: "example-model",
      effort: "medium",
      apiKeySecret: "PROVIDER_KEY_EXAMPLE",
      mode: "shadow",
    },
  },
  organizations: [
    {
      owner: "example-org",
      ownerId: 10,
      reviewer: "example-reviewer",
      reviewerId: 20,
      patSecret: "GH_PAT_EXAMPLE",
      repositories: ["example-repo"],
      profile: "default",
    },
    {
      owner: "second-org",
      ownerId: 11,
      reviewer: "example-reviewer",
      reviewerId: 20,
      patSecret: "GH_PAT_SECOND",
      repositories: ["example-repo"],
      profile: "default",
    },
    {
      owner: "third-org",
      ownerId: 12,
      reviewer: "example-reviewer",
      reviewerId: 20,
      patSecret: "GH_PAT_THIRD",
      repositories: ["example-repo"],
      profile: "default",
    },
    {
      owner: "Fourth-Org",
      ownerId: 13,
      reviewer: "work-reviewer",
      reviewerId: 21,
      patSecret: "GH_PAT_FOURTH",
      repositories: ["example-repo"],
      profile: "default",
    },
  ],
  hooks: [
    {
      id: "example",
      organization: "example-org",
      secret: "WEBHOOK_SECRET_EXAMPLE",
    },
    {
      id: "second",
      organization: "second-org",
      secret: "WEBHOOK_SECRET_SECOND",
    },
    { id: "third", organization: "third-org", secret: "WEBHOOK_SECRET_THIRD" },
    {
      id: "fourth",
      organization: "Fourth-Org",
      secret: "WEBHOOK_SECRET_FOURTH",
    },
  ],
};
export const config = parseConfig(JSON.stringify(testConfig));

/**
 * Construct a representative GitHub review-request payload.
 *
 * @param index - Organization fixture index.
 * @returns An independently mutable webhook object.
 */
export function payload(index = 0) {
  const org = config.organizations[index]!;
  const repository = {
    id: 100 + index,
    name: "example-repo",
    owner: { id: org.ownerId, login: org.owner },
  };

  return {
    action: "review_requested",
    number: 1,
    repository,
    requested_reviewer: { id: org.reviewerId, login: org.reviewer },
    sender: { id: 999, login: "untrusted-sender" },
    pull_request: {
      number: 1,
      base: { repo: structuredClone(repository) },
      head: { repo: { id: 9999, owner: { id: 999, login: "untrusted-fork" } } },
      draft: false,
      state: "open",
    },
  };
}

export const snapshot: contracts.Snapshot = {
  head: "1".repeat(40),
  base: "2".repeat(40),
  integration: "3".repeat(40),
  mergeBase: "4".repeat(40),
  target: "main",
  authorId: 99,
  reviewerId: 20,
  draft: false,
  open: true,
  mergeable: true,
  title: "Example",
  body: "Untrusted PR text",
  requested: true,
  files: [
    {
      path: "src/example.ts",
      patch: "@@ -1,2 +1,3 @@\n const a = 1;\n-old\n+new\n+extra",
      status: "modified",
      additions: 2,
      deletions: 1,
    },
  ],
};

/**
 * Construct a live review job with a complete snapshot.
 *
 * @returns An independently mutable job.
 */
export function job(): contracts.Job {
  return {
    id: "b".repeat(64),
    event: {
      action: "review_requested",
      repositoryId: 100,
      owner: "example-org",
      repository: "example-repo",
      number: 1,
      reviewerId: 20,
      organization: config.organizations[0]!,
      profile: config.profiles["default"]!,
    },
    release: { skillHash: "a".repeat(64), policyRevision: "7" },
    deadline: Date.now() + 1800000,
    toolsUsed: 0,
    frozen: "frozen",
    snapshot: structuredClone(snapshot),
  };
}

/**
 * Construct a complete passing proposal bound to a fixture job.
 *
 * @param value - Job whose identity the proposal references.
 * @returns A passing, no-finding structured proposal.
 */
export function proposal(value = job()): contracts.Proposal {
  return {
    schema: 1,
    jobId: value.id,
    head: snapshot.head,
    base: snapshot.base,
    integration: snapshot.integration,
    skillHash: value.release.skillHash,
    policyRevision: value.release.policyRevision,
    decision: {
      blockers: 0,
      minors: 0,
      coverage: "complete",
      context: "current",
      evidence: "adequate",
      gates: "pass",
    },
    verdict: "ship-it",
    body: "🚢 Ship It\n\nReviewed the changed behavior.",
    findings: [],
    coverage: [
      {
        path: "src/example.ts",
        status: "reviewed",
        reason: "Concrete code-path proof",
        evidence: ["src/example.ts:1"],
      },
    ],
    holds: [],
  };
}

/**
 * Sign a test webhook with Node's independent HMAC implementation.
 *
 * @param key - Fictional webhook secret.
 * @param body - Exact outgoing request bytes.
 * @returns Hexadecimal HMAC-SHA256 signature.
 */
export function sign(key: string, body: Uint8Array): string {
  return createHmac("sha256", key).update(body).digest("hex");
}

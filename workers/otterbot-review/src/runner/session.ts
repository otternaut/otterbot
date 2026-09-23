import { toJsonSchema } from "@valibot/to-json-schema";
import * as v from "valibot";
import * as contracts from "~/contracts/review";
import { toolSchema } from "~/runner/tools";
import * as githubModule from "~/runner/github";

/** One review's transient tool state, shared by its local MCP subprocesses. */
export class ReviewSession {
  private attempted = false;
  private historyRead = false;
  completed = false;
  /**
   * Create a review session with a scoped GitHub client.
   *
   * @param job - Run configuration and in-memory snapshot.
   * @param github - Transport authorized for this repository and reviewer.
   */
  constructor(
    private readonly job: contracts.Job,
    private readonly github: githubModule.GitHub,
  ) {}
  /**
   * Capture the reviewed revisions before starting an agent.
   *
   * @returns Nothing after verifying that the requested review is still eligible.
   * @throws Error if the reviewer, repository, or PR state is invalid.
   */
  async initialize(): Promise<void> {
    this.job.snapshot = await this.github.snapshot();
    if (!this.job.snapshot.open || this.job.snapshot.draft || !this.job.snapshot.requested) {
      throw new Error("PR no longer eligible");
    }
  }
  /**
   * Execute a validated review tool using only transient process memory.
   *
   * Publication is attempted once, including when the HTTP result is ambiguous.
   *
   * @param input - Untrusted MCP operation and arguments.
   * @returns Tool output without credential values.
   * @throws Error for expired runs, invalid proposals, or repeat publication attempts.
   */
  async execute(input: unknown): Promise<unknown> {
    const tool = v.parse(toolSchema, input);
    if (Date.now() >= this.job.deadline) {
      throw new Error("Review deadline exceeded");
    }

    if (++this.job.toolsUsed > this.job.event.profile.toolBudget) {
      throw new Error("Tool budget exceeded");
    }

    switch (tool.operation) {
      case "read_skill":
      case "decide":
      case "phrase":
      case "specialist":
        throw new Error("Tool belongs to the MCP process");
      case "charge":
        return {
          remaining: this.job.event.profile.toolBudget - this.job.toolsUsed,
        };
      case "context":
        return {
          id: this.job.id,
          release: this.job.release,
          mode: this.job.event.profile.mode,
          snapshot: this.job.snapshot,
          url: `https://github.com/${this.job.event.owner}/${this.job.event.repository}/pull/${String(this.job.event.number)}`,
          proposalSchema: toJsonSchema(contracts.proposalSchema),
          deadline: this.job.deadline,
          experiments: false,
        };
      case "read_file":
        return this.github.readFile(tool.path, tool.revision);

      case "freeze": {
        const frozen = JSON.stringify(tool.findings);
        if (this.job.frozen && this.job.frozen !== frozen) {
          throw new Error("Findings already frozen");
        }

        this.job.frozen = frozen;
        return { status: "frozen" };
      }

      case "history": {
        if (tool.external && !this.job.frozen) {
          throw new Error("Freeze findings before external history");
        }

        const history = await this.github.history(tool.external);
        if (tool.external) {
          this.historyRead = true;
        }

        return history;
      }

      case "propose": {
        if (this.attempted) {
          throw new Error("Publication already attempted; no retries");
        }

        const proposal = contracts.validateProposal(tool.proposal, this.job);
        const candidates = proposal.findings.map(
          ({ disposition: _disposition, ...finding }) => finding,
        );
        if (JSON.stringify(candidates) !== this.job.frozen) {
          throw new Error("Frozen findings changed");
        }

        if (!this.historyRead) {
          throw new Error("Assess external review gates before publication");
        }

        this.attempted = true;
        const current = await this.github.snapshot(false);
        if (
          !this.job.snapshot ||
          !githubModule.currentContext(this.job.snapshot, current) ||
          !current.requested
        ) {
          throw new Error("Review context changed");
        }

        if (proposal.verdict === "ship-it" && current.mergeable !== true) {
          throw new Error("Merge context unknown");
        }

        if (Date.now() >= this.job.deadline) {
          throw new Error("Review deadline exceeded");
        }

        if (this.job.event.profile.mode === "shadow") {
          this.completed = true;
          console.log(
            JSON.stringify({
              event: "review-shadow-complete",
              runId: this.job.id,
              verdict: proposal.verdict,
              findings: proposal.findings.length,
            }),
          );
          return { status: "shadow", verdict: proposal.verdict };
        }

        const review = await this.github.publish(proposal);

        this.completed = true;
        console.log(
          JSON.stringify({
            event: "review-published",
            runId: this.job.id,
            reviewId: review.id,
          }),
        );
        if (proposal.body.includes("otterbot-finding://")) {
          await this.github.backfill(review.id, proposal);
        }

        return { status: "published", ...review };
      }
    }
  }
}

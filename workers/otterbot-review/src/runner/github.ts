import { Octokit } from "octokit";
import type * as contracts from "~/contracts/review";

/** GitHub transport with explicit identity and repository scope. */
export class GitHub {
  private readonly client: Octokit;
  private readonly scope: { owner: string; repo: string; pull_number: number };
  /**
   * Construct a transport that cannot automatically retry mutations.
   *
   * All URLs are constructed internally; agent input cannot supply hosts.
   *
   * @param token - Organization-scoped PAT, retained only in memory.
   * @param job - Authorized review attempt.
   */
  constructor(
    token: string,
    private readonly job: contracts.Job,
  ) {
    this.client = new Octokit({
      auth: token,
      retry: { enabled: false },
      throttle: { enabled: false },
      request: { timeout: 20000 },
    });
    this.scope = {
      owner: job.event.owner,
      repo: job.event.repository,
      pull_number: job.event.number,
    };
  }

  /**
   * Verify reviewer identity and capture current PR metadata and changed files.
   *
   * @param includeFiles - Whether to fetch and fully paginate changed-file metadata.
   * @returns A snapshot without external review content.
   * @throws Error if identity, organization, or repository scope changed.
   */
  async snapshot(includeFiles = true): Promise<contracts.Snapshot> {
    const { data: user } = await this.client.rest.users.getAuthenticated();
    if (user.id !== this.job.event.reviewerId) {
      throw new Error("PAT reviewer mismatch");
    }

    const { data: pr } = await this.client.rest.pulls.get(this.scope);
    if (
      pr.base.repo.id !== this.job.event.repositoryId ||
      pr.base.repo.owner.id !== this.job.event.organization.ownerId ||
      pr.base.repo.owner.login.toLowerCase() !== this.job.event.owner
    ) {
      throw new Error("Repository scope changed");
    }

    const { data: comparison } = await this.client.rest.repos.compareCommitsWithBasehead({
      owner: this.scope.owner,
      repo: this.scope.repo,
      basehead: `${pr.base.sha}...${pr.head.sha}`,
      per_page: 1,
    });
    const files = includeFiles
      ? await this.client.paginate(this.client.rest.pulls.listFiles, {
          ...this.scope,
          per_page: 100,
        })
      : [];
    if (includeFiles && files.length !== pr.changed_files) {
      throw new Error("Incomplete changed-file metadata");
    }

    return {
      head: pr.head.sha,
      base: pr.base.sha,
      integration: pr.merge_commit_sha,
      mergeBase: comparison.merge_base_commit.sha,
      target: pr.base.ref,
      authorId: pr.user.id,
      reviewerId: user.id,
      draft: pr.draft ?? false,
      open: pr.state === "open",
      mergeable: pr.mergeable,
      title: pr.title,
      body: pr.body ?? "",
      requested: pr.requested_reviewers?.some((item) => item.id === user.id) ?? false,
      files: files.map((file) => ({
        path: file.filename,
        ...(file.previous_filename === undefined ? {} : { previous: file.previous_filename }),
        ...(file.patch === undefined ? {} : { patch: file.patch }),
        status: file.status,
        additions: file.additions,
        deletions: file.deletions,
      })),
    };
  }

  /**
   * Read source at an immutable reviewed revision through the broker.
   *
   * @param path - Repository-relative file path.
   * @param revision - Reviewed side, never an arbitrary ref or URL.
   * @returns A decoded file or a bounded directory listing.
   * @throws Error for unsafe paths, unavailable snapshots, or unsupported content.
   */
  async readFile(path: string, revision: "head" | "base" | "mergeBase"): Promise<unknown> {
    if (
      !this.job.snapshot ||
      path.startsWith("/") ||
      path.split("/").some((part) => part === ".." || part === ".git") ||
      /[\x00-\x1f]/.test(path)
    ) {
      throw new Error("Invalid source path");
    }

    const { data } = await this.client.rest.repos.getContent({
      owner: this.scope.owner,
      repo: this.scope.repo,
      path,
      ref: this.job.snapshot[revision],
    });
    if (Array.isArray(data)) {
      return data.map((item) => ({
        path: item.path,
        type: item.type,
        size: item.size,
      }));
    }

    if (!("content" in data) || data.encoding !== "base64" || data.size > 500000) {
      throw new Error("File unavailable or too large");
    }

    const bytes = Uint8Array.from(atob(data.content.replace(/\s/g, "")), (char) =>
      char.charCodeAt(0),
    );

    return {
      path: data.path,
      content: new TextDecoder().decode(bytes),
      sha: data.sha,
    };
  }

  /**
   * List review history with external contents omitted until candidate freeze.
   *
   * @param external - Whether independently frozen candidates permit external content.
   * @returns Paginated reviews and inline comments in the permitted evidence scope.
   */
  async history(external: boolean): Promise<unknown> {
    const reviews = await this.client.paginate(this.client.rest.pulls.listReviews, {
      ...this.scope,
      per_page: 100,
    });
    const owned = reviews
      .filter(
        (item) =>
          item.user?.id === this.job.event.reviewerId &&
          /<!-- otterbot-job:[a-f0-9]{64} -->/.test(item.body),
      )
      .map((item) => item.id);
    const comments = await this.client.paginate(this.client.rest.pulls.listReviewComments, {
      ...this.scope,
      per_page: 100,
    });
    const conversation = external
      ? await this.client.paginate(this.client.rest.issues.listComments, {
          owner: this.scope.owner,
          repo: this.scope.repo,
          issue_number: this.scope.pull_number,
          per_page: 100,
        })
      : [];

    return {
      reviews: reviews
        .filter((item) => external || owned.includes(item.id))
        .map((item) => ({
          id: item.id,
          authorId: item.user?.id,
          body: item.body,
          state: item.state,
          commit: item.commit_id,
          url: item.html_url,
        })),
      comments: comments
        .filter(
          (item) =>
            external ||
            (item.pull_request_review_id !== null && owned.includes(item.pull_request_review_id)),
        )
        .map((item) => ({
          id: item.id,
          reviewId: item.pull_request_review_id,
          authorId: item.user.id,
          body: item.body,
          path: item.path,
          line: item.line,
          url: item.html_url,
          replyTo: item.in_reply_to_id,
        })),
      conversation: conversation.map((item) => ({
        id: item.id,
        authorId: item.user?.id,
        body: item.body,
        updatedAt: item.updated_at,
      })),
    };
  }

  /**
   * Submit one grouped review at the explicitly reviewed commit.
   *
   * The caller permits one submission attempt and never retries this method.
   *
   * @param proposal - Previously validated proposal.
   * @returns GitHub's review ID and URL.
   * @throws Error when GitHub rejects the request or delivery is ambiguous.
   */
  async publish(proposal: contracts.Proposal): Promise<{ id: number; url: string }> {
    const event =
      this.job.snapshot?.authorId === this.job.event.reviewerId
        ? "COMMENT"
        : proposal.verdict === "ship-it"
          ? "APPROVE"
          : proposal.verdict === "request-changes"
            ? "REQUEST_CHANGES"
            : "COMMENT";
    const comments = proposal.findings
      .filter((finding) => finding.disposition === "inline")
      .map((finding) => ({
        path: finding.path,
        line: finding.line,
        side: finding.side,
        body: `${finding.body}\n\n<!-- otterbot-finding:${this.job.id}:${finding.id} -->`,
      }));
    const { data } = await this.client.rest.pulls.createReview({
      ...this.scope,
      commit_id: proposal.head,
      event,
      body: `${proposal.body}\n\n${reviewMarker(this.job)}`,
      comments,
    });

    return { id: data.id, url: data.html_url };
  }

  /**
   * Backfill links by editing the owning review body once.
   *
   * @param reviewId - Verified automation-owned review ID.
   * @param proposal - Submitted proposal whose body is being completed.
   * @returns Nothing after the root edit succeeds.
   */
  async backfill(reviewId: number, proposal: contracts.Proposal): Promise<void> {
    const comments = await this.client.paginate(this.client.rest.pulls.listCommentsForReview, {
      ...this.scope,
      review_id: reviewId,
      per_page: 100,
    });
    let body = proposal.body;

    for (const finding of proposal.findings.filter((item) => item.disposition === "inline")) {
      const comment = comments.find((item) =>
        item.body.includes(`<!-- otterbot-finding:${this.job.id}:${finding.id} -->`),
      );
      if (comment) {
        body = body.replaceAll(`otterbot-finding://${finding.id}`, comment.html_url);
      }
    }

    await this.client.rest.pulls.updateReview({
      ...this.scope,
      review_id: reviewId,
      body: `${body}\n\n${reviewMarker(this.job)}`,
    });
  }
}

/**
 * Build an unambiguous publication marker from trusted attempt identity.
 *
 * @param job - Current in-memory attempt.
 * @returns An attribution marker; it never authorizes editing earlier reviews.
 *
 * @example
 * ```ts
 * import type { Job } from "~/contracts/review";
 * import { reviewMarker } from "~/runner/github";
 * function ownedReview(body: string, job: Job) {
 *   return body.includes(reviewMarker(job));
 * }
 * ```
 */
export function reviewMarker(job: contracts.Job): string {
  return `<!-- otterbot-job:${job.id} -->`;
}

/**
 * Compare mutable snapshot context before and after review publication.
 *
 * @param before - Reviewed snapshot.
 * @param after - Fresh GitHub metadata.
 * @returns Whether the reviewed context still matches an open non-draft PR.
 *
 * @example
 * ```ts
 * import type { Snapshot } from "~/contracts/review";
 * import { currentContext } from "~/runner/github";
 * function canPublish(before: Snapshot, after: Snapshot) {
 *   return currentContext(before, after); // False when the reviewed context has changed.
 * }
 * ```
 */
export function currentContext(before: contracts.Snapshot, after: contracts.Snapshot): boolean {
  return (
    after.open &&
    !after.draft &&
    before.head === after.head &&
    before.base === after.base &&
    before.target === after.target &&
    before.integration === after.integration
  );
}

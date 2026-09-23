import * as vitest from "vitest";
import * as github from "~/runner/github";
import * as fixtures from "../../test/fixtures";

const requests: {
  url: string;
  method: string;
  body: Record<string, unknown>;
}[] = [];

function mock(handler: (url: string, method: string, body: Record<string, unknown>) => unknown) {
  requests.length = 0;
  vitest.vi.stubGlobal(
    "fetch",
    vitest.vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
      const url = input instanceof Request ? input.url : input.toString();
      const method = init?.method ?? "GET";
      const body: Record<string, unknown> =
        typeof init?.body === "string" ? (JSON.parse(init.body) as Record<string, unknown>) : {};

      requests.push({ url, method, body });
      const result = handler(url, method, body);

      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }),
  );
}

vitest.afterEach(() => vitest.vi.unstubAllGlobals());

vitest.describe("scoped GitHub transport", () => {
  vitest.it("submits root and inline findings in one review pinned to the head", async () => {
    const value = fixtures.job();
    const output = fixtures.proposal(value);

    output.findings.push({
      id: "catch-1",
      severity: "minor",
      path: "src/example.ts",
      line: 3,
      side: "RIGHT",
      body: "Concern, fix, and evidence.",
      evidence: ["src/example.ts:3"],
      disposition: "inline",
    });
    mock((_url, method, body) => {
      vitest.expect(method).toBe("POST");
      vitest.expect(body["commit_id"]).toBe(fixtures.snapshot.head);
      vitest.expect(body["comments"]).toHaveLength(1);
      vitest.expect(body["body"]).toContain(github.reviewMarker(value));
      return {
        id: 42,
        html_url: "https://github.com/example-org/example-repo/pull/1#pullrequestreview-42",
      };
    });
    vitest.expect((await new github.GitHub("example-pat", value).publish(output)).id).toBe(42);
    vitest.expect(requests).toHaveLength(1);
    vitest.expect(requests[0]?.url.endsWith("/pulls/1/reviews")).toBe(true);
  });
  vitest.it("does not retry an ambiguous publication", async () => {
    vitest.vi.stubGlobal(
      "fetch",
      vitest.vi.fn(async () => {
        throw new TypeError("connection lost");
      }),
    );
    await vitest
      .expect(new github.GitHub("example-pat", fixtures.job()).publish(fixtures.proposal()))
      .rejects.toThrow();
    vitest.expect(fetch).toHaveBeenCalledTimes(1);
  });
  vitest.it("keeps same-account manual reviews out of owned history", async () => {
    mock((url) =>
      url.includes("/graphql")
        ? {
            data: {
              repository: {
                pullRequest: {
                  reviewThreads: {
                    nodes: [],
                    pageInfo: { hasNextPage: false, endCursor: null },
                  },
                },
              },
            },
          }
        : url.includes("/reviews")
          ? [
              {
                id: 5,
                user: { id: 20 },
                body: "Manual human review",
                state: "APPROVED",
              },
              {
                id: 6,
                user: { id: 20 },
                body: "<!-- otterbot-job:" + "a".repeat(64) + " -->",
                state: "COMMENT",
              },
            ]
          : [],
    );
    const history = (await new github.GitHub("example-pat", fixtures.job()).history(false)) as {
      reviews: { id: number }[];
    };

    vitest.expect(history.reviews.map((item) => item.id)).toEqual([6]);
  });
  vitest.it("rejects source traversal before making any network request", async () => {
    mock(() => ({}));
    await vitest
      .expect(new github.GitHub("example-pat", fixtures.job()).readFile("../secrets", "head"))
      .rejects.toThrow("Invalid source path");
    vitest.expect(requests).toHaveLength(0);
  });
  vitest.it("rejects a PAT belonging to a different user", async () => {
    mock(() => ({ id: 999 }));
    await vitest
      .expect(new github.GitHub("example-pat", fixtures.job()).snapshot())
      .rejects.toThrow("PAT reviewer mismatch");
    vitest.expect(requests).toHaveLength(1);
  });
  vitest.it("detects changed base, head, integration, and draft status", () => {
    vitest.expect(github.currentContext(fixtures.snapshot, fixtures.snapshot)).toBe(true);

    for (const changed of [
      { head: "a".repeat(40) },
      { base: "a".repeat(40) },
      { integration: null },
      { draft: true },
      { open: false },
    ]) {
      vitest
        .expect(github.currentContext(fixtures.snapshot, { ...fixtures.snapshot, ...changed }))
        .toBe(false);
    }
  });
});

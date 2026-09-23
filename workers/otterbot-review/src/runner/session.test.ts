import * as vitest from "vitest";
import { ReviewSession } from "~/runner/session";
import { GitHub } from "~/runner/github";
import * as fixtures from "../../test/fixtures";

function setup(mode: "shadow" | "live" = "live") {
  const value = fixtures.job();

  value.event = structuredClone(value.event);
  value.event.profile.mode = mode;
  delete value.frozen;
  const github = new GitHub("test-only-token", value);

  vitest.vi.spyOn(github, "snapshot").mockResolvedValue(structuredClone(fixtures.snapshot));
  vitest.vi.spyOn(github, "history").mockResolvedValue({ reviews: [], comments: [] });
  vitest.vi.spyOn(github, "publish").mockResolvedValue({
    id: 42,
    url: "https://github.com/example/repo/pull/1#pullrequestreview-42",
  });
  const session = new ReviewSession(value, github);

  return { session, github, value, output: fixtures.proposal(value) };
}

async function prepare(session: ReviewSession): Promise<void> {
  await session.initialize();
  await session.execute({ operation: "freeze", findings: [] });
  await session.execute({ operation: "history", external: true });
}

vitest.beforeEach(() => vitest.vi.restoreAllMocks());

vitest.describe("single-run publication", () => {
  vitest.it("publishes once and rejects another call after completion", async () => {
    const { session, github, output } = setup();

    await prepare(session);
    const input = { operation: "propose", proposal: output };

    vitest.expect(await session.execute(input)).toMatchObject({
      status: "published",
      id: 42,
    });
    await vitest.expect(session.execute(input)).rejects.toThrow("already attempted");
    vitest.expect(github.publish).toHaveBeenCalledTimes(1);
  });

  vitest.it("never retries a lost publication response", async () => {
    const { session, github, output } = setup();

    vitest.vi.mocked(github.publish).mockRejectedValue(new Error("Connection lost"));
    await prepare(session);
    const input = { operation: "propose", proposal: output };

    await vitest.expect(session.execute(input)).rejects.toThrow("Connection lost");
    await vitest.expect(session.execute(input)).rejects.toThrow("already attempted");
    vitest.expect(github.publish).toHaveBeenCalledTimes(1);
    vitest.expect(session.completed).toBe(false);
  });

  vitest.it("prevents concurrent proposal calls from publishing twice", async () => {
    const { session, github, output } = setup();

    await prepare(session);
    const input = { operation: "propose", proposal: output };
    const results = await Promise.allSettled([session.execute(input), session.execute(input)]);

    vitest.expect(results.map((result) => result.status).sort()).toEqual(["fulfilled", "rejected"]);
    vitest.expect(github.publish).toHaveBeenCalledTimes(1);
  });

  vitest.it("completes shadow mode without GitHub writes or stored artifacts", async () => {
    const { session, github, output } = setup("shadow");

    await prepare(session);
    vitest
      .expect(await session.execute({ operation: "propose", proposal: output }))
      .toEqual({ status: "shadow", verdict: "ship-it" });
    vitest.expect(github.publish).not.toHaveBeenCalled();
    vitest.expect(session.completed).toBe(true);
  });

  vitest.it("blocks publication if the reviewed head changed", async () => {
    const { session, github, output } = setup();

    await prepare(session);
    vitest.vi.mocked(github.snapshot).mockResolvedValue({
      ...fixtures.snapshot,
      head: "f".repeat(40),
    });
    await vitest
      .expect(session.execute({ operation: "propose", proposal: output }))
      .rejects.toThrow("context changed");
    vitest.expect(github.publish).not.toHaveBeenCalled();
  });

  vitest.it("requires independent freeze before reading external history", async () => {
    const { session, github } = setup();

    await session.initialize();
    await vitest
      .expect(session.execute({ operation: "history", external: true }))
      .rejects.toThrow("Freeze");
    vitest.expect(github.history).not.toHaveBeenCalled();
  });

  vitest.it("rejects findings that change after independent freeze", async () => {
    const { session } = setup();

    await prepare(session);
    await vitest
      .expect(
        session.execute({
          operation: "freeze",
          findings: [
            {
              id: "one",
              severity: "minor",
              path: "src/example.ts",
              line: 3,
              side: "RIGHT",
              body: "A bug",
              evidence: ["proof"],
            },
          ],
        }),
      )
      .rejects.toThrow("already frozen");
  });

  vitest.it("enforces the shared deadline and tool limit", async () => {
    const { session, value } = setup();

    value.deadline = Date.now() - 1;
    await vitest.expect(session.execute({ operation: "context" })).rejects.toThrow("deadline");
    value.deadline = Date.now() + 60000;
    value.toolsUsed = value.event.profile.toolBudget;
    await vitest.expect(session.execute({ operation: "context" })).rejects.toThrow("budget");
  });
});

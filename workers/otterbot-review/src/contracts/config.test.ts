import * as vitest from "vitest";
import * as configuration from "~/contracts/config";
import { routeEvent } from "~/worker/webhooks";
import * as fixtures from "../../test/fixtures";

vitest.describe("organization routing", () => {
  vitest.it.each([0, 1, 2, 3])("selects dedicated credentials for organization %i", (index) => {
    const result = routeEvent(
      fixtures.payload(index),
      fixtures.config,
      fixtures.config.hooks[index]!,
    );

    vitest
      .expect(result?.organization.patSecret)
      .toBe(fixtures.config.organizations[index]!.patSecret);
    vitest.expect(result?.reviewerId).toBe(fixtures.config.organizations[index]!.reviewerId);
  });

  vitest.it("ignores fork owners, senders, and authors when selecting credentials", () => {
    vitest
      .expect(routeEvent(fixtures.payload(), fixtures.config, fixtures.config.hooks[0]!)?.owner)
      .toBe("example-org");
  });

  vitest.it("matches organization logins case-insensitively", () => {
    const value = fixtures.payload();

    value.pull_request.base.repo.owner.login = "EXAMPLE-ORG";
    vitest.expect(routeEvent(value, fixtures.config, fixtures.config.hooks[0]!)).not.toBeNull();
  });

  vitest.it("ignores other reviewers and team requests", () => {
    const value = fixtures.payload();

    value.requested_reviewer.id = 999;
    vitest.expect(routeEvent(value, fixtures.config, fixtures.config.hooks[0]!)).toBeNull();
    const { requested_reviewer: _, ...team } = fixtures.payload();

    vitest.expect(routeEvent(team, fixtures.config, fixtures.config.hooks[0]!)).toBeNull();
  });

  vitest.it("does not borrow credentials from another same-reviewer organization", () => {
    vitest
      .expect(routeEvent(fixtures.payload(1), fixtures.config, fixtures.config.hooks[0]!))
      .toBeNull();
  });

  vitest.it("rejects conflicting base repository identities", () => {
    const value = fixtures.payload();

    value.pull_request.base.repo.id = 999;
    vitest.expect(() => routeEvent(value, fixtures.config, fixtures.config.hooks[0]!)).toThrow();
  });

  vitest.it("ignores draft, closed, unrelated-action, and disallowed-repository requests", () => {
    for (const mutate of [
      (value: ReturnType<typeof fixtures.payload>) => {
        value.pull_request.draft = true;
      },
      (value: ReturnType<typeof fixtures.payload>) => {
        value.pull_request.state = "closed";
      },
      (value: ReturnType<typeof fixtures.payload>) => {
        value.action = "synchronize";
      },
      (value: ReturnType<typeof fixtures.payload>) => {
        value.repository.name = "not-allowed";
        value.pull_request.base.repo.name = "not-allowed";
      },
    ]) {
      const value = fixtures.payload();

      mutate(value);
      vitest.expect(routeEvent(value, fixtures.config, fixtures.config.hooks[0]!)).toBeNull();
    }
  });

  vitest.it("supports repository-specific provider profiles", () => {
    const config = structuredClone(fixtures.config);

    config.profiles["override"] = {
      ...config.profiles["default"]!,
      provider: "codex",
      model: "alternate-model",
    };
    config.organizations[0]!.repositoryProfiles["example-repo"] = "override";
    vitest
      .expect(routeEvent(fixtures.payload(), config, config.hooks[0]!)?.profile.model)
      .toBe("alternate-model");
  });

  vitest.it(
    "rejects duplicate organization IDs, owners, hooks, and missing profile references",
    () => {
      const duplicate = structuredClone(fixtures.testConfig);

      duplicate.organizations.push(duplicate.organizations[0]!);
      vitest.expect(() => configuration.parseConfig(JSON.stringify(duplicate))).toThrow();
      const unknown = structuredClone(fixtures.testConfig);

      unknown.organizations[0]!.profile = "missing";
      vitest.expect(() => configuration.parseConfig(JSON.stringify(unknown))).toThrow();
      const hooks = structuredClone(fixtures.testConfig);

      hooks.hooks.push(hooks.hooks[0]!);
      vitest.expect(() => configuration.parseConfig(JSON.stringify(hooks))).toThrow();
    },
  );

  vitest.it("rejects unknown hook organizations and malformed configuration", () => {
    const value = structuredClone(fixtures.testConfig);

    value.hooks[0]!.organization = "unknown";
    vitest.expect(() => configuration.parseConfig(JSON.stringify(value))).toThrow();
    vitest.expect(() => configuration.parseConfig("invalid-json")).toThrow();
  });

  vitest.it("resolves only named secret bindings and never returns missing values", () => {
    vitest.expect(configuration.secret({ PAT: "example-token" }, "PAT")).toBe("example-token");
    vitest.expect(() => configuration.secret({}, "PAT")).toThrow("Missing secret binding");
  });
});

vitest.describe("provider profile routing", () => {
  vitest.it("routes four organizations independently while sharing reusable model profiles", () => {
    const profiles = {
      codex: {
        provider: "codex",
        model: "gpt-5.6-sol",
        effort: "low",
        apiKeySecret: "CODEX_API_KEY",
      },
      claude: {
        provider: "claude",
        model: "opus",
        effort: "medium",
        apiKeySecret: "CLAUDE_API_KEY",
      },
      cursor: {
        provider: "cursor",
        model: "gpt-5.6-sol",
        effort: "low",
        apiKeySecret: "CURSOR_API_KEY",
      },
    };
    const routes = ["codex", "claude", "codex", "cursor"] as const;
    const config = configuration.parseConfig(
      JSON.stringify({
        ...fixtures.testConfig,
        profiles,
        organizations: fixtures.testConfig.organizations.map((org, index) => ({
          ...org,
          profile: routes[index],
        })),
      }),
    );

    routes.forEach((profile, index) => {
      const event = routeEvent(fixtures.payload(index), config, config.hooks[index]!);

      vitest.expect(event?.profile).toMatchObject(profiles[profile]);
      vitest.expect(event?.organization.patSecret).toBe(config.organizations[index]!.patSecret);
      vitest.expect(event?.reviewerId).toBe(config.organizations[index]!.reviewerId);
    });
  });

  vitest.it("rejects unsupported effort values rather than silently using a default", () => {
    const value = structuredClone(fixtures.testConfig);

    value.profiles.default.effort = "typo";
    vitest.expect(() => configuration.parseConfig(JSON.stringify(value))).toThrow();
  });
});

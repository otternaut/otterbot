import * as vitest from "vitest";
import * as runtime from "~/runner/runtime";

vitest.beforeEach(() => {
  for (const [name, value] of Object.entries({
    PROVIDER: "codex",
    PROVIDER_API_KEY: "fictional-key",
    PROVIDER_MODEL: "fictional-model",
    DEADLINE: "1000",
    BROKER_URL: "http://127.0.0.1:1234",
    BROKER_TOKEN: "fictional-token",
  })) {
    vitest.vi.stubEnv(name, value);
  }

  vitest.vi.stubEnv("PROVIDER_EFFORT", undefined);
});

vitest.afterEach(() => vitest.vi.unstubAllEnvs());

vitest.it("captures settings once and passes the same settings to specialists", () => {
  vitest.vi.stubEnv("PROVIDER_EFFORT", "low");
  const settings = runtime.readSettings();

  vitest.vi.stubEnv("PROVIDER_MODEL", "changed-model");
  vitest.vi.stubEnv("BROKER_TOKEN", "changed-token");
  const input = runtime.providerInput(settings, "/tmp/example", "Review", "specialist");

  vitest.expect(input).toMatchObject({
    model: "fictional-model",
    brokerToken: "fictional-token",
    effort: "low",
    role: "specialist",
  });
});

vitest.it("accepts parent broker settings without writing them into the environment", () => {
  const broker = { brokerUrl: "http://127.0.0.1:5678", brokerToken: "parent-token" };
  const settings = runtime.readSettings(broker);

  vitest.expect(settings).toMatchObject(broker);
  vitest.expect(process.env["BROKER_TOKEN"]).toBe("fictional-token");
  vitest
    .expect(runtime.providerInput(settings, "/tmp/example", "Review", "lead"))
    .not.toHaveProperty("effort");
});

vitest.it.each([
  ["PROVIDER", "unknown"],
  ["PROVIDER_EFFORT", "unknown"],
  ["PROVIDER_API_KEY", ""],
  ["PROVIDER_MODEL", ""],
  ["DEADLINE", "NaN"],
  ["DEADLINE", "0"],
  ["BROKER_URL", "invalid"],
  ["BROKER_TOKEN", ""],
])("rejects invalid %s at startup", (name, value) => {
  vitest.vi.stubEnv(name, value);
  vitest.expect(() => runtime.readSettings()).toThrow();
});

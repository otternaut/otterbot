import { toJsonSchema } from "@valibot/to-json-schema";
import * as vitest from "vitest";
import * as v from "valibot";
import * as configuration from "~/contracts/config";
import * as contracts from "~/contracts/review";
import * as fixtures from "../../test/fixtures";

const profile = {
  provider: "claude",
  model: "example-model",
  apiKeySecret: "EXAMPLE_API_KEY",
};

vitest.describe("Valibot validation boundaries", () => {
  vitest.it("applies omitted configuration defaults", () => {
    const config = v.parse(configuration.configSchema, fixtures.testConfig);

    vitest.expect(config.runSeconds).toBe(1800);
    vitest.expect(config.organizations[0]?.repositoryProfiles).toEqual({});
    vitest.expect(v.parse(configuration.profileSchema, profile)).toMatchObject({
      mode: "shadow",
      toolBudget: 150,
    });
  });

  vitest.it("rejects unknown fields in nested configuration and proposals", () => {
    vitest.expect(() => v.parse(configuration.profileSchema, { ...profile, retries: 1 })).toThrow();
    const output = fixtures.proposal();

    vitest
      .expect(() =>
        v.parse(contracts.proposalSchema, {
          ...output,
          decision: { ...output.decision, bypass: true },
        }),
      )
      .toThrow();
  });

  vitest.it.each([19, 1001, 20.5, Infinity, NaN, "150", null])(
    "rejects invalid tool budget %s",
    (toolBudget) => {
      vitest
        .expect(() => v.parse(configuration.profileSchema, { ...profile, toolBudget }))
        .toThrow();
    },
  );

  vitest.it("enforces string length bounds", () => {
    for (const model of ["", "x".repeat(121)]) {
      vitest.expect(() => v.parse(configuration.profileSchema, { ...profile, model })).toThrow();
    }
  });

  vitest.it("requires nullable proposal fields to remain present", () => {
    const output = fixtures.proposal();

    vitest
      .expect(v.parse(contracts.proposalSchema, { ...output, integration: null }).integration)
      .toBeNull();
    const { integration: _integration, ...missing } = output;

    vitest.expect(() => v.parse(contracts.proposalSchema, missing)).toThrow();
  });

  vitest.it("preserves strictness when omitting disposition from frozen findings", () => {
    const schema = v.omit(contracts.findingSchema, ["disposition"]);
    const finding = {
      id: "one",
      severity: "minor",
      path: "src/example.ts",
      line: 3,
      side: "RIGHT",
      body: "Evidence-backed finding",
      evidence: ["src/example.ts:3"],
    };

    vitest.expect(v.parse(schema, finding)).toEqual(finding);
    vitest.expect(() => v.parse(schema, { ...finding, disposition: "inline" })).toThrow();
  });

  vitest.it("exports strict proposal JSON Schema with array and numeric constraints", () => {
    const schema = toJsonSchema(contracts.proposalSchema);

    vitest.expect(schema.additionalProperties).toBe(false);
    vitest.expect(schema.required).toContain("integration");
    vitest.expect(schema.properties?.["findings"]).toMatchObject({
      type: "array",
      maxItems: 200,
    });
    vitest.expect(schema.properties?.["coverage"]).toMatchObject({
      minItems: 1,
      maxItems: 5000,
    });
    const finding = toJsonSchema(contracts.findingSchema);

    vitest.expect(finding.properties?.["line"]).toMatchObject({
      type: "integer",
      exclusiveMinimum: 0,
      maximum: Number.MAX_SAFE_INTEGER,
    });
  });
});

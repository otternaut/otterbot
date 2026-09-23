import { Cursor } from "@cursor/sdk";
import * as vitest from "vitest";
import * as providers from "~/runner/providers";

const input: providers.ProviderInput = {
  provider: "codex",
  apiKey: "example-provider-token",
  model: "example-model",
  cwd: "/workspace/isolated",
  prompt: "Example review",
  brokerUrl: "https://reviews.example.com",
  brokerToken: "example-job-capability",
  deadline: Date.now() + 60000,
  role: "lead",
};

vitest.describe("provider security contracts", () => {
  vitest.it("does not inherit unrelated environment credentials", () => {
    process.env["UNRELATED_TEST_SECRET"] = "must-not-inherit";
    vitest.expect(providers.childEnvironment(input)).not.toHaveProperty("UNRELATED_TEST_SECRET");
    delete process.env["UNRELATED_TEST_SECRET"];
  });
  vitest.it("Codex disables shell, web, native delegation, and project instruction loading", () => {
    const value = providers.codexOptions(input);

    vitest.expect(value.sdk.config?.["features"]).toMatchObject({
      shell_tool: false,
      unified_exec: false,
      multi_agent: false,
    });
    vitest.expect(value.sdk.config?.["project_doc_max_bytes"]).toBe(0);
    vitest.expect(value.thread).toMatchObject({
      sandboxMode: "read-only",
      webSearchMode: "disabled",
      networkAccessEnabled: false,
    });
  });
  vitest.it("Claude uses only the supplied MCP server and no ambient settings", () => {
    const value = providers.claudeOptions(input, new AbortController());

    vitest.expect(value.tools).toEqual([]);
    vitest.expect(value.settingSources).toEqual([]);
    vitest.expect(value.strictMcpConfig).toBe(true);
    vitest.expect(value.allowedTools).toEqual(["mcp__review__*"]);
  });
  vitest.it("Cursor restricts native tools and does not load project rules", async () => {
    const value = await providers.cursorOptions(input);

    vitest.expect(value.tools).toEqual(["mcp"]);
    vitest.expect(value.local?.settingSources).toEqual([]);
    vitest.expect(value.local?.cwd).toBe(input.cwd);
  });
});

vitest.afterEach(() => vitest.vi.restoreAllMocks());

vitest.describe("configurable model effort", () => {
  vitest.it("passes Codex and Claude effort through their SDK options", () => {
    vitest
      .expect(providers.codexOptions({ ...input, model: "gpt-5.6-sol", effort: "low" }).thread)
      .toMatchObject({ model: "gpt-5.6-sol", modelReasoningEffort: "low" });
    vitest
      .expect(
        providers.claudeOptions(
          { ...input, provider: "claude", model: "opus", effort: "medium" },
          new AbortController(),
        ),
      )
      .toMatchObject({ model: "opus", effort: "medium" });
    vitest
      .expect(
        providers.childEnvironment({ ...input, effort: "low", role: "specialist" })[
          "PROVIDER_EFFORT"
        ],
      )
      .toBe("low");
  });

  vitest.it("uses Cursor's account-specific model and effort parameter", async () => {
    const list = vitest.vi.spyOn(Cursor.models, "list").mockResolvedValue([
      {
        id: "sol-catalog-id",
        displayName: "Sol",
        aliases: ["gpt-5.6-sol"],
        parameters: [{ id: "reasoning_effort", values: [{ value: "low" }, { value: "high" }] }],
      },
    ]);
    const options = await providers.cursorOptions({
      ...input,
      provider: "cursor",
      model: "gpt-5.6-sol",
      effort: "low",
    });

    vitest.expect(list).toHaveBeenCalledExactlyOnceWith({ apiKey: input.apiKey });
    vitest
      .expect(options.model)
      .toEqual({ id: "sol-catalog-id", params: [{ id: "reasoning_effort", value: "low" }] });
  });

  vitest.it.each(
    [
      [],
      [{ id: "example-model", displayName: "Example" }],
      [
        {
          id: "example-model",
          displayName: "Example",
          parameters: [{ id: "effort", values: [{ value: "high" }] }],
        },
      ],
    ].map((catalog) => ({ catalog })),
  )("rejects unavailable Cursor model/effort without fallback", async ({ catalog }) => {
    vitest.vi.spyOn(Cursor.models, "list").mockResolvedValue(catalog);
    await vitest
      .expect(providers.cursorOptions({ ...input, effort: "low" }))
      .rejects.toThrow("unavailable");
  });

  vitest.it("preserves provider defaults when effort is omitted", async () => {
    const list = vitest.vi.spyOn(Cursor.models, "list");

    vitest.expect(providers.codexOptions(input).thread).not.toHaveProperty("modelReasoningEffort");
    vitest
      .expect(providers.claudeOptions(input, new AbortController()))
      .not.toHaveProperty("effort");
    vitest.expect((await providers.cursorOptions(input)).model).toEqual({ id: input.model });
    vitest.expect(list).not.toHaveBeenCalled();
  });
});

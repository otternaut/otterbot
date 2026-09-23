import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { resolve } from "node:path";
import { readFile } from "node:fs/promises";
import * as vitest from "vitest";
import { startToolServer } from "~/runner/server";
import { ReviewSession } from "~/runner/session";
import { GitHub } from "~/runner/github";
import * as fixtures from "../../test/fixtures";

vitest.describe("compiled MCP skill tools", () => {
  vitest.it.each(["lead", "specialist"])(
    "loads repository skill references and helpers for %s",
    async (role) => {
      const value = fixtures.job();
      const session = new ReviewSession(value, new GitHub("example-pat", value));
      const { server, url } = await startToolServer(session, "example-broker-token");
      const client = new Client({ name: "skill-integration-test", version: "1.0.0" });
      const transport = new StdioClientTransport({
        command: process.execPath,
        args: [resolve(".output/dist/runner/mcp.js")],
        stderr: "pipe",
        env: {
          PATH: process.env["PATH"] ?? "/usr/bin:/bin",
          BROKER_URL: url,
          BROKER_TOKEN: "example-broker-token",
          REVIEW_ROLE: role,
          PROVIDER: "codex",
          PROVIDER_API_KEY: "example-key",
          PROVIDER_MODEL: "example-model",
          DEADLINE: String(Date.now() + 60000),
        },
      });

      try {
        await client.connect(transport);
        const listed = await client.listTools();
        const names = listed.tools.map((tool) => tool.name);

        vitest.expect(names).toContain("read_skill");
        vitest.expect(names).not.toContain("charge");
        vitest.expect(names.includes("propose")).toBe(role === "lead");
        vitest.expect(names.includes("specialist")).toBe(role === "lead");

        for (const tool of listed.tools) {
          vitest.expect(tool.inputSchema.properties).not.toHaveProperty("operation");
        }

        const reference = await readFile(
          "../../skills/otterbot-review/references/readiness.md",
          "utf8",
        );
        const loaded = await client.callTool({
          name: "read_skill",
          arguments: { path: "references/readiness.md" },
        });

        vitest
          .expect(loaded)
          .toMatchObject({ content: [{ type: "text", text: JSON.stringify(reference) }] });
        const decision = await client.callTool({
          name: "decide",
          arguments: { decision: fixtures.proposal(value).decision },
        });

        vitest.expect(decision.isError).not.toBe(true);
        vitest.expect(JSON.stringify(decision)).toContain("ship-it");
        const phrases = await client.callTool({ name: "phrase", arguments: { count: 2 } });

        vitest.expect(phrases.isError).not.toBe(true);
        vitest.expect(phrases.content).toHaveLength(1);
        const traversal = await client.callTool({
          name: "read_skill",
          arguments: { path: "../package.json" },
        });

        vitest.expect(traversal.isError).toBe(true);
        const extraField = await client.callTool({
          name: "context",
          arguments: { unexpected: true },
        });

        vitest.expect(extraField.isError).toBe(true);
        const injectedOperation = await client.callTool({
          name: "context",
          arguments: { operation: "propose" },
        });

        vitest.expect(injectedOperation.isError).toBe(true);
        const hidden = await client.callTool({ name: "charge", arguments: {} });

        vitest.expect(hidden.isError).toBe(true);

        if (role === "specialist") {
          const freeze = await client.callTool({ name: "freeze", arguments: { findings: [] } });
          const history = await client.callTool({ name: "history", arguments: { external: true } });

          vitest.expect(freeze.isError).toBe(true);
          vitest.expect(history.isError).toBe(true);
        }
      } finally {
        await client.close();
        server.closeAllConnections();
        server.close();
      }
    },
  );
});

import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { createServer } from "node:http";
import { createHmac } from "node:crypto";
import * as files from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import * as vitest from "vitest";
import * as fixtures from "./fixtures";

const execute = promisify(execFile);
const config = {
  ...fixtures.testConfig,
  organizations: fixtures.testConfig.organizations.slice(0, 1),
  hooks: fixtures.testConfig.hooks.slice(0, 1),
};
const env = {
  PATH: process.env["PATH"],
  CONFIG_JSON: JSON.stringify(config),
  GH_PAT_EXAMPLE: "fictional-pat",
  PROVIDER_KEY_EXAMPLE: "fictional-key",
  WEBHOOK_SECRET_EXAMPLE: "fictional-secret",
};

vitest.it("preflights the same CONFIG_JSON binding used by the Worker", async () => {
  const result = await execute("bun", ["--no-env-file", "scripts/preflight.ts"], { env });

  vitest.expect(JSON.parse(result.stdout)).toMatchObject({
    status: "configuration-valid",
    githubChecked: false,
    providerRunsChecked: false,
  });
});

vitest.it("supports an explicit private configuration override", async () => {
  const directory = await files.mkdtemp(join(tmpdir(), "otterbot-preflight-"));

  try {
    const path = join(directory, "config.json");

    await files.writeFile(path, JSON.stringify(config));
    const result = await execute(
      "bun",
      ["--no-env-file", "scripts/preflight.ts", "--config", path],
      {
        env: { ...env, CONFIG_JSON: "invalid" },
      },
    );

    vitest.expect(JSON.parse(result.stdout)).toMatchObject({ status: "configuration-valid" });
  } finally {
    await files.rm(directory, { recursive: true, force: true });
  }
});

vitest.it.each(["CONFIG_JSON", "GH_PAT_EXAMPLE", "PROVIDER_KEY_EXAMPLE", "WEBHOOK_SECRET_EXAMPLE"])(
  "rejects missing %s without exposing secrets",
  async (name) => {
    await vitest
      .expect(
        execute("bun", ["--no-env-file", "scripts/preflight.ts"], {
          env: { ...env, [name]: "" },
        }),
      )
      .rejects.toMatchObject({
        code: 1,
        stdout: "",
        stderr:
          "Preflight failed. Check private configuration, credentials, and GitHub identity/access. No secret values were printed.\n",
      });
  },
);

vitest.it.each(["pong", "rejected", "redirect"] as const)(
  "sends a correctly signed ping and handles %s without retries",
  async (mode) => {
    const requests: {
      method: string | undefined;
      url: string | undefined;
      event: string | string[] | undefined;
      signature: string | string[] | undefined;
      body: string;
    }[] = [];
    const server = createServer((request, response) => {
      let body = "";

      request.setEncoding("utf8");
      request.on("data", (chunk: string) => {
        body += chunk;
      });
      request.on("end", () => {
        requests.push({
          method: request.method,
          url: request.url,
          event: request.headers["x-github-event"],
          signature: request.headers["x-hub-signature-256"],
          body,
        });
        response.writeHead(mode === "pong" ? 200 : mode === "redirect" ? 302 : 401, {
          "content-type": "application/json",
          location: "/unexpected",
        });
        response.end(JSON.stringify({ status: mode }));
      });
    });

    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));

    try {
      const address = server.address();
      if (!address || typeof address === "string") {
        throw new Error("Missing server address");
      }

      const run = execute(
        "bun",
        [
          "--no-env-file",
          "scripts/webhook-ping.ts",
          "--url",
          `http://127.0.0.1:${String(address.port)}`,
        ],
        { env },
      );
      if (mode === "pong") {
        vitest.expect(JSON.parse((await run).stdout)).toEqual({ status: "pong", httpStatus: 200 });
      } else {
        await vitest.expect(run).rejects.toMatchObject({ code: 1, stdout: "" });
      }

      vitest.expect(requests).toHaveLength(1);
      const request = requests[0]!;

      vitest
        .expect(request)
        .toMatchObject({ method: "POST", url: "/webhooks/github/example", event: "ping" });
      vitest
        .expect(request.signature)
        .toBe(
          `sha256=${createHmac("sha256", env.WEBHOOK_SECRET_EXAMPLE).update(request.body).digest("hex")}`,
        );
    } finally {
      server.closeAllConnections();
      await new Promise<void>((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve())),
      );
    }
  },
);

vitest.it("requires explicit hook selection when multiple hooks exist", async () => {
  await vitest
    .expect(
      execute("bun", ["--no-env-file", "scripts/webhook-ping.ts"], {
        env: { ...env, CONFIG_JSON: JSON.stringify(fixtures.testConfig) },
      }),
    )
    .rejects.toMatchObject({ code: 1, stdout: "" });
});

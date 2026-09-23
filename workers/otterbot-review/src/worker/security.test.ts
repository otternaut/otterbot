import * as vitest from "vitest";
import * as security from "~/worker/security";
import { sign } from "../../test/fixtures";

const bytes = new TextEncoder().encode('{"hello":"world"}');

vitest.describe("signed trust boundaries", () => {
  vitest.it("verifies original bytes and rejects tampering", async () => {
    const signature = sign("test-key", bytes);

    vitest.expect(await security.verify("test-key", signature, bytes)).toBe(true);
    vitest.expect(await security.verify("wrong", signature, bytes)).toBe(false);
    vitest
      .expect(
        await security.verify(
          "test-key",
          signature,
          new TextEncoder().encode('{ "hello":"world"}'),
        ),
      )
      .toBe(false);
  });
  vitest.it.each(["", "f".repeat(63), "g".repeat(64), "f".repeat(65)])(
    "rejects malformed signatures %s",
    async (signature) => {
      vitest.expect(await security.verify("key", signature, bytes)).toBe(false);
    },
  );
  vitest.it("enforces streaming limits without content-length", async () => {
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new Uint8Array(6));
        controller.enqueue(new Uint8Array(6));
        controller.close();
      },
    });
    const request = new Request("https://example.com", {
      method: "POST",
      body,
      duplex: "half",
    } as RequestInit);

    await vitest.expect(security.readBody(request, 10)).rejects.toThrow("Body too large");
  });
});

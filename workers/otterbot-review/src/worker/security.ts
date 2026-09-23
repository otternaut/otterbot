const encoder = new TextEncoder();

/**
 * Encode bytes without browser or Node-specific dependencies.
 *
 * @param bytes - Input bytes.
 * @returns Lowercase hexadecimal representation.
 *
 * @example
 * ```ts
 * import { hex } from "~/worker/security";
 * console.log(hex(new Uint8Array([0, 255]))); // "00ff"
 * ```
 */
export function hex(bytes: Uint8Array): string {
  return Array.from(bytes, (value) => value.toString(16).padStart(2, "0")).join("");
}

/**
 * Verify a signature using Web Crypto's constant-time HMAC verification.
 *
 * @param key - Configured signing secret.
 * @param signature - Hexadecimal signature without its algorithm prefix.
 * @param body - Original message bytes, before JSON parsing.
 * @returns Whether the signature is valid.
 *
 * @example
 * ```ts
 * import { verify } from "~/worker/security";
 * async function authenticated(key: string, signature: string, body: Uint8Array) {
 *   return verify(key, signature, body); // Verify the sender's signature over unchanged bytes.
 * }
 * ```
 */
export async function verify(key: string, signature: string, body: Uint8Array): Promise<boolean> {
  if (!/^[a-f0-9]{64}$/.test(signature)) {
    return false;
  }

  const imported = await crypto.subtle.importKey(
    "raw",
    encoder.encode(key),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"],
  );
  const bytes = Uint8Array.from(signature.match(/../g) ?? [], (value) =>
    Number.parseInt(value, 16),
  );

  return crypto.subtle.verify("HMAC", imported, bytes, body as BufferSource);
}

/**
 * Read a request body with an enforced streaming size limit.
 *
 * @param request - Incoming request whose body has not been consumed.
 * @param limit - Maximum byte count.
 * @returns Original request bytes.
 * @throws Error if the stream exceeds the limit.
 *
 * @example
 * ```ts
 * import { readBody } from "~/worker/security";
 * const request = new Request("https://reviews.example.com", { method: "POST", body: "{}" });
 * const bytes = await readBody(request, 1024);
 * ```
 */
export async function readBody(request: Request, limit = 1024 * 1024): Promise<Uint8Array> {
  if (Number(request.headers.get("content-length")) > limit) {
    throw new Error("Body too large");
  }

  const reader = request.body?.getReader();
  if (!reader) {
    return new Uint8Array();
  }

  const parts: Uint8Array[] = [];
  let total = 0;

  for (;;) {
    const item = await reader.read();
    if (item.done) {
      break;
    }

    total += item.value.length;
    if (total > limit) {
      await reader.cancel();
      throw new Error("Body too large");
    }

    parts.push(item.value);
  }

  const bytes = new Uint8Array(total);
  let offset = 0;

  for (const part of parts) {
    bytes.set(part, offset);
    offset += part.length;
  }

  return bytes;
}

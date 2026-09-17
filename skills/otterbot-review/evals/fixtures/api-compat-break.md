# PR fixture: return structured result from parseDuration

Synthetic TypeScript PR. Only `parseDuration` changes; the caller in
`scheduler.ts` is unchanged and is shown for context. `parseDuration` is
exported from the package's public entry point and the changelog says
"internal cleanup, no behavior change".

```ts
// duration.ts (changed)
export function parseDuration(input: string): { ms: number; unit: string } {
  const [, n, unit] = /^(\d+)(ms|s|m)$/.exec(input) ?? [];
  const factor = unit === "s" ? 1000 : unit === "m" ? 60_000 : 1;
  return { ms: Number(n) * factor, unit };
}

// scheduler.ts (unchanged caller)
const delay = parseDuration(cfg.retryAfter);
setTimeout(run, delay + jitter());
```

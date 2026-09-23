import * as v from "valibot";
import type { Event } from "~/contracts/review";
import type * as configuration from "~/contracts/config";

const identity = v.object({
  id: v.pipe(v.number(), v.safeInteger(), v.gtValue(0)),
  login: v.string(),
});
const repo = v.object({
  id: v.pipe(v.number(), v.safeInteger(), v.gtValue(0)),
  name: v.pipe(v.string(), v.regex(/^[a-zA-Z0-9_.-]{1,100}$/)),
  owner: identity,
});
const payloadSchema = v.object({
  action: v.string(),
  number: v.pipe(v.number(), v.safeInteger(), v.gtValue(0)),
  repository: repo,
  requested_reviewer: v.optional(identity),
  pull_request: v.object({
    number: v.pipe(v.number(), v.safeInteger(), v.gtValue(0)),
    base: v.object({ repo }),
    draft: v.boolean(),
    state: v.string(),
  }),
});

/**
 * Route an authenticated webhook using the base repository's stable owner ID.
 *
 * Head-fork owners, authors, and senders cannot select credentials.
 *
 * @param input - Parsed but untrusted GitHub payload.
 * @param config - Deployment-owned routing configuration.
 * @param hook - Already authenticated hook route.
 * @returns An actionable event, or null for irrelevant requests.
 * @throws Error when payload identities disagree or schemas are invalid.
 * @example
 * ```ts
 * import type * as configuration from "~/contracts/config";
 * import { routeEvent } from "~/worker/webhooks";
 * function route(input: unknown, config: configuration.Config, hook: configuration.Hook) {
 *   const event = routeEvent(input, config, hook);
 *   return event?.organization.patSecret; // Only an authenticated base repository selects a PAT.
 * }
 * ```
 */
export function routeEvent(
  input: unknown,
  config: configuration.Config,
  hook: configuration.Hook,
): Event | null {
  const payload = v.parse(payloadSchema, input);
  if (payload.action !== "review_requested") {
    return null;
  }

  const base = payload.pull_request.base.repo;
  if (
    base.id !== payload.repository.id ||
    payload.number !== payload.pull_request.number ||
    base.owner.id !== payload.repository.owner.id
  ) {
    throw new Error("Inconsistent base repository");
  }

  const org = config.organizations.find(
    (item) =>
      item.ownerId === base.owner.id &&
      item.owner === base.owner.login.toLowerCase() &&
      item.owner === hook.organization,
  );
  if (!org?.repositories.some((name) => name.toLowerCase() === base.name.toLowerCase())) {
    return null;
  }

  if (payload.requested_reviewer?.id !== org.reviewerId) {
    return null;
  }

  if (payload.pull_request.draft || payload.pull_request.state !== "open") {
    return null;
  }

  const profileName =
    Object.entries(org.repositoryProfiles).find(
      ([name]) => name.toLowerCase() === base.name.toLowerCase(),
    )?.[1] ?? org.profile;
  const profile = config.profiles[profileName];
  if (!profile) {
    throw new Error("Missing provider route");
  }

  return {
    action: payload.action,
    repositoryId: base.id,
    owner: org.owner,
    repository: base.name,
    number: payload.number,
    reviewerId: org.reviewerId,
    organization: org,
    profile,
  };
}

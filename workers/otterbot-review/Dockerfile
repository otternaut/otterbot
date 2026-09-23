# Keep this base tag aligned with @cloudflare/sandbox in package.json.
FROM oven/bun:1.4.2 AS dependencies
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --ignore-scripts

FROM node:24.15.0-bookworm-slim AS node
FROM docker.io/cloudflare/sandbox:0.12.9
COPY --from=node /usr/local/bin/node /usr/local/bin/node
WORKDIR /app
COPY --from=dependencies /app/node_modules ./node_modules
COPY package.json ./package.json
COPY .output/dist ./dist
COPY .output/skill ./skill
RUN mkdir -p /workspace/home && chmod -R a-w /app/skill
# The Sandbox base image supplies its control server and entry point.
# No secrets, target repositories, or private deployment files enter this image.

# syntax=docker/dockerfile:1

#? Multi-stage: pnpm needs devDependencies and the full source to compile, but
#? none of that belongs in the runtime image.
#?
#? Debian (slim), not Alpine. argon2 is a native module; on Alpine's musl libc
#? it has no prebuilt binary and must compile from source, which drags a full
#? toolchain into the build. glibc gets the prebuilt release instead.

# ---- deps: production dependencies only -------------------------------------
FROM node:24-slim AS deps
WORKDIR /app
RUN npm install -g pnpm@12.4.2
# pnpm needs the lockfile, not the sources, so this layer caches on deps alone
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
# pnpm 12 reads the build-script allowlist from pnpm-workspace.yaml. Without it
# the install fails outright rather than silently skipping scripts.
RUN pnpm install --frozen-lockfile --prod

# ---- build: compile TypeScript ----------------------------------------------
FROM node:24-slim AS build
WORKDIR /app
RUN npm install -g pnpm@12.4.2
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile
COPY tsconfig.json ./
COPY src ./src
RUN pnpm build

# ---- runtime: dist + prod deps only -----------------------------------------
FROM node:24-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production

# tini reaps zombies and forwards SIGTERM, so graceful shutdown actually runs
RUN apt-get update \
  && apt-get install -y --no-install-recommends tini \
  && rm -rf /var/lib/apt/lists/*

COPY --from=deps --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
# swagger.config.ts writes here, and tsc no longer copies it now that nothing
# imports the JSON. Copied explicitly so /api/docs works in a dev-mode container.
COPY --from=build --chown=node:node /app/src/docs ./dist/docs
COPY --from=build --chown=node:node /app/package.json ./package.json

# node ships an unprivileged `node` user; never run as root
USER node

EXPOSE 4000

#? Uses node's own fetch, so the image needs no curl or wget just to self-test.
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||4000)+'/api/v1/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["node", "dist/server.js"]

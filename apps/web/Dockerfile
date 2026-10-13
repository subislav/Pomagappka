# syntax=docker/dockerfile:1
FROM node:22-bookworm-slim AS deps
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app
COPY package.json pnpm-workspace.yaml tsconfig.base.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/web/package.json ./apps/web/
RUN pnpm install --filter @pomagappka/shared --filter @pomagappka/web

FROM deps AS build
COPY packages/shared ./packages/shared
COPY apps/web ./apps/web
RUN rm -f packages/shared/*.tsbuildinfo apps/web/*.tsbuildinfo \
  && pnpm --filter @pomagappka/shared build \
  && pnpm --filter @pomagappka/web build

FROM caddy:2.9-alpine AS runner
COPY --from=build /app/apps/web/dist /srv
COPY apps/web/Caddyfile.static /etc/caddy/Caddyfile
EXPOSE 80

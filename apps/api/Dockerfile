# syntax=docker/dockerfile:1
FROM node:22-bookworm-slim AS deps
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app
COPY package.json pnpm-workspace.yaml tsconfig.base.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/api/package.json ./apps/api/
RUN pnpm install --filter @pomagappka/shared --filter @pomagappka/api

FROM deps AS build
COPY packages/shared ./packages/shared
COPY apps/api ./apps/api
RUN rm -f packages/shared/*.tsbuildinfo apps/api/*.tsbuildinfo \
  && pnpm --filter @pomagappka/shared build \
  && pnpm --filter @pomagappka/api build

FROM node:22-bookworm-slim AS runner
RUN apt-get update \
  && apt-get install -y --no-install-recommends wget ca-certificates \
  && rm -rf /var/lib/apt/lists/* \
  && useradd --system --create-home --uid 1001 appuser

WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /app/package.json /app/pnpm-workspace.yaml ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/packages/shared ./packages/shared
COPY --from=build /app/apps/api/package.json ./apps/api/
COPY --from=build /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/apps/api/drizzle ./apps/api/drizzle
COPY apps/api/docker-entrypoint.sh ./apps/api/docker-entrypoint.sh

RUN chmod +x ./apps/api/docker-entrypoint.sh \
  && chown -R appuser:appuser /app

USER appuser
WORKDIR /app/apps/api
EXPOSE 3000

ENTRYPOINT ["./docker-entrypoint.sh"]

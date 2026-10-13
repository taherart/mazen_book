# Production image: Next.js standalone server, no dev dependencies, runs as a non-root user.
# NEXT_PUBLIC_* values are baked into the client bundle, so they are build arguments.
# NODE_IMAGE lets a build pull the same image from a mirror when Docker Hub rate-limits.

ARG NODE_IMAGE=node:22-alpine

FROM ${NODE_IMAGE} AS deps
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

FROM ${NODE_IMAGE} AS build
WORKDIR /app
RUN corepack enable
ARG NEXT_PUBLIC_SITE_URL
ARG NEXT_PUBLIC_LAUNCH_DATE
ARG NEXT_PUBLIC_BOOK_ORDER_URL
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build

FROM ${NODE_IMAGE}
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0
RUN addgroup -S app && adduser -S app -G app
COPY --from=build --chown=app:app /app/.next/standalone ./
COPY --from=build --chown=app:app /app/.next/static ./.next/static
COPY --from=build --chown=app:app /app/public ./public
USER app
EXPOSE 3000
CMD ["node", "server.js"]

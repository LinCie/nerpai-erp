FROM oven/bun:1-alpine

WORKDIR /app

# Copy manifests first for better caching
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile

# Copy only what migrations need
COPY kysely.config.ts ./
COPY src/shared/infrastructure/persistence/migrations ./src/shared/infrastructure/persistence/migrations

ARG MIGRATE_CMD="migrate latest"
ENV MIGRATE_CMD=${MIGRATE_CMD}

CMD ["sh", "-c", "bun run kysely ${MIGRATE_CMD}"]

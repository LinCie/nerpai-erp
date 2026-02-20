FROM oven/bun:alpine

WORKDIR /app

# Install only necessary dependencies (kysely, kysely-ctl, pg for Postgres, typescript for .ts config)
RUN bun add kysely kysely-ctl pg typescript

# Copy kysely config and migrations folder
COPY kysely.config.ts ./
COPY src/shared/infrastructure/persistence/migrations ./src/shared/infrastructure/persistence/migrations

# Default command is "migrate latest", but can be overridden via --build-arg or env
ARG MIGRATE_CMD="migrate latest"
ENV MIGRATE_CMD=${MIGRATE_CMD}

CMD ["sh", "-c", "bun run kysely ${MIGRATE_CMD}"]

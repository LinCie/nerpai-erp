FROM oven/bun:1

WORKDIR /app

# Copy manifests first for better caching
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile --verbose

# Copy only what migrations need
COPY kysely.config.ts ./
COPY src/shared/infrastructure/persistence/migrations ./src/shared/infrastructure/persistence/migrations

CMD ["sh", "-c", "bun run db:migrate"]

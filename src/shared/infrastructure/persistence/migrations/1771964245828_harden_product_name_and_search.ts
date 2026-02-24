import { sql, type Kysely } from "kysely";

// `unknown` is used here since migrations should be frozen in time. alternatively, keep a "snapshot" db interface.
export async function up(db: Kysely<unknown>): Promise<void> {
  await sql`CREATE EXTENSION IF NOT EXISTS pg_trgm`.execute(db);

  await sql`
	ALTER TABLE product
	ADD CONSTRAINT product_name_trimmed_not_empty
	CHECK (char_length(btrim(name)) > 0)
  `.execute(db);

  await sql`
	CREATE INDEX product_name_trgm_idx
	ON product
	USING gin (name gin_trgm_ops)
  `.execute(db);
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await sql`DROP INDEX IF EXISTS product_name_trgm_idx`.execute(db);

  await sql`
	ALTER TABLE product
	DROP CONSTRAINT IF EXISTS product_name_trimmed_not_empty
  `.execute(db);
}

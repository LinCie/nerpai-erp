import { sql, type Kysely } from 'kysely'

/**
 * Migration: enable_pg_trgm_extension
 * Created: 2026-03-03
 * Description: Enable pg_trgm for ILIKE substring search on customer_name
 */

export async function up(db: Kysely<unknown>): Promise<void> {
	// Enable pg_trgm extension for trigram-based substring search
	await sql`CREATE EXTENSION IF NOT EXISTS pg_trgm`.execute(db)
}

export async function down(db: Kysely<unknown>): Promise<void> {
	// Down Migration - DROP EXTENSION IF EXISTS pg_trgm
	await sql`DROP EXTENSION IF EXISTS pg_trgm`.execute(db)
}

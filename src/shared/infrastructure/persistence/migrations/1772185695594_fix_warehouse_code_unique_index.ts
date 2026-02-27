import { sql, type Kysely } from "kysely";

/**
 * Fix warehouse code uniqueness index to cover ALL rows (including soft-deleted).
 *
 * Previously: partial unique index `WHERE deleted_at IS NULL` — only enforced
 * uniqueness among active records, allowing soft-deleted codes to be reused.
 *
 * Now: full unique index without WHERE clause — soft-deleted warehouses block
 * code reuse, aligning with FR-012 and spec clarification (2026-02-26):
 *   "Soft-deleted warehouses block code reuse to preserve data integrity
 *    so restored warehouses never conflict with newly created ones."
 */
export async function up(db: Kysely<unknown>): Promise<void> {
  // Drop the old partial unique index
  await db.schema.dropIndex("warehouse_org_code_unique").execute();

  // Create a non-partial unique index covering ALL rows (including soft-deleted)
  await sql`
    CREATE UNIQUE INDEX warehouse_org_code_unique
    ON warehouse (organization_id, lower(btrim(code)))
  `.execute(db);
}

export async function down(db: Kysely<unknown>): Promise<void> {
  // Revert to partial unique index (active records only)
  await db.schema.dropIndex("warehouse_org_code_unique").execute();

  await sql`
    CREATE UNIQUE INDEX warehouse_org_code_unique
    ON warehouse (organization_id, lower(btrim(code)))
    WHERE deleted_at IS NULL
  `.execute(db);
}

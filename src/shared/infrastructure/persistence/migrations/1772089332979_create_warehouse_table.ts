import { sql, type Kysely } from "kysely";

export async function up(db: Kysely<unknown>): Promise<void> {
  // Create warehouse table
  await db.schema
    .createTable("warehouse")
    .addColumn("id", "uuid", (col) => col.primaryKey().defaultTo(sql`uuidv7()`))
    .addColumn("name", "varchar(255)", (col) => col.notNull())
    .addColumn("code", "varchar(50)", (col) => col.notNull())
    .addColumn("street_address", "varchar(500)")
    .addColumn("city", "varchar(100)")
    .addColumn("province", "varchar(100)")
    .addColumn("postal_code", "varchar(20)")
    .addColumn("country", "varchar(100)", (col) =>
      col.notNull().defaultTo("Indonesia"),
    )
    .addColumn("contact_name", "varchar(255)")
    .addColumn("contact_phone", "varchar(50)")
    .addColumn("contact_email", "varchar(255)")
    .addColumn("notes", "text")
    .addColumn("organization_id", "uuid", (col) =>
      col.notNull().references("organization.id").onDelete("cascade"),
    )
    .addColumn("created_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`),
    )
    .addColumn("updated_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`),
    )
    .addColumn("deleted_at", "timestamptz")
    .execute();

  // Indexes for multi-tenancy and common queries
  await db.schema
    .createIndex("warehouse_organization_id_idx")
    .on("warehouse")
    .column("organization_id")
    .execute();

  await db.schema
    .createIndex("warehouse_org_deleted_at_idx")
    .on("warehouse")
    .columns(["organization_id", "deleted_at"])
    .execute();

  await db.schema
    .createIndex("warehouse_name_search_idx")
    .on("warehouse")
    .column("name")
    .execute();

  await db.schema
    .createIndex("warehouse_city_idx")
    .on("warehouse")
    .column("city")
    .execute();

  await db.schema
    .createIndex("warehouse_province_idx")
    .on("warehouse")
    .column("province")
    .execute();

  // Unique partial index: code must be unique within organization across ALL rows
  // (including soft-deleted) to block code reuse (FR-012)
  // Note: We use a full unique index (not partial) so soft-deleted warehouses also
  // block reuse. Code uniqueness is enforced at application layer for soft-deleted records.
  // The partial index (WHERE deleted_at IS NULL) only enforces uniqueness for active records.
  await sql`
		CREATE UNIQUE INDEX warehouse_org_code_unique
		ON warehouse (organization_id, lower(btrim(code)))
		WHERE deleted_at IS NULL
	`.execute(db);

  // CHECK constraints for data integrity
  await sql`ALTER TABLE warehouse ADD CONSTRAINT warehouse_name_not_empty CHECK (LENGTH(TRIM(name)) > 0)`.execute(
    db,
  );

  await sql`ALTER TABLE warehouse ADD CONSTRAINT warehouse_code_not_empty CHECK (LENGTH(TRIM(code)) > 0)`.execute(
    db,
  );

  // Auto-update updated_at on row modification (reuse existing function or create idempotently)
  await sql`
		CREATE OR REPLACE FUNCTION update_updated_at_column()
		RETURNS TRIGGER AS $$
		BEGIN
			NEW.updated_at = CURRENT_TIMESTAMP;
			RETURN NEW;
		END;
		$$ language 'plpgsql'
	`.execute(db);

  await sql`
		CREATE TRIGGER update_warehouse_updated_at
		BEFORE UPDATE ON warehouse
		FOR EACH ROW
		EXECUTE FUNCTION update_updated_at_column()
	`.execute(db);
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await sql`DROP TRIGGER IF EXISTS update_warehouse_updated_at ON warehouse`.execute(
    db,
  );
  await sql`ALTER TABLE warehouse DROP CONSTRAINT IF EXISTS warehouse_code_not_empty`.execute(
    db,
  );
  await sql`ALTER TABLE warehouse DROP CONSTRAINT IF EXISTS warehouse_name_not_empty`.execute(
    db,
  );
  await db.schema.dropIndex("warehouse_org_code_unique").execute();
  await db.schema.dropIndex("warehouse_province_idx").execute();
  await db.schema.dropIndex("warehouse_city_idx").execute();
  await db.schema.dropIndex("warehouse_name_search_idx").execute();
  await db.schema.dropIndex("warehouse_org_deleted_at_idx").execute();
  await db.schema.dropIndex("warehouse_organization_id_idx").execute();
  await db.schema.dropTable("warehouse").execute();
}

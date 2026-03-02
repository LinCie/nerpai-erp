import { sql, type Kysely } from 'kysely'

export async function up(db: Kysely<unknown>): Promise<void> {
	await db.schema
		.createTable('stock_movement')
		.addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`uuidv7()`))
		.addColumn('product_id', 'uuid', (col) =>
			col.notNull().references('product.id').onDelete('cascade')
		)
		.addColumn('product_variant_id', 'uuid', (col) =>
			col.references('product_variant.id').onDelete('cascade')
		)
		.addColumn('warehouse_id', 'uuid', (col) =>
			col.notNull().references('warehouse.id').onDelete('cascade')
		)
		.addColumn('movement_type', 'varchar(20)', (col) => col.notNull())
		.addColumn('delta', 'integer', (col) => col.notNull())
		.addColumn('reference_id', 'uuid')
		.addColumn('notes', 'text')
		.addColumn('created_by', 'uuid', (col) =>
			col.notNull().references('user.id').onDelete('restrict')
		)
		.addColumn('organization_id', 'uuid', (col) =>
			col.notNull().references('organization.id').onDelete('cascade')
		)
		.addColumn('created_at', 'timestamptz', (col) =>
			col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`)
		)
		.addColumn('deleted_at', 'timestamptz')
		.execute()

	await db.schema
		.createIndex('stock_movement_aggregate_idx')
		.on('stock_movement')
		.columns(['organization_id', 'product_id', 'product_variant_id', 'warehouse_id'])
		.execute()

	await db.schema
		.createIndex('stock_movement_warehouse_idx')
		.on('stock_movement')
		.columns(['warehouse_id', 'organization_id'])
		.execute()

	await db.schema
		.createIndex('stock_movement_product_idx')
		.on('stock_movement')
		.columns(['product_id', 'organization_id'])
		.execute()

	await sql`
		CREATE INDEX stock_movement_timeline_idx
		ON stock_movement (organization_id, created_at DESC)
	`.execute(db)

	await sql`
		CREATE INDEX stock_movement_reference_idx
		ON stock_movement (reference_id)
		WHERE reference_id IS NOT NULL
	`.execute(db)

	await sql`
		ALTER TABLE stock_movement ADD CONSTRAINT stock_movement_type_check
			CHECK (movement_type IN ('receive', 'dispatch', 'adjustment'))
	`.execute(db)

	await sql`
		ALTER TABLE stock_movement ADD CONSTRAINT stock_movement_delta_not_zero
			CHECK (delta <> 0)
	`.execute(db)

	await sql`
		ALTER TABLE stock_movement ADD CONSTRAINT stock_movement_receive_positive
			CHECK (movement_type <> 'receive' OR delta > 0)
	`.execute(db)

	await sql`
		ALTER TABLE stock_movement ADD CONSTRAINT stock_movement_dispatch_negative
			CHECK (movement_type <> 'dispatch' OR delta < 0)
	`.execute(db)
}

export async function down(db: Kysely<unknown>): Promise<void> {
	await sql`ALTER TABLE stock_movement DROP CONSTRAINT IF EXISTS stock_movement_dispatch_negative`.execute(db)
	await sql`ALTER TABLE stock_movement DROP CONSTRAINT IF EXISTS stock_movement_receive_positive`.execute(db)
	await sql`ALTER TABLE stock_movement DROP CONSTRAINT IF EXISTS stock_movement_delta_not_zero`.execute(db)
	await sql`ALTER TABLE stock_movement DROP CONSTRAINT IF EXISTS stock_movement_type_check`.execute(db)
	await db.schema.dropIndex('stock_movement_reference_idx').execute()
	await db.schema.dropIndex('stock_movement_timeline_idx').execute()
	await db.schema.dropIndex('stock_movement_product_idx').execute()
	await db.schema.dropIndex('stock_movement_warehouse_idx').execute()
	await db.schema.dropIndex('stock_movement_aggregate_idx').execute()
	await db.schema.dropTable('stock_movement').execute()
}

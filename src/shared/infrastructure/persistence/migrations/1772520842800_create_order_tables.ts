import { sql, type Kysely } from 'kysely'

/**
 * Migration: create_order_tables
 * Created: 2026-03-03
 * Description: Create order, order_item, and order_status_history tables
 */

export async function up(db: Kysely<unknown>): Promise<void> {
	// 1. Order table
	await db.schema
		.createTable('order')
		.addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`uuidv7()`))
		.addColumn('customer_name', 'varchar(255)', (col) => col.notNull())
		.addColumn('status', 'varchar(20)', (col) => col.notNull().defaultTo('unpaid'))
		.addColumn('total_amount', 'numeric(12, 2)', (col) => col.notNull().defaultTo(0))
		.addColumn('version', 'integer', (col) => col.notNull().defaultTo(1))
		.addColumn('organization_id', 'uuid', (col) => col.notNull().references('organization.id').onDelete('cascade'))
		.addColumn('created_by', 'uuid', (col) => col.notNull().references('user.id').onDelete('restrict'))
		.addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
		.addColumn('updated_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
		.addColumn('deleted_at', 'timestamptz')
		.execute()

	// CHECK constraints for order
	await sql`
		ALTER TABLE "order" ADD CONSTRAINT order_status_check
		CHECK (status IN ('unpaid', 'paid', 'process', 'sent', 'completed', 'return', 'cancelled'))
	`.execute(db)

	await sql`
		ALTER TABLE "order" ADD CONSTRAINT order_customer_name_check
		CHECK (TRIM(customer_name) <> '')
	`.execute(db)

	await sql`
		ALTER TABLE "order" ADD CONSTRAINT order_total_amount_check
		CHECK (total_amount >= 0)
	`.execute(db)

	await sql`
		ALTER TABLE "order" ADD CONSTRAINT order_version_check
		CHECK (version >= 1)
	`.execute(db)

	// Indexes for order
	await db.schema.createIndex('order_org_status_idx').on('order').columns(['organization_id', 'status']).execute()
	await db.schema.createIndex('order_org_timeline_idx').on('order').columns(['organization_id', 'created_at']).execute()

	await sql`CREATE INDEX order_customer_search_idx ON "order" USING GIN (customer_name gin_trgm_ops)`.execute(db)

	// 2. Order Item table
	await db.schema
		.createTable('order_item')
		.addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`uuidv7()`))
		.addColumn('order_id', 'uuid', (col) => col.notNull().references('order.id').onDelete('cascade'))
		.addColumn('product_id', 'uuid', (col) => col.references('product.id').onDelete('set null'))
		.addColumn('product_variant_id', 'uuid', (col) => col.references('product_variant.id').onDelete('set null'))
		.addColumn('product_name', 'varchar(255)', (col) => col.notNull())
		.addColumn('sku', 'varchar(100)', (col) => col.notNull())
		.addColumn('unit_price', 'numeric(12, 2)', (col) => col.notNull())
		.addColumn('quantity', 'integer', (col) => col.notNull())
		.addColumn('subtotal', 'numeric(12, 2)', (col) => col.notNull())
		.addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
		.addColumn('deleted_at', 'timestamptz')
		.execute()

	// CHECK constraints for order_item
	await sql`
		ALTER TABLE order_item ADD CONSTRAINT order_item_quantity_check
		CHECK (quantity > 0)
	`.execute(db)

	await sql`
		ALTER TABLE order_item ADD CONSTRAINT order_item_unit_price_check
		CHECK (unit_price >= 0)
	`.execute(db)

	await sql`
		ALTER TABLE order_item ADD CONSTRAINT order_item_subtotal_check
		CHECK (subtotal >= 0)
	`.execute(db)

	await sql`
		ALTER TABLE order_item ADD CONSTRAINT order_item_name_check
		CHECK (TRIM(product_name) <> '')
	`.execute(db)

	await sql`
		ALTER TABLE order_item ADD CONSTRAINT order_item_sku_check
		CHECK (TRIM(sku) <> '')
	`.execute(db)

	// Indexes for order_item
	await db.schema.createIndex('order_item_order_idx').on('order_item').column('order_id').execute()
	await db.schema.createIndex('order_item_product_idx').on('order_item').column('product_id').execute()

	// 3. Order Status History table
	await db.schema
		.createTable('order_status_history')
		.addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`uuidv7()`))
		.addColumn('order_id', 'uuid', (col) => col.notNull().references('order.id').onDelete('cascade'))
		.addColumn('previous_status', 'varchar(20)')
		.addColumn('new_status', 'varchar(20)', (col) => col.notNull())
		.addColumn('changed_by', 'uuid', (col) => col.notNull().references('user.id').onDelete('restrict'))
		.addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
		.addColumn('deleted_at', 'timestamptz')
		.execute()

	// CHECK constraints for order_status_history
	await sql`
		ALTER TABLE order_status_history ADD CONSTRAINT order_history_status_check
		CHECK (new_status IN ('unpaid', 'paid', 'process', 'sent', 'completed', 'return', 'cancelled'))
	`.execute(db)

	// Indexes for order_status_history
	await db.schema.createIndex('order_status_history_order_idx').on('order_status_history').columns(['order_id', 'created_at']).execute()
}

export async function down(db: Kysely<unknown>): Promise<void> {
	// Drop tables in reverse order
	await db.schema.dropTable('order_status_history').ifExists().execute()
	await db.schema.dropTable('order_item').ifExists().execute()
	await db.schema.dropTable('order').ifExists().execute()
}

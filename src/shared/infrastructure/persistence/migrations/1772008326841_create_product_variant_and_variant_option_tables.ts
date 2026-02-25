import { sql, type Kysely } from 'kysely'

export async function up(db: Kysely<unknown>): Promise<void> {
	await db.schema
		.createTable('product_variant')
		.addColumn('id', 'uuid', (col) =>
			col.primaryKey().defaultTo(sql`uuidv7()`)
		)
		.addColumn('product_id', 'uuid', (col) =>
			col.notNull().references('product.id').onDelete('cascade')
		)
		.addColumn('sku', 'varchar(255)', (col) => col.notNull())
		.addColumn('price', sql`numeric(12,2)`, (col) => col.notNull().defaultTo(sql`0`))
		.addColumn('stock_quantity', 'integer', (col) => col.notNull().defaultTo(0))
		.addColumn('is_active', 'boolean', (col) => col.notNull().defaultTo(true))
		.addColumn('organization_id', 'uuid', (col) =>
			col.notNull().references('organization.id').onDelete('cascade')
		)
		.addColumn('created_at', 'timestamptz', (col) =>
			col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`)
		)
		.addColumn('updated_at', 'timestamptz', (col) =>
			col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`)
		)
		.addColumn('deleted_at', 'timestamptz')
		.execute()

	await db.schema
		.createIndex('product_variant_product_id_idx')
		.on('product_variant')
		.column('product_id')
		.execute()

	await db.schema
		.createIndex('product_variant_org_deleted_at_idx')
		.on('product_variant')
		.columns(['organization_id', 'deleted_at'])
		.execute()

	await db.schema
		.alterTable('product_variant')
		.addUniqueConstraint('product_variant_sku_org_unique', [
			'sku',
			'organization_id',
		])
		.execute()

	await sql`ALTER TABLE product_variant ADD CONSTRAINT product_variant_price_non_negative CHECK (price >= 0)`.execute(
		db
	)

	await sql`ALTER TABLE product_variant ADD CONSTRAINT product_variant_stock_non_negative CHECK (stock_quantity >= 0)`.execute(
		db
	)

	await db.schema
		.createTable('variant_option')
		.addColumn('id', 'uuid', (col) =>
			col.primaryKey().defaultTo(sql`uuidv7()`)
		)
		.addColumn('product_variant_id', 'uuid', (col) =>
			col.notNull().references('product_variant.id').onDelete('cascade')
		)
		.addColumn('attribute_option_id', 'uuid', (col) =>
			col.notNull().references('attribute_option.id').onDelete('restrict')
		)
		.addColumn('product_attribute_id', 'uuid', (col) =>
			col.notNull().references('product_attribute.id').onDelete('cascade')
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
		.createIndex('variant_option_variant_id_idx')
		.on('variant_option')
		.column('product_variant_id')
		.execute()

	await db.schema
		.alterTable('variant_option')
		.addUniqueConstraint('variant_option_variant_attr_unique', [
			'product_variant_id',
			'product_attribute_id',
		])
		.execute()
}

export async function down(db: Kysely<unknown>): Promise<void> {
	await db.schema
		.alterTable('variant_option')
		.dropConstraint('variant_option_variant_attr_unique')
		.execute()
	await db.schema.dropIndex('variant_option_variant_id_idx').execute()
	await db.schema.dropTable('variant_option').execute()

	await sql`ALTER TABLE product_variant DROP CONSTRAINT IF EXISTS product_variant_stock_non_negative`.execute(
		db
	)
	await sql`ALTER TABLE product_variant DROP CONSTRAINT IF EXISTS product_variant_price_non_negative`.execute(
		db
	)
	await db.schema
		.alterTable('product_variant')
		.dropConstraint('product_variant_sku_org_unique')
		.execute()
	await db.schema.dropIndex('product_variant_org_deleted_at_idx').execute()
	await db.schema.dropIndex('product_variant_product_id_idx').execute()
	await db.schema.dropTable('product_variant').execute()
}

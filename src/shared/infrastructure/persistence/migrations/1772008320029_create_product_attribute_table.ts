import { sql, type Kysely } from 'kysely'

export async function up(db: Kysely<unknown>): Promise<void> {
	await db.schema
		.createTable('product_attribute')
		.addColumn('id', 'uuid', (col) =>
			col.primaryKey().defaultTo(sql`uuidv7()`)
		)
		.addColumn('product_id', 'uuid', (col) =>
			col.notNull().references('product.id').onDelete('cascade')
		)
		.addColumn('attribute_id', 'uuid', (col) =>
			col.notNull().references('attribute.id').onDelete('cascade')
		)
		.addColumn('display_order', 'integer', (col) => col.notNull())
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
		.createIndex('product_attribute_product_id_idx')
		.on('product_attribute')
		.column('product_id')
		.execute()

	await db.schema
		.alterTable('product_attribute')
		.addUniqueConstraint('product_attribute_product_attr_unique', [
			'product_id',
			'attribute_id',
		])
		.execute()

	await db.schema
		.alterTable('product_attribute')
		.addUniqueConstraint('product_attribute_display_order_unique', [
			'product_id',
			'display_order',
		])
		.execute()

	await sql`ALTER TABLE product_attribute ADD CONSTRAINT product_attribute_display_order_positive CHECK (display_order > 0)`.execute(
		db
	)
}

export async function down(db: Kysely<unknown>): Promise<void> {
	await sql`ALTER TABLE product_attribute DROP CONSTRAINT IF EXISTS product_attribute_display_order_positive`.execute(
		db
	)
	await db.schema
		.alterTable('product_attribute')
		.dropConstraint('product_attribute_display_order_unique')
		.execute()
	await db.schema
		.alterTable('product_attribute')
		.dropConstraint('product_attribute_product_attr_unique')
		.execute()
	await db.schema.dropIndex('product_attribute_product_id_idx').execute()
	await db.schema.dropTable('product_attribute').execute()
}

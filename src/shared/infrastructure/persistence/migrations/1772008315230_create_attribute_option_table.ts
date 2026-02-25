import { sql, type Kysely } from 'kysely'

export async function up(db: Kysely<unknown>): Promise<void> {
	await db.schema
		.createTable('attribute_option')
		.addColumn('id', 'uuid', (col) =>
			col.primaryKey().defaultTo(sql`uuidv7()`)
		)
		.addColumn('value', 'varchar(255)', (col) => col.notNull())
		.addColumn('attribute_id', 'uuid', (col) =>
			col.notNull().references('attribute.id').onDelete('cascade')
		)
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
		.createIndex('attribute_option_attribute_id_idx')
		.on('attribute_option')
		.column('attribute_id')
		.execute()

	await db.schema
		.createIndex('attribute_option_org_deleted_at_idx')
		.on('attribute_option')
		.columns(['organization_id', 'deleted_at'])
		.execute()
}

export async function down(db: Kysely<unknown>): Promise<void> {
	await db.schema.dropIndex('attribute_option_org_deleted_at_idx').execute()
	await db.schema.dropIndex('attribute_option_attribute_id_idx').execute()
	await db.schema.dropTable('attribute_option').execute()
}

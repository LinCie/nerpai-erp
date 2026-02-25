import { sql, type Kysely } from 'kysely'

export async function up(db: Kysely<unknown>): Promise<void> {
	await db.schema
		.createTable('attribute')
		.addColumn('id', 'uuid', (col) =>
			col.primaryKey().defaultTo(sql`uuidv7()`)
		)
		.addColumn('name', 'varchar(255)', (col) => col.notNull())
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
		.createIndex('attribute_organization_id_idx')
		.on('attribute')
		.column('organization_id')
		.execute()

	await db.schema
		.createIndex('attribute_org_deleted_at_idx')
		.on('attribute')
		.columns(['organization_id', 'deleted_at'])
		.execute()
}

export async function down(db: Kysely<unknown>): Promise<void> {
	await db.schema.dropIndex('attribute_org_deleted_at_idx').execute()
	await db.schema.dropIndex('attribute_organization_id_idx').execute()
	await db.schema.dropTable('attribute').execute()
}

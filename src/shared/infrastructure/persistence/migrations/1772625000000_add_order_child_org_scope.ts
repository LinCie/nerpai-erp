import { sql, type Kysely } from 'kysely'

/**
 * Migration: add_order_child_org_scope
 * Created: 2026-03-03
 * Description: Add organization_id to order_item and order_status_history
 */

export async function up(db: Kysely<unknown>): Promise<void> {
	await db.schema.alterTable('order_item').addColumn('organization_id', 'uuid').execute()
	await db.schema.alterTable('order_status_history').addColumn('organization_id', 'uuid').execute()

	await sql`
		UPDATE order_item oi
		SET organization_id = o.organization_id
		FROM "order" o
		WHERE oi.order_id = o.id
		  AND oi.organization_id IS NULL
	`.execute(db)

	await sql`
		UPDATE order_status_history osh
		SET organization_id = o.organization_id
		FROM "order" o
		WHERE osh.order_id = o.id
		  AND osh.organization_id IS NULL
	`.execute(db)

	await sql`ALTER TABLE order_item ALTER COLUMN organization_id SET NOT NULL`.execute(db)
	await sql`ALTER TABLE order_status_history ALTER COLUMN organization_id SET NOT NULL`.execute(db)

	await sql`
		ALTER TABLE order_item
		ADD CONSTRAINT order_item_organization_fk
		FOREIGN KEY (organization_id) REFERENCES organization(id)
		ON DELETE CASCADE
	`.execute(db)

	await sql`
		ALTER TABLE order_status_history
		ADD CONSTRAINT order_status_history_organization_fk
		FOREIGN KEY (organization_id) REFERENCES organization(id)
		ON DELETE CASCADE
	`.execute(db)

	await db.schema.createIndex('order_item_org_order_idx').on('order_item').columns(['organization_id', 'order_id']).execute()
	await db.schema
		.createIndex('order_status_history_org_order_idx')
		.on('order_status_history')
		.columns(['organization_id', 'order_id', 'created_at'])
		.execute()
}

export async function down(db: Kysely<unknown>): Promise<void> {
	await db.schema.dropIndex('order_status_history_org_order_idx').ifExists().execute()
	await db.schema.dropIndex('order_item_org_order_idx').ifExists().execute()

	await sql`ALTER TABLE order_status_history DROP CONSTRAINT IF EXISTS order_status_history_organization_fk`.execute(db)
	await sql`ALTER TABLE order_item DROP CONSTRAINT IF EXISTS order_item_organization_fk`.execute(db)

	await db.schema.alterTable('order_status_history').dropColumn('organization_id').execute()
	await db.schema.alterTable('order_item').dropColumn('organization_id').execute()
}

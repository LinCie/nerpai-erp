import { sql, type Kysely } from "kysely";

export async function up(db: Kysely<unknown>): Promise<void> {
  await sql`ALTER TABLE product_variant DROP CONSTRAINT IF EXISTS product_variant_stock_non_negative`.execute(
    db,
  );

  await db.schema
    .alterTable("product_variant")
    .dropColumn("stock_quantity")
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .alterTable("product_variant")
    .addColumn("stock_quantity", "integer", (col) => col.notNull().defaultTo(0))
    .execute();

  await sql`ALTER TABLE product_variant ADD CONSTRAINT product_variant_stock_non_negative CHECK (stock_quantity >= 0)`.execute(
    db,
  );
}

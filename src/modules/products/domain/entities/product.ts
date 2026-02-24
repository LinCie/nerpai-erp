/** Product entity as stored in the database (via Kysely codegen + CamelCasePlugin) */
export interface Product {
  id: string; // UUID v7
  name: string; // 1-255 chars
  organizationId: string; // UUID FK
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null; // null = active, Date = soft-deleted
}

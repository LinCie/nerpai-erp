/**
 * Domain value types for the Warehouse module.
 * These are types that belong to the domain layer and represent
 * core business concepts beyond the entity itself.
 */

/** Warehouse state derived from deletedAt field */
export type WarehouseStatus = "active" | "deleted";

/** Helper to determine warehouse status */
export function getWarehouseStatus(deletedAt: Date | null): WarehouseStatus {
  return deletedAt === null ? "active" : "deleted";
}

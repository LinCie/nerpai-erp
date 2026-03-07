/**
 * Presentation-layer types for the Warehouse module.
 * These types are specific to the presentation layer (components, pages).
 */

/** Column definition for warehouse list table */
export type WarehouseListColumn =
  | "name"
  | "code"
  | "city"
  | "province"
  | "actions";

/** Search params expected on the warehouse list page */
export interface WarehouseListSearchParams {
  search?: string;
  province?: string;
  page?: string;
}

/** Params for listing warehouses */
export interface GetWarehousesParams {
  organizationId: string;
  search?: string; // Optional text search across name, code, city, province
  province?: string; // Filter by province
  includeDeleted?: boolean; // If true, returns ONLY deleted warehouses (for Trash view)
  limit?: number;
  offset?: number;
}

/** Params for getting a single warehouse */
export interface GetWarehouseParams {
  id: string;
  organizationId: string;
  includeDeleted?: boolean;
}

/** Params for creating a warehouse */
export interface CreateWarehouseParams {
  name: string;
  code: string;
  streetAddress?: string | null;
  city?: string | null;
  province?: string | null;
  postalCode?: string | null;
  country?: string; // Default: "Indonesia"
  contactName?: string | null;
  contactPhone?: string | null;
  contactEmail?: string | null;
  notes?: string | null;
  organizationId: string;
}

/** Params for updating a warehouse (code is immutable — excluded) */
export interface UpdateWarehouseParams {
  id: string;
  name: string;
  streetAddress?: string | null;
  city?: string | null;
  province?: string | null;
  postalCode?: string | null;
  country: string;
  contactName?: string | null;
  contactPhone?: string | null;
  contactEmail?: string | null;
  notes?: string | null;
  organizationId: string;
}

/** Params for soft-deleting a warehouse */
export interface SoftDeleteWarehouseParams {
  id: string;
  organizationId: string;
}

/** Params for restoring a warehouse */
export interface RestoreWarehouseParams {
  id: string;
  organizationId: string;
}

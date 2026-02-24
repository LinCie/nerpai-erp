/** Params for listing products */
export interface GetProductsParams {
  organizationId: string;
  search?: string; // Optional name search filter
  includeDeleted?: boolean; // If true, returns ONLY deleted products (for Trash view)
}

/** Params for creating a product */
export interface CreateProductParams {
  name: string;
  organizationId: string;
}

/** Params for updating a product */
export interface UpdateProductParams {
  id: string;
  name: string;
  organizationId: string;
}

/** Params for soft-deleting a product */
export interface SoftDeleteProductParams {
  id: string;
  organizationId: string;
}

/** Params for restoring a product */
export interface RestoreProductParams {
  id: string;
  organizationId: string;
}

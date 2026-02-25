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

/** Params for listing attributes */
export interface GetAttributesParams {
  organizationId: string;
  search?: string;
  includeDeleted?: boolean;
}

/** Params for creating an attribute */
export interface CreateAttributeParams {
  name: string;
  organizationId: string;
}

/** Params for updating an attribute */
export interface UpdateAttributeParams {
  id: string;
  name: string;
  organizationId: string;
}

/** Params for soft-deleting an attribute */
export interface SoftDeleteAttributeParams {
  id: string;
  organizationId: string;
}

/** Params for restoring an attribute */
export interface RestoreAttributeParams {
  id: string;
  organizationId: string;
}

/** Params for creating an attribute option */
export interface CreateAttributeOptionParams {
  value: string;
  attributeId: string;
  organizationId: string;
}

/** Params for updating an attribute option */
export interface UpdateAttributeOptionParams {
  id: string;
  value: string;
  organizationId: string;
}

/** Params for deleting an attribute option */
export interface DeleteAttributeOptionParams {
  id: string;
  organizationId: string;
}

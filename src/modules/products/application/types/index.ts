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

/** Params for assigning an attribute to a product */
export interface AssignAttributeToProductParams {
  productId: string;
  attributeId: string;
  organizationId: string;
}

/** Params for removing an attribute from a product */
export interface RemoveAttributeFromProductParams {
  productId: string;
  attributeId: string;
  confirmed: boolean;
  organizationId: string;
}

/** Params for reordering product attributes */
export interface ReorderProductAttributesParams {
  productId: string;
  orderedAttributeIds: string[];
  organizationId: string;
}

/** Params for generating variants */
export interface GenerateVariantsParams {
  productId: string;
  selections: Record<string, string[]>;
  organizationId: string;
}

/** Params for updating a variant */
export interface UpdateVariantParams {
  id: string;
  sku?: string;
  price?: number;
  stockQuantity?: number;
  organizationId: string;
}

/** Params for toggling variant active status */
export interface ToggleVariantActiveParams {
  id: string;
  isActive: boolean;
  organizationId: string;
}

/** Params for soft-deleting a variant */
export interface SoftDeleteVariantParams {
  id: string;
  organizationId: string;
}

/** Params for getting variants by product */
export interface GetVariantsByProductParams {
  productId: string;
  organizationId: string;
  includeDeleted?: boolean;
}

/** Params for checking SKU existence */
export interface CheckSkuExistsParams {
  sku: string;
  organizationId: string;
  excludeVariantId?: string;
}

/** Return type for generate variants action */
export interface GenerateVariantsResult {
  success: boolean;
  created: number;
  variants: Array<{ id: string; sku: string }>;
  error?: string;
}

/** Return type for attribute assignment action */
export interface AssignAttributeResult {
  success: boolean;
  productAttribute?: {
    id: string;
    displayOrder: number;
  };
  error?: string;
}

/** Return type for attribute removal action */
export interface RemoveAttributeResult {
  success: boolean;
  deactivatedCount: number;
  needsConfirmation?: boolean;
  affectedCount?: number;
  message?: string;
  error?: string;
}

/** Return type for update variant action */
export interface UpdateVariantResult {
  success: boolean;
  variant?: {
    id: string;
    sku: string;
    price: number;
    stockQuantity: number;
  };
  error?: string;
}

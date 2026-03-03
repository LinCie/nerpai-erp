/** Product Variant — single orderable unit with its own SKU and price */
export interface ProductVariant {
  id: string;
  productId: string;
  sku: string;
  price: string;
  isActive: boolean;
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

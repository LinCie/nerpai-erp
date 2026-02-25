import type { ProductAttribute } from "../../domain/entities/product-attribute";
import type { ProductVariant } from "../../domain/entities/product-variant";
import type { VariantOption } from "../../domain/entities/variant-option";
import type { ProductWithVariants, VariantWithOptions } from "../../domain/types";

export interface IVariantRepository {
  getProductAttributes(params: {
    productId: string;
    organizationId: string;
  }): Promise<ProductAttribute[]>;

  getProductAttribute(params: {
    productId: string;
    attributeId: string;
    organizationId: string;
  }): Promise<ProductAttribute | null>;

  assignAttributeToProduct(params: {
    productId: string;
    attributeId: string;
    displayOrder: number;
    organizationId: string;
  }): Promise<ProductAttribute>;

  removeAttributeFromProduct(params: {
    productId: string;
    attributeId: string;
    organizationId: string;
  }): Promise<boolean>;

  reorderProductAttributes(params: {
    productId: string;
    orderedAttributeIds: string[];
    organizationId: string;
  }): Promise<boolean>;

  countVariantsUsingAttribute(params: {
    productId: string;
    attributeId: string;
    organizationId: string;
  }): Promise<number>;

  getVariantsByProduct(params: {
    productId: string;
    organizationId: string;
    includeDeleted?: boolean;
  }): Promise<VariantWithOptions[]>;

  getVariantById(params: {
    id: string;
    organizationId: string;
  }): Promise<ProductVariant | null>;

  getVariantWithOptions(params: {
    id: string;
    organizationId: string;
  }): Promise<VariantWithOptions | null>;

  createVariant(params: {
    productId: string;
    sku: string;
    price: number;
    stockQuantity: number;
    organizationId: string;
  }): Promise<ProductVariant>;

  updateVariant(params: {
    id: string;
    sku?: string;
    price?: number;
    stockQuantity?: number;
    organizationId: string;
  }): Promise<ProductVariant | null>;

  toggleVariantActive(params: {
    id: string;
    isActive: boolean;
    organizationId: string;
  }): Promise<boolean>;

  softDeleteVariant(params: {
    id: string;
    organizationId: string;
  }): Promise<boolean>;

  deactivateVariantsUsingAttribute(params: {
    productId: string;
    attributeId: string;
    organizationId: string;
  }): Promise<number>;

  checkSkuExists(params: {
    sku: string;
    organizationId: string;
    excludeVariantId?: string;
  }): Promise<boolean>;

  createVariantOption(params: {
    productVariantId: string;
    attributeOptionId: string;
    productAttributeId: string;
    organizationId: string;
  }): Promise<VariantOption>;

  getVariantOptionsByVariant(params: {
    productVariantId: string;
    organizationId: string;
  }): Promise<VariantOption[]>;

  getProductWithVariants(params: {
    productId: string;
    organizationId: string;
  }): Promise<ProductWithVariants | null>;

  generateVariants(params: {
    productId: string;
    combinations: Array<{
      attributeOptionIds: string[];
      productAttributeIds: string[];
    }>;
    skuGenerator: (optionValues: string[]) => string;
    organizationId: string;
  }): Promise<ProductVariant[]>;
}

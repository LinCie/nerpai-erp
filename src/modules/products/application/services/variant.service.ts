import type { IVariantRepository } from "../repositories/variant.repository.interface";
import type { IProductRepository } from "../repositories/product.repository.interface";
import type { IAttributeRepository } from "../repositories/attribute.repository.interface";
import type { ProductVariant } from "../../domain/entities/product-variant";
import type { ProductAttribute } from "../../domain/entities/product-attribute";
import type { ProductWithVariants, VariantWithOptions } from "../../domain/types";

export class ProductNotFoundError extends Error {
  constructor(message = "Product not found") {
    super(message);
    this.name = "ProductNotFoundError";
  }
}

export class AttributeNotFoundError extends Error {
  constructor(message = "Attribute not found") {
    super(message);
    this.name = "AttributeNotFoundError";
  }
}

export class VariantNotFoundError extends Error {
  constructor(message = "Variant not found") {
    super(message);
    this.name = "VariantNotFoundError";
  }
}

export class ProductAttributeNotFoundError extends Error {
  constructor(message = "Product attribute association not found") {
    super(message);
    this.name = "ProductAttributeNotFoundError";
  }
}

export class AttributeAlreadyAssignedError extends Error {
  constructor(message = "This attribute is already assigned to the product.") {
    super(message);
    this.name = "AttributeAlreadyAssignedError";
  }
}

export class AttributeListMismatchError extends Error {
  constructor(message = "Attribute list does not match assigned attributes.") {
    super(message);
    this.name = "AttributeListMismatchError";
  }
}

export class SKUConflictError extends Error {
  constructor(message = "SKU already exists in your organization.") {
    super(message);
    this.name = "SKUConflictError";
  }
}

function cartesian<T>(arrays: T[][]): T[][] {
  return arrays.reduce<T[][]>(
    (acc, curr) => acc.flatMap((x) => curr.map((y) => [...x, y])),
    [[]]
  );
}

function generateCodeFromName(name: string): string {
  return name
    .toUpperCase()
    .replace(/\s+/g, "-")
    .replace(/[^A-Z0-9-]/g, "")
    .substring(0, 20);
}

export class VariantService {
  constructor(
    private variantRepository: IVariantRepository,
    private productRepository: IProductRepository,
    private attributeRepository: IAttributeRepository
  ) {}

  async getProductWithVariants(params: {
    productId: string;
    organizationId: string;
  }): Promise<ProductWithVariants | null> {
    return this.variantRepository.getProductWithVariants(params);
  }

  async getVariantsByProduct(params: {
    productId: string;
    organizationId: string;
    includeDeleted?: boolean;
  }): Promise<VariantWithOptions[]> {
    return this.variantRepository.getVariantsByProduct(params);
  }

  async getVariantById(
    id: string,
    organizationId: string
  ): Promise<ProductVariant | null> {
    return this.variantRepository.getVariantById({ id, organizationId });
  }

  async getVariantWithOptions(
    id: string,
    organizationId: string
  ): Promise<VariantWithOptions | null> {
    return this.variantRepository.getVariantWithOptions({ id, organizationId });
  }

  async assignAttributeToProduct(params: {
    productId: string;
    attributeId: string;
    organizationId: string;
  }): Promise<ProductAttribute> {
    const product = await this.productRepository.getById({
      id: params.productId,
      organizationId: params.organizationId,
    });

    if (!product) {
      throw new ProductNotFoundError();
    }

    const attribute = await this.attributeRepository.getById({
      id: params.attributeId,
      organizationId: params.organizationId,
    });

    if (!attribute) {
      throw new AttributeNotFoundError();
    }

    const existing = await this.variantRepository.getProductAttribute({
      productId: params.productId,
      attributeId: params.attributeId,
      organizationId: params.organizationId,
    });

    if (existing) {
      throw new AttributeAlreadyAssignedError();
    }

    const productAttributes = await this.variantRepository.getProductAttributes({
      productId: params.productId,
      organizationId: params.organizationId,
    });

    const nextDisplayOrder = productAttributes.length + 1;

    return this.variantRepository.assignAttributeToProduct({
      productId: params.productId,
      attributeId: params.attributeId,
      displayOrder: nextDisplayOrder,
      organizationId: params.organizationId,
    });
  }

  async removeAttributeFromProduct(params: {
    productId: string;
    attributeId: string;
    confirmed: boolean;
    organizationId: string;
  }): Promise<{ success: boolean; deactivatedCount: number; needsConfirmation?: boolean; affectedCount?: number }> {
    const productAttribute = await this.variantRepository.getProductAttribute({
      productId: params.productId,
      attributeId: params.attributeId,
      organizationId: params.organizationId,
    });

    if (!productAttribute) {
      throw new ProductAttributeNotFoundError();
    }

    const affectedCount = await this.variantRepository.countVariantsUsingAttribute({
      productId: params.productId,
      attributeId: params.attributeId,
      organizationId: params.organizationId,
    });

    if (affectedCount > 0 && !params.confirmed) {
      return {
        success: false,
        needsConfirmation: true,
        affectedCount,
        deactivatedCount: 0,
      };
    }

    const deactivatedCount = await this.variantRepository.deactivateVariantsUsingAttribute({
      productId: params.productId,
      attributeId: params.attributeId,
      organizationId: params.organizationId,
    });

    await this.variantRepository.removeAttributeFromProduct({
      productId: params.productId,
      attributeId: params.attributeId,
      organizationId: params.organizationId,
    });

    return {
      success: true,
      deactivatedCount,
    };
  }

  async reorderProductAttributes(params: {
    productId: string;
    orderedAttributeIds: string[];
    organizationId: string;
  }): Promise<boolean> {
    const productAttributes = await this.variantRepository.getProductAttributes({
      productId: params.productId,
      organizationId: params.organizationId,
    });

    const existingIds = new Set(productAttributes.map((pa) => pa.attributeId));
    const providedIds = new Set(params.orderedAttributeIds);

    if (existingIds.size !== providedIds.size || 
        !params.orderedAttributeIds.every((id) => existingIds.has(id))) {
      throw new AttributeListMismatchError();
    }

    return this.variantRepository.reorderProductAttributes({
      productId: params.productId,
      orderedAttributeIds: params.orderedAttributeIds,
      organizationId: params.organizationId,
    });
  }

  async generateVariants(params: {
    productId: string;
    selections: Record<string, string[]>;
    organizationId: string;
  }): Promise<{ created: number; variants: ProductVariant[] }> {
    const product = await this.productRepository.getById({
      id: params.productId,
      organizationId: params.organizationId,
    });

    if (!product) {
      throw new ProductNotFoundError();
    }

    const productAttributes = await this.variantRepository.getProductAttributes({
      productId: params.productId,
      organizationId: params.organizationId,
    });

    const sortedProductAttributes = [...productAttributes].sort(
      (a, b) => a.displayOrder - b.displayOrder
    );

    const attributeIds = Object.keys(params.selections);
    if (attributeIds.length === 0) {
      return { created: 0, variants: [] };
    }

    const optionIdsByAttributeId = new Map<string, string[]>();
    const productAttributeIdsByAttributeId = new Map<string, string>();

    for (const attributeId of attributeIds) {
      const optionIds = params.selections[attributeId];
      if (optionIds.length === 0) {
        return { created: 0, variants: [] };
      }
      optionIdsByAttributeId.set(attributeId, optionIds);

      const pa = productAttributes.find((p) => p.attributeId === attributeId);
      if (pa) {
        productAttributeIdsByAttributeId.set(attributeId, pa.id);
      }
    }

    const orderedAttributeIds = sortedProductAttributes
      .filter((pa) => attributeIds.includes(pa.attributeId))
      .map((pa) => pa.attributeId);

    const orderedOptionIds = orderedAttributeIds.map(
      (attrId) => optionIdsByAttributeId.get(attrId) ?? []
    );

    const combinations = cartesian(orderedOptionIds);

    const combinationData = combinations.map((optionIds) => {
      const productAttributeIds = orderedAttributeIds.map((attrId) =>
        productAttributeIdsByAttributeId.get(attrId)!
      );
      return {
        attributeOptionIds: optionIds,
        productAttributeIds,
      };
    });

    const skuGenerator = (optionValues: string[]): string => {
      const productCode = generateCodeFromName(product.name);
      const optionCodes = optionValues.map((v) => generateCodeFromName(v));
      return [productCode, ...optionCodes].join("-");
    };

    const variants = await this.variantRepository.generateVariants({
      productId: params.productId,
      combinations: combinationData,
      skuGenerator,
      organizationId: params.organizationId,
    });

    return {
      created: variants.length,
      variants,
    };
  }

  async updateVariant(params: {
    id: string;
    sku?: string;
    price?: number;
    organizationId: string;
  }): Promise<ProductVariant> {
    if (params.sku !== undefined) {
      const skuExists = await this.variantRepository.checkSkuExists({
        sku: params.sku,
        organizationId: params.organizationId,
        excludeVariantId: params.id,
      });

      if (skuExists) {
        throw new SKUConflictError();
      }
    }

    const variant = await this.variantRepository.updateVariant(params);

    if (!variant) {
      throw new VariantNotFoundError();
    }

    return variant;
  }

  async toggleVariantActive(params: {
    id: string;
    isActive: boolean;
    organizationId: string;
  }): Promise<boolean> {
    const success = await this.variantRepository.toggleVariantActive(params);

    if (!success) {
      throw new VariantNotFoundError();
    }

    return true;
  }

  async softDeleteVariant(params: {
    id: string;
    organizationId: string;
  }): Promise<boolean> {
    const success = await this.variantRepository.softDeleteVariant(params);

    if (!success) {
      throw new VariantNotFoundError();
    }

    return true;
  }

  async checkSkuExists(params: {
    sku: string;
    organizationId: string;
    excludeVariantId?: string;
  }): Promise<boolean> {
    return this.variantRepository.checkSkuExists(params);
  }

  async getNewVariantCombinations(params: {
    productId: string;
    organizationId: string;
  }): Promise<{
    allCombinations: Array<{
      attributeOptionIds: string[];
      productAttributeIds: string[];
      optionValues: string[];
    }>;
    existingCombinations: Set<string>;
    newCombinations: Array<{
      attributeOptionIds: string[];
      productAttributeIds: string[];
      optionValues: string[];
    }>;
  }> {
    const product = await this.productRepository.getById({
      id: params.productId,
      organizationId: params.organizationId,
    });

    if (!product) {
      throw new ProductNotFoundError();
    }

    const productAttributes = await this.variantRepository.getProductAttributes({
      productId: params.productId,
      organizationId: params.organizationId,
    });

    if (productAttributes.length === 0) {
      return {
        allCombinations: [],
        existingCombinations: new Set(),
        newCombinations: [],
      };
    }

    const sortedProductAttributes = [...productAttributes].sort(
      (a, b) => a.displayOrder - b.displayOrder
    );

    const attributeIds = sortedProductAttributes.map((pa) => pa.attributeId);

    const attributeOptions = await this.attributeRepository.getOptionsByAttributeIds({
      attributeIds,
      organizationId: params.organizationId,
    });

    const optionsByAttributeId = new Map<string, typeof attributeOptions>();
    for (const option of attributeOptions) {
      const existing = optionsByAttributeId.get(option.attributeId) ?? [];
      existing.push(option);
      optionsByAttributeId.set(option.attributeId, existing);
    }

    const orderedOptionIds = sortedProductAttributes.map(
      (pa) => (optionsByAttributeId.get(pa.attributeId) ?? []).map((o) => o.id)
    );

    const orderedOptionValues = sortedProductAttributes.map(
      (pa) => (optionsByAttributeId.get(pa.attributeId) ?? []).map((o) => o.value)
    );

    const combinations = cartesian(orderedOptionIds);
    const valueCombinations = cartesian(orderedOptionValues);

    const allCombinations = combinations.map((optionIds, idx) => ({
      attributeOptionIds: optionIds,
      productAttributeIds: sortedProductAttributes.map((pa) => pa.id),
      optionValues: valueCombinations[idx],
    }));

    const existingVariants = await this.variantRepository.getVariantsByProduct({
      productId: params.productId,
      organizationId: params.organizationId,
    });

    const existingCombinations = new Set<string>();
    for (const vwOpts of existingVariants) {
      const combinationKey = sortedProductAttributes
        .map((pa) => {
          const opt = vwOpts.options.find((o) => o.productAttribute.id === pa.id);
          return opt?.option.id ?? "";
        })
        .sort()
        .join("|");
      existingCombinations.add(combinationKey);
    }

    const newCombinations = allCombinations.filter((combo) => {
      const key = [...combo.attributeOptionIds].sort().join("|");
      return !existingCombinations.has(key);
    });

    return {
      allCombinations,
      existingCombinations,
      newCombinations,
    };
  }

  async getExistingVariantCombinationKeys(params: {
    productId: string;
    organizationId: string;
  }): Promise<Set<string>> {
    const productAttributes = await this.variantRepository.getProductAttributes({
      productId: params.productId,
      organizationId: params.organizationId,
    });

    if (productAttributes.length === 0) {
      return new Set();
    }

    const sortedProductAttributes = [...productAttributes].sort(
      (a, b) => a.displayOrder - b.displayOrder
    );

    const existingVariants = await this.variantRepository.getVariantsByProduct({
      productId: params.productId,
      organizationId: params.organizationId,
    });

    const existingCombinations = new Set<string>();
    for (const vwOpts of existingVariants) {
      const combinationKey = sortedProductAttributes
        .map((pa) => {
          const opt = vwOpts.options.find((o) => o.productAttribute.id === pa.id);
          return opt?.option.id ?? "";
        })
        .sort()
        .join("|");
      existingCombinations.add(combinationKey);
    }

    return existingCombinations;
  }

  async generateVariantsSelective(params: {
    productId: string;
    selections: Record<string, string[]>;
    organizationId: string;
    onlyNew: boolean;
  }): Promise<{ created: number; variants: ProductVariant[]; skipped: number }> {
    const product = await this.productRepository.getById({
      id: params.productId,
      organizationId: params.organizationId,
    });

    if (!product) {
      throw new ProductNotFoundError();
    }

    const productAttributes = await this.variantRepository.getProductAttributes({
      productId: params.productId,
      organizationId: params.organizationId,
    });

    const sortedProductAttributes = [...productAttributes].sort(
      (a, b) => a.displayOrder - b.displayOrder
    );

    const attributeIds = Object.keys(params.selections);
    if (attributeIds.length === 0) {
      return { created: 0, variants: [], skipped: 0 };
    }

    const optionIdsByAttributeId = new Map<string, string[]>();
    const productAttributeIdsByAttributeId = new Map<string, string>();

    for (const attributeId of attributeIds) {
      const optionIds = params.selections[attributeId];
      if (optionIds.length === 0) {
        return { created: 0, variants: [], skipped: 0 };
      }
      optionIdsByAttributeId.set(attributeId, optionIds);

      const pa = productAttributes.find((p) => p.attributeId === attributeId);
      if (pa) {
        productAttributeIdsByAttributeId.set(attributeId, pa.id);
      }
    }

    const orderedAttributeIds = sortedProductAttributes
      .filter((pa) => attributeIds.includes(pa.attributeId))
      .map((pa) => pa.attributeId);

    const orderedOptionIds = orderedAttributeIds.map(
      (attrId) => optionIdsByAttributeId.get(attrId) ?? []
    );

    const combinations = cartesian(orderedOptionIds);

    const combinationData = combinations.map((optionIds) => {
      const productAttributeIds = orderedAttributeIds.map((attrId) =>
        productAttributeIdsByAttributeId.get(attrId)!
      );
      return {
        attributeOptionIds: optionIds,
        productAttributeIds,
      };
    });

    let combinationsToGenerate = combinationData;
    let skipped = 0;

    if (params.onlyNew) {
      const existingCombinations = await this.getExistingVariantCombinationKeys({
        productId: params.productId,
        organizationId: params.organizationId,
      });

      const filtered = combinationData.filter((combo) => {
        const key = [...combo.attributeOptionIds].sort().join("|");
        const exists = existingCombinations.has(key);
        if (exists) skipped++;
        return !exists;
      });
      combinationsToGenerate = filtered;
    }

    if (combinationsToGenerate.length === 0) {
      return { created: 0, variants: [], skipped };
    }

    const skuGenerator = (optionValues: string[]): string => {
      const productCode = generateCodeFromName(product.name);
      const optionCodes = optionValues.map((v) => generateCodeFromName(v));
      return [productCode, ...optionCodes].join("-");
    };

    const variants = await this.variantRepository.generateVariants({
      productId: params.productId,
      combinations: combinationsToGenerate,
      skuGenerator,
      organizationId: params.organizationId,
    });

    return {
      created: variants.length,
      variants,
      skipped,
    };
  }
}

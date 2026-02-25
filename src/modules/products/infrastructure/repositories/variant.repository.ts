import { sql } from "kysely";
import { db } from "@/shared/infrastructure/persistence";
import type { ProductAttribute } from "../../domain/entities/product-attribute";
import type { ProductVariant } from "../../domain/entities/product-variant";
import type { VariantOption } from "../../domain/entities/variant-option";
import type { AttributeOption } from "../../domain/entities/attribute-option";
import type { ProductWithVariants, VariantWithOptions } from "../../domain/types";
import type { IVariantRepository } from "../../application/repositories/variant.repository.interface";

export class VariantRepository implements IVariantRepository {
  async getProductAttributes({
    productId,
    organizationId,
  }: {
    productId: string;
    organizationId: string;
  }): Promise<ProductAttribute[]> {
    return await db
      .selectFrom("productAttribute")
      .selectAll()
      .where("productId", "=", productId)
      .where("organizationId", "=", organizationId)
      .where("deletedAt", "is", null)
      .orderBy("displayOrder", "asc")
      .execute();
  }

  async getProductAttribute({
    productId,
    attributeId,
    organizationId,
  }: {
    productId: string;
    attributeId: string;
    organizationId: string;
  }): Promise<ProductAttribute | null> {
    const result = await db
      .selectFrom("productAttribute")
      .selectAll()
      .where("productId", "=", productId)
      .where("attributeId", "=", attributeId)
      .where("organizationId", "=", organizationId)
      .where("deletedAt", "is", null)
      .executeTakeFirst();

    return result ?? null;
  }

  async assignAttributeToProduct({
    productId,
    attributeId,
    displayOrder,
    organizationId,
  }: {
    productId: string;
    attributeId: string;
    displayOrder: number;
    organizationId: string;
  }): Promise<ProductAttribute> {
    return await db
      .insertInto("productAttribute")
      .values({
        productId,
        attributeId,
        displayOrder,
        organizationId,
      })
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  async removeAttributeFromProduct({
    productId,
    attributeId,
    organizationId,
  }: {
    productId: string;
    attributeId: string;
    organizationId: string;
  }): Promise<boolean> {
    const result = await db
      .updateTable("productAttribute")
      .set({
        deletedAt: sql`CURRENT_TIMESTAMP`,
      })
      .where("productId", "=", productId)
      .where("attributeId", "=", attributeId)
      .where("organizationId", "=", organizationId)
      .where("deletedAt", "is", null)
      .returning("id")
      .executeTakeFirst();

    return Boolean(result);
  }

  async reorderProductAttributes({
    productId,
    orderedAttributeIds,
    organizationId,
  }: {
    productId: string;
    orderedAttributeIds: string[];
    organizationId: string;
  }): Promise<boolean> {
    await db.transaction().execute(async (trx) => {
      for (let i = 0; i < orderedAttributeIds.length; i++) {
        await trx
          .updateTable("productAttribute")
          .set({
            displayOrder: i + 1,
            updatedAt: sql`CURRENT_TIMESTAMP`,
          })
          .where("productId", "=", productId)
          .where("attributeId", "=", orderedAttributeIds[i])
          .where("organizationId", "=", organizationId)
          .where("deletedAt", "is", null)
          .execute();
      }
    });

    return true;
  }

  async countVariantsUsingAttribute({
    productId,
    attributeId,
    organizationId,
  }: {
    productId: string;
    attributeId: string;
    organizationId: string;
  }): Promise<number> {
    const productAttribute = await this.getProductAttribute({
      productId,
      attributeId,
      organizationId,
    });

    if (!productAttribute) {
      return 0;
    }

    const result = await db
      .selectFrom("variantOption")
      .innerJoin("productVariant", "productVariant.id", "variantOption.productVariantId")
      .where("variantOption.productAttributeId", "=", productAttribute.id)
      .where("variantOption.organizationId", "=", organizationId)
      .where("productVariant.deletedAt", "is", null)
      .where("productVariant.isActive", "=", true)
      .select((eb) => eb.fn.count<number>("variantOption.id").as("count"))
      .executeTakeFirst();

    return Number(result?.count ?? 0);
  }

  async getVariantsByProduct({
    productId,
    organizationId,
    includeDeleted = false,
  }: {
    productId: string;
    organizationId: string;
    includeDeleted?: boolean;
  }): Promise<VariantWithOptions[]> {
    let variantsQuery = db
      .selectFrom("productVariant")
      .selectAll()
      .where("productId", "=", productId)
      .where("organizationId", "=", organizationId);

    if (!includeDeleted) {
      variantsQuery = variantsQuery.where("deletedAt", "is", null);
    }

    const variants = await variantsQuery.orderBy("createdAt", "asc").execute();

    if (variants.length === 0) {
      return [];
    }

    const variantIds = variants.map((v) => v.id);

    const variantOptions = await db
      .selectFrom("variantOption")
      .selectAll()
      .where("productVariantId", "in", variantIds)
      .where("organizationId", "=", organizationId)
      .where("deletedAt", "is", null)
      .execute();

    const optionIds = [...new Set(variantOptions.map((vo) => vo.attributeOptionId))];
    const productAttributeIds = [...new Set(variantOptions.map((vo) => vo.productAttributeId))];

    const [attributeOptions, productAttributesResult] = await Promise.all([
      db
        .selectFrom("attributeOption")
        .selectAll()
        .where("id", "in", optionIds)
        .where("organizationId", "=", organizationId)
        .where("deletedAt", "is", null)
        .execute(),
      db
        .selectFrom("productAttribute")
        .selectAll()
        .where("id", "in", productAttributeIds)
        .where("organizationId", "=", organizationId)
        .where("deletedAt", "is", null)
        .execute(),
    ]);

    const productAttributes = productAttributesResult;
    const attributeIds = productAttributes.map((pa) => pa.attributeId);

    const attributes = await db
      .selectFrom("attribute")
      .selectAll()
      .where("id", "in", attributeIds)
      .where("organizationId", "=", organizationId)
      .where("deletedAt", "is", null)
      .execute();

    const optionsMap = new Map(attributeOptions.map((o) => [o.id, o]));
    const productAttributesMap = new Map(productAttributes.map((pa) => [pa.id, pa]));
    const attributesMap = new Map(attributes.map((a) => [a.id, a]));

    const optionsByVariantId = new Map<string, typeof variantOptions>();
    for (const vo of variantOptions) {
      const existing = optionsByVariantId.get(vo.productVariantId) ?? [];
      existing.push(vo);
      optionsByVariantId.set(vo.productVariantId, existing);
    }

    return variants.map((variant) => {
      const vos = optionsByVariantId.get(variant.id) ?? [];
      const options = vos.map((vo) => {
        const option = optionsMap.get(vo.attributeOptionId);
        const productAttribute = productAttributesMap.get(vo.productAttributeId);
        const attribute = productAttribute ? attributesMap.get(productAttribute.attributeId) : undefined;

        return {
          option: option!,
          productAttribute: productAttribute!,
          attribute,
        };
      });

      options.sort((a, b) => {
        const orderA = a.productAttribute?.displayOrder ?? 0;
        const orderB = b.productAttribute?.displayOrder ?? 0;
        return orderA - orderB;
      });

      return {
        variant,
        options: options
          .filter((o) => o.option && o.productAttribute)
          .map((o) => ({
            option: o.option,
            productAttribute: o.productAttribute,
          })),
      };
    });
  }

  async getVariantById({
    id,
    organizationId,
  }: {
    id: string;
    organizationId: string;
  }): Promise<ProductVariant | null> {
    const variant = await db
      .selectFrom("productVariant")
      .selectAll()
      .where("id", "=", id)
      .where("organizationId", "=", organizationId)
      .where("deletedAt", "is", null)
      .executeTakeFirst();

    return variant ?? null;
  }

  async getVariantWithOptions({
    id,
    organizationId,
  }: {
    id: string;
    organizationId: string;
  }): Promise<VariantWithOptions | null> {
    const variant = await this.getVariantById({ id, organizationId });
    if (!variant) {
      return null;
    }

    const variantOptions = await this.getVariantOptionsByVariant({
      productVariantId: id,
      organizationId,
    });

    const optionIds = variantOptions.map((vo) => vo.attributeOptionId);
    const productAttributeIds = variantOptions.map((vo) => vo.productAttributeId);

    const [attributeOptions, productAttributes] = await Promise.all([
      db
        .selectFrom("attributeOption")
        .selectAll()
        .where("id", "in", optionIds)
        .where("organizationId", "=", organizationId)
        .where("deletedAt", "is", null)
        .execute(),
      db
        .selectFrom("productAttribute")
        .selectAll()
        .where("id", "in", productAttributeIds)
        .where("organizationId", "=", organizationId)
        .where("deletedAt", "is", null)
        .execute(),
    ]);

    const optionsMap = new Map(attributeOptions.map((o) => [o.id, o]));
    const productAttributesMap = new Map(productAttributes.map((pa) => [pa.id, pa]));

    const options = variantOptions
      .map((vo) => {
        const option = optionsMap.get(vo.attributeOptionId);
        const productAttribute = productAttributesMap.get(vo.productAttributeId);
        if (!option || !productAttribute) return null;
        return { option, productAttribute };
      })
      .filter((o): o is { option: AttributeOption; productAttribute: ProductAttribute } => o !== null)
      .sort((a, b) => a.productAttribute.displayOrder - b.productAttribute.displayOrder);

    return { variant, options };
  }

  async createVariant({
    productId,
    sku,
    price,
    stockQuantity,
    organizationId,
  }: {
    productId: string;
    sku: string;
    price: number;
    stockQuantity: number;
    organizationId: string;
  }): Promise<ProductVariant> {
    return await db
      .insertInto("productVariant")
      .values({
        productId,
        sku,
        price: price.toString(),
        stockQuantity,
        organizationId,
      })
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  async updateVariant({
    id,
    sku,
    price,
    stockQuantity,
    organizationId,
  }: {
    id: string;
    sku?: string;
    price?: number;
    stockQuantity?: number;
    organizationId: string;
  }): Promise<ProductVariant | null> {
    const updateData: Record<string, unknown> = {
      updatedAt: sql`CURRENT_TIMESTAMP`,
    };

    if (sku !== undefined) {
      updateData.sku = sku;
    }
    if (price !== undefined) {
      updateData.price = price.toString();
    }
    if (stockQuantity !== undefined) {
      updateData.stockQuantity = stockQuantity;
    }

    const variant = await db
      .updateTable("productVariant")
      .set(updateData)
      .where("id", "=", id)
      .where("organizationId", "=", organizationId)
      .where("deletedAt", "is", null)
      .returningAll()
      .executeTakeFirst();

    return variant ?? null;
  }

  async toggleVariantActive({
    id,
    isActive,
    organizationId,
  }: {
    id: string;
    isActive: boolean;
    organizationId: string;
  }): Promise<boolean> {
    const result = await db
      .updateTable("productVariant")
      .set({
        isActive,
        updatedAt: sql`CURRENT_TIMESTAMP`,
      })
      .where("id", "=", id)
      .where("organizationId", "=", organizationId)
      .where("deletedAt", "is", null)
      .returning("id")
      .executeTakeFirst();

    return Boolean(result);
  }

  async softDeleteVariant({
    id,
    organizationId,
  }: {
    id: string;
    organizationId: string;
  }): Promise<boolean> {
    const result = await db
      .updateTable("productVariant")
      .set({
        deletedAt: sql`CURRENT_TIMESTAMP`,
      })
      .where("id", "=", id)
      .where("organizationId", "=", organizationId)
      .where("deletedAt", "is", null)
      .returning("id")
      .executeTakeFirst();

    return Boolean(result);
  }

  async deactivateVariantsUsingAttribute({
    productId,
    attributeId,
    organizationId,
  }: {
    productId: string;
    attributeId: string;
    organizationId: string;
  }): Promise<number> {
    const productAttribute = await this.getProductAttribute({
      productId,
      attributeId,
      organizationId,
    });

    if (!productAttribute) {
      return 0;
    }

    const result = await db
      .updateTable("productVariant")
      .set({
        isActive: false,
        updatedAt: sql`CURRENT_TIMESTAMP`,
      })
      .where("productVariant.id", "in", (eb) =>
        eb
          .selectFrom("variantOption")
          .select("variantOption.productVariantId")
          .where("variantOption.productAttributeId", "=", productAttribute.id)
          .where("variantOption.organizationId", "=", organizationId)
          .where("variantOption.deletedAt", "is", null)
      )
      .where("productVariant.organizationId", "=", organizationId)
      .where("productVariant.deletedAt", "is", null)
      .returning("id")
      .execute();

    return result.length;
  }

  async checkSkuExists({
    sku,
    organizationId,
    excludeVariantId,
  }: {
    sku: string;
    organizationId: string;
    excludeVariantId?: string;
  }): Promise<boolean> {
    let query = db
      .selectFrom("productVariant")
      .select("id")
      .where("sku", "=", sku)
      .where("organizationId", "=", organizationId)
      .where("deletedAt", "is", null);

    if (excludeVariantId) {
      query = query.where("id", "!=", excludeVariantId);
    }

    const result = await query.executeTakeFirst();
    return Boolean(result);
  }

  async createVariantOption({
    productVariantId,
    attributeOptionId,
    productAttributeId,
    organizationId,
  }: {
    productVariantId: string;
    attributeOptionId: string;
    productAttributeId: string;
    organizationId: string;
  }): Promise<VariantOption> {
    return await db
      .insertInto("variantOption")
      .values({
        productVariantId,
        attributeOptionId,
        productAttributeId,
        organizationId,
      })
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  async getVariantOptionsByVariant({
    productVariantId,
    organizationId,
  }: {
    productVariantId: string;
    organizationId: string;
  }): Promise<VariantOption[]> {
    return await db
      .selectFrom("variantOption")
      .selectAll()
      .where("productVariantId", "=", productVariantId)
      .where("organizationId", "=", organizationId)
      .where("deletedAt", "is", null)
      .execute();
  }

  async getProductWithVariants({
    productId,
    organizationId,
  }: {
    productId: string;
    organizationId: string;
  }): Promise<ProductWithVariants | null> {
    const product = await db
      .selectFrom("product")
      .selectAll()
      .where("id", "=", productId)
      .where("organizationId", "=", organizationId)
      .where("deletedAt", "is", null)
      .executeTakeFirst();

    if (!product) {
      return null;
    }

    const productAttributes = await this.getProductAttributes({
      productId,
      organizationId,
    });

    if (productAttributes.length === 0) {
      return {
        productId: product.id,
        productName: product.name,
        attributes: [],
        variants: [],
      };
    }

    const attributeIds = productAttributes.map((pa) => pa.attributeId);

    const [attributes, attributeOptions] = await Promise.all([
      db
        .selectFrom("attribute")
        .selectAll()
        .where("id", "in", attributeIds)
        .where("organizationId", "=", organizationId)
        .where("deletedAt", "is", null)
        .execute(),
      db
        .selectFrom("attributeOption")
        .selectAll()
        .where("attributeId", "in", attributeIds)
        .where("organizationId", "=", organizationId)
        .where("deletedAt", "is", null)
        .execute(),
    ]);

    const attributesMap = new Map(attributes.map((a) => [a.id, a]));
    const optionsByAttributeId = new Map<string, typeof attributeOptions>();
    for (const option of attributeOptions) {
      const existing = optionsByAttributeId.get(option.attributeId) ?? [];
      existing.push(option);
      optionsByAttributeId.set(option.attributeId, existing);
    }

    const attributesWithDetails = productAttributes
      .map((pa) => {
        const attribute = attributesMap.get(pa.attributeId);
        if (!attribute) return null;
        return {
          productAttribute: pa,
          attribute,
          options: optionsByAttributeId.get(pa.attributeId) ?? [],
        };
      })
      .filter((a): a is NonNullable<typeof a> => a !== null)
      .sort((a, b) => a.productAttribute.displayOrder - b.productAttribute.displayOrder);

    const variants = await this.getVariantsByProduct({
      productId,
      organizationId,
    });

    return {
      productId: product.id,
      productName: product.name,
      attributes: attributesWithDetails,
      variants,
    };
  }

  async generateVariants({
    productId,
    combinations,
    skuGenerator,
    organizationId,
  }: {
    productId: string;
    combinations: Array<{
      attributeOptionIds: string[];
      productAttributeIds: string[];
    }>;
    skuGenerator: (optionValues: string[]) => string;
    organizationId: string;
  }): Promise<ProductVariant[]> {
    const createdVariants: ProductVariant[] = [];

    await db.transaction().execute(async (trx) => {
      const existingSkus = await trx
        .selectFrom("productVariant")
        .select("sku")
        .where("organizationId", "=", organizationId)
        .where("deletedAt", "is", null)
        .execute();

      const usedSkus = new Set(existingSkus.map((v) => v.sku));

      for (const combination of combinations) {
        const optionValues = await trx
          .selectFrom("attributeOption")
          .select("value")
          .where("id", "in", combination.attributeOptionIds)
          .where("organizationId", "=", organizationId)
          .where("deletedAt", "is", null)
          .execute();

        const baseSku = skuGenerator(optionValues.map((ov) => ov.value));
        let finalSku = baseSku;
        let suffix = 2;

        while (usedSkus.has(finalSku)) {
          finalSku = `${baseSku}-${suffix}`;
          suffix++;
        }

        usedSkus.add(finalSku);

        const variant = await trx
          .insertInto("productVariant")
          .values({
            productId,
            sku: finalSku,
            price: "0",
            stockQuantity: 0,
            organizationId,
          })
          .returningAll()
          .executeTakeFirstOrThrow();

        for (let i = 0; i < combination.attributeOptionIds.length; i++) {
          await trx
            .insertInto("variantOption")
            .values({
              productVariantId: variant.id,
              attributeOptionId: combination.attributeOptionIds[i],
              productAttributeId: combination.productAttributeIds[i],
              organizationId,
            })
            .execute();
        }

        createdVariants.push(variant);
      }
    });

    return createdVariants;
  }
}

export const variantRepository = new VariantRepository();

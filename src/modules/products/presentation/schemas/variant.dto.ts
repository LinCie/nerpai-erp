import { t } from "elysia";

export const variantDto = t.Object({
  sku: t.String({
    minLength: 1,
    maxLength: 255,
    error: "SKU must be between 1 and 255 characters",
  }),
  price: t.Number({
    minimum: 0,
    error: "Price must be a non-negative value",
  }),
});

export const updateVariantBodyDto = t.Object({
  sku: t.Optional(
    t.String({
      minLength: 1,
      maxLength: 255,
      error: "SKU must be between 1 and 255 characters",
    }),
  ),
  price: t.Optional(
    t.Number({
      minimum: 0,
      error: "Price must be a non-negative value",
    }),
  ),
});

export const assignAttributeBodyDto = t.Object({
  attributeId: t.String({ format: "uuid" }),
});

export const removeAttributeQueryDto = t.Object({
  confirmed: t.Optional(t.Union([t.Boolean(), t.String()])), // Allow string for query coercion
});

export const reorderAttributesBodyDto = t.Object({
  orderedAttributeIds: t.Array(t.String({ format: "uuid" }), { minItems: 1 }),
});

export const generateVariantsBodyDto = t.Object({
  selections: t.Record(t.String(), t.Array(t.String({ format: "uuid" }))),
  onlyNew: t.Optional(t.Boolean()),
});

export const toggleVariantActiveBodyDto = t.Object({
  isActive: t.Boolean(),
});

export const checkSkuBodyDto = t.Object({
  sku: t.String({ minLength: 1 }),
  excludeVariantId: t.Optional(t.String({ format: "uuid" })),
});

export const variantResponseDto = t.Object({
  id: t.String({ format: "uuid" }),
  productId: t.String({ format: "uuid" }),
  sku: t.String(),
  price: t.Number(),
  isActive: t.Boolean(),
});

export const generateVariantsResponseDto = t.Object({
  created: t.Number(),
  variants: t.Array(
    t.Object({
      id: t.String({ format: "uuid" }),
      sku: t.String(),
    }),
  ),
  skipped: t.Optional(t.Number()),
});

export const removeAttributeResponseDto = t.Object({
  deactivatedCount: t.Number(),
});

export const removeAttributeConfirmationResponseDto = t.Object({
  needsConfirmation: t.Literal(true),
  affectedCount: t.Number(),
  message: t.String(),
});

export const skuAvailabilityResponseDto = t.Object({
  available: t.Boolean(),
});

export const assignAttributeResponseDto = t.Object({
  id: t.String({ format: "uuid" }),
  displayOrder: t.Number(),
});
export type UpdateVariantBodyDto = typeof updateVariantBodyDto.static;
export type AssignAttributeBodyDto = typeof assignAttributeBodyDto.static;
export type RemoveAttributeQueryDto = typeof removeAttributeQueryDto.static;
export type ReorderAttributesBodyDto = typeof reorderAttributesBodyDto.static;
export type GenerateVariantsBodyDto = typeof generateVariantsBodyDto.static;
export type ToggleVariantActiveBodyDto = typeof toggleVariantActiveBodyDto.static;
export type CheckSkuBodyDto = typeof checkSkuBodyDto.static;
export type VariantDto = typeof variantDto.static;

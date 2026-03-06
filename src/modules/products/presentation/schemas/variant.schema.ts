import { z } from "zod";

export const variantSchema = z.object({
  sku: z
    .string()
    .trim()
    .min(1, { error: "SKU is required" })
    .max(255, { error: "SKU must be 255 characters or less" }),
  price: z
    .number()
    .min(0, { error: "Price must be a non-negative value" }),
});

export const updateVariantSchema = z.object({
  sku: z
    .string()
    .trim()
    .min(1, { error: "SKU is required" })
    .max(255, { error: "SKU must be 255 characters or less" })
    .optional(),
  price: z
    .number()
    .min(0, { error: "Price must be a non-negative value" })
    .optional(),
});

export const assignAttributeBody = z.object({
  attributeId: z.string().uuid({ error: "Attribute ID must be a valid UUID" }),
});

export const assignAttributeSchema = z.object({
  productId: z.string().uuid({ error: "Product ID must be a valid UUID" }),
  attributeId: z.string().uuid({ error: "Attribute ID must be a valid UUID" }),
});

export const removeAttributeQuery = z.object({
  confirmed: z.coerce.boolean().optional().default(false),
});

export const removeAttributeSchema = z.object({
  productId: z.string().uuid({ error: "Product ID must be a valid UUID" }),
  attributeId: z.string().uuid({ error: "Attribute ID must be a valid UUID" }),
  confirmed: z.boolean(),
});

export const reorderAttributesBody = z.object({
  orderedAttributeIds: z.array(z.string().uuid()).min(1, { error: "At least one attribute must be provided" }),
});

export const reorderAttributesSchema = z.object({
  productId: z.string().uuid({ error: "Product ID must be a valid UUID" }),
  orderedAttributeIds: z.array(z.string().uuid()).min(1, { error: "At least one attribute must be provided" }),
});

export const generateVariantsBody = z.object({
  selections: z.record(z.string(), z.array(z.string().uuid())).refine(
    (selections) => {
      return Object.values(selections).every((options) => options.length > 0);
    },
    { error: "Each attribute must have at least one option selected" }
  ),
  onlyNew: z.boolean().optional().default(false),
});

export const generateVariantsSchema = z.object({
  productId: z.string().uuid({ error: "Product ID must be a valid UUID" }),
  selections: z.record(z.string(), z.array(z.string().uuid())).refine(
    (selections) => {
      return Object.values(selections).every((options) => options.length > 0);
    },
    { error: "Each attribute must have at least one option selected" }
  ),
});

export const updateVariantBody = updateVariantSchema;

export const toggleVariantActiveBody = z.object({
  isActive: z.boolean(),
});

export const toggleVariantActiveSchema = z.object({
  id: z.string().uuid({ error: "Variant ID must be a valid UUID" }),
  isActive: z.boolean(),
});

export const softDeleteVariantSchema = z.object({
  id: z.string().uuid({ error: "Variant ID must be a valid UUID" }),
});

export const checkSkuBody = z.object({
  sku: z.string().trim().min(1, { error: "SKU is required" }),
  excludeVariantId: z.string().uuid({ error: "Variant ID must be a valid UUID" }).optional(),
});

export const variantResponse = z.object({
  id: z.string().uuid(),
  productId: z.string().uuid(),
  sku: z.string(),
  price: z.number(),
  isActive: z.boolean(),
});

export const generateVariantsResponse = z.object({
  created: z.number(),
  variants: z.array(
    z.object({
      id: z.string().uuid(),
      sku: z.string(),
    })
  ),
  skipped: z.number().optional(),
});

export const removeAttributeResponse = z.object({
  deactivatedCount: z.number(),
});

export const removeAttributeConfirmationResponse = z.object({
  needsConfirmation: z.literal(true),
  affectedCount: z.number(),
  message: z.string(),
});

export const skuAvailabilityResponse = z.object({
  available: z.boolean(),
});

export const assignAttributeResponse = z.object({
  id: z.string().uuid(),
  displayOrder: z.number(),
});

export type VariantFormData = z.infer<typeof variantSchema>;
export type UpdateVariantFormData = z.infer<typeof updateVariantSchema>;
export type AssignAttributeFormData = z.infer<typeof assignAttributeSchema>;
export type RemoveAttributeFormData = z.infer<typeof removeAttributeSchema>;
export type ReorderAttributesFormData = z.infer<typeof reorderAttributesSchema>;
export type GenerateVariantsFormData = z.infer<typeof generateVariantsSchema>;
export type ToggleVariantActiveFormData = z.infer<typeof toggleVariantActiveSchema>;
export type SoftDeleteVariantFormData = z.infer<typeof softDeleteVariantSchema>;

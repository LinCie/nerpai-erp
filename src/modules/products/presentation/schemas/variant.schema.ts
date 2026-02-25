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
  stockQuantity: z
    .number()
    .int({ error: "Stock quantity must be an integer" })
    .min(0, { error: "Stock quantity must be a non-negative integer" }),
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
  stockQuantity: z
    .number()
    .int({ error: "Stock quantity must be an integer" })
    .min(0, { error: "Stock quantity must be a non-negative integer" })
    .optional(),
});

export const assignAttributeSchema = z.object({
  productId: z.string().uuid({ error: "Product ID must be a valid UUID" }),
  attributeId: z.string().uuid({ error: "Attribute ID must be a valid UUID" }),
});

export const removeAttributeSchema = z.object({
  productId: z.string().uuid({ error: "Product ID must be a valid UUID" }),
  attributeId: z.string().uuid({ error: "Attribute ID must be a valid UUID" }),
  confirmed: z.boolean(),
});

export const reorderAttributesSchema = z.object({
  productId: z.string().uuid({ error: "Product ID must be a valid UUID" }),
  orderedAttributeIds: z.array(z.string().uuid()).min(1, { error: "At least one attribute must be provided" }),
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

export const toggleVariantActiveSchema = z.object({
  id: z.string().uuid({ error: "Variant ID must be a valid UUID" }),
  isActive: z.boolean(),
});

export const softDeleteVariantSchema = z.object({
  id: z.string().uuid({ error: "Variant ID must be a valid UUID" }),
});

export type VariantFormData = z.infer<typeof variantSchema>;
export type UpdateVariantFormData = z.infer<typeof updateVariantSchema>;
export type AssignAttributeFormData = z.infer<typeof assignAttributeSchema>;
export type RemoveAttributeFormData = z.infer<typeof removeAttributeSchema>;
export type ReorderAttributesFormData = z.infer<typeof reorderAttributesSchema>;
export type GenerateVariantsFormData = z.infer<typeof generateVariantsSchema>;
export type ToggleVariantActiveFormData = z.infer<typeof toggleVariantActiveSchema>;
export type SoftDeleteVariantFormData = z.infer<typeof softDeleteVariantSchema>;

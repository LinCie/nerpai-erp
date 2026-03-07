import { z } from "zod";

export const productSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { error: "Product name is required" })
    .max(255, { error: "Product name must be 255 characters or less" }),
});

export const createProductBody = productSchema;
export const updateProductBody = productSchema;

export const productResponse = z.object({
  id: z.uuid(),
  name: z.string(),
  organizationId: z.uuid(),
  createdAt: z.date(),
  updatedAt: z.date(),
  deletedAt: z.date().nullable(),
});

export const productListResponse = z.array(productResponse);

export type ProductFormData = z.infer<typeof productSchema>;

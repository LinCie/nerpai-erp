import { z } from "zod";

export const productSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { error: "Product name is required" })
    .max(255, { error: "Product name must be 255 characters or less" }),
});

export type ProductFormData = z.infer<typeof productSchema>;

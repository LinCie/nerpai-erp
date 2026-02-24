import { z } from "zod";

export const productSchema = z.object({
  name: z
    .string()
    .min(1, { error: "Product name is required" })
    .max(255, { error: "Product name must be 255 characters or less" })
    .transform((val) => val.trim()),
});

export type ProductFormData = z.infer<typeof productSchema>;

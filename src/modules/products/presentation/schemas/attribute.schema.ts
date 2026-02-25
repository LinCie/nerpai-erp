import { z } from "zod";

export const attributeSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { error: "Attribute name is required" })
    .max(255, { error: "Attribute name must be 255 characters or less" }),
});

export const attributeOptionSchema = z.object({
  value: z
    .string()
    .trim()
    .min(1, { error: "Option value is required" })
    .max(255, { error: "Option value must be 255 characters or less" }),
});

export type AttributeFormData = z.infer<typeof attributeSchema>;
export type AttributeOptionFormData = z.infer<typeof attributeOptionSchema>;

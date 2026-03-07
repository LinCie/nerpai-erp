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

export const createAttributeBody = attributeSchema;
export const updateAttributeBody = attributeSchema;
export const createAttributeOptionBody = attributeOptionSchema;
export const updateAttributeOptionBody = attributeOptionSchema;

export const attributeOptionResponse = z.object({
  id: z.string().uuid(),
  value: z.string(),
  attributeId: z.string().uuid(),
});

export const attributeResponse = z.object({
  id: z.string().uuid(),
  name: z.string(),
  organizationId: z.string().uuid(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const attributeWithOptionsResponse = attributeResponse.extend({
  options: z.array(attributeOptionResponse),
});

export type AttributeFormData = z.infer<typeof attributeSchema>;
export type AttributeOptionFormData = z.infer<typeof attributeOptionSchema>;

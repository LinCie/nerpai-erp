// Shared form options for TanStack Form + Next.js Server Actions
// Used by both client and server components

import { formOptions } from "@tanstack/react-form-nextjs";
import { productSchema } from "../schemas/product.schema";
import { attributeSchema, attributeOptionSchema } from "../schemas/attribute.schema";
import { variantSchema } from "../schemas/variant.schema";

export const createProductFormOptions = formOptions({
  defaultValues: {
    name: "",
  },
  validators: {
    onSubmit: productSchema,
  },
});

export const updateProductFormOptions = formOptions({
  defaultValues: {
    name: "",
  },
  validators: {
    onSubmit: productSchema,
  },
});

export const createAttributeFormOptions = formOptions({
  defaultValues: {
    name: "",
  },
  validators: {
    onSubmit: attributeSchema,
  },
});

export const updateAttributeFormOptions = formOptions({
  defaultValues: {
    name: "",
  },
  validators: {
    onSubmit: attributeSchema,
  },
});

export const createAttributeOptionFormOptions = formOptions({
  defaultValues: {
    value: "",
  },
  validators: {
    onSubmit: attributeOptionSchema,
  },
});

export const variantFormOptions = formOptions({
  defaultValues: {
    sku: "",
    price: 0,
    stockQuantity: 0,
  },
  validators: {
    onSubmit: variantSchema,
  },
});

export type ProductFormValues = {
  name: string;
};

export type AttributeFormValues = {
  name: string;
};

export type AttributeOptionFormValues = {
  value: string;
};

export type VariantFormValues = {
  sku: string;
  price: number;
  stockQuantity: number;
};

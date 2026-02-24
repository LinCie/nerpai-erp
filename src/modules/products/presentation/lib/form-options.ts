// Shared form options for TanStack Form + Next.js Server Actions
// Used by both client and server components

import { formOptions } from "@tanstack/react-form-nextjs";
import { productSchema } from "../schemas/product.schema";

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

export type ProductFormValues = {
  name: string;
};

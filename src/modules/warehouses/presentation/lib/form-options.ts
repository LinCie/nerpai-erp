// Shared form options for TanStack Form + Next.js Server Actions
// Used by both client and server components for warehouse CRUD forms

import { formOptions } from "@tanstack/react-form-nextjs";
import {
  warehouseCreateSchema,
  warehouseUpdateSchema,
} from "../schemas/warehouse.schema";

/**
 * Form options for the "Create Warehouse" form.
 * Includes all fields: name, code, address, contact, notes.
 * country defaults to "Indonesia" (DIR-004).
 */
export const createWarehouseFormOptions = formOptions({
  defaultValues: {
    name: "",
    code: "",
    streetAddress: "",
    city: "",
    province: "",
    postalCode: "",
    country: "Indonesia",
    contactName: "",
    contactPhone: "",
    contactEmail: "",
    notes: "",
  },
  validators: {
    onSubmit: warehouseCreateSchema,
  },
});

/**
 * Form options for the "Update Warehouse" form.
 * Excludes `code` field entirely — immutable after creation (FR-018).
 * country defaults to "Indonesia" (overridden with existing warehouse data).
 */
export const updateWarehouseFormOptions = formOptions({
  defaultValues: {
    name: "",
    streetAddress: "",
    city: "",
    province: "",
    postalCode: "",
    country: "Indonesia",
    contactName: "",
    contactPhone: "",
    contactEmail: "",
    notes: "",
  },
  validators: {
    onSubmit: warehouseUpdateSchema,
  },
});

export type CreateWarehouseFormValues = {
  name: string;
  code: string;
  streetAddress: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  notes: string;
};

export type UpdateWarehouseFormValues = Omit<CreateWarehouseFormValues, "code">;

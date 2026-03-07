import { z } from "zod";

/**
 * Postal code validation helper.
 * DIR-004: Indonesia (default) requires exactly 5 digits.
 * Other countries allow 1-20 alphanumeric, spaces, and hyphens.
 */
const INDONESIA_POSTAL_CODE_REGEX = /^\d{5}$/;
const INTERNATIONAL_POSTAL_CODE_REGEX = /^[a-zA-Z0-9 -]{1,20}$/;

/**
 * Base schema — common fields shared between create and update.
 * Does NOT include the `code` field (immutable after creation).
 *
 * All optional string fields accept empty string "" from FormData,
 * so their type is `string` (not optional) to match TanStack Form default values.
 */
export const warehouseBaseSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, { message: "Warehouse name is required" })
      .max(255, { message: "Name must be 255 characters or less" }),

    streetAddress: z
      .string()
      .trim()
      .max(500, { message: "Street address must be 500 characters or less" }),

    city: z
      .string()
      .trim()
      .max(100, { message: "City must be 100 characters or less" }),

    province: z
      .string()
      .trim()
      .max(100, { message: "Province must be 100 characters or less" }),

    postalCode: z
      .string()
      .trim()
      .max(20, { message: "Postal code must be 20 characters or less" }),

    country: z
      .string()
      .trim()
      .min(1, { message: "Country is required" })
      .max(100, { message: "Country must be 100 characters or less" }),

    contactName: z
      .string()
      .trim()
      .max(255, { message: "Contact name must be 255 characters or less" }),

    contactPhone: z
      .string()
      .trim()
      .max(50, { message: "Contact phone must be 50 characters or less" }),

    contactEmail: z
      .string()
      .trim()
      .max(255, { message: "Email must be 255 characters or less" })
      .refine((val) => val === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), {
        message: "Invalid email format",
      }),

    notes: z
      .string()
      .trim()
      .max(1000, { message: "Notes must be 1000 characters or less" }),
  })
  .superRefine((data, ctx) => {
    // DIR-004: Country-specific postal code validation
    const postalCode = data.postalCode;
    if (!postalCode || postalCode === "") return; // empty is OK (optional)

    const country = (data.country ?? "Indonesia").trim();
    if (country.toLowerCase() === "indonesia") {
      if (!INDONESIA_POSTAL_CODE_REGEX.test(postalCode)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Indonesian postal code must be exactly 5 digits",
          path: ["postalCode"],
        });
      }
    } else {
      if (!INTERNATIONAL_POSTAL_CODE_REGEX.test(postalCode)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "Postal code must be 1-20 alphanumeric characters, spaces, or hyphens",
          path: ["postalCode"],
        });
      }
    }
  });

/**
 * Create schema — extends base with required `code` field.
 * `code` is alphanumeric, hyphens, and underscores only (1-50 chars).
 */
export const warehouseCreateSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, { message: "Warehouse name is required" })
      .max(255, { message: "Name must be 255 characters or less" }),

    code: z
      .string()
      .trim()
      .min(1, { message: "Warehouse code is required" })
      .max(50, { message: "Code must be 50 characters or less" })
      .regex(/^[a-zA-Z0-9_-]+$/, {
        message:
          "Code can only contain letters, numbers, hyphens, and underscores",
      }),

    streetAddress: z
      .string()
      .trim()
      .max(500, { message: "Street address must be 500 characters or less" }),

    city: z
      .string()
      .trim()
      .max(100, { message: "City must be 100 characters or less" }),

    province: z
      .string()
      .trim()
      .max(100, { message: "Province must be 100 characters or less" }),

    postalCode: z
      .string()
      .trim()
      .max(20, { message: "Postal code must be 20 characters or less" }),

    country: z
      .string()
      .trim()
      .min(1, { message: "Country is required" })
      .max(100, { message: "Country must be 100 characters or less" }),

    contactName: z
      .string()
      .trim()
      .max(255, { message: "Contact name must be 255 characters or less" }),

    contactPhone: z
      .string()
      .trim()
      .max(50, { message: "Contact phone must be 50 characters or less" }),

    contactEmail: z
      .string()
      .trim()
      .max(255, { message: "Email must be 255 characters or less" })
      .refine((val) => val === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), {
        message: "Invalid email format",
      }),

    notes: z
      .string()
      .trim()
      .max(1000, { message: "Notes must be 1000 characters or less" }),
  })
  .superRefine((data, ctx) => {
    // DIR-004: Country-specific postal code validation
    const postalCode = data.postalCode;
    if (!postalCode || postalCode === "") return;

    const country = (data.country ?? "Indonesia").trim();
    if (country.toLowerCase() === "indonesia") {
      if (!INDONESIA_POSTAL_CODE_REGEX.test(postalCode)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Indonesian postal code must be exactly 5 digits",
          path: ["postalCode"],
        });
      }
    } else {
      if (!INTERNATIONAL_POSTAL_CODE_REGEX.test(postalCode)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "Postal code must be 1-20 alphanumeric characters, spaces, or hyphens",
          path: ["postalCode"],
        });
      }
    }
  });

/**
 * Update schema — same as base (no code field; code is immutable per FR-018).
 */
export const warehouseUpdateSchema = warehouseBaseSchema;

export type WarehouseBaseFormData = z.infer<typeof warehouseBaseSchema>;
export type WarehouseCreateFormData = z.infer<typeof warehouseCreateSchema>;
export type WarehouseUpdateFormData = z.infer<typeof warehouseUpdateSchema>;

export const warehouseIdParamsSchema = z.object({
  id: z.string().uuid(),
});

export const warehouseCodeCheckQuerySchema = z.object({
  code: z
    .string()
    .trim()
    .min(1, { message: "Warehouse code is required" })
    .max(50, { message: "Code must be 50 characters or less" })
    .regex(/^[a-zA-Z0-9_-]+$/, {
      message: "Code can only contain letters, numbers, hyphens, and underscores",
    }),
});

export const warehouseResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  code: z.string(),
  streetAddress: z.string().nullable(),
  city: z.string().nullable(),
  province: z.string().nullable(),
  postalCode: z.string().nullable(),
  country: z.string(),
  contactName: z.string().nullable(),
  contactPhone: z.string().nullable(),
  contactEmail: z.string().nullable(),
  notes: z.string().nullable(),
  organizationId: z.string().uuid(),
  createdAt: z.date(),
  updatedAt: z.date(),
  deletedAt: z.date().nullable(),
});

export const warehouseCodeAvailabilityResponseSchema = z.object({
  available: z.boolean(),
});

export const mutationSuccessResponseSchema = z.object({
  success: z.literal(true),
});

export const warehouseErrorResponseSchema = z.object({
  error: z.string(),
});

export const warehouseListQuerySchema = z.object({
  search: z.string().optional(),
  province: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export const warehouseListResponseSchema = z.object({
  items: z.array(warehouseResponseSchema),
  totalCount: z.number().int().nonnegative(),
  provinces: z.array(z.string()),
});

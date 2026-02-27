/** Warehouse entity — physical storage location scoped to an organization */
export interface Warehouse {
  id: string; // UUID v7
  name: string; // 1-255 chars, trimmed
  code: string; // 1-50 chars, unique per org (immutable after creation)
  streetAddress: string | null; // Max 500 chars
  city: string | null; // Max 100 chars
  province: string | null; // Max 100 chars
  postalCode: string | null; // Max 20 chars
  country: string; // Max 100 chars, default "Indonesia"
  contactName: string | null; // Max 255 chars
  contactPhone: string | null; // Max 50 chars
  contactEmail: string | null; // Valid email format
  notes: string | null; // Max 1000 chars
  organizationId: string; // UUID FK → organization.id
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null; // null = active, Date = soft-deleted
}

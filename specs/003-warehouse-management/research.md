# Research: Warehouse Management

**Feature Branch**: `003-warehouse-management`
**Date**: 2026-02-26
**Status**: Complete

## Context7 Library References

| Library       | Context7 ID               | Version   |
| ------------- | ------------------------- | --------- |
| TanStack Form | `/websites/tanstack_form` | latest    |
| Kysely        | `/kysely-org/kysely`      | `v0.28.3` |
| Next.js       | `/vercel/next.js`         | `v16.1.6` |

## Research Topics

### 1. TanStack Form: Shared formOptions + Server Actions Integration

**Decision**: Use `formOptions()` from `@tanstack/react-form-nextjs` to share default values and validators between client and server. Use `createServerValidate()` for server-side validation in Server Actions.

**Rationale**:

- Context7 TanStack Form docs confirm the established pattern: define a `formOptions()` object, spread it into both `useForm()` on the client _and_ `createServerValidate()` on the server
- The existing codebase already uses this pattern (see `form-options.ts`, `product.actions.ts`)
- For the warehouse form, two `formOptions` instances are needed: `createWarehouseFormOptions` and `updateWarehouseFormOptions` (update excludes `code` field since it's immutable after creation — FR-018)
- `useActionState` + `useTransform(mergeForm(...))` bridges client and server validation state
- `initialFormState` provides the correct zero-state for `useActionState`

**Key Pattern** (from Context7 `/websites/tanstack_form` SSR guide):

```typescript
// shared: form-options.ts
export const createWarehouseFormOptions = formOptions({
  defaultValues: { name: "", code: "", streetAddress: "", ... },
  validators: { onSubmit: warehouseCreateSchema },
});

// server: warehouse.actions.ts
const validateCreate = createServerValidate({
  ...createWarehouseFormOptions,
  onServerValidate: () => undefined,
});

// client: warehouse-form.tsx
const [state, action] = useActionState(createWarehouse, initialFormState);
const form = useForm({
  ...createWarehouseFormOptions,
  transform: useTransform((base) => mergeForm(base, state ?? {}), [state]),
});
```

**Sources**: Context7 `/websites/tanstack_form` SSR guide, existing `product.actions.ts`, existing `product-form.tsx`

---

### 2. Complex Multi-Field Form Design with TanStack Form

**Decision**: Organize warehouse form into logical `<fieldset>` sections using shadcn's `FieldSet`, `FieldGroup`, `FieldSeparator`, and `FieldLegend` components. Group fields into: Basic Info, Address, Contact, and Notes sections.

**Rationale**:

- shadcn form-tanstack-complex example demonstrates `FieldSet` + `FieldLegend` + `FieldSeparator` pattern for organizing related fields — directly applicable to the warehouse form
- The warehouse entity has 11 user-editable fields (name, code, streetAddress, city, province, postalCode, country, contactName, contactPhone, contactEmail, notes) — grouping into sections improves scanability and accessibility
- Each `<fieldset>` with `<legend>` creates a semantic grouping that screen readers announce, improving navigation for assistive technology users
- `FieldSeparator` provides visual distinction between sections

**Section Breakdown**:

1. **Basic Info**: `name` (required), `code` (required, immutable on edit)
2. **Address**: `streetAddress`, `city`, `province`, `postalCode`, `country` (defaulted to "Indonesia")
3. **Contact**: `contactName`, `contactPhone`, `contactEmail`
4. **Notes**: `notes` (textarea, max 1000 chars)

**Sources**: shadcn `form-tanstack-complex`, `form-tanstack-textarea`, `form-tanstack-demo` examples via MCP

---

### 3. Accessibility Best Practices for Complex Forms

**Decision**: Follow WAI-ARIA form patterns with semantic HTML, proper label associations, error announcements, and keyboard navigation.

**Rationale**:

- Constitution IV mandates semantic HTML and ARIA attributes "only when semantic HTML is insufficient"
- Exa research on accessible React forms confirms key patterns:
  - Every `<input>` MUST have an associated `<label>` via `htmlFor`/`id`
  - Use `aria-required={true}` on required fields (in addition to visible `*` indicator)
  - Use `aria-invalid={true}` when field has validation errors
  - Use `aria-describedby` to link inputs to their descriptions and error messages
  - Error messages MUST use `role="alert"` for live announcement (shadcn `FieldError` already does this)
  - Group related fields with `<fieldset>` + `<legend>` for screen reader context
  - Disable submit button while submitting (`aria-disabled` handled by shadcn Button)
  - Focus management: auto-focus the first field on form mount
  - The `noValidate` attribute on `<form>` disables browser validation so TanStack Form handles it
- The existing `Field` component from shadcn already handles `data-invalid` attribute and visual error styling
- The existing `FieldError` component uses `role="alert"` for screen reader announcements

**Implementation Checklist**:

- [x] All inputs have `id` + matching `htmlFor` on labels
- [x] Required fields show visual `*` indicator AND `aria-required`
- [x] `aria-invalid` set on inputs when errors present
- [x] Errors announced via `role="alert"` (shadcn FieldError)
- [x] Related fields grouped in `<fieldset>` with `<legend>`
- [x] Submit button disabled during submission with loading indicator
- [x] First field auto-focused on mount
- [x] `noValidate` on form element
- [x] Keyboard-navigable (standard HTML — no special handling needed)

**Sources**: Exa article "How to Implement Accessible Forms in React with ARIA" (2026-01-15), WAI-ARIA forms guide, shadcn component source code

---

### 4. shadcn UI Component Inventory for Warehouse Form

**Decision**: Use existing project UI components plus `Textarea` (already installed). No new component installations needed.

**Components Already Available** (confirmed in `src/shared/presentation/components/ui/`):

| Component          | Usage in Warehouse Form                                                                                                             |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| `field.tsx`        | `Field`, `FieldGroup`, `FieldSet`, `FieldLegend`, `FieldSeparator`, `FieldLabel`, `FieldError`, `FieldDescription` — form structure |
| `input.tsx`        | Text inputs (name, code, address fields, contact fields)                                                                            |
| `textarea.tsx`     | Notes field                                                                                                                         |
| `button.tsx`       | Submit, cancel buttons                                                                                                              |
| `card.tsx`         | Card layout (for dialog content or page form)                                                                                       |
| `dialog.tsx`       | Add/Edit warehouse dialogs                                                                                                          |
| `label.tsx`        | Used by `FieldLabel` internally                                                                                                     |
| `separator.tsx`    | Used by `FieldSeparator` internally                                                                                                 |
| `skeleton.tsx`     | Loading states                                                                                                                      |
| `sonner.tsx`       | Toast notifications                                                                                                                 |
| `alert-dialog.tsx` | Confirmation dialogs (soft-delete)                                                                                                  |

**shadcn TanStack Form Examples Studied** (via MCP):

- `form-tanstack-demo` — Multi-field form with `InputGroupTextarea` character counter
- `form-tanstack-input` — Input with `FieldDescription` and `aria-invalid`
- `form-tanstack-textarea` — Textarea with validation
- `form-tanstack-select` — Select with `onValueChange` → `field.handleChange`
- `form-tanstack-complex` — Multi-section form with `FieldSet`, `FieldLegend`, `FieldSeparator`
- `form-tanstack-array` — Dynamic array fields

**Key Pattern**: All shadcn TanStack Form examples use `aria-invalid={isInvalid}` on interactive elements, confirm `Field`'s `data-invalid` attribute for styling, and use `FieldError` with the `errors` prop for displaying validation messages.

**Sources**: shadcn MCP registry search, project file system audit

---

### 5. Warehouse Form-Options Default Values Strategy

**Decision**: Create two separate form-options: `createWarehouseFormOptions` (all fields) and `updateWarehouseFormOptions` (excludes `code`, since it's immutable after creation).

**Rationale**:

- FR-018 mandates that code is immutable after creation — the edit form must show code as read-only
- The existing codebase pattern uses separate `create*FormOptions` and `update*FormOptions` (see `createProductFormOptions` / `updateProductFormOptions`)
- Default values for create: all strings default to `""`, country defaults to `"Indonesia"`
- Default values for update: populated from the existing warehouse entity
- The `code` field is excluded from the update schema entirely — the server action should strip any `code` value from update FormData to enforce immutability server-side
- Both share the same validation schema for common fields (Zod `warehouseBaseSchema`)

**Schema Strategy**:

```typescript
// Base fields shared between create and update
const warehouseBaseSchema = z.object({
  name: z.string().trim().min(1).max(255),
  streetAddress: z.string().trim().max(500).optional().or(z.literal("")),
  city: z.string().trim().max(100).optional().or(z.literal("")),
  // ... other shared fields
});

// Create: extends base with code
const warehouseCreateSchema = warehouseBaseSchema.extend({
  code: z
    .string()
    .trim()
    .min(1)
    .max(50)
    .regex(/^[a-zA-Z0-9_-]+$/),
});

// Update: same as base (no code field)
const warehouseUpdateSchema = warehouseBaseSchema;
```

**Sources**: Existing `form-options.ts`, `product.schema.ts`, `attribute.schema.ts` patterns

---

### 6. Immutable Field Handling (Warehouse Code on Edit)

**Decision**: On the edit form, render the code field as a visually disabled `<Input>` with `readOnly` and `disabled` attributes. Do NOT include it in the TanStack Form state for the update form.

**Rationale**:

- FR-018: "System MUST NOT allow modification of the warehouse code after creation — the code field MUST be read-only in the edit form and rejected by the server if submitted in an update request"
- Using `disabled` + `readOnly` on the input prevents user interaction AND prevents the value from being submitted in FormData
- Additionally, the server action for update MUST ignore any `code` value in FormData as a defense-in-depth measure
- Show the code visually for reference with a `FieldDescription` explaining "Warehouse code cannot be changed after creation"

**Implementation**:

```tsx
// In warehouse-edit-form.tsx — code is displayed but NOT a managed form field
<Field>
  <FieldLabel>Warehouse Code</FieldLabel>
  <Input value={warehouse.code} disabled readOnly />
  <FieldDescription>
    Warehouse code cannot be changed after creation.
  </FieldDescription>
</Field>
```

**Sources**: FR-018 spec requirement, form accessibility best practices

---

### 7. Textarea for Notes Field with Character Counter

**Decision**: Use shadcn `Textarea` component with a character counter overlay (shadcn `InputGroup` pattern) for the notes field (max 1000 chars).

**Rationale**:

- FR-005 allows up to 1000 characters for notes
- The shadcn `form-tanstack-demo` example demonstrates `InputGroupTextarea` with `InputGroupAddon` for a character counter — applies directly
- Character counter provides real-time feedback without requiring validation to fire
- However, since the project uses `Textarea` directly (not `InputGroup`), a simpler approach is to add a `FieldDescription` with the count: `{field.state.value.length}/1000 characters`

**Sources**: shadcn `form-tanstack-demo` example, `textarea.tsx` component

---

### 8. Server Action Contract Patterns for Warehouse CRUD

**Decision**: Follow the same Server Action contract pattern established in `product.actions.ts` and `attribute.actions.ts` — using TanStack Form `createServerValidate` for form mutations and plain `{ success, error }` for non-form operations (soft-delete, restore).

**Rationale**:

- Constitution XI (Contract Fidelity) requires Server Actions to match documented contracts
- The established pattern:
  - **Form mutations** (create, update): Use `createServerValidate()`, return `undefined` on success, throw `ServerValidateError` on validation failure
  - **Non-form operations** (soft-delete, restore): Use `FormData` with hidden fields, return `{ success: boolean; error?: string }`
- The existing `getSessionAndOrg()` helper should be extracted to a shared utility or reimplemented in the warehouse actions file
- Duplicate code detection for warehouse code should return a server validation error via the error map (e.g., `{ errorMap: { onServer: "Warehouse code already exists" }, values: {...}, errors: [...] }`)

**Sources**: Existing `product.actions.ts`, `attribute.actions.ts`, Constitution XI

---

### 9. Kysely Migration Patterns for Warehouse Table

**Decision**: Use the same migration patterns established in the product variants feature — Kysely schema builder for table creation, raw SQL for CHECK constraints and partial unique indexes.

**Rationale**:

- Context7 Kysely v0.28.3 confirms `createTable()` supports `.notNull()`, `.references()`, `.defaultTo()`, `.unique()`, `.onDelete('cascade')`
- CHECK constraints require raw SQL (`ALTER TABLE ... ADD CONSTRAINT ... CHECK (...)`) — confirmed in 002 research
- Partial unique index (`WHERE deleted_at IS NULL`) requires raw SQL
- The `uuidv7()` SQL function is already available (used in existing migrations)
- The `update_updated_at_column()` trigger function may already exist from product migrations — reuse if so, or create idempotently with `CREATE OR REPLACE FUNCTION`

**Sources**: Context7 `/kysely-org/kysely/v0.28.3`, existing migrations in `src/shared/infrastructure/persistence/migrations/`

---

### 10. pg_trgm Extension for Text Search

**Decision**: Defer `pg_trgm` for now. Use standard `ILIKE` with `%search%` pattern for search. Document the upgrade path in data-model.md.

**Rationale**:

- Constitution VIII requires that "query patterns introduced in features MUST have matching index strategies" and "substring search (ILIKE '%...%') MUST use pg_trgm indexes or documented equivalent"
- For the initial implementation with ≤100 warehouses per org (practical), ILIKE on B-tree indexes will be sufficient (index only helps for prefix matches, not `%...%`)
- The search query scans name, code, city, and province — without `pg_trgm`, this is a sequential scan within the org-filtered rows (should be fast for small datasets)
- If performance becomes an issue, add `pg_trgm` extension migration + GIN index later
- **Constitution compliance**: Document this as a known limitation with upgrade path in data-model.md. For SC-003 (500ms search on ≤100 warehouses), sequential scan is well within budget — this is documented justification per Constitution VIII

**Sources**: data-model.md query optimization section, Constitution VIII requirements

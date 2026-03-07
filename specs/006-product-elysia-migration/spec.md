# Feature Specification: Product Module Elysia Migration

**Feature Branch**: `006-product-elysia-migration`  
**Created**: 2026-03-06  
**Status**: Draft  
**Input**: User description: "Migrate src/modules/products/ to use Elysia routes instead of server actions as per the constitution"

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Product CRUD via API (Priority: P1)

An ERP operator creates, edits, soft-deletes, and restores products through the existing product management UI. Behind the scenes, every mutation now flows through typed Elysia REST endpoints consumed via Eden Treaty and TanStack Query, replacing the former server-action data path. The operator sees no change in workflow — forms submit, feedback appears, and lists refresh exactly as before.

**Why this priority**: Products are the core entity of the module. If product create/update/delete does not work through the new API layer, nothing else in the module functions.

**Independent Test**: Can be fully tested by creating a product, editing its name and description, soft-deleting it, and restoring it — each operation should succeed and the product list should reflect changes immediately.

**Acceptance Scenarios**:

1. **Given** the products list page is open, **When** the operator fills out and submits the "Add Product" form, **Then** the product is created via the API and appears in the list without a full page reload.
2. **Given** a product exists, **When** the operator edits its name and saves, **Then** the update is persisted via the API and the list reflects the new name.
3. **Given** a product exists, **When** the operator soft-deletes it, **Then** the product disappears from the active list and appears in the trash list.
4. **Given** a soft-deleted product exists in the trash, **When** the operator restores it, **Then** the product reappears in the active list.

---

### User Story 2 - Attribute & Option Management via API (Priority: P2)

An ERP operator manages product attributes (e.g., "Color", "Size") and their options (e.g., "Red", "Large") through the existing attributes UI. All create, update, and delete operations now go through typed Elysia endpoints instead of server actions.

**Why this priority**: Attributes are required to configure product variants, so they must be functional before variant management can work end-to-end.

**Independent Test**: Can be fully tested by creating an attribute with options, editing the attribute name, adding/removing options, and soft-deleting the attribute — each operation should succeed and the attributes list should update accordingly.

**Acceptance Scenarios**:

1. **Given** the attributes page is open, **When** the operator creates a new attribute with two options, **Then** the attribute and its options are persisted via the API and displayed in the list.
2. **Given** an attribute exists, **When** the operator updates its name, **Then** the change is persisted via the API and reflected in the UI.
3. **Given** an attribute with options exists, **When** the operator adds a new option, **Then** the option is persisted via the API and appears under the attribute.
4. **Given** an attribute option exists, **When** the operator deletes it, **Then** the option is removed via the API and disappears from the list.
5. **Given** an attribute exists, **When** the operator soft-deletes it, **Then** the attribute disappears from the active list.

---

### User Story 3 - Variant Configuration via API (Priority: P3)

An ERP operator configures product variants by assigning attributes, generating variant combinations, and managing individual variant details (SKU, price, active status). All variant operations now go through typed Elysia endpoints instead of server actions.

**Why this priority**: Variant management depends on both products and attributes being functional. It is the most complex slice with the most endpoints but is the final piece needed for full module migration.

**Independent Test**: Can be fully tested by assigning attributes to a product, generating variants, editing a variant's SKU and price, toggling its active status, and soft-deleting it — each operation should succeed and the variant list should update accordingly.

**Acceptance Scenarios**:

1. **Given** a product and attributes exist, **When** the operator assigns an attribute to the product, **Then** the assignment is persisted via the API and the attribute appears in the product's configuration.
2. **Given** a product has assigned attributes, **When** the operator generates variant combinations, **Then** the variants are created via the API and displayed in the variant list.
3. **Given** a variant exists, **When** the operator updates its SKU and price, **Then** the changes are persisted via the API and reflected in the variant row.
4. **Given** the operator is entering a SKU, **When** they check availability, **Then** the system responds via the API indicating whether the SKU is already in use.
5. **Given** a variant exists, **When** the operator toggles its active status, **Then** the change is persisted via the API and the variant row reflects the new status.
6. **Given** product attributes are assigned, **When** the operator reorders them, **Then** the new order is persisted via the API and the UI reflects the updated ordering.

---

### Edge Cases

- What happens when the API returns a validation error (e.g., duplicate product name)? The UI must display the error inline on the relevant form field, matching current behavior.
- What happens when the API is unreachable or returns a server error? The UI must display a user-friendly error notification and not leave the form in an inconsistent state.
- What happens when two operators edit the same product concurrently? The last write wins (current behavior), and the stale operator sees updated data on next query refetch.
- What happens when a SKU availability check is performed while the variant list is still loading? The check should operate independently without blocking or being blocked by the list query.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST expose Elysia REST endpoints for all product operations: create, update, soft-delete, restore, list (with search/pagination), and get-by-id.
- **FR-002**: System MUST expose Elysia REST endpoints for all attribute operations: create, update, soft-delete, list, and get-by-id.
- **FR-003**: System MUST expose Elysia REST endpoints for all attribute option operations: create, update, and delete.
- **FR-004**: System MUST expose Elysia REST endpoints for all variant operations: assign attribute, remove attribute, reorder attributes, generate combinations, update variant, toggle active status, soft-delete, get existing combination keys, and check SKU availability.
- **FR-005**: All Elysia route handlers MUST validate request bodies and respond with typed success/error payloads.
- **FR-006**: All client-side mutations MUST use TanStack Query `useMutation` hooks wrapping Eden Treaty calls; no direct server action invocations or raw `fetch` calls.
- **FR-007**: All client-side data reads that currently happen in client components MUST use TanStack Query `useQuery` hooks wrapping Eden Treaty calls.
- **FR-008**: Query caches MUST be invalidated appropriately on successful mutations so the UI reflects changes without manual refresh.
- **FR-009**: Form validation errors returned by the API MUST be displayed inline on the corresponding form fields.
- **FR-010**: All server action files (`product.actions.ts`, `attribute.actions.ts`, `variant.actions.ts`) MUST be removed after migration is complete.
- **FR-011**: The existing UI/UX behavior MUST be preserved — operators should not perceive any functional change.

### Contract & Integrity Requirements _(mandatory)_

- **CR-001**: Elysia API routes MUST define explicit success and recoverable error behaviors (validation, not found, forbidden) in contracts.
- **CR-002**: Implementation MUST match documented contract shapes for all exposed mutation/read operations.
- **CR-003**: Elysia route handlers MUST define Zod request body and response schemas per status code for end-to-end type safety.
- **CR-004**: All client-side API calls MUST use Eden Treaty client; raw `fetch` and `'use server'` directives are prohibited.
- **CR-005**: Client component data fetching MUST use TanStack Query hooks (`useQuery`/`useMutation`) wrapping Eden Treaty; direct Treaty calls and `useEffect` fetch patterns are prohibited.
- **DIR-001**: Critical domain invariants MUST continue to be enforced at the database layer (existing CHECK/NOT NULL/FK constraints remain unchanged).

### Key Entities _(existing, no schema changes)_

- **Product**: Core catalog item with name, description, soft-delete support. Parent of variants and attribute assignments.
- **Attribute**: Named dimension for variant differentiation (e.g., "Color", "Size"). Has ordered options.
- **Attribute Option**: A specific value within an attribute (e.g., "Red", "Large").
- **Product Attribute**: Join linking an attribute to a product with a display order.
- **Product Variant**: A specific purchasable combination of attribute options, with SKU, price, and active status.
- **Variant Option**: Join linking a variant to a specific attribute option.

## Assumptions

- No database schema changes are required — this is a presentation-layer migration only.
- The application and domain layers (services, repositories, entities) remain unchanged.
- Server components that currently call services directly for initial page data may continue to do so (server-side rendering); only client-component mutations and client-side queries are migrated.
- The existing Eden Treaty client at `src/shared/infrastructure/api-client.ts` is used for all client-side API communication.
- The Elysia catch-all route at `src/app/api/[[...slugs]]/route.ts` is the single mounting point for all new route plugins.
- Authentication and multi-tenancy (organization scoping) are handled by the existing auth plugin/macro on the Elysia app.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: All product, attribute, and variant operations that previously used server actions are now served through REST API endpoints — zero `'use server'` directives remain in the products module.
- **SC-002**: All client-component mutations and queries use TanStack Query hooks wrapping Eden Treaty — zero direct server action calls remain in product components.
- **SC-003**: All API endpoints return typed, validated responses — providing end-to-end type safety from API contract to UI consumption.
- **SC-004**: The operator's workflow for managing products, attributes, and variants is functionally identical before and after migration — no regressions in create, edit, delete, restore, search, or pagination behavior.
- **SC-005**: Form validation errors (e.g., duplicate name, missing required fields) continue to display inline on form fields with the same level of specificity as before migration.
- **SC-006**: UI reflects data changes immediately after successful mutations without requiring manual page refresh.

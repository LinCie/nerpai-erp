# Feature Specification: Product Variants

**Feature Branch**: `002-product-variants`  
**Created**: 2026-02-25  
**Status**: Draft  
**Input**: User description: "Implement product variants using the normalized relational approach — products have variants (SKUs) defined by combinations of configurable attributes and options"

## Clarifications

### Session 2026-02-25

- Q: What happens when an attribute option used by active variants is deleted? → A: Block deletion — show an actionable error: "This option is used by N variants. Remove those variants first."
- Q: What happens when a user removes an attribute from a product that already has generated variants? → A: Gated confirmation — system warns "Removing this attribute will deactivate all N variants that use it. Continue?" Variants are soft-deactivated (not deleted) only after explicit user confirmation.
- Q: What happens when an auto-generated SKU would collide with an existing one? → A: Append an incrementing counter suffix (e.g. `SHIRT-RED-LG-2`, `SHIRT-RED-LG-3`) until a unique value is found. The user may still override it manually.
- Q: Which roles within an organization can manage (create/edit/delete) attributes and variants? → A: All organization members have full CRUD access — no intra-org role restriction is applied by this feature.
- Q: How does the user set attribute display order (which governs SKU segment order)? → A: Drag-and-drop reordering on the product’s attribute configuration page; order is stored per product (not globally).

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Define Product Attributes & Options (Priority: P1)

As an organization user, I want to define reusable attributes (e.g. "Color", "Size") and their allowed values (e.g. "Red", "Blue", "Small", "Large") so that I have a consistent vocabulary to describe product variants across my catalog.

**Why this priority**: Attributes and options are the foundational building blocks. Without them, variants cannot be created. They are reusable across multiple products, so getting them right first prevents duplication and inconsistency.

**Independent Test**: Can be tested by navigating to an attributes management page, creating a new attribute "Color" with values "Red" and "Blue", and verifying both the attribute and its options appear in a list.

**Acceptance Scenarios**:

1. **Given** I am on the attributes management page, **When** I create a new attribute called "Color" with options "Red", "Blue", and "Green", **Then** the attribute "Color" is saved and its three options are listed under it
2. **Given** an attribute exists, **When** I add a new option value to it, **Then** the new option appears in the attribute's list and is available for variant configuration
3. **Given** an attribute exists, **When** I try to save an attribute with an empty name, **Then** I see a validation error and the attribute is not saved
4. **Given** an attribute has options, **When** I edit an option's value, **Then** the updated value is reflected everywhere that option is used

---

### User Story 2 - Configure Variants on a Product (Priority: P1)

As an organization user, I want to attach attributes to a product and select which option combinations should become active variants (SKUs) so that I can offer multiple orderable versions of the same product.

**Why this priority**: This is the core workflow of the feature. Without selecting which combinations are active variants, no variants exist and inventory/orders cannot reference specific product configurations.

**Independent Test**: Can be tested by opening an existing product, selecting "Color" and "Size" as its attributes, choosing specific options (e.g. Red-Small, Red-Large), generating variants, and verifying those two variant rows appear with their own SKUs.

**Acceptance Scenarios**:

1. **Given** a product exists and attributes are defined, **When** I select "Color" (Red, Blue) and "Size" (S, M, L) for the product and confirm, **Then** the system generates variant rows for each combination (6 total: Red-S, Red-M, Red-L, Blue-S, Blue-M, Blue-L)
2. **Given** a product's variants have been generated, **When** I deactivate the "Blue-M" combination, **Then** that variant is marked inactive and excluded from active inventory/orders without being permanently deleted
3. **Given** I am configuring variants, **When** I select attributes but no options underneath, **Then** I see a validation error and no variants are generated
4. **Given** a product has no attributes assigned, **When** I view the product detail, **Then** I see a prompt to add attributes and create variants

---

### User Story 3 - Manage Individual Variant Details (Priority: P1)

As an organization user, I want to set price, stock quantity, and SKU code for each variant independently so that different configurations of the same product can have their own pricing and inventory.

**Why this priority**: Variants without per-variant price and stock are not actionable for operations. This story gives each variant its own identity as an orderable unit.

**Independent Test**: Can be tested by opening a specific variant (e.g. Red-Large T-Shirt), setting the price to 29.99, stock to 50, and a custom SKU, then verifying those values persist and appear on the variant detail view.

**Acceptance Scenarios**:

1. **Given** a variant exists, **When** I set its price to 29.99 and stock quantity to 100, **Then** the variant shows a price of 29.99 and a stock count of 100
2. **Given** a variant has an auto-generated SKU, **When** I override it with a custom value "SHIRT-RED-LG", **Then** the SKU is saved and the auto-generated SKU is replaced
3. **Given** two variants have the same manually-entered SKU, **When** I try to save the second one, **Then** I see a validation error indicating SKU must be unique
4. **Given** a variant with stock of 0, **When** I view the product's variant list, **Then** the variant is visually indicated as "Out of Stock"

---

### User Story 4 - View Variants on Product Detail Page (Priority: P2)

As an organization user, I want to see all variants of a product in a clear matrix or list so that I can quickly understand what configurations exist, their prices, and stock levels.

**Why this priority**: Visibility into variant state is essential for day-to-day operations. This story enables informed decision-making without drilling into each variant individually.

**Independent Test**: Can be tested by opening a product that has multiple variants and verifying that all variant combinations, their SKUs, prices, and stock quantities are visible on one screen.

**Acceptance Scenarios**:

1. **Given** a product has 6 variants across 2 attributes (Color × Size), **When** I view the product detail page, **Then** all 6 variants are listed with their SKU, price, and stock quantity
2. **Given** a product has both active and inactive variants, **When** I view the product detail page, **Then** active and inactive variants are visually differentiated (e.g. greyed out for inactive)
3. **Given** a product has no variants yet, **When** I view the product detail page, **Then** I see an empty state with a clear call-to-action to add variants

---

### User Story 5 - Add New Option to Existing Variant Set (Priority: P3)

As an organization user, I want to add a new attribute option (e.g. a new color "Yellow") to an existing product and selectively generate the new variant combinations so that I can expand a product's offering without recreating all variants.

**Why this priority**: Catalogs evolve over time. Adding new variants to existing products without disrupting already-configured ones is important for long-term usability.

**Independent Test**: Can be tested by opening a product with 4 existing variants, adding a third color option, and verifying that only the new combinations are offered for activation, while the existing 4 variants remain unchanged.

**Acceptance Scenarios**:

1. **Given** a product has Red-S, Red-M, Blue-S, Blue-M variants, **When** I add "Yellow" to the Color attribute and confirm, **Then** Yellow-S and Yellow-M are created as new variants while the existing 4 remain unchanged
2. **Given** new variants are generated for an existing product, **When** I view the variant list, **Then** newly added variants are visually distinguishable until I set their price and stock

---

### Edge Cases

- What happens when a user attempts to create a product variant with 0 available attribute options?
- How does the system handle a product that was created before the variant feature was enabled (legacy products)?
- **[Resolved]** Removing an attribute from a product with existing variants triggers a gated confirmation dialog showing the count of variants that will be deactivated. On user confirmation, those variants are soft-deactivated (inactive) and remain in the database. On cancel, no change is made. (See FR-016)
- **[Resolved]** Deleting an attribute option referenced by one or more variants is blocked at the system level regardless of user role. The user sees an actionable error: "This option is used by N variants. Remove those variants first." (See FR-014)
- How does the system handle a product where only some attribute combinations are active (sparse matrix)?
- **[Resolved]** When an auto-generated SKU collides with an existing one in the organization, the system appends an incrementing numeric suffix (e.g. `SHIRT-RED-LG-2`) until unique. The user can override the final value manually. (See FR-005)
- What is displayed when a product has attributes assigned but all variants are deactivated?
- How does the system respond when a user attempts to set a negative stock quantity or negative price?

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST allow organization users to create named attributes (e.g. "Color", "Size") scoped to their organization
- **FR-002**: System MUST allow adding, editing, and removing option values for each attribute (e.g. "Red", "Blue", "Small", "Large")
- **FR-003**: System MUST allow one or more attributes to be associated with a specific product
- **FR-004**: System MUST allow users to select which attribute option combinations become active variants for a product
- **FR-005**: System MUST automatically generate a unique SKU for each new variant using a deterministic format based on product code and option codes (e.g. `{PRODUCT_CODE}-{OPTION_CODE_1}-{OPTION_CODE_2}`). If the generated SKU collides with an existing one within the organization, the system MUST append an incrementing numeric suffix (e.g. `-2`, `-3`) until the value is unique. The user may override the result via FR-006.
- **FR-006**: System MUST allow users to manually override the auto-generated SKU per variant
- **FR-007**: SKU values MUST be unique across the entire organization's catalog
- **FR-008**: System MUST allow storing an independent price (monetary value) per variant
- **FR-009**: System MUST allow storing an independent stock quantity (non-negative integer) per variant
- **FR-010**: System MUST allow marking individual variants as active or inactive without deleting them
- **FR-011**: System MUST allow adding new option values to an attribute that is already associated with a product, and selectively generating new variant combinations
- **FR-012**: System MUST display all variants of a product on the product detail page, showing SKU, price, stock quantity, and active status
- **FR-013**: System MUST enforce organization isolation — users can only view and manage attributes, options, and variants belonging to their own organization. Within an organization, all members have full CRUD access to attributes, options, and variants; no intra-org role restriction is applied by this feature.
- **FR-014**: System MUST prevent deletion of an attribute option that is currently referenced by one or more variants, returning an actionable error message that indicates the count of referencing variants (e.g. "This option is used by N variants. Remove those variants first."). Hard-deletion of a referenced option is not permitted under any user role.
- **FR-015**: System MUST validate that price is a non-negative monetary value and stock quantity is a non-negative integer
- **FR-016**: System MUST require explicit user confirmation before removing an attribute from a product that has existing variants. The confirmation dialog MUST state the number of variants that will be affected (e.g. "Removing this attribute will deactivate all N variants that use it. Continue?"). On confirmation, all affected variants MUST be soft-deactivated; they are not permanently deleted.
- **FR-017**: System MUST allow users to reorder attributes on a product's variant configuration page via drag-and-drop. The chosen order MUST be persisted per product (stored in the Product–Attribute Association record as `display_order`) and MUST determine both the SKU segment order and the display order in all variant list/matrix views. Reordering MUST be fully keyboard-operable and announce position changes to assistive technologies.

### Contract & Integrity Requirements _(mandatory when applicable)_

- **CR-001**: All variant mutation operations (create, update price/stock/sku, activate/deactivate) MUST define explicit success and error behaviors (validation errors, conflict on duplicate SKU, not-found)
- **CR-002**: Variant read operations MUST return the complete variant record including all associated attribute option labels
- **DIR-001**: Uniqueness of SKU within an organization MUST be enforced at the database constraint level
- **DIR-002**: The relationship between a variant and its attribute options MUST be enforced via foreign key constraints; orphaned configurations are not permitted
- **DIR-003**: Stock quantity MUST have a database-level CHECK constraint enforcing non-negative values
- **DIR-004**: Price MUST have a database-level CHECK constraint enforcing non-negative values
- **DIR-005**: The `display_order` column on the Product–Attribute Association table MUST be a non-null positive integer; uniqueness of `display_order` within a product (`product_id`, `display_order`) MUST be enforced at the database level.

### Key Entities _(include if feature involves data)_

- **Attribute**: A named dimension along which products vary within an organization (e.g. "Color", "Size", "Material"). Scoped to an organization. Has an ordered list of options.
- **Attribute Option**: A specific value for an attribute (e.g. "Red" for Color, "Large" for Size). Belongs to exactly one attribute. Can be reused across multiple products.
- **Product–Attribute Association**: The join record linking a specific attribute to a specific product. Stores a `display_order` integer (1-based, per product) that governs SKU segment ordering and UI presentation. Managed via drag-and-drop on the product's variant configuration page.
- **Product Variant**: A single orderable unit — one exact combination of one option from each of the product's assigned attributes. Has its own SKU, price, stock quantity, and active status. Belongs to exactly one product.
- **Variant Configuration**: The join between a product variant and the specific attribute options that define it (e.g. Variant #42 = Color:Red + Size:Large). Immutable after creation.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Users can create a product attribute with options in under 60 seconds from a blank state
- **SC-002**: Users can fully configure variants for a product with 3 attributes × 3 options (27 combinations) in under 3 minutes
- **SC-003**: The product variant list for a product with up to 100 variants loads and is fully interactive within 1 second
- **SC-004**: 100% of variants are correctly isolated by organization — no cross-organization data leakage
- **SC-005**: SKU uniqueness conflicts are surfaced to the user immediately upon entry, with no silent data corruption
- **SC-006**: Adding a new option to an existing product's attribute and generating only the new variant combinations does not affect the state of existing variants

## Assumptions

- Attributes are reusable across products within the same organization (e.g. the "Color" attribute created once can be applied to shirts, pants, and shoes)
- Each product variant is defined by exactly **one option per assigned attribute** — no multi-select options per attribute per variant
- A product with no attributes assigned is valid (it represents a simple, non-configurable product); it has no variants
- Pricing is stored as a plain decimal value; currency is organization-level (out of scope for this feature)
- There is no maximum enforced on the number of attributes per product or the number of options per attribute, though users are advised to be mindful of combinatorial explosion
- Products without variants do not automatically receive a "default" variant — the ordering module (future feature) will handle this separately
- Attribute display order is meaningful (determines SKU segment order and variant list presentation). Order is set per product via drag-and-drop on the product’s attribute configuration page and stored as `display_order` on the Product–Attribute Association record (see FR-017, DIR-005).
- Images per variant are out of scope for this feature

## Future Extensions (Out of Scope)

The following are explicitly NOT part of this feature but should be considered in design:

- Per-variant product images
- Bulk price / stock editing across multiple variants at once
- Variant-level discounts and promotional pricing
- Inventory movement history and stock adjustments per variant
- Barcode / barcode scanning support per variant
- Import/export of variant data via CSV or API
- Variant-specific warehouse location assignments
- Integration with order lines referencing specific variant IDs
- Multi-currency pricing per variant
- Variant availability by sales channel or region

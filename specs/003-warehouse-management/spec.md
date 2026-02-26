# Feature Specification: Warehouse Management

**Feature Branch**: `003-warehouse-management`  
**Created**: 2026-02-26  
**Status**: Draft  
**Input**: User description: "Create a complete technical specification document for implementing a Warehouse entity in a multi-tenant SaaS inventory management application. My existing schema includes: Organization (tenant), Products, and Product Variants (with SKU). REQUIREMENTS: 1. PostgreSQL schema (CREATE TABLE) matching the structure I approved earlier 2. All indexes, constraints, and foreign keys (references organizations.id) 3. Database migrations (Up/Down SQL) 4. Input validation rules (name required, code unique per org, address fields) 5. Sample seed data for Indonesian locations (Kediri, Surabaya, Jakarta) 6. Multi-tenancy safeguards (tenant isolation via organization_id) 7. Query optimization recommendations 8. Error handling scenarios 9. Integration hooks for future Inventory table"

## Clarifications

### Session 2026-02-26

- Q: FR-012 says soft-deleted warehouses block code reuse, but User Story 4 Scenario 4 says they don't. Which behavior? → A: Soft-deleted warehouses **block** code reuse (FR-012 wins). This preserves data integrity so restored warehouses never conflict with newly created ones.
- Q: Which roles/permissions can create, edit, and delete warehouses? → A: All authenticated organization members can fully manage warehouses (create, edit, delete). No role-based restriction beyond org membership.
- Q: How should concurrent edits to the same warehouse be handled? → A: **Last-write-wins** — no conflict detection or optimistic locking. The latest save simply overwrites. Optimistic locking may be added in a future iteration if needed.
- Q: Should warehouse codes be editable after creation, or immutable? → A: **Immutable** after creation. The edit form disables the code field. This preserves referential integrity for future integrations.
- Q: What should users see when their organization has no warehouses yet? → A: **Illustrated empty state** — show an icon/illustration, a helpful message (e.g., "No warehouses yet"), and a prominent "Create Your First Warehouse" CTA button.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Create Warehouse (Priority: P1)

As an organization user, I want to create a new warehouse by providing a name, unique code, and complete address information so that I can track inventory across multiple physical locations.

**Why this priority**: Warehouse creation is the foundational capability. Without warehouses, no inventory can be stored, tracked, or managed. This is the first step in enabling multi-location inventory management.

**Independent Test**: Can be tested by navigating to the warehouse management page, clicking "New Warehouse", filling in name "Main Warehouse", code "WH-001", address details, and saving. The warehouse should appear in the list with all provided information.

**Acceptance Scenarios**:

1. **Given** I am on the warehouse creation page, **When** I enter name "Gudang Utama", code "WH-KDR-001", complete address including street, city "Kediri", postal code, and save, **Then** the warehouse is created and appears in the warehouse list with all details
2. **Given** I attempt to create a warehouse without a name, **When** I submit the form, **Then** I see a validation error "Warehouse name is required" and the warehouse is not created
3. **Given** a warehouse with code "WH-001" already exists in my organization, **When** I try to create another warehouse with the same code, **Then** I see a validation error "Warehouse code must be unique" and the duplicate is not created
4. **Given** I am creating a warehouse, **When** I enter an address with city, province, and postal code, **Then** all address fields are stored and retrievable for reporting and logistics

---

### User Story 2 - List and Search Warehouses (Priority: P1)

As an organization user, I want to view all warehouses in my organization and search/filter them so that I can quickly locate specific warehouses and understand my distribution network.

**Why this priority**: Warehouse visibility is essential for day-to-day operations. Users need to see what locations exist, where they are, and their basic information to make inventory decisions.

**Independent Test**: Can be tested by opening the warehouse list page and verifying that all warehouses for the current organization are displayed with their names, codes, and cities. Test the search by typing "Kediri" and verifying only Kediri warehouses appear.

**Acceptance Scenarios**:

1. **Given** my organization has warehouses in Jakarta, Surabaya, and Kediri, **When** I open the warehouse list, **Then** I see all three warehouses with their names, codes, and city information
2. **Given** I am viewing the warehouse list, **When** I type "Surabaya" in the search box, **Then** only warehouses in Surabaya are displayed
3. **Given** I am viewing the warehouse list, **When** I filter by a specific province (e.g., "East Java"), **Then** only warehouses in that province are shown
4. **Given** my organization has 50 warehouses, **When** I view the list, **Then** the page loads within 1 second and pagination is available if needed
5. **Given** my organization has no warehouses, **When** I open the warehouse list, **Then** I see an illustrated empty state with a friendly message and a prominent "Create Your First Warehouse" button that navigates to the creation form

---

### User Story 3 - Update Warehouse Details (Priority: P2)

As an organization user, I want to edit warehouse information including name, address, and contact details so that I can keep location information accurate as my business evolves.

**Why this priority**: Business information changes over time (relocations, contact updates, rebranding). The ability to update without recreating maintains data integrity and historical associations.

**Independent Test**: Can be tested by opening an existing warehouse, clicking edit, changing the street address and contact phone, saving, and verifying the changes persist.

**Acceptance Scenarios**:

1. **Given** a warehouse exists with address in "Jl. Veteran No. 10", **When** I update the street address to "Jl. Veteran No. 15" and save, **Then** the address is updated and future inventory reports reflect the new address
2. **Given** I am editing a warehouse, **When** I view the edit form, **Then** the warehouse code field is displayed as read-only/disabled (codes are immutable after creation)
3. **Given** I update a warehouse's city from "Surabaya" to "Jakarta", **When** I save the changes, **Then** all associated inventory records maintain their relationship to the same warehouse (only address changed, not identity)
4. **Given** I am editing warehouse details, **When** I leave the name field empty and attempt to save, **Then** I see a validation error "Warehouse name is required" and no changes are saved

---

### User Story 4 - Soft-Delete and Restore Warehouse (Priority: P2)

As an organization user, I want to mark warehouses as inactive (soft-delete) and restore them later so that I can manage warehouse lifecycle without losing historical inventory data.

**Why this priority**: Warehouses may be temporarily closed or decommissioned, but historical inventory data must be preserved for audit and reporting purposes. Soft-delete enables this while keeping the warehouse out of active lists.

**Independent Test**: Can be tested by soft-deleting a warehouse, verifying it no longer appears in the active list, checking the trash/deleted view, and restoring it to verify it reappears in the active list.

**Acceptance Scenarios**:

1. **Given** a warehouse has inventory history but is being decommissioned, **When** I soft-delete the warehouse, **Then** it no longer appears in active warehouse lists but historical inventory records remain intact
2. **Given** a warehouse is soft-deleted, **When** I view the deleted/trash view, **Then** I can see the warehouse with an option to restore (no permanent delete in this feature scope)
3. **Given** I restore a soft-deleted warehouse, **When** the restoration completes, **Then** the warehouse reappears in active lists with all its previous data intact
4. **Given** a soft-deleted warehouse exists, **When** I attempt to create a new warehouse with the same code, **Then** the system rejects it with a validation error indicating the code is still reserved (soft-deleted warehouses block code reuse to ensure safe restore)

---

### User Story 5 - Warehouse Detail View (Priority: P2)

As an organization user, I want to view complete details of a specific warehouse including current inventory summary so that I can make informed decisions about stock allocation and transfers.

**Why this priority**: Individual warehouse visibility with inventory context enables operational decisions. Users need to see what's stored where to manage distribution effectively.

**Independent Test**: Can be tested by clicking on a warehouse from the list and verifying all stored information is displayed along with a summary of products/SKUs currently stored there (placeholder for future inventory integration).

**Acceptance Scenarios**:

1. **Given** I have a warehouse with complete address details, **When** I view its detail page, **Then** I see the full address, contact information, and metadata
2. **Given** the warehouse has product variants stored in it (future inventory feature), **When** I view the warehouse detail, **Then** I see a summary showing total distinct SKUs and total quantity across all products
3. **Given** I am viewing warehouse details, **When** I click edit, **Then** I am taken to the edit form pre-populated with current values
4. **Given** I am viewing warehouse details, **When** I click delete, **Then** I see a confirmation dialog before the soft-delete action executes

---

### Edge Cases

- What happens when an organization reaches a reasonable maximum number of warehouses (e.g., 1000)?
- How does the system handle warehouse addresses with non-Latin characters (e.g., Chinese, Arabic, Japanese)?
- What happens when a warehouse code contains leading/trailing whitespace?
- How does the system validate postal codes for different countries (Indonesia uses 5-digit, other countries vary)?
- What happens when a user attempts to soft-delete a warehouse that has active inventory (future consideration)?
- Concurrent edits: Last-write-wins strategy — no optimistic locking. The latest save overwrites previous changes. (Resolved: optimistic locking deferred to future iteration)
- What happens when the search query contains special characters or SQL injection attempts?

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST allow organization users to create warehouses with a required name field (1-255 characters, trimmed)
- **FR-002**: System MUST enforce unique warehouse codes within an organization (case-insensitive, trimmed, 1-50 characters)
- **FR-003**: System MUST allow storing complete address information: street address, city, province/state, postal code, and country (default: Indonesia)
- **FR-004**: System MUST allow optional contact information: contact name, phone number, email address
- **FR-005**: System MUST allow optional metadata: notes/description text field (up to 1000 characters)
- **FR-006**: System MUST support soft-delete (mark as deleted without removing data) with timestamp tracking
- **FR-007**: System MUST support restoring soft-deleted warehouses to active status
- **FR-008**: System MUST list all warehouses for the current organization, excluding soft-deleted by default
- **FR-009**: System MUST support text search across warehouse name, code, city, and province fields
- **FR-010**: System MUST provide a detail view showing complete warehouse information
- **FR-011**: System MUST enforce organization isolation — users can only view and manage warehouses belonging to their own organization
- **FR-012**: System MUST prevent creation of warehouses with duplicate codes within the same organization (including soft-deleted warehouses)
- **FR-013**: System MUST auto-generate UUID v7 primary keys for all warehouse records
- **FR-014**: System MUST track creation timestamp, last update timestamp, and deletion timestamp for audit purposes
- **FR-015**: System MUST validate that warehouse codes contain only alphanumeric characters, hyphens, and underscores (no spaces or special characters)
- **FR-016**: System MUST trim all text inputs before validation and storage
- **FR-017**: System MUST allow all authenticated organization members to create, update, soft-delete, and restore warehouses — no additional role-based permission checks are required beyond organization membership
- **FR-018**: System MUST NOT allow modification of the warehouse code after creation — the code field MUST be read-only in the edit form and rejected by the server if submitted in an update request
- **FR-019**: System MUST display an illustrated empty state with an icon, a message (e.g., "No warehouses yet"), and a "Create Your First Warehouse" call-to-action button when the organization has zero warehouses

### Contract & Integrity Requirements _(mandatory when applicable)_

- **CR-001**: All warehouse mutation operations (create, update, soft-delete, restore) MUST define explicit typed success and error behaviors including validation errors, not-found errors, forbidden access errors, and explicit no-active-organization redirect behavior
- **CR-002**: Warehouse read operations MUST return complete warehouse records including all address fields and metadata
- **DIR-001**: Uniqueness of warehouse code within an organization MUST be enforced at the database constraint level across all records, including soft-deleted warehouses (unique composite index on normalized code + organization_id)
- **DIR-002**: All foreign key relationships to organization MUST use ON DELETE CASCADE
- **DIR-003**: Warehouse name MUST have a database-level NOT NULL constraint with CHECK constraint for non-empty after trim
- **DIR-004**: Postal code and country fields SHOULD have appropriate format validation at application layer (not necessarily DB constraint)

### Key Entities _(include if feature involves data)_

- **Warehouse**: A physical storage location within an organization. Represents a place where product inventory can be stored. Contains identifying information (name, code), address details (street, city, province, postal code, country), optional contact information, and metadata. Scoped to an organization. Supports soft-delete lifecycle.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Users can create a new warehouse with complete information in under 60 seconds from a blank state
- **SC-002**: The warehouse list for an organization with up to 100 warehouses loads and is fully interactive within 1 second
- **SC-003**: Warehouse search/filter operations return results within 500 milliseconds
- **SC-004**: 100% of warehouses are correctly isolated by organization — no cross-organization data leakage
- **SC-005**: Warehouse code uniqueness conflicts are surfaced to the user immediately upon entry, with no silent data corruption
- **SC-006**: Soft-deleted warehouses remain accessible via explicit "show deleted" toggle or trash view for audit purposes
- **SC-007**: Address information is stored with full Unicode support for international locations

## Assumptions

- Each warehouse belongs to exactly one organization (strict multi-tenancy)
- A warehouse code is immutable once created (if code changes are needed, a new warehouse should be created)
- Soft-deleted warehouses can be restored, preserving all historical data
- Country field defaults to "Indonesia" but supports international locations
- Address fields are free-text to accommodate varying international address formats
- Phone numbers are stored as plain text without strict formatting validation (to accommodate international formats)
- Each warehouse can store multiple product variants (future inventory feature)
- The warehouse entity is designed for integration with a future Inventory table that will track stock levels per warehouse per product variant
- No limit is enforced on the number of warehouses per organization (organizations can create unlimited warehouses)
- Warehouse code format is not strictly validated beyond alphanumeric, hyphens, and underscores

## Future Extensions (Out of Scope)

The following are explicitly NOT part of this feature but should be considered in design:

- **Inventory tracking**: Stock levels per warehouse per product variant (planned next feature)
- **Warehouse transfers**: Moving inventory between warehouses
- **Warehouse zones/aisles**: Sub-locations within a warehouse
- **Warehouse capacity**: Maximum storage limits and utilization tracking
- **Warehouse staff assignments**: Users assigned to specific warehouses
- **Warehouse operating hours**: Business hours and availability schedules
- **Geolocation**: GPS coordinates for mapping and routing
- **Warehouse-to-customer distance**: For optimizing fulfillment location selection
- **Multi-currency support per warehouse**: For warehouses in different countries
- **Warehouse-level pricing**: Different prices per warehouse (rare but exists in some business models)
- **Integration with shipping providers**: Automatic rate calculation based on warehouse location

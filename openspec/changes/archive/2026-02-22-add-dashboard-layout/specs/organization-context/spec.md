## ADDED Requirements

### Requirement: Organization access control
The system SHALL restrict dashboard access to users with an active organization.

#### Scenario: User with active organization accesses dashboard
- **WHEN** authenticated user with active organization navigates to dashboard routes
- **THEN** the system displays the dashboard layout and content

#### Scenario: User without active organization is redirected
- **WHEN** user without active organization attempts to access dashboard routes
- **THEN** the system redirects to /organizations page
- **AND** displays a message to select an organization

#### Scenario: Server-side organization check
- **WHEN** dashboard layout loads
- **THEN** the system checks for active organization server-side
- **AND** redirects before rendering any dashboard content

### Requirement: Organization information display
The system SHALL display the active organization name in the sidebar.

#### Scenario: Organization name is visible
- **WHEN** user views the dashboard sidebar
- **THEN** the active organization name is displayed in the sidebar header

### Requirement: Organization exit functionality
The system SHALL provide a way for users to exit the current organization and return to organization selection.

#### Scenario: Exit organization button is visible
- **WHEN** user views the sidebar header
- **THEN** an "Exit" or "Switch Organization" button is visible next to the organization name

#### Scenario: Exit organization functionality
- **WHEN** user clicks the exit organization button
- **THEN** the system clears the active organization from the session
- **AND** redirects the user to /organizations page

#### Scenario: Organization exit confirmation
- **WHEN** user clicks exit organization button
- **THEN** the system clears the active organization
- **AND** redirects to organization selection page without requiring confirmation (for better UX flow)

## ADDED Requirements

### Requirement: Theme toggle component
The system SHALL provide a theme toggle button that switches between light and dark modes.

#### Scenario: Theme toggle is visible
- **WHEN** user views the dashboard header
- **THEN** a theme toggle button with sun/moon icon is visible

#### Scenario: Toggle to dark mode
- **WHEN** user clicks theme toggle while in light mode
- **THEN** the application switches to dark mode
- **AND** all UI components reflect dark theme colors

#### Scenario: Toggle to light mode
- **WHEN** user clicks theme toggle while in dark mode
- **THEN** the application switches to light mode
- **AND** all UI components reflect light theme colors

### Requirement: Theme persistence
The system SHALL persist the user's theme preference across sessions.

#### Scenario: Theme persists after page reload
- **GIVEN** user has selected dark mode
- **WHEN** user reloads the page
- **THEN** the application loads in dark mode

#### Scenario: Theme persists across navigation
- **GIVEN** user has selected dark mode
- **WHEN** user navigates to different dashboard pages
- **THEN** dark mode remains active throughout the session

### Requirement: System theme detection
The system SHALL respect the user's system theme preference on first visit.

#### Scenario: System dark mode preference
- **GIVEN** user's OS is set to dark mode
- **WHEN** user first visits the dashboard
- **THEN** the application initializes in dark mode

#### Scenario: System light mode preference
- **GIVEN** user's OS is set to light mode
- **WHEN** user first visits the dashboard
- **THEN** the application initializes in light mode

### Requirement: No flash on load
The system SHALL prevent theme flash (FOUC) on page load.

#### Scenario: No flash when loading page
- **GIVEN** user has selected dark mode
- **WHEN** page loads
- **THEN** the page renders immediately in dark mode without flashing light mode first

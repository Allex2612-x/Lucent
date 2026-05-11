# Requirements Document: Settings Page Redesign

## Introduction

This document specifies the requirements for redesigning the Settings (Setări) page of the Sasha finance application. The redesign introduces a tabbed interface with five sections (Profil, Securitate, Preferințe, Notificări, Date & Confidențialitate), improved visual design with proper spacing and layout constraints, enhanced user experience with form validation and dirty state tracking, and comprehensive data management features including export, import, and account deletion.

The redesigned Settings page will provide users with a centralized, organized interface to manage their profile information, security settings, application preferences, notification settings, and data privacy options while maintaining consistency with the Sasha brand identity (purple accent #7C5CFF) and following established design patterns from other redesigned pages.

## Glossary

- **Settings_Page**: The main settings interface component that displays user configuration options
- **Tab_Navigation**: The horizontal navigation component displaying five tabs: Profil, Securitate, Preferințe, Notificări, Date & Confidențialitate
- **Profile_Tab**: The tab section containing user profile information (avatar, name, email)
- **Security_Tab**: The tab section containing security-related settings (password change, 2FA, active sessions)
- **Preferences_Tab**: The tab section containing application preferences (language, currency, date format, week start, theme)
- **Notifications_Tab**: The tab section containing notification preferences (budget alerts, reports)
- **Data_Tab**: The tab section containing data management options (export, import, danger zone)
- **Form_Card**: A card component with max-width 720px containing form fields
- **Avatar_Upload**: A circular avatar image with upload and remove functionality
- **Dirty_State**: The condition when form fields have been modified but not saved
- **Unsaved_Changes_Banner**: A subtle banner displayed when forms have unsaved changes
- **Password_Strength_Indicator**: A visual indicator showing password strength (weak, medium, strong)
- **Confirmation_Modal**: A modal dialog requiring user confirmation for destructive actions
- **Toast_Notification**: A temporary notification message displayed after user actions
- **Active_Session**: A record of a user's authenticated session including device, location, and timestamp
- **Danger_Zone**: A section containing destructive actions (delete transactions, delete account)
- **Export_Format**: The file format for data export (JSON or CSV)
- **Theme_Option**: The application theme setting (Dark, Light, or System)
- **Date_Format**: The date display format (DD.MM.YYYY, MM/DD/YYYY, or YYYY-MM-DD)
- **Week_Start_Day**: The first day of the week (Monday or Sunday)
- **Language_Option**: The application language (Română, English, Русский)
- **Backend_API**: The REST API service running on port 4000
- **Design_Token_System**: The centralized color and style definitions from frontend/src/styles/colors.ts
- **UI_Component_Library**: The reusable UI components from frontend/src/components/ui/
- **Sonner**: The toast notification library used for user feedback
- **Responsive_Breakpoint**: Screen width thresholds for mobile (<768px), tablet (768px-1200px), and desktop (>1200px)

## Requirements

### Requirement 1: Tab Navigation Structure

**User Story:** As a user, I want to navigate between different settings sections using tabs, so that I can easily find and access specific configuration options.

#### Acceptance Criteria

1. THE Settings_Page SHALL display Tab_Navigation with five tabs: Profil, Securitate, Preferințe, Notificări, Date & Confidențialitate
2. WHEN a user clicks a tab, THE Settings_Page SHALL display the corresponding tab content and highlight the active tab
3. THE Tab_Navigation SHALL use the purple primary accent color (#7C5CFF) for the active tab indicator
4. THE Tab_Navigation SHALL be horizontally scrollable on mobile devices when tabs exceed viewport width
5. THE Settings_Page SHALL remember the last active tab when the user navigates away and returns

### Requirement 2: Profile Tab - Avatar Management

**User Story:** As a user, I want to upload and manage my profile avatar, so that I can personalize my account.

#### Acceptance Criteria

1. THE Profile_Tab SHALL display Avatar_Upload as a circular image with 120px diameter
2. WHEN a user hovers over Avatar_Upload, THE Profile_Tab SHALL display upload and remove buttons as overlays
3. WHEN a user clicks the upload button, THE Settings_Page SHALL open a file picker accepting image files (JPEG, PNG, WebP)
4. WHEN a user selects an image file, THE Settings_Page SHALL validate the file size is less than 5MB
5. IF the file size exceeds 5MB, THEN THE Settings_Page SHALL display an error Toast_Notification with message "Imaginea este prea mare. Mărimea maximă este 5MB"
6. WHEN a valid image is selected, THE Settings_Page SHALL upload the image to Backend_API and update Avatar_Upload
7. WHEN a user clicks the remove button, THE Settings_Page SHALL display Confirmation_Modal requiring confirmation
8. WHEN the user confirms avatar removal, THE Settings_Page SHALL delete the avatar from Backend_API and display the default avatar placeholder

### Requirement 3: Profile Tab - Name Fields

**User Story:** As a user, I want to update my first name and last name, so that my profile displays the correct information.

#### Acceptance Criteria

1. THE Profile_Tab SHALL display Prenume and Nume input fields in a horizontal row layout
2. THE Profile_Tab SHALL validate Prenume has minimum 2 characters
3. THE Profile_Tab SHALL validate Nume has minimum 2 characters
4. WHEN a user modifies Prenume or Nume, THE Settings_Page SHALL enter Dirty_State
5. THE Profile_Tab SHALL display validation errors inline below the respective field
6. THE Profile_Tab SHALL trim whitespace from Prenume and Nume before submission

### Requirement 4: Profile Tab - Email Display

**User Story:** As a user, I want to view my email address and have the option to change it, so that I can maintain accurate contact information.

#### Acceptance Criteria

1. THE Profile_Tab SHALL display the email field as read-only with a disabled visual style
2. THE Profile_Tab SHALL display a "Schimbă email" link next to the email field
3. WHEN a user clicks "Schimbă email", THE Settings_Page SHALL display a modal with email change workflow (future implementation)
4. THE email field SHALL use a distinct background color to indicate read-only state

### Requirement 5: Profile Tab - Save Button Behavior

**User Story:** As a user, I want the save button to be enabled only when I have unsaved changes, so that I understand when action is required.

#### Acceptance Criteria

1. THE Profile_Tab SHALL display a save button aligned to the right with compact styling
2. THE save button SHALL be disabled when the form is not in Dirty_State
3. THE save button SHALL be enabled when the form is in Dirty_State
4. WHEN a user clicks the enabled save button, THE Settings_Page SHALL submit profile updates to Backend_API
5. WHEN the update succeeds, THE Settings_Page SHALL display a success Toast_Notification and exit Dirty_State
6. WHEN the update fails, THE Settings_Page SHALL display an error Toast_Notification with the error message

### Requirement 6: Security Tab - Password Change

**User Story:** As a user, I want to change my password with strength validation, so that I can maintain account security.

#### Acceptance Criteria

1. THE Security_Tab SHALL display three password fields: current password, new password, and confirm new password
2. WHEN a user types in the new password field, THE Security_Tab SHALL display Password_Strength_Indicator
3. THE Password_Strength_Indicator SHALL calculate strength based on length, character variety, and common patterns
4. THE Password_Strength_Indicator SHALL display visual feedback with colors: red (weak), amber (medium), green (strong)
5. THE Security_Tab SHALL validate the new password has minimum 6 characters
6. THE Security_Tab SHALL validate the new password matches the confirm password field
7. WHEN passwords do not match, THE Security_Tab SHALL display inline error "Parolele nu coincid"
8. WHEN a user submits the password change form, THE Settings_Page SHALL send the request to Backend_API
9. WHEN the password change succeeds, THE Settings_Page SHALL display success Toast_Notification and clear all password fields
10. IF the current password is incorrect, THEN THE Settings_Page SHALL display error Toast_Notification "Parola curentă este incorectă"

### Requirement 7: Security Tab - Two-Factor Authentication

**User Story:** As a user, I want to enable two-factor authentication, so that I can add an extra layer of security to my account.

#### Acceptance Criteria

1. THE Security_Tab SHALL display a 2FA toggle switch with label "Autentificare cu doi factori"
2. THE 2FA toggle SHALL be disabled with a "Coming soon" badge (future implementation)
3. THE Security_Tab SHALL display explanatory text "Adaugă un nivel suplimentar de securitate prin cod de verificare"

### Requirement 8: Security Tab - Active Sessions List

**User Story:** As a user, I want to view and manage my active sessions, so that I can monitor account access and revoke unauthorized sessions.

#### Acceptance Criteria

1. THE Security_Tab SHALL display a list of Active_Session records
2. FOR EACH Active_Session, THE Security_Tab SHALL display device name, browser, location, and last active timestamp
3. THE Security_Tab SHALL highlight the current session with a "Sesiune curentă" badge
4. FOR EACH non-current Active_Session, THE Security_Tab SHALL display a "Revocă" button
5. WHEN a user clicks "Revocă", THE Settings_Page SHALL display Confirmation_Modal
6. WHEN the user confirms revocation, THE Settings_Page SHALL revoke the session via Backend_API and remove it from the list

### Requirement 9: Preferences Tab - Language Selection

**User Story:** As a user, I want to select my preferred language, so that the application displays in my chosen language.

#### Acceptance Criteria

1. THE Preferences_Tab SHALL display a language dropdown with options: Română, English, Русский
2. WHEN a user selects a language, THE Settings_Page SHALL enter Dirty_State
3. WHEN the user saves preferences, THE Settings_Page SHALL update the language setting via Backend_API
4. WHEN the language update succeeds, THE Settings_Page SHALL reload the application with the new language

### Requirement 10: Preferences Tab - Currency Selection

**User Story:** As a user, I want to select my preferred currency, so that financial amounts display in my chosen currency.

#### Acceptance Criteria

1. THE Preferences_Tab SHALL display a searchable currency dropdown
2. THE currency dropdown SHALL include common currencies: RON, EUR, USD, GBP, CHF, and others
3. THE currency dropdown SHALL support search/filter by currency code or name
4. WHEN a user selects a currency, THE Settings_Page SHALL enter Dirty_State
5. WHEN the user saves preferences, THE Settings_Page SHALL update the currency setting via Backend_API

### Requirement 11: Preferences Tab - Date Format Selection

**User Story:** As a user, I want to select my preferred date format, so that dates display in my familiar format.

#### Acceptance Criteria

1. THE Preferences_Tab SHALL display three radio button options for date format: DD.MM.YYYY, MM/DD/YYYY, YYYY-MM-DD
2. THE Preferences_Tab SHALL display a preview of the current date in each format
3. WHEN a user selects a date format, THE Settings_Page SHALL enter Dirty_State
4. WHEN the user saves preferences, THE Settings_Page SHALL update the date format setting via Backend_API

### Requirement 12: Preferences Tab - Week Start Day Selection

**User Story:** As a user, I want to select the first day of the week, so that calendars and date pickers align with my cultural preference.

#### Acceptance Criteria

1. THE Preferences_Tab SHALL display two radio button options: Luni (Monday) and Duminică (Sunday)
2. WHEN a user selects a week start day, THE Settings_Page SHALL enter Dirty_State
3. WHEN the user saves preferences, THE Settings_Page SHALL update the week start setting via Backend_API

### Requirement 13: Preferences Tab - Theme Selection

**User Story:** As a user, I want to select my preferred theme, so that the application appearance matches my preference.

#### Acceptance Criteria

1. THE Preferences_Tab SHALL display three radio button options with visual previews: Dark, Light, System
2. THE theme preview SHALL show a miniature representation of the application in each theme
3. WHEN a user selects a theme, THE Settings_Page SHALL immediately apply the theme without requiring save
4. THE Settings_Page SHALL persist the theme selection to Backend_API
5. WHEN "System" is selected, THE Settings_Page SHALL match the operating system theme preference

### Requirement 14: Notifications Tab - Budget Alert Toggles

**User Story:** As a user, I want to configure budget alert notifications, so that I receive timely warnings about my spending.

#### Acceptance Criteria

1. THE Notifications_Tab SHALL display a toggle for "Buget aproape depășit" (budget near limit)
2. THE Notifications_Tab SHALL display a toggle for "Buget depășit" (budget exceeded)
3. WHEN a user toggles a notification setting, THE Settings_Page SHALL immediately save the preference to Backend_API
4. THE Notifications_Tab SHALL display explanatory text for each notification type

### Requirement 15: Notifications Tab - Report Notification Toggles

**User Story:** As a user, I want to configure report notifications, so that I receive regular financial summaries.

#### Acceptance Criteria

1. THE Notifications_Tab SHALL display a toggle for "Raport săptămânal" (weekly report)
2. THE Notifications_Tab SHALL display a toggle for "Raport lunar" (monthly report)
3. WHEN a user toggles a report notification, THE Settings_Page SHALL immediately save the preference to Backend_API
4. THE Notifications_Tab SHALL display the delivery schedule for each report type

### Requirement 16: Data Tab - Export Functionality

**User Story:** As a user, I want to export all my data, so that I can create backups or migrate to another system.

#### Acceptance Criteria

1. THE Data_Tab SHALL display two export buttons: "Export JSON" and "Export CSV"
2. WHEN a user clicks "Export JSON", THE Settings_Page SHALL request all user data from Backend_API in JSON format
3. WHEN a user clicks "Export CSV", THE Settings_Page SHALL request all user data from Backend_API in CSV format
4. WHEN the export completes, THE Settings_Page SHALL trigger a file download with filename "sasha-export-{date}.{format}"
5. THE export SHALL include all transactions, categories, budgets, and user preferences
6. WHILE the export is processing, THE export button SHALL display a loading state

### Requirement 17: Data Tab - Import Functionality

**User Story:** As a user, I want to import data from a JSON file, so that I can restore backups or migrate from another system.

#### Acceptance Criteria

1. THE Data_Tab SHALL display an "Importă date (JSON)" button
2. WHEN a user clicks the import button, THE Settings_Page SHALL open a file picker accepting JSON files
3. WHEN a user selects a JSON file, THE Settings_Page SHALL validate the file structure
4. IF the file structure is invalid, THEN THE Settings_Page SHALL display error Toast_Notification "Fișier invalid. Folosește un export Sasha valid"
5. WHEN the file is valid, THE Settings_Page SHALL display Confirmation_Modal showing import summary (number of transactions, categories, budgets)
6. WHEN the user confirms import, THE Settings_Page SHALL send the data to Backend_API
7. WHEN the import succeeds, THE Settings_Page SHALL display success Toast_Notification and refresh the application data

### Requirement 18: Data Tab - Delete All Transactions

**User Story:** As a user, I want to delete all my transactions, so that I can start fresh while keeping my account and settings.

#### Acceptance Criteria

1. THE Data_Tab SHALL display a Danger_Zone section with red accent color
2. THE Danger_Zone SHALL display a "Șterge toate tranzacțiile" button with destructive styling
3. WHEN a user clicks the delete transactions button, THE Settings_Page SHALL display Confirmation_Modal
4. THE Confirmation_Modal SHALL require the user to type their email address to confirm
5. THE Confirmation_Modal SHALL display warning text "Această acțiune este ireversibilă. Toate tranzacțiile vor fi șterse permanent"
6. WHEN the user types the correct email and confirms, THE Settings_Page SHALL delete all transactions via Backend_API
7. WHEN the deletion succeeds, THE Settings_Page SHALL display success Toast_Notification and refresh the application

### Requirement 19: Data Tab - Delete Account

**User Story:** As a user, I want to delete my account, so that I can permanently remove all my data from the system.

#### Acceptance Criteria

1. THE Danger_Zone SHALL display a "Șterge contul" button with destructive styling
2. WHEN a user clicks the delete account button, THE Settings_Page SHALL display Confirmation_Modal
3. THE Confirmation_Modal SHALL require the user to type their email address to confirm
4. THE Confirmation_Modal SHALL display warning text "Această acțiune este ireversibilă. Contul și toate datele asociate vor fi șterse permanent"
5. WHEN the user types the correct email and confirms, THE Settings_Page SHALL delete the account via Backend_API
6. WHEN the deletion succeeds, THE Settings_Page SHALL log out the user and redirect to the login page

### Requirement 20: Unsaved Changes Banner

**User Story:** As a user, I want to see a notification when I have unsaved changes, so that I don't accidentally lose my modifications.

#### Acceptance Criteria

1. WHEN any form enters Dirty_State, THE Settings_Page SHALL display Unsaved_Changes_Banner at the top of the page
2. THE Unsaved_Changes_Banner SHALL display the message "Ai modificări nesalvate" with a subtle background color
3. THE Unsaved_Changes_Banner SHALL display two buttons: "Salvează" and "Renunță"
4. WHEN a user clicks "Salvează", THE Settings_Page SHALL save the current form
5. WHEN a user clicks "Renunță", THE Settings_Page SHALL reset the form to original values and exit Dirty_State
6. WHEN a user saves or resets the form, THE Settings_Page SHALL hide Unsaved_Changes_Banner

### Requirement 21: Form Validation

**User Story:** As a user, I want to receive clear validation feedback, so that I can correct errors before submitting forms.

#### Acceptance Criteria

1. THE Settings_Page SHALL validate all form fields on blur (when user leaves the field)
2. THE Settings_Page SHALL display validation errors inline below the respective field
3. THE Settings_Page SHALL use red accent color (#FF5A6B) for error messages
4. THE Settings_Page SHALL prevent form submission when validation errors exist
5. THE Settings_Page SHALL display a disabled save button when validation errors exist
6. THE Settings_Page SHALL clear validation errors when the user corrects the field

### Requirement 22: Responsive Layout

**User Story:** As a user, I want the settings page to work well on all devices, so that I can manage my settings from any device.

#### Acceptance Criteria

1. THE Settings_Page SHALL use responsive breakpoints: mobile (<768px), tablet (768px-1200px), desktop (>1200px)
2. ON mobile devices, THE Tab_Navigation SHALL be horizontally scrollable
3. ON mobile devices, THE Form_Card SHALL use full width with appropriate padding
4. ON mobile devices, THE Profile_Tab SHALL stack Prenume and Nume fields vertically
5. ON tablet and desktop devices, THE Form_Card SHALL have max-width 720px and be centered
6. ON tablet and desktop devices, THE Profile_Tab SHALL display Prenume and Nume fields in a horizontal row

### Requirement 23: Design Token Consistency

**User Story:** As a developer, I want the settings page to use the design token system, so that styling is consistent across the application.

#### Acceptance Criteria

1. THE Settings_Page SHALL use color tokens from Design_Token_System (frontend/src/styles/colors.ts)
2. THE Settings_Page SHALL use purple primary accent (#7C5CFF) for primary actions and active states
3. THE Settings_Page SHALL use success color (#00D9C0) for success messages
4. THE Settings_Page SHALL use danger color (#FF5A6B) for error messages and destructive actions
5. THE Settings_Page SHALL use background tokens (bg-base, bg-surface, bg-elevated) for proper visual hierarchy
6. THE Settings_Page SHALL use text tokens (text-primary, text-muted) for proper contrast

### Requirement 24: Toast Notifications

**User Story:** As a user, I want to receive feedback notifications for my actions, so that I know when operations succeed or fail.

#### Acceptance Criteria

1. THE Settings_Page SHALL use Sonner library for Toast_Notification display
2. WHEN a save operation succeeds, THE Settings_Page SHALL display success Toast_Notification with green accent
3. WHEN a save operation fails, THE Settings_Page SHALL display error Toast_Notification with red accent
4. THE Toast_Notification SHALL auto-dismiss after 3 seconds
5. THE Toast_Notification SHALL be dismissible by user click
6. THE Toast_Notification SHALL display in Romanian language

### Requirement 25: Loading States

**User Story:** As a user, I want to see loading indicators during asynchronous operations, so that I know the system is processing my request.

#### Acceptance Criteria

1. WHILE the Settings_Page is fetching user data, THE Settings_Page SHALL display a loading skeleton
2. WHILE a form is submitting, THE save button SHALL display a loading spinner and text "Se salvează..."
3. WHILE an export is processing, THE export button SHALL display a loading spinner
4. WHILE an import is processing, THE Settings_Page SHALL display a loading overlay with progress message
5. THE Settings_Page SHALL disable form inputs during submission to prevent concurrent modifications

### Requirement 26: Keyboard Navigation

**User Story:** As a user, I want to navigate the settings page using keyboard, so that I can efficiently manage settings without a mouse.

#### Acceptance Criteria

1. THE Tab_Navigation SHALL be navigable using arrow keys (left/right)
2. THE Tab_Navigation SHALL support Enter key to activate a tab
3. THE Settings_Page SHALL support Tab key to move between form fields
4. THE Settings_Page SHALL support Escape key to close modals
5. THE save button SHALL be activatable using Enter key when focused

### Requirement 27: Accessibility Compliance

**User Story:** As a user with accessibility needs, I want the settings page to be accessible, so that I can use assistive technologies to manage my settings.

#### Acceptance Criteria

1. THE Settings_Page SHALL use semantic HTML elements (nav, section, form, button)
2. THE Settings_Page SHALL provide aria-labels for icon-only buttons
3. THE Settings_Page SHALL provide aria-live regions for Toast_Notification
4. THE Settings_Page SHALL maintain focus management when opening and closing modals
5. THE Settings_Page SHALL provide sufficient color contrast (WCAG AA standard)
6. THE Settings_Page SHALL support screen reader announcements for form validation errors

### Requirement 28: Error Handling

**User Story:** As a user, I want clear error messages when operations fail, so that I understand what went wrong and how to fix it.

#### Acceptance Criteria

1. WHEN Backend_API returns an error, THE Settings_Page SHALL display the error message in a Toast_Notification
2. WHEN a network error occurs, THE Settings_Page SHALL display "Eroare de conexiune. Verifică conexiunea la internet"
3. WHEN a validation error occurs, THE Settings_Page SHALL display the specific validation message inline
4. WHEN an upload fails, THE Settings_Page SHALL display the reason (file too large, invalid format, etc.)
5. THE Settings_Page SHALL log errors to the browser console for debugging

### Requirement 29: Card Layout Constraints

**User Story:** As a user, I want form fields to be properly sized, so that the interface is comfortable to use and doesn't stretch unnecessarily.

#### Acceptance Criteria

1. THE Form_Card SHALL have max-width 720px
2. THE Form_Card SHALL be centered horizontally on tablet and desktop devices
3. THE Form_Card SHALL have consistent padding of 1.5rem on all sides
4. THE Form_Card SHALL use background color from Design_Token_System (bg-surface)
5. THE Form_Card SHALL have border-radius of 0.75rem

### Requirement 30: Performance Optimization

**User Story:** As a developer, I want the settings page to perform efficiently, so that users have a smooth experience.

#### Acceptance Criteria

1. THE Settings_Page SHALL use React Query for data fetching and caching
2. THE Settings_Page SHALL debounce search inputs in searchable dropdowns by 300ms
3. THE Settings_Page SHALL lazy load tab content (only render active tab)
4. THE Settings_Page SHALL memoize expensive computations using useMemo
5. THE Settings_Page SHALL avoid unnecessary re-renders using React.memo for child components

# Requirements Document

## Introduction

This feature unifies the user experience for delete confirmations and transaction creation across the financial management application. Currently, the application uses inconsistent native browser `window.confirm` dialogs for delete operations and has duplicate implementations of the transaction creation modal in different components. This creates an inconsistent user experience and makes the codebase harder to maintain.

The solution provides:
1. A reusable `DeleteConfirmationModal` component that replaces all native browser confirm dialogs with beautiful, consistent custom modals
2. A unified `AddTransactionModal` component that consolidates duplicate transaction creation logic from Dashboard and Transactions pages

## Glossary

- **DeleteConfirmationModal**: A reusable React component that displays a custom confirmation dialog for delete operations
- **AddTransactionModal**: A reusable React component that provides a form for creating new transactions
- **Transaction**: A financial record with description, amount, type (income/expense), category, and date
- **Category**: A classification for transactions (e.g., "Salariu", "Cumpărături")
- **Budget**: A spending limit set for a specific category and time period
- **Native_Confirm**: The browser's built-in `window.confirm()` dialog
- **UI_System**: The application's design system using Electric Blue (#3B82F6) and Romanian language
- **Toast_Notification**: A temporary notification message displayed to the user

## Requirements

### Requirement 1: Reusable Delete Confirmation Modal Component

**User Story:** As a developer, I want a reusable delete confirmation modal component, so that all delete operations have a consistent appearance and behavior.

#### Acceptance Criteria

1. THE DeleteConfirmationModal SHALL accept props for title, message, item details, warning text, and action callbacks
2. THE DeleteConfirmationModal SHALL display an AlertTriangle icon in the modal header
3. THE DeleteConfirmationModal SHALL render item details passed as a ReactNode prop
4. THE DeleteConfirmationModal SHALL display a warning message if provided
5. THE DeleteConfirmationModal SHALL provide "Anulează" (ghost variant) and a configurable danger button
6. WHEN the user clicks "Anulează", THE DeleteConfirmationModal SHALL call the onClose callback
7. WHEN the user clicks the danger button, THE DeleteConfirmationModal SHALL call the onConfirm callback
8. THE DeleteConfirmationModal SHALL use the existing Modal, Button, and AlertTriangle components
9. THE DeleteConfirmationModal SHALL follow the UI_System design tokens (Electric Blue theme, Romanian text)

### Requirement 2: Individual Transaction Delete Confirmation

**User Story:** As a user, I want to see a beautiful confirmation modal when deleting a transaction, so that I can review the transaction details before confirming deletion.

#### Acceptance Criteria

1. WHEN a user clicks delete on an individual transaction, THE Transactions_Page SHALL display a DeleteConfirmationModal
2. THE DeleteConfirmationModal SHALL have title "Șterge Tranzacție"
3. THE DeleteConfirmationModal SHALL have message "Sigur vrei să ștergi această tranzacție?"
4. THE DeleteConfirmationModal SHALL display transaction details: description, amount, category name, and date
5. THE DeleteConfirmationModal SHALL have buttons "Anulează" and "Șterge Tranzacție"
6. WHEN the user confirms deletion, THE Transactions_Page SHALL delete the transaction and show a Toast_Notification
7. THE Transactions_Page SHALL NOT use Native_Confirm for individual transaction deletion

### Requirement 3: Bulk Transaction Delete Confirmation

**User Story:** As a user, I want to see a confirmation modal when deleting multiple transactions, so that I can review the count and total amount before confirming bulk deletion.

#### Acceptance Criteria

1. WHEN a user clicks bulk delete with N transactions selected, THE Transactions_Page SHALL display a DeleteConfirmationModal
2. THE DeleteConfirmationModal SHALL have title "Șterge Tranzacții"
3. THE DeleteConfirmationModal SHALL have message "Sigur vrei să ștergi {count} tranzacții?"
4. THE DeleteConfirmationModal SHALL display summary details: number of transactions and total amount
5. THE DeleteConfirmationModal SHALL have buttons "Anulează" and "Șterge Toate"
6. WHEN the user confirms deletion, THE Transactions_Page SHALL delete all selected transactions and show a Toast_Notification
7. THE Transactions_Page SHALL NOT use Native_Confirm for bulk transaction deletion

### Requirement 4: Category Delete Confirmation

**User Story:** As a user, I want to see a confirmation modal when deleting a category, so that I understand the impact on associated transactions before confirming deletion.

#### Acceptance Criteria

1. WHEN a user clicks delete on a category, THE Categories_Page SHALL display a DeleteConfirmationModal
2. THE DeleteConfirmationModal SHALL have title "Șterge Categorie"
3. THE DeleteConfirmationModal SHALL have message "Sigur vrei să ștergi această categorie?"
4. THE DeleteConfirmationModal SHALL display category details: name, icon, and type (venit/cheltuială)
5. THE DeleteConfirmationModal SHALL display warning "Tranzacțiile asociate vor rămâne fără categorie"
6. THE DeleteConfirmationModal SHALL have buttons "Anulează" and "Șterge Categorie"
7. WHEN the user confirms deletion, THE Categories_Page SHALL delete the category and show a Toast_Notification
8. THE Categories_Page SHALL NOT use Native_Confirm for category deletion

### Requirement 5: Budget Delete Confirmation

**User Story:** As a user, I want to see a confirmation modal when deleting a budget, so that I can review the budget details before confirming deletion.

#### Acceptance Criteria

1. WHEN a user clicks delete on a budget, THE Budgets_Page SHALL display a DeleteConfirmationModal
2. THE DeleteConfirmationModal SHALL have title "Șterge Buget"
3. THE DeleteConfirmationModal SHALL have message "Sigur vrei să ștergi acest buget?"
4. THE DeleteConfirmationModal SHALL display budget details: category name, amount, and period (month/year)
5. THE DeleteConfirmationModal SHALL have buttons "Anulează" and "Șterge Buget"
6. WHEN the user confirms deletion, THE Budgets_Page SHALL delete the budget and show a Toast_Notification
7. THE Budgets_Page SHALL NOT use Native_Confirm for budget deletion

### Requirement 6: Reusable Add Transaction Modal Component

**User Story:** As a developer, I want a reusable transaction creation modal component, so that the Dashboard and Transactions pages have identical functionality and appearance.

#### Acceptance Criteria

1. THE AddTransactionModal SHALL accept props for isOpen, onClose, and onSuccess callbacks
2. THE AddTransactionModal SHALL provide form fields for description, amount, type, category, and date
3. THE AddTransactionModal SHALL validate that amount is greater than 0
4. THE AddTransactionModal SHALL validate that a category is selected
5. THE AddTransactionModal SHALL validate that date is a valid date
6. THE AddTransactionModal SHALL display validation errors to the user
7. THE AddTransactionModal SHALL have buttons "Anulează" (ghost) and "Salvează" (primary)
8. WHEN the user clicks "Anulează", THE AddTransactionModal SHALL call onClose without saving
9. WHEN the user clicks "Salvează" with valid data, THE AddTransactionModal SHALL create the transaction via API
10. WHEN transaction creation succeeds, THE AddTransactionModal SHALL call onSuccess callback and show Toast_Notification "Tranzacție adăugată cu succes!"
11. WHEN transaction creation fails, THE AddTransactionModal SHALL show Toast_Notification "Eroare la adăugarea tranzacției"
12. THE AddTransactionModal SHALL use existing UI components (Modal, Input, Select, Button)
13. THE AddTransactionModal SHALL follow the UI_System design tokens

### Requirement 7: Dashboard Uses Unified Transaction Modal

**User Story:** As a user, I want the transaction creation experience on the Dashboard to be identical to the Transactions page, so that I have a consistent experience throughout the application.

#### Acceptance Criteria

1. THE Dashboard_Page SHALL use AddTransactionModal for transaction creation
2. THE Dashboard_Page SHALL NOT have its own duplicate transaction modal implementation
3. WHEN a transaction is successfully created from Dashboard, THE Dashboard_Page SHALL refresh statistics and recent transactions
4. THE AddTransactionModal on Dashboard SHALL have identical appearance and behavior to Transactions page

### Requirement 8: Transactions Page Uses Unified Transaction Modal

**User Story:** As a user, I want the transaction creation experience on the Transactions page to use the unified modal, so that any improvements benefit all pages.

#### Acceptance Criteria

1. THE Transactions_Page SHALL use AddTransactionModal for transaction creation
2. THE Transactions_Page SHALL NOT have its own duplicate transaction modal implementation
3. WHEN a transaction is successfully created from Transactions page, THE Transactions_Page SHALL refresh the transactions list
4. THE AddTransactionModal on Transactions page SHALL have identical appearance and behavior to Dashboard

### Requirement 9: Preserve Existing Functionality

**User Story:** As a user, I want all existing features to continue working after the refactoring, so that I don't experience any disruption in my workflow.

#### Acceptance Criteria

1. THE UI_System SHALL maintain all existing delete functionality without breaking changes
2. THE UI_System SHALL maintain all existing transaction creation functionality without breaking changes
3. THE UI_System SHALL maintain all existing validation rules for transactions
4. THE UI_System SHALL maintain all existing API integrations
5. THE UI_System SHALL maintain all existing Toast_Notification behaviors
6. THE UI_System SHALL maintain all existing query invalidation patterns for React Query

### Requirement 10: Consistent Visual Design

**User Story:** As a user, I want all modals to have a consistent visual design, so that the application feels polished and professional.

#### Acceptance Criteria

1. THE DeleteConfirmationModal SHALL use Electric Blue (#3B82F6) accent color
2. THE AddTransactionModal SHALL use Electric Blue (#3B82F6) accent color
3. THE DeleteConfirmationModal SHALL use danger color (#ef4444) for delete buttons
4. THE AddTransactionModal SHALL use consistent spacing, typography, and border radius with existing modals
5. THE DeleteConfirmationModal SHALL use consistent spacing, typography, and border radius with existing modals
6. ALL modal text SHALL be in Romanian language
7. ALL modals SHALL use the existing Modal component's styling and behavior

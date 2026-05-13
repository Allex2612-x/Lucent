# Implementation Plan: Unified Delete Confirmations and Transaction Modal

## Overview

This implementation plan creates two reusable modal components to unify the user experience across the Sasha Finance application:

1. **DeleteConfirmationModal**: Replaces all native `window.confirm()` calls with beautiful, consistent custom modals
2. **AddTransactionModal**: Consolidates duplicate transaction creation logic from Dashboard and Transactions pages

The implementation follows the Electric Blue design system (#3B82F6) with Romanian language throughout, using TypeScript and React.

## Tasks

- [x] 1. Create DeleteConfirmationModal component
  - [x] 1.1 Create component file and define TypeScript interfaces
    - Create `frontend/src/components/ui/DeleteConfirmationModal.tsx`
    - Define `DeleteConfirmationModalProps` interface with all required props
    - Import necessary dependencies (Modal, Button, AlertTriangle from lucide-react)
    - _Requirements: 1.1, 1.8_
  
  - [x] 1.2 Implement DeleteConfirmationModal component structure
    - Implement component function with props destructuring
    - Add Modal wrapper with title, onClose, and footer props
    - Add AlertTriangle icon to modal header
    - Implement modal body with message, itemDetails, and warningText sections
    - _Requirements: 1.2, 1.3, 1.4, 1.9_
  
  - [x] 1.3 Implement modal footer with action buttons
    - Add "Anulează" button (ghost variant) that calls onClose
    - Add configurable danger/primary button that calls onConfirm
    - Implement loading state that disables both buttons
    - Apply design tokens for colors and spacing
    - _Requirements: 1.5, 1.6, 1.7, 1.9_
  
  - [x] 1.4 Apply styling and design tokens
    - Use tokens from `frontend/src/styles/colors.ts` for all colors
    - Apply consistent spacing (1rem padding, 0.75rem gaps)
    - Style item details section with elevated background
    - Style warning text with warning color and icon
    - Ensure proper border radius (0.5rem) and typography
    - _Requirements: 1.9, 10.1, 10.3, 10.4, 10.5_
  
  - [ ]* 1.5 Write unit tests for DeleteConfirmationModal
    - Test rendering with required props
    - Test onClose callback when "Anulează" is clicked
    - Test onConfirm callback when confirm button is clicked
    - Test loading state disables buttons
    - Test optional props (itemDetails, warningText) render correctly
    - Test button variant customization
    - _Requirements: 1.1-1.9_
  
  - [x] 1.6 Export DeleteConfirmationModal from ui/index.ts
    - Add export statement to `frontend/src/components/ui/index.ts`
    - _Requirements: 1.8_

- [x] 2. Create AddTransactionModal component
  - [x] 2.1 Create component file and define TypeScript interfaces
    - Create `frontend/src/components/ui/AddTransactionModal.tsx`
    - Define `AddTransactionModalProps` interface (isOpen, onClose, onSuccess)
    - Define `TransactionFormData` interface for form state
    - Define `FormErrors` interface for validation errors
    - Import necessary dependencies (Modal, Button, Input, Select, React Query, services)
    - _Requirements: 6.1, 6.12_
  
  - [x] 2.2 Implement form state management
    - Initialize formData state with default values (empty description, 0 amount, 'expense' type, empty categoryId, today's date)
    - Initialize errors state for validation messages
    - Implement handleClose function that resets form and calls onClose
    - Implement field change handlers for all form inputs
    - _Requirements: 6.2, 6.13_
  
  - [x] 2.3 Integrate React Query for categories and transaction creation
    - Add useQuery hook to fetch categories from categoriesService
    - Filter categories by transaction type (income/expense)
    - Add useMutation hook for transaction creation via transactionsService
    - Implement onSuccess callback that invalidates queries, shows toast, calls onSuccess, and closes modal
    - Implement onError callback that shows error toast
    - _Requirements: 6.9, 6.10, 6.11, 9.4, 9.6_
  
  - [x] 2.4 Implement form validation logic
    - Validate description: required, minimum 2 characters
    - Validate amount: required, must be greater than 0
    - Validate categoryId: required
    - Validate date: required, valid date format
    - Display inline error messages below each field with danger color
    - Prevent form submission if validation errors exist
    - _Requirements: 6.3, 6.4, 6.5, 6.6_
  
  - [x] 2.5 Implement modal UI with form fields
    - Add Modal wrapper with title "Adaugă Tranzacție"
    - Add description Input field with placeholder "Descriere tranzacție"
    - Add amount Input field (type number) with placeholder "0.00" and "RON" suffix
    - Add type Select field with options "Cheltuială" and "Venit"
    - Add category Select field filtered by transaction type, showing icon + name
    - Add date Input field (type date) with default value of today
    - Apply 1rem vertical spacing between fields
    - _Requirements: 6.2, 6.12, 6.13_
  
  - [x] 2.6 Implement modal footer with action buttons
    - Add "Anulează" button (ghost variant) that calls handleClose
    - Add "Salvează" button (primary variant) that submits form
    - Disable buttons and show loading state during mutation
    - Apply 0.75rem gap between buttons
    - _Requirements: 6.7, 6.8, 6.13_
  
  - [x] 2.7 Apply styling and design tokens
    - Use tokens from `frontend/src/styles/colors.ts` for all colors
    - Apply consistent spacing and typography
    - Style error messages with accent-danger color
    - Ensure proper border radius and padding
    - _Requirements: 6.13, 10.2, 10.4, 10.5, 10.6_
  
  - [ ]* 2.8 Write unit tests for AddTransactionModal
    - Test rendering with all form fields
    - Test validation errors for each field (empty description, amount <= 0, missing category, invalid date)
    - Test form submission with valid data
    - Test category filtering by transaction type
    - Test onClose callback when "Anulează" is clicked
    - Test onSuccess callback after successful creation
    - Test toast notifications on success and error
    - _Requirements: 6.1-6.13_
  
  - [x] 2.9 Export AddTransactionModal from ui/index.ts
    - Add export statement to `frontend/src/components/ui/index.ts`
    - _Requirements: 6.12_

- [ ] 3. Checkpoint - Ensure components are created and tested
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Integrate DeleteConfirmationModal in Transactions page
  - [x] 4.1 Add state management for individual transaction deletion
    - Add `deleteModalOpen` state (boolean)
    - Add `transactionToDelete` state (Transaction | null)
    - Implement `handleDeleteClick` function that sets transaction and opens modal
    - Implement `handleConfirmDelete` function that calls deleteMutation and closes modal
    - _Requirements: 2.1, 2.7, 9.1_
  
  - [x] 4.2 Replace individual transaction window.confirm with DeleteConfirmationModal
    - Remove existing `window.confirm` call from handleDelete function
    - Add DeleteConfirmationModal component to JSX
    - Set title to "Șterge Tranzacție"
    - Set message to "Sigur vrei să ștergi această tranzacție?"
    - Pass transaction details (description, amount, category name, date) as itemDetails
    - Set confirmButtonText to "Șterge Tranzacție"
    - Pass deleteMutation.isPending as isLoading prop
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7_
  
  - [x] 4.3 Add state management for bulk transaction deletion
    - Add `bulkDeleteModalOpen` state (boolean)
    - Implement `handleBulkDeleteClick` function that opens modal
    - Implement `handleConfirmBulkDelete` function that deletes all selected transactions
    - Calculate total amount of selected transactions for display
    - _Requirements: 3.1, 3.7, 9.1_
  
  - [x] 4.4 Replace bulk transaction window.confirm with DeleteConfirmationModal
    - Remove existing `window.confirm` call from bulk delete handler
    - Add second DeleteConfirmationModal component to JSX for bulk delete
    - Set title to "Șterge Tranzacții"
    - Set message to "Sigur vrei să ștergi {count} tranzacții?" with dynamic count
    - Pass summary details (number of transactions, total amount) as itemDetails
    - Set confirmButtonText to "Șterge Toate"
    - Pass bulkDeleteMutation.isPending as isLoading prop
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_
  
  - [ ]* 4.5 Write integration tests for Transactions page delete flows
    - Test individual transaction deletion opens modal with correct details
    - Test bulk transaction deletion opens modal with correct count and total
    - Test successful deletion updates transaction list
    - Test toast notifications appear after deletion
    - _Requirements: 2.1-2.7, 3.1-3.7_

- [x] 5. Integrate DeleteConfirmationModal in Categories page
  - [x] 5.1 Add state management for category deletion
    - Add `deleteModalOpen` state (boolean)
    - Add `categoryToDelete` state (Category | null)
    - Implement `handleDeleteClick` function that sets category and opens modal
    - Implement `handleConfirmDelete` function that calls deleteMutation and closes modal
    - _Requirements: 4.1, 4.8, 9.1_
  
  - [x] 5.2 Replace category window.confirm with DeleteConfirmationModal
    - Remove existing `window.confirm` call from handleDeleteClick function
    - Add DeleteConfirmationModal component to JSX
    - Set title to "Șterge Categorie"
    - Set message to "Sigur vrei să ștergi această categorie?"
    - Pass category details (name, icon, type) as itemDetails
    - Set warningText to "Tranzacțiile asociate vor rămâne fără categorie"
    - Set confirmButtonText to "Șterge Categorie"
    - Pass deleteMutation.isPending as isLoading prop
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8_
  
  - [ ]* 5.3 Write integration tests for Categories page delete flow
    - Test category deletion opens modal with correct details
    - Test warning message is displayed
    - Test successful deletion updates category list
    - Test toast notification appears after deletion
    - _Requirements: 4.1-4.8_

- [x] 6. Integrate DeleteConfirmationModal in Budgets page
  - [x] 6.1 Add state management for budget deletion
    - Add `deleteModalOpen` state (boolean)
    - Add `budgetToDelete` state (Budget | null)
    - Implement `handleDeleteClick` function that sets budget and opens modal
    - Implement `handleConfirmDelete` function that calls deleteMutation and closes modal
    - _Requirements: 5.1, 5.7, 9.1_
  
  - [x] 6.2 Replace budget window.confirm with DeleteConfirmationModal
    - Remove existing `window.confirm` call from onDelete handler
    - Add DeleteConfirmationModal component to JSX
    - Set title to "Șterge Buget"
    - Set message to "Sigur vrei să ștergi acest buget?"
    - Pass budget details (category name, amount, period) as itemDetails
    - Set confirmButtonText to "Șterge Buget"
    - Pass deleteMutation.isPending as isLoading prop
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_
  
  - [ ]* 6.3 Write integration tests for Budgets page delete flow
    - Test budget deletion opens modal with correct details
    - Test successful deletion updates budget list
    - Test toast notification appears after deletion
    - _Requirements: 5.1-5.7_

- [ ] 7. Checkpoint - Ensure DeleteConfirmationModal is integrated in all pages
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Integrate AddTransactionModal in Dashboard page
  - [x] 8.1 Remove duplicate transaction modal implementation from Dashboard
    - Remove local formData state management
    - Remove local form validation logic
    - Remove local createMutation implementation
    - Remove local Modal JSX with form fields
    - Keep only isAddModalOpen state
    - _Requirements: 7.2, 9.2_
  
  - [x] 8.2 Import and use AddTransactionModal in Dashboard
    - Import AddTransactionModal from '../../components/ui'
    - Add AddTransactionModal component to JSX
    - Pass isAddModalOpen as isOpen prop
    - Pass setIsAddModalOpen(false) as onClose callback
    - Pass setIsAddModalOpen(false) as onSuccess callback (modal handles cache invalidation)
    - _Requirements: 7.1, 7.3, 7.4_
  
  - [ ]* 8.3 Write integration tests for Dashboard transaction creation
    - Test clicking "Adaugă Tranzacție" opens modal
    - Test successful transaction creation updates statistics and recent transactions
    - Test modal appearance matches Transactions page
    - _Requirements: 7.1-7.4_

- [x] 9. Integrate AddTransactionModal in Transactions page
  - [x] 9.1 Remove duplicate transaction modal implementation from Transactions
    - Remove local formData state management
    - Remove local form validation logic
    - Remove local createMutation implementation
    - Remove local Modal JSX with form fields
    - Keep only isAddModalOpen state
    - _Requirements: 8.2, 9.2_
  
  - [x] 9.2 Import and use AddTransactionModal in Transactions
    - Import AddTransactionModal from '../../components/ui'
    - Add AddTransactionModal component to JSX
    - Pass isAddModalOpen as isOpen prop
    - Pass setIsAddModalOpen(false) as onClose callback
    - Pass setIsAddModalOpen(false) as onSuccess callback (modal handles cache invalidation)
    - _Requirements: 8.1, 8.3, 8.4_
  
  - [ ]* 9.3 Write integration tests for Transactions page transaction creation
    - Test clicking "Adaugă Tranzacție" opens modal
    - Test successful transaction creation updates transaction list
    - Test modal appearance matches Dashboard page
    - _Requirements: 8.1-8.4_

- [x] 10. Final validation and cleanup
  - [x] 10.1 Verify all window.confirm calls are removed
    - Search codebase for remaining `window.confirm` calls in Transactions, Dashboard, Categories, and Budgets pages
    - Ensure all have been replaced with DeleteConfirmationModal
    - _Requirements: 2.7, 3.7, 4.8, 5.7_
  
  - [x] 10.2 Verify design token usage across all modals
    - Check DeleteConfirmationModal uses correct colors from tokens
    - Check AddTransactionModal uses correct colors from tokens
    - Verify Electric Blue (#3B82F6) is used for primary actions
    - Verify danger color (#ef4444) is used for delete buttons
    - Verify consistent spacing, typography, and border radius
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_
  
  - [x] 10.3 Verify Romanian language throughout
    - Check all modal titles are in Romanian
    - Check all button labels are in Romanian
    - Check all validation messages are in Romanian
    - Check all toast notifications are in Romanian
    - _Requirements: 10.6, 10.7_
  
  - [x] 10.4 Verify existing functionality is preserved
    - Test all delete operations work correctly
    - Test all transaction creation works correctly
    - Test all validation rules are maintained
    - Test all API integrations work correctly
    - Test all toast notifications appear correctly
    - Test all React Query cache invalidations work correctly
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_
  
  - [ ]* 10.5 Run full test suite
    - Run all unit tests for DeleteConfirmationModal
    - Run all unit tests for AddTransactionModal
    - Run all integration tests for page integrations
    - Verify 90%+ test coverage for new components
    - _Requirements: All requirements_

- [ ] 11. Final checkpoint - Ensure all tests pass and feature is complete
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- The implementation follows the 6-phase plan from the design document
- All modals use TypeScript with React (TSX)
- All modals follow the Electric Blue design system (#3B82F6)
- All text is in Romanian language
- DeleteConfirmationModal replaces 4 window.confirm calls (individual transaction, bulk transaction, category, budget)
- AddTransactionModal consolidates 2 duplicate implementations (Dashboard, Transactions)

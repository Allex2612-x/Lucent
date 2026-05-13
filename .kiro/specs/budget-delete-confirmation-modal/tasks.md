# Implementation Plan: Budget Delete Confirmation Modal

## Overview

This implementation replaces the native `window.confirm` dialog with a custom confirmation modal for budget deletion. The modal will display budget details, provide clear action buttons, and maintain visual consistency with the Electric Blue design system. Implementation involves state management updates, handler refactoring, modal JSX creation, and comprehensive testing.

## Tasks

- [ ] 1. Set up modal state management and import dependencies
  - Add `isDeleteModalOpen` state variable (boolean) after existing state declarations
  - Add `budgetToDelete` state variable (Budget | null) to store selected budget
  - Import `AlertTriangle` icon from lucide-react
  - Import `tokens` from `../../styles/colors`
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [ ] 2. Refactor delete handler functions
  - [ ] 2.1 Refactor `handleDeleteClick` function
    - Change parameter from `id: string` to `budget: Budget`
    - Remove `window.confirm` call (line 336)
    - Set `budgetToDelete` to the passed budget object
    - Set `isDeleteModalOpen` to true
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 9.1, 9.2, 9.4_
  
  - [ ] 2.2 Create `handleConfirmDelete` function
    - Validate `budgetToDelete` exists
    - Execute `deleteMutation.mutate(budgetToDelete.id)`
    - Set `isDeleteModalOpen` to false
    - Reset `budgetToDelete` to null
    - _Requirements: 4.5, 4.6, 5.5, 9.3, 9.5_
  
  - [ ] 2.3 Create `handleCancelDelete` function
    - Set `isDeleteModalOpen` to false
    - Reset `budgetToDelete` to null
    - _Requirements: 4.3, 4.4, 5.1, 5.2, 5.3, 5.4_

- [ ] 3. Update BudgetCard component integration
  - Modify `onDelete` prop call in BudgetCard component (line 127)
  - Change from `onDelete(budget.id)` to `onDelete(budget)`
  - Pass full Budget object instead of just ID
  - Update BudgetCard props type signature if needed
  - _Requirements: 2.1, 2.2, 2.3_

- [ ] 4. Implement delete confirmation modal JSX
  - [ ] 4.1 Create Modal wrapper component
    - Add Modal component after main budgets content (before closing div)
    - Set `isOpen={isDeleteModalOpen}`
    - Set `onClose={handleCancelDelete}`
    - Set `title="Șterge Buget"`
    - _Requirements: 1.3, 1.4, 3.1, 6.1_
  
  - [ ] 4.2 Implement modal footer with action buttons
    - Create "Anulează" button with `variant="ghost"` and `onClick={handleCancelDelete}`
    - Create "Șterge Buget" button with `variant="danger"` and `onClick={handleConfirmDelete}`
    - Disable both buttons when `deleteMutation.isPending` is true
    - Show "Se șterge..." text on delete button during pending state
    - _Requirements: 4.1, 4.2, 4.3, 4.5, 4.7, 4.8, 6.2, 6.5_
  
  - [ ] 4.3 Implement warning alert section
    - Create alert container with warning background color `rgba(245, 158, 11, 0.1)`
    - Add AlertTriangle icon with size 24 and color `#F59E0B`
    - Add aria-label "Avertizare" to icon
    - Display confirmation message "Sigur vrei să ștergi acest buget?"
    - Display warning text "Această acțiune nu poate fi anulată."
    - Use `tokens['text-primary']` for primary text
    - Use `tokens['text-muted']` for secondary text
    - _Requirements: 3.2, 3.3, 3.7, 3.8, 3.9, 6.7, 8.5_
  
  - [ ] 4.4 Implement budget details display section
    - Create details container with `tokens['bg-elevated']` background
    - Add border using `tokens['border-default']`
    - Display "Perioadă:" label with month name and year
    - Use `getMonthName(budgetToDelete.month)` helper function
    - Display "Limită totală:" label with formatted amount
    - Format totalLimit as "X.XX RON" using `toFixed(2)`
    - Use `tokens['text-muted']` for labels
    - Use `tokens['text-primary']` for values
    - _Requirements: 3.4, 3.5, 3.6, 3.8, 3.9, 6.3, 6.4, 10.1, 10.2, 10.3, 10.4, 10.5_
  
  - [ ] 4.5 Implement error display section
    - Conditionally render error message when `deleteMutation.isError` is true
    - Use `tokens['accent-danger-soft']` for background
    - Use `tokens['accent-danger']` for border and text color
    - Display error message "Eroare la ștergerea bugetului. Încearcă din nou."
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 5. Checkpoint - Verify modal functionality
  - Ensure all tests pass, ask the user if questions arise.
  - Manually test modal open/close behavior
  - Verify budget details display correctly
  - Test delete and cancel actions
  - Check error handling displays properly

- [ ] 6. Implement accessibility features
  - Verify Modal component handles focus trap automatically
  - Verify Escape key closes modal (handled by Modal component)
  - Verify keyboard navigation works for all buttons
  - Test with screen reader to ensure proper announcements
  - Verify AlertTriangle icon has aria-label
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ]* 7. Write unit tests for state management
  - [ ]* 7.1 Test modal opens when handleDeleteClick is called
    - Render Budgets component
    - Call handleDeleteClick with mock budget
    - Assert isDeleteModalOpen is true and budgetToDelete is set
    - _Requirements: 1.1, 1.2, 1.3, 1.5, 2.2, 2.3_
  
  - [ ]* 7.2 Test modal closes when handleCancelDelete is called
    - Open modal with budget
    - Call handleCancelDelete
    - Assert isDeleteModalOpen is false and budgetToDelete is null
    - _Requirements: 5.1, 5.4_
  
  - [ ]* 7.3 Test state resets after successful deletion
    - Open modal with budget
    - Call handleConfirmDelete with successful mutation mock
    - Assert modal closes and state resets
    - _Requirements: 4.6, 5.5_
  
  - [ ]* 7.4 Test modal remains open after deletion error
    - Open modal with budget
    - Call handleConfirmDelete with failed mutation mock
    - Assert modal remains open and error displays
    - _Requirements: 7.1, 7.2_

- [ ]* 8. Write unit tests for modal content display
  - [ ]* 8.1 Test correct budget month and year display
    - Set budgetToDelete with specific month/year
    - Render modal
    - Assert Romanian month name and year are displayed
    - _Requirements: 3.4, 3.5, 10.1, 10.2, 10.3, 10.4, 10.5_
  
  - [ ]* 8.2 Test formatted budget limit display
    - Set budgetToDelete with totalLimit value
    - Render modal
    - Assert limit displays as "X.XX RON" format
    - _Requirements: 3.6_
  
  - [ ]* 8.3 Test AlertTriangle icon styling
    - Render modal
    - Assert icon present with size 24 and color #F59E0B
    - Assert aria-label "Avertizare" is present
    - _Requirements: 3.2, 6.7, 8.5_
  
  - [ ]* 8.4 Test error message display on mutation failure
    - Mock failed mutation
    - Render modal
    - Assert error message displays with correct styling
    - _Requirements: 7.2, 7.3, 7.4_

- [ ]* 9. Write unit tests for button interactions
  - [ ]* 9.1 Test Cancel button calls handleCancelDelete
    - Render modal with mock handler
    - Click "Anulează" button
    - Assert handleCancelDelete called once
    - _Requirements: 4.1, 4.3_
  
  - [ ]* 9.2 Test Delete button calls handleConfirmDelete
    - Render modal with mock handler
    - Click "Șterge Buget" button
    - Assert handleConfirmDelete called once
    - _Requirements: 4.2, 4.5_
  
  - [ ]* 9.3 Test buttons disabled during deletion
    - Mock pending mutation state
    - Render modal
    - Assert both buttons are disabled
    - _Requirements: 4.7_
  
  - [ ]* 9.4 Test loading text during deletion
    - Mock pending mutation state
    - Render modal
    - Assert button text is "Se șterge..."
    - _Requirements: 4.8_

- [ ]* 10. Write unit tests for accessibility
  - [ ]* 10.1 Test Escape key closes modal
    - Open modal
    - Press Escape key
    - Assert modal closes
    - _Requirements: 8.2_
  
  - [ ]* 10.2 Test focus trap within modal
    - Open modal
    - Tab through elements
    - Assert focus cycles within modal
    - _Requirements: 8.1_
  
  - [ ]* 10.3 Test aria-label on AlertTriangle icon
    - Render modal
    - Query icon element
    - Assert aria-label="Avertizare" is present
    - _Requirements: 8.5_
  
  - [ ]* 10.4 Test keyboard navigation for buttons
    - Render modal
    - Tab to each button
    - Assert buttons are focusable
    - _Requirements: 8.3, 8.4_

- [ ]* 11. Write integration tests for delete flow
  - [ ]* 11.1 Test complete successful deletion flow
    - Render Budgets component with mock API
    - Click delete button on budget card
    - Verify modal opens with correct data
    - Click "Șterge Buget"
    - Wait for API call completion
    - Assert API called with correct budget ID
    - Assert modal closes
    - Assert budget removed from list
    - _Requirements: 2.1, 2.2, 2.3, 4.5, 4.6, 5.5, 9.5_
  
  - [ ]* 11.2 Test deletion error handling flow
    - Render Budgets with failing mock API
    - Click delete button
    - Click "Șterge Buget"
    - Wait for error
    - Assert error message displays
    - Assert modal remains open
    - Assert budget still in list
    - Assert retry button enabled
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_
  
  - [ ]* 11.3 Test cancellation flow without API call
    - Render Budgets component
    - Click delete button
    - Click "Anulează"
    - Assert no API call made
    - Assert modal closes
    - Assert budget remains in list
    - _Requirements: 4.3, 4.4, 5.1, 5.2, 5.3, 5.4_

- [ ] 12. Final checkpoint and code cleanup
  - Ensure all tests pass, ask the user if questions arise.
  - Verify no `window.confirm` references remain in code
  - Check TypeScript types are correct
  - Verify no console errors
  - Test responsive design on mobile viewport
  - Verify visual design matches design tokens
  - Test in Chrome, Firefox, and Safari

## Notes

- Tasks marked with `*` are optional testing tasks and can be skipped for faster MVP
- Each task references specific requirements for traceability
- The implementation uses TypeScript/React with existing UI components (Modal, Button)
- Design tokens from `frontend/src/styles/colors.ts` ensure visual consistency
- Modal component handles focus management and keyboard navigation automatically
- React Query's `deleteMutation` handles API calls and loading states
- No backend changes required - this is a frontend-only enhancement

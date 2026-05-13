# Implementation Plan: Budget Validation and Recurring Transactions

## Overview

This implementation plan breaks down the budget validation and recurring transactions feature into discrete, actionable tasks. The implementation follows a logical order: database schema changes, backend services, frontend UI components, and integration. Each task builds on previous work to ensure incremental progress and early validation.

## Tasks

- [x] 1. Database schema migration for recurring transaction fields
  - Add new fields to Transaction model: `recurringGroupId`, `frequency`, `originalStartDate`, `sequenceNumber`
  - Create database indexes for `userId + recurringGroupId` and `userId + date`
  - Run Prisma migration to apply schema changes
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

- [x] 2. Implement date validation service
  - [x] 2.1 Create DateValidator utility class
    - Implement `isFutureDate()` method to check if date is after current date
    - Implement timezone-aware date comparison
    - Export DateValidator from shared utilities
    - _Requirements: 2.1, 2.2, 2.6_
  
  - [ ]* 2.2 Write unit tests for DateValidator
    - Test future date detection
    - Test current date (should pass)
    - Test past date (should pass)
    - Test timezone handling edge cases
    - _Requirements: 2.1, 2.6_

- [x] 3. Implement recurring transaction engine
  - [x] 3.1 Create RecurringTransactionEngine service
    - Implement `generateInstances()` method to create transaction instances
    - Implement date calculation for daily frequency (1 day increments)
    - Implement date calculation for weekly frequency (7 day increments)
    - Implement date calculation for monthly frequency (preserve day of month)
    - Implement date calculation for yearly frequency (preserve month and day)
    - Handle edge cases: Feb 29 in non-leap years, month-end dates
    - Assign unique `recurringGroupId` (UUID) to all instances
    - Assign sequential `sequenceNumber` starting from 1
    - Set `isRecurring` flag to true for all instances
    - _Requirements: 3.7, 3.8, 3.9, 3.10, 3.11, 3.12, 3.13, 3.14, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_
  
  - [ ]* 3.2 Write unit tests for RecurringTransactionEngine
    - Test daily frequency calculation
    - Test weekly frequency calculation
    - Test monthly frequency with standard dates
    - Test monthly frequency with month-end dates (Jan 31 → Feb 28/29)
    - Test yearly frequency with standard dates
    - Test yearly frequency with Feb 29 in leap/non-leap years
    - Test sequence number assignment
    - Test recurring group ID assignment
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_

- [x] 4. Implement budget validation service
  - [x] 4.1 Create BudgetValidator service
    - Implement `checkBudget()` method to validate transaction against budget
    - Query budget for matching category, month, and year
    - Calculate current spent amount for category/month
    - Calculate new total: current spent + new transaction amount
    - Return warning data if new total exceeds budget limit
    - Skip validation for income transactions
    - Skip validation if no budget exists
    - _Requirements: 1.1, 1.2, 1.9, 1.10_
  
  - [x] 4.2 Implement budget validation for recurring transactions
    - Check each transaction instance against its respective month's budget
    - Collect all months where budget would be exceeded
    - Return aggregated warning data with affected months
    - _Requirements: 7.1, 7.2, 7.3, 7.4_
  
  - [ ]* 4.3 Write unit tests for BudgetValidator
    - Test budget check with no budget (should pass)
    - Test budget check with budget not exceeded (should pass)
    - Test budget check with budget exceeded (should return warning)
    - Test budget check for income transactions (should skip)
    - Test budget check for recurring transactions (multiple months)
    - _Requirements: 1.1, 1.9, 1.10, 7.1_

- [x] 5. Update transaction service and controller
  - [x] 5.1 Update transaction validation schema
    - Add `frequency` field to schema (enum: daily, weekly, monthly, yearly)
    - Add `repetitionCount` field to schema (integer, min 1, max 365)
    - Add validation rule: if `isRecurring` is true, `frequency` and `repetitionCount` are required
    - Update error messages in Romanian
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 8.1, 8.2, 8.3, 8.4_
  
  - [x] 5.2 Update transaction creation endpoint
    - Integrate DateValidator to check for future dates
    - Allow future dates if `isRecurring` is true
    - Integrate BudgetValidator for expense transactions
    - Return 409 Conflict with warning data if budget exceeded
    - Support `force=true` query parameter to bypass budget warning
    - Integrate RecurringTransactionEngine for recurring transactions
    - Use Prisma transaction for atomic batch creation
    - Implement rollback on partial failure
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 1.1, 1.2, 1.7, 1.8, 3.7, 7.5, 7.6, 11.2, 11.3_
  
  - [x] 5.3 Update transaction deletion endpoint
    - Add `deleteFuture` query parameter (boolean)
    - If `deleteFuture=true`, delete selected transaction and all future instances in same recurring group
    - If `deleteFuture=false`, delete only the selected transaction
    - Query transactions by `recurringGroupId` and filter by date >= selected transaction date
    - _Requirements: 6.3, 6.4_
  
  - [ ]* 5.4 Write integration tests for transaction endpoints
    - Test single transaction creation
    - Test recurring transaction creation (all frequencies)
    - Test budget validation flow (reject → confirm → create)
    - Test date validation rejection
    - Test recurring transaction deletion (single and future)
    - _Requirements: 3.7, 1.1, 2.1, 6.3, 6.4_

- [ ] 6. Checkpoint - Ensure backend tests pass
  - Run all backend unit tests and integration tests
  - Verify database migrations applied successfully
  - Ensure all tests pass, ask the user if questions arise

- [x] 7. Create BudgetWarningModal component
  - [x] 7.1 Implement BudgetWarningModal UI component
    - Create modal component with title "Atenție: Buget Depășit"
    - Display warning icon using accent-warning color (#FFB547)
    - Display budget information: current spent, budget limit, new total, overage
    - Display affected months list for recurring transactions
    - Add "Confirmă" button (Electric Blue, #3B82F6)
    - Add "Anulează" button (ghost variant)
    - Follow existing modal design patterns
    - Ensure WCAG AA color contrast compliance
    - _Requirements: 1.3, 1.4, 1.5, 1.6, 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7, 7.3, 7.4_
  
  - [ ]* 7.2 Write unit tests for BudgetWarningModal
    - Test budget data display
    - Test confirm button action
    - Test cancel button action
    - Test multiple months display for recurring transactions
    - _Requirements: 1.3, 1.4, 1.5, 1.6, 7.3_

- [x] 8. Update AddTransactionModal component
  - [x] 8.1 Add recurring transaction form fields
    - Add "Tranzacție recurentă" checkbox
    - Add frequency dropdown (Zilnic, Săptămânal, Lunar, Anual)
    - Add repetition count input field
    - Show/hide frequency and repetition fields based on checkbox state
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_
  
  - [x] 8.2 Implement form validation for recurring fields
    - Validate frequency is selected when recurring checkbox is checked
    - Validate repetition count is provided and between 1-365
    - Display validation errors in red (accent-danger color)
    - Prevent form submission when validation errors exist
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_
  
  - [x] 8.3 Integrate BudgetWarningModal
    - Handle 409 Conflict response from API
    - Extract budget warning data from error response
    - Display BudgetWarningModal when budget exceeded
    - On confirm, retry API call with `force=true` parameter
    - On cancel, keep AddTransactionModal open with user input preserved
    - _Requirements: 1.2, 1.7, 1.8, 7.5, 7.6, 11.5_
  
  - [x] 8.4 Implement date validation error handling
    - Handle 400 DateValidationError response
    - Display error message "Nu poți adăuga tranzacții cu date din viitor"
    - Keep form open with user input preserved
    - _Requirements: 2.2, 2.3, 11.5_
  
  - [x] 8.5 Add loading indicator for recurring transactions
    - Display loading state during transaction creation
    - Show text "Se creează tranzacțiile recurente..." for recurring transactions
    - Disable form inputs during loading
    - _Requirements: 10.4, 10.5_
  
  - [ ]* 8.6 Write unit tests for AddTransactionModal
    - Test recurring checkbox toggle
    - Test form validation for recurring fields
    - Test budget warning modal trigger
    - Test date validation error display
    - Test form reset on close
    - _Requirements: 3.1, 3.6, 8.5, 1.2, 2.2_

- [x] 9. Update DeleteConfirmationModal component
  - [x] 9.1 Add recurring transaction detection
    - Check `isRecurring` flag on transaction
    - Display different modal content for recurring vs non-recurring transactions
    - _Requirements: 6.1, 6.5_
  
  - [x] 9.2 Implement recurring deletion options
    - Add "Șterge doar această tranzacție" button
    - Add "Șterge această tranzacție și toate viitoare" button
    - Display transaction description and amount for context
    - On "single" delete, call DELETE endpoint without query parameter
    - On "future" delete, call DELETE endpoint with `deleteFuture=true`
    - _Requirements: 6.2, 6.3, 6.4, 6.6_
  
  - [ ]* 9.3 Write unit tests for DeleteConfirmationModal
    - Test recurring transaction detection
    - Test single delete option
    - Test future delete option
    - Test non-recurring transaction (standard confirmation)
    - _Requirements: 6.1, 6.2, 6.5_

- [x] 10. Add visual indicators for recurring transactions
  - [x] 10.1 Update transaction list component
    - Add recurring transaction icon/badge near description
    - Use Electric Blue color (#3B82F6) for indicator
    - Add tooltip on hover showing frequency and group info
    - Display tooltip text in Romanian (e.g., "Tranzacție recurentă - Lunar")
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_
  
  - [ ]* 10.2 Write unit tests for transaction list visual indicators
    - Test recurring indicator display
    - Test tooltip content
    - Test non-recurring transactions (no indicator)
    - _Requirements: 5.1, 5.2, 5.4_

- [x] 11. Update React Query integration
  - [x] 11.1 Update transaction service types
    - Add `RecurringFrequency` type
    - Add recurring fields to `Transaction` interface
    - Add recurring fields to `CreateTransactionRequest` interface
    - Add `BudgetWarning` interface
    - Add `DeleteRecurringOptions` interface
    - _Requirements: 3.1, 3.2, 3.3, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_
  
  - [x] 11.2 Update transaction API service methods
    - Update `create()` method to accept recurring parameters
    - Update `delete()` method to accept `deleteFuture` parameter
    - Handle 409 Conflict response for budget warnings
    - _Requirements: 3.7, 6.3, 6.4, 1.2_
  
  - [x] 11.3 Update React Query cache invalidation
    - Invalidate transactions query after creation
    - Invalidate statistics query after creation
    - Invalidate budget query after transaction creation
    - _Requirements: 1.1, 3.7_

- [ ] 12. Checkpoint - Ensure frontend tests pass
  - Run all frontend unit tests
  - Verify all components render correctly
  - Test form validation and error handling
  - Ensure all tests pass, ask the user if questions arise

- [ ] 13. End-to-end integration testing
  - [ ]* 13.1 Test single transaction creation flow
    - Create expense transaction
    - Verify budget validation triggers when exceeded
    - Verify date validation rejects future dates
    - _Requirements: 1.1, 2.1_
  
  - [ ]* 13.2 Test recurring transaction creation flow
    - Create recurring transaction with each frequency
    - Verify correct number of instances created
    - Verify dates calculated correctly
    - Verify recurring group ID assigned
    - Verify sequence numbers assigned
    - _Requirements: 3.7, 3.8, 3.9, 3.10, 3.11, 4.5, 4.6_
  
  - [ ]* 13.3 Test budget validation for recurring transactions
    - Create recurring expense that exceeds budget in multiple months
    - Verify warning modal shows affected months
    - Verify confirm creates all instances
    - Verify cancel prevents creation
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_
  
  - [ ]* 13.4 Test recurring transaction deletion flow
    - Delete single instance of recurring transaction
    - Verify only selected instance deleted
    - Delete future instances of recurring transaction
    - Verify selected and future instances deleted
    - _Requirements: 6.3, 6.4_
  
  - [ ]* 13.5 Test visual indicators
    - Verify recurring transactions display indicator
    - Verify tooltip shows correct information
    - Verify non-recurring transactions have no indicator
    - _Requirements: 5.1, 5.2, 5.4, 5.5_

- [ ] 14. Final checkpoint - Complete feature validation
  - Run full test suite (backend + frontend)
  - Verify all acceptance criteria met
  - Test performance with maximum repetition counts (365)
  - Verify error handling and rollback mechanisms
  - Ensure all tests pass, ask the user if questions arise

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at logical breaks
- The implementation uses TypeScript throughout (frontend and backend)
- Database changes use Prisma migrations for schema management
- All UI text is in Romanian as per existing application patterns
- Budget validation only applies to expense transactions
- Recurring transaction creation uses database transactions for atomicity
- Date calculations handle edge cases (leap years, month-end dates)
- Visual indicators use the Electric Blue color (#3B82F6) from the design system

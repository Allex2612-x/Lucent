# Implementation Plan

- [ ] 1. Write bug condition exploration test
  - **Property 1: Bug Condition** - Statistics Query Invalidation Does Not Cascade
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate the bug exists
  - **Scoped PBT Approach**: For deterministic bugs, scope the property to the concrete failing case(s) to ensure reproducibility
  - Test implementation details from Bug Condition in design:
    - Simulate bulk delete operation in Transactions page
    - Verify that `queryClient.invalidateQueries({ queryKey: ['statistics'] })` is called with default `exact: true`
    - Check that specific query keys `['statistics', 'by-category', date1, date2]` and `['statistics', 'monthly-trend', date1, date2]` remain in "fresh" state (not invalidated)
    - Use `queryClient.getQueryCache().findAll({ queryKey: ['statistics'] })` to inspect cache state
    - Navigate to Reports page and verify pie charts display stale data from deleted transactions
  - The test assertions should match the Expected Behavior Properties from design:
    - ASSERT: Specific statistics queries are NOT marked as stale after bulk delete (on unfixed code)
    - ASSERT: Reports page pie chart shows stale data instead of empty state or updated data
    - ASSERT: `exact: true` default prevents cascade invalidation to specific query keys
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS (this is correct - it proves the bug exists)
  - Document counterexamples found to understand root cause:
    - Example: After bulk delete of all transactions, `['statistics', 'by-category', '2024-01-01', '2024-06-01']` query remains fresh
    - Example: Reports page pie chart continues to show deleted transaction data
    - Example: React Query DevTools shows specific query keys are not stale
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [ ] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Non-Bulk-Delete Behavior Unchanged
  - **IMPORTANT**: Follow observation-first methodology
  - Observe behavior on UNFIXED code for non-buggy inputs:
    - Single transaction deletion: Observe that Reports page charts update correctly
    - Transactions list refresh: Observe that `['transactions']` invalidation refreshes the list
    - Date range filtering: Observe that changing date range in Reports page fetches and displays data correctly
    - Add transaction: Observe that adding new transactions updates charts correctly
    - Export functionality: Observe that PDF/Excel export works correctly
  - Write property-based tests capturing observed behavior patterns from Preservation Requirements:
    - Test that single transaction deletion continues to invalidate and update charts (same behavior as unfixed code)
    - Test that `['transactions']` query invalidation continues to refresh transactions list
    - Test that date range filtering continues to fetch and display data correctly
    - Test that adding new transactions after bulk delete displays correctly in charts
    - Test that export functionality continues to work correctly
  - Property-based testing generates many test cases for stronger guarantees:
    - Generate random transaction IDs for single deletion and verify charts update
    - Generate random date ranges and verify filtering works correctly
    - Generate random transaction data and verify add/display behavior
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS (this confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ] 3. Fix for pie chart cache invalidation after bulk delete

  - [ ] 3.1 Implement the fix
    - Modify `handleBulkDelete` function in `frontend/src/features/transactions/Transactions.tsx` (line ~310)
    - Change statistics query invalidation from:
      ```typescript
      queryClient.invalidateQueries({ queryKey: ['statistics'] });
      ```
    - To:
      ```typescript
      queryClient.invalidateQueries({ queryKey: ['statistics'], exact: false });
      ```
    - Add `exact: false` option to enable prefix matching for cascade invalidation
    - Keep `['transactions']` invalidation unchanged (already works correctly)
    - Rationale: `exact: false` tells React Query to use prefix matching, invalidating all queries whose keys start with `['statistics']`, including `['statistics', 'by-category', ...]` and `['statistics', 'monthly-trend', ...]`
    - _Bug_Condition: isBugCondition(input) where input.action == 'bulkDelete' AND input.invalidationKey == ['statistics'] AND input.exactOption == true (default) AND specificQueriesExist(['statistics', 'by-category', ...]) AND NOT queriesInvalidated(['statistics', 'by-category', ...])_
    - _Expected_Behavior: For any bulk delete operation that invalidates the ['statistics'] query key, the fixed invalidation SHALL cascade to all queries with keys starting with ['statistics', ...], including ['statistics', 'by-category', ...] and ['statistics', 'monthly-trend', ...], causing the Reports page charts to refetch and display updated data_
    - _Preservation: All operations that are NOT bulk delete (single transaction deletion, adding transactions, date range filtering) SHALL produce exactly the same behavior as the original code, preserving all existing query invalidation and data fetching functionality_
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 3.4, 3.5_

  - [ ] 3.2 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - Statistics Query Invalidation Cascades
    - **IMPORTANT**: Re-run the SAME test from task 1 - do NOT write a new test
    - The test from task 1 encodes the expected behavior
    - When this test passes, it confirms the expected behavior is satisfied
    - Run bug condition exploration test from step 1
    - **EXPECTED OUTCOME**: Test PASSES (confirms bug is fixed)
    - Verify that:
      - `queryClient.invalidateQueries({ queryKey: ['statistics'], exact: false })` is called
      - Specific query keys `['statistics', 'by-category', date1, date2]` and `['statistics', 'monthly-trend', date1, date2]` are marked as stale
      - Reports page pie charts refetch and display updated data (empty state or updated totals)
      - React Query DevTools shows all statistics queries are stale after bulk delete
    - _Requirements: Expected Behavior Properties from design - 2.1, 2.2, 2.3, 2.4_

  - [ ] 3.3 Verify preservation tests still pass
    - **Property 2: Preservation** - Non-Bulk-Delete Behavior Unchanged
    - **IMPORTANT**: Re-run the SAME tests from task 2 - do NOT write new tests
    - Run preservation property tests from step 2
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)
    - Confirm all tests still pass after fix (no regressions):
      - Single transaction deletion continues to update charts correctly
      - Transactions list refresh continues to work via `['transactions']` invalidation
      - Date range filtering continues to fetch and display data correctly
      - Adding new transactions continues to display correctly in charts
      - Export functionality continues to work correctly
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ] 4. Write additional unit tests for fix validation
  - Test that `invalidateQueries` is called with `exact: false` for statistics queries in bulk delete
  - Test that `invalidateQueries` is called with correct key for transactions queries (unchanged)
  - Test that bulk delete confirmation dialog still appears and functions correctly
  - Test that success toast message still displays after bulk delete
  - Test that selected IDs are cleared after successful bulk delete
  - _Requirements: 2.1, 2.2, 3.1_

- [ ] 5. Write integration tests for full user flows
  - Test full flow: Load Reports page → Navigate to Transactions → Bulk delete all → Navigate back to Reports → Verify empty state
  - Test full flow: Load Reports page with date range → Bulk delete some transactions → Verify charts show updated data
  - Test full flow: Bulk delete → Add new transactions → Verify charts show new data
  - Test switching between different date ranges after bulk delete to verify all cached queries were invalidated
  - Test that React Query DevTools shows correct stale status for all statistics queries after bulk delete
  - Test edge case: Multiple cached queries with different date ranges are all invalidated after bulk delete
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 3.3, 3.4, 3.5_

- [ ] 6. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
  - Verify bug is fixed: Reports page pie charts update correctly after bulk delete
  - Verify no regressions: All existing functionality continues to work as before
  - Verify React Query cache behavior: All statistics queries are properly invalidated with prefix matching

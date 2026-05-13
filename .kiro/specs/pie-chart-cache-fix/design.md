# Pie Chart Cache Fix Bugfix Design

## Overview

This bugfix addresses a React Query cache invalidation issue where pie charts in the Reports page retain stale data after bulk deletion of transactions. The root cause is that the `handleBulkDelete` function in `Transactions.tsx` invalidates queries using the base key `['statistics']`, but React Query's default invalidation behavior with `exact: true` does not cascade to queries with more specific keys like `['statistics', 'by-category', startDateFull, endDateFull]`. The fix will use `exact: false` to enable prefix matching, ensuring all statistics-related queries are properly invalidated.

## Glossary

- **Bug_Condition (C)**: The condition that triggers the bug - when bulk delete invalidates `['statistics']` with default `exact: true` behavior, failing to cascade to specific query keys
- **Property (P)**: The desired behavior - all queries with keys starting with `['statistics', ...]` should be invalidated when `['statistics']` is invalidated
- **Preservation**: Existing invalidation behavior for `['transactions']` and single transaction deletions that must remain unchanged
- **handleBulkDelete**: The function in `frontend/src/features/transactions/Transactions.tsx` (line ~306) that performs bulk deletion and query invalidation
- **queryClient.invalidateQueries**: React Query method that marks cached queries as stale and triggers refetch
- **exact**: React Query option that controls whether invalidation matches exact keys only (true) or uses prefix matching (false)
- **Query Key Structure**: React Query uses array keys where `['statistics', 'by-category', date1, date2]` is a more specific version of `['statistics']`

## Bug Details

### Bug Condition

The bug manifests when a user performs bulk delete of transactions in the Transactions page. The `handleBulkDelete` function invalidates queries with key `['statistics']`, but this invalidation does not cascade to queries with more specific keys like `['statistics', 'by-category', startDateFull, endDateFull]` and `['statistics', 'monthly-trend', startDateFull, endDateFull]` because React Query's default `exact: true` behavior only matches the exact key structure.

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type { action: string, invalidationKey: string[], exactOption: boolean }
  OUTPUT: boolean
  
  RETURN input.action == 'bulkDelete'
         AND input.invalidationKey == ['statistics']
         AND input.exactOption == true (default)
         AND specificQueriesExist(['statistics', 'by-category', ...])
         AND specificQueriesExist(['statistics', 'monthly-trend', ...])
         AND NOT queriesInvalidated(['statistics', 'by-category', ...])
END FUNCTION
```

### Examples

- **Bulk Delete All Transactions**: User selects all transactions and clicks bulk delete. The transactions are deleted from the database, `['transactions']` and `['statistics']` queries are invalidated. However, when navigating to Reports page, the pie chart still shows data from deleted transactions because `['statistics', 'by-category', '2024-01-01', '2024-06-01']` was not invalidated.

- **Bulk Delete Filtered Transactions**: User filters transactions by category "Food" and bulk deletes them. The Reports page pie chart continues to show the "Food" category with the old total amount instead of the reduced amount.

- **Date Range Scenario**: User has Reports page open with date range Jan-Jun 2024, showing pie chart with cached data for `['statistics', 'by-category', '2024-01-01', '2024-06-01']`. User switches to Transactions page, bulk deletes all transactions. When returning to Reports page, the pie chart shows stale data because the specific query key was not invalidated.

- **Edge Case - Multiple Date Ranges**: User has viewed Reports page with multiple different date ranges (creating multiple cached queries with different date parameters). Bulk delete should invalidate all of these cached queries, not just the base `['statistics']` key.

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- Single transaction deletion must continue to work correctly and update Reports page charts
- The `['transactions']` query invalidation must continue to refresh the transactions list
- Mouse clicks on delete buttons must continue to work exactly as before
- Date range filtering in Reports page must continue to fetch and display data correctly
- Adding new transactions after bulk delete must continue to display correctly in charts

**Scope:**
All inputs that do NOT involve bulk deletion of transactions should be completely unaffected by this fix. This includes:
- Single transaction deletions (existing behavior)
- Transaction list refresh behavior
- Reports page date range filtering
- Chart rendering and display logic
- Export PDF/Excel functionality

## Hypothesized Root Cause

Based on the bug description and code analysis, the root cause is:

1. **React Query Default Behavior**: The `queryClient.invalidateQueries({ queryKey: ['statistics'] })` call uses the default `exact: true` option, which only invalidates queries with the exact key `['statistics']`, not queries with more specific keys like `['statistics', 'by-category', ...]`.

2. **Query Key Hierarchy**: React Query treats `['statistics']` and `['statistics', 'by-category', date1, date2]` as completely separate keys when `exact: true`. The invalidation does not cascade down the hierarchy.

3. **Reports Page Query Keys**: The Reports page uses specific query keys with date parameters:
   - `['statistics', 'by-category', startDateFull, endDateFull]` (line 33)
   - `['statistics', 'monthly-trend', startDateFull, endDateFull]` (line 40)
   
   These specific keys are not matched by the invalidation of `['statistics']` with `exact: true`.

4. **Cached Data Persistence**: When the user navigates to the Reports page after bulk delete, React Query serves the cached data from the specific query keys because they were not marked as stale by the invalidation.

## Correctness Properties

Property 1: Bug Condition - Statistics Query Invalidation Cascades

_For any_ bulk delete operation that invalidates the `['statistics']` query key, the fixed invalidation SHALL cascade to all queries with keys starting with `['statistics', ...]`, including `['statistics', 'by-category', ...]` and `['statistics', 'monthly-trend', ...]`, causing the Reports page charts to refetch and display updated data.

**Validates: Requirements 2.1, 2.2, 2.3, 2.4**

Property 2: Preservation - Non-Bulk-Delete Behavior

_For any_ operation that is NOT a bulk delete (single transaction deletion, adding transactions, date range filtering), the fixed code SHALL produce exactly the same behavior as the original code, preserving all existing query invalidation and data fetching functionality.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**

## Fix Implementation

### Changes Required

**File**: `frontend/src/features/transactions/Transactions.tsx`

**Function**: `handleBulkDelete` (line ~306)

**Specific Changes**:

1. **Modify Statistics Query Invalidation**: Change the `queryClient.invalidateQueries` call for statistics to use `exact: false` option to enable prefix matching.

   **Current Code** (line ~310):
   ```typescript
   queryClient.invalidateQueries({ queryKey: ['statistics'] });
   ```

   **Fixed Code**:
   ```typescript
   queryClient.invalidateQueries({ queryKey: ['statistics'], exact: false });
   ```

2. **Rationale**: The `exact: false` option tells React Query to use prefix matching, which will invalidate all queries whose keys start with `['statistics']`, including:
   - `['statistics', 'by-category', startDateFull, endDateFull]`
   - `['statistics', 'monthly-trend', startDateFull, endDateFull]`
   - Any other future statistics queries with additional parameters

3. **Alternative Approach (Not Recommended)**: We could invalidate each specific query key individually:
   ```typescript
   queryClient.invalidateQueries({ queryKey: ['statistics', 'by-category'] });
   queryClient.invalidateQueries({ queryKey: ['statistics', 'monthly-trend'] });
   ```
   However, this approach is less maintainable because it requires updating the Transactions component whenever new statistics queries are added to the Reports page.

4. **Keep Transactions Invalidation Unchanged**: The `['transactions']` invalidation should remain as-is because it already works correctly for refreshing the transactions list.

5. **No Changes to Reports Page**: The Reports page query keys and logic remain unchanged. The fix is entirely in the invalidation strategy in the Transactions page.

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that demonstrate the bug on unfixed code by observing stale cache behavior, then verify the fix works correctly by confirming all statistics queries are invalidated and charts update properly.

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate the bug BEFORE implementing the fix. Confirm that the root cause is the `exact: true` default behavior preventing cascade invalidation.

**Test Plan**: Write tests that simulate bulk delete operations and verify that specific statistics query keys are NOT invalidated with the current code. Use React Query DevTools or manual cache inspection to observe the stale queries. Run these tests on the UNFIXED code to observe failures and confirm the root cause.

**Test Cases**:
1. **Basic Bulk Delete Test**: Perform bulk delete, check if `['statistics', 'by-category', date1, date2]` query is marked as stale (will fail on unfixed code - query remains fresh)
2. **Multiple Query Keys Test**: Create multiple cached statistics queries with different date ranges, perform bulk delete, verify none of the specific keys are invalidated (will fail on unfixed code)
3. **Reports Page Navigation Test**: Load Reports page (caches specific query), navigate to Transactions, bulk delete, navigate back to Reports, verify chart shows stale data (will fail on unfixed code)
4. **React Query Cache Inspection**: Use `queryClient.getQueryCache().findAll({ queryKey: ['statistics'] })` to inspect which queries exist and their stale status after bulk delete (will show specific queries are not stale on unfixed code)

**Expected Counterexamples**:
- Specific statistics queries (`['statistics', 'by-category', ...]`) remain in "fresh" state after bulk delete
- Reports page charts display stale data from deleted transactions
- React Query DevTools shows specific query keys are not marked as stale
- Possible confirmation: Adding `exact: false` manually in browser console and re-running invalidation causes queries to be marked as stale

### Fix Checking

**Goal**: Verify that for all bulk delete operations (where the bug condition holds), the fixed function properly invalidates all statistics queries with prefix matching.

**Pseudocode:**
```
FOR ALL bulkDeleteOperation WHERE isBugCondition(bulkDeleteOperation) DO
  result := handleBulkDelete_fixed(selectedIds)
  specificQueries := queryClient.getQueryCache().findAll({ queryKey: ['statistics'] })
  ASSERT ALL queries IN specificQueries ARE marked as stale
  ASSERT Reports page charts refetch and display updated data
END FOR
```

**Test Cases**:
1. **Prefix Matching Verification**: After fix, verify that `invalidateQueries({ queryKey: ['statistics'], exact: false })` marks all queries starting with `['statistics']` as stale
2. **Category Chart Update**: Bulk delete all transactions, navigate to Reports page, verify category pie chart shows empty state message
3. **Monthly Trend Chart Update**: Bulk delete all transactions, navigate to Reports page, verify monthly trend bar chart shows empty state message
4. **Partial Delete Update**: Bulk delete some transactions, verify charts show updated totals reflecting remaining transactions
5. **Multiple Date Ranges**: Create cached queries for multiple date ranges, bulk delete, verify all cached queries are invalidated

### Preservation Checking

**Goal**: Verify that for all operations where the bug condition does NOT hold (non-bulk-delete operations), the fixed function produces the same result as the original function.

**Pseudocode:**
```
FOR ALL operation WHERE NOT isBugCondition(operation) DO
  ASSERT handleTransactions_original(operation) = handleTransactions_fixed(operation)
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It generates many test cases automatically across the input domain
- It catches edge cases that manual unit tests might miss
- It provides strong guarantees that behavior is unchanged for all non-buggy inputs

**Test Plan**: Observe behavior on UNFIXED code first for single deletions, date filtering, and other operations, then write property-based tests capturing that behavior and verify it remains unchanged after the fix.

**Test Cases**:
1. **Single Transaction Deletion Preservation**: Delete a single transaction (not bulk), verify Reports page charts update correctly (same behavior as before fix)
2. **Transactions List Refresh Preservation**: Verify bulk delete still refreshes the transactions list correctly via `['transactions']` invalidation
3. **Date Range Filtering Preservation**: Change date range in Reports page, verify charts fetch and display data correctly (unchanged behavior)
4. **Add Transaction Preservation**: Add new transactions after bulk delete, verify charts display new data correctly
5. **Export Functionality Preservation**: Verify PDF/Excel export continues to work correctly after the fix

### Unit Tests

- Test that `invalidateQueries` is called with `exact: false` for statistics queries in bulk delete
- Test that `invalidateQueries` is called with correct key for transactions queries (unchanged)
- Test that bulk delete confirmation dialog still appears and functions correctly
- Test that success toast message still displays after bulk delete
- Test that selected IDs are cleared after successful bulk delete

### Property-Based Tests

- Generate random sets of transaction IDs for bulk delete and verify all statistics queries are invalidated
- Generate random date ranges and verify cached queries for all date ranges are invalidated after bulk delete
- Generate random transaction data and verify single deletions continue to work correctly (preservation)
- Test that bulk delete with empty selection set does not cause errors

### Integration Tests

- Test full flow: Load Reports page → Navigate to Transactions → Bulk delete all → Navigate back to Reports → Verify empty state
- Test full flow: Load Reports page with date range → Bulk delete some transactions → Verify charts show updated data
- Test full flow: Bulk delete → Add new transactions → Verify charts show new data
- Test switching between different date ranges after bulk delete to verify all cached queries were invalidated
- Test that React Query DevTools shows correct stale status for all statistics queries after bulk delete

# Bugfix Requirements Document

## Introduction

This bugfix addresses a cache invalidation issue where pie charts in the Reports page retain stale data after bulk deletion of transactions. When users delete all transactions using the bulk delete feature in the Transactions page, the pie charts continue to display data from the deleted transactions instead of updating to reflect the empty state or updated data. This occurs because the query invalidation in `handleBulkDelete` does not properly cascade to the specific query keys used by the pie charts.

The bug impacts user experience by showing incorrect financial data visualization, potentially leading to confusion about the actual state of their transactions and financial reports.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN a user performs bulk delete of all transactions in the Transactions page THEN the pie charts in the Reports page continue to display data from the deleted transactions (stale cache)

1.2 WHEN the `handleBulkDelete` function invalidates queries with keys `['transactions']` and `['statistics']` THEN the queries with more specific keys `['statistics', 'by-category', startDateFull, endDateFull]` and `['statistics', 'monthly-trend', startDateFull, endDateFull]` are not invalidated

1.3 WHEN a user navigates to the Reports page after bulk deletion THEN the category distribution pie chart shows outdated expense data instead of an empty state or updated data

1.4 WHEN a user navigates to the Reports page after bulk deletion THEN the monthly trend bar chart shows outdated income/expense data instead of an empty state or updated data

### Expected Behavior (Correct)

2.1 WHEN a user performs bulk delete of all transactions in the Transactions page THEN the pie charts in the Reports page SHALL immediately reflect the deletion and show an empty state or updated data

2.2 WHEN the `handleBulkDelete` function invalidates queries with key `['statistics']` THEN all queries with keys starting with `['statistics', ...]` SHALL be invalidated, including `['statistics', 'by-category', ...]` and `['statistics', 'monthly-trend', ...]`

2.3 WHEN a user navigates to the Reports page after bulk deletion THEN the category distribution pie chart SHALL display "Nu există cheltuieli în perioada selectată." (no expenses message) or updated data reflecting the current state

2.4 WHEN a user navigates to the Reports page after bulk deletion THEN the monthly trend bar chart SHALL display "Nu există date pentru ultimele 12 luni." (no data message) or updated data reflecting the current state

### Unchanged Behavior (Regression Prevention)

3.1 WHEN a user performs bulk delete and the `handleBulkDelete` function invalidates `['transactions']` query THEN the transactions list SHALL CONTINUE TO refresh and display the updated list without deleted transactions

3.2 WHEN a user deletes a single transaction (not bulk delete) THEN the Reports page charts SHALL CONTINUE TO update correctly as they currently do

3.3 WHEN a user navigates to the Reports page without performing any deletions THEN the pie charts SHALL CONTINUE TO display accurate data based on existing transactions

3.4 WHEN a user changes the date range filter in the Reports page THEN the pie charts SHALL CONTINUE TO fetch and display data for the selected period correctly

3.5 WHEN a user adds new transactions after a bulk delete THEN the Reports page charts SHALL CONTINUE TO display the new transaction data correctly

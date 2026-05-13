# Requirements Document

## Introduction

This document specifies the requirements for adding budget validation, future date validation, and recurring transactions functionality to the Sasha Finance application. The feature enhances the transaction creation workflow by preventing invalid data entry, warning users about budget overruns, and enabling automated creation of recurring financial transactions.

## Glossary

- **Transaction_System**: The module responsible for creating, updating, and managing financial transactions
- **Budget_Validator**: The component that checks transaction amounts against budget limits
- **Date_Validator**: The component that validates transaction dates against business rules
- **Recurring_Transaction_Engine**: The component that generates multiple transaction instances from recurring transaction definitions
- **Add_Transaction_Modal**: The user interface component for creating new transactions
- **Budget_Warning_Modal**: The modal dialog that displays budget limit warnings to users
- **Delete_Confirmation_Modal**: The modal dialog that confirms deletion of recurring transactions
- **Transaction**: A single financial record (income or expense) with amount, date, category, and description
- **Recurring_Transaction**: A transaction template that generates multiple transaction instances based on frequency and repetition count
- **Recurring_Group**: A collection of transaction instances created from a single recurring transaction definition
- **Budget**: A spending limit defined for a category within a specific month and year
- **Category**: A classification for transactions (e.g., "Mâncare", "Transport", "Utilități")
- **Frequency**: The interval at which recurring transactions repeat (Daily, Weekly, Monthly, Yearly)
- **Repetition_Count**: The number of transaction instances to generate from a recurring transaction

## Requirements

### Requirement 1: Budget Limit Validation

**User Story:** As a user, I want to be warned when adding an expense exceeds my budget limit, so that I can make informed spending decisions.

#### Acceptance Criteria

1. WHEN a user submits an expense transaction, THE Budget_Validator SHALL check if the transaction amount would exceed the budget limit for that category in that month
2. WHEN the expense would exceed the category budget limit, THE Transaction_System SHALL display the Budget_Warning_Modal before saving the transaction
3. THE Budget_Warning_Modal SHALL display the current spent amount for the category in that month
4. THE Budget_Warning_Modal SHALL display the budget limit for the category
5. THE Budget_Warning_Modal SHALL display the new total amount if the transaction is added
6. THE Budget_Warning_Modal SHALL display the amount by which the budget would be exceeded
7. WHEN the user confirms in the Budget_Warning_Modal, THE Transaction_System SHALL save the transaction despite exceeding the budget
8. WHEN the user cancels in the Budget_Warning_Modal, THE Transaction_System SHALL not save the transaction and SHALL return to the Add_Transaction_Modal
9. WHEN no budget exists for the transaction category in that month, THE Transaction_System SHALL save the transaction without displaying a warning
10. WHEN the transaction type is income, THE Budget_Validator SHALL not perform budget validation

### Requirement 2: Future Date Validation

**User Story:** As a user, I want to be prevented from adding transactions with future dates, so that my financial records reflect actual past transactions.

#### Acceptance Criteria

1. WHEN a user submits a transaction with a date after the current date, THE Date_Validator SHALL reject the transaction
2. WHEN a future date is detected, THE Transaction_System SHALL display an error message "Nu poți adăuga tranzacții cu date din viitor"
3. WHEN a future date is detected, THE Transaction_System SHALL not save the transaction
4. WHEN the "Tranzacție recurentă" checkbox is checked, THE Date_Validator SHALL allow future dates
5. WHEN the "Tranzacție recurentă" checkbox is unchecked, THE Date_Validator SHALL enforce the future date restriction
6. THE Date_Validator SHALL compare dates using the user's local timezone

### Requirement 3: Recurring Transaction Creation

**User Story:** As a user, I want to create recurring transactions, so that I can automatically record regular income or expenses without manual entry.

#### Acceptance Criteria

1. THE Add_Transaction_Modal SHALL display a "Tranzacție recurentă" checkbox
2. WHEN the "Tranzacție recurentă" checkbox is checked, THE Add_Transaction_Modal SHALL display a frequency dropdown field
3. THE frequency dropdown SHALL contain the options: "Zilnic", "Săptămânal", "Lunar", "Anual"
4. WHEN the "Tranzacție recurentă" checkbox is checked, THE Add_Transaction_Modal SHALL display a repetition count input field
5. THE repetition count input field SHALL accept positive integers greater than 0
6. WHEN the "Tranzacție recurentă" checkbox is unchecked, THE Add_Transaction_Modal SHALL hide the frequency and repetition count fields
7. WHEN a user submits a recurring transaction, THE Recurring_Transaction_Engine SHALL generate multiple transaction instances based on the frequency and repetition count
8. WHEN frequency is "Zilnic", THE Recurring_Transaction_Engine SHALL create transactions with dates incremented by 1 day
9. WHEN frequency is "Săptămânal", THE Recurring_Transaction_Engine SHALL create transactions with dates incremented by 7 days
10. WHEN frequency is "Lunar", THE Recurring_Transaction_Engine SHALL create transactions with dates incremented by 1 month
11. WHEN frequency is "Anual", THE Recurring_Transaction_Engine SHALL create transactions with dates incremented by 1 year
12. FOR ALL generated transaction instances, THE Recurring_Transaction_Engine SHALL assign the same amount, type, category, and description
13. FOR ALL generated transaction instances, THE Recurring_Transaction_Engine SHALL assign a unique recurring group identifier
14. THE Recurring_Transaction_Engine SHALL set the isRecurring flag to true for all generated transaction instances

### Requirement 4: Recurring Transaction Metadata Storage

**User Story:** As a developer, I want recurring transaction metadata stored in the database, so that the system can identify and manage recurring transaction groups.

#### Acceptance Criteria

1. THE Transaction_System SHALL store a recurringGroupId field for each transaction instance in a recurring group
2. THE Transaction_System SHALL store the frequency value for each recurring transaction instance
3. THE Transaction_System SHALL store the original start date for each recurring transaction instance
4. THE Transaction_System SHALL store the instance sequence number for each transaction in a recurring group
5. THE recurringGroupId SHALL be a UUID that is identical for all transactions in the same recurring group
6. THE sequence number SHALL start at 1 for the first transaction and increment by 1 for each subsequent transaction in the group

### Requirement 5: Recurring Transaction Visual Indicators

**User Story:** As a user, I want to see which transactions are recurring, so that I can distinguish them from one-time transactions.

#### Acceptance Criteria

1. WHEN displaying a transaction list, THE Transaction_System SHALL display a visual indicator for recurring transactions
2. THE visual indicator SHALL be an icon or badge positioned near the transaction description
3. THE visual indicator SHALL use the Electric Blue color (#3B82F6) from the design system
4. WHEN a user hovers over the recurring indicator, THE Transaction_System SHALL display a tooltip with the frequency and group information
5. THE tooltip SHALL display text in Romanian (e.g., "Tranzacție recurentă - Lunar")

### Requirement 6: Recurring Transaction Deletion

**User Story:** As a user, I want to choose whether to delete a single recurring transaction or all future instances, so that I can manage recurring transactions flexibly.

#### Acceptance Criteria

1. WHEN a user attempts to delete a recurring transaction, THE Transaction_System SHALL display the Delete_Confirmation_Modal
2. THE Delete_Confirmation_Modal SHALL display two action buttons: "Șterge doar această tranzacție" and "Șterge această tranzacție și toate viitoare"
3. WHEN the user selects "Șterge doar această tranzacție", THE Transaction_System SHALL delete only the selected transaction instance
4. WHEN the user selects "Șterge această tranzacție și toate viitoare", THE Transaction_System SHALL delete the selected transaction and all transactions in the same recurring group with dates on or after the selected transaction date
5. WHEN a user attempts to delete a non-recurring transaction, THE Transaction_System SHALL display the standard delete confirmation modal without recurring-specific options
6. THE Delete_Confirmation_Modal SHALL display the transaction description and amount for context
7. WHEN the user cancels the deletion, THE Transaction_System SHALL not delete any transactions

### Requirement 7: Budget Validation for Recurring Transactions

**User Story:** As a user, I want to be warned if any instance of a recurring expense exceeds budget limits, so that I can plan my recurring expenses appropriately.

#### Acceptance Criteria

1. WHEN creating a recurring expense transaction, THE Budget_Validator SHALL check each generated transaction instance against the budget for its respective month
2. WHEN any transaction instance would exceed its month's budget limit, THE Transaction_System SHALL display the Budget_Warning_Modal
3. THE Budget_Warning_Modal SHALL list all months where the budget would be exceeded
4. THE Budget_Warning_Modal SHALL display the budget details for the first month that would be exceeded
5. WHEN the user confirms in the Budget_Warning_Modal, THE Recurring_Transaction_Engine SHALL create all transaction instances despite budget warnings
6. WHEN the user cancels in the Budget_Warning_Modal, THE Recurring_Transaction_Engine SHALL not create any transaction instances

### Requirement 8: Recurring Transaction Form Validation

**User Story:** As a user, I want clear validation messages when creating recurring transactions, so that I can correct errors before submission.

#### Acceptance Criteria

1. WHEN the "Tranzacție recurentă" checkbox is checked and frequency is not selected, THE Add_Transaction_Modal SHALL display an error message "Selectează frecvența"
2. WHEN the "Tranzacție recurentă" checkbox is checked and repetition count is empty, THE Add_Transaction_Modal SHALL display an error message "Introdu numărul de repetări"
3. WHEN the repetition count is less than 1, THE Add_Transaction_Modal SHALL display an error message "Numărul de repetări trebuie să fie cel puțin 1"
4. WHEN the repetition count is greater than 365, THE Add_Transaction_Modal SHALL display an error message "Numărul de repetări nu poate depăși 365"
5. THE Add_Transaction_Modal SHALL prevent form submission when validation errors exist
6. THE Add_Transaction_Modal SHALL display validation errors in red text using the accent-danger color token

### Requirement 9: Recurring Transaction Date Calculation

**User Story:** As a developer, I want accurate date calculations for recurring transactions, so that transaction instances are created on the correct dates.

#### Acceptance Criteria

1. WHEN calculating monthly recurring dates, THE Recurring_Transaction_Engine SHALL preserve the day of month when possible
2. WHEN the day of month does not exist in the target month, THE Recurring_Transaction_Engine SHALL use the last day of that month
3. WHEN calculating yearly recurring dates, THE Recurring_Transaction_Engine SHALL preserve the month and day when possible
4. WHEN the date is February 29 and the target year is not a leap year, THE Recurring_Transaction_Engine SHALL use February 28
5. FOR ALL date calculations, THE Recurring_Transaction_Engine SHALL use the user's local timezone
6. THE Recurring_Transaction_Engine SHALL generate dates in chronological order starting from the user-specified start date

### Requirement 10: Recurring Transaction Performance

**User Story:** As a user, I want recurring transaction creation to complete quickly, so that I can continue using the application without delays.

#### Acceptance Criteria

1. WHEN creating a recurring transaction with up to 12 repetitions, THE Recurring_Transaction_Engine SHALL complete within 2 seconds
2. WHEN creating a recurring transaction with up to 52 repetitions, THE Recurring_Transaction_Engine SHALL complete within 5 seconds
3. WHEN creating a recurring transaction with up to 365 repetitions, THE Recurring_Transaction_Engine SHALL complete within 10 seconds
4. THE Transaction_System SHALL display a loading indicator while recurring transactions are being created
5. THE loading indicator SHALL display text "Se creează tranzacțiile recurente..."

### Requirement 11: Recurring Transaction Error Handling

**User Story:** As a user, I want clear error messages when recurring transaction creation fails, so that I can understand and resolve the issue.

#### Acceptance Criteria

1. WHEN recurring transaction creation fails due to a database error, THE Transaction_System SHALL display an error message "Eroare la crearea tranzacțiilor recurente"
2. WHEN recurring transaction creation fails, THE Transaction_System SHALL not create any transaction instances
3. WHEN a partial failure occurs during batch creation, THE Transaction_System SHALL roll back all created transactions
4. THE Transaction_System SHALL log detailed error information for debugging purposes
5. WHEN an error occurs, THE Add_Transaction_Modal SHALL remain open with the user's input preserved

### Requirement 12: Budget Warning Modal Design

**User Story:** As a user, I want the budget warning modal to be clear and visually distinct, so that I understand the budget impact immediately.

#### Acceptance Criteria

1. THE Budget_Warning_Modal SHALL use the accent-warning color (#FFB547) for the warning icon
2. THE Budget_Warning_Modal SHALL display the title "Atenție: Buget Depășit"
3. THE Budget_Warning_Modal SHALL display budget information in a structured layout with labels and values
4. THE Budget_Warning_Modal SHALL use the Electric Blue color (#3B82F6) for the confirm button
5. THE Budget_Warning_Modal SHALL use the ghost button variant for the cancel button
6. THE Budget_Warning_Modal SHALL follow the existing modal design patterns from the design system
7. THE Budget_Warning_Modal SHALL meet WCAG AA accessibility standards for color contrast


/**
 * DateValidator utility class for validating transaction dates
 * 
 * Provides timezone-aware date validation for transaction creation,
 * ensuring data integrity by preventing future dates for non-recurring transactions.
 */

/**
 * Checks if a given date is in the future compared to the current date.
 * 
 * This method performs timezone-aware comparison at the day level,
 * ignoring the time component. It uses the user's local timezone
 * for accurate date comparison.
 * 
 * @param date - The date to check
 * @returns true if the date is after the current date (at day level), false otherwise
 * 
 * @example
 * ```typescript
 * const tomorrow = new Date();
 * tomorrow.setDate(tomorrow.getDate() + 1);
 * DateValidator.isFutureDate(tomorrow); // true
 * 
 * const yesterday = new Date();
 * yesterday.setDate(yesterday.getDate() - 1);
 * DateValidator.isFutureDate(yesterday); // false
 * 
 * const today = new Date();
 * DateValidator.isFutureDate(today); // false
 * ```
 */
export class DateValidator {
  /**
   * Checks if a date is in the future (after current date at day level)
   * 
   * @param date - The date to validate
   * @returns true if date is in the future, false otherwise
   */
  static isFutureDate(date: Date): boolean {
    // Get current date in user's local timezone
    const now = new Date();
    
    // Normalize both dates to midnight (start of day) for day-level comparison
    // This ensures we compare dates, not timestamps
    const normalizedInput = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    );
    
    const normalizedNow = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );
    
    // Compare timestamps of normalized dates
    return normalizedInput.getTime() > normalizedNow.getTime();
  }
}

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
    const now = new Date();

    // Compare both the input and "now" in the SAME UTC calendar frame so the
    // result is independent of the server's local timezone. A bare
    // 'YYYY-MM-DD' string is parsed by `new Date(val)` as UTC midnight, so its
    // UTC y/m/d fields are exactly the user's intended calendar date — using
    // local fields here would drift by a day on any server running behind UTC.
    const normalizedInput = Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate()
    );

    const normalizedNow = Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate()
    );

    return normalizedInput > normalizedNow;
  }
}

import { describe, it, expect } from 'vitest';
import { DateValidator } from './date-validator.js';

/**
 * Integration tests for DateValidator
 * These tests verify the DateValidator works correctly with real dates
 * and meets the requirements specified in the design document.
 */
describe('DateValidator - Integration Tests', () => {
  describe('Requirement 2.1: isFutureDate() method', () => {
    it('should check if date is after current date', () => {
      const now = new Date();
      
      // Create a date 1 day in the future
      const futureDate = new Date(now);
      futureDate.setDate(futureDate.getDate() + 1);
      
      expect(DateValidator.isFutureDate(futureDate)).toBe(true);
    });

    it('should return false for current date', () => {
      const now = new Date();
      expect(DateValidator.isFutureDate(now)).toBe(false);
    });

    it('should return false for past dates', () => {
      const now = new Date();
      
      // Create a date 1 day in the past
      const pastDate = new Date(now);
      pastDate.setDate(pastDate.getDate() - 1);
      
      expect(DateValidator.isFutureDate(pastDate)).toBe(false);
    });
  });

  describe('Requirement 2.2: Timezone-aware date comparison', () => {
    it('should use user local timezone for comparison', () => {
      // Create dates using local timezone constructor
      const now = new Date();
      const localDate = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
      );
      
      // Should not be considered future date (same day)
      expect(DateValidator.isFutureDate(localDate)).toBe(false);
    });

    it('should handle dates created with different timezone representations', () => {
      const now = new Date();
      
      // Create date using ISO string (UTC)
      const isoDate = new Date(now.toISOString());
      
      // Create date using local components
      const localDate = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
      );
      
      // Both should be treated as "today" regardless of timezone representation
      expect(DateValidator.isFutureDate(isoDate)).toBe(false);
      expect(DateValidator.isFutureDate(localDate)).toBe(false);
    });
  });

  describe('Requirement 2.6: Compare dates at day level', () => {
    it('should ignore time component when comparing', () => {
      const now = new Date();

      // Same UTC day, different times of day. Built in the UTC frame (matching
      // how isFutureDate compares) so the result is timezone-stable.
      const morning = new Date(Date.UTC(
        now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 8, 0, 0
      ));

      const evening = new Date(Date.UTC(
        now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 20, 0, 0
      ));

      const midnight = new Date(Date.UTC(
        now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0
      ));
      
      // All should be considered "today" regardless of time
      expect(DateValidator.isFutureDate(morning)).toBe(false);
      expect(DateValidator.isFutureDate(evening)).toBe(false);
      expect(DateValidator.isFutureDate(midnight)).toBe(false);
    });

    it('should correctly identify next day even with earlier time', () => {
      const now = new Date();

      // Tomorrow at UTC midnight. The app receives dates as bare 'YYYY-MM-DD'
      // strings (parsed to UTC midnight) and isFutureDate compares in the UTC
      // calendar frame, so build the fixture the same way to stay
      // timezone-stable regardless of the test runner's local zone.
      const tomorrowMidnight = new Date(Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate() + 1
      ));

      // Should be considered future date
      expect(DateValidator.isFutureDate(tomorrowMidnight)).toBe(true);
    });

    it('should correctly identify yesterday even with later time', () => {
      const now = new Date();

      // Yesterday at UTC end-of-day (same UTC-frame rationale as above).
      const yesterdayEnd = new Date(Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate() - 1,
        23, 59, 59
      ));

      // Should not be considered future date
      expect(DateValidator.isFutureDate(yesterdayEnd)).toBe(false);
    });
  });

  describe('Real-world scenarios', () => {
    it('should validate transaction date for non-recurring transaction', () => {
      // Scenario: User tries to add a transaction dated tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const isFuture = DateValidator.isFutureDate(tomorrow);
      
      // Should be rejected (future date not allowed for non-recurring)
      expect(isFuture).toBe(true);
    });

    it('should allow transaction date for today', () => {
      // Scenario: User adds a transaction for today
      const today = new Date();
      
      const isFuture = DateValidator.isFutureDate(today);
      
      // Should be allowed
      expect(isFuture).toBe(false);
    });

    it('should allow transaction date for past dates', () => {
      // Scenario: User adds a transaction from last week
      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 7);
      
      const isFuture = DateValidator.isFutureDate(lastWeek);
      
      // Should be allowed
      expect(isFuture).toBe(false);
    });
  });
});

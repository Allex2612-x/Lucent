import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { DateValidator } from './date-validator.js';

describe('DateValidator', () => {
  describe('isFutureDate', () => {
    beforeEach(() => {
      // Reset system time before each test
      vi.useFakeTimers();
    });

    afterEach(() => {
      // Restore real timers after each test
      vi.useRealTimers();
    });

    it('should return false for current date', () => {
      const now = new Date('2024-03-15T14:30:00');
      vi.setSystemTime(now);

      const today = new Date('2024-03-15T10:00:00'); // Same day, different time
      expect(DateValidator.isFutureDate(today)).toBe(false);
    });

    it('should return false for past dates', () => {
      const now = new Date('2024-03-15T14:30:00');
      vi.setSystemTime(now);

      const yesterday = new Date('2024-03-14T14:30:00');
      expect(DateValidator.isFutureDate(yesterday)).toBe(false);
    });

    it('should return true for future dates', () => {
      const now = new Date('2024-03-15T14:30:00');
      vi.setSystemTime(now);

      const tomorrow = new Date('2024-03-16T14:30:00');
      expect(DateValidator.isFutureDate(tomorrow)).toBe(true);
    });

    it('should ignore time component when comparing dates', () => {
      const now = new Date('2024-03-15T09:00:00');
      vi.setSystemTime(now);

      // Same day but later time - should still be considered "today"
      const laterToday = new Date('2024-03-15T23:59:59');
      expect(DateValidator.isFutureDate(laterToday)).toBe(false);

      // Same day but earlier time - should still be considered "today"
      const earlierToday = new Date('2024-03-15T00:00:01');
      expect(DateValidator.isFutureDate(earlierToday)).toBe(false);
    });

    it('should handle dates at midnight correctly', () => {
      const now = new Date('2024-03-15T00:00:00');
      vi.setSystemTime(now);

      const today = new Date('2024-03-15T00:00:00');
      expect(DateValidator.isFutureDate(today)).toBe(false);

      const tomorrow = new Date('2024-03-16T00:00:00');
      expect(DateValidator.isFutureDate(tomorrow)).toBe(true);
    });

    it('should handle month boundaries correctly', () => {
      const now = new Date('2024-03-31T14:30:00');
      vi.setSystemTime(now);

      const today = new Date('2024-03-31T10:00:00');
      expect(DateValidator.isFutureDate(today)).toBe(false);

      const tomorrow = new Date('2024-04-01T10:00:00');
      expect(DateValidator.isFutureDate(tomorrow)).toBe(true);

      const yesterday = new Date('2024-03-30T10:00:00');
      expect(DateValidator.isFutureDate(yesterday)).toBe(false);
    });

    it('should handle year boundaries correctly', () => {
      const now = new Date('2024-12-31T14:30:00');
      vi.setSystemTime(now);

      const today = new Date('2024-12-31T10:00:00');
      expect(DateValidator.isFutureDate(today)).toBe(false);

      const tomorrow = new Date('2025-01-01T10:00:00');
      expect(DateValidator.isFutureDate(tomorrow)).toBe(true);

      const yesterday = new Date('2024-12-30T10:00:00');
      expect(DateValidator.isFutureDate(yesterday)).toBe(false);
    });

    it('should handle leap year dates correctly', () => {
      const now = new Date('2024-02-29T14:30:00'); // 2024 is a leap year
      vi.setSystemTime(now);

      const today = new Date('2024-02-29T10:00:00');
      expect(DateValidator.isFutureDate(today)).toBe(false);

      const tomorrow = new Date('2024-03-01T10:00:00');
      expect(DateValidator.isFutureDate(tomorrow)).toBe(true);

      const yesterday = new Date('2024-02-28T10:00:00');
      expect(DateValidator.isFutureDate(yesterday)).toBe(false);
    });

    it('should handle dates far in the past', () => {
      const now = new Date('2024-03-15T14:30:00');
      vi.setSystemTime(now);

      const lastYear = new Date('2023-03-15T14:30:00');
      expect(DateValidator.isFutureDate(lastYear)).toBe(false);

      const tenYearsAgo = new Date('2014-03-15T14:30:00');
      expect(DateValidator.isFutureDate(tenYearsAgo)).toBe(false);
    });

    it('should handle dates far in the future', () => {
      const now = new Date('2024-03-15T14:30:00');
      vi.setSystemTime(now);

      const nextYear = new Date('2025-03-15T14:30:00');
      expect(DateValidator.isFutureDate(nextYear)).toBe(true);

      const tenYearsLater = new Date('2034-03-15T14:30:00');
      expect(DateValidator.isFutureDate(tenYearsLater)).toBe(true);
    });

    it('should be timezone-aware using local timezone', () => {
      // Set a specific time in the local timezone
      const now = new Date('2024-03-15T14:30:00');
      vi.setSystemTime(now);

      // Create dates using local timezone constructor
      const today = new Date(2024, 2, 15); // Month is 0-indexed (2 = March)
      expect(DateValidator.isFutureDate(today)).toBe(false);

      const tomorrow = new Date(2024, 2, 16);
      expect(DateValidator.isFutureDate(tomorrow)).toBe(true);

      const yesterday = new Date(2024, 2, 14);
      expect(DateValidator.isFutureDate(yesterday)).toBe(false);
    });

    it('should handle edge case of exactly one day difference', () => {
      const now = new Date('2024-03-15T14:30:00');
      vi.setSystemTime(now);

      const exactlyOneDayLater = new Date('2024-03-16T14:30:00');
      expect(DateValidator.isFutureDate(exactlyOneDayLater)).toBe(true);

      const exactlyOneDayEarlier = new Date('2024-03-14T14:30:00');
      expect(DateValidator.isFutureDate(exactlyOneDayEarlier)).toBe(false);
    });
  });
});

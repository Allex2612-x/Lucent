import { describe, it, expect } from 'vitest';
import { RecurringTransactionEngine } from './recurring-transaction-engine.js';

describe('RecurringTransactionEngine', () => {
  describe('generateInstances', () => {
    it('should generate correct number of instances', () => {
      const params = {
        amount: 100,
        type: 'expense' as const,
        description: 'Test transaction',
        startDate: new Date('2024-01-01'),
        categoryId: 'cat-123',
        userId: 'user-123',
        frequency: 'daily' as const,
        repetitionCount: 5,
      };

      const instances = RecurringTransactionEngine.generateInstances(params);

      expect(instances).toHaveLength(5);
    });

    it('should assign same recurringGroupId to all instances', () => {
      const params = {
        amount: 100,
        type: 'expense' as const,
        description: 'Test transaction',
        startDate: new Date('2024-01-01'),
        categoryId: 'cat-123',
        userId: 'user-123',
        frequency: 'daily' as const,
        repetitionCount: 3,
      };

      const instances = RecurringTransactionEngine.generateInstances(params);

      const groupId = instances[0].recurringGroupId;
      expect(groupId).toBeDefined();
      expect(instances.every((inst) => inst.recurringGroupId === groupId)).toBe(true);
    });

    it('should assign sequential sequence numbers starting from 1', () => {
      const params = {
        amount: 100,
        type: 'expense' as const,
        description: 'Test transaction',
        startDate: new Date('2024-01-01'),
        categoryId: 'cat-123',
        userId: 'user-123',
        frequency: 'daily' as const,
        repetitionCount: 5,
      };

      const instances = RecurringTransactionEngine.generateInstances(params);

      expect(instances[0].sequenceNumber).toBe(1);
      expect(instances[1].sequenceNumber).toBe(2);
      expect(instances[2].sequenceNumber).toBe(3);
      expect(instances[3].sequenceNumber).toBe(4);
      expect(instances[4].sequenceNumber).toBe(5);
    });

    it('should set isRecurring flag to true for all instances', () => {
      const params = {
        amount: 100,
        type: 'expense' as const,
        description: 'Test transaction',
        startDate: new Date('2024-01-01'),
        categoryId: 'cat-123',
        userId: 'user-123',
        frequency: 'daily' as const,
        repetitionCount: 3,
      };

      const instances = RecurringTransactionEngine.generateInstances(params);

      expect(instances.every((inst) => inst.isRecurring === true)).toBe(true);
    });

    it('should preserve amount, type, description, categoryId, and userId', () => {
      const params = {
        amount: 250.5,
        type: 'income' as const,
        description: 'Monthly salary',
        startDate: new Date('2024-01-01'),
        categoryId: 'cat-456',
        userId: 'user-789',
        frequency: 'monthly' as const,
        repetitionCount: 3,
      };

      const instances = RecurringTransactionEngine.generateInstances(params);

      instances.forEach((inst) => {
        expect(inst.amount).toBe(250.5);
        expect(inst.type).toBe('income');
        expect(inst.description).toBe('Monthly salary');
        expect(inst.categoryId).toBe('cat-456');
        expect(inst.userId).toBe('user-789');
      });
    });

    it('should store originalStartDate for all instances', () => {
      const startDate = new Date('2024-01-15');
      const params = {
        amount: 100,
        type: 'expense' as const,
        description: 'Test transaction',
        startDate,
        categoryId: 'cat-123',
        userId: 'user-123',
        frequency: 'monthly' as const,
        repetitionCount: 3,
      };

      const instances = RecurringTransactionEngine.generateInstances(params);

      instances.forEach((inst) => {
        expect(inst.originalStartDate).toEqual(startDate);
      });
    });

    it('should store frequency for all instances', () => {
      const params = {
        amount: 100,
        type: 'expense' as const,
        description: 'Test transaction',
        startDate: new Date('2024-01-01'),
        categoryId: 'cat-123',
        userId: 'user-123',
        frequency: 'weekly' as const,
        repetitionCount: 3,
      };

      const instances = RecurringTransactionEngine.generateInstances(params);

      instances.forEach((inst) => {
        expect(inst.frequency).toBe('weekly');
      });
    });
  });

  describe('Daily frequency', () => {
    it('should increment dates by 1 day', () => {
      const params = {
        amount: 100,
        type: 'expense' as const,
        startDate: new Date('2024-01-01'),
        categoryId: 'cat-123',
        userId: 'user-123',
        frequency: 'daily' as const,
        repetitionCount: 5,
      };

      const instances = RecurringTransactionEngine.generateInstances(params);

      expect(instances[0].date).toEqual(new Date('2024-01-01'));
      expect(instances[1].date).toEqual(new Date('2024-01-02'));
      expect(instances[2].date).toEqual(new Date('2024-01-03'));
      expect(instances[3].date).toEqual(new Date('2024-01-04'));
      expect(instances[4].date).toEqual(new Date('2024-01-05'));
    });

    it('should handle month boundaries', () => {
      const params = {
        amount: 100,
        type: 'expense' as const,
        startDate: new Date('2024-01-30'),
        categoryId: 'cat-123',
        userId: 'user-123',
        frequency: 'daily' as const,
        repetitionCount: 3,
      };

      const instances = RecurringTransactionEngine.generateInstances(params);

      expect(instances[0].date).toEqual(new Date('2024-01-30'));
      expect(instances[1].date).toEqual(new Date('2024-01-31'));
      expect(instances[2].date).toEqual(new Date('2024-02-01'));
    });
  });

  describe('Weekly frequency', () => {
    it('should increment dates by 7 days', () => {
      const params = {
        amount: 100,
        type: 'expense' as const,
        startDate: new Date('2024-01-01'),
        categoryId: 'cat-123',
        userId: 'user-123',
        frequency: 'weekly' as const,
        repetitionCount: 4,
      };

      const instances = RecurringTransactionEngine.generateInstances(params);

      expect(instances[0].date).toEqual(new Date('2024-01-01'));
      expect(instances[1].date).toEqual(new Date('2024-01-08'));
      expect(instances[2].date).toEqual(new Date('2024-01-15'));
      expect(instances[3].date).toEqual(new Date('2024-01-22'));
    });

    it('should handle month boundaries', () => {
      const params = {
        amount: 100,
        type: 'expense' as const,
        startDate: new Date('2024-01-29'),
        categoryId: 'cat-123',
        userId: 'user-123',
        frequency: 'weekly' as const,
        repetitionCount: 3,
      };

      const instances = RecurringTransactionEngine.generateInstances(params);

      expect(instances[0].date).toEqual(new Date('2024-01-29'));
      expect(instances[1].date).toEqual(new Date('2024-02-05'));
      expect(instances[2].date).toEqual(new Date('2024-02-12'));
    });
  });

  describe('Monthly frequency', () => {
    it('should preserve day of month when possible', () => {
      const params = {
        amount: 100,
        type: 'expense' as const,
        startDate: new Date('2024-01-15'),
        categoryId: 'cat-123',
        userId: 'user-123',
        frequency: 'monthly' as const,
        repetitionCount: 4,
      };

      const instances = RecurringTransactionEngine.generateInstances(params);

      expect(instances[0].date).toEqual(new Date('2024-01-15'));
      expect(instances[1].date).toEqual(new Date('2024-02-15'));
      expect(instances[2].date).toEqual(new Date('2024-03-15'));
      expect(instances[3].date).toEqual(new Date('2024-04-15'));
    });

    it('should handle Jan 31 → Feb 29 in leap year', () => {
      const params = {
        amount: 100,
        type: 'expense' as const,
        startDate: new Date('2024-01-31'),
        categoryId: 'cat-123',
        userId: 'user-123',
        frequency: 'monthly' as const,
        repetitionCount: 3,
      };

      const instances = RecurringTransactionEngine.generateInstances(params);

      expect(instances[0].date).toEqual(new Date('2024-01-31'));
      expect(instances[1].date).toEqual(new Date('2024-02-29')); // 2024 is a leap year
      expect(instances[2].date).toEqual(new Date('2024-03-31'));
    });

    it('should handle Jan 31 → Feb 28 in non-leap year', () => {
      const params = {
        amount: 100,
        type: 'expense' as const,
        startDate: new Date('2023-01-31'),
        categoryId: 'cat-123',
        userId: 'user-123',
        frequency: 'monthly' as const,
        repetitionCount: 3,
      };

      const instances = RecurringTransactionEngine.generateInstances(params);

      expect(instances[0].date).toEqual(new Date('2023-01-31'));
      expect(instances[1].date).toEqual(new Date('2023-02-28')); // 2023 is not a leap year
      expect(instances[2].date).toEqual(new Date('2023-03-31'));
    });

    it('should handle month-end dates (30th day)', () => {
      const params = {
        amount: 100,
        type: 'expense' as const,
        startDate: new Date('2024-01-30'),
        categoryId: 'cat-123',
        userId: 'user-123',
        frequency: 'monthly' as const,
        repetitionCount: 3,
      };

      const instances = RecurringTransactionEngine.generateInstances(params);

      expect(instances[0].date).toEqual(new Date('2024-01-30'));
      expect(instances[1].date).toEqual(new Date('2024-02-29')); // Feb has only 29 days in 2024
      expect(instances[2].date).toEqual(new Date('2024-03-30'));
    });

    it('should handle transitions from 31-day to 30-day months', () => {
      const params = {
        amount: 100,
        type: 'expense' as const,
        startDate: new Date('2024-03-31'),
        categoryId: 'cat-123',
        userId: 'user-123',
        frequency: 'monthly' as const,
        repetitionCount: 3,
      };

      const instances = RecurringTransactionEngine.generateInstances(params);

      expect(instances[0].date).toEqual(new Date('2024-03-31'));
      expect(instances[1].date).toEqual(new Date('2024-04-30')); // April has only 30 days
      expect(instances[2].date).toEqual(new Date('2024-05-31'));
    });
  });

  describe('Yearly frequency', () => {
    it('should preserve month and day', () => {
      const params = {
        amount: 100,
        type: 'expense' as const,
        startDate: new Date('2024-03-15'),
        categoryId: 'cat-123',
        userId: 'user-123',
        frequency: 'yearly' as const,
        repetitionCount: 3,
      };

      const instances = RecurringTransactionEngine.generateInstances(params);

      expect(instances[0].date).toEqual(new Date('2024-03-15'));
      expect(instances[1].date).toEqual(new Date('2025-03-15'));
      expect(instances[2].date).toEqual(new Date('2026-03-15'));
    });

    it('should handle Feb 29 in leap year to non-leap year', () => {
      const params = {
        amount: 100,
        type: 'expense' as const,
        startDate: new Date('2024-02-29'), // 2024 is a leap year
        categoryId: 'cat-123',
        userId: 'user-123',
        frequency: 'yearly' as const,
        repetitionCount: 3,
      };

      const instances = RecurringTransactionEngine.generateInstances(params);

      expect(instances[0].date).toEqual(new Date('2024-02-29'));
      expect(instances[1].date).toEqual(new Date('2025-02-28')); // 2025 is not a leap year
      expect(instances[2].date).toEqual(new Date('2026-02-28')); // 2026 is not a leap year
    });

    it('should handle Feb 29 in leap year to another leap year', () => {
      const params = {
        amount: 100,
        type: 'expense' as const,
        startDate: new Date('2024-02-29'), // 2024 is a leap year
        categoryId: 'cat-123',
        userId: 'user-123',
        frequency: 'yearly' as const,
        repetitionCount: 2,
      };

      const instances = RecurringTransactionEngine.generateInstances(params);

      expect(instances[0].date).toEqual(new Date('2024-02-29'));
      expect(instances[1].date).toEqual(new Date('2025-02-28')); // 2025 is not a leap year
    });

    it('should handle year boundaries', () => {
      const params = {
        amount: 100,
        type: 'expense' as const,
        startDate: new Date('2024-12-31'),
        categoryId: 'cat-123',
        userId: 'user-123',
        frequency: 'yearly' as const,
        repetitionCount: 3,
      };

      const instances = RecurringTransactionEngine.generateInstances(params);

      expect(instances[0].date).toEqual(new Date('2024-12-31'));
      expect(instances[1].date).toEqual(new Date('2025-12-31'));
      expect(instances[2].date).toEqual(new Date('2026-12-31'));
    });
  });

  describe('Edge cases', () => {
    it('should handle single repetition', () => {
      const params = {
        amount: 100,
        type: 'expense' as const,
        startDate: new Date('2024-01-01'),
        categoryId: 'cat-123',
        userId: 'user-123',
        frequency: 'daily' as const,
        repetitionCount: 1,
      };

      const instances = RecurringTransactionEngine.generateInstances(params);

      expect(instances).toHaveLength(1);
      expect(instances[0].date).toEqual(new Date('2024-01-01'));
      expect(instances[0].sequenceNumber).toBe(1);
    });

    it('should handle undefined description', () => {
      const params = {
        amount: 100,
        type: 'expense' as const,
        description: undefined,
        startDate: new Date('2024-01-01'),
        categoryId: 'cat-123',
        userId: 'user-123',
        frequency: 'daily' as const,
        repetitionCount: 2,
      };

      const instances = RecurringTransactionEngine.generateInstances(params);

      expect(instances[0].description).toBeUndefined();
      expect(instances[1].description).toBeUndefined();
    });

    it('should handle large repetition counts', () => {
      const params = {
        amount: 100,
        type: 'expense' as const,
        startDate: new Date('2024-01-01'),
        categoryId: 'cat-123',
        userId: 'user-123',
        frequency: 'daily' as const,
        repetitionCount: 365,
      };

      const instances = RecurringTransactionEngine.generateInstances(params);

      expect(instances).toHaveLength(365);
      expect(instances[0].sequenceNumber).toBe(1);
      expect(instances[364].sequenceNumber).toBe(365);
      // 2024 is a leap year, so adding 364 days to Jan 1 gives us Dec 30
      expect(instances[364].date).toEqual(new Date('2024-12-30'));
    });
  });
});

import { v4 as uuidv4 } from 'uuid';

export type RecurringFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface RecurringTransactionInstance {
  amount: number;
  type: 'income' | 'expense';
  description: string | undefined;
  date: Date;
  categoryId: string;
  userId: string;
  isRecurring: boolean;
  recurringGroupId: string;
  frequency: string;
  originalStartDate: Date;
  sequenceNumber: number;
}

export interface GenerateInstancesParams {
  amount: number;
  type: 'income' | 'expense';
  description?: string;
  startDate: Date;
  categoryId: string;
  userId: string;
  frequency: RecurringFrequency;
  repetitionCount: number;
}

export class RecurringTransactionEngine {
  /**
   * Generates multiple transaction instances from a recurring transaction definition
   */
  static generateInstances(params: GenerateInstancesParams): RecurringTransactionInstance[] {
    const {
      amount,
      type,
      description,
      startDate,
      categoryId,
      userId,
      frequency,
      repetitionCount,
    } = params;

    // Generate a unique recurring group ID for all instances
    const recurringGroupId = uuidv4();
    const instances: RecurringTransactionInstance[] = [];

    // Generate each instance
    for (let i = 0; i < repetitionCount; i++) {
      const date = this.calculateDate(startDate, frequency, i);

      instances.push({
        amount,
        type,
        description,
        date,
        categoryId,
        userId,
        isRecurring: true,
        recurringGroupId,
        frequency,
        originalStartDate: startDate,
        sequenceNumber: i + 1, // 1-based sequence number
      });
    }

    return instances;
  }

  /**
   * Calculates the date for a recurring transaction instance
   * @param startDate - The original start date
   * @param frequency - The recurrence frequency
   * @param index - The instance index (0-based)
   * @returns The calculated date
   */
  private static calculateDate(
    startDate: Date,
    frequency: RecurringFrequency,
    index: number
  ): Date {
    switch (frequency) {
      case 'daily':
        return this.calculateDailyDate(startDate, index);
      case 'weekly':
        return this.calculateWeeklyDate(startDate, index);
      case 'monthly':
        return this.calculateMonthlyDate(startDate, index);
      case 'yearly':
        return this.calculateYearlyDate(startDate, index);
      default:
        throw new Error(`Unsupported frequency: ${frequency}`);
    }
  }

  /**
   * Calculates date for daily frequency (1 day increments)
   */
  private static calculateDailyDate(startDate: Date, index: number): Date {
    const date = new Date(startDate.getTime());
    date.setUTCDate(date.getUTCDate() + index);
    return date;
  }

  /**
   * Calculates date for weekly frequency (7 day increments)
   */
  private static calculateWeeklyDate(startDate: Date, index: number): Date {
    const date = new Date(startDate.getTime());
    date.setUTCDate(date.getUTCDate() + index * 7);
    return date;
  }

  /**
   * Calculates date for monthly frequency (preserve day of month)
   * Handles edge cases:
   * - Jan 31 → Feb 28/29 (use last day of month)
   * - Month-end dates that don't exist in target month
   */
  private static calculateMonthlyDate(startDate: Date, index: number): Date {
    const year = startDate.getUTCFullYear();
    const month = startDate.getUTCMonth();
    const originalDay = startDate.getUTCDate();

    // Calculate target year and month
    const targetMonth = month + index;
    const targetYear = year + Math.floor(targetMonth / 12);
    const normalizedMonth = targetMonth % 12;

    // Get the last day of the target month using UTC
    const lastDayOfTargetMonth = new Date(Date.UTC(targetYear, normalizedMonth + 1, 0)).getUTCDate();

    // Use the original day or the last day of the month, whichever is smaller
    const targetDay = Math.min(originalDay, lastDayOfTargetMonth);

    return new Date(Date.UTC(targetYear, normalizedMonth, targetDay));
  }

  /**
   * Calculates date for yearly frequency (preserve month and day)
   * Handles edge case:
   * - Feb 29 → Feb 28 in non-leap years
   */
  private static calculateYearlyDate(startDate: Date, index: number): Date {
    const year = startDate.getUTCFullYear();
    const month = startDate.getUTCMonth();
    const originalDay = startDate.getUTCDate();

    const targetYear = year + index;

    // Handle Feb 29 in non-leap years
    if (month === 1 && originalDay === 29 && !this.isLeapYear(targetYear)) {
      return new Date(Date.UTC(targetYear, month, 28));
    }

    // Get the last day of the target month using UTC
    const lastDayOfTargetMonth = new Date(Date.UTC(targetYear, month + 1, 0)).getUTCDate();

    // Use the original day or the last day of the month, whichever is smaller
    const targetDay = Math.min(originalDay, lastDayOfTargetMonth);

    return new Date(Date.UTC(targetYear, month, targetDay));
  }

  /**
   * Checks if a year is a leap year
   */
  private static isLeapYear(year: number): boolean {
    return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  }
}

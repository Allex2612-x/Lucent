import { prisma } from '../../shared/prisma.js';

export interface BudgetWarningData {
  categoryId: string;
  categoryName: string;
  month: number;
  year: number;
  currentSpent: number;
  budgetLimit: number;
  newTotal: number;
  overage: number;
  affectedMonths?: Array<{
    month: number;
    year: number;
    overage: number;
  }>;
}

export class BudgetValidator {
  /**
   * Check if a single transaction would exceed the budget limit for its category and month.
   * 
   * @param userId - The user ID
   * @param categoryId - The category ID
   * @param amount - The transaction amount
   * @param date - The transaction date
   * @returns BudgetWarningData if budget would be exceeded, null otherwise
   */
  static async checkBudget(
    userId: string,
    categoryId: string,
    amount: number,
    date: Date
  ): Promise<BudgetWarningData | null> {
    const month = date.getMonth() + 1; // JavaScript months are 0-indexed
    const year = date.getFullYear();

    // Query budget for matching category, month, and year
    const budget = await prisma.budget.findFirst({
      where: {
        userId,
        month,
        year,
      },
      include: {
        categories: {
          where: { categoryId },
          include: {
            category: true,
          },
        },
      },
    });

    // Skip validation if no budget exists
    if (!budget || budget.categories.length === 0) {
      return null;
    }

    const budgetCategory = budget.categories[0];
    const budgetLimit = budgetCategory.limitAmount;

    // Calculate current spent amount for category/month
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
        categoryId,
        type: 'expense',
        date: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
    });

    const currentSpent = transactions.reduce((sum, t) => sum + t.amount, 0);

    // Calculate new total: current spent + new transaction amount
    const newTotal = currentSpent + amount;

    // Return warning data if new total exceeds budget limit
    if (newTotal > budgetLimit) {
      const overage = newTotal - budgetLimit;

      return {
        categoryId,
        categoryName: budgetCategory.category.name,
        month,
        year,
        currentSpent,
        budgetLimit,
        newTotal,
        overage,
      };
    }

    return null;
  }

  /**
   * Check if recurring transaction instances would exceed budget limits in their respective months.
   * 
   * @param userId - The user ID
   * @param categoryId - The category ID
   * @param amount - The transaction amount (same for all instances)
   * @param dates - Array of transaction dates for each instance
   * @returns BudgetWarningData with affected months if any budget would be exceeded, null otherwise
   */
  static async checkRecurringBudget(
    userId: string,
    categoryId: string,
    amount: number,
    dates: Date[]
  ): Promise<BudgetWarningData | null> {
    const affectedMonths: Array<{
      month: number;
      year: number;
      overage: number;
    }> = [];

    // Check each transaction instance against its respective month's budget
    for (const date of dates) {
      const warning = await this.checkBudget(userId, categoryId, amount, date);
      
      if (warning) {
        affectedMonths.push({
          month: warning.month,
          year: warning.year,
          overage: warning.overage,
        });
      }
    }

    // Return aggregated warning data with affected months
    if (affectedMonths.length > 0) {
      // Use the first affected month for the main warning data
      const firstAffectedDate = dates.find((date) => {
        const month = date.getMonth() + 1;
        const year = date.getFullYear();
        return affectedMonths.some((am) => am.month === month && am.year === year);
      });

      if (!firstAffectedDate) {
        return null;
      }

      const firstWarning = await this.checkBudget(
        userId,
        categoryId,
        amount,
        firstAffectedDate
      );

      if (!firstWarning) {
        return null;
      }

      return {
        ...firstWarning,
        affectedMonths,
      };
    }

    return null;
  }
}

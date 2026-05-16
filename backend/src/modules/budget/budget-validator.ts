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

    // Query per-category budget for matching category, month, and year. The
    // previous version omitted `isTotal: false` and could pick up the user's
    // total-budget row (which has no categories), then skip the check
    // entirely with `categories.length === 0`. Filtering by `isTotal: false`
    // ensures we always inspect the per-category budget when one exists.
    const budget = await prisma.budget.findFirst({
      where: {
        userId,
        month,
        year,
        isTotal: false,
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

    // Per-category budget exists and includes this category — use that path.
    let perCategoryWarning: BudgetWarningData | null = null;
    if (budget && budget.categories.length > 0) {
      const budgetCategory = budget.categories[0]!;
      // Coerce Prisma Decimal to number up-front so all comparisons and
      // arithmetic below stay in the same numeric type.
      const budgetLimit = Number(budgetCategory.limitAmount);
      const startOfMonth = new Date(year, month - 1, 1);
      const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);
      const currentSpentTx = await prisma.transaction.findMany({
        where: {
          userId,
          categoryId,
          type: 'expense',
          date: { gte: startOfMonth, lte: endOfMonth },
        },
      });
      const currentSpent = currentSpentTx.reduce((s, t) => s + Number(t.amount), 0);
      const newTotal = currentSpent + Number(amount);
      if (newTotal > budgetLimit) {
        perCategoryWarning = {
          categoryId,
          categoryName: budgetCategory.category.name,
          month,
          year,
          currentSpent,
          budgetLimit,
          newTotal,
          overage: newTotal - budgetLimit,
        };
      }
    }

    // Also check the total monthly budget if one is configured. We want either
    // overage to trigger the warning — the more specific one wins.
    const totalBudget = await prisma.budget.findFirst({
      where: { userId, month, year, isTotal: true },
    });
    if (totalBudget) {
      const startOfMonth = new Date(year, month - 1, 1);
      const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);
      const allExpenseTx = await prisma.transaction.findMany({
        where: {
          userId,
          type: 'expense',
          date: { gte: startOfMonth, lte: endOfMonth },
        },
      });
      const currentSpent = allExpenseTx.reduce((s, t) => s + Number(t.amount), 0);
      const newTotal = currentSpent + Number(amount);
      const totalLimit = Number(totalBudget.totalLimit);
      if (newTotal > totalLimit) {
        // Need the category name for the warning text; fall back gracefully.
        const cat = await prisma.category.findUnique({
          where: { id: categoryId },
          select: { name: true },
        });
        const totalWarning: BudgetWarningData = {
          categoryId,
          categoryName: perCategoryWarning?.categoryName || cat?.name || 'Buget total',
          month,
          year,
          currentSpent,
          budgetLimit: totalLimit,
          newTotal,
          overage: newTotal - totalLimit,
        };
        // If both per-category and total are exceeded, surface the bigger
        // overage so the user sees the most painful one first.
        if (!perCategoryWarning || totalWarning.overage > perCategoryWarning.overage) {
          return totalWarning;
        }
      }
    }

    if (perCategoryWarning) return perCategoryWarning;
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

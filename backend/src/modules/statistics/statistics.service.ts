import { prisma } from '../../shared/prisma.js';
import { z } from 'zod';

export const overviewSchema = z.object({
  month: z.coerce.number().min(1).max(12).optional(),
  year: z.coerce.number().min(2000).optional(),
});

export const byCategorySchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  type: z.enum(['income', 'expense']).optional(),
});

export const monthlyTrendSchema = z.object({
  months: z.coerce.number().min(1).max(12).default(6),
});

export class StatisticsService {
  /**
   * Get financial overview for a specific month/year
   * If month/year not provided, uses current month/year
   */
  static async getOverview(
    userId: string,
    params?: z.infer<typeof overviewSchema>
  ) {
    const now = new Date();
    const month = params?.month ?? now.getMonth() + 1;
    const year = params?.year ?? now.getFullYear();

    // Calculate start and end dates for the month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    // Get total income
    const incomeResult = await prisma.transaction.aggregate({
      where: {
        userId,
        type: 'income',
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      _sum: {
        amount: true,
      },
    });

    // Get total expenses
    const expensesResult = await prisma.transaction.aggregate({
      where: {
        userId,
        type: 'expense',
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      _sum: {
        amount: true,
      },
    });

    // Get transaction count
    const transactionCount = await prisma.transaction.count({
      where: {
        userId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    const totalIncome = incomeResult._sum.amount ?? 0;
    const totalExpenses = expensesResult._sum.amount ?? 0;
    const balance = totalIncome - totalExpenses;

    return {
      totalIncome,
      totalExpenses,
      balance,
      transactionCount,
    };
  }

  /**
   * Get spending/income breakdown by category
   */
  static async getByCategory(
    userId: string,
    params?: z.infer<typeof byCategorySchema>
  ) {
    const whereClause: any = {
      userId,
    };

    // Add date filters if provided
    if (params?.startDate || params?.endDate) {
      whereClause.date = {};
      if (params.startDate) {
        whereClause.date.gte = new Date(params.startDate);
      }
      if (params.endDate) {
        whereClause.date.lte = new Date(params.endDate);
      }
    }

    // Add type filter if provided
    if (params?.type) {
      whereClause.type = params.type;
    }

    // Get transactions grouped by category
    const transactions = await prisma.transaction.findMany({
      where: whereClause,
      include: {
        category: true,
      },
    });

    // Calculate totals per category
    const categoryMap = new Map<
      string,
      {
        categoryId: string;
        categoryName: string;
        categoryColor: string | null;
        total: number;
      }
    >();

    let grandTotal = 0;

    for (const transaction of transactions) {
      const categoryId = transaction.categoryId;
      const existing = categoryMap.get(categoryId);

      if (existing) {
        existing.total += transaction.amount;
      } else {
        categoryMap.set(categoryId, {
          categoryId,
          categoryName: transaction.category.name,
          categoryColor: transaction.category.color,
          total: transaction.amount,
        });
      }

      grandTotal += transaction.amount;
    }

    // Convert to array and calculate percentages
    const result = Array.from(categoryMap.values()).map((item) => ({
      ...item,
      percentage: grandTotal > 0 ? (item.total / grandTotal) * 100 : 0,
    }));

    // Sort by total descending
    result.sort((a, b) => b.total - a.total);

    return result;
  }

  /**
   * Get monthly trend for the last N months
   */
  static async getMonthlyTrend(userId: string, months: number = 6) {
    const now = new Date();
    const result: Array<{
      month: number;
      year: number;
      income: number;
      expenses: number;
      balance: number;
    }> = [];

    // Generate array of {month, year} for the last N months
    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const month = date.getMonth() + 1;
      const year = date.getFullYear();

      // Calculate start and end dates for this month
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59, 999);

      // Get income for this month
      const incomeResult = await prisma.transaction.aggregate({
        where: {
          userId,
          type: 'income',
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
        _sum: {
          amount: true,
        },
      });

      // Get expenses for this month
      const expensesResult = await prisma.transaction.aggregate({
        where: {
          userId,
          type: 'expense',
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
        _sum: {
          amount: true,
        },
      });

      const income = incomeResult._sum.amount ?? 0;
      const expenses = expensesResult._sum.amount ?? 0;
      const balance = income - expenses;

      result.push({
        month,
        year,
        income,
        expenses,
        balance,
      });
    }

    return result;
  }
}

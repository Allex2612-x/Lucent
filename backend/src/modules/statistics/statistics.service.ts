import { prisma } from '../../shared/prisma.js';
import { z } from 'zod';

export const overviewSchema = z.object({
  // Mode 1: month + year → calendar-month overview (default for Dashboard).
  month: z.coerce.number().min(1).max(12).optional(),
  year: z.coerce.number().min(2000).optional(),
  // Mode 2: startDate + endDate (ISO yyyy-MM-dd) → arbitrary range,
  // used by Dashboard's "7z / 30z / 90z / An" period selector.
  // If both modes are sent, startDate/endDate take precedence.
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export const byCategorySchema = z.object({
  startDate: z.string().optional().transform((val) => {
    if (!val) return undefined;
    // Handle YYYY-MM-DD format
    if (val.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return val;
    }
    return val;
  }),
  endDate: z.string().optional().transform((val) => {
    if (!val) return undefined;
    // Handle YYYY-MM-DD format
    if (val.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return val;
    }
    return val;
  }),
  type: z.enum(['income', 'expense']).optional(),
});

export const monthlyTrendSchema = z.object({
  months: z.coerce.number().min(1).max(12).optional(),
  startDate: z.string().optional().transform((val) => {
    if (!val) return undefined;
    // Handle YYYY-MM-DD format
    if (val.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return val;
    }
    return val;
  }),
  endDate: z.string().optional().transform((val) => {
    if (!val) return undefined;
    // Handle YYYY-MM-DD format
    if (val.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return val;
    }
    return val;
  }),
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
    // Date-range mode wins if both are provided. Otherwise fall back to
    // the month/year mode (default for backwards-compat with Dashboard).
    let startDate: Date;
    let endDate: Date;
    if (params?.startDate && params?.endDate) {
      startDate = new Date(params.startDate);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(params.endDate);
      endDate.setHours(23, 59, 59, 999);
    } else {
      const month = params?.month ?? now.getMonth() + 1;
      const year = params?.year ?? now.getFullYear();
      startDate = new Date(year, month - 1, 1);
      endDate = new Date(year, month, 0, 23, 59, 59, 999);
    }

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

    // Coerce Prisma Decimal -> number so the JSON response carries plain
    // numbers (not stringified Decimals), keeping the frontend math sane.
    const totalIncome = Number(incomeResult._sum.amount ?? 0);
    const totalExpenses = Number(expensesResult._sum.amount ?? 0);
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

    // Add date filters if provided — respect the exact day, not the whole
    // calendar month (frontend now sends day-level dates).
    if (params?.startDate || params?.endDate) {
      whereClause.date = {};
      if (params.startDate) {
        const start = new Date(params.startDate);
        start.setHours(0, 0, 0, 0);
        whereClause.date.gte = start;
      }
      if (params.endDate) {
        const end = new Date(params.endDate);
        end.setHours(23, 59, 59, 999);
        whereClause.date.lte = end;
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
        categoryIcon: string | null;
        categoryColor: string | null;
        total: number;
        count: number;
      }
    >();

    let grandTotal = 0;

    for (const transaction of transactions) {
      const categoryId = transaction.categoryId;
      const existing = categoryMap.get(categoryId);
      const amount = Number(transaction.amount);

      if (existing) {
        existing.total += amount;
        existing.count += 1;
      } else {
        categoryMap.set(categoryId, {
          categoryId,
          categoryName: transaction.category.name,
          categoryIcon: transaction.category.icon,
          categoryColor: transaction.category.color,
          total: amount,
          count: 1,
        });
      }

      grandTotal += amount;
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
   * Get monthly trend for a date range or last N months
   */
  static async getMonthlyTrend(
    userId: string, 
    params?: { months?: number; startDate?: string; endDate?: string }
  ) {
    const result: Array<{
      month: number;
      year: number;
      income: number;
      expenses: number;
      balance: number;
    }> = [];

    let startDate: Date;
    let endDate: Date;

    // If startDate and endDate are provided, use them
    if (params?.startDate && params?.endDate) {
      const start = new Date(params.startDate);
      const end = new Date(params.endDate);
      
      // Start from the beginning of the start month
      startDate = new Date(start.getFullYear(), start.getMonth(), 1);
      // End at the last day of the end month
      endDate = new Date(end.getFullYear(), end.getMonth() + 1, 0, 23, 59, 59, 999);
    } else {
      // Otherwise, use the last N months (default 6)
      const months = params?.months || 6;
      const now = new Date();
      startDate = new Date(now.getFullYear(), now.getMonth() - months + 1, 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    }

    // Generate array of months between startDate and endDate
    const currentMonth = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
    const lastMonth = new Date(endDate.getFullYear(), endDate.getMonth(), 1);

    while (currentMonth <= lastMonth) {
      const month = currentMonth.getMonth() + 1;
      const year = currentMonth.getFullYear();

      // Calculate start and end dates for this month
      const monthStart = new Date(year, month - 1, 1);
      const monthEnd = new Date(year, month, 0, 23, 59, 59, 999);

      // Get income for this month
      const incomeResult = await prisma.transaction.aggregate({
        where: {
          userId,
          type: 'income',
          date: {
            gte: monthStart,
            lte: monthEnd,
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
            gte: monthStart,
            lte: monthEnd,
          },
        },
        _sum: {
          amount: true,
        },
      });

      // Coerce Prisma Decimal -> plain number so the JSON response carries
      // numeric values, not stringified Decimals. Without this `income`
      // arrives at the frontend as "100.50", which silently corrupts
      // anything that does string concatenation (e.g. `income + expenses`).
      const income = Number(incomeResult._sum.amount ?? 0);
      const expenses = Number(expensesResult._sum.amount ?? 0);
      const balance = income - expenses;

      result.push({
        month,
        year,
        income,
        expenses,
        balance,
      });

      // Move to next month
      currentMonth.setMonth(currentMonth.getMonth() + 1);
    }

    return result;
  }
}

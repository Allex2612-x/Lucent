import { prisma } from '../../shared/prisma.js';
import { NotFoundError, BadRequestError } from '../../shared/errors.js';
import { z } from 'zod';
import { NotificationService } from '../notification/notification.service.js';

export const createBudgetSchema = z.object({
  month: z.number().min(1).max(12),
  year: z.number().min(2000),
  totalLimit: z.number().positive(),
  isTotal: z.boolean().default(false),
  categories: z.array(z.object({
    categoryId: z.string().uuid(),
    limitAmount: z.number().positive()
  })).optional(),
}).refine(
  (data) => {
    // If isTotal is true, categories should be empty or undefined
    // If isTotal is false, categories should have at least 1 item
    if (data.isTotal) {
      return !data.categories || data.categories.length === 0;
    } else {
      return data.categories && data.categories.length >= 1;
    }
  },
  {
    message: "Bugetul total nu poate avea categorii, iar bugetul pe categorii trebuie să aibă cel puțin o categorie",
  }
);

export const updateBudgetSchema = z.object({
  totalLimit: z.number().positive().optional(),
  categories: z.array(z.object({
    categoryId: z.string().uuid(),
    limitAmount: z.number().positive()
  })).optional(),
});

export class BudgetService {
  static async getBudgets(userId: string) {
    return prisma.budget.findMany({
      where: { userId },
      include: {
        categories: {
          include: { category: true }
        }
      },
      orderBy: [
        { year: 'desc' },
        { month: 'desc' },
      ]
    });
  }

  static async getBudgetById(userId: string, id: string) {
    const budget = await prisma.budget.findFirst({
      where: { id, userId },
      include: {
        categories: {
          include: { category: true }
        }
      }
    });

    if (!budget) throw new NotFoundError('Budget not found');
    return budget;
  }

  static async createBudget(userId: string, data: z.infer<typeof createBudgetSchema>) {
    // Check if budget already exists for this month/year/type
    const existing = await prisma.budget.findFirst({
      where: { 
        userId, 
        month: data.month, 
        year: data.year,
        isTotal: data.isTotal 
      }
    });

    if (existing) {
      const budgetType = data.isTotal ? 'total' : 'pe categorii';
      throw new BadRequestError(`Buget ${budgetType} pentru ${data.month}/${data.year} există deja.`);
    }

    const created = await prisma.budget.create({
      data: {
        month: data.month,
        year: data.year,
        totalLimit: data.totalLimit,
        isTotal: data.isTotal,
        userId,
        ...(data.categories && data.categories.length > 0 ? {
          categories: {
            create: data.categories.map(c => ({
              categoryId: c.categoryId,
              limitAmount: c.limitAmount
            }))
          }
        } : {})
      },
      include: {
        categories: {
          include: { category: true }
        }
      }
    });

    // Compare existing transactions for the budget's month/year against the
    // freshly-set limits and surface any overflows so the frontend can show
    // a "deja depășit" notification immediately. We also call
    // NotificationService so the bell badge picks it up.
    const overflows = await this.checkBudgetAgainstExistingTransactions(userId, created);

    return { ...created, overflows };
  }

  /**
   * After a budget is created (or updated), scan the actual transactions in
   * its month/year window and report any category whose spending already
   * meets/exceeds the new limit. Persists notifications too via the
   * existing NotificationService.
   */
  private static async checkBudgetAgainstExistingTransactions(
    userId: string,
    budget: any,
  ): Promise<Array<{
    categoryId: string | null;
    categoryName: string;
    spent: number;
    limit: number;
    severity: 'exceeded' | 'near';
  }>> {
    const startOfMonth = new Date(budget.year, budget.month - 1, 1);
    const endOfMonth = new Date(budget.year, budget.month, 0, 23, 59, 59, 999);

    const overflows: Array<{
      categoryId: string | null;
      categoryName: string;
      spent: number;
      limit: number;
      severity: 'exceeded' | 'near';
    }> = [];

    // Per-category check
    for (const bc of budget.categories) {
      const txs = await prisma.transaction.findMany({
        where: {
          userId,
          categoryId: bc.categoryId,
          type: 'expense',
          date: { gte: startOfMonth, lte: endOfMonth },
        },
      });
      const spent = txs.reduce((s, t) => s + Number(t.amount), 0);
      const limit = Number(bc.limitAmount);
      if (limit <= 0) continue;
      const pct = (spent / limit) * 100;
      if (pct >= 100) {
        overflows.push({
          categoryId: bc.categoryId,
          categoryName: bc.category?.name ?? 'Necunoscut',
          spent,
          limit,
          severity: 'exceeded',
        });
        // Calling the existing helper picks up the actual transactions and
        // creates the notification idempotently. We pass the last tx date
        // (or a midpoint) since the helper recomputes the month from it.
        const lastDate = txs.length > 0 ? txs[txs.length - 1]!.date : new Date(budget.year, budget.month - 1, 1);
        await NotificationService.checkAndCreateBudgetNotifications(
          userId,
          bc.categoryId,
          lastDate,
        );
      } else if (pct >= 80) {
        overflows.push({
          categoryId: bc.categoryId,
          categoryName: bc.category?.name ?? 'Necunoscut',
          spent,
          limit,
          severity: 'near',
        });
        const lastDate = txs.length > 0 ? txs[txs.length - 1]!.date : new Date(budget.year, budget.month - 1, 1);
        await NotificationService.checkAndCreateBudgetNotifications(
          userId,
          bc.categoryId,
          lastDate,
        );
      }
    }

    // Total budget check
    if (budget.isTotal) {
      const txs = await prisma.transaction.findMany({
        where: {
          userId,
          type: 'expense',
          date: { gte: startOfMonth, lte: endOfMonth },
        },
      });
      const spent = txs.reduce((s, t) => s + Number(t.amount), 0);
      const limit = Number(budget.totalLimit);
      const pct = limit > 0 ? (spent / limit) * 100 : 0;
      if (pct >= 100 || pct >= 80) {
        overflows.push({
          categoryId: null,
          categoryName: 'Buget total',
          spent,
          limit,
          severity: pct >= 100 ? 'exceeded' : 'near',
        });
        // For total budgets we create the notification directly since the
        // existing helper is per-category.
        const title = pct >= 100 ? 'Buget total depășit' : 'Buget total aproape de limită';
        const msg = `Cheltuielile lunii sunt ${spent.toFixed(2)} RON din ${limit.toFixed(2)} RON (${pct.toFixed(0)}%).`;
        const existing = await prisma.notification.findFirst({
          where: {
            userId,
            type: pct >= 100 ? 'budget_exceeded' : 'budget_near_limit',
            relatedEntityId: budget.id,
            isRead: false,
          },
        });
        if (!existing) {
          await prisma.notification.create({
            data: {
              userId,
              type: pct >= 100 ? 'budget_exceeded' : 'budget_near_limit',
              title,
              message: msg,
              relatedEntityId: budget.id,
            },
          });
        }
      }
    }

    return overflows;
  }

  static async updateBudget(userId: string, id: string, data: z.infer<typeof updateBudgetSchema>) {
    const budget = await prisma.budget.findFirst({ where: { id, userId } });
    if (!budget) throw new NotFoundError('Budget not found');

    if (data.categories) {
      // Simplest approach: Delete existing budget categories and recreate them
      await prisma.budgetCategory.deleteMany({ where: { budgetId: id } });
    }

    return prisma.budget.update({
      where: { id },
      data: {
        ...(data.totalLimit ? { totalLimit: data.totalLimit } : {}),
        ...(data.categories ? {
          categories: {
            create: data.categories.map(c => ({
              categoryId: c.categoryId,
              limitAmount: c.limitAmount
            }))
          }
        } : {})
      },
      include: { categories: true }
    });
  }

  static async deleteBudget(userId: string, id: string) {
    const budget = await prisma.budget.findFirst({ where: { id, userId } });
    if (!budget) throw new NotFoundError('Budget not found');

    return prisma.budget.delete({ where: { id } });
  }
}

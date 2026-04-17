import { prisma } from '../../shared/prisma.js';
import { NotFoundError, BadRequestError } from '../../shared/errors.js';
import { z } from 'zod';

export const createBudgetSchema = z.object({
  month: z.number().min(1).max(12),
  year: z.number().min(2000),
  totalLimit: z.number().positive(),
  categories: z.array(z.object({
    categoryId: z.string().uuid(),
    limitAmount: z.number().positive()
  })).min(1),
});

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
    const existing = await prisma.budget.findFirst({
      where: { userId, month: data.month, year: data.year }
    });

    if (existing) {
      throw new BadRequestError(`Budget for ${data.month}/${data.year} already exists.`);
    }

    return prisma.budget.create({
      data: {
        month: data.month,
        year: data.year,
        totalLimit: data.totalLimit,
        userId,
        categories: {
          create: data.categories.map(c => ({
            categoryId: c.categoryId,
            limitAmount: c.limitAmount
          }))
        }
      },
      include: { categories: true }
    });
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

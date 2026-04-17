import { prisma } from '../../shared/prisma.js';
import { NotFoundError } from '../../shared/errors.js';
import { z } from 'zod';

export const createTransactionSchema = z.object({
  amount: z.number().positive(),
  type: z.enum(['income', 'expense']),
  description: z.string().optional(),
  date: z.string().datetime().or(z.date()),
  categoryId: z.string().uuid(),
  receiptUrl: z.string().optional(),
  isRecurring: z.boolean().default(false),
});

export const updateTransactionSchema = createTransactionSchema.partial();

export class TransactionService {
  static async getTransactions(userId: string, filters: { startDate?: string; endDate?: string }) {
    return prisma.transaction.findMany({
      where: { 
        userId,
        ...(filters.startDate && filters.endDate ? {
          date: {
            gte: new Date(filters.startDate),
            lte: new Date(filters.endDate)
          }
        } : {})
      },
      include: {
        category: true
      },
      orderBy: { date: 'desc' }
    });
  }

  static async createTransaction(userId: string, data: z.infer<typeof createTransactionSchema>) {
    return prisma.transaction.create({
      data: {
        amount: data.amount,
        type: data.type,
        description: data.description,
        date: new Date(data.date),
        categoryId: data.categoryId,
        receiptUrl: data.receiptUrl,
        isRecurring: data.isRecurring,
        userId,
      },
      include: { category: true }
    });
  }

  static async getTransactionById(userId: string, id: string) {
    const transaction = await prisma.transaction.findFirst({
      where: { id, userId },
      include: { category: true }
    });
    
    if (!transaction) throw new NotFoundError('Transaction not found');
    return transaction;
  }

  static async updateTransaction(userId: string, id: string, data: z.infer<typeof updateTransactionSchema>) {
    const transaction = await prisma.transaction.findFirst({ where: { id, userId } });
    if (!transaction) throw new NotFoundError('Transaction not found');

    return prisma.transaction.update({
      where: { id },
      data: {
        ...data,
        ...(data.date ? { date: new Date(data.date) } : {})
      },
      include: { category: true }
    });
  }

  static async deleteTransaction(userId: string, id: string) {
    const transaction = await prisma.transaction.findFirst({ where: { id, userId } });
    if (!transaction) throw new NotFoundError('Transaction not found');

    return prisma.transaction.delete({ where: { id } });
  }
}

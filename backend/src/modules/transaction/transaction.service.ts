import { prisma } from '../../shared/prisma.js';
import { NotFoundError } from '../../shared/errors.js';
import { z } from 'zod';
import { NotificationService } from '../notification/notification.service.js';

export const RecurringFrequencyEnum = z.enum(['daily', 'weekly', 'monthly', 'yearly']);

// Base schema without refinements (can be used with .partial())
const baseTransactionSchema = z.object({
  amount: z.number().positive('Suma trebuie să fie pozitivă'),
  type: z.enum(['income', 'expense']),
  description: z.string().optional(),
  date: z.string().or(z.date()).transform((val) => new Date(val)),
  categoryId: z.string().uuid('ID categorie invalid'),
  receiptUrl: z.string().optional(),
  // Structured digital receipt extracted by Gemini OCR. We don't strictly
  // validate the inner shape on the way in — the scanner endpoint owns
  // the shape and we trust whatever it produced. Anything goes here is
  // round-tripped into the DB Json column.
  receiptData: z.any().optional(),
  isRecurring: z.boolean().default(false),
  frequency: RecurringFrequencyEnum.optional(),
  repetitionCount: z.number().int().min(1, 'Numărul de repetări trebuie să fie cel puțin 1').max(365, 'Numărul de repetări nu poate depăși 365').optional(),
});

// Create schema with refinement for validation
export const createTransactionSchema = baseTransactionSchema.refine(
  (data) => {
    // If isRecurring is true, frequency and repetitionCount are required
    if (data.isRecurring) {
      return data.frequency !== undefined && data.repetitionCount !== undefined;
    }
    return true;
  },
  {
    message: 'Frecvența și numărul de repetări sunt obligatorii pentru tranzacții recurente',
    path: ['isRecurring'],
  }
);

// Update schema without refinement (safe to use .partial())
export const updateTransactionSchema = baseTransactionSchema.partial();

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
    const transaction = await prisma.transaction.create({
      data: {
        amount: data.amount,
        type: data.type,
        description: data.description,
        date: new Date(data.date),
        categoryId: data.categoryId,
        receiptUrl: data.receiptUrl,
        receiptData: data.receiptData ?? undefined,
        isRecurring: data.isRecurring,
        userId,
      },
      include: { category: true }
    });

    // Check and create budget notifications if this is an expense
    if (data.type === 'expense') {
      await NotificationService.checkAndCreateBudgetNotifications(
        userId,
        data.categoryId,
        new Date(data.date)
      );
    }

    return transaction;
  }

  static async createRecurringTransactions(
    userId: string,
    instances: Array<{
      amount: number;
      type: 'income' | 'expense';
      description: string | undefined;
      date: Date;
      categoryId: string;
      isRecurring: boolean;
      recurringGroupId: string;
      frequency: string;
      originalStartDate: Date;
      sequenceNumber: number;
    }>
  ) {
    // Use Prisma transaction for atomic batch creation
    const created = await prisma.$transaction(async (tx) => {
      const rows = [];

      for (const instance of instances) {
        const transaction = await tx.transaction.create({
          data: {
            ...instance,
            userId,
          },
          include: { category: true }
        });
        rows.push(transaction);
      }

      return rows;
    });

    // Mirror the single-create path: fire budget notifications once per distinct
    // (category, year-month) the expense instances land in. Done AFTER the batch
    // commits so the spend recompute sees the new rows, and deduped because the
    // budget_exceeded branch is intentionally non-idempotent (one call per month,
    // not one per instance, so the bell isn't spammed).
    const seen = new Set<string>();
    for (const i of instances) {
      if (i.type !== 'expense') continue;
      const key = `${i.categoryId}-${i.date.getFullYear()}-${i.date.getMonth()}`;
      if (seen.has(key)) continue;
      seen.add(key);
      await NotificationService.checkAndCreateBudgetNotifications(userId, i.categoryId, i.date);
    }

    return created;
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

    // A plain edit must never mutate recurring-series membership. Drop any
    // isRecurring / frequency / repetitionCount coming from the client so a
    // single-instance edit can't silently orphan the row from its group.
    const { isRecurring, frequency, repetitionCount, ...safe } = data as any;

    const updatedTransaction = await prisma.transaction.update({
      where: { id },
      data: {
        ...safe,
        ...(safe.date ? { date: new Date(safe.date) } : {})
      },
      include: { category: true }
    });

    // Check and create budget notifications if this is an expense
    // Use the updated type if provided, otherwise use the original type
    const finalType = safe.type || transaction.type;
    if (finalType === 'expense') {
      await NotificationService.checkAndCreateBudgetNotifications(
        userId,
        safe.categoryId || transaction.categoryId,
        safe.date ? new Date(safe.date) : transaction.date
      );
    }

    return updatedTransaction;
  }

  static async deleteTransaction(userId: string, id: string, deleteFuture: boolean = false) {
    const transaction = await prisma.transaction.findFirst({ where: { id, userId } });
    if (!transaction) throw new NotFoundError('Transaction not found');

    // If deleteFuture is true and transaction is recurring, delete all future instances
    if (deleteFuture && transaction.isRecurring && transaction.recurringGroupId) {
      // Delete the selected transaction and all future instances in the same recurring group
      return await prisma.transaction.deleteMany({
        where: {
          userId,
          recurringGroupId: transaction.recurringGroupId,
          date: {
            gte: transaction.date, // Delete transactions with date >= selected transaction date
          },
        },
      });
    }

    // Otherwise, delete only the selected transaction
    return prisma.transaction.delete({ where: { id } });
  }
}

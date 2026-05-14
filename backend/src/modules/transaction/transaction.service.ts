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

// Bulk-import schema. Rejects empty arrays; per-row failures are surfaced
// individually by the service so the caller can show a partial-success result.
export const bulkImportSchema = z.object({
  transactions: z
    .array(
      z.object({
        amount: z.number().positive(),
        type: z.enum(['income', 'expense']),
        description: z.string().optional(),
        date: z.string().or(z.date()).transform((val) => new Date(val)),
        categoryId: z.string().uuid(),
      }),
    )
    .min(1, 'Cel puțin o tranzacție este necesară')
    .max(2000, 'Maxim 2000 de tranzacții pe import'),
});

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

  static async bulkImportTransactions(
    userId: string,
    rows: z.infer<typeof bulkImportSchema>['transactions'],
  ) {
    const succeeded: Array<{ index: number; id: string }> = [];
    const failed: Array<{ index: number; reason: string }> = [];

    // Run as a single Prisma transaction so partial failures roll back.
    await prisma.$transaction(async (tx) => {
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i]!;
        try {
          // sanity check: ensure the category belongs to this user (or is default)
          const cat = await tx.category.findFirst({
            where: {
              id: row.categoryId,
              OR: [{ userId }, { isDefault: true, userId: null }],
            },
          });
          if (!cat) {
            failed.push({ index: i, reason: 'Categorie inexistentă' });
            continue;
          }
          if (cat.type !== row.type) {
            failed.push({
              index: i,
              reason: `Categoria "${cat.name}" este pentru ${cat.type === 'income' ? 'venituri' : 'cheltuieli'}`,
            });
            continue;
          }
          const created = await tx.transaction.create({
            data: {
              amount: row.amount,
              type: row.type,
              description: row.description,
              date: row.date,
              categoryId: row.categoryId,
              userId,
              isRecurring: false,
            },
          });
          succeeded.push({ index: i, id: created.id });
        } catch (err: any) {
          failed.push({ index: i, reason: err?.message ?? 'Eroare necunoscută' });
        }
      }
    });

    return {
      total: rows.length,
      succeededCount: succeeded.length,
      failedCount: failed.length,
      succeeded,
      failed,
    };
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
    return await prisma.$transaction(async (tx) => {
      const created = [];
      
      for (const instance of instances) {
        const transaction = await tx.transaction.create({
          data: {
            ...instance,
            userId,
          },
          include: { category: true }
        });
        created.push(transaction);
      }
      
      return created;
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

    const updatedTransaction = await prisma.transaction.update({
      where: { id },
      data: {
        ...data,
        ...(data.date ? { date: new Date(data.date) } : {})
      },
      include: { category: true }
    });

    // Check and create budget notifications if this is an expense
    // Use the updated type if provided, otherwise use the original type
    const finalType = data.type || transaction.type;
    if (finalType === 'expense') {
      await NotificationService.checkAndCreateBudgetNotifications(
        userId,
        data.categoryId || transaction.categoryId,
        data.date ? new Date(data.date) : transaction.date
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

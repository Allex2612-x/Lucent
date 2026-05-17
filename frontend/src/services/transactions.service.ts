import { api } from './api';

export interface TransactionFilters {
  type?: 'income' | 'expense';
  categoryId?: string;
  startDate?: string;
  endDate?: string;
}

export type RecurringFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface TransactionData {
  description: string;
  amount: number;
  type: 'income' | 'expense';
  categoryId: string;
  date: string;
  isRecurring?: boolean;
  frequency?: RecurringFrequency;
  repetitionCount?: number;
  receiptUrl?: string;
}

export interface BudgetWarning {
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

export const transactionsService = {
  getAll: (filters?: TransactionFilters) => {
    return api.get('/transactions', { params: filters });
  },

  create: (data: TransactionData, force?: boolean) => {
    const params = force ? { force: 'true' } : {};
    return api.post('/transactions', data, { params });
  },

  update: (id: string, data: Partial<TransactionData>) => {
    return api.patch(`/transactions/${id}`, data);
  },

  delete: (id: string, deleteFuture?: boolean) => {
    const params = deleteFuture ? { deleteFuture: 'true' } : {};
    return api.delete(`/transactions/${id}`, { params });
  },

  bulkImport: (
    transactions: Array<{
      amount: number;
      type: 'income' | 'expense';
      description?: string;
      date: string;
      categoryId: string;
    }>,
  ) => {
    return api.post<{
      success: boolean;
      data: {
        total: number;
        succeededCount: number;
        failedCount: number;
        succeeded: Array<{ index: number; id: string }>;
        failed: Array<{ index: number; reason: string }>;
      };
    }>('/transactions/import', { transactions });
  },
};

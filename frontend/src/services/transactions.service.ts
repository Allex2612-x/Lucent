import { api } from './api';

export interface TransactionFilters {
  type?: 'income' | 'expense';
  categoryId?: string;
  startDate?: string;
  endDate?: string;
}

export interface TransactionData {
  description: string;
  amount: number;
  type: 'income' | 'expense';
  categoryId: string;
  date: string;
}

export const transactionsService = {
  getAll: (filters?: TransactionFilters) => {
    return api.get('/transactions', { params: filters });
  },

  create: (data: TransactionData) => {
    return api.post('/transactions', data);
  },

  update: (id: string, data: Partial<TransactionData>) => {
    return api.patch(`/transactions/${id}`, data);
  },

  delete: (id: string) => {
    return api.delete(`/transactions/${id}`);
  },
};

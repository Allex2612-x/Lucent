import { api } from './api';

export interface BudgetCategoryData {
  categoryId: string;
  limitAmount: number;
}

export interface BudgetData {
  month: number;
  year: number;
  totalLimit: number;
  isTotal: boolean;
  categories?: BudgetCategoryData[];
}

export const budgetsService = {
  getAll: () => {
    return api.get('/budgets');
  },

  create: (data: BudgetData) => {
    return api.post('/budgets', data);
  },

  update: (id: string, data: Partial<BudgetData>) => {
    return api.patch(`/budgets/${id}`, data);
  },

  delete: (id: string) => {
    return api.delete(`/budgets/${id}`);
  },
};

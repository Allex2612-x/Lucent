import { api } from './api';

export interface CategoryData {
  name: string;
  type: 'income' | 'expense';
  color?: string;
  icon?: string;
}

export const categoriesService = {
  getAll: () => {
    return api.get('/categories');
  },

  create: (data: CategoryData) => {
    return api.post('/categories', data);
  },

  update: (id: string, data: Partial<CategoryData>) => {
    return api.patch(`/categories/${id}`, data);
  },

  delete: (id: string) => {
    return api.delete(`/categories/${id}`);
  },
};

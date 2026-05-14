import { api } from './api';

export interface CategoryData {
  name: string;
  type: 'income' | 'expense';
  color?: string;
  icon?: string;
}

export interface CategorySuggestion {
  categoryId: string;
  categoryName: string;
  confidence: number;
  matchedKeyword: string;
}

export const categoriesService = {
  getAll: () => {
    return api.get('/categories');
  },

  suggest: (description: string, type: 'income' | 'expense') => {
    return api.get<{ success: boolean; data: CategorySuggestion | null }>('/categories/suggest', {
      params: { description, type },
    });
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

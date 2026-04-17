export interface Category {
  id: string;
  name: string;
  icon?: string | null;
  color?: string | null;
  type: 'income' | 'expense';
  userId?: string | null; // null for default categories
  isDefault: boolean;
  createdAt: Date;
}

export interface CreateCategoryDTO {
  name: string;
  type: 'income' | 'expense';
  icon?: string;
  color?: string;
}

export interface UpdateCategoryDTO extends Partial<CreateCategoryDTO> {}

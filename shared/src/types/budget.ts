export interface Budget {
  id: string;
  month: number;
  year: number;
  totalLimit: number;
  userId: string;
  createdAt: Date;
  categories?: BudgetCategory[];
}

export interface BudgetCategory {
  id: string;
  budgetId: string;
  categoryId: string;
  limitAmount: number;
  createdAt: Date;
}

export interface CreateBudgetDTO {
  month: number;
  year: number;
  totalLimit: number;
  categories: {
    categoryId: string;
    limitAmount: number;
  }[];
}

export interface UpdateBudgetDTO extends Partial<Omit<CreateBudgetDTO, 'month' | 'year'>> {}

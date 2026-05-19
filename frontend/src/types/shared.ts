/**
 * Shared domain types — inlined from the former @sasha-licenta/shared
 * workspace package so the frontend builds in isolation (Railway's
 * subdirectory deploy mode doesn't include sibling packages).
 *
 * Keep in sync with the backend's Prisma schema. These mirror the
 * shape of API responses, not the raw DB rows.
 */

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  currency: string;
  avatarUrl?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

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

export interface Transaction {
  id: string;
  amount: number;
  type: 'income' | 'expense';
  description?: string | null;
  date: Date;
  categoryId: string;
  userId: string;
  receiptUrl?: string | null;
  isRecurring: boolean;
  createdAt: Date;
}

export interface CreateTransactionDTO {
  amount: number;
  type: 'income' | 'expense';
  description?: string;
  date: Date | string;
  categoryId: string;
  receiptUrl?: string;
  isRecurring?: boolean;
}

export interface UpdateTransactionDTO extends Partial<CreateTransactionDTO> {}

export interface Notification {
  id: string;
  userId: string;
  type: 'budget_exceeded' | 'budget_near_limit' | 'bill_reminder';
  title: string;
  message: string;
  isRead: boolean;
  relatedEntityId?: string | null;
  createdAt: Date;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: unknown;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

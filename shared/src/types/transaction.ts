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

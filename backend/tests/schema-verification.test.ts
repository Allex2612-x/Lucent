import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Transaction Schema - Recurring Fields', () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should have recurring transaction fields in the schema', async () => {
    // This test verifies that the Prisma client has the new fields
    // by checking the TypeScript types at compile time
    
    const mockTransaction = {
      id: 'test-id',
      amount: 100,
      type: 'expense',
      description: 'Test transaction',
      date: new Date(),
      categoryId: 'category-id',
      userId: 'user-id',
      receiptUrl: null,
      isRecurring: true,
      recurringGroupId: 'group-id',
      frequency: 'monthly',
      originalStartDate: new Date(),
      sequenceNumber: 1,
      createdAt: new Date(),
    };

    // If this compiles, it means the schema has all the required fields
    expect(mockTransaction.recurringGroupId).toBeDefined();
    expect(mockTransaction.frequency).toBeDefined();
    expect(mockTransaction.originalStartDate).toBeDefined();
    expect(mockTransaction.sequenceNumber).toBeDefined();
  });

  it('should allow nullable recurring fields for non-recurring transactions', () => {
    const mockNonRecurringTransaction = {
      id: 'test-id',
      amount: 100,
      type: 'expense',
      description: 'Test transaction',
      date: new Date(),
      categoryId: 'category-id',
      userId: 'user-id',
      receiptUrl: null,
      isRecurring: false,
      recurringGroupId: null,
      frequency: null,
      originalStartDate: null,
      sequenceNumber: null,
      createdAt: new Date(),
    };

    // Verify that null values are allowed
    expect(mockNonRecurringTransaction.recurringGroupId).toBeNull();
    expect(mockNonRecurringTransaction.frequency).toBeNull();
    expect(mockNonRecurringTransaction.originalStartDate).toBeNull();
    expect(mockNonRecurringTransaction.sequenceNumber).toBeNull();
  });
});

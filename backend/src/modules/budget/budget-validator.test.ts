import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { prisma } from '../../shared/prisma.js';
import { BudgetValidator } from './budget-validator.js';

describe('BudgetValidator', () => {
  let testUserId: string;
  let testCategoryId: string;
  let testBudgetId: string;

  beforeEach(async () => {
    // Create test user
    const user = await prisma.user.create({
      data: {
        email: `test-budget-validator-${Date.now()}@example.com`,
        password: 'hashedpassword',
        firstName: 'Test',
        lastName: 'User',
      },
    });
    testUserId = user.id;

    // Create test category
    const category = await prisma.category.create({
      data: {
        name: 'Test Category',
        type: 'expense',
        userId: testUserId,
      },
    });
    testCategoryId = category.id;

    // Create test budget with category limit
    const budget = await prisma.budget.create({
      data: {
        month: 1,
        year: 2024,
        totalLimit: 1000,
        isTotal: false,
        userId: testUserId,
        categories: {
          create: {
            categoryId: testCategoryId,
            limitAmount: 500,
          },
        },
      },
    });
    testBudgetId = budget.id;
  });

  afterEach(async () => {
    // Clean up test data
    await prisma.transaction.deleteMany({ where: { userId: testUserId } });
    await prisma.budgetCategory.deleteMany({ where: { budgetId: testBudgetId } });
    await prisma.budget.deleteMany({ where: { userId: testUserId } });
    await prisma.category.deleteMany({ where: { userId: testUserId } });
    await prisma.user.delete({ where: { id: testUserId } });
  });

  describe('checkBudget', () => {
    it('should return null when no budget exists for the category', async () => {
      // Create a category without a budget
      const categoryWithoutBudget = await prisma.category.create({
        data: {
          name: 'No Budget Category',
          type: 'expense',
          userId: testUserId,
        },
      });

      const result = await BudgetValidator.checkBudget(
        testUserId,
        categoryWithoutBudget.id,
        100,
        new Date('2024-01-15')
      );

      expect(result).toBeNull();

      // Clean up
      await prisma.category.delete({ where: { id: categoryWithoutBudget.id } });
    });

    it('should return null when budget is not exceeded', async () => {
      // Add existing transactions totaling 300
      await prisma.transaction.createMany({
        data: [
          {
            amount: 150,
            type: 'expense',
            date: new Date('2024-01-10'),
            categoryId: testCategoryId,
            userId: testUserId,
          },
          {
            amount: 150,
            type: 'expense',
            date: new Date('2024-01-12'),
            categoryId: testCategoryId,
            userId: testUserId,
          },
        ],
      });

      // New transaction of 100 would make total 400, which is under 500 limit
      const result = await BudgetValidator.checkBudget(
        testUserId,
        testCategoryId,
        100,
        new Date('2024-01-15')
      );

      expect(result).toBeNull();
    });

    it('should return warning data when budget is exceeded', async () => {
      // Add existing transactions totaling 400
      await prisma.transaction.createMany({
        data: [
          {
            amount: 200,
            type: 'expense',
            date: new Date('2024-01-10'),
            categoryId: testCategoryId,
            userId: testUserId,
          },
          {
            amount: 200,
            type: 'expense',
            date: new Date('2024-01-12'),
            categoryId: testCategoryId,
            userId: testUserId,
          },
        ],
      });

      // New transaction of 150 would make total 550, which exceeds 500 limit
      const result = await BudgetValidator.checkBudget(
        testUserId,
        testCategoryId,
        150,
        new Date('2024-01-15')
      );

      expect(result).not.toBeNull();
      expect(result).toMatchObject({
        categoryId: testCategoryId,
        categoryName: 'Test Category',
        month: 1,
        year: 2024,
        currentSpent: 400,
        budgetLimit: 500,
        newTotal: 550,
        overage: 50,
      });
    });

    it('should only count expense transactions in the same month', async () => {
      // Add transactions in different months
      await prisma.transaction.createMany({
        data: [
          {
            amount: 200,
            type: 'expense',
            date: new Date('2024-01-10'),
            categoryId: testCategoryId,
            userId: testUserId,
          },
          {
            amount: 300,
            type: 'expense',
            date: new Date('2024-02-10'), // Different month
            categoryId: testCategoryId,
            userId: testUserId,
          },
        ],
      });

      // New transaction of 250 in January would make total 450, which is under 500 limit
      const result = await BudgetValidator.checkBudget(
        testUserId,
        testCategoryId,
        250,
        new Date('2024-01-15')
      );

      expect(result).toBeNull();
    });

    it('should not count income transactions', async () => {
      // Add income and expense transactions
      await prisma.transaction.createMany({
        data: [
          {
            amount: 400,
            type: 'expense',
            date: new Date('2024-01-10'),
            categoryId: testCategoryId,
            userId: testUserId,
          },
          {
            amount: 1000,
            type: 'income', // Should not be counted
            date: new Date('2024-01-12'),
            categoryId: testCategoryId,
            userId: testUserId,
          },
        ],
      });

      // New transaction of 50 would make total 450 (not counting income), which is under 500 limit
      const result = await BudgetValidator.checkBudget(
        testUserId,
        testCategoryId,
        50,
        new Date('2024-01-15')
      );

      expect(result).toBeNull();
    });
  });

  describe('checkRecurringBudget', () => {
    it('should return null when no budgets are exceeded', async () => {
      // Create budgets for multiple months
      await prisma.budget.create({
        data: {
          month: 2,
          year: 2024,
          totalLimit: 1000,
          isTotal: false,
          userId: testUserId,
          categories: {
            create: {
              categoryId: testCategoryId,
              limitAmount: 500,
            },
          },
        },
      });

      const dates = [
        new Date('2024-01-15'),
        new Date('2024-02-15'),
      ];

      // Each transaction is 100, well under the 500 limit
      const result = await BudgetValidator.checkRecurringBudget(
        testUserId,
        testCategoryId,
        100,
        dates
      );

      expect(result).toBeNull();
    });

    it('should return warning with affected months when budgets are exceeded', async () => {
      // Create budgets for multiple months
      const budget2 = await prisma.budget.create({
        data: {
          month: 2,
          year: 2024,
          totalLimit: 1000,
          isTotal: false,
          userId: testUserId,
          categories: {
            create: {
              categoryId: testCategoryId,
              limitAmount: 500,
            },
          },
        },
      });

      // Add existing transactions in both months
      await prisma.transaction.createMany({
        data: [
          {
            amount: 400,
            type: 'expense',
            date: new Date('2024-01-10'),
            categoryId: testCategoryId,
            userId: testUserId,
          },
          {
            amount: 450,
            type: 'expense',
            date: new Date('2024-02-10'),
            categoryId: testCategoryId,
            userId: testUserId,
          },
        ],
      });

      const dates = [
        new Date('2024-01-15'),
        new Date('2024-02-15'),
      ];

      // Each new transaction is 150, which would exceed both budgets
      const result = await BudgetValidator.checkRecurringBudget(
        testUserId,
        testCategoryId,
        150,
        dates
      );

      expect(result).not.toBeNull();
      expect(result?.affectedMonths).toHaveLength(2);
      expect(result?.affectedMonths).toEqual(
        expect.arrayContaining([
          { month: 1, year: 2024, overage: 50 },
          { month: 2, year: 2024, overage: 100 },
        ])
      );

      // Clean up
      await prisma.budgetCategory.deleteMany({ where: { budgetId: budget2.id } });
      await prisma.budget.delete({ where: { id: budget2.id } });
    });

    it('should return warning with only affected months', async () => {
      // Create budgets for multiple months
      const budget2 = await prisma.budget.create({
        data: {
          month: 2,
          year: 2024,
          totalLimit: 1000,
          isTotal: false,
          userId: testUserId,
          categories: {
            create: {
              categoryId: testCategoryId,
              limitAmount: 500,
            },
          },
        },
      });

      // Add existing transaction only in January
      await prisma.transaction.create({
        data: {
          amount: 400,
          type: 'expense',
          date: new Date('2024-01-10'),
          categoryId: testCategoryId,
          userId: testUserId,
        },
      });

      const dates = [
        new Date('2024-01-15'),
        new Date('2024-02-15'),
      ];

      // Each new transaction is 150
      // January: 400 + 150 = 550 (exceeds 500)
      // February: 0 + 150 = 150 (under 500)
      const result = await BudgetValidator.checkRecurringBudget(
        testUserId,
        testCategoryId,
        150,
        dates
      );

      expect(result).not.toBeNull();
      expect(result?.affectedMonths).toHaveLength(1);
      expect(result?.affectedMonths).toEqual([
        { month: 1, year: 2024, overage: 50 },
      ]);

      // Clean up
      await prisma.budgetCategory.deleteMany({ where: { budgetId: budget2.id } });
      await prisma.budget.delete({ where: { id: budget2.id } });
    });

    it('should handle multiple instances in the same month', async () => {
      // Add existing transaction
      await prisma.transaction.create({
        data: {
          amount: 450,
          type: 'expense',
          date: new Date('2024-01-10'),
          categoryId: testCategoryId,
          userId: testUserId,
        },
      });

      const dates = [
        new Date('2024-01-15'),
        new Date('2024-01-20'),
        new Date('2024-01-25'),
      ];

      // Each new transaction is 100
      // Each check: 450 + 100 = 550 (exceeds 500 by 50)
      // Note: Each instance is checked independently against the current budget state
      // Since all three dates are in the same month, we get three entries for the same month
      const result = await BudgetValidator.checkRecurringBudget(
        testUserId,
        testCategoryId,
        100,
        dates
      );

      expect(result).not.toBeNull();
      expect(result?.affectedMonths).toHaveLength(3);
      // All three instances exceed the budget for January 2024
      expect(result?.affectedMonths).toEqual([
        { month: 1, year: 2024, overage: 50 },
        { month: 1, year: 2024, overage: 50 },
        { month: 1, year: 2024, overage: 50 },
      ]);
    });
  });
});

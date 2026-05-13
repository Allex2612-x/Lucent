import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/requireAuth.js';
import { TransactionService, createTransactionSchema, updateTransactionSchema } from './transaction.service.js';
import { DateValidator } from '../../shared/date-validator.js';
import { BudgetValidator } from '../budget/budget-validator.js';
import { RecurringTransactionEngine } from './recurring-transaction-engine.js';

export class TransactionController {
  static async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { startDate, endDate } = req.query;
      const transactions = await TransactionService.getTransactions(req.user!.userId, {
        startDate: startDate as string,
        endDate: endDate as string
      });
      res.json({ success: true, data: transactions });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const transaction = await TransactionService.getTransactionById(req.user!.userId, req.params.id as string);
      res.json({ success: true, data: transaction });
    } catch (error) {
      next(error);
    }
  }

  static async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const validatedData = createTransactionSchema.parse(req.body);
      const userId = req.user!.userId;
      const force = req.query.force === 'true';

      // Validate date: reject future dates unless isRecurring is true
      if (!validatedData.isRecurring && DateValidator.isFutureDate(validatedData.date)) {
        return res.status(400).json({
          success: false,
          error: 'DateValidationError',
          message: 'Nu poți adăuga tranzacții cu date din viitor',
        });
      }

      // Handle recurring transactions
      if (validatedData.isRecurring && validatedData.frequency && validatedData.repetitionCount) {
        // Generate recurring transaction instances
        const instances = RecurringTransactionEngine.generateInstances({
          amount: validatedData.amount,
          type: validatedData.type,
          description: validatedData.description,
          startDate: validatedData.date,
          categoryId: validatedData.categoryId,
          userId,
          frequency: validatedData.frequency,
          repetitionCount: validatedData.repetitionCount,
        });

        // Check budget for expense transactions
        if (validatedData.type === 'expense' && !force) {
          const dates = instances.map(i => i.date);
          const budgetWarning = await BudgetValidator.checkRecurringBudget(
            userId,
            validatedData.categoryId,
            validatedData.amount,
            dates
          );

          if (budgetWarning) {
            return res.status(409).json({
              success: false,
              error: 'BudgetExceeded',
              message: 'Tranzacția depășește bugetul categoriei',
              warning: budgetWarning,
              requiresConfirmation: true,
            });
          }
        }

        // Create all recurring transaction instances atomically
        const transactions = await TransactionService.createRecurringTransactions(userId, instances);
        return res.status(201).json({ success: true, data: transactions });
      }

      // Handle single transaction
      // Check budget for expense transactions
      if (validatedData.type === 'expense' && !force) {
        const budgetWarning = await BudgetValidator.checkBudget(
          userId,
          validatedData.categoryId,
          validatedData.amount,
          validatedData.date
        );

        if (budgetWarning) {
          return res.status(409).json({
            success: false,
            error: 'BudgetExceeded',
            message: 'Tranzacția depășește bugetul categoriei',
            warning: budgetWarning,
            requiresConfirmation: true,
          });
        }
      }

      const transaction = await TransactionService.createTransaction(userId, validatedData);
      res.status(201).json({ success: true, data: transaction });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const validatedData = updateTransactionSchema.parse(req.body);
      const transaction = await TransactionService.updateTransaction(req.user!.userId, req.params.id as string, validatedData);
      res.json({ success: true, data: transaction });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const deleteFuture = req.query.deleteFuture === 'true';
      await TransactionService.deleteTransaction(req.user!.userId, req.params.id as string, deleteFuture);
      res.json({ success: true, message: 'Transaction deleted' });
    } catch (error) {
      next(error);
    }
  }
}

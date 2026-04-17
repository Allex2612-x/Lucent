import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/requireAuth.js';
import { TransactionService, createTransactionSchema, updateTransactionSchema } from './transaction.service.js';

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
      const transaction = await TransactionService.createTransaction(req.user!.userId, validatedData);
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
      await TransactionService.deleteTransaction(req.user!.userId, req.params.id as string);
      res.json({ success: true, message: 'Transaction deleted' });
    } catch (error) {
      next(error);
    }
  }
}

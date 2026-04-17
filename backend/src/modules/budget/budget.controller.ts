import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/requireAuth.js';
import { BudgetService, createBudgetSchema, updateBudgetSchema } from './budget.service.js';

export class BudgetController {
  static async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const budgets = await BudgetService.getBudgets(req.user!.userId);
      res.json({ success: true, data: budgets });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const budget = await BudgetService.getBudgetById(req.user!.userId, req.params.id as string);
      res.json({ success: true, data: budget });
    } catch (error) {
      next(error);
    }
  }

  static async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const validatedData = createBudgetSchema.parse(req.body);
      const budget = await BudgetService.createBudget(req.user!.userId, validatedData);
      res.status(201).json({ success: true, data: budget });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const validatedData = updateBudgetSchema.parse(req.body);
      const budget = await BudgetService.updateBudget(req.user!.userId, req.params.id as string, validatedData);
      res.json({ success: true, data: budget });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await BudgetService.deleteBudget(req.user!.userId, req.params.id as string);
      res.json({ success: true, message: 'Budget deleted' });
    } catch (error) {
      next(error);
    }
  }
}

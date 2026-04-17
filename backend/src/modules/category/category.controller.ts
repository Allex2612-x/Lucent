import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/requireAuth.js';
import { CategoryService, createCategorySchema, updateCategorySchema } from './category.service.js';

export class CategoryController {
  static async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const categories = await CategoryService.getCategories(req.user!.userId);
      res.json({ success: true, data: categories });
    } catch (error) {
      next(error);
    }
  }

  static async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const validatedData = createCategorySchema.parse(req.body);
      const category = await CategoryService.createCategory(req.user!.userId, validatedData);
      res.status(201).json({ success: true, data: category });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const validatedData = updateCategorySchema.parse(req.body);
      const category = await CategoryService.updateCategory(req.user!.userId, req.params.id as string, validatedData);
      res.json({ success: true, data: category });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await CategoryService.deleteCategory(req.user!.userId, req.params.id as string);
      res.json({ success: true, message: 'Category deleted' });
    } catch (error) {
      next(error);
    }
  }
}

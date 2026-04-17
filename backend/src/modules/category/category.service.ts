import { prisma } from '../../shared/prisma.js';
import { NotFoundError, BadRequestError } from '../../shared/errors.js';
import { z } from 'zod';

export const createCategorySchema = z.object({
  name: z.string().min(2),
  type: z.enum(['income', 'expense']),
  icon: z.string().optional(),
  color: z.string().optional(),
});

export const updateCategorySchema = createCategorySchema.partial();

export class CategoryService {
  static async getCategories(userId: string) {
    // Get both global default categories and user's custom categories
    return prisma.category.findMany({
      where: {
        OR: [
          { userId },
          { isDefault: true, userId: null }
        ]
      },
      orderBy: [
        { isDefault: 'desc' },
        { name: 'asc' }
      ]
    });
  }

  static async createCategory(userId: string, data: z.infer<typeof createCategorySchema>) {
    return prisma.category.create({
      data: {
        ...data,
        userId,
        isDefault: false
      }
    });
  }

  static async updateCategory(userId: string, categoryId: string, data: z.infer<typeof updateCategorySchema>) {
    const category = await prisma.category.findFirst({
      where: { id: categoryId, userId }
    });

    if (!category) throw new NotFoundError('Category not found or you cannot edit default categories');
    if (category.isDefault) throw new BadRequestError('Cannot edit default categories');

    return prisma.category.update({
      where: { id: categoryId },
      data
    });
  }

  static async deleteCategory(userId: string, categoryId: string) {
    const category = await prisma.category.findFirst({
      where: { id: categoryId, userId }
    });

    if (!category) throw new NotFoundError('Category not found');
    if (category.isDefault) throw new BadRequestError('Cannot delete default categories');

    await prisma.category.delete({
      where: { id: categoryId }
    });

    return { success: true };
  }
}

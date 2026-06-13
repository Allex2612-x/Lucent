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
    // Check for duplicate (case-insensitive, trimmed)
    const normalizedName = data.name.trim().toLowerCase();
    
    const duplicate = await prisma.category.findFirst({
      where: {
        OR: [
          { userId },
          { isDefault: true, userId: null }
        ],
        type: data.type,
      }
    });

    // Check if any category matches the normalized name
    if (duplicate) {
      const allCategories = await prisma.category.findMany({
        where: {
          OR: [
            { userId },
            { isDefault: true, userId: null }
          ],
          type: data.type,
        }
      });
      
      const nameExists = allCategories.some(cat => 
        cat.name.trim().toLowerCase() === normalizedName
      );
      
      if (nameExists) {
        throw new BadRequestError(`Există deja o categorie cu numele "${data.name}" pentru tipul selectat.`);
      }
    }

    return prisma.category.create({
      data: {
        ...data,
        name: data.name.trim(), // Trim the name before saving
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

    // Check for duplicate if name is being updated
    if (data.name) {
      const normalizedName = data.name.trim().toLowerCase();
      
      const allCategories = await prisma.category.findMany({
        where: {
          OR: [
            { userId },
            { isDefault: true, userId: null }
          ],
          type: data.type || category.type,
          id: { not: categoryId } // Exclude current category
        }
      });
      
      const nameExists = allCategories.some(cat => 
        cat.name.trim().toLowerCase() === normalizedName
      );
      
      if (nameExists) {
        throw new BadRequestError(`Există deja o categorie cu numele "${data.name}" pentru tipul selectat.`);
      }
    }

    return prisma.category.update({
      where: { id: categoryId },
      data: {
        ...data,
        ...(data.name && { name: data.name.trim() }) // Trim the name if provided
      }
    });
  }

  static async deleteCategory(userId: string, categoryId: string) {
    const category = await prisma.category.findFirst({
      where: { id: categoryId, userId }
    });

    if (!category) throw new NotFoundError('Category not found');
    if (category.isDefault) throw new BadRequestError('Cannot delete default categories');

    // The Transaction.category and BudgetCategory.category relations are
    // required with no onDelete cascade, so deleting a category still in use
    // would raise a raw Prisma FK error (P2003) and surface as a 500. Block it
    // with a clear message the user can act on.
    const [txCount, budgetCount] = await Promise.all([
      prisma.transaction.count({ where: { categoryId } }),
      prisma.budgetCategory.count({ where: { categoryId } }),
    ]);
    if (txCount > 0 || budgetCount > 0) {
      throw new BadRequestError(
        'Nu poți șterge o categorie folosită de tranzacții sau bugete. Reasignează sau șterge mai întâi elementele asociate.'
      );
    }

    await prisma.category.delete({
      where: { id: categoryId }
    });

    return { success: true };
  }
}

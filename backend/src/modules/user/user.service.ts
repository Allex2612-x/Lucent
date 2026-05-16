import { prisma } from '../../shared/prisma.js';
import { NotFoundError } from '../../shared/errors.js';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

export const updateProfileSchema = z.object({
  firstName: z.string().min(2).optional(),
  lastName: z.string().min(2).optional(),
  currency: z.string().length(3).optional(),
  // Accept a base64 data URL (PNG/JPG up to ~2MB). The frontend resizes the
  // image client-side before sending.
  avatarUrl: z
    .string()
    .max(3_000_000)
    .nullable()
    .optional(),
});

export const updatePasswordSchema = z.object({
  oldPassword: z.string(),
  newPassword: z.string().min(6),
});

export class UserService {
  static async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        currency: true,
        avatarUrl: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return user;
  }

  static async updateProfile(userId: string, data: z.infer<typeof updateProfileSchema>) {
    const user = await prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        currency: true,
        avatarUrl: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    return user;
  }

  static async updatePassword(userId: string, data: z.infer<typeof updatePasswordSchema>) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundError('User not found');

    const isValid = await bcrypt.compare(data.oldPassword, user.password);
    if (!isValid) {
      throw new Error('Invalid old password');
    }

    const hashedPassword = await bcrypt.hash(data.newPassword, 10);
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return true;
  }

  static async deleteAccount(userId: string) {
    // The Prisma schema doesn't carry onDelete: Cascade on every User →
    // dependent relation, so we delete children explicitly in the correct
    // order inside a single transaction. Anything we forget will surface as
    // a foreign-key violation here.
    await prisma.$transaction(async (tx) => {
      // Notifications → Transactions → BudgetCategories → Budgets →
      // user-owned Categories → User
      await tx.notification.deleteMany({ where: { userId } }).catch(() => undefined);
      await tx.transaction.deleteMany({ where: { userId } });
      const myBudgets = await tx.budget.findMany({ where: { userId }, select: { id: true } });
      if (myBudgets.length > 0) {
        await tx.budgetCategory.deleteMany({
          where: { budgetId: { in: myBudgets.map((b) => b.id) } },
        });
      }
      await tx.budget.deleteMany({ where: { userId } });
      await tx.category.deleteMany({ where: { userId } });
      await tx.user.delete({ where: { id: userId } });
    });
    return true;
  }
}

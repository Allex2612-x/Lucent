import { prisma } from '../../shared/prisma.js';
import { NotFoundError } from '../../shared/errors.js';

export class NotificationService {
  /**
   * Check if budget limits are exceeded and create notifications if needed
   * This function is idempotent - it only creates notifications if they don't already exist
   */
  static async checkAndCreateBudgetNotifications(
    userId: string,
    categoryId: string,
    transactionDate: Date
  ): Promise<void> {
    // Respect the per-user opt-out from Settings. The pre-submit budget
    // warning dialog is a separate flow and stays on regardless.
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { budgetNotifications: true },
    });
    if (!user || user.budgetNotifications === false) {
      return;
    }
    const month = transactionDate.getMonth() + 1; // JavaScript months are 0-indexed
    const year = transactionDate.getFullYear();

    // Find the per-category budget for this month/year. Filtering by
    // isTotal: false matters — otherwise findFirst can pick the total
    // budget row (which has no categories), and we bail out without
    // checking the per-category limit.
    const budget = await prisma.budget.findFirst({
      where: {
        userId,
        month,
        year,
        isTotal: false,
      },
      include: {
        categories: {
          where: { categoryId },
        },
      },
    });

    // If no budget exists for this category/month, nothing to check
    if (!budget || budget.categories.length === 0) {
      return;
    }

    const budgetCategory = budget.categories[0];
    // Coerce Prisma Decimal -> number once. Without this, `sum + t.amount`
    // mixes number with Decimal and silently turns into string concat,
    // making the percentage and threshold checks nonsense.
    const limitAmount = Number(budgetCategory.limitAmount);

    // Calculate total spent in this category for this month
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
        categoryId,
        type: 'expense',
        date: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
    });

    const totalSpent = transactions.reduce((sum, t) => sum + Number(t.amount), 0);
    const percentage = limitAmount > 0 ? (totalSpent / limitAmount) * 100 : 0;

    // Check if budget is exceeded (>= 100%)
    if (percentage >= 100) {
      // Every over-limit transaction fires a fresh notification — the user
      // explicitly wants to be reminded each time, not just the first time
      // they cross the limit. Stale unread notifications would also show
      // outdated totals (frozen at the moment of first overage).
      const category = await prisma.category.findUnique({
        where: { id: categoryId },
      });

      await prisma.notification.create({
        data: {
          userId,
          type: 'budget_exceeded',
          title: 'Limită buget depășită',
          message: `Ai depășit limita bugetului pentru categoria "${category?.name || 'Necunoscută'}". Cheltuieli: ${totalSpent.toFixed(2)} RON / Limită: ${limitAmount.toFixed(2)} RON`,
          relatedEntityId: budgetCategory.id,
        },
      });
    }
    // Check if budget is near limit (>= 80% and < 100%)
    else if (percentage >= 80) {
      // Check if notification already exists (unread)
      const existingNotification = await prisma.notification.findFirst({
        where: {
          userId,
          type: 'budget_near_limit',
          relatedEntityId: budgetCategory.id,
          isRead: false,
        },
      });

      if (!existingNotification) {
        // Get category name for the message
        const category = await prisma.category.findUnique({
          where: { id: categoryId },
        });

        await prisma.notification.create({
          data: {
            userId,
            type: 'budget_near_limit',
            title: 'Buget aproape de limită',
            message: `Te apropii de limita bugetului pentru categoria "${category?.name || 'Necunoscută'}". Cheltuieli: ${totalSpent.toFixed(2)} RON / Limită: ${limitAmount.toFixed(2)} RON (${percentage.toFixed(1)}%)`,
            relatedEntityId: budgetCategory.id,
          },
        });
      }
    }
  }

  /**
   * Get all notifications for a user, ordered by creation date (newest first)
   */
  static async getNotifications(userId: string) {
    return prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Mark a notification as read
   */
  static async markAsRead(userId: string, notificationId: string) {
    // First check if the notification exists and belongs to the user
    const notification = await prisma.notification.findFirst({
      where: {
        id: notificationId,
        userId,
      },
    });

    if (!notification) {
      throw new NotFoundError('Notification not found');
    }

    return prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });
  }

  /**
   * Mark all unread notifications as read for a user
   */
  static async markAllAsRead(userId: string) {
    const result = await prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: { isRead: true },
    });

    return { count: result.count };
  }

  /**
   * Get the count of unread notifications for a user
   */
  static async getUnreadCount(userId: string) {
    const count = await prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });

    return { count };
  }
}

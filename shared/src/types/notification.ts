export interface Notification {
  id: string;
  userId: string;
  type: 'budget_exceeded' | 'budget_near_limit' | 'bill_reminder';
  title: string;
  message: string;
  isRead: boolean;
  relatedEntityId?: string | null;
  createdAt: Date;
}

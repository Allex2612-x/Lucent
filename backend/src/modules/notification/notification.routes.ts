import { Router } from 'express';
import { NotificationController } from './notification.controller.js';
import { requireAuth } from '../../middleware/requireAuth.js';

const router = Router();

router.use(requireAuth);

router.get('/', NotificationController.getNotifications);
router.get('/unread-count', NotificationController.getUnreadCount);
router.patch('/:id/read', NotificationController.markAsRead);
router.patch('/read-all', NotificationController.markAllAsRead);

export default router;

import express from 'express';
import notificationsController from './notifications.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = express.Router();

router.get('/contact-channels', notificationsController.getContactChannels);

router.get('/', authenticate, notificationsController.getMyNotifications);
router.patch('/read-all', authenticate, notificationsController.markAllAsRead);
router.patch('/:id/read', authenticate, notificationsController.markAsRead);
router.post('/send-email', authenticate, notificationsController.sendEmail);

export default router;

// Gắn vào index.ts:
// import notificationsRoute from './features/notifications/notifications.route';
// app.use('/api/v1/notifications', notificationsRoute);

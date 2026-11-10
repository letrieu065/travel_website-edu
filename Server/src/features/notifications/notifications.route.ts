import express from 'express';
import notificationsController from './notifications.controller';
// TODO: tạo middleware xác thực JWT
// import { authenticate } from '../../middleware/auth.middleware';

const router = express.Router();

router.get('/contact-channels', notificationsController.getContactChannels);

router.get('/', notificationsController.getMyNotifications);
router.patch('/read-all', notificationsController.markAllAsRead);
router.patch('/:id/read', notificationsController.markAsRead);
router.post('/send-email', notificationsController.sendEmail);

export default router;

// Gắn vào index.ts:
// import notificationsRoute from './features/notifications/notifications.route';
// app.use('/api/v1/notifications', notificationsRoute);


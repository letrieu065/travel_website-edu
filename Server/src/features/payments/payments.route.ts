import express from 'express';
import paymentsController from './payments.controller';
// TODO: tạo middleware xác thực JWT cho các route của user
// import { authenticate } from '../../middleware/auth.middleware';

const router = express.Router();

// Webhook không dùng auth JWT của user (xác thực qua chữ ký cổng thanh toán)
router.post('/webhook', paymentsController.handlePaymentWebhook);

router.post('/create', paymentsController.createPayment);
router.get('/my-payments', paymentsController.getMyPayments);
router.get('/:id/status', paymentsController.getPaymentStatus);
router.post('/:id/refund', paymentsController.requestRefund);

export default router;

// Gắn vào index.ts:
// import paymentsRoute from './features/payments/payments.route';
// app.use('/api/v1/payments', paymentsRoute);


import express from 'express';
import paymentsController from './payments.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = express.Router();

// Webhook không dùng auth JWT của user (xác thực qua chữ ký cổng thanh toán)
router.post('/webhook', paymentsController.handlePaymentWebhook);

router.post('/create', authenticate, paymentsController.createPayment);
router.get('/my-payments', authenticate, paymentsController.getMyPayments);
router.get('/:id/status', authenticate, paymentsController.getPaymentStatus);
router.post('/:id/refund', authenticate, paymentsController.requestRefund);

export default router;

// Gắn vào index.ts:
// import paymentsRoute from './features/payments/payments.route';
// app.use('/api/v1/payments', paymentsRoute);

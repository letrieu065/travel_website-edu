"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const payments_controller_1 = __importDefault(require("./payments.controller"));
const auth_middleware_1 = require("../../middleware/auth.middleware");
const router = express_1.default.Router();
// Webhook không dùng auth JWT của user (xác thực qua chữ ký cổng thanh toán)
router.post('/webhook', payments_controller_1.default.handlePaymentWebhook);
router.post('/create', auth_middleware_1.authenticate, payments_controller_1.default.createPayment);
router.get('/my-payments', auth_middleware_1.authenticate, payments_controller_1.default.getMyPayments);
router.get('/:id/status', auth_middleware_1.authenticate, payments_controller_1.default.getPaymentStatus);
router.post('/:id/refund', auth_middleware_1.authenticate, payments_controller_1.default.requestRefund);
exports.default = router;
// Gắn vào index.ts:
// import paymentsRoute from './features/payments/payments.route';
// app.use('/api/v1/payments', paymentsRoute);
//# sourceMappingURL=payments.route.js.map
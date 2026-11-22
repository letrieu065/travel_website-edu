/**
 * ============================================================================
 * MODULE PAYMENTS - CONTROLLER (Xử lý HTTP Request cho Cổng Thanh Toán)
 * ============================================================================
 * Chịu trách nhiệm:
 * - Tiếp nhận yêu cầu khởi tạo thanh toán đa phương thức (VietQR, MoMo, VNPay, Trả góp).
 * - Xử lý Webhook IPN từ cổng thanh toán đối tác khi khách hàng chuyển khoản thành công.
 * - Kiểm tra trạng thái giao dịch và xử lý yêu cầu hoàn tiền.
 * ============================================================================
 */

import { Request, Response } from 'express';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import paymentsService, { PaymentMethod } from './payments.service';
import env from '../../config/env';

/**
 * Xử lý lỗi chuẩn cho Payments Controller
 * // (Đã thêm)
 */
const handleControllerError = (res: Response, error: any, defaultMessage: string = 'Đã có lỗi xảy ra') => {
    console.error(defaultMessage, error);
    const msg = error?.message || defaultMessage;
    if (msg.includes('Không tìm thấy') || error?.code === 'P2025' || error?.code === 'P2007') {
        return res.status(404).json({ status: 'error', message: msg });
    }
    if (msg.includes('không có quyền')) {
        return res.status(403).json({ status: 'error', message: msg });
    }
    const isProd = process.env.NODE_ENV === 'production';
    return res.status(500).json({
        status: 'error',
        message: isProd ? 'Đã có sự cố xảy ra trên hệ thống, vui lòng thử lại sau' : msg,
    });
};

/**
 * Trích xuất an toàn giá trị string từ route params
 * // (Đã thêm)
 */
const getParam = (param: string | string[] | undefined): string => {
    if (Array.isArray(param)) return param[0] || '';
    return param || '';
};

/**
 * Trích xuất ID người dùng từ JWT Token
 * // (Đã thêm)
 */
const extractUserId = (req: Request): string => {
    const reqUser = (req as any).user;
    if (reqUser?.id) return reqUser.id;
    if (reqUser?.userId) return reqUser.userId;

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        try {
            const token = authHeader.split(' ')[1];
            const secret = env.JWT_SECRET;
            const decoded: any = jwt.verify(token, secret);
            return decoded.id || decoded.userId || '';
        } catch {
            return '';
        }
    }

    return '';
};

/* ============================== CONTROLLERS ============================== */

/**
 * Khởi tạo giao dịch thanh toán mới cho đơn đặt chỗ
 * - Endpoint: POST /api/v1/payments/create
 * - Body: { booking_id: string, payment_method: PaymentMethod }
 * - Hỗ trợ: 'vietqr', 'momo', 'bank_transfer', 'vnpay', 'f88_loan'
 * // (Đã thêm)
 */
const createPayment = async (req: Request, res: Response) => {
    try {
        const userId = extractUserId(req);
        const { booking_id, payment_method } = req.body;
        const validMethods: PaymentMethod[] = ['vietqr', 'momo', 'bank_transfer', 'vnpay', 'f88_loan'];
        if (!booking_id || !payment_method) {
            return res.status(400).json({
                status: 'error',
                message: 'Thiếu thông tin: booking_id hoặc payment_method không được để trống',
            });
        }
        if (!validMethods.includes(payment_method)) {
            return res.status(400).json({
                status: 'error',
                message: 'Phương thức thanh toán payment_method không hợp lệ',
            });
        }

        const result = await paymentsService.createPayment({ booking_id, payment_method, user_id: userId });
        return res.status(201).json({ status: 'success', ...result });
    } catch (error: any) {
        if (error.message?.includes('Không tìm thấy')) {
            return res.status(404).json({ status: 'error', message: error.message });
        }
        if (error.message?.includes('không có quyền')) {
            return res.status(403).json({ status: 'error', message: error.message });
        }
        return handleControllerError(res, error, 'Lỗi khi khởi tạo giao dịch thanh toán');
    }
};

/**
 * Xử lý Webhook (Instant Payment Notification - IPN) từ cổng thanh toán
 * - Endpoint: POST /api/v1/payments/webhook
 * - Body: { transaction_id: string, status: 'paid' | 'failed' }
 * // (Đã thêm)
 */
const handlePaymentWebhook = async (req: Request, res: Response) => {
    try {
        const webhookSecret = process.env.PAYMENT_WEBHOOK_SECRET || 'natura_payment_webhook_secret_2026';
        const signatureHeader = (req.headers['x-webhook-secret'] || req.headers['x-signature']) as string | undefined;

        if (!signatureHeader || typeof signatureHeader !== 'string') {
            return res.status(401).json({
                status: 'error',
                message: 'Chữ ký webhook không hợp lệ hoặc thiếu mã bí mật xác thực',
            });
        }

        const signatureBuffer = Buffer.from(signatureHeader);
        const secretBuffer = Buffer.from(webhookSecret);

        if (signatureBuffer.length !== secretBuffer.length || !crypto.timingSafeEqual(signatureBuffer, secretBuffer)) {
            return res.status(401).json({
                status: 'error',
                message: 'Chữ ký webhook không hợp lệ hoặc thiếu mã bí mật xác thực',
            });
        }

        const { transaction_id, status } = req.body;
        if (!transaction_id || !['paid', 'failed'].includes(status)) {
            return res.status(400).json({ status: 'error', message: 'Dữ liệu webhook không hợp lệ' });
        }

        const updated = await paymentsService.processPaymentWebhook(transaction_id, status);
        return res.status(200).json({ status: 'success', data: updated });
    } catch (error: any) {
        if (error.message?.includes('Không tìm thấy')) {
            return res.status(404).json({ status: 'error', message: error.message });
        }
        return handleControllerError(res, error, 'Lỗi khi xử lý webhook thanh toán');
    }
};

/**
 * Lấy danh sách lịch sử tất cả các giao dịch thanh toán của người dùng hiện tại
 * - Endpoint: GET /api/v1/payments/my-payments
 * // (Đã thêm)
 */
const getMyPayments = async (req: Request, res: Response) => {
    try {
        const userId = extractUserId(req);
        if (!userId) {
            return res.status(401).json({ status: 'error', message: 'Chưa xác thực người dùng' });
        }
        const payments = await paymentsService.getMyPayments(userId);
        return res.status(200).json({ status: 'success', payments });
    } catch (error) {
        return handleControllerError(res, error, 'Lỗi khi lấy lịch sử giao dịch');
    }
};

/**
 * Kiểm tra trạng thái thanh toán của một giao dịch cụ thể
 * - Endpoint: GET /api/v1/payments/:id/status
 * // (Đã thêm)
 */
const getPaymentStatus = async (req: Request, res: Response) => {
    try {
        const id = getParam(req.params.id);
        const userId = extractUserId(req);
        const role = (req as any).user?.role;
        const payment = await paymentsService.getPaymentStatus(id, userId, role);
        if (!payment) {
            return res.status(404).json({ status: 'error', message: 'Không tìm thấy giao dịch hoặc bạn không có quyền truy cập' });
        }
        return res.status(200).json({ status: 'success', payment });
    } catch (error) {
        return handleControllerError(res, error, 'Lỗi khi kiểm tra trạng thái thanh toán');
    }
};

/**
 * Gửi yêu cầu hoàn tiền cho đơn đặt chỗ đã thanh toán
 * - Endpoint: POST /api/v1/payments/:id/refund
 * // (Đã thêm)
 */
const requestRefund = async (req: Request, res: Response) => {
    try {
        const userId = extractUserId(req);
        const id = getParam(req.params.id);
        if (!userId) {
            return res.status(401).json({ status: 'error', message: 'Chưa xác thực người dùng' });
        }
        const updated = await paymentsService.requestRefund(userId, id);
        return res.status(200).json({ status: 'success', message: 'Đã gửi yêu cầu hoàn tiền', payment: updated });
    } catch (error) {
        return handleControllerError(res, error, 'Lỗi khi gửi yêu cầu hoàn tiền');
    }
};

export default {
    createPayment,
    handlePaymentWebhook,
    getMyPayments,
    getPaymentStatus,
    requestRefund,
};

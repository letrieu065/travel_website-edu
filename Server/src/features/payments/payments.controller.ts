import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import paymentsService, { PaymentMethod } from './payments.service';

// (Đã thêm)
const handleControllerError = (res: Response, error: any, defaultMessage: string = 'Đã có lỗi xảy ra') => {
    console.error(defaultMessage, error);
    return res.status(500).json({ status: 'error', message: error.message || defaultMessage });
};

// (Đã thêm)
const getParam = (param: string | string[] | undefined): string => {
    if (Array.isArray(param)) return param[0] || '';
    return param || '';
};

// (Đã thêm)
const extractUserId = (req: Request): string => {
    const reqUser = (req as any).user;
    if (reqUser?.userId) return reqUser.userId;
    if (reqUser?.id) return reqUser.id;

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        try {
            const token = authHeader.split(' ')[1];
            const secret = process.env.JWT_SECRET || 'default_secret_key';
            const decoded: any = jwt.verify(token, secret);
            return decoded.userId || decoded.id || '';
        } catch {
            return '';
        }
    }

    return (req.query.user_id as string) || (req.body?.user_id as string) || '';
};

/* ============================== CONTROLLERS ============================== */

// body: { booking_id, payment_method }
const createPayment = async (req: Request, res: Response) => {
    try {
        const { booking_id, payment_method } = req.body;
        const validMethods: PaymentMethod[] = ['momo', 'bank_transfer', 'vnpay', 'f88_loan'];
        if (!booking_id || !validMethods.includes(payment_method)) {
            return res.status(400).json({
                status: 'error',
                message: 'Thiếu booking_id hoặc payment_method không hợp lệ',
            });
        }

        const result = await paymentsService.createPayment({ booking_id, payment_method });
        return res.status(201).json({ status: 'success', ...result });
    } catch (error) {
        return handleControllerError(res, error, 'Lỗi khi khởi tạo giao dịch thanh toán');
    }
};

// body: { transaction_id, status }
const handlePaymentWebhook = async (req: Request, res: Response) => {
    try {
        const { transaction_id, status } = req.body;
        if (!transaction_id || !['paid', 'failed'].includes(status)) {
            return res.status(400).json({ status: 'error', message: 'Dữ liệu webhook không hợp lệ' });
        }

        const updated = await paymentsService.processPaymentWebhook(transaction_id, status);
        return res.status(200).json({ status: 'success', data: updated });
    } catch (error) {
        return handleControllerError(res, error, 'Lỗi khi xử lý webhook thanh toán');
    }
};

// header: Authorization Bearer
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

// params: id
const getPaymentStatus = async (req: Request, res: Response) => {
    try {
        const id = getParam(req.params.id);
        const payment = await paymentsService.getPaymentStatus(id);
        if (!payment) {
            return res.status(404).json({ status: 'error', message: 'Không tìm thấy giao dịch' });
        }
        return res.status(200).json({ status: 'success', payment });
    } catch (error) {
        return handleControllerError(res, error, 'Lỗi khi kiểm tra trạng thái thanh toán');
    }
};

// params: id
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


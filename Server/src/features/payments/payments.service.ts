/**
 * ============================================================================
 * MODULE PAYMENTS - SERVICE (Nghiệp vụ Xử lý Thanh toán & Gửi Mail Xác nhận)
 * ============================================================================
 * Chịu trách nhiệm:
 * - Khởi tạo mã giao dịch duy nhất (transaction_id).
 * - Sinh mã QR VietQR (chuẩn NAPAS 247) và link thanh toán MoMo sandbox.
 * - Xử lý Webhook IPN cập nhật trạng thái đơn sang 'paid' và kích hoạt gửi mail hóa đơn.
 * - Xử lý quy trình hoàn tiền (Refund request).
 * ============================================================================
 */

import prisma from '../../config/prisma';
import nodemailer from 'nodemailer';

/* ============================== TYPES ============================== */

/**
 * Các phương thức thanh toán được hỗ trợ trong hệ thống Natura Travel
 */
export type PaymentMethod = 'momo' | 'bank_transfer' | 'vnpay' | 'f88_loan';

/**
 * Dữ liệu yêu cầu khởi tạo thanh toán
 */
export interface CreatePaymentData {
    booking_id: string;
    payment_method: PaymentMethod;
}

/**
 * Gửi email tự động xác nhận đặt chỗ và hóa đơn thanh toán qua Nodemailer (Gmail SMTP)
 * // (Đã thêm)
 */
const sendConfirmationEmail = async (toEmail: string, bookingId: string, amount: number, method: string) => {
    if (!process.env.MY_GMAIL || !process.env.GMAIL_APP_PASSWORD) return;

    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.MY_GMAIL,
                pass: process.env.GMAIL_APP_PASSWORD,
            },
        });

        await transporter.sendMail({
            from: '"Natura Travel Support" <no-reply@naturatravel.com>',
            to: toEmail,
            subject: `[Natura Travel] Xác nhận thanh toán thành công đơn #${bookingId.slice(0, 8)}`,
            html: `
                <h2>Thanh toán thành công!</h2>
                <p>Cảm ơn bạn đã đặt dịch vụ tại Natura Travel.</p>
                <p><strong>Mã đơn hàng:</strong> ${bookingId}</p>
                <p><strong>Số tiền:</strong> ${amount.toLocaleString('vi-VN')} VND</p>
                <p><strong>Phương thức:</strong> ${method}</p>
                <p>Chúc bạn có một chuyến đi tuyệt vời!</p>
            `,
        });
    } catch (err) {
        console.error('Lỗi gửi mail xác nhận thanh toán:', err);
    }
};

/* ============================== SERVICE METHODS ============================== */

/**
 * Khởi tạo giao dịch thanh toán trong cơ sở dữ liệu và sinh mã QR/URL thanh toán
 * // (Đã thêm)
 */
const createPayment = async (data: CreatePaymentData) => {
    const booking = await prisma.bookings.findUnique({
        where: { id: data.booking_id },
        include: { users: true },
    });

    if (!booking) {
        throw new Error('Không tìm thấy đơn đặt chỗ');
    }

    const transactionId = `TXN_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    const amount = Number(booking.total_price);

    const payment = await prisma.payments.create({
        data: {
            booking_id: booking.id,
            amount,
            payment_method: data.payment_method,
            transaction_id: transactionId,
            payment_status: 'pending',
        },
    });

    // Sinh mã QR VietQR hoặc đường dẫn cổng thanh toán
    const paymentUrl =
        data.payment_method === 'momo'
            ? `https://test-payment.momo.vn/pay/${transactionId}`
            : data.payment_method === 'bank_transfer'
            ? `https://img.vietqr.io/image/MB-0000000000-compact2.png?amount=${amount}&addInfo=${transactionId}`
            : null;

    return {
        payment,
        payment_url: paymentUrl,
        transaction_id: transactionId,
    };
};

/**
 * Xử lý cập nhật trạng thái giao dịch từ Webhook cổng thanh toán
 * - Nếu trạng thái là 'paid': Cập nhật thời gian thanh toán và gửi email xác nhận cho khách hàng
 * // (Đã thêm)
 */
const processPaymentWebhook = async (transactionId: string, status: 'paid' | 'failed') => {
    const payment = await prisma.payments.findUnique({
        where: { transaction_id: transactionId },
        include: {
            bookings: {
                include: { users: true },
            },
        },
    });

    if (!payment) {
        throw new Error('Không tìm thấy mã giao dịch');
    }

    const updated = await prisma.payments.update({
        where: { id: payment.id },
        data: {
            payment_status: status,
            payment_date: status === 'paid' ? new Date() : payment.payment_date,
        },
    });

    if (status === 'paid' && payment.bookings?.users?.email) {
        await sendConfirmationEmail(
            payment.bookings.users.email,
            payment.booking_id || '',
            Number(payment.amount),
            payment.payment_method
        );
    }

    return updated;
};

/**
 * Lấy lịch sử tất cả các khoản thanh toán của một người dùng
 * // (Đã thêm)
 */
const getMyPayments = async (userId: string) => {
    return prisma.payments.findMany({
        where: {
            bookings: { user_id: userId },
        },
        orderBy: { payment_date: 'desc' },
        include: {
            bookings: {
                include: { booking_items: true },
            },
        },
    });
};

/**
 * Kiểm tra trạng thái giao dịch theo ID
 * // (Đã thêm)
 */
const getPaymentStatus = async (paymentId: string) => {
    return prisma.payments.findUnique({
        where: { id: paymentId },
    });
};

/**
 * Gửi yêu cầu hoàn tiền cho giao dịch đã thanh toán
 * // (Đã thêm)
 */
const requestRefund = async (userId: string, paymentId: string) => {
    const payment = await prisma.payments.findFirst({
        where: {
            id: paymentId,
            bookings: { user_id: userId },
        },
    });

    if (!payment) {
        throw new Error('Không tìm thấy giao dịch hoặc bạn không có quyền truy cập');
    }
    if (payment.payment_status !== 'paid') {
        throw new Error('Chỉ có thể yêu cầu hoàn tiền cho giao dịch đã thanh toán');
    }

    return prisma.payments.update({
        where: { id: paymentId },
        data: { payment_status: 'refund_requested' },
    });
};

export default {
    createPayment,
    processPaymentWebhook,
    getMyPayments,
    getPaymentStatus,
    requestRefund,
};

import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import loansService from './loans.service';

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

// body: { loan_amount, term_months }
const calculateInstallment = async (req: Request, res: Response) => {
    try {
        const { loan_amount, term_months = 6 } = req.body;
        if (!loan_amount) {
            return res.status(400).json({ status: 'error', message: 'Vui lòng nhập số tiền cần vay' });
        }
        const data = await loansService.calculateInstallment({ loan_amount, term_months });
        return res.status(200).json({ status: 'success', data });
    } catch (error) {
        return handleControllerError(res, error, 'Lỗi khi tính toán gói trả góp');
    }
};

// body: ApplyLoanInput
const applyTravelLoan = async (req: Request, res: Response) => {
    try {
        const userId = extractUserId(req);
        if (!userId) {
            return res.status(401).json({ status: 'error', message: 'Vui lòng đăng nhập để nộp hồ sơ vay' });
        }
        const { booking_id, full_name, phone_number, identity_number, monthly_income, term_months } = req.body;
        if (!booking_id || !full_name || !phone_number || !identity_number || !monthly_income) {
            return res.status(400).json({ status: 'error', message: 'Vui lòng điền đầy đủ thông tin hồ sơ vay' });
        }

        const application = await loansService.applyTravelLoan({
            user_id: userId,
            booking_id,
            full_name,
            phone_number,
            identity_number,
            monthly_income: Number(monthly_income),
            term_months: term_months || 6,
        });

        return res.status(201).json({
            status: 'success',
            message: 'Nộp hồ sơ vay du lịch thành công. Hệ thống đang xét duyệt!',
            application,
        });
    } catch (error) {
        return handleControllerError(res, error, 'Lỗi khi nộp hồ sơ vay du lịch');
    }
};

const getMyLoans = async (req: Request, res: Response) => {
    try {
        const userId = extractUserId(req);
        if (!userId) {
            return res.status(401).json({ status: 'error', message: 'Chưa xác thực người dùng' });
        }
        const loans = await loansService.getMyLoans(userId);
        return res.status(200).json({ status: 'success', loans });
    } catch (error) {
        return handleControllerError(res, error, 'Lỗi khi lấy danh sách hồ sơ vay');
    }
};

// params: id
const getLoanById = async (req: Request, res: Response) => {
    try {
        const userId = extractUserId(req);
        const id = getParam(req.params.id);
        if (!userId) {
            return res.status(401).json({ status: 'error', message: 'Chưa xác thực người dùng' });
        }
        const loan = await loansService.getLoanById(userId, id);
        if (!loan) {
            return res.status(404).json({ status: 'error', message: 'Không tìm thấy hồ sơ vay' });
        }
        return res.status(200).json({ status: 'success', loan });
    } catch (error) {
        return handleControllerError(res, error, 'Lỗi khi lấy chi tiết hồ sơ vay');
    }
};

export default {
    calculateInstallment,
    applyTravelLoan,
    getMyLoans,
    getLoanById,
};


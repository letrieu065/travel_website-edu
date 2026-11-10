import { Request, Response } from 'express';
import insurancesService from './insurances.service';

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

/* ============================== CONTROLLERS ============================== */

// query: type ('travel' | 'cancellation')
const getPackages = async (req: Request, res: Response) => {
    try {
        const type = req.query.type as 'travel' | 'cancellation' | undefined;
        const packages = await insurancesService.getPackages(type);
        return res.status(200).json({ status: 'success', packages });
    } catch (error) {
        return handleControllerError(res, error, 'Lỗi khi lấy danh sách gói bảo hiểm');
    }
};

// params: id
const getPackageById = async (req: Request, res: Response) => {
    try {
        const id = getParam(req.params.id);
        const pkg = await insurancesService.getPackageById(id);
        if (!pkg) {
            return res.status(404).json({ status: 'error', message: 'Không tìm thấy gói bảo hiểm' });
        }
        return res.status(200).json({ status: 'success', package: pkg });
    } catch (error) {
        return handleControllerError(res, error, 'Lỗi khi lấy chi tiết gói bảo hiểm');
    }
};

// body: { package_id, guests, days, booking_amount }
const calculateFee = async (req: Request, res: Response) => {
    try {
        const { package_id, guests = 1, days, booking_amount } = req.body;
        if (!package_id) {
            return res.status(400).json({ status: 'error', message: 'Vui lòng cung cấp package_id' });
        }
        const result = await insurancesService.calculateFee({ package_id, guests, days, booking_amount });
        return res.status(200).json({ status: 'success', data: result });
    } catch (error) {
        return handleControllerError(res, error, 'Lỗi khi tính phí bảo hiểm');
    }
};

// body: { booking_id, package_id, guests }
const attachInsuranceToBooking = async (req: Request, res: Response) => {
    try {
        const { booking_id, package_id, guests = 1 } = req.body;
        if (!booking_id || !package_id) {
            return res.status(400).json({ status: 'error', message: 'Vui lòng cung cấp booking_id và package_id' });
        }
        const data = await insurancesService.attachInsuranceToBooking(booking_id, package_id, Number(guests));
        return res.status(200).json({ status: 'success', message: 'Đã thêm bảo hiểm vào đơn đặt chỗ', data });
    } catch (error) {
        return handleControllerError(res, error, 'Lỗi khi gắn bảo hiểm vào đơn hàng');
    }
};

export default {
    getPackages,
    getPackageById,
    calculateFee,
    attachInsuranceToBooking,
};


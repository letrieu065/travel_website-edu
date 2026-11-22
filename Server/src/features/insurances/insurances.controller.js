"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const insurances_service_1 = __importDefault(require("./insurances.service"));
// (Đã thêm)
const handleControllerError = (res, error, defaultMessage = 'Đã có lỗi xảy ra') => {
    console.error(defaultMessage, error);
    return res.status(500).json({ status: 'error', message: error.message || defaultMessage });
};
// (Đã thêm)
const getParam = (param) => {
    if (Array.isArray(param))
        return param[0] || '';
    return param || '';
};
/* ============================== CONTROLLERS ============================== */
// query: type ('travel' | 'cancellation')
const getPackages = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const type = req.query.type;
        const packages = yield insurances_service_1.default.getPackages(type);
        return res.status(200).json({ status: 'success', packages });
    }
    catch (error) {
        return handleControllerError(res, error, 'Lỗi khi lấy danh sách gói bảo hiểm');
    }
});
// params: id
const getPackageById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = getParam(req.params.id);
        const pkg = yield insurances_service_1.default.getPackageById(id);
        if (!pkg) {
            return res.status(404).json({ status: 'error', message: 'Không tìm thấy gói bảo hiểm' });
        }
        return res.status(200).json({ status: 'success', package: pkg });
    }
    catch (error) {
        return handleControllerError(res, error, 'Lỗi khi lấy chi tiết gói bảo hiểm');
    }
});
// body: { package_id, guests, days, booking_amount }
const calculateFee = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { package_id, guests = 1, days, booking_amount } = req.body;
        if (!package_id) {
            return res.status(400).json({ status: 'error', message: 'Vui lòng cung cấp package_id' });
        }
        const result = yield insurances_service_1.default.calculateFee({ package_id, guests, days, booking_amount });
        return res.status(200).json({ status: 'success', data: result });
    }
    catch (error) {
        return handleControllerError(res, error, 'Lỗi khi tính phí bảo hiểm');
    }
});
// body: { booking_id, package_id, guests }
const attachInsuranceToBooking = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        const userId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id) || ((_b = req.user) === null || _b === void 0 ? void 0 : _b.userId);
        const role = (_c = req.user) === null || _c === void 0 ? void 0 : _c.role;
        if (!userId) {
            return res.status(401).json({ status: 'error', message: 'Chưa xác thực người dùng' });
        }
        const { booking_id, package_id, guests = 1 } = req.body;
        if (!booking_id || !package_id) {
            return res.status(400).json({ status: 'error', message: 'Vui lòng cung cấp booking_id và package_id' });
        }
        const data = yield insurances_service_1.default.attachInsuranceToBooking(booking_id, package_id, Number(guests), userId, role);
        return res.status(200).json({ status: 'success', message: 'Đã thêm bảo hiểm vào đơn đặt chỗ', data });
    }
    catch (error) {
        return handleControllerError(res, error, 'Lỗi khi gắn bảo hiểm vào đơn hàng');
    }
});
exports.default = {
    getPackages,
    getPackageById,
    calculateFee,
    attachInsuranceToBooking,
};
//# sourceMappingURL=insurances.controller.js.map
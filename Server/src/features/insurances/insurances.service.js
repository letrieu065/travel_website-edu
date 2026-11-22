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
const prisma_1 = __importDefault(require("../../config/prisma"));
// TODO: Chuyển sang bảng insurances trong schema.prisma khi migrate DB
const INSURANCE_PACKAGES = [
    {
        id: 'ins_travel_basic',
        name: 'Bảo hiểm Du lịch Cơ bản',
        type: 'travel',
        price_per_person: 85000,
        max_coverage: 100000000,
        description: 'Bảo vệ an toàn cho chuyến đi trong nước với quyền lợi y tế và tai nạn.',
        benefits: [
            'Chi phí y tế do tai nạn/ốm đau lên đến 100 triệu VND',
            'Hỗ trợ thất lạc hành lý lên đến 10 triệu VND',
            'Hỗ trợ cứu hộ y tế khẩn cấp 24/7',
        ],
    },
    {
        id: 'ins_travel_premium',
        name: 'Bảo hiểm Du lịch Toàn cầu Premium',
        type: 'travel',
        price_per_person: 220000,
        max_coverage: 1000000000,
        description: 'Gói bảo vệ toàn diện dành cho cả tour trong nước và quốc tế.',
        benefits: [
            'Chi phí y tế quốc tế lên đến 1 tỷ VND',
            'Bồi thường trễ/hủy chuyến bay do thời tiết',
            'Bảo vệ hành lý, giấy tờ tùy thân và tài sản cá nhân',
        ],
    },
    {
        id: 'ins_cancellation',
        name: 'Bảo hiểm Hủy chuyến linh hoạt',
        type: 'cancellation',
        price_per_person: 150000,
        max_coverage: 50000000,
        description: 'Hoàn trả chi phí đặt tour/vé máy bay nếu có sự cố bất khả kháng phải hủy chuyến.',
        benefits: [
            'Hoàn 100% chi phí đặt chỗ nếu hủy vì lý do y tế hoặc người thân',
            'Hoàn 80% nếu thay đổi lịch trình đột xuất trước 24h',
            'Thủ tục bồi thường trực tuyến trong 48 giờ',
        ],
    },
];
/* ============================== SERVICE METHODS ============================== */
const getPackages = (type) => __awaiter(void 0, void 0, void 0, function* () {
    if (type) {
        return INSURANCE_PACKAGES.filter((pkg) => pkg.type === type);
    }
    return INSURANCE_PACKAGES;
});
const getPackageById = (id) => __awaiter(void 0, void 0, void 0, function* () {
    return INSURANCE_PACKAGES.find((pkg) => pkg.id === id) || null;
});
const calculateFee = (input) => __awaiter(void 0, void 0, void 0, function* () {
    const pkg = INSURANCE_PACKAGES.find((p) => p.id === input.package_id);
    if (!pkg) {
        throw new Error('Không tìm thấy gói bảo hiểm');
    }
    const guests = Math.max(1, Number(input.guests) || 1);
    const days = Math.max(1, Number(input.days) || 1);
    let totalFee = pkg.price_per_person * guests;
    if (pkg.type === 'travel' && days > 3) {
        totalFee += (days - 3) * 20000 * guests;
    }
    return {
        package: pkg,
        guests,
        days,
        total_fee: totalFee,
    };
});
const attachInsuranceToBooking = (bookingId_1, packageId_1, ...args_1) => __awaiter(void 0, [bookingId_1, packageId_1, ...args_1], void 0, function* (bookingId, packageId, guests = 1, userId, role) {
    const booking = yield prisma_1.default.bookings.findFirst({
        where: Object.assign({ id: bookingId }, (role === 'admin' || !userId ? {} : { user_id: userId })),
    });
    if (!booking) {
        throw new Error('Không tìm thấy đơn đặt chỗ hoặc bạn không có quyền can thiệp');
    }
    const feeCalc = yield calculateFee({ package_id: packageId, guests });
    const updatedBooking = yield prisma_1.default.bookings.update({
        where: { id: bookingId },
        data: {
            total_price: Number(booking.total_price) + feeCalc.total_fee,
        },
    });
    return {
        booking_id: updatedBooking.id,
        insurance: feeCalc.package,
        insurance_fee: feeCalc.total_fee,
        new_total_price: Number(updatedBooking.total_price),
    };
});
exports.default = {
    getPackages,
    getPackageById,
    calculateFee,
    attachInsuranceToBooking,
};
//# sourceMappingURL=insurances.service.js.map
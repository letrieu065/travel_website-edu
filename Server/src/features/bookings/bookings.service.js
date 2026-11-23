"use strict";
/**
 * ============================================================================
 * MODULE BOOKINGS - SERVICE (Xử lý Nghiệp vụ Đặt chỗ & Quản lý Kho)
 * ============================================================================
 * Chịu trách nhiệm:
 * - Thực thi nghiệp vụ đặt chỗ giao dịch nguyên tử ($transaction ACID của Prisma).
 * - Kiểm tra số lượng chỗ còn trống (available_seats, available_rooms).
 * - Tự động trừ số lượng khả dụng khi đặt chỗ và hoàn trả khi hủy.
 * - Tính toán chính xác tổng tiền, áp dụng voucher giảm giá.
 * ============================================================================
 */
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
/**
 * Tính toán tham số phân trang chuẩn
 * // (Đã thêm)
 */
const getPagination = (pageInput, limitInput) => {
    const page = Math.max(1, Number(pageInput) || 1);
    const rawLimit = Number(limitInput);
    const limit = !isNaN(rawLimit) && rawLimit > 0 ? rawLimit : 10;
    const skip = (page - 1) * limit;
    return { page, limit, skip };
};
/* ============================== SERVICE METHODS ============================== */
/**
 * Tạo mới đơn đặt chỗ sử dụng Prisma Transaction
 * - Đảm bảo tính toàn vẹn dữ liệu: Nếu một dịch vụ hết chỗ, toàn bộ đơn sẽ rollback
 * - Cập nhật kho (decrement seats/rooms)
 * - Tự động khởi tạo bản ghi thanh toán nếu có payment_method
 * // (Đã thêm)
 */
const createBooking = (data) => __awaiter(void 0, void 0, void 0, function* () {
    if (!data.items || data.items.length === 0) {
        throw new Error('Danh sách dịch vụ đặt chỗ không được để trống');
    }
    return prisma_1.default.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b;
        let totalPrice = 0;
        const preparedItems = [];
        for (const item of data.items) {
            const quantity = Number(item.quantity);
            if (!Number.isInteger(quantity) || quantity <= 0) {
                throw new Error('Số lượng đặt phải là số nguyên dương lớn hơn 0');
            }
            let unitPrice = 0;
            let resolvedItemId = item.item_id;
            let checkInDate = item.check_in ? new Date(item.check_in) : null;
            let checkOutDate = item.check_out ? new Date(item.check_out) : null;
            if (item.item_type === 'tour') {
                // Kiểm tra item_id là tour_departure hay tour
                let departure = yield tx.tour_departures.findUnique({
                    where: { id: item.item_id },
                });
                if (!departure) {
                    departure = yield tx.tour_departures.findFirst({
                        where: { tour_id: item.item_id, available_seats: { gte: quantity } },
                        orderBy: { start_date: 'asc' },
                    });
                }
                if (!departure) {
                    throw new Error(`Không tìm thấy lịch khởi hành phù hợp cho tour ${item.item_id}`);
                }
                // Cập nhật nguyên tử có điều kiện: Trừ số lượng chỗ trống chỉ khi available_seats >= quantity
                const res = yield tx.tour_departures.updateMany({
                    where: { id: departure.id, available_seats: { gte: quantity } },
                    data: { available_seats: { decrement: quantity } },
                });
                if (res.count === 0) {
                    throw new Error(`Tour không đủ chỗ trống (chỉ còn ${departure.available_seats} chỗ)`);
                }
                resolvedItemId = departure.id;
                unitPrice = Number((_a = departure.discount_price) !== null && _a !== void 0 ? _a : departure.price);
                if (!checkInDate)
                    checkInDate = departure.start_date;
                totalPrice += unitPrice * quantity;
            }
            else if (item.item_type === 'hotel') {
                const hotel = yield tx.hotels.findUnique({ where: { id: item.item_id } });
                if (!hotel) {
                    throw new Error(`Không tìm thấy khách sạn ${item.item_id}`);
                }
                // Bắt buộc phải có ngày check-in và check-out cho khách sạn
                if (!checkInDate || !checkOutDate) {
                    throw new Error('Vui lòng chọn ngày nhận phòng (check-in) và ngày trả phòng (check-out)');
                }
                if (checkOutDate.getTime() <= checkInDate.getTime()) {
                    throw new Error('Ngày trả phòng (check-out) phải sau ngày nhận phòng (check-in)');
                }
                // Cập nhật nguyên tử có điều kiện: Trừ số lượng phòng chỉ khi available_rooms >= quantity
                const res = yield tx.hotels.updateMany({
                    where: { id: hotel.id, available_rooms: { gte: quantity } },
                    data: { available_rooms: { decrement: quantity } },
                });
                if (res.count === 0) {
                    throw new Error(`Khách sạn ${hotel.name} không đủ phòng trống (chỉ còn ${hotel.available_rooms} phòng)`);
                }
                const diffMs = checkOutDate.getTime() - checkInDate.getTime();
                const nights = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
                unitPrice = Number((_b = hotel.discount_price) !== null && _b !== void 0 ? _b : hotel.price_per_night) * nights;
                totalPrice += unitPrice * quantity;
            }
            else if (item.item_type === 'flight') {
                const flight = yield tx.flights.findUnique({ where: { id: item.item_id } });
                if (!flight) {
                    throw new Error(`Không tìm thấy chuyến bay ${item.item_id}`);
                }
                // Cập nhật nguyên tử có điều kiện: Trừ số lượng ghế chỉ khi available_seats >= quantity
                const res = yield tx.flights.updateMany({
                    where: { id: flight.id, available_seats: { gte: quantity } },
                    data: { available_seats: { decrement: quantity } },
                });
                if (res.count === 0) {
                    throw new Error(`Chuyến bay không đủ ghế trống (chỉ còn ${flight.available_seats} ghế)`);
                }
                unitPrice = Number(flight.ticket_price);
                if (!checkInDate)
                    checkInDate = flight.departure_time;
                if (!checkOutDate)
                    checkOutDate = flight.arrival_time;
                totalPrice += unitPrice * quantity;
            }
            else {
                throw new Error(`Loại dịch vụ không hợp lệ: ${item.item_type}`);
            }
            preparedItems.push({
                item_type: item.item_type,
                item_id: resolvedItemId,
                quantity,
                unit_price: unitPrice,
                check_in: checkInDate,
                check_out: checkOutDate,
            });
        }
        let discount = 0;
        // Chặn thao túng số tiền giảm giá: Bỏ qua discount_amount gửi từ client.
        // Chỉ chấp nhận coupon_code hợp lệ và tự tính toán giảm giá an toàn phía Server.
        if (data.coupon_code) {
            const code = data.coupon_code.trim().toUpperCase();
            const VALID_COUPONS = {
                'WELCOME10': { type: 'percent', value: 10, maxDiscount: 200000 },
                'SUMMER20': { type: 'percent', value: 20, maxDiscount: 500000 },
                'TRAVEL50': { type: 'fixed', value: 50000 },
            };
            const coupon = VALID_COUPONS[code];
            if (coupon) {
                if (coupon.type === 'percent') {
                    const rawDiscount = totalPrice * (coupon.value / 100);
                    discount = coupon.maxDiscount ? Math.min(rawDiscount, coupon.maxDiscount) : rawDiscount;
                }
                else {
                    discount = Math.min(coupon.value, totalPrice);
                }
            }
            else {
                throw new Error(`Mã giảm giá "${data.coupon_code}" không hợp lệ hoặc đã hết hạn`);
            }
        }
        const finalTotal = Math.max(0, totalPrice - discount);
        // Tạo đơn đặt chỗ chính kèm chi tiết từng mục dịch vụ và thanh toán
        const booking = yield tx.bookings.create({
            data: Object.assign({ user_id: data.user_id, total_price: finalTotal, booking_items: {
                    create: preparedItems,
                } }, (data.payment_method
                ? {
                    payments: {
                        create: {
                            amount: finalTotal,
                            payment_method: data.payment_method,
                            payment_status: 'pending',
                        },
                    },
                }
                : {})),
            include: {
                booking_items: true,
                payments: true,
            },
        });
        return booking;
    }));
});
/**
 * Lấy danh sách đơn đặt chỗ của người dùng với phân trang
 * // (Đã thêm)
 */
const getMyBookings = (userId_1, ...args_1) => __awaiter(void 0, [userId_1, ...args_1], void 0, function* (userId, pageInput = 1, limitInput = 10) {
    const { page, limit, skip } = getPagination(pageInput, limitInput);
    const [total, items] = yield Promise.all([
        prisma_1.default.bookings.count({ where: { user_id: userId } }),
        prisma_1.default.bookings.findMany({
            where: { user_id: userId },
            skip,
            take: limit,
            orderBy: { created_at: 'desc' },
            include: {
                booking_items: true,
                payments: true,
            },
        }),
    ]);
    return { bookings: items, total, page, limit };
});
/**
 * Lấy chi tiết đơn đặt chỗ theo ID của người dùng sở hữu
 * // (Đã thêm)
 */
const getBookingById = (userId, bookingId) => __awaiter(void 0, void 0, void 0, function* () {
    return prisma_1.default.bookings.findFirst({
        where: { id: bookingId, user_id: userId },
        include: {
            booking_items: true,
            payments: true,
        },
    });
});
/**
 * Hủy đơn đặt chỗ và hoàn trả số lượng ghế / phòng khả dụng về kho
 * - Nếu đã thanh toán: Cập nhật payment_status thành 'refund_requested'
 * - Nếu chưa thanh toán: Chuyển payment_status sang 'failed'
 * - Tự động hoàn trả available_seats / available_rooms trong Transaction nguyên tử
 * - Chống Inventory Replay Attack: Kiểm tra đơn đã hủy trước đó
 * // (Đã thêm)
 */
const cancelBooking = (userId, bookingId) => __awaiter(void 0, void 0, void 0, function* () {
    // Chạy toàn bộ quá trình kiểm tra đơn, cập nhật trạng thái thanh toán và hoàn trả kho trong Prisma Transaction
    return prisma_1.default.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
        const booking = yield tx.bookings.findFirst({
            where: { id: bookingId, user_id: userId },
            include: { booking_items: true, payments: true },
        });
        if (!booking) {
            throw new Error('Không tìm thấy đơn đặt chỗ');
        }
        // Kiểm tra xem đơn hàng đã từng bị hủy hoặc hoàn tiền chưa (chống replay attack)
        const alreadyCancelled = booking.payments.length > 0 &&
            booking.payments.every((p) => p.payment_status === 'failed' || p.payment_status === 'refund_requested');
        if (alreadyCancelled) {
            throw new Error('Đơn đặt chỗ này đã được hủy trước đó');
        }
        const isPaid = booking.payments.some((p) => p.payment_status === 'paid');
        // Cập nhật nguyên tử trạng thái thanh toán chỉ cho các bản ghi chưa bị hủy
        let updateCount = 0;
        if (isPaid) {
            const res = yield tx.payments.updateMany({
                where: { booking_id: bookingId, payment_status: 'paid' },
                data: { payment_status: 'refund_requested' },
            });
            updateCount = res.count;
        }
        else {
            const res = yield tx.payments.updateMany({
                where: { booking_id: bookingId, payment_status: { notIn: ['failed', 'refund_requested'] } },
                data: { payment_status: 'failed' },
            });
            updateCount = res.count;
        }
        if (booking.payments.length > 0 && updateCount === 0) {
            throw new Error('Đơn đặt chỗ này đã được hủy trước đó');
        }
        // Hoàn trả số chỗ / số phòng về kho an toàn
        for (const item of booking.booking_items) {
            if (item.item_type === 'tour') {
                yield tx.tour_departures.updateMany({
                    where: { id: item.item_id },
                    data: { available_seats: { increment: item.quantity } },
                });
            }
            else if (item.item_type === 'hotel') {
                yield tx.hotels.updateMany({
                    where: { id: item.item_id },
                    data: { available_rooms: { increment: item.quantity } },
                });
            }
            else if (item.item_type === 'flight') {
                yield tx.flights.updateMany({
                    where: { id: item.item_id },
                    data: { available_seats: { increment: item.quantity } },
                });
            }
        }
        return {
            booking_id: bookingId,
            cancelled: true,
            refund_required: isPaid,
            message: isPaid
                ? 'Đã gửi yêu cầu hủy đơn và hoàn tiền'
                : 'Đã hủy đơn đặt chỗ thành công',
        };
    }));
});
exports.default = {
    createBooking,
    getMyBookings,
    getBookingById,
    cancelBooking,
};
//# sourceMappingURL=bookings.service.js.map
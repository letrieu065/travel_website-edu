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
    const limit = Math.max(1, Number(limitInput) || 10);
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
            const quantity = Math.max(1, Number(item.quantity) || 1);
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
                if (departure.available_seats < quantity) {
                    throw new Error(`Tour không đủ chỗ trống (chỉ còn ${departure.available_seats} chỗ)`);
                }
                // Trừ số lượng chỗ trống của lịch khởi hành tour
                yield tx.tour_departures.update({
                    where: { id: departure.id },
                    data: { available_seats: { decrement: quantity } },
                });
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
                if (hotel.available_rooms < quantity) {
                    throw new Error(`Khách sạn ${hotel.name} không đủ phòng trống (chỉ còn ${hotel.available_rooms} phòng)`);
                }
                // Trừ số lượng phòng trống của khách sạn
                yield tx.hotels.update({
                    where: { id: hotel.id },
                    data: { available_rooms: { decrement: quantity } },
                });
                let nights = 1;
                if (checkInDate && checkOutDate) {
                    const diffMs = checkOutDate.getTime() - checkInDate.getTime();
                    nights = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
                }
                unitPrice = Number((_b = hotel.discount_price) !== null && _b !== void 0 ? _b : hotel.price_per_night) * nights;
                totalPrice += unitPrice * quantity;
            }
            else if (item.item_type === 'flight') {
                const flight = yield tx.flights.findUnique({ where: { id: item.item_id } });
                if (!flight) {
                    throw new Error(`Không tìm thấy chuyến bay ${item.item_id}`);
                }
                if (flight.available_seats < quantity) {
                    throw new Error(`Chuyến bay không đủ ghế trống (chỉ còn ${flight.available_seats} ghế)`);
                }
                // Trừ số lượng ghế trống của chuyến bay
                yield tx.flights.update({
                    where: { id: flight.id },
                    data: { available_seats: { decrement: quantity } },
                });
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
        const finalTotal = Math.max(0, totalPrice - (Number(data.discount_amount) || 0));
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
 * - Tự động hoàn trả available_seats / available_rooms
 * // (Đã thêm)
 */
const cancelBooking = (userId, bookingId) => __awaiter(void 0, void 0, void 0, function* () {
    const booking = yield prisma_1.default.bookings.findFirst({
        where: { id: bookingId, user_id: userId },
        include: { booking_items: true, payments: true },
    });
    if (!booking) {
        throw new Error('Không tìm thấy đơn đặt chỗ');
    }
    const isPaid = booking.payments.some((p) => p.payment_status === 'paid');
    if (isPaid) {
        yield prisma_1.default.payments.updateMany({
            where: { booking_id: bookingId, payment_status: 'paid' },
            data: { payment_status: 'refund_requested' },
        });
    }
    else {
        yield prisma_1.default.payments.updateMany({
            where: { booking_id: bookingId },
            data: { payment_status: 'failed' },
        });
    }
    // Hoàn trả số chỗ / số phòng về kho
    for (const item of booking.booking_items) {
        if (item.item_type === 'tour') {
            yield prisma_1.default.tour_departures.updateMany({
                where: { id: item.item_id },
                data: { available_seats: { increment: item.quantity } },
            });
        }
        else if (item.item_type === 'hotel') {
            yield prisma_1.default.hotels.updateMany({
                where: { id: item.item_id },
                data: { available_rooms: { increment: item.quantity } },
            });
        }
        else if (item.item_type === 'flight') {
            yield prisma_1.default.flights.updateMany({
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
});
exports.default = {
    createBooking,
    getMyBookings,
    getBookingById,
    cancelBooking,
};
//# sourceMappingURL=bookings.service.js.map
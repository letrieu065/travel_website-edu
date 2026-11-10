import prisma from '../../config/prisma';

/* ============================== TYPES ============================== */

export interface BookingItemInput {
    item_type: 'tour' | 'hotel' | 'flight';
    item_id: string; // Với tour có thể là tour_departure_id hoặc tour_id
    quantity: number;
    check_in?: string;
    check_out?: string;
}

export interface CreateBookingData {
    user_id: string;
    items: BookingItemInput[];
    payment_method?: string;
    discount_amount?: number;
}

// (Đã thêm)
const getPagination = (pageInput: number, limitInput: number) => {
    const page = Math.max(1, Number(pageInput) || 1);
    const limit = Math.max(1, Number(limitInput) || 10);
    const skip = (page - 1) * limit;
    return { page, limit, skip };
};

/* ============================== SERVICE METHODS ============================== */

const createBooking = async (data: CreateBookingData) => {
    if (!data.items || data.items.length === 0) {
        throw new Error('Danh sách dịch vụ đặt chỗ không được để trống');
    }

    return prisma.$transaction(async (tx) => {
        let totalPrice = 0;
        const preparedItems: any[] = [];

        for (const item of data.items) {
            const quantity = Math.max(1, Number(item.quantity) || 1);
            let unitPrice = 0;
            let resolvedItemId = item.item_id;
            let checkInDate: Date | null = item.check_in ? new Date(item.check_in) : null;
            let checkOutDate: Date | null = item.check_out ? new Date(item.check_out) : null;

            if (item.item_type === 'tour') {
                // Kiểm tra item_id là tour_departure hay tour
                let departure = await tx.tour_departures.findUnique({
                    where: { id: item.item_id },
                });

                if (!departure) {
                    departure = await tx.tour_departures.findFirst({
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

                await tx.tour_departures.update({
                    where: { id: departure.id },
                    data: { available_seats: { decrement: quantity } },
                });

                resolvedItemId = departure.id;
                unitPrice = Number(departure.discount_price ?? departure.price);
                if (!checkInDate) checkInDate = departure.start_date;
                totalPrice += unitPrice * quantity;
            } else if (item.item_type === 'hotel') {
                const hotel = await tx.hotels.findUnique({ where: { id: item.item_id } });
                if (!hotel) {
                    throw new Error(`Không tìm thấy khách sạn ${item.item_id}`);
                }
                if (hotel.available_rooms < quantity) {
                    throw new Error(`Khách sạn ${hotel.name} không đủ phòng trống (chỉ còn ${hotel.available_rooms} phòng)`);
                }

                await tx.hotels.update({
                    where: { id: hotel.id },
                    data: { available_rooms: { decrement: quantity } },
                });

                let nights = 1;
                if (checkInDate && checkOutDate) {
                    const diffMs = checkOutDate.getTime() - checkInDate.getTime();
                    nights = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
                }

                unitPrice = Number(hotel.discount_price ?? hotel.price_per_night) * nights;
                totalPrice += unitPrice * quantity;
            } else if (item.item_type === 'flight') {
                const flight = await tx.flights.findUnique({ where: { id: item.item_id } });
                if (!flight) {
                    throw new Error(`Không tìm thấy chuyến bay ${item.item_id}`);
                }
                if (flight.available_seats < quantity) {
                    throw new Error(`Chuyến bay không đủ ghế trống (chỉ còn ${flight.available_seats} ghế)`);
                }

                await tx.flights.update({
                    where: { id: flight.id },
                    data: { available_seats: { decrement: quantity } },
                });

                unitPrice = Number(flight.ticket_price);
                if (!checkInDate) checkInDate = flight.departure_time;
                if (!checkOutDate) checkOutDate = flight.arrival_time;
                totalPrice += unitPrice * quantity;
            } else {
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

        const booking = await tx.bookings.create({
            data: {
                user_id: data.user_id,
                total_price: finalTotal,
                booking_items: {
                    create: preparedItems,
                },
                ...(data.payment_method
                    ? {
                          payments: {
                              create: {
                                  amount: finalTotal,
                                  payment_method: data.payment_method,
                                  payment_status: 'pending',
                              },
                          },
                      }
                    : {}),
            },
            include: {
                booking_items: true,
                payments: true,
            },
        });

        return booking;
    });
};

const getMyBookings = async (userId: string, pageInput: number = 1, limitInput: number = 10) => {
    const { page, limit, skip } = getPagination(pageInput, limitInput);

    const [total, items] = await Promise.all([
        prisma.bookings.count({ where: { user_id: userId } }),
        prisma.bookings.findMany({
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
};

const getBookingById = async (userId: string, bookingId: string) => {
    return prisma.bookings.findFirst({
        where: { id: bookingId, user_id: userId },
        include: {
            booking_items: true,
            payments: true,
        },
    });
};

const cancelBooking = async (userId: string, bookingId: string) => {
    const booking = await prisma.bookings.findFirst({
        where: { id: bookingId, user_id: userId },
        include: { booking_items: true, payments: true },
    });

    if (!booking) {
        throw new Error('Không tìm thấy đơn đặt chỗ');
    }

    const isPaid = booking.payments.some((p) => p.payment_status === 'paid');
    if (isPaid) {
        // Nếu đã thanh toán, chuyển payment_status sang pending refund hoặc báo cần xử lý hoàn tiền
        await prisma.payments.updateMany({
            where: { booking_id: bookingId, payment_status: 'paid' },
            data: { payment_status: 'refund_requested' },
        });
    } else {
        await prisma.payments.updateMany({
            where: { booking_id: bookingId },
            data: { payment_status: 'failed' },
        });
    }

    // Hoàn trả số chỗ / số phòng về kho
    for (const item of booking.booking_items) {
        if (item.item_type === 'tour') {
            await prisma.tour_departures.updateMany({
                where: { id: item.item_id },
                data: { available_seats: { increment: item.quantity } },
            });
        } else if (item.item_type === 'hotel') {
            await prisma.hotels.updateMany({
                where: { id: item.item_id },
                data: { available_rooms: { increment: item.quantity } },
            });
        } else if (item.item_type === 'flight') {
            await prisma.flights.updateMany({
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
};

export default {
    createBooking,
    getMyBookings,
    getBookingById,
    cancelBooking,
};


import prisma from '../../config/prisma';

/* ============================== TYPES ============================== */

export interface InsurancePackage {
    id: string;
    name: string;
    type: 'travel' | 'cancellation';
    price_per_person: number;
    max_coverage: number;
    benefits: string[];
    description: string;
}

export interface CalculateInsuranceInput {
    package_id: string;
    guests: number;
    days?: number;
    booking_amount?: number;
}

// TODO: Chuyển sang bảng insurances trong schema.prisma khi migrate DB
const INSURANCE_PACKAGES: InsurancePackage[] = [
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

const getPackages = async (type?: 'travel' | 'cancellation') => {
    if (type) {
        return INSURANCE_PACKAGES.filter((pkg) => pkg.type === type);
    }
    return INSURANCE_PACKAGES;
};

const getPackageById = async (id: string) => {
    return INSURANCE_PACKAGES.find((pkg) => pkg.id === id) || null;
};

const calculateFee = async (input: CalculateInsuranceInput) => {
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
};

const attachInsuranceToBooking = async (bookingId: string, packageId: string, guests: number = 1) => {
    const booking = await prisma.bookings.findUnique({ where: { id: bookingId } });
    if (!booking) {
        throw new Error('Không tìm thấy đơn đặt chỗ');
    }

    const feeCalc = await calculateFee({ package_id: packageId, guests });

    const updatedBooking = await prisma.bookings.update({
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
};

export default {
    getPackages,
    getPackageById,
    calculateFee,
    attachInsuranceToBooking,
};


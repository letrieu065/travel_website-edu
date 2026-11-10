import prisma from '../../config/prisma';
import bcrypt from 'bcrypt';

/* ============================== TYPES ============================== */

export interface UpdateProfileData {
    full_name?: string;
    phone_number?: string;
    avatar_url?: string;
}

export interface ChangePasswordData {
    old_password: string;
    new_password: string;
}

export interface FavoriteItemData {
    item_type: 'tour' | 'hotel' | 'flight';
    item_id: string;
}

/* ============================== SERVICE METHODS ============================== */

const getProfile = async (userId: string) => {
    const user = await prisma.users.findUnique({
        where: { id: userId },
        select: {
            id: true,
            email: true,
            full_name: true,
            phone_number: true,
            avatar_url: true,
            auth_provider: true,
            role: true,
            created_at: true,
        },
    });

    if (!user) return null;

    return {
        ...user,
        fullName: user.full_name,
        avatarUrl: user.avatar_url,
        phoneNumber: user.phone_number,
    };
};

const updateProfile = async (userId: string, data: UpdateProfileData) => {
    const updateData: any = {};
    if (data.full_name !== undefined) updateData.full_name = data.full_name;
    if (data.phone_number !== undefined) updateData.phone_number = data.phone_number;
    if (data.avatar_url !== undefined) updateData.avatar_url = data.avatar_url;

    const updated = await prisma.users.update({
        where: { id: userId },
        data: updateData,
        select: {
            id: true,
            email: true,
            full_name: true,
            phone_number: true,
            avatar_url: true,
            role: true,
        },
    });

    return updated;
};

const changePassword = async (userId: string, data: ChangePasswordData) => {
    const user = await prisma.users.findUnique({ where: { id: userId } });
    if (!user) {
        throw new Error('Không tìm thấy người dùng');
    }
    if (!user.password_hash) {
        throw new Error('Tài khoản đăng nhập qua mạng xã hội không thể đổi mật khẩu trực tiếp');
    }

    const isMatch = await bcrypt.compare(data.old_password, user.password_hash);
    if (!isMatch) {
        throw new Error('Mật khẩu hiện tại không chính xác');
    }

    const newHash = await bcrypt.hash(data.new_password, 10);
    await prisma.users.update({
        where: { id: userId },
        data: { password_hash: newHash },
    });

    return { message: 'Đổi mật khẩu thành công' };
};

// Quản lý hành trình sắp diễn ra + nhắc nhở (Mục 17 User Flow)
const getMyItinerary = async (userId: string) => {
    const now = new Date();
    const bookings = await prisma.bookings.findMany({
        where: { user_id: userId },
        orderBy: { created_at: 'desc' },
        include: {
            booking_items: true,
            payments: true,
        },
    });

    const upcomingTrips = bookings.filter((booking) =>
        booking.booking_items.some((item) => item.check_in && new Date(item.check_in) >= now)
    );

    const pastTrips = bookings.filter(
        (booking) => !upcomingTrips.some((up) => up.id === booking.id)
    );

    // Sinh nhắc nhở cho các chuyến đi trong 7 ngày tới
    const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const reminders = upcomingTrips
        .filter((booking) =>
            booking.booking_items.some(
                (item) =>
                    item.check_in &&
                    new Date(item.check_in) >= now &&
                    new Date(item.check_in) <= sevenDaysLater
            )
        )
        .map((booking) => ({
            booking_id: booking.id,
            message: 'Bạn có lịch trình du lịch sắp diễn ra trong 7 ngày tới. Vui lòng kiểm tra giấy tờ và hành lý!',
            items: booking.booking_items,
        }));

    return {
        upcomingTrips,
        pastTrips,
        reminders,
        totalBookings: bookings.length,
    };
};

const getItineraryDetail = async (userId: string, bookingId: string) => {
    const booking = await prisma.bookings.findFirst({
        where: { id: bookingId, user_id: userId },
        include: {
            booking_items: true,
            payments: true,
        },
    });
    return booking;
};

// Danh sách yêu thích (TODO: cần bảng favorites trong schema.prisma để lưu lâu dài)
const favoriteStore = new Map<string, FavoriteItemData[]>();

const getFavorites = async (userId: string) => {
    return favoriteStore.get(userId) ?? [];
};

const addFavorite = async (userId: string, item: FavoriteItemData) => {
    const list = favoriteStore.get(userId) ?? [];
    const exists = list.some((f) => f.item_id === item.item_id && f.item_type === item.item_type);
    if (!exists) {
        list.push(item);
        favoriteStore.set(userId, list);
    }
    return list;
};

const removeFavorite = async (userId: string, itemType: string, itemId: string) => {
    const list = favoriteStore.get(userId) ?? [];
    const updated = list.filter((f) => !(f.item_id === itemId && f.item_type === itemType));
    favoriteStore.set(userId, updated);
    return updated;
};

export default {
    getProfile,
    updateProfile,
    changePassword,
    getMyItinerary,
    getItineraryDetail,
    getFavorites,
    addFavorite,
    removeFavorite,
};


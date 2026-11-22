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
declare const getProfile: (userId: string) => Promise<{
    fullName: string;
    avatarUrl: string | null;
    phoneNumber: string | null;
    auth_provider: string | null;
    avatar_url: string | null;
    created_at: Date | null;
    email: string;
    full_name: string;
    id: string;
    phone_number: string | null;
    role: string | null;
} | null>;
declare const updateProfile: (userId: string, data: UpdateProfileData) => Promise<{
    avatar_url: string | null;
    email: string;
    full_name: string;
    id: string;
    phone_number: string | null;
    role: string | null;
}>;
declare const changePassword: (userId: string, data: ChangePasswordData) => Promise<{
    message: string;
}>;
declare const getMyItinerary: (userId: string) => Promise<{
    upcoming: ({
        booking_items: {
            booking_id: string;
            item_type: string;
            quantity: number;
            unit_price: import("@prisma/client-runtime-utils").Decimal;
            check_in: Date | null;
            check_out: Date | null;
            item_id: string;
        }[];
        payments: {
            id: string;
            booking_id: string | null;
            amount: import("@prisma/client-runtime-utils").Decimal;
            payment_method: string;
            transaction_id: string | null;
            payment_status: string | null;
            payment_date: Date | null;
        }[];
    } & {
        id: string;
        user_id: string | null;
        total_price: import("@prisma/client-runtime-utils").Decimal;
        created_at: Date | null;
    })[];
    upcomingTrips: ({
        booking_items: {
            booking_id: string;
            item_type: string;
            quantity: number;
            unit_price: import("@prisma/client-runtime-utils").Decimal;
            check_in: Date | null;
            check_out: Date | null;
            item_id: string;
        }[];
        payments: {
            id: string;
            booking_id: string | null;
            amount: import("@prisma/client-runtime-utils").Decimal;
            payment_method: string;
            transaction_id: string | null;
            payment_status: string | null;
            payment_date: Date | null;
        }[];
    } & {
        id: string;
        user_id: string | null;
        total_price: import("@prisma/client-runtime-utils").Decimal;
        created_at: Date | null;
    })[];
    past: ({
        booking_items: {
            booking_id: string;
            item_type: string;
            quantity: number;
            unit_price: import("@prisma/client-runtime-utils").Decimal;
            check_in: Date | null;
            check_out: Date | null;
            item_id: string;
        }[];
        payments: {
            id: string;
            booking_id: string | null;
            amount: import("@prisma/client-runtime-utils").Decimal;
            payment_method: string;
            transaction_id: string | null;
            payment_status: string | null;
            payment_date: Date | null;
        }[];
    } & {
        id: string;
        user_id: string | null;
        total_price: import("@prisma/client-runtime-utils").Decimal;
        created_at: Date | null;
    })[];
    pastTrips: ({
        booking_items: {
            booking_id: string;
            item_type: string;
            quantity: number;
            unit_price: import("@prisma/client-runtime-utils").Decimal;
            check_in: Date | null;
            check_out: Date | null;
            item_id: string;
        }[];
        payments: {
            id: string;
            booking_id: string | null;
            amount: import("@prisma/client-runtime-utils").Decimal;
            payment_method: string;
            transaction_id: string | null;
            payment_status: string | null;
            payment_date: Date | null;
        }[];
    } & {
        id: string;
        user_id: string | null;
        total_price: import("@prisma/client-runtime-utils").Decimal;
        created_at: Date | null;
    })[];
    reminders: {
        booking_id: string;
        message: string;
        items: {
            booking_id: string;
            item_type: string;
            quantity: number;
            unit_price: import("@prisma/client-runtime-utils").Decimal;
            check_in: Date | null;
            check_out: Date | null;
            item_id: string;
        }[];
    }[];
    totalBookings: number;
}>;
declare const getItineraryDetail: (userId: string, bookingId: string) => Promise<({
    booking_items: {
        booking_id: string;
        item_type: string;
        quantity: number;
        unit_price: import("@prisma/client-runtime-utils").Decimal;
        check_in: Date | null;
        check_out: Date | null;
        item_id: string;
    }[];
    payments: {
        id: string;
        booking_id: string | null;
        amount: import("@prisma/client-runtime-utils").Decimal;
        payment_method: string;
        transaction_id: string | null;
        payment_status: string | null;
        payment_date: Date | null;
    }[];
} & {
    id: string;
    user_id: string | null;
    total_price: import("@prisma/client-runtime-utils").Decimal;
    created_at: Date | null;
}) | null>;
declare const getFavorites: (userId: string) => Promise<{
    item_type: 'tour' | 'hotel' | 'flight';
    item_id: string;
}[]>;
declare const addFavorite: (userId: string, item: FavoriteItemData) => Promise<{
    item_type: 'tour' | 'hotel' | 'flight';
    item_id: string;
}[]>;
declare const removeFavorite: (userId: string, itemType: string, itemId: string) => Promise<{
    item_type: 'tour' | 'hotel' | 'flight';
    item_id: string;
}[]>;
declare const _default: {
    getProfile: typeof getProfile;
    updateProfile: typeof updateProfile;
    changePassword: typeof changePassword;
    getMyItinerary: typeof getMyItinerary;
    getItineraryDetail: typeof getItineraryDetail;
    getFavorites: typeof getFavorites;
    addFavorite: typeof addFavorite;
    removeFavorite: typeof removeFavorite;
};
export default _default;

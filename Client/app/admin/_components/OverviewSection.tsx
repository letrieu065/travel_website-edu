'use client';

import React, { useMemo, useState } from 'react';
import {
    AlertTriangle,
    ArrowRight,
    Building2,
    CalendarCheck,
    Compass,
    CreditCard,
    Eye,
    Flame,
    MessageSquare,
    Plane,
    TrendingUp,
    Users,
} from 'lucide-react';
import type {
    AdminTab,
    BookingItem,
    DashboardStats,
    FlightItem,
    HotelItem,
    PaymentRecordItem,
    PlaneItem,
    ResolvedItemMeta,
    ReviewItem,
    SortConfig,
    TourItem,
    UserItem,
} from './types';
import {
    AvatarBadge,
    CopyIdButton,
    PaymentStatusBadge,
    SortableTh,
    cycleSortConfig,
} from './TableControls';
import {
    formatCompactCurrency,
    formatCurrency,
    formatDate,
    getBookingPrimaryStatus,
    getTourTotalSeats,
    sortItems,
    toTimestamp,
} from './utils';

interface OverviewSectionProps {
    stats: DashboardStats | null;
    bookings: BookingItem[];
    payments: PaymentRecordItem[];
    tours: TourItem[];
    hotels: HotelItem[];
    flights: FlightItem[];
    planes: PlaneItem[];
    users: UserItem[];
    reviews: ReviewItem[];
    itemLookup: Map<string, ResolvedItemMeta>;
    onNavigateTab: (tab: AdminTab, presetChip?: string) => void;
    onOpenBookingDetail: (booking: BookingItem) => void;
    onOpenUserDetail: (user: UserItem) => void;
}

type RecentBookingSortKey = 'customer' | 'items' | 'amount' | 'status' | 'created_at';
type RecentUserSortKey = 'full_name' | 'email' | 'auth_provider' | 'role' | 'created_at';

// (Đã thêm)
export default function OverviewSection({
    stats,
    bookings,
    payments,
    tours,
    hotels,
    flights,
    planes,
    users,
    reviews,
    itemLookup,
    onNavigateTab,
    onOpenBookingDetail,
    onOpenUserDetail,
}: OverviewSectionProps) {
    const [recentBookingSort, setRecentBookingSort] = useState<SortConfig<RecentBookingSortKey> | null>(null);
    const [recentUserSort, setRecentUserSort] = useState<SortConfig<RecentUserSortKey> | null>(null);

    const metrics = useMemo(() => {
        const paidCount = bookings.filter((b) => getBookingPrimaryStatus(b) === 'paid').length;
        const pendingBookings = bookings.filter((b) => getBookingPrimaryStatus(b) === 'pending');
        const refundReqBookings = bookings.filter((b) => getBookingPrimaryStatus(b) === 'refund_requested');
        const pendingAmount = pendingBookings.reduce((s, b) => s + Number(b.total_price || 0), 0);

        const trendingTours = tours.filter((t) => t.is_trending).length;
        const totalTourDepartures = tours.reduce((s, t) => s + (t.tour_departures?.length || 0), 0);
        const lowSeatTours = tours.filter((t) => {
            const seats = getTourTotalSeats(t);
            return (t.tour_departures?.length || 0) > 0 && seats <= 5;
        }).length;

        const trendingHotels = hotels.filter((h) => h.is_trending).length;
        const totalHotelRooms = hotels.reduce((s, h) => s + Number(h.available_rooms || 0), 0);
        const lowRoomHotels = hotels.filter((h) => Number(h.available_rooms || 0) <= 3).length;

        const totalFlightSeats = flights.reduce((s, f) => s + Number(f.available_seats || 0), 0);
        const lowSeatFlights = flights.filter((f) => Number(f.available_seats || 0) <= 10).length;

        const adminCount = users.filter((u) => u.role === 'admin').length;
        const avgRating =
            reviews.length > 0
                ? (reviews.reduce((s, r) => s + Number(r.rating || 0), 0) / reviews.length).toFixed(1)
                : '0.0';

        const paidRate = bookings.length > 0 ? Math.round((paidCount / bookings.length) * 100) : 0;

        return {
            paidCount,
            paidRate,
            pendingCount: pendingBookings.length,
            pendingAmount,
            refundReqCount: refundReqBookings.length,
            trendingTours,
            totalTourDepartures,
            lowSeatTours,
            trendingHotels,
            totalHotelRooms,
            lowRoomHotels,
            totalFlightSeats,
            lowSeatFlights,
            adminCount,
            avgRating,
            totalPayments: payments.length,
        };
    }, [bookings, payments, tours, hotels, flights, users, reviews]);

    const recentBookingsList = useMemo(() => {
        const base = bookings.length > 0 ? bookings.slice(0, 8) : stats?.recentBookings || [];
        return sortItems(base, recentBookingSort, {
            customer: (b) => b.users?.full_name || b.users?.email || '',
            items: (b) => b.booking_items?.reduce((s, i) => s + Number(i.quantity || 0), 0) || 0,
            amount: (b) => Number(b.total_price || 0),
            status: (b) => getBookingPrimaryStatus(b),
            created_at: (b) => toTimestamp(b.created_at) ?? 0,
        });
    }, [bookings, stats?.recentBookings, recentBookingSort]);

    const recentUsersList = useMemo(() => {
        const base = users.length > 0 ? users.slice(0, 8) : stats?.recentUsers || [];
        return sortItems(base, recentUserSort, {
            full_name: (u) => u.full_name || '',
            email: (u) => u.email || '',
            auth_provider: (u) => u.auth_provider || 'local',
            role: (u) => u.role || 'user',
            created_at: (u) => toTimestamp(u.created_at) ?? 0,
        });
    }, [users, stats?.recentUsers, recentUserSort]);

    return (
        <div className="space-y-6">
            {/* Operational Alerts Strip */}
            {(metrics.refundReqCount > 0 ||
                metrics.pendingCount > 0 ||
                metrics.lowSeatTours > 0 ||
                metrics.lowSeatFlights > 0 ||
                metrics.lowRoomHotels > 0) && (
                <div className="bg-white border border-amber-200/90 rounded-2xl p-4 shadow-xs">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                                <AlertTriangle className="w-4 h-4" />
                            </div>
                            <div>
                                <p className="text-xs font-bold uppercase tracking-wider text-gray-900">
                                    Cần chú ý vận hành hôm nay
                                </p>
                                <p className="text-[11px] text-gray-500">
                                    Bấm trực tiếp vào từng thẻ để lọc nhanh danh sách cần xử lý
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            {metrics.refundReqCount > 0 && (
                                <button
                                    type="button"
                                    onClick={() => onNavigateTab('bookings', 'refund_requested')}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-violet-50 border border-violet-200 text-violet-700 text-xs font-bold hover:bg-violet-100 transition-colors cursor-pointer"
                                >
                                    <span>{metrics.refundReqCount} yêu cầu hoàn tiền</span>
                                    <ArrowRight className="w-3 h-3" />
                                </button>
                            )}
                            {metrics.pendingCount > 0 && (
                                <button
                                    type="button"
                                    onClick={() => onNavigateTab('bookings', 'pending')}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold hover:bg-amber-100 transition-colors cursor-pointer"
                                >
                                    <span>{metrics.pendingCount} đơn chờ thanh toán</span>
                                    <ArrowRight className="w-3 h-3" />
                                </button>
                            )}
                            {metrics.lowSeatTours > 0 && (
                                <button
                                    type="button"
                                    onClick={() => onNavigateTab('tours', 'low_seats')}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold hover:bg-rose-100 transition-colors cursor-pointer"
                                >
                                    <span>{metrics.lowSeatTours} tour sắp hết chỗ</span>
                                    <ArrowRight className="w-3 h-3" />
                                </button>
                            )}
                            {metrics.lowRoomHotels > 0 && (
                                <button
                                    type="button"
                                    onClick={() => onNavigateTab('hotels', 'low_rooms')}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-50 border border-orange-200 text-orange-700 text-xs font-bold hover:bg-orange-100 transition-colors cursor-pointer"
                                >
                                    <span>{metrics.lowRoomHotels} khách sạn ít phòng</span>
                                    <ArrowRight className="w-3 h-3" />
                                </button>
                            )}
                            {metrics.lowSeatFlights > 0 && (
                                <button
                                    type="button"
                                    onClick={() => onNavigateTab('flights', 'low_seats')}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-sky-50 border border-sky-200 text-sky-700 text-xs font-bold hover:bg-sky-100 transition-colors cursor-pointer"
                                >
                                    <span>{metrics.lowSeatFlights} chuyến bay ít ghế</span>
                                    <ArrowRight className="w-3 h-3" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* 6 Rich KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                <div
                    onClick={() => onNavigateTab('revenue')}
                    className="bg-gradient-to-br from-gray-900 to-black text-white p-5 rounded-2xl shadow-sm hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
                >
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                            Tổng Doanh Thu
                        </span>
                        <span className="w-8 h-8 rounded-xl bg-[#FACC15]/15 text-[#FACC15] flex items-center justify-center">
                            <TrendingUp className="w-4 h-4" />
                        </span>
                    </div>
                    <div className="my-3">
                        <h3 className="text-xl font-black tracking-tight text-[#FACC15] tabular-nums">
                            {formatCurrency(stats?.totalRevenue)}
                        </h3>
                        <p className="text-[11px] text-gray-300 mt-1">
                            Chờ thu: <span className="font-semibold text-white">{formatCompactCurrency(metrics.pendingAmount)}</span>
                        </p>
                    </div>
                    <div className="text-[11px] font-semibold text-gray-400 group-hover:text-[#FACC15] flex items-center gap-1">
                        <span>Xem báo cáo chi tiết</span>
                        <ArrowRight className="w-3 h-3" />
                    </div>
                </div>

                <div
                    onClick={() => onNavigateTab('bookings')}
                    className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs hover:shadow-md hover:border-gray-300 transition-all cursor-pointer flex flex-col justify-between"
                >
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                            Đơn Đặt Chỗ
                        </span>
                        <span className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                            <CalendarCheck className="w-4 h-4" />
                        </span>
                    </div>
                    <div className="my-3">
                        <h3 className="text-2xl font-black text-gray-900 tabular-nums">
                            {stats?.totalBookings ?? bookings.length}
                        </h3>
                        <p className="text-[11px] text-emerald-600 font-semibold mt-1">
                            {metrics.paidCount} đã trả ({metrics.paidRate}%)
                        </p>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-emerald-500 rounded-full"
                            style={{ width: `${metrics.paidRate}%` }}
                        />
                    </div>
                </div>

                <div
                    onClick={() => onNavigateTab('tours')}
                    className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs hover:shadow-md hover:border-gray-300 transition-all cursor-pointer flex flex-col justify-between"
                >
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                            Tour Du Lịch
                        </span>
                        <span className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                            <Compass className="w-4 h-4" />
                        </span>
                    </div>
                    <div className="my-3">
                        <h3 className="text-2xl font-black text-gray-900 tabular-nums">
                            {stats?.totalTours ?? tours.length}
                        </h3>
                        <p className="text-[11px] text-gray-500 mt-1 flex items-center gap-1">
                            <Flame className="w-3 h-3 text-amber-500" />
                            <span>{metrics.trendingTours} thịnh hành · {metrics.totalTourDepartures} lịch</span>
                        </p>
                    </div>
                    <div className="h-1 bg-blue-500 rounded-full w-full" />
                </div>

                <div
                    onClick={() => onNavigateTab('hotels')}
                    className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs hover:shadow-md hover:border-gray-300 transition-all cursor-pointer flex flex-col justify-between"
                >
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                            Khách Sạn
                        </span>
                        <span className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                            <Building2 className="w-4 h-4" />
                        </span>
                    </div>
                    <div className="my-3">
                        <h3 className="text-2xl font-black text-gray-900 tabular-nums">
                            {stats?.totalHotels ?? hotels.length}
                        </h3>
                        <p className="text-[11px] text-gray-500 mt-1">
                            {metrics.totalHotelRooms} phòng trống · {metrics.trendingHotels} hot
                        </p>
                    </div>
                    <div className="h-1 bg-teal-500 rounded-full w-full" />
                </div>

                <div
                    onClick={() => onNavigateTab('flights')}
                    className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs hover:shadow-md hover:border-gray-300 transition-all cursor-pointer flex flex-col justify-between"
                >
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                            Chuyến Bay
                        </span>
                        <span className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                            <Plane className="w-4 h-4" />
                        </span>
                    </div>
                    <div className="my-3">
                        <h3 className="text-2xl font-black text-gray-900 tabular-nums">
                            {stats?.totalFlights ?? flights.length}
                        </h3>
                        <p className="text-[11px] text-gray-500 mt-1">
                            {planes.length} máy bay · {metrics.totalFlightSeats} ghế
                        </p>
                    </div>
                    <div className="h-1 bg-indigo-500 rounded-full w-full" />
                </div>

                <div
                    onClick={() => onNavigateTab('users')}
                    className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs hover:shadow-md hover:border-gray-300 transition-all cursor-pointer flex flex-col justify-between"
                >
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                            Thành Viên
                        </span>
                        <span className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                            <Users className="w-4 h-4" />
                        </span>
                    </div>
                    <div className="my-3">
                        <h3 className="text-2xl font-black text-gray-900 tabular-nums">
                            {stats?.totalUsers ?? users.length}
                        </h3>
                        <p className="text-[11px] text-gray-500 mt-1">
                            {metrics.adminCount} Admin · {reviews.length} đánh giá ({metrics.avgRating}★)
                        </p>
                    </div>
                    <div className="h-1 bg-rose-500 rounded-full w-full" />
                </div>
            </div>

            {/* Quick Navigation Strip for Secondary Modules */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                    type="button"
                    onClick={() => onNavigateTab('payments')}
                    className="bg-white border border-gray-200/80 hover:border-gray-900 rounded-2xl p-4 flex items-center justify-between transition-all text-left cursor-pointer group"
                >
                    <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                            <CreditCard className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-gray-900">Đối Soát Giao Dịch Thanh Toán</p>
                            <p className="text-xs text-gray-500">
                                Theo dõi {metrics.totalPayments} giao dịch VietQR, MoMo, VNPay & xử lý hoàn tiền
                            </p>
                        </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-black group-hover:translate-x-0.5 transition-all" />
                </button>

                <button
                    type="button"
                    onClick={() => onNavigateTab('reviews')}
                    className="bg-white border border-gray-200/80 hover:border-gray-900 rounded-2xl p-4 flex items-center justify-between transition-all text-left cursor-pointer group"
                >
                    <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center">
                            <MessageSquare className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-gray-900">Kiểm Duyệt Đánh Giá Khách Hàng</p>
                            <p className="text-xs text-gray-500">
                                {reviews.length} đánh giá · Điểm trung bình toàn sàn {metrics.avgRating} / 5.0 sao
                            </p>
                        </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-black group-hover:translate-x-0.5 transition-all" />
                </button>
            </div>

            {/* 2 Sortable Recent Activity Tables */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {/* Recent Bookings */}
                <div className="bg-white border border-gray-200/80 rounded-2xl shadow-xs overflow-hidden flex flex-col">
                    <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                        <div>
                            <h3 className="text-sm font-black uppercase tracking-tight text-gray-900">
                                Đơn Đặt Chỗ Mới Nhất
                            </h3>
                            <p className="text-[11px] text-gray-500">
                                Bấm tiêu đề cột để sắp xếp nhanh hoặc bấm vào đơn để xem chi tiết
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => onNavigateTab('bookings')}
                            className="text-xs font-bold text-gray-900 hover:text-amber-700 inline-flex items-center gap-1 cursor-pointer"
                        >
                            <span>Xem tất cả</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-stone-50/80 border-b border-gray-200">
                                <tr>
                                    <SortableTh
                                        label="Khách hàng"
                                        sortKey="customer"
                                        sortConfig={recentBookingSort}
                                        onSort={(k) => setRecentBookingSort((prev) => cycleSortConfig(prev, k))}
                                    />
                                    <SortableTh
                                        label="Dịch vụ"
                                        sortKey="items"
                                        sortConfig={recentBookingSort}
                                        onSort={(k) => setRecentBookingSort((prev) => cycleSortConfig(prev, k))}
                                        align="center"
                                    />
                                    <SortableTh
                                        label="Tổng tiền"
                                        sortKey="amount"
                                        sortConfig={recentBookingSort}
                                        onSort={(k) => setRecentBookingSort((prev) => cycleSortConfig(prev, k))}
                                        align="right"
                                    />
                                    <SortableTh
                                        label="Trạng thái"
                                        sortKey="status"
                                        sortConfig={recentBookingSort}
                                        onSort={(k) => setRecentBookingSort((prev) => cycleSortConfig(prev, k))}
                                    />
                                    <SortableTh
                                        label="Ngày đặt"
                                        sortKey="created_at"
                                        sortConfig={recentBookingSort}
                                        onSort={(k) => setRecentBookingSort((prev) => cycleSortConfig(prev, k))}
                                        align="right"
                                    />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {recentBookingsList.length > 0 ? (
                                    recentBookingsList.map((b) => {
                                        const status = getBookingPrimaryStatus(b);
                                        const firstItem = b.booking_items?.[0];
                                        const firstMeta = firstItem
                                            ? itemLookup.get(`${firstItem.item_type}:${firstItem.item_id}`)
                                            : undefined;
                                        const totalQty =
                                            b.booking_items?.reduce((s, i) => s + Number(i.quantity || 0), 0) || 0;

                                        return (
                                            <tr
                                                key={b.id}
                                                onClick={() => onOpenBookingDetail(b)}
                                                className="hover:bg-amber-50/40 transition-colors cursor-pointer"
                                            >
                                                <td className="px-3.5 py-3">
                                                    <div className="flex items-center gap-2">
                                                        <div className="min-w-0">
                                                            <p className="font-bold text-gray-900 truncate max-w-[160px]">
                                                                {b.users?.full_name || 'Khách vãng lai'}
                                                            </p>
                                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                                <CopyIdButton value={b.id} displayLength={6} />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-3.5 py-3 text-center">
                                                    <span
                                                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-stone-100 text-gray-700 text-[11px] font-semibold"
                                                        title={firstMeta?.title || 'Chi tiết dịch vụ'}
                                                    >
                                                        {totalQty > 0 ? `${totalQty} mục` : '---'}
                                                    </span>
                                                </td>
                                                <td className="px-3.5 py-3 text-right font-black text-gray-900 tabular-nums whitespace-nowrap">
                                                    {formatCurrency(b.total_price)}
                                                </td>
                                                <td className="px-3.5 py-3">
                                                    <PaymentStatusBadge status={status} compact />
                                                </td>
                                                <td className="px-3.5 py-3 text-right text-gray-500 text-[11px] tabular-nums whitespace-nowrap">
                                                    {formatDate(b.created_at)}
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="py-10 text-center text-gray-400 italic">
                                            Chưa có đơn đặt chỗ nào
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Recent Users */}
                <div className="bg-white border border-gray-200/80 rounded-2xl shadow-xs overflow-hidden flex flex-col">
                    <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                        <div>
                            <h3 className="text-sm font-black uppercase tracking-tight text-gray-900">
                                Thành Viên Mới Tham Gia
                            </h3>
                            <p className="text-[11px] text-gray-500">
                                Sắp xếp từng cột hoặc bấm vào thành viên để xem lịch sử đặt chỗ
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => onNavigateTab('users')}
                            className="text-xs font-bold text-gray-900 hover:text-amber-700 inline-flex items-center gap-1 cursor-pointer"
                        >
                            <span>Xem tất cả</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-stone-50/80 border-b border-gray-200">
                                <tr>
                                    <SortableTh
                                        label="Thành viên"
                                        sortKey="full_name"
                                        sortConfig={recentUserSort}
                                        onSort={(k) => setRecentUserSort((prev) => cycleSortConfig(prev, k))}
                                    />
                                    <SortableTh
                                        label="Email"
                                        sortKey="email"
                                        sortConfig={recentUserSort}
                                        onSort={(k) => setRecentUserSort((prev) => cycleSortConfig(prev, k))}
                                    />
                                    <SortableTh
                                        label="Nguồn"
                                        sortKey="auth_provider"
                                        sortConfig={recentUserSort}
                                        onSort={(k) => setRecentUserSort((prev) => cycleSortConfig(prev, k))}
                                        align="center"
                                    />
                                    <SortableTh
                                        label="Vai trò"
                                        sortKey="role"
                                        sortConfig={recentUserSort}
                                        onSort={(k) => setRecentUserSort((prev) => cycleSortConfig(prev, k))}
                                    />
                                    <SortableTh
                                        label="Ngày tạo"
                                        sortKey="created_at"
                                        sortConfig={recentUserSort}
                                        onSort={(k) => setRecentUserSort((prev) => cycleSortConfig(prev, k))}
                                        align="right"
                                    />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {recentUsersList.length > 0 ? (
                                    recentUsersList.map((u) => (
                                        <tr
                                            key={u.id}
                                            onClick={() => onOpenUserDetail(u)}
                                            className="hover:bg-amber-50/40 transition-colors cursor-pointer"
                                        >
                                            <td className="px-3.5 py-2.5">
                                                <div className="flex items-center gap-2.5">
                                                    <AvatarBadge name={u.full_name} avatarUrl={u.avatar_url} size="sm" />
                                                    <span className="font-bold text-gray-900 truncate max-w-[130px]">
                                                        {u.full_name}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-3.5 py-2.5 text-gray-600 text-[11px] truncate max-w-[160px]">
                                                {u.email}
                                            </td>
                                            <td className="px-3.5 py-2.5 text-center">
                                                <span className="px-2 py-0.5 rounded bg-stone-100 text-gray-600 text-[10px] font-bold uppercase">
                                                    {u.auth_provider || 'local'}
                                                </span>
                                            </td>
                                            <td className="px-3.5 py-2.5">
                                                <span
                                                    className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                                                        u.role === 'admin'
                                                            ? 'bg-[#FACC15] text-black'
                                                            : 'bg-gray-100 text-gray-600'
                                                    }`}
                                                >
                                                    {u.role || 'user'}
                                                </span>
                                            </td>
                                            <td className="px-3.5 py-2.5 text-right text-gray-500 text-[11px] tabular-nums whitespace-nowrap">
                                                <span className="inline-flex items-center gap-1">
                                                    {formatDate(u.created_at)}
                                                    <Eye className="w-3 h-3 text-gray-300" />
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="py-10 text-center text-gray-400 italic">
                                            Chưa có người dùng mới
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

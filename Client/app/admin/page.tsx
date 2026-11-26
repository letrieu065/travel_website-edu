'use client';

/**
 * ============================================================================
 * MODULE ADMIN DASHBOARD - NATURA TRAVEL (Cổng Quản Trị Hệ Thống Toàn Diện)
 * ============================================================================
 * Chịu trách nhiệm:
 * - Trung tâm chỉ huy (Command Center) cho Quản trị viên Natura Travel.
 * - Thống kê KPI thời gian thực, cảnh báo vận hành & biểu đồ doanh thu thực tế.
 * - Hỗ trợ tìm kiếm thông minh (hỗ trợ tiếng Việt không dấu, phím tắt / & Ctrl+K).
 * - Hỗ trợ sắp xếp (Sort ↑/↓) trên tất cả các cột dữ liệu của từng bảng.
 * - Đầy đủ thao tác Xem chi tiết Drawer, Thêm / Sửa / Xóa & Quản lý lịch khởi hành.
 * ============================================================================
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    Building2,
    CalendarCheck,
    CheckCircle2,
    Compass,
    CreditCard,
    ExternalLink,
    Eye,
    KeyRound,
    LayoutDashboard,
    LogOut,
    Menu,
    MessageSquare,
    Pencil,
    Plane,
    RefreshCw,
    Search,
    Shield,
    ShieldAlert,
    Star,
    Trash2,
    TrendingUp,
    Users,
    X,
    XCircle,
} from 'lucide-react';
import { AirlineLogoBadge } from '@/components/common/AirlineBranding';
import type {
    AdminTab,
    BookingItem,
    DashboardStats,
    FlightItem,
    HotelItem,
    PaymentRecordItem,
    PlaneItem,
    ReviewItem,
    SortConfig,
    ToastNotice,
    TourItem,
    UserItem,
} from './_components/types';
import {
    AvatarBadge,
    CopyIdButton,
    EmptyTableRow,
    PaginationBar,
    PaymentStatusBadge,
    SearchFilterToolbar,
    SortableTh,
    TrendingToggleButton,
    cycleSortConfig,
} from './_components/TableControls';
import OverviewSection from './_components/OverviewSection';
import RevenueSection from './_components/RevenueSection';
import {
    BookingDetailDrawer,
    ConfirmActionModal,
    FlightFormModal,
    GlobalSearchModal,
    HotelDetailDrawer,
    HotelFormModal,
    PlaneFormModal,
    ResetUserPasswordModal,
    TourDetailDrawer,
    TourFormModal,
    UserDetailDrawer,
    UserFormModal,
} from './_components/DetailAndCrudModals';
import {
    buildItemLookupMap,
    exportToCsv,
    formatCurrency,
    formatDate,
    formatDurationBetween,
    formatShortDate,
    getBookingPrimaryStatus,
    getDurationMinutes,
    getErrorMessage,
    getItemTypeLabel,
    getNextDepartureDate,
    getPaymentStatusMeta,
    getTourMinPrice,
    getTourTotalSeats,
    matchesSearch,
    sortItems,
    toTimestamp,
} from './_components/utils';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3600';

type BookingSortKey = 'id' | 'customer' | 'items' | 'total_price' | 'method' | 'status' | 'created_at';
type PaymentSortKey = 'transaction_id' | 'booking_id' | 'customer' | 'method' | 'amount' | 'status' | 'payment_date';
type TourSortKey =
    | 'title'
    | 'tour_type'
    | 'route'
    | 'duration'
    | 'min_price'
    | 'departures'
    | 'seats'
    | 'is_trending'
    | 'created_at';
type HotelSortKey = 'name' | 'city' | 'star_rating' | 'price' | 'available_rooms' | 'amenities' | 'is_trending' | 'created_at';
type FlightSortKey =
    | 'airline'
    | 'route'
    | 'departure_time'
    | 'arrival_time'
    | 'duration'
    | 'ticket_price'
    | 'available_seats';
type PlaneSortKey = 'airline' | 'plane_number' | 'total_seats' | 'flights_count';
type UserSortKey = 'full_name' | 'email' | 'auth_provider' | 'bookings_count' | 'reviews_count' | 'role' | 'created_at';
type ReviewSortKey = 'user' | 'item_type' | 'item_name' | 'rating' | 'comment' | 'created_at';

// (Đã thêm)
async function fetchAdminCollection<T>(endpoint: string, token: string): Promise<T[]> {
    const pageLimit = 500;
    const headers = { Authorization: `Bearer ${token}` };
    const res = await fetch(`${API_URL}${endpoint}?page=1&limit=${pageLimit}`, { headers });
    if (!res.ok) return [];
    const json = await res.json();
    const firstItems: T[] =
        json.data?.items ||
        json.data?.tours ||
        json.data?.hotels ||
        json.data?.flights ||
        json.data?.bookings ||
        json.data?.users ||
        (Array.isArray(json.data) ? json.data : []);
    const total = Number(json.data?.total ?? firstItems.length);
    if (total <= firstItems.length || firstItems.length === 0) {
        return firstItems;
    }

    const totalPages = Math.min(4, Math.ceil(total / pageLimit));
    const extraPages = await Promise.all(
        Array.from({ length: totalPages - 1 }, (_, i) =>
            fetch(`${API_URL}${endpoint}?page=${i + 2}&limit=${pageLimit}`, { headers })
                .then((r) => (r.ok ? r.json() : null))
                .catch(() => null)
        )
    );
    const merged = [...firstItems];
    for (const extra of extraPages) {
        const nextItems: T[] = extra?.data?.items || [];
        if (Array.isArray(nextItems)) merged.push(...nextItems);
    }
    return merged;
}

// (Đã thêm)
export default function AdminDashboardPage() {
    const router = useRouter();

    const [activeTab, setActiveTab] = useState<AdminTab>('overview');
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
    const [adminUser, setAdminUser] = useState<{
        id: string;
        name: string;
        email: string;
        role: string;
        avatarUrl?: string | null;
    } | null>(null);
    const [authError, setAuthError] = useState<string | null>(null);

    // Core data states
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [bookings, setBookings] = useState<BookingItem[]>([]);
    const [payments, setPayments] = useState<PaymentRecordItem[]>([]);
    const [tours, setTours] = useState<TourItem[]>([]);
    const [hotels, setHotels] = useState<HotelItem[]>([]);
    const [flights, setFlights] = useState<FlightItem[]>([]);
    const [planes, setPlanes] = useState<PlaneItem[]>([]);
    const [users, setUsers] = useState<UserItem[]>([]);
    const [reviews, setReviews] = useState<ReviewItem[]>([]);

    // Toast stack
    const [toasts, setToasts] = useState<ToastNotice[]>([]);

    // Search, filters, pagination per tab
    const [searchQuery, setSearchQuery] = useState('');
    const [activeChip, setActiveChip] = useState<string>('all');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);

    // Tab-specific extra dropdown filters
    const [bookingMethodFilter, setBookingMethodFilter] = useState('all');
    const [tourTypeFilter, setTourTypeFilter] = useState('all');
    const [hotelCityFilter, setHotelCityFilter] = useState('all');
    const [flightAirlineFilter, setFlightAirlineFilter] = useState('all');
    const [flightsSubTab, setFlightsSubTab] = useState<'flights' | 'planes'>('flights');

    // Per-table SortConfig states
    const [bookingSort, setBookingSort] = useState<SortConfig<BookingSortKey> | null>(null);
    const [paymentSort, setPaymentSort] = useState<SortConfig<PaymentSortKey> | null>(null);
    const [tourSort, setTourSort] = useState<SortConfig<TourSortKey> | null>(null);
    const [hotelSort, setHotelSort] = useState<SortConfig<HotelSortKey> | null>(null);
    const [flightSort, setFlightSort] = useState<SortConfig<FlightSortKey> | null>(null);
    const [planeSort, setPlaneSort] = useState<SortConfig<PlaneSortKey> | null>(null);
    const [userSort, setUserSort] = useState<SortConfig<UserSortKey> | null>(null);
    const [reviewSort, setReviewSort] = useState<SortConfig<ReviewSortKey> | null>(null);

    // Modals & Drawers
    const [isGlobalSearchOpen, setIsGlobalSearchOpen] = useState(false);
    const [detailBooking, setDetailBooking] = useState<BookingItem | null>(null);
    const [detailTour, setDetailTour] = useState<TourItem | null>(null);
    const [detailHotel, setDetailHotel] = useState<HotelItem | null>(null);
    const [detailUser, setDetailUser] = useState<UserItem | null>(null);

    const [tourModalState, setTourModalState] = useState<{ open: boolean; item: TourItem | null }>({ open: false, item: null });
    const [hotelModalState, setHotelModalState] = useState<{ open: boolean; item: HotelItem | null }>({ open: false, item: null });
    const [flightModalState, setFlightModalState] = useState<{ open: boolean; item: FlightItem | null }>({ open: false, item: null });
    const [planeModalState, setPlaneModalState] = useState<{ open: boolean; item: PlaneItem | null }>({ open: false, item: null });
    const [userModalState, setUserModalState] = useState<{ open: boolean; item: UserItem | null }>({ open: false, item: null });
    const [resetPasswordUser, setResetPasswordUser] = useState<UserItem | null>(null);

    const [confirmState, setConfirmState] = useState<{
        open: boolean;
        title: string;
        message: string;
        confirmLabel: string;
        tone: 'danger' | 'warning';
        onConfirm: () => Promise<void>;
    } | null>(null);
    const [isConfirmSubmitting, setIsConfirmSubmitting] = useState(false);

    // (Đã thêm)
    const pushToast = useCallback((type: ToastNotice['type'], message: string) => {
        const id = Date.now() + Math.floor(Math.random() * 1000);
        setToasts((prev) => [...prev.slice(-3), { id, type, message }]);
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 4200);
    }, []);

    // (Đã thêm)
    const verifyAdminSession = useCallback(async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            setAuthError('Vui lòng đăng nhập với tài khoản Quản trị viên (Admin) để truy cập cổng này.');
            setIsLoading(false);
            return null;
        }

        try {
            const res = await fetch(`${API_URL}/api/v1/users/profile`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) {
                setAuthError('Phiên làm việc hết hạn hoặc không hợp lệ.');
                setIsLoading(false);
                return null;
            }
            const data = await res.json();
            const profile = data.user;
            if (profile.role !== 'admin') {
                setAuthError(
                    `Tài khoản "${profile.email}" chỉ có vai trò [${profile.role}]. Cần quyền Quản trị viên (Admin) để quản lý.`
                );
                setIsLoading(false);
                return null;
            }
            setAdminUser({
                id: profile.id,
                name: profile.fullName || profile.full_name || profile.name || 'Admin',
                email: profile.email,
                role: profile.role,
                avatarUrl: profile.avatarUrl || profile.avatar_url || null,
            });
            setAuthError(null);
            return token;
        } catch {
            setAuthError('Không thể kết nối đến máy chủ.');
            setIsLoading(false);
            return null;
        }
    }, []);

    // (Đã thêm)
    const loadAllAdminData = useCallback(async (token: string) => {
        const headers = { Authorization: `Bearer ${token}` };
        const [
            statsJson,
            bookingsList,
            paymentsList,
            toursList,
            hotelsList,
            flightsList,
            planesList,
            usersList,
            reviewsList,
        ] = await Promise.all([
            fetch(`${API_URL}/api/v1/admin/dashboard/stats`, { headers })
                .then((r) => (r.ok ? r.json() : null))
                .catch(() => null),
            fetchAdminCollection<BookingItem>('/api/v1/admin/bookings', token),
            fetchAdminCollection<PaymentRecordItem>('/api/v1/admin/payments', token),
            fetchAdminCollection<TourItem>('/api/v1/admin/tours', token),
            fetchAdminCollection<HotelItem>('/api/v1/admin/hotels', token),
            fetchAdminCollection<FlightItem>('/api/v1/admin/flights', token),
            fetchAdminCollection<PlaneItem>('/api/v1/admin/planes', token),
            fetchAdminCollection<UserItem>('/api/v1/admin/users', token),
            fetchAdminCollection<ReviewItem>('/api/v1/admin/reviews', token),
        ]);

        if (statsJson?.data) setStats(statsJson.data);
        setBookings(bookingsList);
        setPayments(paymentsList);
        setTours(toursList);
        setHotels(hotelsList);
        setFlights(flightsList);
        setPlanes(planesList);
        setUsers(usersList);
        setReviews(reviewsList);
        setLastSyncedAt(new Date());
    }, []);

    // (Đã thêm)
    const handleRefreshData = useCallback(async () => {
        setIsLoading(true);
        const token = await verifyAdminSession();
        if (token) {
            await loadAllAdminData(token);
        }
        setIsLoading(false);
    }, [verifyAdminSession, loadAllAdminData]);

    useEffect(() => {
        let isMounted = true;
        // (Đã thêm)
        const init = async () => {
            const token = await verifyAdminSession();
            if (token && isMounted) {
                await loadAllAdminData(token);
            }
            if (isMounted) setIsLoading(false);
        };
        init();
        return () => {
            isMounted = false;
        };
    }, [verifyAdminSession, loadAllAdminData]);

    // Global Ctrl+K shortcut for omnisearch
    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                setIsGlobalSearchOpen((prev) => !prev);
            }
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, []);

    // (Đã thêm)
    const handleSearchChange = (val: string) => {
        setSearchQuery(val);
        setPage(1);
    };

    // (Đã thêm)
    const handleChipChange = (chip: string) => {
        setActiveChip(chip);
        setPage(1);
    };

    // (Đã thêm)
    const switchTab = (tab: AdminTab, presetChip: string = 'all', presetSearch: string = '') => {
        setActiveTab(tab);
        setActiveChip(presetChip);
        setSearchQuery(presetSearch);
        setBookingMethodFilter('all');
        setTourTypeFilter('all');
        setHotelCityFilter('all');
        setFlightAirlineFilter('all');
        setPage(1);
        setIsMobileSidebarOpen(false);
    };

    // (Đã thêm)
    const resetCurrentTabFilters = () => {
        setSearchQuery('');
        setActiveChip('all');
        setBookingMethodFilter('all');
        setTourTypeFilter('all');
        setHotelCityFilter('all');
        setFlightAirlineFilter('all');
        setPage(1);
        if (activeTab === 'bookings') setBookingSort(null);
        if (activeTab === 'payments') setPaymentSort(null);
        if (activeTab === 'tours') setTourSort(null);
        if (activeTab === 'hotels') setHotelSort(null);
        if (activeTab === 'flights') {
            setFlightSort(null);
            setPlaneSort(null);
        }
        if (activeTab === 'users') setUserSort(null);
        if (activeTab === 'reviews') setReviewSort(null);
    };

    // Lookup map for resolving Tour/Hotel/Flight titles inside Bookings & Reviews
    const itemLookup = useMemo(() => buildItemLookupMap(tours, hotels, flights), [tours, hotels, flights]);

    /* ============================================================================
     * MUTATION HANDLERS
     * ============================================================================ */

    // (Đã thêm)
    const handleToggleTourTrending = async (tourId: string, currentTrending?: boolean | null) => {
        const token = localStorage.getItem('token');
        if (!token) return;
        const nextVal = !currentTrending;
        try {
            const res = await fetch(`${API_URL}/api/v1/admin/tours/${tourId}/trending`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ is_trending: nextVal }),
            });
            if (!res.ok) throw new Error('Không thể cập nhật trạng thái thịnh hành');
            setTours((prev) => prev.map((t) => (t.id === tourId ? { ...t, is_trending: nextVal } : t)));
            pushToast('success', nextVal ? 'Đã đưa Tour vào danh sách Thịnh hành!' : 'Đã gỡ Tour khỏi Thịnh hành.');
        } catch (err: unknown) {
            pushToast('error', getErrorMessage(err, 'Lỗi khi đổi trạng thái trending tour'));
        }
    };

    // (Đã thêm)
    const handleToggleHotelTrending = async (hotelId: string, currentTrending?: boolean | null) => {
        const token = localStorage.getItem('token');
        if (!token) return;
        const nextVal = !currentTrending;
        try {
            const res = await fetch(`${API_URL}/api/v1/admin/hotels/${hotelId}/trending`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ is_trending: nextVal }),
            });
            if (!res.ok) throw new Error('Không thể cập nhật trạng thái thịnh hành');
            setHotels((prev) => prev.map((h) => (h.id === hotelId ? { ...h, is_trending: nextVal } : h)));
            pushToast('success', nextVal ? 'Đã đưa Khách sạn vào Thịnh hành!' : 'Đã gỡ Khách sạn khỏi Thịnh hành.');
        } catch (err: unknown) {
            pushToast('error', getErrorMessage(err, 'Lỗi khi đổi trạng thái trending khách sạn'));
        }
    };

    // (Đã thêm)
    const handleUpdatePaymentStatus = async (
        paymentId: string,
        nextStatus: 'pending' | 'paid' | 'failed' | 'refunded'
    ) => {
        const token = localStorage.getItem('token');
        if (!token) return;
        try {
            const res = await fetch(`${API_URL}/api/v1/admin/payments/${paymentId}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ payment_status: nextStatus }),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.message || 'Không thể cập nhật thanh toán');
            await loadAllAdminData(token);
            pushToast('success', `Đã cập nhật trạng thái giao dịch sang "${getPaymentStatusMeta(nextStatus).label}"!`);
        } catch (err: unknown) {
            pushToast('error', getErrorMessage(err, 'Lỗi cập nhật thanh toán'));
        }
    };

    // (Đã thêm)
    const requestToggleUserRole = (user: UserItem) => {
        const newRole = user.role === 'admin' ? 'user' : 'admin';
        setConfirmState({
            open: true,
            title: 'Thay đổi vai trò tài khoản',
            message: `Bạn có chắc chắn muốn chuyển tài khoản "${user.full_name}" (${user.email}) sang vai trò ${newRole.toUpperCase()}?`,
            confirmLabel: `Chuyển thành ${newRole.toUpperCase()}`,
            tone: 'warning',
            onConfirm: async () => {
                const token = localStorage.getItem('token');
                if (!token) return;
                const res = await fetch(`${API_URL}/api/v1/admin/users/${user.id}/role`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                    body: JSON.stringify({ role: newRole }),
                });
                if (!res.ok) throw new Error('Không thể cập nhật vai trò');
                setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, role: newRole } : u)));
                setDetailUser((prev) => (prev && prev.id === user.id ? { ...prev, role: newRole } : prev));
                pushToast('success', `Đã cập nhật vai trò của ${user.full_name} thành ${newRole.toUpperCase()}.`);
            },
        });
    };

    // (Đã thêm)
    const requestDeleteAction = (opts: {
        title: string;
        message: string;
        endpoint: string;
        successMsg: string;
        afterDelete?: () => void;
    }) => {
        setConfirmState({
            open: true,
            title: opts.title,
            message: opts.message,
            confirmLabel: 'Xác nhận xóa',
            tone: 'danger',
            onConfirm: async () => {
                const token = localStorage.getItem('token');
                if (!token) return;
                const res = await fetch(`${API_URL}${opts.endpoint}`, {
                    method: 'DELETE',
                    headers: { Authorization: `Bearer ${token}` },
                });
                const json = await res.json().catch(() => ({}));
                if (!res.ok) throw new Error(json.message || 'Thao tác xóa thất bại');
                opts.afterDelete?.();
                await loadAllAdminData(token);
                pushToast('success', opts.successMsg);
            },
        });
    };

    // (Đã thêm)
    const handleConfirmExecute = async () => {
        if (!confirmState) return;
        setIsConfirmSubmitting(true);
        try {
            await confirmState.onConfirm();
            setConfirmState(null);
        } catch (err: unknown) {
            pushToast('error', getErrorMessage(err, 'Đã xảy ra lỗi khi thực hiện thao tác'));
        } finally {
            setIsConfirmSubmitting(false);
        }
    };

    // (Đã thêm)
    const handleLogout = () => {
        localStorage.removeItem('token');
        router.push('/login');
    };

    /* ============================================================================
     * DERIVED FILTERED & SORTED DATASETS
     * ============================================================================ */

    // 1. Bookings
    const bookingMethodsList = useMemo(() => {
        const set = new Set<string>();
        bookings.forEach((b) => {
            const m = b.payments?.[0]?.payment_method;
            if (m) set.add(m);
        });
        return Array.from(set);
    }, [bookings]);

    const bookingCounts = useMemo(() => {
        const counts = { all: bookings.length, paid: 0, pending: 0, refund_requested: 0, refunded: 0, failed: 0 };
        for (const b of bookings) {
            const s = getBookingPrimaryStatus(b);
            if (s === 'paid') counts.paid += 1;
            else if (s === 'refund_requested') counts.refund_requested += 1;
            else if (s === 'refunded') counts.refunded += 1;
            else if (s === 'failed' || s === 'cancelled') counts.failed += 1;
            else counts.pending += 1;
        }
        return counts;
    }, [bookings]);

    const processedBookings = useMemo(() => {
        const filtered = bookings.filter((b) => {
            const status = getBookingPrimaryStatus(b);
            const payment = b.payments?.[0];
            if (activeChip !== 'all') {
                if (activeChip === 'failed' && status !== 'failed' && status !== 'cancelled') return false;
                if (activeChip !== 'failed' && status !== activeChip) return false;
            }
            if (bookingMethodFilter !== 'all' && (payment?.payment_method || '') !== bookingMethodFilter) {
                return false;
            }
            const itemNames = (b.booking_items || []).map((it) => {
                const meta = itemLookup.get(`${it.item_type}:${it.item_id}`);
                return `${getItemTypeLabel(it.item_type)} ${meta?.title || ''} ${it.item_id}`;
            });
            return matchesSearch(searchQuery, [
                b.id,
                b.users?.full_name,
                b.users?.email,
                b.users?.phone_number,
                payment?.payment_method,
                payment?.transaction_id,
                getPaymentStatusMeta(status).label,
                ...itemNames,
            ]);
        });

        return sortItems(filtered, bookingSort, {
            id: (b) => b.id,
            customer: (b) => b.users?.full_name || b.users?.email || '',
            items: (b) => b.booking_items?.reduce((s, i) => s + Number(i.quantity || 0), 0) || 0,
            total_price: (b) => Number(b.total_price || 0),
            method: (b) => b.payments?.[0]?.payment_method || '',
            status: (b) => getPaymentStatusMeta(getBookingPrimaryStatus(b)).label,
            created_at: (b) => toTimestamp(b.created_at) ?? 0,
        });
    }, [bookings, activeChip, bookingMethodFilter, searchQuery, itemLookup, bookingSort]);

    // 2. Payments
    const paymentCounts = useMemo(() => {
        const counts = { all: payments.length, paid: 0, pending: 0, refund_requested: 0, refunded: 0, failed: 0 };
        for (const p of payments) {
            const s = (p.payment_status || 'pending').toLowerCase();
            if (s === 'paid') counts.paid += 1;
            else if (s === 'refund_requested') counts.refund_requested += 1;
            else if (s === 'refunded') counts.refunded += 1;
            else if (s === 'failed' || s === 'cancelled') counts.failed += 1;
            else counts.pending += 1;
        }
        return counts;
    }, [payments]);

    const processedPayments = useMemo(() => {
        const filtered = payments.filter((p) => {
            const status = (p.payment_status || 'pending').toLowerCase();
            if (activeChip !== 'all') {
                if (activeChip === 'failed' && status !== 'failed' && status !== 'cancelled') return false;
                if (activeChip !== 'failed' && status !== activeChip) return false;
            }
            return matchesSearch(searchQuery, [
                p.id,
                p.transaction_id,
                p.booking_id,
                p.payment_method,
                p.bookings?.users?.full_name,
                p.bookings?.users?.email,
                getPaymentStatusMeta(status).label,
            ]);
        });

        return sortItems(filtered, paymentSort, {
            transaction_id: (p) => p.transaction_id || p.id,
            booking_id: (p) => p.booking_id || '',
            customer: (p) => p.bookings?.users?.full_name || p.bookings?.users?.email || '',
            method: (p) => p.payment_method || '',
            amount: (p) => Number(p.amount || 0),
            status: (p) => getPaymentStatusMeta(p.payment_status).label,
            payment_date: (p) => toTimestamp(p.payment_date) ?? 0,
        });
    }, [payments, activeChip, searchQuery, paymentSort]);

    // 3. Tours
    const tourTypesList = useMemo(() => {
        const set = new Set<string>();
        tours.forEach((t) => {
            if (t.tour_type) set.add(t.tour_type);
        });
        return Array.from(set);
    }, [tours]);

    const tourCounts = useMemo(() => {
        return {
            all: tours.length,
            trending: tours.filter((t) => Boolean(t.is_trending)).length,
            low_seats: tours.filter((t) => (t.tour_departures?.length || 0) > 0 && getTourTotalSeats(t) <= 5).length,
            no_schedule: tours.filter((t) => (t.tour_departures?.length || 0) === 0).length,
        };
    }, [tours]);

    const processedTours = useMemo(() => {
        const filtered = tours.filter((t) => {
            const totalSeats = getTourTotalSeats(t);
            const depCount = t.tour_departures?.length || 0;
            if (activeChip === 'trending' && !t.is_trending) return false;
            if (activeChip === 'low_seats' && !(depCount > 0 && totalSeats <= 5)) return false;
            if (activeChip === 'no_schedule' && depCount !== 0) return false;
            if (tourTypeFilter !== 'all' && t.tour_type !== tourTypeFilter) return false;

            return matchesSearch(searchQuery, [
                t.id,
                t.title,
                t.destination,
                t.departure_location,
                t.destinations,
                t.tour_type,
                t.vehicle,
                t.duration,
                t.ideal_time,
                t.food_include,
            ]);
        });

        return sortItems(filtered, tourSort, {
            title: (t) => t.title,
            tour_type: (t) => t.tour_type,
            route: (t) => `${t.departure_location || ''} ${t.destination || ''}`,
            duration: (t) => t.duration || '',
            min_price: (t) => getTourMinPrice(t),
            departures: (t) => t.tour_departures?.length || 0,
            seats: (t) => getTourTotalSeats(t),
            is_trending: (t) => Boolean(t.is_trending),
            created_at: (t) => toTimestamp(t.created_at) ?? 0,
        });
    }, [tours, activeChip, tourTypeFilter, searchQuery, tourSort]);

    // 4. Hotels
    const hotelCitiesList = useMemo(() => {
        const set = new Set<string>();
        hotels.forEach((h) => {
            if (h.city) set.add(h.city);
        });
        return Array.from(set).sort((a, b) => a.localeCompare(b, 'vi'));
    }, [hotels]);

    const hotelCounts = useMemo(() => {
        return {
            all: hotels.length,
            trending: hotels.filter((h) => Boolean(h.is_trending)).length,
            five_star: hotels.filter((h) => Number(h.star_rating || 0) === 5).length,
            discounted: hotels.filter((h) => Boolean(h.discount_price && Number(h.discount_price) < Number(h.price_per_night))).length,
            low_rooms: hotels.filter((h) => Number(h.available_rooms || 0) <= 3).length,
        };
    }, [hotels]);

    const processedHotels = useMemo(() => {
        const filtered = hotels.filter((h) => {
            if (activeChip === 'trending' && !h.is_trending) return false;
            if (activeChip === 'five_star' && Number(h.star_rating || 0) !== 5) return false;
            if (
                activeChip === 'discounted' &&
                !(h.discount_price && Number(h.discount_price) < Number(h.price_per_night))
            ) {
                return false;
            }
            if (activeChip === 'low_rooms' && Number(h.available_rooms || 0) > 3) return false;
            if (hotelCityFilter !== 'all' && h.city !== hotelCityFilter) return false;

            return matchesSearch(searchQuery, [
                h.id,
                h.name,
                h.city,
                h.address,
                h.amenities,
                h.description,
                h.star_rating ? `${h.star_rating} sao` : '',
            ]);
        });

        return sortItems(filtered, hotelSort, {
            name: (h) => h.name,
            city: (h) => h.city,
            star_rating: (h) => Number(h.star_rating || 0),
            price: (h) => Number(h.discount_price ?? h.price_per_night ?? 0),
            available_rooms: (h) => Number(h.available_rooms || 0),
            amenities: (h) => h.amenities?.length || 0,
            is_trending: (h) => Boolean(h.is_trending),
            created_at: (h) => toTimestamp(h.created_at) ?? 0,
        });
    }, [hotels, activeChip, hotelCityFilter, searchQuery, hotelSort]);

    // 5. Flights & Planes
    const airlinesList = useMemo(() => {
        const set = new Set<string>();
        flights.forEach((f) => {
            if (f.planes?.airline) set.add(f.planes.airline);
        });
        return Array.from(set).sort((a, b) => a.localeCompare(b, 'vi'));
    }, [flights]);

    const flightCounts = useMemo(() => {
        return {
            all: flights.length,
            low_seats: flights.filter((f) => Number(f.available_seats || 0) <= 10).length,
            plenty_seats: flights.filter((f) => Number(f.available_seats || 0) > 30).length,
        };
    }, [flights]);

    const processedFlights = useMemo(() => {
        const filtered = flights.filter((f) => {
            if (activeChip === 'low_seats' && Number(f.available_seats || 0) > 10) return false;
            if (activeChip === 'plenty_seats' && Number(f.available_seats || 0) <= 30) return false;
            if (flightAirlineFilter !== 'all' && (f.planes?.airline || '') !== flightAirlineFilter) return false;

            return matchesSearch(searchQuery, [
                f.id,
                f.departure_airport,
                f.arrival_airport,
                f.planes?.airline,
                f.planes?.plane_number,
            ]);
        });

        return sortItems(filtered, flightSort, {
            airline: (f) => `${f.planes?.airline || ''} ${f.planes?.plane_number || ''}`,
            route: (f) => `${f.departure_airport} ${f.arrival_airport}`,
            departure_time: (f) => toTimestamp(f.departure_time) ?? 0,
            arrival_time: (f) => toTimestamp(f.arrival_time) ?? 0,
            duration: (f) => getDurationMinutes(f.departure_time, f.arrival_time),
            ticket_price: (f) => Number(f.ticket_price || 0),
            available_seats: (f) => Number(f.available_seats || 0),
        });
    }, [flights, activeChip, flightAirlineFilter, searchQuery, flightSort]);

    const processedPlanes = useMemo(() => {
        const filtered = planes.filter((p) =>
            matchesSearch(searchQuery, [p.id, p.airline, p.plane_number, p.total_seats])
        );
        return sortItems(filtered, planeSort, {
            airline: (p) => p.airline,
            plane_number: (p) => p.plane_number,
            total_seats: (p) => Number(p.total_seats || 0),
            flights_count: (p) => Number(p._count?.flights || 0),
        });
    }, [planes, searchQuery, planeSort]);

    // 6. Users
    const userCounts = useMemo(() => {
        return {
            all: users.length,
            admin: users.filter((u) => u.role === 'admin').length,
            user: users.filter((u) => u.role !== 'admin').length,
            google: users.filter((u) => u.auth_provider === 'google').length,
            has_bookings: users.filter((u) => Number(u._count?.bookings || 0) > 0).length,
        };
    }, [users]);

    const processedUsers = useMemo(() => {
        const filtered = users.filter((u) => {
            if (activeChip === 'admin' && u.role !== 'admin') return false;
            if (activeChip === 'user' && u.role === 'admin') return false;
            if (activeChip === 'google' && u.auth_provider !== 'google') return false;
            if (activeChip === 'has_bookings' && Number(u._count?.bookings || 0) <= 0) return false;

            return matchesSearch(searchQuery, [
                u.id,
                u.full_name,
                u.email,
                u.phone_number,
                u.role,
                u.auth_provider,
            ]);
        });

        return sortItems(filtered, userSort, {
            full_name: (u) => u.full_name || '',
            email: (u) => u.email || '',
            auth_provider: (u) => u.auth_provider || 'local',
            bookings_count: (u) => Number(u._count?.bookings || 0),
            reviews_count: (u) => Number(u._count?.reviews || 0),
            role: (u) => u.role || 'user',
            created_at: (u) => toTimestamp(u.created_at) ?? 0,
        });
    }, [users, activeChip, searchQuery, userSort]);

    // 7. Reviews
    const reviewCounts = useMemo(() => {
        return {
            all: reviews.length,
            five: reviews.filter((r) => Number(r.rating) === 5).length,
            low: reviews.filter((r) => Number(r.rating) <= 3).length,
            tour: reviews.filter((r) => r.item_type === 'tour').length,
            hotel: reviews.filter((r) => r.item_type === 'hotel').length,
            flight: reviews.filter((r) => r.item_type === 'flight').length,
        };
    }, [reviews]);

    const processedReviews = useMemo(() => {
        const filtered = reviews.filter((r) => {
            if (activeChip === 'five' && Number(r.rating) !== 5) return false;
            if (activeChip === 'low' && Number(r.rating) > 3) return false;
            if (activeChip === 'tour' && r.item_type !== 'tour') return false;
            if (activeChip === 'hotel' && r.item_type !== 'hotel') return false;
            if (activeChip === 'flight' && r.item_type !== 'flight') return false;

            const meta = itemLookup.get(`${r.item_type}:${r.item_id}`);
            return matchesSearch(searchQuery, [
                r.users?.full_name,
                r.users?.email,
                r.comment,
                r.item_id,
                getItemTypeLabel(r.item_type),
                meta?.title,
            ]);
        });

        return sortItems(filtered, reviewSort, {
            user: (r) => r.users?.full_name || r.users?.email || '',
            item_type: (r) => getItemTypeLabel(r.item_type),
            item_name: (r) => itemLookup.get(`${r.item_type}:${r.item_id}`)?.title || r.item_id,
            rating: (r) => Number(r.rating || 0),
            comment: (r) => r.comment || '',
            created_at: (r) => toTimestamp(r.created_at) ?? 0,
        });
    }, [reviews, activeChip, searchQuery, itemLookup, reviewSort]);

    // (Đã thêm)
    const paginate = <T,>(items: T[]): T[] => {
        if (pageSize <= 0) return items;
        const start = (page - 1) * pageSize;
        return items.slice(start, start + pageSize);
    };

    /* ============================================================================
     * AUTH BLOCKED SCREEN
     * ============================================================================ */

    if (authError && !isLoading) {
        return (
            <div className="min-h-screen bg-[#F7F5F0] flex items-center justify-center p-6">
                <div className="max-w-md w-full bg-white border border-gray-200 rounded-3xl p-8 shadow-xl text-center">
                    <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-5">
                        <ShieldAlert className="w-8 h-8" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-rose-600 block mb-2">
                        Yêu Cầu Quyền Quản Trị Viên
                    </span>
                    <h1 className="text-2xl font-black uppercase tracking-tight text-gray-900 mb-3">
                        Truy Cập Bị Giới Hạn
                    </h1>
                    <p className="text-xs text-gray-600 leading-relaxed mb-6">{authError}</p>
                    <div className="flex flex-col gap-2.5">
                        <Link
                            href="/login"
                            className="w-full bg-gray-900 text-[#FACC15] py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-black transition-colors"
                        >
                            Đăng Nhập Tài Khoản Admin
                        </Link>
                        <Link
                            href="/"
                            className="w-full border border-gray-200 text-gray-700 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-gray-50 transition-colors"
                        >
                            Về Trang Chủ Natura Travel
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    const navItems: Array<{ id: AdminTab; label: string; icon: React.ComponentType<{ className?: string }>; badge?: number }> = [
        { id: 'overview', label: 'Tổng Quan & KPI', icon: LayoutDashboard },
        { id: 'bookings', label: 'Đơn Đặt Chỗ', icon: CalendarCheck, badge: bookings.length || stats?.totalBookings },
        { id: 'payments', label: 'Thanh Toán', icon: CreditCard, badge: payments.length },
        { id: 'tours', label: 'Tour Du Lịch', icon: Compass, badge: tours.length || stats?.totalTours },
        { id: 'hotels', label: 'Khách Sạn & Resort', icon: Building2, badge: hotels.length || stats?.totalHotels },
        { id: 'flights', label: 'Chuyến Bay & Tàu Bay', icon: Plane, badge: flights.length || stats?.totalFlights },
        { id: 'users', label: 'Thành Viên', icon: Users, badge: users.length || stats?.totalUsers },
        { id: 'reviews', label: 'Đánh Giá', icon: MessageSquare, badge: reviews.length },
        { id: 'revenue', label: 'Báo Cáo Doanh Thu', icon: TrendingUp },
    ];

    const headerMeta: Record<AdminTab, { title: string; subtitle: string }> = {
        overview: { title: 'Tổng Quan & Chỉ Số KPI', subtitle: 'Giám sát hoạt động toàn hệ thống theo thời gian thực' },
        bookings: { title: 'Quản Lý Đơn Đặt Chỗ', subtitle: 'Tra cứu chi tiết dịch vụ, khách hàng và trạng thái thanh toán' },
        payments: { title: 'Đối Soát Giao Dịch Thanh Toán', subtitle: 'Quản lý mã giao dịch, phương thức & xử lý hoàn tiền' },
        tours: { title: 'Quản Lý Tour Du Lịch', subtitle: 'Cập nhật lịch trình, đợt khởi hành, hình ảnh & xu hướng' },
        hotels: { title: 'Quản Lý Khách Sạn & Resort', subtitle: 'Kiểm soát phòng trống, giá ưu đãi, tiện ích & thư viện ảnh' },
        flights: { title: 'Quản Lý Chuyến Bay & Đội Bay', subtitle: 'Điều phối lịch bay nội địa, ghế trống & tàu bay' },
        users: { title: 'Quản Lý Thành Viên & Phân Quyền', subtitle: 'Hồ sơ người dùng, lịch sử giao dịch & vai trò Admin' },
        reviews: { title: 'Kiểm Duyệt Đánh Giá', subtitle: 'Theo dõi phản hồi sao & bình luận dịch vụ từ khách hàng' },
        revenue: { title: 'Báo Cáo Phân Tích Doanh Thu', subtitle: 'Biểu đồ tăng trưởng, tỷ trọng dịch vụ & top bán chạy' },
    };

    const sidebarContent = (
        <div className="flex flex-col h-full justify-between">
            <div>
                <div className="px-5 py-5 border-b border-white/10 flex items-center justify-between">
                    <Link href="/" className="flex flex-col">
                        <span className="text-lg font-black uppercase tracking-tight text-white">
                            NATURA TRAVEL
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-[#FACC15]">
                            Admin Command Center
                        </span>
                    </Link>
                    <button
                        type="button"
                        onClick={() => setIsMobileSidebarOpen(false)}
                        className="md:hidden p-1.5 text-gray-400 hover:text-white cursor-pointer"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <nav className="p-3 space-y-1">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const active = activeTab === item.id;
                        return (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => switchTab(item.id)}
                                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                    active
                                        ? 'bg-[#FACC15] text-black shadow-sm'
                                        : 'text-gray-300 hover:text-white hover:bg-white/10'
                                }`}
                            >
                                <Icon className="w-4 h-4 shrink-0" />
                                <span className="truncate">{item.label}</span>
                                {item.badge !== undefined && (
                                    <span
                                        className={`ml-auto text-[10px] font-black px-2 py-0.5 rounded-full tabular-nums ${
                                            active ? 'bg-black/15 text-black' : 'bg-white/10 text-gray-300'
                                        }`}
                                    >
                                        {item.badge}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </nav>
            </div>

            <div className="p-4 border-t border-white/10 bg-black/40 space-y-3">
                <div className="flex items-center gap-2.5">
                    <AvatarBadge name={adminUser?.name} avatarUrl={adminUser?.avatarUrl} size="sm" />
                    <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-white truncate">{adminUser?.name || 'Admin'}</p>
                        <p className="text-[10px] text-gray-400 truncate">{adminUser?.email}</p>
                    </div>
                    <span className="bg-[#FACC15] text-black text-[9px] font-black uppercase px-2 py-0.5 rounded-full">
                        ADMIN
                    </span>
                </div>

                <div className="flex gap-2">
                    <Link
                        href="/"
                        className="flex-1 py-2 rounded-xl text-center text-[11px] font-bold border border-white/15 text-gray-200 hover:text-white hover:border-white/40 transition-colors"
                    >
                        Về Website
                    </Link>
                    <button
                        type="button"
                        onClick={handleLogout}
                        className="px-3 py-2 rounded-xl border border-white/15 text-rose-400 hover:text-rose-300 hover:border-rose-400/50 transition-colors cursor-pointer"
                        title="Đăng xuất"
                    >
                        <LogOut className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#F7F5F0] text-gray-900 flex font-sans">
            {/* Desktop Sidebar */}
            <aside className="hidden md:flex md:w-64 bg-[#0B0F17] text-white shrink-0 flex-col sticky top-0 h-screen">
                {sidebarContent}
            </aside>

            {/* Mobile Sidebar Drawer */}
            {isMobileSidebarOpen && (
                <div
                    className="fixed inset-0 z-50 md:hidden bg-black/60 backdrop-blur-xs flex"
                    onClick={() => setIsMobileSidebarOpen(false)}
                >
                    <aside
                        className="w-72 h-full bg-[#0B0F17] text-white shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {sidebarContent}
                    </aside>
                </div>
            )}

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0">
                {/* Sticky Top Header */}
                <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-gray-200/80 px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                        <button
                            type="button"
                            onClick={() => setIsMobileSidebarOpen(true)}
                            className="md:hidden p-2 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-100 cursor-pointer"
                            aria-label="Mở menu quản trị"
                        >
                            <Menu className="w-5 h-5" />
                        </button>
                        <div className="min-w-0">
                            <h1 className="text-lg sm:text-xl font-black tracking-tight text-gray-900 truncate">
                                {headerMeta[activeTab].title}
                            </h1>
                            <p className="text-[11px] text-gray-500 truncate">
                                {headerMeta[activeTab].subtitle}
                                {lastSyncedAt && (
                                    <span className="hidden lg:inline text-gray-400">
                                        {' '}
                                        · Cập nhật lúc{' '}
                                        {lastSyncedAt.toLocaleTimeString('vi-VN', {
                                            hour: '2-digit',
                                            minute: '2-digit',
                                            second: '2-digit',
                                        })}
                                    </span>
                                )}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                        {/* Global Quick Search Button */}
                        <button
                            type="button"
                            onClick={() => setIsGlobalSearchOpen(true)}
                            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 bg-stone-50/80 hover:bg-white hover:border-gray-400 text-xs text-gray-500 transition-all cursor-pointer"
                            title="Tìm nhanh toàn bộ dữ liệu (Ctrl + K)"
                        >
                            <Search className="w-3.5 h-3.5 text-gray-500" />
                            <span className="hidden sm:inline font-medium">Tìm toàn hệ thống...</span>
                            <kbd className="hidden md:inline px-1.5 py-0.5 text-[10px] font-mono font-bold bg-white border border-gray-200 rounded text-gray-500">
                                Ctrl K
                            </kbd>
                        </button>

                        <button
                            type="button"
                            onClick={handleRefreshData}
                            disabled={isLoading}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 bg-white hover:bg-stone-50 text-xs font-bold text-gray-700 cursor-pointer disabled:opacity-50"
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                            <span className="hidden sm:inline">Làm mới</span>
                        </button>

                        <Link
                            href="/"
                            target="_blank"
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gray-900 hover:bg-black text-[#FACC15] text-xs font-bold transition-colors"
                        >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Xem Trang Khách</span>
                        </Link>
                    </div>
                </header>

                {/* Page Body */}
                <div className="p-4 sm:p-6 space-y-6">
                    {isLoading && bookings.length === 0 && tours.length === 0 ? (
                        <div className="bg-white border border-gray-200 rounded-2xl p-14 text-center space-y-3">
                            <RefreshCw className="w-7 h-7 animate-spin text-amber-500 mx-auto" />
                            <p className="text-sm font-bold text-gray-700">Đang tải dữ liệu quản trị...</p>
                        </div>
                    ) : (
                        <>
                            {/* TAB 1: OVERVIEW */}
                            {activeTab === 'overview' && (
                                <OverviewSection
                                    stats={stats}
                                    bookings={bookings}
                                    payments={payments}
                                    tours={tours}
                                    hotels={hotels}
                                    flights={flights}
                                    planes={planes}
                                    users={users}
                                    reviews={reviews}
                                    itemLookup={itemLookup}
                                    onNavigateTab={(tab, chip) => switchTab(tab, chip || 'all')}
                                    onOpenBookingDetail={(b) => setDetailBooking(b)}
                                    onOpenUserDetail={(u) => setDetailUser(u)}
                                />
                            )}

                            {/* TAB 2: BOOKINGS */}
                            {activeTab === 'bookings' && (
                                <section className="bg-white border border-gray-200/80 rounded-2xl shadow-xs p-5 space-y-4">
                                    <SearchFilterToolbar
                                        searchQuery={searchQuery}
                                        onSearchChange={handleSearchChange}
                                        placeholder="Tìm không dấu/có dấu: mã đơn, tên khách, email, SĐT, tên tour/khách sạn, mã GD..."
                                        totalCount={bookings.length}
                                        filteredCount={processedBookings.length}
                                        activeChip={activeChip}
                                        onChipChange={handleChipChange}
                                        quickChips={[
                                            { id: 'all', label: 'Tất cả', count: bookingCounts.all },
                                            { id: 'paid', label: 'Đã thanh toán', count: bookingCounts.paid, tone: 'emerald' },
                                            { id: 'pending', label: 'Chờ xử lý', count: bookingCounts.pending, tone: 'amber' },
                                            {
                                                id: 'refund_requested',
                                                label: 'Yêu cầu hoàn tiền',
                                                count: bookingCounts.refund_requested,
                                                tone: 'violet',
                                            },
                                            { id: 'refunded', label: 'Đã hoàn tiền', count: bookingCounts.refunded, tone: 'sky' },
                                            { id: 'failed', label: 'Thất bại / Hủy', count: bookingCounts.failed, tone: 'rose' },
                                        ]}
                                        sortConfig={bookingSort}
                                        onClearSort={() => setBookingSort(null)}
                                        onSelectSort={setBookingSort}
                                        sortOptions={[
                                            { key: 'created_at', label: 'Ngày đặt' },
                                            { key: 'total_price', label: 'Tổng thanh toán' },
                                            { key: 'customer', label: 'Khách hàng' },
                                            { key: 'status', label: 'Trạng thái' },
                                            { key: 'items', label: 'Số dịch vụ' },
                                            { key: 'method', label: 'Phương thức' },
                                            { key: 'id', label: 'Mã đơn' },
                                        ]}
                                        extraFilters={
                                            <select
                                                aria-label="Lọc phương thức thanh toán"
                                                value={bookingMethodFilter}
                                                onChange={(e) => {
                                                    setBookingMethodFilter(e.target.value);
                                                    setPage(1);
                                                }}
                                                className="px-3 py-2 rounded-xl border border-gray-200 bg-stone-50 text-xs font-semibold text-gray-700 focus:outline-none focus:border-gray-900 cursor-pointer"
                                            >
                                                <option value="all">Tất cả phương thức</option>
                                                {bookingMethodsList.map((m) => (
                                                    <option key={m} value={m}>
                                                        {m.toUpperCase()}
                                                    </option>
                                                ))}
                                            </select>
                                        }
                                        hasActiveExtraFilters={bookingMethodFilter !== 'all'}
                                        onResetAll={resetCurrentTabFilters}
                                        onExportCsv={() =>
                                            exportToCsv(
                                                'danh-sach-don-dat-cho.csv',
                                                ['Mã đơn', 'Khách hàng', 'Email', 'SĐT', 'Dịch vụ', 'Tổng tiền', 'Phương thức', 'Trạng thái', 'Ngày tạo'],
                                                processedBookings.map((b) => [
                                                    b.id,
                                                    b.users?.full_name || 'N/A',
                                                    b.users?.email || '',
                                                    b.users?.phone_number || '',
                                                    (b.booking_items || [])
                                                        .map((it) => `${getItemTypeLabel(it.item_type)} x${it.quantity}`)
                                                        .join('; '),
                                                    Number(b.total_price || 0),
                                                    b.payments?.[0]?.payment_method || '',
                                                    getPaymentStatusMeta(getBookingPrimaryStatus(b)).label,
                                                    formatDate(b.created_at),
                                                ])
                                            )
                                        }
                                    />

                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-xs">
                                            <thead className="bg-stone-50/90 border-y border-gray-200">
                                                <tr>
                                                    <SortableTh
                                                        label="Mã đơn"
                                                        sortKey="id"
                                                        sortConfig={bookingSort}
                                                        onSort={(k) => setBookingSort((p) => cycleSortConfig(p, k))}
                                                    />
                                                    <SortableTh
                                                        label="Khách hàng"
                                                        sortKey="customer"
                                                        sortConfig={bookingSort}
                                                        onSort={(k) => setBookingSort((p) => cycleSortConfig(p, k))}
                                                    />
                                                    <SortableTh
                                                        label="Dịch vụ đã đặt"
                                                        sortKey="items"
                                                        sortConfig={bookingSort}
                                                        onSort={(k) => setBookingSort((p) => cycleSortConfig(p, k))}
                                                    />
                                                    <SortableTh
                                                        label="Tổng tiền"
                                                        sortKey="total_price"
                                                        sortConfig={bookingSort}
                                                        onSort={(k) => setBookingSort((p) => cycleSortConfig(p, k))}
                                                        align="right"
                                                    />
                                                    <SortableTh
                                                        label="Phương thức"
                                                        sortKey="method"
                                                        sortConfig={bookingSort}
                                                        onSort={(k) => setBookingSort((p) => cycleSortConfig(p, k))}
                                                    />
                                                    <SortableTh
                                                        label="Trạng thái"
                                                        sortKey="status"
                                                        sortConfig={bookingSort}
                                                        onSort={(k) => setBookingSort((p) => cycleSortConfig(p, k))}
                                                    />
                                                    <SortableTh
                                                        label="Ngày tạo"
                                                        sortKey="created_at"
                                                        sortConfig={bookingSort}
                                                        onSort={(k) => setBookingSort((p) => cycleSortConfig(p, k))}
                                                        align="right"
                                                    />
                                                    <th className="px-3.5 py-3 text-right text-[11px] font-bold uppercase tracking-wider text-gray-500">
                                                        Thao tác
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {processedBookings.length > 0 ? (
                                                    paginate(processedBookings).map((b) => {
                                                        const status = getBookingPrimaryStatus(b);
                                                        const payment = b.payments?.[0];
                                                        const firstItem = b.booking_items?.[0];
                                                        const firstMeta = firstItem
                                                            ? itemLookup.get(`${firstItem.item_type}:${firstItem.item_id}`)
                                                            : undefined;
                                                        const totalQty =
                                                            b.booking_items?.reduce((s, i) => s + Number(i.quantity || 0), 0) || 0;

                                                        return (
                                                            <tr key={b.id} className="hover:bg-amber-50/35 transition-colors">
                                                                <td className="px-3.5 py-3 whitespace-nowrap">
                                                                    <CopyIdButton value={b.id} displayLength={8} />
                                                                </td>
                                                                <td className="px-3.5 py-3">
                                                                    <p className="font-bold text-gray-900">
                                                                        {b.users?.full_name || 'Khách vãng lai'}
                                                                    </p>
                                                                    <p className="text-[11px] text-gray-500">
                                                                        {b.users?.email || 'Không có email'}
                                                                        {b.users?.phone_number ? ` · ${b.users.phone_number}` : ''}
                                                                    </p>
                                                                </td>
                                                                <td className="px-3.5 py-3 max-w-[240px]">
                                                                    {firstItem ? (
                                                                        <div>
                                                                            <p className="font-semibold text-gray-900 truncate">
                                                                                {firstMeta?.title || getItemTypeLabel(firstItem.item_type)}
                                                                            </p>
                                                                            <p className="text-[11px] text-gray-500">
                                                                                {getItemTypeLabel(firstItem.item_type)} · Tổng {totalQty} suất
                                                                                {(b.booking_items?.length || 0) > 1
                                                                                    ? ` (+${(b.booking_items?.length || 0) - 1} mục khác)`
                                                                                    : ''}
                                                                            </p>
                                                                        </div>
                                                                    ) : (
                                                                        <span className="text-gray-400 italic">Không có chi tiết</span>
                                                                    )}
                                                                </td>
                                                                <td className="px-3.5 py-3 text-right font-black text-gray-900 tabular-nums whitespace-nowrap">
                                                                    {formatCurrency(b.total_price)}
                                                                </td>
                                                                <td className="px-3.5 py-3 whitespace-nowrap">
                                                                    <span className="px-2 py-0.5 rounded bg-stone-100 text-gray-700 text-[10px] font-bold uppercase">
                                                                        {payment?.payment_method || 'Chưa chọn'}
                                                                    </span>
                                                                </td>
                                                                <td className="px-3.5 py-3">
                                                                    <PaymentStatusBadge status={status} />
                                                                </td>
                                                                <td className="px-3.5 py-3 text-right text-[11px] text-gray-500 tabular-nums whitespace-nowrap">
                                                                    {formatDate(b.created_at)}
                                                                </td>
                                                                <td className="px-3.5 py-3 text-right whitespace-nowrap">
                                                                    <div className="inline-flex items-center gap-1">
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => setDetailBooking(b)}
                                                                            className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-gray-900 hover:text-[#FACC15] text-gray-800 text-[11px] font-bold transition-colors cursor-pointer inline-flex items-center gap-1"
                                                                        >
                                                                            <Eye className="w-3 h-3" />
                                                                            <span>Chi tiết</span>
                                                                        </button>
                                                                        <Link
                                                                            href={`/bookings/${b.id}`}
                                                                            target="_blank"
                                                                            className="p-1.5 rounded-lg text-gray-500 hover:text-black hover:bg-gray-100"
                                                                            title="Mở vé điện tử"
                                                                        >
                                                                            <ExternalLink className="w-3.5 h-3.5" />
                                                                        </Link>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() =>
                                                                                requestDeleteAction({
                                                                                    title: 'Xóa đơn đặt chỗ',
                                                                                    message: `Bạn có chắc muốn xóa vĩnh viễn đơn #${b.id.slice(0, 8)} của khách "${b.users?.full_name || 'N/A'}"?`,
                                                                                    endpoint: `/api/v1/admin/bookings/${b.id}`,
                                                                                    successMsg: 'Đã xóa đơn đặt chỗ.',
                                                                                })
                                                                            }
                                                                            className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 cursor-pointer"
                                                                            title="Xóa đơn"
                                                                        >
                                                                            <Trash2 className="w-3.5 h-3.5" />
                                                                        </button>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })
                                                ) : (
                                                    <EmptyTableRow
                                                        colSpan={8}
                                                        message="Không tìm thấy đơn đặt chỗ nào khớp với từ khóa hoặc bộ lọc."
                                                        onReset={resetCurrentTabFilters}
                                                    />
                                                )}
                                            </tbody>
                                        </table>
                                    </div>

                                    <PaginationBar
                                        currentPage={page}
                                        pageSize={pageSize}
                                        totalItems={processedBookings.length}
                                        onPageChange={setPage}
                                        onPageSizeChange={setPageSize}
                                    />
                                </section>
                            )}

                            {/* TAB 3: PAYMENTS */}
                            {activeTab === 'payments' && (
                                <section className="bg-white border border-gray-200/80 rounded-2xl shadow-xs p-5 space-y-4">
                                    <SearchFilterToolbar
                                        searchQuery={searchQuery}
                                        onSearchChange={handleSearchChange}
                                        placeholder="Tìm mã giao dịch (TXN...), mã đơn, tên khách, email, phương thức thanh toán..."
                                        totalCount={payments.length}
                                        filteredCount={processedPayments.length}
                                        activeChip={activeChip}
                                        onChipChange={handleChipChange}
                                        quickChips={[
                                            { id: 'all', label: 'Tất cả', count: paymentCounts.all },
                                            { id: 'paid', label: 'Đã trả', count: paymentCounts.paid, tone: 'emerald' },
                                            { id: 'pending', label: 'Chờ xử lý', count: paymentCounts.pending, tone: 'amber' },
                                            {
                                                id: 'refund_requested',
                                                label: 'Yêu cầu hoàn',
                                                count: paymentCounts.refund_requested,
                                                tone: 'violet',
                                            },
                                            { id: 'refunded', label: 'Đã hoàn', count: paymentCounts.refunded, tone: 'sky' },
                                            { id: 'failed', label: 'Thất bại', count: paymentCounts.failed, tone: 'rose' },
                                        ]}
                                        sortConfig={paymentSort}
                                        onClearSort={() => setPaymentSort(null)}
                                        onSelectSort={setPaymentSort}
                                        sortOptions={[
                                            { key: 'payment_date', label: 'Ngày thanh toán' },
                                            { key: 'amount', label: 'Số tiền' },
                                            { key: 'status', label: 'Trạng thái' },
                                            { key: 'method', label: 'Phương thức' },
                                            { key: 'customer', label: 'Khách hàng' },
                                            { key: 'transaction_id', label: 'Mã giao dịch' },
                                            { key: 'booking_id', label: 'Mã đơn' },
                                        ]}
                                        onResetAll={resetCurrentTabFilters}
                                        onExportCsv={() =>
                                            exportToCsv(
                                                'danh-sach-giao-dich.csv',
                                                ['Mã GD', 'Mã đơn', 'Khách hàng', 'Phương thức', 'Số tiền', 'Trạng thái', 'Ngày TT'],
                                                processedPayments.map((p) => [
                                                    p.transaction_id || p.id,
                                                    p.booking_id || '',
                                                    p.bookings?.users?.full_name || p.bookings?.users?.email || '',
                                                    p.payment_method,
                                                    Number(p.amount || 0),
                                                    getPaymentStatusMeta(p.payment_status).label,
                                                    formatDate(p.payment_date),
                                                ])
                                            )
                                        }
                                    />

                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-xs">
                                            <thead className="bg-stone-50/90 border-y border-gray-200">
                                                <tr>
                                                    <SortableTh
                                                        label="Mã giao dịch"
                                                        sortKey="transaction_id"
                                                        sortConfig={paymentSort}
                                                        onSort={(k) => setPaymentSort((p) => cycleSortConfig(p, k))}
                                                    />
                                                    <SortableTh
                                                        label="Mã đơn"
                                                        sortKey="booking_id"
                                                        sortConfig={paymentSort}
                                                        onSort={(k) => setPaymentSort((p) => cycleSortConfig(p, k))}
                                                    />
                                                    <SortableTh
                                                        label="Khách hàng"
                                                        sortKey="customer"
                                                        sortConfig={paymentSort}
                                                        onSort={(k) => setPaymentSort((p) => cycleSortConfig(p, k))}
                                                    />
                                                    <SortableTh
                                                        label="Phương thức"
                                                        sortKey="method"
                                                        sortConfig={paymentSort}
                                                        onSort={(k) => setPaymentSort((p) => cycleSortConfig(p, k))}
                                                    />
                                                    <SortableTh
                                                        label="Số tiền"
                                                        sortKey="amount"
                                                        sortConfig={paymentSort}
                                                        onSort={(k) => setPaymentSort((p) => cycleSortConfig(p, k))}
                                                        align="right"
                                                    />
                                                    <SortableTh
                                                        label="Trạng thái"
                                                        sortKey="status"
                                                        sortConfig={paymentSort}
                                                        onSort={(k) => setPaymentSort((p) => cycleSortConfig(p, k))}
                                                    />
                                                    <SortableTh
                                                        label="Ngày thanh toán"
                                                        sortKey="payment_date"
                                                        sortConfig={paymentSort}
                                                        onSort={(k) => setPaymentSort((p) => cycleSortConfig(p, k))}
                                                        align="right"
                                                    />
                                                    <th className="px-3.5 py-3 text-right text-[11px] font-bold uppercase tracking-wider text-gray-500">
                                                        Điều chỉnh trạng thái
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {processedPayments.length > 0 ? (
                                                    paginate(processedPayments).map((p) => (
                                                        <tr key={p.id} className="hover:bg-amber-50/35 transition-colors">
                                                            <td className="px-3.5 py-3">
                                                                <CopyIdButton value={p.transaction_id || p.id} displayLength={14} />
                                                            </td>
                                                            <td className="px-3.5 py-3">
                                                                {p.booking_id ? (
                                                                    <CopyIdButton value={p.booking_id} displayLength={8} />
                                                                ) : (
                                                                    '--'
                                                                )}
                                                            </td>
                                                            <td className="px-3.5 py-3">
                                                                <p className="font-bold text-gray-900">
                                                                    {p.bookings?.users?.full_name || 'Khách vãng lai'}
                                                                </p>
                                                                <p className="text-[11px] text-gray-500">
                                                                    {p.bookings?.users?.email || '--'}
                                                                </p>
                                                            </td>
                                                            <td className="px-3.5 py-3 uppercase font-bold text-[11px] text-gray-700">
                                                                {p.payment_method}
                                                            </td>
                                                            <td className="px-3.5 py-3 text-right font-black text-gray-900 tabular-nums">
                                                                {formatCurrency(p.amount)}
                                                            </td>
                                                            <td className="px-3.5 py-3">
                                                                <PaymentStatusBadge status={p.payment_status} />
                                                            </td>
                                                            <td className="px-3.5 py-3 text-right text-[11px] text-gray-500 tabular-nums whitespace-nowrap">
                                                                {formatDate(p.payment_date)}
                                                            </td>
                                                            <td className="px-3.5 py-3 text-right whitespace-nowrap">
                                                                <select
                                                                    aria-label="Đổi trạng thái giao dịch"
                                                                    value={
                                                                        ['pending', 'paid', 'failed', 'refunded'].includes(
                                                                            p.payment_status || ''
                                                                        )
                                                                            ? (p.payment_status as string)
                                                                            : ''
                                                                    }
                                                                    onChange={(e) => {
                                                                        const v = e.target.value as
                                                                            | 'pending'
                                                                            | 'paid'
                                                                            | 'failed'
                                                                            | 'refunded';
                                                                        if (v) handleUpdatePaymentStatus(p.id, v);
                                                                    }}
                                                                    className="px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white text-[11px] font-bold text-gray-800 focus:outline-none focus:border-gray-900 cursor-pointer"
                                                                >
                                                                    {p.payment_status === 'refund_requested' && (
                                                                        <option value="" disabled>
                                                                            Yêu cầu hoàn tiền
                                                                        </option>
                                                                    )}
                                                                    <option value="paid">Đã trả (Paid)</option>
                                                                    <option value="pending">Chờ TT (Pending)</option>
                                                                    <option value="refunded">Hoàn tiền (Refunded)</option>
                                                                    <option value="failed">Thất bại (Failed)</option>
                                                                </select>
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <EmptyTableRow
                                                        colSpan={8}
                                                        message="Không có giao dịch thanh toán nào khớp bộ lọc."
                                                        onReset={resetCurrentTabFilters}
                                                    />
                                                )}
                                            </tbody>
                                        </table>
                                    </div>

                                    <PaginationBar
                                        currentPage={page}
                                        pageSize={pageSize}
                                        totalItems={processedPayments.length}
                                        onPageChange={setPage}
                                        onPageSizeChange={setPageSize}
                                    />
                                </section>
                            )}

                            {/* TAB 4: TOURS */}
                            {activeTab === 'tours' && (
                                <section className="bg-white border border-gray-200/80 rounded-2xl shadow-xs p-5 space-y-4">
                                    <SearchFilterToolbar
                                        searchQuery={searchQuery}
                                        onSearchChange={handleSearchChange}
                                        placeholder="Tìm tên tour, điểm đến, điểm đi, loại hình, phương tiện..."
                                        totalCount={tours.length}
                                        filteredCount={processedTours.length}
                                        activeChip={activeChip}
                                        onChipChange={handleChipChange}
                                        quickChips={[
                                            { id: 'all', label: 'Tất cả', count: tourCounts.all },
                                            { id: 'trending', label: 'Thịnh hành', count: tourCounts.trending, tone: 'amber' },
                                            { id: 'low_seats', label: 'Sắp hết chỗ (≤5)', count: tourCounts.low_seats, tone: 'rose' },
                                            { id: 'no_schedule', label: 'Chưa có lịch đi', count: tourCounts.no_schedule, tone: 'violet' },
                                        ]}
                                        sortConfig={tourSort}
                                        onClearSort={() => setTourSort(null)}
                                        onSelectSort={setTourSort}
                                        sortOptions={[
                                            { key: 'title', label: 'Tên Tour' },
                                            { key: 'min_price', label: 'Giá khởi điểm' },
                                            { key: 'seats', label: 'Số chỗ trống' },
                                            { key: 'departures', label: 'Số lịch khởi hành' },
                                            { key: 'tour_type', label: 'Loại hình' },
                                            { key: 'route', label: 'Tuyến hành trình' },
                                            { key: 'duration', label: 'Thời lượng' },
                                            { key: 'is_trending', label: 'Thịnh hành' },
                                            { key: 'created_at', label: 'Ngày tạo' },
                                        ]}
                                        extraFilters={
                                            <select
                                                aria-label="Lọc theo loại tour"
                                                value={tourTypeFilter}
                                                onChange={(e) => {
                                                    setTourTypeFilter(e.target.value);
                                                    setPage(1);
                                                }}
                                                className="px-3 py-2 rounded-xl border border-gray-200 bg-stone-50 text-xs font-semibold text-gray-700 focus:outline-none focus:border-gray-900 cursor-pointer"
                                            >
                                                <option value="all">Tất cả loại tour</option>
                                                {tourTypesList.map((type) => (
                                                    <option key={type} value={type}>
                                                        {type}
                                                    </option>
                                                ))}
                                            </select>
                                        }
                                        hasActiveExtraFilters={tourTypeFilter !== 'all'}
                                        onResetAll={resetCurrentTabFilters}
                                        onExportCsv={() =>
                                            exportToCsv(
                                                'danh-sach-tour.csv',
                                                ['ID', 'Tên Tour', 'Loại hình', 'Điểm đi', 'Điểm đến', 'Thời lượng', 'Phương tiện', 'Giá từ', 'Số lịch', 'Tổng chỗ', 'Thịnh hành'],
                                                processedTours.map((t) => [
                                                    t.id,
                                                    t.title,
                                                    t.tour_type,
                                                    t.departure_location || '',
                                                    t.destination || '',
                                                    t.duration || '',
                                                    t.vehicle || '',
                                                    getTourMinPrice(t),
                                                    t.tour_departures?.length || 0,
                                                    getTourTotalSeats(t),
                                                    t.is_trending ? 'Có' : 'Không',
                                                ])
                                            )
                                        }
                                        primaryAction={{
                                            label: 'Thêm Tour',
                                            onClick: () => setTourModalState({ open: true, item: null }),
                                        }}
                                    />

                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-xs">
                                            <thead className="bg-stone-50/90 border-y border-gray-200">
                                                <tr>
                                                    <SortableTh
                                                        label="Tour Du Lịch"
                                                        sortKey="title"
                                                        sortConfig={tourSort}
                                                        onSort={(k) => setTourSort((p) => cycleSortConfig(p, k))}
                                                    />
                                                    <SortableTh
                                                        label="Loại & Phương tiện"
                                                        sortKey="tour_type"
                                                        sortConfig={tourSort}
                                                        onSort={(k) => setTourSort((p) => cycleSortConfig(p, k))}
                                                    />
                                                    <SortableTh
                                                        label="Hành trình"
                                                        sortKey="route"
                                                        sortConfig={tourSort}
                                                        onSort={(k) => setTourSort((p) => cycleSortConfig(p, k))}
                                                    />
                                                    <SortableTh
                                                        label="Thời lượng"
                                                        sortKey="duration"
                                                        sortConfig={tourSort}
                                                        onSort={(k) => setTourSort((p) => cycleSortConfig(p, k))}
                                                    />
                                                    <SortableTh
                                                        label="Giá từ"
                                                        sortKey="min_price"
                                                        sortConfig={tourSort}
                                                        onSort={(k) => setTourSort((p) => cycleSortConfig(p, k))}
                                                        align="right"
                                                    />
                                                    <SortableTh
                                                        label="Lịch đi"
                                                        sortKey="departures"
                                                        sortConfig={tourSort}
                                                        onSort={(k) => setTourSort((p) => cycleSortConfig(p, k))}
                                                        align="center"
                                                    />
                                                    <SortableTh
                                                        label="Tổng chỗ"
                                                        sortKey="seats"
                                                        sortConfig={tourSort}
                                                        onSort={(k) => setTourSort((p) => cycleSortConfig(p, k))}
                                                        align="center"
                                                    />
                                                    <SortableTh
                                                        label="Thịnh hành"
                                                        sortKey="is_trending"
                                                        sortConfig={tourSort}
                                                        onSort={(k) => setTourSort((p) => cycleSortConfig(p, k))}
                                                        align="center"
                                                    />
                                                    <SortableTh
                                                        label="Ngày tạo"
                                                        sortKey="created_at"
                                                        sortConfig={tourSort}
                                                        onSort={(k) => setTourSort((p) => cycleSortConfig(p, k))}
                                                        align="right"
                                                    />
                                                    <th className="px-3.5 py-3 text-right text-[11px] font-bold uppercase tracking-wider text-gray-500">
                                                        Thao tác
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {processedTours.length > 0 ? (
                                                    paginate(processedTours).map((t) => {
                                                        const minPrice = getTourMinPrice(t);
                                                        const totalSeats = getTourTotalSeats(t);
                                                        const depCount = t.tour_departures?.length || 0;
                                                        const nextDate = getNextDepartureDate(t);
                                                        const thumb = t.tour_images?.[0]?.url;

                                                        return (
                                                            <tr key={t.id} className="hover:bg-amber-50/35 transition-colors">
                                                                <td className="px-3.5 py-3">
                                                                    <div className="flex items-center gap-3 max-w-[260px]">
                                                                        {thumb ? (
                                                                            /* eslint-disable-next-line @next/next/no-img-element */
                                                                            <img
                                                                                src={thumb}
                                                                                alt={t.title}
                                                                                className="w-11 h-11 rounded-xl object-cover border border-gray-200 shrink-0"
                                                                            />
                                                                        ) : (
                                                                            <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                                                                                <Compass className="w-5 h-5" />
                                                                            </div>
                                                                        )}
                                                                        <div className="min-w-0">
                                                                            <p className="font-bold text-gray-900 truncate" title={t.title}>
                                                                                {t.title}
                                                                            </p>
                                                                            <p className="text-[10px] text-gray-400 font-mono">
                                                                                #{t.id.slice(0, 8)} · {t.tour_images?.length || 0} ảnh
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                <td className="px-3.5 py-3">
                                                                    <span className="inline-block px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-bold">
                                                                        {t.tour_type}
                                                                    </span>
                                                                    <p className="text-[11px] text-gray-500 mt-1 truncate max-w-[130px]">
                                                                        {t.vehicle || 'Chưa cập nhật PT'}
                                                                    </p>
                                                                </td>
                                                                <td className="px-3.5 py-3 text-gray-700">
                                                                    <p className="font-semibold text-gray-900">
                                                                        {t.destination || 'Chưa rõ'}
                                                                    </p>
                                                                    <p className="text-[11px] text-gray-400">
                                                                        Từ: {t.departure_location || '--'}
                                                                    </p>
                                                                </td>
                                                                <td className="px-3.5 py-3">
                                                                    <p className="font-semibold text-gray-800">{t.duration || '--'}</p>
                                                                    {t.ideal_time && (
                                                                        <p className="text-[10px] text-gray-400 truncate max-w-[120px]">
                                                                            {t.ideal_time}
                                                                        </p>
                                                                    )}
                                                                </td>
                                                                <td className="px-3.5 py-3 text-right font-black text-gray-900 tabular-nums whitespace-nowrap">
                                                                    {minPrice > 0 ? formatCurrency(minPrice) : 'Chưa có giá'}
                                                                </td>
                                                                <td className="px-3.5 py-3 text-center whitespace-nowrap">
                                                                    <p className="font-bold text-gray-900 tabular-nums">{depCount} đợt</p>
                                                                    {nextDate && (
                                                                        <p className="text-[10px] text-gray-500">
                                                                            Gần nhất: {formatShortDate(nextDate)}
                                                                        </p>
                                                                    )}
                                                                </td>
                                                                <td className="px-3.5 py-3 text-center whitespace-nowrap">
                                                                    <span
                                                                        className={`px-2 py-0.5 rounded-full text-[11px] font-bold tabular-nums ${
                                                                            totalSeats === 0
                                                                                ? 'bg-rose-50 text-rose-700'
                                                                                : totalSeats <= 5
                                                                                ? 'bg-amber-50 text-amber-800'
                                                                                : 'bg-emerald-50 text-emerald-700'
                                                                        }`}
                                                                    >
                                                                        {totalSeats} chỗ
                                                                    </span>
                                                                </td>
                                                                <td className="px-3.5 py-3 text-center">
                                                                    <TrendingToggleButton
                                                                        isTrending={t.is_trending}
                                                                        onClick={() => handleToggleTourTrending(t.id, t.is_trending)}
                                                                    />
                                                                </td>
                                                                <td className="px-3.5 py-3 text-right text-[11px] text-gray-500 tabular-nums whitespace-nowrap">
                                                                    {formatShortDate(t.created_at)}
                                                                </td>
                                                                <td className="px-3.5 py-3 text-right whitespace-nowrap">
                                                                    <div className="inline-flex items-center gap-1">
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => setDetailTour(t)}
                                                                            className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-gray-900 hover:text-[#FACC15] text-gray-800 text-[11px] font-bold transition-colors cursor-pointer"
                                                                            title="Xem chi tiết, lịch khởi hành & ảnh"
                                                                        >
                                                                            Lịch & Ảnh
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => setTourModalState({ open: true, item: t })}
                                                                            className="p-1.5 rounded-lg text-gray-600 hover:text-black hover:bg-gray-100 cursor-pointer"
                                                                            title="Chỉnh sửa tour"
                                                                        >
                                                                            <Pencil className="w-3.5 h-3.5" />
                                                                        </button>
                                                                        <Link
                                                                            href={`/tours/${t.id}`}
                                                                            target="_blank"
                                                                            className="p-1.5 rounded-lg text-gray-500 hover:text-black hover:bg-gray-100"
                                                                            title="Xem trang khách"
                                                                        >
                                                                            <ExternalLink className="w-3.5 h-3.5" />
                                                                        </Link>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() =>
                                                                                requestDeleteAction({
                                                                                    title: 'Xóa Tour Du Lịch',
                                                                                    message: `Xóa vĩnh viễn tour "${t.title}" cùng các lịch khởi hành và ảnh liên quan?`,
                                                                                    endpoint: `/api/v1/admin/tours/${t.id}`,
                                                                                    successMsg: 'Đã xóa tour du lịch.',
                                                                                })
                                                                            }
                                                                            className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 cursor-pointer"
                                                                            title="Xóa tour"
                                                                        >
                                                                            <Trash2 className="w-3.5 h-3.5" />
                                                                        </button>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })
                                                ) : (
                                                    <EmptyTableRow
                                                        colSpan={10}
                                                        message="Không tìm thấy tour du lịch nào phù hợp."
                                                        onReset={resetCurrentTabFilters}
                                                    />
                                                )}
                                            </tbody>
                                        </table>
                                    </div>

                                    <PaginationBar
                                        currentPage={page}
                                        pageSize={pageSize}
                                        totalItems={processedTours.length}
                                        onPageChange={setPage}
                                        onPageSizeChange={setPageSize}
                                    />
                                </section>
                            )}

                            {/* TAB 5: HOTELS */}
                            {activeTab === 'hotels' && (
                                <section className="bg-white border border-gray-200/80 rounded-2xl shadow-xs p-5 space-y-4">
                                    <SearchFilterToolbar
                                        searchQuery={searchQuery}
                                        onSearchChange={handleSearchChange}
                                        placeholder="Tìm tên khách sạn, thành phố, địa chỉ, tiện ích (hồ bơi, spa...)"
                                        totalCount={hotels.length}
                                        filteredCount={processedHotels.length}
                                        activeChip={activeChip}
                                        onChipChange={handleChipChange}
                                        quickChips={[
                                            { id: 'all', label: 'Tất cả', count: hotelCounts.all },
                                            { id: 'trending', label: 'Thịnh hành', count: hotelCounts.trending, tone: 'amber' },
                                            { id: 'five_star', label: '5 Sao', count: hotelCounts.five_star, tone: 'emerald' },
                                            { id: 'discounted', label: 'Có giảm giá', count: hotelCounts.discounted, tone: 'sky' },
                                            { id: 'low_rooms', label: 'Ít phòng (≤3)', count: hotelCounts.low_rooms, tone: 'rose' },
                                        ]}
                                        sortConfig={hotelSort}
                                        onClearSort={() => setHotelSort(null)}
                                        onSelectSort={setHotelSort}
                                        sortOptions={[
                                            { key: 'name', label: 'Tên Khách sạn' },
                                            { key: 'city', label: 'Thành phố' },
                                            { key: 'star_rating', label: 'Hạng sao' },
                                            { key: 'price', label: 'Giá / đêm' },
                                            { key: 'available_rooms', label: 'Phòng trống' },
                                            { key: 'amenities', label: 'Số tiện ích' },
                                            { key: 'is_trending', label: 'Thịnh hành' },
                                            { key: 'created_at', label: 'Ngày tạo' },
                                        ]}
                                        extraFilters={
                                            <select
                                                aria-label="Lọc theo thành phố"
                                                value={hotelCityFilter}
                                                onChange={(e) => {
                                                    setHotelCityFilter(e.target.value);
                                                    setPage(1);
                                                }}
                                                className="px-3 py-2 rounded-xl border border-gray-200 bg-stone-50 text-xs font-semibold text-gray-700 focus:outline-none focus:border-gray-900 cursor-pointer"
                                            >
                                                <option value="all">Tất cả thành phố</option>
                                                {hotelCitiesList.map((city) => (
                                                    <option key={city} value={city}>
                                                        {city}
                                                    </option>
                                                ))}
                                            </select>
                                        }
                                        hasActiveExtraFilters={hotelCityFilter !== 'all'}
                                        onResetAll={resetCurrentTabFilters}
                                        onExportCsv={() =>
                                            exportToCsv(
                                                'danh-sach-khach-san.csv',
                                                ['ID', 'Tên', 'Thành phố', 'Địa chỉ', 'Số sao', 'Giá gốc', 'Giá KM', 'Phòng trống', 'Tiện ích', 'Thịnh hành'],
                                                processedHotels.map((h) => [
                                                    h.id,
                                                    h.name,
                                                    h.city,
                                                    h.address,
                                                    h.star_rating ?? '',
                                                    Number(h.price_per_night || 0),
                                                    h.discount_price ? Number(h.discount_price) : '',
                                                    h.available_rooms,
                                                    (h.amenities || []).join('; '),
                                                    h.is_trending ? 'Có' : 'Không',
                                                ])
                                            )
                                        }
                                        primaryAction={{
                                            label: 'Thêm Khách sạn',
                                            onClick: () => setHotelModalState({ open: true, item: null }),
                                        }}
                                    />

                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-xs">
                                            <thead className="bg-stone-50/90 border-y border-gray-200">
                                                <tr>
                                                    <SortableTh
                                                        label="Khách sạn & Địa chỉ"
                                                        sortKey="name"
                                                        sortConfig={hotelSort}
                                                        onSort={(k) => setHotelSort((p) => cycleSortConfig(p, k))}
                                                    />
                                                    <SortableTh
                                                        label="Thành phố"
                                                        sortKey="city"
                                                        sortConfig={hotelSort}
                                                        onSort={(k) => setHotelSort((p) => cycleSortConfig(p, k))}
                                                    />
                                                    <SortableTh
                                                        label="Hạng sao"
                                                        sortKey="star_rating"
                                                        sortConfig={hotelSort}
                                                        onSort={(k) => setHotelSort((p) => cycleSortConfig(p, k))}
                                                        align="center"
                                                    />
                                                    <SortableTh
                                                        label="Giá / đêm"
                                                        sortKey="price"
                                                        sortConfig={hotelSort}
                                                        onSort={(k) => setHotelSort((p) => cycleSortConfig(p, k))}
                                                        align="right"
                                                    />
                                                    <SortableTh
                                                        label="Phòng trống"
                                                        sortKey="available_rooms"
                                                        sortConfig={hotelSort}
                                                        onSort={(k) => setHotelSort((p) => cycleSortConfig(p, k))}
                                                        align="center"
                                                    />
                                                    <SortableTh
                                                        label="Tiện ích"
                                                        sortKey="amenities"
                                                        sortConfig={hotelSort}
                                                        onSort={(k) => setHotelSort((p) => cycleSortConfig(p, k))}
                                                    />
                                                    <SortableTh
                                                        label="Thịnh hành"
                                                        sortKey="is_trending"
                                                        sortConfig={hotelSort}
                                                        onSort={(k) => setHotelSort((p) => cycleSortConfig(p, k))}
                                                        align="center"
                                                    />
                                                    <SortableTh
                                                        label="Ngày tạo"
                                                        sortKey="created_at"
                                                        sortConfig={hotelSort}
                                                        onSort={(k) => setHotelSort((p) => cycleSortConfig(p, k))}
                                                        align="right"
                                                    />
                                                    <th className="px-3.5 py-3 text-right text-[11px] font-bold uppercase tracking-wider text-gray-500">
                                                        Thao tác
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {processedHotels.length > 0 ? (
                                                    paginate(processedHotels).map((h) => {
                                                        const thumb = h.hotel_images?.[0]?.url;
                                                        const hasDiscount =
                                                            h.discount_price &&
                                                            Number(h.discount_price) < Number(h.price_per_night);

                                                        return (
                                                            <tr key={h.id} className="hover:bg-amber-50/35 transition-colors">
                                                                <td className="px-3.5 py-3">
                                                                    <div className="flex items-center gap-3 max-w-[260px]">
                                                                        {thumb ? (
                                                                            /* eslint-disable-next-line @next/next/no-img-element */
                                                                            <img
                                                                                src={thumb}
                                                                                alt={h.name}
                                                                                className="w-11 h-11 rounded-xl object-cover border border-gray-200 shrink-0"
                                                                            />
                                                                        ) : (
                                                                            <div className="w-11 h-11 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
                                                                                <Building2 className="w-5 h-5" />
                                                                            </div>
                                                                        )}
                                                                        <div className="min-w-0">
                                                                            <p className="font-bold text-gray-900 truncate" title={h.name}>
                                                                                {h.name}
                                                                            </p>
                                                                            <p className="text-[11px] text-gray-500 truncate" title={h.address}>
                                                                                {h.address}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                <td className="px-3.5 py-3 font-semibold text-gray-800 whitespace-nowrap">
                                                                    {h.city}
                                                                </td>
                                                                <td className="px-3.5 py-3 text-center whitespace-nowrap">
                                                                    <span className="inline-flex items-center gap-1 font-bold text-amber-600">
                                                                        {h.star_rating ?? 0}
                                                                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                                                                    </span>
                                                                </td>
                                                                <td className="px-3.5 py-3 text-right tabular-nums whitespace-nowrap">
                                                                    <p className="font-black text-gray-900">
                                                                        {formatCurrency(h.discount_price ?? h.price_per_night)}
                                                                    </p>
                                                                    {hasDiscount && (
                                                                        <p className="text-[10px] text-gray-400 line-through">
                                                                            {formatCurrency(h.price_per_night)}
                                                                        </p>
                                                                    )}
                                                                </td>
                                                                <td className="px-3.5 py-3 text-center whitespace-nowrap">
                                                                    <span
                                                                        className={`px-2 py-0.5 rounded-full text-[11px] font-bold tabular-nums ${
                                                                            h.available_rooms <= 3
                                                                                ? 'bg-rose-50 text-rose-700'
                                                                                : 'bg-emerald-50 text-emerald-700'
                                                                        }`}
                                                                    >
                                                                        {h.available_rooms} phòng
                                                                    </span>
                                                                </td>
                                                                <td className="px-3.5 py-3 max-w-[180px]">
                                                                    <div className="flex flex-wrap gap-1">
                                                                        {(h.amenities || []).slice(0, 2).map((a, idx) => (
                                                                            <span
                                                                                key={`${a}-${idx}`}
                                                                                className="px-1.5 py-0.5 rounded bg-stone-100 text-gray-600 text-[10px] font-semibold"
                                                                            >
                                                                                {a}
                                                                            </span>
                                                                        ))}
                                                                        {(h.amenities?.length || 0) > 2 && (
                                                                            <span className="px-1.5 py-0.5 rounded bg-teal-50 text-teal-700 text-[10px] font-bold">
                                                                                +{(h.amenities?.length || 0) - 2}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </td>
                                                                <td className="px-3.5 py-3 text-center">
                                                                    <TrendingToggleButton
                                                                        isTrending={h.is_trending}
                                                                        onClick={() => handleToggleHotelTrending(h.id, h.is_trending)}
                                                                    />
                                                                </td>
                                                                <td className="px-3.5 py-3 text-right text-[11px] text-gray-500 tabular-nums whitespace-nowrap">
                                                                    {formatShortDate(h.created_at)}
                                                                </td>
                                                                <td className="px-3.5 py-3 text-right whitespace-nowrap">
                                                                    <div className="inline-flex items-center gap-1">
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => setDetailHotel(h)}
                                                                            className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-gray-900 hover:text-[#FACC15] text-gray-800 text-[11px] font-bold transition-colors cursor-pointer"
                                                                        >
                                                                            Chi tiết & Ảnh
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => setHotelModalState({ open: true, item: h })}
                                                                            className="p-1.5 rounded-lg text-gray-600 hover:text-black hover:bg-gray-100 cursor-pointer"
                                                                            title="Chỉnh sửa"
                                                                        >
                                                                            <Pencil className="w-3.5 h-3.5" />
                                                                        </button>
                                                                        <Link
                                                                            href={`/hotels/${h.id}`}
                                                                            target="_blank"
                                                                            className="p-1.5 rounded-lg text-gray-500 hover:text-black hover:bg-gray-100"
                                                                            title="Xem trang khách"
                                                                        >
                                                                            <ExternalLink className="w-3.5 h-3.5" />
                                                                        </Link>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() =>
                                                                                requestDeleteAction({
                                                                                    title: 'Xóa Khách Sạn',
                                                                                    message: `Xóa vĩnh viễn khách sạn "${h.name}"?`,
                                                                                    endpoint: `/api/v1/admin/hotels/${h.id}`,
                                                                                    successMsg: 'Đã xóa khách sạn.',
                                                                                })
                                                                            }
                                                                            className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 cursor-pointer"
                                                                            title="Xóa"
                                                                        >
                                                                            <Trash2 className="w-3.5 h-3.5" />
                                                                        </button>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })
                                                ) : (
                                                    <EmptyTableRow
                                                        colSpan={9}
                                                        message="Không tìm thấy khách sạn nào phù hợp."
                                                        onReset={resetCurrentTabFilters}
                                                    />
                                                )}
                                            </tbody>
                                        </table>
                                    </div>

                                    <PaginationBar
                                        currentPage={page}
                                        pageSize={pageSize}
                                        totalItems={processedHotels.length}
                                        onPageChange={setPage}
                                        onPageSizeChange={setPageSize}
                                    />
                                </section>
                            )}

                            {/* TAB 6: FLIGHTS & PLANES */}
                            {activeTab === 'flights' && (
                                <section className="bg-white border border-gray-200/80 rounded-2xl shadow-xs p-5 space-y-4">
                                    {/* Sub-mode tabs: Flights vs Planes */}
                                    <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-gray-100">
                                        <div className="inline-flex p-1 rounded-xl bg-stone-100">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setFlightsSubTab('flights');
                                                    setPage(1);
                                                }}
                                                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                                    flightsSubTab === 'flights'
                                                        ? 'bg-gray-900 text-[#FACC15] shadow-xs'
                                                        : 'text-gray-600 hover:text-black'
                                                }`}
                                            >
                                                Lịch Trình Chuyến Bay ({flights.length})
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setFlightsSubTab('planes');
                                                    setPage(1);
                                                }}
                                                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                                    flightsSubTab === 'planes'
                                                        ? 'bg-gray-900 text-[#FACC15] shadow-xs'
                                                        : 'text-gray-600 hover:text-black'
                                                }`}
                                            >
                                                Đội Tàu Bay ({planes.length})
                                            </button>
                                        </div>
                                    </div>

                                    {flightsSubTab === 'flights' ? (
                                        <>
                                            <SearchFilterToolbar
                                                searchQuery={searchQuery}
                                                onSearchChange={handleSearchChange}
                                                placeholder="Tìm sân bay đi/đến (HAN, SGN, Đà Nẵng...), hãng bay, số hiệu tàu bay..."
                                                totalCount={flights.length}
                                                filteredCount={processedFlights.length}
                                                activeChip={activeChip}
                                                onChipChange={handleChipChange}
                                                quickChips={[
                                                    { id: 'all', label: 'Tất cả', count: flightCounts.all },
                                                    {
                                                        id: 'low_seats',
                                                        label: 'Sắp hết ghế (≤10)',
                                                        count: flightCounts.low_seats,
                                                        tone: 'rose',
                                                    },
                                                    {
                                                        id: 'plenty_seats',
                                                        label: 'Còn nhiều ghế (>30)',
                                                        count: flightCounts.plenty_seats,
                                                        tone: 'emerald',
                                                    },
                                                ]}
                                                sortConfig={flightSort}
                                                onClearSort={() => setFlightSort(null)}
                                                onSelectSort={setFlightSort}
                                                sortOptions={[
                                                    { key: 'departure_time', label: 'Giờ cất cánh' },
                                                    { key: 'arrival_time', label: 'Giờ hạ cánh' },
                                                    { key: 'ticket_price', label: 'Giá vé' },
                                                    { key: 'available_seats', label: 'Ghế trống' },
                                                    { key: 'duration', label: 'Thời gian bay' },
                                                    { key: 'airline', label: 'Hãng & Tàu bay' },
                                                    { key: 'route', label: 'Chặng bay' },
                                                ]}
                                                extraFilters={
                                                    <select
                                                        aria-label="Lọc hãng hàng không"
                                                        value={flightAirlineFilter}
                                                        onChange={(e) => {
                                                    setFlightAirlineFilter(e.target.value);
                                                    setPage(1);
                                                }}
                                                        className="px-3 py-2 rounded-xl border border-gray-200 bg-stone-50 text-xs font-semibold text-gray-700 focus:outline-none focus:border-gray-900 cursor-pointer"
                                                    >
                                                        <option value="all">Tất cả hãng bay</option>
                                                        {airlinesList.map((a) => (
                                                            <option key={a} value={a}>
                                                                {a}
                                                            </option>
                                                        ))}
                                                    </select>
                                                }
                                                hasActiveExtraFilters={flightAirlineFilter !== 'all'}
                                                onResetAll={resetCurrentTabFilters}
                                                onExportCsv={() =>
                                                    exportToCsv(
                                                        'lich-trinh-chuyen-bay.csv',
                                                        ['ID', 'Hãng bay', 'Số hiệu', 'Sân bay đi', 'Sân bay đến', 'Cất cánh', 'Hạ cánh', 'Thời lượng', 'Giá vé', 'Ghế trống', 'Tổng ghế'],
                                                        processedFlights.map((f) => [
                                                            f.id,
                                                            f.planes?.airline || '',
                                                            f.planes?.plane_number || '',
                                                            f.departure_airport,
                                                            f.arrival_airport,
                                                            formatDate(f.departure_time),
                                                            formatDate(f.arrival_time),
                                                            formatDurationBetween(f.departure_time, f.arrival_time),
                                                            Number(f.ticket_price || 0),
                                                            f.available_seats,
                                                            f.planes?.total_seats || '',
                                                        ])
                                                    )
                                                }
                                                primaryAction={{
                                                    label: 'Thêm Chuyến bay',
                                                    onClick: () => setFlightModalState({ open: true, item: null }),
                                                }}
                                            />

                                            <div className="overflow-x-auto">
                                                <table className="w-full text-left text-xs">
                                                    <thead className="bg-stone-50/90 border-y border-gray-200">
                                                        <tr>
                                                            <SortableTh
                                                                label="Hãng & Tàu bay"
                                                                sortKey="airline"
                                                                sortConfig={flightSort}
                                                                onSort={(k) => setFlightSort((p) => cycleSortConfig(p, k))}
                                                            />
                                                            <SortableTh
                                                                label="Chặng bay"
                                                                sortKey="route"
                                                                sortConfig={flightSort}
                                                                onSort={(k) => setFlightSort((p) => cycleSortConfig(p, k))}
                                                            />
                                                            <SortableTh
                                                                label="Cất cánh"
                                                                sortKey="departure_time"
                                                                sortConfig={flightSort}
                                                                onSort={(k) => setFlightSort((p) => cycleSortConfig(p, k))}
                                                            />
                                                            <SortableTh
                                                                label="Hạ cánh"
                                                                sortKey="arrival_time"
                                                                sortConfig={flightSort}
                                                                onSort={(k) => setFlightSort((p) => cycleSortConfig(p, k))}
                                                            />
                                                            <SortableTh
                                                                label="Thời lượng"
                                                                sortKey="duration"
                                                                sortConfig={flightSort}
                                                                onSort={(k) => setFlightSort((p) => cycleSortConfig(p, k))}
                                                                align="center"
                                                            />
                                                            <SortableTh
                                                                label="Giá vé"
                                                                sortKey="ticket_price"
                                                                sortConfig={flightSort}
                                                                onSort={(k) => setFlightSort((p) => cycleSortConfig(p, k))}
                                                                align="right"
                                                            />
                                                            <SortableTh
                                                                label="Ghế trống"
                                                                sortKey="available_seats"
                                                                sortConfig={flightSort}
                                                                onSort={(k) => setFlightSort((p) => cycleSortConfig(p, k))}
                                                                align="center"
                                                            />
                                                            <th className="px-3.5 py-3 text-right text-[11px] font-bold uppercase tracking-wider text-gray-500">
                                                                Thao tác
                                                            </th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-100">
                                                        {processedFlights.length > 0 ? (
                                                            paginate(processedFlights).map((f) => {
                                                                const totalSeats = Number(f.planes?.total_seats || 0);
                                                                const avail = Number(f.available_seats || 0);
                                                                const seatPct =
                                                                    totalSeats > 0 ? Math.min(100, Math.round((avail / totalSeats) * 100)) : 0;

                                                                return (
                                                                    <tr key={f.id} className="hover:bg-amber-50/35 transition-colors">
                                                                        <td className="px-3.5 py-3">
                                                                            <div className="flex items-center gap-2.5">
                                                                                <AirlineLogoBadge airlineName={f.planes?.airline} size="sm" />
                                                                                <div>
                                                                                    <p className="font-bold text-gray-900">
                                                                                        {f.planes?.airline || 'Chưa gán hãng'}
                                                                                    </p>
                                                                                    <p className="text-[11px] font-mono text-gray-500">
                                                                                        {f.planes?.plane_number || '---'}
                                                                                    </p>
                                                                                </div>
                                                                            </div>
                                                                        </td>
                                                                        <td className="px-3.5 py-3 font-bold text-gray-900">
                                                                            <span>{f.departure_airport}</span>
                                                                            <span className="mx-1.5 text-amber-600">→</span>
                                                                            <span>{f.arrival_airport}</span>
                                                                        </td>
                                                                        <td className="px-3.5 py-3 text-[11px] text-gray-700 tabular-nums whitespace-nowrap">
                                                                            {formatDate(f.departure_time)}
                                                                        </td>
                                                                        <td className="px-3.5 py-3 text-[11px] text-gray-700 tabular-nums whitespace-nowrap">
                                                                            {formatDate(f.arrival_time)}
                                                                        </td>
                                                                        <td className="px-3.5 py-3 text-center whitespace-nowrap">
                                                                            <span className="px-2 py-0.5 rounded bg-stone-100 text-gray-700 text-[11px] font-bold">
                                                                                {formatDurationBetween(f.departure_time, f.arrival_time)}
                                                                            </span>
                                                                        </td>
                                                                        <td className="px-3.5 py-3 text-right font-black text-gray-900 tabular-nums whitespace-nowrap">
                                                                            {formatCurrency(f.ticket_price)}
                                                                        </td>
                                                                        <td className="px-3.5 py-3 text-center whitespace-nowrap">
                                                                            <div className="inline-flex flex-col items-center gap-1 min-w-[72px]">
                                                                                <span
                                                                                    className={`text-[11px] font-bold tabular-nums ${
                                                                                        avail <= 10 ? 'text-rose-600' : 'text-emerald-700'
                                                                                    }`}
                                                                                >
                                                                                    {avail}
                                                                                    {totalSeats > 0 ? ` / ${totalSeats}` : ' ghế'}
                                                                                </span>
                                                                                {totalSeats > 0 && (
                                                                                    <div className="w-16 h-1 bg-gray-200 rounded-full overflow-hidden">
                                                                                        <div
                                                                                            className={`h-full rounded-full ${
                                                                                                avail <= 10 ? 'bg-rose-500' : 'bg-emerald-500'
                                                                                            }`}
                                                                                            style={{ width: `${seatPct}%` }}
                                                                                        />
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        </td>
                                                                        <td className="px-3.5 py-3 text-right whitespace-nowrap">
                                                                            <div className="inline-flex items-center gap-1">
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => setFlightModalState({ open: true, item: f })}
                                                                                    className="p-1.5 rounded-lg text-gray-600 hover:text-black hover:bg-gray-100 cursor-pointer"
                                                                                    title="Chỉnh sửa chuyến bay"
                                                                                >
                                                                                    <Pencil className="w-3.5 h-3.5" />
                                                                                </button>
                                                                                <Link
                                                                                    href={`/flights/${f.id}`}
                                                                                    target="_blank"
                                                                                    className="p-1.5 rounded-lg text-gray-500 hover:text-black hover:bg-gray-100"
                                                                                    title="Xem vé điện tử"
                                                                                >
                                                                                    <ExternalLink className="w-3.5 h-3.5" />
                                                                                </Link>
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() =>
                                                                                        requestDeleteAction({
                                                                                            title: 'Xóa Chuyến Bay',
                                                                                            message: `Xóa chuyến bay ${f.departure_airport} → ${f.arrival_airport} lúc ${formatDate(f.departure_time)}?`,
                                                                                            endpoint: `/api/v1/admin/flights/${f.id}`,
                                                                                            successMsg: 'Đã xóa chuyến bay.',
                                                                                        })
                                                                                    }
                                                                                    className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 cursor-pointer"
                                                                                    title="Xóa chuyến bay"
                                                                                >
                                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                                </button>
                                                                            </div>
                                                                        </td>
                                                                    </tr>
                                                                );
                                                            })
                                                        ) : (
                                                            <EmptyTableRow
                                                                colSpan={8}
                                                                message="Không tìm thấy chuyến bay nào phù hợp."
                                                                onReset={resetCurrentTabFilters}
                                                            />
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>

                                            <PaginationBar
                                                currentPage={page}
                                                pageSize={pageSize}
                                                totalItems={processedFlights.length}
                                                onPageChange={setPage}
                                                onPageSizeChange={setPageSize}
                                            />
                                        </>
                                    ) : (
                                        <>
                                            <SearchFilterToolbar
                                                searchQuery={searchQuery}
                                                onSearchChange={handleSearchChange}
                                                placeholder="Tìm hãng hàng không, số hiệu máy bay (VN-A...)..."
                                                totalCount={planes.length}
                                                filteredCount={processedPlanes.length}
                                                sortConfig={planeSort}
                                                onClearSort={() => setPlaneSort(null)}
                                                onSelectSort={setPlaneSort}
                                                sortOptions={[
                                                    { key: 'airline', label: 'Hãng hàng không' },
                                                    { key: 'plane_number', label: 'Số hiệu tàu bay' },
                                                    { key: 'total_seats', label: 'Tổng số ghế' },
                                                    { key: 'flights_count', label: 'Số chuyến khai thác' },
                                                ]}
                                                onResetAll={resetCurrentTabFilters}
                                                primaryAction={{
                                                    label: 'Thêm Máy bay',
                                                    onClick: () => setPlaneModalState({ open: true, item: null }),
                                                }}
                                            />

                                            <div className="overflow-x-auto">
                                                <table className="w-full text-left text-xs">
                                                    <thead className="bg-stone-50/90 border-y border-gray-200">
                                                        <tr>
                                                            <SortableTh
                                                                label="Hãng hàng không"
                                                                sortKey="airline"
                                                                sortConfig={planeSort}
                                                                onSort={(k) => setPlaneSort((p) => cycleSortConfig(p, k))}
                                                            />
                                                            <SortableTh
                                                                label="Số hiệu tàu bay"
                                                                sortKey="plane_number"
                                                                sortConfig={planeSort}
                                                                onSort={(k) => setPlaneSort((p) => cycleSortConfig(p, k))}
                                                            />
                                                            <SortableTh
                                                                label="Tổng số ghế"
                                                                sortKey="total_seats"
                                                                sortConfig={planeSort}
                                                                onSort={(k) => setPlaneSort((p) => cycleSortConfig(p, k))}
                                                                align="center"
                                                            />
                                                            <SortableTh
                                                                label="Chuyến bay đang khai thác"
                                                                sortKey="flights_count"
                                                                sortConfig={planeSort}
                                                                onSort={(k) => setPlaneSort((p) => cycleSortConfig(p, k))}
                                                                align="center"
                                                            />
                                                            <th className="px-3.5 py-3 text-right text-[11px] font-bold uppercase tracking-wider text-gray-500">
                                                                Thao tác
                                                            </th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-100">
                                                        {processedPlanes.length > 0 ? (
                                                            paginate(processedPlanes).map((pl) => (
                                                                <tr key={pl.id} className="hover:bg-amber-50/35 transition-colors">
                                                                    <td className="px-3.5 py-3">
                                                                        <div className="flex items-center gap-3">
                                                                            <AirlineLogoBadge airlineName={pl.airline} size="sm" />
                                                                            <span className="font-bold text-gray-900">{pl.airline}</span>
                                                                        </div>
                                                                    </td>
                                                                    <td className="px-3.5 py-3 font-mono font-bold text-gray-800">
                                                                        {pl.plane_number}
                                                                    </td>
                                                                    <td className="px-3.5 py-3 text-center font-black text-gray-900 tabular-nums">
                                                                        {pl.total_seats} ghế
                                                                    </td>
                                                                    <td className="px-3.5 py-3 text-center font-bold text-indigo-700 tabular-nums">
                                                                        {pl._count?.flights ?? 0} chuyến
                                                                    </td>
                                                                    <td className="px-3.5 py-3 text-right whitespace-nowrap">
                                                                        <div className="inline-flex items-center gap-1">
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => setPlaneModalState({ open: true, item: pl })}
                                                                                className="p-1.5 rounded-lg text-gray-600 hover:text-black hover:bg-gray-100 cursor-pointer"
                                                                                title="Chỉnh sửa máy bay"
                                                                            >
                                                                                <Pencil className="w-3.5 h-3.5" />
                                                                            </button>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() =>
                                                                                    requestDeleteAction({
                                                                                        title: 'Xóa Máy Bay',
                                                                                        message: `Xóa tàu bay ${pl.airline} (${pl.plane_number}) sẽ ảnh hưởng đến các chuyến bay thuộc tàu bay này. Bạn chắc chắn chứ?`,
                                                                                        endpoint: `/api/v1/admin/planes/${pl.id}`,
                                                                                        successMsg: 'Đã xóa máy bay.',
                                                                                    })
                                                                                }
                                                                                className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 cursor-pointer"
                                                                                title="Xóa máy bay"
                                                                            >
                                                                                <Trash2 className="w-3.5 h-3.5" />
                                                                            </button>
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            ))
                                                        ) : (
                                                            <EmptyTableRow
                                                                colSpan={5}
                                                                message="Không tìm thấy máy bay nào."
                                                                onReset={resetCurrentTabFilters}
                                                            />
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>

                                            <PaginationBar
                                                currentPage={page}
                                                pageSize={pageSize}
                                                totalItems={processedPlanes.length}
                                                onPageChange={setPage}
                                                onPageSizeChange={setPageSize}
                                            />
                                        </>
                                    )}
                                </section>
                            )}

                            {/* TAB 7: USERS */}
                            {activeTab === 'users' && (
                                <section className="bg-white border border-gray-200/80 rounded-2xl shadow-xs p-5 space-y-4">
                                    <SearchFilterToolbar
                                        searchQuery={searchQuery}
                                        onSearchChange={handleSearchChange}
                                        placeholder="Tìm tên thành viên, email, số điện thoại, vai trò (admin/user)..."
                                        totalCount={users.length}
                                        filteredCount={processedUsers.length}
                                        activeChip={activeChip}
                                        onChipChange={handleChipChange}
                                        quickChips={[
                                            { id: 'all', label: 'Tất cả', count: userCounts.all },
                                            { id: 'admin', label: 'Quản trị viên', count: userCounts.admin, tone: 'amber' },
                                            { id: 'user', label: 'Khách hàng', count: userCounts.user },
                                            { id: 'google', label: 'Google OAuth', count: userCounts.google, tone: 'sky' },
                                            { id: 'has_bookings', label: 'Đã từng đặt', count: userCounts.has_bookings, tone: 'emerald' },
                                        ]}
                                        sortConfig={userSort}
                                        onClearSort={() => setUserSort(null)}
                                        onSelectSort={setUserSort}
                                        sortOptions={[
                                            { key: 'full_name', label: 'Họ & Tên' },
                                            { key: 'email', label: 'Email' },
                                            { key: 'bookings_count', label: 'Số đơn đặt' },
                                            { key: 'reviews_count', label: 'Số đánh giá' },
                                            { key: 'role', label: 'Vai trò' },
                                            { key: 'auth_provider', label: 'Nguồn ĐN' },
                                            { key: 'created_at', label: 'Ngày tham gia' },
                                        ]}
                                        onResetAll={resetCurrentTabFilters}
                                        onExportCsv={() =>
                                            exportToCsv(
                                                'danh-sach-thanh-vien.csv',
                                                ['ID', 'Họ tên', 'Email', 'SĐT', 'Nguồn ĐN', 'Vai trò', 'Số đơn', 'Số đánh giá', 'Ngày tạo'],
                                                processedUsers.map((u) => [
                                                    u.id,
                                                    u.full_name,
                                                    u.email,
                                                    u.phone_number || '',
                                                    u.auth_provider || 'local',
                                                    u.role || 'user',
                                                    u._count?.bookings ?? 0,
                                                    u._count?.reviews ?? 0,
                                                    formatDate(u.created_at),
                                                ])
                                            )
                                        }
                                        primaryAction={{
                                            label: 'Thêm Thành viên',
                                            onClick: () => setUserModalState({ open: true, item: null }),
                                        }}
                                    />

                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-xs">
                                            <thead className="bg-stone-50/90 border-y border-gray-200">
                                                <tr>
                                                    <SortableTh
                                                        label="Thành viên"
                                                        sortKey="full_name"
                                                        sortConfig={userSort}
                                                        onSort={(k) => setUserSort((p) => cycleSortConfig(p, k))}
                                                    />
                                                    <SortableTh
                                                        label="Email & SĐT"
                                                        sortKey="email"
                                                        sortConfig={userSort}
                                                        onSort={(k) => setUserSort((p) => cycleSortConfig(p, k))}
                                                    />
                                                    <SortableTh
                                                        label="Nguồn ĐN"
                                                        sortKey="auth_provider"
                                                        sortConfig={userSort}
                                                        onSort={(k) => setUserSort((p) => cycleSortConfig(p, k))}
                                                        align="center"
                                                    />
                                                    <SortableTh
                                                        label="Số đơn"
                                                        sortKey="bookings_count"
                                                        sortConfig={userSort}
                                                        onSort={(k) => setUserSort((p) => cycleSortConfig(p, k))}
                                                        align="center"
                                                    />
                                                    <SortableTh
                                                        label="Đánh giá"
                                                        sortKey="reviews_count"
                                                        sortConfig={userSort}
                                                        onSort={(k) => setUserSort((p) => cycleSortConfig(p, k))}
                                                        align="center"
                                                    />
                                                    <SortableTh
                                                        label="Vai trò"
                                                        sortKey="role"
                                                        sortConfig={userSort}
                                                        onSort={(k) => setUserSort((p) => cycleSortConfig(p, k))}
                                                    />
                                                    <SortableTh
                                                        label="Ngày tham gia"
                                                        sortKey="created_at"
                                                        sortConfig={userSort}
                                                        onSort={(k) => setUserSort((p) => cycleSortConfig(p, k))}
                                                        align="right"
                                                    />
                                                    <th className="px-3.5 py-3 text-right text-[11px] font-bold uppercase tracking-wider text-gray-500">
                                                        Thao tác
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {processedUsers.length > 0 ? (
                                                    paginate(processedUsers).map((u) => (
                                                        <tr key={u.id} className="hover:bg-amber-50/35 transition-colors">
                                                            <td className="px-3.5 py-3">
                                                                <div className="flex items-center gap-2.5">
                                                                    <AvatarBadge name={u.full_name} avatarUrl={u.avatar_url} size="sm" />
                                                                    <div>
                                                                        <p className="font-bold text-gray-900">{u.full_name}</p>
                                                                        <CopyIdButton value={u.id} displayLength={6} />
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-3.5 py-3">
                                                                <p className="font-mono text-[11px] text-gray-800">{u.email}</p>
                                                                <p className="text-[11px] text-gray-400">{u.phone_number || 'Chưa có SĐT'}</p>
                                                            </td>
                                                            <td className="px-3.5 py-3 text-center">
                                                                <span className="px-2 py-0.5 rounded bg-stone-100 text-gray-700 text-[10px] font-bold uppercase">
                                                                    {u.auth_provider || 'local'}
                                                                </span>
                                                            </td>
                                                            <td className="px-3.5 py-3 text-center font-bold text-gray-900 tabular-nums">
                                                                {u._count?.bookings ?? 0}
                                                            </td>
                                                            <td className="px-3.5 py-3 text-center font-bold text-gray-700 tabular-nums">
                                                                {u._count?.reviews ?? 0}
                                                            </td>
                                                            <td className="px-3.5 py-3">
                                                                <span
                                                                    className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                                                                        u.role === 'admin'
                                                                            ? 'bg-[#FACC15] text-black border border-amber-400'
                                                                            : 'bg-gray-100 text-gray-700'
                                                                    }`}
                                                                >
                                                                    {(u.role || 'user').toUpperCase()}
                                                                </span>
                                                            </td>
                                                            <td className="px-3.5 py-3 text-right text-[11px] text-gray-500 tabular-nums whitespace-nowrap">
                                                                {formatDate(u.created_at)}
                                                            </td>
                                                            <td className="px-3.5 py-3 text-right whitespace-nowrap">
                                                                <div className="inline-flex items-center gap-1">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setDetailUser(u)}
                                                                        className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-gray-900 hover:text-[#FACC15] text-gray-800 text-[11px] font-bold transition-colors cursor-pointer"
                                                                    >
                                                                        Hồ sơ
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setUserModalState({ open: true, item: u })}
                                                                        className="p-1.5 rounded-lg text-gray-600 hover:text-black hover:bg-gray-100 cursor-pointer"
                                                                        title="Chỉnh sửa thông tin"
                                                                    >
                                                                        <Pencil className="w-3.5 h-3.5" />
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setResetPasswordUser(u)}
                                                                        className="p-1.5 rounded-lg text-sky-600 hover:bg-sky-50 cursor-pointer"
                                                                        title="Reset mật khẩu & gửi email"
                                                                    >
                                                                        <KeyRound className="w-3.5 h-3.5" />
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => requestToggleUserRole(u)}
                                                                        className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50 cursor-pointer"
                                                                        title={u.role === 'admin' ? 'Hạ xuống User' : 'Nâng lên Admin'}
                                                                    >
                                                                        <Shield className="w-3.5 h-3.5" />
                                                                    </button>
                                                                    {adminUser?.id !== u.id && (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() =>
                                                                                requestDeleteAction({
                                                                                    title: 'Xóa Tài Khoản Thành Viên',
                                                                                    message: `Xóa vĩnh viễn tài khoản "${u.full_name}" (${u.email}) cùng dữ liệu đặt chỗ và đánh giá liên quan?`,
                                                                                    endpoint: `/api/v1/admin/users/${u.id}`,
                                                                                    successMsg: 'Đã xóa thành viên.',
                                                                                })
                                                                            }
                                                                            className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 cursor-pointer"
                                                                            title="Xóa người dùng"
                                                                        >
                                                                            <Trash2 className="w-3.5 h-3.5" />
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <EmptyTableRow
                                                        colSpan={8}
                                                        message="Không tìm thấy thành viên nào phù hợp."
                                                        onReset={resetCurrentTabFilters}
                                                    />
                                                )}
                                            </tbody>
                                        </table>
                                    </div>

                                    <PaginationBar
                                        currentPage={page}
                                        pageSize={pageSize}
                                        totalItems={processedUsers.length}
                                        onPageChange={setPage}
                                        onPageSizeChange={setPageSize}
                                    />
                                </section>
                            )}

                            {/* TAB 8: REVIEWS */}
                            {activeTab === 'reviews' && (
                                <section className="bg-white border border-gray-200/80 rounded-2xl shadow-xs p-5 space-y-4">
                                    <SearchFilterToolbar
                                        searchQuery={searchQuery}
                                        onSearchChange={handleSearchChange}
                                        placeholder="Tìm tên người đánh giá, nội dung bình luận, tên tour/khách sạn..."
                                        totalCount={reviews.length}
                                        filteredCount={processedReviews.length}
                                        activeChip={activeChip}
                                        onChipChange={handleChipChange}
                                        quickChips={[
                                            { id: 'all', label: 'Tất cả', count: reviewCounts.all },
                                            { id: 'five', label: '5 Sao', count: reviewCounts.five, tone: 'emerald' },
                                            { id: 'low', label: '≤ 3 Sao (Cần chú ý)', count: reviewCounts.low, tone: 'rose' },
                                            { id: 'tour', label: 'Tour', count: reviewCounts.tour },
                                            { id: 'hotel', label: 'Khách sạn', count: reviewCounts.hotel },
                                            { id: 'flight', label: 'Chuyến bay', count: reviewCounts.flight },
                                        ]}
                                        sortConfig={reviewSort}
                                        onClearSort={() => setReviewSort(null)}
                                        onSelectSort={setReviewSort}
                                        sortOptions={[
                                            { key: 'created_at', label: 'Ngày đánh giá' },
                                            { key: 'rating', label: 'Số sao' },
                                            { key: 'user', label: 'Người đánh giá' },
                                            { key: 'item_type', label: 'Loại dịch vụ' },
                                            { key: 'item_name', label: 'Tên dịch vụ' },
                                            { key: 'comment', label: 'Nội dung' },
                                        ]}
                                        onResetAll={resetCurrentTabFilters}
                                        onExportCsv={() =>
                                            exportToCsv(
                                                'danh-sach-danh-gia.csv',
                                                ['Người dùng', 'Email', 'Loại dịch vụ', 'Tên dịch vụ', 'Số sao', 'Bình luận', 'Ngày tạo'],
                                                processedReviews.map((r) => [
                                                    r.users?.full_name || '',
                                                    r.users?.email || '',
                                                    getItemTypeLabel(r.item_type),
                                                    itemLookup.get(`${r.item_type}:${r.item_id}`)?.title || r.item_id,
                                                    r.rating,
                                                    r.comment || '',
                                                    formatDate(r.created_at),
                                                ])
                                            )
                                        }
                                    />

                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-xs">
                                            <thead className="bg-stone-50/90 border-y border-gray-200">
                                                <tr>
                                                    <SortableTh
                                                        label="Người đánh giá"
                                                        sortKey="user"
                                                        sortConfig={reviewSort}
                                                        onSort={(k) => setReviewSort((p) => cycleSortConfig(p, k))}
                                                    />
                                                    <SortableTh
                                                        label="Loại"
                                                        sortKey="item_type"
                                                        sortConfig={reviewSort}
                                                        onSort={(k) => setReviewSort((p) => cycleSortConfig(p, k))}
                                                    />
                                                    <SortableTh
                                                        label="Dịch vụ được đánh giá"
                                                        sortKey="item_name"
                                                        sortConfig={reviewSort}
                                                        onSort={(k) => setReviewSort((p) => cycleSortConfig(p, k))}
                                                    />
                                                    <SortableTh
                                                        label="Số sao"
                                                        sortKey="rating"
                                                        sortConfig={reviewSort}
                                                        onSort={(k) => setReviewSort((p) => cycleSortConfig(p, k))}
                                                        align="center"
                                                    />
                                                    <SortableTh
                                                        label="Nhận xét"
                                                        sortKey="comment"
                                                        sortConfig={reviewSort}
                                                        onSort={(k) => setReviewSort((p) => cycleSortConfig(p, k))}
                                                    />
                                                    <SortableTh
                                                        label="Ngày gửi"
                                                        sortKey="created_at"
                                                        sortConfig={reviewSort}
                                                        onSort={(k) => setReviewSort((p) => cycleSortConfig(p, k))}
                                                        align="right"
                                                    />
                                                    <th className="px-3.5 py-3 text-right text-[11px] font-bold uppercase tracking-wider text-gray-500">
                                                        Thao tác
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {processedReviews.length > 0 ? (
                                                    paginate(processedReviews).map((r) => {
                                                        const meta = itemLookup.get(`${r.item_type}:${r.item_id}`);
                                                        return (
                                                            <tr
                                                                key={`${r.user_id}-${r.item_type}-${r.item_id}`}
                                                                className="hover:bg-amber-50/35 transition-colors"
                                                            >
                                                                <td className="px-3.5 py-3">
                                                                    <div className="flex items-center gap-2">
                                                                        <AvatarBadge
                                                                            name={r.users?.full_name}
                                                                            avatarUrl={r.users?.avatar_url}
                                                                            size="sm"
                                                                        />
                                                                        <div>
                                                                            <p className="font-bold text-gray-900">
                                                                                {r.users?.full_name || 'Người dùng'}
                                                                            </p>
                                                                            <p className="text-[11px] text-gray-400">
                                                                                {r.users?.email}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                <td className="px-3.5 py-3 whitespace-nowrap">
                                                                    <span className="px-2 py-0.5 rounded-full bg-stone-100 text-gray-700 text-[10px] font-bold">
                                                                        {getItemTypeLabel(r.item_type)}
                                                                    </span>
                                                                </td>
                                                                <td className="px-3.5 py-3 max-w-[220px]">
                                                                    <p className="font-semibold text-gray-900 truncate">
                                                                        {meta?.title || `#${r.item_id.slice(0, 8)}`}
                                                                    </p>
                                                                    {meta?.subtitle && (
                                                                        <p className="text-[11px] text-gray-500 truncate">{meta.subtitle}</p>
                                                                    )}
                                                                </td>
                                                                <td className="px-3.5 py-3 text-center whitespace-nowrap">
                                                                    <span
                                                                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-black ${
                                                                            r.rating >= 4
                                                                                ? 'bg-emerald-50 text-emerald-700'
                                                                                : r.rating === 3
                                                                                ? 'bg-amber-50 text-amber-800'
                                                                                : 'bg-rose-50 text-rose-700'
                                                                        }`}
                                                                    >
                                                                        {r.rating}
                                                                        <Star className="w-3 h-3 fill-current" />
                                                                    </span>
                                                                </td>
                                                                <td className="px-3.5 py-3 max-w-xs text-gray-700">
                                                                    <p className="line-clamp-2">{r.comment || '(Không có bình luận)'}</p>
                                                                </td>
                                                                <td className="px-3.5 py-3 text-right text-[11px] text-gray-500 tabular-nums whitespace-nowrap">
                                                                    {formatDate(r.created_at)}
                                                                </td>
                                                                <td className="px-3.5 py-3 text-right whitespace-nowrap">
                                                                    <div className="inline-flex items-center gap-1">
                                                                        {meta?.href && (
                                                                            <Link
                                                                                href={meta.href}
                                                                                target="_blank"
                                                                                className="p-1.5 rounded-lg text-gray-500 hover:text-black hover:bg-gray-100"
                                                                                title="Xem dịch vụ"
                                                                            >
                                                                                <ExternalLink className="w-3.5 h-3.5" />
                                                                            </Link>
                                                                        )}
                                                                        <button
                                                                            type="button"
                                                                            onClick={() =>
                                                                                requestDeleteAction({
                                                                                    title: 'Xóa Đánh Giá',
                                                                                    message: `Xóa đánh giá ${r.rating}★ của "${r.users?.full_name || 'người dùng'}"?`,
                                                                                    endpoint: `/api/v1/admin/reviews/${r.user_id}/${r.item_type}/${r.item_id}`,
                                                                                    successMsg: 'Đã xóa đánh giá.',
                                                                                })
                                                                            }
                                                                            className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 cursor-pointer"
                                                                            title="Xóa đánh giá"
                                                                        >
                                                                            <Trash2 className="w-3.5 h-3.5" />
                                                                        </button>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })
                                                ) : (
                                                    <EmptyTableRow
                                                        colSpan={7}
                                                        message="Không tìm thấy đánh giá nào phù hợp."
                                                        onReset={resetCurrentTabFilters}
                                                    />
                                                )}
                                            </tbody>
                                        </table>
                                    </div>

                                    <PaginationBar
                                        currentPage={page}
                                        pageSize={pageSize}
                                        totalItems={processedReviews.length}
                                        onPageChange={setPage}
                                        onPageSizeChange={setPageSize}
                                    />
                                </section>
                            )}

                            {/* TAB 9: REVENUE ANALYTICS */}
                            {activeTab === 'revenue' && (
                                <RevenueSection stats={stats} bookings={bookings} payments={payments} />
                            )}
                        </>
                    )}
                </div>
            </main>

            {/* Floating Toasts */}
            {toasts.length > 0 && (
                <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0">
                    {toasts.map((t) => (
                        <div
                            key={t.id}
                            className={`pointer-events-auto flex items-center justify-between gap-3 px-4 py-3 rounded-2xl shadow-xl border text-xs font-bold ${
                                t.type === 'success'
                                    ? 'bg-emerald-950 text-emerald-100 border-emerald-700'
                                    : t.type === 'error'
                                    ? 'bg-rose-950 text-rose-100 border-rose-700'
                                    : 'bg-gray-900 text-white border-gray-700'
                            }`}
                        >
                            <div className="flex items-center gap-2">
                                {t.type === 'success' ? (
                                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                                ) : (
                                    <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                                )}
                                <span>{t.message}</span>
                            </div>
                            <button
                                type="button"
                                onClick={() => setToasts((prev) => prev.filter((item) => item.id !== t.id))}
                                className="text-white/60 hover:text-white cursor-pointer"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Global Search Modal */}
            <GlobalSearchModal
                isOpen={isGlobalSearchOpen}
                onClose={() => setIsGlobalSearchOpen(false)}
                bookings={bookings}
                tours={tours}
                hotels={hotels}
                flights={flights}
                users={users}
                onSelectResult={(tab, query, detailTarget) => {
                    switchTab(tab, 'all', query);
                    if (detailTarget?.type === 'booking') setDetailBooking(detailTarget.item);
                    if (detailTarget?.type === 'tour') setDetailTour(detailTarget.item);
                    if (detailTarget?.type === 'hotel') setDetailHotel(detailTarget.item);
                    if (detailTarget?.type === 'user') setDetailUser(detailTarget.item);
                }}
            />

            {/* Detail Drawers */}
            <BookingDetailDrawer
                booking={detailBooking}
                itemLookup={itemLookup}
                onClose={() => setDetailBooking(null)}
                onUpdatePaymentStatus={handleUpdatePaymentStatus}
                onDeleteBooking={(b) =>
                    requestDeleteAction({
                        title: 'Xóa Đơn Đặt Chỗ',
                        message: `Xóa vĩnh viễn đơn #${b.id.slice(0, 8)}?`,
                        endpoint: `/api/v1/admin/bookings/${b.id}`,
                        successMsg: 'Đã xóa đơn đặt chỗ.',
                        afterDelete: () => setDetailBooking(null),
                    })
                }
            />

            <TourDetailDrawer
                tour={detailTour}
                onClose={() => setDetailTour(null)}
                onEditTour={(t) => setTourModalState({ open: true, item: t })}
                onRefreshAll={async () => {
                    const token = localStorage.getItem('token');
                    if (token) await loadAllAdminData(token);
                }}
                onNotify={(type, msg) => pushToast(type, msg)}
            />

            <HotelDetailDrawer
                hotel={detailHotel}
                onClose={() => setDetailHotel(null)}
                onEditHotel={(h) => setHotelModalState({ open: true, item: h })}
                onRefreshAll={async () => {
                    const token = localStorage.getItem('token');
                    if (token) await loadAllAdminData(token);
                }}
                onNotify={(type, msg) => pushToast(type, msg)}
            />

            <UserDetailDrawer
                user={detailUser}
                itemLookup={itemLookup}
                onClose={() => setDetailUser(null)}
                onEditUser={(u) => setUserModalState({ open: true, item: u })}
                onToggleRole={requestToggleUserRole}
                onResetPassword={(u) => setResetPasswordUser(u)}
            />

            {/* CRUD Modals */}
            <TourFormModal
                isOpen={tourModalState.open}
                editingTour={tourModalState.item}
                onClose={() => setTourModalState({ open: false, item: null })}
                onSuccess={async (msg) => {
                    const token = localStorage.getItem('token');
                    if (token) await loadAllAdminData(token);
                    pushToast('success', msg);
                }}
                onError={(msg) => pushToast('error', msg)}
            />

            <HotelFormModal
                isOpen={hotelModalState.open}
                editingHotel={hotelModalState.item}
                onClose={() => setHotelModalState({ open: false, item: null })}
                onSuccess={async (msg) => {
                    const token = localStorage.getItem('token');
                    if (token) await loadAllAdminData(token);
                    pushToast('success', msg);
                }}
                onError={(msg) => pushToast('error', msg)}
            />

            <FlightFormModal
                isOpen={flightModalState.open}
                editingFlight={flightModalState.item}
                planes={planes}
                onClose={() => setFlightModalState({ open: false, item: null })}
                onSuccess={async (msg) => {
                    const token = localStorage.getItem('token');
                    if (token) await loadAllAdminData(token);
                    pushToast('success', msg);
                }}
                onError={(msg) => pushToast('error', msg)}
            />

            <PlaneFormModal
                isOpen={planeModalState.open}
                editingPlane={planeModalState.item}
                onClose={() => setPlaneModalState({ open: false, item: null })}
                onSuccess={async (msg) => {
                    const token = localStorage.getItem('token');
                    if (token) await loadAllAdminData(token);
                    pushToast('success', msg);
                }}
                onError={(msg) => pushToast('error', msg)}
            />

            <UserFormModal
                isOpen={userModalState.open}
                editingUser={userModalState.item}
                onClose={() => setUserModalState({ open: false, item: null })}
                onSuccess={async (msg) => {
                    const token = localStorage.getItem('token');
                    if (token) await loadAllAdminData(token);
                    pushToast('success', msg);
                }}
                onError={(msg) => pushToast('error', msg)}
            />

            <ResetUserPasswordModal
                key={resetPasswordUser?.id || 'reset-password-modal'}
                user={resetPasswordUser}
                onClose={() => setResetPasswordUser(null)}
                onSuccess={(msg) => pushToast('success', msg)}
                onError={(msg) => pushToast('error', msg)}
            />

            <ConfirmActionModal
                isOpen={Boolean(confirmState?.open)}
                title={confirmState?.title || ''}
                message={confirmState?.message || ''}
                confirmLabel={confirmState?.confirmLabel}
                tone={confirmState?.tone}
                isSubmitting={isConfirmSubmitting}
                onCancel={() => setConfirmState(null)}
                onConfirm={handleConfirmExecute}
            />
        </div>
    );
}

'use client';

/**
 * ============================================================================
 * MODULE ADMIN DASHBOARD - NATURA TRAVEL (Cổng Quản Trị Hệ Thống Toàn Diện)
 * ============================================================================
 * Chịu trách nhiệm:
 * - Trung tâm chỉ huy (Command Center) cho Quản trị viên hệ thống Natura Travel.
 * - Thống kê KPI thời gian thực: Doanh thu, Đơn đặt chỗ, Tour, Khách sạn, Chuyến bay, Người dùng.
 * - Quản lý danh mục Tour du lịch & đợt khởi hành (Bật/tắt Thịnh hành).
 * - Quản lý danh mục Khách sạn & Resort (Xếp hạng sao, tình trạng phòng, Thịnh hành).
 * - Quản lý Chuyến bay & Đội bay.
 * - Quản lý Đơn đặt chỗ & Trạng thái thanh toán (Paid / Pending / Cancelled).
 * - Quản lý Danh sách Người dùng & Phân quyền Quản trị viên (Admin / User).
 * - Báo cáo Phân tích Doanh thu & Top sản phẩm bán chạy nhất.
 * ============================================================================
 */

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    LayoutDashboard,
    Compass,
    Building2,
    Plane,
    CalendarCheck,
    Users,
    TrendingUp,
    ShieldAlert,
    RefreshCw,
    LogOut,
    ArrowUpRight,
    CheckCircle2,
    Clock,
    XCircle,
    Search,
    Flame,
    ExternalLink,
    Filter,
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3600';

type AdminTab = 'overview' | 'bookings' | 'tours' | 'hotels' | 'flights' | 'users' | 'revenue';

interface DashboardStats {
    totalUsers: number;
    totalBookings: number;
    totalTours: number;
    totalHotels: number;
    totalFlights: number;
    totalRevenue: number;
    recentBookings: Array<{
        id: string;
        total_price: number | string;
        created_at: string;
        users?: { id: string; full_name: string; email: string };
        payments?: Array<{ payment_status: string; payment_method: string }>;
    }>;
    recentUsers: Array<{
        id: string;
        full_name: string;
        email: string;
        role: string;
        created_at: string;
    }>;
}

interface TourItem {
    id: string;
    title: string;
    destination: string | null;
    tour_type: string;
    duration: string | null;
    is_trending: boolean;
    tour_departures?: Array<{ price: number | string; discount_price?: number | string | null; available_seats: number }>;
}

interface HotelItem {
    id: string;
    name: string;
    city: string;
    star_rating: number;
    price_per_night: number | string;
    available_rooms: number;
    is_trending: boolean;
}

interface FlightItem {
    id: string;
    departure_airport: string;
    arrival_airport: string;
    departure_time: string;
    arrival_time: string;
    ticket_price: number | string;
    available_seats: number;
    plane?: { model: string; airline_name: string };
}

interface BookingItem {
    id: string;
    total_price: number | string;
    created_at: string;
    users?: { full_name: string; email: string };
    booking_items?: Array<{ item_type: string; quantity: number }>;
    payments?: Array<{ id: string; payment_status: string; payment_method: string }>;
}

interface UserItem {
    id: string;
    full_name: string;
    email: string;
    phone_number: string | null;
    role: string;
    auth_provider: string | null;
    created_at: string;
}

// (Đã thêm)
const formatCurrency = (amount: number | string | undefined | null) => {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        maximumFractionDigits: 0,
    }).format(Number(amount || 0));
};

// (Đã thêm)
const formatDate = (isoString: string | undefined | null) => {
    if (!isoString) return '--/--/----';
    try {
        return new Date(isoString).toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    } catch {
        return isoString;
    }
};

// (Đã thêm)
export default function AdminDashboardPage() {
    const router = useRouter();

    const [activeTab, setActiveTab] = useState<AdminTab>('overview');
    const [isLoading, setIsLoading] = useState(true);
    const [adminUser, setAdminUser] = useState<{ id: string; name: string; email: string; role: string } | null>(null);
    const [authError, setAuthError] = useState<string | null>(null);

    // Dữ liệu các tab
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [tours, setTours] = useState<TourItem[]>([]);
    const [hotels, setHotels] = useState<HotelItem[]>([]);
    const [flights, setFlights] = useState<FlightItem[]>([]);
    const [bookings, setBookings] = useState<BookingItem[]>([]);
    const [users, setUsers] = useState<UserItem[]>([]);
    const [actionMessage, setActionMessage] = useState<string | null>(null);

    // Bộ lọc và tìm kiếm
    const [searchQuery, setSearchQuery] = useState('');
    const [bookingStatusFilter, setBookingStatusFilter] = useState<string>('all');

    // (Đã thêm)
    // Tải thông tin phiên đăng nhập Admin
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
                setAuthError(`Tài khoản "${profile.email}" chỉ có vai trò [${profile.role}]. Cần quyền Quản trị viên (Admin) để quản lý.`);
                setIsLoading(false);
                return null;
            }
            setAdminUser({
                id: profile.id,
                name: profile.fullName || profile.full_name || profile.name || 'Admin',
                email: profile.email,
                role: profile.role,
            });
            return token;
        } catch {
            setAuthError('Không thể kết nối đến máy chủ.');
            setIsLoading(false);
            return null;
        }
    }, []);

    // (Đã thêm)
    // Tải dữ liệu tổng quan KPI
    const fetchDashboardStats = useCallback(async (token: string) => {
        try {
            const res = await fetch(`${API_URL}/api/v1/admin/dashboard/stats`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const json = await res.json();
                setStats(json.data);
            }
        } catch (err) {
            console.error('Lỗi khi tải thống kê:', err);
        }
    }, []);

    // (Đã thêm)
    // Tải danh sách Tour
    const fetchTours = useCallback(async (token: string) => {
        try {
            const res = await fetch(`${API_URL}/api/v1/admin/tours?limit=50`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const json = await res.json();
                const list = json.data?.items || json.data?.tours || (Array.isArray(json.data) ? json.data : []);
                setTours(list);
            }
        } catch (err) {
            console.error('Lỗi khi tải tours:', err);
        }
    }, []);

    // (Đã thêm)
    // Tải danh sách Khách sạn
    const fetchHotels = useCallback(async (token: string) => {
        try {
            const res = await fetch(`${API_URL}/api/v1/admin/hotels?limit=50`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const json = await res.json();
                const list = json.data?.items || json.data?.hotels || (Array.isArray(json.data) ? json.data : []);
                setHotels(list);
            }
        } catch (err) {
            console.error('Lỗi khi tải khách sạn:', err);
        }
    }, []);

    // (Đã thêm)
    // Tải danh sách Chuyến bay
    const fetchFlights = useCallback(async (token: string) => {
        try {
            const res = await fetch(`${API_URL}/api/v1/admin/flights?limit=50`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const json = await res.json();
                const list = json.data?.items || json.data?.flights || (Array.isArray(json.data) ? json.data : []);
                setFlights(list);
            }
        } catch (err) {
            console.error('Lỗi khi tải chuyến bay:', err);
        }
    }, []);

    // (Đã thêm)
    // Tải danh sách Đơn đặt chỗ
    const fetchBookings = useCallback(async (token: string) => {
        try {
            const res = await fetch(`${API_URL}/api/v1/admin/bookings?limit=50`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const json = await res.json();
                const list = json.data?.items || json.data?.bookings || (Array.isArray(json.data) ? json.data : []);
                setBookings(list);
            }
        } catch (err) {
            console.error('Lỗi khi tải đơn đặt chỗ:', err);
        }
    }, []);

    // (Đã thêm)
    // Tải danh sách Người dùng
    const fetchUsers = useCallback(async (token: string) => {
        try {
            const res = await fetch(`${API_URL}/api/v1/admin/users?limit=50`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const json = await res.json();
                const list = json.data?.items || json.data?.users || (Array.isArray(json.data) ? json.data : []);
                setUsers(list);
            }
        } catch (err) {
            console.error('Lỗi khi tải người dùng:', err);
        }
    }, []);

    // (Đã thêm)
    // Tải lại dữ liệu khi bấm nút Làm Mới
    const handleRefreshData = async () => {
        setIsLoading(true);
        setActionMessage(null);
        const token = await verifyAdminSession();
        if (token) {
            await Promise.all([
                fetchDashboardStats(token),
                fetchTours(token),
                fetchHotels(token),
                fetchFlights(token),
                fetchBookings(token),
                fetchUsers(token),
            ]);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        let isMounted = true;

        // (Đã thêm)
        const initData = async () => {
            const token = await verifyAdminSession();
            if (token && isMounted) {
                await Promise.all([
                    fetchDashboardStats(token),
                    fetchTours(token),
                    fetchHotels(token),
                    fetchFlights(token),
                    fetchBookings(token),
                    fetchUsers(token),
                ]);
            }
            if (isMounted) {
                setIsLoading(false);
            }
        };

        initData();

        return () => {
            isMounted = false;
        };
    }, [verifyAdminSession, fetchDashboardStats, fetchTours, fetchHotels, fetchFlights, fetchBookings, fetchUsers]);

    // (Đã thêm)
    // Bật/tắt trạng thái Thịnh hành của Tour
    const handleToggleTourTrending = async (tourId: string, currentTrending: boolean) => {
        const token = localStorage.getItem('token');
        if (!token) return;
        try {
            const res = await fetch(`${API_URL}/api/v1/admin/tours/${tourId}/trending`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ is_trending: !currentTrending }),
            });
            if (res.ok) {
                setTours((prev) =>
                    prev.map((t) => (t.id === tourId ? { ...t, is_trending: !currentTrending } : t))
                );
                setActionMessage(`Đã cập nhật trạng thái thịnh hành cho Tour!`);
            }
        } catch (error) {
            console.error('Lỗi khi đổi trending tour:', error);
        }
    };

    // (Đã thêm)
    // Bật/tắt trạng thái Thịnh hành của Khách sạn
    const handleToggleHotelTrending = async (hotelId: string, currentTrending: boolean) => {
        const token = localStorage.getItem('token');
        if (!token) return;
        try {
            const res = await fetch(`${API_URL}/api/v1/admin/hotels/${hotelId}/trending`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ is_trending: !currentTrending }),
            });
            if (res.ok) {
                setHotels((prev) =>
                    prev.map((h) => (h.id === hotelId ? { ...h, is_trending: !currentTrending } : h))
                );
                setActionMessage(`Đã cập nhật trạng thái thịnh hành cho Khách sạn!`);
            }
        } catch (error) {
            console.error('Lỗi khi đổi trending khách sạn:', error);
        }
    };

    // (Đã thêm)
    // Phân quyền người dùng (User <-> Admin)
    const handleToggleUserRole = async (userId: string, currentRole: string) => {
        const token = localStorage.getItem('token');
        if (!token) return;
        const newRole = currentRole === 'admin' ? 'user' : 'admin';
        if (!confirm(`Bạn có chắc chắn muốn chuyển vai trò tài khoản này thành [${newRole.toUpperCase()}] không?`)) {
            return;
        }

        try {
            const res = await fetch(`${API_URL}/api/v1/admin/users/${userId}/role`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ role: newRole }),
            });
            if (res.ok) {
                setUsers((prev) =>
                    prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
                );
                setActionMessage(`Đã cập nhật vai trò người dùng thành [${newRole.toUpperCase()}]!`);
            }
        } catch (error) {
            console.error('Lỗi khi đổi vai trò người dùng:', error);
        }
    };

    // (Đã thêm)
    // Xử lý Đăng xuất
    const handleLogout = () => {
        localStorage.removeItem('token');
        router.push('/login');
    };

    // Màn hình báo lỗi phân quyền hoặc chưa đăng nhập Admin
    if (authError && !isLoading) {
        return (
            <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center p-6">
                <div className="max-w-md w-full bg-white border-2 border-black p-8 shadow-2xl text-center">
                    <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-5">
                        <ShieldAlert className="w-8 h-8" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-red-600 block mb-2">
                        Yêu Cầu Quyền Quản Trị Viên
                    </span>
                    <h1 className="text-2xl font-black uppercase tracking-tight text-gray-900 font-serif mb-4">
                        Truy Cập Bị Giới Hạn
                    </h1>
                    <p className="text-xs text-gray-600 leading-relaxed mb-6">
                        {authError}
                    </p>
                    <div className="flex flex-col gap-3">
                        <Link
                            href="/login"
                            className="w-full bg-black text-[#FACC15] py-3 text-xs font-black uppercase tracking-widest hover:bg-gray-800 transition-colors"
                        >
                            Đăng Nhập Tài Khoản Admin
                        </Link>
                        <Link
                            href="/"
                            className="w-full border border-gray-300 text-gray-700 py-3 text-xs font-black uppercase tracking-widest hover:bg-gray-100 transition-colors"
                        >
                            Về Trang Chủ Natura Travel
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    // Lọc danh sách theo từ khóa tìm kiếm
    const filteredTours = tours.filter((t) =>
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.destination && t.destination.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const filteredHotels = hotels.filter((h) =>
        h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        h.city.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredFlights = flights.filter((f) =>
        f.departure_airport.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.arrival_airport.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredBookings = bookings.filter((b) => {
        const matchesSearch =
            b.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (b.users?.full_name && b.users.full_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (b.users?.email && b.users.email.toLowerCase().includes(searchQuery.toLowerCase()));

        if (bookingStatusFilter === 'all') return matchesSearch;
        const paymentStatus = b.payments?.[0]?.payment_status || 'pending';
        return matchesSearch && paymentStatus === bookingStatusFilter;
    });

    const filteredUsers = users.filter((u) =>
        u.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-[#FDFBF7] text-gray-900 flex flex-col md:flex-row font-sans">
            {/* =========================================================================
             * SIDEBAR NAVIGATION
             * ========================================================================= */}
            <aside className="w-full md:w-64 bg-black text-white shrink-0 flex flex-col justify-between border-r border-gray-800">
                <div>
                    {/* Header Logo */}
                    <div className="p-6 border-b border-gray-800 flex items-center justify-between">
                        <Link href="/" className="flex flex-col">
                            <span className="text-xl font-black uppercase tracking-tighter text-white">
                                NATURA TRAVEL
                            </span>
                            <span className="text-[10px] font-black uppercase tracking-widest text-[#FACC15]">
                                Admin Portal · Cổng Quản Trị
                            </span>
                        </Link>
                    </div>

                    {/* Navigation Menu */}
                    <nav className="p-4 space-y-1">
                        <button
                            type="button"
                            onClick={() => { setActiveTab('overview'); setSearchQuery(''); }}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-black uppercase tracking-wider transition-colors ${
                                activeTab === 'overview'
                                    ? 'bg-[#FACC15] text-black'
                                    : 'text-gray-400 hover:text-white hover:bg-gray-900'
                            }`}
                        >
                            <LayoutDashboard className="w-4 h-4 shrink-0" />
                            <span>Tổng Quan & KPI</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => { setActiveTab('bookings'); setSearchQuery(''); }}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-black uppercase tracking-wider transition-colors ${
                                activeTab === 'bookings'
                                    ? 'bg-[#FACC15] text-black'
                                    : 'text-gray-400 hover:text-white hover:bg-gray-900'
                            }`}
                        >
                            <CalendarCheck className="w-4 h-4 shrink-0" />
                            <span>Đơn Đặt Chỗ</span>
                            {stats && (
                                <span className="ml-auto bg-gray-800 text-gray-300 text-[10px] px-2 py-0.5 rounded">
                                    {stats.totalBookings}
                                </span>
                            )}
                        </button>

                        <button
                            type="button"
                            onClick={() => { setActiveTab('tours'); setSearchQuery(''); }}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-black uppercase tracking-wider transition-colors ${
                                activeTab === 'tours'
                                    ? 'bg-[#FACC15] text-black'
                                    : 'text-gray-400 hover:text-white hover:bg-gray-900'
                            }`}
                        >
                            <Compass className="w-4 h-4 shrink-0" />
                            <span>Tour Du Lịch</span>
                            {stats && (
                                <span className="ml-auto bg-gray-800 text-gray-300 text-[10px] px-2 py-0.5 rounded">
                                    {stats.totalTours}
                                </span>
                            )}
                        </button>

                        <button
                            type="button"
                            onClick={() => { setActiveTab('hotels'); setSearchQuery(''); }}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-black uppercase tracking-wider transition-colors ${
                                activeTab === 'hotels'
                                    ? 'bg-[#FACC15] text-black'
                                    : 'text-gray-400 hover:text-white hover:bg-gray-900'
                            }`}
                        >
                            <Building2 className="w-4 h-4 shrink-0" />
                            <span>Khách Sạn & Resort</span>
                            {stats && (
                                <span className="ml-auto bg-gray-800 text-gray-300 text-[10px] px-2 py-0.5 rounded">
                                    {stats.totalHotels}
                                </span>
                            )}
                        </button>

                        <button
                            type="button"
                            onClick={() => { setActiveTab('flights'); setSearchQuery(''); }}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-black uppercase tracking-wider transition-colors ${
                                activeTab === 'flights'
                                    ? 'bg-[#FACC15] text-black'
                                    : 'text-gray-400 hover:text-white hover:bg-gray-900'
                            }`}
                        >
                            <Plane className="w-4 h-4 shrink-0" />
                            <span>Chuyến Bay</span>
                            {stats && (
                                <span className="ml-auto bg-gray-800 text-gray-300 text-[10px] px-2 py-0.5 rounded">
                                    {stats.totalFlights}
                                </span>
                            )}
                        </button>

                        <button
                            type="button"
                            onClick={() => { setActiveTab('users'); setSearchQuery(''); }}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-black uppercase tracking-wider transition-colors ${
                                activeTab === 'users'
                                    ? 'bg-[#FACC15] text-black'
                                    : 'text-gray-400 hover:text-white hover:bg-gray-900'
                            }`}
                        >
                            <Users className="w-4 h-4 shrink-0" />
                            <span>Người Dùng</span>
                            {stats && (
                                <span className="ml-auto bg-gray-800 text-gray-300 text-[10px] px-2 py-0.5 rounded">
                                    {stats.totalUsers}
                                </span>
                            )}
                        </button>

                        <button
                            type="button"
                            onClick={() => { setActiveTab('revenue'); setSearchQuery(''); }}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-black uppercase tracking-wider transition-colors ${
                                activeTab === 'revenue'
                                    ? 'bg-[#FACC15] text-black'
                                    : 'text-gray-400 hover:text-white hover:bg-gray-900'
                            }`}
                        >
                            <TrendingUp className="w-4 h-4 shrink-0" />
                            <span>Báo Cáo Doanh Thu</span>
                        </button>
                    </nav>
                </div>

                {/* Footer User Info */}
                <div className="p-4 border-t border-gray-800 bg-gray-950">
                    <div className="flex items-center justify-between mb-3">
                        <div className="truncate">
                            <p className="text-xs font-black text-white truncate">{adminUser?.name}</p>
                            <p className="text-[10px] text-gray-400 truncate">{adminUser?.email}</p>
                        </div>
                        <span className="bg-[#FACC15] text-black text-[9px] font-black uppercase px-2 py-0.5 shrink-0">
                            ADMIN
                        </span>
                    </div>

                    <div className="flex gap-2">
                        <Link
                            href="/"
                            className="flex-1 py-2 text-center text-[10px] font-black uppercase tracking-wider border border-gray-700 text-gray-300 hover:text-white hover:border-white transition-colors"
                        >
                            Về Website
                        </Link>
                        <button
                            type="button"
                            onClick={handleLogout}
                            className="p-2 border border-gray-700 text-red-400 hover:text-red-300 hover:border-red-400 transition-colors"
                            title="Đăng xuất"
                        >
                            <LogOut className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </aside>

            {/* =========================================================================
             * MAIN CONTENT AREA
             * ========================================================================= */}
            <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
                {/* Topbar */}
                <header className="bg-white border-b border-gray-200 px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sticky top-0 z-10 shadow-sm">
                    <div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-[#B45309] block">
                            Hệ Thống Quản Trị · Natura Travel Control Panel
                        </span>
                        <h2 className="text-2xl font-black uppercase tracking-tight text-gray-900 font-serif">
                            {activeTab === 'overview' && 'Tổng Quan & Chỉ Số KPI'}
                            {activeTab === 'bookings' && 'Quản Lý Đơn Đặt Chỗ (Bookings)'}
                            {activeTab === 'tours' && 'Quản Lý Tour Du Lịch'}
                            {activeTab === 'hotels' && 'Quản Lý Khách Sạn & Resort'}
                            {activeTab === 'flights' && 'Quản Lý Lịch Trình Chuyến Bay'}
                            {activeTab === 'users' && 'Quản Lý Thành Viên & Phân Quyền'}
                            {activeTab === 'revenue' && 'Báo Cáo Phân Tích Doanh Thu'}
                        </h2>
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <button
                            type="button"
                            onClick={handleRefreshData}
                            disabled={isLoading}
                            className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 text-xs font-black uppercase tracking-wider hover:bg-gray-50 transition-colors shrink-0 disabled:opacity-50"
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                            <span className="hidden sm:inline">Làm Mới</span>
                        </button>

                        <Link
                            href="/"
                            target="_blank"
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-black text-[#FACC15] text-xs font-black uppercase tracking-wider hover:bg-gray-800 transition-colors shrink-0"
                        >
                            <ExternalLink className="w-3.5 h-3.5" /> Xem Trang Khách
                        </Link>
                    </div>
                </header>

                {/* Thông báo thao tác */}
                {actionMessage && (
                    <div className="m-6 mb-0 p-4 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold flex items-center justify-between">
                        <span>{actionMessage}</span>
                        <button
                            type="button"
                            onClick={() => setActionMessage(null)}
                            className="text-emerald-900 font-black hover:underline"
                        >
                            Đóng
                        </button>
                    </div>
                )}

                {/* Nội dung theo Tab */}
                <div className="p-6">
                    {/* =========================================================================
                     * TAB 1: OVERVIEW & KPIS
                     * ========================================================================= */}
                    {activeTab === 'overview' && (
                        <div className="space-y-8">
                            {/* KPI Metrics Cards */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                                <div className="bg-white p-5 border border-gray-200 shadow-sm flex flex-col justify-between">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                                        Tổng Doanh Thu
                                    </span>
                                    <div className="my-3">
                                        <h3 className="text-xl font-black text-black tracking-tight">
                                            {formatCurrency(stats?.totalRevenue)}
                                        </h3>
                                        <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 mt-1">
                                            <ArrowUpRight className="w-3 h-3" /> Đã quyết toán
                                        </span>
                                    </div>
                                    <div className="h-1 bg-amber-400 w-full" />
                                </div>

                                <div className="bg-white p-5 border border-gray-200 shadow-sm flex flex-col justify-between">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                                        Tổng Đơn Đặt Chỗ
                                    </span>
                                    <div className="my-3">
                                        <h3 className="text-2xl font-black text-black tracking-tight">
                                            {stats?.totalBookings ?? 0}
                                        </h3>
                                        <span className="text-[10px] text-gray-500 font-medium">Toàn hệ thống</span>
                                    </div>
                                    <div className="h-1 bg-black w-full" />
                                </div>

                                <div className="bg-white p-5 border border-gray-200 shadow-sm flex flex-col justify-between">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                                        Tour Du Lịch
                                    </span>
                                    <div className="my-3">
                                        <h3 className="text-2xl font-black text-black tracking-tight">
                                            {stats?.totalTours ?? 0}
                                        </h3>
                                        <span className="text-[10px] text-gray-500 font-medium">Đang mở bán</span>
                                    </div>
                                    <div className="h-1 bg-blue-600 w-full" />
                                </div>

                                <div className="bg-white p-5 border border-gray-200 shadow-sm flex flex-col justify-between">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                                        Khách Sạn & Resort
                                    </span>
                                    <div className="my-3">
                                        <h3 className="text-2xl font-black text-black tracking-tight">
                                            {stats?.totalHotels ?? 0}
                                        </h3>
                                        <span className="text-[10px] text-gray-500 font-medium">Đối tác lưu trú</span>
                                    </div>
                                    <div className="h-1 bg-emerald-600 w-full" />
                                </div>

                                <div className="bg-white p-5 border border-gray-200 shadow-sm flex flex-col justify-between">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                                        Chuyến Bay
                                    </span>
                                    <div className="my-3">
                                        <h3 className="text-2xl font-black text-black tracking-tight">
                                            {stats?.totalFlights ?? 0}
                                        </h3>
                                        <span className="text-[10px] text-gray-500 font-medium">Chặng bay nội địa</span>
                                    </div>
                                    <div className="h-1 bg-purple-600 w-full" />
                                </div>

                                <div className="bg-white p-5 border border-gray-200 shadow-sm flex flex-col justify-between">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                                        Thành Viên
                                    </span>
                                    <div className="my-3">
                                        <h3 className="text-2xl font-black text-black tracking-tight">
                                            {stats?.totalUsers ?? 0}
                                        </h3>
                                        <span className="text-[10px] text-gray-500 font-medium">Tài khoản đăng ký</span>
                                    </div>
                                    <div className="h-1 bg-rose-600 w-full" />
                                </div>
                            </div>

                            {/* 2 Bảng hiển thị gần đây */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {/* Đơn hàng gần đây */}
                                <div className="bg-white border border-gray-200 p-6 shadow-sm">
                                    <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-3">
                                        <div>
                                            <h3 className="text-base font-black uppercase tracking-tight text-gray-900">
                                                Đơn Đặt Chỗ Gần Đây
                                            </h3>
                                            <p className="text-[11px] text-gray-500">5 giao dịch mới nhất trên hệ thống</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setActiveTab('bookings')}
                                            className="text-xs font-black uppercase tracking-wider text-black hover:underline"
                                        >
                                            Xem tất cả →
                                        </button>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-xs">
                                            <thead>
                                                <tr className="border-b border-gray-200 text-gray-400 font-black uppercase text-[10px]">
                                                    <th className="py-2">Khách hàng</th>
                                                    <th className="py-2">Số tiền</th>
                                                    <th className="py-2">Trạng thái</th>
                                                    <th className="py-2 text-right">Ngày đặt</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100 font-semibold">
                                                {stats?.recentBookings && stats.recentBookings.length > 0 ? (
                                                    stats.recentBookings.map((b) => {
                                                        const status = b.payments?.[0]?.payment_status || 'pending';
                                                        return (
                                                            <tr key={b.id} className="hover:bg-gray-50">
                                                                <td className="py-3">
                                                                    <p className="font-bold text-gray-900">{b.users?.full_name || 'Khách vãng lai'}</p>
                                                                    <p className="text-[10px] text-gray-400">{b.users?.email || b.id.slice(0, 8)}</p>
                                                                </td>
                                                                <td className="py-3 font-bold text-black">
                                                                    {formatCurrency(b.total_price)}
                                                                </td>
                                                                <td className="py-3">
                                                                    {status === 'paid' ? (
                                                                        <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-emerald-700 bg-emerald-50 px-2 py-0.5 border border-emerald-200">
                                                                            <CheckCircle2 className="w-3 h-3" /> Đã trả
                                                                        </span>
                                                                    ) : (
                                                                        <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-amber-700 bg-amber-50 px-2 py-0.5 border border-amber-200">
                                                                            <Clock className="w-3 h-3" /> Chờ TT
                                                                        </span>
                                                                    )}
                                                                </td>
                                                                <td className="py-3 text-right text-gray-500 text-[11px]">
                                                                    {formatDate(b.created_at)}
                                                                </td>
                                                            </tr>
                                                        );
                                                    })
                                                ) : (
                                                    <tr>
                                                        <td colSpan={4} className="py-6 text-center text-gray-400 italic">
                                                            Chưa có đơn đặt chỗ nào
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Người dùng mới */}
                                <div className="bg-white border border-gray-200 p-6 shadow-sm">
                                    <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-3">
                                        <div>
                                            <h3 className="text-base font-black uppercase tracking-tight text-gray-900">
                                                Thành Viên Mới Đăng Ký
                                            </h3>
                                            <p className="text-[11px] text-gray-500">5 tài khoản kích hoạt mới nhất</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setActiveTab('users')}
                                            className="text-xs font-black uppercase tracking-wider text-black hover:underline"
                                        >
                                            Xem tất cả →
                                        </button>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-xs">
                                            <thead>
                                                <tr className="border-b border-gray-200 text-gray-400 font-black uppercase text-[10px]">
                                                    <th className="py-2">Họ & Tên</th>
                                                    <th className="py-2">Email</th>
                                                    <th className="py-2">Vai trò</th>
                                                    <th className="py-2 text-right">Ngày tham gia</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100 font-semibold">
                                                {stats?.recentUsers && stats.recentUsers.length > 0 ? (
                                                    stats.recentUsers.map((u) => (
                                                        <tr key={u.id} className="hover:bg-gray-50">
                                                            <td className="py-3 font-bold text-gray-900">{u.full_name}</td>
                                                            <td className="py-3 text-gray-600 text-[11px]">{u.email}</td>
                                                            <td className="py-3">
                                                                <span
                                                                    className={`text-[9px] font-black uppercase px-2 py-0.5 ${
                                                                        u.role === 'admin'
                                                                            ? 'bg-[#FACC15] text-black'
                                                                            : 'bg-gray-100 text-gray-600'
                                                                    }`}
                                                                >
                                                                    {u.role}
                                                                </span>
                                                            </td>
                                                            <td className="py-3 text-right text-gray-500 text-[11px]">
                                                                {formatDate(u.created_at)}
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan={4} className="py-6 text-center text-gray-400 italic">
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
                    )}

                    {/* =========================================================================
                     * TAB 2: BOOKINGS MANAGEMENT
                     * ========================================================================= */}
                    {activeTab === 'bookings' && (
                        <div className="bg-white border border-gray-200 shadow-sm p-6 space-y-6">
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                                <div className="relative w-full sm:w-80">
                                    <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Tìm mã đơn, tên khách, email..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-9 pr-4 py-2 border border-gray-200 text-xs font-semibold focus:outline-none focus:border-black"
                                    />
                                </div>

                                <div className="flex items-center gap-2 w-full sm:w-auto">
                                    <Filter className="w-4 h-4 text-gray-500 shrink-0" />
                                    <select
                                        value={bookingStatusFilter}
                                        onChange={(e) => setBookingStatusFilter(e.target.value)}
                                        className="border border-gray-200 px-3 py-2 text-xs font-bold uppercase focus:outline-none focus:border-black"
                                    >
                                        <option value="all">Tất cả trạng thái</option>
                                        <option value="paid">Đã thanh toán (Paid)</option>
                                        <option value="pending">Chờ thanh toán (Pending)</option>
                                        <option value="cancelled">Đã hủy (Cancelled)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs border border-gray-100">
                                    <thead className="bg-gray-50 text-gray-500 font-black uppercase text-[10px] border-b border-gray-200">
                                        <tr>
                                            <th className="p-3">Mã đơn</th>
                                            <th className="p-3">Khách hàng</th>
                                            <th className="p-3">Tổng thanh toán</th>
                                            <th className="p-3">Phương thức</th>
                                            <th className="p-3">Trạng thái</th>
                                            <th className="p-3">Ngày tạo</th>
                                            <th className="p-3 text-right">Chi tiết</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 font-semibold">
                                        {filteredBookings.length > 0 ? (
                                            filteredBookings.map((b) => {
                                                const payment = b.payments?.[0];
                                                const status = payment?.payment_status || 'pending';
                                                return (
                                                    <tr key={b.id} className="hover:bg-gray-50">
                                                        <td className="p-3 font-mono font-bold text-gray-900">
                                                            {b.id.slice(0, 8)}...
                                                        </td>
                                                        <td className="p-3">
                                                            <p className="font-bold text-gray-900">{b.users?.full_name || 'N/A'}</p>
                                                            <p className="text-[10px] text-gray-400">{b.users?.email}</p>
                                                        </td>
                                                        <td className="p-3 font-black text-black">
                                                            {formatCurrency(b.total_price)}
                                                        </td>
                                                        <td className="p-3 uppercase text-[10px] font-bold text-gray-600">
                                                            {payment?.payment_method || 'VietQR'}
                                                        </td>
                                                        <td className="p-3">
                                                            {status === 'paid' ? (
                                                                <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-emerald-700 bg-emerald-50 px-2 py-0.5 border border-emerald-200">
                                                                    <CheckCircle2 className="w-3 h-3" /> Đã thanh toán
                                                                </span>
                                                            ) : status === 'cancelled' ? (
                                                                <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-red-700 bg-red-50 px-2 py-0.5 border border-red-200">
                                                                    <XCircle className="w-3 h-3" /> Đã hủy
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-amber-700 bg-amber-50 px-2 py-0.5 border border-amber-200">
                                                                    <Clock className="w-3 h-3" /> Chờ xử lý
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="p-3 text-gray-500 text-[11px]">
                                                            {formatDate(b.created_at)}
                                                        </td>
                                                        <td className="p-3 text-right">
                                                            <Link
                                                                href={`/bookings/${b.id}`}
                                                                target="_blank"
                                                                className="text-black font-black hover:underline uppercase text-[10px]"
                                                            >
                                                                Xem vé →
                                                            </Link>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        ) : (
                                            <tr>
                                                <td colSpan={7} className="p-8 text-center text-gray-400 italic">
                                                    Không tìm thấy đơn đặt chỗ nào phù hợp.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* =========================================================================
                     * TAB 3: TOURS MANAGEMENT
                     * ========================================================================= */}
                    {activeTab === 'tours' && (
                        <div className="bg-white border border-gray-200 shadow-sm p-6 space-y-6">
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                                <div className="relative w-full sm:w-80">
                                    <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Tìm tour theo tên, điểm đến..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-9 pr-4 py-2 border border-gray-200 text-xs font-semibold focus:outline-none focus:border-black"
                                    />
                                </div>
                                <span className="text-xs text-gray-500 font-bold uppercase">
                                    Tìm thấy {filteredTours.length} tour
                                </span>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs border border-gray-100">
                                    <thead className="bg-gray-50 text-gray-500 font-black uppercase text-[10px] border-b border-gray-200">
                                        <tr>
                                            <th className="p-3">Tên Tour</th>
                                            <th className="p-3">Điểm đến</th>
                                            <th className="p-3">Thời lượng</th>
                                            <th className="p-3">Đơn giá</th>
                                            <th className="p-3">Số chỗ trống</th>
                                            <th className="p-3 text-center">Thịnh hành (Trending)</th>
                                            <th className="p-3 text-right">Xem</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 font-semibold">
                                        {filteredTours.length > 0 ? (
                                            filteredTours.map((t) => {
                                                const dep = t.tour_departures?.[0];
                                                return (
                                                    <tr key={t.id} className="hover:bg-gray-50">
                                                        <td className="p-3 font-bold text-gray-900 max-w-xs truncate">
                                                            {t.title}
                                                        </td>
                                                        <td className="p-3 text-gray-600">{t.destination || 'N/A'}</td>
                                                        <td className="p-3 text-gray-600">{t.duration || 'N/A'}</td>
                                                        <td className="p-3 font-black text-black">
                                                            {dep ? formatCurrency(dep.discount_price ?? dep.price) : 'N/A'}
                                                        </td>
                                                        <td className="p-3 font-bold text-gray-700">
                                                            {dep ? `${dep.available_seats} chỗ` : 'Hết chỗ'}
                                                        </td>
                                                        <td className="p-3 text-center">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleToggleTourTrending(t.id, t.is_trending)}
                                                                className={`inline-flex items-center gap-1 px-3 py-1 text-[10px] font-black uppercase transition-colors ${
                                                                    t.is_trending
                                                                        ? 'bg-[#FACC15] text-black hover:bg-yellow-400'
                                                                        : 'bg-gray-100 text-gray-400 hover:text-black'
                                                                }`}
                                                            >
                                                                <Flame className="w-3 h-3" />
                                                                {t.is_trending ? 'Thịnh hành' : 'Thường'}
                                                            </button>
                                                        </td>
                                                        <td className="p-3 text-right">
                                                            <Link
                                                                href={`/tours/${t.id}`}
                                                                target="_blank"
                                                                className="text-black font-black hover:underline uppercase text-[10px]"
                                                            >
                                                                Chi tiết →
                                                            </Link>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        ) : (
                                            <tr>
                                                <td colSpan={7} className="p-8 text-center text-gray-400 italic">
                                                    Không tìm thấy tour nào phù hợp.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* =========================================================================
                     * TAB 4: HOTELS MANAGEMENT
                     * ========================================================================= */}
                    {activeTab === 'hotels' && (
                        <div className="bg-white border border-gray-200 shadow-sm p-6 space-y-6">
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                                <div className="relative w-full sm:w-80">
                                    <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Tìm tên khách sạn, thành phố..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-9 pr-4 py-2 border border-gray-200 text-xs font-semibold focus:outline-none focus:border-black"
                                    />
                                </div>
                                <span className="text-xs text-gray-500 font-bold uppercase">
                                    Tìm thấy {filteredHotels.length} khách sạn
                                </span>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs border border-gray-100">
                                    <thead className="bg-gray-50 text-gray-500 font-black uppercase text-[10px] border-b border-gray-200">
                                        <tr>
                                            <th className="p-3">Khách Sạn & Resort</th>
                                            <th className="p-3">Thành phố</th>
                                            <th className="p-3">Xếp hạng</th>
                                            <th className="p-3">Giá mỗi đêm</th>
                                            <th className="p-3">Phòng khả dụng</th>
                                            <th className="p-3 text-center">Thịnh hành</th>
                                            <th className="p-3 text-right">Xem</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 font-semibold">
                                        {filteredHotels.length > 0 ? (
                                            filteredHotels.map((h) => (
                                                <tr key={h.id} className="hover:bg-gray-50">
                                                    <td className="p-3 font-bold text-gray-900">{h.name}</td>
                                                    <td className="p-3 text-gray-600">{h.city}</td>
                                                    <td className="p-3 text-amber-500 font-bold">{h.star_rating} ⭐</td>
                                                    <td className="p-3 font-black text-black">{formatCurrency(h.price_per_night)}</td>
                                                    <td className="p-3 font-bold text-gray-700">{h.available_rooms} phòng</td>
                                                    <td className="p-3 text-center">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleToggleHotelTrending(h.id, h.is_trending)}
                                                            className={`inline-flex items-center gap-1 px-3 py-1 text-[10px] font-black uppercase transition-colors ${
                                                                h.is_trending
                                                                    ? 'bg-[#FACC15] text-black hover:bg-yellow-400'
                                                                    : 'bg-gray-100 text-gray-400 hover:text-black'
                                                            }`}
                                                        >
                                                            <Flame className="w-3 h-3" />
                                                            {h.is_trending ? 'Thịnh hành' : 'Thường'}
                                                        </button>
                                                    </td>
                                                    <td className="p-3 text-right">
                                                        <Link
                                                            href={`/hotels/${h.id}`}
                                                            target="_blank"
                                                            className="text-black font-black hover:underline uppercase text-[10px]"
                                                        >
                                                            Chi tiết →
                                                        </Link>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={7} className="p-8 text-center text-gray-400 italic">
                                                    Không tìm thấy khách sạn nào.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* =========================================================================
                     * TAB 5: FLIGHTS MANAGEMENT
                     * ========================================================================= */}
                    {activeTab === 'flights' && (
                        <div className="bg-white border border-gray-200 shadow-sm p-6 space-y-6">
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                                <div className="relative w-full sm:w-80">
                                    <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Tìm sân bay đi, sân bay đến..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-9 pr-4 py-2 border border-gray-200 text-xs font-semibold focus:outline-none focus:border-black"
                                    />
                                </div>
                                <span className="text-xs text-gray-500 font-bold uppercase">
                                    Tìm thấy {filteredFlights.length} chuyến bay
                                </span>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs border border-gray-100">
                                    <thead className="bg-gray-50 text-gray-500 font-black uppercase text-[10px] border-b border-gray-200">
                                        <tr>
                                            <th className="p-3">Hãng hàng không / Máy bay</th>
                                            <th className="p-3">Chặng bay</th>
                                            <th className="p-3">Giờ cất cánh</th>
                                            <th className="p-3">Giờ hạ cánh</th>
                                            <th className="p-3">Giá vé</th>
                                            <th className="p-3">Ghế trống</th>
                                            <th className="p-3 text-right">Xem</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 font-semibold">
                                        {filteredFlights.length > 0 ? (
                                            filteredFlights.map((f) => (
                                                <tr key={f.id} className="hover:bg-gray-50">
                                                    <td className="p-3">
                                                        <p className="font-bold text-gray-900">{f.plane?.airline_name || 'Vietnam Airlines'}</p>
                                                        <p className="text-[10px] text-gray-400 font-mono">{f.plane?.model || 'Airbus A321'}</p>
                                                    </td>
                                                    <td className="p-3 font-black text-black">
                                                        {f.departure_airport} → {f.arrival_airport}
                                                    </td>
                                                    <td className="p-3 text-gray-600 text-[11px]">{formatDate(f.departure_time)}</td>
                                                    <td className="p-3 text-gray-600 text-[11px]">{formatDate(f.arrival_time)}</td>
                                                    <td className="p-3 font-black text-black">{formatCurrency(f.ticket_price)}</td>
                                                    <td className="p-3 font-bold text-gray-700">{f.available_seats} ghế</td>
                                                    <td className="p-3 text-right">
                                                        <Link
                                                            href={`/flights/${f.id}`}
                                                            target="_blank"
                                                            className="text-black font-black hover:underline uppercase text-[10px]"
                                                        >
                                                            Vé điện tử →
                                                        </Link>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={7} className="p-8 text-center text-gray-400 italic">
                                                    Không tìm thấy chuyến bay nào.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* =========================================================================
                     * TAB 6: USERS MANAGEMENT
                     * ========================================================================= */}
                    {activeTab === 'users' && (
                        <div className="bg-white border border-gray-200 shadow-sm p-6 space-y-6">
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                                <div className="relative w-full sm:w-80">
                                    <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Tìm tên thành viên, email..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-9 pr-4 py-2 border border-gray-200 text-xs font-semibold focus:outline-none focus:border-black"
                                    />
                                </div>
                                <span className="text-xs text-gray-500 font-bold uppercase">
                                    Tổng cộng {filteredUsers.length} tài khoản
                                </span>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs border border-gray-100">
                                    <thead className="bg-gray-50 text-gray-500 font-black uppercase text-[10px] border-b border-gray-200">
                                        <tr>
                                            <th className="p-3">Họ & Tên</th>
                                            <th className="p-3">Địa chỉ Email</th>
                                            <th className="p-3">Số điện thoại</th>
                                            <th className="p-3">Vai trò hiện tại</th>
                                            <th className="p-3">Ngày tạo</th>
                                            <th className="p-3 text-right">Thao tác phân quyền</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 font-semibold">
                                        {filteredUsers.length > 0 ? (
                                            filteredUsers.map((u) => (
                                                <tr key={u.id} className="hover:bg-gray-50">
                                                    <td className="p-3 font-bold text-gray-900">{u.full_name}</td>
                                                    <td className="p-3 text-gray-600 font-mono text-[11px]">{u.email}</td>
                                                    <td className="p-3 text-gray-600">{u.phone_number || '--'}</td>
                                                    <td className="p-3">
                                                        <span
                                                            className={`text-[10px] font-black uppercase px-2.5 py-1 ${
                                                                u.role === 'admin'
                                                                    ? 'bg-[#FACC15] text-black border border-yellow-500'
                                                                    : 'bg-gray-100 text-gray-700'
                                                            }`}
                                                        >
                                                            {u.role.toUpperCase()}
                                                        </span>
                                                    </td>
                                                    <td className="p-3 text-gray-500 text-[11px]">{formatDate(u.created_at)}</td>
                                                    <td className="p-3 text-right">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleToggleUserRole(u.id, u.role)}
                                                            className="text-xs font-black uppercase tracking-wider text-black hover:underline"
                                                        >
                                                            {u.role === 'admin' ? 'Hạ xuống User' : 'Nâng lên Admin'}
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={6} className="p-8 text-center text-gray-400 italic">
                                                    Không tìm thấy người dùng nào.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* =========================================================================
                     * TAB 7: REVENUE ANALYTICS
                     * ========================================================================= */}
                    {activeTab === 'revenue' && (
                        <div className="bg-white border border-gray-200 shadow-sm p-8 space-y-8">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
                                <div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-[#B45309]">
                                        Tài Chính & Doanh Thu
                                    </span>
                                    <h3 className="text-xl font-black uppercase tracking-tight text-gray-900">
                                        Báo Cáo Tình Hình Kinh Doanh
                                    </h3>
                                </div>
                                <div className="text-right">
                                    <span className="text-xs text-gray-500 block">Tổng doanh thu thực nhận</span>
                                    <strong className="text-2xl font-black text-black">
                                        {formatCurrency(stats?.totalRevenue)}
                                    </strong>
                                </div>
                            </div>

                            {/* Tỷ trọng doanh thu theo mảng */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                                <div className="p-6 border border-gray-200 bg-gray-50">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs font-black uppercase tracking-wider text-gray-600">
                                            Tour Du Lịch
                                        </span>
                                        <Compass className="w-5 h-5 text-black" />
                                    </div>
                                    <p className="text-2xl font-black text-black">~65%</p>
                                    <p className="text-[11px] text-gray-500 mt-1">Đóng góp doanh thu lớn nhất</p>
                                </div>

                                <div className="p-6 border border-gray-200 bg-gray-50">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs font-black uppercase tracking-wider text-gray-600">
                                            Khách Sạn & Combo
                                        </span>
                                        <Building2 className="w-5 h-5 text-black" />
                                    </div>
                                    <p className="text-2xl font-black text-black">~25%</p>
                                    <p className="text-[11px] text-gray-500 mt-1">Gia tăng mạnh trong mùa cao điểm</p>
                                </div>

                                <div className="p-6 border border-gray-200 bg-gray-50">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs font-black uppercase tracking-wider text-gray-600">
                                            Vé Máy Bay
                                        </span>
                                        <Plane className="w-5 h-5 text-black" />
                                    </div>
                                    <p className="text-2xl font-black text-black">~10%</p>
                                    <p className="text-[11px] text-gray-500 mt-1">Dịch vụ bổ trợ liên kết</p>
                                </div>
                            </div>

                            {/* Hướng dẫn xuất đối soát */}
                            <div className="p-6 bg-yellow-50 border border-yellow-200 text-yellow-900 text-xs leading-relaxed">
                                <p className="font-bold mb-1">💡 Ghi chú đối soát ngân hàng:</p>
                                <p>
                                    Hệ thống Natura Travel tự động đối chiếu thanh toán qua Webhook VietQR (Napas 247) và Ví MoMo. Các giao dịch hợp lệ được chuyển sang trạng thái <strong>PAID</strong> ngay lập tức mà không cần xác nhận thủ công từ nhân viên trực ca.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

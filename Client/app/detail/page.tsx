'use client';

/**
 * ============================================================================
 * MODULE DETAIL - USER PROFILE PAGE (Trang Hồ Sơ & Hành Trình Cá Nhân)
 * ============================================================================
 * Chịu trách nhiệm:
 * - Quản lý thông tin tài khoản người dùng: Họ tên, số điện thoại, ảnh đại diện avatar.
 * - Cho phép đổi mật khẩu với xác nhận tính toàn vẹn.
 * - Quản lý hành trình sắp tới & đã qua (Itinerary) và danh sách địa điểm yêu thích (Favorites).
 * - Kết nối API: GET/PUT /api/v1/users/profile, PATCH /api/v1/users/change-password, GET /api/v1/users/itinerary
 * ============================================================================
 */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    User,
    KeyRound,
    Compass,
    Heart,
    Calendar,
    Save,
    CheckCircle2,
    AlertCircle,
    ArrowRight,
    LogOut,
    FileText,
} from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { setProfile, clearProfile } from '@/redux/userSlice';
import type { RootState } from '@/redux/store';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3600';

interface ItineraryItem {
    id: string;
    item_type: string;
    item_id: string;
    quantity: number;
    check_in?: string | null;
    check_out?: string | null;
}

interface ItineraryData {
    upcoming?: Array<{
        id: string;
        created_at: string;
        total_price: number;
        booking_items: ItineraryItem[];
    }>;
    past?: Array<{
        id: string;
        created_at: string;
        total_price: number;
        booking_items: ItineraryItem[];
    }>;
}

interface FavoriteItem {
    id?: string;
    item_type: string;
    item_id: string;
    title?: string;
    created_at?: string;
}

// (Đã thêm)
const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        maximumFractionDigits: 0,
    }).format(amount);
};

// (Đã thêm)
export default function UserDetailPage() {
    const router = useRouter();
    const dispatch = useDispatch();
    const reduxUser = useSelector((state: RootState) => state.user.profile);

    const [activeTab, setActiveTab] = useState<'profile' | 'password' | 'itinerary' | 'favorites'>('profile');

    // Profile form state
    const [fullName, setFullName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [avatarUrl, setAvatarUrl] = useState('');
    const [email, setEmail] = useState('');
    const [role, setRole] = useState('Khách hàng thân thiết');

    // Password form state
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // Itinerary & Favorites state
    const [itinerary, setItinerary] = useState<ItineraryData | null>(null);
    const [favorites, setFavorites] = useState<FavoriteItem[]>([]);

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        let isCancelled = false;

        // (Đã thêm)
        const loadUserData = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                router.push('/login?next=/detail');
                return;
            }

            try {
                const [profileRes, itineraryRes, favoritesRes] = await Promise.all([
                    fetch(`${API_URL}/api/v1/users/profile`, {
                        headers: { Authorization: `Bearer ${token}` },
                    }),
                    fetch(`${API_URL}/api/v1/users/itinerary`, {
                        headers: { Authorization: `Bearer ${token}` },
                    }),
                    fetch(`${API_URL}/api/v1/users/favorites`, {
                        headers: { Authorization: `Bearer ${token}` },
                    }),
                ]);

                if (profileRes.status === 401) {
                    localStorage.removeItem('token');
                    dispatch(clearProfile());
                    router.push('/login?next=/detail');
                    return;
                }

                if (profileRes.ok) {
                    const profileData = await profileRes.json();
                    const u = profileData.user;
                    if (u && !isCancelled) {
                        setFullName(u.full_name || u.fullName || u.name || '');
                        setPhoneNumber(u.phone_number || u.phoneNumber || '');
                        setAvatarUrl(u.avatar_url || u.avatarUrl || u.avatar || '');
                        setEmail(u.email || '');
                        setRole(u.role || 'Khách hàng thân thiết');
                        dispatch(setProfile(u));
                    }
                }

                if (itineraryRes.ok) {
                    const itinData = await itineraryRes.json();
                    if (!isCancelled) {
                        const d = itinData.data;
                        setItinerary(d ? {
                            upcoming: d.upcoming || d.upcomingTrips || [],
                            past: d.past || d.pastTrips || [],
                        } : null);
                    }
                }

                if (favoritesRes.ok) {
                    const favData = await favoritesRes.json();
                    if (!isCancelled) setFavorites(favData.data || []);
                }
            } catch (err) {
                console.error('Lỗi khi tải thông tin cá nhân:', err);
            } finally {
                if (!isCancelled) {
                    setIsLoading(false);
                }
            }
        };

        loadUserData();

        return () => {
            isCancelled = true;
        };
    }, [dispatch, router]);

    // (Đã thêm)
    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            setIsSaving(true);
            setFeedbackMessage(null);

            const res = await fetch(`${API_URL}/api/v1/users/profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    full_name: fullName,
                    phone_number: phoneNumber,
                    avatar_url: avatarUrl,
                }),
            });

            const data = await res.json();
            if (res.ok && data.status === 'success') {
                dispatch(setProfile(data.user));
                setFeedbackMessage({ type: 'success', text: 'Cập nhật thông tin thành công!' });
            } else {
                setFeedbackMessage({ type: 'error', text: data.message || 'Cập nhật thất bại' });
            }
        } catch {
            setFeedbackMessage({ type: 'error', text: 'Lỗi kết nối máy chủ' });
        } finally {
            setIsSaving(false);
        }
    };

    // (Đã thêm)
    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setFeedbackMessage(null);

        if (newPassword !== confirmPassword) {
            setFeedbackMessage({ type: 'error', text: 'Mật khẩu xác nhận không trùng khớp' });
            return;
        }

        if (newPassword.length < 6) {
            setFeedbackMessage({ type: 'error', text: 'Mật khẩu mới phải có ít nhất 6 ký tự' });
            return;
        }

        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            setIsSaving(true);
            const res = await fetch(`${API_URL}/api/v1/users/change-password`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    old_password: oldPassword,
                    new_password: newPassword,
                }),
            });

            const data = await res.json();
            if (res.ok && data.status === 'success') {
                setFeedbackMessage({ type: 'success', text: 'Đổi mật khẩu thành công!' });
                setOldPassword('');
                setNewPassword('');
                setConfirmPassword('');
            } else {
                setFeedbackMessage({ type: 'error', text: data.message || 'Đổi mật khẩu thất bại' });
            }
        } catch {
            setFeedbackMessage({ type: 'error', text: 'Lỗi kết nối máy chủ' });
        } finally {
            setIsSaving(false);
        }
    };

    // (Đã thêm)
    const handleLogout = () => {
        localStorage.removeItem('token');
        dispatch(clearProfile());
        router.push('/');
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center py-20">
                <div className="text-center">
                    <div className="w-10 h-10 border-4 border-black border-t-[#FACC15] rounded-full animate-spin mx-auto mb-3"></div>
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-500">Đang tải hồ sơ của bạn...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FDFBF7] text-gray-900 pb-24">
            {/* Header Banner */}
            <div className="bg-[#0f141e] text-white py-12 px-6 lg:px-12 border-b border-gray-800">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-[#FACC15] text-black flex items-center justify-center font-black text-xl border-2 border-white shrink-0">
                            {avatarUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={avatarUrl}
                                    alt={fullName}
                                    className="w-full h-full rounded-full object-cover"
                                />
                            ) : (
                                fullName.slice(0, 1).toUpperCase() || 'U'
                            )}
                        </div>
                        <div>
                            <span className="text-xs font-black uppercase tracking-widest text-[#FACC15] block mb-1">
                                Tài Khoản Thành Viên
                            </span>
                            <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-white font-serif">
                                {fullName || reduxUser?.email || 'Natura Traveler'}
                            </h1>
                            <p className="text-xs text-gray-400 mt-0.5">
                                {email} · Hạng: <span className="text-yellow-400 font-bold">{role}</span>
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Link
                            href="/bookings"
                            className="bg-black text-[#FACC15] border border-gray-700 hover:border-white py-2.5 px-4 text-xs font-black uppercase tracking-widest transition-colors flex items-center gap-1.5"
                        >
                            <FileText className="w-4 h-4" /> Quản Lý Đơn Hàng
                        </Link>
                        <button
                            type="button"
                            onClick={handleLogout}
                            className="border border-red-500/50 text-red-400 hover:bg-red-500/10 py-2.5 px-4 text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5"
                        >
                            <LogOut className="w-4 h-4" /> Đăng Xuất
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Tabs Layout */}
            <div className="max-w-7xl mx-auto px-6 lg:px-12 pt-8">
                {feedbackMessage && (
                    <div
                        className={`mb-6 p-4 text-xs font-bold flex items-center gap-2 ${
                            feedbackMessage.type === 'success'
                                ? 'bg-emerald-50 border border-emerald-300 text-emerald-800'
                                : 'bg-red-50 border border-red-300 text-red-800'
                        }`}
                    >
                        {feedbackMessage.type === 'success' ? (
                            <CheckCircle2 className="w-4 h-4 shrink-0" />
                        ) : (
                            <AlertCircle className="w-4 h-4 shrink-0" />
                        )}
                        <span>{feedbackMessage.text}</span>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Sidebar Tabs */}
                    <div className="lg:col-span-1 space-y-1">
                        <button
                            type="button"
                            onClick={() => { setActiveTab('profile'); setFeedbackMessage(null); }}
                            className={`w-full text-left px-4 py-3 text-xs font-black uppercase tracking-wider transition-all flex items-center gap-3 border ${
                                activeTab === 'profile'
                                    ? 'bg-black text-[#FACC15] border-black shadow'
                                    : 'bg-white text-gray-700 border-gray-200 hover:border-black'
                            }`}
                        >
                            <User className="w-4 h-4" /> Hồ Sơ Cá Nhân
                        </button>

                        <button
                            type="button"
                            onClick={() => { setActiveTab('password'); setFeedbackMessage(null); }}
                            className={`w-full text-left px-4 py-3 text-xs font-black uppercase tracking-wider transition-all flex items-center gap-3 border ${
                                activeTab === 'password'
                                    ? 'bg-black text-[#FACC15] border-black shadow'
                                    : 'bg-white text-gray-700 border-gray-200 hover:border-black'
                            }`}
                        >
                            <KeyRound className="w-4 h-4" /> Đổi Mật Khẩu
                        </button>

                        <button
                            type="button"
                            onClick={() => { setActiveTab('itinerary'); setFeedbackMessage(null); }}
                            className={`w-full text-left px-4 py-3 text-xs font-black uppercase tracking-wider transition-all flex items-center gap-3 border ${
                                activeTab === 'itinerary'
                                    ? 'bg-black text-[#FACC15] border-black shadow'
                                    : 'bg-white text-gray-700 border-gray-200 hover:border-black'
                            }`}
                        >
                            <Compass className="w-4 h-4" /> Hành Trình Của Tôi
                        </button>

                        <button
                            type="button"
                            onClick={() => { setActiveTab('favorites'); setFeedbackMessage(null); }}
                            className={`w-full text-left px-4 py-3 text-xs font-black uppercase tracking-wider transition-all flex items-center gap-3 border ${
                                activeTab === 'favorites'
                                    ? 'bg-black text-[#FACC15] border-black shadow'
                                    : 'bg-white text-gray-700 border-gray-200 hover:border-black'
                            }`}
                        >
                            <Heart className="w-4 h-4" /> Danh Sách Yêu Thích
                        </button>
                    </div>

                    {/* Main Content Area */}
                    <div className="lg:col-span-3">
                        {/* Tab 1: Profile Edit */}
                        {activeTab === 'profile' && (
                            <div className="bg-white p-6 md:p-8 border border-gray-200 shadow-sm">
                                <h2 className="text-base font-black uppercase tracking-tight text-gray-900 pb-3 border-b border-gray-100 mb-6">
                                    Thông Tin Cá Nhân
                                </h2>

                                <form onSubmit={handleUpdateProfile} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-[11px] font-black uppercase tracking-wider text-gray-500 mb-1">
                                                Họ và Tên
                                            </label>
                                            <input
                                                type="text"
                                                value={fullName}
                                                onChange={(e) => setFullName(e.target.value)}
                                                placeholder="Nguyễn Văn A"
                                                className="w-full px-3 py-2 text-xs font-semibold border border-gray-200 focus:outline-none focus:border-black"
                                                required
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-[11px] font-black uppercase tracking-wider text-gray-500 mb-1">
                                                Địa Chỉ Email (Không thể đổi)
                                            </label>
                                            <input
                                                type="email"
                                                value={email}
                                                disabled
                                                className="w-full px-3 py-2 text-xs font-semibold border border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-[11px] font-black uppercase tracking-wider text-gray-500 mb-1">
                                                Số Điện Thoại
                                            </label>
                                            <input
                                                type="tel"
                                                value={phoneNumber}
                                                onChange={(e) => setPhoneNumber(e.target.value)}
                                                placeholder="0912 345 678"
                                                className="w-full px-3 py-2 text-xs font-semibold border border-gray-200 focus:outline-none focus:border-black"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-[11px] font-black uppercase tracking-wider text-gray-500 mb-1">
                                                Link Ảnh Đại Diện (Avatar URL)
                                            </label>
                                            <input
                                                type="url"
                                                value={avatarUrl}
                                                onChange={(e) => setAvatarUrl(e.target.value)}
                                                placeholder="https://example.com/my-photo.jpg"
                                                className="w-full px-3 py-2 text-xs font-semibold border border-gray-200 focus:outline-none focus:border-black"
                                            />
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-gray-100 flex justify-end">
                                        <button
                                            type="submit"
                                            disabled={isSaving}
                                            className="bg-black text-[#FACC15] hover:bg-gray-800 py-3 px-8 text-xs font-black uppercase tracking-widest transition-colors flex items-center gap-2 disabled:opacity-50"
                                        >
                                            <Save className="w-4 h-4" /> {isSaving ? 'Đang Lưu...' : 'Lưu Thay Đổi'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {/* Tab 2: Change Password */}
                        {activeTab === 'password' && (
                            <div className="bg-white p-6 md:p-8 border border-gray-200 shadow-sm max-w-xl">
                                <h2 className="text-base font-black uppercase tracking-tight text-gray-900 pb-3 border-b border-gray-100 mb-6">
                                    Đổi Mật Khẩu
                                </h2>

                                <form onSubmit={handleChangePassword} className="space-y-4">
                                    <div>
                                        <label className="block text-[11px] font-black uppercase tracking-wider text-gray-500 mb-1">
                                            Mật Khẩu Hiện Tại
                                        </label>
                                        <input
                                            type="password"
                                            required
                                            value={oldPassword}
                                            onChange={(e) => setOldPassword(e.target.value)}
                                            className="w-full px-3 py-2 text-xs font-semibold border border-gray-200 focus:outline-none focus:border-black"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-[11px] font-black uppercase tracking-wider text-gray-500 mb-1">
                                            Mật Khẩu Mới
                                        </label>
                                        <input
                                            type="password"
                                            required
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            className="w-full px-3 py-2 text-xs font-semibold border border-gray-200 focus:outline-none focus:border-black"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-[11px] font-black uppercase tracking-wider text-gray-500 mb-1">
                                            Xác Nhận Mật Khẩu Mới
                                        </label>
                                        <input
                                            type="password"
                                            required
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="w-full px-3 py-2 text-xs font-semibold border border-gray-200 focus:outline-none focus:border-black"
                                        />
                                    </div>

                                    <div className="pt-4">
                                        <button
                                            type="submit"
                                            disabled={isSaving}
                                            className="bg-black text-[#FACC15] hover:bg-gray-800 py-3 px-8 text-xs font-black uppercase tracking-widest transition-colors flex items-center gap-2 disabled:opacity-50"
                                        >
                                            <KeyRound className="w-4 h-4" /> {isSaving ? 'Đang Đổi...' : 'Cập Nhật Mật Khẩu'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {/* Tab 3: Itinerary */}
                        {activeTab === 'itinerary' && (
                            <div className="bg-white p-6 md:p-8 border border-gray-200 shadow-sm space-y-8">
                                <div>
                                    <h2 className="text-base font-black uppercase tracking-tight text-gray-900 pb-3 border-b border-gray-100 mb-4 flex items-center gap-2">
                                        <Calendar className="w-4 h-4 text-emerald-600" />
                                        Hành Trình Sắp Diễn Ra ({itinerary?.upcoming?.length || 0})
                                    </h2>

                                    {(!itinerary?.upcoming || itinerary.upcoming.length === 0) ? (
                                        <p className="text-xs text-gray-500 py-4">
                                            Bạn chưa có chuyến đi nào sắp khởi hành. Hãy đặt tour hoặc gói combo ngay!
                                        </p>
                                    ) : (
                                        <div className="space-y-3">
                                            {itinerary.upcoming.map((trip) => (
                                                <div key={trip.id} className="p-4 border border-gray-200 flex justify-between items-center text-xs">
                                                    <div>
                                                        <span className="font-bold text-gray-900 block">
                                                            Mã Chuyến Đi: #{trip.id.slice(0, 8).toUpperCase()}
                                                        </span>
                                                        <span className="text-[11px] text-gray-500">
                                                            Số lượng dịch vụ: {trip.booking_items?.length || 1}
                                                        </span>
                                                    </div>
                                                    <Link
                                                        href={`/bookings/${trip.id}`}
                                                        className="bg-black text-[#FACC15] px-4 py-2 text-xs font-black uppercase tracking-wider hover:bg-gray-800"
                                                    >
                                                        Xem Vé
                                                    </Link>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <h2 className="text-base font-black uppercase tracking-tight text-gray-900 pb-3 border-b border-gray-100 mb-4 flex items-center gap-2">
                                        <Compass className="w-4 h-4 text-blue-600" />
                                        Hành Trình Đã Trải Qua ({itinerary?.past?.length || 0})
                                    </h2>

                                    {(!itinerary?.past || itinerary.past.length === 0) ? (
                                        <p className="text-xs text-gray-500 py-4">
                                            Chưa có lịch sử hành trình cũ nào được lưu lại.
                                        </p>
                                    ) : (
                                        <div className="space-y-3">
                                            {itinerary.past.map((trip) => (
                                                <div key={trip.id} className="p-4 bg-gray-50 border border-gray-200 flex justify-between items-center text-xs">
                                                    <div>
                                                        <span className="font-bold text-gray-700 block">
                                                            Chuyến đi #{trip.id.slice(0, 8).toUpperCase()}
                                                        </span>
                                                        <span className="text-[11px] text-gray-400">
                                                            Ngày: {new Date(trip.created_at).toLocaleDateString('vi-VN')}
                                                        </span>
                                                    </div>
                                                    <span className="font-black text-gray-800">
                                                        {formatCurrency(Number(trip.total_price))}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Tab 4: Favorites */}
                        {activeTab === 'favorites' && (
                            <div className="bg-white p-6 md:p-8 border border-gray-200 shadow-sm">
                                <h2 className="text-base font-black uppercase tracking-tight text-gray-900 pb-3 border-b border-gray-100 mb-6 flex items-center gap-2">
                                    <Heart className="w-4 h-4 text-red-500" />
                                    Điểm Đến & Dịch Vụ Đã Lưu ({favorites.length})
                                </h2>

                                {favorites.length === 0 ? (
                                    <div className="text-center py-12">
                                        <Heart className="w-12 h-12 text-gray-200 mx-auto mb-2" />
                                        <p className="text-xs text-gray-500 max-w-sm mx-auto mb-4">
                                            Bạn chưa lưu mục yêu thích nào. Khi xem các Tour hoặc Khách Sạn, hãy nhấn nút Trái Tim để lưu lại danh sách này nhé!
                                        </p>
                                        <Link
                                            href="/tours"
                                            className="inline-flex items-center gap-1.5 bg-black text-[#FACC15] px-6 py-2.5 text-xs font-black uppercase tracking-widest hover:bg-gray-800"
                                        >
                                            Khám Phá Tours <ArrowRight className="w-3.5 h-3.5" />
                                        </Link>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {favorites.map((fav, index) => (
                                            <div
                                                key={index}
                                                className="p-4 border border-gray-200 hover:border-black flex items-center justify-between text-xs"
                                            >
                                                <div>
                                                    <span className="font-bold uppercase text-gray-900 block">
                                                        {fav.title || `Dịch vụ ${fav.item_type}`}
                                                    </span>
                                                    <span className="text-[11px] text-gray-500">
                                                        Mã: {fav.item_id.slice(0, 8)}
                                                    </span>
                                                </div>
                                                <Link
                                                    href={`/${fav.item_type === 'tour' ? 'tours' : fav.item_type === 'hotel' ? 'hotels' : 'flights'}/${fav.item_id}`}
                                                    className="border border-black text-black px-3 py-1.5 text-[11px] font-black uppercase tracking-wider hover:bg-black hover:text-white"
                                                >
                                                    Xem lại
                                                </Link>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

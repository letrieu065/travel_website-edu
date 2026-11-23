'use client';

/**
 * ============================================================================
 * MODULE BOOKINGS - CLIENT PAGE (Trang Quản Lý Đơn Đặt Chỗ Của Tôi)
 * ============================================================================
 * Chịu trách nhiệm:
 * - Hiển thị danh sách toàn bộ các đơn đặt chỗ của người dùng đăng nhập.
 * - Tab phân loại trạng thái: Tất cả, Đã xác nhận/thanh toán, Chờ thanh toán, Đã hủy/hoàn tiền.
 * - Cho phép hủy đơn đặt chỗ trực tiếp và hoàn trả chỗ về kho dữ liệu.
 * - Kết nối trực tiếp API Backend: GET /api/v1/bookings/my-bookings & PATCH /api/v1/bookings/:id/cancel
 * ============================================================================
 */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    Compass,
    Building2,
    Plane,
    Clock,
    CheckCircle2,
    XCircle,
    AlertCircle,
    ChevronRight,
    RefreshCw,
    FileText,
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3600';

interface BookingItem {
    id: string;
    item_type: 'tour' | 'hotel' | 'flight';
    item_id: string;
    quantity: number;
    unit_price: number;
    check_in?: string | null;
    check_out?: string | null;
}

interface PaymentRecord {
    id: string;
    amount: number;
    payment_method: string;
    payment_status: 'pending' | 'paid' | 'failed' | 'refund_requested';
}

interface BookingRecord {
    id: string;
    user_id: string;
    total_price: number;
    created_at: string;
    booking_items: BookingItem[];
    payments: PaymentRecord[];
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
export default function BookingsPage() {
    const router = useRouter();
    const [bookings, setBookings] = useState<BookingRecord[]>([]);
    const [page] = useState(1);
    const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'pending' | 'cancelled'>('all');
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');
    const [cancellingId, setCancellingId] = useState<string | null>(null);
    const [reloadCounter, setReloadCounter] = useState(0);

    useEffect(() => {
        let isCancelled = false;

        // (Đã thêm)
        const loadBookings = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                router.push('/login?next=/bookings');
                return;
            }

            try {
                const res = await fetch(`${API_URL}/api/v1/bookings/my-bookings?page=${page}&limit=10`, {
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (res.status === 401) {
                    router.push('/login?next=/bookings');
                    return;
                }

                if (!res.ok) {
                    throw new Error(`Lỗi tải danh sách đặt chỗ (${res.status})`);
                }

                const data = await res.json();
                if (!isCancelled) {
                    if (data.status === 'success') {
                        setBookings(data.bookings || []);
                        setErrorMessage('');
                    } else {
                        throw new Error(data.message || 'Không thể lấy dữ liệu đơn hàng');
                    }
                }
            } catch (err: unknown) {
                if (!isCancelled) {
                    const message = err instanceof Error ? err.message : 'Lỗi kết nối máy chủ';
                    setErrorMessage(message);
                }
            } finally {
                if (!isCancelled) {
                    setIsLoading(false);
                }
            }
        };

        loadBookings();

        return () => {
            isCancelled = true;
        };
    }, [page, router, reloadCounter]);

    // (Đã thêm)
    const handleCancelBooking = async (bookingId: string) => {
        const confirmed = window.confirm(
            'Bạn có chắc chắn muốn hủy đơn đặt chỗ này? Các chỗ đã giữ sẽ được hoàn lại kho.'
        );
        if (!confirmed) return;

        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            setCancellingId(bookingId);
            const res = await fetch(`${API_URL}/api/v1/bookings/${bookingId}/cancel`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
            });
            const data = await res.json();
            if (res.ok && data.status === 'success') {
                alert(data.message || 'Hủy đơn đặt chỗ thành công');
                setReloadCounter((c) => c + 1);
            } else {
                alert(data.message || 'Không thể hủy đơn đặt chỗ');
            }
        } catch {
            alert('Lỗi kết nối khi gửi yêu cầu hủy đơn');
        } finally {
            setCancellingId(null);
        }
    };

    // Filter by payment status
    const filteredBookings = bookings.filter((b) => {
        const primaryPayment = b.payments?.[0];
        const status = primaryPayment?.payment_status || 'pending';

        if (statusFilter === 'all') return true;
        if (statusFilter === 'paid') return status === 'paid';
        if (statusFilter === 'pending') return status === 'pending';
        if (statusFilter === 'cancelled') return status === 'failed' || status === 'refund_requested';
        return true;
    });

    // (Đã thêm)
    const renderStatusBadge = (status?: string) => {
        switch (status) {
            case 'paid':
                return (
                    <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase px-2.5 py-0.5 tracking-wider">
                        <CheckCircle2 className="w-3 h-3" /> Đã Thanh Toán
                    </span>
                );
            case 'refund_requested':
                return (
                    <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 text-[10px] font-black uppercase px-2.5 py-0.5 tracking-wider">
                        <RefreshCw className="w-3 h-3" /> Chờ Hoàn Tiền
                    </span>
                );
            case 'failed':
                return (
                    <span className="inline-flex items-center gap-1 bg-red-100 text-red-800 text-[10px] font-black uppercase px-2.5 py-0.5 tracking-wider">
                        <XCircle className="w-3 h-3" /> Đã Hủy
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 text-[10px] font-black uppercase px-2.5 py-0.5 tracking-wider">
                        <Clock className="w-3 h-3" /> Chờ Thanh Toán
                    </span>
                );
        }
    };

    return (
        <div className="min-h-screen bg-[#FDFBF7] text-gray-900 pb-20">
            {/* Hero Banner */}
            <section className="bg-[#0f141e] text-white py-12 px-6 lg:px-12 border-b border-gray-800">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight text-white font-serif">
                            Lịch Sử & Chi Tiết Đặt Chỗ
                        </h1>
                        <p className="mt-2 text-xs md:text-sm text-gray-400 font-light max-w-xl">
                            Theo dõi mã đặt vé, thông tin phòng nghỉ, tình trạng xuất vé điện tử và quản lý thay đổi lịch trình.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() => setReloadCounter((c) => c + 1)}
                        className="self-start md:self-auto inline-flex items-center gap-2 border border-gray-700 hover:border-white text-xs font-bold uppercase tracking-wider text-gray-300 hover:text-white px-4 py-2.5 transition-colors"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} /> Làm mới danh sách
                    </button>
                </div>
            </section>

            {/* Filter Tabs */}
            <div className="max-w-7xl mx-auto px-6 lg:px-12 pt-8">
                <div className="flex border-b border-gray-200 gap-6 text-xs font-black uppercase tracking-wider overflow-x-auto pb-1">
                    {[
                        { key: 'all', label: 'Tất Cả Đơn' },
                        { key: 'paid', label: 'Đã Xác Nhận / Đã Trả' },
                        { key: 'pending', label: 'Chờ Thanh Toán' },
                        { key: 'cancelled', label: 'Đã Hủy / Hoàn Tiền' },
                    ].map((tab) => (
                        <button
                            key={tab.key}
                            type="button"
                            onClick={() => setStatusFilter(tab.key as 'all' | 'paid' | 'pending' | 'cancelled')}
                            className={`pb-3 border-b-2 transition-colors whitespace-nowrap ${
                                statusFilter === tab.key
                                    ? 'border-black text-black'
                                    : 'border-transparent text-gray-400 hover:text-gray-700'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {errorMessage && (
                    <div className="mt-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-xs font-semibold flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{errorMessage}</span>
                    </div>
                )}

                {/* Main Content */}
                <div className="mt-8">
                    {isLoading ? (
                        <div className="space-y-4">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="bg-white border border-gray-200 p-6 animate-pulse space-y-4">
                                    <div className="h-4 bg-gray-200 w-1/4"></div>
                                    <div className="h-12 bg-gray-100 w-full"></div>
                                    <div className="h-6 bg-gray-200 w-1/3"></div>
                                </div>
                            ))}
                        </div>
                    ) : filteredBookings.length === 0 ? (
                        <div className="bg-white border border-dashed border-gray-300 p-12 text-center my-8">
                            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <h3 className="text-base font-bold uppercase tracking-tight text-gray-800">
                                Không có đơn đặt chỗ nào trong danh mục này
                            </h3>
                            <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto mb-6">
                                Bạn chưa có dịch vụ nào đang chờ xử lý. Hãy khám phá những điểm đến tuyệt vời ngay hôm nay!
                            </p>
                            <div className="flex gap-3 justify-center">
                                <Link
                                    href="/tours"
                                    className="bg-black text-[#FACC15] px-6 py-2.5 text-xs font-black uppercase tracking-widest hover:bg-gray-800"
                                >
                                    Khám Phá Tours
                                </Link>
                                <Link
                                    href="/combos"
                                    className="border border-black text-black px-6 py-2.5 text-xs font-black uppercase tracking-widest hover:bg-black hover:text-white"
                                >
                                    Gói Combos
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {filteredBookings.map((booking) => {
                                const primaryPayment = booking.payments?.[0];
                                const paymentStatus = primaryPayment?.payment_status;
                                const isCancellable = paymentStatus !== 'failed' && paymentStatus !== 'refund_requested';

                                return (
                                    <div
                                        key={booking.id}
                                        className="bg-white border border-gray-200 hover:border-black transition-all shadow-sm"
                                    >
                                        {/* Booking Header */}
                                        <div className="p-4 md:p-6 bg-gray-50/70 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
                                            <div className="flex flex-wrap items-center gap-3">
                                                <span className="font-mono font-black text-sm text-gray-900">
                                                    ĐƠN #{booking.id.slice(0, 8).toUpperCase()}
                                                </span>
                                                <span className="text-xs text-gray-400">
                                                    Ngày tạo: {new Date(booking.created_at).toLocaleDateString('vi-VN')}
                                                </span>
                                            </div>
                                            <div>{renderStatusBadge(paymentStatus)}</div>
                                        </div>

                                        {/* Booking Items */}
                                        <div className="p-4 md:p-6 space-y-4">
                                            {booking.booking_items.map((item, idx) => {
                                                return (
                                                    <div
                                                        key={idx}
                                                        className="flex items-center justify-between text-xs py-2 border-b border-gray-100 last:border-b-0"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            {item.item_type === 'tour' && (
                                                                <div className="w-8 h-8 rounded bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                                                                    <Compass className="w-4 h-4" />
                                                                </div>
                                                            )}
                                                            {item.item_type === 'hotel' && (
                                                                <div className="w-8 h-8 rounded bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
                                                                    <Building2 className="w-4 h-4" />
                                                                </div>
                                                            )}
                                                            {item.item_type === 'flight' && (
                                                                <div className="w-8 h-8 rounded bg-purple-50 text-purple-700 flex items-center justify-center shrink-0">
                                                                    <Plane className="w-4 h-4" />
                                                                </div>
                                                            )}
                                                            <div>
                                                                <span className="font-bold uppercase text-gray-900 block">
                                                                    Dịch vụ {item.item_type} · Mã {item.item_id.slice(0, 8)}
                                                                </span>
                                                                <span className="text-[11px] text-gray-500">
                                                                    Số lượng: {item.quantity} · Đơn giá: {formatCurrency(Number(item.unit_price))}
                                                                    {item.check_in && ` · Khởi hành/Nhận phòng: ${new Date(item.check_in).toLocaleDateString('vi-VN')}`}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        <div className="text-right font-black text-gray-900">
                                                            {formatCurrency(Number(item.unit_price) * item.quantity)}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {/* Booking Footer Actions */}
                                        <div className="p-4 md:p-6 bg-white border-t border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                            <div>
                                                <span className="text-[11px] font-black uppercase tracking-wider text-gray-400 block">
                                                    Tổng cộng:
                                                </span>
                                                <span className="text-xl font-black text-red-600">
                                                    {formatCurrency(Number(booking.total_price))}
                                                </span>
                                            </div>

                                            <div className="flex flex-wrap items-center gap-3">
                                                {isCancellable && (
                                                    <button
                                                        type="button"
                                                        disabled={cancellingId === booking.id}
                                                        onClick={() => handleCancelBooking(booking.id)}
                                                        className="border border-red-300 text-red-600 hover:bg-red-50 py-2 px-4 text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50"
                                                    >
                                                        {cancellingId === booking.id ? 'Đang hủy...' : 'Hủy đơn'}
                                                    </button>
                                                )}

                                                <Link
                                                    href={`/bookings/${booking.id}`}
                                                    className="bg-black text-[#FACC15] hover:bg-gray-800 py-2 px-5 text-xs font-black uppercase tracking-widest transition-colors inline-flex items-center gap-1.5"
                                                >
                                                    Chi tiết vé <ChevronRight className="w-3.5 h-3.5" />
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

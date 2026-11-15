'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import {
    ArrowLeft,
    Compass,
    Building2,
    Plane,
    CreditCard,
    CheckCircle2,
    XCircle,
    Clock,
    Printer,
    HelpCircle,
    AlertCircle,
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
    transaction_id?: string;
    payment_date?: string;
}

interface BookingDetail {
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
function BookingDetailContent() {
    const params = useParams();
    const router = useRouter();
    const bookingId = (params?.id as string) || '';

    const [booking, setBooking] = useState<BookingDetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');
    const [isCancelling, setIsCancelling] = useState(false);
    const [reloadKey, setReloadKey] = useState(0);

    useEffect(() => {
        let isCancelled = false;
        if (!bookingId) return;

        // (Đã thêm)
        const loadBooking = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                router.push(`/login?next=/bookings/${bookingId}`);
                return;
            }

            try {
                const res = await fetch(`${API_URL}/api/v1/bookings/${bookingId}`, {
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (res.status === 401) {
                    router.push(`/login?next=/bookings/${bookingId}`);
                    return;
                }

                if (!res.ok) {
                    throw new Error(`Lỗi tải thông tin đơn hàng (${res.status})`);
                }

                const data = await res.json();
                if (!isCancelled) {
                    if (data.status === 'success' && data.booking) {
                        setBooking(data.booking);
                        setErrorMessage('');
                    } else {
                        throw new Error(data.message || 'Không tìm thấy đơn đặt chỗ');
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

        loadBooking();

        return () => {
            isCancelled = true;
        };
    }, [bookingId, router, reloadKey]);

    // (Đã thêm)
    const handleCancel = async () => {
        if (!booking) return;
        const confirmCancel = window.confirm('Bạn có chắc muốn hủy đơn đặt chỗ này không?');
        if (!confirmCancel) return;

        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            setIsCancelling(true);
            const res = await fetch(`${API_URL}/api/v1/bookings/${booking.id}/cancel`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
            });
            const data = await res.json();
            if (res.ok && data.status === 'success') {
                alert(data.message || 'Đã hủy đơn thành công');
                setReloadKey((k) => k + 1);
            } else {
                alert(data.message || 'Không thể hủy đơn');
            }
        } catch {
            alert('Lỗi kết nối khi gửi yêu cầu hủy đơn');
        } finally {
            setIsCancelling(false);
        }
    };

    // (Đã thêm)
    const handlePrint = () => {
        if (typeof window !== 'undefined') {
            window.print();
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center py-20">
                <div className="text-center">
                    <div className="w-10 h-10 border-4 border-black border-t-[#FACC15] rounded-full animate-spin mx-auto mb-3"></div>
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-500">Đang tải chi tiết đơn hàng...</p>
                </div>
            </div>
        );
    }

    if (errorMessage || !booking) {
        return (
            <div className="min-h-screen bg-[#FDFBF7] py-20 px-6">
                <div className="max-w-md mx-auto bg-white p-8 border border-red-200 text-center shadow">
                    <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
                    <h2 className="text-base font-black uppercase text-gray-900 mb-2">Không tìm thấy đơn hàng</h2>
                    <p className="text-xs text-gray-600 mb-6">{errorMessage || 'Đơn hàng không tồn tại hoặc đã bị xóa.'}</p>
                    <Link
                        href="/bookings"
                        className="inline-flex items-center gap-2 bg-black text-[#FACC15] px-6 py-2.5 text-xs font-black uppercase tracking-widest hover:bg-gray-800"
                    >
                        <ArrowLeft className="w-4 h-4" /> Quay lại danh sách
                    </Link>
                </div>
            </div>
        );
    }

    const primaryPayment = booking.payments?.[0];
    const isPaid = primaryPayment?.payment_status === 'paid';
    const isCancelled = primaryPayment?.payment_status === 'failed' || primaryPayment?.payment_status === 'refund_requested';

    return (
        <div className="min-h-screen bg-[#FDFBF7] text-gray-900 pb-24">
            {/* Nav Header */}
            <div className="border-b border-gray-200 bg-white py-4 px-6 lg:px-12 print:hidden">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <Link
                        href="/bookings"
                        className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-600 hover:text-black transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" /> Danh sách đặt chỗ
                    </Link>

                    <button
                        type="button"
                        onClick={handlePrint}
                        className="inline-flex items-center gap-1.5 border border-gray-300 hover:border-black px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-gray-700 hover:text-black transition-colors"
                    >
                        <Printer className="w-4 h-4" /> In Vé Điện Tử
                    </button>
                </div>
            </div>

            {/* Ticket Boarding Pass Card */}
            <div className="max-w-4xl mx-auto px-6 lg:px-12 pt-8">
                <div className="bg-white border-2 border-black p-6 md:p-8 shadow-xl">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b-2 border-dashed border-gray-300 gap-4">
                        <div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-[#B45309] block mb-1">
                                Vé Xác Nhận Dịch Vụ Du Lịch · Natura Travel
                            </span>
                            <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-gray-900 font-serif">
                                MÃ ĐƠN: #{booking.id.toUpperCase()}
                            </h1>
                            <p className="text-xs text-gray-500 mt-1">
                                Ngày đặt: {new Date(booking.created_at).toLocaleString('vi-VN')}
                            </p>
                        </div>

                        <div className="text-left md:text-right">
                            {isPaid ? (
                                <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-xs font-black uppercase px-3 py-1 tracking-wider border border-emerald-300">
                                    <CheckCircle2 className="w-4 h-4" /> Đã Thanh Toán
                                </span>
                            ) : isCancelled ? (
                                <span className="inline-flex items-center gap-1 bg-red-100 text-red-800 text-xs font-black uppercase px-3 py-1 tracking-wider border border-red-300">
                                    <XCircle className="w-4 h-4" /> Đã Hủy / Hoàn Tiền
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 text-xs font-black uppercase px-3 py-1 tracking-wider border border-amber-300">
                                    <Clock className="w-4 h-4" /> Chờ Thanh Toán
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Services Items list */}
                    <div className="py-6 border-b border-gray-200">
                        <h2 className="text-xs font-black uppercase tracking-widest text-gray-500 mb-4">
                            Chi Tiết Dịch Vụ Bao Gồm
                        </h2>

                        <div className="space-y-4">
                            {booking.booking_items.map((item, index) => (
                                <div
                                    key={index}
                                    className="p-4 bg-gray-50 border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                                >
                                    <div className="flex items-center gap-3">
                                        {item.item_type === 'tour' && (
                                            <div className="w-10 h-10 bg-emerald-600 text-white flex items-center justify-center font-bold">
                                                <Compass className="w-5 h-5" />
                                            </div>
                                        )}
                                        {item.item_type === 'hotel' && (
                                            <div className="w-10 h-10 bg-blue-600 text-white flex items-center justify-center font-bold">
                                                <Building2 className="w-5 h-5" />
                                            </div>
                                        )}
                                        {item.item_type === 'flight' && (
                                            <div className="w-10 h-10 bg-purple-600 text-white flex items-center justify-center font-bold">
                                                <Plane className="w-5 h-5" />
                                            </div>
                                        )}
                                        <div>
                                            <span className="text-xs font-black uppercase tracking-tight text-gray-900 block">
                                                {item.item_type === 'tour' && 'Tour Tham Quan Trọn Gói'}
                                                {item.item_type === 'hotel' && 'Lưu Trú Khách Sạn & Resort'}
                                                {item.item_type === 'flight' && 'Vé Máy Bay Khứ Hồi / Một Chiều'}
                                            </span>
                                            <span className="text-[11px] text-gray-500">
                                                Mã dịch vụ: {item.item_id} · Số lượng: {item.quantity} khách/phòng
                                            </span>
                                            {item.check_in && (
                                                <span className="text-[11px] text-gray-600 block mt-0.5">
                                                    Thời gian: {new Date(item.check_in).toLocaleDateString('vi-VN')}
                                                    {item.check_out && ` ➔ ${new Date(item.check_out).toLocaleDateString('vi-VN')}`}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="text-right">
                                        <span className="text-sm font-black text-gray-900 block">
                                            {formatCurrency(Number(item.unit_price) * item.quantity)}
                                        </span>
                                        <span className="text-[10px] text-gray-400">
                                            Đơn giá: {formatCurrency(Number(item.unit_price))}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Payment Summary */}
                    <div className="py-6 border-b border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                        <div>
                            <h3 className="font-black uppercase tracking-wider text-gray-700 mb-2 flex items-center gap-1.5">
                                <CreditCard className="w-4 h-4 text-black" />
                                Thông Tin Giao Dịch
                            </h3>
                            <p className="text-gray-600">
                                Phương thức:{' '}
                                <strong className="text-gray-900 uppercase">
                                    {primaryPayment?.payment_method || 'Chuyển khoản'}
                                </strong>
                            </p>
                            {primaryPayment?.transaction_id && (
                                <p className="text-gray-600 mt-1">
                                    Mã giao dịch:{' '}
                                    <strong className="font-mono text-gray-900">{primaryPayment.transaction_id}</strong>
                                </p>
                            )}
                        </div>

                        <div className="text-left md:text-right space-y-1">
                            <span className="text-[11px] font-black uppercase tracking-wider text-gray-400 block">
                                Tổng Chi Phí:
                            </span>
                            <span className="text-2xl font-black text-red-600 block">
                                {formatCurrency(Number(booking.total_price))}
                            </span>
                            <span className="text-[10px] text-emerald-600 font-bold">
                                Đã bao gồm toàn bộ thuế, phí dịch vụ & bảo hiểm cơ bản
                            </span>
                        </div>
                    </div>

                    {/* Customer Support Notice */}
                    <div className="pt-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                            <HelpCircle className="w-4 h-4 text-amber-500 shrink-0" />
                            <span>Cần hỗ trợ gấp? Gọi tổng đài Natura Travel 1900 8888 (24/7).</span>
                        </div>

                        {!isCancelled && (
                            <button
                                type="button"
                                disabled={isCancelling}
                                onClick={handleCancel}
                                className="border border-red-300 text-red-600 hover:bg-red-50 py-2.5 px-6 text-xs font-black uppercase tracking-widest transition-colors self-start md:self-auto disabled:opacity-50 print:hidden"
                            >
                                {isCancelling ? 'Đang hủy...' : 'Hủy Vé Này'}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// (Đã thêm)
export default function BookingDetailPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-black border-t-[#FACC15] rounded-full animate-spin"></div>
            </div>
        }>
            <BookingDetailContent />
        </Suspense>
    );
}

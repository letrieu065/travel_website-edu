'use client';

import React, { useState, Suspense, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    ShieldCheck,
    CreditCard,
    Lock,
    QrCode,
    CheckCircle2,
    AlertCircle,
    ArrowLeft,
    Clock,
    Sparkles,
    User,
    Mail,
    Phone,
} from 'lucide-react';
import { useSelector } from 'react-redux';
import type { RootState } from '@/redux/store';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3600';

type PaymentMethodType = 'bank_transfer' | 'momo' | 'vnpay' | 'f88_loan';

// (Đã thêm)
const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        maximumFractionDigits: 0,
    }).format(amount);
};

// (Đã thêm)
function CheckoutContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const reduxUser = useSelector((state: RootState) => state.user.profile);

    const type = searchParams.get('type') || 'tour';
    const tourId = searchParams.get('tour_id') || '';
    const departureId = searchParams.get('departure_id') || searchParams.get('item_id') || '';
    const hotelId = searchParams.get('hotel_id') || '';
    const flightId = searchParams.get('flight_id') || '';
    const itemTitle = searchParams.get('title') || 'Dịch vụ du lịch Natura Travel';
    const guests = Math.max(1, Number(searchParams.get('guests')) || 1);
    const nights = Math.max(1, Number(searchParams.get('nights')) || 1);
    const rawPrice = Number(searchParams.get('price')) || 0;

    // Contact Form state with fallback to redux user (no effect needed)
    const defaultFullName = reduxUser?.fullName || reduxUser?.full_name || reduxUser?.name || '';
    const defaultEmail = reduxUser?.email || '';
    const defaultPhone = reduxUser?.phoneNumber || reduxUser?.phone_number || '';

    const [customFullName, setCustomFullName] = useState<string | null>(null);
    const [customEmail, setCustomEmail] = useState<string | null>(null);
    const [customPhone, setCustomPhone] = useState<string | null>(null);
    const [specialNotes, setSpecialNotes] = useState('');

    const fullName = customFullName !== null ? customFullName : defaultFullName;
    const email = customEmail !== null ? customEmail : defaultEmail;
    const phone = customPhone !== null ? customPhone : defaultPhone;

    // Payment Selection
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('bank_transfer');
    const [agreeTerms, setAgreeTerms] = useState(true);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    // VietQR / Bank Transfer Modal State
    const [qrData, setQrData] = useState<{
        qrUrl: string;
        bookingId: string;
        amount: number;
        transactionId: string;
    } | null>(null);

    // Final price calculate
    const totalPrice = useMemo(() => {
        return Math.max(0, rawPrice);
    }, [rawPrice]);

    // (Đã thêm)
    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage('');

        if (!agreeTerms) {
            setErrorMessage('Vui lòng đồng ý với điều khoản & chính sách của Natura Travel.');
            return;
        }

        const token = localStorage.getItem('token');
        if (!token) {
            const currentUrl = window.location.pathname + window.location.search;
            router.push(`/login?next=${encodeURIComponent(currentUrl)}`);
            return;
        }

        setIsSubmitting(true);

        try {
            // Build items list for booking API
            const items: Array<{
                item_type: 'tour' | 'hotel' | 'flight';
                item_id: string;
                quantity: number;
            }> = [];

            if (type === 'combo') {
                if (departureId || tourId) {
                    items.push({ item_type: 'tour', item_id: departureId || tourId, quantity: guests });
                }
                if (hotelId) {
                    items.push({ item_type: 'hotel', item_id: hotelId, quantity: 1 });
                }
                if (flightId) {
                    items.push({ item_type: 'flight', item_id: flightId, quantity: guests });
                }
            } else if (type === 'hotel') {
                items.push({ item_type: 'hotel', item_id: hotelId || departureId, quantity: guests });
            } else if (type === 'flight') {
                items.push({ item_type: 'flight', item_id: flightId || departureId, quantity: guests });
            } else {
                // Tour
                items.push({ item_type: 'tour', item_id: departureId || tourId, quantity: guests });
            }

            if (items.length === 0) {
                throw new Error('Không có dịch vụ nào được chọn để thanh toán');
            }

            // 1. Call Create Booking
            const bookingRes = await fetch(`${API_URL}/api/v1/bookings`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    items,
                    payment_method: paymentMethod,
                }),
            });

            const bookingData = await bookingRes.json();
            if (!bookingRes.ok) {
                throw new Error(bookingData.message || 'Lỗi khi khởi tạo đơn đặt chỗ');
            }

            const createdBooking = bookingData.booking;
            const bookingId = createdBooking.id;

            // 2. Call Create Payment to get VietQR or payment gateway link
            const paymentRes = await fetch(`${API_URL}/api/v1/payments/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    booking_id: bookingId,
                    payment_method: paymentMethod,
                }),
            });

            const paymentJson = await paymentRes.json();

            if (paymentMethod === 'bank_transfer') {
                const qrUrl =
                    paymentJson.payment_url ||
                    `https://img.vietqr.io/image/MB-0000000000-compact2.png?amount=${createdBooking.total_price}&addInfo=${bookingId.slice(0, 8)}`;
                setQrData({
                    qrUrl,
                    bookingId,
                    amount: Number(createdBooking.total_price),
                    transactionId: paymentJson.transaction_id || `TXN_${Date.now()}`,
                });
            } else if (paymentMethod === 'momo' && paymentJson.payment_url) {
                window.location.href = paymentJson.payment_url;
            } else {
                // Default or VNPay -> Success page
                router.push(
                    `/checkout/success?booking_id=${bookingId}&amount=${createdBooking.total_price}&method=${paymentMethod}`
                );
            }
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Đã có lỗi xảy ra khi tạo thanh toán';
            setErrorMessage(message);
        } finally {
            setIsSubmitting(false);
        }
    };

    // (Đã thêm)
    const handleConfirmTransferDone = () => {
        if (!qrData) return;
        router.push(
            `/checkout/success?booking_id=${qrData.bookingId}&amount=${qrData.amount}&method=bank_transfer`
        );
    };

    return (
        <div className="min-h-screen bg-[#FDFBF7] text-gray-900 pb-24">
            {/* Header */}
            <div className="border-b border-gray-200 bg-white py-4 px-6 lg:px-12">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-600 hover:text-black transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" /> Quay lại
                    </button>
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-600">
                        <Lock className="w-3.5 h-3.5" />
                        <span>Bảo mật chuẩn 256-bit SSL</span>
                    </div>
                </div>
            </div>

            {/* Main Form */}
            <div className="max-w-7xl mx-auto px-6 lg:px-12 pt-8">
                <div className="mb-8">
                    <span className="text-xs font-black uppercase tracking-widest text-[#B45309] block mb-1">
                        Hoàn tất đặt chỗ an toàn
                    </span>
                    <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight text-gray-900 font-serif">
                        Xác Nhận & Thanh Toán
                    </h1>
                </div>

                {errorMessage && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-none text-xs font-semibold mb-6 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{errorMessage}</span>
                    </div>
                )}

                <form onSubmit={handleFormSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    {/* Left: Contact Info & Payment Options */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Section 1: Contact Details */}
                        <div className="bg-white p-6 border border-gray-200 shadow-sm">
                            <h2 className="text-sm font-black uppercase tracking-wider text-gray-900 mb-4 pb-2 border-b border-gray-100 flex items-center gap-2">
                                <User className="w-4 h-4 text-black" />
                                1. Thông Tin Người Đại Diện Đặt Chỗ
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[11px] font-black uppercase tracking-wider text-gray-600 mb-1">
                                        Họ và Tên *
                                    </label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                                        <input
                                            type="text"
                                            required
                                            value={fullName}
                                            onChange={(e) => setCustomFullName(e.target.value)}
                                            placeholder="Nguyễn Văn A"
                                            className="w-full pl-9 pr-3 py-2 text-xs font-semibold border border-gray-200 focus:outline-none focus:border-black"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[11px] font-black uppercase tracking-wider text-gray-600 mb-1">
                                        Email Nhận Vé / Xác Nhận *
                                    </label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                                        <input
                                            type="email"
                                            required
                                            value={email}
                                            onChange={(e) => setCustomEmail(e.target.value)}
                                            placeholder="email@example.com"
                                            className="w-full pl-9 pr-3 py-2 text-xs font-semibold border border-gray-200 focus:outline-none focus:border-black"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[11px] font-black uppercase tracking-wider text-gray-600 mb-1">
                                        Số Điện Thoại Liên Hệ *
                                    </label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                                        <input
                                            type="tel"
                                            required
                                            value={phone}
                                            onChange={(e) => setCustomPhone(e.target.value)}
                                            placeholder="0912 345 678"
                                            className="w-full pl-9 pr-3 py-2 text-xs font-semibold border border-gray-200 focus:outline-none focus:border-black"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[11px] font-black uppercase tracking-wider text-gray-600 mb-1">
                                        Ghi Chú Đặc Biệt (Tùy chọn)
                                    </label>
                                    <input
                                        type="text"
                                        value={specialNotes}
                                        onChange={(e) => setSpecialNotes(e.target.value)}
                                        placeholder="Yêu cầu ăn chay, ghế trẻ em..."
                                        className="w-full px-3 py-2 text-xs font-semibold border border-gray-200 focus:outline-none focus:border-black"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Payment Methods */}
                        <div className="bg-white p-6 border border-gray-200 shadow-sm">
                            <h2 className="text-sm font-black uppercase tracking-wider text-gray-900 mb-4 pb-2 border-b border-gray-100 flex items-center gap-2">
                                <CreditCard className="w-4 h-4 text-black" />
                                2. Phương Thức Thanh Toán
                            </h2>

                            <div className="space-y-3">
                                {/* Option 1: VietQR Bank Transfer */}
                                <label
                                    className={`flex items-start gap-4 p-4 border cursor-pointer transition-all ${
                                        paymentMethod === 'bank_transfer'
                                            ? 'border-black bg-yellow-50/20 ring-1 ring-black'
                                            : 'border-gray-200 hover:border-gray-400 bg-white'
                                    }`}
                                >
                                    <input
                                        type="radio"
                                        name="payment_method"
                                        value="bank_transfer"
                                        checked={paymentMethod === 'bank_transfer'}
                                        onChange={() => setPaymentMethod('bank_transfer')}
                                        className="mt-1"
                                    />
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <QrCode className="w-4 h-4 text-blue-600" />
                                            <span className="text-xs font-black uppercase tracking-wide text-gray-900">
                                                Chuyển Khoản Ngân Hàng (VietQR Quét Mã Tức Thì)
                                            </span>
                                            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5">
                                                Khuyên dùng
                                            </span>
                                        </div>
                                        <p className="text-[11px] text-gray-500 mt-1">
                                            Quét mã QR tự động điền số tiền và nội dung chuyển khoản từ bất kỳ app ngân hàng nào (Vietcombank, MB, Techcombank, VPBank...).
                                        </p>
                                    </div>
                                </label>

                                {/* Option 2: MoMo */}
                                <label
                                    className={`flex items-start gap-4 p-4 border cursor-pointer transition-all ${
                                        paymentMethod === 'momo'
                                            ? 'border-black bg-yellow-50/20 ring-1 ring-black'
                                            : 'border-gray-200 hover:border-gray-400 bg-white'
                                    }`}
                                >
                                    <input
                                        type="radio"
                                        name="payment_method"
                                        value="momo"
                                        checked={paymentMethod === 'momo'}
                                        onChange={() => setPaymentMethod('momo')}
                                        className="mt-1"
                                    />
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="w-4 h-4 rounded-full bg-pink-600 text-white flex items-center justify-center text-[10px] font-black">
                                                M
                                            </span>
                                            <span className="text-xs font-black uppercase tracking-wide text-gray-900">
                                                Ví Điện Tử MoMo
                                            </span>
                                        </div>
                                        <p className="text-[11px] text-gray-500 mt-1">
                                            Thanh toán nhanh qua ví điện tử MoMo trên điện thoại hoặc quét QR.
                                        </p>
                                    </div>
                                </label>

                                {/* Option 3: VNPay */}
                                <label
                                    className={`flex items-start gap-4 p-4 border cursor-pointer transition-all ${
                                        paymentMethod === 'vnpay'
                                            ? 'border-black bg-yellow-50/20 ring-1 ring-black'
                                            : 'border-gray-200 hover:border-gray-400 bg-white'
                                    }`}
                                >
                                    <input
                                        type="radio"
                                        name="payment_method"
                                        value="vnpay"
                                        checked={paymentMethod === 'vnpay'}
                                        onChange={() => setPaymentMethod('vnpay')}
                                        className="mt-1"
                                    />
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <CreditCard className="w-4 h-4 text-red-600" />
                                            <span className="text-xs font-black uppercase tracking-wide text-gray-900">
                                                Cổng Thanh Toán VNPAY / Thẻ ATM / Thẻ Quốc Tế
                                            </span>
                                        </div>
                                        <p className="text-[11px] text-gray-500 mt-1">
                                            Hỗ trợ thẻ ATM nội địa 40+ ngân hàng Việt Nam và thẻ quốc tế Visa / Mastercard / JCB.
                                        </p>
                                    </div>
                                </label>

                                {/* Option 4: Installment / Loan */}
                                <label
                                    className={`flex items-start gap-4 p-4 border cursor-pointer transition-all ${
                                        paymentMethod === 'f88_loan'
                                            ? 'border-black bg-yellow-50/20 ring-1 ring-black'
                                            : 'border-gray-200 hover:border-gray-400 bg-white'
                                    }`}
                                >
                                    <input
                                        type="radio"
                                        name="payment_method"
                                        value="f88_loan"
                                        checked={paymentMethod === 'f88_loan'}
                                        onChange={() => setPaymentMethod('f88_loan')}
                                        className="mt-1"
                                    />
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <Clock className="w-4 h-4 text-emerald-600" />
                                            <span className="text-xs font-black uppercase tracking-wide text-gray-900">
                                                Du Lịch Trước - Trả Góp Sau (Hỗ Trợ Tài Chính)
                                            </span>
                                        </div>
                                        <p className="text-[11px] text-gray-500 mt-1">
                                            Dành cho các chuyến đi dài ngày với hình thức trả góp linh hoạt lãi suất thấp.
                                        </p>
                                    </div>
                                </label>
                            </div>
                        </div>

                        {/* Terms checkbox */}
                        <div className="bg-white p-4 border border-gray-200 flex items-start gap-3">
                            <input
                                type="checkbox"
                                id="terms"
                                checked={agreeTerms}
                                onChange={(e) => setAgreeTerms(e.target.checked)}
                                className="mt-0.5"
                            />
                            <label htmlFor="terms" className="text-xs text-gray-600 leading-relaxed cursor-pointer">
                                Tôi xác nhận các thông tin trên là chính xác và hoàn toàn đồng ý với{' '}
                                <Link href="/about-us" className="text-black font-bold underline">
                                    Điều khoản sử dụng dịch vụ
                                </Link>{' '}
                                và chính sách hoàn hủy của Natura Travel.
                            </label>
                        </div>
                    </div>

                    {/* Right: Order Summary Sticky Card */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-24 bg-white border-2 border-black p-6 shadow-xl">
                            <span className="text-[10px] font-black uppercase tracking-widest text-[#B45309] block mb-1">
                                Tóm Tắt Đơn Đặt Chỗ
                            </span>
                            <h3 className="text-lg font-black uppercase tracking-tight text-gray-900 pb-4 border-b border-gray-100">
                                {itemTitle}
                            </h3>

                            <div className="py-4 space-y-2.5 text-xs border-b border-gray-100">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Loại dịch vụ:</span>
                                    <span className="font-bold uppercase text-gray-800">{type}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Số lượng khách:</span>
                                    <span className="font-semibold text-gray-800">{guests} người</span>
                                </div>
                                {type === 'combo' && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Lưu trú:</span>
                                        <span className="font-semibold text-gray-800">{nights} đêm</span>
                                    </div>
                                )}
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Thuế & Phí:</span>
                                    <span className="font-semibold text-emerald-600">Đã bao gồm</span>
                                </div>
                            </div>

                            <div className="py-4 flex items-baseline justify-between">
                                <div>
                                    <span className="text-[11px] font-black uppercase tracking-wider text-gray-500 block">
                                        Tổng Tiền Thanh Toán:
                                    </span>
                                    <span className="text-2xl font-black text-red-600">
                                        {formatCurrency(totalPrice)}
                                    </span>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full bg-black text-[#FACC15] hover:bg-gray-800 py-4 px-4 text-xs font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {isSubmitting ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-[#FACC15] border-t-transparent rounded-full animate-spin"></div>
                                        Đang Xử Lý Giao Dịch...
                                    </>
                                ) : (
                                    <>
                                        <ShieldCheck className="w-4 h-4" /> Thanh Toán Ngay
                                    </>
                                )}
                            </button>

                            <div className="mt-4 pt-4 border-t border-gray-100 space-y-2 text-[11px] text-gray-500">
                                <div className="flex items-center gap-1.5">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                    <span>Hỗ trợ hủy miễn phí theo chính sách từng tour</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                                    <span>Tích lũy điểm thưởng thành viên Natura Club</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </form>
            </div>

            {/* VietQR Modal */}
            {qrData && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white max-w-md w-full p-6 text-center border-4 border-black shadow-2xl animate-in fade-in zoom-in-95">
                        <span className="text-[10px] font-black uppercase tracking-widest bg-[#FACC15] text-black px-3 py-1 inline-block mb-3">
                            Quét Mã Chuyển Khoản VietQR
                        </span>
                        <h3 className="text-xl font-black uppercase tracking-tight text-gray-900 mb-1">
                            Thanh Toán Đơn #{qrData.bookingId.slice(0, 8)}
                        </h3>
                        <p className="text-xs text-gray-500 mb-4">
                            Mở ứng dụng ngân hàng bất kỳ để quét mã QR bên dưới
                        </p>

                        <div className="relative w-64 h-64 mx-auto border-2 border-gray-200 p-2 mb-4 bg-white">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={qrData.qrUrl}
                                alt="VietQR Payment Code"
                                className="w-full h-full object-contain"
                            />
                        </div>

                        <div className="bg-gray-50 p-3 text-xs text-left space-y-1.5 mb-6 border border-gray-200">
                            <div className="flex justify-between">
                                <span className="text-gray-500">Số tiền:</span>
                                <span className="font-black text-red-600 text-sm">{formatCurrency(qrData.amount)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Mã giao dịch:</span>
                                <span className="font-mono font-bold text-gray-800">{qrData.transactionId}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Trạng thái:</span>
                                <span className="text-amber-600 font-bold">Chờ nhận tiền...</span>
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <button
                                type="button"
                                onClick={handleConfirmTransferDone}
                                className="w-full bg-black text-[#FACC15] hover:bg-gray-800 py-3 text-xs font-black uppercase tracking-widest"
                            >
                                Tôi Đã Chuyển Khoản Thành Công
                            </button>
                            <button
                                type="button"
                                onClick={() => setQrData(null)}
                                className="w-full border border-gray-200 py-2.5 text-xs font-bold text-gray-600 hover:text-black"
                            >
                                Đóng lại
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// (Đã thêm)
export default function CheckoutPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-black border-t-[#FACC15] rounded-full animate-spin"></div>
            </div>
        }>
            <CheckoutContent />
        </Suspense>
    );
}

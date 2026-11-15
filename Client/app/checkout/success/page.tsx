'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
    CheckCircle2,
    FileText,
    ArrowRight,
    Sparkles,
    ShieldCheck,
} from 'lucide-react';

// (Đã thêm)
const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        maximumFractionDigits: 0,
    }).format(amount);
};

// (Đã thêm)
function CheckoutSuccessContent() {
    const searchParams = useSearchParams();
    const bookingId = searchParams.get('booking_id') || 'NT_CONFIRMED_BOOKING';
    const amount = Number(searchParams.get('amount')) || 0;
    const method = searchParams.get('method') || 'bank_transfer';

    // (Đã thêm)
    const getMethodLabel = (m: string) => {
        switch (m) {
            case 'bank_transfer':
                return 'Chuyển khoản ngân hàng (VietQR)';
            case 'momo':
                return 'Ví điện tử MoMo';
            case 'vnpay':
                return 'Cổng VNPAY / Thẻ thanh toán';
            case 'f88_loan':
                return 'Trả góp du lịch Natura Financial';
            default:
                return 'Thanh toán trực tuyến';
        }
    };

    return (
        <div className="min-h-screen bg-[#FDFBF7] py-16 px-6 lg:px-12 flex items-center justify-center">
            <div className="max-w-2xl w-full bg-white border-2 border-black p-8 md:p-12 shadow-2xl text-center">
                <div className="w-16 h-16 bg-[#FACC15] rounded-full flex items-center justify-center mx-auto mb-6 text-black border-2 border-black">
                    <CheckCircle2 className="w-10 h-10" />
                </div>

                <span className="text-xs font-black uppercase tracking-widest text-[#B45309] block mb-2">
                    Đặt Chỗ Thành Công · Booking Confirmed
                </span>
                <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight text-gray-900 font-serif mb-4">
                    Chúc mừng bạn đã hoàn tất!
                </h1>
                <p className="text-xs md:text-sm text-gray-600 max-w-lg mx-auto leading-relaxed mb-8">
                    Cảm ơn bạn đã lựa chọn Natura Travel. Chúng tôi đã gửi email xác nhận và chi tiết mã vé điện tử đến hộp thư của bạn.
                </p>

                {/* Details Card */}
                <div className="bg-gray-50 border border-gray-200 p-6 text-left space-y-3 mb-8">
                    <div className="flex justify-between items-center text-xs pb-3 border-b border-gray-200">
                        <span className="text-gray-500 font-medium">Mã đặt chỗ (Booking ID):</span>
                        <span className="font-mono font-black text-sm text-black">{bookingId}</span>
                    </div>

                    {amount > 0 && (
                        <div className="flex justify-between items-center text-xs pb-3 border-b border-gray-200">
                            <span className="text-gray-500 font-medium">Tổng tiền thanh toán:</span>
                            <span className="font-black text-red-600 text-base">{formatCurrency(amount)}</span>
                        </div>
                    )}

                    <div className="flex justify-between items-center text-xs pb-3 border-b border-gray-200">
                        <span className="text-gray-500 font-medium">Phương thức:</span>
                        <span className="font-bold text-gray-800">{getMethodLabel(method)}</span>
                    </div>

                    <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-500 font-medium">Trạng thái:</span>
                        <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-100/60 font-black px-2 py-0.5 text-[11px]">
                            <ShieldCheck className="w-3.5 h-3.5" /> Đã ghi nhận hệ thống
                        </span>
                    </div>
                </div>

                {/* Next Steps Guide */}
                <div className="border border-dashed border-gray-300 p-4 mb-8 text-left text-xs space-y-2 bg-yellow-50/30">
                    <h3 className="font-black uppercase tracking-wide text-gray-800 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-amber-500" />
                        Các bước tiếp theo cần lưu ý:
                    </h3>
                    <ul className="list-disc list-inside text-gray-600 space-y-1 pl-1">
                        <li>Kiểm tra email để nhận vé điện tử (e-ticket) hoặc voucher phòng.</li>
                        <li>Mang theo CCCD/Hộ chiếu bản gốc khi làm thủ tục check-in hoặc đón xe.</li>
                        <li>Đội ngũ hỗ trợ 24/7 của Natura Travel luôn sẵn sàng hỗ trợ qua hotline 1900 8888.</li>
                    </ul>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Link
                        href="/bookings"
                        className="bg-black text-[#FACC15] hover:bg-gray-800 py-3.5 px-6 text-xs font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
                    >
                        <FileText className="w-4 h-4" /> Xem Quản Lý Đơn Hàng
                    </Link>
                    <Link
                        href="/"
                        className="border border-black text-black hover:bg-black hover:text-white py-3.5 px-6 text-xs font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
                    >
                        Về Trang Chủ <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
            </div>
        </div>
    );
}

// (Đã thêm)
export default function CheckoutSuccessPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-black border-t-[#FACC15] rounded-full animate-spin"></div>
            </div>
        }>
            <CheckoutSuccessContent />
        </Suspense>
    );
}

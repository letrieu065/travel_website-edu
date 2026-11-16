'use client';

/**
 * ============================================================================
 * MODULE FLIGHTS - DETAIL PAGE (Trang Chi Tiết Chuyến Bay & Boarding Pass)
 * ============================================================================
 * Chịu trách nhiệm:
 * - Trình bày thông tin vé máy bay điện tử (E-Ticket / Boarding Pass).
 * - Chi tiết loại máy bay, hành lý xách tay/ký gửi, suất ăn và dịch vụ trên khoang.
 * - Cho phép chọn số lượng hành khách và tính toán tổng chi phí vé theo thời gian thực.
 * - Kết nối trực tiếp API Backend: GET /api/v1/flights/:id
 * ============================================================================
 */

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    Plane,
    Clock,
    ShieldCheck,
    CheckCircle,
    ArrowLeft,
    AlertCircle,
    Luggage,
    Coffee,
    Armchair,
    Ticket,
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3600';

interface PlaneInfo {
    id: string;
    model: string;
    airline: string;
    seat_capacity: number;
}

interface FlightDetail {
    id: string;
    flight_number: string;
    departure_airport: string;
    arrival_airport: string;
    departure_time: string;
    arrival_time: string;
    ticket_price: number;
    available_seats: number;
    planes?: PlaneInfo | null;
}

// (Đã thêm)
const formatCurrency = (val: number | string | null | undefined): string => {
    if (val === null || val === undefined) return '0 ₫';
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        maximumFractionDigits: 0,
    }).format(Number(val));
};

// (Đã thêm)
const formatDateTime = (isoString?: string | null): { date: string; time: string } => {
    if (!isoString) return { date: 'N/A', time: '--:--' };
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return { date: 'N/A', time: '--:--' };

    const date = d.toLocaleDateString('vi-VN', {
        weekday: 'short',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
    const time = d.toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    });
    return { date, time };
};

// (Đã thêm)
const calculateDuration = (startIso: string, endIso: string): string => {
    const start = new Date(startIso).getTime();
    const end = new Date(endIso).getTime();
    if (isNaN(start) || isNaN(end) || end <= start) return '2h 00m';

    const diffMinutes = Math.floor((end - start) / (1000 * 60));
    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;
    return `${hours} giờ ${minutes < 10 ? '0' : ''}${minutes} phút`;
};

export default function FlightDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const resolvedParams = use(params);
    const flightId = resolvedParams.id;
    const router = useRouter();

    const [flight, setFlight] = useState<FlightDetail | null>(null);
    const [passengerCount, setPassengerCount] = useState<number>(1);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');
    const [bookingSuccess, setBookingSuccess] = useState(false);

    useEffect(() => {
        let isCancelled = false;

        // (Đã thêm)
        const executeFetchFlight = async () => {
            try {
                const res = await fetch(`${API_URL}/api/v1/flights/${flightId}`);
                if (!res.ok) {
                    throw new Error(`Không tìm thấy chuyến bay (mã lỗi ${res.status})`);
                }
                const data = await res.json();
                if (data.status !== 'success' || !data.flight) {
                    throw new Error(data.message || 'Không thể lấy thông tin chuyến bay');
                }
                if (!isCancelled) {
                    setFlight(data.flight);
                    setErrorMessage('');
                }
            } catch (err: unknown) {
                if (!isCancelled) {
                    const msg = err instanceof Error ? err.message : 'Lỗi kết nối máy chủ';
                    setErrorMessage(msg);
                }
            } finally {
                if (!isCancelled) {
                    setIsLoading(false);
                }
            }
        };

        executeFetchFlight();

        return () => {
            isCancelled = true;
        };
    }, [flightId]);

    // (Đã thêm)
    const handleBookingSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setBookingSuccess(true);
        setTimeout(() => {
            router.push('/login');
        }, 2000);
    };

    if (isLoading) {
        return (
            <div className="max-w-5xl mx-auto px-6 py-20">
                <div className="animate-pulse space-y-6">
                    <div className="h-8 bg-gray-200 w-1/3" />
                    <div className="h-64 bg-gray-200 w-full" />
                </div>
            </div>
        );
    }

    if (errorMessage || !flight) {
        return (
            <div className="max-w-4xl mx-auto px-6 py-24 text-center">
                <AlertCircle className="w-16 h-16 mx-auto text-red-500 mb-4" />
                <h1 className="text-2xl font-black uppercase tracking-tight text-gray-900">
                    {errorMessage || 'Không tìm thấy chuyến bay'}
                </h1>
                <p className="mt-2 text-gray-600 text-sm">
                    Chuyến bay này có thể đã khởi hành hoặc không tồn tại.
                </p>
                <Link
                    href="/flights"
                    className="mt-6 inline-flex items-center gap-2 bg-black text-white px-6 py-3 text-xs font-black uppercase tracking-wider hover:bg-gray-800 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" /> Quay lại danh sách Chuyến bay
                </Link>
            </div>
        );
    }

    const airlineName = flight.planes?.airline || 'Hãng hàng không';
    const planeModel = flight.planes?.model || 'Airbus / Boeing';
    const depTime = formatDateTime(flight.departure_time);
    const arrTime = formatDateTime(flight.arrival_time);
    const duration = calculateDuration(flight.departure_time, flight.arrival_time);
    const totalPrice = flight.ticket_price * passengerCount;

    return (
        <div className="w-full min-h-screen bg-gray-50 pb-24">
            {/* Breadcrumb Bar */}
            <div className="bg-white border-b border-gray-200 py-4 px-6">
                <div className="max-w-7xl mx-auto flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-500">
                    <Link href="/" className="hover:text-black">Trang chủ</Link>
                    <span>/</span>
                    <Link href="/flights" className="hover:text-black">Chuyến bay</Link>
                    <span>/</span>
                    <span className="text-black">{flight.flight_number}</span>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 mt-8">
                {/* Header */}
                <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="bg-black text-white px-3 py-1 text-xs font-black uppercase tracking-wider">
                                {airlineName}
                            </span>
                            <span className="text-xs font-bold text-gray-600">
                                Số hiệu: <strong className="text-black">{flight.flight_number}</strong>
                            </span>
                        </div>
                        <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-gray-900">
                            Chuyến bay {flight.departure_airport} đến {flight.arrival_airport}
                        </h1>
                    </div>

                    <Link
                        href="/flights"
                        className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gray-600 hover:text-black self-start sm:self-auto"
                    >
                        <ArrowLeft className="w-4 h-4" /> Đổi chuyến bay khác
                    </Link>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    {/* Left Column: Boarding Pass Style Ticket */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Boarding Card */}
                        <div className="bg-white border border-gray-200 shadow-sm overflow-hidden">
                            <div className="bg-black text-white px-6 py-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Ticket className="w-5 h-5 text-[#FACC15]" />
                                    <span className="text-xs font-black uppercase tracking-widest">
                                        Vé Máy Bay Điện Tử
                                    </span>
                                </div>
                                <span className="text-xs font-bold text-gray-300">
                                    Hạng Phổ Thông (Economy)
                                </span>
                            </div>

                            <div className="p-8">
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-center border-b border-gray-100 pb-8">
                                    {/* Điểm đi */}
                                    <div>
                                        <span className="text-xs font-bold text-gray-400 uppercase block mb-1">
                                            Khởi hành
                                        </span>
                                        <span className="text-3xl font-black text-black block">
                                            {depTime.time}
                                        </span>
                                        <p className="text-sm font-bold text-gray-800 uppercase mt-1">
                                            {flight.departure_airport}
                                        </p>
                                        <span className="text-xs text-gray-500 block mt-0.5">
                                            {depTime.date}
                                        </span>
                                    </div>

                                    {/* Timeline icon */}
                                    <div className="flex flex-col items-center justify-center text-center">
                                        <span className="text-xs font-bold text-gray-500 mb-1 flex items-center gap-1">
                                            <Clock className="w-3.5 h-3.5" /> {duration}
                                        </span>
                                        <div className="relative w-full flex items-center justify-center">
                                            <div className="h-[2px] bg-gray-300 w-full" />
                                            <Plane className="w-5 h-5 text-black absolute" />
                                        </div>
                                        <span className="text-[10px] font-black uppercase text-green-700 mt-2 bg-green-50 px-2.5 py-0.5 border border-green-200">
                                            Bay thẳng
                                        </span>
                                    </div>

                                    {/* Điểm đến */}
                                    <div className="sm:text-right">
                                        <span className="text-xs font-bold text-gray-400 uppercase block mb-1">
                                            Hạ cánh
                                        </span>
                                        <span className="text-3xl font-black text-black block">
                                            {arrTime.time}
                                        </span>
                                        <p className="text-sm font-bold text-gray-800 uppercase mt-1">
                                            {flight.arrival_airport}
                                        </p>
                                        <span className="text-xs text-gray-500 block mt-0.5">
                                            {arrTime.date}
                                        </span>
                                    </div>
                                </div>

                                {/* Aircraft & Seat details */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6">
                                    <div>
                                        <span className="text-[11px] font-bold text-gray-400 uppercase block">Hãng bay</span>
                                        <p className="text-xs font-black text-gray-900 mt-1">{airlineName}</p>
                                    </div>
                                    <div>
                                        <span className="text-[11px] font-bold text-gray-400 uppercase block">Tàu bay</span>
                                        <p className="text-xs font-black text-gray-900 mt-1">{planeModel}</p>
                                    </div>
                                    <div>
                                        <span className="text-[11px] font-bold text-gray-400 uppercase block">Số ghế còn</span>
                                        <p className="text-xs font-black text-gray-900 mt-1">{flight.available_seats} chỗ</p>
                                    </div>
                                    <div>
                                        <span className="text-[11px] font-bold text-gray-400 uppercase block">Cửa ra máy bay</span>
                                        <p className="text-xs font-black text-gray-900 mt-1">Thông báo tại sân bay</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Baggage & Fare Benefits */}
                        <div className="bg-white p-8 border border-gray-200">
                            <h2 className="text-lg font-black uppercase tracking-tight text-gray-900 mb-6 pb-2 border-b border-gray-100">
                                Tiện ích chuyến bay & Quy định hành lý
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="flex items-start gap-3 p-4 bg-gray-50 border border-gray-100">
                                    <Luggage className="w-5 h-5 text-black shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-xs font-black uppercase text-gray-900">Hành lý xách tay 7kg</p>
                                        <p className="text-[11px] text-gray-600 mt-0.5">Mỗi hành khách được mang 01 kiện xách tay tiêu chuẩn.</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3 p-4 bg-gray-50 border border-gray-100">
                                    <Luggage className="w-5 h-5 text-black shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-xs font-black uppercase text-gray-900">Hành lý ký gửi 20kg</p>
                                        <p className="text-[11px] text-gray-600 mt-0.5">Đã bao gồm trong chi phí vé chuyến bay.</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3 p-4 bg-gray-50 border border-gray-100">
                                    <Coffee className="w-5 h-5 text-black shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-xs font-black uppercase text-gray-900">Suất ăn nhẹ & Nước uống</p>
                                        <p className="text-[11px] text-gray-600 mt-0.5">Phục vụ đồ uống tinh khiết và đồ ăn nhẹ miễn phí trên máy bay.</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3 p-4 bg-gray-50 border border-gray-100">
                                    <Armchair className="w-5 h-5 text-black shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-xs font-black uppercase text-gray-900">Ghế ngồi êm ái</p>
                                        <p className="text-[11px] text-gray-600 mt-0.5">Khoảng cách để chân rộng rãi, thoải mái suốt hành trình.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Pricing & Booking Widget */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-24 bg-white p-6 border border-gray-200 shadow-xl">
                            <div className="border-b border-gray-200 pb-4 mb-4">
                                <span className="text-xs font-black uppercase tracking-wider text-gray-400 block mb-1">
                                    Giá vé mỗi khách
                                </span>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-3xl font-black text-black">
                                        {formatCurrency(flight.ticket_price)}
                                    </span>
                                </div>
                                <p className="text-[11px] text-gray-500 mt-1">Đã bao gồm thuế, phí sân bay và hành lý ký gửi.</p>
                            </div>

                            <form onSubmit={handleBookingSubmit} className="space-y-4">
                                {/* Chọn số lượng hành khách */}
                                <div>
                                    <label className="block text-xs font-black uppercase tracking-wider text-gray-700 mb-1.5">
                                        Số lượng hành khách
                                    </label>
                                    <div className="flex items-center border border-gray-300">
                                        <button
                                            type="button"
                                            onClick={() => setPassengerCount((p) => Math.max(1, p - 1))}
                                            className="w-10 h-10 flex items-center justify-center font-black text-lg bg-gray-50 hover:bg-gray-100 border-r border-gray-300"
                                        >
                                            -
                                        </button>
                                        <input
                                            type="number"
                                            min={1}
                                            max={flight.available_seats || 10}
                                            value={passengerCount}
                                            onChange={(e) => setPassengerCount(Math.max(1, Number(e.target.value) || 1))}
                                            className="w-full text-center text-sm font-black focus:outline-none"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setPassengerCount((p) => p + 1)}
                                            className="w-10 h-10 flex items-center justify-center font-black text-lg bg-gray-50 hover:bg-gray-100 border-l border-gray-300"
                                        >
                                            +
                                        </button>
                                    </div>
                                </div>

                                {/* Bảng tính tiền */}
                                <div className="border-t border-gray-200 pt-4 space-y-2 text-xs">
                                    <div className="flex justify-between text-gray-600 font-medium">
                                        <span>Vé người lớn x {passengerCount}:</span>
                                        <span>{formatCurrency(totalPrice)}</span>
                                    </div>
                                    <div className="flex justify-between text-gray-600 font-medium">
                                        <span>Thuế, phí an ninh & sân bay:</span>
                                        <span className="text-green-600 font-bold">Đã tính đủ</span>
                                    </div>
                                    <div className="flex justify-between text-base font-black text-black border-t border-gray-100 pt-2">
                                        <span>Tổng tiền vé:</span>
                                        <span>{formatCurrency(totalPrice)}</span>
                                    </div>
                                </div>

                                {bookingSuccess ? (
                                    <div className="bg-green-50 border border-green-200 text-green-700 p-3 text-xs font-bold text-center">
                                        Đang chuyển tới trang xác nhận thông tin...
                                    </div>
                                ) : (
                                    <button
                                        type="submit"
                                        disabled={flight.available_seats < passengerCount}
                                        className="w-full bg-black text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed py-3 px-4 text-xs font-black uppercase tracking-widest transition-colors shadow-md"
                                    >
                                        Xác Nhận Đặt Vé
                                    </button>
                                )}
                            </form>

                            {/* Trust badges */}
                            <div className="mt-6 pt-6 border-t border-gray-200 space-y-3 text-xs text-gray-500 font-medium">
                                <div className="flex items-center gap-2">
                                    <ShieldCheck className="w-4 h-4 text-black shrink-0" />
                                    <span>Hỗ trợ đổi vé & hoàn hủy linh hoạt theo hãng</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4 text-black shrink-0" />
                                    <span>Nhận mã đặt chỗ (PNR) qua SMS & Email ngay</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

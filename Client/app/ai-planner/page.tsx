'use client';

/**
 * ============================================================================
 * MODULE AI TRAVEL PLANNER - NATURA TRAVEL
 * ============================================================================
 * - Đồng bộ giao diện chuẩn phong cách Natura Travel (Header Cover, typography, màu sắc thương hiệu).
 * - Bên trái: Form THÔNG TIN CHUYẾN ĐI (Xuất phát, Điểm đến, Số lượng khách, Ngân sách cả đoàn, Sở thích du lịch).
 * - Bên phải: Phản hồi chính xác 100% từ Database:
 *   1. Vé máy bay đề xuất -> Dẫn tới /flights/[id]
 *   2. Tour nên thử -> Dẫn tới /tours/[id]
 *   3. Khách Sạn / Resort Đề Xuất Cần Chọn -> Dẫn tới /hotels/[id]
 *   4. Cẩm nang du lịch liên quan (Top 4 - 6 bài viết) -> Dẫn tới /handbook?id=[id]
 * ============================================================================
 */

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
    Sparkles,
    MapPin,
    Compass,
    Building2,
    Plane,
    ArrowRight,
    BookOpen,
    Clock,
    Star,
    Check,
    Loader2,
    AlertCircle,
} from 'lucide-react';
import { AirlineLogoBadge, getAirlineInfo } from '@/components/common/AirlineBranding';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3600';

const AIRPORT_CODE_TO_CITY_NAME: Record<string, string> = {
    'HAN': 'Hà Nội',
    'SGN': 'TP. Hồ Chí Minh',
    'DAD': 'Đà Nẵng',
    'CXR': 'Nha Trang',
    'PQC': 'Phú Quốc',
    'HPH': 'Hải Phòng',
    'HUI': 'Huế',
    'DLI': 'Đà Lạt',
    'VCA': 'Cần Thơ',
    'UIH': 'Quy Nhơn',
    'VII': 'Vinh',
    'BMV': 'Buôn Ma Thuột',
    'VCL': 'Chu Lai',
    'PXU': 'Pleiku',
    'VCS': 'Côn Đảo',
    'VDH': 'Đồng Hới',
    'VDO': 'Vân Đồn',
    'THD': 'Thanh Hóa',
    'DIN': 'Điện Biên',
    'TBB': 'Tuy Hòa',
};

const getCityName = (codeOrName?: string | null): string => {
    if (!codeOrName) return '';
    const upper = codeOrName.trim().toUpperCase();
    if (AIRPORT_CODE_TO_CITY_NAME[upper]) {
        return AIRPORT_CODE_TO_CITY_NAME[upper];
    }
    const match = codeOrName.match(/\(([A-Za-z]{3})\)/);
    if (match && AIRPORT_CODE_TO_CITY_NAME[match[1].toUpperCase()]) {
        return AIRPORT_CODE_TO_CITY_NAME[match[1].toUpperCase()];
    }
    return codeOrName;
};

/* ============================== INTERFACES ============================== */

interface FlightData {
    id: string;
    plane_id?: string;
    departure_time: string;
    arrival_time: string;
    ticket_price: number | string;
    available_seats: number;
    departure_airport: string;
    arrival_airport: string;
    planes?: {
        id?: string;
        airline: string;
        plane_number: string;
        total_seats?: number;
    } | null;
}

interface TourData {
    id: string;
    title: string;
    duration?: string;
    destination?: string;
    departure_location?: string;
    tour_type?: string;
    tour_images?: Array<{ url: string }>;
    tour_departures?: Array<{
        id: string;
        price: number | string;
        discount_price?: number | string | null;
    }>;
}

interface HotelData {
    id: string;
    name: string;
    city: string;
    address: string;
    star_rating?: number | null;
    price_per_night: number | string;
    discount_price?: number | string | null;
    amenities?: string[];
    hotel_images?: Array<{ url: string }>;
}

interface HandbookData {
    id: string;
    title: string;
    category?: string;
    summary?: string;
    image_url?: string;
    read_time?: string;
}

interface AIPlannerResult {
    input: {
        budget: number;
        days?: number;
        guests: number;
        interests: string[];
        destination: string;
        departure_location: string;
    };
    ai_narrative?: string | null;
    recommended_flights: FlightData[];
    recommended_tours: TourData[];
    recommended_hotels: HotelData[];
    recommended_handbooks: HandbookData[];
}

/* ============================== SUGGESTIONS DATA ============================== */

const POPULAR_ORIGINS = ['Hà Nội', 'TP. Hồ Chí Minh', 'Đà Nẵng', 'Cần Thơ', 'Hải Phòng'];

const POPULAR_DESTINATIONS = [
    'Đà Nẵng',
    'Phú Quốc',
    'Nha Trang',
    'Hạ Long',
    'Sa Pa',
    'Đà Lạt',
    'Quy Nhơn',
    'Huế',
];

const BUDGET_PRESETS = [
    { label: '5 triệu', value: 5000000 },
    { label: '10 triệu', value: 10000000 },
    { label: '15 triệu', value: 15000000 },
    { label: '20 triệu', value: 20000000 },
    { label: '30 triệu', value: 30000000 },
];

const INTEREST_OPTIONS = [
    'Biển đảo & Nghỉ dưỡng',
    'Ẩm thực bản địa',
    'Văn hóa & Di sản',
    'Khám phá thiên nhiên',
    'Check-in & Nhiếp ảnh',
    'Trekking leo núi',
    'Nghỉ dưỡng sang trọng',
    'Tiết kiệm & Trải nghiệm',
];

const formatCurrency = (amount: number | string): string => {
    const num = Number(amount) || 0;
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        maximumFractionDigits: 0,
    }).format(num);
};

const formatTime = (isoString?: string) => {
    if (!isoString) return '--:--';
    try {
        const d = new Date(isoString);
        return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false });
    } catch {
        return '--:--';
    }
};

const formatDate = (isoString?: string) => {
    if (!isoString) return '';
    try {
        const d = new Date(isoString);
        return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
        return '';
    }
};

/* ============================== COMPONENT CHÍNH ============================== */

function AIPlannerContent() {
    const searchParams = useSearchParams();

    // Form states
    const [departure, setDeparture] = useState<string>(
        searchParams.get('departure') || searchParams.get('departure_location') || 'Hà Nội'
    );
    const [destination, setDestination] = useState<string>(
        searchParams.get('destination') || 'Đà Nẵng'
    );
    const [guests, setGuests] = useState<number>(
        Number(searchParams.get('guests')) || 2
    );
    const [budget, setBudget] = useState<number>(
        Number(searchParams.get('budget')) || 10000000
    );
    const [selectedInterests, setSelectedInterests] = useState<string[]>([
        'Biển đảo & Nghỉ dưỡng',
        'Ẩm thực bản địa',
    ]);

    // AI planner API state
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<AIPlannerResult | null>(null);
    const [hasSubmitted, setHasSubmitted] = useState<boolean>(false);

    // Toggle interest selection
    const toggleInterest = (interest: string) => {
        setSelectedInterests((prev) =>
            prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]
        );
    };

    // Gọi API sinh gợi ý AI
    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();

        if (!departure.trim()) {
            setError('Vui lòng nhập hoặc chọn điểm xuất phát');
            return;
        }
        if (!destination.trim()) {
            setError('Vui lòng nhập hoặc chọn điểm đến');
            return;
        }
        if (budget <= 0) {
            setError('Vui lòng nhập ngân sách hợp lệ');
            return;
        }

        try {
            setLoading(true);
            setError(null);
            setHasSubmitted(true);

            const payload = {
                departure_location: departure.trim(),
                destination: destination.trim(),
                guests: Math.max(1, Number(guests) || 1),
                budget: Number(budget),
                interests: selectedInterests,
                days: 3, // mặc định 3 ngày
            };

            const response = await fetch(`${API_URL}/api/v1/ai/generate-itinerary`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.message || `Lỗi máy chủ (${response.status})`);
            }

            const data = await response.json();
            if (data.status === 'success' && data.data) {
                setResult(data.data);
            } else {
                throw new Error(data.message || 'Không thể tạo gợi ý từ dữ liệu');
            }
        } catch (err: unknown) {
            console.error('Lỗi AI Planner:', err);
            const msg = err instanceof Error ? err.message : 'Đã có lỗi xảy ra khi tạo kế hoạch';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    // Tự động tải gợi ý ban đầu
    useEffect(() => {
        let isMounted = true;

        const loadInitialSuggestions = async () => {
            try {
                setLoading(true);
                const payload = {
                    departure_location: departure.trim(),
                    destination: destination.trim(),
                    guests: Math.max(1, Number(guests) || 1),
                    budget: Number(budget),
                    interests: selectedInterests,
                    days: 3,
                };
                const res = await fetch(`${API_URL}/api/v1/ai/generate-itinerary`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });
                if (res.ok) {
                    const data = await res.json();
                    if (isMounted && data.status === 'success' && data.data) {
                        setResult(data.data);
                        setHasSubmitted(true);
                    }
                }
            } catch (err) {
                console.warn('Lỗi auto-fetch AI planner:', err);
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        loadInitialSuggestions();

        return () => {
            isMounted = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="min-h-screen bg-[#FDFBF7] text-gray-900 font-sans pb-28">
            {/* 1. HERO COVER BANNER ĐỒNG BỘ VỚI TOURS, FLIGHTS, HOTELS */}
            <div className="relative text-white overflow-hidden py-14 sm:py-20 border-b border-gray-800">
                <Image
                    src="https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1920&q=80"
                    alt="AI Travel Planner Cover"
                    fill
                    priority
                    sizes="100vw"
                    className="object-cover object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/55 to-black/75" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20" />

                <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center relative z-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#FACC15] text-black text-[11px] font-black uppercase tracking-widest mb-3">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Trợ Lý Thông Minh Natura Travel</span>
                    </div>
                    <h1 className="text-2xl sm:text-4xl font-black uppercase tracking-tight text-white mb-2 drop-shadow-[0_2px_12px_rgba(0,0,0,0.85)]">
                        AI Travel Planner
                    </h1>
                    <p className="max-w-2xl mx-auto text-xs sm:text-sm text-gray-200 font-medium drop-shadow-[0_1px_6px_rgba(0,0,0,0.8)]">
                        Hệ thống đối soát trực tiếp từ cơ sở dữ liệu để gợi ý vé máy bay, tour du lịch, khách sạn và cẩm nang phù hợp nhất cho chuyến đi của bạn.
                    </p>
                </div>
            </div>

            {/* 2. KHU VỰC NỘI DUNG CHÍNH (2 CỘT CHUẨN MỰC) */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 sm:mt-12">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* CỘT TRÁI (COL 1-5): BÊN HỎI THÔNG TIN "THÔNG TIN CHUYẾN ĐI" */}
                    <div className="lg:col-span-4 xl:col-span-4">
                        <div className="bg-white border border-gray-200 shadow-md p-6 sm:p-7 sticky top-24">
                            {/* Tiêu đề duy nhất theo yêu cầu */}
                            <div className="border-b border-gray-200 pb-4 mb-6">
                                <div className="flex items-center gap-2">
                                    <span className="w-2.5 h-5 bg-[#FACC15] inline-block" />
                                    <h2 className="text-lg sm:text-xl font-black uppercase tracking-tight text-gray-900">
                                        THÔNG TIN CHUYẾN ĐI
                                    </h2>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                    Điền thông số để AI tổng hợp các lựa chọn từ hệ thống.
                                </p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-5">
                                {/* Field 1: Xuất phát */}
                                <div>
                                    <label className="block text-xs font-black uppercase tracking-wider text-gray-700 mb-1.5 flex items-center justify-between">
                                        <span>Xuất phát</span>
                                        <span className="text-[10px] text-gray-400 font-normal">Nơi khởi hành</span>
                                    </label>
                                    <div className="relative">
                                        <MapPin className="w-4 h-4 text-gray-400 absolute left-3 top-3 pointer-events-none" />
                                        <input
                                            type="text"
                                            value={departure}
                                            onChange={(e) => setDeparture(e.target.value)}
                                            placeholder="Ví dụ: Hà Nội, TP.HCM, Đà Nẵng..."
                                            className="w-full pl-9 pr-3 py-2.5 text-sm bg-gray-50 border border-gray-300 focus:bg-white focus:outline-none focus:border-black font-semibold transition-colors"
                                            required
                                        />
                                    </div>
                                    {/* Gợi ý chọn nhanh xuất phát */}
                                    <div className="flex flex-wrap gap-1.5 mt-2">
                                        {POPULAR_ORIGINS.map((city) => (
                                            <button
                                                key={city}
                                                type="button"
                                                onClick={() => setDeparture(city)}
                                                className={`text-[11px] font-bold px-2 py-1 border transition-colors cursor-pointer ${
                                                    departure === city
                                                        ? 'bg-black text-[#FACC15] border-black'
                                                        : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                                                }`}
                                            >
                                                {city}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Field 2: Điểm đến */}
                                <div>
                                    <label className="block text-xs font-black uppercase tracking-wider text-gray-700 mb-1.5 flex items-center justify-between">
                                        <span>Điểm đến</span>
                                        <span className="text-[10px] text-gray-400 font-normal">Nơi bạn muốn đến</span>
                                    </label>
                                    <div className="relative">
                                        <Compass className="w-4 h-4 text-gray-400 absolute left-3 top-3 pointer-events-none" />
                                        <input
                                            type="text"
                                            value={destination}
                                            onChange={(e) => setDestination(e.target.value)}
                                            placeholder="Ví dụ: Đà Nẵng, Phú Quốc, Sa Pa..."
                                            className="w-full pl-9 pr-3 py-2.5 text-sm bg-gray-50 border border-gray-300 focus:bg-white focus:outline-none focus:border-black font-semibold transition-colors"
                                            required
                                        />
                                    </div>
                                    {/* Gợi ý chọn nhanh điểm đến */}
                                    <div className="flex flex-wrap gap-1.5 mt-2">
                                        {POPULAR_DESTINATIONS.map((dest) => (
                                            <button
                                                key={dest}
                                                type="button"
                                                onClick={() => setDestination(dest)}
                                                className={`text-[11px] font-bold px-2 py-1 border transition-colors cursor-pointer ${
                                                    destination === dest
                                                        ? 'bg-black text-[#FACC15] border-black'
                                                        : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                                                }`}
                                            >
                                                {dest}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Field 3: Số lượng khách */}
                                <div>
                                    <label className="block text-xs font-black uppercase tracking-wider text-gray-700 mb-1.5 flex items-center justify-between">
                                        <span>Số lượng khách</span>
                                        <span className="text-[10px] text-gray-400 font-normal">Thành viên cả đoàn</span>
                                    </label>
                                    <div className="flex items-center">
                                        <button
                                            type="button"
                                            onClick={() => setGuests((g) => Math.max(1, g - 1))}
                                            className="w-10 h-10 flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold border border-gray-300 cursor-pointer"
                                            aria-label="Giảm khách"
                                        >
                                            -
                                        </button>
                                        <div className="flex-1 text-center font-black text-sm py-2.5 border-y border-gray-300 bg-gray-50">
                                            {guests} người
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setGuests((g) => Math.min(30, g + 1))}
                                            className="w-10 h-10 flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold border border-gray-300 cursor-pointer"
                                            aria-label="Tăng khách"
                                        >
                                            +
                                        </button>
                                    </div>
                                </div>

                                {/* Field 4: Ngân sách cả đoàn */}
                                <div>
                                    <label className="block text-xs font-black uppercase tracking-wider text-gray-700 mb-1.5 flex items-center justify-between">
                                        <span>Ngân sách cả đoàn (VND)</span>
                                        <span className="text-[11px] font-black text-amber-600">{formatCurrency(budget)}</span>
                                    </label>
                                    <div className="relative flex items-center">
                                        <span className="text-sm font-black text-gray-500 absolute left-3 pointer-events-none select-none">
                                            ₫
                                        </span>
                                        <input
                                            type="number"
                                            step="500000"
                                            min="1000000"
                                            value={budget}
                                            onChange={(e) => setBudget(Math.max(0, Number(e.target.value)))}
                                            className="w-full pl-8 pr-12 py-2.5 text-sm bg-gray-50 border border-gray-300 focus:bg-white focus:outline-none focus:border-black font-semibold transition-colors"
                                            required
                                        />
                                        <span className="text-xs font-black text-gray-400 absolute right-3 pointer-events-none select-none">
                                            VND
                                        </span>
                                    </div>
                                    {/* Mức ngân sách chọn nhanh */}
                                    <div className="flex flex-wrap gap-1.5 mt-2">
                                        {BUDGET_PRESETS.map((p) => (
                                            <button
                                                key={p.value}
                                                type="button"
                                                onClick={() => setBudget(p.value)}
                                                className={`text-[11px] font-bold px-2 py-1 border transition-colors cursor-pointer ${
                                                    budget === p.value
                                                        ? 'bg-black text-[#FACC15] border-black'
                                                        : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                                                }`}
                                            >
                                                {p.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Field 5: Sở thích du lịch (nhấn chọn đề xuất) */}
                                <div>
                                    <label className="block text-xs font-black uppercase tracking-wider text-gray-700 mb-1.5 flex items-center justify-between">
                                        <span>Sở thích du lịch</span>
                                        <span className="text-[10px] text-gray-400 font-normal">Nhấn chọn đề xuất</span>
                                    </label>
                                    <div className="flex flex-wrap gap-1.5">
                                        {INTEREST_OPTIONS.map((interest) => {
                                            const isSelected = selectedInterests.includes(interest);
                                            return (
                                                <button
                                                    key={interest}
                                                    type="button"
                                                    onClick={() => toggleInterest(interest)}
                                                    className={`text-[11px] font-bold px-2.5 py-1.5 border transition-all cursor-pointer flex items-center gap-1.5 ${
                                                        isSelected
                                                            ? 'bg-black text-[#FACC15] border-black shadow-xs'
                                                            : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400'
                                                    }`}
                                                >
                                                    {isSelected && <Check className="w-3 h-3 text-[#FACC15]" />}
                                                    <span>{interest}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Thông báo lỗi nếu có */}
                                {error && (
                                    <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                                        <AlertCircle className="w-4 h-4 shrink-0" />
                                        <span>{error}</span>
                                    </div>
                                )}

                                {/* Nút bấm Lập Kế Hoạch */}
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-3.5 bg-black hover:bg-gray-800 text-[#FACC15] font-black uppercase tracking-wider text-xs sm:text-sm flex items-center justify-center gap-2 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-60 cursor-pointer"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin text-[#FACC15]" />
                                            <span>Đang Truy Vấn Dữ Liệu...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="w-4 h-4 text-[#FACC15]" />
                                            <span>LẬP KẾ HOẠCH BẰNG AI</span>
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* CỘT PHẢI (COL 6-12): BÊN PHẢN HỒI (VÉ MÁY BAY, TOUR, KHÁCH SẠN, HANDBOOK) */}
                    <div className="lg:col-span-8 xl:col-span-8 space-y-10">
                        {/* Trạng thái Loading */}
                        {loading && (
                            <div className="bg-white border border-gray-200 p-12 text-center shadow-xs">
                                <Loader2 className="w-10 h-10 text-amber-500 animate-spin mx-auto mb-4" />
                                <h3 className="text-base font-black uppercase tracking-wider text-gray-900 mb-1">
                                    Đang Lập Kế Hoạch & Tra Cứu Dữ Liệu Thực Tế...
                                </h3>
                                <p className="text-xs text-gray-500 max-w-md mx-auto">
                                    Hệ thống đang đối soát các chuyến bay, tour du lịch, khách sạn và cẩm nang phù hợp nhất trong cơ sở dữ liệu.
                                </p>
                            </div>
                        )}

                        {/* Khi chưa tải hoặc có kết quả */}
                        {!loading && result && (
                            <>
                                {/* AI Narrative tóm tắt lời khuyên nếu có */}
                                {result.ai_narrative && (
                                    <div className="bg-amber-50/70 border border-amber-200 p-5 rounded-none shadow-xs">
                                        <div className="flex items-start gap-3">
                                            <Sparkles className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                                            <div>
                                                <h4 className="text-xs font-black uppercase tracking-wider text-amber-900 mb-1">
                                                    Lời Khuyên Từ Trợ Lý AI
                                                </h4>
                                                <p className="text-xs sm:text-sm text-gray-700 leading-relaxed font-medium">
                                                    {result.ai_narrative}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* ============================== PHẦN 1: VÉ MÁY BAY ============================== */}
                                <section>
                                    <div className="flex items-center justify-between border-b-2 border-black pb-3 mb-5">
                                        <div className="flex items-center gap-2.5">
                                            <Plane className="w-5 h-5 text-black" />
                                            <h3 className="text-base sm:text-lg font-black uppercase tracking-tight text-gray-900">
                                                1. Gợi Ý Vé Máy Bay Phù Hợp
                                            </h3>
                                        </div>
                                        <Link
                                            href={`/flights?departure_airport=${encodeURIComponent(
                                                departure
                                            )}&arrival_airport=${encodeURIComponent(destination)}`}
                                            className="text-xs font-bold text-gray-600 hover:text-black flex items-center gap-1 uppercase tracking-wider"
                                        >
                                            <span>Xem thêm chuyến bay</span>
                                            <ArrowRight className="w-3.5 h-3.5" />
                                        </Link>
                                    </div>

                                    {result.recommended_flights && result.recommended_flights.length > 0 ? (
                                        <div className="space-y-3.5">
                                            {result.recommended_flights.map((flight) => {
                                                const airlineName = flight.planes?.airline || 'Vietnam Airlines';
                                                const airlineInfo = getAirlineInfo(airlineName);

                                                return (
                                                    <article
                                                        key={flight.id}
                                                        className="bg-white border border-gray-200 p-4 sm:p-5 hover:border-black transition-all shadow-xs hover:shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4"
                                                    >
                                                        {/* Thông tin Hãng & Chuyến bay */}
                                                        <div className="flex items-center gap-3.5 min-w-[220px]">
                                                            <AirlineLogoBadge airlineName={airlineName} size="md" />
                                                            <div>
                                                                <h4 className="text-sm font-black uppercase text-gray-900">
                                                                    {airlineInfo.name}
                                                                </h4>
                                                                <span className="text-xs text-gray-500 font-bold">
                                                                    Mã: {flight.planes?.plane_number || 'VN-AIR'}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {/* Lộ trình Giờ bay */}
                                                        <div className="flex items-center gap-4 text-center">
                                                            <div className="text-left">
                                                                <span className="text-lg font-black text-gray-900 block">
                                                                    {formatTime(flight.departure_time)}
                                                                </span>
                                                                <span className="text-xs font-black text-gray-900 block">
                                                                    {getCityName(flight.departure_airport)}
                                                                </span>
                                                                <span className="text-[10px] text-gray-400 block font-bold">
                                                                    {flight.departure_airport} · {formatDate(flight.departure_time)}
                                                                </span>
                                                            </div>

                                                            <div className="px-2 flex flex-col items-center">
                                                                <div className="w-16 sm:w-24 h-[1px] bg-gray-300 relative flex items-center justify-center">
                                                                    <Plane className="w-3.5 h-3.5 text-black absolute" />
                                                                </div>
                                                                <span className="text-[10px] font-bold text-green-700 mt-1 uppercase">
                                                                    Bay thẳng
                                                                </span>
                                                            </div>

                                                            <div className="text-right">
                                                                <span className="text-lg font-black text-gray-900 block">
                                                                    {formatTime(flight.arrival_time)}
                                                                </span>
                                                                <span className="text-xs font-black text-gray-900 block">
                                                                    {getCityName(flight.arrival_airport)}
                                                                </span>
                                                                <span className="text-[10px] text-gray-400 block font-bold">
                                                                    {flight.arrival_airport} · {formatDate(flight.arrival_time)}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {/* Giá & Nút Chọn Vé (Dẫn đúng tới chi tiết chuyến bay) */}
                                                        <div className="flex md:flex-col items-center md:items-end justify-between border-t md:border-t-0 border-gray-100 pt-3 md:pt-0">
                                                            <div className="text-left md:text-right">
                                                                <span className="text-[11px] text-gray-400 block font-semibold">
                                                                    Giá vé / khách
                                                                </span>
                                                                <span className="text-base sm:text-lg font-black text-black block">
                                                                    {formatCurrency(flight.ticket_price)}
                                                                </span>
                                                                <span className="text-[10px] text-gray-500 font-bold block">
                                                                    Còn {flight.available_seats} ghế
                                                                </span>
                                                            </div>

                                                            <Link
                                                                href={`/flights/${flight.id}`}
                                                                className="mt-2 px-4 py-2 bg-black hover:bg-gray-800 text-white text-xs font-black uppercase tracking-wider transition-colors inline-flex items-center gap-1"
                                                            >
                                                                <span>Chọn Vé</span>
                                                                <ArrowRight className="w-3.5 h-3.5" />
                                                            </Link>
                                                        </div>
                                                    </article>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="bg-white border border-gray-200 p-6 text-center text-xs text-gray-500">
                                            Không có chuyến bay thẳng phù hợp cho tuyến đường này trong cơ sở dữ liệu.
                                        </div>
                                    )}
                                </section>

                                {/* ============================== PHẦN 2: TOUR NÊN THỬ ============================== */}
                                <section>
                                    <div className="flex items-center justify-between border-b-2 border-black pb-3 mb-5">
                                        <div className="flex items-center gap-2.5">
                                            <Compass className="w-5 h-5 text-black" />
                                            <h3 className="text-base sm:text-lg font-black uppercase tracking-tight text-gray-900">
                                                2. Tour Du Lịch Nên Thử
                                            </h3>
                                        </div>
                                        <Link
                                            href={`/tours?search=${encodeURIComponent(destination)}`}
                                            className="text-xs font-bold text-gray-600 hover:text-black flex items-center gap-1 uppercase tracking-wider"
                                        >
                                            <span>Xem tất cả tour</span>
                                            <ArrowRight className="w-3.5 h-3.5" />
                                        </Link>
                                    </div>

                                    {result.recommended_tours && result.recommended_tours.length > 0 ? (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                            {result.recommended_tours.map((tour) => {
                                                const imageUrl =
                                                    tour.tour_images?.[0]?.url ||
                                                    'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?q=80&w=800&auto=format&fit=crop';
                                                const firstDep = tour.tour_departures?.[0];
                                                const effectivePrice = firstDep
                                                    ? firstDep.discount_price ?? firstDep.price
                                                    : 0;

                                                return (
                                                    <article
                                                        key={tour.id}
                                                        className="bg-white border border-gray-200 flex flex-col group hover:border-black transition-all shadow-xs hover:shadow-md"
                                                    >
                                                        <Link href={`/tours/${tour.id}`} className="block relative aspect-16/10 overflow-hidden bg-gray-100">
                                                            <Image
                                                                src={imageUrl}
                                                                alt={tour.title}
                                                                fill
                                                                sizes="(max-width: 768px) 100vw, 50vw"
                                                                className="object-cover group-hover:scale-105 transition-transform duration-500"
                                                            />
                                                            {tour.duration && (
                                                                <span className="absolute bottom-2.5 left-2.5 bg-black/80 backdrop-blur-xs text-[#FACC15] text-[10px] font-black uppercase tracking-wider px-2 py-1">
                                                                    {tour.duration}
                                                                </span>
                                                            )}
                                                        </Link>

                                                        <div className="p-4 flex-1 flex flex-col justify-between">
                                                            <div>
                                                                <span className="text-[10px] font-black uppercase text-gray-400 block mb-1">
                                                                    {tour.destination || 'Điểm đến'} · Khởi hành: {tour.departure_location || 'Hà Nội'}
                                                                </span>
                                                                <Link href={`/tours/${tour.id}`}>
                                                                    <h4 className="text-sm font-black text-gray-900 group-hover:text-black line-clamp-2 leading-snug hover:underline mb-2">
                                                                        {tour.title}
                                                                    </h4>
                                                                </Link>
                                                            </div>

                                                            <div className="pt-3 border-t border-gray-100 flex items-center justify-between mt-2">
                                                                <div>
                                                                    <span className="text-[10px] text-gray-400 block font-semibold">
                                                                        Giá tour / khách
                                                                    </span>
                                                                    <span className="text-sm font-black text-black">
                                                                        {effectivePrice ? formatCurrency(effectivePrice) : 'Liên hệ'}
                                                                    </span>
                                                                </div>

                                                                <Link
                                                                    href={`/tours/${tour.id}`}
                                                                    className="px-3.5 py-1.5 bg-black text-[#FACC15] hover:bg-gray-800 text-[11px] font-black uppercase tracking-wider transition-colors inline-flex items-center gap-1"
                                                                >
                                                                    <span>Chi tiết</span>
                                                                    <ArrowRight className="w-3 h-3" />
                                                                </Link>
                                                            </div>
                                                        </div>
                                                    </article>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="bg-white border border-gray-200 p-6 text-center text-xs text-gray-500">
                                            Không có tour nào phù hợp với điểm đến này trong cơ sở dữ liệu.
                                        </div>
                                    )}
                                </section>

                                {/* ============================== PHẦN 3: KHÁCH SẠN / RESORT ĐỀ XUẤT CẦN CHỌN ============================== */}
                                <section>
                                    <div className="flex items-center justify-between border-b-2 border-black pb-3 mb-5">
                                        <div className="flex items-center gap-2.5">
                                            <Building2 className="w-5 h-5 text-black" />
                                            <h3 className="text-base sm:text-lg font-black uppercase tracking-tight text-gray-900">
                                                3. Khách Sạn / Resort Đề Xuất Cần Chọn
                                            </h3>
                                        </div>
                                        <Link
                                            href={`/hotels?city=${encodeURIComponent(destination)}`}
                                            className="text-xs font-bold text-gray-600 hover:text-black flex items-center gap-1 uppercase tracking-wider"
                                        >
                                            <span>Xem tất cả khách sạn</span>
                                            <ArrowRight className="w-3.5 h-3.5" />
                                        </Link>
                                    </div>

                                    {result.recommended_hotels && result.recommended_hotels.length > 0 ? (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                            {result.recommended_hotels.map((hotel) => {
                                                const imageUrl =
                                                    hotel.hotel_images?.[0]?.url ||
                                                    'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=800&auto=format&fit=crop';
                                                const effectivePrice = hotel.discount_price ?? hotel.price_per_night;

                                                return (
                                                    <article
                                                        key={hotel.id}
                                                        className="bg-white border border-gray-200 flex flex-col group hover:border-black transition-all shadow-xs hover:shadow-md"
                                                    >
                                                        <Link href={`/hotels/${hotel.id}`} className="block relative aspect-16/10 overflow-hidden bg-gray-100">
                                                            <Image
                                                                src={imageUrl}
                                                                alt={hotel.name}
                                                                fill
                                                                sizes="(max-width: 768px) 100vw, 50vw"
                                                                className="object-cover group-hover:scale-105 transition-transform duration-500"
                                                            />
                                                            {hotel.star_rating ? (
                                                                <div className="absolute top-2.5 left-2.5 bg-black/85 px-2 py-0.5 flex items-center gap-1 text-[11px] font-black text-[#FACC15]">
                                                                    <Star className="w-3 h-3 fill-[#FACC15]" />
                                                                    <span>{hotel.star_rating} sao</span>
                                                                </div>
                                                            ) : null}
                                                        </Link>

                                                        <div className="p-4 flex-1 flex flex-col justify-between">
                                                            <div>
                                                                <span className="text-[10px] font-black uppercase text-gray-400 block mb-1">
                                                                    {hotel.city}
                                                                </span>
                                                                <Link href={`/hotels/${hotel.id}`}>
                                                                    <h4 className="text-sm font-black text-gray-900 group-hover:text-black line-clamp-1 leading-snug hover:underline mb-1">
                                                                        {hotel.name}
                                                                    </h4>
                                                                </Link>
                                                                <p className="text-xs text-gray-500 line-clamp-1 mb-2">
                                                                    {hotel.address}
                                                                </p>

                                                                {/* Tiện ích nổi bật */}
                                                                {hotel.amenities && hotel.amenities.length > 0 && (
                                                                    <div className="flex flex-wrap gap-1 mb-3">
                                                                        {hotel.amenities.slice(0, 3).map((am, idx) => (
                                                                            <span
                                                                                key={idx}
                                                                                className="text-[10px] bg-gray-100 text-gray-700 px-1.5 py-0.5 font-semibold"
                                                                            >
                                                                                {am}
                                                                            </span>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>

                                                            <div className="pt-3 border-t border-gray-100 flex items-center justify-between mt-2">
                                                                <div>
                                                                    <span className="text-[10px] text-gray-400 block font-semibold">
                                                                        Giá phòng / đêm
                                                                    </span>
                                                                    <span className="text-sm font-black text-black">
                                                                        {formatCurrency(effectivePrice)}
                                                                    </span>
                                                                </div>

                                                                <Link
                                                                    href={`/hotels/${hotel.id}`}
                                                                    className="px-3.5 py-1.5 bg-black text-[#FACC15] hover:bg-gray-800 text-[11px] font-black uppercase tracking-wider transition-colors inline-flex items-center gap-1"
                                                                >
                                                                    <span>Xem phòng</span>
                                                                    <ArrowRight className="w-3 h-3" />
                                                                </Link>
                                                            </div>
                                                        </div>
                                                    </article>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="bg-white border border-gray-200 p-6 text-center text-xs text-gray-500">
                                            Không có khách sạn nào phù hợp với điểm đến này trong cơ sở dữ liệu.
                                        </div>
                                    )}
                                </section>

                                {/* ============================== PHẦN 4: CẨM NANG DU LỊCH LIÊN QUAN (TOP 4 - 6 BÀI VIẾT) ============================== */}
                                <section>
                                    <div className="flex items-center justify-between border-b-2 border-black pb-3 mb-5">
                                        <div className="flex items-center gap-2.5">
                                            <BookOpen className="w-5 h-5 text-black" />
                                            <h3 className="text-base sm:text-lg font-black uppercase tracking-tight text-gray-900">
                                                4. Cẩm Nang Du Lịch Liên Quan Cần Thiết
                                            </h3>
                                        </div>
                                        <Link
                                            href="/handbook"
                                            className="text-xs font-bold text-gray-600 hover:text-black flex items-center gap-1 uppercase tracking-wider"
                                        >
                                            <span>Xem tất cả cẩm nang</span>
                                            <ArrowRight className="w-3.5 h-3.5" />
                                        </Link>
                                    </div>

                                    {result.recommended_handbooks && result.recommended_handbooks.length > 0 ? (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                                            {result.recommended_handbooks.slice(0, 6).map((article) => {
                                                const imageUrl =
                                                    article.image_url ||
                                                    'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=800&auto=format&fit=crop';

                                                return (
                                                    <article
                                                        key={article.id}
                                                        className="bg-white border border-gray-200 flex flex-col group hover:border-black transition-all shadow-xs hover:shadow-md"
                                                    >
                                                        <Link
                                                            href={`/handbook?id=${article.id}`}
                                                            className="block relative aspect-16/10 overflow-hidden bg-gray-100"
                                                        >
                                                            <Image
                                                                src={imageUrl}
                                                                alt={article.title}
                                                                fill
                                                                sizes="(max-width: 768px) 100vw, 33vw"
                                                                className="object-cover group-hover:scale-105 transition-transform duration-500"
                                                            />
                                                            {article.category && (
                                                                <span className="absolute top-2.5 left-2.5 bg-black/85 text-[#FACC15] text-[9px] font-black uppercase tracking-widest px-2 py-0.5 border border-yellow-400/20">
                                                                    {article.category}
                                                                </span>
                                                            )}
                                                        </Link>

                                                        <div className="p-4 flex-1 flex flex-col justify-between">
                                                            <div>
                                                                <div className="flex items-center gap-1 text-[10px] text-gray-400 font-bold mb-1.5">
                                                                    <Clock className="w-3 h-3" />
                                                                    <span>{article.read_time || '5 phút đọc'}</span>
                                                                </div>
                                                                <Link href={`/handbook?id=${article.id}`}>
                                                                    <h4 className="text-xs sm:text-sm font-black text-gray-900 group-hover:text-black line-clamp-2 leading-snug hover:underline mb-2">
                                                                        {article.title}
                                                                    </h4>
                                                                </Link>
                                                                {article.summary && (
                                                                    <p className="text-[11px] text-gray-600 line-clamp-2 leading-relaxed">
                                                                        {article.summary}
                                                                    </p>
                                                                )}
                                                            </div>

                                                            <div className="pt-3 border-t border-gray-100 mt-3">
                                                                <Link
                                                                    href={`/handbook?id=${article.id}`}
                                                                    className="text-[11px] font-black uppercase tracking-wider text-black group-hover:text-amber-600 inline-flex items-center justify-between w-full transition-colors"
                                                                >
                                                                    <span>Đọc cẩm nang</span>
                                                                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                                                                </Link>
                                                            </div>
                                                        </div>
                                                    </article>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="bg-white border border-gray-200 p-6 text-center text-xs text-gray-500">
                                            Đang cập nhật các bài viết cẩm nang liên quan.
                                        </div>
                                    )}
                                </section>
                            </>
                        )}

                        {/* Khi chưa submit và chưa có kết quả */}
                        {!loading && !result && !hasSubmitted && (
                            <div className="bg-white border border-gray-200 p-12 text-center shadow-xs">
                                <Sparkles className="w-12 h-12 text-amber-500 mx-auto mb-4" />
                                <h3 className="text-lg font-black uppercase tracking-wider text-gray-900 mb-2">
                                    Sẵn Sàng Tạo Lịch Trình Chuyến Đi Cùng AI
                                </h3>
                                <p className="text-xs sm:text-sm text-gray-600 max-w-md mx-auto leading-relaxed">
                                    Điền thông tin chuyến đi ở bảng bên trái và nhấn <strong>&ldquo;LẬP KẾ HOẠCH BẰNG AI&rdquo;</strong>.
                                    Hệ thống sẽ tra cứu toàn bộ cơ sở dữ liệu thật của Natura Travel để đề xuất vé máy bay, tour, khách sạn và cẩm nang tốt nhất cho bạn!
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function AIPlannerPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-black" />
                </div>
            }
        >
            <AIPlannerContent />
        </Suspense>
    );
}

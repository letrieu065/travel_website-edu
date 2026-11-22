'use client';

/**
 * ============================================================================
 * MODULE AI PLANNER - SMART ITINERARY (Trợ Lý AI Lập Kế Hoạch Lịch Trình)
 * ============================================================================
 * Chịu trách nhiệm:
 * - Tiếp nhận yêu cầu du lịch của khách hàng: Điểm đến, số ngày, ngân sách, sở thích.
 * - Gọi AI Backend để thiết kế lịch trình timeline chi tiết từng ngày và gợi ý chuyên sâu.
 * - Tự động liên kết các Tour du lịch và Khách sạn thực tế có sẵn trong hệ thống Natura Travel.
 * - Tính năng sao chép lịch trình (Copy to Clipboard) tiện lợi.
 * - Kết nối trực tiếp API Backend: POST /api/v1/ai/generate-itinerary
 * ============================================================================
 */

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
    Sparkles,
    Calendar,
    MapPin,
    Users,
    Compass,
    Building2,
    CheckCircle2,
    Copy,
    Bot,
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3600';

interface DailyPlanItem {
    day: number;
    title: string;
    activities: string[];
    estimated_cost: number;
}

interface RecommendedTour {
    id: string;
    title: string;
    duration?: string;
    tour_images?: Array<{ url: string }>;
    tour_departures?: Array<{ price: number; discount_price?: number | null }>;
}

interface RecommendedHotel {
    id: string;
    name: string;
    city: string;
    star_rating: number;
    price_per_night: number;
    hotel_images?: Array<{ url: string }>;
}

interface ItineraryResult {
    input: {
        budget: number;
        days: number;
        interests: string[];
        destination: string;
    };
    ai_narrative?: string | null;
    daily_plan: DailyPlanItem[];
    recommended_tours: RecommendedTour[];
    recommended_hotels: RecommendedHotel[];
}

const INTEREST_TAGS = [
    'Ẩm thực bản địa',
    'Du lịch sinh thái & Thiên nhiên',
    'Nghỉ dưỡng thư giãn',
    'Check-in & Nhiếp ảnh',
    'Di tích lịch sử & Văn hóa',
    'Phiêu lưu & Leo núi',
    'Tắm biển & Lặn ngắm san hô',
    'Trải nghiệm về đêm (Nightlife)',
];

// (Đã thêm)
const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        maximumFractionDigits: 0,
    }).format(amount);
};

// (Đã thêm)
export default function AIPlannerPage() {
    const [destination, setDestination] = useState('Đà Nẵng');
    const [days, setDays] = useState(3);
    const [budget, setBudget] = useState(6000000);
    const [guests, setGuests] = useState(2);
    const [selectedInterests, setSelectedInterests] = useState<string[]>([
        'Ẩm thực bản địa',
        'Du lịch sinh thái & Thiên nhiên',
    ]);

    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<ItineraryResult | null>(null);
    const [errorMessage, setErrorMessage] = useState('');
    const [copied, setCopied] = useState(false);

    // Toggle interest tag
    // (Đã thêm)
    const toggleInterest = (tag: string) => {
        if (selectedInterests.includes(tag)) {
            setSelectedInterests(selectedInterests.filter((t) => t !== tag));
        } else {
            setSelectedInterests([...selectedInterests, tag]);
        }
    };

    // (Đã thêm)
    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setErrorMessage('');

        try {
            const res = await fetch(`${API_URL}/api/v1/ai/generate-itinerary`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    destination: destination.trim(),
                    days: Number(days),
                    budget: Number(budget),
                    guests: Number(guests),
                    interests: selectedInterests,
                }),
            });

            const data = await res.json();
            if (res.ok && data.status === 'success' && data.data) {
                setResult(data.data);
            } else {
                throw new Error(data.message || 'Không thể tạo lịch trình AI');
            }
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Lỗi kết nối máy chủ';
            setErrorMessage(msg);
        } finally {
            setIsLoading(false);
        }
    };

    const copyTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        return () => {
            if (copyTimeoutRef.current) {
                clearTimeout(copyTimeoutRef.current);
            }
        };
    }, []);

    // (Đã thêm)
    const handleCopyPlan = () => {
        if (!result) return;
        let text = `LỊCH TRÌNH DU LỊCH ${result.input.days} NGÀY TẠI ${result.input.destination.toUpperCase()}\n`;
        text += `Ngân sách dự kiến: ${formatCurrency(result.input.budget)}\n\n`;

        result.daily_plan.forEach((dp) => {
            text += `--- ${dp.title} (Ước tính: ${formatCurrency(dp.estimated_cost)}) ---\n`;
            dp.activities.forEach((act, idx) => {
                text += `  ${idx + 1}. ${act}\n`;
            });
            text += '\n';
        });

        navigator.clipboard.writeText(text);
        setCopied(true);
        if (copyTimeoutRef.current) {
            clearTimeout(copyTimeoutRef.current);
        }
        copyTimeoutRef.current = setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="min-h-screen bg-[#FDFBF7] text-gray-900 pb-24">
            {/* Hero Section */}
            <section className="bg-[#0f141e] text-white py-14 px-6 lg:px-12 border-b border-gray-800">
                <div className="max-w-7xl mx-auto">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#FACC15] text-black text-xs font-black uppercase tracking-widest rounded-sm mb-3">
                        <Bot className="w-3.5 h-3.5" /> Natura AI Travel Engine
                    </span>
                    <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tight text-white font-serif max-w-3xl">
                        Trợ Lý AI Lập Kế Hoạch Chuyến Đi
                    </h1>
                    <p className="mt-4 text-sm md:text-base text-gray-300 max-w-2xl font-light leading-relaxed">
                        Chỉ cần chọn điểm đến, số ngày và sở thích du lịch, thuật toán AI của Natura Travel sẽ thiết kế lịch trình chi tiết từng ngày, tối ưu hóa cung đường và khớp nối dịch vụ thực tế.
                    </p>
                </div>
            </section>

            {/* Input Form & Main Body */}
            <div className="max-w-7xl mx-auto px-6 lg:px-12 pt-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    {/* Left: Input Form Controls */}
                    <div className="lg:col-span-1">
                        <div className="bg-white border-2 border-black p-6 shadow-xl sticky top-24">
                            <span className="text-[10px] font-black uppercase tracking-widest text-[#B45309] block mb-1">
                                Tùy Chỉnh Yêu Cầu
                            </span>
                            <h2 className="text-lg font-black uppercase tracking-tight text-gray-900 pb-4 border-b border-gray-100 mb-5">
                                Thông Số Hành Trình
                            </h2>

                            <form onSubmit={handleGenerate} className="space-y-5 text-xs">
                                <div>
                                    <label className="block font-black uppercase tracking-wider text-gray-600 mb-1">
                                        Điểm Đến Mong Muốn
                                    </label>
                                    <div className="relative">
                                        <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                                        <input
                                            type="text"
                                            required
                                            value={destination}
                                            onChange={(e) => setDestination(e.target.value)}
                                            placeholder="Đà Nẵng, Phú Quốc, Sa Pa..."
                                            className="w-full pl-9 pr-3 py-2.5 font-bold border border-gray-300 focus:outline-none focus:border-black"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block font-black uppercase tracking-wider text-gray-600 mb-1">
                                            Thời Gian
                                        </label>
                                        <div className="relative">
                                            <Calendar className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                                            <select
                                                value={days}
                                                onChange={(e) => setDays(Number(e.target.value))}
                                                className="w-full pl-9 pr-2 py-2.5 font-bold border border-gray-300 focus:outline-none focus:border-black bg-white"
                                            >
                                                {[1, 2, 3, 4, 5, 6, 7].map((d) => (
                                                    <option key={d} value={d}>
                                                        {d} ngày
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block font-black uppercase tracking-wider text-gray-600 mb-1">
                                            Số Khách
                                        </label>
                                        <div className="relative">
                                            <Users className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                                            <select
                                                value={guests}
                                                onChange={(e) => setGuests(Number(e.target.value))}
                                                className="w-full pl-9 pr-2 py-2.5 font-bold border border-gray-300 focus:outline-none focus:border-black bg-white"
                                            >
                                                {[1, 2, 4, 6, 8].map((g) => (
                                                    <option key={g} value={g}>
                                                        {g} người
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <div className="flex justify-between items-center mb-1">
                                        <label className="font-black uppercase tracking-wider text-gray-600">
                                            Tổng Ngân Sách Dự Kiến
                                        </label>
                                        <span className="font-bold text-red-600">{formatCurrency(budget)}</span>
                                    </div>
                                    <input
                                        type="range"
                                        min={2000000}
                                        max={30000000}
                                        step={1000000}
                                        value={budget}
                                        onChange={(e) => setBudget(Number(e.target.value))}
                                        className="w-full accent-black cursor-pointer"
                                    />
                                    <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                                        <span>2 triệu</span>
                                        <span>15 triệu</span>
                                        <span>30 triệu</span>
                                    </div>
                                </div>

                                <div>
                                    <label className="block font-black uppercase tracking-wider text-gray-600 mb-2">
                                        Sở Thích & Phong Cách Du Lịch
                                    </label>
                                    <div className="flex flex-wrap gap-1.5">
                                        {INTEREST_TAGS.map((tag) => {
                                            const isSelected = selectedInterests.includes(tag);
                                            return (
                                                <button
                                                    key={tag}
                                                    type="button"
                                                    onClick={() => toggleInterest(tag)}
                                                    className={`px-2.5 py-1 text-[11px] font-bold border transition-all ${
                                                        isSelected
                                                            ? 'bg-black text-[#FACC15] border-black'
                                                            : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-400'
                                                    }`}
                                                >
                                                    {tag}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full bg-black text-[#FACC15] hover:bg-gray-800 py-3.5 px-4 font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-2 disabled:opacity-50 mt-4"
                                >
                                    {isLoading ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-[#FACC15] border-t-transparent rounded-full animate-spin"></div>
                                            AI Đang Suy Nghĩ & Lập Kế Hoạch...
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="w-4 h-4" /> Tạo Lịch Trình Ngay
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Right: Output Timeline & Recommendations */}
                    <div className="lg:col-span-2 space-y-8">
                        {errorMessage && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-xs font-semibold">
                                {errorMessage}
                            </div>
                        )}

                        {!result && !isLoading && (
                            <div className="bg-white border-2 border-dashed border-gray-300 p-12 text-center">
                                <Bot className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-lg font-black uppercase tracking-tight text-gray-800">
                                    Chưa Có Lịch Trình Nào Được Tạo
                                </h3>
                                <p className="text-xs text-gray-500 max-w-md mx-auto mt-2 leading-relaxed">
                                    Hãy chọn các thông số bên trái và nhấn nút <strong>&quot;Tạo Lịch Trình Ngay&quot;</strong> để Natura AI phân tích và xây dựng chuyến đi hoàn hảo nhất cho bạn.
                                </p>
                            </div>
                        )}

                        {result && (
                            <div className="space-y-8 animate-in fade-in duration-500">
                                {/* Output Header Banner */}
                                <div className="bg-white border border-gray-200 p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-[#B45309] block mb-1">
                                            Kế Hoạch Đã Hoàn Thành
                                        </span>
                                        <h2 className="text-2xl font-black uppercase tracking-tight text-gray-900 font-serif">
                                            Hành Trình {result.input.days} Ngày Tại {result.input.destination}
                                        </h2>
                                        <p className="text-xs text-gray-500 mt-1">
                                            Ngân sách dự kiến: {formatCurrency(result.input.budget)} · Phù hợp {guests} khách
                                        </p>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={handleCopyPlan}
                                        className="inline-flex items-center gap-1.5 border border-black px-4 py-2 text-xs font-black uppercase tracking-wider hover:bg-black hover:text-white transition-colors shrink-0"
                                    >
                                        <Copy className="w-4 h-4" /> {copied ? 'Đã Sao Chép!' : 'Sao Chép Kế Hoạch'}
                                    </button>
                                </div>

                                {/* AI Narrative (if generated by Gemini) */}
                                {result.ai_narrative && (
                                    <div className="bg-[#0f141e] text-white p-6 border-l-4 border-[#FACC15]">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Sparkles className="w-4 h-4 text-[#FACC15]" />
                                            <span className="text-xs font-black uppercase tracking-widest text-[#FACC15]">
                                                Lời Khuyên Từ Chuyên Gia Natura AI
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-300 leading-relaxed whitespace-pre-line font-light">
                                            {result.ai_narrative}
                                        </p>
                                    </div>
                                )}

                                {/* Daily Plan Timeline */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-black uppercase tracking-widest text-gray-700">
                                        Chi Tiết Từng Ngày
                                    </h3>

                                    {result.daily_plan.map((dp) => (
                                        <div
                                            key={dp.day}
                                            className="bg-white border border-gray-200 p-6 shadow-sm relative overflow-hidden"
                                        >
                                            <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-black"></div>
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-gray-100 gap-2 mb-4">
                                                <h4 className="text-base font-black uppercase tracking-tight text-gray-900 flex items-center gap-2">
                                                    <span className="w-6 h-6 rounded-full bg-black text-[#FACC15] flex items-center justify-center text-xs font-black">
                                                        {dp.day}
                                                    </span>
                                                    {dp.title}
                                                </h4>
                                                <span className="text-xs font-bold text-gray-500">
                                                    Chi phí ước tính: {formatCurrency(dp.estimated_cost)}
                                                </span>
                                            </div>

                                            <div className="space-y-2.5">
                                                {dp.activities.map((act, idx) => (
                                                    <div key={idx} className="flex items-start gap-3 text-xs">
                                                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                                                        <span className="text-gray-700 leading-relaxed">{act}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Recommendations Section: Tours */}
                                {result.recommended_tours && result.recommended_tours.length > 0 && (
                                    <div className="bg-white p-6 border border-gray-200 shadow-sm">
                                        <h3 className="text-sm font-black uppercase tracking-tight text-gray-900 mb-4 flex items-center gap-2">
                                            <Compass className="w-4 h-4 text-emerald-600" />
                                            Tour Khám Phá Khớp Nối Với Điểm Đến
                                        </h3>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {result.recommended_tours.map((tour) => {
                                                const tourImg = tour.tour_images?.[0]?.url || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=400&q=80';
                                                const dep = tour.tour_departures?.[0];
                                                const price = dep ? Number(dep.discount_price ?? dep.price) : 0;

                                                return (
                                                    <div key={tour.id} className="border border-gray-200 p-3 flex gap-3 items-center">
                                                        <div className="relative w-16 h-16 shrink-0 bg-gray-100 overflow-hidden">
                                                            <Image
                                                                src={tourImg}
                                                                alt={tour.title}
                                                                fill
                                                                className="object-cover"
                                                            />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <h5 className="text-xs font-black uppercase tracking-tight text-gray-900 line-clamp-1">
                                                                {tour.title}
                                                            </h5>
                                                            <span className="text-[11px] font-bold text-red-600 block mt-0.5">
                                                                {formatCurrency(price)}
                                                            </span>
                                                            <Link
                                                                href={`/tours/${tour.id}`}
                                                                className="text-[10px] font-bold uppercase text-black underline hover:text-gray-600 mt-1 inline-block"
                                                            >
                                                                Xem Tour ➔
                                                            </Link>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Recommendations Section: Hotels */}
                                {result.recommended_hotels && result.recommended_hotels.length > 0 && (
                                    <div className="bg-white p-6 border border-gray-200 shadow-sm">
                                        <h3 className="text-sm font-black uppercase tracking-tight text-gray-900 mb-4 flex items-center gap-2">
                                            <Building2 className="w-4 h-4 text-blue-600" />
                                            Khách Sạn Được Gợi Ý Phù Hợp Ngân Sách
                                        </h3>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {result.recommended_hotels.map((hotel) => {
                                                const hotelImg = hotel.hotel_images?.[0]?.url || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=400&q=80';

                                                return (
                                                    <div key={hotel.id} className="border border-gray-200 p-3 flex gap-3 items-center">
                                                        <div className="relative w-16 h-16 shrink-0 bg-gray-100 overflow-hidden">
                                                            <Image
                                                                src={hotelImg}
                                                                alt={hotel.name}
                                                                fill
                                                                className="object-cover"
                                                            />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <h5 className="text-xs font-black uppercase tracking-tight text-gray-900 line-clamp-1">
                                                                {hotel.name}
                                                            </h5>
                                                            <span className="text-[11px] text-gray-500 block">
                                                                {hotel.city} · {hotel.star_rating}★
                                                            </span>
                                                            <span className="text-[11px] font-bold text-black block">
                                                                {formatCurrency(hotel.price_per_night)}/đêm
                                                            </span>
                                                            <Link
                                                                href={`/hotels/${hotel.id}`}
                                                                className="text-[10px] font-bold uppercase text-black underline hover:text-gray-600 mt-1 inline-block"
                                                            >
                                                                Xem Phòng ➔
                                                            </Link>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
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

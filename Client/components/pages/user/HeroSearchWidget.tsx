'use client';

/**
 * ============================================================================
 * MODULE HERO SEARCH WIDGET - NATURA TRAVEL
 * ============================================================================
 * - Thiết kế giao diện hiện đại theo phong cách các OTA hàng đầu (Traveloka, Booking, Agoda).
 * - Cấu trúc thẻ card nổi (floating card) với hiệu ứng bóng mềm, viền tinh tế và góc bo mềm mại.
 * - Tab chuyển đổi phân đoạn tiện lợi: Tour Du Lịch, Khách Sạn & Resort, Vé Máy Bay.
 * - Các ô nhập liệu thiết kế dạng segmented input card có icon nhận diện và nhãn rõ ràng.
 * - Nút tìm kiếm chuẩn CTA màu vàng thương hiệu Natura Travel (#FACC15) với độ tương phản cao.
 * - Giữ nguyên 100% logic điều hướng, state và URL query parameters.
 * ============================================================================
 */

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Compass,
    Building,
    Plane,
    Search,
    MapPin,
    DollarSign,
    Calendar,
    Sparkles,
    ShieldCheck,
    Clock,
    CheckCircle2,
} from 'lucide-react';

export default function HeroSearchWidget() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'tours' | 'hotels' | 'flights'>('tours');

    // Tour form
    const [tourSearch, setTourSearch] = useState('');
    const [tourType, setTourType] = useState('');
    const [tourMaxPrice, setTourMaxPrice] = useState('');

    // Hotel form
    const [hotelCity, setHotelCity] = useState('');
    const [hotelStar, setHotelStar] = useState('');
    const [hotelMaxPrice, setHotelMaxPrice] = useState('');

    // Flight form
    const [flightFrom, setFlightFrom] = useState('');
    const [flightTo, setFlightTo] = useState('');
    const [flightDate, setFlightDate] = useState('');

    const handleTourSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const params = new URLSearchParams();
        if (tourSearch.trim()) params.set('search', tourSearch.trim());
        if (tourType) params.set('tour_type', tourType);
        if (tourMaxPrice) params.set('max_price', tourMaxPrice);
        router.push(`/tours?${params.toString()}`);
    };

    const handleHotelSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const params = new URLSearchParams();
        if (hotelCity.trim()) params.set('city', hotelCity.trim());
        if (hotelStar) params.set('star_rating', hotelStar);
        if (hotelMaxPrice) params.set('max_price', hotelMaxPrice);
        router.push(`/hotels?${params.toString()}`);
    };

    const handleFlightSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const params = new URLSearchParams();
        if (flightFrom.trim()) params.set('departure_airport', flightFrom.trim());
        if (flightTo.trim()) params.set('arrival_airport', flightTo.trim());
        if (flightDate) params.set('departure_date', flightDate);
        router.push(`/flights?${params.toString()}`);
    };

    return (
        <div className="w-full max-w-6xl mx-auto">
            {/* 1. THANH TAB CHỌN DỊCH VỤ DẠNG NỔI (PILL TABS) */}
            <div className="flex flex-wrap items-center gap-2 mb-3 px-1">
                <button
                    type="button"
                    onClick={() => setActiveTab('tours')}
                    className={`flex items-center gap-2.5 px-5 py-3 rounded-t-xl sm:rounded-full text-xs sm:text-sm font-black uppercase tracking-wider transition-all duration-200 shadow-md ${
                        activeTab === 'tours'
                            ? 'bg-white text-black ring-2 ring-yellow-400 shadow-lg'
                            : 'bg-black/60 hover:bg-black/80 text-white backdrop-blur-md'
                    }`}
                >
                    <Compass className={`w-4 h-4 ${activeTab === 'tours' ? 'text-amber-500' : 'text-[#FACC15]'}`} />
                    <span>Tour Du Lịch</span>
                </button>

                <button
                    type="button"
                    onClick={() => setActiveTab('hotels')}
                    className={`flex items-center gap-2.5 px-5 py-3 rounded-t-xl sm:rounded-full text-xs sm:text-sm font-black uppercase tracking-wider transition-all duration-200 shadow-md ${
                        activeTab === 'hotels'
                            ? 'bg-white text-black ring-2 ring-yellow-400 shadow-lg'
                            : 'bg-black/60 hover:bg-black/80 text-white backdrop-blur-md'
                    }`}
                >
                    <Building className={`w-4 h-4 ${activeTab === 'hotels' ? 'text-amber-500' : 'text-[#FACC15]'}`} />
                    <span>Khách Sạn & Resort</span>
                </button>

                <button
                    type="button"
                    onClick={() => setActiveTab('flights')}
                    className={`flex items-center gap-2.5 px-5 py-3 rounded-t-xl sm:rounded-full text-xs sm:text-sm font-black uppercase tracking-wider transition-all duration-200 shadow-md ${
                        activeTab === 'flights'
                            ? 'bg-white text-black ring-2 ring-yellow-400 shadow-lg'
                            : 'bg-black/60 hover:bg-black/80 text-white backdrop-blur-md'
                    }`}
                >
                    <Plane className={`w-4 h-4 ${activeTab === 'flights' ? 'text-amber-500' : 'text-[#FACC15]'}`} />
                    <span>Vé Máy Bay</span>
                </button>

                <button
                    type="button"
                    onClick={() => router.push('/ai-planner')}
                    className="flex items-center gap-2.5 px-5 py-3 rounded-t-xl sm:rounded-full text-xs sm:text-sm font-black uppercase tracking-wider transition-all duration-200 shadow-md bg-[#FACC15] hover:bg-yellow-300 text-black border border-yellow-300 cursor-pointer sm:ml-auto"
                >
                    <Sparkles className="w-4 h-4 text-black animate-bounce" />
                    <span>✨ Trợ Lý AI Planner</span>
                </button>
            </div>

            {/* 2. CARD TÌM KIẾM CHÍNH - PHONG CÁCH TRAVELOKA / AGODA / BOOKING */}
            <div className="bg-white rounded-2xl md:rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.25)] border border-gray-100 p-4 sm:p-6 md:p-7">
                {/* 2.1 Tab Form: Tour Du Lịch */}
                {activeTab === 'tours' && (
                    <form onSubmit={handleTourSubmit}>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 sm:gap-4 items-stretch">
                            {/* Ô 1: Điểm đến hoặc từ khóa */}
                            <div className="sm:col-span-2 lg:col-span-4 group relative bg-gray-50/90 hover:bg-gray-100/90 focus-within:bg-white rounded-xl p-3.5 border border-gray-200 focus-within:border-black focus-within:ring-2 focus-within:ring-yellow-400/20 transition-all flex flex-col justify-center">
                                <div className="flex items-center gap-1.5 text-gray-500 mb-1">
                                    <MapPin className="w-3.5 h-3.5 text-amber-500 group-focus-within:text-black transition-colors" />
                                    <span className="text-[10px] font-black uppercase tracking-wider text-gray-500 group-focus-within:text-black">
                                        Điểm Đến / Từ Khóa
                                    </span>
                                </div>
                                <input
                                    type="text"
                                    placeholder="Đà Nẵng, Hạ Long, Sa Pa, Phú Quốc..."
                                    value={tourSearch}
                                    onChange={(e) => setTourSearch(e.target.value)}
                                    className="w-full bg-transparent text-xs sm:text-sm font-bold text-gray-900 placeholder:text-gray-400 placeholder:font-normal focus:outline-none"
                                />
                            </div>

                            {/* Ô 2: Loại hình tour */}
                            <div className="lg:col-span-3 group relative bg-gray-50/90 hover:bg-gray-100/90 focus-within:bg-white rounded-xl p-3.5 border border-gray-200 focus-within:border-black focus-within:ring-2 focus-within:ring-yellow-400/20 transition-all flex flex-col justify-center">
                                <div className="flex items-center gap-1.5 text-gray-500 mb-1">
                                    <Compass className="w-3.5 h-3.5 text-amber-500 group-focus-within:text-black transition-colors" />
                                    <span className="text-[10px] font-black uppercase tracking-wider text-gray-500 group-focus-within:text-black">
                                        Loại Hình Tour
                                    </span>
                                </div>
                                <select
                                    value={tourType}
                                    onChange={(e) => setTourType(e.target.value)}
                                    className="w-full bg-transparent text-xs sm:text-sm font-bold text-gray-900 focus:outline-none cursor-pointer"
                                >
                                    <option value="">Tất cả loại tour</option>
                                    <option value="Khám phá">Khám phá thiên nhiên</option>
                                    <option value="Nghỉ dưỡng">Nghỉ dưỡng cao cấp</option>
                                    <option value="Văn hóa">Di sản & Văn hóa</option>
                                </select>
                            </div>

                            {/* Ô 3: Ngân sách tối đa */}
                            <div className="lg:col-span-3 group relative bg-gray-50/90 hover:bg-gray-100/90 focus-within:bg-white rounded-xl p-3.5 border border-gray-200 focus-within:border-black focus-within:ring-2 focus-within:ring-yellow-400/20 transition-all flex flex-col justify-center">
                                <div className="flex items-center gap-1.5 text-gray-500 mb-1">
                                    <DollarSign className="w-3.5 h-3.5 text-amber-500 group-focus-within:text-black transition-colors" />
                                    <span className="text-[10px] font-black uppercase tracking-wider text-gray-500 group-focus-within:text-black">
                                        Ngân Sách Tối Đa (VNĐ)
                                    </span>
                                </div>
                                <input
                                    type="number"
                                    placeholder="Ví dụ: 15.000.000"
                                    value={tourMaxPrice}
                                    onChange={(e) => setTourMaxPrice(e.target.value)}
                                    className="w-full bg-transparent text-xs sm:text-sm font-bold text-gray-900 placeholder:text-gray-400 placeholder:font-normal focus:outline-none"
                                />
                            </div>

                            {/* Ô 4: Nút Tìm Kiếm CTA */}
                            <div className="sm:col-span-2 lg:col-span-2 flex items-stretch">
                                <button
                                    type="submit"
                                    className="w-full min-h-[52px] bg-[#FACC15] hover:bg-yellow-400 active:scale-[0.98] text-black font-black uppercase tracking-wider text-xs sm:text-sm rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2 group cursor-pointer"
                                >
                                    <Search className="w-4 h-4 text-black group-hover:scale-110 transition-transform" />
                                    <span>Tìm Tour</span>
                                </button>
                            </div>
                        </div>
                    </form>
                )}

                {/* 2.2 Tab Form: Khách Sạn & Resort */}
                {activeTab === 'hotels' && (
                    <form onSubmit={handleHotelSubmit}>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 sm:gap-4 items-stretch">
                            {/* Ô 1: Thành phố / Địa điểm */}
                            <div className="sm:col-span-2 lg:col-span-4 group relative bg-gray-50/90 hover:bg-gray-100/90 focus-within:bg-white rounded-xl p-3.5 border border-gray-200 focus-within:border-black focus-within:ring-2 focus-within:ring-yellow-400/20 transition-all flex flex-col justify-center">
                                <div className="flex items-center gap-1.5 text-gray-500 mb-1">
                                    <MapPin className="w-3.5 h-3.5 text-amber-500 group-focus-within:text-black transition-colors" />
                                    <span className="text-[10px] font-black uppercase tracking-wider text-gray-500 group-focus-within:text-black">
                                        Thành Phố / Địa Điểm
                                    </span>
                                </div>
                                <input
                                    type="text"
                                    placeholder="Đà Nẵng, Nha Trang, Phú Quốc, Sa Pa..."
                                    value={hotelCity}
                                    onChange={(e) => setHotelCity(e.target.value)}
                                    className="w-full bg-transparent text-xs sm:text-sm font-bold text-gray-900 placeholder:text-gray-400 placeholder:font-normal focus:outline-none"
                                />
                            </div>

                            {/* Ô 2: Tiêu chuẩn sao */}
                            <div className="lg:col-span-3 group relative bg-gray-50/90 hover:bg-gray-100/90 focus-within:bg-white rounded-xl p-3.5 border border-gray-200 focus-within:border-black focus-within:ring-2 focus-within:ring-yellow-400/20 transition-all flex flex-col justify-center">
                                <div className="flex items-center gap-1.5 text-gray-500 mb-1">
                                    <Building className="w-3.5 h-3.5 text-amber-500 group-focus-within:text-black transition-colors" />
                                    <span className="text-[10px] font-black uppercase tracking-wider text-gray-500 group-focus-within:text-black">
                                        Tiêu Chuẩn Sao
                                    </span>
                                </div>
                                <select
                                    value={hotelStar}
                                    onChange={(e) => setHotelStar(e.target.value)}
                                    className="w-full bg-transparent text-xs sm:text-sm font-bold text-gray-900 focus:outline-none cursor-pointer"
                                >
                                    <option value="">Tất cả hạng sao</option>
                                    <option value="5">5 sao sang trọng</option>
                                    <option value="4">4 sao cao cấp</option>
                                    <option value="3">3 sao tiện nghi</option>
                                </select>
                            </div>

                            {/* Ô 3: Giá mỗi đêm tối đa */}
                            <div className="lg:col-span-3 group relative bg-gray-50/90 hover:bg-gray-100/90 focus-within:bg-white rounded-xl p-3.5 border border-gray-200 focus-within:border-black focus-within:ring-2 focus-within:ring-yellow-400/20 transition-all flex flex-col justify-center">
                                <div className="flex items-center gap-1.5 text-gray-500 mb-1">
                                    <DollarSign className="w-3.5 h-3.5 text-amber-500 group-focus-within:text-black transition-colors" />
                                    <span className="text-[10px] font-black uppercase tracking-wider text-gray-500 group-focus-within:text-black">
                                        Giá Tối Đa / Đêm (VNĐ)
                                    </span>
                                </div>
                                <input
                                    type="number"
                                    placeholder="Ví dụ: 3.500.000"
                                    value={hotelMaxPrice}
                                    onChange={(e) => setHotelMaxPrice(e.target.value)}
                                    className="w-full bg-transparent text-xs sm:text-sm font-bold text-gray-900 placeholder:text-gray-400 placeholder:font-normal focus:outline-none"
                                />
                            </div>

                            {/* Ô 4: Nút Tìm Khách Sạn CTA */}
                            <div className="sm:col-span-2 lg:col-span-2 flex items-stretch">
                                <button
                                    type="submit"
                                    className="w-full min-h-[52px] bg-[#FACC15] hover:bg-yellow-400 active:scale-[0.98] text-black font-black uppercase tracking-wider text-xs sm:text-sm rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2 group cursor-pointer"
                                >
                                    <Search className="w-4 h-4 text-black group-hover:scale-110 transition-transform" />
                                    <span>Tìm Phòng</span>
                                </button>
                            </div>
                        </div>
                    </form>
                )}

                {/* 2.3 Tab Form: Vé Máy Bay */}
                {activeTab === 'flights' && (
                    <form onSubmit={handleFlightSubmit}>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 sm:gap-4 items-stretch">
                            {/* Ô 1: Sân bay khởi hành */}
                            <div className="lg:col-span-3 group relative bg-gray-50/90 hover:bg-gray-100/90 focus-within:bg-white rounded-xl p-3.5 border border-gray-200 focus-within:border-black focus-within:ring-2 focus-within:ring-yellow-400/20 transition-all flex flex-col justify-center">
                                <div className="flex items-center gap-1.5 text-gray-500 mb-1">
                                    <Plane className="w-3.5 h-3.5 text-amber-500 group-focus-within:text-black transition-colors" />
                                    <span className="text-[10px] font-black uppercase tracking-wider text-gray-500 group-focus-within:text-black">
                                        Sân Bay Đi
                                    </span>
                                </div>
                                <input
                                    type="text"
                                    placeholder="Hà Nội (HAN), TP.HCM (SGN)..."
                                    value={flightFrom}
                                    onChange={(e) => setFlightFrom(e.target.value)}
                                    className="w-full bg-transparent text-xs sm:text-sm font-bold text-gray-900 placeholder:text-gray-400 placeholder:font-normal focus:outline-none"
                                />
                            </div>

                            {/* Ô 2: Sân bay đến */}
                            <div className="lg:col-span-3 group relative bg-gray-50/90 hover:bg-gray-100/90 focus-within:bg-white rounded-xl p-3.5 border border-gray-200 focus-within:border-black focus-within:ring-2 focus-within:ring-yellow-400/20 transition-all flex flex-col justify-center">
                                <div className="flex items-center gap-1.5 text-gray-500 mb-1">
                                    <MapPin className="w-3.5 h-3.5 text-amber-500 group-focus-within:text-black transition-colors" />
                                    <span className="text-[10px] font-black uppercase tracking-wider text-gray-500 group-focus-within:text-black">
                                        Sân Bay Đến
                                    </span>
                                </div>
                                <input
                                    type="text"
                                    placeholder="Đà Nẵng (DAD), Phú Quốc (PQC)..."
                                    value={flightTo}
                                    onChange={(e) => setFlightTo(e.target.value)}
                                    className="w-full bg-transparent text-xs sm:text-sm font-bold text-gray-900 placeholder:text-gray-400 placeholder:font-normal focus:outline-none"
                                />
                            </div>

                            {/* Ô 3: Ngày khởi hành */}
                            <div className="lg:col-span-4 group relative bg-gray-50/90 hover:bg-gray-100/90 focus-within:bg-white rounded-xl p-3.5 border border-gray-200 focus-within:border-black focus-within:ring-2 focus-within:ring-yellow-400/20 transition-all flex flex-col justify-center">
                                <div className="flex items-center gap-1.5 text-gray-500 mb-1">
                                    <Calendar className="w-3.5 h-3.5 text-amber-500 group-focus-within:text-black transition-colors" />
                                    <span className="text-[10px] font-black uppercase tracking-wider text-gray-500 group-focus-within:text-black">
                                        Ngày Cất Cánh
                                    </span>
                                </div>
                                <input
                                    type="date"
                                    value={flightDate}
                                    onChange={(e) => setFlightDate(e.target.value)}
                                    className="w-full bg-transparent text-xs sm:text-sm font-bold text-gray-900 focus:outline-none cursor-pointer"
                                />
                            </div>

                            {/* Ô 4: Nút Tìm Chuyến Bay CTA */}
                            <div className="sm:col-span-2 lg:col-span-2 flex items-stretch">
                                <button
                                    type="submit"
                                    className="w-full min-h-[52px] bg-[#FACC15] hover:bg-yellow-400 active:scale-[0.98] text-black font-black uppercase tracking-wider text-xs sm:text-sm rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2 group cursor-pointer"
                                >
                                    <Search className="w-4 h-4 text-black group-hover:scale-110 transition-transform" />
                                    <span>Tìm Chuyến</span>
                                </button>
                            </div>
                        </div>
                    </form>
                )}

                {/* 3. CAM KẾT & TIỆN ÍCH PHONG CÁCH OTA LỚN */}
                <div className="mt-4 pt-3.5 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3 text-xs text-gray-500">
                    <div className="flex flex-wrap items-center gap-4 sm:gap-6 font-medium">
                        <span className="inline-flex items-center gap-1.5 text-gray-600">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            Đảm bảo giá tốt nhất
                        </span>
                        <span className="inline-flex items-center gap-1.5 text-gray-600">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                            Xác nhận tức thì 100%
                        </span>
                        <span className="inline-flex items-center gap-1.5 text-gray-600">
                            <Clock className="w-3.5 h-3.5 text-emerald-600" />
                            Hỗ trợ chuyên gia 24/7
                        </span>
                    </div>

                    <div className="text-[11px] text-gray-400 italic">
                        *Hơn 1.000+ tour trọn gói, khách sạn & vé bay ưu đãi hôm nay
                    </div>
                </div>
            </div>
        </div>
    );
}

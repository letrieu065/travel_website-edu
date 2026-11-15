'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Compass, Building, Plane, Search, MapPin, DollarSign } from 'lucide-react';

// (Đã thêm)
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

    // (Đã thêm)
    const handleTourSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const params = new URLSearchParams();
        if (tourSearch.trim()) params.set('search', tourSearch.trim());
        if (tourType) params.set('tour_type', tourType);
        if (tourMaxPrice) params.set('max_price', tourMaxPrice);
        router.push(`/tours?${params.toString()}`);
    };

    // (Đã thêm)
    const handleHotelSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const params = new URLSearchParams();
        if (hotelCity.trim()) params.set('city', hotelCity.trim());
        if (hotelStar) params.set('star_rating', hotelStar);
        if (hotelMaxPrice) params.set('max_price', hotelMaxPrice);
        router.push(`/hotels?${params.toString()}`);
    };

    // (Đã thêm)
    const handleFlightSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const params = new URLSearchParams();
        if (flightFrom.trim()) params.set('departure_airport', flightFrom.trim());
        if (flightTo.trim()) params.set('arrival_airport', flightTo.trim());
        if (flightDate) params.set('departure_date', flightDate);
        router.push(`/flights?${params.toString()}`);
    };

    return (
        <div className="w-full max-w-5xl mx-auto bg-white/95 backdrop-blur-md border border-white/20 shadow-2xl rounded-none overflow-hidden">
            {/* Tab navigation headers */}
            <div className="flex border-b border-gray-200 bg-gray-50/80">
                <button
                    type="button"
                    onClick={() => setActiveTab('tours')}
                    className={`flex-1 py-4 px-6 text-xs md:text-sm font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                        activeTab === 'tours'
                            ? 'bg-white text-black border-t-2 border-t-black shadow-sm'
                            : 'text-gray-500 hover:text-black hover:bg-gray-100/50'
                    }`}
                >
                    <Compass className="w-4 h-4 text-[#FACC15]" />
                    <span>Tour Du Lịch</span>
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab('hotels')}
                    className={`flex-1 py-4 px-6 text-xs md:text-sm font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                        activeTab === 'hotels'
                            ? 'bg-white text-black border-t-2 border-t-black shadow-sm'
                            : 'text-gray-500 hover:text-black hover:bg-gray-100/50'
                    }`}
                >
                    <Building className="w-4 h-4 text-[#FACC15]" />
                    <span>Khách Sạn & Resort</span>
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab('flights')}
                    className={`flex-1 py-4 px-6 text-xs md:text-sm font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                        activeTab === 'flights'
                            ? 'bg-white text-black border-t-2 border-t-black shadow-sm'
                            : 'text-gray-500 hover:text-black hover:bg-gray-100/50'
                    }`}
                >
                    <Plane className="w-4 h-4 text-[#FACC15]" />
                    <span>Chuyến Bay</span>
                </button>
            </div>

            {/* Tab contents */}
            <div className="p-6 md:p-8 bg-white">
                {/* 1. Tours Tab Form */}
                {activeTab === 'tours' && (
                    <form onSubmit={handleTourSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        <div className="md:col-span-1">
                            <label className="block text-[11px] font-black uppercase tracking-wider text-gray-500 mb-1">
                                Điểm đến / Từ khóa
                            </label>
                            <div className="relative">
                                <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Đà Nẵng, Sa Pa, Tokyo..."
                                    value={tourSearch}
                                    onChange={(e) => setTourSearch(e.target.value)}
                                    className="w-full pl-9 pr-3 py-2.5 text-xs font-bold border border-gray-300 focus:outline-none focus:border-black text-gray-900"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[11px] font-black uppercase tracking-wider text-gray-500 mb-1">
                                Loại hình tour
                            </label>
                            <select
                                value={tourType}
                                onChange={(e) => setTourType(e.target.value)}
                                className="w-full px-3 py-2.5 text-xs font-bold border border-gray-300 focus:outline-none focus:border-black bg-white text-gray-900"
                            >
                                <option value="">Tất cả loại tour</option>
                                <option value="Trong nước">Trong nước</option>
                                <option value="Quốc tế">Quốc tế</option>
                                <option value="Khám phá">Khám phá thiên nhiên</option>
                                <option value="Nghỉ dưỡng">Nghỉ dưỡng cao cấp</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-[11px] font-black uppercase tracking-wider text-gray-500 mb-1">
                                Ngân sách tối đa (VNĐ)
                            </label>
                            <div className="relative">
                                <DollarSign className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                                <input
                                    type="number"
                                    placeholder="20.000.000"
                                    value={tourMaxPrice}
                                    onChange={(e) => setTourMaxPrice(e.target.value)}
                                    className="w-full pl-9 pr-3 py-2.5 text-xs font-bold border border-gray-300 focus:outline-none focus:border-black text-gray-900"
                                />
                            </div>
                        </div>

                        <div>
                            <button
                                type="submit"
                                className="w-full bg-black text-white hover:bg-gray-800 py-3 px-6 text-xs font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-2 shadow-md"
                            >
                                <Search className="w-4 h-4 text-[#FACC15]" />
                                Khám Phá Tour
                            </button>
                        </div>
                    </form>
                )}

                {/* 2. Hotels Tab Form */}
                {activeTab === 'hotels' && (
                    <form onSubmit={handleHotelSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        <div className="md:col-span-1">
                            <label className="block text-[11px] font-black uppercase tracking-wider text-gray-500 mb-1">
                                Thành phố / Địa điểm
                            </label>
                            <div className="relative">
                                <MapPin className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Đà Nẵng, Nha Trang, Phú Quốc..."
                                    value={hotelCity}
                                    onChange={(e) => setHotelCity(e.target.value)}
                                    className="w-full pl-9 pr-3 py-2.5 text-xs font-bold border border-gray-300 focus:outline-none focus:border-black text-gray-900"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[11px] font-black uppercase tracking-wider text-gray-500 mb-1">
                                Tiêu chuẩn khách sạn
                            </label>
                            <select
                                value={hotelStar}
                                onChange={(e) => setHotelStar(e.target.value)}
                                className="w-full px-3 py-2.5 text-xs font-bold border border-gray-300 focus:outline-none focus:border-black bg-white text-gray-900"
                            >
                                <option value="">Tất cả hạng sao</option>
                                <option value="5">5 sao sang trọng</option>
                                <option value="4">4 sao cao cấp</option>
                                <option value="3">3 sao tiện nghi</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-[11px] font-black uppercase tracking-wider text-gray-500 mb-1">
                                Giá mỗi đêm tối đa (VNĐ)
                            </label>
                            <div className="relative">
                                <DollarSign className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                                <input
                                    type="number"
                                    placeholder="5.000.000"
                                    value={hotelMaxPrice}
                                    onChange={(e) => setHotelMaxPrice(e.target.value)}
                                    className="w-full pl-9 pr-3 py-2.5 text-xs font-bold border border-gray-300 focus:outline-none focus:border-black text-gray-900"
                                />
                            </div>
                        </div>

                        <div>
                            <button
                                type="submit"
                                className="w-full bg-black text-white hover:bg-gray-800 py-3 px-6 text-xs font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-2 shadow-md"
                            >
                                <Search className="w-4 h-4 text-[#FACC15]" />
                                Tìm Khách Sạn
                            </button>
                        </div>
                    </form>
                )}

                {/* 3. Flights Tab Form */}
                {activeTab === 'flights' && (
                    <form onSubmit={handleFlightSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        <div>
                            <label className="block text-[11px] font-black uppercase tracking-wider text-gray-500 mb-1">
                                Sân bay khởi hành
                            </label>
                            <div className="relative">
                                <MapPin className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="SGN (Tân Sơn Nhất), HAN..."
                                    value={flightFrom}
                                    onChange={(e) => setFlightFrom(e.target.value)}
                                    className="w-full pl-9 pr-3 py-2.5 text-xs font-bold border border-gray-300 focus:outline-none focus:border-black text-gray-900"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[11px] font-black uppercase tracking-wider text-gray-500 mb-1">
                                Sân bay đến
                            </label>
                            <div className="relative">
                                <MapPin className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="DAD (Đà Nẵng), PQC..."
                                    value={flightTo}
                                    onChange={(e) => setFlightTo(e.target.value)}
                                    className="w-full pl-9 pr-3 py-2.5 text-xs font-bold border border-gray-300 focus:outline-none focus:border-black text-gray-900"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[11px] font-black uppercase tracking-wider text-gray-500 mb-1">
                                Ngày cất cánh
                            </label>
                            <div className="relative">
                                <input
                                    type="date"
                                    value={flightDate}
                                    onChange={(e) => setFlightDate(e.target.value)}
                                    className="w-full px-3 py-2.5 text-xs font-bold border border-gray-300 focus:outline-none focus:border-black bg-white text-gray-900"
                                />
                            </div>
                        </div>

                        <div>
                            <button
                                type="submit"
                                className="w-full bg-black text-white hover:bg-gray-800 py-3 px-6 text-xs font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-2 shadow-md"
                            >
                                <Search className="w-4 h-4 text-[#FACC15]" />
                                Tìm Chuyến Bay
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}

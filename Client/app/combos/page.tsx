'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
    Sparkles,
    MapPin,
    Calendar,
    Users,
    Plane,
    Building2,
    Compass,
    Percent,
    ArrowRight,
    Filter,
    RotateCcw,
    CheckCircle2,
    Search,
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3600';

interface ComboTour {
    id: string;
    title: string;
    image: string | null;
    price_per_guest: number;
    departure: {
        id: string;
        start_date: string;
        price: number;
        discount_price: number | null;
    } | null;
}

interface ComboHotel {
    id: string;
    name: string;
    city: string;
    star_rating: number;
    image: string | null;
    price_per_night: number;
}

interface ComboFlight {
    id: string;
    airline?: string;
    departure_airport: string;
    arrival_airport: string;
    departure_time: string;
    ticket_price: number;
}

interface ComboItem {
    combo_id: string;
    title: string;
    destination: string;
    guests: number;
    nights: number;
    tour: ComboTour;
    hotel: ComboHotel | null;
    flight: ComboFlight | null;
    pricing: {
        original_total: number;
        combo_discount: number;
        discount_percent: number;
        final_price: number;
    };
}

interface ComboFilterState {
    destination: string;
    guests: number;
    nights: number;
    maxBudget: string;
}

const initialFilters: ComboFilterState = {
    destination: '',
    guests: 2,
    nights: 2,
    maxBudget: '',
};

// (Đã thêm)
const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        maximumFractionDigits: 0,
    }).format(amount);
};

// (Đã thêm)
export default function CombosPage() {
    const [combos, setCombos] = useState<ComboItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');

    const [formFilters, setFormFilters] = useState<ComboFilterState>(initialFilters);
    const [appliedFilters, setAppliedFilters] = useState<ComboFilterState>(initialFilters);

    useEffect(() => {
        let isCancelled = false;

        // (Đã thêm)
        const fetchCombos = async () => {
            try {
                setIsLoading(true);
                setErrorMessage('');

                let res: Response;
                if (appliedFilters.destination || appliedFilters.maxBudget || appliedFilters.guests !== 2 || appliedFilters.nights !== 2) {
                    res = await fetch(`${API_URL}/api/v1/combos/suggest`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            destination: appliedFilters.destination.trim() || undefined,
                            guests: appliedFilters.guests,
                            nights: appliedFilters.nights,
                            budget: appliedFilters.maxBudget ? Number(appliedFilters.maxBudget) : undefined,
                            discount_percent: 12,
                        }),
                    });
                } else {
                    res = await fetch(`${API_URL}/api/v1/combos?limit=12`);
                }

                if (!res.ok) {
                    throw new Error(`Lỗi tải dữ liệu combo (${res.status})`);
                }

                const data = await res.json();
                if (!isCancelled) {
                    if (data.status === 'success') {
                        setCombos(data.combos || []);
                    } else {
                        throw new Error(data.message || 'Không thể lấy dữ liệu combo');
                    }
                }
            } catch (err: unknown) {
                if (!isCancelled) {
                    const message = err instanceof Error ? err.message : 'Lỗi kết nối máy chủ';
                    setErrorMessage(message);
                    setCombos([]);
                }
            } finally {
                if (!isCancelled) {
                    setIsLoading(false);
                }
            }
        };

        fetchCombos();

        return () => {
            isCancelled = true;
        };
    }, [appliedFilters]);

    // (Đã thêm)
    const handleFilterSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setAppliedFilters({ ...formFilters });
    };

    // (Đã thêm)
    const handleResetFilters = () => {
        setFormFilters(initialFilters);
        setAppliedFilters(initialFilters);
    };

    return (
        <div className="min-h-screen bg-[#FDFBF7] text-gray-900 pb-20">
            {/* Hero Section */}
            <section className="relative bg-[#0f141e] text-white py-16 px-6 lg:px-12 border-b border-gray-800">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center gap-2 mb-3">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#FACC15] text-black text-xs font-black uppercase tracking-widest rounded-sm">
                            <Sparkles className="w-3.5 h-3.5" /> Gói Du Lịch Tiết Kiệm
                        </span>
                        <span className="text-gray-400 text-xs font-bold uppercase tracking-wider">
                            Bundle & Save up to 15%
                        </span>
                    </div>

                    <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tight text-white max-w-3xl font-serif">
                        Combo Trọn Gói: Tour + Khách Sạn + Vé Máy Bay
                    </h1>
                    <p className="mt-4 text-sm md:text-base text-gray-300 max-w-2xl font-light leading-relaxed">
                        Khám phá các gói hành trình được thiết kế đồng bộ bởi chuyên gia Natura Travel. Tiết kiệm thời gian lập kế hoạch và tối ưu chi phí hơn bao giờ hết.
                    </p>

                    {/* Filter Card */}
                    <form
                        onSubmit={handleFilterSubmit}
                        className="mt-8 bg-white text-gray-900 p-4 md:p-6 rounded-none shadow-2xl border-t-4 border-[#FACC15] grid grid-cols-1 md:grid-cols-4 gap-4"
                    >
                        <div>
                            <label className="block text-[11px] font-black uppercase tracking-wider text-gray-500 mb-1">
                                Điểm Đến Mong Muốn
                            </label>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    value={formFilters.destination}
                                    onChange={(e) => setFormFilters({ ...formFilters, destination: e.target.value })}
                                    placeholder="Đà Nẵng, Phú Quốc, Hà Nội..."
                                    className="w-full pl-9 pr-3 py-2 text-xs font-semibold border border-gray-200 focus:outline-none focus:border-black"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[11px] font-black uppercase tracking-wider text-gray-500 mb-1">
                                Số Lượng Khách
                            </label>
                            <div className="relative">
                                <Users className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                                <select
                                    value={formFilters.guests}
                                    onChange={(e) => setFormFilters({ ...formFilters, guests: Number(e.target.value) })}
                                    className="w-full pl-9 pr-3 py-2 text-xs font-semibold border border-gray-200 focus:outline-none focus:border-black bg-white"
                                >
                                    <option value={1}>1 người (Đơn thân hành)</option>
                                    <option value={2}>2 người (Cặp đôi)</option>
                                    <option value={4}>4 người (Gia đình / Bạn bè)</option>
                                    <option value={6}>6 người (Nhóm du lịch)</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-[11px] font-black uppercase tracking-wider text-gray-500 mb-1">
                                Số Đêm Lưu Trú
                            </label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                                <select
                                    value={formFilters.nights}
                                    onChange={(e) => setFormFilters({ ...formFilters, nights: Number(e.target.value) })}
                                    className="w-full pl-9 pr-3 py-2 text-xs font-semibold border border-gray-200 focus:outline-none focus:border-black bg-white"
                                >
                                    <option value={1}>1 đêm (Trải nghiệm nhanh)</option>
                                    <option value={2}>2 đêm (Cuối tuần lý tưởng)</option>
                                    <option value={3}>3 đêm (Khám phá trọn vẹn)</option>
                                    <option value={5}>5 đêm (Nghỉ dưỡng sâu)</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex items-end gap-2">
                            <button
                                type="submit"
                                className="flex-1 bg-black text-[#FACC15] hover:bg-gray-900 py-2.5 px-4 text-xs font-black uppercase tracking-widest flex items-center justify-center gap-1.5 transition-colors"
                            >
                                <Search className="w-4 h-4" /> Tìm Combo
                            </button>
                            <button
                                type="button"
                                onClick={handleResetFilters}
                                className="border border-gray-200 hover:border-black p-2.5 text-gray-600 transition-colors"
                                title="Đặt lại bộ lọc"
                            >
                                <RotateCcw className="w-4 h-4" />
                            </button>
                        </div>
                    </form>
                </div>
            </section>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-6 lg:px-12 pt-12">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-gray-200 mb-8">
                    <div>
                        <span className="text-xs font-bold uppercase tracking-widest text-[#B45309]">
                            Ưu đãi hấp dẫn nhất
                        </span>
                        <h2 className="text-2xl font-black uppercase tracking-tight text-gray-900">
                            Danh Sách Gói Combo Đang Khả Dụng ({combos.length})
                        </h2>
                    </div>
                    <div className="mt-3 sm:mt-0 text-xs text-gray-500 font-medium">
                        Áp dụng giảm thêm {appliedFilters.guests > 1 ? '12%' : '10%'} khi đặt gói trọn gói
                    </div>
                </div>

                {/* Error Banner */}
                {errorMessage && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-none text-xs font-semibold mb-8">
                        {errorMessage}
                    </div>
                )}

                {/* Loading skeleton */}
                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[1, 2, 3, 4, 5, 6].map((idx) => (
                            <div key={idx} className="bg-white border border-gray-200 animate-pulse h-96 p-4 flex flex-col justify-between">
                                <div className="bg-gray-200 h-48 w-full mb-4"></div>
                                <div className="space-y-2">
                                    <div className="bg-gray-200 h-4 w-3/4"></div>
                                    <div className="bg-gray-200 h-3 w-1/2"></div>
                                </div>
                                <div className="bg-gray-200 h-8 w-full mt-4"></div>
                            </div>
                        ))}
                    </div>
                ) : combos.length === 0 ? (
                    <div className="text-center py-20 bg-white border border-dashed border-gray-300 p-8">
                        <Filter className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <h3 className="text-lg font-bold uppercase tracking-tight text-gray-800">
                            Chưa tìm thấy combo phù hợp
                        </h3>
                        <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
                            Hãy thử đổi điểm đến khác hoặc nhấn &quot;Đặt lại bộ lọc&quot; để xem các gợi ý combo phổ biến nhất hiện có.
                        </p>
                        <button
                            type="button"
                            onClick={handleResetFilters}
                            className="mt-5 inline-flex items-center gap-2 bg-black text-[#FACC15] px-6 py-2.5 text-xs font-black uppercase tracking-widest hover:bg-gray-800"
                        >
                            <RotateCcw className="w-3.5 h-3.5" /> Xem Tất Cả Combo
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {combos.map((combo) => {
                            const tourImg = combo.tour?.image || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80';

                            return (
                                <div
                                    key={combo.combo_id}
                                    className="bg-white border border-gray-200 hover:border-black transition-all flex flex-col justify-between group shadow-sm hover:shadow-lg"
                                >
                                    <div>
                                        {/* Card Header & Image */}
                                        <div className="relative h-52 w-full overflow-hidden bg-gray-100">
                                            <Image
                                                src={tourImg}
                                                alt={combo.title}
                                                fill
                                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                                className="object-cover group-hover:scale-105 transition-transform duration-500"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>

                                            <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                                                <span className="bg-[#FACC15] text-black text-[10px] font-black uppercase tracking-wider px-2 py-0.5 shadow">
                                                    Giảm {combo.pricing.discount_percent}%
                                                </span>
                                                <span className="bg-black/80 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 backdrop-blur-sm">
                                                    {combo.destination}
                                                </span>
                                            </div>

                                            <div className="absolute bottom-3 left-3 right-3 text-white">
                                                <span className="text-[10px] font-bold uppercase tracking-wider text-yellow-300 flex items-center gap-1">
                                                    <Users className="w-3 h-3" /> {combo.guests} khách · {combo.nights} đêm
                                                </span>
                                                <h3 className="text-base font-black uppercase tracking-tight text-white line-clamp-1 mt-0.5">
                                                    {combo.title}
                                                </h3>
                                            </div>
                                        </div>

                                        {/* Services Included Breakdown */}
                                        <div className="p-4 space-y-3 border-b border-gray-100 text-xs">
                                            {/* Tour item */}
                                            <div className="flex items-start gap-2.5">
                                                <Compass className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                                                <div className="flex-1">
                                                    <span className="font-bold text-gray-900 block line-clamp-1">
                                                        Tour: {combo.tour.title}
                                                    </span>
                                                    <span className="text-[11px] text-gray-500">
                                                        Giá gốc: {formatCurrency(combo.tour.price_per_guest)}/khách
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Hotel item */}
                                            {combo.hotel && (
                                                <div className="flex items-start gap-2.5">
                                                    <Building2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                                                    <div className="flex-1">
                                                        <span className="font-bold text-gray-900 block line-clamp-1">
                                                            Khách sạn: {combo.hotel.name} ({combo.hotel.star_rating}★)
                                                        </span>
                                                        <span className="text-[11px] text-gray-500">
                                                            {combo.hotel.city} · {formatCurrency(combo.hotel.price_per_night)}/đêm
                                                        </span>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Flight item */}
                                            {combo.flight && (
                                                <div className="flex items-start gap-2.5">
                                                    <Plane className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                                                    <div className="flex-1">
                                                        <span className="font-bold text-gray-900 block line-clamp-1">
                                                            Vé máy bay: {combo.flight.departure_airport} → {combo.flight.arrival_airport}
                                                        </span>
                                                        <span className="text-[11px] text-gray-500">
                                                            Hãng: {combo.flight.airline || 'Hàng không Quốc Gia'}
                                                        </span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Pricing & CTA */}
                                    <div className="p-4 bg-gray-50/70 flex flex-col justify-between">
                                        <div className="flex items-baseline justify-between mb-3">
                                            <div>
                                                <span className="text-[10px] text-gray-400 line-through block font-medium">
                                                    {formatCurrency(combo.pricing.original_total)}
                                                </span>
                                                <span className="text-lg font-black text-red-600">
                                                    {formatCurrency(combo.pricing.final_price)}
                                                </span>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 border border-emerald-200">
                                                    Tiết kiệm {formatCurrency(combo.pricing.combo_discount)}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2">
                                            <Link
                                                href={`/combos/${combo.tour.id}?guests=${combo.guests}&nights=${combo.nights}`}
                                                className="border border-black text-black hover:bg-black hover:text-white py-2 text-center text-xs font-black uppercase tracking-wider transition-colors"
                                            >
                                                Tùy Chỉnh
                                            </Link>
                                            <Link
                                                href={`/checkout?type=combo&tour_id=${combo.tour.id}&hotel_id=${combo.hotel?.id || ''}&flight_id=${combo.flight?.id || ''}&guests=${combo.guests}&nights=${combo.nights}&price=${combo.pricing.final_price}`}
                                                className="bg-black text-[#FACC15] hover:bg-gray-800 py-2 text-center text-xs font-black uppercase tracking-wider transition-colors flex items-center justify-center gap-1"
                                            >
                                                Đặt Ngay <ArrowRight className="w-3.5 h-3.5" />
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Lonely Planet Editorial Perks */}
                <section className="mt-20 border-t border-gray-200 pt-12">
                    <h3 className="text-xs font-black uppercase tracking-widest text-gray-500 mb-6 text-center">
                        Vì Sao Nên Đặt Combo Tại Natura Travel?
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="flex gap-4 items-start">
                            <div className="w-10 h-10 rounded-full bg-[#FACC15]/20 flex items-center justify-center shrink-0">
                                <Percent className="w-5 h-5 text-black" />
                            </div>
                            <div>
                                <h4 className="text-sm font-black uppercase tracking-tight text-gray-900">
                                    Tiết Kiệm Lên Đến 15%
                                </h4>
                                <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                                    Giá combo luôn ưu đãi hơn nhiều so với việc đặt lẻ từng dịch vụ tour, phòng khách sạn và vé máy bay riêng biệt.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-4 items-start">
                            <div className="w-10 h-10 rounded-full bg-[#FACC15]/20 flex items-center justify-center shrink-0">
                                <CheckCircle2 className="w-5 h-5 text-black" />
                            </div>
                            <div>
                                <h4 className="text-sm font-black uppercase tracking-tight text-gray-900">
                                    Đảm Bảo Đồng Bộ Lịch Trình
                                </h4>
                                <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                                    Giờ bay, ngày nhận phòng khách sạn và ngày khởi hành tour được tính toán khớp nhau hoàn hảo, không lo phát sinh thời gian chờ.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-4 items-start">
                            <div className="w-10 h-10 rounded-full bg-[#FACC15]/20 flex items-center justify-center shrink-0">
                                <Sparkles className="w-5 h-5 text-black" />
                            </div>
                            <div>
                                <h4 className="text-sm font-black uppercase tracking-tight text-gray-900">
                                    Hỗ Trợ 1 Điểm Chạm (1-Stop)
                                </h4>
                                <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                                    Mọi thắc mắc và dịch vụ chỉ cần quản lý qua một mã đơn đặt duy nhất trên ứng dụng Natura Travel.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}

'use client';

/**
 * ============================================================================
 * MODULE COMBOS - CUSTOMIZER DETAIL PAGE (Trang Tùy Chỉnh Gói Combo)
 * ============================================================================
 * Chịu trách nhiệm:
 * - Trình bày chi tiết gói combo trọn gói gắn liền với một tour du lịch cụ thể.
 * - Cho phép người dùng linh hoạt đổi khách sạn hoặc chuyến bay từ danh sách gợi ý.
 * - Tính toán lại biểu phí, tiền giảm giá và tổng tiền thanh toán theo thời gian thực.
 * - Kết nối trực tiếp API Backend: GET /api/v1/combos/:tourId
 * ============================================================================
 */

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import {
    ArrowLeft,
    Sparkles,
    Check,
    Building2,
    Plane,
    Compass,
    Calendar,
    Users,
    ShieldCheck,
    CreditCard,
    AlertCircle,
    Star,
    ChevronRight,
} from 'lucide-react';
import { AirlineLogoBadge } from '@/components/common/AirlineBranding';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3600';

interface TourDeparture {
    id: string;
    start_date: string;
    price: number;
    discount_price?: number | null;
    available_seats: number;
}

interface TourDetail {
    id: string;
    title: string;
    description: string;
    destination?: string;
    departure_location?: string;
    duration?: string;
    tour_images?: Array<{ url: string }>;
    tour_departures?: TourDeparture[];
}

interface HotelOption {
    id: string;
    name: string;
    city: string;
    address?: string;
    star_rating: number;
    price_per_night: number;
    discount_price?: number | null;
    hotel_images?: Array<{ url: string }>;
}

interface FlightOption {
    id: string;
    flight_number: string;
    departure_airport: string;
    arrival_airport: string;
    departure_time: string;
    ticket_price: number;
    planes?: { airline: string; model: string };
}

interface ComboDetailData {
    tour: TourDetail;
    recommended_hotels: HotelOption[];
    recommended_flights: FlightOption[];
    combo_discount_percent: number;
    guests: number;
    nights: number;
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
function ComboDetailContent() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();

    const tourId = (params?.id as string) || '';
    const initialGuests = Number(searchParams.get('guests')) || 2;
    const initialNights = Number(searchParams.get('nights')) || 2;

    const [comboData, setComboData] = useState<ComboDetailData | null>(null);
    const [guests, setGuests] = useState(initialGuests);
    const [nights, setNights] = useState(initialNights);

    const [selectedHotelId, setSelectedHotelId] = useState<string>('');
    const [selectedFlightId, setSelectedFlightId] = useState<string>('');

    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        if (!tourId) return;

        let isCancelled = false;

        // (Đã thêm)
        const fetchComboDetail = async () => {
            try {
                setIsLoading(true);
                setErrorMessage('');
                const res = await fetch(`${API_URL}/api/v1/combos/${tourId}?guests=${guests}&nights=${nights}`);
                if (!res.ok) {
                    throw new Error(`Lỗi tải dữ liệu combo (${res.status})`);
                }
                const json = await res.json();
                if (!isCancelled) {
                    if (json.status === 'success' && json.data) {
                        setComboData(json.data);
                        if (json.data.recommended_hotels?.length > 0) {
                            setSelectedHotelId(json.data.recommended_hotels[0].id);
                        }
                        if (json.data.recommended_flights?.length > 0) {
                            setSelectedFlightId(json.data.recommended_flights[0].id);
                        }
                    } else {
                        throw new Error(json.message || 'Không tìm thấy chi tiết combo');
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

        fetchComboDetail();

        return () => {
            isCancelled = true;
        };
    }, [tourId, guests, nights]);

    // Selected items calculation
    const selectedHotel = useMemo(() => {
        return comboData?.recommended_hotels.find((h) => h.id === selectedHotelId) || null;
    }, [comboData, selectedHotelId]);

    const selectedFlight = useMemo(() => {
        return comboData?.recommended_flights.find((f) => f.id === selectedFlightId) || null;
    }, [comboData, selectedFlightId]);

    // Pricing math
    const pricing = useMemo(() => {
        if (!comboData) return { originalTotal: 0, discount: 0, finalTotal: 0, tourPrice: 0, hotelPrice: 0, flightPrice: 0 };

        const departure = comboData.tour.tour_departures?.[0];
        const tourUnit = departure ? Number(departure.discount_price ?? departure.price) : 0;
        const tourPrice = tourUnit * guests;

        const hotelUnit = selectedHotel ? Number(selectedHotel.discount_price ?? selectedHotel.price_per_night) : 0;
        const hotelPrice = hotelUnit * nights;

        const flightUnit = selectedFlight ? Number(selectedFlight.ticket_price) : 0;
        const flightPrice = flightUnit * guests;

        const originalTotal = tourPrice + hotelPrice + flightPrice;
        const discountRate = (comboData.combo_discount_percent ?? 10) / 100;
        const discount = Math.round(originalTotal * discountRate);
        const finalTotal = Math.max(0, originalTotal - discount);

        return {
            originalTotal,
            discount,
            finalTotal,
            tourPrice,
            hotelPrice,
            flightPrice,
        };
    }, [comboData, selectedHotel, selectedFlight, guests, nights]);

    // (Đã thêm)
    const handleProceedToCheckout = () => {
        if (!comboData) return;

        const checkoutParams = new URLSearchParams({
            type: 'combo',
            tour_id: comboData.tour.id,
            departure_id: comboData.tour.tour_departures?.[0]?.id || '',
            hotel_id: selectedHotel?.id || '',
            flight_id: selectedFlight?.id || '',
            guests: String(guests),
            nights: String(nights),
            price: String(pricing.finalTotal),
            title: `Combo: ${comboData.tour.title}`,
        });

        router.push(`/checkout?${checkoutParams.toString()}`);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center py-20">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-black border-t-[#FACC15] rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-500">Đang chuẩn bị gói combo...</p>
                </div>
            </div>
        );
    }

    if (errorMessage || !comboData) {
        return (
            <div className="min-h-screen bg-[#FDFBF7] py-20 px-6">
                <div className="max-w-xl mx-auto bg-white p-8 border border-red-200 text-center">
                    <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
                    <h2 className="text-lg font-black uppercase text-gray-900 mb-2">Không thể tải combo</h2>
                    <p className="text-xs text-gray-600 mb-6">{errorMessage || 'Gói combo này hiện không khả dụng.'}</p>
                    <Link
                        href="/combos"
                        className="inline-flex items-center gap-2 bg-black text-[#FACC15] px-6 py-3 text-xs font-black uppercase tracking-widest hover:bg-gray-800"
                    >
                        <ArrowLeft className="w-4 h-4" /> Quay lại danh sách Combo
                    </Link>
                </div>
            </div>
        );
    }

    const heroImg = comboData.tour.tour_images?.[0]?.url || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80';

    return (
        <div className="min-h-screen bg-[#FDFBF7] text-gray-900 pb-24">
            {/* Top Navigation Bar */}
            <div className="border-b border-gray-200 bg-white py-4 px-6 lg:px-12">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <Link
                        href="/combos"
                        className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-600 hover:text-black transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" /> Tất cả Combo
                    </Link>
                    <span className="text-xs font-bold text-gray-400">
                        Mã Tour: {comboData.tour.id.slice(0, 8)}
                    </span>
                </div>
            </div>

            {/* Main Content Layout */}
            <div className="max-w-7xl mx-auto px-6 lg:px-12 pt-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    {/* Left 2 Columns: Customizer & Inclusions */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Tour Hero Card */}
                        <div className="bg-white border border-gray-200 overflow-hidden shadow-sm">
                            <div className="relative h-72 w-full">
                                <Image
                                    src={heroImg}
                                    alt={comboData.tour.title}
                                    fill
                                    priority
                                    className="object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                                <div className="absolute bottom-6 left-6 right-6 text-white">
                                    <span className="bg-[#FACC15] text-black text-[10px] font-black uppercase tracking-widest px-2.5 py-1 mb-2 inline-block">
                                        Combo Trọn Gói Đặc Biệt
                                    </span>
                                    <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-white font-serif">
                                        {comboData.tour.title}
                                    </h1>
                                    <p className="text-xs text-gray-300 mt-1">
                                        Điểm đến: {comboData.tour.destination || 'Việt Nam'} · Khởi hành từ {comboData.tour.departure_location || 'Trung tâm'}
                                    </p>
                                </div>
                            </div>

                            {/* Parameter Controls (Guests & Nights) */}
                            <div className="p-6 bg-gray-50 border-t border-gray-100 flex flex-wrap items-center gap-6">
                                <div>
                                    <label className="block text-[11px] font-black uppercase tracking-wider text-gray-500 mb-1">
                                        Số Lượng Khách
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <Users className="w-4 h-4 text-gray-500" />
                                        <select
                                            value={guests}
                                            onChange={(e) => setGuests(Number(e.target.value))}
                                            className="border border-gray-300 bg-white px-3 py-1.5 text-xs font-bold focus:border-black"
                                        >
                                            {[1, 2, 3, 4, 5, 6, 8, 10].map((num) => (
                                                <option key={num} value={num}>
                                                    {num} khách
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[11px] font-black uppercase tracking-wider text-gray-500 mb-1">
                                        Số Đêm Khách Sạn
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4 text-gray-500" />
                                        <select
                                            value={nights}
                                            onChange={(e) => setNights(Number(e.target.value))}
                                            className="border border-gray-300 bg-white px-3 py-1.5 text-xs font-bold focus:border-black"
                                        >
                                            {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                                                <option key={num} value={num}>
                                                    {num} đêm
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="ml-auto text-xs text-emerald-700 bg-emerald-50 px-3 py-2 border border-emerald-200 font-semibold flex items-center gap-1.5">
                                    <Sparkles className="w-4 h-4" />
                                    Ưu đãi {comboData.combo_discount_percent}% tự động áp dụng
                                </div>
                            </div>
                        </div>

                        {/* Step 1: Tour Information */}
                        <div className="bg-white p-6 border border-gray-200">
                            <div className="flex items-center gap-3 mb-4">
                                <span className="w-6 h-6 rounded-full bg-black text-[#FACC15] flex items-center justify-center text-xs font-black">
                                    1
                                </span>
                                <h3 className="text-base font-black uppercase tracking-tight text-gray-900 flex items-center gap-2">
                                    <Compass className="w-5 h-5 text-emerald-600" />
                                    Lịch Trình Tour Đi Kèm
                                </h3>
                            </div>
                            <p className="text-xs text-gray-600 leading-relaxed mb-4">
                                {comboData.tour.description}
                            </p>
                            <div className="bg-gray-50 p-4 border border-gray-100 flex items-center justify-between text-xs">
                                <div>
                                    <span className="font-bold text-gray-800">
                                        Lịch khởi hành gần nhất: {comboData.tour.tour_departures?.[0]?.start_date ? new Date(comboData.tour.tour_departures[0].start_date).toLocaleDateString('vi-VN') : 'Liên hệ xác nhận'}
                                    </span>
                                    <span className="text-gray-500 block text-[11px]">
                                        Chỗ trống khả dụng: {comboData.tour.tour_departures?.[0]?.available_seats ?? 10} chỗ
                                    </span>
                                </div>
                                <span className="font-black text-gray-900 text-sm">
                                    {formatCurrency(pricing.tourPrice)}
                                </span>
                            </div>
                        </div>

                        {/* Step 2: Choose Hotel */}
                        <div className="bg-white p-6 border border-gray-200">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <span className="w-6 h-6 rounded-full bg-black text-[#FACC15] flex items-center justify-center text-xs font-black">
                                        2
                                    </span>
                                    <h3 className="text-base font-black uppercase tracking-tight text-gray-900 flex items-center gap-2">
                                        <Building2 className="w-5 h-5 text-blue-600" />
                                        Chọn Khách Sạn ({comboData.recommended_hotels.length} Lựa Chọn)
                                    </h3>
                                </div>
                                <span className="text-xs text-gray-500">{nights} đêm</span>
                            </div>

                            <div className="space-y-3">
                                {comboData.recommended_hotels.map((hotel) => {
                                    const isSelected = selectedHotelId === hotel.id;
                                    const hotelImg = hotel.hotel_images?.[0]?.url || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=400&q=80';
                                    const totalForStay = Number(hotel.discount_price ?? hotel.price_per_night) * nights;

                                    return (
                                        <div
                                            key={hotel.id}
                                            onClick={() => setSelectedHotelId(hotel.id)}
                                            className={`p-4 border cursor-pointer transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                                                isSelected
                                                    ? 'border-black bg-yellow-50/20 ring-1 ring-black'
                                                    : 'border-gray-200 hover:border-gray-400 bg-white'
                                            }`}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="relative w-20 h-16 shrink-0 bg-gray-100 overflow-hidden">
                                                    <Image
                                                        src={hotelImg}
                                                        alt={hotel.name}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-1.5">
                                                        <h4 className="text-xs font-black uppercase tracking-tight text-gray-900">
                                                            {hotel.name}
                                                        </h4>
                                                        <span className="flex items-center text-amber-500 text-xs">
                                                            <Star className="w-3 h-3 fill-amber-400" /> {hotel.star_rating}
                                                        </span>
                                                    </div>
                                                    <p className="text-[11px] text-gray-500 mt-0.5">
                                                        {hotel.city} {hotel.address ? `· ${hotel.address}` : ''}
                                                    </p>
                                                    <span className="text-[11px] text-gray-400 block">
                                                        {formatCurrency(Number(hotel.discount_price ?? hotel.price_per_night))}/đêm
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-4 self-end sm:self-center">
                                                <div className="text-right">
                                                    <span className="text-xs font-black text-gray-900 block">
                                                        {formatCurrency(totalForStay)}
                                                    </span>
                                                    <span className="text-[10px] text-gray-400">
                                                        ({nights} đêm)
                                                    </span>
                                                </div>
                                                <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                                                    isSelected ? 'bg-black border-black text-[#FACC15]' : 'border-gray-300'
                                                }`}>
                                                    {isSelected && <Check className="w-3 h-3" />}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Step 3: Choose Flight */}
                        <div className="bg-white p-6 border border-gray-200">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <span className="w-6 h-6 rounded-full bg-black text-[#FACC15] flex items-center justify-center text-xs font-black">
                                        3
                                    </span>
                                    <h3 className="text-base font-black uppercase tracking-tight text-gray-900 flex items-center gap-2">
                                        <Plane className="w-5 h-5 text-purple-600" />
                                        Chọn Chuyến Bay ({comboData.recommended_flights.length} Lựa Chọn)
                                    </h3>
                                </div>
                                <span className="text-xs text-gray-500">{guests} vé</span>
                            </div>

                            <div className="space-y-3">
                                {comboData.recommended_flights.map((flight) => {
                                    const isSelected = selectedFlightId === flight.id;
                                    const totalForFlight = Number(flight.ticket_price) * guests;

                                    return (
                                        <div
                                            key={flight.id}
                                            onClick={() => setSelectedFlightId(flight.id)}
                                            className={`p-4 border cursor-pointer transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                                                isSelected
                                                    ? 'border-black bg-yellow-50/20 ring-1 ring-black'
                                                    : 'border-gray-200 hover:border-gray-400 bg-white'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <AirlineLogoBadge airlineName={flight.planes?.airline} size="sm" />
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-black text-gray-900">
                                                            {flight.planes?.airline || 'Hàng không Quốc Gia'}
                                                        </span>
                                                        <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 font-bold">
                                                            {flight.flight_number}
                                                        </span>
                                                    </div>
                                                    <p className="text-[11px] text-gray-500 mt-0.5">
                                                        {flight.departure_airport} ➔ {flight.arrival_airport}
                                                    </p>
                                                    <span className="text-[11px] text-gray-400">
                                                        Khởi hành: {new Date(flight.departure_time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-4 self-end sm:self-center">
                                                <div className="text-right">
                                                    <span className="text-xs font-black text-gray-900 block">
                                                        {formatCurrency(totalForFlight)}
                                                    </span>
                                                    <span className="text-[10px] text-gray-400">
                                                        {formatCurrency(flight.ticket_price)}/khách
                                                    </span>
                                                </div>
                                                <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                                                    isSelected ? 'bg-black border-black text-[#FACC15]' : 'border-gray-300'
                                                }`}>
                                                    {isSelected && <Check className="w-3 h-3" />}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Pricing Summary & Checkout */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-24 bg-white border-2 border-black p-6 shadow-xl">
                            <span className="text-[10px] font-black uppercase tracking-widest text-[#B45309] block mb-1">
                                Tóm Tắt Gói Đặt Chỗ
                            </span>
                            <h3 className="text-lg font-black uppercase tracking-tight text-gray-900 pb-4 border-b border-gray-100">
                                Combo Trọn Gói
                            </h3>

                            {/* Line items */}
                            <div className="py-4 space-y-3 text-xs border-b border-gray-100">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">
                                        Tour ({guests} khách):
                                    </span>
                                    <span className="font-semibold text-gray-900">
                                        {formatCurrency(pricing.tourPrice)}
                                    </span>
                                </div>

                                <div className="flex justify-between">
                                    <span className="text-gray-600">
                                        Khách sạn ({nights} đêm):
                                    </span>
                                    <span className="font-semibold text-gray-900">
                                        {formatCurrency(pricing.hotelPrice)}
                                    </span>
                                </div>

                                <div className="flex justify-between">
                                    <span className="text-gray-600">
                                        Vé máy bay ({guests} vé):
                                    </span>
                                    <span className="font-semibold text-gray-900">
                                        {formatCurrency(pricing.flightPrice)}
                                    </span>
                                </div>

                                <div className="pt-2 border-t border-dashed border-gray-200 flex justify-between text-gray-500">
                                    <span>Tổng giá trị gốc:</span>
                                    <span className="line-through">{formatCurrency(pricing.originalTotal)}</span>
                                </div>

                                <div className="flex justify-between text-emerald-600 font-bold">
                                    <span>Ưu đãi gói combo (-{comboData.combo_discount_percent}%):</span>
                                    <span>-{formatCurrency(pricing.discount)}</span>
                                </div>
                            </div>

                            {/* Final Total */}
                            <div className="py-4 flex items-baseline justify-between">
                                <div>
                                    <span className="text-[11px] font-black uppercase tracking-wider text-gray-500 block">
                                        Thanh Toán Toàn Bộ:
                                    </span>
                                    <span className="text-2xl font-black text-red-600">
                                        {formatCurrency(pricing.finalTotal)}
                                    </span>
                                </div>
                                <span className="text-[10px] text-gray-400">Đã bao gồm VAT & phí</span>
                            </div>

                            {/* CTA Button */}
                            <button
                                type="button"
                                onClick={handleProceedToCheckout}
                                className="w-full bg-black text-[#FACC15] hover:bg-gray-800 py-3.5 px-4 text-xs font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
                            >
                                <CreditCard className="w-4 h-4" /> Tiến Hành Đặt Combo <ChevronRight className="w-4 h-4" />
                            </button>

                            <div className="mt-4 pt-4 border-t border-gray-100 space-y-2 text-[11px] text-gray-500">
                                <div className="flex items-center gap-1.5">
                                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                                    <span>Bảo đảm giữ chỗ và giá tốt nhất</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                                    <span>Xác nhận tức thì qua email và SMS</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// (Đã thêm)
export default function ComboDetailPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-black border-t-[#FACC15] rounded-full animate-spin"></div>
            </div>
        }>
            <ComboDetailContent />
        </Suspense>
    );
}

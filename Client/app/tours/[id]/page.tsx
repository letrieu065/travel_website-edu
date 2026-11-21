'use client';

/**
 * ============================================================================
 * MODULE TOURS - DETAIL PAGE (Trang Chi Tiết Tour Du Lịch Natura Travel)
 * ============================================================================
 * Chịu trách nhiệm:
 * - Hiển thị toàn cảnh tour du lịch: Gallery ảnh, hành trình di chuyển, dịch vụ đi kèm.
 * - Danh sách các đợt khởi hành còn chỗ trống, giá gốc và giá khuyến mãi.
 * - Widget đặt chỗ nhanh chuyển thẳng đến trang Checkout (/checkout).
 * - Kết nối API: GET /api/v1/tours/:id & GET /api/v1/tours/:id/departures
 * ============================================================================
 */

import React, { useState, useEffect, use, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
    MapPin,
    Calendar,
    Clock,
    Star,
    CheckCircle,
    ArrowLeft,
    ShieldCheck,
    Compass,
    AlertCircle,
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3600';

interface TourDeparture {
    id: string;
    tour_id: string;
    start_date: string;
    end_date: string;
    price: number | string;
    discount_price?: number | string | null;
    available_seats: number;
}

interface TourReview {
    id: string;
    rating: number;
    comment: string;
    created_at: string;
    users?: {
        full_name: string;
        avatar_url?: string | null;
    };
}

interface TourDetail {
    id: string;
    title: string;
    description?: string | null;
    tourType: string;
    price: number;
    discountPrice?: number | null;
    duration?: string | null;
    destination?: string | null;
    departureLocation?: string | null;
    startDate?: string;
    availableSeats: number;
    images: string[];
    isTrending?: boolean;
    averageRating: number;
    reviewCount: number;
    destinations?: unknown;
    foodInclude?: string | null;
    idealTime?: string | null;
    vehicle?: string | null;
    reviews?: TourReview[];
    departures?: TourDeparture[];
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
const formatDate = (isoString?: string | null): string => {
    if (!isoString) return 'Chưa cập nhật';
    const date = new Date(isoString);
    return isNaN(date.getTime())
        ? 'Chưa cập nhật'
        : date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

// (Đã thêm)
const parseDestinations = (dest: unknown): string[] => {
    if (!dest) return [];
    if (Array.isArray(dest)) return dest.map(String).filter(Boolean);
    if (typeof dest === 'string') {
        const trimmed = dest.trim();
        if (!trimmed) return [];
        if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
            try {
                const parsed = JSON.parse(trimmed);
                if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean);
            } catch {
                // Tiếp tục xử lý nếu không parse được JSON
            }
        }
        return trimmed.split(/[,;\n]/).map((s) => s.trim()).filter(Boolean);
    }
    return [];
};

function TourDetailContent({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const resolvedParams = use(params);
    const tourId = resolvedParams.id;
    const router = useRouter();

    const [tour, setTour] = useState<TourDetail | null>(null);
    const [departures, setDepartures] = useState<TourDeparture[]>([]);
    const [selectedImage, setSelectedImage] = useState<string>('');
    const [selectedDepartureId, setSelectedDepartureId] = useState<string>('');
    const [passengerCount, setPassengerCount] = useState<number>(1);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');
    const [bookingSuccess, setBookingSuccess] = useState(false);

    useEffect(() => {
        let isCancelled = false;

        // (Đã thêm)
        const executeFetchTour = async () => {
            try {
                const tourRes = await fetch(`${API_URL}/api/v1/tours/${tourId}`);
                if (!tourRes.ok) {
                    throw new Error(`Không tìm thấy tour (mã lỗi ${tourRes.status})`);
                }

                const tourData = await tourRes.json();
                if (tourData.status !== 'success' || !tourData.tour) {
                    throw new Error(tourData.message || 'Không thể lấy thông tin tour');
                }

                if (!isCancelled) {
                    const currentTour: TourDetail = tourData.tour;
                    setTour(currentTour);

                    const imagesList = Array.isArray(currentTour.images) ? currentTour.images : [];
                    if (imagesList.length > 0) {
                        setSelectedImage(imagesList[0]);
                    }

                    // Ưu tiên lấy departures từ tour.departures
                    let deps: TourDeparture[] = Array.isArray(currentTour.departures) ? currentTour.departures : [];

                    try {
                        const departuresRes = await fetch(`${API_URL}/api/v1/tours/${tourId}/departures`);
                        if (departuresRes.ok) {
                            const depData = await departuresRes.json();
                            if (depData.status === 'success' && Array.isArray(depData.departures) && depData.departures.length > 0) {
                                deps = depData.departures;
                            }
                        }
                    } catch {
                        // Giữ nguyên deps từ currentTour
                    }

                    setDepartures(deps);
                    if (deps.length > 0) {
                        setSelectedDepartureId(deps[0].id);
                    }
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

        executeFetchTour();

        return () => {
            isCancelled = true;
        };
    }, [tourId]);

    // (Đã thêm)
    const handleBookingSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const selectedDep = departures.find((d) => d.id === selectedDepartureId);
        if (!selectedDep && departures.length > 0) {
            alert('Vui lòng chọn ngày khởi hành hợp lệ');
            return;
        }

        const unitPrice = selectedDep ? Number(selectedDep.discount_price ?? selectedDep.price) : Number(tour?.discountPrice ?? tour?.price ?? 0);
        const totalPrice = unitPrice * passengerCount;

        const checkoutParams = new URLSearchParams({
            type: 'tour',
            tour_id: tour?.id || tourId,
            departure_id: selectedDepartureId || '',
            guests: String(passengerCount),
            price: String(totalPrice),
            title: tour?.title || 'Tour du lịch Natura Travel',
        });

        router.push(`/checkout?${checkoutParams.toString()}`);
    };

    if (isLoading) {
        return (
            <div className="max-w-7xl mx-auto px-6 py-20">
                <div className="animate-pulse space-y-8">
                    <div className="h-8 bg-gray-200 w-1/3" />
                    <div className="aspect-[16/9] bg-gray-200 w-full" />
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-4">
                            <div className="h-6 bg-gray-200 w-3/4" />
                            <div className="h-4 bg-gray-200 w-full" />
                            <div className="h-4 bg-gray-200 w-5/6" />
                        </div>
                        <div className="h-80 bg-gray-200" />
                    </div>
                </div>
            </div>
        );
    }

    if (errorMessage || !tour) {
        return (
            <div className="max-w-4xl mx-auto px-6 py-24 text-center">
                <AlertCircle className="w-16 h-16 mx-auto text-red-500 mb-4" />
                <h1 className="text-2xl font-black uppercase tracking-tight text-gray-900">
                    {errorMessage || 'Không tìm thấy tour này'}
                </h1>
                <p className="mt-2 text-gray-600 text-sm">
                    Tour có thể đã hết hạn hoặc không tồn tại trong hệ thống.
                </p>
                <Link
                    href="/tours"
                    className="mt-6 inline-flex items-center gap-2 bg-black text-white px-6 py-3 text-xs font-black uppercase tracking-wider hover:bg-gray-800 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" /> Quay lại danh sách Tour
                </Link>
            </div>
        );
    }

    const currentDeparture = departures.find((d) => d.id === selectedDepartureId);
    const unitPrice = currentDeparture
        ? (currentDeparture.discount_price ? Number(currentDeparture.discount_price) : Number(currentDeparture.price))
        : (tour.discountPrice ? Number(tour.discountPrice) : Number(tour.price));

    const originalPrice = currentDeparture
        ? Number(currentDeparture.price)
        : Number(tour.price);

    const hasDiscount = currentDeparture?.discount_price != null || tour.discountPrice != null;
    const totalPrice = unitPrice * passengerCount;
    const destinationList = parseDestinations(tour.destinations);
    const imagesList = Array.isArray(tour.images) ? tour.images : [];
    const reviewsList = Array.isArray(tour.reviews) ? tour.reviews : [];

    return (
        <div className="w-full min-h-screen bg-gray-50 pb-24">
            {/* Breadcrumb Bar */}
            <div className="bg-white border-b border-gray-200 py-4 px-6">
                <div className="max-w-7xl mx-auto flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-500">
                    <Link href="/" className="hover:text-black">Trang chủ</Link>
                    <span>/</span>
                    <Link href="/tours" className="hover:text-black">Tours</Link>
                    <span>/</span>
                    <span className="text-black truncate max-w-xs">{tour.title}</span>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 mt-8">
                {/* Title Header */}
                <div className="mb-6">
                    <div className="flex flex-wrap items-center gap-3 mb-2">
                        <span className="bg-[#FACC15] text-black px-3 py-1 text-xs font-black uppercase">
                            {tour.tourType || 'Tour trọn gói'}
                        </span>
                        {tour.isTrending && (
                            <span className="bg-red-600 text-white px-3 py-1 text-xs font-black uppercase">
                                Thịnh hành
                            </span>
                        )}
                        <span className="flex items-center gap-1 text-xs font-bold text-gray-700">
                            <Star className="w-4 h-4 fill-[#FACC15] text-[#FACC15]" />
                            {tour.reviewCount
                                ? `${Number(tour.averageRating).toFixed(1)} (${tour.reviewCount} đánh giá)`
                                : 'Chưa có đánh giá'}
                        </span>
                    </div>

                    <h1 className="text-2xl md:text-4xl font-black uppercase tracking-tight text-gray-900">
                        {tour.title}
                    </h1>

                    <div className="flex flex-wrap items-center gap-6 mt-3 text-xs md:text-sm text-gray-600 font-medium">
                        <span className="flex items-center gap-1.5">
                            <MapPin className="w-4 h-4 text-gray-400" />
                            {tour.destination || 'Điểm đến đang cập nhật'}
                        </span>
                        <span className="flex items-center gap-1.5">
                            <Clock className="w-4 h-4 text-gray-400" />
                            {tour.duration || 'Lịch trình linh hoạt'}
                        </span>
                        <span className="flex items-center gap-1.5">
                            <Compass className="w-4 h-4 text-gray-400" />
                            Khởi hành: {tour.departureLocation || 'Toàn quốc'}
                        </span>
                    </div>
                </div>

                {/* Photo Gallery */}
                <section className="mb-10">
                    <div className="relative aspect-[16/9] md:aspect-[21/9] w-full overflow-hidden bg-gray-200 border border-gray-200">
                        {selectedImage ? (
                            <Image
                                src={selectedImage}
                                alt={tour.title}
                                fill
                                priority
                                className="object-cover"
                            />
                        ) : (
                            <div className="flex h-full items-center justify-center text-gray-400">
                                <MapPin className="h-16 w-16" />
                            </div>
                        )}
                    </div>

                    {imagesList.length > 1 && (
                        <div className="flex items-center gap-3 mt-3 overflow-x-auto pb-2">
                            {imagesList.map((img, idx) => (
                                <button
                                    key={idx}
                                    type="button"
                                    onClick={() => setSelectedImage(img)}
                                    className={`relative w-24 h-16 shrink-0 border-2 overflow-hidden transition-all ${
                                        selectedImage === img ? 'border-black' : 'border-transparent opacity-70 hover:opacity-100'
                                    }`}
                                >
                                    <Image
                                        src={img}
                                        alt={`${tour.title} ảnh ${idx + 1}`}
                                        fill
                                        className="object-cover"
                                    />
                                </button>
                            ))}
                        </div>
                    )}
                </section>

                {/* Main Content Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    {/* Left Column: Details */}
                    <div className="lg:col-span-2 space-y-10">
                        {/* Highlight Features Box */}
                        <div className="bg-white p-6 border border-gray-200 grid grid-cols-2 sm:grid-cols-4 gap-4">
                            <div className="border-r border-gray-100 last:border-none pr-3">
                                <span className="text-xs font-bold text-gray-400 uppercase block mb-1">Thời lượng</span>
                                <p className="text-sm font-black text-gray-900">{tour.duration || 'N/A'}</p>
                            </div>
                            <div className="border-r border-gray-100 last:border-none pr-3">
                                <span className="text-xs font-bold text-gray-400 uppercase block mb-1">Phương tiện</span>
                                <p className="text-sm font-black text-gray-900">{tour.vehicle || 'Xe du lịch / Máy bay'}</p>
                            </div>
                            <div className="border-r border-gray-100 last:border-none pr-3">
                                <span className="text-xs font-bold text-gray-400 uppercase block mb-1">Ẩm thực</span>
                                <p className="text-sm font-black text-gray-900">{tour.foodInclude || 'Theo thực đơn tour'}</p>
                            </div>
                            <div>
                                <span className="text-xs font-bold text-gray-400 uppercase block mb-1">Thời điểm đẹp</span>
                                <p className="text-sm font-black text-gray-900">{tour.idealTime || 'Quanh năm'}</p>
                            </div>
                        </div>

                        {/* Description */}
                        <div className="bg-white p-8 border border-gray-200">
                            <h2 className="text-xl font-black uppercase tracking-tight text-gray-900 mb-4 pb-2 border-b border-gray-100">
                                Giới thiệu chuyến đi
                            </h2>
                            <p className="text-gray-700 leading-relaxed text-sm md:text-base whitespace-pre-line">
                                {tour.description || 'Thông tin chi tiết về hành trình đang được cập nhật.'}
                            </p>

                            {destinationList.length > 0 && (
                                <div className="mt-6 pt-6 border-t border-gray-100">
                                    <h3 className="text-sm font-black uppercase tracking-wider text-gray-800 mb-3">
                                        Các điểm dừng chân tiêu biểu:
                                    </h3>
                                    <div className="flex flex-wrap gap-2">
                                        {destinationList.map((d, index) => (
                                            <span
                                                key={index}
                                                className="bg-gray-100 text-gray-800 text-xs font-bold px-3 py-1.5 border border-gray-200"
                                            >
                                                {d}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Available Departures List */}
                        {departures.length > 0 && (
                            <div className="bg-white p-8 border border-gray-200">
                                <h2 className="text-xl font-black uppercase tracking-tight text-gray-900 mb-4 pb-2 border-b border-gray-100">
                                    Lịch khởi hành sắp tới
                                </h2>
                                <div className="divide-y divide-gray-100">
                                    {departures.map((dep) => (
                                        <div
                                            key={dep.id}
                                            className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                                        >
                                            <div>
                                                <div className="flex items-center gap-2 font-bold text-sm text-gray-900">
                                                    <Calendar className="w-4 h-4 text-gray-500" />
                                                    {formatDate(dep.start_date)} - {formatDate(dep.end_date)}
                                                </div>
                                                <span className="text-xs text-gray-500 mt-0.5 block">
                                                    Còn {dep.available_seats} chỗ trống
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="text-right">
                                                    {dep.discount_price && (
                                                        <del className="text-xs text-gray-400 block">
                                                            {formatCurrency(dep.price)}
                                                        </del>
                                                    )}
                                                    <span className="text-base font-black text-black">
                                                        {formatCurrency(dep.discount_price ?? dep.price)}
                                                    </span>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => setSelectedDepartureId(dep.id)}
                                                    className={`px-4 py-2 text-xs font-black uppercase tracking-wider transition-colors ${
                                                        selectedDepartureId === dep.id
                                                            ? 'bg-black text-white'
                                                            : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                                                    }`}
                                                >
                                                    {selectedDepartureId === dep.id ? 'Đã chọn' : 'Chọn ngày'}
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Customer Reviews */}
                        <div className="bg-white p-8 border border-gray-200">
                            <h2 className="text-xl font-black uppercase tracking-tight text-gray-900 mb-4 pb-2 border-b border-gray-100">
                                Đánh giá từ khách hàng ({reviewsList.length})
                            </h2>
                            {reviewsList.length > 0 ? (
                                <div className="space-y-6">
                                    {reviewsList.map((rev) => (
                                        <div key={rev.id} className="border-b border-gray-100 pb-4 last:border-none">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center font-black text-xs uppercase">
                                                        {rev.users?.full_name ? rev.users.full_name[0] : 'U'}
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-black text-gray-900">
                                                            {rev.users?.full_name || 'Khách hàng'}
                                                        </p>
                                                        <span className="text-[10px] text-gray-400">
                                                            {formatDate(rev.created_at)}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    {Array.from({ length: 5 }).map((_, i) => (
                                                        <Star
                                                            key={i}
                                                            className={`w-3.5 h-3.5 ${
                                                                i < rev.rating
                                                                    ? 'fill-[#FACC15] text-[#FACC15]'
                                                                    : 'text-gray-200'
                                                            }`}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                            <p className="text-xs text-gray-700">{rev.comment}</p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-gray-500 italic">Chưa có đánh giá nào cho chuyến đi này.</p>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Sticky Booking Widget */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-24 bg-white p-6 border border-gray-200 shadow-xl">
                            <div className="border-b border-gray-200 pb-4 mb-4">
                                <span className="text-xs font-black uppercase tracking-wider text-gray-400 block mb-1">
                                    Giá trọn gói từ
                                </span>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-3xl font-black text-black">
                                        {formatCurrency(unitPrice)}
                                    </span>
                                    <span className="text-xs text-gray-500 font-bold">/ khách</span>
                                </div>
                                {hasDiscount && (
                                    <del className="text-xs text-gray-400 mt-1 block">
                                        Giá gốc: {formatCurrency(originalPrice)}
                                    </del>
                                )}
                            </div>

                            <form onSubmit={handleBookingSubmit} className="space-y-4">
                                {/* Chọn ngày khởi hành */}
                                {departures.length > 0 ? (
                                    <div>
                                        <label className="block text-xs font-black uppercase tracking-wider text-gray-700 mb-1.5">
                                            Ngày khởi hành
                                        </label>
                                        <select
                                            value={selectedDepartureId}
                                            onChange={(e) => setSelectedDepartureId(e.target.value)}
                                            className="w-full p-2.5 text-xs font-bold border border-gray-300 focus:outline-none focus:border-black bg-white"
                                        >
                                            {departures.map((d) => (
                                                <option key={d.id} value={d.id}>
                                                    {formatDate(d.start_date)} ({formatCurrency(d.discount_price ?? d.price)})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                ) : (
                                    <div className="text-xs text-gray-500 italic p-3 bg-gray-50 border border-gray-200">
                                        Khởi hành hàng tuần theo yêu cầu.
                                    </div>
                                )}

                                {/* Số lượng khách */}
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
                                            max={tour.availableSeats || 50}
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

                                {/* Tạm tính chi phí */}
                                <div className="border-t border-gray-200 pt-4 space-y-2 text-xs">
                                    <div className="flex justify-between text-gray-600 font-medium">
                                        <span>Đơn giá x {passengerCount} khách:</span>
                                        <span>{formatCurrency(totalPrice)}</span>
                                    </div>
                                    <div className="flex justify-between text-gray-600 font-medium">
                                        <span>Thuế & Phí dịch vụ:</span>
                                        <span className="text-green-600 font-bold">Đã bao gồm</span>
                                    </div>
                                    <div className="flex justify-between text-base font-black text-black border-t border-gray-100 pt-2">
                                        <span>Tổng thanh toán:</span>
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
                                        className="w-full bg-black text-white hover:bg-gray-800 py-3 px-4 text-xs font-black uppercase tracking-widest transition-colors shadow-md"
                                    >
                                        Đặt Tour Ngay
                                    </button>
                                )}
                            </form>

                            {/* Trust badges */}
                            <div className="mt-6 pt-6 border-t border-gray-200 space-y-3 text-xs text-gray-500 font-medium">
                                <div className="flex items-center gap-2">
                                    <ShieldCheck className="w-4 h-4 text-black shrink-0" />
                                    <span>Bảo hiểm du lịch trọn gói trong suốt chuyến đi</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4 text-black shrink-0" />
                                    <span>Hỗ trợ tư vấn 24/7 nhiệt tình và chu đáo</span>
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
export default function TourDetailPage(props: { params: Promise<{ id: string }> }) {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-black border-t-[#FACC15] rounded-full animate-spin"></div>
            </div>
        }>
            <TourDetailContent {...props} />
        </Suspense>
    );
}

'use client';

/**
 * ============================================================================
 * MODULE HOTELS - DETAIL PAGE (Trang Chi Tiết Khách Sạn & Đặt Phòng)
 * ============================================================================
 * Chịu trách nhiệm:
 * - Trình bày chi tiết phòng nghỉ: Tiện nghi, địa chỉ bản đồ, đánh giá từ du khách.
 * - Kiểm tra tình trạng phòng trống (Availability) trực tiếp theo ngày check-in/out.
 * - Widget đặt phòng trực tiếp chuyển hướng đến Checkout.
 * - Kết nối API: GET /api/v1/hotels/:id & GET /api/v1/hotels/:id/availability
 * ============================================================================
 */

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
    MapPin,
    Star,
    CheckCircle,
    ArrowLeft,
    ShieldCheck,
    Building,
    AlertCircle,
    BedDouble,
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3600';

interface HotelReview {
    id: string;
    rating: number;
    comment: string;
    created_at: string;
    users?: {
        full_name: string;
        avatar_url?: string | null;
    };
}

interface HotelDetail {
    id: string;
    name: string;
    city: string;
    address: string;
    star_rating: number;
    price_per_night: number;
    discount_price?: number | null;
    available_rooms: number;
    amenities: string[];
    images: string[];
    description?: string | null;
    averageRating: number;
    reviewCount: number;
    reviews?: HotelReview[];
}

interface AvailabilityResult {
    hotel_id: string;
    available_rooms: number;
    is_available: boolean;
    nights: number;
    price_per_night: number;
    estimated_total: number;
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
const getTomorrowDate = (): string => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
};

// (Đã thêm)
const getDayAfterTomorrowDate = (): string => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().split('T')[0];
};

export default function HotelDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const resolvedParams = use(params);
    const hotelId = resolvedParams.id;
    const router = useRouter();

    const [hotel, setHotel] = useState<HotelDetail | null>(null);
    const [selectedImage, setSelectedImage] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');

    // Booking & availability states
    const [checkIn, setCheckIn] = useState<string>(getTomorrowDate());
    const [checkOut, setCheckOut] = useState<string>(getDayAfterTomorrowDate());
    const [rooms, setRooms] = useState<number>(1);
    const [availability, setAvailability] = useState<AvailabilityResult | null>(null);
    const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
    const [bookingSuccess, setBookingSuccess] = useState(false);

    useEffect(() => {
        let isCancelled = false;

        // (Đã thêm)
        const executeFetchHotel = async () => {
            try {
                const res = await fetch(`${API_URL}/api/v1/hotels/${hotelId}`);
                if (!res.ok) {
                    throw new Error(`Không tìm thấy khách sạn (mã lỗi ${res.status})`);
                }
                const data = await res.json();
                if (data.status !== 'success' || !data.hotel) {
                    throw new Error(data.message || 'Không thể lấy thông tin khách sạn');
                }

                if (!isCancelled) {
                    const h: HotelDetail = data.hotel;
                    setHotel(h);
                    if (h.images && h.images.length > 0) {
                        setSelectedImage(h.images[0]);
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

        executeFetchHotel();

        return () => {
            isCancelled = true;
        };
    }, [hotelId]);

    useEffect(() => {
        if (!hotelId || !checkIn || !checkOut) return;

        let isCancelled = false;

        // (Đã thêm)
        const executeCheckAvailability = async () => {
            try {
                const q = new URLSearchParams({
                    rooms: String(rooms),
                    check_in: checkIn,
                    check_out: checkOut,
                });
                const res = await fetch(`${API_URL}/api/v1/hotels/${hotelId}/availability?${q.toString()}`);
                if (res.ok) {
                    const result = await res.json();
                    if (!isCancelled && result.status === 'success' && result.data) {
                        setAvailability(result.data);
                    }
                }
            } catch (err) {
                console.error('Lỗi kiểm tra phòng trống:', err);
            } finally {
                if (!isCancelled) {
                    setIsCheckingAvailability(false);
                }
            }
        };

        executeCheckAvailability();

        return () => {
            isCancelled = true;
        };
    }, [hotelId, checkIn, checkOut, rooms]);

    // (Đã thêm)
    const handleBookingSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (availability && !availability.is_available) {
            alert('Khách sạn không đủ phòng trống theo yêu cầu của bạn.');
            return;
        }

        setBookingSuccess(true);
        setTimeout(() => {
            router.push('/login');
        }, 2000);
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

    if (errorMessage || !hotel) {
        return (
            <div className="max-w-4xl mx-auto px-6 py-24 text-center">
                <AlertCircle className="w-16 h-16 mx-auto text-red-500 mb-4" />
                <h1 className="text-2xl font-black uppercase tracking-tight text-gray-900">
                    {errorMessage || 'Không tìm thấy khách sạn'}
                </h1>
                <p className="mt-2 text-gray-600 text-sm">
                    Khách sạn bạn tìm kiếm không tồn tại hoặc đã tạm ngừng kinh doanh.
                </p>
                <Link
                    href="/hotels"
                    className="mt-6 inline-flex items-center gap-2 bg-black text-white px-6 py-3 text-xs font-black uppercase tracking-wider hover:bg-gray-800 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" /> Quay lại danh sách Khách sạn
                </Link>
            </div>
        );
    }

    const currentPrice = hotel.discount_price ? Number(hotel.discount_price) : Number(hotel.price_per_night);
    const hasDiscount = hotel.discount_price != null && Number(hotel.discount_price) < Number(hotel.price_per_night);

    return (
        <div className="w-full min-h-screen bg-gray-50 pb-24">
            {/* Breadcrumb Bar */}
            <div className="bg-white border-b border-gray-200 py-4 px-6">
                <div className="max-w-7xl mx-auto flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-500">
                    <Link href="/" className="hover:text-black">Trang chủ</Link>
                    <span>/</span>
                    <Link href="/hotels" className="hover:text-black">Khách sạn</Link>
                    <span>/</span>
                    <span className="text-black truncate max-w-xs">{hotel.name}</span>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 mt-8">
                {/* Title Header */}
                <div className="mb-6">
                    <div className="flex flex-wrap items-center gap-3 mb-2">
                        <div className="flex items-center gap-1">
                            {Array.from({ length: hotel.star_rating || 0 }).map((_, i) => (
                                <Star key={i} className="w-4 h-4 fill-[#FACC15] text-[#FACC15]" />
                            ))}
                        </div>
                        <span className="text-xs font-bold text-gray-500">
                            Khách sạn {hotel.star_rating} sao
                        </span>
                        <span className="flex items-center gap-1 text-xs font-bold text-gray-700">
                            <Star className="w-3.5 h-3.5 fill-[#FACC15] text-[#FACC15]" />
                            {hotel.reviewCount
                                ? `${Number(hotel.averageRating).toFixed(1)} (${hotel.reviewCount} đánh giá)`
                                : 'Chưa có đánh giá'}
                        </span>
                    </div>

                    <h1 className="text-2xl md:text-4xl font-black uppercase tracking-tight text-gray-900">
                        {hotel.name}
                    </h1>

                    <div className="flex items-center gap-2 mt-3 text-xs md:text-sm text-gray-600 font-medium">
                        <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
                        <span>{hotel.address}, {hotel.city}</span>
                    </div>
                </div>

                {/* Photo Gallery */}
                <section className="mb-10">
                    <div className="relative aspect-[16/9] md:aspect-[21/9] w-full overflow-hidden bg-gray-200 border border-gray-200">
                        {selectedImage ? (
                            <Image
                                src={selectedImage}
                                alt={hotel.name}
                                fill
                                priority
                                className="object-cover"
                            />
                        ) : (
                            <div className="flex h-full items-center justify-center text-gray-400">
                                <Building className="h-16 w-16" />
                            </div>
                        )}
                    </div>

                    {hotel.images && hotel.images.length > 1 && (
                        <div className="flex items-center gap-3 mt-3 overflow-x-auto pb-2">
                            {hotel.images.map((img, idx) => (
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
                                        alt={`${hotel.name} ảnh ${idx + 1}`}
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
                        {/* Amenities Box */}
                        <div className="bg-white p-6 border border-gray-200">
                            <h2 className="text-base font-black uppercase tracking-wider text-gray-900 mb-4 pb-2 border-b border-gray-100">
                                Tiện nghi & Dịch vụ nổi bật
                            </h2>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {(hotel.amenities || []).map((amenity, idx) => (
                                    <div key={idx} className="flex items-center gap-2 text-xs font-bold text-gray-700 p-2 bg-gray-50 border border-gray-100">
                                        <CheckCircle className="w-3.5 h-3.5 text-black shrink-0" />
                                        <span>{amenity}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Description */}
                        <div className="bg-white p-8 border border-gray-200">
                            <h2 className="text-xl font-black uppercase tracking-tight text-gray-900 mb-4 pb-2 border-b border-gray-100">
                                Về khách sạn
                            </h2>
                            <p className="text-gray-700 leading-relaxed text-sm md:text-base whitespace-pre-line">
                                {hotel.description || 'Thông tin giới thiệu chi tiết về khách sạn đang được cập nhật.'}
                            </p>
                        </div>

                        {/* Customer Reviews */}
                        <div className="bg-white p-8 border border-gray-200">
                            <h2 className="text-xl font-black uppercase tracking-tight text-gray-900 mb-4 pb-2 border-b border-gray-100">
                                Nhận xét từ khách lưu trú ({hotel.reviews?.length || 0})
                            </h2>
                            {hotel.reviews && hotel.reviews.length > 0 ? (
                                <div className="space-y-6">
                                    {hotel.reviews.map((rev) => (
                                        <div key={rev.id} className="border-b border-gray-100 pb-4 last:border-none">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center font-black text-xs uppercase">
                                                        {rev.users?.full_name ? rev.users.full_name[0] : 'U'}
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-black text-gray-900">
                                                            {rev.users?.full_name || 'Khách lưu trú'}
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
                                <p className="text-sm text-gray-500 italic">Chưa có đánh giá nào cho khách sạn này.</p>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Sticky Booking Widget */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-24 bg-white p-6 border border-gray-200 shadow-xl">
                            <div className="border-b border-gray-200 pb-4 mb-4">
                                <span className="text-xs font-black uppercase tracking-wider text-gray-400 block mb-1">
                                    Giá lưu trú mỗi đêm
                                </span>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-3xl font-black text-black">
                                        {formatCurrency(currentPrice)}
                                    </span>
                                    <span className="text-xs text-gray-500 font-bold">/ đêm</span>
                                </div>
                                {hasDiscount && (
                                    <del className="text-xs text-gray-400 mt-1 block">
                                        Giá gốc: {formatCurrency(hotel.price_per_night)}
                                    </del>
                                )}
                            </div>

                            <form onSubmit={handleBookingSubmit} className="space-y-4">
                                {/* Check-in & Check-out */}
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="block text-[11px] font-black uppercase tracking-wider text-gray-700 mb-1">
                                            Nhận phòng
                                        </label>
                                        <input
                                            type="date"
                                            value={checkIn}
                                            onChange={(e) => {
                                                setIsCheckingAvailability(true);
                                                setCheckIn(e.target.value);
                                            }}
                                            className="w-full p-2 text-xs font-bold border border-gray-300 focus:outline-none focus:border-black bg-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-black uppercase tracking-wider text-gray-700 mb-1">
                                            Trả phòng
                                        </label>
                                        <input
                                            type="date"
                                            value={checkOut}
                                            onChange={(e) => {
                                                setIsCheckingAvailability(true);
                                                setCheckOut(e.target.value);
                                            }}
                                            className="w-full p-2 text-xs font-bold border border-gray-300 focus:outline-none focus:border-black bg-white"
                                        />
                                    </div>
                                </div>

                                {/* Số phòng */}
                                <div>
                                    <label className="block text-xs font-black uppercase tracking-wider text-gray-700 mb-1.5">
                                        Số lượng phòng
                                    </label>
                                    <div className="flex items-center border border-gray-300">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setIsCheckingAvailability(true);
                                                setRooms((r) => Math.max(1, r - 1));
                                            }}
                                            className="w-10 h-10 flex items-center justify-center font-black text-lg bg-gray-50 hover:bg-gray-100 border-r border-gray-300"
                                        >
                                            -
                                        </button>
                                        <input
                                            type="number"
                                            min={1}
                                            max={hotel.available_rooms || 10}
                                            value={rooms}
                                            onChange={(e) => {
                                                setIsCheckingAvailability(true);
                                                setRooms(Math.max(1, Number(e.target.value) || 1));
                                            }}
                                            className="w-full text-center text-sm font-black focus:outline-none"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setIsCheckingAvailability(true);
                                                setRooms((r) => r + 1);
                                            }}
                                            className="w-10 h-10 flex items-center justify-center font-black text-lg bg-gray-50 hover:bg-gray-100 border-l border-gray-300"
                                        >
                                            +
                                        </button>
                                    </div>
                                </div>

                                {/* Availability feedback */}
                                {availability && (
                                    <div className={`p-3 text-xs border ${
                                        availability.is_available
                                            ? 'bg-green-50 border-green-200 text-green-800'
                                            : 'bg-red-50 border-red-200 text-red-800'
                                    }`}>
                                        <div className="flex items-center gap-1.5 font-bold mb-1">
                                            {availability.is_available ? (
                                                <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
                                            ) : (
                                                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                                            )}
                                            <span>
                                                {availability.is_available
                                                    ? `Còn ${availability.available_rooms} phòng khả dụng`
                                                    : 'Không đủ phòng trống cho đợt lưu trú này'}
                                            </span>
                                        </div>
                                        <p className="text-[11px] text-gray-600">
                                            Thời gian lưu trú: {availability.nights} đêm
                                        </p>
                                    </div>
                                )}

                                {/* Price breakdown */}
                                {availability && (
                                    <div className="border-t border-gray-200 pt-4 space-y-2 text-xs">
                                        <div className="flex justify-between text-gray-600 font-medium">
                                            <span>{formatCurrency(availability.price_per_night)} x {rooms} phòng x {availability.nights} đêm:</span>
                                            <span>{formatCurrency(availability.estimated_total)}</span>
                                        </div>
                                        <div className="flex justify-between text-gray-600 font-medium">
                                            <span>Phí dịch vụ & VAT:</span>
                                            <span className="text-green-600 font-bold">Đã bao gồm</span>
                                        </div>
                                        <div className="flex justify-between text-base font-black text-black border-t border-gray-100 pt-2">
                                            <span>Tổng cộng:</span>
                                            <span>{formatCurrency(availability.estimated_total)}</span>
                                        </div>
                                    </div>
                                )}

                                {bookingSuccess ? (
                                    <div className="bg-green-50 border border-green-200 text-green-700 p-3 text-xs font-bold text-center">
                                        Đang chuyển tới trang xác nhận thông tin...
                                    </div>
                                ) : (
                                    <button
                                        type="submit"
                                        disabled={isCheckingAvailability || (availability ? !availability.is_available : false)}
                                        className="w-full bg-black text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed py-3 px-4 text-xs font-black uppercase tracking-widest transition-colors shadow-md"
                                    >
                                        Đặt Phòng Ngay
                                    </button>
                                )}
                            </form>

                            {/* Trust badges */}
                            <div className="mt-6 pt-6 border-t border-gray-200 space-y-3 text-xs text-gray-500 font-medium">
                                <div className="flex items-center gap-2">
                                    <ShieldCheck className="w-4 h-4 text-black shrink-0" />
                                    <span>Đảm bảo giá tốt nhất & Xác nhận tức thì</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <BedDouble className="w-4 h-4 text-black shrink-0" />
                                    <span>Hỗ trợ nhận phòng sớm / trả phòng muộn tùy tình trạng</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

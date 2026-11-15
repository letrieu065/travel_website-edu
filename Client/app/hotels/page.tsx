'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
    Search,
    MapPin,
    Star,
    Filter,
    RotateCcw,
    ChevronLeft,
    ChevronRight,
    Wifi,
    Utensils,
    Car,
    Coffee,
    Waves,
    Building,
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3600';

interface HotelItem {
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
    is_trending?: boolean;
    averageRating: number;
    reviewCount: number;
}

interface HotelFilterState {
    search: string;
    city: string;
    starRating: string;
    minPrice: string;
    maxPrice: string;
    selectedAmenities: string[];
    sort: string;
}

const initialHotelFilters: HotelFilterState = {
    search: '',
    city: '',
    starRating: '',
    minPrice: '',
    maxPrice: '',
    selectedAmenities: [],
    sort: 'newest',
};

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
const renderAmenityIcon = (amenity: string) => {
    const lower = amenity.toLowerCase();
    if (lower.includes('wifi')) return <Wifi className="w-3.5 h-3.5" />;
    if (lower.includes('bơi') || lower.includes('pool')) return <Waves className="w-3.5 h-3.5" />;
    if (lower.includes('ăn') || lower.includes('nhà hàng') || lower.includes('restaurant')) return <Utensils className="w-3.5 h-3.5" />;
    if (lower.includes('xe') || lower.includes('parking')) return <Car className="w-3.5 h-3.5" />;
    if (lower.includes('sáng') || lower.includes('coffee') || lower.includes('cafe')) return <Coffee className="w-3.5 h-3.5" />;
    return <Building className="w-3.5 h-3.5" />;
};

export default function HotelsPage() {
    const [hotels, setHotels] = useState<HotelItem[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const limit = 9;
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');

    const [formFilters, setFormFilters] = useState<HotelFilterState>(initialHotelFilters);
    const [appliedFilters, setAppliedFilters] = useState<HotelFilterState>(initialHotelFilters);

    const popularAmenities = ['Wifi', 'Hồ bơi', 'Nhà hàng', 'Bãi đỗ xe', 'Bữa sáng', 'Spa'];

    // (Đã thêm)
    const toggleAmenity = (amenity: string) => {
        setFormFilters((prev) => ({
            ...prev,
            selectedAmenities: prev.selectedAmenities.includes(amenity)
                ? prev.selectedAmenities.filter((a) => a !== amenity)
                : [...prev.selectedAmenities, amenity],
        }));
    };

    useEffect(() => {
        let isCancelled = false;

        // (Đã thêm)
        const executeFetchHotels = async () => {
            try {
                const queryParams = new URLSearchParams({
                    page: String(page),
                    limit: String(limit),
                });

                if (appliedFilters.search.trim()) queryParams.set('search', appliedFilters.search.trim());
                if (appliedFilters.city.trim()) queryParams.set('city', appliedFilters.city.trim());
                if (appliedFilters.starRating) queryParams.set('star_rating', appliedFilters.starRating);
                if (appliedFilters.minPrice) queryParams.set('min_price', appliedFilters.minPrice);
                if (appliedFilters.maxPrice) queryParams.set('max_price', appliedFilters.maxPrice);
                if (appliedFilters.selectedAmenities.length > 0) {
                    queryParams.set('amenities', appliedFilters.selectedAmenities.join(','));
                }
                if (appliedFilters.sort) queryParams.set('sort', appliedFilters.sort);

                const res = await fetch(`${API_URL}/api/v1/hotels?${queryParams.toString()}`);
                if (!res.ok) {
                    throw new Error(`Lỗi tải dữ liệu (${res.status})`);
                }
                const data = await res.json();
                if (!isCancelled) {
                    if (data.status === 'success') {
                        setHotels(data.hotels || []);
                        setTotal(data.total || 0);
                        setErrorMessage('');
                    } else {
                        throw new Error(data.message || 'Không thể lấy danh sách khách sạn');
                    }
                }
            } catch (err: unknown) {
                if (!isCancelled) {
                    const msg = err instanceof Error ? err.message : 'Lỗi kết nối máy chủ';
                    setErrorMessage(msg);
                    setHotels([]);
                    setTotal(0);
                }
            } finally {
                if (!isCancelled) {
                    setIsLoading(false);
                }
            }
        };

        executeFetchHotels();

        return () => {
            isCancelled = true;
        };
    }, [page, appliedFilters, limit]);

    // (Đã thêm)
    const handleFilterSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setPage(1);
        setAppliedFilters({ ...formFilters });
    };

    // (Đã thêm)
    const handleResetFilters = () => {
        setFormFilters(initialHotelFilters);
        setIsLoading(true);
        setPage(1);
        setAppliedFilters(initialHotelFilters);
    };

    const totalPages = Math.ceil(total / limit) || 1;

    return (
        <div className="w-full min-h-screen bg-gray-50 pb-20">
            {/* Hero Header */}
            <section className="bg-black text-white py-14 px-6 border-b border-gray-800">
                <div className="max-w-7xl mx-auto">
                    <span className="text-xs font-black tracking-widest text-[#FACC15] uppercase">
                        Nghỉ dưỡng thượng lưu
                    </span>
                    <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tight mt-2">
                        Khách Sạn & Khu Nghỉ Dưỡng
                    </h1>
                    <p className="mt-3 text-gray-400 text-sm md:text-base max-w-2xl">
                        Khám phá không gian lưu trú sang trọng, dịch vụ hoàn hảo và vị trí đắc địa tại các thiên đường du lịch.
                    </p>
                </div>
            </section>

            {/* Filter & Search Bar */}
            <div className="max-w-7xl mx-auto px-6 -mt-6">
                <form
                    onSubmit={handleFilterSubmit}
                    className="bg-white p-6 border border-gray-200 shadow-xl rounded-none flex flex-col gap-4"
                >
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {/* Search keyword */}
                        <div className="relative">
                            <label className="block text-xs font-black uppercase tracking-wider text-gray-600 mb-1">
                                Tên khách sạn / Địa điểm
                            </label>
                            <div className="relative">
                                <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Tìm theo tên hoặc địa chỉ..."
                                    value={formFilters.search}
                                    onChange={(e) => setFormFilters({ ...formFilters, search: e.target.value })}
                                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 focus:outline-none focus:border-black font-medium"
                                />
                            </div>
                        </div>

                        {/* Thành phố */}
                        <div>
                            <label className="block text-xs font-black uppercase tracking-wider text-gray-600 mb-1">
                                Thành phố / Tỉnh thành
                            </label>
                            <select
                                value={formFilters.city}
                                onChange={(e) => setFormFilters({ ...formFilters, city: e.target.value })}
                                className="w-full px-3 py-2 text-sm border border-gray-300 focus:outline-none focus:border-black font-medium bg-white"
                            >
                                <option value="">Tất cả địa điểm</option>
                                <option value="Đà Nẵng">Đà Nẵng</option>
                                <option value="Nha Trang">Nha Trang</option>
                                <option value="Phú Quốc">Phú Quốc</option>
                                <option value="Hà Nội">Hà Nội</option>
                                <option value="Hồ Chí Minh">TP. Hồ Chí Minh</option>
                                <option value="Đà Lạt">Đà Lạt</option>
                                <option value="Hạ Long">Hạ Long</option>
                                <option value="Hội An">Hội An</option>
                            </select>
                        </div>

                        {/* Hạng sao */}
                        <div>
                            <label className="block text-xs font-black uppercase tracking-wider text-gray-600 mb-1">
                                Tiêu chuẩn khách sạn
                            </label>
                            <select
                                value={formFilters.starRating}
                                onChange={(e) => setFormFilters({ ...formFilters, starRating: e.target.value })}
                                className="w-full px-3 py-2 text-sm border border-gray-300 focus:outline-none focus:border-black font-medium bg-white"
                            >
                                <option value="">Tất cả hạng sao</option>
                                <option value="5">5 sao cao cấp</option>
                                <option value="4">4 sao tiêu chuẩn</option>
                                <option value="3">3 sao tiện nghi</option>
                            </select>
                        </div>

                        {/* Sắp xếp */}
                        <div>
                            <label className="block text-xs font-black uppercase tracking-wider text-gray-600 mb-1">
                                Sắp xếp theo
                            </label>
                            <select
                                value={formFilters.sort}
                                onChange={(e) => setFormFilters({ ...formFilters, sort: e.target.value })}
                                className="w-full px-3 py-2 text-sm border border-gray-300 focus:outline-none focus:border-black font-medium bg-white"
                            >
                                <option value="newest">Mới nhất</option>
                                <option value="star_desc">Hạng sao cao nhất</option>
                                <option value="rating_desc">Đánh giá tốt nhất</option>
                                <option value="price_asc">Giá: Thấp đến cao</option>
                                <option value="price_desc">Giá: Cao đến thấp</option>
                            </select>
                        </div>
                    </div>

                    {/* Amenities tags and Action row */}
                    <div className="pt-3 border-t border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-black uppercase text-gray-600 mr-1">Tiện ích:</span>
                            {popularAmenities.map((amenity) => {
                                const isChecked = formFilters.selectedAmenities.includes(amenity);
                                return (
                                    <button
                                        key={amenity}
                                        type="button"
                                        onClick={() => toggleAmenity(amenity)}
                                        className={`px-3 py-1 text-xs font-bold transition-colors border ${
                                            isChecked
                                                ? 'bg-black text-white border-black'
                                                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                                        }`}
                                    >
                                        {amenity}
                                    </button>
                                );
                            })}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                            <button
                                type="submit"
                                className="bg-black text-white hover:bg-gray-800 py-2.5 px-6 text-xs font-black uppercase tracking-wider transition-colors flex items-center gap-1.5"
                            >
                                <Filter className="w-4 h-4" />
                                Tìm Khách Sạn
                            </button>
                            <button
                                type="button"
                                onClick={handleResetFilters}
                                title="Đặt lại bộ lọc"
                                className="bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 px-3 text-xs font-black uppercase transition-colors"
                            >
                                <RotateCcw className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </form>
            </div>

            {/* Results Section */}
            <main className="max-w-7xl mx-auto px-6 mt-12">
                <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-200">
                    <p className="text-sm font-bold uppercase tracking-wider text-gray-700">
                        Tìm thấy <span className="text-black font-black">{total}</span> khách sạn & resort
                    </p>
                    <span className="text-xs text-gray-500">Trang {page} / {totalPages}</span>
                </div>

                {errorMessage && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 mb-8 text-sm">
                        {errorMessage}
                    </div>
                )}

                {/* Loading Skeleton */}
                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[1, 2, 3, 4, 5, 6].map((idx) => (
                            <div key={idx} className="border border-gray-200 bg-white animate-pulse">
                                <div className="aspect-[4/3] bg-gray-200" />
                                <div className="p-6 space-y-3">
                                    <div className="h-4 bg-gray-200 w-1/4" />
                                    <div className="h-6 bg-gray-200 w-3/4" />
                                    <div className="h-4 bg-gray-200 w-full" />
                                    <div className="h-8 bg-gray-200 w-1/2 pt-4" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : hotels.length > 0 ? (
                    /* Hotel Cards Grid */
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {hotels.map((hotel) => {
                            const hasDiscount = hotel.discount_price != null && Number(hotel.discount_price) < Number(hotel.price_per_night);
                            const displayPrice = hotel.discount_price ?? hotel.price_per_night;

                            return (
                                <article
                                    key={hotel.id}
                                    className="group overflow-hidden border border-gray-200 bg-white transition-shadow hover:shadow-xl flex flex-col justify-between"
                                >
                                    <Link href={`/hotels/${hotel.id}`} className="block">
                                        <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
                                            {hotel.images?.[0] ? (
                                                <Image
                                                    src={hotel.images[0]}
                                                    alt={hotel.name}
                                                    fill
                                                    sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                                                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                                                />
                                            ) : (
                                                <div className="flex h-full items-center justify-center text-gray-400">
                                                    <Building className="h-10 w-10" />
                                                </div>
                                            )}

                                            {hotel.is_trending && (
                                                <span className="absolute left-4 top-4 bg-[#FACC15] px-3 py-1 text-xs font-black uppercase text-black">
                                                    Thịnh hành
                                                </span>
                                            )}
                                            {hasDiscount && (
                                                <span className="absolute right-4 top-4 bg-red-600 px-3 py-1 text-xs font-black text-white">
                                                    Ưu đãi
                                                </span>
                                            )}
                                        </div>

                                        <div className="p-6">
                                            <div className="flex items-center justify-between mb-2">
                                                <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gray-500">
                                                    <MapPin className="h-3.5 w-3.5" />
                                                    {hotel.city}
                                                </p>
                                                {/* Star rating */}
                                                <div className="flex items-center gap-0.5">
                                                    {Array.from({ length: hotel.star_rating || 0 }).map((_, i) => (
                                                        <Star
                                                            key={i}
                                                            className="w-3.5 h-3.5 fill-[#FACC15] text-[#FACC15]"
                                                        />
                                                    ))}
                                                </div>
                                            </div>

                                            <h3 className="text-xl font-black group-hover:underline text-gray-900 line-clamp-1 mb-1">
                                                {hotel.name}
                                            </h3>

                                            <p className="text-xs text-gray-500 line-clamp-1 mb-4">
                                                {hotel.address}
                                            </p>

                                            {/* Amenities icons */}
                                            {hotel.amenities && hotel.amenities.length > 0 && (
                                                <div className="flex flex-wrap items-center gap-2 mb-4">
                                                    {hotel.amenities.slice(0, 4).map((am, i) => (
                                                        <span
                                                            key={i}
                                                            className="inline-flex items-center gap-1 text-[11px] font-bold text-gray-600 bg-gray-50 px-2 py-1 border border-gray-100"
                                                        >
                                                            {renderAmenityIcon(am)}
                                                            {am}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}

                                            <div className="flex items-center justify-between border-t border-gray-100 pt-4 mt-2">
                                                <span className="flex items-center gap-1 text-xs font-bold text-gray-700">
                                                    <Star className="h-4 w-4 fill-[#FACC15] text-[#FACC15]" />
                                                    {hotel.reviewCount
                                                        ? `${Number(hotel.averageRating).toFixed(1)} (${hotel.reviewCount})`
                                                        : 'Mới'}
                                                </span>
                                                <div className="text-right">
                                                    {hasDiscount && (
                                                        <del className="block text-[11px] text-gray-400">
                                                            {formatCurrency(hotel.price_per_night)}
                                                        </del>
                                                    )}
                                                    <strong className="text-lg font-black text-black">
                                                        {formatCurrency(displayPrice)}
                                                    </strong>
                                                    <span className="text-[10px] text-gray-500 block">/ đêm</span>
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                </article>
                            );
                        })}
                    </div>
                ) : (
                    /* Empty State */
                    <div className="text-center py-20 bg-white border border-gray-200 px-4">
                        <Building className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                        <h3 className="text-lg font-black uppercase tracking-wider text-gray-800">
                            Không tìm thấy khách sạn phù hợp
                        </h3>
                        <p className="text-sm text-gray-500 mt-1 max-w-md mx-auto">
                            Vui lòng thử thay đổi các tùy chọn lọc hoặc tìm kiếm theo thành phố khác.
                        </p>
                        <button
                            type="button"
                            onClick={handleResetFilters}
                            className="mt-6 inline-flex items-center gap-2 bg-black text-white px-6 py-2.5 text-xs font-black uppercase tracking-wider hover:bg-gray-800 transition-colors"
                        >
                            <RotateCcw className="w-4 h-4" />
                            Xóa bộ lọc
                        </button>
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="mt-12 flex items-center justify-center gap-2">
                        <button
                            type="button"
                            disabled={page <= 1}
                            onClick={() => {
                                setIsLoading(true);
                                setPage((prev) => Math.max(1, prev - 1));
                            }}
                            className="px-4 py-2 border border-gray-300 bg-white text-xs font-bold uppercase tracking-wider disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors flex items-center gap-1"
                        >
                            <ChevronLeft className="w-4 h-4" /> Trước
                        </button>

                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                            <button
                                key={p}
                                type="button"
                                onClick={() => {
                                    setIsLoading(true);
                                    setPage(p);
                                }}
                                className={`w-10 h-10 border text-xs font-black transition-colors ${
                                    page === p
                                        ? 'bg-black text-white border-black'
                                        : 'bg-white text-gray-800 border-gray-300 hover:bg-gray-100'
                                }`}
                            >
                                {p}
                            </button>
                        ))}

                        <button
                            type="button"
                            disabled={page >= totalPages}
                            onClick={() => {
                                setIsLoading(true);
                                setPage((prev) => Math.min(totalPages, prev + 1));
                            }}
                            className="px-4 py-2 border border-gray-300 bg-white text-xs font-bold uppercase tracking-wider disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors flex items-center gap-1"
                        >
                            Sau <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </main>
        </div>
    );
}

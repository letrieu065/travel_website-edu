'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import {
    Utensils,
    MapPin,
    Star,
    Search,
    RotateCcw,
    Sparkles,
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3600';

interface RestaurantItem {
    id: string;
    name: string;
    city: string;
    address: string;
    cuisine: string;
    average_price: number;
    rating: number;
    review_count: number;
    images: string[];
    description: string;
}

interface RestaurantFilterState {
    search: string;
    city: string;
    cuisine: string;
    minRating: string;
    sort: string;
}

const initialFilters: RestaurantFilterState = {
    search: '',
    city: '',
    cuisine: '',
    minRating: '',
    sort: 'rating_desc',
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
export default function RestaurantsPage() {
    const [restaurants, setRestaurants] = useState<RestaurantItem[]>([]);
    const [total, setTotal] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');

    const [formFilters, setFormFilters] = useState<RestaurantFilterState>(initialFilters);
    const [appliedFilters, setAppliedFilters] = useState<RestaurantFilterState>(initialFilters);

    // Selected restaurant for table booking modal
    const [selectedRestaurant, setSelectedRestaurant] = useState<RestaurantItem | null>(null);
    const [bookingSuccess, setBookingSuccess] = useState(false);

    useEffect(() => {
        let isCancelled = false;

        // (Đã thêm)
        const loadRestaurants = async () => {
            try {
                setIsLoading(true);
                setErrorMessage('');

                const queryParams = new URLSearchParams({
                    page: '1',
                    limit: '20',
                });

                if (appliedFilters.search.trim()) queryParams.set('search', appliedFilters.search.trim());
                if (appliedFilters.city) queryParams.set('city', appliedFilters.city);
                if (appliedFilters.cuisine) queryParams.set('cuisine', appliedFilters.cuisine);
                if (appliedFilters.minRating) queryParams.set('min_rating', appliedFilters.minRating);
                if (appliedFilters.sort) queryParams.set('sort', appliedFilters.sort);

                const res = await fetch(`${API_URL}/api/v1/restaurants?${queryParams.toString()}`);
                if (!res.ok) {
                    throw new Error(`Lỗi tải danh sách nhà hàng (${res.status})`);
                }

                const data = await res.json();
                if (!isCancelled) {
                    if (data.status === 'success') {
                        setRestaurants(data.restaurants || []);
                        setTotal(data.total || 0);
                    } else {
                        throw new Error(data.message || 'Không thể lấy dữ liệu ẩm thực');
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

        loadRestaurants();

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

    // (Đã thêm)
    const handleReserveTable = (e: React.FormEvent) => {
        e.preventDefault();
        setBookingSuccess(true);
        setTimeout(() => {
            setBookingSuccess(false);
            setSelectedRestaurant(null);
        }, 2500);
    };

    return (
        <div className="min-h-screen bg-[#FDFBF7] text-gray-900 pb-20">
            {/* Hero Editorial Header */}
            <section className="relative bg-[#0f141e] text-white py-16 px-6 lg:px-12 border-b border-gray-800">
                <div className="max-w-7xl mx-auto">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#FACC15] text-black text-xs font-black uppercase tracking-widest rounded-sm mb-3">
                        <Utensils className="w-3.5 h-3.5" /> Lonely Planet Food & Dining
                    </span>
                    <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tight text-white font-serif max-w-3xl">
                        Khám Phá Hương Vị Ẩm Thực Bản Địa
                    </h1>
                    <p className="mt-4 text-sm md:text-base text-gray-300 max-w-2xl font-light leading-relaxed">
                        Từ hải sản tươi sống bên bờ biển miền Trung đến phở truyền thống phố cổ Hà Nội hay bistro hiện đại tại Sài Gòn, hãy để vị giác dẫn lối cho chuyến phiêu lưu của bạn.
                    </p>

                    {/* Filter Bar */}
                    <form
                        onSubmit={handleFilterSubmit}
                        className="mt-8 bg-white text-gray-900 p-4 md:p-6 shadow-2xl border-t-4 border-[#FACC15] grid grid-cols-1 md:grid-cols-4 gap-4"
                    >
                        <div>
                            <label className="block text-[11px] font-black uppercase tracking-wider text-gray-500 mb-1">
                                Tên Quán Hoặc Món Ăn
                            </label>
                            <div className="relative">
                                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    value={formFilters.search}
                                    onChange={(e) => setFormFilters({ ...formFilters, search: e.target.value })}
                                    placeholder="Hải sản, Phở, Bistro..."
                                    className="w-full pl-9 pr-3 py-2 text-xs font-semibold border border-gray-200 focus:outline-none focus:border-black"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[11px] font-black uppercase tracking-wider text-gray-500 mb-1">
                                Tỉnh / Thành Phố
                            </label>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                                <select
                                    value={formFilters.city}
                                    onChange={(e) => setFormFilters({ ...formFilters, city: e.target.value })}
                                    className="w-full pl-9 pr-3 py-2 text-xs font-semibold border border-gray-200 focus:outline-none focus:border-black bg-white"
                                >
                                    <option value="">Tất cả thành phố</option>
                                    <option value="Đà Nẵng">Đà Nẵng</option>
                                    <option value="Hà Nội">Hà Nội</option>
                                    <option value="TP. Hồ Chí Minh">TP. Hồ Chí Minh</option>
                                    <option value="Hội An">Hội An</option>
                                    <option value="Phú Quốc">Phú Quốc</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-[11px] font-black uppercase tracking-wider text-gray-500 mb-1">
                                Phong Cách Ẩm Thực
                            </label>
                            <select
                                value={formFilters.cuisine}
                                onChange={(e) => setFormFilters({ ...formFilters, cuisine: e.target.value })}
                                className="w-full px-3 py-2 text-xs font-semibold border border-gray-200 focus:outline-none focus:border-black bg-white"
                            >
                                <option value="">Tất cả phong cách</option>
                                <option value="Hải sản">Hải sản tươi sống</option>
                                <option value="truyền thống">Ẩm thực truyền thống</option>
                                <option value="Á - Âu">Á - Âu kết hợp</option>
                            </select>
                        </div>

                        <div className="flex items-end gap-2">
                            <button
                                type="submit"
                                className="flex-1 bg-black text-[#FACC15] hover:bg-gray-800 py-2.5 px-4 text-xs font-black uppercase tracking-widest flex items-center justify-center gap-1.5 transition-colors"
                            >
                                <Search className="w-4 h-4" /> Tìm Kiếm
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
                            Địa điểm ẩm thực tuyển chọn
                        </span>
                        <h2 className="text-2xl font-black uppercase tracking-tight text-gray-900">
                            Nhà Hàng & Quán Ăn Nổi Bật ({total})
                        </h2>
                    </div>
                </div>

                {errorMessage && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-xs font-semibold mb-8">
                        {errorMessage}
                    </div>
                )}

                {/* Loading skeleton */}
                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="bg-white border border-gray-200 p-4 animate-pulse space-y-4">
                                <div className="h-48 bg-gray-200 w-full"></div>
                                <div className="h-4 bg-gray-200 w-3/4"></div>
                                <div className="h-3 bg-gray-100 w-1/2"></div>
                            </div>
                        ))}
                    </div>
                ) : restaurants.length === 0 ? (
                    <div className="bg-white border border-dashed border-gray-300 p-12 text-center my-8">
                        <Utensils className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <h3 className="text-base font-bold uppercase tracking-tight text-gray-800">
                            Không tìm thấy quán ăn phù hợp
                        </h3>
                        <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto mb-4">
                            Hãy thử nới lỏng bộ lọc hoặc tìm kiếm theo thành phố khác.
                        </p>
                        <button
                            type="button"
                            onClick={handleResetFilters}
                            className="bg-black text-[#FACC15] px-6 py-2.5 text-xs font-black uppercase tracking-widest"
                        >
                            Xem Tất Cả Nhà Hàng
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {restaurants.map((rest) => {
                            const img = rest.images?.[0] || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80';

                            return (
                                <div
                                    key={rest.id}
                                    className="bg-white border border-gray-200 hover:border-black transition-all flex flex-col justify-between group shadow-sm hover:shadow-lg"
                                >
                                    <div>
                                        {/* Image */}
                                        <div className="relative h-56 w-full overflow-hidden bg-gray-100">
                                            <Image
                                                src={img}
                                                alt={rest.name}
                                                fill
                                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                                className="object-cover group-hover:scale-105 transition-transform duration-500"
                                            />
                                            <div className="absolute top-3 left-3 bg-[#FACC15] text-black text-[10px] font-black uppercase tracking-wider px-2 py-0.5">
                                                {rest.cuisine}
                                            </div>
                                            <div className="absolute bottom-3 left-3 bg-black/80 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 backdrop-blur-sm flex items-center gap-1">
                                                <MapPin className="w-3 h-3 text-[#FACC15]" /> {rest.city}
                                            </div>
                                        </div>

                                        {/* Content */}
                                        <div className="p-5">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="flex items-center gap-1 text-xs font-black text-amber-500 bg-amber-50 px-2 py-0.5 border border-amber-200">
                                                    <Star className="w-3.5 h-3.5 fill-amber-400" /> {rest.rating} ({rest.review_count} đánh giá)
                                                </span>
                                                <span className="text-xs font-black text-gray-900">
                                                    ~ {formatCurrency(rest.average_price)}/người
                                                </span>
                                            </div>

                                            <h3 className="text-base font-black uppercase tracking-tight text-gray-900 line-clamp-1 mb-1">
                                                {rest.name}
                                            </h3>

                                            <p className="text-[11px] text-gray-500 line-clamp-1 mb-2">
                                                {rest.address}
                                            </p>

                                            <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                                                {rest.description}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Action */}
                                    <div className="p-4 bg-gray-50 border-t border-gray-100">
                                        <button
                                            type="button"
                                            onClick={() => setSelectedRestaurant(rest)}
                                            className="w-full bg-black text-[#FACC15] hover:bg-gray-800 py-2.5 text-xs font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
                                        >
                                            <Utensils className="w-3.5 h-3.5" /> Đặt Bàn Ngay
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>

            {/* Table Reservation Modal */}
            {selectedRestaurant && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white max-w-lg w-full p-6 md:p-8 border-4 border-black shadow-2xl relative">
                        <span className="text-[10px] font-black uppercase tracking-widest bg-[#FACC15] text-black px-2.5 py-1 inline-block mb-2">
                            Đặt Bàn Trước · Reserve Table
                        </span>
                        <h3 className="text-xl font-black uppercase tracking-tight text-gray-900 mb-1 font-serif">
                            {selectedRestaurant.name}
                        </h3>
                        <p className="text-xs text-gray-500 mb-6">
                            {selectedRestaurant.address}
                        </p>

                        {bookingSuccess ? (
                            <div className="bg-emerald-50 border-2 border-emerald-500 p-6 text-center text-emerald-800 my-4">
                                <Sparkles className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
                                <h4 className="font-black text-sm uppercase">Yêu Cầu Đã Được Ghi Nhận!</h4>
                                <p className="text-xs mt-1">Nhà hàng sẽ gọi điện xác nhận trong vòng 15 phút.</p>
                            </div>
                        ) : (
                            <form onSubmit={handleReserveTable} className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[11px] font-black uppercase tracking-wider text-gray-500 mb-1">
                                            Họ và Tên
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="Nguyễn Văn A"
                                            className="w-full px-3 py-2 text-xs font-semibold border border-gray-200 focus:outline-none focus:border-black"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-black uppercase tracking-wider text-gray-500 mb-1">
                                            Số Điện Thoại
                                        </label>
                                        <input
                                            type="tel"
                                            required
                                            placeholder="0912 345 678"
                                            className="w-full px-3 py-2 text-xs font-semibold border border-gray-200 focus:outline-none focus:border-black"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[11px] font-black uppercase tracking-wider text-gray-500 mb-1">
                                            Ngày & Giờ Dùng Bữa
                                        </label>
                                        <input
                                            type="datetime-local"
                                            required
                                            className="w-full px-3 py-2 text-xs font-semibold border border-gray-200 focus:outline-none focus:border-black"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-black uppercase tracking-wider text-gray-500 mb-1">
                                            Số Lượng Khách
                                        </label>
                                        <select className="w-full px-3 py-2 text-xs font-semibold border border-gray-200 focus:outline-none focus:border-black bg-white">
                                            {[2, 4, 6, 8, 10, 15].map((num) => (
                                                <option key={num} value={num}>
                                                    {num} người
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="flex gap-2 pt-4">
                                    <button
                                        type="submit"
                                        className="flex-1 bg-black text-[#FACC15] hover:bg-gray-800 py-3 text-xs font-black uppercase tracking-widest"
                                    >
                                        Xác Nhận Giữ Bàn
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setSelectedRestaurant(null)}
                                        className="border border-gray-200 px-6 py-3 text-xs font-bold text-gray-600 hover:text-black"
                                    >
                                        Hủy
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

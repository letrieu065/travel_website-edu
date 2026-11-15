'use client';

import React, { useState, useEffect } from 'react';
import { Search, MapPin, Filter, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react';
import TourCard, { type Tour } from '@/components/common/TourCard';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3600';

interface TourFilterState {
    search: string;
    destination: string;
    departureLocation: string;
    tourType: string;
    minPrice: string;
    maxPrice: string;
    minRating: string;
    sort: string;
}

const initialFilters: TourFilterState = {
    search: '',
    destination: '',
    departureLocation: '',
    tourType: '',
    minPrice: '',
    maxPrice: '',
    minRating: '',
    sort: 'newest',
};

export default function ToursPage() {
    const [tours, setTours] = useState<Tour[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const limit = 9;
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');

    // Form inputs state
    const [formFilters, setFormFilters] = useState<TourFilterState>(initialFilters);
    // Applied filters state (triggers API call)
    const [appliedFilters, setAppliedFilters] = useState<TourFilterState>(initialFilters);

    useEffect(() => {
        let isCancelled = false;

        // (Đã thêm)
        const executeFetchTours = async () => {
            try {
                const queryParams = new URLSearchParams({
                    page: String(page),
                    limit: String(limit),
                });

                if (appliedFilters.search.trim()) queryParams.set('search', appliedFilters.search.trim());
                if (appliedFilters.destination.trim()) queryParams.set('destination', appliedFilters.destination.trim());
                if (appliedFilters.departureLocation.trim()) queryParams.set('departure_location', appliedFilters.departureLocation.trim());
                if (appliedFilters.tourType) queryParams.set('tour_type', appliedFilters.tourType);
                if (appliedFilters.minPrice) queryParams.set('min_price', appliedFilters.minPrice);
                if (appliedFilters.maxPrice) queryParams.set('max_price', appliedFilters.maxPrice);
                if (appliedFilters.minRating) queryParams.set('min_rating', appliedFilters.minRating);
                if (appliedFilters.sort) queryParams.set('sort', appliedFilters.sort);

                const res = await fetch(`${API_URL}/api/v1/tours?${queryParams.toString()}`);
                if (!res.ok) {
                    throw new Error(`Lỗi tải dữ liệu (${res.status})`);
                }
                const data = await res.json();
                if (!isCancelled) {
                    if (data.status === 'success') {
                        setTours(data.tours || []);
                        setTotal(data.total || 0);
                        setErrorMessage('');
                    } else {
                        throw new Error(data.message || 'Không thể lấy danh sách tour');
                    }
                }
            } catch (err: unknown) {
                if (!isCancelled) {
                    const msg = err instanceof Error ? err.message : 'Lỗi kết nối máy chủ';
                    setErrorMessage(msg);
                    setTours([]);
                    setTotal(0);
                }
            } finally {
                if (!isCancelled) {
                    setIsLoading(false);
                }
            }
        };

        executeFetchTours();

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
        setFormFilters(initialFilters);
        setIsLoading(true);
        setPage(1);
        setAppliedFilters(initialFilters);
    };

    const totalPages = Math.ceil(total / limit) || 1;

    return (
        <div className="w-full min-h-screen bg-gray-50 pb-20">
            {/* Hero Header */}
            <section className="bg-black text-white py-14 px-6 border-b border-gray-800">
                <div className="max-w-7xl mx-auto">
                    <span className="text-xs font-black tracking-widest text-[#FACC15] uppercase">
                        Khám phá thế giới cùng Natura Travel
                    </span>
                    <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tight mt-2">
                        Danh Sách Tour Du Lịch
                    </h1>
                    <p className="mt-3 text-gray-400 text-sm md:text-base max-w-2xl">
                        Trải nghiệm những hành trình tuyệt vời với dịch vụ trọn gói chuẩn 5 sao và mức giá ưu đãi nhất.
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
                        {/* Search input */}
                        <div className="relative">
                            <label className="block text-xs font-black uppercase tracking-wider text-gray-600 mb-1">
                                Từ khóa tìm kiếm
                            </label>
                            <div className="relative">
                                <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Tên tour, địa danh..."
                                    value={formFilters.search}
                                    onChange={(e) => setFormFilters({ ...formFilters, search: e.target.value })}
                                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 focus:outline-none focus:border-black font-medium"
                                />
                            </div>
                        </div>

                        {/* Điểm đến */}
                        <div>
                            <label className="block text-xs font-black uppercase tracking-wider text-gray-600 mb-1">
                                Điểm đến
                            </label>
                            <input
                                type="text"
                                placeholder="Ví dụ: Đà Nẵng, Tokyo..."
                                value={formFilters.destination}
                                onChange={(e) => setFormFilters({ ...formFilters, destination: e.target.value })}
                                className="w-full px-3 py-2 text-sm border border-gray-300 focus:outline-none focus:border-black font-medium"
                            />
                        </div>

                        {/* Điểm khởi hành */}
                        <div>
                            <label className="block text-xs font-black uppercase tracking-wider text-gray-600 mb-1">
                                Điểm khởi hành
                            </label>
                            <input
                                type="text"
                                placeholder="Ví dụ: TP. Hồ Chí Minh, Hà Nội..."
                                value={formFilters.departureLocation}
                                onChange={(e) => setFormFilters({ ...formFilters, departureLocation: e.target.value })}
                                className="w-full px-3 py-2 text-sm border border-gray-300 focus:outline-none focus:border-black font-medium"
                            />
                        </div>

                        {/* Loại tour */}
                        <div>
                            <label className="block text-xs font-black uppercase tracking-wider text-gray-600 mb-1">
                                Loại hình tour
                            </label>
                            <select
                                value={formFilters.tourType}
                                onChange={(e) => setFormFilters({ ...formFilters, tourType: e.target.value })}
                                className="w-full px-3 py-2 text-sm border border-gray-300 focus:outline-none focus:border-black font-medium bg-white"
                            >
                                <option value="">Tất cả loại tour</option>
                                <option value="Trong nước">Trong nước</option>
                                <option value="Quốc tế">Quốc tế</option>
                                <option value="Khám phá">Khám phá thiên nhiên</option>
                                <option value="Nghỉ dưỡng">Nghỉ dưỡng cao cấp</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2 border-t border-gray-100">
                        {/* Giá tối thiểu */}
                        <div>
                            <label className="block text-xs font-black uppercase tracking-wider text-gray-600 mb-1">
                                Giá từ (VNĐ)
                            </label>
                            <input
                                type="number"
                                placeholder="0"
                                value={formFilters.minPrice}
                                onChange={(e) => setFormFilters({ ...formFilters, minPrice: e.target.value })}
                                className="w-full px-3 py-2 text-sm border border-gray-300 focus:outline-none focus:border-black font-medium"
                            />
                        </div>

                        {/* Giá tối đa */}
                        <div>
                            <label className="block text-xs font-black uppercase tracking-wider text-gray-600 mb-1">
                                Giá đến (VNĐ)
                            </label>
                            <input
                                type="number"
                                placeholder="50.000.000"
                                value={formFilters.maxPrice}
                                onChange={(e) => setFormFilters({ ...formFilters, maxPrice: e.target.value })}
                                className="w-full px-3 py-2 text-sm border border-gray-300 focus:outline-none focus:border-black font-medium"
                            />
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
                                <option value="price_asc">Giá: Thấp đến cao</option>
                                <option value="price_desc">Giá: Cao đến thấp</option>
                                <option value="rating_desc">Đánh giá cao nhất</option>
                            </select>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-end gap-2">
                            <button
                                type="submit"
                                className="flex-1 bg-black text-white hover:bg-gray-800 py-2.5 px-4 text-xs font-black uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5"
                            >
                                <Filter className="w-4 h-4" />
                                Lọc Tour
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
                        Tìm thấy <span className="text-black font-black">{total}</span> tour phù hợp
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
                                    <div className="h-4 bg-gray-200 w-1/3" />
                                    <div className="h-6 bg-gray-200 w-3/4" />
                                    <div className="h-4 bg-gray-200 w-full" />
                                    <div className="h-8 bg-gray-200 w-1/2 pt-4" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : tours.length > 0 ? (
                    /* Tours Grid */
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {tours.map((tour) => (
                            <TourCard key={tour.id} tour={tour} />
                        ))}
                    </div>
                ) : (
                    /* Empty State */
                    <div className="text-center py-20 bg-white border border-gray-200 px-4">
                        <MapPin className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                        <h3 className="text-lg font-black uppercase tracking-wider text-gray-800">
                            Không tìm thấy tour phù hợp
                        </h3>
                        <p className="text-sm text-gray-500 mt-1 max-w-md mx-auto">
                            Hãy thử nới lỏng các tiêu chí tìm kiếm hoặc kiểm tra lại từ khóa điểm đến của bạn.
                        </p>
                        <button
                            type="button"
                            onClick={handleResetFilters}
                            className="mt-6 inline-flex items-center gap-2 bg-black text-white px-6 py-2.5 text-xs font-black uppercase tracking-wider hover:bg-gray-800 transition-colors"
                        >
                            <RotateCcw className="w-4 h-4" />
                            Xóa tất cả bộ lọc
                        </button>
                    </div>
                )}

                {/* Pagination Controls */}
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

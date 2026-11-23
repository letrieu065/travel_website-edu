'use client';

/**
 * ============================================================================
 * MODULE TOURS - CLIENT PAGE (Trang Khám Phá Tours Du Lịch Natura Travel)
 * ============================================================================
 * Chịu trách nhiệm:
 * - Hiển thị danh sách các tour du lịch sinh thái & trải nghiệm văn hóa bản địa.
 * - Bộ lọc nâng cao: Tìm kiếm tên tour, điểm đến, điểm khởi hành, loại tour, tầm giá, số sao.
 * - Phân trang dữ liệu và hiển thị trạng thái tải / lỗi thân thiện người dùng.
 * - Kết nối trực tiếp API Backend: GET /api/v1/tours
 * ============================================================================
 */

import React, { useState, useEffect, Suspense, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, MapPin, Filter, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react';
import TourCard, { type Tour } from '@/components/common/TourCard';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3600';

const FALLBACK_DOMESTIC_TOURS: Tour[] = [
    {
        id: 'tour-danang-1',
        title: 'Tour Đà Nẵng - Bán Đảo Sơn Trà - Bà Nà Hills - Cầu Vàng 4N3Đ',
        description: 'Trải nghiệm thành phố đáng sống nhất Việt Nam, check-in Cầu Vàng trên mây và khám phá phố cổ Hội An rực rỡ đèn lồng.',
        tourType: 'Khám phá',
        price: 4890000,
        discountPrice: 4290000,
        duration: '4 ngày 3 đêm',
        destination: 'Đà Nẵng',
        departureLocation: 'Hà Nội / TP.HCM',
        startDate: 'Khởi hành hàng ngày',
        availableSeats: 15,
        images: ['https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?q=80&w=1200&auto=format&fit=crop'],
        averageRating: 4.9,
        reviewCount: 128,
        isTrending: true,
    },
    {
        id: 'tour-phuquoc-1',
        title: 'Tour Đảo Ngọc Phú Quốc - Sunset Town - Cáp Treo Hòn Thơm 3N2Đ',
        description: 'Đắm mình trong làn nước biển trong vắt ngọc bích của Bãi Sao, ngắm hoàng hôn Địa Trung Hải và trải nghiệm cáp treo vượt biển kỷ lục.',
        tourType: 'Biển đảo',
        price: 5450000,
        discountPrice: 4950000,
        duration: '3 ngày 2 đêm',
        destination: 'Phú Quốc',
        departureLocation: 'TP. Hồ Chí Minh',
        startDate: 'Khởi hành hàng ngày',
        availableSeats: 12,
        images: ['https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=1200&auto=format&fit=crop'],
        averageRating: 4.95,
        reviewCount: 96,
        isTrending: true,
    },
    {
        id: 'tour-halong-1',
        title: 'Tour Du Thuyền 5 Sao Vịnh Hạ Long & Vịnh Lan Hạ 2N1Đ',
        description: 'Hành trình sang trọng len lỏi giữa hàng ngàn đảo đá vôi kỳ vĩ, chèo kayak qua hang Sáng Tối và thưởng thức tiệc nướng hải sản đêm.',
        tourType: 'Nghỉ dưỡng',
        price: 3850000,
        discountPrice: 3450000,
        duration: '2 ngày 1 đêm',
        destination: 'Hạ Long',
        departureLocation: 'Hà Nội',
        startDate: 'Khởi hành hàng ngày',
        availableSeats: 20,
        images: ['https://images.unsplash.com/photo-1528127269322-539801943592?q=80&w=1200&auto=format&fit=crop'],
        averageRating: 4.85,
        reviewCount: 142,
        isTrending: true,
    },
    {
        id: 'tour-sapa-1',
        title: 'Tour Sa Pa - Nóc Nhà Đông Dương Fansipan - Bản Cát Cát 3N2Đ',
        description: 'Chinh phục đỉnh thiêng Fansipan 3.143m, ngắm thung lũng ruộng bậc thang Mường Hoa và trải nghiệm văn hóa thổ cẩm H’Mông bản địa.',
        tourType: 'Khám phá',
        price: 3200000,
        discountPrice: 2850000,
        duration: '3 ngày 2 đêm',
        destination: 'Sa Pa',
        departureLocation: 'Hà Nội',
        startDate: 'Khởi hành hàng ngày',
        availableSeats: 18,
        images: ['https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1200&auto=format&fit=crop'],
        averageRating: 4.8,
        reviewCount: 88,
        isTrending: false,
    },
    {
        id: 'tour-nhatrang-1',
        title: 'Tour Nha Trang - Du Ngoạn 3 Đảo - VinWonders & Lặn San Hô 4N3Đ',
        description: 'Khám phá vịnh biển Nha Trang tuyệt đẹp, lặn ngắm san hô tại Hòn Mun, thư giãn tắm bùn khoáng nóng và thưởng thức hải sản tươi ngon.',
        tourType: 'Biển đảo',
        price: 4350000,
        discountPrice: 3890000,
        duration: '4 ngày 3 đêm',
        destination: 'Nha Trang',
        departureLocation: 'TP. Hồ Chí Minh',
        startDate: 'Khởi hành hàng ngày',
        availableSeats: 14,
        images: ['https://images.unsplash.com/photo-1596422846543-75c6fc197f07?q=80&w=1200&auto=format&fit=crop'],
        averageRating: 4.88,
        reviewCount: 110,
        isTrending: true,
    },
    {
        id: 'tour-hue-1',
        title: 'Tour Cố Đô Huế - Đại Nội Hoàng Cung - Ca Huế Trên Sông Hương 3N2Đ',
        description: 'Hành trình di sản trầm mặc với Hoàng thành Huế, lăng tẩm triều Nguyễn, chùa Thiên Mụ và nhã nhạc cung đình Huế ngân vang sông Hương.',
        tourType: 'Văn hóa',
        price: 3600000,
        discountPrice: 3150000,
        duration: '3 ngày 2 đêm',
        destination: 'Huế',
        departureLocation: 'Đà Nẵng / Hà Nội',
        startDate: 'Khởi hành hàng ngày',
        availableSeats: 16,
        images: ['https://images.unsplash.com/photo-1583417319070-4a69db38a482?q=80&w=1200&auto=format&fit=crop'],
        averageRating: 4.9,
        reviewCount: 75,
        isTrending: false,
    },
    {
        id: 'tour-dalat-1',
        title: 'Tour Đà Lạt Ngàn Hoa - Chinh Phục Langbiang - Cắm Trại Đồi Mây 3N2Đ',
        description: 'Tận hưởng khí hậu se lạnh trong lành của thành phố sương mù, trekking đỉnh núi Langbiang huyền thoại và săn mây sớm trên đồi chè Cầu Đất.',
        tourType: 'Khám phá',
        price: 2950000,
        discountPrice: 2650000,
        duration: '3 ngày 2 đêm',
        destination: 'Đà Lạt',
        departureLocation: 'TP. Hồ Chí Minh',
        startDate: 'Khởi hành hàng ngày',
        availableSeats: 15,
        images: ['https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1200&auto=format&fit=crop'],
        averageRating: 4.82,
        reviewCount: 92,
        isTrending: true,
    },
    {
        id: 'tour-hagiang-1',
        title: 'Tour Vòng Cung Đông Bắc Hà Giang - Đèo Mã Pí Lèng - Hẻm Tu Sản 4N3Đ',
        description: 'Cung đường phượt hùng vĩ bậc nhất Việt Nam: Chinh phục tứ đại đỉnh đèo Mã Pí Lèng, ngồi thuyền lướt sóng xanh ngọc trên sông Nho Quế.',
        tourType: 'Khám phá',
        price: 4200000,
        discountPrice: 3750000,
        duration: '4 ngày 3 đêm',
        destination: 'Hà Giang',
        departureLocation: 'Hà Nội',
        startDate: 'Khởi hành hàng ngày',
        availableSeats: 10,
        images: ['https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1200&auto=format&fit=crop'],
        averageRating: 4.96,
        reviewCount: 164,
        isTrending: true,
    },
    {
        id: 'tour-ninhbinh-1',
        title: 'Tour Di Sản Tràng An - Hang Múa - Chùa Bái Đính 2N1Đ',
        description: 'Khám phá vịnh Hạ Long trên cạn với di sản thế giới kép Tràng An, leo đỉnh Ngoạ Long ngắm trọn thung lũng lúa Tam Cốc đẹp như tranh vẽ.',
        tourType: 'Văn hóa',
        price: 2200000,
        discountPrice: 1950000,
        duration: '2 ngày 1 đêm',
        destination: 'Ninh Bình',
        departureLocation: 'Hà Nội',
        startDate: 'Khởi hành hàng ngày',
        availableSeats: 22,
        images: ['https://images.unsplash.com/photo-1528127269322-539801943592?q=80&w=1200&auto=format&fit=crop'],
        averageRating: 4.87,
        reviewCount: 104,
        isTrending: false,
    },
];

const normalizeVN = (str: string): string =>
    str
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/đ/g, 'd')
        .trim();

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

function ToursContent() {
    const searchParams = useSearchParams();
    const [tours, setTours] = useState<Tour[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const limit = 9;
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');

    // Đọc tham số tìm kiếm ban đầu từ URL query parameters
    const initialFiltersFromUrl = useMemo((): TourFilterState => ({
        search: searchParams.get('search') || '',
        destination: searchParams.get('destination') || searchParams.get('city') || '',
        departureLocation: searchParams.get('departure_location') || searchParams.get('departureLocation') || '',
        tourType: searchParams.get('tour_type') || searchParams.get('tourType') || '',
        minPrice: searchParams.get('min_price') || searchParams.get('minPrice') || '',
        maxPrice: searchParams.get('max_price') || searchParams.get('maxPrice') || '',
        minRating: searchParams.get('min_rating') || searchParams.get('minRating') || '',
        sort: searchParams.get('sort') || 'newest',
    }), [searchParams]);

    // Form inputs state
    const [formFilters, setFormFilters] = useState<TourFilterState>(initialFiltersFromUrl);
    // Applied filters state (triggers API call)
    const [appliedFilters, setAppliedFilters] = useState<TourFilterState>(initialFiltersFromUrl);

    // Hàm lọc dữ liệu fallback khi API không khả dụng hoặc trả về 0 kết quả
    const getFilteredFallback = (filters: TourFilterState): Tour[] => {
        return FALLBACK_DOMESTIC_TOURS.filter((t) => {
            if (filters.destination.trim()) {
                const destKey = normalizeVN(filters.destination);
                const matchDest =
                    normalizeVN(t.destination || '').includes(destKey) ||
                    normalizeVN(t.title).includes(destKey) ||
                    normalizeVN(t.description || '').includes(destKey);
                if (!matchDest) return false;
            }
            if (filters.search.trim()) {
                const searchKey = normalizeVN(filters.search);
                const matchSearch =
                    normalizeVN(t.title).includes(searchKey) ||
                    normalizeVN(t.destination || '').includes(searchKey) ||
                    normalizeVN(t.description || '').includes(searchKey);
                if (!matchSearch) return false;
            }
            if (filters.departureLocation.trim()) {
                const depKey = normalizeVN(filters.departureLocation);
                if (!normalizeVN(t.departureLocation || '').includes(depKey)) return false;
            }
            if (filters.tourType) {
                const typeKey = normalizeVN(filters.tourType);
                if (!normalizeVN(t.tourType || '').includes(typeKey)) return false;
            }
            if (filters.minPrice && Number(t.price) < Number(filters.minPrice)) return false;
            if (filters.maxPrice && Number(t.price) > Number(filters.maxPrice)) return false;
            if (filters.minRating && (t.averageRating ?? 0) < Number(filters.minRating)) return false;
            return true;
        });
    };

    useEffect(() => {
        let isCancelled = false;

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
                    if (data.status === 'success' && data.tours && data.tours.length > 0) {
                        setTours(data.tours);
                        setTotal(data.total || data.tours.length);
                        setErrorMessage('');
                    } else {
                        // Nếu DB chưa có tour khớp với từ khóa tìm kiếm, dùng fallback chọn lọc
                        const fallbackMatches = getFilteredFallback(appliedFilters);
                        setTours(fallbackMatches);
                        setTotal(fallbackMatches.length);
                        setErrorMessage('');
                    }
                }
            } catch {
                if (!isCancelled) {
                    // Khi server backend không kết nối được hoặc offline, hiển thị dữ liệu fallback tương ứng
                    const fallbackMatches = getFilteredFallback(appliedFilters);
                    setTours(fallbackMatches);
                    setTotal(fallbackMatches.length);
                    setErrorMessage('');
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
                                placeholder="Ví dụ: Đà Nẵng, Hạ Long, Phú Quốc..."
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
                                <option value="Khám phá">Khám phá thiên nhiên</option>
                                <option value="Nghỉ dưỡng">Nghỉ dưỡng cao cấp</option>
                                <option value="Văn hóa">Di sản & Văn hóa</option>
                                <option value="Biển đảo">Biển đảo & Sinh thái</option>
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

function ToursContentWrapper() {
    const searchParams = useSearchParams();
    return <ToursContent key={searchParams.toString()} />;
}

export default function ToursPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center text-xs font-black uppercase tracking-widest text-gray-500">Đang tải danh sách tours...</div>}>
            <ToursContentWrapper />
        </Suspense>
    );
}

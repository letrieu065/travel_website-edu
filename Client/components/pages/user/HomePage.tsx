/**
 * ============================================================================
 * MODULE HOMEPAGE - NATURA TRAVEL (Trang Chủ Phong Cách Tạp Chí Lonely Planet)
 * ============================================================================
 * Chịu trách nhiệm:
 * - Trải nghiệm trang chủ đẳng cấp phong cách Lonely Planet: Typography đậm nét, Editorial Stories.
 * - Tích hợp HeroSearchWidget 3-in-1 (Tours, Hotels, Flights).
 * - Best in Travel (Top điểm đến nổi bật nhất mùa), Handpicked Experiences, Reviews chân thực.
 * - Tích hợp du lịch sinh thái bền vững (Eco-travel & Green Commitment).
 * ============================================================================
 */

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
    ArrowRight,
    MapPin,
    Star,
    Compass,
    Shield,
    Leaf,
    Clock,
    Building,
} from 'lucide-react';
import TourCard, { type Tour, formatTourSummary } from '@/components/common/TourCard';
import HeroSearchWidget from './HeroSearchWidget';
import './HomePage.css';

interface ReviewHighlight {
    id: string;
    rating: number;
    comment: string;
    createdAt?: string | null;
    user?: { fullName: string; avatarUrl?: string | null } | null;
    tour?: { id: string; title: string; destination?: string | null; images: string[] } | null;
}

interface TrendingHotel {
    id: string;
    name: string;
    city: string;
    address: string;
    star_rating: number;
    price_per_night: number;
    discount_price?: number | null;
    images: string[];
    averageRating: number;
    reviewCount: number;
    amenities: string[];
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3600';

// (Đã thêm)
async function getCollection<T>(path: string): Promise<T[]> {
    try {
        const response = await fetch(`${API_URL}${path}`, { cache: 'no-store' });
        if (!response.ok) return [];
        const data = await response.json();
        return data.tours ?? data.hotels ?? data.reviews ?? [];
    } catch {
        return [];
    }
}

// (Đã thêm)
const formatPriceVND = (value: number | string) =>
    new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        maximumFractionDigits: 0,
    }).format(Number(value));

// Lonely Planet Curated Destinations Showcase Data
const CURATED_DESTINATIONS = [
    {
        name: 'Vịnh Hạ Long',
        tag: 'Kỳ quan thiên nhiên',
        image: 'https://images.unsplash.com/photo-1528127269322-539801943592?q=80&w=1200&auto=format&fit=crop',
        query: 'Hạ Long',
        description: 'Hàng ngàn đảo đá vôi kỳ vĩ soi bóng làn nước ngọc bích.',
    },
    {
        name: 'Đà Nẵng & Hội An',
        tag: 'Di sản & Biển xanh',
        image: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?q=80&w=1200&auto=format&fit=crop',
        query: 'Đà Nẵng',
        description: 'Sự hòa quyện giữa phố cổ đèn lồng trầm mặc và bãi biển Mỹ Khê năng động.',
    },
    {
        name: 'Sa Pa & Fansipan',
        tag: 'Văn hóa & Núi non',
        image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1200&auto=format&fit=crop',
        query: 'Sa Pa',
        description: 'Thung lũng ruộng bậc thang hùng vĩ và nóc nhà Đông Dương huyền ảo trong mây.',
    },
    {
        name: 'Đảo Ngọc Phú Quốc',
        tag: 'Nghỉ dưỡng nhiệt đới',
        image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=1200&auto=format&fit=crop',
        query: 'Phú Quốc',
        description: 'Bờ cát trắng mịn, hoàng hôn rực rỡ và những khu nghỉ dưỡng sinh thái đẳng cấp.',
    },
];

// Lonely Planet Editorial Stories Data
const EDITORIAL_STORIES = [
    {
        id: 1,
        title: 'Cẩm nang du lịch xanh: Khám phá thế giới nhưng không để lại dấu chân',
        category: 'Bền Vững · Eco-Travel',
        readTime: '6 phút đọc',
        image: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=1000&auto=format&fit=crop',
        excerpt: 'Cách lựa chọn phương tiện, nơi lưu trú thân thiện và ủng hộ văn hóa bản địa trên từng chặng hành trình.',
    },
    {
        id: 2,
        title: 'Hành trình vị giác: Khám phá tinh hoa ẩm thực từ chợ truyền thống đến bàn tiệc',
        category: 'Ẩm Thực · Food & Culture',
        readTime: '4 phút đọc',
        image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=1000&auto=format&fit=crop',
        excerpt: 'Mỗi món ăn là một câu chuyện lịch sử. Điểm qua những trải nghiệm ẩm thực đường phố độc nhất vô nhị.',
    },
    {
        id: 3,
        title: 'Bí quyết săn vé máy bay và đặt tour thông minh cho mùa du lịch cao điểm',
        category: 'Cẩm Nang · Tips & Tricks',
        readTime: '5 phút đọc',
        image: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?q=80&w=1000&auto=format&fit=crop',
        excerpt: 'Kinh nghiệm lập lịch trình linh hoạt, tận dụng các ưu đãi sớm và đảm bảo an toàn suốt kỳ nghỉ.',
    },
];

export default async function HomePage() {
    // Tải song song dữ liệu từ Backend API
    const [featured, trending, promotions, reviews, trendingHotels] = await Promise.all([
        getCollection<Tour>('/api/v1/tours/featured?limit=1'),
        getCollection<Tour>('/api/v1/tours/trending?limit=3'),
        getCollection<Tour>('/api/v1/tours/promotions?limit=3'),
        getCollection<ReviewHighlight>('/api/v1/tours/top-reviews?limit=3'),
        getCollection<TrendingHotel>('/api/v1/hotels/trending?limit=3'),
    ]);

    const heroTour = featured[0];
    const heroImage =
        heroTour?.images?.[0] ||
        'https://images.unsplash.com/photo-1507608616759-54f48f0af0ee?q=80&w=1920&auto=format&fit=crop';

    return (
        <div className="w-full pb-0 bg-white">
            {/* 1. Hero Section (Lonely Planet Immersive Hook) */}
            <section
                className="relative min-h-[85vh] flex flex-col justify-between overflow-hidden bg-black text-white"
                style={{
                    backgroundImage: `linear-gradient(180deg, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.85) 100%), url("${heroImage}")`,
                    backgroundPosition: 'center',
                    backgroundSize: 'cover',
                }}
            >
                <div className="max-w-7xl mx-auto px-6 pt-24 md:pt-32 pb-16 w-full flex-1 flex flex-col justify-center">
                    <div className="max-w-3xl">
                        <span className="inline-block bg-[#FACC15] text-black px-3.5 py-1 text-xs font-black uppercase tracking-widest mb-4">
                            For Explorers Everywhere
                        </span>
                        <h1 className="text-4xl sm:text-6xl md:text-7xl font-black uppercase tracking-tight leading-[0.95] text-white">
                            Khám Phá Thế Giới Theo Cách Của Bạn
                        </h1>
                        <p className="mt-5 text-base sm:text-lg text-gray-200 max-w-2xl leading-relaxed font-medium line-clamp-2 sm:line-clamp-3">
                            {formatTourSummary(heroTour?.description, 160) ||
                                'Natura Travel mang đến những hành trình nguyên bản, tour du lịch trọn gói và cẩm nang khám phá đích thực từ các chuyên gia bản địa.'}
                        </p>

                        <div className="mt-8 flex flex-wrap items-center gap-4">
                            {heroTour ? (
                                <Link
                                    href={`/tours/${heroTour.id}`}
                                    className="inline-flex items-center gap-3 bg-[#FACC15] text-black hover:bg-yellow-300 px-8 py-4 text-xs font-black uppercase tracking-widest transition-colors shadow-lg"
                                >
                                    Khám Phá Ngay <ArrowRight className="w-4 h-4" />
                                </Link>
                            ) : (
                                <Link
                                    href="/tours"
                                    className="inline-flex items-center gap-3 bg-[#FACC15] text-black hover:bg-yellow-300 px-8 py-4 text-xs font-black uppercase tracking-widest transition-colors shadow-lg"
                                >
                                    Xem Tất Cả Tour <ArrowRight className="w-4 h-4" />
                                </Link>
                            )}
                            <Link
                                href="/about-us"
                                className="inline-flex items-center border border-white/60 hover:bg-white/10 px-8 py-4 text-xs font-black uppercase tracking-widest text-white transition-colors"
                            >
                                Về Natura Travel
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Tabbed Search Box Widget (Overlaid on Bottom Hero) */}
                <div className="max-w-7xl mx-auto px-6 w-full relative py-6 md:py-0 md:-mb-10 z-20">
                    <HeroSearchWidget />
                </div>
            </section>

            {/* Spacer for Search Widget */}
            <div className="hidden md:block md:h-20" />

            {/* 2. Curated Destinations Grid ("Best in Travel" - Lonely Planet Style) */}
            <section className="max-w-7xl mx-auto px-6 pt-6 md:pt-24 pb-16">
                <div className="mb-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                    <div>
                        <span className="text-xs font-black uppercase tracking-[0.2em] text-gray-500 block mb-2">
                            Best In Travel · Điểm Đến Chọn Lọc
                        </span>
                        <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tight text-gray-900">
                            Những Miền Đất Đáng Đến Nhất
                        </h2>
                    </div>
                    <Link
                        href="/destinations"
                        className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-black hover:underline"
                    >
                        Tất cả điểm đến <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {CURATED_DESTINATIONS.map((dest, idx) => (
                        <Link
                            key={idx}
                            href={`/tours?destination=${encodeURIComponent(dest.query)}`}
                            className="group relative h-96 overflow-hidden border border-gray-200 block shadow-sm hover:shadow-xl transition-shadow"
                        >
                            <Image
                                src={dest.image}
                                alt={dest.name}
                                fill
                                sizes="(max-width: 768px) 100vw, 25vw"
                                className="object-cover transition-transform duration-700 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
                            <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                                <span className="bg-[#FACC15] text-black px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider inline-block mb-2">
                                    {dest.tag}
                                </span>
                                <h3 className="text-2xl font-black uppercase tracking-tight group-hover:underline">
                                    {dest.name}
                                </h3>
                                <p className="text-xs text-gray-300 mt-2 line-clamp-2 leading-relaxed">
                                    {dest.description}
                                </p>
                            </div>
                        </Link>
                    ))}
                </div>
            </section>

            {/* 3. Featured Tours ("Handpicked Experiences") */}
            <section className="bg-gray-50 py-20 border-y border-gray-200">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="mb-12 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                        <div>
                            <span className="text-xs font-black uppercase tracking-[0.2em] text-gray-500 block mb-2">
                                Tuyển Chọn Cho Bạn · Handpicked Experiences
                            </span>
                            <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tight text-gray-900">
                                Tour Du Lịch Đang Ưu Đãi
                            </h2>
                        </div>
                        <Link
                            href="/tours"
                            className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-black hover:underline"
                        >
                            Xem tất cả ({promotions.length + trending.length}+ tour) <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>

                    {promotions.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {promotions.map((tour) => (
                                <TourCard key={tour.id} tour={tour} />
                            ))}
                        </div>
                    ) : (
                        <p className="border border-dashed border-gray-300 py-12 text-center text-gray-500 text-sm">
                            Đang cập nhật các tour du lịch mới nhất.
                        </p>
                    )}
                </div>
            </section>

            {/* 4. Trending Hotels & Boutique Stays (Lonely Planet Style) */}
            <section className="max-w-7xl mx-auto px-6 py-20">
                <div className="mb-12 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                    <div>
                        <span className="text-xs font-black uppercase tracking-[0.2em] text-gray-500 block mb-2">
                            Places To Stay · Không Gian Nghỉ Dưỡng
                        </span>
                        <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tight text-gray-900">
                            Khách Sạn & Resort Thịnh Hành
                        </h2>
                    </div>
                    <Link
                        href="/hotels"
                        className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-black hover:underline"
                    >
                        Khám phá khách sạn <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>

                {trendingHotels.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {trendingHotels.map((hotel) => (
                            <article
                                key={hotel.id}
                                className="group border border-gray-200 bg-white hover:shadow-xl transition-shadow flex flex-col justify-between"
                            >
                                <Link href={`/hotels/${hotel.id}`} className="block">
                                    <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
                                        {hotel.images?.[0] ? (
                                            <Image
                                                src={hotel.images[0]}
                                                alt={hotel.name}
                                                fill
                                                sizes="(max-width: 768px) 100vw, 33vw"
                                                className="object-cover transition-transform duration-500 group-hover:scale-105"
                                            />
                                        ) : (
                                            <div className="flex h-full items-center justify-center text-gray-400">
                                                <Building className="h-10 w-10" />
                                            </div>
                                        )}
                                        <span className="absolute top-4 left-4 bg-black text-white px-3 py-1 text-[10px] font-black uppercase tracking-wider">
                                            {hotel.city}
                                        </span>
                                    </div>

                                    <div className="p-6">
                                        <div className="flex items-center gap-1 mb-2">
                                            {Array.from({ length: hotel.star_rating || 0 }).map((_, i) => (
                                                <Star key={i} className="w-3.5 h-3.5 fill-[#FACC15] text-[#FACC15]" />
                                            ))}
                                            <span className="text-xs font-bold text-gray-500 ml-1">
                                                {hotel.star_rating} sao
                                            </span>
                                        </div>

                                        <h3 className="text-xl font-black uppercase tracking-tight text-gray-900 group-hover:underline line-clamp-1 mb-2">
                                            {hotel.name}
                                        </h3>

                                        <p className="text-xs text-gray-500 line-clamp-1 mb-4 flex items-center gap-1">
                                            <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                            {hotel.address}
                                        </p>

                                        <div className="flex items-baseline justify-between border-t border-gray-100 pt-4 mt-2">
                                            <span className="text-xs text-gray-500">Giá mỗi đêm từ</span>
                                            <div className="text-right">
                                                <strong className="text-lg font-black text-black">
                                                    {formatPriceVND(hotel.discount_price ?? hotel.price_per_night)}
                                                </strong>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            </article>
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {trending.map((tour) => (
                            <TourCard key={tour.id} tour={tour} />
                        ))}
                    </div>
                )}
            </section>

            {/* 5. Editorial Stories & Travel Guides (Lonely Planet Signature Magazine Layout) */}
            <section className="bg-gray-50 py-20 border-t border-gray-200">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="mb-12 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                        <div>
                            <span className="text-xs font-black uppercase tracking-[0.2em] text-gray-500 block mb-2">
                                Travel Stories · Cẩm Nang Khám Phá
                            </span>
                            <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tight text-gray-900">
                                Câu Chuyện & Góc Nhìn Chuyên Gia
                            </h2>
                        </div>
                        <Link
                            href="/about-us"
                            className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-black hover:underline"
                        >
                            Đọc tất cả bài viết <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {EDITORIAL_STORIES.map((story) => (
                            <article key={story.id} className="bg-white border border-gray-200 overflow-hidden flex flex-col justify-between hover:shadow-lg transition-shadow">
                                <div>
                                    <div className="relative aspect-[16/10] overflow-hidden">
                                        <Image
                                            src={story.image}
                                            alt={story.title}
                                            fill
                                            sizes="(max-width: 768px) 100vw, 33vw"
                                            className="object-cover transition-transform duration-500 hover:scale-105"
                                        />
                                    </div>
                                    <div className="p-6">
                                        <div className="flex items-center justify-between text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                                            <span className="text-black font-black">{story.category}</span>
                                            <span>{story.readTime}</span>
                                        </div>
                                        <h3 className="text-lg font-black text-gray-900 leading-snug hover:underline mb-3">
                                            {story.title}
                                        </h3>
                                        <p className="text-xs text-gray-600 leading-relaxed">
                                            {story.excerpt}
                                        </p>
                                    </div>
                                </div>
                                <div className="p-6 pt-0">
                                    <Link
                                        href="/about-us"
                                        className="text-xs font-black uppercase tracking-wider text-black inline-flex items-center gap-1.5 hover:underline"
                                    >
                                        Đọc tiếp <ArrowRight className="w-3.5 h-3.5" />
                                    </Link>
                                </div>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            {/* 6. Why Travel with Natura Travel (Brand Values) */}
            <section className="max-w-7xl mx-auto px-6 py-20">
                <div className="text-center max-w-2xl mx-auto mb-16">
                    <span className="text-xs font-black uppercase tracking-[0.2em] text-[#FACC15] bg-black px-3 py-1 inline-block mb-3">
                        Giá Trị Cốt Lõi
                    </span>
                    <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tight text-gray-900">
                        Vì Sao Chọn Natura Travel?
                    </h2>
                    <p className="mt-3 text-sm text-gray-600">
                        Chúng tôi tin rằng du lịch là cầu nối gắn kết con người với vẻ đẹp thiên nhiên và những nền văn hóa độc đáo.
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    <div className="p-8 border border-gray-200 bg-white hover:border-black transition-colors">
                        <Leaf className="w-10 h-10 text-green-700 mb-4" />
                        <h3 className="text-base font-black uppercase tracking-tight text-gray-900 mb-2">
                            Du Lịch Bền Vững
                        </h3>
                        <p className="text-xs text-gray-600 leading-relaxed">
                            Cam kết bảo vệ môi trường, giảm thiểu rác thải nhựa và hỗ trợ trực tiếp cho cộng đồng địa phương.
                        </p>
                    </div>

                    <div className="p-8 border border-gray-200 bg-white hover:border-black transition-colors">
                        <Compass className="w-10 h-10 text-black mb-4" />
                        <h3 className="text-base font-black uppercase tracking-tight text-gray-900 mb-2">
                            Chuyên Gia Bản Địa
                        </h3>
                        <p className="text-xs text-gray-600 leading-relaxed">
                            Đội ngũ hướng dẫn viên giàu kinh nghiệm, đưa bạn đến những góc khuất tuyệt đẹp chưa từng xuất hiện trên bản đồ du lịch đại trà.
                        </p>
                    </div>

                    <div className="p-8 border border-gray-200 bg-white hover:border-black transition-colors">
                        <Shield className="w-10 h-10 text-black mb-4" />
                        <h3 className="text-base font-black uppercase tracking-tight text-gray-900 mb-2">
                            Minh Bạch & Uy Tín
                        </h3>
                        <p className="text-xs text-gray-600 leading-relaxed">
                            Giá trọn gói rõ ràng, không phụ phí ẩn, tích hợp bảo hiểm du lịch toàn diện trong từng chuyến đi.
                        </p>
                    </div>

                    <div className="p-8 border border-gray-200 bg-white hover:border-black transition-colors">
                        <Clock className="w-10 h-10 text-black mb-4" />
                        <h3 className="text-base font-black uppercase tracking-tight text-gray-900 mb-2">
                            Hỗ Trợ 24/7
                        </h3>
                        <p className="text-xs text-gray-600 leading-relaxed">
                            Luôn sẵn sàng hỗ trợ bạn từ khâu tư vấn, đặt dịch vụ cho đến khi bạn kết thúc chuyến đi an toàn.
                        </p>
                    </div>
                </div>
            </section>

            {/* 7. Community Reviews Highlight */}
            {reviews.length > 0 && (
                <section className="bg-black text-white py-20">
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="mb-12 text-center max-w-xl mx-auto">
                            <span className="text-xs font-black uppercase tracking-[0.2em] text-[#FACC15] block mb-2">
                                Tiếng Nói Từ Du Khách
                            </span>
                            <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tight text-white">
                                Những Chia Sẻ Đáng Nhớ
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {reviews.map((review) => (
                                <article
                                    key={review.id}
                                    className="bg-gray-950 border border-gray-800 p-8 flex flex-col justify-between"
                                >
                                    <div>
                                        <div className="flex items-center gap-1 mb-4">
                                            {Array.from({ length: 5 }).map((_, i) => (
                                                <Star
                                                    key={i}
                                                    className={`w-4 h-4 ${
                                                        i < review.rating
                                                            ? 'fill-[#FACC15] text-[#FACC15]'
                                                            : 'text-gray-700'
                                                    }`}
                                                />
                                            ))}
                                        </div>
                                        <p className="text-sm text-gray-300 leading-relaxed italic">
                                            &ldquo;{review.comment}&rdquo;
                                        </p>
                                    </div>

                                    <div className="mt-6 pt-6 border-t border-gray-800">
                                        <p className="text-xs font-black text-white uppercase tracking-wider">
                                            {review.user?.fullName || 'Khách du lịch'}
                                        </p>
                                        {review.tour && (
                                            <Link
                                                href={`/tours/${review.tour.id}`}
                                                className="text-[11px] text-[#FACC15] hover:underline mt-1 block truncate"
                                            >
                                                Tour: {review.tour.title}
                                            </Link>
                                        )}
                                    </div>
                                </article>
                            ))}
                        </div>
                    </div>
                </section>
            )}
        </div>
    );
}

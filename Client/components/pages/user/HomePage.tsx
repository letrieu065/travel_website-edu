import { ArrowRight, MapPin, Star } from 'lucide-react';
import Link from 'next/link';
import  TourCard, { formatTourPrice, type Tour } from '@/components/common/TourCard'; 
import './HomePage.css';

type ReviewHighlight = {
    id: string;
    rating: number;
    comment: string;
    createdAt?: string | null;
    user?: { fullName: string; avatarUrl?: string | null } | null;
    tour?: { id: string; title: string; destination?: string | null; images: string[] } | null;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3600';

async function getCollection<T>(path: string): Promise<T[]> {
    try {
        const response = await fetch(`${API_URL}${path}`, { cache: 'no-store' });
        if (!response.ok) throw new Error('Failed to fetch data');
        const data = await response.json();
        return data.tours ?? data.reviews ?? [];
    } catch (error) {
        console.error(error);
        return [];
    }
}

export default async function HomePage() {
    const [featured, trending, promotions, reviews] = await Promise.all([
        getCollection<Tour>('/api/tours/featured?limit=1'),
        getCollection<Tour>('/api/tours/trending?limit=3'),
        getCollection<Tour>('/api/tours/promotions?limit=3'),
        getCollection<ReviewHighlight>('/api/tours/top-reviews?limit=3'),
    ]);

    const heroTour = featured[0];
    const heroImage = heroTour?.images?.[0] || 'https://images.unsplash.com/photo-1507608616759-54f48f0af0ee?q=80&w=1920&auto=format&fit=crop';

    return (
        <div className="w-full pb-20">
            <section className="home-hero" style={{ backgroundImage: `linear-gradient(90deg,rgba(0,0,0,.46),rgba(0,0,0,.04)),url("${heroImage}")` }}>
                <div className="home-hero-copy">
                    <span className="mb-4 block text-sm font-bold uppercase tracking-[0.2em] text-white/80">Natura Travel · Hành trình nổi bật</span>
                    <h1 className="max-w-4xl text-5xl font-black uppercase leading-[0.9] tracking-tight text-white md:text-7xl lg:text-8xl">
                        {heroTour?.title || 'Bắt đầu hành trình của bạn'}
                    </h1>
                    <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/90">
                        {heroTour?.description || 'Khám phá các tour được tuyển chọn, ưu đãi mới và những chia sẻ từ cộng đồng du khách.'}
                    </p>
                    <div className="mt-8 flex flex-wrap gap-4">
                        {heroTour ? (
                            <Link href={`/tours/${heroTour.id}`} className="inline-flex items-center gap-3 bg-[#FACC15] px-7 py-4 text-sm font-black uppercase tracking-widest text-black hover:bg-yellow-300">
                                Xem tour <ArrowRight className="h-4 w-4" />
                            </Link>
                        ) : (
                            <Link href="/tours" className="inline-flex items-center gap-3 bg-[#FACC15] px-7 py-4 text-sm font-black uppercase tracking-widest text-black hover:bg-yellow-300">
                                Khám phá tour <ArrowRight className="h-4 w-4" />
                            </Link>
                        )}
                        <Link href="/tours" className="inline-flex items-center border border-white/70 px-7 py-4 text-sm font-black uppercase tracking-widest text-white hover:bg-white/10">
                            Tất cả tour
                        </Link>
                    </div>
                    
                    {heroTour && (
                        <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-3 text-sm font-semibold text-white">
                            <span className="flex items-center gap-2"><MapPin className="h-4 w-4" />{heroTour.destination || heroTour.tourType}</span>
                            <span className="flex items-center gap-2">
                                <Star className="h-4 w-4 fill-[#FACC15] text-[#FACC15]" />
                                {heroTour.reviewCount ? `${Number(heroTour.averageRating).toFixed(1)} (${heroTour.reviewCount} đánh giá)` : 'Mới lên lịch'}
                            </span>
                            <strong>{formatTourPrice(heroTour.discountPrice ?? heroTour.price)}</strong>
                        </div>
                    )}
                </div>
            </section>

            <main className="mx-auto flex max-w-7xl flex-col gap-20 px-6 py-16 md:px-12 lg:py-24">
                <TourSection 
                    title="Ưu đãi đang có" 
                    eyebrow="Chọn chuyến đi, nhận giá tốt" 
                    tours={promotions} 
                    emptyMessage="Chưa có tour ưu đãi. Các chương trình mới sẽ được cập nhật tại đây." 
                />
                
                <TourSection 
                    title="Điểm đến thịnh hành" 
                    eyebrow="Được du khách quan tâm" 
                    tours={trending} 
                    emptyMessage="Chưa có tour thịnh hành để hiển thị." 
                />

                <section>
                    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-gray-500">Chia sẻ từ du khách</p>
                            <h2 className="text-3xl font-black uppercase tracking-tight md:text-4xl">Đánh giá nổi bật</h2>
                        </div>
                        <Link href="/tours" className="inline-flex items-center gap-2 text-sm font-black uppercase tracking-widest hover:underline">
                            Khám phá tour <ArrowRight className="h-4 w-4" />
                        </Link>
                    </div>
                    
                    {reviews.length ? (
                        <div className="grid gap-6 md:grid-cols-3">
                            {reviews.map((review) => (
                                <article key={review.id} className="flex min-h-64 flex-col border border-gray-200 bg-gray-50 p-7">
                                    <div className="mb-5 flex items-center gap-1" aria-label={`${review.rating} trên 5 sao`}>
                                        {Array.from({ length: 5 }, (_, index) => (
                                            <Star key={index} className={`h-4 w-4 ${index < review.rating ? 'fill-[#FACC15] text-[#D6A900]' : 'text-gray-300'}`} />
                                        ))}
                                    </div>
                                    <blockquote className="flex-1 text-lg font-medium leading-relaxed text-gray-800">“{review.comment}”</blockquote>
                                    <div className="mt-6 border-t border-gray-200 pt-4">
                                        <p className="font-black">{review.user?.fullName || 'Du khách Natura'}</p>
                                        {review.tour && (
                                            <Link href={`/tours/${review.tour.id}`} className="mt-1 block text-sm text-gray-600 hover:underline">
                                                {review.tour.title}{review.tour.destination ? ` · ${review.tour.destination}` : ''}
                                            </Link>
                                        )}
                                    </div>
                                </article>
                            ))}
                        </div>
                    ) : (
                        <p className="border border-dashed border-gray-300 py-10 text-center text-gray-500">Chưa có đánh giá nổi bật để hiển thị.</p>
                    )}
                </section>
            </main>
        </div>
    );
}

// Sub-component cũng không cần isLoading nữa
type TourSectionProps = { title: string; eyebrow: string; tours: Tour[]; emptyMessage: string };

const TourSection: React.FC<TourSectionProps> = ({ title, eyebrow, tours, emptyMessage }) => (
    <section>
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-gray-500">{eyebrow}</p>
                <h2 className="text-3xl font-black uppercase tracking-tight md:text-4xl">{title}</h2>
            </div>
            <Link href="/tours" className="inline-flex items-center gap-2 text-sm font-black uppercase tracking-widest hover:underline">
                Xem tất cả <ArrowRight className="h-4 w-4" />
            </Link>
        </div>
        {tours.length ? (
            <div className="grid gap-7 md:grid-cols-2 lg:grid-cols-3">
                {tours.map((tour) => <TourCard key={tour.id} tour={tour} />)}
            </div>
        ) : (
            <p className="border border-dashed border-gray-300 py-10 text-center text-gray-500">{emptyMessage}</p>
        )}
    </section>
);
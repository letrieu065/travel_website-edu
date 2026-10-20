// components/TourCard.tsx
import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Star } from 'lucide-react';

export type Tour = {
    id: string;
    title: string;
    description?: string | null;
    tourType: string;
    price: number | string;
    discountPrice?: number | string | null;
    duration?: string | null;
    destination?: string | null;
    departureLocation?: string | null;
    startDate: string;
    availableSeats: number;
    images: string[];
    isTrending?: boolean | null;
    averageRating: number;
    reviewCount: number;
};

export const formatTourPrice = (value: number | string) =>
    new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        maximumFractionDigits: 0,
    }).format(Number(value));

export default function TourCard({ tour }: { tour: Tour }) {
    const hasDiscount =
        tour.discountPrice != null && Number(tour.discountPrice) < Number(tour.price);

    return (
        <article className="group overflow-hidden border border-gray-200 bg-white transition-shadow hover:shadow-xl">
            <Link
                href={`/tours/${tour.id}`}
                className="block"
                aria-label={`Xem chi tiết tour ${tour.title}`}
            >
                <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
                    {tour.images?.[0] ? (
                        <Image
                            src={tour.images[0]}
                            alt={tour.title}
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                    ) : (
                        <div className="flex h-full items-center justify-center text-gray-400">
                            <MapPin className="h-10 w-10" />
                        </div>
                    )}
                    {tour.isTrending && (
                        <span className="absolute left-4 top-4 bg-[#FACC15] px-3 py-1 text-xs font-black uppercase">
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
                    <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-500">
                        <MapPin className="h-4 w-4" />
                        {tour.destination || tour.tourType}
                    </p>
                    <h3 className="mb-3 text-xl font-black group-hover:underline">{tour.title}</h3>
                    {tour.description && (
                        <p className="mb-4 line-clamp-2 text-sm text-gray-600">{tour.description}</p>
                    )}
                    <div className="flex items-center justify-between border-t border-gray-200 pt-4">
                        <span className="flex items-center gap-1 text-sm text-gray-600">
                            <Star className="h-4 w-4 fill-[#FACC15] text-[#FACC15]" />
                            {tour.reviewCount
                                ? `${Number(tour.averageRating).toFixed(1)} (${tour.reviewCount})`
                                : 'Chưa có đánh giá'}
                        </span>
                        <div className="text-right">
                            {hasDiscount && (
                                <del className="block text-xs text-gray-500">
                                    {formatTourPrice(tour.price)}
                                </del>
                            )}
                            <strong className="text-lg">
                                {formatTourPrice(tour.discountPrice ?? tour.price)}
                            </strong>
                        </div>
                    </div>
                    <p className="mt-3 text-xs text-gray-500">
                        {tour.duration || 'Thời lượng đang cập nhật'} · Còn {tour.availableSeats} chỗ
                    </p>
                </div>
            </Link>
        </article>
    );
}
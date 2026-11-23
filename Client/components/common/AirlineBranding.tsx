'use client';

import React from 'react';

export interface AirlineInfo {
    id: string;
    name: string;
    shortName: string;
    slogan: string;
    primaryColor: string;
    accentColor: string;
    aircraftModel: string;
    aircraftImage: string;
    logoUrl?: string;
}

export const AIRLINES_DATA: Record<string, AirlineInfo> = {
    'vietnam airlines': {
        id: 'vna',
        name: 'Vietnam Airlines',
        shortName: 'VNA',
        slogan: 'Sải cánh vươn cao · Hãng Hàng Không Quốc Gia',
        primaryColor: '#002855',
        accentColor: '#D4AF37',
        aircraftModel: 'Boeing 787-9 Dreamliner / Airbus A350',
        aircraftImage: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?q=80&w=1200&auto=format&fit=crop',
        logoUrl: '/images/airlines/vna.svg',
    },
    'vietjet air': {
        id: 'vj',
        name: 'Vietjet Air',
        shortName: 'Vietjet',
        slogan: 'Bay là thích ngay · Năng động & Tiết kiệm',
        primaryColor: '#EE0000',
        accentColor: '#FFCC00',
        aircraftModel: 'Airbus A321neo Sharklets',
        aircraftImage: 'https://images.unsplash.com/photo-1569154941061-e231b4725ef1?q=80&w=1200&auto=format&fit=crop',
        logoUrl: '/images/airlines/vietjet.svg',
    },
    'bamboo airways': {
        id: 'bav',
        name: 'Bamboo Airways',
        shortName: 'Bamboo',
        slogan: 'Hơn cả một chuyến bay · Dịch vụ hiếu khách',
        primaryColor: '#008248',
        accentColor: '#0F3F7A',
        aircraftModel: 'Boeing 787-9 / Embraer E190',
        aircraftImage: 'https://images.unsplash.com/photo-1583416750470-965b2707b355?q=80&w=1200&auto=format&fit=crop',
        logoUrl: '/images/airlines/bamboo.svg',
    },
    'vietravel airlines': {
        id: 'vu',
        name: 'Vietravel Airlines',
        shortName: 'Vietravel',
        slogan: 'Cánh tên vàng trên bầu trời Việt · Kết nối du lịch',
        primaryColor: '#F59E0B',
        accentColor: '#1E3A8A',
        aircraftModel: 'Airbus A321ceo',
        aircraftImage: 'https://images.unsplash.com/photo-1519074069444-1ba4eae16e60?q=80&w=1200&auto=format&fit=crop',
        logoUrl: '/images/airlines/vietravel.png',
    },
    'pacific airlines': {
        id: 'bl',
        name: 'Pacific Airlines',
        shortName: 'Pacific',
        slogan: 'Niềm vui cất cánh · Thành viên Vietnam Airlines Group',
        primaryColor: '#002044',
        accentColor: '#FF6600',
        aircraftModel: 'Airbus A320-200',
        aircraftImage: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?q=80&w=1200&auto=format&fit=crop',
        logoUrl: '/images/airlines/pacific.jpg',
    },
    'sun air': {
        id: 'sun',
        name: 'Sun Air (Sun PhuQuoc)',
        shortName: 'Sun Air',
        slogan: 'Bay đẳng cấp · Sun Group',
        primaryColor: '#F59E0B',
        accentColor: '#D97706',
        aircraftModel: 'Gulfstream G650ER',
        aircraftImage: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?q=80&w=1200&auto=format&fit=crop',
    },
};

export const getAirlineInfo = (airlineName?: string | null): AirlineInfo => {
    if (!airlineName) {
        return AIRLINES_DATA['vietnam airlines'];
    }
    const lower = airlineName.toLowerCase().trim();
    if (lower.includes('vietnam')) return AIRLINES_DATA['vietnam airlines'];
    if (lower.includes('vietjet')) return AIRLINES_DATA['vietjet air'];
    if (lower.includes('bamboo')) return AIRLINES_DATA['bamboo airways'];
    if (lower.includes('vietravel')) return AIRLINES_DATA['vietravel airlines'];
    if (lower.includes('pacific') || lower.includes('jetstar')) return AIRLINES_DATA['pacific airlines'];
    if (lower.includes('sun')) return AIRLINES_DATA['sun air'];
    return {
        id: 'other',
        name: airlineName,
        shortName: airlineName.split(' ')[0] || 'Air',
        slogan: 'Hãng Hàng Không Nội Địa Việt Nam',
        primaryColor: '#000000',
        accentColor: '#FACC15',
        aircraftModel: 'Airbus A321 / Boeing 737',
        aircraftImage: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?q=80&w=1200&auto=format&fit=crop',
    };
};

export const AirlineLogoBadge: React.FC<{ airlineName?: string | null; className?: string; size?: 'sm' | 'md' | 'lg' }> = ({
    airlineName,
    className = '',
    size = 'md',
}) => {
    const info = getAirlineInfo(airlineName);
    const [imgError, setImgError] = React.useState(false);

    // Kích thước rộng rãi chuẩn tỉ lệ thương hiệu thực tế, không bị co nhỏ
    const sizeClasses = {
        sm: 'h-8 sm:h-9 w-16 sm:w-20 px-1 py-0.5',
        md: 'h-12 sm:h-14 w-28 sm:w-36 px-2 py-1',
        lg: 'h-16 sm:h-20 w-40 sm:w-52 px-3 py-1.5',
    }[size];

    if (info.logoUrl && !imgError) {
        return (
            <div
                className={`${sizeClasses} bg-white flex items-center justify-center shrink-0 border border-gray-100 rounded-lg shadow-xs overflow-hidden ${className}`}
                title={info.name}
            >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={info.logoUrl}
                    alt={info.name}
                    className="w-full h-full object-contain"
                    onError={() => setImgError(true)}
                    loading="lazy"
                />
            </div>
        );
    }

    return (
        <div
            className={`${sizeClasses} bg-gray-900 text-amber-400 flex items-center justify-center gap-1 font-bold rounded-lg shrink-0 ${className}`}
            title={info.name}
        >
            <span className="text-sm">✈</span>
            <span className="leading-none text-[11px] uppercase tracking-wider truncate">
                {info.shortName}
            </span>
        </div>
    );
};

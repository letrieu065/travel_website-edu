'use client';

/**
 * ============================================================================
 * MODULE AI PLANNER - SMART COMBO RECOMMENDATION (Trợ Lý AI Lập Kế Hoạch Chuyến Đi)
 * ============================================================================
 * Chịu trách nhiệm:
 * - Tiếp nhận thông số chuyến đi: Nơi xuất phát, Điểm đến, Số ngày, Số khách, Ngân sách đoàn, Sở thích.
 * - Giao diện tone màu xanh dịu thiên nhiên (Soft Green / Emerald nature backdrop) thư thái, thẩm mỹ.
 * - Công thức tính toán ngân sách & dịch vụ chuẩn xác theo quy tắc:
 *   + Ngân sách chuyến đi (Budget) là tổng chi phí cho toàn bộ số lượng khách (guests).
 *   + Mặc định giá Tour là cho 1 khách -> Tổng tour = Giá tour × Số khách.
 *   + 1 phòng khách sạn phục vụ 2 khách -> Số phòng = Math.ceil(Số khách / 2).
 *   + Tour ĐÃ BAO GỒM KHÁCH SẠN trong thời gian đi tour.
 *     Ví dụ: Ở lại 5 ngày mà đi tour 3 ngày thì chỉ cần thuê khách sạn thêm 2 ngày!
 *   + Vé máy bay khứ hồi tính theo số lượng khách.
 * ============================================================================
 */

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
    Sparkles,
    Calendar,
    MapPin,
    Users,
    Compass,
    Building2,
    Copy,
    Bot,
    Plane,
    ArrowRight,
    ArrowLeftRight,
    ShieldCheck,
    Check,
    CheckCircle2,
    Clock,
    Home,
    Coins,
} from 'lucide-react';
import { AirlineLogoBadge } from '@/components/common/AirlineBranding';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3600';

// Ảnh nền tone màu xanh dịu thiên nhiên chất lượng cao
const NATURE_BG_IMAGE = 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?q=80&w=2000&auto=format&fit=crop';
const CHAT_BOX_BG_IMAGE = 'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?q=80&w=1600&auto=format&fit=crop';

interface RecommendedTour {
    id: string;
    title: string;
    duration?: string;
    destination?: string;
    tour_days: number;
    tour_images?: Array<{ url: string }>;
    tour_departures?: Array<{ price: number; discount_price?: number | null }>;
}

interface RecommendedHotel {
    id: string;
    name: string;
    city: string;
    address?: string;
    star_rating: number;
    price_per_night: number;
    hotel_images?: Array<{ url: string }>;
    amenities?: string[];
}

interface RecommendedFlight {
    id?: string;
    airline: string;
    flight_code: string;
    departure_airport: string;
    arrival_airport: string;
    departure_time: string;
    duration: string;
    ticket_price: number;
}

interface CalculationBreakdown {
    total_days: number;
    tour_days: number;
    independent_hotel_days: number;
    rooms_count: number;
    flight_cost_per_guest: number;
    flight_cost_total: number;
    tour_cost_per_guest: number;
    tour_cost_total: number;
    hotel_cost_per_night: number;
    hotel_cost_total: number;
    incidentals: number;
    grand_total: number;
    diff_with_budget: number;
    explanation: string;
}

interface PlannerResult {
    input: {
        departureCity: string;
        destination: string;
        days: number;
        guests: number;
        budget: number;
        interests: string[];
    };
    ai_narrative?: string | null;
    recommended_flight: RecommendedFlight;
    recommended_hotel: RecommendedHotel;
    recommended_tour: RecommendedTour;
    calculation: CalculationBreakdown;
}

const DEPARTURE_CITIES = ['Hà Nội', 'TP. Hồ Chí Minh', 'Đà Nẵng', 'Hải Phòng', 'Cần Thơ'];

const POPULAR_DESTINATIONS = [
    'Đà Nẵng',
    'Phú Quốc',
    'Vịnh Hạ Long',
    'Sa Pa',
    'Nha Trang',
    'Huế',
    'Đà Lạt',
    'Hà Giang',
];

const INTEREST_TAGS = [
    'Biển đảo & Nghỉ dưỡng',
    'Ẩm thực bản địa',
    'Văn hóa & Di sản',
    'Khám phá thiên nhiên',
    'Check-in & Nhiếp ảnh',
    'Nghỉ dưỡng cao cấp',
    'Tắm khoáng & Spa',
];

const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        maximumFractionDigits: 0,
    }).format(amount);
};

// Map sân bay gợi ý theo địa danh
const getAirportInfo = (cityName: string): { code: string; name: string } => {
    const lower = cityName.toLowerCase();
    if (lower.includes('hà nội') || lower.includes('ha noi')) return { code: 'HAN', name: 'Sân bay Nội Bài (Hà Nội)' };
    if (lower.includes('hồ chí minh') || lower.includes('sài gòn') || lower.includes('tphcm')) return { code: 'SGN', name: 'Sân bay Tân Sơn Nhất (TP.HCM)' };
    if (lower.includes('đà nẵng') || lower.includes('da nang')) return { code: 'DAD', name: 'Sân bay Đà Nẵng' };
    if (lower.includes('phú quốc') || lower.includes('phu quoc')) return { code: 'PQC', name: 'Sân bay Phú Quốc' };
    if (lower.includes('nha trang') || lower.includes('cam ranh')) return { code: 'CXR', name: 'Sân bay Cam Ranh (Nha Trang)' };
    if (lower.includes('hải phòng') || lower.includes('hai phong')) return { code: 'HPH', name: 'Sân bay Cát Bi (Hải Phòng)' };
    if (lower.includes('cần thơ') || lower.includes('can tho')) return { code: 'VCA', name: 'Sân bay Cần Thơ' };
    if (lower.includes('đà lạt') || lower.includes('da lat')) return { code: 'DLI', name: 'Sân bay Liên Khương (Đà Lạt)' };
    if (lower.includes('huế') || lower.includes('hue')) return { code: 'HUI', name: 'Sân bay Phú Bài (Huế)' };
    if (lower.includes('hạ long') || lower.includes('quảng ninh')) return { code: 'VDO', name: 'Sân bay Vân Đồn (Quảng Ninh)' };
    return { code: 'HAN', name: `Sân bay kết nối ${cityName}` };
};

// Tổng hợp dữ liệu thông minh theo đúng công thức người dùng yêu cầu
const generateSmartRecommendation = (
    departureCity: string,
    destination: string,
    days: number,
    guests: number,
    budget: number,
    interests: string[]
): PlannerResult => {
    const depAirport = getAirportInfo(departureCity);
    const arrAirport = getAirportInfo(destination);

    // 1. VÉ MÁY BAY: Tính vé khứ hồi cho từng khách
    const budgetPerGuest = budget / guests;
    let airlineName = 'Vietnam Airlines';
    let flightCode = 'VN-128';
    let baseTicketOneWay = 1750000;

    if (budgetPerGuest < 5000000) {
        airlineName = 'Vietjet Air';
        flightCode = 'VJ-624';
        baseTicketOneWay = 1150000;
    } else if (budgetPerGuest > 12000000) {
        airlineName = 'Vietnam Airlines';
        flightCode = 'VN-234';
        baseTicketOneWay = 2450000;
    } else {
        airlineName = 'Bamboo Airways';
        flightCode = 'QH-152';
        baseTicketOneWay = 1550000;
    }

    const flightRoundTripPerGuest = baseTicketOneWay * 2;
    const flightCostTotal = flightRoundTripPerGuest * guests;

    // 2. TOUR DU LỊCH: Mặc định giá tour là cho 1 khách
    // Xác định số ngày của tour phù hợp với tổng thời gian chuyến đi
    // Quy tắc: Nếu đi 5 ngày, tour là 3 ngày (tourDays = 3), còn lại 2 ngày thuê khách sạn riêng.
    let tourDays = 3;
    if (days <= 2) {
        tourDays = 2;
    } else if (days === 3) {
        tourDays = 3;
    } else if (days === 4) {
        tourDays = 3;
    } else if (days === 5) {
        tourDays = 3; // Ví dụ chuẩn của người dùng: ở 5 ngày, tour 3 ngày
    } else if (days === 6) {
        tourDays = 4;
    } else if (days >= 7) {
        tourDays = 4;
    }

    const tourNights = Math.max(1, tourDays - 1);

    const tourCatalog: Record<string, RecommendedTour> = {
        'đà nẵng': {
            id: 'tour-danang-1',
            title: `Tour Đà Nẵng - Cầu Vàng Bà Nà Hills - Phố Cổ Hội An (${tourDays}N${tourNights}Đ)`,
            duration: `${tourDays} ngày ${tourNights} đêm`,
            destination: 'Đà Nẵng & Hội An',
            tour_days: tourDays,
            tour_images: [{ url: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?q=80&w=1200&auto=format&fit=crop' }],
            tour_departures: [{ price: 4290000, discount_price: 3690000 }],
        },
        'phú quốc': {
            id: 'tour-phuquoc-1',
            title: `Tour Đảo Ngọc Phú Quốc - Thị Trấn Hoàng Hôn - Cáp Treo Hòn Thơm (${tourDays}N${tourNights}Đ)`,
            duration: `${tourDays} ngày ${tourNights} đêm`,
            destination: 'Phú Quốc',
            tour_days: tourDays,
            tour_images: [{ url: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=1200&auto=format&fit=crop' }],
            tour_departures: [{ price: 4950000, discount_price: 4350000 }],
        },
        'vịnh hạ long': {
            id: 'tour-halong-1',
            title: `Tour Du Thuyền 5 Sao Khám Phá Kỳ Quan Vịnh Hạ Long & Lan Hạ (${tourDays}N${tourNights}Đ)`,
            duration: `${tourDays} ngày ${tourNights} đêm`,
            destination: 'Vịnh Hạ Long',
            tour_days: tourDays,
            tour_images: [{ url: 'https://images.unsplash.com/photo-1528127269322-539801943592?q=80&w=1200&auto=format&fit=crop' }],
            tour_departures: [{ price: 3850000, discount_price: 3350000 }],
        },
        'sa pa': {
            id: 'tour-sapa-1',
            title: `Tour Sa Pa - Nóc Nhà Đông Dương Fansipan - Bản Cát Cát (${tourDays}N${tourNights}Đ)`,
            duration: `${tourDays} ngày ${tourNights} đêm`,
            destination: 'Sa Pa & Fansipan',
            tour_days: tourDays,
            tour_images: [{ url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1200&auto=format&fit=crop' }],
            tour_departures: [{ price: 3200000, discount_price: 2750000 }],
        },
        'nha trang': {
            id: 'tour-nhatrang-1',
            title: `Tour Nha Trang Biển Xanh - Du Ngoạn 3 Đảo - VinWonders & Lặn San Hô (${tourDays}N${tourNights}Đ)`,
            duration: `${tourDays} ngày ${tourNights} đêm`,
            destination: 'Nha Trang',
            tour_days: tourDays,
            tour_images: [{ url: 'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?q=80&w=1200&auto=format&fit=crop' }],
            tour_departures: [{ price: 4100000, discount_price: 3590000 }],
        },
        'huế': {
            id: 'tour-hue-1',
            title: `Tour Di Sản Cố Đô Huế - Đại Nội Hoàng Cung - Ca Huế Sông Hương (${tourDays}N${tourNights}Đ)`,
            duration: `${tourDays} ngày ${tourNights} đêm`,
            destination: 'Cố Đô Huế',
            tour_days: tourDays,
            tour_images: [{ url: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?q=80&w=1200&auto=format&fit=crop' }],
            tour_departures: [{ price: 3400000, discount_price: 2850000 }],
        },
        'đà lạt': {
            id: 'tour-dalat-1',
            title: `Tour Đà Lạt Ngàn Hoa - Chinh Phục Langbiang - Săn Mây Cầu Đất (${tourDays}N${tourNights}Đ)`,
            duration: `${tourDays} ngày ${tourNights} đêm`,
            destination: 'Đà Lạt',
            tour_days: tourDays,
            tour_images: [{ url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1200&auto=format&fit=crop' }],
            tour_departures: [{ price: 2950000, discount_price: 2450000 }],
        },
        'hà giang': {
            id: 'tour-hagiang-1',
            title: `Tour Hùng Vĩ Đông Bắc - Đèo Mã Pí Lèng - Chèo Thuyền Sông Nho Quế (${tourDays}N${tourNights}Đ)`,
            duration: `${tourDays} ngày ${tourNights} đêm`,
            destination: 'Cao Nguyên Đá Hà Giang',
            tour_days: tourDays,
            tour_images: [{ url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1200&auto=format&fit=crop' }],
            tour_departures: [{ price: 4200000, discount_price: 3650000 }],
        },
    };

    const destKey = destination.toLowerCase().trim();
    const matchedTourKey = Object.keys(tourCatalog).find((k) => destKey.includes(k)) || 'đà nẵng';
    const selectedTour = tourCatalog[matchedTourKey];
    const tourCostPerPerson = selectedTour.tour_departures?.[0]?.discount_price ?? 3500000;
    const tourCostTotal = tourCostPerPerson * guests; // Mặc định giá tour là cho 1 khách

    // 3. KHÁCH SẠN: 1 phòng phục vụ 2 khách; Tour đã bao gồm khách sạn!
    const roomsCount = Math.ceil(guests / 2); // 1 phòng khách sạn là 2 khách
    const independentHotelDays = Math.max(0, days - tourDays); // Ở lại 5 ngày mà đi tour 3 ngày -> chỉ cần thuê 2 ngày

    const hotelCatalog: Record<string, RecommendedHotel> = {
        'đà nẵng': {
            id: 'hotel-danang-1',
            name: 'InterContinental Danang Sun Peninsula Resort',
            city: 'Đà Nẵng',
            address: 'Bán đảo Sơn Trà, Thọ Quang, Sơn Trà, Đà Nẵng',
            star_rating: 5,
            price_per_night: 2600000,
            hotel_images: [{ url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80' }],
            amenities: ['Hồ bơi vô cực ngắm biển', 'Bữa sáng buffet 5 sao', 'Bãi biển riêng tư', 'Spa thư giãn cao cấp'],
        },
        'phú quốc': {
            id: 'hotel-phuquoc-1',
            name: 'JW Marriott Phu Quoc Emerald Bay Resort',
            city: 'Phú Quốc',
            address: 'Bãi Khem, An Thới, Phú Quốc, Kiên Giang',
            star_rating: 5,
            price_per_night: 2900000,
            hotel_images: [{ url: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80' }],
            amenities: ['Hồ bơi vỏ sò biểu tượng', 'Bãi tắm cát trắng mịn', 'Nhà hàng ẩm thực quốc tế'],
        },
        'vịnh hạ long': {
            id: 'hotel-halong-1',
            name: 'Vinpearl Resort & Spa Hạ Long',
            city: 'Hạ Long',
            address: 'Đảo Rều, Bãi Cháy, TP. Hạ Long, Quảng Ninh',
            star_rating: 5,
            price_per_night: 2200000,
            hotel_images: [{ url: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80' }],
            amenities: ['Toạ lạc 100% trên đảo biệt lập', 'Hồ bơi ngoài trời 4 mùa', 'Tàu cao tốc đưa đón miễn phí'],
        },
        'sa pa': {
            id: 'hotel-sapa-1',
            name: 'Hotel de la Coupole - MGallery Sapa',
            city: 'Sa Pa',
            address: '01 Hoàng Liên, Sa Pa, Lào Cai',
            star_rating: 5,
            price_per_night: 2400000,
            hotel_images: [{ url: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80' }],
            amenities: ['Kiến trúc Pháp cổ hòa quyện bản sắc Sa Pa', 'Hồ bơi nước ấm trong nhà', 'Nhà hàng Chic ẩm thực cao cấp'],
        },
        'nha trang': {
            id: 'hotel-nhatrang-1',
            name: 'Amiana Resort & Spa Nha Trang',
            city: 'Nha Trang',
            address: 'Vịnh Nha Trang, Phạm Văn Đồng, TP. Nha Trang',
            star_rating: 5,
            price_per_night: 2300000,
            hotel_images: [{ url: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=800&q=80' }],
            amenities: ['Hồ bơi nước biển tự nhiên 2.500m²', 'Bãi biển Lagoon riêng biệt', 'Tắm bùn khoáng nóng ngắm biển'],
        },
        'huế': {
            id: 'hotel-hue-1',
            name: 'Azerai La Residence Huế',
            city: 'Huế',
            address: '05 Lê Lợi, Vĩnh Ninh, TP. Huế, Thừa Thiên Huế',
            star_rating: 5,
            price_per_night: 2100000,
            hotel_images: [{ url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80' }],
            amenities: ['Tầm nhìn tuyệt đẹp hướng dòng sông Hương', 'Biệt thự phong cách Art Deco', 'Hồ bơi nước mặn sang trọng'],
        },
        'đà lạt': {
            id: 'hotel-dalat-1',
            name: 'Dalat Edensee Lake Resort & Spa',
            city: 'Đà Lạt',
            address: 'Khu du lịch Hồ Tuyền Lâm, Phường 4, TP. Đà Lạt',
            star_rating: 5,
            price_per_night: 1850000,
            hotel_images: [{ url: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=800&q=80' }],
            amenities: ['View trọn hồ Tuyền Lâm và rừng thông', 'Không khí se lạnh trong lành', 'Sân tennis & chèo thuyền Kayak'],
        },
        'hà giang': {
            id: 'hotel-hagiang-1',
            name: 'P\'apiu Resort Cao Nguyên Đá Hà Giang',
            city: 'Hà Giang',
            address: 'Yên Định, Bắc Mê, Hà Giang',
            star_rating: 5,
            price_per_night: 2200000,
            hotel_images: [{ url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80' }],
            amenities: ['Con đường thổ cẩm dài nhất Việt Nam', 'View thung lũng mây bồng bềnh', 'Hầm rượu vang thượng hạng'],
        },
    };

    const selectedHotel = hotelCatalog[matchedTourKey];
    // Chi phí khách sạn chỉ tính cho independentHotelDays (nếu > 0)
    const hotelCostTotal = selectedHotel.price_per_night * independentHotelDays * roomsCount;

    // 4. CHI PHÍ ĂN UỐNG NGOÀI TOUR & TỰ TÚC:
    // Các ngày đi tour đã bao gồm ăn uống trong giá tour. Chỉ tính ăn uống tự túc cho các ngày tự do + phụ phí nhỏ.
    const incidentals = (independentHotelDays * 400000 + tourDays * 150000) * guests;

    // 5. TỔNG DỰ TOÁN COMBO TRỌN GÓI
    const grandTotal = flightCostTotal + tourCostTotal + hotelCostTotal + incidentals;
    const diffWithBudget = budget - grandTotal;

    // Lời giải thích trực quan chuẩn logic
    let explanation = '';
    if (independentHotelDays > 0) {
        explanation = `Chuyến đi kéo dài ${days} ngày cho đoàn ${guests} khách:
• Tour trải nghiệm ${selectedTour.title} (${tourDays} ngày): Đã bao gồm khách sạn và các bữa ăn chính trong chương trình tour (${formatCurrency(tourCostTotal)} cho ${guests} khách).
• Khách sạn thuê riêng: Vì tour đã lo nơi ở trong ${tourDays} ngày, bạn chỉ cần thuê thêm ${independentHotelDays} đêm cho ${roomsCount} phòng (${guests} khách, mỗi phòng 2 người) với chi phí ${formatCurrency(hotelCostTotal)}.
• Vé máy bay khứ hồi: ${formatCurrency(flightCostTotal)} (${guests} khách).
• Tổng dự toán là ${formatCurrency(grandTotal)}, ${diffWithBudget >= 0 ? `tiết kiệm ${formatCurrency(diffWithBudget)} so với ngân sách ${formatCurrency(budget)}` : `chênh lệch nhẹ ${formatCurrency(Math.abs(diffWithBudget))} so với ngân sách ban đầu`}.`;
    } else {
        explanation = `Chuyến đi kéo dài ${days} ngày cho đoàn ${guests} khách:
• Toàn bộ chuyến đi ${days} ngày nằm trọn trong Tour ${selectedTour.title} (${tourDays} ngày ${tourNights} đêm), nơi ở khách sạn và các bữa ăn đã được tính trọn gói trong tour!
• Chi phí khách sạn thuê ngoài: 0 ₫ (Tiết kiệm 100% chi phí đặt phòng lẻ).
• Vé máy bay khứ hồi: ${formatCurrency(flightCostTotal)} (${guests} khách).
• Tổng dự toán trọn gói là ${formatCurrency(grandTotal)}, ${diffWithBudget >= 0 ? `tiết kiệm ${formatCurrency(diffWithBudget)} so với ngân sách ${formatCurrency(budget)}` : `khớp tối ưu với ngân sách ban đầu`}.`;
    }

    const narrative = `Dựa trên điểm xuất phát từ ${departureCity} đến ${destination} trong ${days} ngày cho đoàn ${guests} khách:
• Vé máy bay khứ hồi: Tối ưu khung giờ bay đẹp cùng ${airlineName} (${flightCode}) khứ hồi chỉ ${formatCurrency(flightRoundTripPerGuest)}/khách.
• Tour du lịch (${tourDays} ngày ${tourNights} đêm): ${selectedTour.title} giá ${formatCurrency(tourCostPerPerson)}/khách, đã bao gồm nơi ở khách sạn chuẩn trong thời gian đi tour.
• Khách sạn: ${independentHotelDays > 0 ? `Bạn chỉ cần thuê thêm ${independentHotelDays} đêm cho ${roomsCount} phòng (${selectedHotel.name} - ${selectedHotel.star_rating}★) với tổng chi phí ${formatCurrency(hotelCostTotal)}.` : `Đã được bao trọn trong chương trình tour ${tourDays} ngày, không cần tốn tiền thuê thêm phòng lẻ!`}`;

    return {
        input: {
            departureCity,
            destination,
            days,
            guests,
            budget,
            interests,
        },
        ai_narrative: narrative,
        recommended_flight: {
            airline: airlineName,
            flight_code: flightCode,
            departure_airport: depAirport.name,
            arrival_airport: arrAirport.name,
            departure_time: '07:30 ➔ 08:50 (Khứ hồi linh hoạt)',
            duration: '1h 20m bay',
            ticket_price: baseTicketOneWay,
        },
        recommended_hotel: selectedHotel,
        recommended_tour: selectedTour,
        calculation: {
            total_days: days,
            tour_days: tourDays,
            independent_hotel_days: independentHotelDays,
            rooms_count: roomsCount,
            flight_cost_per_guest: flightRoundTripPerGuest,
            flight_cost_total: flightCostTotal,
            tour_cost_per_guest: tourCostPerPerson,
            tour_cost_total: tourCostTotal,
            hotel_cost_per_night: selectedHotel.price_per_night,
            hotel_cost_total: hotelCostTotal,
            incidentals,
            grand_total: grandTotal,
            diff_with_budget: diffWithBudget,
            explanation,
        },
    };
};

export default function AIPlannerPage() {
    const [departureCity, setDepartureCity] = useState('Hà Nội');
    const [destination, setDestination] = useState('Đà Nẵng');
    const [days, setDays] = useState(5);
    const [guests, setGuests] = useState(2);
    const [budget, setBudget] = useState(16000000);
    const [selectedInterests, setSelectedInterests] = useState<string[]>([
        'Biển đảo & Nghỉ dưỡng',
        'Ẩm thực bản địa',
    ]);

    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<PlannerResult | null>(null);
    const [copied, setCopied] = useState(false);

    // Tự động căn chỉnh ngân sách phù hợp khi số lượng khách thay đổi
    const handleGuestsChange = (newGuests: number) => {
        setGuests(newGuests);
        const minBudget = newGuests * 3000000;
        if (budget < minBudget) {
            setBudget(newGuests * 8000000);
        }
    };

    const toggleInterest = (tag: string) => {
        if (selectedInterests.includes(tag)) {
            setSelectedInterests(selectedInterests.filter((t) => t !== tag));
        } else {
            setSelectedInterests([...selectedInterests, tag]);
        }
    };

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            // Thử kết nối API Backend
            const res = await fetch(`${API_URL}/api/v1/ai/generate-itinerary`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    departure_location: departureCity.trim(),
                    destination: destination.trim(),
                    days: Number(days),
                    budget: Number(budget),
                    guests: Number(guests),
                    interests: selectedInterests,
                }),
            });

            if (res.ok) {
                const apiData = await res.json();
                if (apiData.status === 'success' && apiData.data) {
                    const localResult = generateSmartRecommendation(
                        departureCity.trim(),
                        destination.trim(),
                        Number(days),
                        Number(guests),
                        Number(budget),
                        selectedInterests
                    );

                    if (apiData.data.ai_narrative) {
                        localResult.ai_narrative = apiData.data.ai_narrative;
                    }
                    if (apiData.data.recommended_tours && apiData.data.recommended_tours.length > 0) {
                        const topTour = apiData.data.recommended_tours[0];
                        localResult.recommended_tour = {
                            ...localResult.recommended_tour,
                            id: topTour.id,
                            title: topTour.title,
                        };
                    }
                    if (apiData.data.recommended_hotels && apiData.data.recommended_hotels.length > 0) {
                        const topHotel = apiData.data.recommended_hotels[0];
                        localResult.recommended_hotel = {
                            ...localResult.recommended_hotel,
                            id: topHotel.id,
                            name: topHotel.name,
                            star_rating: topHotel.star_rating,
                            price_per_night: Number(topHotel.price_per_night),
                        };
                    }
                    setResult(localResult);
                    return;
                }
            }
            const smartRec = generateSmartRecommendation(
                departureCity.trim(),
                destination.trim(),
                Number(days),
                Number(guests),
                Number(budget),
                selectedInterests
            );
            setResult(smartRec);
        } catch {
            const smartRec = generateSmartRecommendation(
                departureCity.trim(),
                destination.trim(),
                Number(days),
                Number(guests),
                Number(budget),
                selectedInterests
            );
            setResult(smartRec);
        } finally {
            setIsLoading(false);
        }
    };

    const copyTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        return () => {
            if (copyTimeoutRef.current) {
                clearTimeout(copyTimeoutRef.current);
            }
        };
    }, []);

    const handleCopyPlan = () => {
        if (!result) return;
        const text = `KẾ HOẠCH COMBO DU LỊCH ${result.input.departureCity.toUpperCase()} ➔ ${result.input.destination.toUpperCase()}
• Thời gian: ${result.input.days} ngày · Đoàn: ${result.input.guests} khách
• Vé máy bay khứ hồi: ${result.recommended_flight.airline} (${result.recommended_flight.flight_code}) - ${formatCurrency(result.calculation.flight_cost_total)}
• Tour trọn gói (${result.calculation.tour_days} ngày, đã bao gồm nơi ở): ${result.recommended_tour.title} - ${formatCurrency(result.calculation.tour_cost_total)}
• Khách sạn thuê riêng (${result.calculation.independent_hotel_days} đêm ngoài tour cho ${result.calculation.rooms_count} phòng): ${result.recommended_hotel.name} - ${formatCurrency(result.calculation.hotel_cost_total)}
• Tổng dự toán trọn gói: ${formatCurrency(result.calculation.grand_total)}
(Natura Travel - Trợ lý AI đồng hành cùng chuyến đi Việt Nam)`;

        navigator.clipboard.writeText(text);
        setCopied(true);
        if (copyTimeoutRef.current) {
            clearTimeout(copyTimeoutRef.current);
        }
        copyTimeoutRef.current = setTimeout(() => setCopied(false), 2000);
    };

    // Tính toán khoảng ngân sách tối thiểu & tối đa hiển thị trên slider
    const minBudgetSlider = guests * 3000000;
    const maxBudgetSlider = guests * 25000000;

    return (
        <div
            className="min-h-screen text-gray-900 pb-28 relative bg-fixed bg-cover bg-center"
            style={{
                backgroundImage: `linear-gradient(135deg, rgba(240, 253, 244, 0.94) 0%, rgba(209, 250, 229, 0.90) 50%, rgba(236, 253, 245, 0.95) 100%), url('${NATURE_BG_IMAGE}')`,
            }}
        >
            {/* Header Hero Section: Tone màu xanh dịu thiên nhiên */}
            <section
                className="relative overflow-hidden text-white py-14 px-6 lg:px-12 border-b border-emerald-800/30 shadow-md bg-cover bg-center"
                style={{
                    backgroundImage: `linear-gradient(135deg, rgba(6, 78, 59, 0.92) 0%, rgba(4, 47, 46, 0.96) 100%), url('${NATURE_BG_IMAGE}')`,
                }}
            >
                <div className="max-w-7xl mx-auto relative z-10">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/20 text-[#FACC15] border border-emerald-400/40 text-xs font-black uppercase tracking-widest rounded-full mb-3 backdrop-blur-sm">
                        <Bot className="w-3.5 h-3.5" /> Natura AI Travel Engine
                    </span>
                    <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tight text-white max-w-3xl leading-tight">
                        Trợ Lý AI Lập Kế Hoạch Chuyến Đi
                    </h1>
                    <p className="mt-3 text-sm md:text-base text-emerald-100 max-w-3xl font-medium leading-relaxed">
                        Thuật toán Natura AI tính toán chi phí chính xác theo quy chuẩn: <strong>Giá tour cho 1 khách</strong>, <strong>1 phòng khách sạn cho 2 khách</strong> và <strong>Tour đã bao gồm khách sạn</strong> — giúp bạn tối ưu hóa ngân sách và chỉ chi trả đúng các dịch vụ thực tế cần thiết!
                    </p>
                </div>
            </section>

            {/* Main Content Area */}
            <div className="max-w-7xl mx-auto px-6 lg:px-12 pt-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left Form: Tùy Chỉnh Thông Số Chuyến Đi (4 cols) */}
                    <div className="lg:col-span-4">
                        <div
                            className="p-6 shadow-xl border border-emerald-300/80 rounded-2xl sticky top-24 backdrop-blur-md bg-white/95"
                        >
                            <div className="flex items-center justify-between pb-4 border-b border-emerald-100 mb-5">
                                <div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700 block">
                                        Cấu Hình Thông Số
                                    </span>
                                    <h2 className="text-lg font-black uppercase tracking-tight text-gray-900">
                                        Yêu Cầu Hành Trình
                                    </h2>
                                </div>
                                <Sparkles className="w-5 h-5 text-emerald-600" />
                            </div>

                            <form onSubmit={handleGenerate} className="space-y-4 text-xs">
                                {/* 1. NƠI XUẤT PHÁT */}
                                <div>
                                    <label className="block font-black uppercase tracking-wider text-gray-700 mb-1">
                                        1. Nơi Xuất Phát (Khởi Hành Từ)
                                    </label>
                                    <div className="relative">
                                        <Plane className="absolute left-3 top-3 w-4 h-4 text-emerald-600 rotate-45" />
                                        <input
                                            type="text"
                                            required
                                            value={departureCity}
                                            onChange={(e) => setDepartureCity(e.target.value)}
                                            placeholder="Ví dụ: Hà Nội, TP.HCM, Hải Phòng..."
                                            className="w-full pl-9 pr-3 py-2.5 font-bold border border-emerald-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900 bg-white"
                                        />
                                    </div>
                                    <div className="flex flex-wrap gap-1 mt-1.5">
                                        {DEPARTURE_CITIES.map((city) => (
                                            <button
                                                key={city}
                                                type="button"
                                                onClick={() => setDepartureCity(city)}
                                                className={`px-2 py-0.5 text-[10px] font-bold rounded border transition-colors ${
                                                    departureCity === city
                                                        ? 'bg-emerald-700 text-white border-emerald-800'
                                                        : 'bg-emerald-50/80 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                                                }`}
                                            >
                                                {city}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* 2. ĐIỂM ĐẾN */}
                                <div>
                                    <label className="block font-black uppercase tracking-wider text-gray-700 mb-1">
                                        2. Điểm Đến Mong Muốn (Việt Nam)
                                    </label>
                                    <div className="relative">
                                        <MapPin className="absolute left-3 top-3 w-4 h-4 text-emerald-600" />
                                        <input
                                            type="text"
                                            required
                                            value={destination}
                                            onChange={(e) => setDestination(e.target.value)}
                                            placeholder="Ví dụ: Đà Nẵng, Phú Quốc, Sa Pa..."
                                            className="w-full pl-9 pr-3 py-2.5 font-bold border border-emerald-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900 bg-white"
                                        />
                                    </div>
                                    <div className="flex flex-wrap gap-1 mt-1.5">
                                        {POPULAR_DESTINATIONS.map((dest) => (
                                            <button
                                                key={dest}
                                                type="button"
                                                onClick={() => setDestination(dest)}
                                                className={`px-2 py-0.5 text-[10px] font-bold rounded border transition-colors ${
                                                    destination === dest
                                                        ? 'bg-emerald-700 text-white border-emerald-800'
                                                        : 'bg-emerald-50/80 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                                                }`}
                                            >
                                                {dest}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* 3. THỜI GIAN & SỐ KHÁCH */}
                                <div className="grid grid-cols-2 gap-3 pt-1">
                                    <div>
                                        <label className="block font-black uppercase tracking-wider text-gray-700 mb-1">
                                            Thời Gian Đi
                                        </label>
                                        <div className="relative">
                                            <Calendar className="absolute left-3 top-3 w-4 h-4 text-emerald-600" />
                                            <select
                                                value={days}
                                                onChange={(e) => setDays(Number(e.target.value))}
                                                className="w-full pl-9 pr-2 py-2.5 font-bold border border-emerald-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-gray-900"
                                            >
                                                {[2, 3, 4, 5, 6, 7].map((d) => (
                                                    <option key={d} value={d}>
                                                        {d} ngày {d - 1} đêm
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block font-black uppercase tracking-wider text-gray-700 mb-1">
                                            Số Lượng Khách
                                        </label>
                                        <div className="relative">
                                            <Users className="absolute left-3 top-3 w-4 h-4 text-emerald-600" />
                                            <select
                                                value={guests}
                                                onChange={(e) => handleGuestsChange(Number(e.target.value))}
                                                className="w-full pl-9 pr-2 py-2.5 font-bold border border-emerald-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-gray-900"
                                            >
                                                {[1, 2, 3, 4, 5, 6, 8].map((g) => (
                                                    <option key={g} value={g}>
                                                        {g} người ({Math.ceil(g / 2)} phòng)
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* 4. TỔNG NGÂN SÁCH DỰ KIẾN (CHO CẢ ĐOÀN) */}
                                <div className="pt-2 p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl">
                                    <div className="flex justify-between items-center mb-1">
                                        <label className="font-black uppercase tracking-wider text-emerald-900 text-[11px]">
                                            Ngân Sách Cả Đoàn ({guests} khách)
                                        </label>
                                        <span className="font-black text-emerald-800 text-sm">{formatCurrency(budget)}</span>
                                    </div>
                                    <input
                                        type="range"
                                        min={minBudgetSlider}
                                        max={maxBudgetSlider}
                                        step={500000}
                                        value={budget}
                                        onChange={(e) => setBudget(Number(e.target.value))}
                                        className="w-full accent-emerald-700 cursor-pointer"
                                    />
                                    <div className="flex justify-between text-[10px] text-emerald-600 mt-1 font-medium">
                                        <span>{formatCurrency(minBudgetSlider)}</span>
                                        <span className="font-bold text-emerald-900">
                                            ~ {formatCurrency(Math.round(budget / guests))} / khách
                                        </span>
                                        <span>{formatCurrency(maxBudgetSlider)}</span>
                                    </div>
                                </div>

                                {/* 5. SỞ THÍCH */}
                                <div className="pt-1">
                                    <label className="block font-black uppercase tracking-wider text-gray-700 mb-2">
                                        Sở Thích Du Lịch
                                    </label>
                                    <div className="flex flex-wrap gap-1.5">
                                        {INTEREST_TAGS.map((tag) => {
                                            const isSelected = selectedInterests.includes(tag);
                                            return (
                                                <button
                                                    key={tag}
                                                    type="button"
                                                    onClick={() => toggleInterest(tag)}
                                                    className={`px-2.5 py-1 text-[11px] font-bold rounded-md border transition-all ${
                                                        isSelected
                                                            ? 'bg-emerald-700 text-white border-emerald-800 shadow-sm'
                                                            : 'bg-white/80 text-emerald-900 border-emerald-200 hover:border-emerald-400'
                                                    }`}
                                                >
                                                    {tag}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full bg-emerald-700 hover:bg-emerald-800 text-[#FACC15] py-3.5 px-4 font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-2 disabled:opacity-50 mt-4 rounded-xl shadow-md border border-emerald-800"
                                >
                                    {isLoading ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-[#FACC15] border-t-transparent rounded-full animate-spin"></div>
                                            AI Đang Tổng Hợp Gợi Ý...
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="w-4 h-4" /> Gợi Ý Combo Điểm Đến
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Right Panel: Output Recommendation Cards (8 cols) */}
                    <div className="lg:col-span-8 space-y-6">
                        {!result && !isLoading && (
                            <div className="bg-white/90 backdrop-blur-md border border-emerald-300 p-12 text-center rounded-2xl shadow-sm">
                                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-200">
                                    <Bot className="w-8 h-8 text-emerald-700" />
                                </div>
                                <h3 className="text-lg font-black uppercase tracking-tight text-emerald-950">
                                    Chưa Có Đề Xuất Nào Được Tạo
                                </h3>
                                <p className="text-xs text-gray-600 max-w-md mx-auto mt-2 leading-relaxed">
                                    Hãy nhập <strong>Nơi xuất phát</strong> và <strong>Điểm đến</strong> bên trái, chọn số khách và ngân sách, sau đó nhấn <strong>&quot;Gợi Ý Combo Điểm Đến&quot;</strong> để Natura AI thiết kế toàn bộ chuyến đi cho bạn.
                                </p>
                            </div>
                        )}

                        {result && (
                            <div className="space-y-6 animate-in fade-in duration-500">
                                {/* 1. Overview Summary Header */}
                                <div className="bg-white/95 backdrop-blur-md border border-emerald-200 p-6 shadow-sm rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700 block mb-1">
                                            Bộ Giải Pháp Du Lịch Thông Minh
                                        </span>
                                        <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-gray-900 flex items-center gap-2 flex-wrap">
                                            <span>{result.input.departureCity}</span>
                                            <ArrowRight className="w-5 h-5 text-emerald-600 shrink-0" />
                                            <span className="text-emerald-800">{result.input.destination}</span>
                                        </h2>
                                        <p className="text-xs text-gray-600 mt-1 font-medium">
                                            Chuyến đi: {result.input.days} ngày ({result.input.days - 1} đêm) · Đoàn {result.input.guests} khách ({result.calculation.rooms_count} phòng khách sạn) · Ngân sách: {formatCurrency(result.input.budget)}
                                        </p>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={handleCopyPlan}
                                        className="inline-flex items-center gap-1.5 border border-emerald-700 bg-white text-emerald-900 px-4 py-2 text-xs font-black uppercase tracking-wider hover:bg-emerald-700 hover:text-white transition-colors shrink-0 rounded-lg shadow-sm"
                                    >
                                        <Copy className="w-4 h-4" /> {copied ? 'Đã Sao Chép!' : 'Sao Chép Gợi Ý'}
                                    </button>
                                </div>

                                {/* 2. KHUNG CHAT AI: Tone màu xanh dịu thiên nhiên với lời giải thích công thức */}
                                <div
                                    className="relative rounded-2xl p-6 sm:p-7 shadow-lg border border-emerald-400/50 overflow-hidden text-emerald-50 bg-cover bg-center"
                                    style={{
                                        backgroundImage: `linear-gradient(135deg, rgba(6, 78, 59, 0.90) 0%, rgba(4, 47, 46, 0.94) 100%), url('${CHAT_BOX_BG_IMAGE}')`,
                                    }}
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="relative shrink-0">
                                            <div className="w-12 h-12 rounded-full bg-emerald-500/30 border border-emerald-300 flex items-center justify-center text-white shadow-inner">
                                                <Bot className="w-6 h-6 text-[#FACC15]" />
                                            </div>
                                            <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-400 border-2 border-emerald-900 rounded-full animate-pulse" />
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                                                <span className="text-xs font-black uppercase tracking-widest text-[#FACC15] flex items-center gap-1.5">
                                                    <Sparkles className="w-4 h-4" /> Trợ Lý Natura AI Phân Tích
                                                </span>
                                                <span className="text-[11px] bg-emerald-500/20 border border-emerald-400/30 px-2.5 py-0.5 rounded-full text-emerald-200 font-medium">
                                                    Đã tối ưu công thức phòng & tour
                                                </span>
                                            </div>

                                            {/* Chat Bubble Message Body */}
                                            <div className="bg-emerald-900/60 border border-emerald-600/40 p-4 rounded-xl backdrop-blur-sm text-xs sm:text-sm text-emerald-100 leading-relaxed font-medium space-y-2">
                                                <p className="whitespace-pre-line">
                                                    {result.calculation.explanation}
                                                </p>
                                                {result.ai_narrative && (
                                                    <p className="pt-2 border-t border-emerald-700/50 text-emerald-200 text-xs italic">
                                                        💡 Gợi ý chuyên gia: {result.ai_narrative}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* 3. GỢI Ý 1: VÉ MÁY BAY NỘI ĐỊA CẦN CHỌN */}
                                <div className="bg-white/95 backdrop-blur-md border border-emerald-200 p-6 shadow-sm rounded-2xl relative overflow-hidden">
                                    <div className="flex items-center justify-between pb-3 border-b border-emerald-100 mb-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-lg bg-emerald-700 text-[#FACC15] flex items-center justify-center font-black text-xs shadow-sm">
                                                01
                                            </div>
                                            <div>
                                                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700 block">
                                                    Phương Tiện Di Chuyển
                                                </span>
                                                <h3 className="text-sm font-black uppercase text-gray-900 flex items-center gap-2">
                                                    <Plane className="w-4 h-4 text-blue-600" />
                                                    Vé Máy Bay Đề Xuất Cần Chọn
                                                </h3>
                                            </div>
                                        </div>
                                        <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                                            Vé khứ hồi {result.input.guests} khách
                                        </span>
                                    </div>

                                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 bg-emerald-50/50 rounded-xl border border-emerald-100">
                                        <div className="flex items-center gap-4">
                                            <AirlineLogoBadge
                                                airlineName={result.recommended_flight.airline}
                                                size="md"
                                                className="rounded-lg shadow-sm"
                                            />
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-black text-gray-900">
                                                        {result.recommended_flight.airline}
                                                    </span>
                                                    <span className="text-xs font-mono font-bold bg-white text-emerald-800 px-1.5 py-0.5 border border-emerald-200 rounded">
                                                        {result.recommended_flight.flight_code}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-gray-600 mt-1 flex items-center gap-1.5 font-medium">
                                                    <span>{result.recommended_flight.departure_airport}</span>
                                                    <ArrowLeftRight className="w-3.5 h-3.5 text-emerald-600" />
                                                    <span>{result.recommended_flight.arrival_airport}</span>
                                                </p>
                                                <p className="text-[11px] text-gray-500 mt-1 flex items-center gap-1">
                                                    <Clock className="w-3 h-3 text-emerald-600" />
                                                    Khung giờ: {result.recommended_flight.departure_time} · {result.recommended_flight.duration}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="w-full md:w-auto text-left md:text-right border-t md:border-t-0 pt-3 md:pt-0 border-emerald-100">
                                            <span className="text-[10px] uppercase font-bold text-gray-500 block">
                                                Giá vé khứ hồi / khách
                                            </span>
                                            <span className="text-base font-black text-emerald-800">
                                                {formatCurrency(result.calculation.flight_cost_per_guest)}
                                            </span>
                                            <span className="text-[11px] font-bold text-gray-700 block mt-0.5">
                                                Tổng {result.input.guests} vé: <strong>{formatCurrency(result.calculation.flight_cost_total)}</strong>
                                            </span>

                                            <Link
                                                href={`/flights?arrival_airport=${encodeURIComponent(result.input.destination)}`}
                                                className="mt-2 inline-flex items-center gap-1.5 bg-emerald-700 text-[#FACC15] hover:bg-emerald-800 px-3.5 py-1.5 text-xs font-black uppercase tracking-wider transition-colors rounded-lg shadow-sm"
                                            >
                                                Xem Chuyến Bay ➔
                                            </Link>
                                        </div>
                                    </div>
                                </div>

                                {/* 4. GỢI Ý 2: TOUR DU LỊCH TRẢI NGHIỆM CẦN CHỌN (ĐÃ BAO GỒM KHÁCH SẠN) */}
                                <div className="bg-white/95 backdrop-blur-md border border-emerald-200 p-6 shadow-sm rounded-2xl relative overflow-hidden">
                                    <div className="flex items-center justify-between pb-3 border-b border-emerald-100 mb-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-lg bg-emerald-700 text-[#FACC15] flex items-center justify-center font-black text-xs shadow-sm">
                                                02
                                            </div>
                                            <div>
                                                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700 block">
                                                    Hành Trình Khám Phá
                                                </span>
                                                <h3 className="text-sm font-black uppercase text-gray-900 flex items-center gap-2">
                                                    <Compass className="w-4 h-4 text-purple-600" />
                                                    Tour Du Lịch Trải Nghiệm Cần Chọn
                                                </h3>
                                            </div>
                                        </div>
                                        <span className="text-[11px] font-bold text-purple-800 bg-purple-50 px-2.5 py-1 rounded-full border border-purple-200">
                                            Đã bao gồm khách sạn trong Tour
                                        </span>
                                    </div>

                                    <div className="flex flex-col md:flex-row items-start gap-5 p-4 bg-emerald-50/50 rounded-xl border border-emerald-100">
                                        <div className="relative w-full md:w-48 h-36 shrink-0 bg-gray-100 overflow-hidden rounded-xl border border-emerald-200">
                                            <Image
                                                src={
                                                    result.recommended_tour.tour_images?.[0]?.url ||
                                                    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=400&q=80'
                                                }
                                                alt={result.recommended_tour.title}
                                                fill
                                                className="object-cover"
                                            />
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h4 className="text-sm sm:text-base font-black uppercase tracking-tight text-gray-900">
                                                    {result.recommended_tour.title}
                                                </h4>
                                                <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                                                    Thời lượng: {result.calculation.tour_days} ngày
                                                </span>
                                            </div>

                                            <div className="mt-2 space-y-1 text-xs text-gray-600 font-medium">
                                                <p className="flex items-center gap-1.5 text-emerald-800 font-semibold">
                                                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                                    <span>Mặc định giá tour: <strong>{formatCurrency(result.calculation.tour_cost_per_guest)}</strong> / khách</span>
                                                </p>
                                                <p className="flex items-center gap-1.5">
                                                    <Home className="w-4 h-4 text-emerald-600 shrink-0" />
                                                    <span>Đã bao trọn gói nơi ở khách sạn chuẩn trong {result.calculation.tour_days} ngày.</span>
                                                </p>
                                                <p className="flex items-center gap-1.5">
                                                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                                                    <span>Bao gồm xe du lịch đưa đón, hướng dẫn viên và vé tham quan danh lam thắng cảnh.</span>
                                                </p>
                                            </div>

                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-4 pt-3 border-t border-emerald-100">
                                                <div>
                                                    <span className="text-xs text-gray-500 font-medium block">
                                                        Tổng gói Tour cho {result.input.guests} khách:
                                                    </span>
                                                    <span className="text-base font-black text-emerald-800">
                                                        {formatCurrency(result.calculation.tour_cost_total)}
                                                    </span>
                                                </div>

                                                <Link
                                                    href={
                                                        result.recommended_tour.id && !result.recommended_tour.id.includes('tour-')
                                                            ? `/tours/${result.recommended_tour.id}`
                                                            : `/tours?destination=${encodeURIComponent(result.input.destination)}`
                                                    }
                                                    className="inline-flex items-center gap-1.5 bg-emerald-700 text-[#FACC15] hover:bg-emerald-800 px-3.5 py-1.5 text-xs font-black uppercase tracking-wider transition-colors rounded-lg shadow-sm shrink-0"
                                                >
                                                    Xem Chi Tiết Tour ➔
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* 5. GỢI Ý 3: KHÁCH SẠN / RESORT NGHỈ DƯỠNG CẦN CHỌN */}
                                <div className="bg-white/95 backdrop-blur-md border border-emerald-200 p-6 shadow-sm rounded-2xl relative overflow-hidden">
                                    <div className="flex items-center justify-between pb-3 border-b border-emerald-100 mb-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-lg bg-emerald-700 text-[#FACC15] flex items-center justify-center font-black text-xs shadow-sm">
                                                03
                                            </div>
                                            <div>
                                                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700 block">
                                                    Nơi Lưu Trú Nghỉ Dưỡng
                                                </span>
                                                <h3 className="text-sm font-black uppercase text-gray-900 flex items-center gap-2">
                                                    <Building2 className="w-4 h-4 text-emerald-600" />
                                                    Khách Sạn / Resort Đề Xuất Cần Chọn
                                                </h3>
                                            </div>
                                        </div>
                                        <span className="text-[11px] font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                                            1 phòng = 2 khách ({result.calculation.rooms_count} phòng cho {result.input.guests} khách)
                                        </span>
                                    </div>

                                    <div className="flex flex-col md:flex-row items-start gap-5 p-4 bg-emerald-50/50 rounded-xl border border-emerald-100">
                                        <div className="relative w-full md:w-48 h-36 shrink-0 bg-gray-100 overflow-hidden rounded-xl border border-emerald-200">
                                            <Image
                                                src={
                                                    result.recommended_hotel.hotel_images?.[0]?.url ||
                                                    'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=400&q=80'
                                                }
                                                alt={result.recommended_hotel.name}
                                                fill
                                                className="object-cover"
                                            />
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-sm sm:text-base font-black uppercase tracking-tight text-gray-900">
                                                {result.recommended_hotel.name}
                                            </h4>
                                            <p className="text-xs text-gray-600 mt-1 flex items-center gap-1 font-medium">
                                                <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                                <span>{result.recommended_hotel.address || result.recommended_hotel.city}</span>
                                            </p>

                                            {/* Logic thông báo số ngày thuê phòng dựa trên tour */}
                                            <div className="mt-3 p-2.5 rounded-lg border text-xs font-medium leading-relaxed bg-white/90 border-emerald-200">
                                                {result.calculation.independent_hotel_days > 0 ? (
                                                    <div className="text-emerald-950 space-y-1">
                                                        <p className="font-bold text-emerald-800 flex items-center gap-1">
                                                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                                            Tổng ở {result.input.days} ngày - Đi Tour {result.calculation.tour_days} ngày (đã gồm KS) ➔ Chỉ cần thuê thêm {result.calculation.independent_hotel_days} ngày khách sạn!
                                                        </p>
                                                        <p className="text-[11px] text-gray-600">
                                                            Công thức: {formatCurrency(result.calculation.hotel_cost_per_night)}/đêm × {result.calculation.independent_hotel_days} đêm × {result.calculation.rooms_count} phòng ({result.input.guests} khách).
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <div className="text-emerald-800 flex items-center gap-2">
                                                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                                        <span>Toàn bộ {result.input.days} ngày đã được phục vụ nơi ở trong chương trình Tour trọn gói ({result.calculation.tour_days} ngày). Không phát sinh tiền thuê phòng ngoài!</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Amenities tags */}
                                            {result.recommended_hotel.amenities && (
                                                <div className="flex flex-wrap gap-1.5 mt-2.5">
                                                    {result.recommended_hotel.amenities.map((am, i) => (
                                                        <span
                                                            key={i}
                                                            className="text-[10px] bg-white border border-emerald-200 px-2 py-0.5 rounded text-emerald-800 font-bold flex items-center gap-1"
                                                        >
                                                            <Check className="w-3 h-3 text-emerald-600" /> {am}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}

                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-4 pt-3 border-t border-emerald-100">
                                                <div>
                                                    <span className="text-xs text-gray-500 font-medium block">
                                                        Tiền phòng thuê thêm ({result.calculation.independent_hotel_days} đêm, {result.calculation.rooms_count} phòng):
                                                    </span>
                                                    <span className="text-base font-black text-emerald-800">
                                                        {formatCurrency(result.calculation.hotel_cost_total)}
                                                    </span>
                                                </div>

                                                <Link
                                                    href={`/hotels?city=${encodeURIComponent(result.recommended_hotel.city)}`}
                                                    className="inline-flex items-center gap-1.5 bg-emerald-700 text-[#FACC15] hover:bg-emerald-800 px-3.5 py-1.5 text-xs font-black uppercase tracking-wider transition-colors rounded-lg shadow-sm shrink-0"
                                                >
                                                    Xem & Đặt Khách Sạn ➔
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* 6. BẢNG TỔNG HỢP DỰ TOÁN COMBO TOÀN CHẶNG (BUDGET BREAKDOWN) */}
                                <div className="bg-white/95 backdrop-blur-md border-2 border-emerald-700 p-6 shadow-md rounded-2xl">
                                    <h3 className="text-sm font-black uppercase tracking-tight text-emerald-950 pb-3 border-b border-emerald-200 flex items-center justify-between">
                                        <span className="flex items-center gap-2">
                                            <Coins className="w-4 h-4 text-emerald-700" />
                                            Bảng Tổng Hợp Dự Toán Trọn Gói ({result.input.guests} Khách)
                                        </span>
                                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                                    </h3>

                                    <div className="divide-y divide-emerald-100 text-xs py-2">
                                        {/* Vé máy bay */}
                                        <div className="py-2.5 flex justify-between items-center">
                                            <span className="text-gray-700 font-medium">
                                                1. Vé máy bay khứ hồi ({result.input.departureCity} ➔ {result.input.destination}, {result.input.guests} khách):
                                            </span>
                                            <span className="font-bold text-gray-900 font-mono">
                                                {formatCurrency(result.calculation.flight_cost_total)}
                                            </span>
                                        </div>

                                        {/* Tour du lịch */}
                                        <div className="py-2.5 flex justify-between items-center">
                                            <span className="text-gray-700 font-medium">
                                                2. Tour du lịch {result.calculation.tour_days} ngày ({result.input.guests} khách, đã bao gồm khách sạn trong tour):
                                            </span>
                                            <span className="font-bold text-gray-900 font-mono">
                                                {formatCurrency(result.calculation.tour_cost_total)}
                                            </span>
                                        </div>

                                        {/* Khách sạn thuê riêng */}
                                        <div className="py-2.5 flex justify-between items-center">
                                            <span className="text-gray-700 font-medium">
                                                3. Khách sạn thuê thêm ngoài tour ({result.calculation.independent_hotel_days} đêm × {result.calculation.rooms_count} phòng):
                                            </span>
                                            <span className="font-bold text-gray-900 font-mono">
                                                {formatCurrency(result.calculation.hotel_cost_total)}
                                            </span>
                                        </div>

                                        {/* Chi phí ăn uống tự do */}
                                        <div className="py-2.5 flex justify-between items-center">
                                            <span className="text-gray-700 font-medium">
                                                4. Chi tiêu ăn uống & cà phê tự túc ngoài tour ({result.input.guests} khách):
                                            </span>
                                            <span className="font-bold text-gray-900 font-mono">
                                                {formatCurrency(result.calculation.incidentals)}
                                            </span>
                                        </div>

                                        {/* Tổng cộng */}
                                        <div className="py-3 flex justify-between items-center text-sm font-black bg-emerald-50 px-3 mt-1 rounded-lg border border-emerald-200">
                                            <span className="uppercase tracking-wider text-emerald-950">
                                                Tổng Dự Toán Combo Toàn Bộ:
                                            </span>
                                            <span className="text-emerald-800 text-base font-mono">
                                                {formatCurrency(result.calculation.grand_total)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* So sánh với ngân sách */}
                                    <div className={`mt-3 p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
                                        result.calculation.diff_with_budget >= 0
                                            ? 'bg-green-50/90 border-green-300 text-green-900'
                                            : 'bg-amber-50/90 border-amber-300 text-amber-900'
                                    }`}>
                                        <Sparkles className="w-4 h-4 text-emerald-700 shrink-0" />
                                        <span>
                                            {result.calculation.diff_with_budget >= 0
                                                ? `Ngân sách dự kiến ban đầu: ${formatCurrency(result.input.budget)} ➔ Bạn tiết kiệm được ${formatCurrency(result.calculation.diff_with_budget)} (${Math.round((result.calculation.diff_with_budget / result.input.budget) * 100)}%)!`
                                                : `Ngân sách dự kiến ban đầu: ${formatCurrency(result.input.budget)} ➔ Dự toán tối ưu cho dịch vụ 5 sao chênh lệch ${formatCurrency(Math.abs(result.calculation.diff_with_budget))}.`}
                                        </span>
                                    </div>

                                    <div className="mt-5 flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-emerald-100">
                                        <p className="text-[11px] text-gray-600">
                                            Mọi dịch vụ có thể linh hoạt tùy chỉnh hoặc đặt theo yêu cầu riêng của quý khách.
                                        </p>
                                        <Link
                                            href="/combos"
                                            className="w-full sm:w-auto bg-emerald-700 text-[#FACC15] hover:bg-emerald-800 py-2.5 px-6 text-xs font-black uppercase tracking-wider text-center transition-colors shrink-0 rounded-lg shadow-sm"
                                        >
                                            Khám Phá Thêm Gói Combo ➔
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

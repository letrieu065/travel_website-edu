'use client';

/**
 * ============================================================================
 * MODULE DESTINATIONS - CLIENT PAGE (Trang Khám Phá Điểm Đến Natura Travel)
 * ============================================================================
 * Chịu trách nhiệm:
 * - Trưng bày danh mục các điểm đến du lịch chọn lọc (Việt Nam & Quốc tế).
 * - Bộ lọc theo vùng miền (Miền Bắc, Miền Trung, Miền Nam, Quốc tế) và phong cách trải nghiệm.
 * - Tìm kiếm điểm đến nhanh theo từ khóa.
 * - Liên kết trực tiếp tới Tours, Khách sạn và Vé máy bay tương ứng với từng điểm đến.
 * ============================================================================
 */

import React, { useState, useMemo, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import {
    MapPin,
    Search,
    Compass,
    Calendar,
    ArrowRight,
    Plane,
    Building2,
    Ticket,
    Sparkles,
    RotateCcw,
    CheckCircle2,
} from 'lucide-react';

interface DestinationItem {
    id: string;
    name: string;
    province: string;
    region: 'north' | 'central' | 'south';
    regionName: string;
    category: 'beach' | 'culture' | 'nature' | 'resort';
    categoryName: string;
    tag: string;
    image: string;
    description: string;
    idealSeason: string;
    highlights: string[];
    tourQuery: string;
    hotelCity: string;
    airportQuery: string;
    tourCount: number;
    rating: number;
}

const DESTINATIONS_DATA: DestinationItem[] = [
    {
        id: 'ha-long',
        name: 'Vịnh Hạ Long',
        province: 'Quảng Ninh',
        region: 'north',
        regionName: 'Miền Bắc',
        category: 'nature',
        categoryName: 'Thiên Nhiên & Núi Rừng',
        tag: 'Kỳ quan thiên nhiên thế giới',
        image: 'https://images.unsplash.com/photo-1528127269322-539801943592?q=80&w=1200&auto=format&fit=crop',
        description: 'Hàng ngàn hòn đảo đá vôi kỳ vĩ vươn lên giữa làn nước ngọc bích phẳng lặng. Trải nghiệm du thuyền ngủ đêm sang trọng và chèo kayak qua các hang động triệu năm.',
        idealSeason: 'Tháng 3 - Tháng 5 & Tháng 9 - Tháng 11',
        highlights: ['Du thuyền 5 sao vịnh Lan Hạ', 'Chèo Kayak hang Luồn', 'Ngắm hoàng hôn trên đảo Ti Tốp'],
        tourQuery: 'Hạ Long',
        hotelCity: 'Hạ Long',
        airportQuery: 'Hải Phòng',
        tourCount: 18,
        rating: 4.9,
    },
    {
        id: 'da-nang-hoi-an',
        name: 'Đà Nẵng & Hội An',
        province: 'Đà Nẵng - Quảng Nam',
        region: 'central',
        regionName: 'Miền Trung',
        category: 'culture',
        categoryName: 'Di Sản & Văn Hóa',
        tag: 'Di sản & Biển xanh',
        image: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?q=80&w=1200&auto=format&fit=crop',
        description: 'Sự hòa quyện tuyệt vời giữa nhịp sống năng động của thành phố biển đáng sống nhất Việt Nam và nét hoài cổ trầm lắng của phố cổ đèn lồng bên sông Hoài.',
        idealSeason: 'Tháng 2 - Tháng 8',
        highlights: ['Check-in Cầu Vàng Bà Nà Hills', 'Thả đèn hoa đăng phố cổ Hội An', 'Lặn ngắm san hô Cù Lao Chàm'],
        tourQuery: 'Đà Nẵng',
        hotelCity: 'Đà Nẵng',
        airportQuery: 'Đà Nẵng',
        tourCount: 26,
        rating: 4.95,
    },
    {
        id: 'phu-quoc',
        name: 'Đảo Ngọc Phú Quốc',
        province: 'Kiên Giang',
        region: 'south',
        regionName: 'Miền Nam',
        category: 'beach',
        categoryName: 'Biển & Đảo',
        tag: 'Nghỉ dưỡng nhiệt đới',
        image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=1200&auto=format&fit=crop',
        description: 'Bờ cát trắng mịn trải dài bên làn nước ngọc lam ấm áp, hoàng hôn rực rỡ nhất dải đất hình chữ S và những resort đẳng cấp quốc tế ẩn mình giữa rừng nguyên sinh.',
        idealSeason: 'Tháng 10 - Tháng 4 năm sau',
        highlights: ['Cáp treo Hòn Thơm vượt biển', 'Tour cano 4 đảo ngắm san hô', 'Ngắm hoàng hôn tại Sunset Sanato'],
        tourQuery: 'Phú Quốc',
        hotelCity: 'Phú Quốc',
        airportQuery: 'Phú Quốc',
        tourCount: 22,
        rating: 4.88,
    },
    {
        id: 'sa-pa',
        name: 'Sa Pa & Fansipan',
        province: 'Lào Cai',
        region: 'north',
        regionName: 'Miền Bắc',
        category: 'nature',
        categoryName: 'Thiên Nhiên & Núi Rừng',
        tag: 'Nóc nhà Đông Dương',
        image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1200&auto=format&fit=crop',
        description: 'Bức tranh thổ cẩm sống động với những thung lũng ruộng bậc thang uốn lượn mờ ảo trong mây ngàn và đỉnh thiêng Fansipan hùng vĩ cao 3.143m.',
        idealSeason: 'Tháng 9 - Tháng 11 & Tháng 12 - Tháng 2 (Săn tuyết)',
        highlights: ['Chinh phục đỉnh thiêng Fansipan', 'Trekking bản Cát Cát - Tả Van', 'Thưởng thức ẩm thực lẩu cá tầm'],
        tourQuery: 'Sa Pa',
        hotelCity: 'Sa Pa',
        airportQuery: 'Hà Nội',
        tourCount: 15,
        rating: 4.85,
    },
    {
        id: 'ninh-binh',
        name: 'Ninh Bình (Tràng An - Tam Cốc)',
        province: 'Ninh Bình',
        region: 'north',
        regionName: 'Miền Bắc',
        category: 'culture',
        categoryName: 'Di Sản & Văn Hóa',
        tag: 'Vịnh Hạ Long trên cạn',
        image: 'https://images.unsplash.com/photo-1570789210967-2cac24afeb00?q=80&w=1200&auto=format&fit=crop',
        description: 'Quần thể danh thắng di sản thế giới hỗn hợp đầu tiên của Đông Nam Á với non nước hữu tình, những dòng sông ngầm xuyên qua thạch động huyền bí.',
        idealSeason: 'Tháng 1 - Tháng 3 & Tháng 5 - Tháng 6 (Mùa lúa chín)',
        highlights: ['Đi thuyền nan Tràng An - Tam Cốc', 'Leo đỉnh Hang Múa ngắm toàn cảnh', 'Thăm cố đô Hoa Lư ngàn năm'],
        tourQuery: 'Ninh Bình',
        hotelCity: 'Ninh Bình',
        airportQuery: 'Hà Nội',
        tourCount: 12,
        rating: 4.9,
    },
    {
        id: 'nha-trang',
        name: 'Nha Trang & Vịnh Cam Ranh',
        province: 'Khánh Hòa',
        region: 'central',
        regionName: 'Miền Trung',
        category: 'beach',
        categoryName: 'Biển & Đảo',
        tag: 'Vịnh ngọc nhiệt đới',
        image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1200&auto=format&fit=crop',
        description: 'Vịnh biển được mệnh danh là một trong những vịnh đẹp nhất thế giới với bờ biển cát vàng hình cánh cung, các đảo san hô đa sắc màu và suối khoáng nóng thư giãn.',
        idealSeason: 'Tháng 1 - Tháng 8',
        highlights: ['Lặn biển san hô Hòn Mun', 'Vui chơi giải trí đỉnh cao VinWonders', 'Thư giãn tắm bùn khoáng I-Resort'],
        tourQuery: 'Nha Trang',
        hotelCity: 'Nha Trang',
        airportQuery: 'Nha Trang',
        tourCount: 20,
        rating: 4.82,
    },
    {
        id: 'da-lat',
        name: 'Đà Lạt - Thành Phố Sương Mù',
        province: 'Lâm Đồng',
        region: 'central',
        regionName: 'Miền Trung',
        category: 'resort',
        categoryName: 'Nghỉ Dưỡng',
        tag: 'Xứ sở ngàn hoa & sương mờ',
        image: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?q=80&w=1200&auto=format&fit=crop',
        description: 'Khí hậu cao nguyên se lạnh quanh năm, những đồi thông reo trong gió, biệt thự kiểu Pháp cổ kính và những vườn hoa khoe sắc bốn mùa.',
        idealSeason: 'Tháng 11 - Tháng 4 năm sau',
        highlights: ['Săn mây đồi chè Cầu Đất', 'Check-in các quán cà phê ngắm hoàng hôn', 'Khám phá ẩm thực chợ đêm Đà Lạt'],
        tourQuery: 'Đà Lạt',
        hotelCity: 'Đà Lạt',
        airportQuery: 'Đà Lạt',
        tourCount: 16,
        rating: 4.87,
    },
    {
        id: 'ha-giang',
        name: 'Hà Giang & Cao Nguyên Đá',
        province: 'Hà Giang',
        region: 'north',
        regionName: 'Miền Bắc',
        category: 'nature',
        categoryName: 'Thiên Nhiên & Núi Rừng',
        tag: 'Cung đường phượt huyền thoại',
        image: 'https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?q=80&w=1200&auto=format&fit=crop',
        description: 'Nơi địa đầu Tổ quốc với công viên địa chất toàn cầu cao nguyên đá Đồng Văn, dòng sông Nho Quế màu ngọc bích uốn lượn dưới hẻm vực Tu Sản sâu nhất Đông Nam Á.',
        idealSeason: 'Tháng 9 - Tháng 11 (Mùa hoa tam giác mạch)',
        highlights: ['Chinh phục đèo Mã Pí Lèng', 'Đi thuyền hẻm Tu Sản sông Nho Quế', 'Cột cờ quốc gia Lũng Cú'],
        tourQuery: 'Hà Giang',
        hotelCity: 'Hà Giang',
        airportQuery: 'Hà Nội',
        tourCount: 10,
        rating: 4.96,
    },
    {
        id: 'ha-noi',
        name: 'Thủ Đô Hà Nội (36 Phố Phường)',
        province: 'Hà Nội',
        region: 'north',
        regionName: 'Miền Bắc',
        category: 'culture',
        categoryName: 'Di Sản & Văn Hóa',
        tag: 'Dấu ấn ngàn năm văn hiến',
        image: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=1200&auto=format&fit=crop',
        description: 'Trái tim của đất nước với Hồ Gươm cổ kính, 36 phố phường rêu phong, Hoàng thành Thăng Long trầm mặc cùng nền ẩm thực phở, bún chả trứ danh toàn cầu.',
        idealSeason: 'Tháng 9 - Tháng 11 (Mùa thu hoa sữa)',
        highlights: ['Dạo bước quanh Hồ Gươm & Tháp Rùa', 'Thưởng thức cà phê trứng phố cổ', 'Thăm Văn Miếu - Quốc Tử Giám'],
        tourQuery: 'Hà Nội',
        hotelCity: 'Hà Nội',
        airportQuery: 'Hà Nội',
        tourCount: 24,
        rating: 4.93,
    },
    {
        id: 'hue',
        name: 'Cố Đô Huế - Di Sản Sông Hương',
        province: 'Thừa Thiên Huế',
        region: 'central',
        regionName: 'Miền Trung',
        category: 'culture',
        categoryName: 'Di Sản & Văn Hóa',
        tag: 'Nét vàng son triều Nguyễn',
        image: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?q=80&w=1200&auto=format&fit=crop',
        description: 'Quần thể di tích Cố đô Huế uy nghiêm bên dòng sông Hương thơ mộng, lăng tẩm các vị vua triều Nguyễn và nhã nhạc cung đình Huế kiệt tác phi vật thể.',
        idealSeason: 'Tháng 1 - Tháng 4',
        highlights: ['Thăm Hoàng Thành Đại Nội Huế', 'Nghe ca Huế trên thuyền rồng sông Hương', 'Thưởng thức ẩm thực cung đình & bánh Huế'],
        tourQuery: 'Huế',
        hotelCity: 'Huế',
        airportQuery: 'Huế',
        tourCount: 14,
        rating: 4.91,
    },
    {
        id: 'quy-nhon',
        name: 'Quy Nhơn & Eo Gió',
        province: 'Bình Định',
        region: 'central',
        regionName: 'Miền Trung',
        category: 'beach',
        categoryName: 'Biển & Đảo',
        tag: 'Maldives thu nhỏ của Việt Nam',
        image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1200&auto=format&fit=crop',
        description: 'Những vách đá kỳ vĩ ôm trọn bờ biển ngọc tại Eo Gió, bãi tắm Kỳ Co trong vắt đáy cát và không gian nghỉ dưỡng thanh bình, hoang sơ của xứ võ Bình Định.',
        idealSeason: 'Tháng 3 - Tháng 9',
        highlights: ['Check-in cung đường ven biển Eo Gió', 'Lặn biển ngắm san hô Kỳ Co', 'Khám phá tháp đôi Chăm Pa cổ kính'],
        tourQuery: 'Quy Nhơn',
        hotelCity: 'Quy Nhơn',
        airportQuery: 'Quy Nhơn',
        tourCount: 11,
        rating: 4.86,
    },
    {
        id: 'ho-chi-minh',
        name: 'TP. Hồ Chí Minh (Sài Gòn)',
        province: 'TP. Hồ Chí Minh',
        region: 'south',
        regionName: 'Miền Nam',
        category: 'culture',
        categoryName: 'Di Sản & Văn Hóa',
        tag: 'Hòn ngọc Viễn Đông hiện đại',
        image: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?q=80&w=1200&auto=format&fit=crop',
        description: 'Trung tâm kinh tế - văn hóa sôi động bậc nhất Việt Nam, nơi giao thoa giữa kiến trúc Pháp cổ điển và những tòa nhà chọc trời rực rỡ ánh đèn về đêm.',
        idealSeason: 'Tháng 12 - Tháng 4 năm sau',
        highlights: ['Ngắm toàn cảnh Sài Gòn từ Landmark 81', 'Du ngoạn du thuyền buýt trên sông Sài Gòn', 'Khám phá ẩm thực đường phố chợ Bến Thành'],
        tourQuery: 'Hồ Chí Minh',
        hotelCity: 'Hồ Chí Minh',
        airportQuery: 'Hồ Chí Minh',
        tourCount: 20,
        rating: 4.9,
    },
    {
        id: 'can-tho',
        name: 'Cần Thơ & Chợ Nổi Cái Răng',
        province: 'Cần Thơ',
        region: 'south',
        regionName: 'Miền Nam',
        category: 'nature',
        categoryName: 'Thiên Nhiên & Núi Rừng',
        tag: 'Hồn sông nước Miền Tây',
        image: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?q=80&w=1200&auto=format&fit=crop',
        description: 'Thủ phủ miền Tây sông nước trù phú với nét văn hóa giao thương độc đáo trên chợ nổi Cái Răng lúc bình minh, vườn trái cây bạt ngàn và đờn ca tài tử Nam Bộ.',
        idealSeason: 'Tháng 5 - Tháng 8 (Mùa trái cây chín rộ)',
        highlights: ['Đi xuồng máy chợ nổi Cái Răng', 'Thưởng thức hủ tiếu pizza độc lạ', 'Ghé thăm nhà cổ Bình Thủy'],
        tourQuery: 'Cần Thơ',
        hotelCity: 'Cần Thơ',
        airportQuery: 'Cần Thơ',
        tourCount: 9,
        rating: 4.84,
    },
    {
        id: 'con-dao',
        name: 'Côn Đảo Huyền Thoại',
        province: 'Bà Rịa - Vũng Tàu',
        region: 'south',
        regionName: 'Miền Nam',
        category: 'resort',
        categoryName: 'Nghỉ Dưỡng',
        tag: 'Thiên đường sinh thái biển',
        image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=1200&auto=format&fit=crop',
        description: 'Hòn đảo biệt lập với vẻ đẹp thiên nhiên hoang sơ tuyệt mỹ, rạn san hô nguyên vẹn, bãi Đầm Trầu thơ mộng và những di tích lịch sử linh thiêng hào hùng.',
        idealSeason: 'Tháng 3 - Tháng 9 (Mùa rùa đẻ trứng)',
        highlights: ['Xem rùa biển đẻ trứng tại Hòn Bảy Cạnh', 'Viếng nghĩa trang Hàng Dương linh thiêng', 'Tắm biển bãi Đầm Trầu ngắm máy bay hạ cánh'],
        tourQuery: 'Côn Đảo',
        hotelCity: 'Côn Đảo',
        airportQuery: 'Côn Đảo',
        tourCount: 8,
        rating: 4.97,
    },
];

function DestinationsContent() {
    const searchParams = useSearchParams();
    const initialRegion = searchParams.get('region') || 'all';
    const initialCategory = searchParams.get('category') || 'all';

    const [searchKeyword, setSearchKeyword] = useState('');
    const [selectedRegion, setSelectedRegion] = useState<string>(initialRegion);
    const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);

    // Lọc danh sách điểm đến
    const filteredDestinations = useMemo(() => {
        return DESTINATIONS_DATA.filter((dest) => {
            const matchKeyword =
                !searchKeyword.trim() ||
                dest.name.toLowerCase().includes(searchKeyword.toLowerCase()) ||
                dest.province.toLowerCase().includes(searchKeyword.toLowerCase()) ||
                dest.description.toLowerCase().includes(searchKeyword.toLowerCase()) ||
                dest.highlights.some((h) => h.toLowerCase().includes(searchKeyword.toLowerCase()));

            const matchRegion = selectedRegion === 'all' || dest.region === selectedRegion;
            const matchCategory = selectedCategory === 'all' || dest.category === selectedCategory;

            return matchKeyword && matchRegion && matchCategory;
        });
    }, [searchKeyword, selectedRegion, selectedCategory]);

    const handleResetFilters = () => {
        setSearchKeyword('');
        setSelectedRegion('all');
        setSelectedCategory('all');
    };

    return (
        <div className="w-full min-h-screen bg-[#FDFBF7] pb-24 text-gray-900">
            {/* 1. Hero Header */}
            <section className="relative text-white pt-16 pb-28 md:pt-20 md:pb-36 px-6 overflow-hidden">
                <Image
                    src="/images/headers/destinations-header.jpg"
                    alt="Kỳ quan điểm đến du lịch non nước Việt Nam"
                    fill
                    priority
                    quality={95}
                    className="object-cover object-center opacity-100"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/65 via-black/25 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />

                <div className="max-w-7xl mx-auto relative z-10">
                    <div className="inline-flex items-center gap-2 bg-[#FACC15] text-black px-3.5 py-1 text-xs font-black uppercase tracking-widest mb-4 shadow-sm">
                        <Compass className="w-4 h-4" /> Natura Travel Guide · Điểm Đến Chọn Lọc
                    </div>
                    <h1 className="text-3xl sm:text-5xl md:text-6xl font-black uppercase tracking-tight text-white max-w-4xl leading-tight drop-shadow-[0_2px_12px_rgba(0,0,0,0.85)]">
                        Những Miền Đất Đáng Đến Nhất
                    </h1>
                    <p className="mt-4 text-gray-100 text-sm sm:text-base max-w-2xl leading-relaxed font-medium drop-shadow-[0_1px_6px_rgba(0,0,0,0.8)]">
                        Từ những kỳ quan thiên nhiên ngoạn mục tại Việt Nam đến những thành phố lịch sử và hòn đảo nhiệt đới quyến rũ trên toàn cầu.
                    </p>

                    {/* Search Bar - ĐÈ LÊN ẢNH HERO */}
                    <div className="mt-8 max-w-2xl relative z-20">
                        <div className="relative flex items-center bg-white border border-gray-200 shadow-2xl">
                            <Search className="w-5 h-5 text-gray-400 ml-4 shrink-0" />
                            <input
                                type="text"
                                placeholder="Tìm điểm đến tại Việt Nam (ví dụ: Hạ Long, Đà Nẵng, Phú Quốc, Sa Pa, Đà Lạt...)"
                                value={searchKeyword}
                                onChange={(e) => setSearchKeyword(e.target.value)}
                                className="w-full px-4 py-3.5 text-sm text-black placeholder-gray-400 focus:outline-none font-medium bg-transparent"
                            />
                            {searchKeyword && (
                                <button
                                    type="button"
                                    onClick={() => setSearchKeyword('')}
                                    className="mr-3 text-xs font-bold uppercase text-gray-400 hover:text-black px-2 py-1"
                                >
                                    Xóa
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* 2. Filter Navigation Bar */}
            <div className="bg-white border-b border-gray-200 sticky top-[73px] z-30 shadow-sm">
                <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    {/* Region Filter */}
                    <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-none">
                        <span className="text-xs font-black uppercase tracking-wider text-gray-400 mr-2 shrink-0">
                            Khu Vực:
                        </span>
                        {[
                            { id: 'all', label: 'Tất cả (Toàn Quốc)' },
                            { id: 'north', label: 'Miền Bắc' },
                            { id: 'central', label: 'Miền Trung' },
                            { id: 'south', label: 'Miền Nam' },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setSelectedRegion(tab.id)}
                                className={`px-3 py-1.5 text-xs font-black uppercase tracking-wider transition-colors shrink-0 ${
                                    selectedRegion === tab.id
                                        ? 'bg-black text-[#FACC15]'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Category Filter */}
                    <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-none">
                        <span className="text-xs font-black uppercase tracking-wider text-gray-400 mr-2 shrink-0">
                            Loại hình:
                        </span>
                        {[
                            { id: 'all', label: 'Tất cả' },
                            { id: 'beach', label: 'Biển & Đảo' },
                            { id: 'nature', label: 'Núi non & Rừng' },
                            { id: 'culture', label: 'Di sản & Văn hóa' },
                            { id: 'resort', label: 'Nghỉ dưỡng' },
                        ].map((cat) => (
                            <button
                                key={cat.id}
                                type="button"
                                onClick={() => setSelectedCategory(cat.id)}
                                className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors shrink-0 ${
                                    selectedCategory === cat.id
                                        ? 'border-b-2 border-black text-black font-black'
                                        : 'text-gray-500 hover:text-black'
                                }`}
                            >
                                {cat.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* 3. Main Destinations Grid */}
            <main className="max-w-7xl mx-auto px-6 pt-10">
                <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-200">
                    <p className="text-xs font-black uppercase tracking-wider text-gray-700">
                        Hiển thị <span className="text-black font-black text-sm">{filteredDestinations.length}</span> điểm đến tuyệt mỹ
                    </p>
                    {(searchKeyword || selectedRegion !== 'all' || selectedCategory !== 'all') && (
                        <button
                            type="button"
                            onClick={handleResetFilters}
                            className="inline-flex items-center gap-1.5 text-xs font-black uppercase text-red-600 hover:underline"
                        >
                            <RotateCcw className="w-3.5 h-3.5" /> Đặt lại bộ lọc
                        </button>
                    )}
                </div>

                {filteredDestinations.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredDestinations.map((dest) => (
                            <article
                                key={dest.id}
                                className="bg-white border border-gray-200 shadow-sm hover:shadow-xl transition-shadow duration-300 flex flex-col justify-between group overflow-hidden"
                            >
                                <div>
                                    {/* Image Header */}
                                    <div className="relative h-64 w-full overflow-hidden bg-gray-100">
                                        <Image
                                            src={dest.image}
                                            alt={dest.name}
                                            fill
                                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                            className="object-cover group-hover:scale-105 transition-transform duration-700"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                                        {/* Top Badges */}
                                        <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
                                            <span className="bg-[#FACC15] text-black px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider">
                                                {dest.tag}
                                            </span>
                                            <span className="bg-black/75 backdrop-blur-sm text-white px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                                                {dest.regionName}
                                            </span>
                                        </div>

                                        {/* Bottom Image Info */}
                                        <div className="absolute bottom-4 left-4 right-4 text-white">
                                            <h3 className="text-2xl font-black uppercase tracking-tight leading-tight">
                                                {dest.name}
                                            </h3>
                                            <p className="text-xs text-gray-200 flex items-center gap-1 mt-1 font-medium">
                                                <MapPin className="w-3.5 h-3.5 text-[#FACC15]" />
                                                {dest.province}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Content Body */}
                                    <div className="p-6">
                                        <p className="text-xs text-gray-600 leading-relaxed font-medium line-clamp-3">
                                            {dest.description}
                                        </p>

                                        {/* Ideal Season */}
                                        <div className="mt-4 pt-4 border-t border-gray-100 flex items-start gap-2 text-xs text-gray-700">
                                            <Calendar className="w-4 h-4 text-gray-500 shrink-0 mt-0.5" />
                                            <div>
                                                <span className="font-bold text-gray-900 block uppercase text-[10px] tracking-wider">
                                                    Thời điểm lý tưởng:
                                                </span>
                                                <span className="font-medium text-gray-600">{dest.idealSeason}</span>
                                            </div>
                                        </div>

                                        {/* Highlights list */}
                                        <div className="mt-4">
                                            <span className="font-bold text-gray-900 block uppercase text-[10px] tracking-wider mb-2">
                                                Trải nghiệm không thể bỏ lỡ:
                                            </span>
                                            <ul className="space-y-1.5">
                                                {dest.highlights.map((h, i) => (
                                                    <li key={i} className="text-xs text-gray-600 flex items-center gap-2">
                                                        <CheckCircle2 className="w-3.5 h-3.5 text-[#FACC15] shrink-0" />
                                                        <span>{h}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                </div>

                                {/* Card Footer Actions */}
                                <div className="p-6 pt-0 border-t border-gray-100 bg-gray-50/50">
                                    <div className="flex flex-col gap-2 pt-4">
                                        <Link
                                            href={`/tours?destination=${encodeURIComponent(dest.tourQuery)}`}
                                            className="w-full bg-black text-[#FACC15] hover:bg-gray-800 py-2.5 px-4 text-xs font-black uppercase tracking-wider text-center transition-colors flex items-center justify-center gap-2"
                                        >
                                            <Ticket className="w-4 h-4" />
                                            Khám Phá Tours ({dest.tourCount}+ Tours)
                                            <ArrowRight className="w-3.5 h-3.5" />
                                        </Link>

                                        <div className="grid grid-cols-2 gap-2">
                                            <Link
                                                href={`/hotels?city=${encodeURIComponent(dest.hotelCity)}`}
                                                className="bg-white border border-gray-200 hover:border-black text-gray-800 py-2 px-3 text-[11px] font-bold uppercase tracking-wider text-center transition-colors flex items-center justify-center gap-1.5"
                                            >
                                                <Building2 className="w-3.5 h-3.5" /> Khách Sạn
                                            </Link>
                                            <Link
                                                href={`/flights?arrival_airport=${encodeURIComponent(dest.airportQuery)}`}
                                                className="bg-white border border-gray-200 hover:border-black text-gray-800 py-2 px-3 text-[11px] font-bold uppercase tracking-wider text-center transition-colors flex items-center justify-center gap-1.5"
                                            >
                                                <Plane className="w-3.5 h-3.5" /> Vé Máy Bay
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                ) : (
                    /* Empty State */
                    <div className="text-center py-20 bg-white border border-gray-200 px-6">
                        <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <h3 className="text-lg font-black uppercase tracking-wider text-gray-900">
                            Không tìm thấy điểm đến nào
                        </h3>
                        <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
                            Không có điểm đến phù hợp với từ khóa &quot;{searchKeyword}&quot; trong bộ lọc đã chọn. Vui lòng thử tìm kiếm khác.
                        </p>
                        <button
                            type="button"
                            onClick={handleResetFilters}
                            className="mt-6 inline-flex items-center gap-2 bg-black text-[#FACC15] px-6 py-2.5 text-xs font-black uppercase tracking-wider hover:bg-gray-800 transition-colors"
                        >
                            <RotateCcw className="w-4 h-4" /> Xóa bộ lọc và xem tất cả
                        </button>
                    </div>
                )}

                {/* 4. AI Travel Planner Promotion Banner */}
                <section className="mt-16 bg-black text-white p-8 md:p-12 border border-gray-800 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="max-w-2xl">
                        <div className="inline-flex items-center gap-2 bg-[#FACC15] text-black px-3 py-0.5 text-[10px] font-black uppercase tracking-widest mb-3">
                            <Sparkles className="w-3.5 h-3.5" /> AI Lập Kế Hoạch Độc Quyền
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white">
                            Chưa Biết Nên Đi Đâu? Để AI Gợi Ý Lịch Trình Cho Bạn
                        </h2>
                        <p className="text-xs sm:text-sm text-gray-300 mt-2 font-medium leading-relaxed">
                            Chỉ cần nhập sở thích, thời gian và ngân sách, trợ lý du lịch AI của Natura Travel sẽ thiết kế cho bạn hành trình chi tiết từng ngày trong tích tắc.
                        </p>
                    </div>
                    <Link
                        href="/ai-planner"
                        className="bg-[#FACC15] text-black hover:bg-yellow-400 font-black text-xs uppercase tracking-widest px-8 py-3.5 transition-colors shrink-0 inline-flex items-center gap-2"
                    >
                        Khám Phá AI Planner <ArrowRight className="w-4 h-4" />
                    </Link>
                </section>
            </main>
        </div>
    );
}

export default function DestinationsPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center text-xs font-black uppercase tracking-widest text-gray-500">
                    Đang tải danh sách điểm đến...
                </div>
            }
        >
            <DestinationsContent />
        </Suspense>
    );
}

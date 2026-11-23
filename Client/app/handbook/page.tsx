'use client';

/**
 * ============================================================================
 * MODULE HANDBOOK - CẨM NANG DU LỊCH NATURA TRAVEL
 * ============================================================================
 * - Nạp dữ liệu tự động trực tiếp từ Database Supabase qua API Backend (/api/v1/handbook)
 * - 1 thanh lọc danh mục duy nhất: Tất cả cẩm nang / Hành lý / Ẩm thực / Kỹ năng & mẹo hay
 * - Tìm kiếm từ khóa theo thời gian thực (realtime search)
 * - Xem chi tiết bài viết qua modal đọc bài phong cách Lonely Planet
 * ============================================================================
 */

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import {
    Compass,
    Backpack,
    UtensilsCrossed,
    Lightbulb,
    Search,
    Clock,
    BookOpen,
    Check,
    ArrowRight,
    X,
    Loader2,
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3600';

/* ============================== TYPES ============================== */

export type HandbookCategory = 'all' | 'packing' | 'food' | 'skills';

export interface HandbookArticle {
    id: string;
    title: string;
    category: 'packing' | 'food' | 'skills';
    summary: string;
    image_url: string;
    read_time: string;
    content: string[];
    tips?: string[];
}

/* ============================== DỮ LIỆU DỰ PHÒNG (FALLBACK) ============================== */

const FALLBACK_HANDBOOK_ARTICLES: HandbookArticle[] = [
    {
        id: '1',
        title: 'Checklist Hành Lý Đi Biển Mùa Hè: Đóng Gói Vali Gọn Nhẹ & Chuẩn Nhất',
        category: 'packing',
        summary: 'Danh sách những vật dụng bắt buộc phải có cho chuyến du lịch biển: kem chống nắng an toàn, túi chống nước, trang phục mau khô và đồ sơ cứu cơ bản.',
        image_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
        read_time: '5 phút đọc',
        content: [
            'Du lịch biển mùa hè luôn là lựa chọn hàng đầu, tuy nhiên ánh nắng gắt gao và môi trường muối biển đòi hỏi bạn cần có sự chuẩn bị kỹ lưỡng về trang phục cũng như đồ dùng bảo vệ sức khỏe.',
            'Về trang phục: Hãy ưu tiên các chất liệu thoáng khí như linen, đũi hoặc thun cotton mát. Chuẩn bị ít nhất 2 bộ đồ bơi và 1 đôi dép xỏ ngón đế cao su chống trơn trượt trên mạn cano hoặc mỏm đá.',
            'Về thiết bị và đồ bảo hộ: Túi chống nước chuyên dụng cho điện thoại là vật bất ly thân khi tham gia các hoạt động lặn ngắm san hô hoặc chèo thuyền kayak. Đừng quên mang mũ rộng vành và kính râm có lớp lọc phân cực chống lóa.',
            'Về y tế cá nhân: Luôn thủ sẵn thuốc chống dị ứng hải sản, men tiêu hóa, thuốc say sóng và xịt chống muỗi côn trùng.'
        ],
        tips: [
            'Sử dụng kem chống nắng Reef-Safe để bảo vệ các rạn san hô tự nhiên.',
            'Uống thuốc say sóng trước khi bước lên tàu/cano ít nhất 30 phút.',
            'Cuộn tròn quần áo thay vì gấp phẳng để tiết kiệm 40% diện tích vali.'
        ]
    },
    {
        id: '2',
        title: 'Quy Định Hành Lý Xách Tay & Ký Gửi Khi Đi Máy Bay Mới Nhất',
        category: 'packing',
        summary: 'Nắm rõ kích thước vali xách tay chuẩn, mức giới hạn pin sạc dự phòng, dung tích chất lỏng và các đồ dùng bị cấm để qua cửa an ninh sân bay suôn sẻ.',
        image_url: 'https://images.unsplash.com/photo-1569154941061-e231b4725ef1?auto=format&fit=crop&w=1200&q=80',
        read_time: '6 phút đọc',
        content: [
            'Hành lý xách tay tiêu chuẩn của hầu hết các hãng hàng không nội địa quy định kích thước không vượt quá 56cm x 36cm x 23cm với trọng lượng phổ biến từ 7kg đến 10kg/12kg (tùy hạng vé).',
            'Quy định chất lỏng: Mỗi chai lọ đựng dung dịch xách tay không được vượt quá 100ml. Tổng dung tích tối đa không quá 1.000ml và phải được đựng trong túi zip trong suốt.',
            'Pin sạc dự phòng (Powerbank): Bắt buộc phải để trong hành lý xách tay, TUYỆT ĐỐI không để trong hành lý ký gửi vì nguy cơ cháy nổ dưới khoang hàng. Dung lượng tối đa được phép là 20.000mAh (dưới 100Wh).'
        ],
        tips: [
            'Không để tiền mặt, trang sức đắt tiền và giấy tờ tùy thân trong hành lý ký gửi.',
            'Dán thẻ tên hoặc đánh dấu ruy-băng màu nổi bật lên vali để tránh lấy nhầm tại băng chuyền.',
            'Kiểm tra kỹ lưỡng danh mục đồ kim loại nhọn (kéo, dao bấm) trước khi xếp vào hành lý xách tay.'
        ]
    },
    {
        id: '3',
        title: 'Bản Đồ Ẩm Thực Đà Nẵng - Hội An: Top Món Ngon Bản Địa Khó Cưỡng',
        category: 'food',
        summary: 'Thưởng thức trọn vẹn tinh hoa ẩm thực miền Trung: Mì Quảng ếch, bánh tráng cuốn thịt heo hai đầu da, Cao lầu giếng Bá Lễ và bánh mì Phượng lừng danh.',
        image_url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80',
        read_time: '7 phút đọc',
        content: [
            'Đà Nẵng và Hội An là giao lộ văn hóa ẩm thực độc đáo của miền Trung. Điểm hấp dẫn nhất là các món ăn mang vị đậm đà nguyên bản, ăn kèm nhiều rau sống tươi sạch.',
            'Mì Quảng: Món ăn quốc hồn quốc túy với sợi mì vàng óng dai mềm, nước lèo nấu xâm xấp đậm vị từ tôm, thịt hoặc ếch đồng, rắc thêm đậu phộng rang giòn và bánh đa nướng mè.',
            'Bánh tráng cuốn thịt heo: Bí quyết nằm ở đĩa thịt heo luộc khéo léo với hai đầu da mỡ giòn, cuốn cùng bánh ướt mỏng, rau rừng Trà Quế và chấm mắm nêm đậm đà thơm nức.',
            'Cao lầu Hội An: Món ăn cổ truyền sử dụng tro củi Cù Lao Chàm ngâm gạo và nước giếng cổ Bá Lễ, tạo nên sợi mì có màu vàng đục dai ngon đặc trưng không nơi nào có được.'
        ],
        tips: [
            'Nên thưởng thức mì Quảng vào buổi sáng hoặc trưa ở các quán ăn gia đình truyền thống.',
            'Mắm nêm miền Trung khá cay, nếu không quen ăn cay bạn nên dặn quán bớt ớt băm.',
            'Bánh mì phố cổ ngon nhất khi ăn nóng hổi ngay tại quầy lò bánh.'
        ]
    },
    {
        id: '4',
        title: 'Khám Phá Ẩm Thực Phố Cổ Hà Nội: 36 Phố Phường Ăn Gì Ở Đâu?',
        category: 'food',
        summary: 'Hành trình nếm thử những món ăn làm nên linh hồn thủ đô nghìn năm văn hiến: Phở bò gia truyền, bún chả nướng than hoa, chả cá Lã Vọng và cà phê trứng béo ngậy.',
        image_url: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=1200&q=80',
        read_time: '8 phút đọc',
        content: [
            'Ẩm thực Hà Nội tinh tế từ cách chọn nguyên liệu đến hương vị thanh tao, không quá cay hay quá ngọt mà tập trung vào vị ngọt sâu lắng của nước dùng ninh xương.',
            'Phở Hà Nội: Nồi nước dùng trong veo thơm mùi hoa hồi, thảo quả, gừng nướng và quế chi. Một bát phở tái lăn hoặc nạm gầu kèm quẩy giòn và chút giấm tỏi ớt tươi là khởi đầu hoàn hảo cho ngày mới.',
            'Bún chả: Từng miếng thịt ba chỉ và chả băm được nướng trên than hoa đỏ rực thơm lừng, chấm ngập trong bát nước mắm chua ngọt ấm nóng kèm đu đủ xanh giòn sần sật.',
            'Cà phê trứng: Lớp kem trứng đánh bông mịn như nhung phủ lên trên dòng cà phê Robusta đen đậm đặc, tạo nên hương vị béo ngậy thơm ngọt nức lòng du khách phương xa.'
        ],
        tips: [
            'Nên dạo bộ hoặc thuê xích lô trong khu phố cổ để ghé các quán ăn ngõ hẹp thuận tiện nhất.',
            'Cà phê trứng nên uống nóng bằng cách đặt trong bát nước ấm giữ nhiệt.',
            'Hỏi giá trước nếu ăn ở các gánh hàng rong tự phát.'
        ]
    },
    {
        id: '5',
        title: 'Bí Kíp Săn Vé Máy Bay Giá Tốt & Chọn Chỗ Ngồi Êm Ái Nhất',
        category: 'skills',
        summary: 'Kinh nghiệm đặt vé máy bay giá rẻ: chọn khung giờ vàng, mẹo chọn vị trí ghế ít say tàu bay và cách xử lý nhanh khi chuyến bay bị hoãn hủy.',
        image_url: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=1200&q=80',
        read_time: '6 phút đọc',
        content: [
            'Đặt vé máy bay thông minh giúp bạn tiết kiệm từ 30% đến 50% chi phí chuyến đi. Thời điểm lý tưởng nhất để mua vé là trước ngày khởi hành từ 3 đến 6 tuần.',
            'Khung giờ bay: Các chuyến bay cất cánh vào sáng sớm (05:00 - 06:30) hoặc tối muộn (sau 21:00) thường có mức giá tốt nhất và tỷ lệ delay thấp hơn do máy bay ít bị dồn chu kỳ từ các chặng trước.',
            'Mẹo chọn chỗ ngồi: Nếu bạn hay bị say máy bay hoặc muốn bay êm nhất, hãy chọn các hàng ghế nằm ngang cánh máy bay (hàng 10 - 18 tùy loại máy bay Airbus hay Boeing) vì đây là vị trí trọng tâm của phi cơ, độ rung lắc là thấp nhất.',
            'Tránh bẫy mua thừa dịch vụ: Khi thao tác đặt vé trực tuyến, hãy chú ý bỏ chọn các gói bảo hiểm tự động hoặc suất ăn đính kèm nếu bạn không thực sự có nhu cầu.'
        ],
        tips: [
            'Kiểm tra chính xác họ tên đệm trên vé khớp 100% với CCCD/Hộ chiếu để tránh phí đổi tên đắt đỏ.',
            'Check-in trực tuyến qua website hoặc ứng dụng hãng trước 24h để tự do chọn chỗ ngồi ưng ý.',
            'Lưu ảnh mã đặt chỗ (PNR) vào máy để xem ngoại tuyến khi sân bay mất kết nối mạng.'
        ]
    },
    {
        id: '6',
        title: 'Kỹ Năng Chuẩn Bị Thể Lực & Sinh Tồn Khi Đi Trekking, Leo Núi',
        category: 'skills',
        summary: 'Những nguyên tắc sống còn khi đi bộ đường dài vùng cao: cách điều hòa nhịp thở, kỹ thuật bước chân lên xuống dốc và vật dụng sinh tồn khẩn cấp.',
        image_url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80',
        read_time: '7 phút đọc',
        content: [
            'Trekking leo núi mang lại trải nghiệm hòa mình vào thiên nhiên hùng vĩ nhưng cũng tiềm ẩn rủi ro nếu bạn thiếu sự chuẩn bị thể chất và kỹ năng cần thiết.',
            'Kỹ thuật di chuyển: Khi lên dốc, hãy bước những bước ngắn, đặt trọn vẹn bàn chân xuống mặt đất và hơi nghiêng người về phía trước để giảm áp lực lên bắp chân. Khi xuống dốc, hơi chùng gối để khớp gối hấp thu lực giằng.',
            'Điều hòa hơi thở: Giữ nhịp thở đều đặn theo nhịp bước chân (ví dụ: hít vào 2 bước, thở ra 2 bước). Tuyệt đối không thở dốc bằng miệng để tránh mất nước và rát cổ họng.',
            'Trang bị cốt lõi: Đôi giày leo núi có đế bám sâu, gậy trekking trợ lực và áo khoác gió chống nước là 3 món đồ quyết định sự an toàn và thoải mái của toàn bộ chuyến đi.'
        ],
        tips: [
            'Luôn chuẩn bị viên bù điện giải Oresol để phòng ngừa mất nước và chuột rút.',
            'Không bao giờ tách đoàn hoặc đi một mình vào rừng khi không có hướng dẫn viên bản địa (Porter).',
            'Đem theo áo mưa bộ siêu nhẹ vì thời tiết rừng núi có thể thay đổi trong vài phút.'
        ]
    }
];

/* ============================== COMPONENT CHÍNH ============================== */

function HandbookContent() {
    const searchParams = useSearchParams();
    const initialCategory = (searchParams.get('category') as HandbookCategory) || 'all';

    // State danh mục đang chọn
    const [selectedCategory, setSelectedCategory] = useState<HandbookCategory>(
        ['all', 'packing', 'food', 'skills'].includes(initialCategory) ? initialCategory : 'all'
    );

    // State tìm kiếm từ khóa
    const [searchQuery, setSearchQuery] = useState('');

    // State danh sách bài viết lấy từ Supabase
    const [articles, setArticles] = useState<HandbookArticle[]>(FALLBACK_HANDBOOK_ARTICLES);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    // State bài viết đang xem chi tiết (Modal)
    const [activeArticle, setActiveArticle] = useState<HandbookArticle | null>(null);

    const targetArticleId = searchParams.get('id');

    useEffect(() => {
        if (targetArticleId && articles.length > 0) {
            const found = articles.find((a) => String(a.id) === String(targetArticleId));
            if (found) {
                setActiveArticle(found);
            }
        }
    }, [targetArticleId, articles]);

    // Tự động gọi API lấy dữ liệu thực tế từ Supabase khi tải trang
    useEffect(() => {
        let isMounted = true;

        const loadHandbooks = async () => {
            try {
                setIsLoading(true);
                const res = await fetch(`${API_URL}/api/v1/handbook?limit=100`, {
                    headers: { 'Content-Type': 'application/json' },
                });

                if (!res.ok) {
                    throw new Error(`Máy chủ phản hồi mã ${res.status}`);
                }

                const data = await res.json();
                if (isMounted) {
                    if (data.status === 'success' && Array.isArray(data.handbooks) && data.handbooks.length > 0) {
                        setArticles(data.handbooks);
                    }
                }
            } catch (err: any) {
                console.warn('Lỗi kết nối Backend API Handbook:', err.message);
                // Nếu server chưa chạy, tiếp tục giữ dữ liệu fallback để giao diện không bị trắng trang
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };

        loadHandbooks();

        return () => {
            isMounted = false;
        };
    }, []);

    // Danh sách tab bộ lọc duy nhất
    const CATEGORIES = [
        { id: 'all', label: 'Tất Cả Cẩm Nang', icon: Compass },
        { id: 'packing', label: 'Hành Lý', icon: Backpack },
        { id: 'food', label: 'Ẩm Thực', icon: UtensilsCrossed },
        { id: 'skills', label: 'Kỹ Năng & Mẹo Hay', icon: Lightbulb },
    ];

    // Lọc danh sách bài viết theo danh mục & từ khóa tìm kiếm
    const filteredArticles = useMemo(() => {
        return articles.filter((item) => {
            // Lọc danh mục
            if (selectedCategory !== 'all' && item.category !== selectedCategory) {
                return false;
            }

            // Lọc từ khóa
            if (searchQuery.trim()) {
                const query = searchQuery.toLowerCase().trim();
                const matchTitle = item.title.toLowerCase().includes(query);
                const matchSummary = item.summary.toLowerCase().includes(query);
                const matchTips = item.tips?.some((tip) => tip.toLowerCase().includes(query));
                return matchTitle || matchSummary || matchTips;
            }

            return true;
        });
    }, [articles, selectedCategory, searchQuery]);

    // Lấy nhãn tên danh mục
    const getCategoryBadge = (cat: string) => {
        switch (cat) {
            case 'packing':
                return { label: 'Hành Lý', color: 'bg-blue-100 text-blue-900 border-blue-200' };
            case 'food':
                return { label: 'Ẩm Thực', color: 'bg-amber-100 text-amber-900 border-amber-200' };
            case 'skills':
                return { label: 'Kỹ Năng & Mẹo Hay', color: 'bg-emerald-100 text-emerald-900 border-emerald-200' };
            default:
                return { label: 'Cẩm Nang', color: 'bg-gray-100 text-gray-800 border-gray-200' };
        }
    };

    return (
        <div className="min-h-screen bg-[#FDFBF7] text-gray-900 font-sans pb-24">
            {/* 1. HERO SECTION NHỎ GỌN, ĐỒNG BỘ */}
            <div className="relative text-white overflow-hidden py-14 sm:py-20 border-b border-gray-800">
                <Image
                    src="/images/headers/handbook-cover.jpg"
                    alt="Cẩm nang du lịch và kinh nghiệm khám phá"
                    fill
                    priority
                    quality={95}
                    className="object-cover object-center opacity-100"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/35 to-black/60" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20" />

                <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center relative z-10">
                    <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white mb-2 drop-shadow-[0_2px_12px_rgba(0,0,0,0.85)]">
                        Cẩm Nang & Kinh Nghiệm Du Lịch
                    </h1>
                    <p className="max-w-xl mx-auto text-xs sm:text-sm text-gray-100 font-medium drop-shadow-[0_1px_6px_rgba(0,0,0,0.8)]">
                        Kho tri thức tổng hợp về đóng gói hành lý, khám phá ẩm thực bản địa và những kỹ năng mẹo hay hữu ích cho mọi hành trình của bạn.
                    </p>

                    {/* Ô TÌM KIẾM NHANH - ĐÈ LÊN ẢNH HERO */}
                    <div className="max-w-lg mx-auto mt-5 relative z-20">
                        <div className="relative flex items-center shadow-2xl">
                            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 pointer-events-none" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Tìm kiếm cẩm nang, mẹo đóng đồ, món ăn ngon..."
                                className="w-full pl-10 pr-9 py-2.5 bg-white border border-gray-300 rounded-none text-xs sm:text-sm text-black font-medium focus:outline-hidden focus:border-[#FACC15] transition-colors"
                            />
                            {searchQuery && (
                                <button
                                    type="button"
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-2.5 text-gray-400 hover:text-black p-1"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. THANH BỘ LỌC DUY NHẤT: TẤT CẢ / HÀNH LÝ / ẨM THỰC / KỸ NĂNG & MẸO HAY */}
            <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-xs">
                <div className="max-w-6xl mx-auto px-4 sm:px-6">
                    <div className="flex items-center justify-start sm:justify-center gap-2 overflow-x-auto py-3 scrollbar-none">
                        {CATEGORIES.map((cat) => {
                            const IconComponent = cat.icon;
                            const isActive = selectedCategory === cat.id;
                            return (
                                <button
                                    key={cat.id}
                                    type="button"
                                    onClick={() => setSelectedCategory(cat.id as HandbookCategory)}
                                    className={`px-4 py-2.5 text-xs sm:text-sm font-black uppercase tracking-wider flex items-center gap-2 shrink-0 transition-all cursor-pointer ${
                                        isActive
                                            ? 'bg-black text-[#FACC15] shadow-xs'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-black'
                                    }`}
                                >
                                    <IconComponent className="w-4 h-4 shrink-0" />
                                    <span>{cat.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* 3. DANH SÁCH BÀI VIẾT CẨM NANG */}
            <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-10">
                <div className="flex items-center justify-between mb-6">
                    <div className="text-xs uppercase tracking-widest font-black text-gray-500">
                        Hiển thị <span className="text-black font-extrabold">{filteredArticles.length}</span> bài viết
                        {selectedCategory !== 'all' && (
                            <span> trong chuyên mục <b className="text-black">{CATEGORIES.find((c) => c.id === selectedCategory)?.label}</b></span>
                        )}
                    </div>
                    {isLoading && (
                        <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-500" /> Đang cập nhật dữ liệu...
                        </div>
                    )}
                </div>

                {isLoading && articles.length === 0 ? (
                    /* Skeletons khi tải trang */
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="bg-white border border-gray-200 p-4 animate-pulse">
                                <div className="aspect-16/10 bg-gray-200 mb-4" />
                                <div className="h-4 bg-gray-200 w-3/4 mb-2" />
                                <div className="h-3 bg-gray-100 w-full mb-1" />
                                <div className="h-3 bg-gray-100 w-2/3" />
                            </div>
                        ))}
                    </div>
                ) : filteredArticles.length === 0 ? (
                    <div className="text-center py-20 bg-white border border-dashed border-gray-300 p-8">
                        <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <h3 className="text-lg font-bold text-gray-700 mb-1">Không tìm thấy bài viết phù hợp</h3>
                        <p className="text-xs text-gray-500 mb-4">Hãy thử tìm với từ khóa khác hoặc chuyển sang danh mục khác.</p>
                        <button
                            type="button"
                            onClick={() => {
                                setSelectedCategory('all');
                                setSearchQuery('');
                            }}
                            className="px-4 py-2 bg-black text-[#FACC15] text-xs font-black uppercase tracking-wider cursor-pointer"
                        >
                            Xem Tất Cả Bài Viết
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                        {filteredArticles.map((article) => {
                            const badge = getCategoryBadge(article.category);
                            return (
                                <article
                                    key={article.id}
                                    onClick={() => setActiveArticle(article)}
                                    className="bg-white border border-gray-200 flex flex-col group hover:border-black transition-all duration-200 cursor-pointer shadow-xs hover:shadow-md"
                                >
                                    {/* Ảnh đại diện */}
                                    <div className="relative aspect-16/10 overflow-hidden bg-gray-100">
                                        <Image
                                            src={article.image_url}
                                            alt={article.title}
                                            fill
                                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                                        />
                                        <span className={`absolute top-3 left-3 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 border ${badge.color}`}>
                                            {badge.label}
                                        </span>
                                    </div>

                                    {/* Nội dung tóm tắt */}
                                    <div className="p-5 flex-1 flex flex-col justify-between">
                                        <div>
                                            <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-2 font-semibold">
                                                <Clock className="w-3.5 h-3.5" />
                                                <span>{article.read_time}</span>
                                            </div>
                                            <h3 className="text-base font-black text-gray-900 group-hover:text-black line-clamp-2 leading-snug mb-2">
                                                {article.title}
                                            </h3>
                                            <p className="text-xs text-gray-600 line-clamp-3 leading-relaxed">
                                                {article.summary}
                                            </p>
                                        </div>

                                        <div className="pt-4 mt-4 border-t border-gray-100 flex items-center justify-between text-xs font-black uppercase tracking-wider text-black group-hover:text-amber-600 transition-colors">
                                            <span>Đọc chi tiết</span>
                                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                        </div>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                )}
            </main>

            {/* 4. MODAL CHI TIẾT BÀI VIẾT CẨM NANG */}
            {activeArticle && (
                <div
                    className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
                    onClick={() => setActiveArticle(null)}
                >
                    <div
                        className="bg-white max-w-2xl w-full border border-black shadow-2xl overflow-hidden my-8"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Ảnh bìa Modal */}
                        <div className="relative aspect-16/9 bg-gray-900">
                            <Image
                                src={activeArticle.image_url}
                                alt={activeArticle.title}
                                fill
                                sizes="(max-width: 768px) 100vw, 700px"
                                className="object-cover"
                            />
                            <button
                                type="button"
                                onClick={() => setActiveArticle(null)}
                                className="absolute top-4 right-4 bg-black/80 hover:bg-black text-white p-2 rounded-full transition-colors cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                            <div className="absolute bottom-4 left-4 flex items-center gap-2">
                                <span className="bg-[#FACC15] text-black text-xs font-black uppercase px-2.5 py-1">
                                    {getCategoryBadge(activeArticle.category).label}
                                </span>
                                <span className="bg-black/75 text-white text-xs font-bold px-2 py-1 flex items-center gap-1">
                                    <Clock className="w-3 h-3" /> {activeArticle.read_time}
                                </span>
                            </div>
                        </div>

                        {/* Thân bài đọc */}
                        <div className="p-6 sm:p-8 max-h-[60vh] overflow-y-auto">
                            <h2 className="text-xl sm:text-2xl font-black text-gray-900 leading-tight mb-4">
                                {activeArticle.title}
                            </h2>

                            {/* Tóm tắt */}
                            <div className="p-4 bg-gray-50 border-l-4 border-[#FACC15] text-xs sm:text-sm text-gray-700 italic mb-6">
                                {activeArticle.summary}
                            </div>

                            {/* Nội dung chi tiết */}
                            <div className="space-y-3.5 text-xs sm:text-sm text-gray-700 leading-relaxed font-normal">
                                {Array.isArray(activeArticle.content) &&
                                    activeArticle.content.map((paragraph, index) => (
                                        <p key={index}>{paragraph}</p>
                                    ))}
                            </div>

                            {/* Mẹo hay & Lưu ý */}
                            {Array.isArray(activeArticle.tips) && activeArticle.tips.length > 0 && (
                                <div className="mt-6 pt-6 border-t border-gray-200">
                                    <h4 className="text-xs font-black uppercase tracking-wider text-gray-900 flex items-center gap-2 mb-3">
                                        <Lightbulb className="w-4 h-4 text-amber-500" /> Mẹo Hay & Lưu Ý Quan Trọng
                                    </h4>
                                    <div className="space-y-2">
                                        {activeArticle.tips.map((tip, idx) => (
                                            <div
                                                key={idx}
                                                className="flex items-start gap-2.5 text-xs text-gray-700 bg-amber-50/60 p-2.5 border border-amber-200/60"
                                            >
                                                <Check className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                                                <span>{tip}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Đóng Modal */}
                        <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end">
                            <button
                                type="button"
                                onClick={() => setActiveArticle(null)}
                                className="px-5 py-2.5 bg-black text-[#FACC15] text-xs font-black uppercase tracking-wider hover:bg-gray-800 transition-colors cursor-pointer"
                            >
                                Đóng Cửa Sổ
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function HandbookPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center font-bold text-gray-500">
                    Đang tải cẩm nang du lịch...
                </div>
            }
        >
            <HandbookContent />
        </Suspense>
    );
}

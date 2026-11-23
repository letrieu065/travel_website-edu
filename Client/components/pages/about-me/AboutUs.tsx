'use client';

/**
 * ============================================================================
 * MODULE ABOUT US - CLIENT PAGE (Trang Giới Thiệu Natura Travel Việt Nam)
 * ============================================================================
 * Chịu trách nhiệm:
 * - Trình bày câu chuyện thương hiệu, sứ mệnh và cam kết tôn vinh du lịch Việt Nam.
 * - 4 Trụ cột giá trị cốt lõi thiết kế thẩm mỹ cao (01, 02, 03, 04).
 * - Bộ chỉ số năng lực nền tảng thực tế (không dùng số liệu khách hàng ảo).
 * - Kênh hỗ trợ khách hàng trực tuyến 24/7 toàn quốc (không dùng địa chỉ văn phòng vật lý).
 * ============================================================================
 */

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
    Compass,
    ShieldCheck,
    Leaf,
    Sparkles,
    PhoneCall,
    Mail,
    ArrowRight,
    Award,
    Send,
    Headphones,
    Clock,
    Zap,
    Map,
} from 'lucide-react';

export default function AboutUsPage() {
    const [contactForm, setContactForm] = useState({ name: '', phone: '', email: '', message: '' });
    const [isSent, setIsSent] = useState(false);

    const handleSubmitContact = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSent(true);
        setTimeout(() => {
            setContactForm({ name: '', phone: '', email: '', message: '' });
        }, 3000);
    };

    return (
        <div className="w-full min-h-screen bg-white text-gray-900">
            {/* 1. HERO SECTION */}
            <section className="relative min-h-[75vh] flex flex-col justify-center bg-black text-white px-6 py-20 overflow-hidden">
                <Image
                    src="https://images.unsplash.com/photo-1528127269322-539801943592?q=80&w=1920&auto=format&fit=crop"
                    alt="Vẻ đẹp Việt Nam - Natura Travel"
                    fill
                    priority
                    className="object-cover opacity-85"
                />
                {/* Lớp phủ chuyển sắc thông minh: Giữ sáng rõ phong cảnh non nước bên phải, tối vừa đủ phía bên trái để chữ nổi bật */}
                <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/45 to-black/15" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30" />

                <div className="max-w-7xl mx-auto w-full relative z-10">
                    <div className="inline-flex items-center gap-2 bg-[#FACC15] text-black px-3.5 py-1 text-xs font-black uppercase tracking-widest mb-6 shadow-sm">
                        <Compass className="w-4 h-4" /> Tôn Vinh Vẻ Đẹp Việt Nam · Natura Travel
                    </div>
                    <h1 className="text-4xl sm:text-6xl md:text-7xl font-black uppercase tracking-tight text-white max-w-4xl leading-[1.05] drop-shadow-[0_2px_12px_rgba(0,0,0,0.85)]">
                        Kết Nối Trái Tim Với Dải Đất Hình Chữ S
                    </h1>
                    <p className="mt-6 text-gray-200 text-base sm:text-xl font-medium max-w-3xl leading-relaxed drop-shadow-[0_1px_6px_rgba(0,0,0,0.8)]">
                        Chúng tôi không chỉ tổ chức các chuyến đi; chúng tôi kiến tạo những hành trình trải nghiệm độc bản, đưa bạn chạm vào tâm hồn, văn hóa và vẻ đẹp kỳ vĩ của thiên nhiên non sông Việt Nam.
                    </p>
                    <div className="mt-10 flex flex-wrap gap-4">
                        <Link
                            href="/destinations"
                            className="bg-[#FACC15] text-black hover:bg-yellow-400 font-black text-xs uppercase tracking-widest px-8 py-4 transition-colors flex items-center gap-2 shadow-lg"
                        >
                            Khám Phá Điểm Đến <ArrowRight className="w-4 h-4" />
                        </Link>
                        <Link
                            href="/tours"
                            className="bg-white/10 hover:bg-white text-white hover:text-black font-black text-xs uppercase tracking-widest px-8 py-4 border border-white/20 transition-all flex items-center gap-2 backdrop-blur-xs"
                        >
                            Tours Du Lịch 3 Miền
                        </Link>
                    </div>
                </div>
            </section>

            {/* 2. STATS BAR (Chỉ số thực tế về năng lực sản phẩm & độ phủ) */}
            <section className="bg-gray-50 border-b border-gray-200 py-12 px-6">
                <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                    <div className="p-4">
                        <span className="text-4xl sm:text-5xl font-black text-black block tracking-tight">50+</span>
                        <span className="text-xs uppercase font-black tracking-wider text-gray-500 mt-1 block">Điểm đến chọn lọc 3 miền</span>
                    </div>
                    <div className="p-4">
                        <span className="text-4xl sm:text-5xl font-black text-black block tracking-tight">250+</span>
                        <span className="text-xs uppercase font-black tracking-wider text-gray-500 mt-1 block">Hành trình trải nghiệm độc bản</span>
                    </div>
                    <div className="p-4">
                        <span className="text-4xl sm:text-5xl font-black text-black block tracking-tight">63</span>
                        <span className="text-xs uppercase font-black tracking-wider text-gray-500 mt-1 block">Tỉnh thành kết nối toàn quốc</span>
                    </div>
                    <div className="p-4">
                        <span className="text-4xl sm:text-5xl font-black text-black block tracking-tight">100%</span>
                        <span className="text-xs uppercase font-black tracking-wider text-gray-500 mt-1 block">Cam kết chất lượng & minh bạch</span>
                    </div>
                </div>
            </section>

            {/* 3. OUR STORY */}
            <section id="our-story" className="max-w-7xl mx-auto px-6 py-20 scroll-mt-24">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    <div>
                        {/* Styled Chapter Badge 01 */}
                        <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 bg-black text-[#FACC15] text-[11px] font-black uppercase tracking-[0.2em] shadow-sm mb-5">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#FACC15] animate-ping" />
                            CHƯƠNG 01 · CÂU CHUYỆN CỦA CHÚNG TÔI
                        </div>

                        <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-gray-900 leading-tight">
                            Bắt Đầu Từ Tình Yêu Với Non Sông Đất Nước
                        </h2>
                        <div className="mt-6 space-y-4 text-gray-600 font-medium text-sm sm:text-base leading-relaxed">
                            <p>
                                Natura Travel được sáng lập bởi một tập thể những người con Việt Nam đam mê xê dịch, trăn trở trước thực trạng du lịch đại trà đôi khi làm mất đi cái &quot;hồn&quot; nguyên sơ và sự gắn kết với văn hóa bản địa.
                            </p>
                            <p>
                                Từ những chuyến độc hành chinh phục cực Bắc Lũng Cú, băng qua mùa vàng Mù Cang Chải, lặn ngắm rạn san hô Côn Đảo đến dạo bước trên phố cổ Hội An đêm rằm, chúng tôi nhận ra vẻ đẹp Việt Nam phong phú và kỳ diệu hơn bất kỳ khuôn mẫu quảng bá thông thường nào.
                            </p>
                            <p className="font-bold text-gray-900">
                                Chúng tôi thành lập Natura Travel với một sứ mệnh duy nhất: Đưa du khách chạm vào chiều sâu văn hóa, thiên nhiên và sự ấm áp của con người Việt Nam theo cách chân thật, an toàn và bền vững nhất.
                            </p>
                        </div>
                    </div>

                    <div className="relative h-96 sm:h-[480px] w-full border border-gray-200 shadow-xl overflow-hidden group">
                        <Image
                            src="https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?q=80&w=1200&auto=format&fit=crop"
                            alt="Phố cổ Hội An - Natura Travel Story"
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-700"
                            sizes="(max-width: 1024px) 100vw, 50vw"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                        <div className="absolute bottom-6 left-6 right-6 text-white">
                            <span className="text-xs font-black uppercase tracking-widest text-[#FACC15] block mb-1">Di Sản Văn Hóa</span>
                            <p className="text-lg font-bold">Mỗi bước chân là một câu chuyện tình yêu với quê hương.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* 4. CORE VALUES (01, 02, 03, 04 thiết kế thẩm mỹ cao) */}
            <section id="core-values" className="bg-gray-50 py-20 border-y border-gray-200 scroll-mt-24">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        {/* Styled Chapter Badge 02 */}
                        <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 bg-black text-[#FACC15] text-[11px] font-black uppercase tracking-[0.2em] shadow-sm mb-4">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#FACC15] animate-ping" />
                            CHƯƠNG 02 · GIÁ TRỊ CỐT LÕI
                        </div>
                        <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-gray-900">
                            Kim Chỉ Nam Cho Mọi Hành Trình
                        </h2>
                        <p className="text-xs sm:text-sm text-gray-600 mt-3 font-medium">
                            Bốn nguyên tắc bất di bất dịch định hình mọi sản phẩm và trải nghiệm của Natura Travel.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {/* Value 01 */}
                        <div className="relative bg-white p-8 border border-gray-200 hover:border-black transition-all hover:shadow-xl duration-300 group overflow-hidden flex flex-col justify-between">
                            {/* Watermark Numeral */}
                            <span className="text-7xl font-black text-gray-100 group-hover:text-amber-100/60 transition-colors absolute top-2 right-4 select-none pointer-events-none font-mono">
                                01
                            </span>

                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="w-12 h-12 bg-black text-[#FACC15] flex items-center justify-center font-black text-base shadow-sm group-hover:scale-105 transition-transform border border-black">
                                        01
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 group-hover:text-black transition-colors">
                                        Trụ Cột I
                                    </span>
                                </div>
                                <h3 className="text-lg font-black uppercase text-gray-900 mb-3 group-hover:text-black">
                                    Bản Sắc Việt Nam
                                </h3>
                                <p className="text-xs text-gray-600 leading-relaxed font-medium">
                                    Tôn trọng và truyền tải trọn vẹn phong tục tập quán, ẩm thực truyền thống và vẻ đẹp lịch sử của từng vùng miền trên mảnh đất hình chữ S.
                                </p>
                            </div>
                            <div className="relative z-10 pt-6 border-t border-gray-100 mt-6 flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-black">
                                <Award className="w-4 h-4 text-[#FACC15]" /> Chuẩn mực văn hóa
                            </div>
                        </div>

                        {/* Value 02 */}
                        <div className="relative bg-white p-8 border border-gray-200 hover:border-black transition-all hover:shadow-xl duration-300 group overflow-hidden flex flex-col justify-between">
                            {/* Watermark Numeral */}
                            <span className="text-7xl font-black text-gray-100 group-hover:text-green-100/60 transition-colors absolute top-2 right-4 select-none pointer-events-none font-mono">
                                02
                            </span>

                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="w-12 h-12 bg-black text-[#FACC15] flex items-center justify-center font-black text-base shadow-sm group-hover:scale-105 transition-transform border border-black">
                                        02
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 group-hover:text-black transition-colors">
                                        Trụ Cột II
                                    </span>
                                </div>
                                <h3 className="text-lg font-black uppercase text-gray-900 mb-3 group-hover:text-black">
                                    Du Lịch Xanh (Eco)
                                </h3>
                                <p className="text-xs text-gray-600 leading-relaxed font-medium">
                                    Bảo vệ môi trường tự nhiên, hạn chế rác thải nhựa, ưu tiên lưu trú tại các resort sinh thái và chia sẻ lợi ích kinh tế với cộng đồng cư dân bản địa.
                                </p>
                            </div>
                            <div className="relative z-10 pt-6 border-t border-gray-100 mt-6 flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-black">
                                <Leaf className="w-4 h-4 text-green-600" /> Bền vững môi sinh
                            </div>
                        </div>

                        {/* Value 03 */}
                        <div className="relative bg-white p-8 border border-gray-200 hover:border-black transition-all hover:shadow-xl duration-300 group overflow-hidden flex flex-col justify-between">
                            {/* Watermark Numeral */}
                            <span className="text-7xl font-black text-gray-100 group-hover:text-blue-100/60 transition-colors absolute top-2 right-4 select-none pointer-events-none font-mono">
                                03
                            </span>

                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="w-12 h-12 bg-black text-[#FACC15] flex items-center justify-center font-black text-base shadow-sm group-hover:scale-105 transition-transform border border-black">
                                        03
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 group-hover:text-black transition-colors">
                                        Trụ Cột III
                                    </span>
                                </div>
                                <h3 className="text-lg font-black uppercase text-gray-900 mb-3 group-hover:text-black">
                                    Minh Bạch & An Tâm
                                </h3>
                                <p className="text-xs text-gray-600 leading-relaxed font-medium">
                                    Giá niêm yết trọn gói rõ ràng không phụ phí ẩn. Tích hợp bảo hiểm du lịch toàn diện và quy trình thanh toán đạt chuẩn bảo mật quốc tế.
                                </p>
                            </div>
                            <div className="relative z-10 pt-6 border-t border-gray-100 mt-6 flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-black">
                                <ShieldCheck className="w-4 h-4 text-blue-600" /> Bảo hiểm toàn diện
                            </div>
                        </div>

                        {/* Value 04 */}
                        <div className="relative bg-white p-8 border border-gray-200 hover:border-black transition-all hover:shadow-xl duration-300 group overflow-hidden flex flex-col justify-between">
                            {/* Watermark Numeral */}
                            <span className="text-7xl font-black text-gray-100 group-hover:text-amber-100/60 transition-colors absolute top-2 right-4 select-none pointer-events-none font-mono">
                                04
                            </span>

                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="w-12 h-12 bg-black text-[#FACC15] flex items-center justify-center font-black text-base shadow-sm group-hover:scale-105 transition-transform border border-black">
                                        04
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 group-hover:text-black transition-colors">
                                        Trụ Cột IV
                                    </span>
                                </div>
                                <h3 className="text-lg font-black uppercase text-gray-900 mb-3 group-hover:text-black">
                                    Công Nghệ Tiên Phong
                                </h3>
                                <p className="text-xs text-gray-600 leading-relaxed font-medium">
                                    Trợ lý du lịch AI thế hệ mới hỗ trợ lập kế hoạch chuyến đi chỉ trong vài giây, tra cứu vé máy bay các hãng nội địa và đặt chỗ tức thì.
                                </p>
                            </div>
                            <div className="relative z-10 pt-6 border-t border-gray-100 mt-6 flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-black">
                                <Sparkles className="w-4 h-4 text-amber-500" /> Trải nghiệm mượt mà
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 5. POLICY & SERVICE GUARANTEE */}
            <section id="policy" className="bg-gray-50 py-16 border-y border-gray-200 scroll-mt-24">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="max-w-3xl mb-12">
                        {/* Styled Chapter Badge 03 */}
                        <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 bg-black text-[#FACC15] text-[11px] font-black uppercase tracking-[0.2em] shadow-sm mb-3">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#FACC15] animate-ping" />
                            CHƯƠNG 03 · CAM KẾT & QUYỀN LỢI
                        </div>
                        <h2 className="text-3xl font-black uppercase tracking-tight text-gray-900">
                            Chính Sách & Cam Kết Dịch Vụ
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="relative p-6 bg-white border border-gray-200 hover:border-black transition-colors overflow-hidden group">
                            <span className="text-6xl font-black text-gray-100 group-hover:text-amber-100/50 transition-colors absolute top-2 right-3 select-none pointer-events-none font-mono">
                                01
                            </span>
                            <div className="relative z-10">
                                <span className="inline-block bg-black text-[#FACC15] px-2 py-0.5 text-[10px] font-black uppercase mb-3">
                                    Quyền Lợi 01
                                </span>
                                <h4 className="text-sm font-black uppercase text-gray-900 mb-2">Chính Sách Hoàn Hủy Linh Hoạt</h4>
                                <p className="text-xs text-gray-600 leading-relaxed font-medium">
                                    Hỗ trợ hoàn/đổi ngày khởi hành tour và vé máy bay theo đúng quy định hàng không nội địa, cam kết hỗ trợ tối đa khi phát sinh trường hợp bất khả kháng.
                                </p>
                            </div>
                        </div>

                        <div className="relative p-6 bg-white border border-gray-200 hover:border-black transition-colors overflow-hidden group">
                            <span className="text-6xl font-black text-gray-100 group-hover:text-blue-100/50 transition-colors absolute top-2 right-3 select-none pointer-events-none font-mono">
                                02
                            </span>
                            <div className="relative z-10">
                                <span className="inline-block bg-black text-[#FACC15] px-2 py-0.5 text-[10px] font-black uppercase mb-3">
                                    Quyền Lợi 02
                                </span>
                                <h4 className="text-sm font-black uppercase text-gray-900 mb-2">Bảo Hiểm Du Lịch Đã Bao Gồm</h4>
                                <p className="text-xs text-gray-600 leading-relaxed font-medium">
                                    Toàn bộ các tour trọn gói của Natura Travel đều được bảo hiểm du lịch nội địa bảo vệ với hạn mức trách nhiệm lên tới 100.000.000 VNĐ / vụ.
                                </p>
                            </div>
                        </div>

                        <div className="relative p-6 bg-white border border-gray-200 hover:border-black transition-colors overflow-hidden group">
                            <span className="text-6xl font-black text-gray-100 group-hover:text-green-100/50 transition-colors absolute top-2 right-3 select-none pointer-events-none font-mono">
                                03
                            </span>
                            <div className="relative z-10">
                                <span className="inline-block bg-black text-[#FACC15] px-2 py-0.5 text-[10px] font-black uppercase mb-3">
                                    Quyền Lợi 03
                                </span>
                                <h4 className="text-sm font-black uppercase text-gray-900 mb-2">Bảo Mật Dữ Liệu Khách Hàng</h4>
                                <p className="text-xs text-gray-600 leading-relaxed font-medium">
                                    Tuyệt đối bảo mật thông tin cá nhân và tài khoản thanh toán theo tiêu chuẩn an toàn bảo mật dữ liệu số quốc tế PCI-DSS.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 7. CONTACT & SUPPORT CHANNELS (Bỏ địa chỉ văn phòng, tập trung hỗ trợ trực tuyến toàn quốc 24/7) */}
            <section id="contact" className="max-w-7xl mx-auto px-6 py-20 scroll-mt-24">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                    {/* Support Channels */}
                    <div>
                        {/* Styled Chapter Badge 04 */}
                        <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 bg-black text-[#FACC15] text-[11px] font-black uppercase tracking-[0.2em] shadow-sm mb-4">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#FACC15] animate-ping" />
                            CHƯƠNG 04 · HỖ TRỢ & LIÊN HỆ 24/7
                        </div>

                        <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-gray-900 mb-6">
                            Đồng Hành Trực Tuyến Toàn Diện Cùng Bạn
                        </h2>
                        <p className="text-sm text-gray-600 font-medium mb-8 leading-relaxed">
                            Natura Travel vận hành trung tâm tư vấn và hỗ trợ du khách trực tuyến 24/7 trên khắp 63 tỉnh thành Việt Nam. Dù bạn đang ở đâu, chúng tôi luôn sẵn sàng lắng nghe và giải đáp mọi nhu cầu.
                        </p>

                        <div className="space-y-4">
                            {/* Hotline Card */}
                            <div className="p-5 border border-gray-200 bg-gray-50/70 hover:border-black transition-colors flex items-start gap-4">
                                <div className="w-10 h-10 bg-black text-[#FACC15] flex items-center justify-center shrink-0">
                                    <PhoneCall className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-black uppercase text-gray-900">Tổng Đài Hỗ Trợ Khách Hàng 24/7</h4>
                                    <p className="text-xs text-gray-600 mt-1">Hỗ trợ khẩn cấp, đặt vé máy bay & tư vấn tour miễn phí cước gọi</p>
                                    <span className="text-base font-black text-black mt-1.5 block">Hotline: 1900 8888</span>
                                </div>
                            </div>

                            {/* Email Card */}
                            <div className="p-5 border border-gray-200 bg-gray-50/70 hover:border-black transition-colors flex items-start gap-4">
                                <div className="w-10 h-10 bg-black text-[#FACC15] flex items-center justify-center shrink-0">
                                    <Mail className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-black uppercase text-gray-900">Hòm Thư Điện Tử Hỗ Trợ</h4>
                                    <p className="text-xs text-gray-600 mt-1">Tiếp nhận yêu cầu thiết kế tour riêng, khiếu nại & hợp tác đối tác</p>
                                    <span className="text-sm font-black text-black mt-1.5 block">Email: hotro@naturatravel.vn</span>
                                </div>
                            </div>

                            {/* Nationwide Coverage */}
                            <div className="p-5 border border-gray-200 bg-gray-50/70 hover:border-black transition-colors flex items-start gap-4">
                                <div className="w-10 h-10 bg-black text-[#FACC15] flex items-center justify-center shrink-0">
                                    <Map className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-black uppercase text-gray-900">Phạm Vi Phục Vụ Toàn Quốc</h4>
                                    <p className="text-xs text-gray-600 mt-1">Kết nối các điểm đến 3 miền Bắc - Trung - Nam với mạng lưới đối tác bản địa uy tín</p>
                                    <span className="text-xs font-bold text-gray-900 mt-1.5 block">63 Tỉnh Thành · Hoạt Động Xuyên Suốt Lễ & Tết</span>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 flex items-center gap-6 text-xs text-gray-700 font-bold border-t border-gray-100 pt-6">
                            <span className="flex items-center gap-2">
                                <Headphones className="w-4 h-4 text-black" /> Hỗ trợ 24/7 trực tuyến
                            </span>
                            <span className="flex items-center gap-2">
                                <Zap className="w-4 h-4 text-black" /> Phản hồi trong 15 phút
                            </span>
                            <span className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-black" /> Hoạt động tất cả các ngày
                            </span>
                        </div>
                    </div>

                    {/* Quick Inquiry Form */}
                    <div className="bg-gray-50 border border-gray-200 p-8 sm:p-10">
                        <h3 className="text-2xl font-black uppercase tracking-tight text-gray-900 mb-2">
                            Gửi Yêu Cầu Tư Vấn Chuyến Đi
                        </h3>
                        <p className="text-xs text-gray-500 font-medium mb-6">
                            Để lại thông tin, chuyên viên Natura Travel sẽ liên hệ tư vấn lịch trình chi tiết trong vòng 15 phút.
                        </p>

                        {isSent ? (
                            <div className="bg-green-50 border border-green-200 text-green-800 p-6 text-center text-sm font-bold">
                                Cảm ơn bạn! Yêu cầu tư vấn đã được gửi thành công. Chúng tôi sẽ liên hệ lại ngay!
                            </div>
                        ) : (
                            <form onSubmit={handleSubmitContact} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-black uppercase tracking-wider text-gray-700 mb-1">
                                        Họ và tên
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Nguyễn Văn A"
                                        value={contactForm.name}
                                        onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                                        className="w-full px-4 py-3 text-xs bg-white border border-gray-300 focus:outline-none focus:border-black font-medium"
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-black uppercase tracking-wider text-gray-700 mb-1">
                                            Số điện thoại
                                        </label>
                                        <input
                                            type="tel"
                                            required
                                            placeholder="0912 345 678"
                                            value={contactForm.phone}
                                            onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                                            className="w-full px-4 py-3 text-xs bg-white border border-gray-300 focus:outline-none focus:border-black font-medium"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-black uppercase tracking-wider text-gray-700 mb-1">
                                            Địa chỉ Email
                                        </label>
                                        <input
                                            type="email"
                                            required
                                            placeholder="email@example.com"
                                            value={contactForm.email}
                                            onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                                            className="w-full px-4 py-3 text-xs bg-white border border-gray-300 focus:outline-none focus:border-black font-medium"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-black uppercase tracking-wider text-gray-700 mb-1">
                                        Điểm đến & Nội dung bạn cần tư vấn
                                    </label>
                                    <textarea
                                        rows={4}
                                        required
                                        placeholder="Ví dụ: Tôi muốn tư vấn tour Phú Quốc 3 ngày 2 đêm cho gia đình 4 người vào tháng tới..."
                                        value={contactForm.message}
                                        onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                                        className="w-full px-4 py-3 text-xs bg-white border border-gray-300 focus:outline-none focus:border-black font-medium"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className="w-full bg-black text-[#FACC15] hover:bg-gray-800 py-3.5 px-6 text-xs font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
                                >
                                    <Send className="w-4 h-4" /> Gửi Yêu Cầu Tư Vấn Ngay
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </section>

            {/* 8. CALL TO ACTION */}
            <section className="bg-[#FACC15] py-20 px-6 text-center text-black">
                <div className="max-w-4xl mx-auto">
                    <span className="text-xs font-black uppercase tracking-[0.3em] block mb-3 text-gray-900">
                        Khám Phá Non Sông Gấm Vóc
                    </span>
                    <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tight leading-tight mb-6">
                        Sẵn Sàng Bắt Đầu Chuyến Đi Đáng Nhớ Của Bạn?
                    </h2>
                    <p className="text-sm sm:text-base text-gray-900 font-medium max-w-2xl mx-auto mb-10 leading-relaxed">
                        Hãy để Natura Travel là chiếc la bàn tin cậy dẫn lối bạn đến những kỳ quan thiên nhiên và khoảnh khắc khó quên trên khắp dải đất Việt Nam.
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-4">
                        <Link
                            href="/tours"
                            className="px-8 py-4 bg-black text-white hover:bg-gray-800 text-xs font-black uppercase tracking-widest transition-colors inline-flex items-center gap-2 shadow-xl"
                        >
                            Xem Danh Sách Tours <ArrowRight className="w-4 h-4" />
                        </Link>
                        <Link
                            href="/flights"
                            className="px-8 py-4 bg-white text-black hover:bg-gray-100 text-xs font-black uppercase tracking-widest transition-colors inline-flex items-center gap-2 border border-black/10 shadow-sm"
                        >
                            Tìm Vé Máy Bay Nội Địa
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}

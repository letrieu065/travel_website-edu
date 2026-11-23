'use client';

/**
 * ============================================================================
 * MODULE FOOTER - CLIENT COMPONENT (Chân Trang Natura Travel Việt Nam)
 * ============================================================================
 * Chịu trách nhiệm:
 * - Đăng ký nhận bản tin du lịch với phản hồi tức thì.
 * - Danh mục điểm đến nổi bật 100% Việt Nam (Bắc - Trung - Nam).
 * - Các dịch vụ du lịch trọng tâm (Tours, Khách sạn, Vé máy bay nội địa, Combo, AI Planner).
 * - Thông tin liên hệ, cam kết du lịch xanh và chứng chỉ an toàn thanh toán.
 * ============================================================================
 */

import React, { useState } from 'react';
import Link from 'next/link';
import { Compass, Globe, ShieldCheck, Mail, Phone, CheckCircle2 } from 'lucide-react';

export default function Footer() {
    const [newsletterEmail, setNewsletterEmail] = useState('');
    const [isSubscribed, setIsSubscribed] = useState(false);

    const handleNewsletterSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newsletterEmail.trim()) return;
        setIsSubscribed(true);
        setTimeout(() => {
            setNewsletterEmail('');
        }, 4000);
    };

    return (
        <footer className="bg-black text-white border-t border-gray-800 w-full">
            {/* Top Newsletter Bar (Editorial Magazine style) */}
            <div className="border-b border-gray-800 py-12 px-6">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="max-w-xl">
                        <span className="text-xs font-black uppercase tracking-widest text-[#FACC15] block mb-2">
                            Cảm Hứng Bất Tận · Khám Phá Việt Nam
                        </span>
                        <h3 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-white leading-tight">
                            Nhận cẩm nang du lịch độc quyền từ Natura Travel
                        </h3>
                        <p className="mt-2 text-xs sm:text-sm text-gray-400 font-medium">
                            Đăng ký nhận thông tin hành trình bí mật, ưu đãi vé máy bay nội địa và kinh nghiệm xê dịch từ các chuyên gia bản địa.
                        </p>
                    </div>

                    <div className="w-full md:w-auto max-w-md shrink-0">
                        {isSubscribed ? (
                            <div className="flex items-center gap-2 bg-green-900/60 border border-green-500 text-green-300 px-5 py-3 text-xs font-bold">
                                <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
                                <span>Đăng ký thành công! Cảm ơn bạn đã đồng hành cùng Natura Travel.</span>
                            </div>
                        ) : (
                            <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-2">
                                <input
                                    type="email"
                                    required
                                    placeholder="Nhập địa chỉ email của bạn..."
                                    value={newsletterEmail}
                                    onChange={(e) => setNewsletterEmail(e.target.value)}
                                    className="px-4 py-3 text-xs font-bold text-gray-900 bg-white border border-gray-300 focus:outline-none min-w-[260px]"
                                />
                                <button
                                    type="submit"
                                    className="bg-[#FACC15] text-black hover:bg-yellow-400 px-6 py-3 text-xs font-black uppercase tracking-widest transition-colors shrink-0"
                                >
                                    Đăng Ký
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </div>

            {/* Main Links Grid */}
            <div className="max-w-7xl mx-auto px-6 py-16">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
                    {/* Brand column */}
                    <div className="lg:col-span-2 space-y-4">
                        <Link href="/" className="flex items-center gap-2 text-2xl font-black tracking-tighter uppercase text-white">
                            <Compass className="w-6 h-6 text-[#FACC15]" />
                            <span>NATURA TRAVEL</span>
                        </Link>
                        <p className="text-xs text-gray-400 leading-relaxed max-w-sm font-medium">
                            Tự hào đồng hành cùng du khách khám phá trọn vẹn vẻ đẹp dải đất hình chữ S Việt Nam — từ đỉnh thiêng Fansipan hùng vĩ đến biển xanh ngọc bích Phú Quốc.
                        </p>

                        <div className="space-y-2 pt-2 text-xs text-gray-300 font-medium">
                            <p className="flex items-center gap-2">
                                <Phone className="w-4 h-4 text-[#FACC15] shrink-0" /> Hotline 24/7: <strong className="text-white">1900 8888</strong> (Miễn phí cước gọi)
                            </p>
                            <p className="flex items-center gap-2">
                                <Mail className="w-4 h-4 text-[#FACC15] shrink-0" /> Email hỗ trợ: <strong className="text-white">hotro@naturatravel.vn</strong>
                            </p>
                            <p className="flex items-center gap-2">
                                <Globe className="w-4 h-4 text-[#FACC15] shrink-0" /> Phạm vi phục vụ: <strong className="text-white">Trực tuyến 63 Tỉnh Thành Việt Nam</strong>
                            </p>
                        </div>

                        {/* Social Icons */}
                        <div className="flex items-center gap-3 pt-3">
                            <a
                                href="https://facebook.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-8 h-8 rounded-full bg-gray-900 flex items-center justify-center hover:bg-[#FACC15] hover:text-black transition-colors"
                                aria-label="Facebook"
                            >
                                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
                            </a>
                            <a
                                href="https://instagram.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-8 h-8 rounded-full bg-gray-900 flex items-center justify-center hover:bg-[#FACC15] hover:text-black transition-colors"
                                aria-label="Instagram"
                            >
                                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" /></svg>
                            </a>
                            <a
                                href="https://youtube.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-8 h-8 rounded-full bg-gray-900 flex items-center justify-center hover:bg-[#FACC15] hover:text-black transition-colors"
                                aria-label="Youtube"
                            >
                                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>
                            </a>
                        </div>
                    </div>

                    {/* Column 2: Top Vietnam Destinations */}
                    <div>
                        <h4 className="text-xs font-black uppercase tracking-widest text-[#FACC15] mb-4">
                            Điểm Đến Nổi Bật (Việt Nam)
                        </h4>
                        <ul className="space-y-2.5 text-xs text-gray-400 font-medium">
                            <li><Link href="/destinations" className="text-[#FACC15] hover:underline font-bold transition-colors">→ Xem tất cả điểm đến</Link></li>
                            <li><Link href="/tours?destination=Đà+Nẵng" className="hover:text-white transition-colors">Đà Nẵng & Phố Cổ Hội An</Link></li>
                            <li><Link href="/tours?destination=Phú+Quốc" className="hover:text-white transition-colors">Đảo Ngọc Phú Quốc</Link></li>
                            <li><Link href="/tours?destination=Hạ+Long" className="hover:text-white transition-colors">Kỳ Quan Vịnh Hạ Long</Link></li>
                            <li><Link href="/tours?destination=Sa+Pa" className="hover:text-white transition-colors">Sa Pa & Đỉnh Fansipan</Link></li>
                            <li><Link href="/tours?destination=Nha+Trang" className="hover:text-white transition-colors">Nha Trang & Vịnh Cam Ranh</Link></li>
                            <li><Link href="/tours?destination=Huế" className="hover:text-white transition-colors">Cố Đô Huế Sông Hương</Link></li>
                            <li><Link href="/tours?destination=Đà+Lạt" className="hover:text-white transition-colors">Cao Nguyên Đà Lạt</Link></li>
                            <li><Link href="/tours?destination=Hà+Giang" className="hover:text-white transition-colors">Cao Nguyên Đá Hà Giang</Link></li>
                        </ul>
                    </div>

                    {/* Column 3: Travel Services */}
                    <div>
                        <h4 className="text-xs font-black uppercase tracking-widest text-[#FACC15] mb-4">
                            Dịch Vụ Du Lịch
                        </h4>
                        <ul className="space-y-2.5 text-xs text-gray-400 font-medium">
                            <li><Link href="/tours" className="hover:text-white transition-colors">Tours Du Lịch 3 Miền</Link></li>
                            <li><Link href="/hotels" className="hover:text-white transition-colors">Khách Sạn & Resort Sinh Thái</Link></li>
                            <li><Link href="/flights" className="hover:text-white transition-colors font-bold text-gray-200">Vé Máy Bay Nội Địa Việt Nam</Link></li>
                            <li><Link href="/combos" className="hover:text-white transition-colors">Combo Tour + Phòng + Vé Bay</Link></li>
                            <li><Link href="/ai-planner" className="hover:text-white transition-colors text-[#FACC15] font-bold">✨ Trợ Lý AI Lập Lịch Trình</Link></li>
                            <li><Link href="/tours?tour_type=Khám+phá" className="hover:text-white transition-colors">Du Lịch Sinh Thái (Eco-Travel)</Link></li>
                            <li><Link href="/tours?tour_type=Nghỉ+dưỡng" className="hover:text-white transition-colors">Nghỉ Dưỡng Cao Cấp</Link></li>
                            <li><Link href="/handbook" className="hover:text-white transition-colors text-gray-200 font-bold">Cẩm Nang & Kinh Nghiệm</Link></li>
                        </ul>
                    </div>

                    {/* Column 4: Natura Travel & Anchor Links */}
                    <div>
                        <h4 className="text-xs font-black uppercase tracking-widest text-[#FACC15] mb-4">
                            Về Chúng Tôi
                        </h4>
                        <ul className="space-y-2.5 text-xs text-gray-400 font-medium">
                            <li><Link href="/about-us#our-story" className="hover:text-white transition-colors">Câu Chuyện Natura</Link></li>
                            <li><Link href="/about-us#core-values" className="hover:text-white transition-colors">Giá Trị Cốt Lõi</Link></li>
                            <li><Link href="/about-us#policy" className="hover:text-white transition-colors">Chính Sách & Bảo Hiểm</Link></li>
                            <li><Link href="/about-us#contact" className="hover:text-white transition-colors">Trung Tâm Hỗ Trợ 24/7</Link></li>
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="mt-16 pt-8 border-t border-gray-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-gray-500 font-medium">
                    <p>© {new Date().getFullYear()} Natura Travel Việt Nam. Tự hào tôn vinh và đồng hành khám phá dải đất hình chữ S.</p>
                    <div className="flex items-center gap-6">
                        <span className="flex items-center gap-1.5 text-gray-400">
                            <ShieldCheck className="w-4 h-4 text-[#FACC15]" />
                            Bảo mật thanh toán tiêu chuẩn PCI-DSS
                        </span>
                        <span className="flex items-center gap-1.5 text-gray-400">
                            <Globe className="w-4 h-4 text-[#FACC15]" />
                            Tiếng Việt (VN) · VND (₫)
                        </span>
                    </div>
                </div>
            </div>
        </footer>
    );
}

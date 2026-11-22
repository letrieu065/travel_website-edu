'use client';

import React, { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Search, ShoppingCart, User, LogOut, Info, ChevronDown, ShieldCheck, Menu, X } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { setProfile, clearProfile, type UserProfile } from '@/redux/userSlice';
import type { RootState } from '@/redux/store';
import Footer from './Footer';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3600';
const HIDDEN_HEADER_FOOTER_ROUTES = ['/login', '/register', '/forgot-password', '/verify-otp', '/admin'];

// (Đã thêm)
const UserHeader: React.FC = () => {
    const router = useRouter();
    const pathname = usePathname();
    const dispatch = useDispatch();
    const reduxUser = useSelector((state: RootState) => state.user.profile);

    const [localUser, setLocalUser] = useState<UserProfile | null>(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // (Đã thêm)
    const clearSessionAndRedirect = useCallback(
        (shouldRedirect: boolean) => {
            localStorage.removeItem('token');
            setLocalUser(null);
            dispatch(clearProfile());
            setIsDropdownOpen(false);
            if (shouldRedirect) {
                router.push('/login');
            }
        },
        [dispatch, router]
    );

    // (Đã thêm)
    const handleLogout = useCallback(() => {
        clearSessionAndRedirect(true);
    }, [clearSessionAndRedirect]);

    useEffect(() => {
        let isCancelled = false;

        // Tải profile người dùng chỉ một lần khi có token và Redux store chưa có dữ liệu
        const fetchUserProfile = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                if (!isCancelled) setLocalUser(null);
                return;
            }

            // Nếu profile đã có sẵn trong Redux store, không cần gửi request thừa
            if (reduxUser) {
                return;
            }

            try {
                const response = await fetch(`${API_URL}/api/v1/users/profile`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (response.ok) {
                    const data = await response.json();
                    const userProfile: UserProfile = data.user;
                    if (!isCancelled) {
                        setLocalUser(userProfile);
                        dispatch(setProfile(userProfile));
                    }
                } else if (response.status === 401) {
                    if (!isCancelled) clearSessionAndRedirect(false);
                }
            } catch (error) {
                console.error('Lỗi khi fetch profile:', error);
            }
        };

        fetchUserProfile();

        return () => {
            isCancelled = true;
        };
    }, [dispatch, clearSessionAndRedirect, reduxUser]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const isHiddenPage = HIDDEN_HEADER_FOOTER_ROUTES.some((route) => pathname?.startsWith(route));
    if (isHiddenPage) {
        return null;
    }

    const activeUser = reduxUser || localUser;
    const displayName = activeUser?.fullName || activeUser?.full_name || activeUser?.name || 'User';

    return (
        <header className="header-nav">
            <Link href="/" className="nav-logo">
                NATURA TRAVEL
            </Link>

            <nav className="nav-links">
                <Link href="/tours" className="nav-link-item">Destinations</Link>
                <Link href="/tours" className="nav-link-item">Tours</Link>
                <Link href="/hotels" className="nav-link-item">Hotels</Link>
                <Link href="/about-us" className="nav-link-item">About Us</Link>
            </nav>

            <div className="auth-actions">
                <button
                    type="button"
                    onClick={() => router.push('/tours')}
                    className="btn-icon-only"
                    aria-label="Search tours"
                >
                    <Search className="w-5 h-5" />
                </button>
                <button
                    type="button"
                    onClick={() => router.push(activeUser ? '/detail' : '/login')}
                    className="btn-icon-only"
                    aria-label="Booking cart"
                >
                    <ShoppingCart className="w-5 h-5" />
                    <span className="hidden sm:inline">Cart</span>
                </button>

                {activeUser ? (
                    <div className="relative ml-2" ref={dropdownRef}>
                        <button
                            type="button"
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide hover:text-gray-500 transition-colors"
                        >
                            <User className="w-5 h-5" />
                            <span className="hidden sm:inline">{displayName}</span>
                            <ChevronDown className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {isDropdownOpen && (
                            <div className="absolute right-0 mt-6 w-48 bg-white border border-gray-100 shadow-xl rounded-md py-2 z-50 flex flex-col dropdown-anim">
                                {activeUser?.role === 'admin' && (
                                    <>
                                        <button
                                            type="button"
                                            onClick={() => { setIsDropdownOpen(false); router.push('/admin'); }}
                                            className="flex items-center gap-3 px-4 py-3 text-xs font-bold uppercase tracking-wider text-amber-600 hover:bg-amber-50 hover:text-amber-800 transition-colors text-left"
                                        >
                                            <ShieldCheck className="w-4 h-4" /> Admin Portal
                                        </button>
                                        <div className="border-t border-gray-100 my-1"></div>
                                    </>
                                )}
                                <button
                                    type="button"
                                    onClick={() => { setIsDropdownOpen(false); router.push('/detail'); }}
                                    className="flex items-center gap-3 px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-700 hover:bg-gray-50 hover:text-black transition-colors text-left"
                                >
                                    <Info className="w-4 h-4" /> Detail
                                </button>
                                <div className="border-t border-gray-100 my-1"></div>
                                <button
                                    type="button"
                                    onClick={handleLogout}
                                    className="flex items-center gap-3 px-4 py-3 text-xs font-bold uppercase tracking-wider text-red-500 hover:bg-red-50 hover:text-red-700 transition-colors text-left"
                                >
                                    <LogOut className="w-4 h-4" /> Logout
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <button
                        type="button"
                        onClick={() => router.push('/login')}
                        className="btn-icon-only ml-2 font-bold uppercase text-sm tracking-wide"
                    >
                        Sign In
                    </button>
                )}

                {/* Mobile Menu Hamburger Button */}
                <button
                    type="button"
                    onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
                    className="md:hidden ml-2 p-1.5 text-gray-700 hover:text-black transition-colors"
                    aria-label="Toggle mobile menu"
                >
                    {isMobileNavOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
            </div>

            {/* Mobile Navigation Drawer */}
            {isMobileNavOpen && (
                <div className="fixed inset-0 z-50 md:hidden bg-black/60 backdrop-blur-sm flex justify-end">
                    <div className="w-72 h-full bg-white p-6 shadow-2xl flex flex-col justify-between overflow-y-auto">
                        <div>
                            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                                <span className="font-black text-sm uppercase tracking-wider text-black">NATURA TRAVEL</span>
                                <button
                                    type="button"
                                    onClick={() => setIsMobileNavOpen(false)}
                                    className="p-1 text-gray-500 hover:text-black"
                                    aria-label="Close menu"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <nav className="flex flex-col gap-2 py-6">
                                <Link
                                    href="/"
                                    onClick={() => setIsMobileNavOpen(false)}
                                    className="text-xs font-black uppercase tracking-wider text-gray-800 hover:text-black py-2.5 border-b border-gray-50"
                                >
                                    Trang chủ
                                </Link>
                                <Link
                                    href="/tours"
                                    onClick={() => setIsMobileNavOpen(false)}
                                    className="text-xs font-black uppercase tracking-wider text-gray-800 hover:text-black py-2.5 border-b border-gray-50"
                                >
                                    Điểm Đến & Tours
                                </Link>
                                <Link
                                    href="/hotels"
                                    onClick={() => setIsMobileNavOpen(false)}
                                    className="text-xs font-black uppercase tracking-wider text-gray-800 hover:text-black py-2.5 border-b border-gray-50"
                                >
                                    Khách Sạn & Resort
                                </Link>
                                <Link
                                    href="/flights"
                                    onClick={() => setIsMobileNavOpen(false)}
                                    className="text-xs font-black uppercase tracking-wider text-gray-800 hover:text-black py-2.5 border-b border-gray-50"
                                >
                                    Vé Máy Bay
                                </Link>
                                <Link
                                    href="/about-us"
                                    onClick={() => setIsMobileNavOpen(false)}
                                    className="text-xs font-black uppercase tracking-wider text-gray-800 hover:text-black py-2.5 border-b border-gray-50"
                                >
                                    Về Chúng Tôi
                                </Link>
                            </nav>
                        </div>

                        <div className="pt-4 border-t border-gray-100">
                            {activeUser ? (
                                <div className="space-y-2">
                                    <div className="text-xs font-semibold text-gray-500 truncate mb-2">
                                        {displayName}
                                    </div>
                                    {activeUser.role === 'admin' && (
                                        <Link
                                            href="/admin"
                                            onClick={() => setIsMobileNavOpen(false)}
                                            className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-amber-600 hover:text-amber-800 py-2"
                                        >
                                            <ShieldCheck className="w-4 h-4" /> Admin Portal
                                        </Link>
                                    )}
                                    <Link
                                        href="/detail"
                                        onClick={() => setIsMobileNavOpen(false)}
                                        className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-gray-700 hover:text-black py-2"
                                    >
                                        <User className="w-4 h-4" /> Thông tin cá nhân
                                    </Link>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsMobileNavOpen(false);
                                            handleLogout();
                                        }}
                                        className="flex items-center gap-2 w-full text-left text-xs font-black uppercase tracking-wider text-red-600 hover:text-red-800 py-2"
                                    >
                                        <LogOut className="w-4 h-4" /> Đăng xuất
                                    </button>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-2">
                                    <Link
                                        href="/login"
                                        onClick={() => setIsMobileNavOpen(false)}
                                        className="w-full text-center bg-black text-[#FACC15] py-2.5 text-xs font-black uppercase tracking-wider hover:bg-gray-800"
                                    >
                                        Đăng nhập
                                    </Link>
                                    <Link
                                        href="/register"
                                        onClick={() => setIsMobileNavOpen(false)}
                                        className="w-full text-center border border-gray-200 py-2.5 text-xs font-black uppercase tracking-wider text-gray-700 hover:border-black"
                                    >
                                        Đăng ký
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
};

// (Đã thêm)
const UserFooter: React.FC = () => {
    const pathname = usePathname();
    const isHiddenPage = HIDDEN_HEADER_FOOTER_ROUTES.some((route) => pathname?.startsWith(route));
    if (isHiddenPage) return null;
    return <Footer />;
};

export const UserLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <div className="layout-container">
            <Suspense fallback={null}>
                <UserHeader />
            </Suspense>
            <main className="content-main">
                {children}
            </main>
            <Suspense fallback={null}>
                <UserFooter />
            </Suspense>
        </div>
    );
};

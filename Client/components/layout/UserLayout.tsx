'use client';

import React, { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Search, ShoppingCart, User, LogOut, Info, ChevronDown, ShieldCheck } from 'lucide-react';
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

        // (Đã thêm)
        const fetchUserProfile = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                if (!isCancelled) setLocalUser(null);
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
    }, [dispatch, pathname, clearSessionAndRedirect]);

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
                <Link href="/flights" className="nav-link-item">Destinations</Link>
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
            </div>
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

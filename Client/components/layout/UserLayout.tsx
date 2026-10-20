'use client'; // BẮT BUỘC: Vì file này dùng state, effect, localStorage và Redux

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link'; // Đổi từ react-router-dom
import { useRouter } from 'next/navigation'; // Thay thế useNavigate
import { Search, ShoppingCart, User, LogOut, Info, ChevronDown } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { setProfile, clearProfile } from '@/redux/userSlice'; 

// Cập nhật Type để nhận children thay cho Outlet
export const UserLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const router = useRouter(); // Đổi từ navigate
    const dispatch = useDispatch();

    const [localUser, setLocalUser] = useState<any>(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchUserProfile = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const response = await fetch('http://localhost:3600/api/users/profile', {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}` 
                        }
                    });

                    if (response.ok) {
                        const data = await response.json();
                        const userProfile = data.user;
                        setLocalUser(userProfile);
                        dispatch(setProfile(userProfile));
                    } else {
                        handleLogout();
                    }
                } catch (error) {
                    console.error('Lỗi khi fetch profile:', error);
                }
            }
        };
        fetchUserProfile();
    }, [dispatch]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token');
        setLocalUser(null);
        dispatch(clearProfile()); 
        setIsDropdownOpen(false);
        router.push('/login'); // Cập nhật cú pháp chuyển trang
    };

    const displayName = localUser?.fullName || localUser?.name || 'User';

    return (
        <div className="layout-container">
            <header className="header-nav">
                {/* Đổi thuộc tính "to" thành "href" */}
                <Link href="/" className="nav-logo">
                    NATURA TRAVEL
                </Link>

                <nav className="nav-links">
                    <Link href="/flights" className="nav-link-item">Destinations</Link>
                    <Link href="/tours" className="nav-link-item">Tours</Link>
                    <Link href="/hotels" className="nav-link-item">Hotels</Link>
                    <Link href="/about" className="nav-link-item">About Us</Link>
                </nav>

                <div className="auth-actions">
                    <button className="btn-icon-only">
                        <Search className="w-5 h-5" />
                    </button>
                    <button className="btn-icon-only">
                        <ShoppingCart className="w-5 h-5" />
                        <span className="hidden sm:inline">Cart</span>
                    </button>

                    {localUser ? (
                        <div className="relative ml-2" ref={dropdownRef}>
                            <button
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide hover:text-gray-500 transition-colors"
                            >
                                <User className="w-5 h-5" />
                                <span className="hidden sm:inline">{displayName}</span>
                                <ChevronDown className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {isDropdownOpen && (
                                <div className="absolute right-0 mt-6 w-48 bg-white border border-gray-100 shadow-xl rounded-md py-2 z-50 flex flex-col dropdown-anim">
                                    <button
                                        onClick={() => { setIsDropdownOpen(false); router.push('/detail'); }}
                                        className="flex items-center gap-3 px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-700 hover:bg-gray-50 hover:text-black transition-colors text-left"
                                    >
                                        <Info className="w-4 h-4" /> Detail
                                    </button>
                                    <div className="border-t border-gray-100 my-1"></div>
                                    <button
                                        onClick={handleLogout}
                                        className="flex items-center gap-3 px-4 py-3 text-xs font-bold uppercase tracking-wider text-red-500 hover:bg-red-50 hover:text-red-700 transition-colors text-left"
                                    >
                                        <LogOut className="w-4 h-4" /> Logout
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <button onClick={() => router.push('/login')} className="btn-icon-only ml-2 font-bold uppercase text-sm tracking-wide">
                            Sign In
                        </button>
                    )}
                </div>
            </header>

            <main className="content-main">
                {/* children thay thế cho <Outlet /> */}
                {children} 
            </main>
        </div>
    );
};